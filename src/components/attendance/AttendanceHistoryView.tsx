'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@/types';
import { DataService, CURRENT_DATE } from '@/lib/data-service';
import { Calendar, Filter, ChevronDown, Clock, Users, ArrowUpDown } from 'lucide-react';

interface AttendanceHistoryViewProps {
  user: User;
}

export function AttendanceHistoryView({ user }: AttendanceHistoryViewProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = DataService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const classes = DataService.getClasses();
  const availableDates = DataService.getAvailableHistoryDates();

  // Filters
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  // Query real database records
  const historyItems = useMemo(() => {
    return DataService.getAttendanceHistory({
      dateFilter: selectedDateFilter !== 'all' ? selectedDateFilter : undefined,
      classFilter: selectedClassFilter !== 'all' ? selectedClassFilter : undefined,
    });
  }, [selectedDateFilter, selectedClassFilter, DataService]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-16">
      {/* Header and Filter Bar */}
      <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E2DC]/70 pb-3">
          <div>
            <h2 className="text-base font-semibold text-[#20201F]">
              Attendance History
            </h2>
            <p className="text-xs text-[#6F6D68] mt-0.5">
              Read-only historical logs across all school sessions
            </p>
          </div>
          <span className="text-xs text-[#6F6D68]">
            {historyItems.length} Sessions Logged
          </span>
        </div>

        {/* Compact Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="h-8 px-2.5 pr-7 text-xs bg-[#FFFFFF] border border-[#E5E2DC] rounded-md text-[#20201F] focus:outline-hidden focus:border-[#5B4B8A] appearance-none cursor-pointer"
            >
              <option value="all">All Dates</option>
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#6F6D68] absolute right-2 top-2.5 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="h-8 px-2.5 pr-7 text-xs bg-[#FFFFFF] border border-[#E5E2DC] rounded-md text-[#20201F] focus:outline-hidden focus:border-[#5B4B8A] appearance-none cursor-pointer"
            >
              <option value="all">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#6F6D68] absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {(selectedDateFilter !== 'all' || selectedClassFilter !== 'all') && (
            <button
              onClick={() => {
                setSelectedDateFilter('all');
                setSelectedClassFilter('all');
              }}
              className="text-xs text-[#6F6D68] hover:text-[#20201F] underline cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* History Log Container */}
      <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl shadow-2xs overflow-hidden">
        {historyItems.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#FAF9F7] text-[#6F6D68] flex items-center justify-center mx-auto border border-[#E5E2DC]">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#20201F]">
              No attendance sessions found
            </h3>
            <p className="text-xs text-[#6F6D68] max-w-xs mx-auto">
              Completed attendance sessions recorded by attendance staff will appear in this historical register.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop View Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#E5E2DC] bg-[#FAF9F7] text-[#6F6D68] text-xs uppercase tracking-wider">
                    <th className="py-3 px-5 font-medium">Date</th>
                    <th className="py-3 px-5 font-medium">Class</th>
                    <th className="py-3 px-5 font-medium">Students</th>
                    <th className="py-3 px-5 font-medium">Present</th>
                    <th className="py-3 px-5 font-medium">Absent</th>
                    <th className="py-3 px-5 font-medium text-right">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DC]/60 text-[#20201F]">
                  {historyItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#FAF9F7]/70 transition-colors"
                    >
                      <td className="py-3.5 px-5 font-medium text-[#20201F]">
                        {item.date}
                      </td>
                      <td className="py-3.5 px-5 font-medium text-[#20201F]">
                        {item.class_name}
                      </td>
                      <td className="py-3.5 px-5 text-[#6F6D68]">
                        {item.total_students}
                      </td>
                      <td className="py-3.5 px-5 font-medium text-[#557A61]">
                        {item.present_count}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={
                            item.absent_count > 0
                              ? 'text-[#B65C55] font-semibold'
                              : 'text-[#6F6D68]'
                          }
                        >
                          {item.absent_count}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-right text-[#20201F]">
                        {item.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View List */}
            <div className="block sm:hidden divide-y divide-[#E5E2DC]/60">
              {historyItems.map((item) => (
                <div key={item.id} className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#5B4B8A]">
                      {item.date}
                    </span>
                    <span className="text-sm font-bold text-[#20201F]">
                      {item.percentage}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#20201F]">
                    <span className="font-medium">
                      {item.display_name}
                    </span>
                    <span className="text-[#6F6D68]">
                      {item.present_count} present &bull; {item.absent_count} absent
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
