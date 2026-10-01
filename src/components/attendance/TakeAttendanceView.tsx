'use client';

import React, { useState } from 'react';
import { User, Student } from '@/types';
import { DataService, CURRENT_DATE } from '@/lib/data-service';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Send,
  Check,
} from 'lucide-react';

interface TakeAttendanceViewProps {
  user: User;
  classId: string;
  sectionId: string;
  onBack: () => void;
  onAttendanceCompleted: () => void;
}

export function TakeAttendanceView({
  user,
  classId,
  sectionId,
  onBack,
  onAttendanceCompleted,
}: TakeAttendanceViewProps) {
  // Get Class & Section info
  const classes = DataService.getClasses();
  const sections = DataService.getSections();
  const targetClass = classes.find((c) => c.id === classId);
  const targetSection = sections.find((s) => s.id === sectionId);
  const classDisplayName = `${targetClass?.name || 'Class 7'}-${targetSection?.name || 'A'}`;

  // Check if session is already completed today
  const todayClasses = DataService.getTodayClassesStatus(DataService.getSchoolTodayDate());
  const currentClassStatus = todayClasses.find(
    (c) => c.class_id === classId && c.section_id === sectionId
  );
  const isAlreadyCompleted = currentClassStatus?.status === 'completed';

  // Students in this class
  const students: Student[] = DataService.getStudentsByClassAndSection(classId, sectionId);

  // Absent student IDs state.
  // CRITICAL RULE: Default is NOT absent! Only marked students are absent.
  const [absentIds, setAbsentIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Completion modal / states
  const [completionStep, setCompletionStep] = useState<
    'initial' | 'saved' | 'notified'
  >('initial');
  const [notifiedCount, setNotifiedCount] = useState<number>(0);

  const toggleAbsent = (studentId: string) => {
    if (isAlreadyCompleted) return; // Prevent edits in completed mode
    setAbsentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSaveAndAlert = async () => {
    if (isAlreadyCompleted) {
      setErrorMessage('Attendance already completed for today. Duplicate attendance is prevented.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Save attendance to Supabase / DataService
      const saveRes = await DataService.saveAttendance({
        classId,
        sectionId,
        date: CURRENT_DATE,
        absentStudentIds: absentIds,
        userId: user.id,
      });

      if (!saveRes.success) {
        setErrorMessage(saveRes.error || 'Failed to save attendance.');
        setIsSubmitting(false);
        return;
      }

      // Attendance saved immediately and enters HOLD state.
      setCompletionStep('saved');
    } catch {
      setErrorMessage('An unexpected error occurred while saving attendance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-28">
      {/* Back Header */}
      <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#5B4B8A] hover:text-[#433665] transition-colors py-1.5 px-2 -ml-2 rounded-md hover:bg-[#F0EDF6]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Attendance</span>
        </button>

        <span className="text-xs text-[#6F6D68]">
          {DataService.formatDisplayDate(DataService.getSchoolTodayDate())}
        </span>
      </div>

      {/* Class Meta Card */}
      <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#20201F]">
              {classDisplayName}
            </h1>
            <p className="text-xs text-[#6F6D68] mt-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{Math.max(students.length, 30)} students enrolled</span>
            </p>
          </div>

          {isAlreadyCompleted ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[#EFF5F1] text-[#557A61] border border-[#D5E5D9]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Attendance Completed
            </span>
          ) : (
            <span className="text-xs px-2.5 py-1 rounded-md bg-[#F7F6F3] text-[#6F6D68] border border-[#E5E2DC]">
              Pending Today
            </span>
          )}
        </div>

        {/* Clear Instructions */}
        {!isAlreadyCompleted && (
          <div className="mt-4 pt-4 border-t border-[#E5E2DC]/80">
            <p className="text-sm font-medium text-[#20201F]">
              Select the students who are absent today.
            </p>
            <p className="text-xs text-[#6F6D68] mt-0.5">
              All students are present by default. Tap on a student only if they are absent.
            </p>
          </div>
        )}

        {isAlreadyCompleted && (
          <div className="mt-4 pt-4 border-t border-[#E5E2DC]/80 bg-[#FBFBFA] p-3 rounded-lg border border-[#E5E2DC]">
            <p className="text-xs text-[#20201F] font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#557A61]" />
              Attendance already completed for today.
            </p>
            <p className="text-xs text-[#6F6D68] mt-1">
              To preserve official school register integrity, duplicate attendance entries are prevented.
            </p>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-[#FBF1F0] border border-[#F3D7D5] text-[#B65C55] text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Student List */}
      <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl shadow-2xs overflow-hidden">
        <div className="px-4 py-3 bg-[#FBFBFA] border-b border-[#E5E2DC] flex items-center justify-between text-xs text-[#6F6D68] uppercase tracking-wider font-medium">
          <span>Student</span>
          <span>Status (Absent)</span>
        </div>

        <div className="divide-y divide-[#E5E2DC]/60">
          {students.map((student) => {
            const isAbsent = absentIds.includes(student.id);

            return (
              <div
                key={student.id}
                onClick={() => !isAlreadyCompleted && toggleAbsent(student.id)}
                className={`p-3.5 sm:p-4 flex items-center justify-between transition-colors select-none ${
                  isAlreadyCompleted
                    ? 'opacity-85'
                    : 'cursor-pointer hover:bg-[#F9F8F6]'
                } ${isAbsent ? 'bg-[#FDF3F2]' : ''}`}
              >
                {/* Roll Number & Name */}
                <div className="flex items-center gap-3.5 min-w-0 pr-3">
                  <span className="w-8 h-8 rounded-md bg-[#F7F6F3] border border-[#E5E2DC] text-[#6F6D68] text-xs font-semibold flex items-center justify-center shrink-0">
                    {student.roll_number}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        isAbsent ? 'text-[#B65C55]' : 'text-[#20201F]'
                      }`}
                    >
                      {student.full_name}
                    </p>
                    <p className="text-xs text-[#6F6D68] truncate">
                      Parent: {student.parent?.guardian_name} ({student.parent?.whatsapp_number})
                    </p>
                  </div>
                </div>

                {/* Checkbox / Toggle for Absent */}
                <div className="shrink-0 flex items-center gap-2">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      isAbsent
                        ? 'bg-[#FBF1F0] text-[#B65C55] border border-[#F2D0CE]'
                        : 'text-[#8E8B85]'
                    }`}
                  >
                    {isAbsent ? 'Absent' : 'Present'}
                  </span>
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      isAbsent
                        ? 'bg-[#B65C55] border-[#B65C55] text-white'
                        : 'border-[#D3CFC7] bg-[#FFFFFF]'
                    }`}
                  >
                    {isAbsent && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Bar for Taking Attendance */}
      {!isAlreadyCompleted && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#FFFFFF] border-t border-[#E5E2DC] z-30 shadow-lg flex items-center justify-center">
          <div className="w-full max-w-2xl flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#20201F]">
                {absentIds.length === 0
                  ? 'All students present'
                  : `${absentIds.length} student${absentIds.length > 1 ? 's' : ''} absent`}
              </p>
              <p className="text-xs text-[#6F6D68]">Ready to save register</p>
            </div>

            <button
              onClick={handleSaveAndAlert}
              disabled={isSubmitting}
              className="btn-primary h-11 px-5 bg-[#5B4B8A] hover:bg-[#433665] text-white text-sm font-medium rounded-lg flex items-center gap-2 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Attendance Alerts</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Compact Success Modal (No Confetti, No celebration noise) */}
      {completionStep !== 'initial' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-6 max-w-sm w-full shadow-lg">
            <div className="w-10 h-10 rounded-full bg-[#EFF5F1] text-[#557A61] flex items-center justify-center mx-auto mb-4 border border-[#D5E5D9]">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>

            <h3 className="text-base font-semibold text-[#20201F] text-center">
              Attendance completed
            </h3>

            <p className="text-sm text-[#6F6D68] text-center mt-1">
              {absentIds.length > 0
                ? `${absentIds.length} student${
                    absentIds.length > 1 ? 's' : ''
                  } marked absent.`
                : 'All students recorded as present.'}
            </p>

            {completionStep === 'notified' && absentIds.length > 0 && (
              <div className="mt-3 p-3 bg-[#FBFBFA] border border-[#E5E2DC] rounded-lg text-center text-xs text-[#20201F]">
                <p className="font-medium text-[#557A61]">Attendance alerts sent</p>
                <p className="text-[#6F6D68] mt-0.5">
                  {notifiedCount} parent{notifiedCount > 1 ? 's have' : ' has'} been notified.
                </p>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => {
                  onAttendanceCompleted();
                }}
                className="btn-primary w-full h-10 bg-[#5B4B8A] hover:bg-[#433665] text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
