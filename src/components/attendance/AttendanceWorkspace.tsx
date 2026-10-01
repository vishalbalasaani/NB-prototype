'use client';

import React, { useState } from 'react';
import { User } from '@/types';
import { AdminAttendanceOverview } from './AdminAttendanceOverview';
import { AttendanceHistoryView } from '../history/AttendanceHistoryView';
import { AttendanceReportsView } from '../reports/AttendanceReportsView';
import { ArrowLeft } from 'lucide-react';

export type AdminAttendanceSubTab = 'overview' | 'history' | 'reports';

interface AttendanceWorkspaceProps {
  user: User;
  onBackToHome: () => void;
  initialTab?: AdminAttendanceSubTab;
}

export function AttendanceWorkspace({
  user,
  onBackToHome,
  initialTab = 'overview',
}: AttendanceWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<AdminAttendanceSubTab>(initialTab);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Top Header & Navigation */}
      <div className="space-y-4 border-b border-[#E5E2DC] pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToHome}
              aria-label="Back to Home"
              title="Back to Home"
              className="p-2 -ml-2 text-[#20201F] hover:text-[#5B4B8A] transition-colors cursor-pointer flex items-center justify-center shrink-0"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-[#20201F] tracking-tight">
              Attendance
            </h1>
          </div>
        </div>

        {/* 3 Subtabs: Overview | History | Reports */}
        <div className="flex items-center gap-1 border-b border-transparent -mb-[17px]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 text-sm font-medium transition-colors cursor-pointer border-b-2 ${
              activeTab === 'overview'
                ? 'border-[#5B4B8A] text-[#5B4B8A] font-semibold'
                : 'border-transparent text-[#6F6D68] hover:text-[#20201F]'
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-3 text-sm font-medium transition-colors cursor-pointer border-b-2 ${
              activeTab === 'history'
                ? 'border-[#5B4B8A] text-[#5B4B8A] font-semibold'
                : 'border-transparent text-[#6F6D68] hover:text-[#20201F]'
            }`}
          >
            History
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 px-3 text-sm font-medium transition-colors cursor-pointer border-b-2 ${
              activeTab === 'reports'
                ? 'border-[#5B4B8A] text-[#5B4B8A] font-semibold'
                : 'border-transparent text-[#6F6D68] hover:text-[#20201F]'
            }`}
          >
            Reports
          </button>
        </div>
      </div>

      {/* Subtab Contents (Key-based remount ensures entrance animations replay upon navigation/return) */}
      {activeTab === 'overview' && (
        <AdminAttendanceOverview
          key={`overview-${activeTab}`}
          user={user}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {activeTab === 'history' && (
        <AttendanceHistoryView key={`history-${activeTab}`} user={user} />
      )}

      {activeTab === 'reports' && (
        <AttendanceReportsView key={`reports-${activeTab}`} user={user} />
      )}
    </div>
  );
}
