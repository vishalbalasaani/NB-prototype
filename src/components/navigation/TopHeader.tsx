'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User } from '@/types';
import { DataService } from '@/lib/data-service';
import { BrandLogo } from '../common/BrandLogo';
import {
  Building2,
  LogOut,
  Users,
  FileSpreadsheet,
  ChevronDown,
} from 'lucide-react';

export type AppModule = 'home' | 'attendance' | 'updates' | 'marks' | 'students' | 'import';

interface TopHeaderProps {
  user: User;
  activeModule: AppModule;
  onNavigate: (module: AppModule) => void;
  onLogout: () => void;
}

export function TopHeader({
  user,
  activeModule,
  onNavigate,
  onLogout,
}: TopHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isHome = activeModule === 'home';

  // Get module title for breadcrumb
  const getModuleLabel = () => {
    switch (activeModule) {
      case 'attendance':
        return 'Attendance';
      case 'updates':
        return 'Updates';
      case 'marks':
        return 'Marks';
      case 'students':
        return 'Student Directory';
      case 'import':
        return 'Import Data';
      default:
        return '';
    }
  };

  return (
    <header className="h-14 sm:h-16 lg:h-[68px] bg-[#FFFFFF] border-b border-[#E5E2DC] px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 select-none z-30 no-print">
      {/* Left: Brand & Contextual Module Title */}
      <div className="flex items-center min-w-0">
        {user.role === 'management' ? (
          <button
            onClick={() => onNavigate('home')}
            className="focus:outline-hidden text-left cursor-pointer transition-opacity hover:opacity-90 flex items-center shrink-0"
            title="NodeBricks Home"
          >
            <BrandLogo />
          </button>
        ) : (
          <div className="text-left select-none flex items-center shrink-0">
            <BrandLogo />
          </div>
        )}

        {/* Subtle Divider (18-24px spacing: mx-4 sm:mx-5) */}
        <div className="mx-4 sm:mx-5 h-4.5 w-px bg-[#E5E2DC] shrink-0" />

        {/* Module Title */}
        <span className="text-xs sm:text-sm font-semibold text-[#20201F] tracking-tight truncate">
          {getModuleLabel() || 'Attendance'}
        </span>
      </div>

      {/* Right: School Context (Management Only) & Compact Unobtrusive Account Control */}
      <div className="flex items-center gap-3">
        {/* School Identifier (Management Only) */}
        {user.role === 'management' && (
          <div className="hidden md:flex items-center gap-2 text-right pr-4 border-r border-[#E5E2DC]">
            <Building2 className="w-3.5 h-3.5 text-[#5B4B8A] shrink-0" />
            <div className="text-left">
              <p className="text-xs font-medium text-[#20201F] leading-tight">
                {DataService.getCurrentSchool()?.name || 'NodeBricks Academy'}
              </p>
            </div>
          </div>
        )}

        {/* User Account Popover Trigger */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-1 rounded-full sm:rounded-lg hover:bg-[#F7F6F3] transition-colors focus:outline-hidden cursor-pointer"
            aria-expanded={menuOpen}
            aria-label="Account menu"
          >
            {/* User Initials Avatar (Clean 32px circle) */}
            <div className="w-8 h-8 rounded-full bg-[#F0EDF6] text-[#5B4B8A] font-semibold text-xs flex items-center justify-center border border-[#D5CEE5] shrink-0">
              {user.full_name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>

            {user.role === 'management' && (
              <div className="hidden sm:block text-left text-xs">
                <span className="font-medium text-[#20201F] block leading-tight">{user.full_name}</span>
              </div>
            )}

            <ChevronDown
              className={`w-3.5 h-3.5 text-[#6F6D68] transition-transform duration-150 ${
                menuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Account Popover Menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              {/* Profile summary */}
              <div className="px-4 py-2.5 border-b border-[#E5E2DC]/70 bg-[#FBFBFA]">
                <p className="text-xs font-semibold text-[#20201F] truncate">{user.full_name}</p>
                <p className="text-[11px] text-[#6F6D68] truncate mt-0.5">{user.email}</p>
              </div>

              {/* Management Tools (Kept cleanly in account menu, away from Attendance) */}
              {user.role === 'management' && (
                <div className="py-1 border-b border-[#E5E2DC]/70">
                  <button
                    onClick={() => {
                      onNavigate('students');
                      setMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-[#20201F] hover:bg-[#F4F1F8] hover:text-[#5B4B8A] transition-colors flex items-center gap-2.5"
                  >
                    <Users className="w-3.5 h-3.5 text-[#6F6D68]" />
                    <span>Student Directory</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('import');
                      setMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-[#20201F] hover:bg-[#F4F1F8] hover:text-[#5B4B8A] transition-colors flex items-center gap-2.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#6F6D68]" />
                    <span>Import Student Data</span>
                  </button>
                </div>
              )}

              {/* Sign out */}
              <div className="pt-1">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-[#B65C55] hover:bg-[#FBF1F0] transition-colors flex items-center gap-2.5"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#B65C55]" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export const AppHeader = TopHeader;
