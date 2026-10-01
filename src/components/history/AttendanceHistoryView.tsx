'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, AttendanceHistoryItem, Student } from '@/types';
import { DataService, CURRENT_DATE } from '@/lib/data-service';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Printer,
  Check,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { FullWidthDateRail } from '../attendance/FullWidthDateRail';

interface AttendanceHistoryViewProps {
  user?: User;
  onBackToAttendance?: () => void;
}

// Format date into "29 September 2026"
function formatDisplayDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AttendanceHistoryView({
  user,
  onBackToAttendance,
}: AttendanceHistoryViewProps) {
  const [tick, setTick] = useState(0);

  // Subscribe to real-time changes
  useEffect(() => {
    const unsubscribe = DataService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  // Selected date (defaults to today's real school date)
  const [selectedDate, setSelectedDate] = useState<string>(() => DataService.getSchoolTodayDate());
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Class Filter
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Active detail view for a specific class record
  const [activeRecord, setActiveRecord] = useState<AttendanceHistoryItem | null>(null);

  // Sync activeRecord with real-time database updates
  useEffect(() => {
    if (activeRecord) {
      const updated = DataService.getAttendanceHistory({
        dateFilter: activeRecord.date,
      }).find((item) => item.id === activeRecord.id || item.session_id === activeRecord.session_id);
      if (updated) {
        setActiveRecord(updated);
      }
    }
  }, [tick]);

  // Export menu open state
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close export menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Classes starting from Class 5 (No Section)
  const classesList = useMemo(() => {
    return DataService.getClasses()
      .filter((c) => {
        const match = c.name.match(/\d+/);
        if (match) {
          return parseInt(match[0], 10) >= 5;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, []);

  // Set of dates that have recorded attendance sessions
  const recordedDates = useMemo(() => {
    const dates = new Set<string>();
    DataService.getAttendanceHistory().forEach((h) => {
      dates.add(h.date);
    });
    return dates;
  }, []);

  // Query records for selected date and class
  const historyItems = DataService.getAttendanceHistory({
    dateFilter: selectedDate,
    classFilter: selectedClass !== 'all' ? selectedClass : undefined,
  });

  // Export Daily Excel
  const handleExportExcel = () => {
    setExportOpen(false);
    if (historyItems.length === 0) return;

    const exportRows: any[] = [];
    historyItems.forEach((item) => {
      exportRows.push({
        'Date': item.date,
        'Class': item.display_name,
        'Total Students': item.total_students,
        'Present': item.present_count,
        'Absent': item.absent_count,
        'Attendance %': `${item.percentage}%`,
        'Absent Roll Numbers': item.absent_students.map((s) => s.roll_number).join(', ') || 'None',
      });
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daily Attendance');
    XLSX.writeFile(wb, `Attendance_Report_${selectedDate}.xlsx`);
  };

  // Export Daily Printable PDF
  const handleExportPDF = () => {
    setExportOpen(false);
    const schoolName = DataService.getCurrentSchool()?.name || 'NodeBricks Academy';

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = historyItems
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #E5E2DC; font-weight: 600;">${item.display_name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5E2DC; text-align: center;">${item.total_students}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5E2DC; text-align: center; color: #557A61; font-weight: 600;">${item.present_count}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5E2DC; text-align: center; color: ${item.absent_count > 0 ? '#B65C55' : '#20201F'}; font-weight: 600;">${item.absent_count}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5E2DC; text-align: center; font-weight: 700;">${item.percentage}%</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5E2DC; font-size: 11px; color: #6F6D68;">
            ${item.absent_students.map((s) => `${s.name} (Roll ${s.roll_number})`).join(', ') || 'None (All Present)'}
          </td>
        </tr>
      `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daily Attendance Report - ${selectedDate}</title>
          <style>
            body { font-family: Inter, -apple-system, sans-serif; color: #20201F; padding: 30px; margin: 0; }
            h1 { font-size: 20px; margin: 0 0 4px 0; }
            p { margin: 0 0 16px 0; color: #6F6D68; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th { text-align: left; padding: 10px; background: #F7F6F3; border-bottom: 2px solid #E5E2DC; font-size: 11px; text-transform: uppercase; color: #6F6D68; }
            @media print { body { padding: 15mm; } }
          </style>
        </head>
        <body>
          <h1>${schoolName}</h1>
          <p>Daily Attendance Register Report &bull; ${formatDisplayDate(selectedDate)}</p>
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th style="text-align: center;">Total</th>
                <th style="text-align: center;">Present</th>
                <th style="text-align: center;">Absent</th>
                <th style="text-align: center;">Attendance</th>
                <th>Absent Students</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };



  // ==========================================================
  // VIEW: CLASS HISTORY DETAIL
  // ==========================================================
  if (activeRecord) {
    const classStudents: Student[] = activeRecord.class_id
      ? DataService.getStudentsByClass(activeRecord.class_id)
      : [];

    const absentStudentIds = new Set(activeRecord.absent_students.map((s) => s.student_id));
    const presentStudents = classStudents.filter((s) => !absentStudentIds.has(s.id));

    return (
      <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-5 pb-20 px-3 sm:px-4 animate-in fade-in duration-150">
        {/* Header with single unboxed back arrow beside title (Requirement 36) */}
        <div className="border-b border-[#E5E2DC] pb-4 flex items-start gap-2">
          <button
            onClick={() => setActiveRecord(null)}
            className="p-2 -ml-2 text-[#20201F] hover:text-[#5B4B8A] transition-colors cursor-pointer flex items-center justify-center shrink-0 mt-0.5"
            title="Go back to history"
            aria-label="Go back to history"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#20201F] tracking-tight">
              {activeRecord.display_name}
            </h1>
            <p className="text-xs text-[#6F6D68] mt-0.5">
              {formatDisplayDate(activeRecord.date)}
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between text-xs text-[#6F6D68] border-b border-[#E5E2DC] pb-2">
            <span>Total enrolled</span>
            <span className="font-semibold text-[#20201F]">{activeRecord.total_students}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#6F6D68] border-b border-[#E5E2DC] pb-2">
            <span>Present</span>
            <span className="font-semibold text-[#557A61]">{activeRecord.present_count}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#6F6D68] border-b border-[#E5E2DC] pb-2">
            <span>Absent</span>
            <span className={`font-semibold ${activeRecord.absent_count > 0 ? 'text-[#B65C55]' : 'text-[#20201F]'}`}>
              {activeRecord.absent_count}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#6F6D68]">
            <span>Status</span>
            <span className="font-semibold text-[#557A61] text-xs bg-[#EFF5F1] px-2 py-0.5 rounded-md">
              Completed
            </span>
          </div>
        </div>

        {/* Absentees Section (Strictly Read-Only - Requirements 5, 16, 33) */}
        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="border-b border-[#E5E2DC] pb-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6F6D68]">
              Absent Students ({activeRecord.absent_students.length})
            </h2>
          </div>

          {activeRecord.absent_students.length === 0 ? (
            <p className="text-xs text-[#557A61] py-2 font-medium">
              No students were absent. All students recorded present.
            </p>
          ) : (
            <div className="divide-y divide-[#E5E2DC]">
              {activeRecord.absent_students.map((student) => (
                <div
                  key={student.student_id}
                  className="py-2.5 flex items-center justify-between text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[#6F6D68] font-medium w-8">
                      Roll {student.roll_number}
                    </span>
                    <span className="font-medium text-[#20201F]">
                      {student.name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-[#B65C55]">
                    Absent
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Present Students Section (Strictly Read-Only - Requirements 5, 16, 33) */}
        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="border-b border-[#E5E2DC] pb-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6F6D68]">
              Present Students ({presentStudents.length})
            </h2>
          </div>

          {presentStudents.length === 0 ? (
            <p className="text-xs text-[#B65C55] py-2 font-medium">
              No students present.
            </p>
          ) : (
            <div className="divide-y divide-[#E5E2DC] max-h-72 overflow-y-auto pr-1">
              {presentStudents.map((st) => (
                <div
                  key={st.id}
                  className="py-2 flex items-center justify-between text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[#6F6D68] font-medium w-8">
                      Roll {st.roll_number}
                    </span>
                    <span className="font-medium text-[#20201F]">
                      {st.full_name}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-[#557A61]">
                    Present
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Finalized Record Notice */}
        <div className="p-3 bg-[#EFF5F1] border border-[#D5E5D9] rounded-xl text-center">
          <p className="text-xs font-semibold text-[#557A61]">
            Attendance Finalized &bull; Completed
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // VIEW: MAIN ATTENDANCE HISTORY LIST
  // ==========================================================
  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 pb-20 px-3 sm:px-4">
      {/* Header */}
      <div className="border-b border-[#E5E2DC] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-2">
          {onBackToAttendance && (
            <button
              onClick={onBackToAttendance}
              className="p-2 -ml-2 text-[#20201F] hover:text-[#5B4B8A] transition-colors cursor-pointer flex items-center justify-center shrink-0 mt-0.5"
              title="Go back to attendance"
              aria-label="Go back to attendance"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
          )}

          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#20201F] tracking-tight">
              History
            </h1>
            <p className="text-xs text-[#6F6D68] mt-0.5">
              Previous attendance records
            </p>
          </div>
        </div>

        {/* Single [ Export ] Menu Button */}
        <div className="relative" ref={exportRef}>
          <button
            type="button"
            onClick={() => setExportOpen(!exportOpen)}
            className="px-3.5 py-2 bg-[#FFFFFF] border border-[#E5E2DC] hover:border-[#C8C4BD] text-[#20201F] text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#6F6D68]" />
            <span>Export</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#6F6D68]" />
          </button>

          {exportOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={handleExportPDF}
                className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#20201F] hover:bg-[#F4F1F8] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#6F6D68]" />
                <span>Download Daily PDF</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#20201F] hover:bg-[#F4F1F8] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#557A61]" />
                <span>Export Excel</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Compact Date Strip */}
      <FullWidthDateRail
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        recordedDates={recordedDates}
        weekOffset={weekOffset}
        onWeekChange={setWeekOffset}
        mode="history"
      />

      {/* Top Filter Bar: [ Class ] */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6F6D68]">Class:</span>
          <div className="relative inline-block">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="appearance-none h-8 pl-3 pr-8 bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg text-xs text-[#20201F] font-medium hover:border-[#C8C4BD] focus:outline-none focus:border-[#5B4B8A] transition-colors cursor-pointer shadow-2xs"
            >
              <option value="all">All Classes</option>
              {classesList.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#6F6D68] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <span className="text-xs text-[#6F6D68]">
          {historyItems.length} {historyItems.length === 1 ? 'record' : 'records'}
        </span>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-[#20201F] tracking-tight">
            {DataService.formatNaturalHistoryDate(selectedDate)}
          </h2>
          <p className="text-xs text-[#6F6D68] mt-0.5">
            Attendance records
          </p>
        </div>

        {historyItems.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-8 text-center space-y-1 shadow-2xs">
            <p className="text-sm font-medium text-[#20201F]">
              No attendance records found for this date.
            </p>
            <p className="text-xs text-[#6F6D68]">
              Select another working day from the date selector above.
            </p>
          </div>
        ) : (
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl divide-y divide-[#E5E2DC] overflow-hidden shadow-2xs">
            {historyItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveRecord(item)}
                className="w-full text-left px-4 py-3.5 flex items-center justify-between hover:bg-[#F9F8F6] transition-colors cursor-pointer group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-semibold text-[#20201F] group-hover:text-[#5B4B8A] transition-colors">
                      {item.display_name}
                    </span>
                    <span className="text-[11px] font-semibold text-[#557A61] bg-[#EFF5F1] px-2 py-0.5 rounded-md">
                      Completed
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#6F6D68] mt-1">
                    <span>{item.present_count} present</span>
                    <span>&bull;</span>
                    <span className={item.absent_count > 0 ? 'text-[#B65C55] font-semibold' : ''}>
                      {item.absent_count} absent
                    </span>
                    <span>&bull;</span>
                    <span className="font-semibold text-[#20201F]">{item.percentage}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#6F6D68] group-hover:text-[#5B4B8A] transition-colors">
                  <span className="hidden sm:inline text-[11px] font-medium text-[#5B4B8A]">View Detail</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
