import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChartControls } from './ChartControls';
import { ChartSvgPlot } from './ChartSvgPlot';
import { ChartSessionItem, HoveredChartPoint } from '../types';
import { format1Dec, trunc1Dec } from '../../../utils';

interface InteractiveChartProps {
  sessionChartData: ChartSessionItem[];
  engine: any;
  fittedLookup: { c1: number[]; c2: number[]; hw: number[] };
  selectedStudentId: string;
  selectedClassId: string;
  timeView: '1m' | '2m' | '3m' | 'all';
  setTimeView: (v: '1m' | '2m' | '3m' | 'all') => void;
  timePhases: any[];
  selectedPhaseId: string;
  setSelectedPhaseId: (id: string) => void;
  onOpenPhaseModal: () => void;
  isTestMode?: boolean;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  sessionChartData,
  engine,
  fittedLookup,
  selectedStudentId,
  selectedClassId,
  timeView,
  setTimeView,
  timePhases,
  selectedPhaseId,
  setSelectedPhaseId,
  onOpenPhaseModal,
  isTestMode,
}) => {
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<HoveredChartPoint | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [chartWidth, setChartWidth] = useState(1050);

  const chartHeight = 750;
  const paddingLeft = 60;
  const paddingRight = 100;
  const paddingTop = 45;
  const paddingBottom = 45;
  const plotAreaWidth = Math.max(100, chartWidth - paddingLeft - paddingRight);
  const plotAreaHeight = Math.max(100, chartHeight - paddingTop - paddingBottom);

  useEffect(() => {
    let animId: number;
    const updateDimensions = () => {
      if (chartWrapperRef.current) {
        const w = Math.max(600, Math.round(chartWrapperRef.current.clientWidth));
        setChartWidth(prev => Math.abs(prev - w) > 3 ? w : prev);
      }
    };
    updateDimensions();
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(updateDimensions);
    });
    if (chartWrapperRef.current) observer.observe(chartWrapperRef.current);
    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, []);

  const clampPanOffset = useCallback((x: number, y: number, currentZoom: number) => {
    if (currentZoom <= 1.0) return { x: 0, y: 0 };
    const maxPanX = (plotAreaWidth * (currentZoom - 1));
    const clampedX = Math.max(-maxPanX, Math.min(0, x));
    return { x: clampedX, y: 0 };
  }, [plotAreaWidth]);

  // Auto reset or re-clamp panOffset whenever zoomLevel changes
  useEffect(() => {
    if (zoomLevel <= 1.0) {
      setPanOffset({ x: 0, y: 0 });
    } else {
      setPanOffset(prev => clampPanOffset(prev.x, prev.y, zoomLevel));
    }
  }, [zoomLevel, clampPanOffset]);

  // Reset zoom & pan when timeView, selectedPhaseId, or sessionChartData changes
  useEffect(() => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  }, [timeView, selectedPhaseId, sessionChartData.length]);

  const yBounds = useMemo(() => {
    let min = 10, max = 0;
    sessionChartData.forEach(d => {
      [d.check1, d.check2, d.homework].forEach(v => {
        if (v > 0) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      });
    });
    if (min > max) { min = 0; max = 10; }
    const minY = Math.max(0, Math.floor(min) - 1);
    const maxY = Math.min(10, Math.ceil(max) + 1);
    const ticks: number[] = [];
    const step = (maxY - minY) <= 5 ? 1 : 2;
    for (let y = minY; y <= maxY; y += step) ticks.push(y);
    return { minY, maxY, ticks };
  }, [sessionChartData]);

  const getSvgX = useCallback((index: number, total: number) => {
    const currentPanX = zoomLevel > 1.0 ? panOffset.x : 0;
    if (total <= 1) return paddingLeft + plotAreaWidth / 2 + currentPanX;
    const baseSpacing = plotAreaWidth / (total - 1);
    const effectiveSpacing = baseSpacing * zoomLevel;
    const baseX = paddingLeft + index * effectiveSpacing;
    return baseX + currentPanX;
  }, [plotAreaWidth, zoomLevel, panOffset.x]);

  const getSvgY = useCallback((val: number) => {
    const { minY, maxY } = yBounds;
    if (maxY === minY) return paddingTop + plotAreaHeight / 2;
    const pct = (val - minY) / (maxY - minY);
    return paddingTop + (1 - pct) * plotAreaHeight;
  }, [yBounds, plotAreaHeight]);

  const makeBezierPath = useCallback((key: 'check1' | 'check2' | 'homework') => {
    const pts = sessionChartData.map((d, i) => ({
      x: getSvgX(i, sessionChartData.length),
      y: getSvgY(d[key]),
    }));
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 >= pts.length ? pts.length - 1 : i + 2];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }, [sessionChartData, getSvgX, getSvgY]);

  const makeAreaPath = useCallback((key: 'check1' | 'check2' | 'homework') => {
    const pts = sessionChartData.map((d, i) => ({
      x: getSvgX(i, sessionChartData.length),
      y: getSvgY(d[key]),
    }));
    if (pts.length === 0) return '';
    const linePath = makeBezierPath(key);
    const bottomY = chartHeight - paddingBottom;
    const firstX = pts[0].x;
    const lastX = pts[pts.length - 1].x;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [sessionChartData, getSvgX, getSvgY, makeBezierPath]);

  return (
    <div
      ref={chartWrapperRef}
      className="bg-[#0b0f19] border border-[#1b253b] p-6 rounded-2xl shadow-xl flex flex-col gap-6 relative select-none animate-cascade-2"
    >
      <ChartControls
        engine={engine}
        timePhases={timePhases}
        selectedPhaseId={selectedPhaseId}
        setSelectedPhaseId={setSelectedPhaseId}
        onOpenPhaseModal={onOpenPhaseModal}
        timeView={timeView}
        setTimeView={setTimeView}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        setPanOffset={setPanOffset}
        isTestMode={isTestMode}
      />

      {/* SVG Canvas Plot Area with Pan & Zoom Drag Handlers */}
      <div
        className={`relative overflow-hidden cursor-${isDragging ? 'grabbing' : zoomLevel > 1.0 ? 'grab' : 'default'} select-none rounded-xl bg-[#080b14]/50 border border-[#141b2e]`}
        onMouseDown={(e) => {
          if (zoomLevel > 1.0 && e.button === 0) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
          }
        }}
        onMouseMove={(e) => {
          if (isDragging && zoomLevel > 1.0) {
            const rawX = e.clientX - dragStart.x;
            const rawY = e.clientY - dragStart.y;
            setPanOffset(clampPanOffset(rawX, rawY, zoomLevel));
          }
        }}
        onMouseUp={(e) => {
          if (e.button === 0) setIsDragging(false);
        }}
        onMouseLeave={() => setIsDragging(false)}
      >
        <ChartSvgPlot
          chartWidth={chartWidth}
          chartHeight={chartHeight}
          paddingLeft={paddingLeft}
          paddingRight={paddingRight}
          paddingTop={paddingTop}
          paddingBottom={paddingBottom}
          plotAreaWidth={plotAreaWidth}
          plotAreaHeight={plotAreaHeight}
          zoomLevel={zoomLevel}
          selectedStudentId={selectedStudentId}
          selectedClassId={selectedClassId}
          timeView={timeView}
          yBounds={yBounds}
          getSvgX={getSvgX}
          getSvgY={getSvgY}
          makeBezierPath={makeBezierPath}
          makeAreaPath={makeAreaPath}
          sessionChartData={sessionChartData}
          engine={engine}
          fittedLookup={fittedLookup}
          hoveredPoint={hoveredPoint}
          setHoveredPoint={setHoveredPoint}
        />

        {/* Floating Hover Tooltip Card (Anchored directly next to data point / mouse) */}
        {hoveredPoint && (() => {
          const cardWidth = 200;
          const cardHeight = 160;
          const pointX = hoveredPoint.x;
          const pointY = hoveredPoint.y ?? 100;

          // Default: Above the point, centered horizontally
          let left = pointX;
          let top = pointY - 14;
          let transform = 'translate(-50%, -100%)';

          // If too close to top edge, pop below the point
          if (pointY < cardHeight + 20) {
            top = pointY + 18;
            transform = 'translate(-50%, 0)';
          }

          // Edge clamping horizontally so tooltip never overflows container
          if (pointX < cardWidth / 2 + 16) {
            left = 16;
            transform = transform.replace('-50%', '0%');
          } else if (pointX > chartWidth - (cardWidth / 2 + 16)) {
            left = chartWidth - 16;
            transform = transform.replace('-50%', '-100%');
          }

          return (
            <div
              className="absolute z-30 pointer-events-none bg-[#12172b] border border-[#2c375e] p-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-xs font-sans transition-all duration-75 min-w-[190px]"
              style={{
                left: `${left}px`,
                top: `${top}px`,
                transform,
              }}
            >
              <div className="font-extrabold text-white border-b border-white/10 pb-1.5 flex items-center justify-between gap-4">
                <span>{hoveredPoint.sessionName}</span>
                <span className="text-[10px] text-slate-400 font-mono">{hoveredPoint.fullDate}</span>
              </div>
              <div className="space-y-1.5 pt-1.5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-blue-400 font-bold">{isTestMode ? 'Từ Vựng:' : 'Check 1:'}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-extrabold text-white">{format1Dec(hoveredPoint.check1)}</span>
                    {hoveredPoint.fittedC1 !== null && (
                      <span className="text-[10px] font-mono text-slate-400">({format1Dec(hoveredPoint.fittedC1)})</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-purple-400 font-bold">{isTestMode ? 'Ngữ Pháp:' : 'Check 2:'}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-extrabold text-white">{format1Dec(hoveredPoint.check2)}</span>
                    {hoveredPoint.fittedC2 !== null && (
                      <span className="text-[10px] font-mono text-slate-400">({format1Dec(hoveredPoint.fittedC2)})</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-emerald-400 font-bold">Homework:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-extrabold text-white">{format1Dec(hoveredPoint.homework)}</span>
                    {hoveredPoint.fittedHw !== null && (
                      <span className="text-[10px] font-mono text-slate-400">({format1Dec(hoveredPoint.fittedHw)})</span>
                    )}
                  </div>
                </div>
                <div className="border-t border-white/10 pt-1 flex items-center justify-between gap-4">
                  <span className="text-indigo-300 font-extrabold">Điểm TB Buổi:</span>
                  <span className="font-mono font-black text-indigo-300">
                    {format1Dec(trunc1Dec((hoveredPoint.check1 * 0.35) + (hoveredPoint.check2 * 0.55) + (hoveredPoint.homework * 0.10)))}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
