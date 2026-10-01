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
