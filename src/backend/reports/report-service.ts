/**
 * NodeBricks Backend Report Generation Service
 * Handles report layout generation, PDF memos, and report dataset structures.
 */

import { Student, StudentResult } from '@/types';

/**
 * Generates an official, printable Examination Marks Memo HTML layout.
 */
export function generateExamMemoHtml(
  student: Student,
  result: StudentResult,
  schoolName: string
): string {
  const subjectRows = result.subject_marks
    .map(
      (sm) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E2DC; font-weight: 500; color: #20201F;">${sm.subject_name}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E2DC; text-align: center; color: #6F6D68;">${sm.maximum_marks}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E2DC; text-align: right; font-weight: 600; color: #20201F;">${sm.marks_obtained}</td>
    </tr>`
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${result.examination_name} - ${student.full_name}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 32px; color: #20201F; background: #fff; }
        .header { text-align: center; border-bottom: 2px solid #5B4B8A; padding-bottom: 20px; margin-bottom: 24px; }
        .school-name { font-size: 22px; font-weight: 700; color: #5B4B8A; text-transform: uppercase; letter-spacing: 0.5px; }
        .exam-title { font-size: 15px; font-weight: 600; color: #20201F; margin-top: 6px; }
        .academic-year { font-size: 12px; color: #6F6D68; margin-top: 2px; }
        .student-info { display: flex; justify-content: space-between; background: #F7F6F3; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; font-size: 13px; }
        .student-info div { line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 28px; font-size: 13px; }
        th { background: #FAF9F7; padding: 10px 12px; border-bottom: 2px solid #E5E2DC; font-weight: 600; color: #20201F; }
        .summary-box { display: flex; justify-content: space-between; border-top: 2px solid #E5E2DC; padding-top: 18px; font-size: 14px; }
        .summary-pill { padding: 6px 14px; border-radius: 6px; font-weight: 600; }
        .pass { background: #EFF5F1; color: #557A61; }
        .fail { background: #FBF1F0; color: #B65C55; }
        .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; color: #6F6D68; border-top: 1px solid #E5E2DC; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="school-name">${schoolName}</div>
        <div class="exam-title">${result.examination_name}</div>
        <div class="academic-year">Academic Year ${result.academic_year || '2026-2027'}</div>
      </div>

      <div class="student-info">
        <div>
          <div><strong>Student:</strong> ${student.full_name}</div>
          <div><strong>Roll Number:</strong> ${student.roll_number}</div>
        </div>
        <div>
          <div><strong>Class:</strong> ${result.class_name} - ${result.section_name}</div>
          <div><strong>Admission No:</strong> ${student.admission_number || student.student_id}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="text-align: left;">Subject</th>
            <th style="text-align: center;">Max Marks</th>
            <th style="text-align: right;">Marks Obtained</th>
          </tr>
        </thead>
        <tbody>
          ${subjectRows}
        </tbody>
      </table>

      <div class="summary-box">
        <div>
          <div><strong>Total Marks:</strong> ${result.total_marks} / ${result.maximum_marks}</div>
          <div style="margin-top: 4px;"><strong>Percentage:</strong> ${result.percentage}% &bull; <strong>Grade:</strong> ${result.grade}</div>
        </div>
        <div>
          <span class="summary-pill ${result.result_status === 'pass' ? 'pass' : 'fail'}">
            ${result.result_status === 'pass' ? 'PASSED' : 'NEEDS IMPROVEMENT'}
          </span>
        </div>
      </div>

      <div class="footer">
        <div>Class Teacher Signature</div>
        <div>Principal Signature & Seal</div>
      </div>
    </body>
    </html>
  `;
}
