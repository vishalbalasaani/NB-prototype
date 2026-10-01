'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { User, SchoolUpdate } from '@/types';
import { DataService, CURRENT_DATE } from '@/lib/data-service';
import { NewUpdateFlow } from './NewUpdateFlow';
import {
  Plus,
  FileText,
  File,
  X,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

interface UpdatesHomeProps {
  user: User;
  onBackToHome?: () => void;
}

export function UpdatesHome({ user, onBackToHome }: UpdatesHomeProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedUpdateForDetail, setSelectedUpdateForDetail] = useState<SchoolUpdate | null>(null);
  const [updates, setUpdates] = useState<SchoolUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load updates on mount or refresh
  const loadUpdates = () => {
    setIsLoading(true);
    try {
      const data = DataService.getUpdates();
      setUpdates(data);
    } catch {
      setUpdates([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUpdates();
  }, []);

  // Split into Upcoming and Recent strictly per Section 54 / 4
  const { upcoming, recent } = useMemo(() => {
    const refDate = DataService.getSchoolTodayDate();
    const upList: SchoolUpdate[] = [];
    const recList: SchoolUpdate[] = [];

    updates.forEach((up) => {
      const primaryDate = up.event_date || up.start_date || up.created_at.slice(0, 10);
      const isUpcoming = primaryDate >= refDate || Boolean(up.end_date && up.end_date >= refDate);
      if (isUpcoming) {
        upList.push(up);
      } else {
        recList.push(up);
      }
    });

    // Sort upcoming ascending
    upList.sort((a, b) => {
      const da = a.event_date || a.start_date || a.created_at;
      const db = b.event_date || b.start_date || b.created_at;
      return new Date(da).getTime() - new Date(db).getTime();
    });

    // Sort recent descending
    recList.sort((a, b) => {
      const da = a.event_date || a.start_date || a.created_at;
      const db = b.event_date || b.start_date || b.created_at;
      return new Date(db).getTime() - new Date(da).getTime();
    });

    return { upcoming: upList, recent: recList };
  }, [updates]);

  // Clean date formatting without browser shift
  const formatDateDisplay = (up: SchoolUpdate): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const parseYMD = (str?: string) => {
      if (!str) return null;
      const parts = str.split('-').map(Number);
      if (parts.length !== 3 || isNaN(parts[0])) return null;
      return { year: parts[0], month: parts[1] - 1, day: parts[2] };
    };

    if (up.start_date && up.end_date) {
      const p1 = parseYMD(up.start_date);
      const p2 = parseYMD(up.end_date);
      if (p1 && p2) {
        if (p1.month === p2.month && p1.year === p2.year) {
          return `${p1.day}–${p2.day} ${months[p1.month]}`;
        }
        return `${p1.day} ${months[p1.month].slice(0, 3)} – ${p2.day} ${months[p2.month].slice(0, 3)}`;
      }
    }

    const singleStr = up.event_date || up.start_date || up.created_at.slice(0, 10);
    const p = parseYMD(singleStr);
    if (p) {
      return `${p.day} ${months[p.month]}`;
    }

    return '29 September';
  };

  const formatAudienceBadge = (up: SchoolUpdate): string => {
    if (up.audience_type === 'entire_school') return 'Entire School';
    if (up.audience_type === 'selected_classes') {
      const names = up.audience_data?.class_names || [];
      if (names.length === 0) return 'Selected Classes';
      if (names.length === 5 && names[0] === 'Class 6' && names[4] === 'Class 10') {
        return 'Classes 6–10';
      }
      if (names.length <= 2) return names.join(', ');
      return `${names[0]}, ${names[1]} +${names.length - 2}`;
    }
    if (up.audience_type === 'specific_student') {
      return up.audience_data?.student_name
        ? up.audience_data.student_name
        : 'Specific Student';
    }
    return 'Entire School';
  };

  // If in New Update creation flow
  if (isCreating) {
    return (
      <NewUpdateFlow
        user={user}
        onBack={() => setIsCreating(false)}
        onUpdateSent={() => {
          setIsCreating(false);
          loadUpdates();
        }}
      />
    );
  }

  const renderUpdateRow = (item: SchoolUpdate) => {
    const dateText = formatDateDisplay(item);
    const audienceText = formatAudienceBadge(item);
    const hasPdf = Boolean(item.attachment_name);

    return (
      <div
        key={item.id}
        onClick={() => setSelectedUpdateForDetail(item)}
        className="p-4 sm:px-5 sm:py-4.5 hover:bg-[#F9F8F6] transition-colors flex items-center justify-between gap-4 cursor-pointer group"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#20201F] group-hover:text-[#5B4B8A] transition-colors truncate">
              {item.title}
            </h3>
            {hasPdf && (
              <span
                title={item.attachment_name || 'PDF Attachment'}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F0EDF6] text-[#5B4B8A] border border-[#D5CEE5] shrink-0"
              >
                <FileText className="w-3 h-3" />
                <span className="hidden sm:inline">PDF</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6F6D68]">
            <span className="font-medium text-[#20201F]">{dateText}</span>
            <span>&bull;</span>
            <span>{audienceText}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-[#A8A59F] group-hover:text-[#5B4B8A] font-medium transition-colors hidden sm:inline">
            View
          </span>
          <ArrowRight className="w-4 h-4 text-[#A8A59F] group-hover:text-[#5B4B8A] group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5E2DC] pb-4">
        <div>
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6F6D68] hover:text-[#20201F] transition-colors py-1 px-2 -ml-2 mb-1.5 rounded-md hover:bg-[#F4F1F8] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
          )}
          <h1 className="text-2xl font-semibold text-[#20201F] tracking-tight">Updates</h1>
          <p className="text-xs text-[#6F6D68] mt-1">
            School announcements and parent WhatsApp notifications
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary h-9 px-4 text-xs font-medium flex items-center justify-center gap-2 bg-[#5B4B8A] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Update</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-xs text-[#6F6D68]">
          Loading school updates...
        </div>
      ) : updates.length === 0 ? (
        /* Empty State */
        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-12 text-center shadow-2xs space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#F0EDF6] text-[#5B4B8A] flex items-center justify-center mx-auto border border-[#D5CEE5]">
            <Calendar className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div className="max-w-sm mx-auto">
            <h3 className="text-base font-semibold text-[#20201F]">No announcements yet</h3>
            <p className="text-xs text-[#6F6D68] mt-1.5 leading-relaxed">
              Create school circulars, holiday notices, and examination schedules. Parents receive instant WhatsApp notifications.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setIsCreating(true)}
              className="btn-primary h-9 px-4 text-xs font-medium bg-[#5B4B8A]"
            >
              + Create First Update
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* UPCOMING SECTION */}
          {upcoming.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6F6D68]">
                  Upcoming
                </h2>
                <span className="text-[11px] font-medium text-[#5B4B8A] bg-[#F0EDF6] px-2 py-0.5 rounded-full">
                  {upcoming.length} active
                </span>
              </div>

              <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl divide-y divide-[#E5E2DC] shadow-2xs overflow-hidden">
                {upcoming.map(renderUpdateRow)}
              </div>
            </div>
          )}

          {/* RECENT SECTION */}
          {recent.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6F6D68]">
                  Recent
                </h2>
                <span className="text-[11px] text-[#A8A59F]">
                  Past notices &amp; releases
                </span>
              </div>

              <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl divide-y divide-[#E5E2DC] shadow-2xs overflow-hidden">
                {recent.map(renderUpdateRow)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL / PREVIEW */}
      {selectedUpdateForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl max-w-lg w-full shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E5E2DC] flex items-start justify-between gap-3 bg-[#FBFBFA]">
              <div className="min-w-0">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#5B4B8A] bg-[#F0EDF6] px-2 py-0.5 rounded border border-[#D5CEE5]">
                  {selectedUpdateForDetail.type.replace('_', ' ')}
                </span>
                <h2 className="text-lg font-semibold text-[#20201F] mt-2">
                  {selectedUpdateForDetail.title}
                </h2>
                <p className="text-xs text-[#6F6D68] mt-0.5">
                  {formatDateDisplay(selectedUpdateForDetail)} &bull; {formatAudienceBadge(selectedUpdateForDetail)}
                </p>
              </div>
              <button
                onClick={() => setSelectedUpdateForDetail(null)}
                className="p-1.5 text-[#6F6D68] hover:text-[#20201F] rounded-md transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* Message Content */}
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#6F6D68] block mb-1.5">
                  Notification Message
                </span>
                <div className="p-4 bg-[#FBFBFA] border border-[#E5E2DC] rounded-lg text-xs sm:text-sm text-[#20201F] leading-relaxed whitespace-pre-wrap">
                  {selectedUpdateForDetail.message}
                </div>
              </div>

              {/* PDF Attachment */}
              {selectedUpdateForDetail.attachment_name && (
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[#6F6D68] block mb-1.5">
                    Attached Document
                  </span>
                  <div className="p-3 bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <File className="w-4 h-4 text-[#5B4B8A] shrink-0" />
                      <span className="font-medium text-[#20201F] truncate">
                        {selectedUpdateForDetail.attachment_name}
                      </span>
                      {selectedUpdateForDetail.attachment_size && (
                        <span className="text-[#6F6D68] shrink-0">
                          ({selectedUpdateForDetail.attachment_size})
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-[#5B4B8A]">PDF</span>
                  </div>
                </div>
              )}

              {/* Status info */}
              <div className="pt-2 border-t border-[#E5E2DC] flex items-center justify-between text-xs text-[#6F6D68]">
                <div className="flex items-center gap-1.5 text-[#557A61]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>WhatsApp Notifications Sent</span>
                </div>
                <span>
                  {new Date(selectedUpdateForDetail.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E5E2DC] bg-[#FBFBFA] flex justify-end">
              <button
                onClick={() => setSelectedUpdateForDetail(null)}
                className="btn-secondary h-8 px-4 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
