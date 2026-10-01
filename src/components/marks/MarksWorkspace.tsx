'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { DataService } from '@/lib/data-service';
import { ArrowLeft } from 'lucide-react';
import { MarksOverviewView } from './MarksOverviewView';
import { MarksResultsView } from './MarksResultsView';
import { MarksStudentsView } from './MarksStudentsView';
import { MarksReportsView } from './MarksReportsView';
import { ImportMarksModal } from './ImportMarksModal';
import { PublishResultsModal } from './PublishResultsModal';

export type MarksSubTab = 'overview' | 'results' | 'students' | 'reports';

interface MarksWorkspaceProps {
  user: User;
  onBackToHome: () => void;
  initialTab?: MarksSubTab;
}

export function MarksWorkspace({
  user,
  onBackToHome,
  initialTab = 'overview',
}: MarksWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<MarksSubTab>(initialTab);
  const [refreshKey, setRefreshKey] = useState(0);

  // Selected student / class / exam state for seamless cross-navigation
  const [activeStudentId, setActiveStudentId] = useState<string | undefined>(undefined);
  const [activeClassId, setActiveClassId] = useState<string | undefined>(undefined);
  const [activeExamId, setActiveExamId] = useState<string | undefined>(undefined);

  // Modals state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importClassId, setImportClassId] = useState<string | undefined>(undefined);
  const [importExamId, setImportExamId] = useState<string | undefined>(undefined);

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishExamId, setPublishExamId] = useState<string | undefined>(undefined);
  const [publishClassId, setPublishClassId] = useState<string | undefined>(undefined);

  // Automatic invisible data refresh (Zero technical jargon shown)
  useEffect(() => {
    const unsubscribe = DataService.subscribe(() => {
      setRefreshKey((k) => k + 1);
    });
    return unsubscribe;
  }, []);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  // Cross-view handlers
  const handleSelectStudent = (studentId: string) => {
    setActiveStudentId(studentId);
    setActiveTab('students');
  };

  const handleSelectClass = (classId: string, examId: string) => {
    setActiveClassId(classId);
    setActiveExamId(examId);
    setActiveTab('results');
  };

  const handleOpenImport = (classId?: string, examId?: string) => {
    setImportClassId(classId);
    setImportExamId(examId);
    setShowImportModal(true);
  };

  const handleOpenPublish = (examId?: string, classId?: string) => {
    setPublishExamId(examId);
    setPublishClassId(classId);
    setShowPublishModal(true);
  };

  return (
    <div key={refreshKey} className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-150">
      {/* ================================================== */}
      {/* 3. MARKS TOP HEADER & 4-TAB NAVIGATION             */}
      {/* Strictly: Overview | Results | Students | Reports  */}
      {/* ================================================== */}
      <div className="space-y-4 border-b border-[#E5E2DC] pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              aria-label="Back to Home"
              className="w-8 h-8 rounded-lg border border-[#E5E2DC] bg-[#FFFFFF] hover:bg-[#FAF9F7] text-[#6F6D68] hover:text-[#20201F] flex items-center justify-center transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#20201F] tracking-tight">
                Marks &amp; Results
              </h1>
              <p className="text-xs text-[#6F6D68] mt-0.5 hidden sm:block">
                Understand student performance across classes, subjects and examinations.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Contextual Navigation Items ONLY (Section 3) */}
        <div className="flex items-center gap-1 border-b border-transparent -mb-[17px] overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 text-xs sm:text-sm font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-[#5B4B8A] text-[#5B4B8A] font-semibold'
                : 'border-transparent text-[#6F6D68] hover:text-[#20201F]'
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`pb-3 px-3 text-xs sm:text-sm font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'results'
                ? 'border-[#5B4B8A] text-[#5B4B8A] font-semibold'
                : 'border-transparent text-[#6F6D68] hover:text-[#20201F]'
            }`}
          >
            Results
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`pb-3 px-3 text-xs sm:text-sm font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'students'
                ? 'border-[#5B4B8A] text-[#5B4B8A] font-semibold'
                : 'border-transparent text-[#6F6D68] hover:text-[#20201F]'
            }`}
          >
            Students
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 px-3 text-xs sm:text-sm font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'reports'
                ? 'border-[#5B4B8A] text-[#5B4B8A] font-semibold'
                : 'border-transparent text-[#6F6D68] hover:text-[#20201F]'
            }`}
          >
            Reports
          </button>
        </div>
      </div>

      {/* ================================================== */}
      {/* TAB CONTENT VIEWS                                  */}
      {/* ================================================== */}
      {activeTab === 'overview' && (
        <MarksOverviewView
          user={user}
          onOpenImport={handleOpenImport}
          onSelectStudent={handleSelectStudent}
          onSelectClass={handleSelectClass}
        />
      )}

      {activeTab === 'results' && (
        <MarksResultsView
          user={user}
          onSelectStudent={handleSelectStudent}
          onOpenImport={handleOpenImport}
          onOpenPublish={handleOpenPublish}
          initialClassId={activeClassId}
          initialExamId={activeExamId}
        />
      )}

      {activeTab === 'students' && (
        <MarksStudentsView
          user={user}
          initialStudentId={activeStudentId}
        />
      )}

      {activeTab === 'reports' && (
        <MarksReportsView user={user} />
      )}

      {/* ================================================== */}
      {/* ACTIONS & DIALOGS                                  */}
      {/* ================================================== */}
      {showImportModal && (
        <ImportMarksModal
          initialClassId={importClassId}
          initialExamId={importExamId}
          onClose={() => setShowImportModal(false)}
          onImportSuccess={handleRefresh}
        />
      )}

      {showPublishModal && (
        <PublishResultsModal
          initialClassId={publishClassId}
          initialExamId={publishExamId}
          onClose={() => setShowPublishModal(false)}
          onPublishSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
