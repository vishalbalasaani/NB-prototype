'use client';

import React from 'react';
import { StudentResult } from '@/types';
import { DataService } from '@/lib/data-service';
import { X, Printer, Download } from 'lucide-react';

interface SchoolMemoModalProps {
  result: StudentResult;
  onClose: () => void;
}

export function SchoolMemoModal({ result, onClose }: SchoolMemoModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/45 backdrop-blur-2xs animate-in fade-in duration-100 overflow-y-auto">
      <div className="bg-white rounded-lg border border-[#E5E2DC] shadow-lg w-full max-w-2xl overflow-hidden my-auto text-[#20201F]">
        
        {/* Modal Action Bar (Hidden during print) */}
        <div className="px-5 py-3 border-b border-[#E5E2DC] flex items-center justify-between bg-[#FAF9F7] no-print">
          <span className="text-xs font-semibold text-[#6F6D68]">
            Official Student Progress Report &bull; {result.student_name}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#20201F] bg-white border border-[#D5D2CB] hover:bg-[#FAF9F7] rounded-md transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#6F6D68]" />
              <span>Print</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#5B4B8A] hover:bg-[#433665] rounded-md transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#6F6D68] hover:text-[#20201F] rounded-md cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official School Marks Memo (Authentic White A4 Document) */}
        <div className="p-6 sm:p-10 bg-white" id="printable-memo">
          <div className="border border-[#20201F]/80 p-6 sm:p-8 rounded-none print:border-none print:p-0">
            
            {/* School Header */}
            <div className="text-center pb-5 border-b border-[#20201F] space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-[#20201F]">
                {DataService.getCurrentSchool()?.name || 'NodeBricks Academy'}
              </h1>
              <p className="text-xs text-[#6F6D68]">
                {DataService.getCurrentSchool()?.address || 'Main Campus'} &bull; Academic Year {result.academic_year || '2026–27'}
              </p>
              <p className="text-xs font-semibold text-[#20201F] pt-2 uppercase tracking-wider">
                STUDENT PROGRESS REPORT &bull; ACADEMIC YEAR {result.academic_year}
              </p>
              <p className="text-xs font-medium text-[#6F6D68]">
                {result.examination_name}
              </p>
            </div>

            {/* Student Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-xs border-b border-[#E5E2DC]">
              <div>
                <span className="text-[#6F6D68] block">Student:</span>
                <span className="font-semibold text-[#20201F]">{result.student_name}</span>
              </div>
              <div>
                <span className="text-[#6F6D68] block">Admission No:</span>
                <span className="font-semibold text-[#20201F]">{result.admission_number || result.roll_number}</span>
              </div>
              <div>
                <span className="text-[#6F6D68] block">Class:</span>
                <span className="font-semibold text-[#20201F]">
                  {result.class_name === 'Class 8' ? '8-A' : result.class_name}
                </span>
              </div>
              <div>
                <span className="text-[#6F6D68] block">Roll No:</span>
                <span className="font-semibold text-[#20201F]">{result.roll_number}</span>
              </div>
            </div>

            {/* Subject Marks Table */}
            <div className="py-4">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#20201F] text-[#20201F]">
                    <th className="py-2 text-left font-semibold">Subject</th>
                    <th className="py-2 text-right font-semibold w-24">Marks</th>
                    <th className="py-2 text-right font-semibold w-24">Maximum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DC]">
                  {result.subject_marks.map((sm) => (
                    <tr key={sm.id}>
                      <td className="py-2 text-[#20201F]">{sm.subject_name}</td>
                      <td className="py-2 text-right font-medium text-[#20201F]">{sm.marks_obtained}</td>
                      <td className="py-2 text-right text-[#6F6D68]">{sm.maximum_marks}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#20201F] font-semibold text-xs sm:text-sm">
                    <td className="py-2.5">Total Marks</td>
                    <td className="py-2.5 text-right">{result.total_marks}</td>
                    <td className="py-2.5 text-right">{result.maximum_marks}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Summary Performance */}
            <div className="border-t border-[#E5E2DC] pt-3 pb-6 grid grid-cols-3 gap-2 text-xs text-center">
              <div className="border-r border-[#E5E2DC]">
                <span className="text-[#6F6D68] block">Percentage</span>
                <span className="font-semibold text-sm text-[#20201F]">{result.percentage}%</span>
              </div>
              <div className="border-r border-[#E5E2DC]">
                <span className="text-[#6F6D68] block">Grade</span>
                <span className="font-semibold text-sm text-[#20201F]">{result.grade}</span>
              </div>
              <div>
                <span className="text-[#6F6D68] block">Result</span>
                <span className="font-semibold text-sm text-[#557A61] uppercase">
                  {result.result_status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Signatures Area */}
            <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-[#20201F] pt-1">
                <p className="font-medium text-[#20201F]">Class Teacher</p>
                <p className="text-[11px] text-[#6F6D68]">Signature</p>
              </div>
              <div className="border-t border-[#20201F] pt-1">
                <p className="font-medium text-[#20201F]">Principal</p>
                <p className="text-[11px] text-[#6F6D68]">{DataService.getCurrentSchool()?.name || 'NodeBricks Academy'}</p>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer Note */}
        <div className="px-5 py-2.5 bg-[#FAF9F7] border-t border-[#E5E2DC] flex justify-end no-print">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-[#6F6D68] hover:text-[#20201F] cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
