'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  UpdateType,
  UpdateAudienceType,
  SchoolUpdate,
} from '@/types';
import {
  DataService,
  CURRENT_DATE,
  calculateNextWorkingDay,
  generateUpdateTemplateMessage,
} from '@/lib/data-service';
import { AudienceSelector } from './AudienceSelector';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  Paperclip,
  Check,
  AlertCircle,
  Loader2,
  Send,
  X,
  File,
} from 'lucide-react';

interface NewUpdateFlowProps {
  user: User;
  onBack: () => void;
  onUpdateSent: () => void;
}

export function NewUpdateFlow({ user, onBack, onUpdateSent }: NewUpdateFlowProps) {
  // Step 1: Type Selection ('select_type')
  // Step 2: Form Editing ('edit')
  // Step 3: Mandatory Preview ('preview')
  // Step 4: Completion Confirmation ('success')
  const [step, setStep] = useState<'select_type' | 'edit' | 'preview' | 'success'>(
    'select_type'
  );

  const [selectedType, setSelectedType] = useState<UpdateType>('holiday');

  // Shared Form Fields
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [reopeningDate, setReopeningDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('08:30 AM');
  const [newCloseTime, setNewCloseTime] = useState('03:30 PM');

  // Audience
  const [audienceType, setAudienceType] = useState<UpdateAudienceType>('entire_school');
  const [audienceData, setAudienceData] = useState<SchoolUpdate['audience_data']>({});

  // Message (Editable textarea)
  const [message, setMessage] = useState('');
  const [hasManuallyEditedMessage, setHasManuallyEditedMessage] = useState(false);

  // Attachment (PDF only)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentSize, setAttachmentSize] = useState<string | null>(null);

  // Validation & Processing
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolvedRecipientCount, setResolvedRecipientCount] = useState<number>(248);
  const [sentSuccessCount, setSentSuccessCount] = useState<number>(0);
  const [partialFailureMessage, setPartialFailureMessage] = useState<string | null>(null);

  // 9 Supported Update Types
  const updateTypes: { id: UpdateType; label: string; desc: string }[] = [
    { id: 'holiday', label: 'Holiday', desc: 'School closure and holiday announcement' },
    { id: 'examination', label: 'Examination', desc: 'Exam schedules, term tests, and instructions' },
    { id: 'timetable', label: 'Timetable', desc: 'Publish examination or class schedules' },
    { id: 'hall_ticket', label: 'Hall Ticket', desc: 'Distribution notice for examination hall tickets' },
    { id: 'school_event', label: 'School Event', desc: 'Annual day, sports day, or celebrations' },
    { id: 'parent_meeting', label: 'Parent Meeting', desc: 'PTM and academic progress consultations' },
    { id: 'important_notice', label: 'Important Notice', desc: 'General circulars and urgent guidelines' },
    { id: 'timing_change', label: 'School Timing Change', desc: 'Adjusted school opening and dismissal hours' },
    { id: 'other', label: 'Other', desc: 'Miscellaneous announcements' },
  ];

  // Pick type & initialize defaults
  const handleSelectType = (type: UpdateType) => {
    setSelectedType(type);
    setValidationError(null);
    setHasManuallyEditedMessage(false);

    // Initial defaults for realistic demonstration
    if (type === 'holiday') {
      setTitle('Dasara Holidays');
      setStartDate('2026-09-18');
      setEndDate('2026-09-20');
      const nextWork = calculateNextWorkingDay('2026-09-20');
      setReopeningDate(nextWork || '2026-09-21');
    } else if (type === 'examination') {
      setTitle('Half-Yearly Examination');
      setStartDate('2026-09-25');
      setEndDate('2026-09-30');
      setEventDate('2026-09-25');
    } else if (type === 'timetable') {
      setTitle('Half-Yearly Examination Timetable');
    } else if (type === 'hall_ticket') {
      setTitle('Half-Yearly Examination Hall Tickets');
    } else if (type === 'school_event') {
      setTitle('Annual Sports Meet');
      setEventDate('2026-10-05');
      setEventTime('09:00 AM');
    } else if (type === 'parent_meeting') {
      setTitle('Term 1 Parent-Teacher Meeting');
      setEventDate('2026-10-10');
      setEventTime('10:00 AM');
    } else if (type === 'timing_change') {
      setTitle('School Timing Change');
      setStartDate('2026-10-01');
      setNewStartTime('08:30 AM');
      setNewCloseTime('03:30 PM');
    } else {
      setTitle('');
    }

    setStep('edit');
  };

  // Re-calculate reopening date whenever Holiday end date changes
  useEffect(() => {
    if (selectedType === 'holiday' && endDate) {
      const nextDay = calculateNextWorkingDay(endDate);
      if (nextDay) setReopeningDate(nextDay);
    }
  }, [selectedType, endDate]);

  // Sync deterministic template message unless user has manually customized it
  useEffect(() => {
    if (hasManuallyEditedMessage) return;

    const audienceLabel =
      audienceType === 'entire_school'
        ? 'Entire School'
        : audienceType === 'selected_classes'
        ? audienceData?.class_names?.length
          ? audienceData.class_names.join(', ')
          : 'Selected Classes'
        : audienceData?.student_name
        ? `${audienceData.student_name} (Roll ${audienceData.roll_number})`
        : 'Specific Student';

    const tmpl = generateUpdateTemplateMessage(selectedType, {
      title,
      holiday_name: title,
      exam_name: title,
      meeting_title: title,
      event_name: title,
      start_date: startDate,
      end_date: endDate,
      event_date: eventDate,
      event_time: eventTime,
      reopening_date: reopeningDate,
      new_start_time: newStartTime,
      new_close_time: newCloseTime,
      audience_label: audienceLabel,
      student_name: audienceData?.student_name,
      has_attachment: Boolean(attachmentName),
      attachment_name: attachmentName || undefined,
    });

    setMessage(tmpl);
  }, [
    selectedType,
    title,
    startDate,
    endDate,
    eventDate,
    eventTime,
    reopeningDate,
    newStartTime,
    newCloseTime,
    audienceType,
    audienceData,
    attachmentName,
    hasManuallyEditedMessage,
  ]);

  // Handle PDF Attachment
  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setValidationError('Please upload a PDF file.');
      return;
    }

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    setAttachmentName(file.name);
    setAttachmentSize(`${sizeInMb} MB`);
    setValidationError(null);
  };

  const handleRemoveAttachment = () => {
    setAttachmentName(null);
    setAttachmentSize(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Validate & Move to Preview
  const handleProceedToPreview = () => {
    setValidationError(null);

    if (!title.trim()) {
      setValidationError('Please enter a title or announcement name.');
      return;
    }

    if (selectedType === 'holiday') {
      if (!startDate) {
        setValidationError('Please specify holiday start date.');
        return;
      }
      if (!endDate) {
        setValidationError('Please specify holiday end date.');
        return;
      }
      if (endDate < startDate) {
        setValidationError('End date cannot be before start date.');
        return;
      }
    }

    if (selectedType === 'examination') {
      if (!startDate) {
        setValidationError('Please specify examination start date.');
        return;
      }
      if (!endDate) {
        setValidationError('Please specify examination end date.');
        return;
      }
      if (endDate < startDate) {
        setValidationError('End date cannot be before start date.');
        return;
      }
    }

    if (selectedType === 'timetable' && !attachmentName) {
      setValidationError('Please attach the examination timetable PDF.');
      return;
    }

    if (selectedType === 'hall_ticket' && !attachmentName) {
      setValidationError('Please attach the hall ticket PDF document.');
      return;
    }

    if (selectedType === 'school_event' && !eventDate) {
      setValidationError('Please specify the event date.');
      return;
    }

    if (selectedType === 'parent_meeting') {
      if (!eventDate) {
        setValidationError('Please specify the meeting date.');
        return;
      }
      if (!eventTime) {
        setValidationError('Please specify the meeting time.');
        return;
      }
    }

    if (selectedType === 'timing_change' && !startDate) {
      setValidationError('Please specify the effective date for the timing change.');
      return;
    }

    if (audienceType === 'selected_classes' && (!audienceData?.class_names || audienceData.class_names.length === 0)) {
      setValidationError('Please select at least one class for this announcement.');
      return;
    }

    if (audienceType === 'specific_student' && !audienceData?.student_id) {
      setValidationError('Please select a specific student.');
      return;
    }

    if (!message.trim()) {
      setValidationError('Please provide the message text to be sent to parents.');
      return;
    }

    // Resolve real recipient count from database
    const resolved = DataService.resolveRecipients(audienceType, audienceData);
    setResolvedRecipientCount(resolved.length);

    setStep('preview');
  };

  // Commit & Send Announcement
  const handleConfirmSend = async () => {
    setIsSubmitting(true);
    setValidationError(null);

    try {
      // 1. Save Update record in database
      const saveRes = await DataService.saveUpdate({
        school_id: user.school_id,
        created_by: user.id,
        type: selectedType,
        title: title.trim(),
        message: message.trim(),
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        event_date: eventDate || undefined,
        event_time: eventTime || undefined,
        reopening_date: reopeningDate || undefined,
        new_start_time: newStartTime || undefined,
        new_close_time: newCloseTime || undefined,
        audience_type: audienceType,
        audience_data: audienceData,
        attachment_name: attachmentName || undefined,
        attachment_size: attachmentSize || undefined,
        status: 'published',
      });

      if (!saveRes.success) {
        setValidationError(saveRes.error || 'Failed to save update.');
        setIsSubmitting(false);
        return;
      }

      // 2. Dispatch Parent Notifications
      const notifRes = await DataService.sendUpdateNotifications(saveRes.update);
      setSentSuccessCount(notifRes.notifiedCount);

      if (notifRes.failedCount > 0) {
        setPartialFailureMessage(
          `Update was saved, but ${notifRes.failedCount} parent${
            notifRes.failedCount > 1 ? 's' : ''
          } could not be notified.`
        );
      }

      setStep('success');
    } catch {
      setValidationError('An unexpected error occurred while sending the update. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAudienceSummary = () => {
    if (audienceType === 'entire_school') return 'Entire School';
    if (audienceType === 'selected_classes') {
      return audienceData?.class_names?.length
        ? audienceData.class_names.join(', ')
        : 'Selected Classes';
    }
    return audienceData?.student_name
      ? `${audienceData.student_name} (Roll ${audienceData.roll_number})`
      : 'Specific Student';
  };

  // STEP 1: TYPE SELECTION
  if (step === 'select_type') {
    return (
      <div className="max-w-xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#5B4B8A] hover:text-[#433665] transition-colors py-1.5 px-2 -ml-2 rounded-md hover:bg-[#F0EDF6]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Updates</span>
          </button>
          <span className="text-xs text-[#6F6D68]">New Announcement</span>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[#20201F]">What do you want to send?</h2>
          <p className="text-xs text-[#6F6D68] mt-1">
            Select the announcement type to prepare the appropriate details and message.
          </p>
        </div>

        {/* Simple Selectable Rows (No complicated card grid) */}
        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl divide-y divide-[#E5E2DC] shadow-2xs overflow-hidden">
          {updateTypes.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectType(item.id)}
              className="w-full text-left p-4 hover:bg-[#F9F8F6] transition-colors flex items-center justify-between group"
            >
              <div>
                <p className="text-sm font-semibold text-[#20201F] group-hover:text-[#5B4B8A] transition-colors">
                  {item.label}
                </p>
                <p className="text-xs text-[#6F6D68] mt-0.5">{item.desc}</p>
              </div>
              <span className="text-xs text-[#A8A59F] group-hover:text-[#5B4B8A] font-medium transition-colors">
                &rarr;
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // STEP 2: FORM EDITOR
  if (step === 'edit') {
    const currentTypeLabel = updateTypes.find((t) => t.id === selectedType)?.label;

    return (
      <div className="max-w-xl mx-auto space-y-6 pb-20">
        <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-4">
          <button
            onClick={() => setStep('select_type')}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#5B4B8A] hover:text-[#433665] transition-colors py-1.5 px-2 -ml-2 rounded-md hover:bg-[#F0EDF6]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <span className="text-xs font-medium text-[#5B4B8A] bg-[#F0EDF6] px-2.5 py-0.5 rounded-full border border-[#D5CEE5]">
            {currentTypeLabel}
          </span>
        </div>

        {validationError && (
          <div className="p-3.5 rounded-lg bg-[#FBF1F0] border border-[#F3D7D5] text-[#B65C55] text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 sm:p-6 shadow-2xs space-y-5">
          {/* Title / Name */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#6F6D68] mb-1.5">
              {selectedType === 'holiday'
                ? 'Holiday Name'
                : selectedType === 'examination' || selectedType === 'hall_ticket'
                ? 'Exam Name'
                : selectedType === 'parent_meeting'
                ? 'Meeting Title'
                : selectedType === 'school_event'
                ? 'Event Name'
                : 'Title'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dasara Holidays, Half-Yearly Exam..."
              className="w-full h-10 px-3 text-sm text-[#20201F] bg-[#FFFFFF] border border-[#E5E2DC] rounded-md focus:outline-none focus:border-[#5B4B8A]"
            />
          </div>

          {/* Holiday Date Range & Automatic Reopening Date */}
          {selectedType === 'holiday' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#6F6D68] mb-1.5">
                    From
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-10 px-3 text-sm bg-[#FFFFFF] border border-[#E5E2DC] rounded-md text-[#20201F] focus:outline-none focus:border-[#5B4B8A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#6F6D68] mb-1.5">
                    To
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-10 px-3 text-sm bg-[#FFFFFF] border border-[#E5E2DC] rounded-md text-[#20201F] focus:outline-none focus:border-[#5B4B8A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[#6F6D68] mb-1.5">
                  Reopening Date (Calculated)
                </label>
                <input
                  type="date"
                  value={reopeningDate}
                  onChange={(e) => setReopeningDate(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-[#FBFBFA] border border-[#E5E2DC] rounded-md text-[#20201F] focus:outline-none focus:border-[#5B4B8A]"
                />
                <p className="text-[11px] text-[#6F6D68] mt-1">
                  Automatically finds the next school working day (Monday–Friday).
                </p>
              </div>
            </div>
          )}

          {/* Examination Date Range */}
          {selectedType === 'examination' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[#6F6D68] mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-[#FFFFFF] border border-[#E5E2DC] rounded-md text-[#20201F] focus:outline-none focus:border-[#5B4B8A]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[#6F6D68] mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-[#FFFFFF] border border-[#E5E2DC] rounded-md text-[#20201F] focus:outline-none focus:border-[#5B4B8A]"
                />
              </div>
            </div>
          )}

          {/* School Event Date & Time */}
          {selectedType === 'school_event' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[#6F6D68] mb-1.5">
                  Event Date
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-[#FFFFFF] border border-[#E5E2DC] rounded-md text-[#20201F] focus:outline-none focus:border-[#5B4B8A]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[#6F6D68] mb-1.5">
                  Time (Optional)
                </label>
                <input
                  type="text"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  placeholder="e.g. 09:30 AM"
                  className="w-full h-10 px-3 text-sm bg-[#FFFFFF] border border-[#E5E2DC] rounded-md text-[#20201F] focus:outline-none focus:border-[#5B4B8A]"
                />
              </div>
            </div>
          )}

          {/* Parent Meeting Date & Time */}
          {selectedType === 'parent_meeting' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[#6F6D68] mb-1.5">
                  Meeting Date
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-[#FFFFFF] border border-[#E5E2DC] rounded-md text-[#20201F] focus:outline-none focus:border-[#5B4B8A]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[#6F6D68] mb-1.5">
                  Meeting Time
                </label>
                <input
                  type="text"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  placeholder="e.g. 10:00 AM"
                  className="w-full h-10 px-3 text-sm bg-[#FFFFFF] border border-[#E5E2DC] rounded-md text-[#20201F] focus:outline-none focus:border-[#5B4B8A]"
                />
              </div>
            </div>
          )}

          {/* School Timing Change */}
          {selectedType === 'timing_change' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[#6F6D68] mb-1.5">
                  Effective Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-[#FFFFFF] border border-[#E5E2DC] rounded-md text-[#20201F] focus:outline-none focus:border-[#5B4B8A]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#6F6D68] mb-1.5">
                    School Start Time
                  </label>
                  <input
                    type="text"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    placeholder="08:30 AM"
                    className="w-full h-10 px-3 text-sm bg-[#FFFFFF] border border-[#E5E2DC] rounded-md text-[#20201F] focus:outline-none focus:border-[#5B4B8A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#6F6D68] mb-1.5">
                    School Closing Time
                  </label>
                  <input
                    type="text"
                    value={newCloseTime}
                    onChange={(e) => setNewCloseTime(e.target.value)}
                    placeholder="03:30 PM"
                    className="w-full h-10 px-3 text-sm bg-[#FFFFFF] border border-[#E5E2DC] rounded-md text-[#20201F] focus:outline-none focus:border-[#5B4B8A]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Audience Selector Component */}
          <AudienceSelector
            audienceType={audienceType}
            audienceData={audienceData}
            onChangeAudience={(newAudience, newData) => {
              setAudienceType(newAudience);
              setAudienceData(newData || {});
            }}
          />

          {/* PDF Attachment (Optional or Required depending on type) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium uppercase tracking-wider text-[#6F6D68]">
                PDF Attachment {selectedType === 'timetable' || selectedType === 'hall_ticket' ? '(Required)' : '(Optional)'}
              </label>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,application/pdf"
              onChange={handleAttachmentUpload}
              className="hidden"
            />

            {attachmentName ? (
              <div className="p-3 bg-[#FBFBFA] border border-[#E5E2DC] rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <File className="w-4 h-4 text-[#5B4B8A] shrink-0" />
                  <span className="font-medium text-[#20201F] truncate">{attachmentName}</span>
                  <span className="text-[#6F6D68] shrink-0">({attachmentSize})</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  className="text-xs text-[#B65C55] hover:text-[#973e38] font-medium"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary h-9 px-3 text-xs flex items-center gap-2"
              >
                <Paperclip className="w-3.5 h-3.5 text-[#5B4B8A]" />
                <span>+ Add PDF</span>
              </button>
            )}
          </div>

          {/* Message Editor (Compact editable textarea) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-[#6F6D68]">
                Message
              </label>
              <span className="text-[11px] text-[#A8A59F]">Editable text</span>
            </div>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setHasManuallyEditedMessage(true);
              }}
              className="w-full p-3 text-xs sm:text-sm text-[#20201F] bg-[#FFFFFF] border border-[#E5E2DC] rounded-md focus:outline-none focus:border-[#5B4B8A] leading-relaxed resize-y"
            />
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleProceedToPreview}
              className="btn-primary w-full h-10 bg-[#5B4B8A] text-sm"
            >
              Preview &amp; Send
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: MANDATORY PREVIEW (Section 27)
  if (step === 'preview') {
    return (
      <div className="max-w-xl mx-auto space-y-6 pb-20">
        <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-4">
          <button
            onClick={() => setStep('edit')}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#5B4B8A] hover:text-[#433665] transition-colors py-1.5 px-2 -ml-2 rounded-md hover:bg-[#F0EDF6]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Edit Update</span>
          </button>
          <span className="text-xs text-[#6F6D68]">Preview Announcement</span>
        </div>

        {validationError && (
          <div className="p-3.5 rounded-lg bg-[#FBF1F0] border border-[#F3D7D5] text-[#B65C55] text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-6 shadow-2xs space-y-5">
          {/* Header Title */}
          <div>
            <h2 className="text-xl font-semibold text-[#20201F]">{title}</h2>
            <div className="flex items-center gap-3 text-xs text-[#6F6D68] mt-1.5">
              <span>To: {formatAudienceSummary()}</span>
              <span>&bull;</span>
              <span className="font-semibold text-[#5B4B8A]">
                {resolvedRecipientCount} parents
              </span>
            </div>
          </div>

          {/* Message Box */}
          <div className="p-4 bg-[#FBFBFA] border border-[#E5E2DC] rounded-lg">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#6F6D68] block mb-2">
              Message Content
            </span>
            <div className="text-xs sm:text-sm text-[#20201F] whitespace-pre-wrap leading-relaxed">
              {message}
            </div>
          </div>

          {/* Attachment Preview */}
          {attachmentName && (
            <div className="p-3 bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg flex items-center gap-2.5 text-xs">
              <File className="w-4 h-4 text-[#5B4B8A] shrink-0" />
              <span className="font-medium text-[#20201F]">{attachmentName}</span>
              <span className="text-[#6F6D68]">({attachmentSize})</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#E5E2DC]/70">
            <button
              type="button"
              onClick={() => setStep('edit')}
              disabled={isSubmitting}
              className="btn-secondary h-10 px-4 text-xs font-medium"
            >
              Back to Edit
            </button>

            <button
              type="button"
              onClick={handleConfirmSend}
              disabled={isSubmitting}
              className="btn-primary h-10 px-6 bg-[#5B4B8A] text-xs font-medium flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Update...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Update</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 4: SUCCESS CONFIRMATION (Compact, No Confetti, No Noise)
  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-6 sm:p-8 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#EFF5F1] text-[#557A61] flex items-center justify-center mx-auto border border-[#D5E5D9]">
          <Check className="w-6 h-6 stroke-[2.5]" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-[#20201F]">Update sent</h3>
          <p className="text-sm text-[#6F6D68] mt-1">
            {sentSuccessCount} parents have been notified.
          </p>
        </div>

        {partialFailureMessage && (
          <div className="p-3 bg-[#FDF7EF] border border-[#F2E0C4] text-[#B8874A] rounded-lg text-xs">
            {partialFailureMessage}
          </div>
        )}

        <div className="pt-4">
          <button
            type="button"
            onClick={onUpdateSent}
            className="btn-primary w-full h-10 bg-[#5B4B8A] text-xs font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
