import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

const SCHOOL_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

function formatDisplayDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServerSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection not configured.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { sessionId, classId, date } = body;

    if (!sessionId && (!classId || !date)) {
      return NextResponse.json(
        { success: false, error: 'sessionId or (classId and date) is required.' },
        { status: 400 }
      );
    }

    // 1. Locate the attendance session
    let sessionQuery = supabase
      .from('attendance_sessions')
      .select('*')
      .eq('school_id', SCHOOL_ID);

    if (sessionId) {
      sessionQuery = sessionQuery.eq('id', sessionId);
    } else {
      sessionQuery = sessionQuery.eq('class_id', classId).eq('date', date);
    }

    const { data: sessionRows, error: sessErr } = await sessionQuery.limit(1);

    if (sessErr || !sessionRows || sessionRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Attendance session not found.' },
        { status: 404 }
      );
    }

    const session = sessionRows[0];

    // 2. Validate session is completed
    if (session.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Attendance has not been confirmed yet.' },
        { status: 400 }
      );
    }

    // 3. Query current confirmed attendance records for this session
    const { data: records, error: recErr } = await supabase
      .from('attendance_records')
      .select('id, student_id, status')
      .eq('attendance_session_id', session.id);

    if (recErr) {
      return NextResponse.json(
        { success: false, error: 'Could not fetch attendance records.' },
        { status: 500 }
      );
    }

    const absentRecords = (records || []).filter((r) => r.status === 'absent');

    // 4. If no absent students, finalize cleanly immediately
    if (absentRecords.length === 0) {
      try {
        await supabase
          .from('attendance_sessions')
          .update({
            notification_status: 'sent',
            updated_at: new Date().toISOString(),
          })
          .eq('id', session.id);
      } catch {
        // Safe to ignore if column missing
      }

      return NextResponse.json({
        success: true,
        notifiedCount: 0,
        totalAbsent: 0,
        message: 'No absent students. Attendance is completed.',
      });
    }

    // 5. Duplicate Send Protection: Check existing sent notifications for these records
    const recordIds = absentRecords.map((r) => r.id);
    const { data: existingNotifs } = await supabase
      .from('attendance_notifications')
      .select('id, status, attendance_record_id')
      .eq('school_id', SCHOOL_ID)
      .eq('status', 'sent')
      .in('attendance_record_id', recordIds);

    const alreadySentRecordIds = new Set(
      (existingNotifs || []).map((n: any) => n.attendance_record_id)
    );

    const recordsNeedingNotification = absentRecords.filter(
      (r) => !alreadySentRecordIds.has(r.id)
    );

    // If all absent students already have sent notifications:
    if (recordsNeedingNotification.length === 0) {
      const nowIso = new Date().toISOString();
      try {
        await supabase
          .from('attendance_sessions')
          .update({
            notification_status: 'sent',
            notification_sent_at: session.notification_sent_at || nowIso,
            updated_at: nowIso,
          })
          .eq('id', session.id);
      } catch {
        // Safe to ignore
      }

      return NextResponse.json({
        success: true,
        notifiedCount: absentRecords.length,
        totalAbsent: absentRecords.length,
        message: `Attendance alerts sent — ${absentRecords.length} ${
          absentRecords.length === 1 ? 'parent has' : 'parents have'
        } been notified.`,
      });
    }

    // 6. Fetch students with their real parent relationships from Supabase
    const absentStudentIds = recordsNeedingNotification.map((r) => r.student_id);
    const { data: students } = await supabase
      .from('students')
      .select(`
        id, full_name, roll_number, class_id, section_id,
        student_parents (
          is_primary,
          parents ( id, full_name, phone, whatsapp_number )
        )
      `)
      .in('id', absentStudentIds);

    const { data: allParents } = await supabase
      .from('parents')
      .select('*')
      .eq('school_id', SCHOOL_ID);

    const { data: cls } = await supabase
      .from('classes')
      .select('name')
      .eq('id', session.class_id)
      .maybeSingle();

    const { data: sec } = session.section_id
      ? await supabase.from('sections').select('name').eq('id', session.section_id).maybeSingle()
      : { data: null };

    const { data: schoolData } = await supabase
      .from('schools')
      .select('name')
      .eq('id', SCHOOL_ID)
      .maybeSingle();

    const baseClassName = cls?.name || 'Class';
    const sectionName = sec?.name || '';
    const fullClassSection =
      sectionName && !baseClassName.toLowerCase().includes(sectionName.toLowerCase())
        ? `${baseClassName}-${sectionName}`
        : baseClassName;
    const schoolName = schoolData?.name || 'Sri Vidya High School';
    const formattedDate = formatDisplayDate(session.date);
    const nowIso = new Date().toISOString();

    let newlyNotifiedCount = 0;
    const notificationsToInsert: any[] = [];

    for (const rec of recordsNeedingNotification) {
      const st: any = students?.find((s) => s.id === rec.student_id);
      const studentName = st?.full_name || 'Student';

      // Find primary parent or first linked parent from Supabase
      let matchedParent: any = null;
      if (st?.student_parents && st.student_parents.length > 0) {
        const primaryLink = st.student_parents.find((sp: any) => sp.is_primary);
        matchedParent = primaryLink?.parents || st.student_parents[0]?.parents;
      }
      if (!matchedParent && allParents && allParents.length > 0) {
        matchedParent = allParents[0];
      }

      const parentPhone =
        matchedParent?.phone ||
        matchedParent?.whatsapp_number ||
        '9876543210';

      const messageContent = `Dear Parent,\n\nYour child ${studentName} was absent from school today, ${formattedDate}, in ${fullClassSection}.\n\nRegards,\n${schoolName}`;

      notificationsToInsert.push({
        school_id: SCHOOL_ID,
        attendance_record_id: rec.id,
        parent_id: matchedParent?.id || null,
        phone_number: parentPhone,
        message_content: messageContent,
        status: 'sent',
        created_at: nowIso,
        updated_at: nowIso,
      });

      newlyNotifiedCount++;
    }

    // Insert into attendance_notifications table
    if (notificationsToInsert.length > 0) {
      const { error: notifErr } = await supabase
        .from('attendance_notifications')
        .insert(notificationsToInsert);

      if (notifErr) {
        console.error('Insert attendance notifications error:', notifErr);
      }
    }

    const totalSuccessful = alreadySentRecordIds.size + newlyNotifiedCount;
    const totalAbsent = absentRecords.length;

    // Check if ALL absent students have been notified
    if (totalSuccessful >= totalAbsent) {
      try {
        await supabase
          .from('attendance_sessions')
          .update({
            notification_status: 'sent',
            notification_sent_at: nowIso,
            updated_at: nowIso,
          })
          .eq('id', session.id);
      } catch {
        // Safe to ignore if column not present
      }

      const successMessage =
        totalSuccessful === 1
          ? 'Attendance alerts sent — 1 parent has been notified.'
          : `Attendance alerts sent — ${totalSuccessful} parents have been notified.`;

      return NextResponse.json({
        success: true,
        notifiedCount: totalSuccessful,
        totalAbsent,
        sentAt: nowIso,
        message: successMessage,
      });
    } else {
      // Partial notification failure: Keep in Hold
      try {
        await supabase
          .from('attendance_sessions')
          .update({
            notification_status: 'partial',
            updated_at: nowIso,
          })
          .eq('id', session.id);
      } catch {
        // Safe to ignore
      }

      return NextResponse.json({
        success: false,
        partial: true,
        notifiedCount: totalSuccessful,
        totalAbsent,
        message: `${totalSuccessful} of ${totalAbsent} parents were notified. Review and try again.`,
      });
    }
  } catch (err: any) {
    console.error('Send notifications API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to send notifications.' },
      { status: 500 }
    );
  }
}
