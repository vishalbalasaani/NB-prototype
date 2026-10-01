'use client';

import React, { useState, useMemo } from 'react';
import { User, Student } from '@/types';
import { DataService } from '@/lib/data-service';
import {
  Search,
  Upload,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Users,
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface MarksOverviewViewProps {
  user: User;
  onOpenImport: (classId?: string, examId?: string) => void;
  onSelectStudent: (studentId: string) => void;
  onSelectClass: (classId: string, examId: string) => void;
}

export function MarksOverviewView({
  user,
  onOpenImport,
  onSelectStudent,
  onSelectClass,
}: MarksOverviewViewProps) {
  const examinations = DataService.getExaminations();
  const classes = DataService.getClasses(); // Class 5 to Class 10

  // Filters
  const [selectedExamId, setSelectedExamId] = useState<string>(() => examinations[0]?.id || 'all');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2026-27');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [threshold, setThreshold] = useState<number>(70);

  // Expanded subject for class-level breakdown
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  // Student search
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // View all low attendance toggle
  const [showAllAttention, setShowAllAttention] = useState(false);

  // Query database analytics
  const overview = useMemo(() => {
    return DataService.getAcademicOverview({
      examinationId: selectedExamId,
      classId: selectedClassId,
      threshold,
    });
  }, [selectedExamId, selectedClassId, threshold, DataService]);

  // Instant student search matches
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return DataService.searchStudentResults(searchQuery);
  }, [searchQuery, DataService]);

  const activeExam = examinations.find((e) => e.id === selectedExamId);
  const examName = activeExam ? activeExam.name : 'All Examinations';

  const hasData = overview.totalStudents > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-16">
      {/* ================================================== */}
      {/* 4. MARKS HOME HEADER & COMPACT CONTROLS            */}
      {/* ================================================== */}
      <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E2DC]/70 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#20201F] tracking-tight">
              Marks &amp; Results
            </h1>
            <p className="text-xs text-[#6F6D68] mt-0.5">
              Understand student performance across classes, subjects and examinations.
            </p>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={() => onOpenImport()}
            className="btn-primary text-xs h-9 px-4 flex items-center gap-2 cursor-pointer shadow-2xs self-start sm:self-auto shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>+ Import Excel</span>
          </button>
        </div>

        {/* Compact Filters: [ Examination ] [ Academic Year ] [ Class ] [ Search Student ] */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {/* Examination Filter */}
          <div className="relative">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="h-8.5 px-3 pr-8 text-xs bg-[#FFFFFF] hover:bg-[#FAF9F7] border border-[#E5E2DC] rounded-md text-[#20201F] font-medium focus:outline-hidden focus:border-[#5B4B8A] appearance-none cursor-pointer"
            >
              <option value="all">All Examinations</option>
              {examinations.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#6F6D68] absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Academic Year Filter */}
          <div className="relative">
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="h-8.5 px-3 pr-8 text-xs bg-[#FFFFFF] hover:bg-[#FAF9F7] border border-[#E5E2DC] rounded-md text-[#20201F] font-medium focus:outline-hidden focus:border-[#5B4B8A] appearance-none cursor-pointer"
            >
              <option value="2026-27">2026–27</option>
              <option value="2025-26">2025–26</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#6F6D68] absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Class Filter */}
          <div className="relative">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="h-8.5 px-3 pr-8 text-xs bg-[#FFFFFF] hover:bg-[#FAF9F7] border border-[#E5E2DC] rounded-md text-[#20201F] font-medium focus:outline-hidden focus:border-[#5B4B8A] appearance-none cursor-pointer"
            >
              <option value="all">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#6F6D68] absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Instant Student Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[#6F6D68] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student name or admission number..."
              className="w-full h-8.5 pl-9 pr-3 text-xs bg-[#FFFFFF] border border-[#E5E2DC] rounded-md text-[#20201F] placeholder:text-[#8C887B] focus:outline-hidden focus:border-[#5B4B8A]"
            />

            {/* Dropdown Search Results */}
            {isSearchFocused && searchQuery.trim() && (
              <div className="absolute left-0 right-0 mt-1 bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg shadow-lg max-h-56 overflow-y-auto z-40 divide-y divide-[#E5E2DC]/60">
                {searchResults.length === 0 ? (
                  <div className="p-3 text-xs text-[#6F6D68] text-center">
                    No students found matching &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  searchResults.map((item) => (
                    <button
                      key={item.student.id}
                      onClick={() => {
                        onSelectStudent(item.student.id);
                        setSearchQuery('');
                        setIsSearchFocused(false);
                      }}
                      className="w-full p-2.5 text-left hover:bg-[#FAF9F7] flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <div>
                        <span className="font-semibold text-[#20201F]">{item.student.full_name}</span>
                        <span className="text-[#6F6D68] ml-2">
                          Roll #{item.student.roll_number}
                        </span>
                      </div>
                      {item.latestResult && (
                        <span className="text-[11px] font-semibold text-[#5B4B8A]">
                          {item.latestResult.percentage}% &bull; Grade {item.latestResult.grade}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* 40. EMPTY STATE                                    */}
      {/* ================================================== */}
      {!hasData && (
        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-12 text-center space-y-3 shadow-2xs">
          <div className="w-10 h-10 rounded-full bg-[#FAF9F7] text-[#6F6D68] flex items-center justify-center mx-auto border border-[#E5E2DC]">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-[#20201F]">
            No examination results yet
          </h2>
          <p className="text-xs text-[#6F6D68] max-w-sm mx-auto">
            Import an Excel marks file to create student results. NodeBricks will automatically calculate grades and generate individual student result reports.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onOpenImport()}
              className="btn-primary text-xs h-9 px-4 inline-flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Excel</span>
            </button>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 5. ACADEMIC PERFORMANCE SUMMARY                    */}
      {/* ================================================== */}
      {hasData && (
        <div className="space-y-6">
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 sm:p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6F6D68]">
                  Academic Performance &bull; {selectedAcademicYear}
                </span>
                <div className="text-4xl sm:text-5xl font-bold text-[#20201F] tracking-tight mt-1">
                  {overview.overallAverage}%
                </div>
                <p className="text-xs text-[#6F6D68] mt-0.5">
                  School-wide average &bull; {examName}
                </p>
              </div>

              {/* Compact Metrics */}
              <div className="grid grid-cols-3 gap-4 sm:gap-8 sm:border-l sm:border-[#E5E2DC] sm:pl-8 text-xs text-[#6F6D68]">
                <div>
                  <span className="text-xl sm:text-2xl font-bold text-[#20201F] block">
                    {overview.totalStudents.toLocaleString()}
                  </span>
                  <span>Students</span>
                </div>

                <div>
                  <span className="text-xl sm:text-2xl font-bold text-[#557A61] block">
                    {overview.passedCount.toLocaleString()}
                  </span>
                  <span>Passed</span>
                </div>

                <div>
                  <span className="text-xl sm:text-2xl font-bold text-[#B65C55] block">
                    {overview.needsAttentionCount.toLocaleString()}
                  </span>
                  <span>Needs Attention</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================== */}
          {/* 6 & 8. PERFORMANCE BY CLASS & GRADE DISTRIBUTION   */}
          {/* ================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 6. Performance by Class (Horizontal Bars) */}
            <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#20201F]">
                  Performance by Class
                </h3>
                <p className="text-[11px] text-[#6F6D68]">
                  Average marks percentage by grade level
                </p>
              </div>

              <div className="space-y-3 pt-1">
                {overview.performanceByClass.map((c) => (
                  <div key={c.classId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#20201F]">{c.className}</span>
                      <span className="font-bold text-[#20201F]">{c.averagePercentage}%</span>
                    </div>
                    {/* Horizontal Bar */}
                    <div className="w-full h-3 bg-[#F7F6F3] rounded-full overflow-hidden border border-[#E5E2DC]/60">
                      <div
                        style={{ width: `${c.averagePercentage}%` }}
                        className="h-full bg-[#5B4B8A] rounded-full transition-all duration-300"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#6F6D68]">
                      <span>{c.studentCount} students</span>
                      <span>{c.passedCount} passed &bull; {c.needsAttentionCount} need attention</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 8. Grade Distribution (Horizontal Bars) */}
            <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#20201F]">
                  Grade Distribution
                </h3>
                <p className="text-[11px] text-[#6F6D68]">
                  Result grade tiers across {overview.totalStudents} students
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {overview.gradeDistribution.map((g) => (
                  <div key={g.grade} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#20201F]">{g.label}</span>
                      <span className="font-bold text-[#20201F]">
                        {g.percentage}% <span className="text-[11px] text-[#6F6D68] font-normal">({g.count})</span>
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#F7F6F3] rounded-full overflow-hidden border border-[#E5E2DC]/60">
                      <div
                        style={{ width: `${g.percentage}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          g.grade === 'F' ? 'bg-[#B65C55]' : 'bg-[#5B4B8A]'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ================================================== */}
          {/* 7. PERFORMANCE TREND (Across Examinations)         */}
          {/* ================================================== */}
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#20201F]">
                Performance Trend
              </h3>
              <p className="text-[11px] text-[#6F6D68]">
                Academic progress across recorded examinations
              </p>
            </div>

            {overview.performanceTrend.length >= 2 ? (
              <div className="h-44 w-full flex flex-col justify-end pt-2 pb-1">
                <div className="relative w-full h-32">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <line x1="0" y1="20" x2="100" y2="20" stroke="#E5E2DC" strokeWidth="0.5" strokeDasharray="2 2" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#E5E2DC" strokeWidth="0.5" strokeDasharray="2 2" />
                    <line x1="0" y1="80" x2="100" y2="80" stroke="#E5E2DC" strokeWidth="0.5" strokeDasharray="2 2" />

                    {/* Polyline */}
                    {(() => {
                      const pts = overview.performanceTrend.map((item, idx) => {
                        const x = (idx / (overview.performanceTrend.length - 1)) * 100;
                        const y = 95 - ((item.averagePercentage - 40) / 60) * 85;
                        return `${x},${Math.max(5, Math.min(95, y))}`;
                      });
                      return (
                        <polyline
                          fill="none"
                          stroke="#5B4B8A"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={pts.join(' ')}
                        />
                      );
                    })()}

                    {/* Points */}
                    {overview.performanceTrend.map((item, idx) => {
                      const x = (idx / (overview.performanceTrend.length - 1)) * 100;
                      const y = 95 - ((item.averagePercentage - 40) / 60) * 85;
                      return (
                        <circle
                          key={item.examinationId}
                          cx={x}
                          cy={Math.max(5, Math.min(95, y))}
                          r="3"
                          fill="#FFFFFF"
                          stroke="#5B4B8A"
                          strokeWidth="2"
                        />
                      );
                    })}
                  </svg>
                </div>

                <div className="flex justify-between items-center text-[10px] text-[#6F6D68] pt-2 border-t border-[#E5E2DC]/60 mt-1">
                  {overview.performanceTrend.map((item) => (
                    <div key={item.examinationId} className="text-center">
                      <span className="font-semibold text-[#20201F] block">{item.examinationName}</span>
                      <span className="text-[#5B4B8A] font-bold">{item.averagePercentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#6F6D68] border border-dashed border-[#E5E2DC] rounded-lg">
                Not enough examination data to show a trend. Once multiple examinations are imported, the progress line will display here.
              </div>
            )}
          </div>

          {/* ================================================== */}
          {/* 9. SUBJECT PERFORMANCE (With Class Breakdown)      */}
          {/* ================================================== */}
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#20201F]">
                Subject Performance
              </h3>
              <p className="text-[11px] text-[#6F6D68]">
                School average by subject. Tap any subject to inspect grade-level averages.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {overview.subjectPerformance.map((subj) => {
                const isExpanded = expandedSubject === subj.subjectName;

                return (
                  <div
                    key={subj.subjectName}
                    className="border border-[#E5E2DC]/80 rounded-lg p-3 hover:border-[#D5CAE5] transition-colors"
                  >
                    <div
                      onClick={() => setExpandedSubject(isExpanded ? null : subj.subjectName)}
                      className="cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#20201F] flex items-center gap-1.5">
                          <span>{subj.subjectName}</span>
                          <span className="text-[10px] text-[#5B4B8A] bg-[#F0EDF6] px-1.5 py-0.5 rounded">
                            {isExpanded ? 'Hide breakdown' : 'View breakdown'}
                          </span>
                        </span>
                        <span className="font-bold text-[#20201F]">{subj.averagePercentage}%</span>
                      </div>

                      <div className="w-full h-2.5 bg-[#F7F6F3] rounded-full overflow-hidden border border-[#E5E2DC]/60">
                        <div
                          style={{ width: `${subj.averagePercentage}%` }}
                          className="h-full bg-[#5B4B8A] rounded-full"
                        />
                      </div>
                    </div>

                    {/* Class-level breakdown for this subject */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-[#E5E2DC]/60 grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                        {subj.classBreakdown.map((cb) => (
                          <div key={cb.classId} className="bg-[#FAF9F7] p-2 rounded text-center">
                            <span className="text-[11px] text-[#6F6D68] block">{cb.className}</span>
                            <span className="font-bold text-[#20201F] mt-0.5 block">{cb.averagePercentage}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================================================== */}
          {/* 10. STUDENTS NEEDING ATTENTION                     */}
          {/* ================================================== */}
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl p-5 sm:p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5E2DC]/70 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#20201F]">
                  Students needing attention
                </h3>
                <p className="text-[11px] text-[#6F6D68]">
                  Students scoring below the configured {threshold}% academic threshold
                </p>
              </div>

              {/* Threshold Selector */}
              <div className="flex items-center gap-2 text-xs text-[#6F6D68]">
                <span>Threshold:</span>
                <select
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="h-7 px-2 text-xs bg-[#FFFFFF] border border-[#E5E2DC] rounded text-[#20201F] focus:outline-hidden focus:border-[#5B4B8A] cursor-pointer"
                >
                  <option value={60}>Below 60%</option>
                  <option value={70}>Below 70%</option>
                  <option value={75}>Below 75%</option>
                </select>
              </div>
            </div>

            {overview.studentsNeedingAttention.length === 0 ? (
              <p className="text-xs text-[#557A61] py-2">
                No students currently need attention. All students meet the {threshold}% threshold.
              </p>
            ) : (
              <div className="space-y-2">
                {(showAllAttention
                  ? overview.studentsNeedingAttention
                  : overview.studentsNeedingAttention.slice(0, 4)
                ).map((st) => (
                  <div
                    key={st.studentId}
                    onClick={() => onSelectStudent(st.studentId)}
                    className="p-3 rounded-lg bg-[#FAF9F7] border border-[#E5E2DC]/70 flex items-center justify-between text-xs hover:bg-[#FFFFFF] cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-[#20201F]">{st.name}</span>
                      <span className="text-[#6F6D68] ml-2">{st.className} &bull; Roll #{st.rollNumber}</span>
                    </div>
                    <span className="font-bold text-[#B65C55] bg-[#FBF1F0] px-2 py-0.5 rounded border border-[#F3D6D4]">
                      {st.percentage}% (Grade {st.grade})
                    </span>
                  </div>
                ))}

                {overview.studentsNeedingAttention.length > 4 && (
                  <div className="pt-2 text-center">
                    <button
                      onClick={() => setShowAllAttention(!showAllAttention)}
                      className="text-xs font-semibold text-[#5B4B8A] hover:text-[#433665] cursor-pointer"
                    >
                      {showAllAttention
                        ? 'Show less'
                        : `View all (${overview.studentsNeedingAttention.length} students)`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
