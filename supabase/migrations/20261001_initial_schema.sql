-- ==========================================================
-- NODEBRICKS SCHOOL MANAGEMENT SYSTEM
-- RELATIONAL POSTGRESQL & SUPABASE DATABASE SCHEMA
-- ==========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================================
-- 1. SCHOOLS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    academic_year TEXT DEFAULT '2026-2027',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- 2. USERS / PROFILES TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    auth_user_id UUID,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('management', 'attendance', 'teacher')),
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- 3. CLASSES TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    display_order INTEGER DEFAULT 1,
    grade_level INTEGER,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_school_class UNIQUE (school_id, name)
);

-- ==========================================================
-- 4. SECTIONS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_class_section UNIQUE (class_id, name)
);

-- ==========================================================
-- 5. STUDENTS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    student_id TEXT NOT NULL, -- admission number / unique identifier in school
    admission_number TEXT,
    roll_number TEXT,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    address TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_school_student_id UNIQUE (school_id, student_id)
);

-- ==========================================================
-- 6. PARENTS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    relationship TEXT DEFAULT 'Parent',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- 7. STUDENT_PARENTS RELATIONSHIP TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.student_parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES public.parents(id) ON DELETE CASCADE NOT NULL,
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_student_parent UNIQUE (student_id, parent_id)
);

-- ==========================================================
-- 8. ATTENDANCE SESSIONS TABLE
-- CRITICAL CONSTRAINT: Exactly ONE session per (school_id, class_id, section_id, date)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_school_class_date UNIQUE (school_id, class_id, date)
);

-- ==========================================================
-- 9. ATTENDANCE RECORDS TABLE
-- Status: present or absent
-- Constraint: unique record per session and student
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    attendance_session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_session_student UNIQUE (attendance_session_id, student_id)
);

-- ==========================================================
-- 10. ATTENDANCE NOTIFICATIONS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.attendance_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    attendance_record_id UUID REFERENCES public.attendance_records(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES public.parents(id) ON DELETE CASCADE NOT NULL,
    phone_number TEXT NOT NULL,
    message_content TEXT,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- 11. EXAMINATIONS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.examinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'published')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- 12. SUBJECTS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_school_subject UNIQUE (school_id, name)
);

-- ==========================================================
-- 13. STUDENT RESULTS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.student_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    examination_id UUID REFERENCES public.examinations(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL,
    total_marks NUMERIC(6, 2) NOT NULL,
    maximum_marks NUMERIC(6, 2) NOT NULL,
    percentage NUMERIC(5, 2) NOT NULL,
    grade TEXT NOT NULL,
    result_status TEXT NOT NULL CHECK (result_status IN ('pass', 'fail')),
    report_path TEXT,
    finalized_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_student_examination UNIQUE (student_id, examination_id)
);

-- ==========================================================
-- 14. STUDENT SUBJECT MARKS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.student_marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    student_result_id UUID REFERENCES public.student_results(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    maximum_marks NUMERIC(5, 2) NOT NULL DEFAULT 100,
    marks_obtained NUMERIC(5, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- 15. IMPORT RECORDS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.import_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    import_type TEXT NOT NULL CHECK (import_type IN ('students', 'marks', 'attendance')),
    file_name TEXT NOT NULL,
    storage_path TEXT,
    file_size INTEGER,
    file_type TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
    students_processed INTEGER NOT NULL DEFAULT 0,
    subjects_processed INTEGER NOT NULL DEFAULT 0,
    records_processed INTEGER NOT NULL DEFAULT 0,
    records_failed INTEGER NOT NULL DEFAULT 0,
    imported_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMPTZ,
    error_summary TEXT
);

-- ==========================================================
-- 16. UPDATES TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    event_date DATE,
    event_time TEXT,
    reopening_date DATE,
    new_start_time TEXT,
    new_close_time TEXT,
    audience_type TEXT NOT NULL CHECK (audience_type IN ('entire_school', 'selected_classes', 'specific_student')),
    audience_data JSONB DEFAULT '{}'::jsonb,
    attachment_name TEXT,
    attachment_size TEXT,
    attachment_url TEXT,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'failed')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- 17. UPDATE NOTIFICATIONS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.update_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    update_id UUID REFERENCES public.updates(id) ON DELETE CASCADE NOT NULL,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.parents(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    message_content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- INDEXES FOR PERFORMANCE
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_users_school ON public.users(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_school ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_sections_class ON public.sections(class_id);
CREATE INDEX IF NOT EXISTS idx_students_school ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class_section ON public.students(school_id, class_id, section_id);
CREATE INDEX IF NOT EXISTS idx_students_admission ON public.students(school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_parents_school ON public.parents(school_id);
CREATE INDEX IF NOT EXISTS idx_student_parents_student ON public.student_parents(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON public.attendance_sessions(school_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class ON public.attendance_sessions(school_id, class_id, section_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON public.attendance_records(attendance_session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON public.attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON public.attendance_records(school_id, date);
CREATE INDEX IF NOT EXISTS idx_student_results_school ON public.student_results(school_id);
CREATE INDEX IF NOT EXISTS idx_student_results_student ON public.student_results(student_id);
CREATE INDEX IF NOT EXISTS idx_student_results_exam ON public.student_results(examination_id);
CREATE INDEX IF NOT EXISTS idx_student_marks_result ON public.student_marks(student_result_id);
CREATE INDEX IF NOT EXISTS idx_import_records_school ON public.import_records(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_updates_school ON public.updates(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_update_notifications_update ON public.update_notifications(update_id);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-tenant isolation: every query is scoped to user's school_id
-- ==========================================================
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.update_notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to resolve the current authenticated user's school_id
CREATE OR REPLACE FUNCTION public.get_user_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM public.users
  WHERE auth_user_id = auth.uid() OR email = (auth.jwt() ->> 'email')
  LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- RLS Policies on each school-owned table
CREATE POLICY "Schools access" ON public.schools FOR SELECT USING (id = public.get_user_school_id());
CREATE POLICY "Users access" ON public.users FOR ALL USING (school_id = public.get_user_school_id());
CREATE POLICY "Classes access" ON public.classes FOR ALL USING (school_id = public.get_user_school_id());
CREATE POLICY "Sections access" ON public.sections FOR ALL USING (school_id = public.get_user_school_id());
CREATE POLICY "Students access" ON public.students FOR ALL USING (school_id = public.get_user_school_id());
CREATE POLICY "Parents access" ON public.parents FOR ALL USING (school_id = public.get_user_school_id());
CREATE POLICY "Student parents access" ON public.student_parents FOR ALL USING (school_id = public.get_user_school_id());
CREATE POLICY "Attendance sessions access" ON public.attendance_sessions FOR ALL USING (school_id = public.get_user_school_id());
CREATE POLICY "Attendance records access" ON public.attendance_records FOR ALL USING (school_id = public.get_user_school_id());
CREATE POLICY "Attendance notifications access" ON public.attendance_notifications FOR ALL USING (school_id = public.get_user_school_id());
CREATE POLICY "Examinations access" ON public.examinations FOR ALL USING (school_id = public.get_user_school_id());
CREATE POLICY "Subjects access" ON public.subjects FOR ALL USING (school_id = public.get_user_school_id());
CREATE POLICY "Student results access" ON public.student_results FOR ALL USING (school_id = public.get_user_school_id());
CREATE POLICY "Student marks access" ON public.student_marks FOR ALL USING (school_id = public.get_user_school_id());
CREATE POLICY "Import records access" ON public.import_records FOR ALL USING (school_id = public.get_user_school_id());
CREATE POLICY "Updates access" ON public.updates FOR ALL USING (school_id = public.get_user_school_id());
CREATE POLICY "Update notifications access" ON public.update_notifications FOR ALL USING (school_id = public.get_user_school_id());

-- ==========================================================
-- SUPABASE STORAGE BUCKETS (Private & Secure)
-- ==========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-files', 'school-files', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('student-reports', 'student-reports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Authenticated users can upload school files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('school-files', 'student-reports'));

CREATE POLICY "Authenticated users can view school files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id IN ('school-files', 'student-reports'));
