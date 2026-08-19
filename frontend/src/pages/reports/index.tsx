import React, { useState, useRef, useMemo, useCallback } from 'react';
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
  FlaskConical,
  Edit3,
} from 'lucide-react';
import { CustomSelect } from '../../components/CustomSelect';
import { OverviewTab } from './tabs/OverviewTab';
import { DeepAnalysisTab } from './tabs/DeepAnalysisTab';
import { SkillBreakdownTab } from './tabs/SkillBreakdownTab';
import { BenchmarkTab } from './tabs/BenchmarkTab';
import { EditGradeModal } from './components/EditGradeModal';
import { ResetGradesModal } from './components/ResetGradesModal';
import { TimePhaseModal } from './components/TimePhaseModal';
import { TestDatasetModal } from './components/TestDatasetModal';
import { useReportsData } from './hooks/useReportsData';
import { getStudentTier, WarningSettings } from './types';
import { generateAcademicYears, getCurrentAcademicYear, getSavedWarningSettings } from './utils';

export const ReportsPage: React.FC = () => {
  const topRef = useRef<HTMLDivElement>(null);
  const [activeReportTab, setActiveReportTab] = useState<'overview' | 'deep' | 'skills' | 'benchmark'>('overview');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(getCurrentAcademicYear());

  // Filter and modal states
  const [selectedDistFilter, setSelectedDistFilter] = useState<'all' | number>('all');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [phaseModalOpen, setPhaseModalOpen] = useState(false);
  const [testDatasetModalOpen, setTestDatasetModalOpen] = useState(false);

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
    students,
    selectedClassId,
    setSelectedClassId,
    selectedStudentId,
    setSelectedStudentId,
    isTestMode,
    toggleTestMode,
    saveTestRecords,
    resetTestRecords,
    mockDataset,
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
    selectedStudentObj,
    engine,
    studentSessionsMap,
    loadAnalyticsData,
    loadTimePhases,
  } = useReportsData();

  const academicYears = useMemo(() => generateAcademicYears(sessionRecords), [sessionRecords]);

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
          {/* Test Mode Toggle */}
          <button
            type="button"
            onClick={toggleTestMode}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer border ${
              isTestMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-[#121626] text-slate-400 hover:text-white border-[#202842] hover:border-slate-600'
            }`}
            title={isTestMode ? "Chế độ Test đang BẬT: Nhấp để chuyển về dữ liệu thực" : "Nhấp để BẬT chế độ Test (20 buổi học / học sinh)"}
          >
            <FlaskConical size={14} className={isTestMode ? "text-amber-400 animate-pulse" : "text-slate-400"} />
            <span>Chế Độ Test (20 Buổi)</span>
            <span className={`w-2 h-2 rounded-full ${isTestMode ? 'bg-amber-400 animate-ping' : 'bg-slate-600'}`} />
          </button>

          {/* Academic Year Selector (No double border) */}
          <CustomSelect
            icon={<Calendar size={14} className="text-indigo-400" />}
            value={selectedAcademicYear}
            onChange={(val) => setSelectedAcademicYear(String(val))}
            options={academicYears.map(y => ({ value: y, label: `Năm học ${y}` }))}
            className="w-48"
          />

          {/* Class Selector (No double border) */}
          <CustomSelect
            icon={<GraduationCap size={14} className="text-indigo-400" />}
            value={selectedClassId}
            onChange={(val) => { setSelectedClassId(String(val)); setSelectedStudentId(''); }}
            options={[
              { value: '', label: 'Tất cả lớp học' },
              ...classes.map(c => ({ value: String(c.id), label: `${c.class_name} (${c.grade || 'Lớp 6'})` }))
            ]}
            className="w-52"
          />

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

      {/* Test Mode Active Banner */}
      {isTestMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <FlaskConical size={18} className="text-amber-400" />
            </div>
            <div>
              <div className="font-black text-amber-200 uppercase tracking-wide flex items-center gap-2">
                <span>Chế Độ Test Dữ Liệu Mẫu (20 Buổi Học / Học Sinh)</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">Đang Bật</span>
              </div>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Đang mô phỏng 20 buổi học với hệ thống điểm Từ Vựng, Ngữ Pháp, BTVN và phân bố đủ 8 cấp bậc xếp hạng (Đồng $\to$ Quán Quân). Không ảnh hưởng đến dữ liệu thực.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTestDatasetModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-black transition cursor-pointer shrink-0 active:scale-95"
            >
              <Edit3 size={13} />
              <span>Xem & Sửa Dữ Liệu Test</span>
            </button>
            <button
              onClick={toggleTestMode}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-black transition cursor-pointer shrink-0 active:scale-95"
            >
              Tắt Chế Độ Test
            </button>
          </div>
        </div>
      )}

      {/* 2. REPORT MODE TAB SWITCHER (4 TABS) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#181f36] pb-3">
        <div className="relative flex bg-[#090d16] p-1 rounded-xl border border-[#1b253b] text-xs shrink-0 font-bold select-none w-full sm:w-auto min-w-[720px]">
          <div
            className="absolute top-1 bottom-1 rounded-lg bg-[#2563eb] shadow-[0_0_14px_rgba(37,99,235,0.45)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
            style={{
              left: activeReportTab === 'overview'
                ? '4px'
                : activeReportTab === 'deep'
                  ? 'calc(25% + 1px)'
                  : activeReportTab === 'skills'
                    ? 'calc(50% + 1px)'
                    : 'calc(75% + 1px)',
              width: 'calc(25% - 4px)',
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
            onClick={() => setActiveReportTab('skills')}
            className={`flex-1 relative z-10 py-2 px-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${activeReportTab === 'skills' ? 'text-white font-black' : 'text-slate-400 hover:text-white'}`}
          >
            <GraduationCap size={13} />
            <span>Phân Tích Kỹ Năng & Unit</span>
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
            loading={loading} classes={classes} studentRankings={studentRankings}
            sessionRecords={sessionRecords} compareClassAId={compareClassAId} setCompareClassAId={setCompareClassAId}
            compareClassBId={compareClassBId} setCompareClassBId={setCompareClassBId} selectedClassId={selectedClassId}
            analyticsSummary={analyticsSummary} classAnalyticsMap={classAnalyticsMap}
          />
        ) : activeReportTab === 'skills' ? (
          <SkillBreakdownTab
            selectedClassId={selectedClassId} selectedStudentId={selectedStudentId}
            onSelectRankingStudent={(id) => setSelectedStudentId(prev => (!id || id === 0 || String(prev) === String(id)) ? '' : String(id))}
            isTestMode={isTestMode} sessionRecords={sessionRecords}
            studentRankings={studentRankings}
          />
        ) : activeReportTab === 'deep' ? (
          <DeepAnalysisTab
            loading={loading} classes={classes} selectedClassId={selectedClassId}
            selectedStudentId={selectedStudentId} studentRankings={studentRankings}
            sessionRecords={sessionRecords} filteredRankings={filteredRankings}
            selectedDistFilter={selectedDistFilter} setSelectedDistFilter={setSelectedDistFilter}
            warningAbsentPct={warningSettings.absentPct} warningConsecutiveAbsent={warningSettings.consecutiveAbsent}
            warningTrendThreshold={warningSettings.trendThreshold} showWarningSettings={showWarningSettings}
            setShowWarningSettings={setShowWarningSettings} onUpdateWarningSettings={handleUpdateWarningSettings}
            onSelectRankingStudent={handleSelectRankingStudent}
          />
        ) : (
          <OverviewTab
            loading={loading} classes={classes} selectedClassId={selectedClassId}
            setSelectedClassId={setSelectedClassId} selectedStudentId={selectedStudentId}
            setSelectedStudentId={setSelectedStudentId} selectedStudentObj={selectedStudentObj}
            selectedAcademicYear={selectedAcademicYear} sessionRecords={sessionRecords}
            studentRankings={studentRankings} filteredRankings={filteredRankings}
            engine={engine} gradeTypesList={gradeTypesList} studentSessionsMap={studentSessionsMap}
            timePhases={timePhases} selectedPhaseId={selectedPhaseId} setSelectedPhaseId={setSelectedPhaseId}
            onOpenPhaseModal={() => setPhaseModalOpen(true)}
            onOpenEditModal={(rec) => { setEditingRecord(rec); setEditModalOpen(true); }}
            onSelectRankingStudent={handleSelectRankingStudent}
            isTestMode={isTestMode}
          />
        )}
      </div>

      {/* 4. MODALS */}
      <EditGradeModal
        record={editingRecord} isTestMode={isTestMode}
        onSaveTestRecord={(updatedRec) => {
          const list = [...(mockDataset?.session_records || sessionRecords)];
          const idx = list.findIndex(r => r.session_id === updatedRec.session_id && String(r.student_id) === String(updatedRec.student_id));
          if (idx !== -1) list[idx] = updatedRec;
          else list.push(updatedRec);
          saveTestRecords(list);
        }}
        onClose={() => { setEditingRecord(null); setEditModalOpen(false); }}
        onSuccess={() => loadAnalyticsData(true)}
      />

      <ResetGradesModal
        isOpen={resetModalOpen} onClose={() => setResetModalOpen(false)}
        selectedClassId={selectedClassId} selectedStudentId={selectedStudentId}
        classes={classes} onSuccess={() => loadAnalyticsData(true)}
      />

      <TimePhaseModal
        isOpen={phaseModalOpen} onClose={() => setPhaseModalOpen(false)}
        classes={classes} selectedClassId={selectedClassId}
        selectedAcademicYear={selectedAcademicYear} timePhases={timePhases}
        onPhasesUpdated={loadTimePhases} selectedPhaseId={selectedPhaseId}
        setSelectedPhaseId={setSelectedPhaseId}
      />

      <TestDatasetModal
        isOpen={testDatasetModalOpen} onClose={() => setTestDatasetModalOpen(false)}
        classes={classes} students={students} sessionRecords={mockDataset?.session_records || sessionRecords}
        onSaveRecords={saveTestRecords} onResetToDefault={resetTestRecords}
      />
    </div>
  );
};

export default ReportsPage;

