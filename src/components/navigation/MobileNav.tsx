'use client';

import React from 'react';
import { User } from '@/types';
import { DataService } from '@/lib/data-service';
import { NavTab } from './Sidebar';
import { NodeBricksLogo } from '../common/NodeBricksLogo';
import {
  LayoutDashboard,
  CalendarCheck,
  History,
  BarChart3,
  FileText,
  FileSpreadsheet,
  Users,
  LogOut,
  X,
  Building2,
  Bell,
} from 'lucide-react';

interface MobileNavProps {
  user: User;
  activeTab: NavTab;
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: NavTab) => void;
  onLogout: () => void;
}

export function MobileNav({
  user,
  activeTab,
  isOpen,
  onClose,
  onSelectTab,
  onLogout,
}: MobileNavProps) {
  const isManagement = user.role === 'management';

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

  // Bottom quick tabs for mobile
  const bottomTabs = isManagement
    ? [
        { id: 'dashboard' as NavTab, label: 'Home', icon: LayoutDashboard },
        { id: 'updates' as NavTab, label: 'Updates', icon: Bell },
        { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart3 },
        { id: 'reports' as NavTab, label: 'Reports', icon: FileText },
      ]
    : [
        { id: 'attendance' as NavTab, label: 'Attendance', icon: CalendarCheck },
        { id: 'history' as NavTab, label: 'History', icon: History },
      ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar (Very clean, accessible for thumb interaction) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#FFFFFF] border-t border-[#E5E2DC] z-30 flex items-center justify-around px-2 no-print">
        {bottomTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors ${
                isActive ? 'text-[#5B4B8A]' : 'text-[#6F6D68]'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.3 : 1.8} />
              <span className={`text-[11px] mt-1 ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Slide-out Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />

          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-72 bg-[#FFFFFF] shadow-xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
            <div className="h-16 px-5 border-b border-[#E5E2DC] flex items-center justify-between">
              <NodeBricksLogo size="sm" showSubtitle={true} />
              <button
                onClick={onClose}
                className="p-1.5 text-[#6F6D68] hover:text-[#20201F] rounded-md"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-[#E5E2DC]/60 bg-[#FBFBFA]">
              <div className="flex items-center gap-2 text-xs font-medium text-[#20201F]">
                <Building2 className="w-3.5 h-3.5 text-[#5B4B8A]" />
                <span>{DataService.getCurrentSchool()?.name || 'NodeBricks Academy'}</span>
              </div>
              <p className="text-[11px] text-[#6F6D68] mt-0.5">
                {DataService.getCurrentSchool()?.academic_year || 'Campus Portal'}
              </p>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-[#F0EDF6] text-[#5B4B8A]'
                        : 'text-[#6F6D68] hover:text-[#20201F] hover:bg-[#F7F6F3]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#E5E2DC]">
              <div className="flex items-center justify-between mb-3 px-2">
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-medium text-[#20201F] truncate">{user.full_name}</p>
                  <p className="text-[11px] text-[#6F6D68] capitalize truncate">{user.role}</p>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-1.5 text-[#6F6D68] hover:text-[#B65C55] rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
