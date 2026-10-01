'use client';

import React from 'react';
import { NodeBricksLogo } from '../common/NodeBricksLogo';
import { User } from '@/types';
import { DataService } from '@/lib/data-service';
import {
  LayoutDashboard,
  CalendarCheck,
  History,
  BarChart3,
  FileText,
  FileSpreadsheet,
  Users,
  LogOut,
  Building2,
  Bell,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'updates'
  | 'attendance'
  | 'history'
  | 'analytics'
  | 'reports'
  | 'import'
  | 'students'
  | 'profile';

interface SidebarProps {
  user: User;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onLogout: () => void;
}

export function Sidebar({ user, activeTab, onSelectTab, onLogout }: SidebarProps) {
  const isManagement = user.role === 'management';

  // Navigation Items according to strict role constraints:
  // Admin / Management has no attendance entry or attendance history.
  // Attendance staff exclusively manages daily attendance and history.
  const navItems = isManagement
    ? [
        { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'updates' as NavTab, label: 'Updates', icon: Bell },
        { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart3 },
        { id: 'reports' as NavTab, label: 'Reports', icon: FileText },
        { id: 'import' as NavTab, label: 'Import Data', icon: FileSpreadsheet },
        { id: 'students' as NavTab, label: 'Students', icon: Users },
      ]
    : [
        { id: 'attendance' as NavTab, label: 'Attendance', icon: CalendarCheck },
        { id: 'history' as NavTab, label: 'Attendance History', icon: History },
      ];

  return (
    <aside className="w-64 bg-[#FFFFFF] border-r border-[#E5E2DC] flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-[#E5E2DC] flex items-center">
        <NodeBricksLogo size="sm" showSubtitle={true} />
      </div>

      {/* School Badge */}
      <div className="px-6 py-4 border-b border-[#E5E2DC]/60 bg-[#FBFBFA]">
        <div className="flex items-center gap-2 text-xs font-medium text-[#20201F]">
          <Building2 className="w-3.5 h-3.5 text-[#5B4B8A]" />
          <span className="truncate">{DataService.getCurrentSchool()?.name || 'NodeBricks Academy'}</span>
        </div>
        <p className="text-[11px] text-[#6F6D68] mt-0.5">
          {DataService.getCurrentSchool()?.academic_year || 'Campus Portal'}
        </p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-[#F0EDF6] text-[#5B4B8A]'
                  : 'text-[#6F6D68] hover:text-[#20201F] hover:bg-[#F7F6F3]'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-[#5B4B8A]' : 'text-[#6F6D68]'
                }`}
                strokeWidth={2}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User & Logout Footer */}
      <div className="p-4 border-t border-[#E5E2DC] bg-[#FFFFFF]">
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-medium text-[#20201F] truncate">{user.full_name}</p>
            <p className="text-[11px] text-[#6F6D68] capitalize truncate">{user.role}</p>
          </div>
          <button
            onClick={onLogout}
            title="Sign out"
            className="p-1.5 text-[#6F6D68] hover:text-[#B65C55] hover:bg-[#FBF1F0] rounded-md transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
