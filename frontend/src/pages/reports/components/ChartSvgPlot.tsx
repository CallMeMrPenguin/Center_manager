import React, { useId } from 'react';
import { ChartSessionItem, HoveredChartPoint } from '../types';
import { format1Dec } from '../../../utils';
import { useTheme } from '../../../context/ThemeContext';

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
  gradeTypesList?: any[];
}

export const ChartSvgPlot: React.FC<ChartSvgPlotProps> = React.memo(({
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
  gradeTypesList,
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '_');
  const clipId = `chart_plot_clip_${uid}`;
  const curtainClipId = `chart_curtain_${uid}`;
  const gradC1 = `area_grad_c1_${uid}`;
  const gradC2 = `area_grad_c2_${uid}`;
  const gradHw = `area_grad_hw_${uid}`;
  const { isDark } = useTheme();
  const animKey = `${selectedStudentId || selectedClassId || 'all'}-${timeView}-${sessionChartData.length}`;

  const c1Item = gradeTypesList?.find((g: any) => g.id === 'check_1');
  const c2Item = gradeTypesList?.find((g: any) => g.id === 'check_2');
  const hwItem = gradeTypesList?.find((g: any) => g.id === 'homework');

  const c1Color = c1Item?.color || '#3b82f6';
  const c2Color = c2Item?.color || '#a855f7';
  const hwColor = hwItem?.color || '#10b981';

  const c1Label = c1Item?.label || 'Từ Vựng';
  const c2Label = c2Item?.label || 'Ngữ Pháp';
  const hwLabel = hwItem?.label || 'BTVN';

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-[750px] overflow-visible">
      <defs>
        <clipPath id={clipId}>
          <rect x={paddingLeft - 10} y={paddingTop - 20} width={plotAreaWidth + paddingRight + 40} height={plotAreaHeight + 40} />
        </clipPath>

        <clipPath id={curtainClipId}>
          <rect
            key={`curtain-${animKey}`}
            x={paddingLeft - 10}
            y={paddingTop - 20}
            width={plotAreaWidth + paddingRight + 40}
            height={plotAreaHeight + 40}
            className="animate-curtain-reveal"
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'left center',
            }}
          />
        </clipPath>

        <linearGradient id={gradC1} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1Color} stopOpacity="0.45" />
          <stop offset="35%" stopColor={c1Color} stopOpacity="0.20" />
          <stop offset="75%" stopColor={c1Color} stopOpacity="0.05" />
          <stop offset="100%" stopColor={c1Color} stopOpacity="0.0" />
        </linearGradient>

        <linearGradient id={gradC2} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c2Color} stopOpacity="0.45" />
          <stop offset="35%" stopColor={c2Color} stopOpacity="0.20" />
          <stop offset="75%" stopColor={c2Color} stopOpacity="0.05" />
          <stop offset="100%" stopColor={c2Color} stopOpacity="0.0" />
        </linearGradient>

        <linearGradient id={gradHw} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hwColor} stopOpacity="0.45" />
          <stop offset="35%" stopColor={hwColor} stopOpacity="0.20" />
          <stop offset="75%" stopColor={hwColor} stopOpacity="0.05" />
          <stop offset="100%" stopColor={hwColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yBounds.ticks.map(val => {
        const y = getSvgY(val);
        if (y < paddingTop - 12 || y > chartHeight - paddingBottom + 12) return null;
        return (
          <g key={val}>
            <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke={isDark ? "#171e34" : "#e2e8f0"} strokeWidth="1" strokeDasharray={val === 7.5 ? "4 4" : "0"} />
            <text x={paddingLeft - 14} y={y + 4} fill={isDark ? "#64748b" : "#64748b"} fontSize="11" fontWeight="bold" textAnchor="end">{val.toFixed(1)}</text>
          </g>
        );
      })}

      {/* Benchmark Dashed Line (7.5) */}
      {getSvgY(7.5) >= paddingTop - 10 && getSvgY(7.5) <= chartHeight - paddingBottom + 10 && (
        <line x1={paddingLeft} y1={getSvgY(7.5)} x2={chartWidth - paddingRight} y2={getSvgY(7.5)} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.4" />
      )}

      {/* Clipped Plot Area */}
      <g clipPath={`url(#${clipId})`}>
        {(() => {
          const hasC1 = sessionChartData.some((d) => (d.check1 || 0) > 0);
          const hasC2 = sessionChartData.some((d) => (d.check2 || 0) > 0);
          const hasHw = sessionChartData.some((d) => (d.homework || 0) > 0);

          return (
            <>
              {/* Area Fills with Synchronized Smooth Curtain Reveal */}
              <g clipPath={`url(#${curtainClipId})`} className="pointer-events-none">
                {hasC1 && <path key={`area-c1-${animKey}`} d={makeAreaPath('check1')} fill={`url(#${gradC1})`} />}
                {hasC2 && <path key={`area-c2-${animKey}`} d={makeAreaPath('check2')} fill={`url(#${gradC2})`} />}
                {hasHw && <path key={`area-hw-${animKey}`} d={makeAreaPath('homework')} fill={`url(#${gradHw})`} />}
              </g>

              {/* Check 1 Bezier */}
              {hasC1 && (
                <path key={`c1-${animKey}`} d={makeBezierPath('check1')} fill="none" stroke={c1Color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength={1000} className="animate-path-draw" />
              )}

              {/* Check 2 Bezier */}
              {hasC2 && (
                <path key={`c2-${animKey}`} d={makeBezierPath('check2')} fill="none" stroke={c2Color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength={1000} className="animate-path-draw" />
              )}

              {/* Homework Bezier */}
              {hasHw && (
                <path key={`hw-${animKey}`} d={makeBezierPath('homework')} fill="none" stroke={hwColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength={1000} className="animate-path-draw" />
              )}

              {/* Forecast projections */}
              {sessionChartData.length > 0 && (() => {
                const lastIdx = sessionChartData.length - 1;
                const lastX = getSvgX(lastIdx, sessionChartData.length);
                const forecastX = lastX + 45 * zoomLevel;

                const getLastValidPoint = (key: 'check1' | 'check2' | 'homework') => {
                  for (let i = sessionChartData.length - 1; i >= 0; i--) {
                    const val = sessionChartData[i][key];
                    if (val !== undefined && val !== null && val > 0) {
                      return { val, x: getSvgX(i, sessionChartData.length), y: getSvgY(val) };
                    }
                  }
                  const defVal = sessionChartData[lastIdx]?.[key] || 0;
                  return { val: defVal, x: lastX, y: getSvgY(defVal) };
                };

                const preds: { id: string; label: string; score: number; startX: number; startY: number; color: string; textColor: string; rawY: number }[] = [];

                if (hasC1 && engine && (engine.pred_c1 || 0) > 0) {
                  const pt = getLastValidPoint('check1');
                  preds.push({ id: 'c1', label: c1Label, score: engine.pred_c1, startX: pt.x, startY: pt.y, color: c1Color, textColor: c1Color, rawY: getSvgY(engine.pred_c1) });
                }
                if (hasC2 && engine && (engine.pred_c2 || 0) > 0) {
                  const pt = getLastValidPoint('check2');
                  preds.push({ id: 'c2', label: c2Label, score: engine.pred_c2, startX: pt.x, startY: pt.y, color: c2Color, textColor: c2Color, rawY: getSvgY(engine.pred_c2) });
                }
                if (hasHw && engine && (engine.pred_hw || 0) > 0) {
                  const pt = getLastValidPoint('homework');
                  preds.push({ id: 'hw', label: hwLabel, score: engine.pred_hw, startX: pt.x, startY: pt.y, color: hwColor, textColor: hwColor, rawY: getSvgY(engine.pred_hw) });
                }

                if (preds.length === 0) return null;

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
                  <g key={`forecast-${selectedStudentId || selectedClassId || 'all'}-${timeView}-${sessionChartData.length}`} className="animate-point-pop" style={{ animationDelay: '1.9s' }}>
                    {preds.map(p => (
                      <g key={p.id}>
                        <line x1={p.startX} y1={p.startY} x2={forecastX} y2={p.rawY} stroke={p.color} strokeWidth="2.5" strokeDasharray="4 4" strokeLinecap="round" />
                        <circle cx={forecastX} cy={p.rawY} r="6" fill={p.color} stroke="#ffffff" strokeWidth="2" />
                        <text x={forecastX + 9} y={(adjustedYs[p.id] ?? p.rawY) + 4} fill={p.textColor} fontSize="11" fontWeight="900" className="font-mono">{format1Dec(p.score)}</text>
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
                  const pointDelay = (0.6 + (i / Math.max(1, sessionChartData.length - 1)) * 1.2).toFixed(2);

                  const validYs = [];
                  if (d.check1 > 0) validYs.push(y1);
                  if (d.check2 > 0) validYs.push(y2);
                  if (d.homework > 0) validYs.push(yHw);
                  const highestY = validYs.length > 0 ? Math.min(...validYs) : paddingTop + plotAreaHeight / 2;

                  const handleHover = (e: React.MouseEvent<SVGGElement>) => {
                    const svg = e.currentTarget.ownerSVGElement;
                    const svgRect = svg?.getBoundingClientRect();
                    const relY = svgRect ? (e.clientY - svgRect.top) : highestY;

                    setHoveredPoint({
                      index: i,
                      sessionName: d.sessionName,
                      fullDate: d.fullDate,
                      check1: d.check1,
                      check2: d.check2,
                      homework: d.homework,
                      x,
                      y: relY,
                      fittedC1: fittedLookup.c1[i] ?? null,
                      fittedC2: fittedLookup.c2[i] ?? null,
                      fittedHw: fittedLookup.hw[i] ?? null,
                      predModel: 'EMA',
                    });
                  };

                  return (
                    <g
                      key={`pt-${selectedStudentId || selectedClassId || 'all'}-${timeView}-${i}`}
                      className="cursor-pointer group"
                      onMouseEnter={handleHover}
                      onMouseMove={handleHover}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      <rect x={x - 25} y={paddingTop} width={50} height={plotAreaHeight} fill="transparent" />
                      <line x1={x} y1={paddingTop} x2={x} y2={chartHeight - paddingBottom} stroke="#2563eb" strokeWidth="1.5" strokeDasharray="3 3" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      {d.check1 > 0 && (
                        <g className="animate-point-pop" style={{ animationDelay: `${pointDelay}s` }}>
                          <circle cx={x} cy={y1} r="7" fill={c1Color} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-150 group-hover:scale-125" />
                          <circle cx={x} cy={y1} r="3.5" fill="#ffffff" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-150 group-hover:scale-125" />
                        </g>
                      )}
                      {d.check2 > 0 && (
                        <g className="animate-point-pop" style={{ animationDelay: `${pointDelay}s` }}>
                          <circle cx={x} cy={y2} r="7" fill={c2Color} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-150 group-hover:scale-125" />
                          <circle cx={x} cy={y2} r="3.5" fill="#ffffff" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-150 group-hover:scale-125" />
                        </g>
                      )}
                      {d.homework > 0 && (
                        <g className="animate-point-pop" style={{ animationDelay: `${pointDelay}s` }}>
                          <circle cx={x} cy={yHw} r="7" fill={hwColor} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-150 group-hover:scale-125" />
                          <circle cx={x} cy={yHw} r="3.5" fill="#ffffff" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-150 group-hover:scale-125" />
                        </g>
                      )}
                      {i === sessionChartData.length - 1 && (() => {
                        const lastLabels: { id: string; val: number; rawY: number; color: string }[] = [];
                        if (d.check1 > 0) lastLabels.push({ id: 'c1', val: d.check1, rawY: y1, color: c1Color });
                        if (d.check2 > 0) lastLabels.push({ id: 'c2', val: d.check2, rawY: y2, color: c2Color });
                        if (d.homework > 0) lastLabels.push({ id: 'hw', val: d.homework, rawY: yHw, color: hwColor });

                        const sortedLabels = [...lastLabels].sort((a, b) => a.rawY - b.rawY);
                        const adjustedLastYs: Record<string, number> = {};
                        let prevLastY = -999;
                        sortedLabels.forEach((item) => {
                          let curY = item.rawY;
                          if (curY - prevLastY < 16) curY = prevLastY + 16;
                          adjustedLastYs[item.id] = curY;
                          prevLastY = curY;
                        });

                        return (
                          <g className="animate-point-pop" style={{ animationDelay: `${pointDelay}s` }}>
                            {lastLabels.map((lbl) => (
                              <text
                                key={lbl.id}
                                x={x + 14}
                                y={(adjustedLastYs[lbl.id] ?? lbl.rawY) + 4}
                                fill={lbl.color}
                                fontSize="12"
                                fontWeight="900"
                                className="font-mono"
                              >
                                {format1Dec(lbl.val)}
                              </text>
                            ))}
                          </g>
                        );
                      })()}
                    </g>
                  );
                })}
              </g>
            </>
          );
        })()}
      </g>

      {/* X-axis labels with dynamic interval stepping to prevent overlap on small screens */}
      {(() => {
        const total = sessionChartData.length;
        if (total === 0) return null;
        const availableWidth = chartWidth - paddingLeft - paddingRight;
        const minGap = 55; // minimum px between adjacent session labels
        const maxLabels = Math.max(2, Math.floor(availableWidth / minGap));
        const step = Math.max(1, Math.ceil(total / maxLabels));

        return sessionChartData.map((d, i) => {
          const x = getSvgX(i, total);
          if (x < paddingLeft - 20 || x > chartWidth - paddingRight + 20) return null;

          // Always show first and last. For intermediate labels, show if i % step === 0
          // and not too close to the last label.
          const isFirst = i === 0;
          const isLast = i === total - 1;
          const isStepped = i % step === 0;

          // Don't render intermediate label if it's within minGap of last label
          const distToLast = Math.abs(getSvgX(total - 1, total) - x);
          if (!isFirst && !isLast) {
            if (!isStepped || distToLast < minGap * 0.85) return null;
          }

          return (
            <text
              key={`xlabel-${selectedStudentId || selectedClassId || 'all'}-${timeView}-${i}`}
              x={x}
              y={chartHeight - 12}
              fill={isDark ? "#94a3b8" : "#475569"}
              fontSize="11"
              fontWeight="700"
              textAnchor="middle"
            >
              {d.sessionName}
            </text>
          );
        });
      })()}
    </svg>
  );
});
