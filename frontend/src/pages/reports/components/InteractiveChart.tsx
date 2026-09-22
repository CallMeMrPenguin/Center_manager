import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChartControls } from './ChartControls';
import { ChartSvgPlot } from './ChartSvgPlot';
import { ChartHoverTooltip } from './ChartHoverTooltip';
import { DistributionPlot } from './DistributionPlot';
import { ChartSessionItem, HoveredChartPoint } from '../types';
import { DistributionStats, GradeTypeFilterKey, DistributionScoreBin } from '../utils/distributionAnalytics';
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
  chartViewMode: 'timeline' | 'distribution';
  setChartViewMode: (mode: 'timeline' | 'distribution') => void;
  distributionStats: DistributionStats;
  selectedGradeTypeFilter: GradeTypeFilterKey;
  setSelectedGradeTypeFilter: (key: GradeTypeFilterKey) => void;
  selectedScoreBin?: DistributionScoreBin | null;
  onSelectScoreBin?: (bin: DistributionScoreBin) => void;
  hideDistributionToggle?: boolean;
  gradeTypesList?: any[];
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
  chartViewMode,
  setChartViewMode,
  distributionStats,
  selectedGradeTypeFilter,
  setSelectedGradeTypeFilter,
  selectedScoreBin,
  onSelectScoreBin,
  hideDistributionToggle = false,
  gradeTypesList,
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
        setChartWidth((prev) => (Math.abs(prev - w) > 3 ? w : prev));
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

  const clampPanOffset = useCallback(
    (x: number, y: number, z: number) => {
      if (z <= 1.0) return { x: 0, y: 0 };
      const limX = (plotAreaWidth * (z - 1)) / 2;
      const limY = (plotAreaHeight * (z - 1)) / 2;
      return {
        x: Math.max(-limX, Math.min(limX, x)),
        y: Math.max(-limY, Math.min(limY, y)),
      };
    },
    [plotAreaWidth, plotAreaHeight]
  );

  useEffect(() => {
    if (zoomLevel <= 1.0) {
      setPanOffset({ x: 0, y: 0 });
    } else {
      setPanOffset((prev) => clampPanOffset(prev.x, prev.y, zoomLevel));
    }
  }, [zoomLevel, clampPanOffset]);

  useEffect(() => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  }, [timeView, selectedPhaseId, sessionChartData.length]);

  const yBounds = useMemo(() => {
    let min = 10,
      max = 0;
    sessionChartData.forEach((d) => {
      [d.check1, d.check2, d.homework].forEach((v) => {
        if (v > 0) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      });
    });
    if (min > max) {
      min = 0;
      max = 10;
    }
    const minY = Math.max(0, Math.floor(min) - 1);
    const maxY = Math.min(10, Math.ceil(max) + 1);
    const ticks: number[] = [];
    const step = maxY - minY <= 5 ? 1 : 2;
    for (let y = minY; y <= maxY; y += step) ticks.push(y);
    return { minY, maxY, ticks };
  }, [sessionChartData]);

  const getSvgX = useCallback(
    (index: number, total: number) => {
      if (total <= 1) return paddingLeft + plotAreaWidth / 2;
      return paddingLeft + (index / (total - 1)) * plotAreaWidth;
    },
    [paddingLeft, plotAreaWidth]
  );

  const getSvgY = useCallback(
    (score: number) => {
      const { minY, maxY } = yBounds;
      const ratio = (score - minY) / (maxY - minY || 1);
      return paddingTop + plotAreaHeight - ratio * plotAreaHeight;
    },
    [paddingTop, plotAreaHeight, yBounds]
  );

  const makeBezierPath = useCallback(
    (key: 'check1' | 'check2' | 'homework') => {
      const pts = sessionChartData
        .map((d, i) => {
          const val = d[key];
          if (val === null || val <= 0) return null;
          return { x: getSvgX(i, sessionChartData.length), y: getSvgY(val) };
        })
        .filter(Boolean) as { x: number; y: number }[];

      if (pts.length === 0) return '';
      if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

      let path = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i === 0 ? 0 : i - 1];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
      return path;
    },
    [sessionChartData, getSvgX, getSvgY]
  );

  const makeAreaPath = useCallback(
    (key: 'check1' | 'check2' | 'homework') => {
      const pts = sessionChartData
        .map((d, i) => {
          const val = d[key];
          if (val === null || val <= 0) return null;
          return { x: getSvgX(i, sessionChartData.length), y: getSvgY(val) };
        })
        .filter(Boolean) as { x: number; y: number }[];

      if (pts.length < 2) return '';
      const linePath = makeBezierPath(key);
      const bottomY = chartHeight - paddingBottom;
      const firstX = pts[0].x;
      const lastX = pts[pts.length - 1].x;
      return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
    },
    [sessionChartData, getSvgX, getSvgY, makeBezierPath, chartHeight, paddingBottom]
  );

  return (
    <div
      ref={chartWrapperRef}
      className="bg-white dark:bg-[#141417] border border-slate-200 dark:border-[#27272a] p-6 rounded-2xl shadow-sm dark:shadow-xl flex flex-col gap-6 relative select-none animate-cascade-2 transition-colors"
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
        chartViewMode={chartViewMode}
        setChartViewMode={setChartViewMode}
        distributionStats={distributionStats}
        hideDistributionToggle={hideDistributionToggle}
        gradeTypesList={gradeTypesList}
      />

      {/* VIEW 1: TIMELINE LINE CHART */}
      {chartViewMode === 'timeline' ? (
        <div
          className={`relative overflow-hidden cursor-${
            isDragging ? 'grabbing' : zoomLevel > 1.0 ? 'grab' : 'default'
          } select-none rounded-2xl bg-white dark:bg-[#1c1c21] border border-slate-200 dark:border-[#27272a] shadow-sm dark:shadow-none`}
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
            gradeTypesList={gradeTypesList}
          />

          {/* Floating Hover Tooltip Card */}
          <ChartHoverTooltip
            hoveredPoint={hoveredPoint}
            chartWidth={chartWidth}
            gradeTypesList={gradeTypesList}
          />
        </div>
      ) : (
        /* VIEW 2: SCORE DISTRIBUTION ACROSS SKILLS */
        <DistributionPlot
          stats={distributionStats}
          selectedStudentId={selectedStudentId}
          selectedClassId={selectedClassId}
          selectedGradeTypeFilter={selectedGradeTypeFilter}
          setSelectedGradeTypeFilter={setSelectedGradeTypeFilter}
          selectedScoreBin={selectedScoreBin}
          onSelectScoreBin={onSelectScoreBin}
        />
      )}
    </div>
  );
};
