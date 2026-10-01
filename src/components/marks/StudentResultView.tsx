'use client';

import React, { useState } from 'react';
import { Student, StudentResult } from '@/types';
import { DataService } from '@/lib/data-service';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { SchoolMemoModal } from './SchoolMemoModal';

interface StudentResultViewProps {
  student: Student;
  onBack: () => void;
}

export function StudentResultView({ student, onBack }: StudentResultViewProps) {
  const history = DataService.getStudentAcademicHistory(student.id);
  const latestResult = history[0];
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState<StudentResult | null>(null);

  // Group academic history by year
  const groupedHistory: { [year: string]: StudentResult[] } = {};
  history.forEach((res) => {
    const yr = res.academic_year || '2026–27';
    if (!groupedHistory[yr]) {
      groupedHistory[yr] = [];
    }
    groupedHistory[yr].push(res);
  });

  const handleOpenMemo = (res: StudentResult) => {
    setSelectedMemo(res);
    setShowMemoModal(true);
  };

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6 text-[#20201F]">
      
      {/* 1. BACK NAVIGATION */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-[#6F6D68] hover:text-[#20201F] transition-colors py-1 px-1.5 -ml-1 rounded-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Marks</span>
        </button>
      </div>

      {/* 2. STUDENT HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-5 border-b border-[#E5E2DC]">
        <div>
          <h1 className="text-2xl font-semibold text-[#20201F] tracking-tight">
            {student.full_name}
          </h1>
          <p className="text-xs text-[#6F6D68] mt-1 font-medium">
            Admission No. {student.admission_number || '1024'} &bull; Class {student.class_id === 'cls-8' ? '8-A' : student.class_id.replace('cls-', '') + '-A'}
          </p>
        </div>

        {latestResult && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenMemo(latestResult)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#20201F] bg-white border border-[#D5D2CB] hover:bg-[#FAF9F7] rounded-md transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#6F6D68]" />
              <span>Print Record</span>
            </button>
            <button
              onClick={() => handleOpenMemo(latestResult)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#5B4B8A] hover:bg-[#433665] rounded-md transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. CURRENT EXAMINATION RECORD (Document format, no giant metric cards) */}
      {latestResult && (
        <div className="bg-white border border-[#E5E2DC] rounded-lg p-5 sm:p-6 space-y-5">
          <div className="border-b border-[#E5E2DC] pb-3">
            <h2 className="text-base font-semibold text-[#20201F]">
              {latestResult.examination_name}
            </h2>
            <p className="text-xs text-[#6F6D68] mt-0.5">
              {latestResult.academic_year}
            </p>
          </div>

          {/* Subject Marks Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#E5E2DC] text-[#6F6D68] text-xs">
                  <th className="py-2.5 font-medium">Subject</th>
                  <th className="py-2.5 font-medium text-right w-24">Marks</th>
                  <th className="py-2.5 font-medium text-right w-24">Maximum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DC]">
                {latestResult.subject_marks.map((sm) => (
                  <tr key={sm.id}>
                    <td className="py-2.5 font-medium text-[#20201F]">{sm.subject_name}</td>
                    <td className="py-2.5 text-right font-medium text-[#20201F]">{sm.marks_obtained}</td>
                    <td className="py-2.5 text-right text-[#6F6D68]">{sm.maximum_marks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Document Summary (Document-like, calm, no giant cards) */}
          <div className="pt-3 border-t-2 border-[#E5E2DC] space-y-2 text-xs sm:text-sm">
            <div className="flex items-center justify-between py-1">
              <span className="font-semibold text-[#20201F]">Total</span>
              <span className="font-semibold text-[#20201F]">
                {latestResult.total_marks} / {latestResult.maximum_marks}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-[#6F6D68]">Percentage</span>
              <span className="font-medium text-[#20201F]">{latestResult.percentage}%</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-[#6F6D68]">Grade</span>
              <span className="font-medium text-[#5B4B8A]">{latestResult.grade}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-[#6F6D68]">Result</span>
              <span className="font-semibold text-[#557A61] uppercase tracking-wide">
                {latestResult.result_status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. ACADEMIC HISTORY (Clean document list / vertical table) */}
      <div className="bg-white border border-[#E5E2DC] rounded-lg p-5 sm:p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#20201F]">
          Academic history
        </h2>

        {Object.keys(groupedHistory).length === 0 ? (
          <p className="text-xs text-[#6F6D68] py-2">No historical records available.</p>
        ) : (
          <div className="space-y-5">
            {Object.entries(groupedHistory).map(([year, results]) => (
              <div key={year} className="space-y-2">
                <p className="text-xs font-semibold text-[#6F6D68] uppercase tracking-wider">
                  {year}
                </p>

                <div className="border border-[#E5E2DC] rounded-md divide-y divide-[#E5E2DC] text-xs">
                  {results.map((res) => (
                    <div
                      key={res.id}
                      className="py-2.5 px-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-[#FAF9F7] transition-colors"
                    >
                      <span className="font-medium text-[#20201F]">
                        {res.examination_name}
                      </span>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-[#6F6D68]">{res.percentage}%</span>
                        <span className="font-semibold text-[#5B4B8A] w-7 text-right">{res.grade}</span>
                        <button
                          onClick={() => handleOpenMemo(res)}
                          className="text-[#5B4B8A] hover:underline cursor-pointer font-medium pl-2"
                        >
                          PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. PRINTABLE SCHOOL MEMO MODAL */}
      {showMemoModal && selectedMemo && (
        <SchoolMemoModal
          result={selectedMemo}
          onClose={() => {
            setShowMemoModal(false);
            setSelectedMemo(null);
          }}
        />
      )}

    </div>
  );
}
