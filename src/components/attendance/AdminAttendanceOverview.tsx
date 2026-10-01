'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@/types';
import { DataService, CURRENT_DATE } from '@/lib/data-service';
import {
  Calendar,
  Search,
  Filter,
  ChevronDown,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface AdminAttendanceOverviewProps {
  user: User;
  onNavigateTab?: (tab: 'history' | 'reports') => void;
}

export function AdminAttendanceOverview({
  user,
  onNavigateTab,
}: AdminAttendanceOverviewProps) {
  // Subscribe to real-time database updates from DataService
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = DataService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  // Filter state for Attendance Overview (defaults to real current school date)
  const [selectedDate, setSelectedDate] = useState<string>(() => DataService.getSchoolTodayDate());
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [weekOffset, setWeekOffset] = useState<number>(0);

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

  // Mobile tap interaction state for tooltips
  const [activeTooltipDate, setActiveTooltipDate] = useState<string | null>(null);

  // Student Search state
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [searchedStudent, setSearchedStudent] = useState<any | null>(null);

  // Low attendance threshold state (configurable school threshold, default 75%)
  const [attendanceThreshold, setAttendanceThreshold] = useState<number>(75);
  const [showAllLowAttendance, setShowAllLowAttendance] = useState<boolean>(false);

  // 1. Live Data queries from real Supabase
  const classes = DataService.getClasses();
  const allStudents = DataService.getAllStudents();

  // 2. Today's Attendance calculation (Real Database Data)
  const todayClasses = DataService.getTodayClassesStatus(selectedDate);
  const historyItems = DataService.getAttendanceHistory({ dateFilter: selectedDate });

  // Scoped student list if class filter applied
  const scopedStudents = useMemo(() => {
    if (selectedClassId === 'all') return allStudents;
    return allStudents.filter((s) => s.class_id === selectedClassId);
  }, [allStudents, selectedClassId, tick]);

  const totalEnrolled = scopedStudents.length;

  // Filtered today classes based on class selector
  const filteredClassStatuses = useMemo(() => {
    return todayClasses.filter((item) => {
      if (selectedClassId !== 'all' && item.class_id !== selectedClassId) return false;
      return true;
    });
  }, [todayClasses, selectedClassId, tick]);

  const completedClassesCount = filteredClassStatuses.filter((c) => c.status === 'completed').length;
  const totalClassesCount = filteredClassStatuses.length;

  // Filtered history items for calculations
  const filteredHistoryItems = useMemo(() => {
    if (selectedClassId === 'all') return historyItems;
    return historyItems.filter((h) => h.class_id === selectedClassId);
  }, [historyItems, selectedClassId, tick]);

  const totalMarkedPresent = filteredHistoryItems.reduce(
    (sum, h) => sum + Math.max(0, h.total_students - h.absent_count),
    0
  );
  const totalMarkedAbsent = filteredHistoryItems.reduce((sum, h) => sum + h.absent_count, 0);
  const totalMarkedStudents = totalMarkedPresent + totalMarkedAbsent;

  // Canonical percentage: 1 decimal place (e.g. 90.9%)
  const todayPercentage = totalMarkedStudents > 0
    ? Number(((totalMarkedPresent / totalMarkedStudents) * 100).toFixed(1))
    : null;

  // 3. Weekly Attendance Data strictly following Monday-to-Saturday school working week
  const schoolWeek = useMemo(() => {
    return DataService.getSchoolWeekAttendance({
      referenceDate: selectedDate,
      weekOffset,
      classId: selectedClassId,
    });
  }, [selectedDate, weekOffset, selectedClassId, tick]);

  // 4. Student Search Handler
  const searchResults = useMemo(() => {
    if (!studentSearchQuery.trim()) return [];
    return DataService.searchStudentsWithAttendance(studentSearchQuery);
  }, [studentSearchQuery, tick]);

  // 5. Students Needing Attention (Below Configured Threshold)
  const lowAttendanceStudents = useMemo(() => {
    return DataService.getLowAttendanceStudents(attendanceThreshold);
  }, [attendanceThreshold, tick]);

  // Format today's date nicely: "Thursday, 1 October 2026"
  const formattedSelectedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-16">
      {/* ================================================== */}
      {/* 1. TODAY'S ATTENDANCE SUMMARY BLOCK               */}
      {/* ================================================== */}
      <section className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-[#E5E2DC]/70 pb-4">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-[#6F6D68]">
              Attendance Overview
            </span>
            <h1 className="text-base sm:text-lg font-semibold text-[#20201F] tracking-tight mt-0.5">
              {formattedSelectedDate}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-8 px-2.5 text-xs bg-[#FFFFFF] border border-[#E5E2DC] rounded-md text-[#20201F] focus:outline-hidden focus:border-[#5B4B8A]"
            />
            <span className="text-xs text-[#6F6D68]">
              {completedClassesCount} of {totalClassesCount} classes recorded
            </span>
          </div>
        </div>

        {/* Primary Attendance Metric & Honest Denominators */}
        <div className="pt-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="text-xs font-medium text-[#6F6D68] uppercase tracking-wider">
              Today&apos;s Attendance
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-bold text-[#20201F] tracking-tight">
                {todayPercentage !== null ? `${todayPercentage.toFixed(1)}%` : '—'}
              </span>
              {totalMarkedStudents > 0 && (
                <span className="text-xs font-medium text-[#6F6D68]">
                  {totalMarkedPresent} Present &bull; {totalMarkedAbsent} Absent
                </span>
              )}
            </div>
          </div>

          {/* Clear Operational Denominators (Fixes 20 + 2 != 66 confusion) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t md:border-t-0 md:border-l border-[#E5E2DC] pt-4 md:pt-0 md:pl-6">
            <div>
              <p className="text-[11px] font-medium text-[#6F6D68] uppercase tracking-wider">
                Present
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-[#557A61] mt-0.5">
                {totalMarkedPresent.toLocaleString()}
              </p>
              <p className="text-[11px] text-[#6F6D68]">Students</p>
            </div>

            <div>
              <p className="text-[11px] font-medium text-[#6F6D68] uppercase tracking-wider">
                Absent
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-[#B65C55] mt-0.5">
                {totalMarkedAbsent.toLocaleString()}
              </p>
              <p className="text-[11px] text-[#6F6D68]">Students</p>
            </div>

            <div>
              <p className="text-[11px] font-medium text-[#6F6D68] uppercase tracking-wider">
                Recorded
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-[#20201F] mt-0.5">
                {totalMarkedStudents} <span className="text-sm font-normal text-[#6F6D68]">/ {totalEnrolled}</span>
              </p>
              <p className="text-[11px] text-[#6F6D68]">of enrolled students</p>
            </div>

            <div>
              <p className="text-[11px] font-medium text-[#6F6D68] uppercase tracking-wider">
                Classes
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-[#20201F] mt-0.5">
                {completedClassesCount} <span className="text-sm font-normal text-[#6F6D68]">/ {totalClassesCount}</span>
              </p>
              <p className="text-[11px] text-[#6F6D68]">Classes recorded</p>
            </div>
          </div>
        </div>

        {totalClassesCount > 0 && completedClassesCount < totalClassesCount && (
          <div className="mt-4 pt-3 border-t border-[#E5E2DC]/60 text-xs text-[#B8874A] flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0" />
            <span>
              {completedClassesCount === 0
                ? 'No attendance recorded yet.'
                : `Partial attendance recorded (${completedClassesCount} of ${totalClassesCount} classes). Percentage reflects recorded students only.`}
            </span>
          </div>
        )}
      </section>

      {/* ================================================== */}
      {/* 2. ATTENDANCE TREND (MONDAY → SATURDAY)            */}
      {/* ================================================== */}
      <section className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 sm:p-6 shadow-2xs">
        {/* Header with Title, Subtitle, and Week Switcher Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-semibold text-[#20201F]">
              Attendance Trend
            </h2>
            <p className="text-xs text-[#6F6D68] mt-0.5">
              Monday to Saturday &bull; {schoolWeek.weekLabel}
            </p>
          </div>

          {/* Previous / Current / Next week controls */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              onClick={() => {
                setWeekOffset((w) => w - 1);
                setActiveTooltipDate(null);
              }}
              className="px-2.5 py-1 text-xs font-medium text-[#20201F] bg-[#FAF9F7] hover:bg-[#F2EFE9] border border-[#E5E2DC] rounded transition-colors cursor-pointer"
              title="Previous week"
            >
              &larr; Previous week
            </button>

            {weekOffset !== 0 && (
              <button
                onClick={() => {
                  setWeekOffset(0);
                  setActiveTooltipDate(null);
                }}
                className="px-2.5 py-1 text-xs font-medium text-[#5B4B8A] bg-[#F4F1F8] hover:bg-[#EBE5F5] border border-[#E7E1F2] rounded transition-colors cursor-pointer"
              >
                Current week
              </button>
            )}

            <button
              onClick={() => {
                setWeekOffset((w) => Math.min(0, w + 1));
                setActiveTooltipDate(null);
              }}
              disabled={weekOffset >= 0}
              className={`px-2.5 py-1 text-xs font-medium border rounded transition-colors ${
                weekOffset >= 0
                  ? 'text-[#C4C0B8] border-[#E5E2DC]/50 bg-[#FAF9F7]/50 cursor-not-allowed'
                  : 'text-[#20201F] bg-[#FAF9F7] hover:bg-[#F2EFE9] border-[#E5E2DC] cursor-pointer'
              }`}
              title="Next week"
            >
              Next week &rarr;
            </button>
          </div>
        </div>

        {/* Chart or Calm Empty State */}
        {!schoolWeek.hasAnyData ? (
          <div className="h-56 flex flex-col items-center justify-center text-center p-6 bg-[#FAF9F7]/60 rounded-lg border border-[#E5E2DC]/60">
            <p className="text-sm font-semibold text-[#20201F]">
              No attendance recorded for this period.
            </p>
            <p className="text-xs text-[#6F6D68] mt-1 max-w-sm">
              Attendance staff has not submitted records for this working week.
            </p>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="mt-3 text-xs font-semibold text-[#5B4B8A] hover:underline cursor-pointer"
              >
                Return to current week
              </button>
            )}
          </div>
        ) : (
          <div className="pt-2">
            {/* Horizontally scrollable container on narrow mobile without page overflow */}
            <div className="overflow-x-auto pb-1">
              <div className="min-w-[420px] sm:min-w-0">
                {/* Chart container with exact height and scale */}
                <div className="relative w-full">
                  {/* Grid Lines Area: Exact height 210px */}
                  <div className="relative h-[210px] w-full">
                    {/* Horizontal gridlines at 100%, 75%, 50%, 25%, 0% */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between pr-2">
                      {[100, 75, 50, 25, 0].map((val) => (
                        <div key={val} className="w-full flex items-center gap-2">
                          <span className="w-7 text-[10px] font-mono text-[#A29E96] text-right shrink-0">
                            {val}%
                          </span>
                          <div className={`w-full border-b ${val === 0 ? 'border-[#E5E2DC]' : 'border-[#E5E2DC]/50 border-dashed'}`} />
                        </div>
                      ))}
                    </div>

                    {/* Bars Container: Exactly occupies 0% to 100% of the grid height */}
                    <div className="absolute inset-0 pl-9 pr-2 flex items-end gap-3 sm:gap-6 z-10 pointer-events-none">
                      {schoolWeek.days.map((item, idx) => {
                        const hasData = item.hasData && item.percentage !== null;
                        const isToday = item.date === CURRENT_DATE;
                        const isSelected = item.date === selectedDate;
                        // Bar percentage mapped directly to 0-100% of chart height
                        const pctValue = hasData ? Math.max(0, Math.min(100, item.percentage!)) : 0;
                        const barHeight = isAnimated ? pctValue : 0;
                        const showTooltip = activeTooltipDate === item.date;

                        return (
                          <div
                            key={item.date}
                            className="flex-1 flex flex-col items-center justify-end h-full relative pointer-events-auto group cursor-pointer"
                            onClick={() => {
                              setActiveTooltipDate((prev) => (prev === item.date ? null : item.date));
                              if (item.hasData) {
                                setSelectedDate(item.date);
                              }
                            }}
                          >
                            {/* Value label directly above bar or at baseline for empty days */}
                            {hasData ? (
                              <div
                                style={{
                                  bottom: `${barHeight}%`,
                                  opacity: isAnimated ? 1 : 0,
                                  transition: `bottom 500ms cubic-bezier(0.16, 1, 0.3, 1) ${idx * 50}ms, opacity 300ms ease-out ${idx * 50}ms`,
                                }}
                                className="absolute mb-1 text-center whitespace-nowrap pointer-events-none"
                              >
                                <span
                                  className={`text-xs font-semibold ${
                                    isToday
                                      ? 'text-[#5B4B8A]'
                                      : 'text-[#20201F]'
                                  }`}
                                >
                                  {item.percentage!.toFixed(1)}%
                                </span>
                              </div>
                            ) : (
                              <div className="absolute bottom-1 text-center pointer-events-none">
                                <span className="text-xs font-medium text-[#A29E96]">
                                  —
                                </span>
                              </div>
                            )}

                            {/* Solid Bar (NO ghost containers; empty space for no-data days) */}
                            {hasData ? (
                              <div
                                style={{
                                  height: `${barHeight}%`,
                                  transition: `height 550ms cubic-bezier(0.16, 1, 0.3, 1) ${idx * 50}ms`,
                                }}
                                className={`w-7 sm:w-11 rounded-t-[3px] ${
                                  isToday
                                    ? 'bg-[#5B4B8A]'
                                    : isSelected
                                    ? 'bg-[#5B4B8A]'
                                    : 'bg-[#7D6FA4] hover:bg-[#5B4B8A]'
                                }`}
                              />
                            ) : null}

                            {/* Professional Tooltip (Desktop Hover & Mobile Tap) */}
                            <div
                              className={`pointer-events-none absolute -top-14 bg-[#20201F] text-white text-[11px] px-2.5 py-1.5 rounded-md shadow-lg z-30 whitespace-nowrap transition-opacity duration-150 ${
                                showTooltip
                                  ? 'opacity-100'
                                  : 'opacity-0 group-hover:opacity-100'
                              }`}
                            >
                              <p className="font-semibold text-white/95">
                                {item.fullDay}, {item.displayDate}
                              </p>
                              {hasData ? (
                                <p className="text-white/80 mt-0.5">
                                  Attendance: <span className="text-[#A594D0] font-medium">{item.percentage!.toFixed(1)}%</span> &bull; {item.present} Present &bull; {item.absent} Absent
                                </p>
                              ) : (
                                <p className="text-white/60 mt-0.5">
                                  {item.isFuture ? 'Future school day' : 'No attendance recorded'}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* X-axis Day and Date Labels */}
                  <div className="flex items-center pl-9 pr-2 pt-2.5 border-t border-[#E5E2DC] gap-3 sm:gap-6 mt-0.5">
                    {schoolWeek.days.map((item) => {
                      const isToday = item.date === CURRENT_DATE;
                      const isSelected = item.date === selectedDate;
                      return (
                        <div key={item.date} className="flex-1 text-center">
                          <span
                            className={`text-xs block ${
                              isToday
                                ? 'font-bold text-[#5B4B8A]'
                                : isSelected
                                ? 'font-semibold text-[#20201F]'
                                : 'font-medium text-[#6F6D68]'
                            }`}
                          >
                            {item.day}
                          </span>
                          <span
                            className={`text-[10px] block mt-0.5 ${
                              isToday ? 'font-medium text-[#5B4B8A]' : 'text-[#6F6D68]'
                            }`}
                          >
                            {item.displayDate}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ================================================== */}
      {/* 3. CLASS ATTENDANCE (HORIZONTAL BARS)              */}
      {/* ================================================== */}
      <section className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E2DC]/70 pb-4">
          <div>
            <h2 className="text-base font-semibold text-[#20201F]">
              Class Attendance
            </h2>
            <p className="text-xs text-[#6F6D68] mt-0.5">
              Section-wise attendance recorded for {formattedSelectedDate}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Class filter selector */}
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="h-8 px-2.5 pr-7 text-xs bg-[#FFFFFF] border border-[#E5E2DC] rounded-md text-[#20201F] focus:outline-hidden focus:border-[#5B4B8A] appearance-none cursor-pointer"
              >
                <option value="all">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#6F6D68] absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('reports')}
                className="text-xs text-[#5B4B8A] hover:text-[#433665] font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>Full Reports</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Clean Horizontal Bar Chart for Class Comparison */}
        <div className="space-y-4">
          {filteredClassStatuses.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#6F6D68]">
              No classes found matching the selected filter.
            </div>
          ) : (
            filteredClassStatuses.map((item, idx) => {
              const isCompleted = item.status === 'completed';
              const percentage = isCompleted && item.student_count > 0
                ? Number(((item.present_count / item.student_count) * 100).toFixed(1))
                : null;
              const barWidth = isAnimated && percentage !== null ? percentage : 0;

              return (
                <div key={item.class_id || item.display_name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#20201F]">
                        {item.display_name}
                      </span>
                      <span className="text-[#6F6D68]">
                        ({item.student_count} enrolled)
                      </span>
                    </div>

                    <div>
                      {isCompleted && percentage !== null ? (
                        <span className="font-semibold text-[#20201F]">
                          {percentage.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-xs text-[#6F6D68] font-medium">
                          Not recorded
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Horizontal Bar track */}
                  <div className="w-full h-3 bg-[#F7F6F3] rounded-[2px] overflow-hidden border border-[#E5E2DC]/60 flex items-center">
                    {isCompleted && percentage !== null ? (
                      <div
                        style={{
                          width: `${barWidth}%`,
                          transition: `width 500ms cubic-bezier(0.16, 1, 0.3, 1) ${idx * 40}ms`,
                        }}
                        className="h-full bg-[#5B4B8A] rounded-[2px]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center px-2">
                        <div className="w-full border-t border-dashed border-[#E5E2DC]" />
                      </div>
                    )}
                  </div>

                  {/* Sub-details */}
                  <div className="flex items-center justify-between text-[11px] text-[#6F6D68]">
                    {isCompleted ? (
                      <>
                        <span>
                          <strong className="text-[#557A61] font-semibold">{item.present_count}</strong> present &bull;{' '}
                          <strong className={item.absent_count > 0 ? 'text-[#B65C55] font-semibold' : 'text-[#6F6D68]'}>{item.absent_count}</strong> absent
                        </span>
                        <div className="text-right">
                          {item.notification_status === 'sent' || item.absent_count === 0 ? (
                            <span className="text-[#557A61] font-semibold">Completed</span>
                          ) : (
                            <span className="text-[#5B4B8A] font-semibold">Hold &bull; Awaiting parent notification</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <span>Awaiting attendance submission</span>
                        <span className="text-[#B8874A] font-medium">Pending</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ================================================== */}
      {/* 4. STUDENTS NEEDING ATTENTION                      */}
      {/* ================================================== */}
      <section className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E2DC]/70 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#20201F]">
                Students needing attention
              </h2>
              <span className="text-[11px] font-medium text-[#B65C55] bg-[#FBF1F0] px-2 py-0.5 rounded-full border border-[#F3D6D4]">
                {lowAttendanceStudents.length} Students
              </span>
            </div>
            <p className="text-xs text-[#6F6D68] mt-0.5">
              Students below the school&apos;s configured threshold of {attendanceThreshold}%
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Threshold selector */}
            <div className="flex items-center gap-1.5 text-xs text-[#6F6D68]">
              <span>Threshold:</span>
              <select
                value={attendanceThreshold}
                onChange={(e) => setAttendanceThreshold(Number(e.target.value))}
                className="h-7 px-2 text-xs bg-[#FFFFFF] border border-[#E5E2DC] rounded text-[#20201F] focus:outline-hidden focus:border-[#5B4B8A] cursor-pointer"
              >
                <option value={70}>Below 70%</option>
                <option value={75}>Below 75% (Standard)</option>
                <option value={80}>Below 80%</option>
                <option value={85}>Below 85%</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick student attendance search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#6F6D68] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={studentSearchQuery}
            onChange={(e) => {
              setStudentSearchQuery(e.target.value);
              setSearchedStudent(null);
            }}
            placeholder="Search student name or roll number to check individual attendance history..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-[#FFFFFF] border border-[#E5E2DC] rounded-md text-[#20201F] placeholder:text-[#8C887B] focus:outline-hidden focus:border-[#5B4B8A]"
          />
        </div>

        {/* Live student search result if query active */}
        {studentSearchQuery.trim() && !searchedStudent && (
          <div className="border border-[#E5E2DC] rounded-lg divide-y divide-[#E5E2DC]/60 max-h-48 overflow-y-auto bg-[#FAF9F7]">
            {searchResults.length === 0 ? (
              <div className="p-3 text-xs text-[#6F6D68] text-center">
                No students found matching &quot;{studentSearchQuery}&quot;
              </div>
            ) : (
              searchResults.map((res) => (
                <button
                  key={res.student.id}
                  onClick={() => setSearchedStudent(res)}
                  className="w-full p-2.5 text-left hover:bg-[#FFFFFF] flex items-center justify-between text-xs transition-colors cursor-pointer"
                >
                  <div>
                    <span className="font-semibold text-[#20201F]">{res.student.full_name}</span>
                    <span className="text-[#6F6D68] ml-2">Class {res.class_name} &bull; Roll #{res.student.roll_number}</span>
                  </div>
                  <span className="font-semibold text-[#5B4B8A]">{res.percentage}%</span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Searched student preview if selected */}
        {searchedStudent && (
          <div className="bg-[#FAF9F7] border border-[#E5E2DC] rounded-lg p-3.5 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#20201F] text-sm">{searchedStudent.student.full_name}</span>
                <span className="text-[#6F6D68] ml-2">Class {searchedStudent.class_name} &bull; Roll #{searchedStudent.student.roll_number}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm text-[#20201F]">{searchedStudent.percentage}%</span>
                <button
                  onClick={() => setSearchedStudent(null)}
                  className="text-[#6F6D68] hover:text-[#20201F] underline text-[11px] cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[#6F6D68]">
              {searchedStudent.present_count} present &bull; {searchedStudent.absent_count} absent across {searchedStudent.total_days} recorded days
            </p>
          </div>
        )}

        {/* At-risk student list */}
        {lowAttendanceStudents.length === 0 ? (
          <div className="py-4 text-center text-xs text-[#557A61]">
            No students currently below the {attendanceThreshold}% threshold.
          </div>
        ) : (
          <div className="space-y-2">
            {(showAllLowAttendance ? lowAttendanceStudents : lowAttendanceStudents.slice(0, 4)).map((st) => (
              <div
                key={st.id}
                className="flex items-center justify-between p-3 rounded-lg bg-[#FAF9F7] border border-[#E5E2DC]/70 text-xs"
              >
                <div>
                  <span className="font-semibold text-[#20201F]">{st.name}</span>
                  <span className="text-[#6F6D68] ml-2">Class {st.class_name}</span>
                  <span className="text-[#A29E96] ml-2 hidden sm:inline">
                    Roll #{st.roll_number}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[11px] text-[#6F6D68] hidden md:inline">
                    {st.present_count} of {st.total_days} days
                  </span>
                  <span className="font-bold text-[#B65C55] bg-[#FBF1F0] px-2 py-0.5 rounded border border-[#F3D6D4]">
                    {st.percentage}%
                  </span>
                </div>
              </div>
            ))}

            {lowAttendanceStudents.length > 4 && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => setShowAllLowAttendance(!showAllLowAttendance)}
                  className="text-xs font-medium text-[#5B4B8A] hover:text-[#433665] cursor-pointer"
                >
                  {showAllLowAttendance
                    ? 'Show less'
                    : `View all (${lowAttendanceStudents.length} students)`}
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
