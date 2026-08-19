import React from 'react';
import { DistributionScoreBin } from '../utils/distributionAnalytics';

interface HistogramTooltipProps {
  hoveredBin: DistributionScoreBin;
  mousePos: { x: number; y: number };
  svgWidth: number;
  height: number;
}

export const HistogramTooltip: React.FC<HistogramTooltipProps> = ({
  hoveredBin,
  mousePos,
  svgWidth,
  height,
}) => {
  const tooltipW = 230;
  let tipLeft = mousePos.x + 18;
  let tipTop = mousePos.y - 30;

  if (tipLeft + tooltipW > svgWidth - 10) {
    tipLeft = Math.max(10, mousePos.x - tooltipW - 18);
  }
  if (tipTop < 10) tipTop = 10;
  if (tipTop > height - 160) tipTop = height - 160;

  return (
    <div
      className="absolute z-30 pointer-events-none bg-[#12172b] border border-[#2c375e] p-3.5 rounded-xl shadow-[0_12px_36px_rgba(0,0,0,0.9)] text-xs transition-all duration-75 min-w-[220px]"
      style={{
        left: `${tipLeft}px`,
        top: `${tipTop}px`,
      }}
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-2 font-bold text-white">
        <span className="flex items-center gap-1.5 text-xs sm:text-sm">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: hoveredBin.color }} />
          <span>Mức điểm: {hoveredBin.rangeLabel}</span>
        </span>
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-white font-black">
          {hoveredBin.pct}%
        </span>
      </div>
      <div className="pt-2 space-y-1.5 text-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Số lượng:</span>
          <span className="font-mono font-black text-white text-sm">
            {hoveredBin.count} học sinh
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Tỷ lệ trong lớp:</span>
          <span className="font-mono font-bold text-indigo-300">
            {hoveredBin.pct}%
          </span>
        </div>
        {hoveredBin.studentNames && hoveredBin.studentNames.length > 0 && (
          <div className="pt-1 border-t border-white/10 text-[11px]">
            <span className="text-slate-400 block mb-0.5 font-semibold">Học sinh tiêu biểu:</span>
            <span className="font-bold text-indigo-200 truncate block">
              {hoveredBin.studentNames.slice(0, 3).join(', ')}
              {hoveredBin.studentNames.length > 3 ? ` (+${hoveredBin.studentNames.length - 3})` : ''}
            </span>
          </div>
        )}
        <div className="text-[10px] text-indigo-300/80 italic pt-1 border-t border-white/10">
          Nhấn để lọc học sinh ở bảng xếp hạng
        </div>
      </div>
    </div>
  );
};
