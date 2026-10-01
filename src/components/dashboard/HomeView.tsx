'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { DataService, CURRENT_DATE } from '@/lib/data-service';
import { CalendarCheck, Bell, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { AppModule } from '../navigation/TopHeader';

interface HomeViewProps {
  user: User;
  onSelectModule: (module: AppModule) => void;
}

export function HomeView({ user, onSelectModule }: HomeViewProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = DataService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  // Compute live today's attendance strictly from real database records
  const history = DataService.getAttendanceHistory({ dateFilter: CURRENT_DATE });
  const todayAbsenteesCount = history.reduce((sum, h) => sum + h.absent_count, 0);
  const todayPresentCount = history.reduce((sum, h) => sum + Math.max(0, h.total_students - h.absent_count), 0);
  const totalMarkedStudents = todayPresentCount + todayAbsenteesCount;
  const attendanceRate = totalMarkedStudents > 0
    ? `${((todayPresentCount / totalMarkedStudents) * 100).toFixed(0)}%`
    : null;

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user.full_name?.split(' ')[0] || user.full_name || 'Admin';

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-14 px-4 sm:px-6 space-y-8 animate-in fade-in duration-200">
      {/* Header Greeting */}
      <div className="space-y-1.5 border-b border-[#E5E2DC] pb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#20201F] tracking-tight">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm sm:text-base text-[#6F6D68]">
          What do you want to manage?
        </p>
      </div>

      {/* Exactly 3 Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Attendance */}
        <button
          onClick={() => onSelectModule('attendance')}
          className="group relative bg-[#FFFFFF] hover:bg-[#FAF8FD] border border-[#E5E2DC] hover:border-[#D5CAE5] rounded-xl p-6 text-left transition-all duration-200 flex flex-col justify-between min-h-[210px] shadow-2xs hover:shadow-xs focus:outline-hidden cursor-pointer"
        >
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-[#F4F1F8] group-hover:bg-[#EFEAF6] text-[#5B4B8A] flex items-center justify-center border border-[#E7E1F2] transition-colors">
              <CalendarCheck className="w-5 h-5" strokeWidth={2} />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold text-[#20201F] group-hover:text-[#433665] transition-colors">
                Attendance
              </h2>
              <p className="text-xs text-[#6F6D68] leading-relaxed">
                Daily attendance and attendance analysis
              </p>
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-[#E5E2DC]/70 flex items-center justify-between">
            <span className="text-xs font-medium text-[#5B4B8A]">
              {attendanceRate ? `Today's attendance: ${attendanceRate}` : "Today's attendance: Pending"}
            </span>
            <ArrowRight className="w-4 h-4 text-[#5B4B8A] transform group-hover:translate-x-1 transition-transform duration-200" />
          </div>
        </button>

        {/* Card 2: Updates */}
        <button
          onClick={() => onSelectModule('updates')}
          className="group relative bg-[#FFFFFF] hover:bg-[#FAF9F7] border border-[#E5E2DC] hover:border-[#D8D2C8] rounded-xl p-6 text-left transition-all duration-200 flex flex-col justify-between min-h-[210px] shadow-2xs hover:shadow-xs focus:outline-hidden cursor-pointer"
        >
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-[#F5F2EB] group-hover:bg-[#EFECE3] text-[#6E5B4B] flex items-center justify-center border border-[#E7E2D6] transition-colors">
              <Bell className="w-5 h-5" strokeWidth={2} />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold text-[#20201F] group-hover:text-[#433665] transition-colors">
                Updates
              </h2>
              <p className="text-xs text-[#6F6D68] leading-relaxed">
                School announcements and notices
              </p>
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-[#E5E2DC]/70 flex items-center justify-between">
            <span className="text-xs font-medium text-[#6F6D68] group-hover:text-[#20201F] transition-colors">
              View announcements
            </span>
            <ArrowRight className="w-4 h-4 text-[#6F6D68] group-hover:text-[#20201F] transform group-hover:translate-x-1 transition-transform duration-200" />
          </div>
        </button>

        {/* Card 3: Marks & Results */}
        <button
          onClick={() => onSelectModule('marks')}
          className="group relative bg-[#FFFFFF] hover:bg-[#FAF8FD] border border-[#E5E2DC] hover:border-[#D5CAE5] rounded-xl p-6 text-left transition-all duration-200 flex flex-col justify-between min-h-[210px] shadow-2xs hover:shadow-xs focus:outline-hidden cursor-pointer"
        >
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-[#F4F1F8] group-hover:bg-[#EFEAF6] text-[#5B4B8A] flex items-center justify-center border border-[#E7E1F2] transition-colors">
              <FileSpreadsheet className="w-5 h-5" strokeWidth={2} />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold text-[#20201F] group-hover:text-[#433665] transition-colors">
                Marks &amp; Results
              </h2>
              <p className="text-xs text-[#6F6D68] leading-relaxed">
                Student marks and result reports
              </p>
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-[#E5E2DC]/70 flex items-center justify-between">
            <span className="text-xs font-medium text-[#6F6D68] group-hover:text-[#20201F] transition-colors">
              View mark sheets
            </span>
            <ArrowRight className="w-4 h-4 text-[#6F6D68] group-hover:text-[#20201F] transform group-hover:translate-x-1 transition-transform duration-200" />
          </div>
        </button>
      </div>
    </div>
  );
}
