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
}) => {
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<HoveredChartPoint | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [chartWidth, setChartWidth] = useState(1050);

  const chartHeight = 750;
  const paddingLeft = 60;
  const paddingRight = 100;
  const paddingTop = 45;
  const paddingBottom = 45;
  const plotAreaWidth = Math.max(100, chartWidth - paddingLeft - paddingRight);
  const plotAreaHeight = Math.max(100, chartHeight - paddingTop - paddingBottom);

  useEffect(() => {
    const updateDimensions = () => {
      if (chartWrapperRef.current) {
        setChartWidth(Math.max(600, chartWrapperRef.current.clientWidth));
      }
    };
    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    if (chartWrapperRef.current) observer.observe(chartWrapperRef.current);
    return () => observer.disconnect();
  }, []);

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
    if (total <= 1) return paddingLeft + plotAreaWidth / 2 + panOffset.x;
    const baseSpacing = plotAreaWidth / (total - 1);
    const effectiveSpacing = baseSpacing * zoomLevel;
    const baseX = paddingLeft + index * effectiveSpacing;
    return baseX + panOffset.x;
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

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoomLevel(prev => Math.min(5.0, Math.max(1.0, prev + zoomDelta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1.0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  return (
    <div
      ref={chartWrapperRef}
      className="bg-[#0b0f19] border border-[#1b253b] p-6 rounded-2xl shadow-xl flex flex-col gap-6 relative select-none animate-cascade-2"
    >
      <ChartControls
        timePhases={timePhases}
        selectedPhaseId={selectedPhaseId}
        setSelectedPhaseId={setSelectedPhaseId}
        onOpenPhaseModal={onOpenPhaseModal}
        timeView={timeView}
        setTimeView={setTimeView}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        setPanOffset={setPanOffset}
      />

      <div
        className="w-full relative overflow-hidden rounded-xl bg-[#080b14]/50 border border-[#141b2e] cursor-crosshair"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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

        {/* Floating Tooltip Card */}
        {hoveredPoint && (
          <div
            className="absolute z-50 pointer-events-none p-3.5 rounded-xl bg-[#0f1422] border border-[#283556] shadow-2xl text-xs space-y-1.5 transition-all duration-75"
            style={{
              left: Math.min(Math.max(10, (hoveredPoint.x / chartWidth) * 100), 85) + '%',
              top: '60px',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-extrabold text-white border-b border-white/10 pb-1 flex items-center justify-between gap-4">
              <span>{hoveredPoint.sessionName}</span>
              <span className="text-[10px] text-slate-400 font-mono">{hoveredPoint.fullDate}</span>
            </div>
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-blue-400 font-bold">Check 1:</span>
                <span className="font-mono font-extrabold text-white">{format1Dec(hoveredPoint.check1)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-purple-400 font-bold">Check 2:</span>
                <span className="font-mono font-extrabold text-white">{format1Dec(hoveredPoint.check2)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-emerald-400 font-bold">Homework:</span>
                <span className="font-mono font-extrabold text-white">{format1Dec(hoveredPoint.homework)}</span>
              </div>
              <div className="border-t border-white/10 pt-1 flex items-center justify-between gap-4">
                <span className="text-indigo-300 font-extrabold">Điểm TB Buổi:</span>
                <span className="font-mono font-black text-indigo-300">
                  {format1Dec(trunc1Dec((hoveredPoint.check1 * 0.35) + (hoveredPoint.check2 * 0.55) + (hoveredPoint.homework * 0.10)))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
