'use client';

import React, { useState, useMemo } from 'react';
import { User, StudentResult } from '@/types';
import { DataService } from '@/lib/data-service';
import {
  ChevronRight,
  Send,
  Download,
  FileSpreadsheet,
  RotateCcw,
  Printer,
  ChevronDown,
} from 'lucide-react';

interface MarksResultsViewProps {
  user: User;
  onSelectStudent: (studentId: string) => void;
  onOpenImport: (classId?: string, examId?: string) => void;
  onOpenPublish: (examId?: string, classId?: string) => void;
  initialClassId?: string;
  initialExamId?: string;
}

export function MarksResultsView({
  user,
  onSelectStudent,
  onOpenImport,
  onOpenPublish,
  initialClassId,
  initialExamId,
}: MarksResultsViewProps) {
  const examinations = DataService.getExaminations();
  const classes = DataService.getClasses(); // Class 5 to Class 10

  const [selectedExamId, setSelectedExamId] = useState<string>(
    () => initialExamId || examinations[0]?.id || 'e0000000-0000-0000-0000-000000000001'
  );
  const [selectedClassId, setSelectedClassId] = useState<string | null>(
    () => initialClassId || null
  );
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Active examination
  const activeExam =
    examinations.find((e) => e.id === selectedExamId) ||
    examinations[0] || {
      id: 'e0000000-0000-0000-0000-000000000001',
      name: 'Half-Yearly Examination',
      academic_year: '2026-27',
    };

  // Examination results overview
  const examList = useMemo(() => {
    return DataService.getExaminationResultsList();
  }, [selectedExamId, DataService]);

  const currentExamData = examList.find((e) => e.examinationId === selectedExamId);

  // Class detailed results (when a class is selected)
  const classDetails = useMemo(() => {
    if (!selectedClassId) return null;
    return DataService.getClassDetailedResults(selectedExamId, selectedClassId);
  }, [selectedExamId, selectedClassId, DataService]);

  // Handle Export Class to CSV / Excel
  const handleExportClassExcel = () => {
    if (!classDetails) return;
    const rows = [
      ['Student', 'Admission Number', 'Class', 'Total Marks', 'Maximum Marks', 'Percentage', 'Grade', 'Result'],
      ...classDetails.students.map((s) => [
        s.student_name,
        s.admission_number || s.roll_number,
        classDetails.className,
        s.total_marks.toString(),
        s.maximum_marks.toString(),
        `${s.percentage}%`,
        s.grade,
        s.result_status.toUpperCase(),
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${classDetails.className}_${classDetails.examinationName.replace(/\s+/g, '_')}_Results.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  // Handle Print Class PDF
  const handlePrintClassPDF = () => {
    setShowExportMenu(false);
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-16">
      {/* ================================================== */}
      {/* 1. EXAMINATION SELECTOR & TOP CONTEXT BAR           */}
      {/* ================================================== */}
      <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#6F6D68] uppercase tracking-wider">
                Examination
              </span>
              <span className="text-xs text-[#6F6D68]">&bull;</span>
              <span className="text-xs text-[#6F6D68]">Academic Year 2026–27</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedExamId}
                onChange={(e) => {
                  setSelectedExamId(e.target.value);
                  setSelectedClassId(null);
                }}
                className="text-base sm:text-lg font-bold text-[#20201F] bg-transparent border-none pr-6 py-0 focus:outline-hidden cursor-pointer"
              >
                {examinations.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => onOpenImport(selectedClassId || undefined, selectedExamId)}
              className="text-xs font-medium text-[#20201F] bg-white border border-[#D5D2CB] hover:bg-[#FAF9F7] px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              + Import Excel
            </button>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* 2. CLASS DETAIL VIEW OR CLASS LISTING               */}
      {/* ================================================== */}
      {selectedClassId && classDetails ? (
        /* ================================================== */
        /* CLASS RESULT VIEW (Section 24 & 25)                */
        /* ================================================== */
        <div className="space-y-6">
          {/* Back to all classes breadcrumb button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedClassId(null)}
              className="text-xs font-medium text-[#5B4B8A] hover:underline flex items-center gap-1 cursor-pointer"
            >
              &larr; Back to all classes
            </button>

            {/* Action buttons: Publish, Export, Replace */}
            <div className="flex items-center gap-2 relative">
              <button
                onClick={() => onOpenPublish(selectedExamId, selectedClassId)}
                className="btn-primary text-xs h-8 px-3 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Results</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="text-xs font-medium text-[#20201F] bg-white border border-[#D5D2CB] hover:bg-[#FAF9F7] h-8 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#6F6D68]" />
                  <span>Export</span>
                  <ChevronDown className="w-3 h-3 text-[#6F6D68]" />
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-1 w-44 bg-white border border-[#E5E2DC] rounded-lg shadow-md z-30 py-1 text-xs">
                    <button
                      onClick={handlePrintClassPDF}
                      className="w-full text-left px-3 py-2 text-[#20201F] hover:bg-[#FAF9F7] flex items-center gap-2 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#6F6D68]" />
                      <span>Download PDF</span>
                    </button>
                    <button
                      onClick={handleExportClassExcel}
                      className="w-full text-left px-3 py-2 text-[#20201F] hover:bg-[#FAF9F7] flex items-center gap-2 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#6F6D68]" />
                      <span>Export Excel</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => onOpenImport(selectedClassId, selectedExamId)}
                title="Replace Results with a fresh Excel sheet"
                className="text-xs font-medium text-[#6F6D68] hover:text-[#20201F] bg-white border border-[#D5D2CB] hover:bg-[#FAF9F7] h-8 px-2.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Replace</span>
              </button>
            </div>
          </div>

          {/* Class Summary Strip */}
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E2DC]/70 pb-4">
              <div>
                <h2 className="text-xl font-bold text-[#20201F]">
                  {classDetails.className}
                </h2>
                <p className="text-xs text-[#6F6D68] mt-0.5">
                  {classDetails.examinationName} &bull; Academic Year {classDetails.academicYear}
                </p>
              </div>

              {classDetails.isPublished && (
                <span className="text-[11px] font-semibold text-[#557A61] bg-[#557A61]/10 px-2.5 py-1 rounded-full self-start sm:self-auto">
                  Published to parents
                </span>
              )}
            </div>

            {/* Compact 4-metric strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-center">
              <div className="border-r border-[#E5E2DC]/60 last:border-r-0">
                <span className="text-xs text-[#6F6D68] block">Students</span>
                <span className="text-xl sm:text-2xl font-bold text-[#20201F]">
                  {classDetails.studentCount}
                </span>
              </div>

              <div className="border-r border-[#E5E2DC]/60 last:border-r-0">
                <span className="text-xs text-[#6F6D68] block">Average</span>
                <span className="text-xl sm:text-2xl font-bold text-[#5B4B8A]">
                  {classDetails.averagePercentage}%
                </span>
              </div>

              <div className="border-r border-[#E5E2DC]/60 last:border-r-0">
                <span className="text-xs text-[#6F6D68] block">Pass</span>
                <span className="text-xl sm:text-2xl font-bold text-[#557A61]">
                  {classDetails.passedCount}
                </span>
              </div>

              <div>
                <span className="text-xs text-[#6F6D68] block">Needs Attention</span>
                <span
                  className={`text-xl sm:text-2xl font-bold ${
                    classDetails.needsAttentionCount > 0 ? 'text-[#B8874A]' : 'text-[#6F6D68]'
                  }`}
                >
                  {classDetails.needsAttentionCount}
                </span>
              </div>
            </div>
          </div>

          {/* Section 25: Class Subject Performance Horizontal Bars */}
          {classDetails.subjects.length > 0 && (
            <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#20201F]">
                  Subject Performance
                </h3>
                <p className="text-xs text-[#6F6D68] mt-0.5">
                  Average score across subjects in {classDetails.className}
                </p>
              </div>

              <div className="space-y-3 pt-1">
                {classDetails.subjects.map((subj) => (
                  <div key={subj.subjectName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#20201F]">{subj.subjectName}</span>
                      <span className="font-semibold text-[#20201F]">{subj.averagePercentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-[#E5E2DC]/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#5B4B8A] rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(subj.averagePercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 24: Student Results Table (Desktop) / Vertical Rows (Mobile) */}
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#20201F]">
                  Student Results
                </h3>
                <p className="text-xs text-[#6F6D68] mt-0.5">
                  Individual marks and grades for {classDetails.students.length} students
                </p>
              </div>
            </div>

            {classDetails.students.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6F6D68]">
                No student results recorded for this class yet.
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E2DC] text-[#6F6D68]">
                        <th className="py-2.5 font-medium">Student</th>
                        <th className="py-2.5 font-medium">Admission No</th>
                        <th className="py-2.5 font-medium text-right">Marks</th>
                        <th className="py-2.5 font-medium text-right">Percentage</th>
                        <th className="py-2.5 font-medium text-center">Grade</th>
                        <th className="py-2.5 font-medium text-center">Result</th>
                        <th className="py-2.5 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E2DC]/60">
                      {classDetails.students.map((st) => (
                        <tr
                          key={st.id}
                          className="hover:bg-[#FAF9F7] transition-colors group"
                        >
                          <td className="py-3 font-medium text-[#20201F]">
                            {st.student_name}
                          </td>
                          <td className="py-3 text-[#6F6D68]">
                            {st.admission_number || st.roll_number}
                          </td>
                          <td className="py-3 text-right font-medium text-[#20201F]">
                            {st.total_marks} / {st.maximum_marks}
                          </td>
                          <td className="py-3 text-right font-semibold text-[#20201F]">
                            {st.percentage}%
                          </td>
                          <td className="py-3 text-center">
                            <span className="font-semibold text-[#5B4B8A]">
                              {st.grade}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                                st.result_status === 'pass'
                                  ? 'text-[#557A61] bg-[#557A61]/10'
                                  : 'text-[#B65C55] bg-[#B65C55]/10'
                              }`}
                            >
                              {st.result_status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => onSelectStudent(st.student_id)}
                              className="text-xs font-medium text-[#5B4B8A] hover:underline cursor-pointer"
                            >
                              View &rarr;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Vertical Rows (Section 24 & 47: No sideways scroll!) */}
                <div className="sm:hidden space-y-2.5 divide-y divide-[#E5E2DC]/60">
                  {classDetails.students.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => onSelectStudent(st.student_id)}
                      className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#20201F] truncate">
                          {st.student_name}
                        </p>
                        <p className="text-[11px] text-[#6F6D68] mt-0.5">
                          Adm. {st.admission_number || st.roll_number} &bull; {st.total_marks}/{st.maximum_marks}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-bold text-[#20201F]">
                            {st.percentage}%
                          </p>
                          <p className="text-[11px] font-semibold text-[#5B4B8A]">
                            Grade {st.grade}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#A8A59F]" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* ================================================== */
        /* CLEAN LIST OF EXAMINATIONS & CLASSES (Section 11)  */
        /* ================================================== */
        <div className="space-y-4">
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 shadow-2xs space-y-4">
            <div>
              <h2 className="text-base font-semibold text-[#20201F]">
                Results &bull; {activeExam?.name}
              </h2>
              <p className="text-xs text-[#6F6D68] mt-0.5">
                Academic Year {activeExam?.academic_year || '2026–27'} &bull; Select a class to inspect student results or publish to parents.
              </p>
            </div>

            {/* Classes List */}
            <div className="border border-[#E5E2DC] rounded-lg divide-y divide-[#E5E2DC] overflow-hidden">
              {classes.map((cls) => {
                const clsData = currentExamData?.classes.find((c) => c.classId === cls.id);
                const hasResults = !!clsData && clsData.studentCount > 0;

                return (
                  <div
                    key={cls.id}
                    onClick={() => hasResults && setSelectedClassId(cls.id)}
                    className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors ${
                      hasResults
                        ? 'hover:bg-[#FAF9F7] cursor-pointer'
                        : 'bg-[#FAF9F7]/40 text-[#A8A59F] cursor-default'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold ${hasResults ? 'text-[#20201F]' : 'text-[#6F6D68]'}`}>
                          {cls.name}
                        </p>
                        {clsData?.isPublished && (
                          <span className="text-[10px] font-semibold text-[#557A61] bg-[#557A61]/10 px-2 py-0.5 rounded-full">
                            Published
                          </span>
                        )}
                      </div>

                      {hasResults ? (
                        <p className="text-xs text-[#6F6D68] mt-0.5">
                          {clsData.studentCount} students &bull; {clsData.averagePercentage}% average &bull; {clsData.passedCount} passed
                        </p>
                      ) : (
                        <p className="text-xs text-[#A8A59F] mt-0.5">
                          No results created yet
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {hasResults ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#5B4B8A]">
                            {clsData.averagePercentage}%
                          </span>
                          <ChevronRight className="w-4 h-4 text-[#6F6D68]" />
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenImport(cls.id, selectedExamId);
                          }}
                          className="text-xs font-medium text-[#5B4B8A] hover:underline cursor-pointer"
                        >
                          + Import
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
