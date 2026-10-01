'use client';

import React, { useState, useEffect } from 'react';
import { User, Student } from '@/types';
import { DataService } from '@/lib/data-service';
import {
  Search,
  Users,
  Phone,
  Building2,
  ArrowLeft,
  FileText,
  UserPlus,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { StudentResultView } from '../marks/StudentResultView';

interface StudentsDirectoryViewProps {
  user: User;
  onBack?: () => void;
  onNavigateToImport?: () => void;
}

export function StudentsDirectoryView({
  user,
  onBack,
  onNavigateToImport,
}: StudentsDirectoryViewProps) {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    // Initial sync from database
    DataService.syncFromDatabase();
    const unsubscribe = DataService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const allStudents = DataService.getAllStudents();
  const classes = DataService.getClasses();
  const sections = DataService.getSections();

  if (selectedStudent) {
    return (
      <StudentResultView
        student={selectedStudent}
        onBack={() => setSelectedStudent(null)}
      />
    );
  }

  // Calculate student count per class
  const classStudentCounts = new Map<string, number>();
  allStudents.forEach((st) => {
    const count = classStudentCounts.get(st.class_id) || 0;
    classStudentCounts.set(st.class_id, count + 1);
  });

  // Filter classes that have students or default classes
  const classesWithCounts = classes.map((c) => ({
    ...c,
    studentCount: classStudentCounts.get(c.id) || 0,
  }));

  // Selected class object
  const activeClass = selectedClassId
    ? classes.find((c) => c.id === selectedClassId) || null
    : null;

  // Students in selected class (or matching search)
  const classStudents = selectedClassId
    ? allStudents.filter((st) => st.class_id === selectedClassId)
    : [];

  // Filtered by search query
  const filteredStudents = selectedClassId
    ? classStudents.filter((st) => {
        const query = searchQuery.toLowerCase();
        return (
          st.full_name.toLowerCase().includes(query) ||
          st.roll_number.toLowerCase().includes(query) ||
          (st.admission_number && st.admission_number.toLowerCase().includes(query)) ||
          (st.parent?.guardian_name && st.parent.guardian_name.toLowerCase().includes(query)) ||
          (st.parent?.phone && st.parent.phone.includes(query))
        );
      })
    : allStudents.filter((st) => {
        if (!searchQuery.trim()) return false;
        const query = searchQuery.toLowerCase();
        return (
          st.full_name.toLowerCase().includes(query) ||
          st.roll_number.toLowerCase().includes(query) ||
          (st.admission_number && st.admission_number.toLowerCase().includes(query)) ||
          (st.parent?.guardian_name && st.parent.guardian_name.toLowerCase().includes(query)) ||
          (st.parent?.phone && st.parent.phone.includes(query))
        );
      });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5E2DC] pb-4">
        <div>
          {selectedClassId ? (
            <button
              onClick={() => {
                setSelectedClassId(null);
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6F6D68] hover:text-[#20201F] transition-colors py-1 px-2 -ml-2 mb-1.5 rounded-md hover:bg-[#F4F1F8] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Classes</span>
            </button>
          ) : onBack ? (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6F6D68] hover:text-[#20201F] transition-colors py-1 px-2 -ml-2 mb-1.5 rounded-md hover:bg-[#F4F1F8] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
          ) : null}

          <h1 className="text-2xl font-semibold text-[#20201F] tracking-tight">
            {activeClass ? activeClass.name : 'Student Directory'}
          </h1>
          <p className="text-sm text-[#6F6D68] mt-1">
            {activeClass
              ? `${classStudents.length} ${classStudents.length === 1 ? 'student' : 'students'} enrolled in this class`
              : 'Enrolled students, class rosters, and parent WhatsApp contacts'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs px-3 py-1 rounded-full bg-[#EFF5F1] text-[#557A61] font-medium border border-[#D5E5D9]">
            {selectedClassId
              ? `${classStudents.length} Students`
              : `${allStudents.length} Students`}
          </span>

          {onNavigateToImport && (
            <button
              onClick={onNavigateToImport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8FD] hover:bg-[#5B4B8A] hover:text-white text-[#5B4B8A] text-xs font-medium border border-[#E2DBEC] rounded-lg transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Import Excel</span>
            </button>
          )}
        </div>
      </div>

      {allStudents.length === 0 ? (
        /* Empty State */
        <div className="py-20 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#F4F1F8] text-[#5B4B8A] flex items-center justify-center mx-auto border border-[#E7E1F2]">
            <Users className="w-6 h-6 stroke-[1.75]" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-[#20201F]">
              No students registered yet
            </h2>
            <p className="text-xs text-[#6F6D68] leading-relaxed">
              Upload your school&apos;s Excel student register containing Student Names, Roll Numbers, Classes, and Parent WhatsApp contacts.
            </p>
          </div>
          {onNavigateToImport && (
            <button
              onClick={onNavigateToImport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B4B8A] hover:bg-[#433665] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Import Students Excel</span>
            </button>
          )}
        </div>
      ) : selectedClassId === null && !searchQuery.trim() ? (
        /* ==========================================================
           CLASS-FIRST OVERVIEW: Display Classes List / Cards
           ========================================================== */
        <div className="space-y-4">
          {/* Global Search across all students */}
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-3 shadow-2xs">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#A8A59F]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students across all classes (name, roll no, parent, WhatsApp)..."
                className="w-full h-9 pl-9 pr-3 text-xs bg-[#FFFFFF] border border-[#E5E2DC] rounded-md text-[#20201F] placeholder:text-[#A8A59F] focus:outline-none focus:border-[#5B4B8A]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <h2 className="text-sm font-semibold text-[#20201F] uppercase tracking-wider">
              Classes
            </h2>
            <span className="text-xs text-[#6F6D68]">
              Select a class to manage students
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {classesWithCounts.map((cls) => (
              <button
                key={cls.id}
                onClick={() => {
                  setSelectedClassId(cls.id);
                  setSearchQuery('');
                }}
                className="text-left bg-[#FFFFFF] hover:bg-[#FAF8FD] border border-[#E5E2DC] hover:border-[#5B4B8A] rounded-xl p-4 transition-all group cursor-pointer shadow-2xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#F4F1F8] group-hover:bg-[#5B4B8A] group-hover:text-white text-[#5B4B8A] flex items-center justify-center transition-colors">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#20201F] group-hover:text-[#5B4B8A] transition-colors">
                      {cls.name}
                    </h3>
                    <p className="text-xs text-[#6F6D68] mt-0.5">
                      {cls.studentCount} {cls.studentCount === 1 ? 'student' : 'students'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-[#A8A59F] group-hover:text-[#5B4B8A] transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ==========================================================
           CLASS STUDENT ROSTER (OR SEARCH RESULTS)
           ========================================================== */
        <div className="space-y-4">
          {/* Filter Bar with search & class switcher */}
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#A8A59F]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeClass
                    ? `Search ${activeClass.name} students...`
                    : 'Search students...'
                }
                className="w-full h-9 pl-9 pr-3 text-xs bg-[#FFFFFF] border border-[#E5E2DC] rounded-md text-[#20201F] placeholder:text-[#A8A59F] focus:outline-none focus:border-[#5B4B8A]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-[#6F6D68]">Class:</span>
              <select
                value={selectedClassId || 'all'}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedClassId(val === 'all' ? null : val);
                }}
                className="h-9 px-3 text-xs bg-[#FFFFFF] border border-[#E5E2DC] rounded-md text-[#20201F] focus:outline-none focus:border-[#5B4B8A] w-full sm:w-auto cursor-pointer"
              >
                <option value="all">All Classes Overview</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({classStudentCounts.get(c.id) || 0})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl shadow-2xs overflow-hidden">
            <div className="p-3.5 bg-[#FBFBFA] border-b border-[#E5E2DC] flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-[#20201F] uppercase tracking-wider">
                  {activeClass ? activeClass.name : 'Search Results'}
                </h3>
                <p className="text-xs text-[#6F6D68]">
                  Showing {filteredStudents.length} of{' '}
                  {selectedClassId ? classStudents.length : allStudents.length} students
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#E5E2DC] bg-[#F7F6F3] text-[#6F6D68] text-xs uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-medium">Roll No</th>
                    <th className="py-2.5 px-4 font-medium">Student Name</th>
                    {!activeClass && <th className="py-2.5 px-4 font-medium">Class</th>}
                    <th className="py-2.5 px-4 font-medium">Parent / Guardian</th>
                    <th className="py-2.5 px-4 font-medium">Parent WhatsApp</th>
                    <th className="py-2.5 px-4 font-medium text-right">Academic Results</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DC] text-[#20201F]">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={activeClass ? 5 : 6}
                        className="py-12 text-center text-xs text-[#6F6D68]"
                      >
                        No students found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents
                      .sort((a, b) =>
                        a.roll_number.localeCompare(b.roll_number, undefined, { numeric: true })
                      )
                      .map((st) => {
                        const cls = classes.find((c) => c.id === st.class_id);
                        const sec = sections.find((s) => s.id === st.section_id);
                        const classDisplay = cls
                          ? sec && sec.name && sec.name !== 'A'
                            ? `${cls.name}-${sec.name}`
                            : cls.name
                          : 'Class';

                        return (
                          <tr key={st.id} className="hover:bg-[#FDFDFC]">
                            <td className="py-3 px-4 font-mono text-xs font-medium text-[#20201F]">
                              {st.roll_number}
                            </td>
                            <td className="py-3 px-4 font-medium text-[#20201F]">
                              {st.full_name}
                            </td>
                            {!activeClass && (
                              <td className="py-3 px-4 text-xs font-medium text-[#5B4B8A]">
                                {classDisplay}
                              </td>
                            )}
                            <td className="py-3 px-4 text-xs text-[#20201F]">
                              {st.parent?.guardian_name || st.parent?.name || 'Parent'}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-[#20201F]">
                              {st.parent?.whatsapp_number || st.parent?.phone || '—'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setSelectedStudent(st)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#5B4B8A] bg-[#FAF8FD] hover:bg-[#5B4B8A] hover:text-white border border-[#E2DBEC] rounded-lg transition-colors cursor-pointer"
                              >
                                <FileText className="w-3 h-3" />
                                <span>Results</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
