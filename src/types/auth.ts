// ==========================================================
// AUTHENTICATION & SCHOOL ENTITY TYPES
// ==========================================================

export type UserRole = 'management' | 'attendance' | 'teacher';

export interface User {
  id: string;
  school_id: string;
  auth_user_id?: string;
  email: string;
  name?: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface School {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  academic_year?: string;
  created_at?: string;
  updated_at?: string;
}
