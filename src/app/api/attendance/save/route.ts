import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

const SCHOOL_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

function getSchoolTodayDateServer(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServerSupabase();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database connection not configured.' }, { status: 500 });
    }

    const body = await req.json();
    const {
      classId,
      sectionId,
      date = getSchoolTodayDateServer(),
      absentStudentIds = [],
      userId,
    } = body;

    if (!classId) {
      return NextResponse.json({ success: false, error: 'classId is required.' }, { status: 400 });
    }

    const nowIso = new Date().toISOString();

    // Verify valid user ID in public.users to avoid foreign key errors
    let validUserId: string | null = null;
    if (userId && typeof userId === 'string' && userId.length === 36 && userId.includes('-')) {
      const { data: u } = await supabase.from('users').select('id').eq('id', userId).maybeSingle();
      if (u) validUserId = u.id;
    }

    // Resolve valid section_id to satisfy NOT NULL constraint on attendance_sessions.section_id
    let activeSectionId = sectionId;
    if (!activeSectionId || typeof activeSectionId !== 'string' || !activeSectionId.includes('-')) {
      const { data: secList } = await supabase
        .from('sections')
        .select('id')
        .eq('class_id', classId)
        .limit(1);

      if (secList && secList.length > 0) {
        activeSectionId = secList[0].id;
      } else {
        const { data: anySec } = await supabase
          .from('sections')
          .select('id')
          .eq('school_id', SCHOOL_ID)
          .limit(1);

        if (anySec && anySec.length > 0) {
          activeSectionId = anySec[0].id;
        } else {
          const { data: newSec } = await supabase
            .from('sections')
            .insert({
              school_id: SCHOOL_ID,
              class_id: classId,
              name: 'A',
            })
            .select('id')
            .single();
          if (newSec) activeSectionId = newSec.id;
        }
      }
    }

    // 1. Check for existing session for this class and date
    const { data: existingSessions, error: findErr } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('school_id', SCHOOL_ID)
      .eq('class_id', classId)
      .eq('date', date)
      .limit(1);

    if (findErr) {
      console.error('Find session error:', findErr);
    }

    let sessionData = existingSessions && existingSessions.length > 0 ? existingSessions[0] : null;

    if (sessionData) {
      const { data: updated, error: updateErr } = await supabase
        .from('attendance_sessions')
        .update({
          section_id: activeSectionId,
          status: 'completed',
          completed_at: nowIso,
          completed_by: validUserId,
          updated_at: nowIso,
        })
        .eq('id', sessionData.id)
        .select()
        .single();

      if (updateErr) {
        console.error('Session update error:', updateErr);
        return NextResponse.json(
          { success: false, error: updateErr.message },
          { status: 500 }
        );
      }
      sessionData = updated;
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from('attendance_sessions')
        .insert({
          school_id: SCHOOL_ID,
          class_id: classId,
          section_id: activeSectionId,
          date,
          status: 'completed',
          completed_at: nowIso,
          completed_by: validUserId,
          created_at: nowIso,
          updated_at: nowIso,
        })
        .select()
        .single();

      if (insertErr) {
        console.error('Session insert error:', insertErr);
        return NextResponse.json(
          { success: false, error: insertErr.message },
          { status: 500 }
        );
      }
      sessionData = inserted;
    }

    // 2. Fetch all students in this class
    const { data: students, error: stErr } = await supabase
      .from('students')
      .select('id, full_name, roll_number')
      .eq('class_id', classId)
      .eq('school_id', SCHOOL_ID);

    if (stErr) {
      console.error('Students fetch error:', stErr);
    }

    const studentList = students || [];

    // 3. Delete existing records for this session
    await supabase
      .from('attendance_records')
      .delete()
      .eq('attendance_session_id', sessionData.id);

    // 4. Batch insert new records (present or absent)
    if (studentList.length > 0) {
      const recordsToInsert = studentList.map((st) => ({
        school_id: SCHOOL_ID,
        attendance_session_id: sessionData.id,
        student_id: st.id,
        date,
        status: absentStudentIds.includes(st.id) ? 'absent' : 'present',
        created_at: nowIso,
      }));

      const { error: recordsErr } = await supabase
        .from('attendance_records')
        .insert(recordsToInsert);

      if (recordsErr) {
        console.error('Attendance records insert error:', recordsErr);
        return NextResponse.json(
          { success: false, error: 'Could not save attendance records.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      session: sessionData,
      recordsCount: studentList.length,
      absentCount: absentStudentIds.length,
      presentCount: Math.max(0, studentList.length - absentStudentIds.length),
    });
  } catch (err: any) {
    console.error('Attendance save API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
