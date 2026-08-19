import React, { useState } from 'react';
import { Info, BookOpen, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { BgdDetailedEvaluation, BgdMetricItem } from '../utils/bgdAnalytics';

interface BgdDetailedCommentaryCardProps {
  evaluation: BgdDetailedEvaluation;
  distributionRating: string;
}

export const BgdDetailedCommentaryCard: React.FC<BgdDetailedCommentaryCardProps> = ({
  evaluation,
  distributionRating,
}) => {
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  const activeMetric = evaluation.metrics.find((m) => m.id === activeTooltipId);

  return (
    <div className="bg-[#0b0f19] border border-[#1b253b] rounded-2xl p-6 shadow-xl space-y-6 select-none relative animate-cascade-3">
      {/* 1. HEADER TITLE & RATING BADGE */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <BookOpen size={16} className="text-indigo-400" />
          <h4 className="text-sm font-black uppercase text-white tracking-wider">
            {evaluation.subjectTitle}
          </h4>
        </div>
        <span className="px-3 py-1 rounded-lg text-xs font-black bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
          {distributionRating}
        </span>
      </div>

      {/* 2. POINT-BY-POINT METRIC BREAKDOWN (WITH INDIVIDUAL INFO TOOLTIPS) */}
      <div className="space-y-3">
        {evaluation.metrics.map((item) => {
          const isTooltipActive = activeTooltipId === item.id;

          return (
            <div
              key={item.id}
              className={`p-3 rounded-xl border transition-all relative ${
                isTooltipActive
                  ? 'bg-[#141b32] border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                  : 'bg-[#0d1222]/80 border-[#1c2642] hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  {/* Glowing Indicator Pill */}
                  <span
                    className="w-2 h-2 rounded-full shrink-0 mt-1.5 shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                    style={{ backgroundColor: item.color }}
                  />
                  <p className="text-xs sm:text-sm font-medium text-slate-200 leading-relaxed">
                    {item.text}
                  </p>
                </div>

                {/* Info Button for Individual Metric Explanation */}
                <button
                  type="button"
                  onClick={() => setActiveTooltipId(isTooltipActive ? null : item.id)}
                  className={`p-1.5 rounded-lg shrink-0 transition cursor-pointer ${
                    isTooltipActive
                      ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.6)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                  title={`Giải thích chi tiết về ${item.label}`}
                >
                  <Info size={13} />
                </button>
              </div>

              {/* In-place Explanatory Card for this Metric */}
              {isTooltipActive && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-2 text-xs animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-indigo-300 font-bold">
                    <span className="uppercase text-[10px] tracking-wider">
                      Ý Nghĩa Chỉ Số: {item.tooltipTitle}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTooltipId(null)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {item.tooltipDesc}
                  </p>
                  <div className="bg-[#090d18] p-2.5 rounded-lg border border-[#1e2744] space-y-1 font-mono text-[10px]">
                    <div className="text-indigo-400 font-bold">
                      {item.tooltipFormula}
                    </div>
                    <div className="text-slate-400 font-sans">
                      {item.tooltipImpact}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. KẾT LUẬN TỔNG QUAN & CHIẾN LƯỢC SƯ PHẠM */}
      <div className="bg-[#0e1426] border border-[#1f2b4c] rounded-xl p-5 space-y-4 shadow-lg">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
          <span className="text-xs font-black uppercase tracking-wider text-amber-400">
            KẾT LUẬN & ĐỊNH HƯỚNG SƯ PHẠM
          </span>
        </div>

        {/* Paragraph 1: Overview Quality */}
        <p className="text-xs sm:text-sm font-semibold text-slate-200 leading-relaxed">
          {evaluation.conclusion.overviewSummary}
        </p>

        {/* Paragraph 2: Deep Dispersion Warning (IQR & SD) */}
        <p className="text-xs sm:text-sm font-semibold text-slate-300 leading-relaxed bg-[#090e1c] p-3.5 rounded-lg border border-white/5">
          {evaluation.conclusion.dispersionWarning}
        </p>

        {/* Paragraph 3: Core Pedagogical Action */}
        <p className="text-xs sm:text-sm font-bold text-amber-300 leading-relaxed">
          {evaluation.conclusion.strategicAction}
        </p>
      </div>

      {/* 4. HÀNH ĐỘNG SƯ PHẠM CỤ THỂ DÀNH CHO GIÁO VIÊN */}
      <div className="space-y-2.5 pt-1">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
          KHUYẾN NGHỊ HÀNH ĐỘNG CỤ THỂ
        </span>
        <div className="space-y-2">
          {evaluation.pedagogicalActions.map((action, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 bg-[#0e1424] p-3 rounded-xl border border-[#1f2b48] text-xs text-slate-200"
            >
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
