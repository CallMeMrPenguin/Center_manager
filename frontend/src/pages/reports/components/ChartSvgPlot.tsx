import React from 'react';
import { ChartSessionItem, HoveredChartPoint } from '../types';
import { format1Dec } from '../../../utils';

interface ChartSvgPlotProps {
  chartWidth: number;
  chartHeight: number;
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
  plotAreaWidth: number;
  plotAreaHeight: number;
  zoomLevel: number;
  selectedStudentId: string;
  selectedClassId: string;
  timeView: string;
  yBounds: { minY: number; maxY: number; ticks: number[] };
  getSvgX: (index: number, total: number) => number;
  getSvgY: (val: number) => number;
  makeBezierPath: (key: 'check1' | 'check2' | 'homework') => string;
  makeAreaPath: (key: 'check1' | 'check2' | 'homework') => string;
  sessionChartData: ChartSessionItem[];
  engine: any;
  fittedLookup: { c1: number[]; c2: number[]; hw: number[] };
  hoveredPoint: HoveredChartPoint | null;
  setHoveredPoint: (pt: HoveredChartPoint | null) => void;
}

export const ChartSvgPlot: React.FC<ChartSvgPlotProps> = ({
  chartWidth,
  chartHeight,
  paddingLeft,
  paddingRight,
  paddingTop,
  paddingBottom,
  plotAreaWidth,
  plotAreaHeight,
  zoomLevel,
  selectedStudentId,
  selectedClassId,
  timeView,
  yBounds,
  getSvgX,
  getSvgY,
  makeBezierPath,
  makeAreaPath,
  sessionChartData,
  engine,
  fittedLookup,
  hoveredPoint,
  setHoveredPoint,
}) => {
  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-[750px] overflow-visible">
      <defs>
        <clipPath id="chart-plot-clip">
          <rect x={paddingLeft - 10} y={paddingTop - 20} width={plotAreaWidth + paddingRight + 40} height={plotAreaHeight + 40} />
        </clipPath>
        <clipPath id="chart-curtain-clip">
          <rect
            key={`curtain-${selectedStudentId || selectedClassId || 'all'}-${timeView}`}
            x={paddingLeft - 10}
            y={paddingTop - 20}
            width={plotAreaWidth + paddingRight + 40}
            height={plotAreaHeight + 40}
            className="animate-curtain-reveal"
          />
        </clipPath>

        <linearGradient id="area-gradient-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
          <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
        </linearGradient>

        <linearGradient id="area-gradient-purple" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
          <stop offset="70%" stopColor="#a855f7" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
        </linearGradient>

        <linearGradient id="area-gradient-emerald" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
          <stop offset="70%" stopColor="#10b981" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yBounds.ticks.map(val => {
        const y = getSvgY(val);
        if (y < paddingTop - 12 || y > chartHeight - paddingBottom + 12) return null;
        return (
          <g key={val}>
            <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="#171e34" strokeWidth="1" strokeDasharray={val === 7.5 ? "4 4" : "0"} />
            <text x={paddingLeft - 14} y={y + 4} fill="#64748b" fontSize="11" fontWeight="bold" textAnchor="end">{val.toFixed(1)}</text>
          </g>
        );
      })}

      {/* Benchmark Dashed Line (7.5) */}
      {getSvgY(7.5) >= paddingTop - 10 && getSvgY(7.5) <= chartHeight - paddingBottom + 10 && (
        <line x1={paddingLeft} y1={getSvgY(7.5)} x2={chartWidth - paddingRight} y2={getSvgY(7.5)} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.4" />
      )}

      {/* Clipped Plot Area */}
      <g clipPath="url(#chart-plot-clip)">
        {/* Area Fills */}
        <g clipPath="url(#chart-curtain-clip)">
          <path d={makeAreaPath('check1')} fill="url(#area-gradient-blue)" />
          <path d={makeAreaPath('check2')} fill="url(#area-gradient-purple)" />
          <path d={makeAreaPath('homework')} fill="url(#area-gradient-emerald)" />
        </g>

        {/* Check 1 Bezier */}
        <path key={`c1-glow-${selectedStudentId || selectedClassId || 'all'}-${timeView}`} d={makeBezierPath('check1')} fill="none" stroke="#3b82f6" strokeWidth="9" strokeOpacity="0.25" strokeLinecap="round" strokeLinejoin="round" pathLength={1000} className="animate-path-draw" />
        <path key={`c1-${selectedStudentId || selectedClassId || 'all'}-${timeView}`} d={makeBezierPath('check1')} fill="none" stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1000} className="animate-path-draw" />

        {/* Check 2 Bezier */}
        <path key={`c2-glow-${selectedStudentId || selectedClassId || 'all'}-${timeView}`} d={makeBezierPath('check2')} fill="none" stroke="#a855f7" strokeWidth="9" strokeOpacity="0.25" strokeLinecap="round" strokeLinejoin="round" pathLength={1000} className="animate-path-draw" />
        <path key={`c2-${selectedStudentId || selectedClassId || 'all'}-${timeView}`} d={makeBezierPath('check2')} fill="none" stroke="#a855f7" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1000} className="animate-path-draw" />

        {/* Homework Bezier */}
        <path key={`hw-glow-${selectedStudentId || selectedClassId || 'all'}-${timeView}`} d={makeBezierPath('homework')} fill="none" stroke="#10b981" strokeWidth="9" strokeOpacity="0.25" strokeLinecap="round" strokeLinejoin="round" pathLength={1000} className="animate-path-draw" />
        <path key={`hw-${selectedStudentId || selectedClassId || 'all'}-${timeView}`} d={makeBezierPath('homework')} fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1000} className="animate-path-draw" />

        {/* Forecast projections */}
        {sessionChartData.length > 0 && (() => {
          const lastIdx = sessionChartData.length - 1;
          const lastX = getSvgX(lastIdx, sessionChartData.length);
          const forecastX = lastX + 45 * zoomLevel;
          const preds = [
            { id: 'c1', label: 'Từ Vựng', score: engine.pred_c1, lastVal: sessionChartData[lastIdx].check1, color: '#3b82f6', textColor: '#60a5fa', rawY: getSvgY(engine.pred_c1) },
            { id: 'c2', label: 'Ngữ Pháp', score: engine.pred_c2, lastVal: sessionChartData[lastIdx].check2, color: '#a855f7', textColor: '#c084fc', rawY: getSvgY(engine.pred_c2) },
            { id: 'hw', label: 'Homework', score: engine.pred_hw, lastVal: sessionChartData[lastIdx].homework, color: '#10b981', textColor: '#34d399', rawY: getSvgY(engine.pred_hw) },
          ];
          const sorted = [...preds].sort((a, b) => a.rawY - b.rawY);
          const adjustedYs: Record<string, number> = {};
          let prevY = -999;
          sorted.forEach(p => {
            let curY = p.rawY;
            if (curY - prevY < 18) curY = prevY + 18;
            adjustedYs[p.id] = curY;
            prevY = curY;
          });

          return (
            <g key={`forecast-${selectedStudentId || selectedClassId || 'all'}-${timeView}-${sessionChartData.length}`} className="animate-point-pop" style={{ animationDelay: '2.10s' }}>
              {preds.map(p => (
                <g key={p.id}>
                  <line x1={lastX} y1={getSvgY(p.lastVal)} x2={forecastX} y2={p.rawY} stroke={p.color} strokeWidth="2.5" strokeDasharray="4 4" strokeLinecap="round" />
                  <circle cx={forecastX} cy={p.rawY} r="6" fill={p.color} stroke="#ffffff" strokeWidth="2" />
                  <text x={forecastX + 9} y={(adjustedYs[p.id] ?? p.rawY) + 4} fill={p.textColor} fontSize="11" fontWeight="900" className="font-mono drop-shadow">{format1Dec(p.score)}</text>
                </g>
              ))}
            </g>
          );
        })()}

        {/* Hover points */}
        <g key={`chart-points-${selectedStudentId || selectedClassId || 'all'}-${timeView}-${sessionChartData.length}`}>
          {sessionChartData.map((d, i) => {
            const x = getSvgX(i, sessionChartData.length);
            const y1 = getSvgY(d.check1);
            const y2 = getSvgY(d.check2);
            const yHw = getSvgY(d.homework);
            const pointDelay = (0.7 + (i / Math.max(1, sessionChartData.length - 1)) * 1.35).toFixed(2);

            return (
              <g
                key={`pt-${selectedStudentId || selectedClassId || 'all'}-${timeView}-${i}`}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredPoint({
                  index: i,
                  sessionName: d.sessionName,
                  fullDate: d.fullDate,
                  check1: d.check1,
                  check2: d.check2,
                  homework: d.homework,
                  x,
                  fittedC1: fittedLookup.c1[i] ?? null,
                  fittedC2: fittedLookup.c2[i] ?? null,
                  fittedHw: fittedLookup.hw[i] ?? null,
                  predModel: 'EMA',
                })}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <rect x={x - 25} y={paddingTop} width={50} height={plotAreaHeight} fill="transparent" />
                <line x1={x} y1={paddingTop} x2={x} y2={chartHeight - paddingBottom} stroke="#5c36f5" strokeWidth="1.5" strokeDasharray="3 3" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                <g className="animate-point-pop" style={{ animationDelay: `${pointDelay}s` }}>
                  <circle cx={x} cy={y1} r="7" fill="#3b82f6" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-200 group-hover:scale-125" />
                  <circle cx={x} cy={y1} r="3.5" fill="#ffffff" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-200 group-hover:scale-125" />
                </g>
                <g className="animate-point-pop" style={{ animationDelay: `${pointDelay}s` }}>
                  <circle cx={x} cy={y2} r="7" fill="#a855f7" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-200 group-hover:scale-125" />
                  <circle cx={x} cy={y2} r="3.5" fill="#ffffff" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-200 group-hover:scale-125" />
                </g>
                <g className="animate-point-pop" style={{ animationDelay: `${pointDelay}s` }}>
                  <circle cx={x} cy={yHw} r="7" fill="#10b981" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-200 group-hover:scale-125" />
                  <circle cx={x} cy={yHw} r="3.5" fill="#ffffff" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-200 group-hover:scale-125" />
                </g>
                {i === sessionChartData.length - 1 && (
                  <g className="animate-point-pop" style={{ animationDelay: `${pointDelay}s` }}>
                    <text x={x + 14} y={y1 + 4} fill="#3b82f6" fontSize="12" fontWeight="900">{d.check1}</text>
                    <text x={x + 14} y={y2 + 4} fill="#a855f7" fontSize="12" fontWeight="900">{d.check2}</text>
                    <text x={x + 14} y={yHw + 4} fill="#10b981" fontSize="12" fontWeight="900">{d.homework}</text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </g>

      {/* X-axis labels */}
      {sessionChartData.map((d, i) => {
        const x = getSvgX(i, sessionChartData.length);
        if (x < paddingLeft - 20 || x > chartWidth - paddingRight + 20) return null;
        return (
          <text
            key={`xlabel-${selectedStudentId || selectedClassId || 'all'}-${timeView}-${i}`}
            x={x}
            y={chartHeight - 12}
            fill={hoveredPoint?.index === i ? "#ffffff" : "#94a3b8"}
            fontSize="11"
            fontWeight="extrabold"
            textAnchor="middle"
          >
            {d.sessionName}
          </text>
        );
      })}
    </svg>
  );
};
