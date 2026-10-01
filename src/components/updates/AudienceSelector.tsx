'use client';

import React, { useState, useEffect } from 'react';
import { UpdateAudienceType, Student } from '@/types';
import { DataService } from '@/lib/data-service';
import {
  Users,
  Check,
  Search,
  ChevronDown,
  X,
  UserCheck,
} from 'lucide-react';

interface AudienceSelectorProps {
  audienceType: UpdateAudienceType;
  audienceData?: {
    class_ids?: string[];
    class_names?: string[];
    student_id?: string;
    student_name?: string;
    roll_number?: string;
  };
  onChangeAudience: (
    type: UpdateAudienceType,
    data?: {
      class_ids?: string[];
      class_names?: string[];
      student_id?: string;
      student_name?: string;
      roll_number?: string;
    }
  ) => void;
}

export function AudienceSelector({
  audienceType,
  audienceData,
  onChangeAudience,
}: AudienceSelectorProps) {
  const [isClassPickerOpen, setIsClassPickerOpen] = useState(false);
  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const [classesList, setClassesList] = useState(() => DataService.getClasses());
  const [studentsList, setStudentsList] = useState(() => DataService.getAllStudents());

  useEffect(() => {
    return DataService.subscribe(() => {
      setClassesList(DataService.getClasses());
      setStudentsList(DataService.getAllStudents());
    });
  }, []);

  const allClasses = classesList.map((c) => ({
    id: c.id,
    name: c.name,
    grade: c.display_order || parseInt(c.name.replace(/\D/g, '')) || 0,
  }));

  const selectedClassNames = audienceData?.class_names || [];

  // Toggle class selection
  const handleToggleClass = (className: string, classId: string) => {
    let nextNames: string[];
    let nextIds: string[];

    const currentNames = audienceData?.class_names || [];
    const currentIds = audienceData?.class_ids || [];

    if (currentNames.includes(className)) {
      nextNames = currentNames.filter((n) => n !== className);
      nextIds = currentIds.filter((id) => id !== classId);
    } else {
      nextNames = [...currentNames, className];
      nextIds = [...currentIds, classId];
    }

    onChangeAudience('selected_classes', {
      class_names: nextNames,
      class_ids: nextIds,
    });
  };

  // Shortcuts
  const selectPrimaryClasses = () => {
    const primary = allClasses.filter((c) => c.grade > 0 && c.grade <= 5);
    onChangeAudience('selected_classes', {
      class_names: primary.map((c) => c.name),
      class_ids: primary.map((c) => c.id),
    });
  };

  const selectHighSchoolClasses = () => {
    const high = allClasses.filter((c) => c.grade >= 6);
    onChangeAudience('selected_classes', {
      class_names: high.map((c) => c.name),
      class_ids: high.map((c) => c.id),
    });
  };

  const selectAllClasses = () => {
    onChangeAudience('selected_classes', {
      class_names: allClasses.map((c) => c.name),
      class_ids: allClasses.map((c) => c.id),
    });
  };

  // Students for specific student lookup from real database
  const filteredStudents = studentsList.filter(
    (st) =>
      st.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (st.roll_number && st.roll_number.includes(studentSearch)) ||
      (st.admission_number && st.admission_number.includes(studentSearch))
  );

  const formatClassSummary = () => {
    if (selectedClassNames.length === 0) return 'Select Classes';
    if (allClasses.length > 0 && selectedClassNames.length === allClasses.length) return 'All Classes';
    return `${selectedClassNames.length} classes selected (${selectedClassNames.join(', ')})`;
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium uppercase tracking-wider text-[#6F6D68]">
        Audience
      </label>

      {/* Main 2 Primary Buttons + Secondary Link */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setIsClassPickerOpen(false);
            setIsStudentPickerOpen(false);
            onChangeAudience('entire_school', {});
          }}
          className={`h-10 px-4 rounded-md text-xs font-medium border flex items-center justify-center gap-2 transition-colors ${
            audienceType === 'entire_school'
              ? 'bg-[#F0EDF6] text-[#5B4B8A] border-[#5B4B8A]'
              : 'bg-[#FFFFFF] text-[#20201F] border-[#E5E2DC] hover:bg-[#F9F8F6]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Entire School</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsClassPickerOpen(true);
            setIsStudentPickerOpen(false);
            if (audienceType !== 'selected_classes') {
              selectHighSchoolClasses(); // Default to Classes 6–10
            }
          }}
          className={`h-10 px-4 rounded-md text-xs font-medium border flex items-center justify-between gap-1 transition-colors ${
            audienceType === 'selected_classes'
              ? 'bg-[#F0EDF6] text-[#5B4B8A] border-[#5B4B8A]'
              : 'bg-[#FFFFFF] text-[#20201F] border-[#E5E2DC] hover:bg-[#F9F8F6]'
          }`}
        >
          <span className="truncate">{formatClassSummary()}</span>
          <ChevronDown className="w-3.5 h-3.5 shrink-0" />
        </button>
      </div>

      {/* Specific Student Secondary Action */}
      <div className="pt-0.5">
        {audienceType === 'specific_student' && audienceData?.student_name ? (
          <div className="p-2.5 bg-[#F0EDF6] border border-[#D5CEE5] rounded-md flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#5B4B8A] font-medium">
              <UserCheck className="w-4 h-4" />
              <span>
                {audienceData.student_name} (Roll: {audienceData.roll_number})
              </span>
            </div>
            <button
              type="button"
              onClick={() => onChangeAudience('entire_school')}
              className="text-[#6F6D68] hover:text-[#B65C55]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsStudentPickerOpen(true);
              setIsClassPickerOpen(false);
            }}
            className="text-xs text-[#5B4B8A] hover:text-[#433665] font-medium transition-colors"
          >
            Send to a specific student &rarr;
          </button>
        )}
      </div>

      {/* Compact Class Selection Modal/Drawer */}
      {isClassPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4">
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl max-w-sm w-full p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-3">
              <h3 className="text-sm font-semibold text-[#20201F]">Select Classes</h3>
              <button
                type="button"
                onClick={() => setIsClassPickerOpen(false)}
                className="text-xs text-[#6F6D68] hover:text-[#20201F]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick shortcuts */}
            <div className="flex items-center gap-1.5 pb-1">
              <button
                type="button"
                onClick={selectPrimaryClasses}
                className="text-[11px] px-2.5 py-1 rounded bg-[#F7F6F3] hover:bg-[#EFECE6] text-[#20201F] font-medium border border-[#E5E2DC]"
              >
                Primary 1–5
              </button>
              <button
                type="button"
                onClick={selectHighSchoolClasses}
                className="text-[11px] px-2.5 py-1 rounded bg-[#F7F6F3] hover:bg-[#EFECE6] text-[#20201F] font-medium border border-[#E5E2DC]"
              >
                High School 6–10
              </button>
              <button
                type="button"
                onClick={selectAllClasses}
                className="text-[11px] px-2.5 py-1 rounded bg-[#F7F6F3] hover:bg-[#EFECE6] text-[#20201F] font-medium border border-[#E5E2DC]"
              >
                All Classes
              </button>
            </div>

            {/* Class Checkboxes list */}
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {allClasses.length === 0 ? (
                <div className="col-span-2 py-6 text-center text-xs text-[#6F6D68]">
                  No classes found in the database.
                </div>
              ) : (
                allClasses.map((cls) => {
                  const isSelected = selectedClassNames.includes(cls.name);
                  return (
                    <label
                      key={cls.id}
                      className={`flex items-center gap-2 p-2 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#F0EDF6] text-[#5B4B8A] border-[#5B4B8A]'
                          : 'bg-[#FFFFFF] text-[#20201F] border-[#E5E2DC] hover:bg-[#F9F8F6]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleClass(cls.name, cls.id)}
                        className="w-3.5 h-3.5 accent-[#5B4B8A] rounded"
                      />
                      <span>{cls.name}</span>
                    </label>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-[#E5E2DC]">
              <button
                type="button"
                onClick={() => setIsClassPickerOpen(false)}
                className="btn-primary w-full text-xs h-9 bg-[#5B4B8A]"
              >
                Done ({selectedClassNames.length} selected)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Specific Student Lookup Modal */}
      {isStudentPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4">
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl max-w-sm w-full p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-3">
              <h3 className="text-sm font-semibold text-[#20201F]">Search Student</h3>
              <button
                type="button"
                onClick={() => setIsStudentPickerOpen(false)}
                className="text-xs text-[#6F6D68] hover:text-[#20201F]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#A8A59F]" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search by name or roll number..."
                className="w-full h-8 pl-8 pr-3 text-xs bg-[#FFFFFF] border border-[#E5E2DC] rounded-md text-[#20201F] focus:outline-none focus:border-[#5B4B8A]"
              />
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-[#E5E2DC]/60 pr-1">
              {filteredStudents.length === 0 ? (
                <p className="text-xs text-[#6F6D68] py-4 text-center">No student found.</p>
              ) : (
                filteredStudents.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      onChangeAudience('specific_student', {
                        student_id: st.id,
                        student_name: st.full_name,
                        roll_number: st.roll_number,
                      });
                      setIsStudentPickerOpen(false);
                    }}
                    className="w-full text-left py-2.5 px-2 hover:bg-[#F9F8F6] rounded flex items-center justify-between transition-colors"
                  >
                    <div>
                      <p className="text-xs font-medium text-[#20201F]">{st.full_name}</p>
                      <p className="text-[11px] text-[#6F6D68]">
                        Roll {st.roll_number} &bull; Parent: {st.parent?.guardian_name}
                      </p>
                    </div>
                    <span className="text-[11px] text-[#5B4B8A] font-medium">Select</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
