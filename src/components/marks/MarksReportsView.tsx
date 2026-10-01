'use client';

import React, { useState, useMemo } from 'react';
import { User, StudentResult } from '@/types';
import { DataService } from '@/lib/data-service';
import {
  Download,
  Printer,
  FileSpreadsheet,
  ChevronDown,
  Building,
  GraduationCap,
  User as UserIcon,
} from 'lucide-react';
import { SchoolMemoModal } from './SchoolMemoModal';

interface MarksReportsViewProps {
  user: User;
}

type ReportScope = 'school' | 'class' | 'student';

export function MarksReportsView({ user }: MarksReportsViewProps) {
  const currentSchool = DataService.getCurrentSchool();
  const examinations = DataService.getExaminations();
  const classes = DataService.getClasses(); // Class 5 to Class 10
  const allStudents = DataService.getAllStudents();

  // Scope: School-wide | Class | Student
  const [scope, setScope] = useState<ReportScope>('school');

  // Filters
  const [selectedExamId, setSelectedExamId] = useState<string>(
    () => examinations[0]?.id || 'e0000000-0000-0000-0000-000000000001'
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(
    () => classes[0]?.id || ''
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    () => allStudents[0]?.id || ''
  );

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [studentMemoResult, setStudentMemoResult] = useState<StudentResult | null>(null);

  const currentExam =
    examinations.find((e) => e.id === selectedExamId) ||
    examinations[0] || {
      id: 'e0000000-0000-0000-0000-000000000001',
      name: 'Half-Yearly Examination',
      academic_year: '2026–27',
    };
  const currentClass =
    classes.find((c) => c.id === selectedClassId) ||
    classes[0] || {
      id: 'c0000000-0000-0000-0000-000000000005',
      name: 'Class 5',
    };
  const currentStudent =
    allStudents.find((s) => s.id === selectedStudentId) ||
    allStudents[0] ||
    null;

  // Overview data for School-wide report
  const schoolOverview = useMemo(() => {
    return DataService.getAcademicOverview({
      examinationId: selectedExamId,
      classId: 'all',
      threshold: 70,
    });
  }, [selectedExamId, DataService]);

  // Class detailed data for Class report
  const classDetails = useMemo(() => {
    if (!selectedClassId) return null;
    return DataService.getClassDetailedResults(selectedExamId, selectedClassId);
  }, [selectedExamId, selectedClassId, DataService]);

  // Student academic profile for Student report
  const studentProfile = useMemo(() => {
    if (!selectedStudentId) return null;
    return DataService.getStudentFullAcademicProfile(selectedStudentId);
  }, [selectedStudentId, DataService]);

  const studentResultForExam = useMemo(() => {
    if (!studentProfile) return null;
    const match = studentProfile.academicHistory.find((r) => r.examination_id === selectedExamId);
    return match || studentProfile.latestResult;
  }, [studentProfile, selectedExamId]);

  // EXPORT EXCEL HANDLER
  const handleExportExcel = () => {
    setShowExportMenu(false);
    let rows: string[][] = [];
    let filename = '';

    const examTitle = currentExam?.name || 'Examination';
    const academicYear = currentExam?.academic_year || '2026–27';

    if (scope === 'school') {
      filename = `School_Academic_Performance_${examTitle.replace(/\s+/g, '_')}.csv`;
      rows = [
        ['School Name', currentSchool?.name || 'NodeBricks Academy'],
        ['Examination', examTitle],
        ['Academic Year', academicYear],
        ['Overall Average', `${schoolOverview.overallAverage}%`],
        ['Total Students', schoolOverview.totalStudents.toString()],
        ['Passed', schoolOverview.passedCount.toString()],
        ['Needs Attention', schoolOverview.needsAttentionCount.toString()],
        [],
        ['Class', 'Students', 'Average Percentage', 'Passed', 'Needs Attention'],
        ...schoolOverview.performanceByClass.map((c) => [
          c.className,
          c.studentCount.toString(),
          `${c.averagePercentage}%`,
          c.passedCount.toString(),
          c.needsAttentionCount.toString(),
        ]),
        [],
        ['Subject', 'Average Percentage'],
        ...schoolOverview.subjectPerformance.map((s) => [
          s.subjectName,
          `${s.averagePercentage}%`,
        ]),
      ];
    } else if (scope === 'class' && classDetails) {
      filename = `${classDetails.className}_${examTitle.replace(/\s+/g, '_')}_Results.csv`;
      rows = [
        ['School Name', currentSchool?.name || 'NodeBricks Academy'],
        ['Class', classDetails.className],
        ['Examination', classDetails.examinationName],
        ['Academic Year', classDetails.academicYear],
        ['Students Count', classDetails.studentCount.toString()],
        ['Average Percentage', `${classDetails.averagePercentage}%`],
        ['Passed Count', classDetails.passedCount.toString()],
        [],
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
    } else if (scope === 'student' && studentProfile && studentResultForExam) {
      filename = `${studentProfile.student.full_name.replace(/\s+/g, '_')}_${examTitle.replace(/\s+/g, '_')}_Result.csv`;
      rows = [
        ['School Name', currentSchool?.name || 'NodeBricks Academy'],
        ['Student Name', studentProfile.student.full_name],
        ['Admission Number', studentProfile.student.admission_number || studentProfile.student.roll_number],
        ['Class', studentProfile.className],
        ['Examination', studentResultForExam.examination_name],
        ['Academic Year', studentResultForExam.academic_year || '2026–27'],
        ['Total Marks', `${studentResultForExam.total_marks} / ${studentResultForExam.maximum_marks}`],
        ['Percentage', `${studentResultForExam.percentage}%`],
        ['Grade', studentResultForExam.grade],
        ['Result', studentResultForExam.result_status.toUpperCase()],
        [],
        ['Subject', 'Marks Obtained', 'Maximum Marks', 'Percentage'],
        ...(studentResultForExam.subject_marks || []).map((sm) => [
          sm.subject_name,
          sm.marks_obtained.toString(),
          sm.maximum_marks.toString(),
          `${sm.maximum_marks > 0 ? Math.round((sm.marks_obtained / sm.maximum_marks) * 100) : 0}%`,
        ]),
      ];
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // EXPORT PDF HANDLER
  const handleExportPDF = () => {
    setShowExportMenu(false);
    if (scope === 'student' && studentResultForExam) {
      setStudentMemoResult(studentResultForExam);
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-16">
      {/* ================================================== */}
      {/* 26. ADAPTIVE ACADEMIC REPORTS CONTROLS             */}
      {/* ================================================== */}
      <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E2DC]/70 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#20201F] tracking-tight">
              Academic Reports
            </h1>
            <p className="text-xs text-[#6F6D68] mt-0.5">
              Generate official performance summaries, class result sheets, and student marks memos.
            </p>
          </div>

          {/* Scope Selection Pill */}
          <div className="inline-flex p-1 bg-[#FAF9F7] border border-[#E5E2DC] rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setScope('school')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                scope === 'school'
                  ? 'bg-white text-[#20201F] shadow-2xs'
                  : 'text-[#6F6D68] hover:text-[#20201F]'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>School-wide</span>
            </button>
            <button
              onClick={() => setScope('class')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                scope === 'class'
                  ? 'bg-white text-[#20201F] shadow-2xs'
                  : 'text-[#6F6D68] hover:text-[#20201F]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Class</span>
            </button>
            <button
              onClick={() => setScope('student')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                scope === 'student'
                  ? 'bg-white text-[#20201F] shadow-2xs'
                  : 'text-[#6F6D68] hover:text-[#20201F]'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Student</span>
            </button>
          </div>
        </div>

        {/* Dynamic Context Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-3">
            {/* Examination */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6F6D68]">Examination:</span>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="text-xs font-medium text-[#20201F] bg-white border border-[#D5D2CB] rounded-md px-2.5 py-1.5 focus:outline-hidden focus:border-[#5B4B8A] cursor-pointer"
              >
                {examinations.length === 0 ? (
                  <option value="e0000000-0000-0000-0000-000000000001">Half-Yearly Examination</option>
                ) : (
                  examinations.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Class filter if scope is class */}
            {scope === 'class' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6F6D68]">Class:</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="text-xs font-medium text-[#20201F] bg-white border border-[#D5D2CB] rounded-md px-2.5 py-1.5 focus:outline-hidden focus:border-[#5B4B8A] cursor-pointer"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Student filter if scope is student */}
            {scope === 'student' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6F6D68]">Student:</span>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="text-xs font-medium text-[#20201F] bg-white border border-[#D5D2CB] rounded-md px-2.5 py-1.5 focus:outline-hidden focus:border-[#5B4B8A] max-w-xs truncate cursor-pointer"
                >
                  {allStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.full_name} ({st.admission_number || st.roll_number})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Section 27: Unified [ Export ] Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn-primary text-xs h-8 px-3.5 flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-[#E5E2DC] rounded-lg shadow-md z-30 py-1 text-xs">
                <button
                  onClick={handleExportPDF}
                  className="w-full text-left px-3 py-2 text-[#20201F] hover:bg-[#FAF9F7] flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#6F6D68]" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  className="w-full text-left px-3 py-2 text-[#20201F] hover:bg-[#FAF9F7] flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#6F6D68]" />
                  <span>Export Excel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* REPORT PREVIEWS (Printable and Scannable)           */}
      {/* ================================================== */}

      {/* 1. SCHOOL-WIDE ACADEMIC PERFORMANCE REPORT */}
      {scope === 'school' && (
        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="border-b border-[#20201F] pb-4 space-y-1">
            <h2 className="text-xl font-bold uppercase tracking-wide text-[#20201F]">
              {currentSchool?.name || 'NodeBricks Academy'}
            </h2>
            <p className="text-xs text-[#6F6D68]">
              Academic Performance Report &bull; {currentExam?.name || 'Examination'} &bull; Academic Year {currentExam?.academic_year || '2026–27'}
            </p>
          </div>

          {/* School Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-b border-[#E5E2DC] text-center">
            <div>
              <span className="text-xs text-[#6F6D68] block">Overall Average</span>
              <span className="text-2xl font-bold text-[#5B4B8A]">
                {schoolOverview.overallAverage}%
              </span>
            </div>
            <div>
              <span className="text-xs text-[#6F6D68] block">Total Students</span>
              <span className="text-2xl font-bold text-[#20201F]">
                {schoolOverview.totalStudents}
              </span>
            </div>
            <div>
              <span className="text-xs text-[#6F6D68] block">Passed</span>
              <span className="text-2xl font-bold text-[#557A61]">
                {schoolOverview.passedCount}
              </span>
            </div>
            <div>
              <span className="text-xs text-[#6F6D68] block">Needs Attention</span>
              <span className="text-2xl font-bold text-[#B8874A]">
                {schoolOverview.needsAttentionCount}
              </span>
            </div>
          </div>

          {/* Class Breakdown Table */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[#20201F]">
              Class Performance Summary
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E2DC] text-[#6F6D68]">
                    <th className="py-2.5 font-medium">Class</th>
                    <th className="py-2.5 font-medium text-right">Students</th>
                    <th className="py-2.5 font-medium text-right">Average %</th>
                    <th className="py-2.5 font-medium text-right">Passed</th>
                    <th className="py-2.5 font-medium text-right">Needs Attention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DC]/60">
                  {schoolOverview.performanceByClass.map((c) => (
                    <tr key={c.classId} className="hover:bg-[#FAF9F7]">
                      <td className="py-2.5 font-medium text-[#20201F]">{c.className}</td>
                      <td className="py-2.5 text-right text-[#6F6D68]">{c.studentCount}</td>
                      <td className="py-2.5 text-right font-semibold text-[#20201F]">
                        {c.averagePercentage}%
                      </td>
                      <td className="py-2.5 text-right text-[#557A61] font-medium">{c.passedCount}</td>
                      <td className="py-2.5 text-right text-[#B8874A] font-medium">{c.needsAttentionCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. CLASS RESULT REPORT (Section 29) */}
      {scope === 'class' && classDetails && (
        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="border-b border-[#20201F] pb-4 space-y-1">
            <h2 className="text-xl font-bold uppercase tracking-wide text-[#20201F]">
              {currentSchool?.name || 'NodeBricks Academy'}
            </h2>
            <p className="text-xs text-[#6F6D68]">
              Class Result Report &bull; {classDetails.className} &bull; {classDetails.examinationName} ({classDetails.academicYear})
            </p>
          </div>

          {/* Class Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-b border-[#E5E2DC] text-center">
            <div>
              <span className="text-xs text-[#6F6D68] block">Students</span>
              <span className="text-2xl font-bold text-[#20201F]">{classDetails.studentCount}</span>
            </div>
            <div>
              <span className="text-xs text-[#6F6D68] block">Average</span>
              <span className="text-2xl font-bold text-[#5B4B8A]">{classDetails.averagePercentage}%</span>
            </div>
            <div>
              <span className="text-xs text-[#6F6D68] block">Pass</span>
              <span className="text-2xl font-bold text-[#557A61]">{classDetails.passedCount}</span>
            </div>
            <div>
              <span className="text-xs text-[#6F6D68] block">Needs Attention</span>
              <span className="text-2xl font-bold text-[#B8874A]">{classDetails.needsAttentionCount}</span>
            </div>
          </div>

          {/* Student Ledger */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[#20201F]">
              Student Marks Ledger
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E2DC] text-[#6F6D68]">
                    <th className="py-2.5 font-medium">Student</th>
                    <th className="py-2.5 font-medium">Admission No</th>
                    <th className="py-2.5 font-medium text-right">Total</th>
                    <th className="py-2.5 font-medium text-right">Percentage</th>
                    <th className="py-2.5 font-medium text-center">Grade</th>
                    <th className="py-2.5 font-medium text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DC]/60">
                  {classDetails.students.map((st) => (
                    <tr key={st.id} className="hover:bg-[#FAF9F7]">
                      <td className="py-2.5 font-medium text-[#20201F]">{st.student_name}</td>
                      <td className="py-2.5 text-[#6F6D68]">{st.admission_number || st.roll_number}</td>
                      <td className="py-2.5 text-right font-medium text-[#20201F]">
                        {st.total_marks} / {st.maximum_marks}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-[#20201F]">{st.percentage}%</td>
                      <td className="py-2.5 text-center font-semibold text-[#5B4B8A]">{st.grade}</td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm uppercase ${
                            st.result_status === 'pass'
                              ? 'text-[#557A61] bg-[#557A61]/10'
                              : 'text-[#B65C55] bg-[#B65C55]/10'
                          }`}
                        >
                          {st.result_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. STUDENT RESULT REPORT (Section 28) */}
      {scope === 'student' && studentProfile && studentResultForExam && (
        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="border border-[#20201F] p-6 sm:p-8 rounded-sm space-y-5 bg-white">
            {/* School Header */}
            <div className="text-center pb-4 border-b border-[#20201F] space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-[#20201F]">
                {currentSchool?.name || 'NodeBricks Academy'}
              </h2>
              <p className="text-xs text-[#6F6D68]">
                {currentSchool?.address || 'Main Campus'} &bull; Academic Year {studentResultForExam.academic_year || '2026–27'}
              </p>
              <p className="text-xs font-semibold text-[#20201F] pt-2 uppercase tracking-wider">
                STUDENT PROGRESS REPORT &bull; {studentResultForExam.examination_name}
              </p>
            </div>

            {/* Student Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 text-xs border-b border-[#E5E2DC]">
              <div>
                <span className="text-[#6F6D68] block">Student:</span>
                <span className="font-semibold text-[#20201F]">{studentProfile.student.full_name}</span>
              </div>
              <div>
                <span className="text-[#6F6D68] block">Admission No:</span>
                <span className="font-semibold text-[#20201F]">
                  {studentProfile.student.admission_number || studentProfile.student.roll_number}
                </span>
              </div>
              <div>
                <span className="text-[#6F6D68] block">Class:</span>
                <span className="font-semibold text-[#20201F]">{studentProfile.className}</span>
              </div>
              <div>
                <span className="text-[#6F6D68] block">Roll No:</span>
                <span className="font-semibold text-[#20201F]">{studentProfile.student.roll_number}</span>
              </div>
            </div>

            {/* Subject Marks Table */}
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#20201F] text-[#20201F]">
                  <th className="py-2 text-left font-semibold">Subject</th>
                  <th className="py-2 text-right font-semibold w-24">Marks</th>
                  <th className="py-2 text-right font-semibold w-24">Maximum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DC]">
                {(studentResultForExam.subject_marks || []).map((sm) => (
                  <tr key={sm.id}>
                    <td className="py-2 text-[#20201F]">{sm.subject_name}</td>
                    <td className="py-2 text-right font-medium text-[#20201F]">{sm.marks_obtained}</td>
                    <td className="py-2 text-right text-[#6F6D68]">{sm.maximum_marks}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#20201F] font-semibold text-xs">
                  <td className="py-2.5">Total Marks</td>
                  <td className="py-2.5 text-right">{studentResultForExam.total_marks}</td>
                  <td className="py-2.5 text-right">{studentResultForExam.maximum_marks}</td>
                </tr>
              </tfoot>
            </table>

            {/* Performance Summary */}
            <div className="border-t border-[#E5E2DC] pt-3 pb-4 grid grid-cols-3 gap-2 text-xs text-center">
              <div className="border-r border-[#E5E2DC]">
                <span className="text-[#6F6D68] block">Percentage</span>
                <span className="font-bold text-sm text-[#20201F]">{studentResultForExam.percentage}%</span>
              </div>
              <div className="border-r border-[#E5E2DC]">
                <span className="text-[#6F6D68] block">Grade</span>
                <span className="font-bold text-sm text-[#20201F]">{studentResultForExam.grade}</span>
              </div>
              <div>
                <span className="text-[#6F6D68] block">Result</span>
                <span className="font-bold text-sm text-[#557A61] uppercase">
                  {studentResultForExam.result_status}
                </span>
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-[#20201F] pt-1">
                <p className="font-medium text-[#20201F]">Class Teacher</p>
                <p className="text-[11px] text-[#6F6D68]">Signature</p>
              </div>
              <div className="border-t border-[#20201F] pt-1">
                <p className="font-medium text-[#20201F]">Principal</p>
                <p className="text-[11px] text-[#6F6D68]">{currentSchool?.name || 'NodeBricks Academy'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for PDF memo view */}
      {studentMemoResult && (
        <SchoolMemoModal
          result={studentMemoResult}
          onClose={() => setStudentMemoResult(null)}
        />
      )}
    </div>
  );
}
