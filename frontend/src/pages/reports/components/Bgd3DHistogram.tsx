import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BgdDistributionStats, BgdScoreBin } from '../utils/bgdAnalytics';
import { format1Dec } from '../../../utils';

export type GranularityMode = '10bins' | '4tiers' | '20bins';

interface Bgd3DHistogramProps {
  stats: BgdDistributionStats;
  granularity: GranularityMode;
  setGranularity: (mode: GranularityMode) => void;
}

export const Bgd3DHistogram: React.FC<Bgd3DHistogramProps> = ({
  stats,
  granularity,
  setGranularity,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgWidth, setSvgWidth] = useState(880);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    let animId: number;
    const updateSize = () => {
      if (containerRef.current) {
        const w = Math.max(540, containerRef.current.clientWidth);
        setSvgWidth((prev) => (Math.abs(prev - w) > 2 ? w : prev));
      }
    };
    updateSize();
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(updateSize);
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, []);

  const activeBins: BgdScoreBin[] = useMemo(() => {
    if (granularity === '4tiers') return stats.tierBins;
    if (granularity === '20bins') return stats.scoreBins;
    return stats.scoreBins10;
  }, [granularity, stats]);

  const height = 360;
  const marginLeft = 48;
  const marginRight = 28;
  const marginTop = 38;
  const marginBottom = 48;
  const plotWidth = Math.max(100, svgWidth - marginLeft - marginRight);
  const plotHeight = Math.max(100, height - marginTop - marginBottom);
  const baseY = height - marginBottom;

  const maxCount = Math.max(1, ...activeBins.map((b) => b.count));
  // Determine nice Y-axis upper limit
  const maxY = useMemo(() => {
    if (maxCount <= 5) return 5;
    if (maxCount <= 10) return 10;
    if (maxCount <= 15) return 15;
    if (maxCount <= 20) return 20;
    if (maxCount <= 30) return 30;
    if (maxCount <= 50) return 50;
    return Math.ceil(maxCount / 10) * 10;
  }, [maxCount]);

  const yTicks = useMemo(() => {
    const step = maxY <= 5 ? 1 : maxY <= 10 ? 2 : maxY <= 25 ? 5 : 10;
    const ticks: number[] = [];
    for (let t = 0; t <= maxY; t += step) {
      ticks.push(t);
    }
    return ticks;
  }, [maxY]);

  const totalBins = activeBins.length;
  const slotWidth = plotWidth / totalBins;
  const barWidth = Math.min(68, Math.max(16, slotWidth * 0.68));
  const depthX = Math.min(16, Math.max(6, barWidth * 0.32));
  const depthY = Math.min(12, Math.max(5, barWidth * 0.22));

  const hoveredBin = hoveredIndex !== null ? activeBins[hoveredIndex] : null;

  return (
    <div className="flex flex-col gap-4 select-none">
      {/* Top Granularity Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            CHẾ ĐỘ PHÂN NHÓM:
          </span>
          <div className="relative flex bg-[#0c101d] border border-[#1e2947] p-1 rounded-xl font-black shrink-0">
            <div
              className="absolute top-1 bottom-1 rounded-lg bg-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.5)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
              style={{
                left:
                  granularity === '10bins'
                    ? '4px'
                    : granularity === '4tiers'
                    ? 'calc(33.33% + 1px)'
                    : 'calc(66.66% + 1px)',
                width: 'calc(33.33% - 4px)',
              }}
            />
            <button
              type="button"
              onClick={() => setGranularity('10bins')}
              className={`relative z-10 py-1 px-3 text-center transition-colors cursor-pointer whitespace-nowrap ${
                granularity === '10bins' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              10 Khoảng Điểm (1.0đ)
            </button>
            <button
              type="button"
              onClick={() => setGranularity('4tiers')}
              className={`relative z-10 py-1 px-3 text-center transition-colors cursor-pointer whitespace-nowrap ${
                granularity === '4tiers' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              4 Nhóm Học Lực
            </button>
            <button
              type="button"
              onClick={() => setGranularity('20bins')}
              className={`relative z-10 py-1 px-3 text-center transition-colors cursor-pointer whitespace-nowrap ${
                granularity === '20bins' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              20 Mốc (0.5đ)
            </button>
          </div>
        </div>

        {/* Dynamic Summary Badges */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
          <span className="bg-[#12182b] border border-[#232f52] px-2.5 py-1 rounded-lg">
            TB: <strong className="text-cyan-400">{format1Dec(stats.mean)}đ</strong>
          </span>
          <span className="bg-[#12182b] border border-[#232f52] px-2.5 py-1 rounded-lg">
            Trung vị: <strong className="text-amber-400">{format1Dec(stats.median)}đ</strong>
          </span>
          <span className="bg-[#12182b] border border-[#232f52] px-2.5 py-1 rounded-lg">
            Độ lệch σ: <strong className="text-emerald-400">{format1Dec(stats.sd)}</strong>
          </span>
        </div>
      </div>

      {/* Main 3D SVG Isometric Chart Surface */}
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl bg-[#080b14] border border-[#182138] p-3 sm:p-5 shadow-2xl overflow-hidden"
      >
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${svgWidth} ${height}`}
          className="overflow-visible"
        >
          <defs>
            {/* 3D Color Gradients for Each Academic Tier */}
            {/* 1. Emerald / Teal Vibrant Palette */}
            <linearGradient id="gradFrontTeal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
            <linearGradient id="gradTopTeal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#99f6e4" />
              <stop offset="100%" stopColor="#5eead4" />
            </linearGradient>

            {/* 2. Cyan / Sky Blue */}
            <linearGradient id="gradFrontCyan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="gradTopCyan" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="100%" stopColor="#7dd3fc" />
            </linearGradient>

            {/* 3. Amber / Gold */}
            <linearGradient id="gradFrontAmber" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="gradTopAmber" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#fde68a" />
            </linearGradient>

            {/* 4. Rose / Crimson */}
            <linearGradient id="gradFrontRose" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
            <linearGradient id="gradTopRose" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fecdd3" />
              <stop offset="100%" stopColor="#fda4af" />
            </linearGradient>

            {/* Subtle Drop Shadow on hover */}
            <filter id="pillarGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#22d3ee" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Ticks */}
          {yTicks.map((tick) => {
            const tickY = baseY - (tick / maxY) * (plotHeight - depthY - 15);
            return (
              <g key={`ytick-${tick}`}>
                <line
                  x1={marginLeft}
                  y1={tickY}
                  x2={svgWidth - marginRight}
                  y2={tickY}
                  stroke="#1c253d"
                  strokeDasharray={tick === 0 ? 'none' : '3 3'}
                  strokeWidth={tick === 0 ? 1.5 : 1}
                />
                <text
                  x={marginLeft - 8}
                  y={tickY + 3.5}
                  textAnchor="end"
                  className="font-mono text-[11px] font-bold fill-slate-500"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Coordinate Axes Lines */}
          {/* Vertical Y-Axis Line */}
          <line
            x1={marginLeft}
            y1={marginTop - 5}
            x2={marginLeft}
            y2={baseY}
            stroke="#2a375a"
            strokeWidth={1.5}
          />
          {/* Horizontal X-Axis Line */}
          <line
            x1={marginLeft}
            y1={baseY}
            x2={svgWidth - marginRight + 6}
            y2={baseY}
            stroke="#2a375a"
            strokeWidth={1.5}
          />

          {/* 3D Isometric Columns */}
          {activeBins.map((bin, i) => {
            const slotCenter = marginLeft + (i + 0.5) * slotWidth;
            const x = slotCenter - barWidth / 2;
            const isHovered = hoveredIndex === i;

            // Height scaling
            const count = bin.count;
            const usablePlotHeight = plotHeight - depthY - 22;
            const barH = count > 0 ? Math.max(14, (count / maxY) * usablePlotHeight) : 4;
            const topY = baseY - barH;

            // Theme Gradients based on academic band
            let frontGrad = 'url(#gradFrontTeal)';
            let topGrad = 'url(#gradTopTeal)';
            let sideColor = '#0f766e';
            let glowColor = '#2dd4bf';

            if (bin.bandId === 'weak') {
              frontGrad = 'url(#gradFrontRose)';
              topGrad = 'url(#gradTopRose)';
              sideColor = '#9f1239';
              glowColor = '#fb7185';
            } else if (bin.bandId === 'average') {
              frontGrad = 'url(#gradFrontAmber)';
              topGrad = 'url(#gradTopAmber)';
              sideColor = '#b45309';
              glowColor = '#fbbf24';
            } else if (bin.bandId === 'good') {
              frontGrad = 'url(#gradFrontCyan)';
              topGrad = 'url(#gradTopCyan)';
              sideColor = '#0369a1';
              glowColor = '#38bdf8';
            }

            // Polygon points
            // 1. Front Face: (x, topY) -> (x + barWidth, topY) -> (x + barWidth, baseY) -> (x, baseY)
            const frontPoints = `${x},${topY} ${x + barWidth},${topY} ${x + barWidth},${baseY} ${x},${baseY}`;

            // 2. Top Diamond Cap: (x, topY) -> (x + barWidth, topY) -> (x + barWidth + depthX, topY - depthY) -> (x + depthX, topY - depthY)
            const topPoints = `${x},${topY} ${x + barWidth},${topY} ${x + barWidth + depthX},${topY - depthY} ${x + depthX},${topY - depthY}`;

            // 3. Right Side Face: (x + barWidth, topY) -> (x + barWidth + depthX, topY - depthY) -> (x + barWidth + depthX, baseY - depthY) -> (x + barWidth, baseY)
            const sidePoints = `${x + barWidth},${topY} ${x + barWidth + depthX},${topY - depthY} ${x + barWidth + depthX},${baseY - depthY} ${x + barWidth},${baseY}`;

            const topCenterX = x + barWidth / 2 + depthX / 2;
            const topCenterY = topY - depthY;

            return (
              <g
                key={`bin-${bin.label}-${i}`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer transition-transform duration-150"
                style={{
                  opacity: hoveredIndex !== null && !isHovered ? 0.45 : 1,
                  filter: isHovered ? `drop-shadow(0 0 14px ${glowColor})` : 'none',
                }}
              >
                {/* 3D Pillar Polygons */}
                {/* 1. Right Side Face (Shadow tone) */}
                <polygon
                  points={sidePoints}
                  fill={sideColor}
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth={0.5}
                />

                {/* 2. Front Face (Gradient) */}
                <polygon
                  points={frontPoints}
                  fill={count > 0 ? frontGrad : 'rgba(255,255,255,0.05)'}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={0.5}
                />

                {/* 3. Top Cap (Illuminated Diamond) */}
                <polygon
                  points={topPoints}
                  fill={count > 0 ? topGrad : 'rgba(255,255,255,0.08)'}
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth={0.5}
                />

                {/* Value on Top of Column */}
                <text
                  x={topCenterX}
                  y={topCenterY - 7}
                  textAnchor="middle"
                  className={`font-mono font-black select-none ${
                    isHovered
                      ? 'fill-white text-sm'
                      : count > 0
                      ? 'fill-white text-xs'
                      : 'fill-slate-600 text-[10px]'
                  }`}
                  style={{
                    filter: isHovered ? 'drop-shadow(0 0 4px rgba(255,255,255,0.9))' : 'none',
                  }}
                >
                  {count}
                </text>

                {/* X-axis Interval Label */}
                <text
                  x={topCenterX}
                  y={baseY + 18}
                  textAnchor="middle"
                  className={`font-mono select-none ${
                    isHovered
                      ? 'fill-white font-extrabold text-xs'
                      : 'fill-slate-400 font-semibold text-[11px]'
                  }`}
                >
                  {bin.label}
                </text>
                {granularity === '10bins' && (
                  <text
                    x={topCenterX}
                    y={baseY + 30}
                    textAnchor="middle"
                    className="font-mono text-[9px] fill-slate-600 select-none hidden sm:block"
                  >
                    điểm
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Card */}
        {hoveredBin && (
          <div
            className="absolute z-30 pointer-events-none bg-[#12172b] border border-[#2c375e] p-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.85)] text-xs transition-all duration-75 min-w-[210px]"
            style={{
              left: `${Math.min(
                svgWidth - 110,
                Math.max(
                  110,
                  marginLeft + ((hoveredIndex ?? 0) + 0.5) * slotWidth + depthX / 2
                )
              )}px`,
              top: '20px',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 font-bold text-white">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: hoveredBin.color }} />
                <span>Mức điểm: {hoveredBin.rangeLabel}</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                {hoveredBin.bandId === 'weak' ? 'Dưới Chuẩn' : hoveredBin.bandId === 'average' ? 'Đạt' : hoveredBin.bandId === 'good' ? 'Khá' : 'Xuất Sắc'}
              </span>
            </div>
            <div className="pt-2 text-[11px] space-y-1 font-mono">
              <div className="flex items-center justify-between text-slate-200">
                <span>Số học sinh:</span>
                <strong className="text-white font-bold text-xs">{hoveredBin.count} em</strong>
              </div>
              <div className="flex items-center justify-between text-slate-200">
                <span>Tỷ lệ lớp:</span>
                <strong style={{ color: hoveredBin.color }} className="font-bold text-xs">
                  {hoveredBin.pct}%
                </strong>
              </div>
              {hoveredBin.studentNames && hoveredBin.studentNames.length > 0 && (
                <div className="pt-1 border-t border-white/5 text-[10px] text-slate-400 font-sans">
                  <span className="text-slate-400 font-semibold block">Học sinh:</span>
                  <span className="text-slate-200 truncate block">
                    {hoveredBin.studentNames.slice(0, 4).join(', ')}
                    {hoveredBin.studentNames.length > 4 ? ` +${hoveredBin.studentNames.length - 4}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
