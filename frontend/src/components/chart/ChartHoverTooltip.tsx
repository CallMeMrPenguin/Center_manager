import React from 'react';
import { format1Dec, trunc1Dec } from '../../utils';

export interface ChartDataPoint {
  x: number;
  y: number;
  sessionName: string;
  fullDate: string;
  check1?: number;
  check2?: number;
  homework?: number;
  average?: number;
}

export interface ChartHoverTooltipProps {
  hoveredPoint: ChartDataPoint | null;
  chartWidth: number;
  gradeLabels?: {
    check1?: string;
    check2?: string;
    homework?: string;
  };
}

export const ChartHoverTooltip: React.FC<ChartHoverTooltipProps> = ({
  hoveredPoint,
  chartWidth,
  gradeLabels = { check1: 'Từ Vựng', check2: 'Ngữ Pháp', homework: 'BTVN' },
}) => {
  if (!hoveredPoint) return null;

  const pointX = hoveredPoint.x;
  const pointY = hoveredPoint.y;
  const cardWidth = 230;

  const isNearRightEdge = pointX + cardWidth + 24 > chartWidth;
  const leftPosition = isNearRightEdge ? Math.max(12, pointX - cardWidth - 16) : pointX + 16;
  const topPosition = Math.max(12, pointY - 60);

  return (
    <div
      className="absolute z-30 pointer-events-none bg-white border border-slate-300 rounded-xl p-3 shadow-md w-[220px] transition-all duration-75 text-xs select-none"
      style={{ left: leftPosition, top: topPosition }}
    >
      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
        <span className="font-bold text-blue-600">{hoveredPoint.sessionName}</span>
        <span className="text-[11px] text-slate-500 font-mono">{hoveredPoint.fullDate}</span>
      </div>

      <div className="space-y-1 font-mono text-[11px]">
        {hoveredPoint.check1 !== undefined && hoveredPoint.check1 > 0 && (
          <div className="flex justify-between items-center text-slate-700">
            <span>{gradeLabels.check1}:</span>
            <span className="font-bold text-blue-600">{format1Dec(hoveredPoint.check1)}</span>
          </div>
        )}
        {hoveredPoint.check2 !== undefined && hoveredPoint.check2 > 0 && (
          <div className="flex justify-between items-center text-slate-700">
            <span>{gradeLabels.check2}:</span>
            <span className="font-bold text-cyan-600">{format1Dec(hoveredPoint.check2)}</span>
          </div>
        )}
        {hoveredPoint.homework !== undefined && hoveredPoint.homework > 0 && (
          <div className="flex justify-between items-center text-slate-700">
            <span>{gradeLabels.homework}:</span>
            <span className="font-bold text-emerald-600">{format1Dec(hoveredPoint.homework)}</span>
          </div>
        )}
        {hoveredPoint.average !== undefined && (
          <div className="flex justify-between items-center pt-1 mt-1 border-t border-slate-200 font-extrabold text-slate-900">
            <span>Trung bình:</span>
            <span className="text-amber-600">{trunc1Dec(hoveredPoint.average)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartHoverTooltip;
