import React, { useState } from 'react';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { DistributionStats, GradeTypeFilterKey, DistributionScoreBin } from '../utils/distributionAnalytics';
import { Histogram3DChart, GranularityMode } from './Histogram3DChart';
import { DistributionCommentaryCard } from './DistributionCommentaryCard';

interface DistributionPlotProps {
  stats: DistributionStats;
  selectedStudentId?: string;
  selectedClassId?: string;
  selectedGradeTypeFilter: GradeTypeFilterKey;
  setSelectedGradeTypeFilter: (key: GradeTypeFilterKey) => void;
  selectedScoreBin?: DistributionScoreBin | null;
  onSelectScoreBin?: (bin: DistributionScoreBin) => void;
}

export const DistributionPlot: React.FC<DistributionPlotProps> = ({
  stats,
  selectedGradeTypeFilter,
  setSelectedGradeTypeFilter,
  selectedScoreBin,
  onSelectScoreBin,
}) => {
  const [granularity, setGranularity] = useState<GranularityMode>('10bins');

  return (
    <div className="flex flex-col gap-6 select-none animate-cascade-2">
      {/* 1. TOP CONTROLS: Skill/Test-type Segmented Pill & Academic Tiers */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-white/10">
        {/* Sliding Pill Indicator for Grade Type Filter */}
        <SegmentedControl<GradeTypeFilterKey>
          value={selectedGradeTypeFilter}
          onChange={setSelectedGradeTypeFilter}
          options={[
            { value: 'overall', label: 'Tất Cả' },
            { value: 'check_1', label: 'Từ Vựng' },
            { value: 'check_2', label: 'Ngữ Pháp' },
            { value: 'homework', label: 'BTVN' },
            { value: 'mock_test', label: 'Luyện Đề' },
          ]}
          size="sm"
          className="w-full sm:w-auto min-w-[380px]"
        />

        {/* 4 Academic Tier Badges */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
          <span className="flex items-center gap-1.5 bg-[#12182b] border border-[#232f52] px-2.5 py-1 rounded-lg text-rose-400">
            <span className="w-2 h-2 rounded-sm bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
            Yếu &lt;5.0 ({stats.bands[0].pct}%)
          </span>
          <span className="flex items-center gap-1.5 bg-[#12182b] border border-[#232f52] px-2.5 py-1 rounded-lg text-amber-400">
            <span className="w-2 h-2 rounded-sm bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
            TB 5.0-6.4 ({stats.bands[1].pct}%)
          </span>
          <span className="flex items-center gap-1.5 bg-[#12182b] border border-[#232f52] px-2.5 py-1 rounded-lg text-cyan-400">
            <span className="w-2 h-2 rounded-sm bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
            Khá 6.5-7.9 ({stats.bands[2].pct}%)
          </span>
          <span className="flex items-center gap-1.5 bg-[#12182b] border border-[#232f52] px-2.5 py-1 rounded-lg text-emerald-400">
            <span className="w-2 h-2 rounded-sm bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            Giỏi ≥8.0 ({stats.bands[3].pct}%)
          </span>
        </div>
      </div>

      {/* 2. 3D ISOMETRIC HISTOGRAM CHART ENGINE */}
      <Histogram3DChart
        stats={stats}
        granularity={granularity}
        setGranularity={setGranularity}
        selectedBin={selectedScoreBin}
        onSelectBin={onSelectScoreBin}
      />

      {/* 3. COMPREHENSIVE COMMENTARY & PEDAGOGICAL ACTIONS */}
      <DistributionCommentaryCard
        evaluation={stats.evaluation}
        distributionRating={stats.distributionRating}
      />
    </div>
  );
};
