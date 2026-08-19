import React from 'react';
import { format1Dec } from '../../../utils';

interface MiniTrendSparklineProps {
  points?: number[];
  slope?: number;
  ema?: number;
}

export const MiniTrendSparkline: React.FC<MiniTrendSparklineProps> = React.memo(({ points, slope = 0, ema = 0 }) => {
  const dataPoints = (points || []).filter(
    (p) => typeof p === 'number' && !isNaN(p) && p > 0
  );

  // If 0 session records
  if (dataPoints.length === 0) {
    return (
      <div className="flex items-center justify-center text-slate-500 font-mono text-xs font-bold">
        -
      </div>
    );
  }

  // If only 1 session record exists
  if (dataPoints.length === 1) {
    const singleVal = dataPoints[0];
    return (
      <div
        className="inline-flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-bold cursor-default mx-auto"
        title={`Điểm buổi gần nhất: ${format1Dec(singleVal)} (Cần từ 2 buổi để hiển thị đường xu hướng)`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
        <span>{format1Dec(singleVal)}</span>
      </div>
    );
  }

  // 2 to 5 actual sessions available
  const recentPoints = dataPoints.slice(-5);
  const count = recentPoints.length;
  const first = recentPoints[0];
  const last = recentPoints[count - 1];
  const delta = last - first;

  const isDeclining = slope < -0.1 || delta < -0.3;
  const isImproving = slope > 0.1 || delta > 0.3;

  const strokeColor = isDeclining ? '#f43f5e' : isImproving ? '#10b981' : '#38bdf8';
  const uniqueId = `spark-${Math.abs(Math.sin((recentPoints[0] || 1) * 100 + (recentPoints[count - 1] || 1) * 10)).toString(36).substr(2, 6)}`;

  const width = 100;
  const height = 28;
  const paddingX = 8;
  const paddingY = 5;

  const pMin = Math.min(...recentPoints);
  const pMax = Math.max(...recentPoints);
  const minVal = Math.max(0, pMin - 0.5);
  const maxVal = Math.min(10, pMax + 0.5);
  const range = Math.max(1.0, maxVal - minVal);

  const coords = recentPoints.map((val, idx) => {
    const clamped = Math.max(0, Math.min(10, val));
    const x = paddingX + (idx / (count - 1)) * (width - 2 * paddingX);
    const y = paddingY + ((maxVal - clamped) / range) * (height - 2 * paddingY);
    return { x, y, val: clamped };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${height} L ${coords[0].x.toFixed(1)} ${height} Z`;

  const tooltipTitle = `${count} buổi gần nhất: ${recentPoints.map((p) => format1Dec(p)).join(' → ')}`;

  return (
    <div className="flex items-center justify-center cursor-default" title={tooltipTitle}>
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={uniqueId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill={`url(#${uniqueId})`} />

        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {coords.map((c, i) => (
          <g key={i}>
            <circle
              cx={c.x}
              cy={c.y}
              r="3.5"
              fill={strokeColor}
              fillOpacity="0.25"
            />
            <circle
              cx={c.x}
              cy={c.y}
              r="2"
              fill={strokeColor}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            />
            <circle
              cx={c.x}
              cy={c.y}
              r="1"
              fill="#ffffff"
            />
          </g>
        ))}
      </svg>
    </div>
  );
});
