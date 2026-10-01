// ==========================================================
// MARKS & EXAMINATION MODULE TYPES & INTERFACES
// ==========================================================

export type ExamStatus = 'draft' | 'completed' | 'published';
export type ResultStatus = 'pass' | 'fail';

export interface Examination {
  id: string;
  school_id: string;
  academic_year: string; // e.g. "2026-2027"
  name: string; // e.g. "Half-Yearly Examination", "Unit Test 1"
  start_date?: string;
  end_date?: string;
  status: ExamStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Subject {
  id: string;
  school_id: string;
  name: string;
  code: string;
  maximum_marks?: number;
  created_at?: string;
  updated_at?: string;
}

export interface StudentSubjectMark {
  id: string;
  student_result_id?: string;
  student_id: string;
  subject_id: string;
  subject_name: string;
  maximum_marks: number;
  marks_obtained: number;
  created_at?: string;
  updated_at?: string;
}

export interface StudentResult {
  id: string;
  school_id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  admission_number?: string;
  parent_name?: string;
  parent_phone?: string;
  examination_id: string;
  examination_name: string;
  academic_year: string;
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  total_marks: number;
  maximum_marks: number;
  percentage: number;
  grade: string;
  result_status: ResultStatus;
  report_path?: string;
  report_url?: string;
  subject_marks: StudentSubjectMark[];
  finalized_at: string;
  published_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface MarksImportRecord {
  id: string;
  school_id: string;
  examination_id: string;
  examination_name: string;
  class_id: string;
  class_name: string;
  file_name: string;
  students_processed: number;
  subjects_processed: number;
  imported_by?: string;
  created_at: string;
}

export interface ParsedStudentMarksRow {
  roll_number: string;
  student_name: string;
  admission_number?: string;
  subject_marks: {
    subject_name: string;
    marks_obtained: number;
    maximum_marks: number;
  }[];
}
