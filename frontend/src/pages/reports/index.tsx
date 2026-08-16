import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  BarChart3,
  GitCompare,
  Activity,
  Layers,
  RotateCcw,
  RefreshCw,
  ChevronRight,
  GraduationCap,
  Calendar,
} from 'lucide-react';
import { CustomSelect } from '../../components/CustomSelect';
import { OverviewTab } from './tabs/OverviewTab';
import { DeepAnalysisTab } from './tabs/DeepAnalysisTab';
import { BenchmarkTab } from './tabs/BenchmarkTab';
import { EditGradeModal } from './components/EditGradeModal';
import { ResetGradesModal } from './components/ResetGradesModal';
import { TimePhaseModal } from './components/TimePhaseModal';
import { useReportsData } from './hooks/useReportsData';
import { getStudentTier, WarningSettings } from './types';
import { generateAcademicYears, getCurrentAcademicYear, getSavedWarningSettings } from './utils';

export const ReportsPage: React.FC = () => {
  const topRef = useRef<HTMLDivElement>(null);
  const [activeReportTab, setActiveReportTab] = useState<'overview' | 'deep' | 'benchmark'>('overview');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(getCurrentAcademicYear());
  const academicYears = useMemo(() => generateAcademicYears(), []);

  // Filter and modal states
  const [selectedDistFilter, setSelectedDistFilter] = useState<'all' | number>('all');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [phaseModalOpen, setPhaseModalOpen] = useState(false);

  // Early warning settings
  const [warningSettings, setWarningSettings] = useState<WarningSettings>(getSavedWarningSettings());
  const [showWarningSettings, setShowWarningSettings] = useState(false);

  const handleUpdateWarningSettings = useCallback((updates: Partial<WarningSettings>) => {
    setWarningSettings(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('cm_reports_warning_settings', JSON.stringify(next));
      return next;
    });
  }, []);

  // Data fetching hook
  const {
    loading,
    classes,
    selectedClassId,
    setSelectedClassId,
    selectedStudentId,
    setSelectedStudentId,
    sessionRecords,
    studentRankings,
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
    engine,
    studentSessionsMap,
    loadAnalyticsData,
    loadTimePhases,
  } = useReportsData();

  const selectedStudentObj = useMemo(() => {
    if (!selectedStudentId || !studentRankings) return null;
    return studentRankings.find(s => String(s.student_id) === selectedStudentId) || null;
  }, [selectedStudentId, studentRankings]);

  const filteredRankings = useMemo(() => {
    let list = studentRankings || [];
    if (selectedClassId) {
      list = list.filter(r => String(r.class_id) === selectedClassId);
    }
    if (selectedDistFilter && selectedDistFilter !== 'all') {
      const targetTier = Number(selectedDistFilter);
      list = list.filter(s => {
        const score = s.ema_level && Number(s.ema_level) > 0 ? Number(s.ema_level) : (Number(s.avg_check_1 || 0) * 0.35 + Number(s.avg_check_2 || 0) * 0.55 + Number(s.avg_homework || 0) * 0.1);
        const tierObj = getStudentTier(score);
        return tierObj.tier === targetTier;
      });
    }
    return list;
  }, [studentRankings, selectedClassId, selectedDistFilter]);

  const handleSelectRankingStudent = (studentId: number) => {
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
    <div ref={topRef} className="h-full w-full overflow-y-auto p-6 space-y-6 bg-[#080b14] text-slate-100 select-none font-sans scrollbar-thin">
      {/* 1. TOP BREADCRUMB & CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#181f36] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-black uppercase text-indigo-400 tracking-wider">
            <span>BÁO CÁO THỐNG KÊ</span>
            <ChevronRight size={12} className="text-slate-500" />
            <span className="text-white">HIỆU SUẤT HỌC TẬP</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1 tracking-tight flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-indigo-400" />
            Báo Cáo Hiệu Suất Học Tập
          </h1>
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Academic Year Selector */}
          <div className="flex items-center gap-2 bg-[#121626] border border-[#202842] px-3.5 py-1.5 rounded-xl shadow-sm">
            <Calendar size={15} className="text-indigo-400 shrink-0" />
            <CustomSelect
              value={selectedAcademicYear}
              onChange={(val) => setSelectedAcademicYear(String(val))}
              options={academicYears.map(y => ({ value: y, label: `Năm học ${y}` }))}
              className="w-44"
            />
          </div>

          {/* Class Selector */}
          <div className="flex items-center gap-2 bg-[#121626] border border-[#202842] px-3.5 py-1.5 rounded-xl shadow-sm">
            <GraduationCap size={15} className="text-indigo-400 shrink-0" />
            <CustomSelect
              value={selectedClassId}
              onChange={(val) => { setSelectedClassId(String(val)); setSelectedStudentId(''); }}
              options={[
                { value: '', label: 'Tất cả lớp học' },
                ...classes.map(c => ({ value: String(c.id), label: `${c.class_name} (${c.grade || 'Lớp 6'})` }))
              ]}
              className="w-48"
            />
          </div>

          <button
            onClick={() => setResetModalOpen(true)}
            className="group flex items-center gap-0 hover:gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-all duration-300 cursor-pointer shadow-sm active:scale-95"
            title="Đặt Lại Điểm Số"
          >
            <RotateCcw size={14} className="shrink-0" />
            <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">
              Đặt Lại Điểm Số
            </span>
          </button>

          <button
            onClick={() => loadAnalyticsData()}
            className="p-2.5 rounded-xl bg-[#121626] hover:bg-[#1e2640] text-slate-300 hover:text-white border border-[#202842] transition cursor-pointer shadow-sm"
            title="Làm mới báo cáo"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-indigo-400" : ""} />
          </button>
        </div>
      </div>

      {/* 2. REPORT MODE TAB SWITCHER (3 TABS) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#181f36] pb-3">
        <div className="relative flex bg-[#090d16] p-1 rounded-xl border border-[#1b253b] text-xs shrink-0 font-bold select-none w-full sm:w-auto min-w-[580px]">
          <div
            className="absolute top-1 bottom-1 rounded-lg bg-[#2563eb] shadow-[0_0_14px_rgba(37,99,235,0.45)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
            style={{
              left: activeReportTab === 'overview'
                ? '4px'
                : activeReportTab === 'deep'
                  ? 'calc(33.333% + 1px)'
                  : 'calc(66.666% + 1px)',
              width: 'calc(33.333% - 4px)',
            }}
          />
          <button
            type="button"
            onClick={() => setActiveReportTab('overview')}
            className={`flex-1 relative z-10 py-2 px-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${activeReportTab === 'overview' ? 'text-white font-black' : 'text-slate-400 hover:text-white'}`}
          >
            <Activity size={13} />
            <span>Tổng Quan Học Lực</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveReportTab('deep')}
            className={`flex-1 relative z-10 py-2 px-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${activeReportTab === 'deep' ? 'text-white font-black' : 'text-slate-400 hover:text-white'}`}
          >
            <Layers size={13} />
            <span>Thống Kê Sâu</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveReportTab('benchmark')}
            className={`flex-1 relative z-10 py-2 px-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${activeReportTab === 'benchmark' ? 'text-white font-black' : 'text-slate-400 hover:text-white'}`}
          >
            <GitCompare size={13} />
            <span>So Sánh Giữa Các Lớp</span>
          </button>
        </div>
      </div>

      {/* 3. ACTIVE SUB-TAB CONTAINER */}
      <div key={activeReportTab} className="space-y-6">
        {activeReportTab === 'benchmark' ? (
          <BenchmarkTab
            loading={loading}
            classes={classes}
            studentRankings={studentRankings}
            sessionRecords={sessionRecords}
            compareClassAId={compareClassAId}
            setCompareClassAId={setCompareClassAId}
            compareClassBId={compareClassBId}
            setCompareClassBId={setCompareClassBId}
            selectedClassId={selectedClassId}
            analyticsSummary={analyticsSummary}
            classAnalyticsMap={classAnalyticsMap}
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
            warningAbsentPct={warningSettings.absentPct}
            warningConsecutiveAbsent={warningSettings.consecutiveAbsent}
            warningTrendThreshold={warningSettings.trendThreshold}
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
        timePhases={timePhases}
        onPhasesUpdated={loadTimePhases}
        selectedPhaseId={selectedPhaseId}
        setSelectedPhaseId={setSelectedPhaseId}
      />
    </div>
  );
};

export default ReportsPage;
