'use client';

import React, { useState, useRef } from 'react';
import { User, ColumnMapping } from '@/types';
import { DataService } from '@/lib/data-service';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Download,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelImportViewProps {
  user: User;
  onImportComplete?: () => void;
  onBack?: () => void;
}

export function ExcelImportView({ user, onImportComplete, onBack }: ExcelImportViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileRows, setFileRows] = useState<Record<string, unknown>[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);

  // Column Mapping
  const [mapping, setMapping] = useState<ColumnMapping>({
    student_name: '',
    roll_number: '',
    class_name: '',
    section_name: '',
    parent_name: '',
    parent_phone: '',
  });

  // Validation & state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validRecords, setValidRecords] = useState<Record<string, string>[]>([]);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRawFile(file);
    setFileName(file.name);
    setImportSuccessCount(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

        if (data.length === 0) {
          setValidationErrors(['The uploaded spreadsheet is empty. Please provide data rows.']);
          return;
        }

        const cols = Object.keys(data[0] || {});
        setDetectedColumns(cols);
        setFileRows(data);

        // Auto-match common column header names with normalization
        const normKey = (s: string) => String(s || '').trim().toLowerCase().replace(/[\s\-_.]+/g, '');
        const findCol = (candidates: string[]) => {
          for (const c of cols) {
            const norm = normKey(c);
            if (candidates.some((cand) => normKey(cand) === norm)) return c;
          }
          for (const c of cols) {
            const norm = normKey(c);
            if (candidates.some((cand) => norm.includes(normKey(cand)))) return c;
          }
          return '';
        };

        const autoMap: ColumnMapping = {
          student_name: findCol(['student name', 'studentname', 'name', 'full name', 'student', 'candidate name']),
          roll_number: findCol(['roll number', 'roll no', 'rollno', 'roll', 'rno', 'rollnum']),
          class_name: findCol(['class', 'grade', 'standard', 'classname']),
          section_name: '',
          parent_name: findCol(['parent name', 'parentname', 'father name', 'mother name', 'guardian name', 'guardian', 'father']),
          parent_phone: findCol(['parent whatsapp', 'parentwhatsapp', 'whatsapp', 'phone', 'parent phone', 'mobile', 'contact']),
        };

        setMapping(autoMap);

        // Initial validation run
        const validation = DataService.validateImportRows(data, autoMap);
        setValidRecords(validation.validRows);
        setValidationErrors(validation.errors);
      } catch (err) {
        setValidationErrors(['Could not read file. Please ensure it is a valid .xlsx, .xls, or .csv.']);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    const newMap = { ...mapping, [field]: value };
    setMapping(newMap);

    if (fileRows.length > 0) {
      const validation = DataService.validateImportRows(fileRows, newMap);
      setValidRecords(validation.validRows);
      setValidationErrors(validation.errors);
    }
  };

  const handleReset = () => {
    setFileName(null);
    setFileRows([]);
    setDetectedColumns([]);
    setValidationErrors([]);
    setValidRecords([]);
    setImportSuccessCount(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = async () => {
    if (validRecords.length === 0) return;
    setIsProcessing(true);

    try {
      const res = await DataService.commitImportedStudents(validRecords, rawFile || undefined);
      if (res.success) {
        setImportSuccessCount(res.importedCount);
        // Refresh directory data and transition
        setTimeout(() => {
          if (onImportComplete) onImportComplete();
        }, 1500);
      } else {
        setValidationErrors([res.error || "We couldn't import these students. Please try again."]);
      }
    } catch {
      setValidationErrors(["We couldn't import these students. Please try again."]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download Sample Template for user convenience
  const handleDownloadTemplate = () => {
    const sample = [
      {
        'Student Name': 'Anand Varma',
        'Roll Number': '011',
        Class: 'Class 7',
        Section: 'A',
        'Parent Name': 'Kailash Varma',
        'Parent WhatsApp': '+91 98765 43299',
      },
      {
        'Student Name': 'Bhavna Sen',
        'Roll Number': '012',
        Class: 'Class 7',
        Section: 'A',
        'Parent Name': 'Pradip Sen',
        'Parent WhatsApp': '+91 98765 43298',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'NodeBricks_Students_Template.xlsx');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5E2DC] pb-4">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6F6D68] hover:text-[#20201F] transition-colors py-1 px-2 -ml-2 mb-1.5 rounded-md hover:bg-[#F4F1F8] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
          )}
          <h1 className="text-2xl font-semibold text-[#20201F] tracking-tight">
            Import Data
          </h1>
          <p className="text-sm text-[#6F6D68] mt-1">
            Upload the school&apos;s existing Excel or CSV student register
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="btn-secondary text-xs h-8 px-3 flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5 text-[#5B4B8A]" />
          <span>Download Sample Template</span>
        </button>
      </div>

      {/* Success Notification */}
      {importSuccessCount !== null && (
        <div className="p-5 bg-[#EFF5F1] border border-[#D5E5D9] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#557A61] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#20201F]">
                Students imported
              </p>
              <p className="text-xs text-[#6F6D68] mt-0.5">
                {importSuccessCount} students are now available.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onImportComplete && (
              <button
                onClick={onImportComplete}
                className="btn-primary text-xs h-8 px-4 bg-[#5B4B8A] hover:bg-[#433665] flex items-center gap-1.5 cursor-pointer"
              >
                <span>View Student Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={handleReset} className="btn-secondary text-xs h-8 px-3">
              Import Another
            </button>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      {!fileName && importSuccessCount === null && (
        <div className="bg-[#FFFFFF] border-2 border-dashed border-[#D3CFC7] hover:border-[#5B4B8A] rounded-xl p-8 sm:p-12 text-center transition-colors">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          <div className="w-12 h-12 rounded-full bg-[#F0EDF6] text-[#5B4B8A] flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="w-6 h-6" />
          </div>

          <h3 className="text-base font-semibold text-[#20201F]">
            Upload the school&apos;s existing Excel file
          </h3>
          <p className="text-xs text-[#6F6D68] mt-1 max-w-sm mx-auto">
            Supports Microsoft Excel (.xlsx, .xls) and CSV spreadsheets with student roll numbers, classes, and parent contacts.
          </p>

          <div className="mt-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary h-10 px-5 bg-[#5B4B8A]"
            >
              Choose Excel File
            </button>
          </div>
        </div>
      )}

      {/* Uploaded File Details & Mapping */}
      {fileName && importSuccessCount === null && (
        <div className="space-y-6">
          {/* File summary pill */}
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-4 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-[#5B4B8A]" />
              <div>
                <p className="text-sm font-semibold text-[#20201F]">{fileName}</p>
                <p className="text-xs text-[#6F6D68]">{fileRows.length} rows detected in file</p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="text-xs text-[#B65C55] hover:text-[#973e38] flex items-center gap-1 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>

          {/* Column Mapping Section */}
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 shadow-2xs space-y-4">
            <div>
              <h2 className="text-base font-semibold text-[#20201F]">Column Mapping</h2>
              <p className="text-xs text-[#6F6D68] mt-0.5">
                Match each Excel spreadsheet column to the corresponding NodeBricks student field
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {[
                { key: 'student_name' as const, label: 'Student Name' },
                { key: 'roll_number' as const, label: 'Roll Number' },
                { key: 'class_name' as const, label: 'Class' },
                { key: 'parent_name' as const, label: 'Parent Name' },
                { key: 'parent_phone' as const, label: 'Parent WhatsApp' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-[#6F6D68] uppercase tracking-wider mb-1.5">
                    {label}
                  </label>
                  <select
                    value={mapping[key]}
                    onChange={(e) => handleMappingChange(key, e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-[#FFFFFF] border border-[#E5E2DC] rounded-md text-[#20201F] focus:outline-none focus:border-[#5B4B8A]"
                  >
                    <option value="">— Select Column —</option>
                    {detectedColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Human-Readable Validation Errors Banner */}
          {validationErrors.length > 0 && (
            <div className="bg-[#FBF1F0] border border-[#F3D7D5] rounded-xl p-4 text-[#B65C55] text-xs space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  {validationErrors.length} validation notice
                  {validationErrors.length > 1 ? 's' : ''} found:
                </span>
              </div>
              <ul className="list-disc list-inside pl-1 space-y-0.5 mt-1">
                {validationErrors.slice(0, 4).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {validationErrors.length > 4 && (
                  <li>...and {validationErrors.length - 4} more notices.</li>
                )}
              </ul>
            </div>
          )}

          {/* Preview Table */}
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl shadow-2xs overflow-hidden">
            <div className="p-4 bg-[#FBFBFA] border-b border-[#E5E2DC] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#20201F]">Data Preview</h3>
                <p className="text-xs text-[#6F6D68]">Showing first rows ready for import</p>
              </div>
              <span className="text-xs text-[#557A61] font-medium bg-[#EFF5F1] px-2.5 py-0.5 rounded-full border border-[#D5E5D9]">
                {validRecords.length} Ready to import
              </span>
            </div>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F7F6F3] border-b border-[#E5E2DC] text-[#6F6D68] uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-medium">Roll No</th>
                    <th className="py-2.5 px-4 font-medium">Student Name</th>
                    <th className="py-2.5 px-4 font-medium">Class</th>
                    <th className="py-2.5 px-4 font-medium">Parent</th>
                    <th className="py-2.5 px-4 font-medium">WhatsApp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DC] text-[#20201F]">
                  {validRecords.slice(0, 15).map((row: any, i) => (
                    <tr key={i} className="hover:bg-[#FDFDFC]">
                      <td className="py-2.5 px-4 font-mono font-medium">{row.rollNumber || row.roll_number || '—'}</td>
                      <td className="py-2.5 px-4 font-medium text-[#20201F]">{row.studentName || row.full_name || '—'}</td>
                      <td className="py-2.5 px-4 text-[#5B4B8A] font-medium">
                        {row.className || row.class_name || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-[#6F6D68]">{row.parentName || row.parent_name || '—'}</td>
                      <td className="py-2.5 px-4 font-mono text-[#6F6D68]">{row.parentPhone || row.parent_phone || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-[#FFFFFF] border-t border-[#E5E2DC] flex items-center justify-between">
              <button onClick={handleReset} className="btn-secondary text-xs h-9 px-4">
                Cancel
              </button>

              <button
                onClick={handleConfirmImport}
                disabled={isProcessing || validRecords.length === 0}
                className="btn-primary h-9 px-5 bg-[#5B4B8A] hover:bg-[#433665] text-xs font-medium cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <span>Import {validRecords.length} Students</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
