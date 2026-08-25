import React, { useState } from 'react';
import { StudentResultRecord } from '../types';
import { trunc1Dec } from '../hooks/useStudentResults';

interface ResultScoreChartProps {
  records: StudentResultRecord[];
}

interface TooltipData {
  x: number;
  y: number;
  date: string;
  check_1: number | null;
  check_2: number | null;
  homework: number | null;
  mock_test: number | null;
}

export const ResultScoreChart: React.FC<ResultScoreChartProps> = ({ records }) => {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Filter valid sessions with date sorted ascending
  const sortedSessions = React.useMemo(() => {
    return [...records]
      .filter((r) => r.date)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [records]);

  if (sortedSessions.length === 0) {
    return (
      <div className="bg-[#0c0f1e] border border-[#1e2742] rounded-2xl p-6 text-center text-slate-400 text-xs font-semibold">
        Chưa có dữ liệu điểm buổi học nào để vẽ biểu đồ.
      </div>
    );
  }

  // Chart dimensions
  const width = 800;
  const height = 280;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxScore = 10;
  const minScore = 0;

  const getX = (index: number) => {
    if (sortedSessions.length === 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (sortedSessions.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(10, val));
    return paddingTop + chartHeight - (clamped / maxScore) * chartHeight;
  };

  // Generate SVG path strings
  const buildPath = (key: 'check_1' | 'check_2' | 'homework') => {
    const pts = sortedSessions
      .map((s, i) => {
        const val = s[key];
        if (val === null || val === undefined) return null;
        return { x: getX(i), y: getY(val) };
      })
      .filter((p): p is { x: number; y: number } => p !== null);

    if (pts.length === 0) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  };

  const c1Path = buildPath('check_1');
  const c2Path = buildPath('check_2');
  const hwPath = buildPath('homework');

  return (
    <div className="bg-[#0c0f1e] border border-[#1e2742] rounded-2xl p-5 shadow-lg space-y-3 relative">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
          Biến Động Điểm Số Theo Từng Buổi
        </h3>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-blue-400" />
            <span className="text-slate-300">Check 1</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-purple-400" />
            <span className="text-slate-300">Check 2</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-amber-400" />
            <span className="text-slate-300">BTVN</span>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-x-auto select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-h-[220px]"
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <filter id="glow-circle" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines (0, 2.5, 5, 7.5, 10) */}
          {[0, 2.5, 5, 7.5, 10].map((score) => {
            const y = getY(score);
            return (
              <g key={score}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#1c253d"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="end"
                >
                  {score}
                </text>
              </g>
            );
          })}

          {/* Lines */}
          {c1Path && <path d={c1Path} fill="none" stroke="#60a5fa" strokeWidth="2.5" />}
          {c2Path && <path d={c2Path} fill="none" stroke="#c084fc" strokeWidth="2.5" />}
          {hwPath && <path d={hwPath} fill="none" stroke="#fbbf24" strokeWidth="2.5" />}

          {/* Data Points */}
          {sortedSessions.map((s, idx) => {
            const x = getX(idx);
            const dateLabel = s.date.slice(5); // MM-DD

            return (
              <g key={idx}>
                {/* X Axis Date Label */}
                <text
                  x={x}
                  y={height - paddingBottom + 18}
                  fill="#94a3b8"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {dateLabel}
                </text>

                {/* Point Check 1 */}
                {s.check_1 !== null && (
                  <circle
                    cx={x}
                    cy={getY(s.check_1)}
                    r="4"
                    fill="#60a5fa"
                    filter="url(#glow-circle)"
                    className="cursor-pointer transition-transform duration-200 hover:scale-150"
                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                    onMouseEnter={() =>
                      setTooltip({
                        x,
                        y: getY(s.check_1!),
                        date: s.date,
                        check_1: s.check_1,
                        check_2: s.check_2,
                        homework: s.homework,
                        mock_test: s.mock_test,
                      })
                    }
                  />
                )}

                {/* Point Check 2 */}
                {s.check_2 !== null && (
                  <circle
                    cx={x}
                    cy={getY(s.check_2)}
                    r="4"
                    fill="#c084fc"
                    filter="url(#glow-circle)"
                    className="cursor-pointer transition-transform duration-200 hover:scale-150"
                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                    onMouseEnter={() =>
                      setTooltip({
                        x,
                        y: getY(s.check_2!),
                        date: s.date,
                        check_1: s.check_1,
                        check_2: s.check_2,
                        homework: s.homework,
                        mock_test: s.mock_test,
                      })
                    }
                  />
                )}

                {/* Point Homework */}
                {s.homework !== null && (
                  <circle
                    cx={x}
                    cy={getY(s.homework)}
                    r="4"
                    fill="#fbbf24"
                    filter="url(#glow-circle)"
                    className="cursor-pointer transition-transform duration-200 hover:scale-150"
                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                    onMouseEnter={() =>
                      setTooltip({
                        x,
                        y: getY(s.homework!),
                        date: s.date,
                        check_1: s.check_1,
                        check_2: s.check_2,
                        homework: s.homework,
                        mock_test: s.mock_test,
                      })
                    }
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {tooltip && (
          <div
            className="absolute z-30 pointer-events-none bg-[#090d1a] border border-[#2a365c] rounded-xl px-3 py-2 text-xs shadow-2xl space-y-1 transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(tooltip.x / width) * 100}%`,
              top: `${(tooltip.y / height) * 100}%`,
              marginTop: '-8px',
            }}
          >
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-white/5 pb-1">
              Buổi ngày: {tooltip.date}
            </div>
            <div className="space-y-0.5 font-bold">
              <div className="flex items-center justify-between gap-4 text-blue-400">
                <span>Check 1:</span>
                <span>{trunc1Dec(tooltip.check_1)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-purple-400">
                <span>Check 2:</span>
                <span>{trunc1Dec(tooltip.check_2)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-amber-400">
                <span>BTVN:</span>
                <span>{trunc1Dec(tooltip.homework)}</span>
              </div>
              {tooltip.mock_test !== null && (
                <div className="flex items-center justify-between gap-4 text-emerald-400">
                  <span>Thi Thử:</span>
                  <span>{trunc1Dec(tooltip.mock_test)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
