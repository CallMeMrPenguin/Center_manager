import React, { useState } from 'react';
import { TierDistributionCard } from '../components/TierDistributionCard';
import { EarlyWarningSection } from '../components/EarlyWarningSection';
import { SmartGroupingSection } from '../components/SmartGroupingSection';
import { ScoreFluctuationsSection } from '../components/ScoreFluctuationsSection';
import { LearningBottlenecksSection } from '../components/LearningBottlenecksSection';
import { SegmentedControl } from '../../../components/SegmentedControl';
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
  const [activeSubTab, setActiveSubTab] = useState<'warnings' | 'pedagogy'>('warnings');

  return (
    <div className="flex flex-col gap-6 mb-8 select-none">
      {/* 1. INTERNAL SUB-TAB SELECTOR (SLIDING PILL INDICATOR) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-2">
        <SegmentedControl<'warnings' | 'pedagogy'>
          value={activeSubTab}
          onChange={setActiveSubTab}
          options={[
            { value: 'warnings', label: 'Phân Bố Cấp Bậc & Cảnh Báo Sớm' },
            { value: 'pedagogy', label: 'Nhóm Học & Biến Động Điểm' },
          ]}
          activeColor="bg-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.5)]"
          className="w-full sm:w-auto min-w-[500px]"
          size="md"
        />
      </div>

      {/* 2. SUB-TAB CONTENT VIEWS */}
      {activeSubTab === 'warnings' && (
        <div key="warnings-subtab" className="space-y-6">
          {/* 1. 8-TIER ACADEMIC RANKING DISTRIBUTION */}
          <div className="animate-cascade-1">
            <TierDistributionCard
              studentRankings={studentRankings}
              selectedClassId={selectedClassId}
              selectedDistFilter={selectedDistFilter}
              setSelectedDistFilter={setSelectedDistFilter}
            />
          </div>

          {/* 2. EARLY WARNING ALERT SYSTEM */}
          <div className="animate-cascade-2">
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
          </div>
        </div>
      )}

      {activeSubTab === 'pedagogy' && (
        <div key="pedagogy-subtab" className="space-y-6">
          {/* 3. SMART PEDAGOGICAL LEVEL GROUPING */}
          <div className="animate-cascade-1">
            <SmartGroupingSection
              filteredRankings={filteredRankings}
              studentRankings={studentRankings}
              classes={classes}
              selectedClassId={selectedClassId}
              onSelectRankingStudent={onSelectRankingStudent}
            />
          </div>

          {/* 4. SCORE FLUCTUATIONS & VARIATIONS TABLE */}
          <div className="animate-cascade-2">
            <ScoreFluctuationsSection
              loading={loading}
              studentRankings={studentRankings}
              sessionRecords={sessionRecords}
              selectedClassId={selectedClassId}
              selectedStudentId={selectedStudentId}
              onSelectRankingStudent={onSelectRankingStudent}
            />
          </div>

          {/* 5. LEARNING BOTTLENECKS SCANNER */}
          <div className="animate-cascade-3">
            <LearningBottlenecksSection
              studentRankings={studentRankings}
              selectedClassId={selectedClassId}
            />
          </div>
        </div>
      )}
    </div>
  );
};
