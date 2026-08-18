import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertTriangle, LayoutGrid, BookOpen } from 'lucide-react';
import { api } from '../../../api';
import { MasteryHeatmap } from '../components/MasteryHeatmap';
import { UnitBreakdownTable } from '../components/UnitBreakdownTable';
import { StudentWeaknessDiagnosisCard } from '../components/StudentWeaknessDiagnosisCard';
import { computeMockSkillBreakdown, generateMockReportsData } from '../utils/mockReportsData';

interface SkillBreakdownTabProps {
  selectedClassId: string;
  selectedStudentId: string;
  onSelectRankingStudent: (studentId: number) => void;
  isTestMode?: boolean;
  sessionRecords?: any[];
  studentRankings?: any[];
}

export const SkillBreakdownTab: React.FC<SkillBreakdownTabProps> = ({
  selectedClassId,
  selectedStudentId,
  onSelectRankingStudent,
  isTestMode,
  sessionRecords = [],
  studentRankings = [],
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'diagnosis' | 'heatmap' | 'units'>('diagnosis');
  const [loading, setLoading] = useState(false);
  const [apiReportData, setApiReportData] = useState<any>(null);

  const fetchSkillData = useCallback(async () => {
    if (isTestMode) return;
    setLoading(true);
    try {
      const cid = selectedClassId ? parseInt(selectedClassId) : undefined;
      const sid = selectedStudentId ? parseInt(selectedStudentId) : undefined;
      const res = await api.getSkillBreakdown(cid, sid);
      setApiReportData(res);
    } catch {
      setApiReportData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, selectedStudentId, isTestMode]);

  useEffect(() => {
    fetchSkillData();
  }, [fetchSkillData]);

  const reportData = useMemo(() => {
    if (isTestMode) {
      const recs = (sessionRecords && sessionRecords.length > 0)
        ? sessionRecords
        : generateMockReportsData([], []).session_records;
      return computeMockSkillBreakdown(recs, selectedClassId, selectedStudentId);
    }
    return apiReportData;
  }, [isTestMode, sessionRecords, selectedClassId, selectedStudentId, apiReportData]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return studentRankings.find(s => String(s.student_id) === String(selectedStudentId)) || null;
  }, [selectedStudentId, studentRankings]);

  if (loading && !reportData) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center gap-2">
        <span className="text-indigo-400 font-black">Đang tính toán phân tích kỹ năng & độ nắm vững Bloom...</span>
      </div>
    );
  }

  const unitBreakdown = reportData?.unit_breakdown || [];
  const heatmapUnits = reportData?.mastery_heatmap?.units || [];
  const heatmapStudents = reportData?.mastery_heatmap?.students || [];

  return (
    <div className="flex flex-col gap-6 mb-8 select-none">
      {/* 0. ACTIVE STUDENT FILTER BANNER */}
      {selectedStudent && (
        <div className="bg-[#101528] border border-indigo-500/40 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-lg animate-cascade-1">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-sm flex items-center justify-center border border-white/20">
              {selectedStudent.full_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-400 block tracking-wider">
                ĐANG PHÂN TÍCH KỸ NĂNG HỌC SINH
              </span>
              <h3 className="text-base font-black text-white">
                {selectedStudent.full_name} {selectedStudent.nickname && <span className="text-indigo-300 font-bold">({selectedStudent.nickname})</span>}
                <span className="text-xs text-slate-400 font-normal ml-2">| {selectedStudent.class_name}</span>
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectRankingStudent(0)}
            className="px-3 py-1.5 rounded-xl bg-[#1c2442] hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 text-xs font-bold transition cursor-pointer"
          >
            Bỏ Lọc Học Sinh ✕
          </button>
        </div>
      )}

      {/* 1. INTERNAL SUB-TAB SELECTOR (SLIDING PILL INDICATOR) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-2">
        <div className="relative flex bg-[#0d1018] p-1 rounded-xl border border-white/10 text-xs shrink-0 font-bold select-none w-full sm:w-auto min-w-[540px]">
          <div
            className="absolute top-1 bottom-1 rounded-lg bg-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.5)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
            style={{
              left: activeSubTab === 'diagnosis'
                ? '4px'
                : activeSubTab === 'heatmap'
                  ? 'calc((100% / 3) + 1px)'
                  : 'calc(((100% / 3) * 2) + 1px)',
              width: 'calc((100% / 3) - 4px)',
            }}
          />
          <button
            type="button"
            onClick={() => setActiveSubTab('diagnosis')}
            className={`flex-1 relative z-10 py-2 px-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'diagnosis' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle size={13} />
            <span>Học Sinh Cần Phụ Đạo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('heatmap')}
            className={`flex-1 relative z-10 py-2 px-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'heatmap' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid size={13} />
            <span>Ma Trận Nắm Vững</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('units')}
            className={`flex-1 relative z-10 py-2 px-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'units' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen size={13} />
            <span>Thống Kê Theo Unit</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-TAB CONTENT VIEWS */}
      {activeSubTab === 'diagnosis' && (
        <div className="animate-cascade-1">
          {/* Bảng danh sách học sinh cần phụ đạo theo bài học */}
          <StudentWeaknessDiagnosisCard
            sessionRecords={sessionRecords}
            studentRankings={studentRankings}
            selectedClassId={selectedClassId}
            selectedStudentId={selectedStudentId}
            onSelectStudent={(sid) => {
              onSelectRankingStudent(sid);
              setActiveSubTab('heatmap');
            }}
          />
        </div>
      )}

      {activeSubTab === 'heatmap' && (
        <div className="animate-cascade-1">
          <MasteryHeatmap
            units={heatmapUnits}
            students={heatmapStudents}
            onSelectStudent={onSelectRankingStudent}
          />
        </div>
      )}

      {activeSubTab === 'units' && (
        <div className="animate-cascade-1">
          {/* Unit & Topic Breakdown Table */}
          <UnitBreakdownTable data={unitBreakdown} />
        </div>
      )}
    </div>
  );
};
