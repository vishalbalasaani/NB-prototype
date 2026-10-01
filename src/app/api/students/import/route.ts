import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

const SCHOOL_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

function normalizePhone(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  let str = String(raw).trim();
  if (str.endsWith('.0')) {
    str = str.slice(0, -2);
  }
  return str;
}

function normalizeClass(raw: unknown): string {
  if (!raw) return 'Class 1';
  let s = String(raw).trim();
  if (!s.toLowerCase().startsWith('class')) {
    s = `Class ${s}`;
  }
  return s;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServerSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection is not configured.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { records = [], fileName = 'students.xlsx' } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid student records provided.' },
        { status: 400 }
      );
    }

    // 1. Ensure school exists
    const { error: schoolErr } = await supabase.from('schools').upsert(
      {
        id: SCHOOL_ID,
        name: 'Greenwood High International',
        code: 'GWH-2026',
        address: '42, Campus Road, Bengaluru',
        phone: '+91 98765 43210',
        email: 'office@greenwoodhigh.edu',
      },
      { onConflict: 'id' }
    );

    if (schoolErr) {
      console.error('Error ensuring school exists:', schoolErr);
      return NextResponse.json(
        { success: false, error: 'Unable to initialize school record in database.' },
        { status: 500 }
      );
    }

    // 2. Resolve / Create Classes
    const uniqueClassNames = Array.from(
      new Set(records.map((r) => normalizeClass(r.className || r.class_name)))
    );

    for (const clsName of uniqueClassNames) {
      const { error: clsErr } = await supabase
        .from('classes')
        .upsert(
          {
            school_id: SCHOOL_ID,
            name: clsName,
            display_order: 1,
          },
          { onConflict: 'school_id,name' }
        );

      if (clsErr) {
        console.error('Class upsert error for', clsName, clsErr);
      }
    }

    // Fetch classes for this school
    const { data: dbClasses, error: fetchClsErr } = await supabase
      .from('classes')
      .select('id, name')
      .eq('school_id', SCHOOL_ID);

    if (fetchClsErr || !dbClasses) {
      console.error('Error fetching classes:', fetchClsErr);
      return NextResponse.json(
        { success: false, error: 'Could not fetch class roster from database.' },
        { status: 500 }
      );
    }

    const classMap = new Map(dbClasses.map((c) => [c.name.toLowerCase().trim(), c.id]));

    // 3. Resolve / Create Sections (default 'A' for each class)
    for (const cls of dbClasses) {
      await supabase
        .from('sections')
        .upsert(
          {
            school_id: SCHOOL_ID,
            class_id: cls.id,
            name: 'A',
          },
          { onConflict: 'class_id,name' }
        );
    }

    const { data: dbSections } = await supabase
      .from('sections')
      .select('id, class_id, name')
      .eq('school_id', SCHOOL_ID);

    const sectionMap = new Map(
      (dbSections || []).map((s) => [`${s.class_id}-${s.name.toUpperCase()}`, s.id])
    );

    // 4. Resolve / Create Parents in bulk
    const { data: existingParents } = await supabase
      .from('parents')
      .select('id, name, phone')
      .eq('school_id', SCHOOL_ID);

    const parentPhoneMap = new Map<string, string>();
    (existingParents || []).forEach((p) => {
      const cleanP = normalizePhone(p.phone);
      if (cleanP) parentPhoneMap.set(cleanP, p.id);
    });

    const newParentsToInsert: { school_id: string; name: string; phone: string; relationship: string }[] = [];
    const seenPhonesInBatch = new Set<string>();

    for (const r of records) {
      const phone = normalizePhone(r.parentPhone || r.parent_phone);
      const pName = String(r.parentName || r.parent_name || '').trim() || 'Parent';
      if (phone && !parentPhoneMap.has(phone) && !seenPhonesInBatch.has(phone)) {
        seenPhonesInBatch.add(phone);
        newParentsToInsert.push({
          school_id: SCHOOL_ID,
          name: pName,
          phone: phone,
          relationship: 'Parent',
        });
      }
    }

    if (newParentsToInsert.length > 0) {
      const { data: insertedParents, error: pErr } = await supabase
        .from('parents')
        .insert(newParentsToInsert)
        .select('id, phone');

      if (!pErr && insertedParents) {
        insertedParents.forEach((p) => {
          const cleanP = normalizePhone(p.phone);
          if (cleanP) parentPhoneMap.set(cleanP, p.id);
        });
      }
    }

    // 5. Prepare all students for atomic batch insert
    const nowTime = Date.now().toString().slice(-4);
    const studentsToInsert = records.map((r, i) => {
      const rawCls = normalizeClass(r.className || r.class_name);
      const classId = classMap.get(rawCls.toLowerCase().trim()) || dbClasses[0]?.id;
      const secName = (r.sectionName || r.section_name || 'A').toString().trim().toUpperCase();
      const sectionId =
        sectionMap.get(`${classId}-${secName}`) ||
        sectionMap.get(`${classId}-A`) ||
        Array.from(sectionMap.values())[0];

      const roll = String(r.rollNumber || r.roll_number || i + 1).trim();
      const studentName = String(r.studentName || r.full_name || '').trim();
      const classSlug = rawCls.replace(/[^a-zA-Z0-9]/g, '');
      const uniqueStudentCode = `STU-${classSlug}-${roll}-${nowTime}-${i + 1}`;

      return {
        school_id: SCHOOL_ID,
        student_id: uniqueStudentCode,
        admission_number: r.admissionNumber || r.admission_number || uniqueStudentCode,
        roll_number: roll,
        full_name: studentName,
        class_id: classId,
        section_id: sectionId,
        status: 'active',
        updated_at: new Date().toISOString(),
      };
    });

    const { data: insertedStudents, error: stErr } = await supabase
      .from('students')
      .insert(studentsToInsert)
      .select('id, student_id');

    if (stErr || !insertedStudents) {
      console.error('Batch student insert error:', stErr);
      return NextResponse.json(
        { success: false, error: "We couldn't import these students. Please try again." },
        { status: 500 }
      );
    }

    // 6. Bulk insert student_parents relationship
    const studentParentsToInsert: { school_id: string; student_id: string; parent_id: string; is_primary: boolean }[] = [];
    insertedStudents.forEach((st, i) => {
      const r = records[i];
      if (r) {
        const phone = normalizePhone(r.parentPhone || r.parent_phone);
        const parentId = phone ? parentPhoneMap.get(phone) : undefined;
        if (parentId) {
          studentParentsToInsert.push({
            school_id: SCHOOL_ID,
            student_id: st.id,
            parent_id: parentId,
            is_primary: true,
          });
        }
      }
    });

    if (studentParentsToInsert.length > 0) {
      await supabase
        .from('student_parents')
        .upsert(studentParentsToInsert, { onConflict: 'student_id,parent_id' });
    }

    // 7. Record in import_records
    await supabase.from('import_records').insert({
      school_id: SCHOOL_ID,
      import_type: 'students',
      file_name: fileName,
      status: 'completed',
      students_processed: records.length,
      records_processed: insertedStudents.length,
      records_failed: 0,
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      importedCount: insertedStudents.length,
      totalRecords: records.length,
    });
  } catch (error: any) {
    console.error('Import API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: "We couldn't import these students. Please try again.",
      },
      { status: 500 }
    );
  }
}
