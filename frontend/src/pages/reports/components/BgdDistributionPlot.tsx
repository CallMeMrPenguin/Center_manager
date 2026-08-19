import React, { useState } from 'react';
import { BgdDistributionStats, GradeTypeFilterKey } from '../utils/bgdAnalytics';
import { Bgd3DHistogram, GranularityMode } from './Bgd3DHistogram';
import { BgdBoxPlot } from './BgdBoxPlot';
import { BgdDetailedCommentaryCard } from './BgdDetailedCommentaryCard';

interface BgdDistributionPlotProps {
  stats: BgdDistributionStats;
  selectedStudentId?: string;
  selectedClassId?: string;
  selectedGradeTypeFilter: GradeTypeFilterKey;
  setSelectedGradeTypeFilter: (key: GradeTypeFilterKey) => void;
  isTestMode?: boolean;
}

export const BgdDistributionPlot: React.FC<BgdDistributionPlotProps> = ({
  stats,
  selectedGradeTypeFilter,
  setSelectedGradeTypeFilter,
  isTestMode,
}) => {
  const [granularity, setGranularity] = useState<GranularityMode>('10bins');

  const filterTabs: { id: GradeTypeFilterKey; label: string }[] = [
    { id: 'overall', label: 'Tất Cả (Tổng Hợp)' },
    { id: 'check_1', label: isTestMode ? 'Từ Vựng (Check 1)' : 'Check 1 (Từ Vựng)' },
    { id: 'check_2', label: isTestMode ? 'Ngữ Pháp (Check 2)' : 'Check 2 (Ngữ Pháp)' },
    { id: 'homework', label: 'Homework (BTVN)' },
    { id: 'mock_test', label: 'Luyện Đề (Mock Test)' },
  ];

  const activeTabIndex = filterTabs.findIndex((t) => t.id === selectedGradeTypeFilter);

  return (
    <div className="flex flex-col gap-6 select-none animate-cascade-2">
      {/* 1. TOP CONTROLS: Skill/Test-type Segmented Pill & Academic Tiers */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-white/10">
        {/* Sliding Pill Indicator for Grade Type Filter */}
        <div className="relative flex bg-[#0c101d] border border-[#1e2947] p-1 rounded-xl text-xs font-black select-none w-full lg:w-auto min-w-[560px] shrink-0">
          <div
            className="absolute top-1 bottom-1 rounded-lg bg-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.5)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
            style={{
              left: `calc((100% / 5) * ${activeTabIndex} + 2px)`,
              width: 'calc((100% / 5) - 4px)',
            }}
          />
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedGradeTypeFilter(tab.id)}
              className={`flex-1 relative z-10 py-1.5 px-2 text-center transition-colors cursor-pointer whitespace-nowrap ${
                selectedGradeTypeFilter === tab.id
                  ? 'text-white font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 4 Academic Tier Badges (Clean flex badges, no pipes/bullets) */}
        <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-bold">
          <span className="flex items-center gap-1.5 bg-[#12182b] border border-[#232f52] px-2 py-1 rounded-lg text-rose-400">
            <span className="w-2 h-2 rounded-sm bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
            Yếu &lt;5.0 ({stats.bands[0].pct}%)
          </span>
          <span className="flex items-center gap-1.5 bg-[#12182b] border border-[#232f52] px-2 py-1 rounded-lg text-amber-400">
            <span className="w-2 h-2 rounded-sm bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
            TB 5.0-6.4 ({stats.bands[1].pct}%)
          </span>
          <span className="flex items-center gap-1.5 bg-[#12182b] border border-[#232f52] px-2 py-1 rounded-lg text-cyan-400">
            <span className="w-2 h-2 rounded-sm bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
            Khá 6.5-7.9 ({stats.bands[2].pct}%)
          </span>
          <span className="flex items-center gap-1.5 bg-[#12182b] border border-[#232f52] px-2 py-1 rounded-lg text-emerald-400">
            <span className="w-2 h-2 rounded-sm bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            Giỏi ≥8.0 ({stats.bands[3].pct}%)
          </span>
        </div>
      </div>

      {/* 2. 3D ISOMETRIC HISTOGRAM CHART ENGINE */}
      <Bgd3DHistogram
        stats={stats}
        granularity={granularity}
        setGranularity={setGranularity}
      />

      {/* 3. SEAMLESS HORIZONTAL BOX PLOT */}
      <BgdBoxPlot stats={stats} />

      {/* 4. COMPREHENSIVE COMMENTARY & PEDAGOGICAL ACTIONS */}
      <BgdDetailedCommentaryCard
        evaluation={stats.evaluation}
        distributionRating={stats.distributionRating}
      />
    </div>
  );
};
