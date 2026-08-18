import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../../api';
import { SkillOverviewCards } from '../components/SkillOverviewCards';
import { MasteryHeatmap } from '../components/MasteryHeatmap';
import { UnitBreakdownTable } from '../components/UnitBreakdownTable';
import { SkillAwarePredictionCard } from '../components/SkillAwarePredictionCard';
import { StudentWeaknessDiagnosisCard } from '../components/StudentWeaknessDiagnosisCard';
import { computeMockSkillBreakdown } from '../utils/mockReportsData';
import { RefreshCw } from 'lucide-react';

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
    if (isTestMode && sessionRecords && sessionRecords.length > 0) {
      return computeMockSkillBreakdown(sessionRecords, selectedClassId, selectedStudentId);
    }
    return apiReportData;
  }, [isTestMode, sessionRecords, selectedClassId, selectedStudentId, apiReportData]);

  if (loading && !reportData) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center gap-3">
        <RefreshCw size={24} className="animate-spin text-indigo-400" />
        <span>Đang tính toán phân tích kỹ năng & độ nắm vững Bloom...</span>
      </div>
    );
  }

  const defaultStats = {
    vocab_avg: 0,
    grammar_avg: 0,
    mixed_avg: 0,
    mastered_count: 0,
    partial_count: 0,
    regressed_count: 0,
    not_yet_count: 0,
    total_instances: 0,
    mastery_rate: 0,
  };

  const stats = reportData?.skill_stats || defaultStats;
  const unitBreakdown = reportData?.unit_breakdown || [];
  const heatmapUnits = reportData?.mastery_heatmap?.units || [];
  const heatmapStudents = reportData?.mastery_heatmap?.students || [];
  const prediction = reportData?.skill_aware_prediction || null;

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return studentRankings.find(s => String(s.student_id) === String(selectedStudentId)) || null;
  }, [selectedStudentId, studentRankings]);

  return (
    <div className="flex flex-col gap-8 mb-8 select-none">
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

      {/* 1. TOP PEDAGOGICAL KPI CARDS */}
      <SkillOverviewCards stats={stats} />

      {/* 2. CHẨN ĐOÁN ĐIỂM YẾU CHI TIẾT THEO TỪNG BÀI & KỸ NĂNG */}
      <StudentWeaknessDiagnosisCard
        sessionRecords={sessionRecords}
        studentRankings={studentRankings}
        selectedClassId={selectedClassId}
        onSelectStudent={onSelectRankingStudent}
      />

      {/* 3. SKILL-AWARE PREDICTION CARD */}
      <SkillAwarePredictionCard
        prediction={prediction}
        onSelectStudent={onSelectRankingStudent}
      />

      {/* 4. MASTERY HEATMAP MATRIX */}
      <MasteryHeatmap
        units={heatmapUnits}
        students={heatmapStudents}
        onSelectStudent={onSelectRankingStudent}
      />

      {/* 5. UNIT & TOPIC BREAKDOWN TANSTACK TABLE */}
      <UnitBreakdownTable data={unitBreakdown} />
    </div>
  );
};
