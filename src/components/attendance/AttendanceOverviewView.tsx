'use client';

import React from 'react';
import { User, TodayClassStatus } from '@/types';
import { DataService, CURRENT_DATE } from '@/lib/data-service';
import { CheckCircle2, Clock, TrendingUp, ArrowRight } from 'lucide-react';

interface AttendanceOverviewViewProps {
  user: User;
  onNavigateToTab?: (tab: 'reports') => void;
}

export function AttendanceOverviewView({
  onNavigateToTab,
}: AttendanceOverviewViewProps) {
  const analytics = DataService.getAnalyticsSummary();
  const todayClasses = DataService.getTodayClassesStatus(DataService.getSchoolTodayDate());

  const completedCount = todayClasses.filter((c) => c.status === 'completed').length;
  const totalClassesCount = todayClasses.length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Overview Sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E5E2DC] pb-4">
        <div>
          <h2 className="text-xl font-semibold text-[#20201F] tracking-tight">
            Attendance Overview
          </h2>
          <p className="text-xs text-[#6F6D68] mt-0.5">
            Daily institutional tracking &bull; {DataService.formatDisplayDate(DataService.getSchoolTodayDate())} &bull; {DataService.getCurrentSchool()?.name || 'NodeBricks Academy'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#EFF5F1] text-[#557A61] font-medium border border-[#D5E5D9]">
            {completedCount} of {totalClassesCount} Classes Completed
          </span>
        </div>
      </div>

      {/* 3 Metric Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#6F6D68]">
              Overall Attendance
            </span>
            <TrendingUp className="w-4 h-4 text-[#557A61]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-[#20201F] tracking-tight">
              {analytics.overall_percentage}%
            </span>
            <span className="text-xs font-medium text-[#557A61]">+0.8% vs last week</span>
          </div>
          <p className="text-xs text-[#6F6D68] mt-1">Across all active grades</p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 shadow-2xs">
          <span className="text-xs font-medium uppercase tracking-wider text-[#6F6D68]">
            Present Today
          </span>
          <div className="mt-2">
            <span className="text-3xl font-semibold text-[#20201F] tracking-tight">
              {analytics.present_today.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-[#6F6D68] mt-1">Students marked present</p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 shadow-2xs">
          <span className="text-xs font-medium uppercase tracking-wider text-[#6F6D68]">
            Absent Today
          </span>
          <div className="mt-2">
            <span className="text-3xl font-semibold text-[#B65C55] tracking-tight">
              {analytics.absent_today}
            </span>
          </div>
          <p className="text-xs text-[#6F6D68] mt-1">Absence alerts sent to parents</p>
        </div>
      </div>

      {/* Middle Row: Trend Bar Chart + Class Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Bar Chart */}
        <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-[#20201F]">Weekly Trend</h3>
              <p className="text-xs text-[#6F6D68]">Daily attendance rate comparison</p>
            </div>
            <button
              onClick={() => onNavigateToTab?.('reports')}
              className="text-xs font-medium text-[#5B4B8A] hover:text-[#433665] flex items-center gap-1 cursor-pointer"
            >
              View Reports <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
            {analytics.weekly_trend.map((item) => {
              const heightPercent = Math.max(15, (item.percentage - 70) * 3.3);
              const isToday = item.day === 'Tue';
              return (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[11px] font-medium text-[#6F6D68] group-hover:text-[#20201F]">
                    {item.percentage}%
                  </span>
                  <div className="w-full max-w-[48px] bg-[#F7F6F3] rounded-t-sm h-28 flex items-end overflow-hidden">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        isToday ? 'bg-[#5B4B8A]' : 'bg-[#D3CEE0] group-hover:bg-[#B3A9C8]'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs ${
                      isToday ? 'font-semibold text-[#5B4B8A]' : 'text-[#6F6D68]'
                    }`}
                  >
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Class Attendance Breakdown */}
        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-[#20201F]">Class Average</h3>
            <span className="text-xs text-[#6F6D68]">Active</span>
          </div>

          <div className="space-y-3.5 mt-4">
            {analytics.class_attendance.map((cls) => (
              <div key={cls.class_name} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#20201F]">{cls.class_name}</span>
                  <span className="font-semibold text-[#20201F]">{cls.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-[#F7F6F3] rounded-full overflow-hidden border border-[#E5E2DC]/40">
                  <div
                    style={{ width: `${cls.percentage}%` }}
                    className="h-full bg-[#5B4B8A] rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Attendance Table */}
      <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-[#E5E2DC] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#20201F]">Today&apos;s Attendance Registers</h3>
            <p className="text-xs text-[#6F6D68] mt-0.5">
              Live status for all sections on 29 September 2026
            </p>
          </div>
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('reports')}
              className="btn-secondary text-xs h-8 px-3 flex items-center gap-1.5"
            >
              <span>View Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#E5E2DC] bg-[#FBFBFA] text-[#6F6D68] text-xs uppercase tracking-wider">
                <th className="py-3 px-5 font-medium">Class</th>
                <th className="py-3 px-5 font-medium">Status</th>
                <th className="py-3 px-5 font-medium">Present</th>
                <th className="py-3 px-5 font-medium">Absent</th>
                <th className="py-3 px-5 font-medium text-right">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2DC]/60 text-[#20201F]">
              {todayClasses.map((item: TodayClassStatus) => {
                const isCompleted = item.status === 'completed';
                const percentage = isCompleted
                  ? ((item.present_count / item.student_count) * 100).toFixed(1)
                  : '—';

                return (
                  <tr
                    key={item.display_name}
                    className="hover:bg-[#FDFDFC] transition-colors"
                  >
                    <td className="py-3.5 px-5 font-medium">{item.display_name}</td>
                    <td className="py-3.5 px-5">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#EFF5F1] text-[#557A61] border border-[#D5E5D9]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FDF7EF] text-[#B8874A] border border-[#F2E0C4]">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-[#20201F]">
                      {isCompleted ? item.present_count : '—'}
                    </td>
                    <td className="py-3.5 px-5">
                      {isCompleted ? (
                        <span className={item.absent_count > 0 ? 'text-[#B65C55] font-medium' : 'text-[#6F6D68]'}>
                          {item.absent_count}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-right">
                      {isCompleted ? (
                        <span className="font-semibold text-[#20201F]">{percentage}%</span>
                      ) : (
                        <span className="text-xs text-[#B8874A]">Awaiting Staff</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
