import React from 'react';
import { AnimatedProgressBar } from './AnimatedProgressBar';
import { format1Dec } from '../../../utils';

interface DualComparisonBarsProps {
  classA: any;
  classB: any;
  compareClassAId: string;
  compareClassBId: string;
}

export const DualComparisonBars: React.FC<DualComparisonBarsProps> = ({
  classA,
  classB,
  compareClassAId,
  compareClassBId,
}) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-1 animate-cascade-3 min-w-0">
      {/* Left: Dual Progress Bars for each metric */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111728] border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow min-w-0 overflow-hidden space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-3">
          <span className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
            SO SÁNH THÀNH PHẦN ĐIỂM
          </span>
          <div className="flex items-center gap-4 text-sm font-extrabold">
            <span className="text-blue-600 dark:text-blue-400">{classA.name}</span>
            <span className="text-slate-400 dark:text-slate-600 font-bold">VS</span>
            <span className="text-cyan-600 dark:text-cyan-400">{classB.name}</span>
          </div>
        </div>

        <div className="space-y-4 pt-1">
          {/* 1. Từ Vựng */}
          <div className="space-y-2.5 pb-4 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
              <span>Từ Vựng (55%)</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs sm:text-sm font-extrabold text-blue-600 dark:text-blue-400 w-24 sm:w-28 truncate shrink-0">{classA.name}:</span>
                <div className="flex-1 h-4 bg-slate-100 dark:bg-[#161d30] rounded-full overflow-hidden p-0.5 min-w-[50px]">
                  <AnimatedProgressBar
                    key={`comp-c1-a-${compareClassAId}-${compareClassBId}-${classA.avgCheck1}`}
                    pct={(classA.avgCheck1 / 10) * 100}
                    gradientClass="bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    delayMs={750}
                  />
                </div>
                <span className="text-sm font-mono font-black text-blue-600 dark:text-blue-400 w-16 text-right shrink-0">{format1Dec(classA.avgCheck1)} đ</span>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs sm:text-sm font-extrabold text-cyan-600 dark:text-cyan-400 w-24 sm:w-28 truncate shrink-0">{classB.name}:</span>
                <div className="flex-1 h-4 bg-slate-100 dark:bg-[#161d30] rounded-full overflow-hidden p-0.5 min-w-[50px]">
                  <AnimatedProgressBar
                    key={`comp-c1-b-${compareClassAId}-${compareClassBId}-${classA.avgCheck1}`}
                    pct={(classB.avgCheck1 / 10) * 100}
                    gradientClass="bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                    delayMs={750}
                  />
                </div>
                <span className="text-sm font-mono font-black text-cyan-600 dark:text-cyan-400 w-16 text-right shrink-0">{format1Dec(classB.avgCheck1)} đ</span>
              </div>
            </div>
          </div>

          {/* 2. Ngữ Pháp */}
          <div className="space-y-2.5 pb-4 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
              <span>Ngữ Pháp (35%)</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs sm:text-sm font-extrabold text-blue-600 dark:text-blue-400 w-24 sm:w-28 truncate shrink-0">{classA.name}:</span>
                <div className="flex-1 h-4 bg-slate-100 dark:bg-[#161d30] rounded-full overflow-hidden p-0.5 min-w-[50px]">
                  <AnimatedProgressBar
                    key={`comp-c2-a-${compareClassAId}-${compareClassBId}-${classA.avgCheck2}`}
                    pct={(classA.avgCheck2 / 10) * 100}
                    gradientClass="bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    delayMs={830}
                  />
                </div>
                <span className="text-sm font-mono font-black text-blue-600 dark:text-blue-400 w-16 text-right shrink-0">{format1Dec(classA.avgCheck2)} đ</span>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs sm:text-sm font-extrabold text-cyan-600 dark:text-cyan-400 w-24 sm:w-28 truncate shrink-0">{classB.name}:</span>
                <div className="flex-1 h-4 bg-slate-100 dark:bg-[#161d30] rounded-full overflow-hidden p-0.5 min-w-[50px]">
                  <AnimatedProgressBar
                    key={`comp-c2-b-${compareClassAId}-${compareClassBId}-${classA.avgCheck2}`}
                    pct={(classB.avgCheck2 / 10) * 100}
                    gradientClass="bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                    delayMs={830}
                  />
                </div>
                <span className="text-sm font-mono font-black text-cyan-600 dark:text-cyan-400 w-16 text-right shrink-0">{format1Dec(classB.avgCheck2)} đ</span>
              </div>
            </div>
          </div>

          {/* 3. BTVN */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
              <span>BTVN (10%)</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs sm:text-sm font-extrabold text-blue-600 dark:text-blue-400 w-24 sm:w-28 truncate shrink-0">{classA.name}:</span>
                <div className="flex-1 h-4 bg-slate-100 dark:bg-[#161d30] rounded-full overflow-hidden p-0.5 min-w-[50px]">
                  <AnimatedProgressBar
                    key={`comp-hw-a-${compareClassAId}-${compareClassBId}-${classA.avgHomework}`}
                    pct={(classA.avgHomework / 10) * 100}
                    gradientClass="bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    delayMs={910}
                  />
                </div>
                <span className="text-sm font-mono font-black text-blue-600 dark:text-blue-400 w-16 text-right shrink-0">{format1Dec(classA.avgHomework)} đ</span>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs sm:text-sm font-extrabold text-cyan-600 dark:text-cyan-400 w-24 sm:w-28 truncate shrink-0">{classB.name}:</span>
                <div className="flex-1 h-4 bg-slate-100 dark:bg-[#161d30] rounded-full overflow-hidden p-0.5 min-w-[50px]">
                  <AnimatedProgressBar
                    key={`comp-hw-b-${compareClassAId}-${compareClassBId}-${classA.avgHomework}`}
                    pct={(classB.avgHomework / 10) * 100}
                    gradientClass="bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                    delayMs={910}
                  />
                </div>
                <span className="text-sm font-mono font-black text-cyan-600 dark:text-cyan-400 w-16 text-right shrink-0">{format1Dec(classB.avgHomework)} đ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: 6-Tier Academic Distribution as a Grouped Column Chart */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111728] border-0 shadow-sm dark:shadow-xl hover:shadow-md transition-shadow min-w-0 overflow-hidden space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-white/5 pb-3 gap-2">
          <span className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Học Lực
          </span>
          <div className="flex items-center gap-4 text-xs font-extrabold">
            <span className="text-blue-600 dark:text-blue-400">{classA.name} ({classA.studentCount} HS)</span>
            <span className="text-slate-400 dark:text-slate-600 font-bold">VS</span>
            <span className="text-cyan-600 dark:text-cyan-400">{classB.name} ({classB.studentCount} HS)</span>
          </div>
        </div>

        {/* 6-Milestone Dual Column Histogram */}
        {(() => {
          const milestones = [
            { id: 'xs', name: 'Xuất sắc', range: '≥ 9.0đ', min: 9.0, max: 10.0 },
            { id: 'gioi', name: 'Giỏi', range: '8.0 – 8.9đ', min: 8.0, max: 8.99 },
            { id: 'kha', name: 'Khá', range: '6.5 – 7.9đ', min: 6.5, max: 7.99 },
            { id: 'tb', name: 'Trung bình', range: '5.0 – 6.4đ', min: 5.0, max: 6.49 },
            { id: 'yeu', name: 'Yếu', range: '3.5 – 4.9đ', min: 3.5, max: 4.99 },
            { id: 'kem', name: 'Kém', range: '< 3.5đ', min: 0, max: 3.49 },
          ];

          const getStudentScore = (s: any) => {
            if (s.ema_level && Number(s.ema_level) > 0) return Number(s.ema_level);
            const c1 = Number(s.avg_check_1 || 0);
            const c2 = Number(s.avg_check_2 || 0);
            const hw = Number(s.avg_homework || 0);
            const valid = [c1, c2, hw].filter(v => v > 0);
            return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
          };

          const statsList = milestones.map(m => {
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

          const maxPct = Math.max(1, ...statsList.map(s => Math.max(s.pctA, s.pctB)));

          return (
            <div className="pt-2 space-y-2">
              <div className="grid grid-cols-6 gap-2 sm:gap-3 items-end h-48 border-b border-slate-100 dark:border-white/5 pb-2">
                {statsList.map((m) => {
                  const hA = m.countA > 0 ? Math.max(10, Math.round((m.pctA / maxPct) * 100)) : 0;
                  const hB = m.countB > 0 ? Math.max(10, Math.round((m.pctB / maxPct) * 100)) : 0;

                  return (
                    <div key={m.id} className="flex flex-col items-center justify-end h-full gap-1">
                      {/* Dual Bar Container */}
                      <div className="flex items-end justify-center gap-1 sm:gap-1.5 w-full h-36">
                        {/* Class A Bar */}
                        <div className="flex-1 flex flex-col items-center justify-end h-full">
                          <span className={`text-[10px] font-mono font-bold leading-none mb-1 ${m.countA > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-700'}`}>
                            {m.countA}
                          </span>
                          <div
                            style={{ height: `${hA}%` }}
                            className={`w-full rounded-t-md transition-all duration-500 ${
                              m.countA > 0
                                ? 'bg-gradient-to-t from-blue-600 to-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                                : 'bg-slate-100 dark:bg-white/5 h-1'
                            }`}
                          />
                        </div>

                        {/* Class B Bar */}
                        <div className="flex-1 flex flex-col items-center justify-end h-full">
                          <span className={`text-[10px] font-mono font-bold leading-none mb-1 ${m.countB > 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-300 dark:text-slate-700'}`}>
                            {m.countB}
                          </span>
                          <div
                            style={{ height: `${hB}%` }}
                            className={`w-full rounded-t-md transition-all duration-500 ${
                              m.countB > 0
                                ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                                : 'bg-slate-100 dark:bg-white/5 h-1'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Milestone Labels Grid */}
              <div className="grid grid-cols-6 gap-2 sm:gap-3 text-center">
                {statsList.map((m) => (
                  <div key={m.id} className="min-w-0">
                    <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block truncate leading-tight">
                      {m.name}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono block leading-tight">
                      {m.range}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
