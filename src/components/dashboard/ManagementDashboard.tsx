'use client';

import React from 'react';
import { User } from '@/types';
import { DataService, CURRENT_DATE } from '@/lib/data-service';
import { ArrowRight } from 'lucide-react';
import { NavTab } from '../navigation/Sidebar';

interface ManagementDashboardProps {
  user: User;
  onNavigateTab: (tab: NavTab) => void;
}

export function ManagementDashboard({
  user,
  onNavigateTab,
}: ManagementDashboardProps) {
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    const unsubscribe = DataService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const todayClasses = DataService.getTodayClassesStatus(DataService.getSchoolTodayDate());

  // Pending classes count
  const completedCount = todayClasses.filter((c) => c.status === 'completed').length;
  const totalClassesCount = todayClasses.length;
  const pendingCount = totalClassesCount - completedCount;

  // Upcoming updates count
  const updatesSummary = DataService.getUpcomingAndRecentUpdates();
  const upcomingCount = updatesSummary.upcoming.length;
  const schoolName = DataService.getCurrentSchool()?.name || 'NodeBricks Academy';

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4 sm:py-8">
      {/* Welcome Banner */}
      <div className="border-b border-[#E5E2DC] pb-5">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#20201F] tracking-tight">
          Good morning, {user.full_name}
        </h1>
        <p className="text-sm text-[#6F6D68] mt-1">
          Today: {DataService.formatDisplayDate(DataService.getSchoolTodayDate())} &bull; {schoolName}
        </p>
      </div>

      {/* Module Navigation Entry Cards */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6F6D68]">
          What do you want to manage?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Attendance Entry Card */}
          <button
            onClick={() => onNavigateTab('analytics')}
            className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 text-left hover:border-[#5B4B8A]/50 hover:shadow-xs transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="space-y-1.5">
              <span className="text-base font-semibold text-[#20201F] group-hover:text-[#5B4B8A] transition-colors block">
                Attendance
              </span>
              <p className="text-xs text-[#6F6D68]">
                Today&apos;s attendance &bull; {pendingCount} {pendingCount === 1 ? 'class' : 'classes'} pending
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#A8A59F] group-hover:text-[#5B4B8A] group-hover:translate-x-0.5 transition-all shrink-0 ml-3" />
          </button>

          {/* Updates Entry Card */}
          <button
            onClick={() => onNavigateTab('updates')}
            className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 text-left hover:border-[#5B4B8A]/50 hover:shadow-xs transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="space-y-1.5">
              <span className="text-base font-semibold text-[#20201F] group-hover:text-[#5B4B8A] transition-colors block">
                Updates
              </span>
              <p className="text-xs text-[#6F6D68]">
                School announcements &bull; {upcomingCount} upcoming
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#A8A59F] group-hover:text-[#5B4B8A] group-hover:translate-x-0.5 transition-all shrink-0 ml-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
