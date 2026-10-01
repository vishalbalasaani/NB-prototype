'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { DataService, CURRENT_DATE } from '@/lib/data-service';
import { AlertTriangle, BarChart3 } from 'lucide-react';

interface AttendanceAnalyticsViewProps {
  user: User;
}

export function AttendanceAnalyticsView({ user }: AttendanceAnalyticsViewProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = DataService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const schoolWeek = DataService.getSchoolWeekAttendance({ referenceDate: CURRENT_DATE });
  const allStudents = DataService.getAllStudents();
  const totalEnrolled = allStudents.length;
  const todayClasses = DataService.getTodayClassesStatus(CURRENT_DATE);
  const historyItems = DataService.getAttendanceHistory({ dateFilter: CURRENT_DATE });

  const totalMarkedPresent = historyItems.reduce(
    (sum, h) => sum + Math.max(0, h.total_students - h.absent_count),
    0
  );
  const totalMarkedAbsent = historyItems.reduce((sum, h) => sum + h.absent_count, 0);
  const totalMarkedStudents = totalMarkedPresent + totalMarkedAbsent;

  const todayPercentage = totalMarkedStudents > 0
    ? Number(((totalMarkedPresent / totalMarkedStudents) * 100).toFixed(1))
    : null;

  const completedClassesCount = todayClasses.filter((c) => c.status === 'completed').length;
  const totalClassesCount = todayClasses.length;

  const lowAttendanceStudents = DataService.getLowAttendanceStudents(75);
  const hasData = totalMarkedStudents > 0 || schoolWeek.hasAnyData;

  return (
    <div className="max-w-5xl mx-auto space-y-7 pb-16 animate-in fade-in duration-150">
      {/* Header */}
      <div className="border-b border-[#E5E2DC] pb-4">
        <span className="text-xs font-medium uppercase tracking-wider text-[#6F6D68]">
          School Attendance
        </span>
        <h1 className="text-2xl font-semibold text-[#20201F] tracking-tight mt-0.5">
          Attendance Analytics
        </h1>
        <p className="text-xs text-[#6F6D68] mt-1">
          Institutional attendance overview, weekly trend, and class breakdown
        </p>
      </div>

      {!hasData ? (
        <div className="py-20 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#F4F1F8] text-[#5B4B8A] flex items-center justify-center mx-auto border border-[#E7E1F2]">
            <BarChart3 className="w-6 h-6 stroke-[1.75]" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-semibold text-[#20201F]">
              No attendance data recorded yet
            </h2>
            <p className="text-xs text-[#6F6D68] leading-relaxed">
              When attendance staff records classroom attendance, metrics and weekly trends will update here automatically.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Top Operational Metrics */}
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 sm:p-6 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wider text-[#6F6D68]">
                  Today&apos;s Attendance
                </span>
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

              {/* Denominator Breakdown */}
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
                  <p className="text-[11px] text-[#6F6D68]">of enrolled</p>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-[#6F6D68] uppercase tracking-wider">
                    Classes
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold text-[#20201F] mt-0.5">
                    {completedClassesCount} <span className="text-sm font-normal text-[#6F6D68]">/ {totalClassesCount}</span>
                  </p>
                  <p className="text-[11px] text-[#6F6D68]">Recorded</p>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Attendance Trend (Monday to Saturday) */}
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div>
              <h2 className="text-base font-semibold text-[#20201F]">
                Attendance Trend
              </h2>
              <p className="text-xs text-[#6F6D68] mt-0.5">
                Monday to Saturday &bull; {schoolWeek.weekLabel}
              </p>
            </div>

            <div className="overflow-x-auto pb-1">
              <div className="min-w-[420px] sm:min-w-0">
                <div className="relative h-60 w-full flex flex-col justify-between">
                  {/* Gridlines */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between pr-2 pb-6">
                    {[100, 75, 50, 25, 0].map((val) => (
                      <div key={val} className="w-full flex items-center gap-2">
                        <span className="w-7 text-[10px] font-mono text-[#A29E96] text-right shrink-0">
                          {val}%
                        </span>
                        <div className="w-full border-b border-[#E5E2DC]/50" />
                      </div>
                    ))}
                  </div>

                  {/* Bars container */}
                  <div className="h-full flex items-end pl-9 pr-2 pb-6 pt-6 gap-3 sm:gap-6 z-10">
                    {schoolWeek.days.map((item) => {
                      const hasDayData = item.hasData && item.percentage !== null;
                      const heightPercent = hasDayData ? Math.max(3, Math.min(100, item.percentage!)) : 0;

                      return (
                        <div
                          key={item.date}
                          className="flex-1 flex flex-col items-center justify-end h-full relative group"
                        >
                          <div className="mb-1 text-center">
                            <span
                              className={`text-xs block tracking-tight font-medium ${
                                hasDayData ? 'text-[#20201F]' : 'text-[#C4C0B8]'
                              }`}
                            >
                              {hasDayData ? `${item.percentage!.toFixed(1)}%` : '—'}
                            </span>
                          </div>

                          <div className="w-full flex items-end justify-center h-full">
                            {hasDayData ? (
                              <div
                                style={{ height: `${heightPercent}%` }}
                                className="w-7 sm:w-11 bg-[#5B4B8A] rounded-t-[3px] transition-all duration-200"
                              />
                            ) : (
                              <div className="w-5 sm:w-8 h-[2px] bg-[#E5E2DC] rounded-full mb-0" />
                            )}
                          </div>

                          {/* Hover Tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-14 bg-[#20201F] text-white text-[11px] px-2.5 py-1.5 rounded-md shadow-lg z-30 whitespace-nowrap transition-opacity duration-150">
                            <p className="font-semibold text-white/95">
                              {item.fullDay}, {item.displayDate}
                            </p>
                            {hasDayData ? (
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

                  {/* X-axis */}
                  <div className="flex items-center pl-9 pr-2 pt-2 border-t border-[#E5E2DC] gap-3 sm:gap-6">
                    {schoolWeek.days.map((item) => (
                      <div key={item.date} className="flex-1 text-center">
                        <span className="text-xs block font-medium text-[#20201F]">
                          {item.day}
                        </span>
                        <span className="text-[10px] text-[#6F6D68] block mt-0.5">
                          {item.displayDate}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Class Attendance Comparison */}
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div>
              <h2 className="text-base font-semibold text-[#20201F]">
                Class Attendance
              </h2>
              <p className="text-xs text-[#6F6D68] mt-0.5">
                Today&apos;s recorded attendance across classes
              </p>
            </div>

            <div className="space-y-4 pt-1">
              {todayClasses.map((item) => {
                const isCompleted = item.status === 'completed';
                const percentage = isCompleted && item.student_count > 0
                  ? Number(((item.present_count / item.student_count) * 100).toFixed(1))
                  : null;

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

                    <div className="w-full h-3 bg-[#F7F6F3] rounded-[2px] overflow-hidden border border-[#E5E2DC]/60 flex items-center">
                      {isCompleted && percentage !== null ? (
                        <div
                          style={{ width: `${percentage}%` }}
                          className="h-full bg-[#5B4B8A] rounded-[2px] transition-all duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center px-2">
                          <div className="w-full border-t border-dashed border-[#E5E2DC]" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#6F6D68]">
                      {isCompleted ? (
                        <span>
                          <strong className="text-[#557A61] font-semibold">{item.present_count}</strong> present &bull;{' '}
                          <strong className={item.absent_count > 0 ? 'text-[#B65C55] font-semibold' : 'text-[#6F6D68]'}>{item.absent_count}</strong> absent
                        </span>
                      ) : (
                        <span>Awaiting attendance submission</span>
                      )}
                      <span className={isCompleted ? 'text-[#557A61] font-medium' : 'text-[#B8874A] font-medium'}>
                        {isCompleted ? 'Recorded' : 'Pending'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Students With Low Attendance */}
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E2DC]/70 pb-3">
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
                  Students below the standard 75% institutional attendance threshold
                </p>
              </div>
            </div>

            {lowAttendanceStudents.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#557A61]">
                No students currently below the 75% attendance threshold.
              </div>
            ) : (
              <div className="space-y-2">
                {lowAttendanceStudents.slice(0, 5).map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#FAF9F7] border border-[#E5E2DC]/70 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[#20201F]">{st.name}</span>
                      <span className="text-[#6F6D68] ml-2">Class {st.class_name}</span>
                      <span className="text-[#A29E96] ml-2">Roll #{st.roll_number}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] text-[#6F6D68]">
                        {st.present_count} of {st.total_days} days
                      </span>
                      <span className="font-bold text-[#B65C55] bg-[#FBF1F0] px-2 py-0.5 rounded border border-[#F3D6D4]">
                        {st.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
