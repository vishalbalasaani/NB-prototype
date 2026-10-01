// ==========================================================
// SCHOOL UPDATES MODULE TYPES & INTERFACES
// ==========================================================

export type UpdateType =
  | 'holiday'
  | 'examination'
  | 'timetable'
  | 'hall_ticket'
  | 'school_event'
  | 'parent_meeting'
  | 'important_notice'
  | 'timing_change'
  | 'other';

export type UpdateAudienceType = 'entire_school' | 'selected_classes' | 'specific_student';
export type UpdateStatus = 'draft' | 'published' | 'failed';

export interface SchoolUpdate {
  id: string;
  school_id: string;
  created_by?: string;
  type: UpdateType;
  title: string;
  message: string;
  start_date?: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
  event_date?: string; // YYYY-MM-DD
  event_time?: string;
  reopening_date?: string; // YYYY-MM-DD
  new_start_time?: string;
  new_close_time?: string;
  audience_type: UpdateAudienceType;
  audience_data?: {
    class_ids?: string[];
    class_names?: string[];
    student_id?: string;
    student_name?: string;
    roll_number?: string;
  };
  attachment_name?: string;
  attachment_size?: string;
  attachment_url?: string;
  status: UpdateStatus;
  created_at: string;
  updated_at?: string;
}

export interface UpdateNotification {
  id: string;
  update_id: string;
  school_id: string;
  student_id?: string;
  parent_id?: string;
  phone_number: string;
  message_content: string;
  status: 'sent' | 'failed';
  created_at: string;
}
