/**
 * NodeBricks Backend Excel Processing Service
 * Normalizes, maps, and validates tabular spreadsheet imports.
 */

import { ColumnMapping, ImportValidationIssue } from '@/types';

export function normalizePhoneNumber(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  let str = String(raw).trim();
  // Strip trailing float artifacts (e.g. 9848012345.0)
  if (str.endsWith('.0')) {
    str = str.slice(0, -2);
  }
  return str.replace(/[^0-9+]/g, '');
}

export function detectColumnMapping(headers: string[]): ColumnMapping {
  const norm = (h: string) => h.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

  const mapping: ColumnMapping = {
    student_name: '',
    roll_number: '',
    class_name: '',
    section_name: '',
    parent_name: '',
    parent_phone: '',
    admission_number: '',
  };

  headers.forEach((h) => {
    const n = norm(h);
    if (!mapping.student_name && (n.includes('student') || n.includes('name') || n.includes('fullname'))) {
      mapping.student_name = h;
    } else if (!mapping.roll_number && (n.includes('roll') || n.includes('rollno') || n.includes('rollnumber'))) {
      mapping.roll_number = h;
    } else if (!mapping.class_name && (n.includes('class') || n.includes('grade') || n.includes('standard'))) {
      mapping.class_name = h;
    } else if (!mapping.section_name && (n.includes('section') || n.includes('sec'))) {
      mapping.section_name = h;
    } else if (!mapping.parent_name && (n.includes('parent') || n.includes('father') || n.includes('guardian'))) {
      mapping.parent_name = h;
    } else if (!mapping.parent_phone && (n.includes('phone') || n.includes('mobile') || n.includes('contact') || n.includes('whatsapp'))) {
      mapping.parent_phone = h;
    } else if (!mapping.admission_number && (n.includes('admission') || n.includes('adm') || n.includes('reg') || n.includes('id'))) {
      mapping.admission_number = h;
    }
  });

  return mapping;
}

export function validateStudentRow(row: Record<string, any>, rowIndex: number, mapping: ColumnMapping): ImportValidationIssue[] {
  const issues: ImportValidationIssue[] = [];

  const nameVal = row[mapping.student_name];
  if (!nameVal || String(nameVal).trim().length === 0) {
    issues.push({ row: rowIndex, field: 'student_name', message: 'Student name is missing or empty' });
  }

  const rollVal = row[mapping.roll_number];
  if (!rollVal || String(rollVal).trim().length === 0) {
    issues.push({ row: rowIndex, field: 'roll_number', message: 'Roll number is missing or empty' });
  }

  return issues;
}
