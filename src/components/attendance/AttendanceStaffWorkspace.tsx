'use client';

import React, { useState } from 'react';
import { User } from '@/types';
import { AttendanceRegisterView } from './AttendanceRegisterView';
import { AttendanceHoldView } from './AttendanceHoldView';
import { AttendanceHistoryView } from '../history/AttendanceHistoryView';

interface AttendanceStaffWorkspaceProps {
  user: User;
  onBackToHome: () => void;
}

export function AttendanceStaffWorkspace({
  user,
  onBackToHome,
}: AttendanceStaffWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'register' | 'hold' | 'history'>('register');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Attendance Staff Navigation: [ Take Attendance | Hold | History ] */}
      <div className="flex items-center border-b border-[#E5E2DC] pb-2 sm:pb-3 no-print">
        <div className="inline-flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('register')}
            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-[#5B4B8A] text-white shadow-2xs'
                : 'text-[#6F6D68] hover:text-[#20201F] hover:bg-[#F0EDF6]/60'
            }`}
          >
            Take Attendance
          </button>

          <span className="text-[#C8C5BF] text-xs sm:hidden select-none">|</span>

          <button
            onClick={() => setActiveTab('hold')}
            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'hold'
                ? 'bg-[#5B4B8A] text-white shadow-2xs'
                : 'text-[#6F6D68] hover:text-[#20201F] hover:bg-[#F0EDF6]/60'
            }`}
          >
            Hold
          </button>

          <span className="text-[#C8C5BF] text-xs sm:hidden select-none">|</span>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#5B4B8A] text-white shadow-2xs'
                : 'text-[#6F6D68] hover:text-[#20201F] hover:bg-[#F0EDF6]/60'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Section 1: Take Attendance */}
      {activeTab === 'register' && (
        <AttendanceRegisterView
          user={user}
          onBackToHome={onBackToHome}
          onOpenHold={() => setActiveTab('hold')}
          onOpenHistory={() => setActiveTab('history')}
        />
      )}

      {/* Section 2: Hold */}
      {activeTab === 'hold' && (
        <AttendanceHoldView
          user={user}
          onNavigateToHistory={() => setActiveTab('history')}
        />
      )}

      {/* Section 3: Attendance History (Strictly Read-Only) */}
      {activeTab === 'history' && (
        <AttendanceHistoryView
          user={user}
          onBackToAttendance={() => setActiveTab('register')}
        />
      )}
    </div>
  );
}
