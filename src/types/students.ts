// ==========================================================
// CLASS, SECTION, STUDENT & PARENT TYPES
// ==========================================================

export interface SchoolClass {
  id: string;
  school_id: string;
  name: string;
  grade_level?: number;
  display_order?: number;
  created_at?: string;
}

export interface Section {
  id: string;
  school_id: string;
  class_id: string;
  name: string;
  created_at?: string;
}

export interface Parent {
  id: string;
  school_id: string;
  student_id?: string;
  name: string;
  guardian_name?: string;
  phone: string;
  whatsapp_number?: string;
  email?: string;
  relationship?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Student {
  id: string;
  school_id: string;
  student_id: string; // unique admission number/code
  admission_number?: string;
  roll_number: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  class_id: string;
  section_id: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  status?: 'active' | 'inactive' | 'transferred';
  parent?: Parent;
  created_at?: string;
  updated_at?: string;
}

export interface StudentParent {
  id: string;
  school_id: string;
  student_id: string;
  parent_id: string;
  is_primary: boolean;
  created_at?: string;
}
