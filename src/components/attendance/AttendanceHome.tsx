'use client';

import React, { useState } from 'react';
import { User, TodayClassStatus } from '@/types';
import { DataService, CURRENT_DATE } from '@/lib/data-service';
import { CheckCircle2, ChevronRight, Clock, RefreshCw } from 'lucide-react';

interface AttendanceHomeProps {
  user: User;
  onSelectClass: (classId: string, sectionId: string) => void;
}

export function AttendanceHome({ user, onSelectClass }: AttendanceHomeProps) {
  const [classes, setClasses] = useState<TodayClassStatus[]>(() =>
    DataService.getTodayClassesStatus(DataService.getSchoolTodayDate())
  );

  const refreshData = () => {
    setClasses(DataService.getTodayClassesStatus(DataService.getSchoolTodayDate()));
  };

  const pendingCount = classes.filter((c) => c.status === 'pending').length;
  const completedCount = classes.filter((c) => c.status === 'completed').length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E5E2DC] pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#20201F] tracking-tight">
            Attendance
          </h1>
          <p className="text-sm text-[#6F6D68] mt-1">
            Today: {DataService.formatDisplayDate(DataService.getSchoolTodayDate())} &bull; Select a class to record attendance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshData}
            title="Refresh status"
            className="btn-secondary h-8 px-2.5 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#6F6D68]" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Progress pill */}
      <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#5B4B8A]" />
          <span className="text-sm font-medium text-[#20201F]">
            {pendingCount > 0
              ? `${pendingCount} classes remaining today`
              : 'All classes completed for today'}
          </span>
        </div>
        <span className="text-xs text-[#6F6D68] font-medium">
          {completedCount} of {classes.length} completed
        </span>
      </div>

      {/* Clean Class List (No excessive colorful cards) */}
      <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl shadow-2xs overflow-hidden divide-y divide-[#E5E2DC]">
        {classes.map((cls) => {
          const isCompleted = cls.status === 'completed';

          return (
            <button
              key={cls.display_name}
              onClick={() => onSelectClass(cls.class_id, cls.section_id)}
              className={`w-full text-left p-4 sm:p-5 flex items-center justify-between transition-colors ${
                isCompleted
                  ? 'bg-[#FCFCFB] hover:bg-[#F7F6F3]/80'
                  : 'hover:bg-[#F9F8F6]'
              }`}
            >
              {/* Left Details */}
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-3">
                  <span className="text-base font-semibold text-[#20201F]">
                    {cls.display_name}
                  </span>

                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EFF5F1] text-[#557A61] border border-[#D5E5D9]">
                      <CheckCircle2 className="w-3 h-3" />
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FDF7EF] text-[#B8874A] border border-[#F2E0C4]">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-[#6F6D68] mt-1.5">
                  <span>{cls.student_count} students</span>
                  {isCompleted && (
                    <>
                      <span>&bull;</span>
                      <span className={cls.absent_count > 0 ? 'text-[#B65C55] font-medium' : ''}>
                        {cls.absent_count} absent
                      </span>
                      <span>&bull;</span>
                      <span>{cls.present_count} present</span>
                    </>
                  )}
                </div>
              </div>

              {/* Right Action Indicator */}
              <div className="flex items-center gap-2 text-[#6F6D68] shrink-0">
                <span className="text-xs font-medium hidden sm:inline-block">
                  {isCompleted ? 'View' : 'Start'}
                </span>
                <ChevronRight className="w-4 h-4 text-[#A8A59F]" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
