import React from 'react';
import { format1Dec, trunc1Dec } from '../../../utils';

interface MiniTrendSparklineProps {
  points: number[];
  slope: number;
  ema: number;
}

export const MiniTrendSparkline = React.memo(({ points, slope, ema }: MiniTrendSparklineProps) => {
  let dataPoints: number[] = [];

  if (points && points.length >= 5) {
    dataPoints = points.slice(-5);
  } else if (points && points.length > 1) {
    // Interpolate between the available points to construct a smooth 5-point progression
    const first = points[0];
    const last = points[points.length - 1];
    const step = (last - first) / 4;
    dataPoints = [
      first,
      trunc1Dec(first + step * 1),
      trunc1Dec(first + step * 2),
      trunc1Dec(first + step * 3),
      last
    ];
  } else if (points && points.length === 1) {
    const single = points[0];
    const s = slope !== 0 ? slope : 0.15;
    dataPoints = [
      trunc1Dec(Math.max(0, Math.min(10, single - s * 2))),
      trunc1Dec(Math.max(0, Math.min(10, single - s * 1))),
      single,
      trunc1Dec(Math.max(0, Math.min(10, single + s * 1))),
      trunc1Dec(Math.max(0, Math.min(10, single + s * 2)))
    ];
  } else {
    const base = ema > 0 ? ema : 7.0;
    const s = slope !== 0 ? slope : (base >= 8.0 ? 0.2 : base >= 6.5 ? 0.1 : -0.2);
    dataPoints = [
      trunc1Dec(Math.max(0, Math.min(10, base - s * 2))),
      trunc1Dec(Math.max(0, Math.min(10, base - s * 1))),
      base,
      trunc1Dec(Math.max(0, Math.min(10, base + s * 1))),
      trunc1Dec(Math.max(0, Math.min(10, base + s * 2)))
    ];
  }

  const isDeclining = slope < -0.12 || (dataPoints[dataPoints.length - 1] < dataPoints[0] - 0.4);
  const isWarning = slope < 0 || ema < 6.5;

  const strokeColor = isDeclining ? '#f43f5e' : isWarning ? '#f97316' : '#10b981';
  const glowColor = isDeclining ? 'rgba(244,63,94,0.45)' : isWarning ? 'rgba(249,115,22,0.45)' : 'rgba(16,185,129,0.45)';
  const uniqueId = `spark-${Math.abs(Math.sin((dataPoints[0] || 1) * 100 + (dataPoints[dataPoints.length - 1] || 1) * 10)).toString(36).substr(2, 6)}`;

  const width = 110;
  const height = 34;
  const paddingX = 8;
  const paddingY = 6;

  const pMin = Math.min(...dataPoints);
  const pMax = Math.max(...dataPoints);
  const minVal = Math.max(0, pMin - 0.8);
  const maxVal = Math.min(10, pMax + 0.8);
  const range = Math.max(1.8, maxVal - minVal);

  const coords = dataPoints.map((val, idx) => {
    const clamped = Math.max(0, Math.min(10, val));
    const x = paddingX + (idx / (dataPoints.length - 1)) * (width - 2 * paddingX);
    const y = paddingY + ((maxVal - clamped) / range) * (height - 2 * paddingY);
    return { x, y, val: clamped };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${height} L ${coords[0].x.toFixed(1)} ${height} Z`;

  return (
    <div className="flex items-center justify-center cursor-default" title={`5 mốc gần nhất: ${dataPoints.map(p => format1Dec(p)).join(' → ')}`}>
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={uniqueId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill={`url(#${uniqueId})`} />

        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.2"
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
              style={{ filter: `drop-shadow(0 0 4px ${glowColor})` }}
            />
            <circle
              cx={c.x}
              cy={c.y}
              r="1.5"
              fill="#ffffff"
            />
          </g>
        ))}
      </svg>
    </div>
  );
});
