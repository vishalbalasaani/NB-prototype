// ==========================================================
// DATABASE & IMPORT AUDIT RECORD TYPES
// ==========================================================

export interface ColumnMapping {
  student_name: string;
  roll_number: string;
  class_name: string;
  section_name: string;
  parent_name: string;
  parent_phone: string;
  admission_number?: string;
}

export interface ImportValidationIssue {
  row: number;
  field: string;
  message: string;
}

export interface ImportRecord {
  id: string;
  school_id: string;
  import_type: 'students' | 'marks' | 'attendance';
  file_name: string;
  storage_path?: string;
  file_size?: number;
  file_type?: string;
  status: 'processing' | 'completed' | 'failed';
  students_processed: number;
  subjects_processed: number;
  records_processed: number;
  records_failed: number;
  imported_by?: string;
  created_at: string;
  completed_at?: string;
  error_summary?: string;
}
