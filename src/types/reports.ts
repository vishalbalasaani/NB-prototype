// ==========================================================
// REPORT MODULE TYPES & INTERFACES
// ==========================================================

import { Student } from './students';

export type ReportScope = 'school' | 'class' | 'student';

export interface StudentAttendanceReportRecord {
  date: string;
  status: 'present' | 'absent';
}

export interface StudentProfileReport {
  student: Student;
  className: string;
  records: StudentAttendanceReportRecord[];
}

export interface ClassStudentReportSummary {
  studentId: string;
  fullName: string;
  rollNumber: string;
  admissionNumber: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
}

export interface ClassBreakdownItem {
  classId: string;
  className: string;
  studentCount: number;
  present: number;
  absent: number;
  total: number;
  percentage: number;
}

export interface TrendDayItem {
  date: string;
  displayDate: string;
  hasData: boolean;
  percentage: number | null;
  present: number;
  absent: number;
}

export interface LowAttendanceAlertItem {
  id: string;
  name: string;
  rollNumber: string;
  className: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
  parentName: string;
  parentPhone: string;
}

export interface UnifiedAttendanceReport {
  scope: 'all_classes' | 'class' | 'student';
  totalRecords: number;
  presentRecords: number;
  absentRecords: number;
  attendancePercentage: number;
  presentPercentage: number;
  absentPercentage: number;
  classBreakdown: ClassBreakdownItem[];
  classStudents: ClassStudentReportSummary[];
  studentProfile: StudentProfileReport | null;
  trend: TrendDayItem[];
  lowAttendanceStudents: LowAttendanceAlertItem[];
}
