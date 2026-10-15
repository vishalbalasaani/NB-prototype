-- ==========================================================
-- NODEBRICKS SEED SCRIPT (PRISTINE INITIAL STATE)
-- This file configures only the base school and admin user.
-- NO DEMO STUDENTS, NO DEMO ATTENDANCE, NO DEMO MARKS.
-- All school data is imported cleanly via Excel into PostgreSQL.
-- ==========================================================

-- 1. Insert Default School (if not exists)
INSERT INTO public.schools (id, name, code, address, phone, academic_year)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'NodeBricks Academy',
    'NB-001',
    'Main Campus',
    '+91 98480 12345',
    '2026-2027'
) ON CONFLICT (code) DO NOTHING;

-- 2. Insert Default Management User (mapped to school)
INSERT INTO public.users (id, school_id, email, name, role, phone)
VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin123@gmail.com',
    'School Administrator',
    'management',
    '+91 98480 12345'
) ON CONFLICT (email) DO NOTHING;

-- 3. Insert Attendance Staff User
INSERT INTO public.users (id, school_id, email, name, role, phone)
VALUES (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'attendance123@gmail.com',
    'Attendance Officer',
    'attendance',
    '+91 98480 67890'
) ON CONFLICT (email) DO NOTHING;

-- 4. Insert Standard Classes (Class 5, Class 6, Class 7, Class 8, Class 9, Class 10 - No Sections)
INSERT INTO public.classes (id, school_id, name, display_order)
VALUES 
    ('c0000000-0000-0000-0000-000000000005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Class 5', 5),
    ('c0000000-0000-0000-0000-000000000006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Class 6', 6),
    ('c0000000-0000-0000-0000-000000000007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Class 7', 7),
    ('c0000000-0000-0000-0000-000000000008', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Class 8', 8),
    ('c0000000-0000-0000-0000-000000000009', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Class 9', 9),
    ('c0000000-0000-0000-0000-000000000010', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Class 10', 10)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Standard Sections (Section A for each Class)
INSERT INTO public.sections (id, school_id, class_id, name)
VALUES
    ('s0000000-0000-0000-0000-000000000005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0000000-0000-0000-0000-000000000005', 'A'),
    ('s0000000-0000-0000-0000-000000000006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0000000-0000-0000-0000-000000000006', 'A'),
    ('s0000000-0000-0000-0000-000000000007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0000000-0000-0000-0000-000000000007', 'A'),
    ('s0000000-0000-0000-0000-000000000008', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0000000-0000-0000-0000-000000000008', 'A'),
    ('s0000000-0000-0000-0000-000000000009', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0000000-0000-0000-0000-000000000009', 'A'),
    ('s0000000-0000-0000-0000-000000000010', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0000000-0000-0000-0000-000000000010', 'A')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Baseline Parents
INSERT INTO public.parents (id, school_id, name, phone, relationship)
VALUES
    ('a1000000-0000-0000-0000-000000000001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Rajesh Sharma', '+91 98765 43210', 'Father'),
    ('a1000000-0000-0000-0000-000000000002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Sunita Patel', '+91 98765 43211', 'Mother'),
    ('a1000000-0000-0000-0000-000000000003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Vikram Mehta', '+91 98765 43212', 'Father'),
    ('a1000000-0000-0000-0000-000000000004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Venkat Rao', '+91 98765 43220', 'Father'),
    ('a1000000-0000-0000-0000-000000000005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Ramesh Iyer', '+91 98765 43221', 'Father'),
    ('a1000000-0000-0000-0000-000000000006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Kailash Varma', '+91 98765 43230', 'Father'),
    ('a1000000-0000-0000-0000-000000000007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pradip Sen', '+91 98765 43231', 'Father'),
    ('a1000000-0000-0000-0000-000000000008', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Javed Akhtar', '+91 98765 43240', 'Father'),
    ('a1000000-0000-0000-0000-000000000009', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Raj Kapoor', '+91 98765 43250', 'Father'),
    ('a1000000-0000-0000-0000-000000000010', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Narayanan Nambiar', '+91 98765 43260', 'Father')
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Baseline Students
INSERT INTO public.students (id, school_id, student_id, admission_number, roll_number, full_name, class_id, section_id, status)
VALUES
    ('b1000000-0000-0000-0000-000000000001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'STU-05-01', '01', '01', 'Aarav Sharma', 'c0000000-0000-0000-0000-000000000005', 's0000000-0000-0000-0000-000000000005', 'active'),
    ('b1000000-0000-0000-0000-000000000002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'STU-05-02', '02', '02', 'Ananya Patel', 'c0000000-0000-0000-0000-000000000005', 's0000000-0000-0000-0000-000000000005', 'active'),
    ('b1000000-0000-0000-0000-000000000003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'STU-05-03', '03', '03', 'Rohan Mehta', 'c0000000-0000-0000-0000-000000000005', 's0000000-0000-0000-0000-000000000005', 'active'),
    ('b1000000-0000-0000-0000-000000000004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'STU-06-01', '01', '01', 'Aditya Rao', 'c0000000-0000-0000-0000-000000000006', 's0000000-0000-0000-0000-000000000006', 'active'),
    ('b1000000-0000-0000-0000-000000000005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'STU-06-02', '02', '02', 'Kavya Iyer', 'c0000000-0000-0000-0000-000000000006', 's0000000-0000-0000-0000-000000000006', 'active'),
    ('b1000000-0000-0000-0000-000000000006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'STU-07-01', '01', '01', 'Anand Varma', 'c0000000-0000-0000-0000-000000000007', 's0000000-0000-0000-0000-000000000007', 'active'),
    ('b1000000-0000-0000-0000-000000000007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'STU-07-02', '02', '02', 'Bhavna Sen', 'c0000000-0000-0000-0000-000000000007', 's0000000-0000-0000-0000-000000000007', 'active'),
    ('b1000000-0000-0000-0000-000000000008', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'STU-08-01', '01', '01', 'Farhan Akhtar', 'c0000000-0000-0000-0000-000000000008', 's0000000-0000-0000-0000-000000000008', 'active'),
    ('b1000000-0000-0000-0000-000000000009', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'STU-09-01', '01', '01', 'Kabir Kapoor', 'c0000000-0000-0000-0000-000000000009', 's0000000-0000-0000-0000-000000000009', 'active'),
    ('b1000000-0000-0000-0000-000000000010', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'STU-10-01', '01', '01', 'Pranav Nambiar', 'c0000000-0000-0000-0000-000000000010', 's0000000-0000-0000-0000-000000000010', 'active')
ON CONFLICT (id) DO NOTHING;

-- 8. Map Students to Parents
INSERT INTO public.student_parents (student_id, parent_id, is_primary)
VALUES
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', true),
    ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', true),
    ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', true),
    ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', true),
    ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', true),
    ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006', true),
    ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000007', true),
    ('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008', true),
    ('b1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000009', true),
    ('b1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000010', true)
ON CONFLICT DO NOTHING;
