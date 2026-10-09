import React from 'react';
import { useTheme } from '../../../context/ThemeContext';

interface DualHistogram3DProps {
  classA: any;
  classB: any;
}

interface MilestoneStat {
  id: string;
  name: string;
  range: string;
  min: number;
  max: number;
  color: string;
  countA: number;
  pctA: number;
  countB: number;
  pctB: number;
}

export const DualHistogram3D: React.FC<DualHistogram3DProps> = ({ classA, classB }) => {
  const { isDark } = useTheme();

  // Milestones in ascending order (từ bé đến lớn: Kém -> Yếu -> Trung Bình -> Khá -> Giỏi -> Xuất Sắc)
  // Each milestone has its unique distinct color applied to the X-axis
  const milestones = [
    { id: 'kem', name: 'Kém', range: '< 3.5đ', min: 0, max: 3.49, color: '#f43f5e' },
    { id: 'yeu', name: 'Yếu', range: '3.5 – 4.9đ', min: 3.5, max: 4.99, color: '#fb923c' },
    { id: 'tb', name: 'Trung Bình', range: '5.0 – 6.4đ', min: 5.0, max: 6.49, color: '#f59e0b' },
    { id: 'kha', name: 'Khá', range: '6.5 – 7.9đ', min: 6.5, max: 7.99, color: '#06b6d4' },
    { id: 'gioi', name: 'Giỏi', range: '8.0 – 8.9đ', min: 8.0, max: 8.99, color: '#6366f1' },
    { id: 'xs', name: 'Xuất Sắc', range: '≥ 9.0đ', min: 9.0, max: 10.0, color: '#10b981' },
  ];

  const getStudentScore = (s: any) => {
    if (s.ema_level && Number(s.ema_level) > 0) return Number(s.ema_level);
    const c1 = Number(s.avg_check_1 || 0);
    const c2 = Number(s.avg_check_2 || 0);
    const hw = Number(s.avg_homework || 0);
    const valid = [c1, c2, hw].filter((v) => v > 0);
    return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
  };

  const statsList: MilestoneStat[] = milestones.map((m) => {
    const countA = (classA.students || []).filter((s: any) => {
      const sc = getStudentScore(s);
      return sc >= m.min && sc <= m.max;
    }).length;
    const pctA = classA.studentCount > 0 ? Math.round((countA / classA.studentCount) * 100) : 0;

    const countB = (classB.students || []).filter((s: any) => {
      const sc = getStudentScore(s);
      return sc >= m.min && sc <= m.max;
    }).length;
    const pctB = classB.studentCount > 0 ? Math.round((countB / classB.studentCount) * 100) : 0;

    return { ...m, countA, pctA, countB, pctB };
  });

  const maxCount = Math.max(1, ...statsList.flatMap((s) => [s.countA, s.countB]));

  const svgWidth = 680;
  const svgHeight = 250;
  const paddingX = 40;
  const paddingTop = 32;
  const paddingBottom = 48;
  const baseY = svgHeight - paddingBottom;
  const chartAreaHeight = baseY - paddingTop;
  const chartAreaWidth = svgWidth - paddingX * 2;
  const slotWidth = chartAreaWidth / 6;

  const colWidth = 26;
  const colGap = 6;
  const depthX = 10;
  const depthY = 8;

  // Grid steps for Y-axis
  const steps = 4;
  const yTicks: number[] = [];
  for (let i = 0; i <= steps; i++) {
    yTicks.push(Math.round((maxCount / steps) * i));
  }
  const uniqueYTicks = Array.from(new Set(yTicks)).sort((a, b) => a - b);

  return (
    <div className="relative w-full pt-1 select-none">
      <div className="relative w-full overflow-x-auto overflow-y-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[500px] overflow-visible block"
        >
          <defs>
            {/* Class A (Blue) Gradients */}
            <linearGradient id="hist3d-a-front" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="hist3d-a-top" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.95" />
            </linearGradient>

            {/* Class B (Cyan) Gradients */}
            <linearGradient id="hist3d-b-front" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0e7490" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="hist3d-b-top" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* Horizontal Background Grid Lines */}
          {uniqueYTicks.map((tick) => {
            const y = baseY - (tick / maxCount) * chartAreaHeight;
            return (
              <g key={`hist3d-grid-${tick}`}>
                <line
                  x1={paddingX - 10}
                  y1={y}
                  x2={svgWidth - paddingX + depthX + 10}
                  y2={y}
                  stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <text
                  x={paddingX - 14}
                  y={y + 3.5}
                  textAnchor="end"
                  className="font-mono text-[10px] font-extrabold fill-slate-400 dark:fill-slate-500 select-none"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Base Platform Line */}
          <line
            x1={paddingX - 10}
            y1={baseY}
            x2={svgWidth - paddingX + depthX + 10}
            y2={baseY}
            stroke={isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)'}
            strokeWidth={1.5}
          />

          {/* 3D Columns for each Milestone */}
          {statsList.map((m, i) => {
            const slotStartX = paddingX + i * slotWidth;
            const slotCenterX = slotStartX + slotWidth / 2;
            const groupWidth = colWidth * 2 + colGap + depthX;
            const startX = slotStartX + (slotWidth - groupWidth) / 2;

            // Class A Positions
            const x0_A = startX;
            const x1_A = x0_A + colWidth;
            const hA = m.countA > 0 ? Math.max(14, (m.countA / maxCount) * (chartAreaHeight - 20)) : 0;
            const yTop_A = baseY - hA;

            // Class B Positions
            const x0_B = x1_A + colGap;
            const x1_B = x0_B + colWidth;
            const hB = m.countB > 0 ? Math.max(14, (m.countB / maxCount) * (chartAreaHeight - 20)) : 0;
            const yTop_B = baseY - hB;

            // Polygons for Class A
            const frontA = `${x0_A},${baseY} ${x1_A},${baseY} ${x1_A},${yTop_A} ${x0_A},${yTop_A}`;
            const topA = `${x0_A},${yTop_A} ${x1_A},${yTop_A} ${x1_A + depthX},${yTop_A - depthY} ${x0_A + depthX},${yTop_A - depthY}`;
            const sideA = `${x1_A},${baseY} ${x1_A + depthX},${baseY - depthY} ${x1_A + depthX},${yTop_A - depthY} ${x1_A},${yTop_A}`;

            // Polygons for Class B
            const frontB = `${x0_B},${baseY} ${x1_B},${baseY} ${x1_B},${yTop_B} ${x0_B},${yTop_B}`;
            const topB = `${x0_B},${yTop_B} ${x1_B},${yTop_B} ${x1_B + depthX},${yTop_B - depthY} ${x0_B + depthX},${yTop_B - depthY}`;
            const sideB = `${x1_B},${baseY} ${x1_B + depthX},${baseY - depthY} ${x1_B + depthX},${yTop_B - depthY} ${x1_B},${yTop_B}`;

            // Base plate polygon for count = 0
            const basePlateA = `${x0_A},${baseY} ${x1_A},${baseY} ${x1_A + depthX},${baseY - depthY} ${x0_A + depthX},${baseY - depthY}`;
            const basePlateB = `${x0_B},${baseY} ${x1_B},${baseY} ${x1_B + depthX},${baseY - depthY} ${x0_B + depthX},${baseY - depthY}`;

            return (
              <g key={m.id} className="transition-all duration-300">
                {/* ── CLASS A 3D COLUMN ── */}
                <g>
                  {m.countA > 0 ? (
                    <>
                      {/* Right Side */}
                      <polygon points={sideA} fill="#1d4ed8" stroke="rgba(0,0,0,0.35)" strokeWidth={0.5} />
                      {/* Front */}
                      <polygon points={frontA} fill="url(#hist3d-a-front)" stroke="rgba(255,255,255,0.2)" strokeWidth={0.5} />
                      {/* Top */}
                      <polygon points={topA} fill="url(#hist3d-a-top)" stroke="rgba(255,255,255,0.4)" strokeWidth={0.5} />
                    </>
                  ) : (
                    /* 0-Count Base Plate */
                    <polygon
                      points={basePlateA}
                      fill={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}
                      stroke="rgba(59,130,246,0.3)"
                      strokeWidth={1}
                    />
                  )}

                  {/* Class A Count Number */}
                  <text
                    x={x0_A + colWidth / 2 + depthX / 2}
                    y={yTop_A - depthY - 4}
                    textAnchor="middle"
                    className={`font-mono text-[11px] font-black select-none ${
                      m.countA > 0 ? 'fill-blue-600 dark:fill-blue-400' : 'fill-slate-400 dark:fill-slate-600'
                    }`}
                  >
                    {m.countA}
                  </text>
                </g>

                {/* ── CLASS B 3D COLUMN ── */}
                <g>
                  {m.countB > 0 ? (
                    <>
                      {/* Right Side */}
                      <polygon points={sideB} fill="#0e7490" stroke="rgba(0,0,0,0.35)" strokeWidth={0.5} />
                      {/* Front */}
                      <polygon points={frontB} fill="url(#hist3d-b-front)" stroke="rgba(255,255,255,0.2)" strokeWidth={0.5} />
                      {/* Top */}
                      <polygon points={topB} fill="url(#hist3d-b-top)" stroke="rgba(255,255,255,0.4)" strokeWidth={0.5} />
                    </>
                  ) : (
                    /* 0-Count Base Plate */
                    <polygon
                      points={basePlateB}
                      fill={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}
                      stroke="rgba(6,182,212,0.3)"
                      strokeWidth={1}
                    />
                  )}

                  {/* Class B Count Number */}
                  <text
                    x={x0_B + colWidth / 2 + depthX / 2}
                    y={yTop_B - depthY - 4}
                    textAnchor="middle"
                    className={`font-mono text-[11px] font-black select-none ${
                      m.countB > 0 ? 'fill-cyan-600 dark:fill-cyan-400' : 'fill-slate-400 dark:fill-slate-600'
                    }`}
                  >
                    {m.countB}
                  </text>
                </g>

                {/* Category Title with unique milestone color & Range */}
                <text
                  x={slotCenterX + depthX / 2}
                  y={baseY + 18}
                  textAnchor="middle"
                  fill={m.color}
                  className="font-black text-xs select-none"
                >
                  {m.name}
                </text>
                <text
                  x={slotCenterX + depthX / 2}
                  y={baseY + 32}
                  textAnchor="middle"
                  className="font-mono text-[10px] font-bold fill-slate-400 dark:fill-slate-500 select-none"
                >
                  {m.range}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
