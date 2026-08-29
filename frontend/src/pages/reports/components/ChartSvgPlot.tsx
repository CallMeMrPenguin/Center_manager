import React, { useId } from 'react';
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
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '_');
  const clipId = `chart_plot_clip_${uid}`;
  const curtainClipId = `chart_curtain_${uid}`;
  const gradBlue = `area_grad_blue_${uid}`;
  const gradPurple = `area_grad_purple_${uid}`;
  const gradEmerald = `area_grad_emerald_${uid}`;
  const animKey = `${selectedStudentId || selectedClassId || 'all'}-${timeView}-${sessionChartData.length}`;

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

        <linearGradient id={gradBlue} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
          <stop offset="35%" stopColor="#3b82f6" stopOpacity="0.20" />
          <stop offset="75%" stopColor="#2563eb" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.0" />
        </linearGradient>

        <linearGradient id={gradPurple} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.45" />
          <stop offset="35%" stopColor="#a855f7" stopOpacity="0.20" />
          <stop offset="75%" stopColor="#7e22ce" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#6b21a8" stopOpacity="0.0" />
        </linearGradient>

        <linearGradient id={gradEmerald} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
          <stop offset="35%" stopColor="#10b981" stopOpacity="0.20" />
          <stop offset="75%" stopColor="#047857" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#065f46" stopOpacity="0.0" />
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
      <g clipPath={`url(#${clipId})`}>
        {(() => {
          const hasC1 = sessionChartData.some((d) => (d.check1 || 0) > 0);
          const hasC2 = sessionChartData.some((d) => (d.check2 || 0) > 0);
          const hasHw = sessionChartData.some((d) => (d.homework || 0) > 0);

          return (
            <>
              {/* Area Fills with Synchronized Smooth Curtain Reveal */}
              <g clipPath={`url(#${curtainClipId})`} className="pointer-events-none">
                {hasC1 && <path key={`area-c1-${animKey}`} d={makeAreaPath('check1')} fill={`url(#${gradBlue})`} />}
                {hasC2 && <path key={`area-c2-${animKey}`} d={makeAreaPath('check2')} fill={`url(#${gradPurple})`} />}
                {hasHw && <path key={`area-hw-${animKey}`} d={makeAreaPath('homework')} fill={`url(#${gradEmerald})`} />}
              </g>

              {/* Check 1 Bezier */}
              {hasC1 && (
                <>
                  <path key={`c1-glow-${animKey}`} d={makeBezierPath('check1')} fill="none" stroke="#3b82f6" strokeWidth="9" strokeOpacity="0.25" strokeLinecap="round" strokeLinejoin="round" pathLength={1000} className="animate-path-draw" />
                  <path key={`c1-${animKey}`} d={makeBezierPath('check1')} fill="none" stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1000} className="animate-path-draw" />
                </>
              )}

              {/* Check 2 Bezier */}
              {hasC2 && (
                <>
                  <path key={`c2-glow-${animKey}`} d={makeBezierPath('check2')} fill="none" stroke="#a855f7" strokeWidth="9" strokeOpacity="0.25" strokeLinecap="round" strokeLinejoin="round" pathLength={1000} className="animate-path-draw" />
                  <path key={`c2-${animKey}`} d={makeBezierPath('check2')} fill="none" stroke="#a855f7" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1000} className="animate-path-draw" />
                </>
              )}

              {/* Homework Bezier */}
              {hasHw && (
                <>
                  <path key={`hw-glow-${animKey}`} d={makeBezierPath('homework')} fill="none" stroke="#10b981" strokeWidth="9" strokeOpacity="0.25" strokeLinecap="round" strokeLinejoin="round" pathLength={1000} className="animate-path-draw" />
                  <path key={`hw-${animKey}`} d={makeBezierPath('homework')} fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1000} className="animate-path-draw" />
                </>
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
                  preds.push({ id: 'c1', label: 'Từ Vựng', score: engine.pred_c1, startX: pt.x, startY: pt.y, color: '#3b82f6', textColor: '#60a5fa', rawY: getSvgY(engine.pred_c1) });
                }
                if (hasC2 && engine && (engine.pred_c2 || 0) > 0) {
                  const pt = getLastValidPoint('check2');
                  preds.push({ id: 'c2', label: 'Ngữ Pháp', score: engine.pred_c2, startX: pt.x, startY: pt.y, color: '#a855f7', textColor: '#c084fc', rawY: getSvgY(engine.pred_c2) });
                }
                if (hasHw && engine && (engine.pred_hw || 0) > 0) {
                  const pt = getLastValidPoint('homework');
                  preds.push({ id: 'hw', label: 'BTVN', score: engine.pred_hw, startX: pt.x, startY: pt.y, color: '#10b981', textColor: '#34d399', rawY: getSvgY(engine.pred_hw) });
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
                      <line x1={x} y1={paddingTop} x2={x} y2={chartHeight - paddingBottom} stroke="#5c36f5" strokeWidth="1.5" strokeDasharray="3 3" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      {d.check1 > 0 && (
                        <g className="animate-point-pop" style={{ animationDelay: `${pointDelay}s` }}>
                          <circle cx={x} cy={y1} r="7" fill="#3b82f6" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-150 group-hover:scale-125" />
                          <circle cx={x} cy={y1} r="3.5" fill="#ffffff" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-150 group-hover:scale-125" />
                        </g>
                      )}
                      {d.check2 > 0 && (
                        <g className="animate-point-pop" style={{ animationDelay: `${pointDelay}s` }}>
                          <circle cx={x} cy={y2} r="7" fill="#a855f7" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-150 group-hover:scale-125" />
                          <circle cx={x} cy={y2} r="3.5" fill="#ffffff" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-150 group-hover:scale-125" />
                        </g>
                      )}
                      {d.homework > 0 && (
                        <g className="animate-point-pop" style={{ animationDelay: `${pointDelay}s` }}>
                          <circle cx={x} cy={yHw} r="7" fill="#10b981" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-150 group-hover:scale-125" />
                          <circle cx={x} cy={yHw} r="3.5" fill="#ffffff" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-150 group-hover:scale-125" />
                        </g>
                      )}
                      {i === sessionChartData.length - 1 && (() => {
                        const lastLabels: { id: string; val: number; rawY: number; color: string }[] = [];
                        if (d.check1 > 0) lastLabels.push({ id: 'c1', val: d.check1, rawY: y1, color: '#3b82f6' });
                        if (d.check2 > 0) lastLabels.push({ id: 'c2', val: d.check2, rawY: y2, color: '#a855f7' });
                        if (d.homework > 0) lastLabels.push({ id: 'hw', val: d.homework, rawY: yHw, color: '#10b981' });

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
});
