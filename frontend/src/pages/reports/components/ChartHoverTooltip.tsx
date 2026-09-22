import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HoveredChartPoint } from '../types';
import { format1Dec, trunc1Dec } from '../../../utils';

interface ChartHoverTooltipProps {
  hoveredPoint: HoveredChartPoint | null;
  chartWidth: number;
  gradeTypesList?: any[];
}

export const ChartHoverTooltip: React.FC<ChartHoverTooltipProps> = ({
  hoveredPoint,
  chartWidth,
  gradeTypesList,
}) => {
  if (!hoveredPoint) return null;

  const pointX = hoveredPoint.x;
  const pointY = hoveredPoint.y;
  const cardWidth = 220;
  const cardHeight = 150;

  let left = pointX;
  let top = pointY - 18;
  let transform = 'translate(-50%, -100%)';

  if (pointY < cardHeight + 20) {
    top = pointY + 18;
    transform = 'translate(-50%, 0)';
  }

  if (pointX < cardWidth / 2 + 16) {
    left = 16;
    transform = transform.replace('-50%', '0%');
  } else if (pointX > chartWidth - (cardWidth / 2 + 16)) {
    left = chartWidth - 16;
    transform = transform.replace('-50%', '-100%');
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
        initial={{ opacity: 0, scale: 0.94, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 4 }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
        className="absolute z-30 pointer-events-none bg-white dark:bg-[#141417] border border-slate-200 dark:border-[#27272a] p-3.5 rounded-2xl shadow-xl dark:shadow-[0_16px_40px_rgba(0,0,0,0.95)] text-xs font-sans min-w-[215px] select-none"
        style={{
          left: `${left}px`,
          top: `${top}px`,
          transform,
        }}
      >
        <div className="font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-1.5 flex items-center justify-between gap-4">
          <span className="text-blue-600 dark:text-blue-400 font-extrabold">{hoveredPoint.sessionName}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded font-semibold">
            {hoveredPoint.fullDate}
          </span>
        </div>
        <div className="space-y-2 pt-2">
          {/* Check 1 */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: c1Color }}
              />
              <span className="font-extrabold" style={{ color: c1Color }}>
                {c1Label}:
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-black text-slate-900 dark:text-white">
                {hoveredPoint.check1 > 0 ? format1Dec(hoveredPoint.check1) : '-'}
              </span>
              {hoveredPoint.check1 > 0 && hoveredPoint.fittedC1 !== null && (
                <span className="text-[10px] font-mono text-slate-400">
                  ({format1Dec(hoveredPoint.fittedC1)})
                </span>
              )}
            </div>
          </div>

          {/* Check 2 */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: c2Color }}
              />
              <span className="font-extrabold" style={{ color: c2Color }}>
                {c2Label}:
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-black text-slate-900 dark:text-white">
                {hoveredPoint.check2 > 0 ? format1Dec(hoveredPoint.check2) : '-'}
              </span>
              {hoveredPoint.check2 > 0 && hoveredPoint.fittedC2 !== null && (
                <span className="text-[10px] font-mono text-slate-400">
                  ({format1Dec(hoveredPoint.fittedC2)})
                </span>
              )}
            </div>
          </div>

          {/* Homework */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: hwColor }}
              />
              <span className="font-extrabold" style={{ color: hwColor }}>
                {hwLabel}:
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-black text-slate-900 dark:text-white">
                {hoveredPoint.homework > 0 ? format1Dec(hoveredPoint.homework) : '-'}
              </span>
              {hoveredPoint.homework > 0 && hoveredPoint.fittedHw !== null && (
                <span className="text-[10px] font-mono text-slate-400">
                  ({format1Dec(hoveredPoint.fittedHw)})
                </span>
              )}
            </div>
          </div>

          {/* Average */}
          <div className="border-t border-slate-200 dark:border-white/10 pt-1.5 flex items-center justify-between gap-4">
            <span className="text-slate-700 dark:text-slate-300 font-extrabold">Điểm TB Buổi:</span>
            <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
              {avgVal > 0 ? format1Dec(avgVal) : '-'}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
