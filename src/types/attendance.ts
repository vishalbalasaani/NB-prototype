// ==========================================================
// ATTENDANCE MODULE TYPES & INTERFACES
// ==========================================================

import { Student } from './students';

export type AttendanceSessionStatus = 'pending' | 'completed';
export type AttendanceNotificationStatus = 'not_sent' | 'sent' | 'held' | 'partial';
export type AttendanceStatus = 'present' | 'absent';

export interface AttendanceSession {
  id: string;
  school_id: string;
  class_id: string;
  section_id: string;
  date: string; // YYYY-MM-DD
  status: AttendanceSessionStatus;
  completed_at?: string | null;
  completed_by?: string | null;
  notification_status?: AttendanceNotificationStatus;
  notification_release_at?: string | null;
  notification_sent_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceRecord {
  id: string;
  school_id: string;
  attendance_session_id: string;
  student_id: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  created_at?: string;
  created_by?: string;
  student?: Student;
}

export interface AttendanceNotification {
  id: string;
  school_id: string;
  attendance_record_id: string;
  parent_id: string;
  phone_number: string;
  message_content?: string;
  status: 'sent' | 'failed' | 'pending';
  created_at?: string;
  updated_at?: string;
}

export interface TodayClassStatus {
  class_id: string;
  section_id: string;
  class_name: string; // e.g. "Class 6"
  section_name: string; // e.g. "A"
  display_name: string; // e.g. "Class 6-A"
  student_count: number;
  absent_count: number;
  present_count: number;
  status: AttendanceSessionStatus;
  notification_status?: AttendanceNotificationStatus;
  notification_release_at?: string | null;
  notification_sent_at?: string | null;
  completed_at?: string | null;
  session_id?: string | null;
}

export interface AttendanceHistoryItem {
  id: string;
  class_id?: string;
  section_id?: string;
  date: string;
  class_name: string;
  section_name: string;
  display_name: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  percentage: number;
  completed_at: string;
  session_id: string;
  notification_status?: AttendanceNotificationStatus;
  notification_release_at?: string | null;
  notification_sent_at?: string | null;
  absent_students: {
    student_id: string;
    roll_number: string;
    name: string;
    parent_phone?: string;
  }[];
}

export interface StudentHistoryRecord {
  date: string;
  status: AttendanceStatus;
}

export interface StudentAttendanceHistorySummary {
  student: Student;
  class_name: string;
  section_name: string;
  total_days: number;
  present_count: number;
  absent_count: number;
  percentage: number;
  records: StudentHistoryRecord[];
}

export interface AnalyticsSummary {
  overall_percentage: number;
  total_students: number;
  present_today: number;
  absent_today: number;
  weekly_trend: {
    day: string;
    percentage: number;
    present: number;
    absent: number;
  }[];
  class_attendance: {
    class_name: string;
    percentage: number;
    total: number;
    present: number;
    absent: number;
  }[];
  low_attendance_students: {
    id: string;
    name: string;
    roll_number: string;
    class_name: string;
    percentage: number;
    parent_name: string;
    parent_phone: string;
  }[];
}

export interface WorkingDayItem {
  date: string;
  dayName: string;
  weekday?: string;
  dayNum: string | number;
  monthName: string;
  month?: string;
  isToday: boolean;
  formattedLabel?: string;
}
