-- ==========================================================
-- NODEBRICKS - WIPE DEMO / SEED DATA SCRIPT
-- Safely truncates mock/demo records so the database is
-- 100% clean, pristine, and ready for real Excel imports.
-- Preserves schools, users, and table schema.
-- ==========================================================

BEGIN;

-- 1. Remove mock attendance notifications & records
TRUNCATE TABLE public.attendance_notifications CASCADE;
TRUNCATE TABLE public.attendance_records CASCADE;
TRUNCATE TABLE public.attendance_sessions CASCADE;

-- 2. Remove mock marks, results, and examinations
TRUNCATE TABLE public.student_marks CASCADE;
TRUNCATE TABLE public.student_results CASCADE;
TRUNCATE TABLE public.import_records CASCADE;
DO $$ 
BEGIN 
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'marks_import_records') THEN
    EXECUTE 'TRUNCATE TABLE public.marks_import_records CASCADE';
  END IF;
END $$;

-- 3. Remove mock updates & announcements
TRUNCATE TABLE public.update_notifications CASCADE;
TRUNCATE TABLE public.updates CASCADE;

-- 4. Remove mock students, parents, and relationships
TRUNCATE TABLE public.student_parents CASCADE;
TRUNCATE TABLE public.parents CASCADE;
TRUNCATE TABLE public.students CASCADE;

-- 5. Optionally remove demo classes and sections if you want a completely empty school
-- Note: If classes are linked to your real school, you can leave them or re-import via Excel.
TRUNCATE TABLE public.sections CASCADE;
TRUNCATE TABLE public.classes CASCADE;
TRUNCATE TABLE public.examinations CASCADE;
TRUNCATE TABLE public.subjects CASCADE;

COMMIT;

-- Verification query: confirm all count is 0
SELECT 
  (SELECT COUNT(*) FROM public.students) AS students_count,
  (SELECT COUNT(*) FROM public.classes) AS classes_count,
  (SELECT COUNT(*) FROM public.attendance_records) AS attendance_records_count,
  (SELECT COUNT(*) FROM public.student_results) AS student_results_count,
  (SELECT COUNT(*) FROM public.import_records) AS import_records_count;
