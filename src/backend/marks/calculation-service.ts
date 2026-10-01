/**
 * NodeBricks Backend Marks Calculation Service
 * Standard grading curves, percentage computations, and result validation.
 */

import { StudentSubjectMark, ResultStatus } from '@/types';

/**
 * Standard School Grading Scale:
 * >= 90% : A+
 * >= 80% : A
 * >= 70% : B+
 * >= 60% : B
 * >= 50% : C
 * >= 40% : D
 * < 40%  : F
 */
export function calculateGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}

export function calculateMarksSummary(subjectMarks: StudentSubjectMark[], passMarkPercentage: number = 35) {
  const totalMarks = subjectMarks.reduce((sum, sm) => sum + Number(sm.marks_obtained || 0), 0);
  const maximumMarks = subjectMarks.reduce((sum, sm) => sum + Number(sm.maximum_marks || 100), 0);
  const percentage = maximumMarks > 0 ? Number(((totalMarks / maximumMarks) * 100).toFixed(1)) : 0;
  const grade = calculateGrade(percentage);

  // Check if every individual subject meets minimum passing criteria
  const isAllSubjectsPassed = subjectMarks.every((sm) => {
    const minPass = (Number(sm.maximum_marks || 100) * passMarkPercentage) / 100;
    return Number(sm.marks_obtained || 0) >= minPass;
  });

  const resultStatus: ResultStatus = isAllSubjectsPassed ? 'pass' : 'fail';

  return {
    totalMarks,
    maximumMarks,
    percentage,
    grade,
    resultStatus,
  };
}
