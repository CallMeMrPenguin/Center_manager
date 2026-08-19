import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Layers } from 'lucide-react';
import { DistributionStats, DistributionScoreBin } from '../utils/distributionAnalytics';
import { HistogramTooltip } from './HistogramTooltip';

export type GranularityMode = '10bins' | 'tiers';

interface Histogram3DChartProps {
  stats: DistributionStats;
  granularity: GranularityMode;
  setGranularity: (g: GranularityMode) => void;
  selectedBin?: DistributionScoreBin | null;
  onSelectBin?: (bin: DistributionScoreBin) => void;
}

export const Histogram3DChart: React.FC<Histogram3DChartProps> = ({
  stats,
  granularity,
  setGranularity,
  selectedBin,
  onSelectBin,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgWidth, setSvgWidth] = useState(1050);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [animFactor, setAnimFactor] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setSvgWidth(Math.max(500, containerRef.current.clientWidth));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Frame-by-frame direct SVG coordinate interpolation for smooth, elegant column rising animation
  useEffect(() => {
    let animId: number;
    const startTime = performance.now();
    const duration = 1250; // ms for graceful, clearly visible rising wave

    setAnimFactor(0);

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / duration);
      // Smooth cubic ease-out deceleration
      const ease = 1 - Math.pow(1 - p, 3);
      setAnimFactor(ease);

      if (p < 1) {
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [granularity, stats]);

  const activeBins: DistributionScoreBin[] = useMemo(() => {
    if (granularity === 'tiers') return stats.tierBins;
    return stats.scoreBins10;
  }, [granularity, stats]);

  const maxCount = useMemo(() => {
    const max = Math.max(...activeBins.map((b) => b.count), 1);
    return max;
  }, [activeBins]);

  const height = 480;
  const paddingX = 75;
  const paddingBottom = 75;
  const paddingTop = 75;
  const depthX = 16;
  const depthY = 12;

  const chartAreaWidth = svgWidth - paddingX * 2;
  const chartAreaHeight = height - paddingTop - paddingBottom;
  const numBins = activeBins.length;
  const slotWidth = chartAreaWidth / numBins;
  const colWidth = Math.max(22, slotWidth * 0.65);
  const baseY = height - paddingBottom;

  const yTicks = useMemo(() => {
    const steps = 4;
    const ticks: number[] = [];
    for (let i = 0; i <= steps; i++) {
      ticks.push(Math.round((maxCount / steps) * i));
    }
    return Array.from(new Set(ticks)).sort((a, b) => a - b);
  }, [maxCount]);

  const hoveredBin = hoveredIndex !== null ? activeBins[hoveredIndex] : null;

  return (
    <div
      ref={containerRef}
      className="bg-[#090c17] border border-[#1e2746] rounded-2xl p-5 shadow-2xl relative flex flex-col gap-4 overflow-hidden select-none"
    >
      {/* 1. Header Toolbar with Title, Granularity Mode & Active Selection */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Layers size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span>Phổ Điểm Đa Tầng 3D</span>
              <span className="text-xs font-mono font-bold text-indigo-300">
                (N = {stats.n} học sinh)
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Phân bố điểm theo mức {stats.evaluation?.skillName || 'Điểm Số'} • Bấm vào cột để lọc danh sách
            </p>
          </div>
        </div>

        {/* Segmented Pill for Granularity (2 Views: Chi Tiết & Tổng Quan) */}
        <div className="flex items-center gap-2">
          <div className="relative flex bg-[#0c101d] border border-[#1e2947] p-1 rounded-xl text-xs font-bold select-none min-w-[190px]">
            <div
              className="absolute top-1 bottom-1 rounded-lg bg-[#5c36f5] shadow-[0_0_12px_rgba(92,54,245,0.5)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
              style={{
                left: granularity === '10bins' ? '4px' : 'calc(50% + 2px)',
                width: 'calc(50% - 6px)',
              }}
            />
            <button
              type="button"
              onClick={() => setGranularity('10bins')}
              className={`flex-1 relative z-10 px-3.5 py-1 text-center transition-colors cursor-pointer ${
                granularity === '10bins' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Chi Tiết
            </button>
            <button
              type="button"
              onClick={() => setGranularity('tiers')}
              className={`flex-1 relative z-10 px-3.5 py-1 text-center transition-colors cursor-pointer ${
                granularity === 'tiers' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tổng Quan
            </button>
          </div>
        </div>
      </div>

      {/* Filter Active Notice Banner */}
      {selectedBin && (
        <div className="flex items-center justify-between bg-indigo-950/60 border border-indigo-500/40 px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span>
              Đang lọc học sinh mức điểm: <strong className="text-white font-mono">{selectedBin.rangeLabel}</strong> ({selectedBin.count} học sinh)
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectBin?.(selectedBin)}
            className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition cursor-pointer text-[11px]"
          >
            ✕ Bỏ lọc
          </button>
        </div>
      )}

      {/* 2. Main 3D Isometric SVG Container */}
      <div className="relative w-full overflow-x-auto overflow-y-hidden">
        <svg
          width={svgWidth}
          height={height}
          className="overflow-visible block"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setMousePos({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            });
          }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            {/* Gradients for Front and Top Faces of each Bin */}
            {activeBins.map((bin, i) => (
              <React.Fragment key={`grad-${i}-${bin.label}`}>
                <linearGradient id={`grad-front-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={bin.color} stopOpacity="0.95" />
                  <stop offset="100%" stopColor={bin.color} stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id={`grad-top-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                  <stop offset="100%" stopColor={bin.color} stopOpacity="0.95" />
                </linearGradient>
              </React.Fragment>
            ))}
          </defs>

          {/* Background Grid Horizontal Lines & Ticks */}
          {yTicks.map((tick) => {
            const y = baseY - (tick / maxCount) * chartAreaHeight;
            return (
              <g key={`ytick-${tick}`}>
                <line
                  x1={paddingX - 10}
                  y1={y}
                  x2={svgWidth - paddingX + depthX + 10}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <text
                  x={paddingX - 16}
                  y={y + 4}
                  textAnchor="end"
                  className="font-mono text-xs font-extrabold fill-slate-400 select-none"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Base Platform Grid Lines */}
          <line
            x1={paddingX - 10}
            y1={baseY}
            x2={svgWidth - paddingX + depthX + 10}
            y2={baseY}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1.5}
          />

          {/* 3D Isometric Columns */}
          {activeBins.map((bin, i) => {
            const count = bin.count;
            const targetColHeight = (count / maxCount) * chartAreaHeight;

            // Compute staggered frame animation progress for each column (smooth wave progression)
            const delayOffset = (i / Math.max(numBins - 1, 1)) * 0.42;
            const colP = Math.max(0, Math.min(1, (animFactor - delayOffset) / (1 - delayOffset || 1)));
            const colEase = 1 - Math.pow(1 - colP, 3);
            const currentHeight = Math.max(targetColHeight * colEase, count > 0 ? 8 * colEase : 2);

            const slotStartX = paddingX + i * slotWidth;
            const x0 = slotStartX + (slotWidth - colWidth) / 2;
            const x1 = x0 + colWidth;
            const yBottom = baseY;
            const yTop = baseY - currentHeight;

            const isHovered = hoveredIndex === i;
            const isSelected = selectedBin?.label === bin.label;

            const frontPoints = `${x0},${yBottom} ${x1},${yBottom} ${x1},${yTop} ${x0},${yTop}`;
            const topPoints = `${x0},${yTop} ${x1},${yTop} ${x1 + depthX},${yTop - depthY} ${x0 + depthX},${yTop - depthY}`;
            const sidePoints = `${x1},${yBottom} ${x1 + depthX},${yBottom - depthY} ${x1 + depthX},${yTop - depthY} ${x1},${yTop}`;

            const frontGrad = `url(#grad-front-${i})`;
            const topGrad = `url(#grad-top-${i})`;
            const sideColor = bin.color;
            const glowColor = bin.color;

            const topCenterX = x0 + colWidth / 2 + depthX / 2;
            const topCenterY = yTop - depthY / 2;

            return (
              <g
                key={`col-3d-${i}-${bin.label}`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onSelectBin?.(bin)}
                className="cursor-pointer"
                style={{
                  opacity:
                    selectedBin && !isSelected
                      ? 0.35
                      : hoveredIndex !== null && !isHovered
                      ? 0.4
                      : 1,
                  filter:
                    isSelected
                      ? `drop-shadow(0 0 22px ${glowColor}) drop-shadow(0 0 8px #ffffff)`
                      : isHovered
                      ? `drop-shadow(0 0 16px ${glowColor})`
                      : 'none',
                  transition: `opacity 0.15s ease, filter 0.15s ease`,
                }}
              >
                {/* 1. Right Side Face */}
                <polygon
                  points={sidePoints}
                  fill={sideColor}
                  stroke="rgba(0,0,0,0.35)"
                  strokeWidth={0.5}
                />

                {/* 2. Front Face */}
                <polygon
                  points={frontPoints}
                  fill={count > 0 ? frontGrad : 'rgba(255,255,255,0.05)'}
                  stroke={isSelected ? '#ffffff' : 'rgba(255,255,255,0.15)'}
                  strokeWidth={isSelected ? 1.5 : 0.5}
                />

                {/* 3. Top Cap */}
                <polygon
                  points={topPoints}
                  fill={count > 0 ? topGrad : 'rgba(255,255,255,0.08)'}
                  stroke={isSelected ? '#ffffff' : 'rgba(255,255,255,0.4)'}
                  strokeWidth={isSelected ? 1.5 : 0.5}
                />

                {/* Value on Top of Column (moves smoothly upwards with the rising column) */}
                <text
                  x={topCenterX}
                  y={topCenterY - 10}
                  textAnchor="middle"
                  className={`font-mono font-black select-none fill-white ${
                    isSelected ? 'text-lg sm:text-xl' : isHovered ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
                  }`}
                  style={{
                    opacity: colP > 0.15 ? Math.min(1, (colP - 0.15) / 0.4) : 0,
                    filter: isHovered || isSelected ? 'drop-shadow(0 0 6px rgba(255,255,255,0.9))' : 'none',
                  }}
                >
                  {count}
                </text>

                {/* X-axis Interval Label (Fixed at base platform) */}
                <text
                  x={topCenterX}
                  y={baseY + 22}
                  textAnchor="middle"
                  className={`font-mono select-none ${
                    isSelected
                      ? 'fill-indigo-300 font-black text-sm sm:text-base'
                      : isHovered
                      ? 'fill-white font-black text-sm sm:text-base'
                      : 'fill-slate-300 font-bold text-xs sm:text-sm'
                  }`}
                >
                  {bin.label}
                </text>
                {granularity === '10bins' && (
                  <text
                    x={topCenterX}
                    y={baseY + 36}
                    textAnchor="middle"
                    className="font-mono text-[10px] font-semibold fill-slate-500 select-none hidden sm:block"
                  >
                    điểm
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Card dynamically following mouse cursor */}
        {hoveredBin && (
          <HistogramTooltip
            hoveredBin={hoveredBin}
            mousePos={mousePos}
            svgWidth={svgWidth}
            height={height}
          />
        )}
      </div>
    </div>
  );
};
