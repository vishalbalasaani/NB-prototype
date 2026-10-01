'use client';

import React, { useMemo } from 'react';
import { DataService } from '@/lib/data-service';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FullWidthDateRailProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  recordedDates?: Set<string>;
  weekOffset?: number;
  onWeekChange?: (newOffset: number) => void;
  allowFutureWeeks?: boolean;
  mode?: 'attendance' | 'history';
}

/**
 * Compact Horizontal Working-Day Date Strip
 * - Attendance Mode: strictly 5 upcoming valid school days (Today + next 4 working school days, skipping Sundays & holidays)
 * - History Mode: Monday-Saturday working-week navigation with full history access
 * - Selected: #5B4B8A NodeBricks Purple
 */
export function FullWidthDateRail({
  selectedDate,
  onSelectDate,
  recordedDates = new Set(),
  weekOffset = 0,
  onWeekChange,
  allowFutureWeeks = false,
  mode = 'attendance',
}: FullWidthDateRailProps) {
  const todayStr = DataService.getSchoolTodayDate();

  // In Attendance Mode: Strictly 5 upcoming valid school days starting today
  const attendanceDays = useMemo(() => {
    if (mode !== 'attendance') return [];
    return DataService.getUpcomingSchoolDays(5);
  }, [mode, todayStr]);

  // In History Mode: Monday to Saturday week based on weekOffset from today
  const historyWeekDays = useMemo(() => {
    if (mode === 'attendance') return [];
    const [y, m, d] = todayStr.split('-').map(Number);
    const refDate = new Date(y, m - 1, d);
    const dayOfWeek = refDate.getDay();
    // Monday is 1, Sunday is 0
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek) + weekOffset * 7;
    const monday = new Date(refDate);
    monday.setDate(refDate.getDate() + diffToMonday);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const days = [];
    for (let i = 0; i < 6; i++) {
      const curr = new Date(monday);
      curr.setDate(monday.getDate() + i);

      const yr = curr.getFullYear();
      const mo = String(curr.getMonth() + 1).padStart(2, '0');
      const dy = String(curr.getDate()).padStart(2, '0');
      const dStr = `${yr}-${mo}-${dy}`;

      const isToday = dStr === todayStr;
      const isPast = dStr < todayStr;
      const isRecorded = recordedDates.has(dStr);
      const isDisabled = !isRecorded && !isToday && dStr > todayStr;

      days.push({
        date: dStr,
        dayNum: curr.getDate(),
        month: monthNames[curr.getMonth()],
        weekday: dayNames[i],
        isToday,
        isPast,
        isRecorded,
        isDisabled,
      });
    }

    return days;
  }, [mode, weekOffset, recordedDates, todayStr]);

  const canNextWeek = allowFutureWeeks || weekOffset < 0;

  const handlePrev = () => {
    if (onWeekChange) {
      onWeekChange(weekOffset - 1);
    }
  };

  const handleNext = () => {
    if (onWeekChange && canNextWeek) {
      onWeekChange(weekOffset + 1);
    }
  };

  // ==========================================================
  // MODE: ATTENDANCE (5 UPCOMING VALID SCHOOL DAYS ONLY)
  // ==========================================================
  if (mode === 'attendance') {
    return (
      <div className="w-full flex items-center justify-start select-none">
        <div className="inline-flex items-center gap-1 sm:gap-1.5 p-1 bg-[#F9F8F6] border border-[#E5E2DC] rounded-2xl max-w-full overflow-hidden shadow-2xs">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5">
            {attendanceDays.map((d) => {
              const isSelected = d.date === selectedDate;
              const isRecorded = recordedDates.has(d.date);

              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => onSelectDate(d.date)}
                  className={`w-[58px] sm:w-[68px] h-[64px] sm:h-[68px] rounded-xl flex flex-col items-center justify-center shrink-0 transition-all select-none cursor-pointer ${
                    isSelected
                      ? 'bg-[#5B4B8A] text-white shadow-xs font-semibold'
                      : 'bg-[#FFFFFF] text-[#20201F] hover:bg-[#FAF9F7] border border-[#E5E2DC]/80 hover:border-[#C8C5BF]'
                  }`}
                >
                  {/* Weekday */}
                  <span
                    className={`text-[11px] uppercase font-semibold tracking-wider leading-none ${
                      isSelected ? 'text-white/85' : 'text-[#6F6D68]'
                    }`}
                  >
                    {d.weekday}
                  </span>

                  {/* Day Number */}
                  <span
                    className={`text-lg sm:text-xl font-bold leading-tight my-0.5 ${
                      isSelected ? 'text-white' : 'text-[#20201F]'
                    }`}
                  >
                    {d.dayNum}
                  </span>

                  {/* Status Indicator */}
                  {d.isToday ? (
                    <span
                      className={`text-[8.5px] uppercase font-bold tracking-wider px-1 rounded leading-none ${
                        isSelected ? 'bg-white/20 text-white' : 'text-[#5B4B8A]'
                      }`}
                    >
                      TODAY
                    </span>
                  ) : isRecorded ? (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#557A61]'}`}
                      title="Attendance recorded"
                    />
                  ) : (
                    <span
                      className={`text-[9.5px] font-medium leading-none ${
                        isSelected ? 'text-white/70' : 'text-[#8C8880]'
                      }`}
                    >
                      {d.month}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // MODE: HISTORY (FULL HISTORICAL CALENDAR WEEK NAVIGATION)
  // ==========================================================
  return (
    <div className="w-full flex items-center justify-start select-none">
      <div className="inline-flex items-center gap-1 sm:gap-1.5 p-1 bg-[#F9F8F6] border border-[#E5E2DC] rounded-2xl max-w-full overflow-hidden shadow-2xs">
        {onWeekChange && (
          <button
            type="button"
            onClick={handlePrev}
            className="w-8 h-[64px] sm:h-[68px] flex items-center justify-center text-[#6F6D68] hover:text-[#20201F] hover:bg-[#EFECE6] rounded-xl transition-colors cursor-pointer shrink-0"
            title="Previous week"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
          </button>
        )}

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5">
          {historyWeekDays.map((d) => {
            const isSelected = d.date === selectedDate;

            return (
              <button
                key={d.date}
                type="button"
                disabled={d.isDisabled}
                onClick={() => onSelectDate(d.date)}
                className={`w-[58px] sm:w-[68px] h-[64px] sm:h-[68px] rounded-xl flex flex-col items-center justify-center shrink-0 transition-all select-none ${
                  isSelected
                    ? 'bg-[#5B4B8A] text-white shadow-xs font-semibold cursor-pointer'
                    : d.isDisabled
                    ? 'bg-transparent text-[#A8A49C] opacity-45 cursor-not-allowed'
                    : 'bg-[#FFFFFF] text-[#20201F] hover:bg-[#FAF9F7] border border-[#E5E2DC]/80 hover:border-[#C8C5BF] cursor-pointer'
                }`}
              >
                <span
                  className={`text-[11px] uppercase font-semibold tracking-wider leading-none ${
                    isSelected ? 'text-white/85' : d.isDisabled ? 'text-[#A8A49C]' : 'text-[#6F6D68]'
                  }`}
                >
                  {d.weekday}
                </span>

                <span
                  className={`text-lg sm:text-xl font-bold leading-tight my-0.5 ${
                    isSelected ? 'text-white' : d.isDisabled ? 'text-[#A8A49C]' : 'text-[#20201F]'
                  }`}
                >
                  {d.dayNum}
                </span>

                {d.isToday ? (
                  <span
                    className={`text-[8.5px] uppercase font-bold tracking-wider px-1 rounded leading-none ${
                      isSelected ? 'bg-white/20 text-white' : 'text-[#5B4B8A]'
                    }`}
                  >
                    TODAY
                  </span>
                ) : d.isRecorded ? (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#557A61]'}`}
                    title="Attendance recorded"
                  />
                ) : (
                  <span
                    className={`text-[9.5px] font-medium leading-none ${
                      isSelected ? 'text-white/70' : 'text-[#8C8880]'
                    }`}
                  >
                    {d.month}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {onWeekChange && (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canNextWeek}
            className={`w-8 h-[64px] sm:h-[68px] flex items-center justify-center rounded-xl transition-colors shrink-0 ${
              canNextWeek
                ? 'text-[#6F6D68] hover:text-[#20201F] hover:bg-[#EFECE6] cursor-pointer'
                : 'text-[#D0CCC4] opacity-40 cursor-not-allowed'
            }`}
            title="Next week"
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.2]" />
          </button>
        )}
      </div>
    </div>
  );
}
