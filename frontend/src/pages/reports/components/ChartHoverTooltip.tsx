import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HoveredChartPoint } from '../types';
import { format1Dec, trunc1Dec } from '../../../utils';

interface ChartHoverTooltipProps {
  hoveredPoint: HoveredChartPoint | null;
  chartWidth: number;
  gradeTypesList?: any[];
}

const getScoreTierColor = (score: number) => {
  if (score >= 8.0) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 6.5) return 'text-blue-600 dark:text-blue-400';
  if (score >= 5.0) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
};

export const ChartHoverTooltip: React.FC<ChartHoverTooltipProps> = ({
  hoveredPoint,
  chartWidth,
  gradeTypesList,
}) => {
  if (!hoveredPoint) return null;

  const pointX = hoveredPoint.x;
  const pointY = hoveredPoint.y;
  const cardWidth = 230;
  const cardHeight = 175;

  // Center horizontally over pointX
  let left = pointX - cardWidth / 2;

  // Strict clamp to guarantee the card NEVER overflows left or right boundaries
  const minLeft = 12;
  const maxLeft = Math.max(minLeft, chartWidth - cardWidth - 12);
  if (left < minLeft) {
    left = minLeft;
  } else if (left > maxLeft) {
    left = maxLeft;
  }

  // Vertical positioning:
  // If point is too close to top edge, place below the point, otherwise above
  let top = pointY - cardHeight - 16;
  if (top < 12) {
    top = pointY + 20;
  }

  const c1Item = gradeTypesList?.find((g) => g.id === 'check_1');
  const c2Item = gradeTypesList?.find((g) => g.id === 'check_2');
  const hwItem = gradeTypesList?.find((g) => g.id === 'homework');

  const c1Color = c1Item?.color || '#3b82f6';
  const c2Color = c2Item?.color || '#a855f7';
  const hwColor = hwItem?.color || '#10b981';

  const c1Label = c1Item?.label || 'Từ Vựng';
  const c2Label = c2Item?.label || 'Ngữ Pháp';
  const hwLabel = hwItem?.label || 'BTVN';

  const c1Weight = (c1Item?.weight ?? 55) / 100;
  const c2Weight = (c2Item?.weight ?? 35) / 100;
  const hwWeight = (hwItem?.weight ?? 10) / 100;

  let wSum = 0;
  let wTot = 0;
  if (hoveredPoint.check1 > 0) {
    wSum += hoveredPoint.check1 * c1Weight;
    wTot += c1Weight;
  }
  if (hoveredPoint.check2 > 0) {
    wSum += hoveredPoint.check2 * c2Weight;
    wTot += c2Weight;
  }
  if (hoveredPoint.homework > 0) {
    wSum += hoveredPoint.homework * hwWeight;
    wTot += hwWeight;
  }
  const avgVal = wTot > 0 ? trunc1Dec(wSum / wTot) : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="absolute z-40 pointer-events-none bg-white dark:bg-[#141417] border border-slate-200 dark:border-[#27272a] p-3.5 rounded-2xl shadow-xl dark:shadow-[0_16px_40px_rgba(0,0,0,0.95)] text-xs font-sans select-none"
        style={{
          left: `${left}px`,
          top: `${top}px`,
          width: `${cardWidth}px`,
        }}
      >
        <div className="font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-1.5 flex items-center justify-between gap-2">
          <span className="text-blue-600 dark:text-blue-400 font-extrabold truncate">{hoveredPoint.sessionName}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded font-semibold shrink-0">
            {hoveredPoint.fullDate}
          </span>
        </div>
        <div className="space-y-2 pt-2">
          {/* Check 1 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: c1Color }}
              />
              <span className="font-extrabold truncate" style={{ color: c1Color }}>
                {c1Label}:
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`font-mono font-black ${hoveredPoint.check1 > 0 ? getScoreTierColor(hoveredPoint.check1) : 'text-slate-400 dark:text-slate-500'}`}>
                {hoveredPoint.check1 > 0 ? format1Dec(hoveredPoint.check1) : '-'}
              </span>
              {hoveredPoint.check1 > 0 && hoveredPoint.fittedC1 !== null && (
                <span className={`text-[10px] font-mono font-semibold ${getScoreTierColor(hoveredPoint.fittedC1)} opacity-75`}>
                  ({format1Dec(hoveredPoint.fittedC1)})
                </span>
              )}
            </div>
          </div>

          {/* Check 2 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: c2Color }}
              />
              <span className="font-extrabold truncate" style={{ color: c2Color }}>
                {c2Label}:
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`font-mono font-black ${hoveredPoint.check2 > 0 ? getScoreTierColor(hoveredPoint.check2) : 'text-slate-400 dark:text-slate-500'}`}>
                {hoveredPoint.check2 > 0 ? format1Dec(hoveredPoint.check2) : '-'}
              </span>
              {hoveredPoint.check2 > 0 && hoveredPoint.fittedC2 !== null && (
                <span className={`text-[10px] font-mono font-semibold ${getScoreTierColor(hoveredPoint.fittedC2)} opacity-75`}>
                  ({format1Dec(hoveredPoint.fittedC2)})
                </span>
              )}
            </div>
          </div>

          {/* Homework */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: hwColor }}
              />
              <span className="font-extrabold truncate" style={{ color: hwColor }}>
                {hwLabel}:
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`font-mono font-black ${hoveredPoint.homework > 0 ? getScoreTierColor(hoveredPoint.homework) : 'text-slate-400 dark:text-slate-500'}`}>
                {hoveredPoint.homework > 0 ? format1Dec(hoveredPoint.homework) : '-'}
              </span>
              {hoveredPoint.homework > 0 && hoveredPoint.fittedHw !== null && (
                <span className={`text-[10px] font-mono font-semibold ${getScoreTierColor(hoveredPoint.fittedHw)} opacity-75`}>
                  ({format1Dec(hoveredPoint.fittedHw)})
                </span>
              )}
            </div>
          </div>

          {/* Average */}
          <div className="border-t border-slate-200 dark:border-white/10 pt-1.5 flex items-center justify-between gap-2">
            <span className="text-slate-700 dark:text-slate-300 font-extrabold">Điểm TB Buổi:</span>
            <span className={`font-mono font-black text-sm shrink-0 ${avgVal > 0 ? getScoreTierColor(avgVal) : 'text-slate-400 dark:text-slate-500'}`}>
              {avgVal > 0 ? format1Dec(avgVal) : '-'}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
