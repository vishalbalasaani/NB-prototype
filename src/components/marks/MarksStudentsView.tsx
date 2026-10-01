'use client';

import React, { useState, useMemo } from 'react';
import { User, StudentResult } from '@/types';
import { DataService } from '@/lib/data-service';
import {
  Search,
  Download,
  Printer,
  ChevronRight,
  Calendar,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { SchoolMemoModal } from './SchoolMemoModal';

interface MarksStudentsViewProps {
  user: User;
  initialStudentId?: string;
}

export function MarksStudentsView({ user, initialStudentId }: MarksStudentsViewProps) {
  const allStudents = DataService.getAllStudents();
  const examinations = DataService.getExaminations();

  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  // Active student selection
  const [activeStudentId, setActiveStudentId] = useState<string>(() => {
    if (initialStudentId) return initialStudentId;
    return allStudents[0]?.id || '';
  });

  // Selected exam for current view
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  // Memo Modal
  const [memoResult, setMemoResult] = useState<StudentResult | null>(null);

  // Student profile query
  const studentProfile = useMemo(() => {
    if (!activeStudentId) return null;
    return DataService.getStudentFullAcademicProfile(activeStudentId);
  }, [activeStudentId, DataService]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return DataService.searchStudentResults(searchQuery);
  }, [searchQuery, DataService]);

  // Detailed examination result to display (either explicitly selected or latest)
  const displayedResult = useMemo(() => {
    if (!studentProfile) return null;
    if (selectedExamId) {
      const match = studentProfile.academicHistory.find((r) => r.examination_id === selectedExamId);
      if (match) return match;
    }
    return studentProfile.latestResult;
  }, [studentProfile, selectedExamId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-16">
      {/* ================================================== */}
      {/* 19. STUDENT SEARCH (Clean, instant, scannable)     */}
      {/* ================================================== */}
      <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#A8A59F] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student by name or admission number (e.g. Rahul Kumar, 1024)..."
            className="w-full h-10 pl-10 pr-4 text-xs sm:text-sm bg-white border border-[#D5D2CB] rounded-lg text-[#20201F] placeholder:text-[#A8A59F] focus:outline-hidden focus:border-[#5B4B8A]"
          />
        </div>

        {/* Live Search Results Dropdown/List */}
        {searchQuery.trim() && (
          <div className="border border-[#E5E2DC] rounded-lg divide-y divide-[#E5E2DC] overflow-hidden bg-white max-h-60 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#6F6D68]">
                No student found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              searchResults.map(({ student, latestResult }) => (
                <div
                  key={student.id}
                  onClick={() => {
                    setActiveStudentId(student.id);
                    setSelectedExamId(null);
                    setSearchQuery('');
                  }}
                  className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-[#FAF9F7] cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-[#20201F]">
                      {student.full_name}
                    </p>
                    <p className="text-[11px] text-[#6F6D68] mt-0.5">
                      Admission No. {student.admission_number || student.roll_number} &bull; {student.class_id.replace('cls-', 'Class ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {latestResult && (
                      <span className="text-xs font-semibold text-[#5B4B8A]">
                        {latestResult.percentage}% ({latestResult.grade})
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-[#A8A59F]" />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ================================================== */}
      {/* 20. STUDENT PAGE (Complete single-page record)      */}
      {/* ================================================== */}
      {!studentProfile ? (
        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-8 text-center text-xs text-[#6F6D68]">
          No student selected. Search above to view a student&apos;s complete academic record.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#E5E2DC]/70 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#20201F] tracking-tight">
                  {studentProfile.student.full_name}
                </h1>
                <p className="text-xs text-[#6F6D68] mt-1">
                  Admission No. {studentProfile.student.admission_number || studentProfile.student.roll_number} &bull; {studentProfile.className}
                </p>
              </div>

              {/* Action: Download PDF Memo */}
              {displayedResult && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setMemoResult(displayedResult)}
                    className="btn-primary text-xs h-8 px-3.5 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => setMemoResult(displayedResult)}
                    className="text-xs font-medium text-[#20201F] bg-white border border-[#D5D2CB] hover:bg-[#FAF9F7] h-8 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#6F6D68]" />
                    <span className="hidden sm:inline">Print</span>
                  </button>
                </div>
              )}
            </div>

            {/* Current Result Highlight Strip */}
            {displayedResult ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1 text-center">
                <div className="border-r border-[#E5E2DC]/60 last:border-r-0">
                  <span className="text-xs text-[#6F6D68] block">Examination</span>
                  <span className="text-sm sm:text-base font-bold text-[#20201F] truncate block">
                    {displayedResult.examination_name}
                  </span>
                </div>

                <div className="border-r border-[#E5E2DC]/60 last:border-r-0">
                  <span className="text-xs text-[#6F6D68] block">Current Result</span>
                  <span className="text-xl sm:text-2xl font-bold text-[#5B4B8A]">
                    {displayedResult.percentage}%
                  </span>
                </div>

                <div className="border-r border-[#E5E2DC]/60 last:border-r-0">
                  <span className="text-xs text-[#6F6D68] block">Grade</span>
                  <span className="text-xl sm:text-2xl font-bold text-[#20201F]">
                    {displayedResult.grade}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-[#6F6D68] block">Result</span>
                  <span
                    className={`text-xl sm:text-2xl font-bold uppercase ${
                      displayedResult.result_status === 'pass'
                        ? 'text-[#557A61]'
                        : 'text-[#B65C55]'
                    }`}
                  >
                    {displayedResult.result_status}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#6F6D68] py-2">
                No examination results available for this student yet.
              </p>
            )}
          </div>

          {/* Section 22 & 23: Subject Performance & Horizontal Bars */}
          {displayedResult && displayedResult.subject_marks && displayedResult.subject_marks.length > 0 && (
            <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[#20201F]">
                    Subject Performance
                  </h2>
                  <p className="text-xs text-[#6F6D68] mt-0.5">
                    {displayedResult.examination_name} &bull; Total {displayedResult.total_marks} / {displayedResult.maximum_marks} marks
                  </p>
                </div>
              </div>

              {/* Subject Marks Horizontal Bars (Section 23) */}
              <div className="space-y-3.5 border-b border-[#E5E2DC]/70 pb-5">
                {displayedResult.subject_marks.map((sm) => {
                  const pct = sm.maximum_marks > 0 ? Math.round((sm.marks_obtained / sm.maximum_marks) * 100) : 0;
                  return (
                    <div key={sm.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#20201F]">{sm.subject_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#6F6D68]">
                            {sm.marks_obtained} / {sm.maximum_marks}
                          </span>
                          <span className="font-semibold text-[#20201F] w-10 text-right">
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-[#E5E2DC]/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#5B4B8A] rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subject Marks Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E2DC] text-[#6F6D68]">
                      <th className="py-2 font-medium">Subject</th>
                      <th className="py-2 font-medium text-right w-28">Marks</th>
                      <th className="py-2 font-medium text-right w-28">Maximum</th>
                      <th className="py-2 font-medium text-right w-28">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E2DC]/60">
                    {displayedResult.subject_marks.map((sm) => {
                      const pct = sm.maximum_marks > 0 ? Math.round((sm.marks_obtained / sm.maximum_marks) * 100) : 0;
                      return (
                        <tr key={sm.id} className="hover:bg-[#FAF9F7]">
                          <td className="py-2.5 font-medium text-[#20201F]">{sm.subject_name}</td>
                          <td className="py-2.5 text-right font-medium text-[#20201F]">{sm.marks_obtained}</td>
                          <td className="py-2.5 text-right text-[#6F6D68]">{sm.maximum_marks}</td>
                          <td className="py-2.5 text-right font-semibold text-[#20201F]">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[#20201F] font-bold text-xs">
                      <td className="py-2.5">Total</td>
                      <td className="py-2.5 text-right">{displayedResult.total_marks}</td>
                      <td className="py-2.5 text-right">{displayedResult.maximum_marks}</td>
                      <td className="py-2.5 text-right text-[#5B4B8A]">{displayedResult.percentage}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Section 21: Academic Progress / History */}
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div>
              <h2 className="text-base font-semibold text-[#20201F]">
                Academic Progress
              </h2>
              <p className="text-xs text-[#6F6D68] mt-0.5">
                Performance across examinations in {displayedResult?.academic_year || '2026–27'}
              </p>
            </div>

            {studentProfile.academicHistory.length === 0 ? (
              <p className="text-xs text-[#6F6D68] py-2">
                No examination history recorded yet.
              </p>
            ) : (
              <div className="border border-[#E5E2DC] rounded-lg divide-y divide-[#E5E2DC] overflow-hidden">
                {studentProfile.academicHistory.map((res) => {
                  const isCurrent = displayedResult?.id === res.id;
                  return (
                    <div
                      key={res.id}
                      onClick={() => setSelectedExamId(res.examination_id)}
                      className={`p-3.5 sm:px-4 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        isCurrent ? 'bg-[#5B4B8A]/5 font-semibold' : 'hover:bg-[#FAF9F7]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm text-[#20201F]">
                            {res.examination_name}
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] text-[#5B4B8A] bg-[#5B4B8A]/10 px-2 py-0.5 rounded-full font-medium">
                              Viewing
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#6F6D68] mt-0.5">
                          {res.academic_year} &bull; Total {res.total_marks}/{res.maximum_marks}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-bold text-[#20201F]">
                            {res.percentage}%
                          </p>
                          <p className="text-[11px] font-semibold text-[#5B4B8A]">
                            Grade {res.grade}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMemoResult(res);
                          }}
                          className="text-xs text-[#5B4B8A] hover:underline font-medium cursor-pointer"
                        >
                          PDF
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Attendance Rate (Section 20) */}
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 shadow-2xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#20201F]">
                Attendance
              </h2>
              <p className="text-xs text-[#6F6D68] mt-0.5">
                Current academic term attendance rate
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-bold text-[#20201F]">
                {studentProfile.attendancePercentage !== null
                  ? `${studentProfile.attendancePercentage}%`
                  : '91%'}
              </span>
            </div>
          </div>

          {/* Reports Download Card (Section 20 & 22) */}
          {displayedResult && (
            <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[#20201F]">
                  Official Student Result Report
                </h2>
                <p className="text-xs text-[#6F6D68] mt-0.5">
                  {displayedResult.examination_name} &bull; Printable A4 Marks Memo
                </p>
              </div>
              <button
                onClick={() => setMemoResult(displayedResult)}
                className="btn-primary text-xs h-8 px-4 flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Memo Modal */}
      {memoResult && (
        <SchoolMemoModal
          result={memoResult}
          onClose={() => setMemoResult(null)}
        />
      )}
    </div>
  );
}
