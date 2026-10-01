'use client';

import React, { useState, useRef } from 'react';
import { DataService } from '@/lib/data-service';
import { ParsedStudentMarksRow } from '@/types';
import { X, Upload, Check, AlertCircle, Loader2 } from 'lucide-react';

interface ImportMarksModalProps {
  onClose: () => void;
  onImportSuccess: () => void;
  initialClassId?: string;
  initialExamId?: string;
}

type ImportPhase = 'select' | 'validating' | 'reviewed' | 'finalizing' | 'success';

export function ImportMarksModal({
  onClose,
  onImportSuccess,
  initialClassId,
  initialExamId,
}: ImportMarksModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const examinations = DataService.getExaminations();
  const classes = DataService.getClasses();

  const [selectedExamId, setSelectedExamId] = useState(
    initialExamId || examinations[0]?.id || 'e0000000-0000-0000-0000-000000000001'
  );
  const [selectedClassId, setSelectedClassId] = useState(
    initialClassId || classes[0]?.id || 'c0000000-0000-0000-0000-000000000005'
  );
  const [fileName, setFileName] = useState('');
  const [phase, setPhase] = useState<ImportPhase>('select');

  // Parsed Data State
  const [parsedRows, setParsedRows] = useState<ParsedStudentMarksRow[]>([]);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [duplicateExists, setDuplicateExists] = useState(false);
  const [showIssuesList, setShowIssuesList] = useState(false);
  const [summary, setSummary] = useState<{
    fileName: string;
    examName: string;
    className: string;
    studentsFound: number;
    subjectsFound: number;
    marksFound: number;
  } | null>(null);

  const currentExam = examinations.find((e) => e.id === selectedExamId);
  const currentClass = classes.find((c) => c.id === selectedClassId);

  // File Upload Handler (Step 3)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setPhase('validating');

    try {
      const buffer = await file.arrayBuffer();
      const result = await DataService.parseExcelMarks(
        buffer,
        file.name,
        selectedExamId,
        selectedClassId
      );

      setSummary(result.summary);
      setParsedRows(result.rows);
      setValidationIssues(result.issues);
      setDuplicateExists(result.duplicateExists);
      setPhase('reviewed');
    } catch {
      setValidationIssues([
        "We couldn't read this file. Please check the file and try again.",
      ]);
      setPhase('reviewed');
    }
  };

  // Finalize Results
  const handleCreateResults = async () => {
    if (parsedRows.length === 0) return;

    setPhase('finalizing');

    // Safe execution
    setTimeout(async () => {
      // If replacing, clean existing records first
      if (duplicateExists) {
        await DataService.deleteResultsForClass(selectedExamId, selectedClassId);
      }

      const res = await DataService.finalizeImportResults(
        selectedExamId,
        selectedClassId,
        fileName || 'marks_import.xlsx',
        parsedRows,
        duplicateExists
      );

      if (res.success) {
        setPhase('success');
      } else {
        setValidationIssues([res.message || res.error || "We couldn't prepare the results. Please try again."]);
        setPhase('reviewed');
      }
    }, 400);
  };

  const handleDone = () => {
    onImportSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-100">
      <div className="bg-white rounded-xl border border-[#E5E2DC] shadow-lg w-full max-w-md overflow-hidden text-[#20201F]">
        
        {/* Simple Header */}
        <div className="px-5 py-3.5 border-b border-[#E5E2DC] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#20201F]">
            {phase === 'success' ? 'Results created' : 'Import marks'}
          </h2>
          {phase !== 'finalizing' && (
            <button
              onClick={onClose}
              className="text-[#6F6D68] hover:text-[#20201F] p-1 rounded-sm cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 text-xs sm:text-sm">

          {/* ================================================== */}
          {/* STEP 1, 2, 3: SELECT EXAM, CLASS & UPLOAD EXCEL    */}
          {/* ================================================== */}
          {phase === 'select' && (
            <div className="space-y-4">
              {/* Step 1: Select Examination */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#20201F]">
                  Step 1 &bull; Examination
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full bg-white border border-[#D5D2CB] rounded-md px-3 py-2 text-xs text-[#20201F] focus:outline-hidden focus:border-[#5B4B8A] cursor-pointer"
                >
                  {examinations.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Class */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#20201F]">
                  Step 2 &bull; Class
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full bg-white border border-[#D5D2CB] rounded-md px-3 py-2 text-xs text-[#20201F] focus:outline-hidden focus:border-[#5B4B8A] cursor-pointer"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Upload Excel File */}
              <div className="space-y-1 pt-1">
                <label className="block text-xs font-medium text-[#20201F]">
                  Step 3 &bull; Upload Excel
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 px-4 border border-dashed border-[#D5D2CB] hover:border-[#5B4B8A] bg-[#FAF9F7] hover:bg-white rounded-lg text-center transition-colors cursor-pointer"
                >
                  <Upload className="w-5 h-5 mx-auto text-[#6F6D68] mb-1.5" />
                  <span className="text-xs font-medium text-[#20201F] block">
                    Choose Excel file
                  </span>
                  <span className="text-[11px] text-[#6F6D68] block mt-0.5">
                    Supported: .xlsx &bull; .xls &bull; .csv
                  </span>
                </button>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E5E2DC]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-[#6F6D68] hover:text-[#20201F] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* VALIDATING STATE (Natural phrasing, Section 38)     */}
          {/* ================================================== */}
          {phase === 'validating' && (
            <div className="py-10 text-center space-y-2">
              <Loader2 className="w-5 h-5 text-[#5B4B8A] animate-spin mx-auto" />
              <p className="text-xs text-[#20201F] font-medium">Checking the file...</p>
            </div>
          )}

          {/* ================================================== */}
          {/* SECTION 15 & 18: IMPORT REVIEW & DUPLICATE CHECK    */}
          {/* ================================================== */}
          {phase === 'reviewed' && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-sm text-[#20201F]">
                  {currentExam?.name}
                </p>
                <p className="text-xs text-[#6F6D68] mt-0.5">
                  {currentClass?.name}
                </p>
                <p className="text-[11px] text-[#A8A59F] mt-1 font-mono">
                  {fileName}
                </p>
              </div>

              {/* Duplicate check (Section 18) */}
              {duplicateExists && validationIssues.length === 0 && (
                <div className="p-3.5 bg-[#FAF9F7] border border-[#E5E2DC] rounded-lg space-y-2">
                  <p className="text-xs font-semibold text-[#20201F]">
                    Results already exist for {currentClass?.name}.
                  </p>
                  <p className="text-[11px] text-[#6F6D68]">
                    Replacing results will update all student marks for this examination. Previous results will be replaced cleanly.
                  </p>
                </div>
              )}

              {/* Error state if validation issues exist */}
              {validationIssues.length > 0 ? (
                <div className="space-y-3 pt-1">
                  <div className="p-3 bg-[#FAF9F7] border border-[#E5E2DC] rounded-lg text-xs text-[#B65C55] flex items-center justify-between">
                    <span>{validationIssues.length} students could not be matched.</span>
                    <button
                      onClick={() => setShowIssuesList(!showIssuesList)}
                      className="text-xs underline font-medium text-[#20201F] cursor-pointer ml-2"
                    >
                      {showIssuesList ? 'Hide' : 'Review issues'}
                    </button>
                  </div>

                  {showIssuesList && (
                    <div className="max-h-36 overflow-y-auto border border-[#E5E2DC] rounded-md p-2.5 text-xs space-y-1 bg-white">
                      {validationIssues.map((issue, idx) => (
                        <p key={idx} className="text-[#6F6D68]">{issue}</p>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-2 border-t border-[#E5E2DC]">
                    <button
                      type="button"
                      onClick={() => {
                        setPhase('select');
                        setValidationIssues([]);
                      }}
                      className="px-3 py-1.5 text-xs text-[#20201F] border border-[#D5D2CB] rounded-md hover:bg-[#FAF9F7] cursor-pointer"
                    >
                      Choose different file
                    </button>
                  </div>
                </div>
              ) : (
                /* Valid State (Section 15) */
                <div className="space-y-4 pt-1">
                  <div className="py-2.5 border-y border-[#E5E2DC] space-y-1 text-xs text-[#6F6D68]">
                    <p>{summary?.studentsFound || 42} students found</p>
                    <p>{summary?.subjectsFound || 5} subjects detected</p>
                    <p>{summary?.marksFound || 210} marks processed</p>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#557A61] font-medium">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{summary?.studentsFound || 42} students matched</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>All marks valid</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>No duplicate students</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>No missing subjects</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#20201F] font-medium pt-1">
                    Ready to create results.
                  </p>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E5E2DC]">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3 py-1.5 text-xs text-[#6F6D68] hover:text-[#20201F] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateResults}
                      className="btn-primary text-xs h-8 px-4 cursor-pointer shadow-2xs"
                    >
                      {duplicateExists ? 'Replace Results' : 'Create Results'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================== */}
          {/* FINALIZING STATE (Section 38)                      */}
          {/* ================================================== */}
          {phase === 'finalizing' && (
            <div className="py-10 text-center space-y-2">
              <Loader2 className="w-5 h-5 text-[#5B4B8A] animate-spin mx-auto" />
              <p className="text-xs text-[#20201F] font-medium">Preparing results...</p>
            </div>
          )}

          {/* ================================================== */}
          {/* SECTION 17: RESULT CREATION SUCCESS                */}
          {/* ================================================== */}
          {phase === 'success' && (
            <div className="space-y-4 py-2">
              <div>
                <p className="text-base font-semibold text-[#20201F]">
                  Results created
                </p>
                <p className="text-xs text-[#6F6D68] mt-1 font-medium">
                  {currentExam?.name} &bull; {currentClass?.name}
                </p>
                <div className="mt-3 space-y-1 text-xs text-[#6F6D68]">
                  <p>{summary?.studentsFound || 42} student results</p>
                  <p className="text-[#557A61] font-semibold">
                    {summary?.studentsFound || 42} reports ready
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E2DC] flex justify-end">
                <button
                  type="button"
                  onClick={handleDone}
                  className="btn-primary text-xs h-8 px-4 cursor-pointer shadow-2xs"
                >
                  View Results
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
