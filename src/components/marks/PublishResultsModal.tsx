'use client';

import React, { useState } from 'react';
import { DataService } from '@/lib/data-service';
import { X, Send, Check, Loader2 } from 'lucide-react';

interface PublishResultsModalProps {
  onClose: () => void;
  onPublishSuccess: () => void;
  initialExamId?: string;
  initialClassId?: string;
}

export function PublishResultsModal({
  onClose,
  onPublishSuccess,
  initialExamId,
  initialClassId,
}: PublishResultsModalProps) {
  const currentSchool = DataService.getCurrentSchool();
  const examinations = DataService.getExaminations();
  const classes = DataService.getClasses();

  const [selectedExamId, setSelectedExamId] = useState(
    initialExamId || examinations[0]?.id || 'e0000000-0000-0000-0000-000000000001'
  );
  const [selectedClassId, setSelectedClassId] = useState(
    initialClassId || classes[0]?.id || 'c0000000-0000-0000-0000-000000000005'
  );

  const [phase, setPhase] = useState<'review' | 'publishing' | 'success'>('review');
  const [notificationCount, setNotificationCount] = useState(0);

  const selectedExam = examinations.find((e) => e.id === selectedExamId) || examinations[0];
  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  // Fetch results for this class and examination
  const classResults = DataService.getClassDetailedResults(selectedExamId, selectedClassId);
  const studentCount = classResults?.studentCount || 42;

  const schoolName = currentSchool?.name || 'Sri Vidya High School';

  const defaultMessage = `Dear Parent,

Your child's ${selectedExam.name} result is now available.

Regards,
${schoolName}`;

  const [customMessage, setCustomMessage] = useState(defaultMessage);

  const handlePublish = async () => {
    setPhase('publishing');

    setTimeout(async () => {
      const res = await DataService.publishMarksResults(
        'class',
        selectedExamId,
        [selectedClassId]
      );

      const count = res.publishedCount || studentCount;
      setNotificationCount(count);
      setPhase('success');
    }, 500);
  };

  const handleDone = () => {
    onPublishSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-100">
      <div className="bg-white rounded-xl border border-[#E5E2DC] shadow-lg w-full max-w-md overflow-hidden text-[#20201F]">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#E5E2DC] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#20201F]">
            {phase === 'success' ? 'Results published' : `Publish ${selectedExam.name} Results`}
          </h2>
          {phase !== 'publishing' && (
            <button
              onClick={onClose}
              className="text-[#6F6D68] hover:text-[#20201F] p-1 rounded-sm cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 text-xs sm:text-sm">

          {/* ================================================== */}
          {/* SECTION 31: SIMPLE REVIEW DIALOG                   */}
          {/* ================================================== */}
          {phase === 'review' && (
            <div className="space-y-4">
              {/* Class selection dropdown if not preset */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#20201F]">
                  Class
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full bg-white border border-[#D5D2CB] rounded-md px-3 py-2 text-xs text-[#20201F] focus:outline-hidden focus:border-[#5B4B8A] cursor-pointer"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Review metrics */}
              <div className="py-2.5 px-3.5 bg-[#FAF9F7] border border-[#E5E2DC] rounded-lg space-y-1 text-xs text-[#20201F]">
                <p className="font-semibold text-sm">
                  {selectedClass.name}
                </p>
                <div className="text-xs text-[#6F6D68] space-y-0.5 pt-1">
                  <p>{studentCount} students</p>
                  <p>{studentCount} reports ready</p>
                  <p className="text-[#557A61] font-medium pt-0.5">
                    {studentCount} parents will receive their child&apos;s individual report.
                  </p>
                </div>
              </div>

              {/* Message preview */}
              <div className="space-y-1 pt-1">
                <label className="block text-xs font-medium text-[#20201F]">
                  Message
                </label>
                <textarea
                  rows={4}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#D5D2CB] rounded-md text-xs text-[#20201F] focus:outline-hidden focus:border-[#5B4B8A] resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E5E2DC]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-[#6F6D68] hover:text-[#20201F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  className="btn-primary text-xs h-8 px-4 cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Results</span>
                </button>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* PUBLISHING STATE (Natural phrasing, Section 38)     */}
          {/* ================================================== */}
          {phase === 'publishing' && (
            <div className="py-10 text-center space-y-2">
              <Loader2 className="w-5 h-5 text-[#5B4B8A] animate-spin mx-auto" />
              <p className="text-xs text-[#20201F] font-medium">Updating results...</p>
            </div>
          )}

          {/* ================================================== */}
          {/* SECTION 33: PUBLISH SUCCESS                        */}
          {/* ================================================== */}
          {phase === 'success' && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#557A61]">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  <p className="text-base font-semibold text-[#20201F]">
                    Results published
                  </p>
                </div>
                <p className="text-xs text-[#6F6D68]">
                  {notificationCount} parents have been notified.
                </p>
              </div>

              <div className="pt-3 border-t border-[#E5E2DC] flex justify-end">
                <button
                  type="button"
                  onClick={handleDone}
                  className="btn-primary text-xs h-8 px-4 cursor-pointer shadow-2xs"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
