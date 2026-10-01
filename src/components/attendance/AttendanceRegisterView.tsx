'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { User, TodayClassStatus } from '@/types';
import { DataService, CURRENT_DATE } from '@/lib/data-service';
import { Check } from 'lucide-react';
import { ClassAttendanceEntry } from './ClassAttendanceEntry';
import { FullWidthDateRail } from './FullWidthDateRail';

interface AttendanceRegisterViewProps {
  user: User;
  onBackToHome: () => void;
  onOpenHold?: () => void;
  onOpenHistory?: () => void;
}

export function AttendanceRegisterView({
  user,
  onOpenHold,
  onOpenHistory,
}: AttendanceRegisterViewProps) {
  // Active selected date (defaults to today's real school date)
  const [selectedDate, setSelectedDate] = useState<string>(() => DataService.getSchoolTodayDate());
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // All classes status for selected date
  const [allClasses, setAllClasses] = useState<TodayClassStatus[]>(() =>
    DataService.getTodayClassesStatus(DataService.getSchoolTodayDate())
  );

  // Active selected class for entry
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Refresh classes from database
  const refreshClasses = (dateStr: string = selectedDate) => {
    setAllClasses(DataService.getTodayClassesStatus(dateStr));
  };

  // Set of dates that have recorded attendance sessions
  const recordedDates = useMemo(() => {
    const dates = new Set<string>();
    DataService.getAttendanceHistory().forEach((h) => {
      dates.add(h.date);
    });
    DataService.getHoldAttendanceItems().forEach((h) => {
      dates.add(h.date);
    });
    return dates;
  }, [allClasses]);

  // Subscribe to real-time changes
  useEffect(() => {
    const unsubscribe = DataService.subscribe(() => {
      refreshClasses(selectedDate);
    });
    return unsubscribe;
  }, [selectedDate]);

  // When date changes, refresh classes for that date
  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedClassId(null);
    refreshClasses(dateStr);
  };

  // Handle successful attendance recording -> enters History (if 0 absent) or Hold (if >0 absent)
  const handleAttendanceSuccess = (summary?: { absent: number }) => {
    // 1. Refresh database status
    refreshClasses(selectedDate);
    // 2. Clear selected class
    setSelectedClassId(null);
    // 3. Evaluate absent count:
    // If absent === 0: immediately mark as COMPLETED, move to History!
    // If absent > 0: moves to Hold!
    if (summary && summary.absent === 0) {
      if (onOpenHistory) {
        onOpenHistory();
      }
    } else {
      if (onOpenHold) {
        onOpenHold();
      }
    }
  };

  // If a class is currently open for attendance entry
  if (selectedClassId) {
    return (
      <div className="max-w-2xl mx-auto px-2 sm:px-4 pt-2">
        <ClassAttendanceEntry
          user={user}
          classId={selectedClassId}
          selectedDate={selectedDate}
          onBack={() => {
            setSelectedClassId(null);
            refreshClasses(selectedDate);
          }}
          onSuccess={handleAttendanceSuccess}
        />
      </div>
    );
  }

  // CRITICAL RULE: Pending classes only!
  // Completed classes are immediately removed from the pending grid.
  const pendingClasses = allClasses.filter((c) => c.status === 'pending');
  const isAllCompleted = allClasses.length > 0 && pendingClasses.length === 0;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-5 pb-16 px-2 sm:px-4">
      {/* Page Header: Strong readable typography */}
      <div>
        <h1 className="text-2xl sm:text-[28px] lg:text-[30px] font-bold text-[#20201F] tracking-tight leading-tight">
          Take Attendance
        </h1>
        <p className="text-sm sm:text-[15px] text-[#6F6D68] mt-1 font-normal">
          Select a class and mark students who are absent.
        </p>
      </div>

      {/* Date Strip: 12-20px below title */}
      <div className="pt-0.5">
        <FullWidthDateRail
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          recordedDates={recordedDates}
          weekOffset={weekOffset}
          onWeekChange={setWeekOffset}
          mode="attendance"
        />
      </div>

      {/* Class Grid / Queue: 24-32px spacing */}
      {allClasses.length === 0 ? (
        <div className="py-16 text-center max-w-md mx-auto space-y-2">
          <p className="text-sm font-semibold text-[#20201F]">No classes found</p>
          <p className="text-xs text-[#6F6D68]">
            Classes will appear once students are registered in the system.
          </p>
        </div>
      ) : isAllCompleted ? (
        /* ==========================================================
            STATE: ALL CLASSES RECORDED FOR THIS DAY
            Calm, restrained completion state
        ========================================================== */
        <div className="py-16 sm:py-24 text-center max-w-md mx-auto space-y-4 animate-in fade-in duration-200">
          <div className="w-12 h-12 rounded-full bg-[#EFF5F1] text-[#557A61] border border-[#D5E5D9] flex items-center justify-center mx-auto shadow-2xs">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-[#20201F] tracking-tight">
              {selectedDate === DataService.getSchoolTodayDate() ? 'No pending attendance for today' : 'No pending attendance for this date'}
            </h2>
            <p className="text-xs sm:text-sm text-[#6F6D68]">
              All classes have been recorded for {selectedDate === DataService.getSchoolTodayDate() ? 'today' : 'this date'}.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2">
            {onOpenHold && (
              <button
                type="button"
                onClick={onOpenHold}
                className="px-4 py-2 bg-[#5B4B8A] text-white hover:bg-[#4D3F75] text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                Go to Hold
              </button>
            )}
            {onOpenHistory && (
              <button
                type="button"
                onClick={onOpenHistory}
                className="px-4 py-2 bg-[#FFFFFF] border border-[#E5E2DC] hover:border-[#C8C4BD] text-[#20201F] hover:bg-[#F9F8F6] text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                View History
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ==========================================================
            STATE: PENDING CLASSES GRID
            Each class card: Class name, student count, Take Attendance action.
            Completed classes are removed automatically!
        ========================================================== */
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {pendingClasses.map((cls) => (
              <button
                key={cls.class_id}
                type="button"
                onClick={() => setSelectedClassId(cls.class_id)}
                className="bg-[#FFFFFF] border border-[#E5E2DC] hover:border-[#5B4B8A] rounded-xl p-4 sm:p-5 text-left transition-all cursor-pointer flex flex-col justify-between min-h-[110px] group shadow-2xs hover:shadow-xs active:scale-[0.99]"
              >
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-[#20201F] group-hover:text-[#5B4B8A] transition-colors leading-tight truncate">
                    {cls.display_name}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6F6D68] mt-1">
                    {cls.student_count} students
                  </p>
                </div>

                <p className="text-xs text-[#5B4B8A] font-semibold mt-3 group-hover:translate-x-0.5 transition-transform">
                  Take Attendance &rarr;
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
