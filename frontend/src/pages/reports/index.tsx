import React, { useState, useRef, useMemo } from 'react';
import { OverviewTab } from './tabs/OverviewTab';
import { DeepAnalysisTab } from './tabs/DeepAnalysisTab';
import { SkillBreakdownTab } from './tabs/SkillBreakdownTab';
import { BenchmarkTab } from './tabs/BenchmarkTab';
import { ReportsHeader } from './components/ReportsHeader';
import { EditGradeModal } from './components/EditGradeModal';
import { ResetGradesModal } from './components/ResetGradesModal';
import { TimePhaseModal } from './components/TimePhaseModal';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useReportsData } from './hooks/useReportsData';
import { getStudentTier } from './types';
import { generateAcademicYears, getCurrentAcademicYear, computeStudentOverallScore } from './utils';

import { getUrlParam, setUrlParams, useUrlSync } from '../../utils/navigation';

export const ReportsPage: React.FC = () => {
  const topRef = useRef<HTMLDivElement>(null);
  const [activeReportTab, setActiveReportTab] = useState<'overview' | 'deep' | 'skills' | 'benchmark'>(() => {
    const tab = getUrlParam('tab') || getUrlParam('subtab');
    if (tab === 'deep' || tab === 'skills' || tab === 'benchmark' || tab === 'overview') return tab;
    return 'overview';
  });
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(getCurrentAcademicYear());

  // Filter and modal states
  const [selectedDistFilter, setSelectedDistFilter] = useState<'all' | number>('all');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [phaseModalOpen, setPhaseModalOpen] = useState(false);

  // Data fetching hook
  const {
    loading,
    classes,
    selectedClassId,
    setSelectedClassId,
    selectedStudentId,
    setSelectedStudentId,
    sessionRecords,
    allSessionRecords,
    studentRankings,
    allStudentRankings,
    gradeTypesList,
    analyticsSummary,
    classAnalyticsMap,
    timePhases,
    selectedPhaseId,
    setSelectedPhaseId,
    compareClassAId,
    setCompareClassAId,
    compareClassBId,
    setCompareClassBId,
    warningAbsentPct,
    warningConsecutiveAbsent,
    warningTrendThreshold,
    showWarningSettings,
    setShowWarningSettings,
    handleUpdateWarningSettings,
    selectedStudentObj,
    engine,
    studentSessionsMap,
    loadAnalyticsData,
    loadTimePhases,
  } = useReportsData();

  const handleTabChange = (tab: 'overview' | 'deep' | 'skills' | 'benchmark') => {
    setActiveReportTab(tab);
    setUrlParams({ tab });
  };

  useUrlSync(() => {
    const tab = getUrlParam('tab') || getUrlParam('subtab');
    if (tab === 'deep' || tab === 'skills' || tab === 'benchmark' || tab === 'overview') {
      setActiveReportTab(tab);
    }
  });

  const academicYears = useMemo(() => generateAcademicYears(sessionRecords), [sessionRecords]);

  const filteredRankings = useMemo(() => {
    let list = studentRankings || [];
    if (selectedClassId) {
      list = list.filter(r => String(r.class_id) === selectedClassId);
    }
    if (selectedDistFilter && selectedDistFilter !== 'all') {
      const targetTier = Number(selectedDistFilter);
      list = list.filter(s => {
        const score = computeStudentOverallScore(s);
        const tierObj = getStudentTier(score);
        return tierObj.tier === targetTier;
      });
    }
    return [...list].sort((a, b) => {
      const scA = computeStudentOverallScore(a);
      const scB = computeStudentOverallScore(b);
      if (scB !== scA) return scB - scA;
      return (b.present_count || 0) - (a.present_count || 0);
    });
  }, [studentRankings, selectedClassId, selectedDistFilter]);

  const handleSelectRankingStudent = (studentId: number) => {
    if (!studentId || studentId === 0) {
      setSelectedStudentId('');
      return;
    }
    const sidStr = String(studentId);
    if (selectedStudentId === sidStr && activeReportTab === 'overview') {
      setSelectedStudentId('');
    } else {
      setSelectedStudentId(sidStr);
      setActiveReportTab('overview');
      if (topRef.current) {
        topRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div ref={topRef} className="h-full w-full overflow-y-auto p-6 space-y-6 bg-[#eef2f6] dark:bg-[#080b14] text-slate-800 dark:text-slate-100 select-none font-sans scrollbar-thin">
      {/* 1. TOP BREADCRUMB & CONTROLS */}
      <ReportsHeader
        activeReportTab={activeReportTab}
        selectedAcademicYear={selectedAcademicYear}
        setSelectedAcademicYear={setSelectedAcademicYear}
        academicYears={academicYears}
        selectedClassId={selectedClassId}
        setSelectedClassId={setSelectedClassId}
        setSelectedStudentId={setSelectedStudentId}
        classes={classes}
        loading={loading}
        loadAnalyticsData={loadAnalyticsData}
        onOpenResetModal={() => setResetModalOpen(true)}
      />

      {/* 2. REPORT MODE TAB SWITCHER (4 TABS) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-300/80 dark:border-[#181f36]">
        <div className="flex items-center gap-1 -mb-px overflow-x-auto scrollbar-none">
          {[
            { id: 'overview', label: 'Tổng Quan Học Lực' },
            { id: 'deep', label: 'Thống Kê Sâu' },
            { id: 'skills', label: 'Phân Tích Kỹ Năng & Unit' },
            { id: 'benchmark', label: 'So Sánh Giữa Các Lớp' },
          ].map((tab) => {
            const isActive = activeReportTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id as any)}
                className={`px-4 py-2.5 text-sm transition-all cursor-pointer flex items-center gap-2 border-b-2 font-black ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. ACTIVE SUB-TAB CONTAINER */}
      <div key={activeReportTab} className="space-y-6">
        {activeReportTab === 'benchmark' ? (
          <BenchmarkTab
            loading={loading}
            classes={classes}
            studentRankings={allStudentRankings}
            sessionRecords={allSessionRecords}
            compareClassAId={compareClassAId}
            setCompareClassAId={setCompareClassAId}
            compareClassBId={compareClassBId}
            setCompareClassBId={setCompareClassBId}
            selectedClassId={selectedClassId}
            analyticsSummary={analyticsSummary}
            classAnalyticsMap={classAnalyticsMap}
          />
        ) : activeReportTab === 'skills' ? (
          <SkillBreakdownTab
            selectedClassId={selectedClassId}
            selectedStudentId={selectedStudentId}
            onSelectRankingStudent={(id) => setSelectedStudentId(prev => (!id || id === 0 || String(prev) === String(id)) ? '' : String(id))}
            sessionRecords={sessionRecords}
            studentRankings={studentRankings}
            classes={classes}
            onSelectClass={setSelectedClassId}
          />
        ) : activeReportTab === 'deep' ? (
          <DeepAnalysisTab
            loading={loading}
            classes={classes}
            selectedClassId={selectedClassId}
            selectedStudentId={selectedStudentId}
            studentRankings={studentRankings}
            sessionRecords={sessionRecords}
            filteredRankings={filteredRankings}
            selectedDistFilter={selectedDistFilter}
            setSelectedDistFilter={setSelectedDistFilter}
            warningAbsentPct={warningAbsentPct}
            warningConsecutiveAbsent={warningConsecutiveAbsent}
            warningTrendThreshold={warningTrendThreshold}
            showWarningSettings={showWarningSettings}
            setShowWarningSettings={setShowWarningSettings}
            onUpdateWarningSettings={handleUpdateWarningSettings}
            onSelectRankingStudent={handleSelectRankingStudent}
          />
        ) : (
          <OverviewTab
            loading={loading}
            classes={classes}
            selectedClassId={selectedClassId}
            setSelectedClassId={setSelectedClassId}
            selectedStudentId={selectedStudentId}
            setSelectedStudentId={setSelectedStudentId}
            selectedStudentObj={selectedStudentObj}
            selectedAcademicYear={selectedAcademicYear}
            sessionRecords={sessionRecords}
            studentRankings={studentRankings}
            filteredRankings={filteredRankings}
            engine={engine}
            gradeTypesList={gradeTypesList}
            studentSessionsMap={studentSessionsMap}
            timePhases={timePhases}
            selectedPhaseId={selectedPhaseId}
            setSelectedPhaseId={setSelectedPhaseId}
            onOpenPhaseModal={() => setPhaseModalOpen(true)}
            onOpenEditModal={(rec) => { setEditingRecord(rec); setEditModalOpen(true); }}
            onSelectRankingStudent={handleSelectRankingStudent}
          />
        )}
      </div>

      {/* 4. MODALS */}
      <EditGradeModal
        record={editingRecord}
        onClose={() => { setEditingRecord(null); setEditModalOpen(false); }}
        onSuccess={() => loadAnalyticsData(true)}
      />

      <ResetGradesModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        selectedClassId={selectedClassId}
        selectedStudentId={selectedStudentId}
        classes={classes}
        onSuccess={() => loadAnalyticsData(true)}
      />

      <TimePhaseModal
        isOpen={phaseModalOpen}
        onClose={() => setPhaseModalOpen(false)}
        classes={classes}
        selectedClassId={selectedClassId}
        selectedAcademicYear={selectedAcademicYear}
        timePhases={timePhases}
        onPhasesUpdated={loadTimePhases}
        selectedPhaseId={selectedPhaseId}
        setSelectedPhaseId={setSelectedPhaseId}
      />
    </div>
  );
};

export default ReportsPage;
