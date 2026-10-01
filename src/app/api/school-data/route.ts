import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

const SCHOOL_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

export async function GET() {
  try {
    const supabase = getServerSupabase();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database not configured.' }, { status: 500 });
    }

    // 1. Classes
    const { data: classes } = await supabase
      .from('classes')
      .select('*')
      .eq('school_id', SCHOOL_ID)
      .order('display_order', { ascending: true });

    // 2. Sections
    const { data: sections } = await supabase
      .from('sections')
      .select('*')
      .eq('school_id', SCHOOL_ID);

    // 3. Parents
    const { data: parents } = await supabase
      .from('parents')
      .select('*')
      .eq('school_id', SCHOOL_ID);

    // 4. Students with parents
    const { data: students } = await supabase
      .from('students')
      .select(`
        *,
        student_parents (
          is_primary,
          parents (*)
        )
      `)
      .eq('school_id', SCHOOL_ID)
      .order('roll_number', { ascending: true });

    // 5. Attendance Sessions
    const { data: sessions } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('school_id', SCHOOL_ID)
      .order('date', { ascending: false });

    // 6. Attendance Records
    const { data: records } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('school_id', SCHOOL_ID);

    // 7. Examinations
    const { data: examinations } = await supabase
      .from('examinations')
      .select('*')
      .eq('school_id', SCHOOL_ID)
      .order('created_at', { ascending: false });

    // 8. Student Results & Marks
    const { data: results } = await supabase
      .from('student_results')
      .select(`
        *,
        student_marks (
          id,
          subject_id,
          maximum_marks,
          marks_obtained,
          subjects (name)
        )
      `)
      .eq('school_id', SCHOOL_ID);

    // 9. Import Records
    const { data: importRecords } = await supabase
      .from('import_records')
      .select('*')
      .eq('school_id', SCHOOL_ID)
      .order('created_at', { ascending: false });

    // 10. Updates
    const { data: updates } = await supabase
      .from('updates')
      .select('*')
      .eq('school_id', SCHOOL_ID)
      .order('created_at', { ascending: false });

    // 11. Attendance Notifications
    const { data: notifications } = await supabase
      .from('attendance_notifications')
      .select('id, attendance_record_id, status, created_at')
      .eq('school_id', SCHOOL_ID);

    return NextResponse.json({
      success: true,
      data: {
        classes: classes || [],
        sections: sections || [],
        parents: parents || [],
        students: students || [],
        sessions: sessions || [],
        records: records || [],
        examinations: examinations || [],
        results: results || [],
        importRecords: importRecords || [],
        updates: updates || [],
        notifications: notifications || [],
      },
    });
  } catch (err: any) {
    console.error('Error in /api/school-data:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
