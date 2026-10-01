'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Student } from '@/types';
import { DataService, CURRENT_DATE } from '@/lib/data-service';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Search,
  Download,
  Printer,
  FileSpreadsheet,
  ArrowLeft,
  X,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface AttendanceReportsViewProps {
  user: User;
}

type DatePreset = 'today' | 'yesterday' | 'week' | '7days' | 'month' | 'custom';

export function AttendanceReportsView({ user }: AttendanceReportsViewProps) {
  // Subscribe to real-time data changes from Supabase
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = DataService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  // Animation state (respects prefers-reduced-motion)
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        setIsAnimated(true);
        return;
      }
    }
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 60);
    return () => clearTimeout(timer);
  }, []);

  const school = DataService.getCurrentSchool();
  const schoolName = school?.name || 'NodeBricks Academy';
  const classes = DataService.getClasses(); // Class 5 to Class 10
  const allStudents = DataService.getAllStudents();

  // ==========================================
  // UNIFIED FILTER STATES
  // ==========================================
  // Helper to format Date as YYYY-MM-DD
  const formatYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getSchoolTodayDateObj = () => {
    const todayStr = DataService.getSchoolTodayDate();
    const [y, m, d] = todayStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // Date range default: Last 7 school days dynamically computed from today
  const [startDate, setStartDate] = useState<string>(() => {
    const d = getSchoolTodayDateObj();
    d.setDate(d.getDate() - 6);
    return formatYMD(d);
  });
  const [endDate, setEndDate] = useState<string>(() => DataService.getSchoolTodayDate());
  const [activePreset, setActivePreset] = useState<DatePreset>('7days');

  // Selected Class ('all' or specific class ID)
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  // Selected Student (null or student ID)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Student Search input query
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  // UI Popovers & Sheets
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);
  const [classSheetOpen, setClassSheetOpen] = useState<boolean>(false);
  const [exportOpen, setExportOpen] = useState<boolean>(false);
  const [trendHoverIdx, setTrendHoverIdx] = useState<number | null>(null);

  const calendarRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set Date Presets dynamically
  const applyPreset = (preset: DatePreset) => {
    setActivePreset(preset);
    const todayStr = DataService.getSchoolTodayDate();
    const todayObj = getSchoolTodayDateObj();

    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const yest = new Date(todayObj);
      yest.setDate(yest.getDate() - 1);
      const yestStr = formatYMD(yest);
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (preset === 'week') {
      // Monday of current school week
      const monday = new Date(todayObj);
      const day = monday.getDay();
      const diff = day === 0 ? 6 : day - 1;
      monday.setDate(monday.getDate() - diff);
      setStartDate(formatYMD(monday));
      setEndDate(todayStr);
    } else if (preset === '7days') {
      const d7 = new Date(todayObj);
      d7.setDate(d7.getDate() - 6);
      setStartDate(formatYMD(d7));
      setEndDate(todayStr);
    } else if (preset === 'month') {
      const [y, m] = todayStr.split('-').map(Number);
      setStartDate(`${y}-${String(m).padStart(2, '0')}-01`);
      setEndDate(todayStr);
    }
    setCalendarOpen(false);
  };

  // Formatted date range label for button: "29 Sep 2026" or "23 Sep – 29 Sep 2026"
  const dateRangeDisplayLabel = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    try {
      const [sy, sm, sd] = startDate.split('-').map(Number);
      const [ey, em, ed] = endDate.split('-').map(Number);

      if (startDate === endDate) {
        return `${sd} ${monthNames[sm - 1]} ${sy}`;
      }
      if (sy === ey && sm === em) {
        return `${sd} – ${ed} ${monthNames[sm - 1]} ${sy}`;
      }
      return `${sd} ${monthNames[sm - 1]} – ${ed} ${monthNames[em - 1]} ${ey}`;
    } catch {
      return `${startDate} – ${endDate}`;
    }
  }, [startDate, endDate]);

  // Selected class display name
  const activeClass = classes.find((c) => c.id === selectedClassId);
  const classDisplayLabel = activeClass ? activeClass.name : 'All Classes';

  // Instant Student Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allStudents.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        (s.admission_number && s.admission_number.toLowerCase().includes(q)) ||
        (s.student_id && s.student_id.toLowerCase().includes(q)) ||
        s.roll_number.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery, allStudents]);

  // ==========================================
  // UNIFIED DATASET CALCULATION
  // Derived 100% from real Supabase records
  // ==========================================
  const reportData = useMemo(() => {
    return DataService.getUnifiedAttendanceReport({
      startDate,
      endDate,
      classId: selectedClassId,
      studentId: selectedStudentId || undefined,
      threshold: 75,
    });
  }, [startDate, endDate, selectedClassId, selectedStudentId, tick]);

  // Selected Student Profile
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return allStudents.find((s) => s.id === selectedStudentId) || null;
  }, [selectedStudentId, allStudents]);

  // ==========================================
  // EXPORT HANDLERS
  // ==========================================
  const handlePrintPdf = () => {
    setExportOpen(false);
    window.print();
  };

  const handleExportExcel = () => {
    setExportOpen(false);

    if (reportData.scope === 'student' && reportData.studentProfile) {
      const rows = reportData.studentProfile.records.map((r) => ({
        Date: r.date,
        'Student Name': reportData.studentProfile!.student.full_name,
        'Roll No': reportData.studentProfile!.student.roll_number,
        Class: reportData.studentProfile!.className,
        Status: r.status === 'present' ? 'Present' : 'Absent',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Student Attendance');
      XLSX.writeFile(wb, `${reportData.studentProfile.student.full_name}_Attendance.xlsx`);
    } else if (reportData.scope === 'class') {
      const rows = reportData.classStudents.map((st) => ({
        Class: classDisplayLabel,
        'Roll No': st.rollNumber,
        'Student Name': st.fullName,
        'Admission No': st.admissionNumber,
        'Attendance %': `${st.percentage}%`,
        Present: st.present,
        Absent: st.absent,
        'Total Records': st.total,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${classDisplayLabel} Report`);
      XLSX.writeFile(wb, `${classDisplayLabel}_Attendance_${startDate}_${endDate}.xlsx`);
    } else {
      // School-wide class summary
      const rows = reportData.classBreakdown.map((c) => ({
        Class: c.className,
        'Total Students': c.studentCount,
        'Attendance Records': c.total,
        Present: c.present,
        Absent: c.absent,
        'Attendance %': `${c.percentage}%`,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'School Attendance Summary');
      XLSX.writeFile(wb, `School_Attendance_Report_${startDate}_${endDate}.xlsx`);
    }
  };

  // Has data check
  const hasData = reportData.totalRecords > 0;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-150">
      {/* ================================================== */}
      {/* 4. REPORTS PAGE HEADER & COMPACT CONTROLS          */}
      {/* ================================================== */}
      <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4 no-print">
        {/* Top title & Export action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E2DC]/70 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#20201F] tracking-tight">
              Attendance Reports
            </h1>
            <p className="text-xs text-[#6F6D68] mt-0.5">
              View attendance performance by date, class and student.
            </p>
          </div>

          {/* Export Button with Popover */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="btn-secondary text-xs h-9 px-3.5 flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#5B4B8A]" />
              <span className="font-medium">Export</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#6F6D68]" />
            </button>

            {exportOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={handlePrintPdf}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#20201F] hover:bg-[#FAF9F7] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#5B4B8A]" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#20201F] hover:bg-[#FAF9F7] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#557A61]" />
                  <span>Export Excel</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Compact Controls: [ Calendar ]  [ Class ]  [ Search Student ] */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-1">
          {/* 5. Calendar / Date Range Popover */}
          <div className="relative" ref={calendarRef}>
            <button
              onClick={() => setCalendarOpen(!calendarOpen)}
              className="w-full sm:w-auto h-9 px-3 text-xs bg-[#FFFFFF] hover:bg-[#FAF9F7] border border-[#E5E2DC] rounded-md text-[#20201F] flex items-center justify-between sm:justify-start gap-2.5 transition-colors cursor-pointer"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-[#5B4B8A]" />
              <span className="font-medium">{dateRangeDisplayLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#6F6D68]" />
            </button>

            {calendarOpen && (
              <div className="absolute left-0 mt-1.5 w-72 bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl shadow-lg p-3 z-30 animate-in fade-in zoom-in-95 duration-100 space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6F6D68] px-1">
                  Select Period
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'today', label: 'Today' },
                    { id: 'yesterday', label: 'Yesterday' },
                    { id: 'week', label: 'This week' },
                    { id: '7days', label: 'Last 7 school days' },
                    { id: 'month', label: 'This month' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset.id as DatePreset)}
                      className={`px-2.5 py-1.5 text-xs rounded text-left transition-colors cursor-pointer ${
                        activePreset === preset.id
                          ? 'bg-[#5B4B8A] text-white font-medium'
                          : 'bg-[#FAF9F7] hover:bg-[#F2EFE9] text-[#20201F]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#E5E2DC] space-y-2">
                  <div className="text-[11px] font-medium text-[#6F6D68]">Custom Date Range</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[#8C887B] block mb-0.5">Start</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setActivePreset('custom');
                        }}
                        className="w-full h-7 px-2 text-[11px] bg-[#FFFFFF] border border-[#E5E2DC] rounded text-[#20201F] focus:outline-hidden focus:border-[#5B4B8A]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8C887B] block mb-0.5">End</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setActivePreset('custom');
                        }}
                        className="w-full h-7 px-2 text-[11px] bg-[#FFFFFF] border border-[#E5E2DC] rounded text-[#20201F] focus:outline-hidden focus:border-[#5B4B8A]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 6. Class Filter (Strictly Class 5-10, No Sections!) */}
          <div className="relative">
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedStudentId(null); // Return to class level
              }}
              className="w-full sm:w-auto h-9 px-3 pr-8 text-xs bg-[#FFFFFF] hover:bg-[#FAF9F7] border border-[#E5E2DC] rounded-md text-[#20201F] font-medium focus:outline-hidden focus:border-[#5B4B8A] appearance-none cursor-pointer"
            >
              <option value="all">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#6F6D68] absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* 7. Search Student Input with Instant Dropdown */}
          <div className="relative flex-1" ref={searchContainerRef}>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#6F6D68] absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                placeholder="Search student name or admission number..."
                className="w-full h-9 pl-9 pr-8 text-xs bg-[#FFFFFF] border border-[#E5E2DC] rounded-md text-[#20201F] placeholder:text-[#8C887B] focus:outline-hidden focus:border-[#5B4B8A]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-[#6F6D68] hover:text-[#20201F]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown search matches */}
            {isSearchFocused && searchQuery.trim() && (
              <div className="absolute left-0 right-0 mt-1 bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg shadow-lg max-h-56 overflow-y-auto z-40 divide-y divide-[#E5E2DC]/60">
                {searchResults.length === 0 ? (
                  <div className="p-3 text-xs text-[#6F6D68] text-center">
                    No students found matching &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  searchResults.map((st) => {
                    const cls = classes.find((c) => c.id === st.class_id);
                    return (
                      <button
                        key={st.id}
                        onClick={() => {
                          setSelectedStudentId(st.id);
                          setSearchQuery('');
                          setIsSearchFocused(false);
                        }}
                        className="w-full p-2.5 text-left hover:bg-[#FAF9F7] flex items-center justify-between text-xs transition-colors cursor-pointer"
                      >
                        <div>
                          <span className="font-semibold text-[#20201F]">{st.full_name}</span>
                          <span className="text-[#6F6D68] ml-2">
                            {cls?.name || 'Class'} &bull; Roll #{st.roll_number}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#5B4B8A] font-medium">
                          Select &rarr;
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* 24. EMPTY STATE (When No Records Exist)           */}
      {/* ================================================== */}
      {!hasData && (
        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-12 text-center space-y-2 shadow-2xs">
          <div className="w-10 h-10 rounded-full bg-[#FAF9F7] text-[#6F6D68] flex items-center justify-center mx-auto border border-[#E5E2DC]">
            <Clock className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-[#20201F]">
            No attendance data
          </h2>
          <p className="text-xs text-[#6F6D68] max-w-sm mx-auto">
            There is no attendance recorded for the selected period. When attendance staff records attendance, this report will update automatically.
          </p>
        </div>
      )}

      {/* ================================================== */}
      {/* 8. ADAPTIVE REPORT VIEWS                          */}
      {/* ================================================== */}
      {hasData && (
        <div className="space-y-6">
          {/* ============================================== */}
          {/* VIEW C: INDIVIDUAL STUDENT INSPECTION VIEW     */}
          {/* ============================================== */}
          {reportData.scope === 'student' && reportData.studentProfile && (
            <div className="space-y-6">
              {/* Student Header Card with contextual unboxed back arrow */}
              <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 sm:p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E2DC]/70 pb-4">
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => setSelectedStudentId(null)}
                      className="p-2 -ml-2 text-[#20201F] hover:text-[#5B4B8A] transition-colors cursor-pointer flex items-center justify-center shrink-0 mt-0.5 no-print"
                      title="Back to class report"
                      aria-label="Back to class report"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
                    </button>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5B4B8A]">
                        Student Attendance
                      </span>
                      <h2 className="text-lg sm:text-xl font-bold text-[#20201F] tracking-tight mt-0.5">
                        {reportData.studentProfile.student.full_name}
                      </h2>
                      <p className="text-xs text-[#6F6D68] mt-0.5">
                        {reportData.studentProfile.className} &bull; Admission No. {reportData.studentProfile.student.admission_number || reportData.studentProfile.student.student_id} &bull; Roll #{reportData.studentProfile.student.roll_number}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-4 sm:border-l sm:border-[#E5E2DC] sm:pl-6">
                    <div>
                      <p className="text-[11px] font-medium text-[#6F6D68] uppercase tracking-wider">
                        Attendance
                      </p>
                      <p className="text-3xl sm:text-4xl font-bold text-[#20201F] tracking-tight mt-0.5">
                        {reportData.attendancePercentage}%
                      </p>
                    </div>
                    <div className="text-xs text-[#6F6D68] space-y-0.5">
                      <div>
                        <span className="font-semibold text-[#557A61]">{reportData.presentRecords}</span> Present
                      </div>
                      <div>
                        <span className="font-semibold text-[#B65C55]">{reportData.absentRecords}</span> Absent
                      </div>
                    </div>
                  </div>
                </div>

                {/* 17. Simple Vertical Attendance Timeline / List */}
                <div className="pt-5 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6F6D68]">
                    Attendance History
                  </h3>

                  <div className="divide-y divide-[#E5E2DC]/60 border border-[#E5E2DC] rounded-lg overflow-hidden bg-[#FAF9F7]">
                    {reportData.studentProfile.records.map((rec) => (
                      <div
                        key={rec.date}
                        className="p-3 sm:px-4 flex items-center justify-between text-xs hover:bg-[#FFFFFF] transition-colors"
                      >
                        <span className="font-medium text-[#20201F]">{rec.date}</span>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                            rec.status === 'present'
                              ? 'text-[#557A61] bg-[#EFF5F1]'
                              : 'text-[#B65C55] bg-[#FBF1F0]'
                          }`}
                        >
                          {rec.status === 'present' ? 'Present' : 'Absent'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================== */}
          {/* VIEW A & B: SCHOOL-WIDE & SINGLE CLASS REPORT  */}
          {/* ============================================== */}
          {reportData.scope !== 'student' && (
            <>
              {/* 11. ATTENDANCE SUMMARY AREA */}
              <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 sm:p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6F6D68]">
                      {reportData.scope === 'class' ? `${classDisplayLabel} Attendance` : 'Attendance Summary'}
                    </span>
                    <div className="text-4xl sm:text-5xl font-bold text-[#20201F] tracking-tight mt-1">
                      {reportData.attendancePercentage}%
                    </div>
                  </div>

                  <div className="flex items-center gap-6 sm:border-l sm:border-[#E5E2DC] sm:pl-6 text-xs text-[#6F6D68]">
                    <div>
                      <span className="text-xl sm:text-2xl font-bold text-[#557A61] block">
                        {reportData.presentRecords.toLocaleString()}
                      </span>
                      <span>Present</span>
                    </div>

                    <div>
                      <span className="text-xl sm:text-2xl font-bold text-[#B65C55] block">
                        {reportData.absentRecords.toLocaleString()}
                      </span>
                      <span>Absent</span>
                    </div>

                    <div>
                      <span className="text-xl sm:text-2xl font-bold text-[#20201F] block">
                        {reportData.totalRecords.toLocaleString()}
                      </span>
                      <span>Total Records</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 12 & 13. CHARTS ROW: PRESENT VS ABSENT DONUT & ATTENDANCE TREND LINE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 12. Donut Chart: Present vs Absent */}
                <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 shadow-2xs space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#20201F]">
                      Present vs Absent
                    </h3>
                    <p className="text-[11px] text-[#6F6D68]">
                      Proportional distribution for {dateRangeDisplayLabel}
                    </p>
                  </div>

                  <div className="flex items-center justify-center py-2">
                    {/* SVG Donut Chart */}
                    <div className="relative w-36 h-36">
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        {/* Background track */}
                        <circle
                          cx="18"
                          cy="18"
                          r="15.91549430918954"
                          fill="transparent"
                          stroke="#E5E2DC"
                          strokeWidth="3.8"
                        />
                        {/* Absent segment */}
                        <circle
                          cx="18"
                          cy="18"
                          r="15.91549430918954"
                          fill="transparent"
                          stroke="#B65C55"
                          strokeWidth="3.8"
                          strokeDasharray={`${isAnimated ? reportData.absentPercentage : 0} ${isAnimated ? 100 - reportData.absentPercentage : 100}`}
                          strokeDashoffset="0"
                          style={{
                            transition: 'stroke-dasharray 600ms cubic-bezier(0.16, 1, 0.3, 1) 150ms',
                          }}
                        />
                        {/* Present segment */}
                        <circle
                          cx="18"
                          cy="18"
                          r="15.91549430918954"
                          fill="transparent"
                          stroke="#5B4B8A"
                          strokeWidth="3.8"
                          strokeDasharray={`${isAnimated ? reportData.presentPercentage : 0} ${isAnimated ? 100 - reportData.presentPercentage : 100}`}
                          strokeDashoffset={`-${isAnimated ? reportData.absentPercentage : 0}`}
                          style={{
                            transition: 'stroke-dasharray 600ms cubic-bezier(0.16, 1, 0.3, 1) 150ms, stroke-dashoffset 600ms cubic-bezier(0.16, 1, 0.3, 1) 150ms',
                          }}
                        />
                      </svg>
                      {/* Center metric */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-xl font-bold text-[#20201F] leading-none">
                          {reportData.attendancePercentage}%
                        </span>
                        <span className="text-[10px] text-[#6F6D68] uppercase font-medium mt-0.5">
                          Present
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Donut Legend */}
                  <div className="flex items-center justify-center gap-6 text-xs pt-1 border-t border-[#E5E2DC]/60">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#5B4B8A]" />
                      <span className="font-medium text-[#20201F]">{reportData.presentPercentage}% Present</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#B65C55]" />
                      <span className="font-medium text-[#20201F]">{reportData.absentPercentage}% Absent</span>
                    </div>
                  </div>
                </div>

                {/* 13. Line Chart: Attendance Trend */}
                {(() => {
                  const recordedDays = reportData.trend.filter((t) => t.hasData && t.percentage !== null);

                  // Sizing and coordinates for clean, non-distorting SVG layout
                  const svgWidth = 460;
                  const svgHeight = 175;
                  const chartStartX = 58;
                  const chartEndX = 422;
                  const chartWidth = chartEndX - chartStartX;

                  // Truthful 0-100% scale
                  const yTop = 26; // 100% line
                  const yBaseline = 142; // 0% line
                  const chartHeight = yBaseline - yTop; // 116 units

                  const getY = (pct: number) => {
                    const clamped = Math.max(0, Math.min(100, pct));
                    return yBaseline - (clamped / 100) * chartHeight;
                  };

                  const points = recordedDays.map((item, idx) => {
                    const x =
                      recordedDays.length > 1
                        ? chartStartX + (idx / (recordedDays.length - 1)) * chartWidth
                        : (chartStartX + chartEndX) / 2;
                    const y = getY(item.percentage || 0);
                    return { x, y, item, idx };
                  });

                  // Build smooth/soft straight line path connecting data points
                  const pathD = points.reduce(
                    (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`),
                    ''
                  );

                  return (
                    <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 shadow-2xs space-y-3">
                      <div>
                        <h3 className="text-sm font-semibold text-[#20201F]">
                          Attendance Trend
                        </h3>
                        <p className="text-[11px] text-[#6F6D68]">
                          {recordedDays.length > 1
                            ? `Daily percentage over ${recordedDays.length} recorded school days`
                            : recordedDays.length === 1
                            ? 'Only one attendance day is available for this period.'
                            : 'No attendance recorded for this period.'}
                        </p>
                      </div>

                      {recordedDays.length > 1 ? (
                        <div className="relative w-full pt-1">
                          {/* Clean, Non-distorting SVG Trend Chart */}
                          <svg
                            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                            className="w-full h-auto max-h-[195px] overflow-visible select-none"
                          >
                            {/* Subtle Horizontal Reference Grid Lines (100%, 75%, 50%, 25%, 0%) */}
                            {[100, 75, 50, 25, 0].map((val) => {
                              const gy = getY(val);
                              const isBaseline = val === 0;

                              return (
                                <g key={val}>
                                  {/* Y-axis small muted percentage label */}
                                  <text
                                    x={chartStartX - 14}
                                    y={gy + 3}
                                    textAnchor="end"
                                    className="text-[9px] fill-[#A29E96] font-mono select-none"
                                  >
                                    {val}%
                                  </text>
                                  {/* Subtle Reference Line */}
                                  <line
                                    x1={chartStartX}
                                    y1={gy}
                                    x2={chartEndX}
                                    y2={gy}
                                    stroke="#E5E2DC"
                                    strokeWidth={isBaseline ? '1' : '0.65'}
                                    strokeDasharray={isBaseline ? undefined : '3 3'}
                                    className={isBaseline ? 'opacity-90' : 'opacity-60'}
                                  />
                                </g>
                              );
                            })}

                            {/* Clean NodeBricks Purple Trend Line (Approx 2px, no glow, no shadow, soft straight connection) */}
                            <path
                              d={pathD}
                              fill="none"
                              stroke="#5B4B8A"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              pathLength="100"
                              strokeDasharray="100"
                              strokeDashoffset={isAnimated ? 0 : 100}
                              style={{
                                transition: 'stroke-dashoffset 600ms cubic-bezier(0.16, 1, 0.3, 1) 150ms',
                              }}
                            />

                            {/* Data Points + Small Professional Percentage Labels */}
                            {points.map((pt) => {
                              const pointDelay = 200 + (pt.idx / Math.max(1, points.length - 1)) * 400;
                              const isHovered = trendHoverIdx === pt.idx;

                              // Intelligent label positioning to prevent collision with y-axis scale:
                              // First point: shift slightly right (+14px) and upward (-11px) to give clear breathing room from 100% axis label
                              const isFirst = pt.idx === 0;
                              const labelX = isFirst ? pt.x + 14 : pt.x;
                              const labelY = isFirst ? pt.y - 11 : pt.y - 8;

                              return (
                                <g
                                  key={pt.item.date}
                                  style={{
                                    opacity: isAnimated ? 1 : 0,
                                    transform: isAnimated ? 'scale(1)' : 'scale(0.85)',
                                    transformOrigin: `${pt.x}px ${pt.y}px`,
                                    transition: `opacity 250ms ease-out ${pointDelay}ms, transform 250ms ease-out ${pointDelay}ms`,
                                  }}
                                >
                                  {/* Data Point: Small purple outer ring (2px) with clean white center */}
                                  <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r="3.75"
                                    fill="#FFFFFF"
                                    stroke="#5B4B8A"
                                    strokeWidth="2"
                                  />

                                  {/* Percentage Value Label: Small, professional (approx 14px), font-weight: 600 */}
                                  <text
                                    x={labelX}
                                    y={labelY}
                                    textAnchor="middle"
                                    className="text-[11.5px] fill-[#20201F] font-semibold tracking-tight select-none"
                                  >
                                    {pt.item.percentage}%
                                  </text>

                                  {/* X-axis Date Label: Clean, perfectly centered beneath point */}
                                  <text
                                    x={pt.x}
                                    y="162"
                                    textAnchor="middle"
                                    className={`text-[11px] font-medium transition-colors select-none ${
                                      isHovered ? 'fill-[#5B4B8A] font-semibold' : 'fill-[#6F6D68]'
                                    }`}
                                  >
                                    {pt.item.displayDate}
                                  </text>

                                  {/* Interactive Touch/Click/Hover Target Area */}
                                  <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r="18"
                                    fill="transparent"
                                    className="cursor-pointer"
                                    onMouseEnter={() => setTrendHoverIdx(pt.idx)}
                                    onMouseLeave={() => setTrendHoverIdx((curr) => (curr === pt.idx ? null : curr))}
                                    onClick={() => setTrendHoverIdx((curr) => (curr === pt.idx ? null : pt.idx))}
                                  />
                                </g>
                              );
                            })}
                          </svg>

                          {/* Simple, compact, professional tooltip on hover or tap */}
                          {trendHoverIdx !== null && points[trendHoverIdx] && (
                            <div
                              className="absolute pointer-events-none -translate-x-1/2 -translate-y-full bg-[#20201F] text-white text-[11px] px-2.5 py-1.5 rounded-md shadow-md z-20 whitespace-nowrap animate-in fade-in duration-100"
                              style={{
                                left: `${(points[trendHoverIdx].x / svgWidth) * 100}%`,
                                top: `${(points[trendHoverIdx].y / svgHeight) * 100}%`,
                                marginTop: '-14px',
                              }}
                            >
                              <p className="font-semibold">{points[trendHoverIdx].item.displayDate}</p>
                              <p className="text-white/80">Attendance: {points[trendHoverIdx].item.percentage}%</p>
                            </div>
                          )}
                        </div>
                      ) : recordedDays.length === 1 ? (
                        <div className="h-36 flex items-center justify-center p-4">
                          <div className="text-center space-y-1 p-4 rounded-xl bg-[#FAF9F7] border border-[#E5E2DC] max-w-xs w-full">
                            <span className="text-2xl font-bold text-[#5B4B8A] tracking-tight block">
                              {recordedDays[0].percentage}%
                            </span>
                            <p className="text-xs text-[#20201F] font-semibold">
                              {recordedDays[0].displayDate}
                            </p>
                            <p className="text-[11px] text-[#6F6D68]">
                              {recordedDays[0].present} present &bull; {recordedDays[0].absent} absent
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="h-28 flex items-center justify-center text-center p-4 text-xs text-[#6F6D68]">
                          No attendance recorded for the selected period.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* 14. ATTENDANCE BY CLASS (Horizontal Bars - Only shown when All Classes is selected) */}
              {reportData.scope === 'all_classes' && (
                <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#20201F]">
                      Attendance by Class
                    </h3>
                    <p className="text-[11px] text-[#6F6D68]">
                      Comparative attendance performance across all active grades
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    {reportData.classBreakdown.map((c, idx) => (
                      <div key={c.classId} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#20201F]">{c.className}</span>
                          <span className="font-bold text-[#20201F]">{c.percentage}%</span>
                        </div>
                        {/* Subtle Horizontal Bar with entrance animation */}
                        <div className="w-full h-3 bg-[#F7F6F3] rounded-full overflow-hidden border border-[#E5E2DC]/60">
                          <div
                            style={{
                              width: `${isAnimated ? c.percentage : 0}%`,
                              transition: `width 500ms cubic-bezier(0.16, 1, 0.3, 1) ${idx * 40}ms`,
                            }}
                            className="h-full bg-[#5B4B8A] rounded-full"
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#6F6D68]">
                          <span>{c.studentCount} students</span>
                          <span>{c.present} present &bull; {c.absent} absent</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 16. STUDENT ATTENDANCE LIST (When a Class is Selected) */}
              {reportData.scope === 'class' && (
                <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl shadow-2xs overflow-hidden">
                  <div className="p-5 border-b border-[#E5E2DC] flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[#20201F]">
                        Student Attendance &bull; {classDisplayLabel}
                      </h3>
                      <p className="text-[11px] text-[#6F6D68] mt-0.5">
                        Individual attendance records for {classDisplayLabel} students
                      </p>
                    </div>
                    <span className="text-xs text-[#6F6D68]">
                      {reportData.classStudents.length} Students
                    </span>
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#E5E2DC] bg-[#FAF9F7] text-[#6F6D68] uppercase tracking-wider">
                          <th className="py-2.5 px-4 font-semibold w-16">Roll No</th>
                          <th className="py-2.5 px-4 font-semibold">Student</th>
                          <th className="py-2.5 px-4 font-semibold">Admission No</th>
                          <th className="py-2.5 px-4 font-semibold text-center">Present</th>
                          <th className="py-2.5 px-4 font-semibold text-center">Absent</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Attendance %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E2DC]/60 text-[#20201F]">
                        {reportData.classStudents.map((st) => (
                          <tr
                            key={st.studentId}
                            onClick={() => setSelectedStudentId(st.studentId)}
                            className="hover:bg-[#FAF9F7] cursor-pointer transition-colors"
                          >
                            <td className="py-2.5 px-4 font-medium text-[#6F6D68]">{st.rollNumber}</td>
                            <td className="py-2.5 px-4 font-semibold text-[#20201F] hover:text-[#5B4B8A]">
                              {st.fullName}
                            </td>
                            <td className="py-2.5 px-4 text-[#6F6D68]">{st.admissionNumber || '—'}</td>
                            <td className="py-2.5 px-4 text-center font-medium text-[#557A61]">{st.present}</td>
                            <td className="py-2.5 px-4 text-center">
                              <span className={st.absent > 0 ? 'text-[#B65C55] font-semibold' : 'text-[#6F6D68]'}>
                                {st.absent}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-[#20201F]">{st.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Vertical Rows */}
                  <div className="block sm:hidden divide-y divide-[#E5E2DC]/60">
                    {reportData.classStudents.map((st) => (
                      <div
                        key={st.studentId}
                        onClick={() => setSelectedStudentId(st.studentId)}
                        className="p-3.5 flex items-center justify-between text-xs cursor-pointer active:bg-[#FAF9F7]"
                      >
                        <div>
                          <p className="font-semibold text-[#20201F]">{st.fullName}</p>
                          <p className="text-[11px] text-[#6F6D68] mt-0.5">
                            Roll #{st.rollNumber} &bull; {st.present} present, {st.absent} absent
                          </p>
                        </div>
                        <span className="font-bold text-sm text-[#20201F]">{st.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CLASS ATTENDANCE TABLE (When All Classes is Selected) */}
              {reportData.scope === 'all_classes' && (
                <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl shadow-2xs overflow-hidden">
                  <div className="p-5 border-b border-[#E5E2DC] flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[#20201F]">
                        Class Attendance Summary
                      </h3>
                      <p className="text-[11px] text-[#6F6D68] mt-0.5">
                        School-wide attendance roster by grade
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#E5E2DC] bg-[#FAF9F7] text-[#6F6D68] uppercase tracking-wider">
                          <th className="py-2.5 px-4 font-semibold">Class</th>
                          <th className="py-2.5 px-4 font-semibold text-center">Enrolled</th>
                          <th className="py-2.5 px-4 font-semibold text-center">Present</th>
                          <th className="py-2.5 px-4 font-semibold text-center">Absent</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Attendance %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E2DC]/60 text-[#20201F]">
                        {reportData.classBreakdown.map((c) => (
                          <tr
                            key={c.classId}
                            onClick={() => setSelectedClassId(c.classId)}
                            className="hover:bg-[#FAF9F7] cursor-pointer transition-colors"
                          >
                            <td className="py-3 px-4 font-semibold text-[#20201F] hover:text-[#5B4B8A]">
                              {c.className}
                            </td>
                            <td className="py-3 px-4 text-center text-[#6F6D68]">{c.studentCount}</td>
                            <td className="py-3 px-4 text-center font-medium text-[#557A61]">{c.present}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={c.absent > 0 ? 'text-[#B65C55] font-semibold' : 'text-[#6F6D68]'}>
                                {c.absent}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-[#20201F]">{c.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 15. STUDENTS NEEDING ATTENTION */}
              <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 sm:p-6 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#E5E2DC]/70 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#20201F]">
                      Students needing attention
                    </h3>
                    <p className="text-[11px] text-[#6F6D68]">
                      Students below the institutional 75% attendance threshold
                    </p>
                  </div>
                  <span className="text-xs text-[#B65C55] font-medium bg-[#FBF1F0] px-2 py-0.5 rounded border border-[#F3D6D4]">
                    {reportData.studentsNeedingAttention.length} students
                  </span>
                </div>

                {reportData.studentsNeedingAttention.length === 0 ? (
                  <p className="text-xs text-[#557A61] py-2">
                    No students currently need attention. All students are meeting attendance requirements.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {reportData.studentsNeedingAttention.map((st) => (
                      <div
                        key={st.studentId}
                        onClick={() => setSelectedStudentId(st.studentId)}
                        className="p-3 rounded-lg bg-[#FAF9F7] border border-[#E5E2DC]/70 flex items-center justify-between text-xs hover:bg-[#FFFFFF] cursor-pointer transition-colors"
                      >
                        <div>
                          <span className="font-semibold text-[#20201F]">{st.fullName}</span>
                          <span className="text-[#6F6D68] ml-2">{st.className} &bull; Roll #{st.rollNumber}</span>
                        </div>
                        <span className="font-bold text-[#B65C55] bg-[#FBF1F0] px-2 py-0.5 rounded border border-[#F3D6D4]">
                          {st.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ================================================== */}
      {/* 19. AUTHENTIC A4 SCHOOL REPORT (STRICTLY PRINT STYLED) */}
      {/* ================================================== */}
      <div className="hidden print:block bg-white text-black p-8 space-y-6">
        {/* Letterhead */}
        <div className="border-b-2 border-black pb-4 text-center space-y-1">
          <h1 className="text-2xl font-bold uppercase tracking-wide">{schoolName}</h1>
          <p className="text-xs uppercase tracking-widest text-gray-600">
            Official Academic Attendance Documentation
          </p>
        </div>

        <div className="flex justify-between items-baseline text-xs border-b border-gray-300 pb-3">
          <div>
            <span className="font-bold text-sm block">Attendance Report</span>
            <span className="text-gray-600">Period: {dateRangeDisplayLabel}</span>
          </div>
          <div className="text-right">
            <span className="font-bold block">
              Scope: {reportData.scope === 'student' ? reportData.studentProfile?.student.full_name : classDisplayLabel}
            </span>
            <span className="text-gray-600">School ID: {school?.id || 'NB-SCH-01'}</span>
          </div>
        </div>

        {/* Summary Table */}
        <table className="w-full text-xs border border-gray-400 text-center my-4">
          <thead className="bg-gray-100 border-b border-gray-400">
            <tr>
              <th className="py-2 px-3">Total Records</th>
              <th className="py-2 px-3">Present Records</th>
              <th className="py-2 px-3">Absent Records</th>
              <th className="py-2 px-3">Overall Attendance %</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 px-3 font-semibold">{reportData.totalRecords}</td>
              <td className="py-2 px-3 font-semibold text-green-700">{reportData.presentRecords}</td>
              <td className="py-2 px-3 font-semibold text-red-700">{reportData.absentRecords}</td>
              <td className="py-2 px-3 font-bold text-indigo-900">{reportData.attendancePercentage}%</td>
            </tr>
          </tbody>
        </table>

        {/* Scope-based Detailed Print Table */}
        {reportData.scope === 'student' && reportData.studentProfile && (
          <table className="w-full text-xs border border-gray-300 text-left">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.studentProfile.records.map((r) => (
                <tr key={r.date}>
                  <td className="py-1.5 px-3">{r.date}</td>
                  <td className="py-1.5 px-3 text-right font-semibold">{r.status === 'present' ? 'Present' : 'Absent'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {reportData.scope === 'class' && (
          <table className="w-full text-xs border border-gray-300 text-left">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-2 px-3">Roll No</th>
                <th className="py-2 px-3">Student Name</th>
                <th className="py-2 px-3 text-center">Present</th>
                <th className="py-2 px-3 text-center">Absent</th>
                <th className="py-2 px-3 text-right">Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.classStudents.map((st) => (
                <tr key={st.studentId}>
                  <td className="py-1.5 px-3 font-medium">{st.rollNumber}</td>
                  <td className="py-1.5 px-3 font-semibold">{st.fullName}</td>
                  <td className="py-1.5 px-3 text-center">{st.present}</td>
                  <td className="py-1.5 px-3 text-center">{st.absent}</td>
                  <td className="py-1.5 px-3 text-right font-bold">{st.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {reportData.scope === 'all_classes' && (
          <table className="w-full text-xs border border-gray-300 text-left">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-2 px-3">Class</th>
                <th className="py-2 px-3 text-center">Total Students</th>
                <th className="py-2 px-3 text-center">Present</th>
                <th className="py-2 px-3 text-center">Absent</th>
                <th className="py-2 px-3 text-right">Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.classBreakdown.map((c) => (
                <tr key={c.classId}>
                  <td className="py-2 px-3 font-semibold">{c.className}</td>
                  <td className="py-2 px-3 text-center">{c.studentCount}</td>
                  <td className="py-2 px-3 text-center">{c.present}</td>
                  <td className="py-2 px-3 text-center">{c.absent}</td>
                  <td className="py-2 px-3 text-right font-bold">{c.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Footer Seal */}
        <div className="pt-12 flex justify-between text-[11px] text-gray-500">
          <span>Generated by NodeBricks Academic Software</span>
          <span className="border-t border-gray-400 pt-1 px-8">Authorized Signatory</span>
        </div>
      </div>
    </div>
  );
}
