import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../../api';
import { SkillOverviewCards } from '../components/SkillOverviewCards';
import { MasteryHeatmap } from '../components/MasteryHeatmap';
import { UnitBreakdownTable } from '../components/UnitBreakdownTable';
import { SkillAwarePredictionCard } from '../components/SkillAwarePredictionCard';
import { computeMockSkillBreakdown } from '../utils/mockReportsData';
import { RefreshCw } from 'lucide-react';

interface SkillBreakdownTabProps {
  selectedClassId: string;
  selectedStudentId: string;
  onSelectRankingStudent: (studentId: number) => void;
  isTestMode?: boolean;
  sessionRecords?: any[];
}

export const SkillBreakdownTab: React.FC<SkillBreakdownTabProps> = ({
  selectedClassId,
  selectedStudentId,
  onSelectRankingStudent,
  isTestMode,
  sessionRecords,
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

  return (
    <div className="flex flex-col gap-8 mb-8 select-none">
      {/* 1. TOP PEDAGOGICAL KPI CARDS */}
      <SkillOverviewCards stats={stats} />

      {/* 2. SKILL-AWARE PREDICTION CARD */}
      <SkillAwarePredictionCard
        prediction={prediction}
        onSelectStudent={onSelectRankingStudent}
      />

      {/* 3. MASTERY HEATMAP MATRIX */}
      <MasteryHeatmap
        units={heatmapUnits}
        students={heatmapStudents}
        onSelectStudent={onSelectRankingStudent}
      />

      {/* 4. UNIT & TOPIC BREAKDOWN TANSTACK TABLE */}
      <UnitBreakdownTable data={unitBreakdown} />
    </div>
  );
};
