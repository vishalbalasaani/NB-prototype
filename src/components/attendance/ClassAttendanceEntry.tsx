'use client';

import React, { useState, useEffect } from 'react';
import { User, Student } from '@/types';
import { DataService } from '@/lib/data-service';
import {
  ArrowLeft,
  Check,
  Search,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface ClassAttendanceEntryProps {
  user: User;
  classId: string;
  selectedDate: string;
  onBack: () => void;
  onSuccess: (summary: {
    className: string;
    total: number;
    present: number;
    absent: number;
  }) => void;
}

// Format date to "29 September 2026"
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

export function ClassAttendanceEntry({
  user,
  classId,
  selectedDate,
  onBack,
  onSuccess,
}: ClassAttendanceEntryProps) {
  // Class details
  const classes = DataService.getClasses();
  const cls = classes.find((c) => c.id === classId);
  const className = cls?.name || 'Class';

  // Students in class (sorted by roll number)
  const students: Student[] = DataService.getStudentsByClass(classId);

  // Workflow steps: 'mark' | 'preview' | 'success'
  const [step, setStep] = useState<'mark' | 'preview' | 'success'>('mark');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Selected absent student IDs (empty by default -> everyone present!)
  const [absentIds, setAbsentIds] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Toggle absent state
  const toggleAbsent = (studentId: string) => {
    setAbsentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Filter students by search query
  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return s.full_name.toLowerCase().includes(q) || s.roll_number.toLowerCase().includes(q);
  });

  const totalCount = students.length;
  const absentCount = absentIds.length;
  const presentCount = Math.max(0, totalCount - absentCount);
  const absentStudents = students.filter((s) => absentIds.includes(s.id));

  // Automatically transition from success state to return to class grid after 2.2 seconds
  useEffect(() => {
    if (step !== 'success') return;
    const timer = setTimeout(() => {
      onSuccess({
        className,
        total: totalCount,
        present: presentCount,
        absent: absentCount,
      });
    }, 2200);
    return () => clearTimeout(timer);
  }, [step, className, totalCount, presentCount, absentCount, onSuccess]);

  // Confirm attendance handler
  const handleConfirmAttendance = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const saveRes = await DataService.saveAttendance({
        classId,
        date: selectedDate,
        absentStudentIds: absentIds,
        userId: user.id,
      });

      if (!saveRes.success) {
        setErrorMessage(saveRes.error || 'Attendance could not be saved. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Attendance recorded immediately. Attendance enters HOLD state.
      setIsSubmitting(false);
      // Trigger calm, clean success animation state
      setStep('success');
    } catch {
      setErrorMessage('Attendance could not be saved. Please try again.');
      setIsSubmitting(false);
    }
  };

  // ==========================================================
  // STAGE 3: SUCCESS STATE
  // Visible for ~2 seconds then automatically returns to grid
  // ==========================================================
  if (step === 'success') {
    return (
      <div className="py-20 sm:py-28 text-center max-w-md mx-auto space-y-5 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-full bg-[#EFF5F1] text-[#557A61] border border-[#D5E5D9] flex items-center justify-center mx-auto shadow-2xs">
          <Check className="w-8 h-8 stroke-[2.5]" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-semibold text-[#20201F] tracking-tight">
            Attendance recorded
          </h2>
          <p className="text-sm font-semibold text-[#20201F] mt-1">
            {className}
          </p>
          <p className="text-xs text-[#6F6D68]">
            {formatDisplayDate(selectedDate)}
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // STAGE 2: PREVIEW ABSENTEES SCREEN
  // Single back arrow beside title, single Confirm Attendance action
  // ==========================================================
  if (step === 'preview') {
    return (
      <div className="max-w-xl mx-auto space-y-6 pb-20 animate-in fade-in duration-200">
        {/* Header with single unboxed ArrowLeft */}
        <div className="border-b border-[#E5E2DC] pb-4 flex items-start gap-2">
          <button
            onClick={() => setStep('mark')}
            className="p-2 -ml-2 text-[#20201F] hover:text-[#5B4B8A] transition-colors cursor-pointer flex items-center justify-center shrink-0 mt-0.5"
            title="Back to absentee selection"
            aria-label="Back to absentee selection"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#20201F] tracking-tight">
              Preview &bull; {className}
            </h1>
            <p className="text-xs text-[#6F6D68] mt-0.5">
              {formatDisplayDate(selectedDate)}
            </p>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-[#FBF1F0] border border-[#F3D7D5] text-[#B65C55] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Absentees Section */}
        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 shadow-2xs space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6F6D68]">
            Absentees
          </h2>

          {absentStudents.length === 0 ? (
            <p className="text-xs text-[#557A61] py-2 font-medium">
              No students marked absent. All {totalCount} students will be recorded as present.
            </p>
          ) : (
            <div className="divide-y divide-[#E5E2DC]">
              {absentStudents.map((s) => (
                <div key={s.id} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[#6F6D68] font-medium w-7">
                      Roll {s.roll_number}
                    </span>
                    <span className="font-medium text-[#20201F]">
                      {s.full_name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-[#B65C55]">
                    Absent
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 text-xs text-[#6F6D68] border-t border-[#E5E2DC]/80">
            <span>{presentCount} Present &bull; {absentCount} Absent &bull; Total {totalCount}</span>
          </div>
        </div>

        {/* Single Primary Action: [ Confirm Attendance ] */}
        <div className="pt-2">
          <button
            onClick={handleConfirmAttendance}
            disabled={isSubmitting}
            className="w-full py-3 bg-[#5B4B8A] hover:bg-[#433665] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Recording...</span>
              </>
            ) : (
              <span>Confirm Attendance</span>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // STAGE 1: STUDENT ABSENT SELECTION
  // All students present by default. Tap to select absentees.
  // ==========================================================
  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-28 animate-in fade-in duration-150">
      {/* Class Header with single unboxed ArrowLeft */}
      <div className="border-b border-[#E5E2DC] pb-3 flex items-start gap-2">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-[#20201F] hover:text-[#5B4B8A] transition-colors cursor-pointer flex items-center justify-center shrink-0 mt-0.5"
          title="Back to pending classes"
          aria-label="Back to pending classes"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#20201F] tracking-tight">
            {className}
          </h1>
          <p className="text-xs text-[#6F6D68] mt-0.5">
            {totalCount} students &bull; {formatDisplayDate(selectedDate)}
          </p>
        </div>
      </div>

      {/* Instruction */}
      <div>
        <p className="text-xs sm:text-sm font-medium text-[#20201F]">
          Select the students who are absent today.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8B85]" />
        <input
          type="text"
          placeholder="Search student or roll number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg focus:outline-none focus:border-[#5B4B8A] transition-colors"
        />
      </div>

      {/* Student List (Clean list: selection circle, name, roll number) */}
      <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl divide-y divide-[#E5E2DC] overflow-hidden shadow-2xs">
        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#6F6D68]">
            No students found matching &quot;{searchQuery}&quot;
          </div>
        ) : (
          filteredStudents.map((student) => {
            const isAbsent = absentIds.includes(student.id);

            return (
              <div
                key={student.id}
                onClick={() => toggleAbsent(student.id)}
                className={`flex items-center gap-3.5 px-4 py-3 transition-colors cursor-pointer select-none ${
                  isAbsent ? 'bg-[#FAF3F2]' : 'hover:bg-[#FDFCFB]'
                }`}
              >
                {/* Checkbox: □ when present, ✓ when absent */}
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                    isAbsent
                      ? 'border-[#B65C55] bg-[#B65C55] text-white'
                      : 'border-[#C8C5BF] bg-[#FFFFFF]'
                  }`}
                >
                  {isAbsent && <Check className="w-3 h-3 stroke-[3]" />}
                </div>

                {/* Student Name & Roll Number */}
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-xs sm:text-sm font-medium block truncate ${
                      isAbsent ? 'text-[#B65C55] font-semibold' : 'text-[#20201F]'
                    }`}
                  >
                    {student.full_name}
                  </span>
                  <span className="text-[11px] text-[#6F6D68] block mt-0.5 font-mono">
                    Roll {student.roll_number}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Sticky Action Bar: Absent Count + [ Review Absentees ] */}
      <div className="fixed bottom-0 left-0 right-0 p-3.5 sm:p-4 bg-[#FFFFFF] border-t border-[#E5E2DC] z-30 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs sm:text-sm font-semibold text-[#20201F]">
              {absentIds.length === 0
                ? 'All students present'
                : `${absentIds.length} ${absentIds.length === 1 ? 'student absent' : 'students absent'}`}
            </p>
          </div>

          <button
            onClick={() => setStep('preview')}
            className="px-5 py-2.5 bg-[#5B4B8A] hover:bg-[#433665] text-white text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Review Absentees
          </button>
        </div>
      </div>
    </div>
  );
}
