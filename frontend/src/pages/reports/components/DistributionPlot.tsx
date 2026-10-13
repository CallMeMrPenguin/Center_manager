import React, { useState } from 'react';
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
      {/* 1. 3D ISOMETRIC HISTOGRAM CHART ENGINE */}
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
        bands={stats.bands}
      />
    </div>
  );
};
