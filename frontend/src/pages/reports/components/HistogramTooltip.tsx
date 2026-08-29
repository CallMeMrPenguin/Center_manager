import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Users } from 'lucide-react';
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
  const tooltipW = 240;
  let tipLeft = mousePos.x + 18;
  let tipTop = mousePos.y - 30;

  if (tipLeft + tooltipW > svgWidth - 10) {
    tipLeft = Math.max(10, mousePos.x - tooltipW - 18);
  }
  if (tipTop < 10) tipTop = 10;
  if (tipTop > height - 160) tipTop = height - 160;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 4 }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
        className="absolute z-30 pointer-events-none bg-[#0d1224] border border-[#232f54] p-3.5 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.95)] text-xs min-w-[230px] select-none"
        style={{
          left: `${tipLeft}px`,
          top: `${tipTop}px`,
        }}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-2 font-bold text-white">
          <span className="flex items-center gap-1.5 text-xs sm:text-sm">
            <span
              className="w-2.5 h-2.5 rounded-md shadow-sm"
              style={{ backgroundColor: hoveredBin.color }}
            />
            <span>Mức: {hoveredBin.rangeLabel}</span>
          </span>
          <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-white/10 text-white font-black">
            {hoveredBin.pct}%
          </span>
        </div>

        <div className="pt-2 space-y-1.5 text-slate-300 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Users size={12} className="text-slate-500" />
              <span>Số lượng:</span>
            </span>
            <span className="font-mono font-black text-white">
              {hoveredBin.count} học sinh
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Tỷ lệ phổ điểm:</span>
            <span className="font-mono font-black text-indigo-400">
              {hoveredBin.pct}%
            </span>
          </div>

          {hoveredBin.studentNames && hoveredBin.studentNames.length > 0 && (
            <div className="pt-1.5 border-t border-white/10 text-[11px]">
              <span className="text-slate-400 block mb-1 font-semibold text-[10px] uppercase tracking-wider">
                Học sinh tiêu biểu:
              </span>
              <span className="font-bold text-indigo-200 truncate block bg-[#13192f] p-1.5 rounded-lg border border-white/5">
                {hoveredBin.studentNames.slice(0, 3).join(', ')}
                {hoveredBin.studentNames.length > 3 ? ` (+${hoveredBin.studentNames.length - 3})` : ''}
              </span>
            </div>
          )}

          <div className="text-[10px] text-indigo-300 flex items-center gap-1 pt-1 border-t border-white/10 font-medium">
            <Sparkles size={11} className="text-indigo-400 shrink-0" />
            <span>Nhấn cột để lọc danh sách chi tiết</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
