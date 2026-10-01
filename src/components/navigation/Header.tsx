'use client';

import React from 'react';
import { User } from '@/types';
import { ArrowLeft, Menu, LogOut } from 'lucide-react';
import { CURRENT_DATE, DataService } from '@/lib/data-service';

interface HeaderProps {
  user: User;
  title: string;
  subtitle?: string;
  backAction?: {
    label: string;
    onClick: () => void;
  } | null;
  onOpenMobileMenu?: () => void;
  onLogout: () => void;
}

export function Header({
  user,
  title,
  subtitle,
  backAction,
  onOpenMobileMenu,
  onLogout,
}: HeaderProps) {
  // Format readable date dynamically using real school today: e.g. "1 October 2026"
  const formattedDate = DataService.formatDisplayDate(DataService.getSchoolTodayDate());

  return (
    <header className="h-16 bg-[#FFFFFF] border-b border-[#E5E2DC] px-4 sm:px-6 flex items-center justify-between shrink-0 no-print">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu toggle */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-2 text-[#6F6D68] hover:text-[#20201F] rounded-md transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Back Button if in secondary view */}
        {backAction ? (
          <button
            onClick={backAction.onClick}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#5B4B8A] hover:text-[#433665] transition-colors py-1 px-1.5 -ml-1.5 rounded-md hover:bg-[#F0EDF6]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{backAction.label}</span>
          </button>
        ) : (
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-[#20201F] tracking-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-[#6F6D68] hidden sm:block truncate">{subtitle}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Date Display */}
        <div className="text-right hidden sm:block">
          <p className="text-xs font-medium text-[#20201F]">{formattedDate}</p>
          <p className="text-[11px] text-[#6F6D68]">{DataService.getCurrentSchool()?.name || 'NodeBricks Academy'}</p>
        </div>

        {/* User initials / avatar */}
        <div className="flex items-center gap-2.5 pl-2 sm:border-l sm:border-[#E5E2DC]">
          <div className="w-8 h-8 rounded-full bg-[#F0EDF6] text-[#5B4B8A] font-medium text-xs flex items-center justify-center border border-[#E5E2DC]">
            {user.full_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="hidden md:block text-left text-xs">
            <span className="font-medium text-[#20201F] block">{user.full_name}</span>
            <span className="text-[#6F6D68] text-[11px] capitalize">{user.role}</span>
          </div>

          <button
            onClick={onLogout}
            title="Sign out"
            className="lg:hidden p-1.5 text-[#6F6D68] hover:text-[#B65C55] rounded-md transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
