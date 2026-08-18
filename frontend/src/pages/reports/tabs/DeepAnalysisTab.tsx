import React from 'react';
import { TierDistributionCard } from '../components/TierDistributionCard';
import { EarlyWarningSection } from '../components/EarlyWarningSection';
import { SmartGroupingSection } from '../components/SmartGroupingSection';
import { SkillGrammarVocabCard } from '../components/SkillGrammarVocabCard';
import { ScoreFluctuationsSection } from '../components/ScoreFluctuationsSection';
import { LearningBottlenecksSection } from '../components/LearningBottlenecksSection';
import { WarningSettings } from '../types';

interface DeepAnalysisTabProps {
  loading: boolean;
  classes: any[];
  selectedClassId: string;
  selectedStudentId: string;
  studentRankings: any[];
  sessionRecords: any[];
  filteredRankings: any[];
  selectedDistFilter: 'all' | number;
  setSelectedDistFilter: (val: 'all' | number | ((prev: 'all' | number) => 'all' | number)) => void;
  warningAbsentPct: number;
  warningConsecutiveAbsent: number;
  warningTrendThreshold: number;
  showWarningSettings: boolean;
  setShowWarningSettings: (val: boolean | ((prev: boolean) => boolean)) => void;
  onUpdateWarningSettings: (updates: Partial<WarningSettings>) => void;
  onSelectRankingStudent: (studentId: number) => void;
}

export const DeepAnalysisTab: React.FC<DeepAnalysisTabProps> = ({
  loading,
  classes,
  selectedClassId,
  selectedStudentId,
  studentRankings,
  sessionRecords,
  filteredRankings,
  selectedDistFilter,
  setSelectedDistFilter,
  warningAbsentPct,
  warningConsecutiveAbsent,
  warningTrendThreshold,
  showWarningSettings,
  setShowWarningSettings,
  onUpdateWarningSettings,
  onSelectRankingStudent,
}) => {
  return (
    <div className="flex flex-col gap-8 mb-8">
      {/* 1. 8-TIER ACADEMIC RANKING DISTRIBUTION */}
      <TierDistributionCard
        studentRankings={studentRankings}
        selectedClassId={selectedClassId}
        selectedDistFilter={selectedDistFilter}
        setSelectedDistFilter={setSelectedDistFilter}
      />

      {/* 2. EARLY WARNING ALERT SYSTEM */}
      <EarlyWarningSection
        loading={loading}
        studentRankings={studentRankings}
        sessionRecords={sessionRecords}
        selectedClassId={selectedClassId}
        warningAbsentPct={warningAbsentPct}
        warningConsecutiveAbsent={warningConsecutiveAbsent}
        warningTrendThreshold={warningTrendThreshold}
        showWarningSettings={showWarningSettings}
        setShowWarningSettings={setShowWarningSettings}
        onUpdateWarningSettings={onUpdateWarningSettings}
        onSelectRankingStudent={onSelectRankingStudent}
      />

      {/* 3. SMART PEDAGOGICAL LEVEL GROUPING */}
      <SmartGroupingSection
        filteredRankings={filteredRankings}
        studentRankings={studentRankings}
        classes={classes}
        selectedClassId={selectedClassId}
        onSelectRankingStudent={onSelectRankingStudent}
      />

      {/* 4. GRAMMAR VS. VOCABULARY COMPARATIVE ANALYSIS */}
      <SkillGrammarVocabCard
        sessionRecords={sessionRecords}
        studentRankings={studentRankings}
        selectedClassId={selectedClassId}
        onSelectRankingStudent={onSelectRankingStudent}
      />

      {/* 5. SCORE FLUCTUATIONS & VARIATIONS TABLE */}
      <ScoreFluctuationsSection
        loading={loading}
        studentRankings={studentRankings}
        sessionRecords={sessionRecords}
        selectedClassId={selectedClassId}
        selectedStudentId={selectedStudentId}
        onSelectRankingStudent={onSelectRankingStudent}
      />

      {/* 6. LEARNING BOTTLENECKS SCANNER */}
      <LearningBottlenecksSection
        studentRankings={studentRankings}
        selectedClassId={selectedClassId}
      />
    </div>
  );
};
