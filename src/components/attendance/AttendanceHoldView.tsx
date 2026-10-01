'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { User, AttendanceHistoryItem, Student } from '@/types';
import { DataService, CURRENT_DATE } from '@/lib/data-service';
import { ArrowLeft, Check, Loader2, Search } from 'lucide-react';
import { FullWidthDateRail } from './FullWidthDateRail';
import { playSuccessChime } from '@/lib/audio';

interface AttendanceHoldViewProps {
  user: User;
  onNavigateToHistory: () => void;
}

function formatDisplayDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function AttendanceHoldView({
  user,
  onNavigateToHistory,
}: AttendanceHoldViewProps) {
  const [tick, setTick] = useState(0);

  // Subscribe to real-time changes
  useEffect(() => {
    const unsubscribe = DataService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  // Selected date (defaults to today's real school date)
  const [selectedDate, setSelectedDate] = useState<string>(() => DataService.getSchoolTodayDate());
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Active detail view for a specific class record in Hold
  const [activeRecord, setActiveRecord] = useState<AttendanceHistoryItem | null>(null);

  // Search query for student list inside Hold detail view
  const [searchQuery, setSearchQuery] = useState('');

  // Sending state, success animation state, and error handling
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessCount, setSendSuccessCount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Toggle student absent/present correction state
  const [isSavingCorrection, setIsSavingCorrection] = useState(false);

  // Query Hold items for selected date (Only active Hold: confirmed, absent > 0, notifications pending)
  const holdItems = useMemo(() => {
    return DataService.getHoldAttendanceItems({ dateFilter: selectedDate });
  }, [selectedDate, tick]);

  // Sync active record with latest data
  useEffect(() => {
    if (activeRecord) {
      const refreshed = DataService.getHoldAttendanceItems({ dateFilter: activeRecord.date }).find(
        (i) => i.id === activeRecord.id || i.session_id === activeRecord.session_id
      );
      if (refreshed) {
        setActiveRecord(refreshed);
      }
    }
  }, [tick]);

  // Set of dates that have recorded attendance sessions
  const recordedDates = useMemo(() => {
    const dates = new Set<string>();
    DataService.getAttendanceHistory().forEach((h) => dates.add(h.date));
    DataService.getHoldAttendanceItems().forEach((h) => dates.add(h.date));
    return dates;
  }, [tick]);

  // Send to parents action handler
  const handleSendToParents = async () => {
    if (!activeRecord || isSending || activeRecord.absent_count === 0) return;

    setIsSending(true);
    setErrorMessage(null);

    const res = await DataService.sendSessionParentNotifications({
      sessionId: activeRecord.session_id,
      classId: activeRecord.class_id,
      date: activeRecord.date,
    });

    setIsSending(false);

    if (res.success) {
      const count = res.notifiedCount || activeRecord.absent_count;
      // 1. Play subtle audio confirmation
      playSuccessChime();

      // 2. Trigger restrained professional success animation
      setSendSuccessCount(count);

      // 3. After 1.8 seconds, automatically transition to History
      setTimeout(() => {
        setSendSuccessCount(null);
        setActiveRecord(null);
        onNavigateToHistory();
      }, 1800);
    } else {
      // Human-readable partial error message without technical exposure
      setErrorMessage(
        res.error ||
          `${
            activeRecord.absent_count === 1
              ? '1 parent'
              : `${activeRecord.absent_count} parents`
          } could not be notified. Review and try again.`
      );
    }
  };

  // Toggle student attendance in Hold (checked = absent, unchecked = present)
  const handleToggleStudent = async (studentId: string) => {
    if (!activeRecord || isSavingCorrection || isSending) return;
    setIsSavingCorrection(true);
    setErrorMessage(null);

    const currentAbsentIds = activeRecord.absent_students.map((s) => s.student_id);
    const newAbsentIds = currentAbsentIds.includes(studentId)
      ? currentAbsentIds.filter((id) => id !== studentId)
      : [...currentAbsentIds, studentId];

    const saveRes = await DataService.saveAttendance({
      classId: activeRecord.class_id,
      sectionId: activeRecord.section_id,
      date: activeRecord.date,
      absentStudentIds: newAbsentIds,
      userId: user.id,
    });

    setIsSavingCorrection(false);

    if (saveRes.success) {
      // REQUIREMENT 5 & 15: If staff changes absent students to 0:
      // "At this point:
      //  - Remove Class from Hold
      //  - Do not show Send to Parents
      //  - Mark attendance Completed
      //  - Move it to History
      //  - Save the updated attendance records to Supabase
      //  There should never be a Hold record with 0 absentees."
      if (newAbsentIds.length === 0) {
        playSuccessChime();
        setActiveRecord(null);
        onNavigateToHistory();
        return;
      }

      // Re-fetch updated record
      const refreshed = DataService.getHoldAttendanceItems({ dateFilter: activeRecord.date }).find(
        (i) => i.id === activeRecord.id || i.session_id === activeRecord.session_id
      );
      if (refreshed) {
        setActiveRecord(refreshed);
      }
    } else {
      setErrorMessage('Could not update attendance. Please try again.');
    }
  };

  // ==========================================================
  // VIEW: HOLD CLASS DETAIL (REVIEW, EDIT CHECKBOXES & SEND TO PARENTS)
  // ==========================================================
  if (activeRecord) {
    const classStudents: Student[] = activeRecord.class_id
      ? DataService.getStudentsByClass(activeRecord.class_id)
      : [];

    const absentStudentIds = new Set(activeRecord.absent_students.map((s) => s.student_id));

    const filteredStudents = classStudents.filter((s) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        s.full_name.toLowerCase().includes(q) ||
        s.roll_number.toLowerCase().includes(q)
      );
    });

    return (
      <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-5 pb-20 px-3 sm:px-4 animate-in fade-in duration-150">
        {/* Header with single unboxed back arrow beside title */}
        <div className="border-b border-[#E5E2DC] pb-4 flex items-start gap-2">
          <button
            onClick={() => {
              setActiveRecord(null);
              setErrorMessage(null);
              setSearchQuery('');
            }}
            className="p-2 -ml-2 text-[#20201F] hover:text-[#5B4B8A] transition-colors cursor-pointer flex items-center justify-center shrink-0 mt-0.5"
            title="Go back to Hold"
            aria-label="Go back to Hold"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#20201F] tracking-tight">
              {activeRecord.display_name}
            </h1>
            <p className="text-xs text-[#6F6D68] mt-0.5">
              {formatDisplayDate(activeRecord.date)}
            </p>
          </div>
        </div>

        {/* Success Modal / Banner */}
        {sendSuccessCount !== null ? (
          <div className="py-8 bg-[#EFF5F1] border border-[#D5E5D9] rounded-xl text-center space-y-3 animate-in zoom-in-95 fade-in duration-300">
            <div className="w-12 h-12 rounded-full bg-[#557A61] text-white flex items-center justify-center mx-auto shadow-2xs animate-in zoom-in-75 duration-400">
              <Check className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-base font-semibold text-[#20201F]">
                Attendance alerts sent
              </h2>
              <p className="text-xs text-[#557A61] font-medium">
                {sendSuccessCount === 1
                  ? '1 parent has been notified.'
                  : `${sendSuccessCount} parents have been notified.`}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Top Calm Hold Message (Requirement 3 & 7) */}
            <div className="bg-[#FAF9F7] border border-[#E5E2DC] rounded-xl p-4 sm:p-5 shadow-2xs space-y-1">
              <h2 className="text-lg sm:text-xl font-semibold text-[#20201F] tracking-tight">
                Attendance is on hold
              </h2>
              <p className="text-xs sm:text-sm text-[#6F6D68]">
                {errorMessage ||
                  'Review the absent students below before sending attendance alerts to parents.'}
              </p>
            </div>

            {/* Summary Card */}
            <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between text-xs text-[#6F6D68] border-b border-[#E5E2DC] pb-2">
                <span>Total students</span>
                <span className="font-semibold text-[#20201F]">
                  {activeRecord.total_students}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#6F6D68] border-b border-[#E5E2DC] pb-2">
                <span>Present</span>
                <span className="font-semibold text-[#557A61]">
                  {activeRecord.present_count}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#6F6D68] border-b border-[#E5E2DC] pb-2">
                <span>Absent</span>
                <span
                  className={`font-semibold ${
                    activeRecord.absent_count > 0 ? 'text-[#B65C55]' : 'text-[#20201F]'
                  }`}
                >
                  {activeRecord.absent_count}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#6F6D68]">
                <span>Status</span>
                <span className="text-[#5B4B8A] font-semibold text-xs bg-[#F0EDF6] px-2 py-0.5 rounded-md">
                  Hold
                </span>
              </div>
            </div>

            {/* Student Attendance List with Checkbox Interaction (Requirement 4) */}
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8B85]" />
                <input
                  type="text"
                  placeholder="Search student or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg focus:outline-none focus:border-[#5B4B8A] transition-colors"
                />
              </div>

              {/* Student Rows matching ClassAttendanceEntry */}
              <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl divide-y divide-[#E5E2DC] overflow-hidden shadow-2xs">
                {filteredStudents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#6F6D68]">
                    No students found matching &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  filteredStudents.map((student) => {
                    const isAbsent = absentStudentIds.has(student.id);

                    return (
                      <div
                        key={student.id}
                        onClick={() => handleToggleStudent(student.id)}
                        className={`flex items-center gap-3.5 px-4 py-3 transition-colors cursor-pointer select-none ${
                          isAbsent ? 'bg-[#FAF3F2]' : 'hover:bg-[#FDFCFB]'
                        }`}
                      >
                        {/* Checkbox: □ when present, ✓ when absent */}
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                            isAbsent
                              ? 'border-[#B65C55] bg-[#B65C55] text-white'
                              : 'border-[#C8C5BF] bg-[#FFFFFF]'
                          }`}
                        >
                          {isAbsent && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        {/* Student Name & Roll Number */}
                        <div className="flex-1 min-w-0">
                          <span
                            className={`text-xs sm:text-sm font-medium block truncate ${
                              isAbsent
                                ? 'text-[#B65C55] font-semibold'
                                : 'text-[#20201F]'
                            }`}
                          >
                            {student.full_name}
                          </span>
                          <span className="text-[11px] text-[#6F6D68] block mt-0.5 font-mono">
                            Roll {student.roll_number}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* SEND TO PARENTS ACTION BAR (Requirements 5 & 6) */}
            {activeRecord.absent_count > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSendToParents}
                  disabled={isSending || isSavingCorrection}
                  className="w-full h-11 rounded-xl bg-[#5B4B8A] hover:bg-[#4D3F75] active:bg-[#433668] text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs hover:shadow-xs flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Sending alerts...</span>
                    </>
                  ) : (
                    <span>Send to Parents</span>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ==========================================================
  // VIEW: HOLD LIST (CLASSES WITH UNNOTIFIED ABSENTEES)
  // ==========================================================
  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-5 pb-16 px-2 sm:px-4 animate-in fade-in duration-150">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-[28px] lg:text-[30px] font-bold text-[#20201F] tracking-tight leading-tight">
          Hold
        </h1>
        <p className="text-sm sm:text-[15px] text-[#6F6D68] mt-1 font-normal">
          Review recorded attendance and send parent notifications.
        </p>
      </div>

      {/* Date Rail */}
      <div className="pt-0.5">
        <FullWidthDateRail
          selectedDate={selectedDate}
          onSelectDate={(d) => {
            setSelectedDate(d);
            setActiveRecord(null);
          }}
          recordedDates={recordedDates}
          weekOffset={weekOffset}
          onWeekChange={setWeekOffset}
          mode="history"
        />
      </div>

      {/* Hold Class Cards (Requirements 14) */}
      {holdItems.length === 0 ? (
        <div className="py-16 text-center max-w-md mx-auto space-y-2">
          <p className="text-sm font-semibold text-[#20201F]">No classes in hold</p>
          <p className="text-xs text-[#6F6D68]">
            Attendance with absent students awaiting parent notification will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {holdItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveRecord(item);
                setErrorMessage(null);
                setSendSuccessCount(null);
                setSearchQuery('');
              }}
              className="bg-[#FFFFFF] border border-[#E5E2DC] hover:border-[#5B4B8A] rounded-xl p-4 sm:p-5 text-left transition-all cursor-pointer flex flex-col justify-between min-h-[120px] group shadow-2xs hover:shadow-xs active:scale-[0.99]"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-[#20201F] group-hover:text-[#5B4B8A] transition-colors leading-tight truncate">
                    {item.display_name}
                  </h3>
                  <span className="text-[11px] font-semibold text-[#5B4B8A] bg-[#F0EDF6] px-2 py-0.5 rounded-md shrink-0">
                    Hold
                  </span>
                </div>
                <p className="text-xs text-[#6F6D68] mt-1.5">
                  {item.total_students} students
                </p>
                <p className="text-xs text-[#20201F] font-medium mt-1">
                  {item.present_count} present &bull;{' '}
                  <span
                    className={
                      item.absent_count > 0 ? 'text-[#B65C55]' : 'text-[#6F6D68]'
                    }
                  >
                    {item.absent_count} absent
                  </span>
                </p>
              </div>

              <div className="mt-4 pt-2 border-t border-[#E5E2DC]/60 flex items-center justify-between text-xs">
                <span className="text-[#5B4B8A] font-semibold group-hover:translate-x-0.5 transition-transform">
                  Review &amp; Send &rarr;
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
