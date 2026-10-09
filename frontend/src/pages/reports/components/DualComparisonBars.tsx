import React from 'react';
import { AnimatedProgressBar } from './AnimatedProgressBar';
import { DualHistogram3D } from './DualHistogram3D';
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
          <div className="flex items-center gap-3">
            <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">{classA.name}</span>
            <span className="text-slate-400 dark:text-slate-600 font-bold text-xs">VS</span>
            <span className="text-base sm:text-lg font-black text-cyan-600 dark:text-cyan-400">{classB.name}</span>
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
                <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 w-28 sm:w-36 truncate shrink-0">{classA.name}:</span>
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
                <span className="text-base sm:text-lg font-black text-cyan-600 dark:text-cyan-400 w-28 sm:w-36 truncate shrink-0">{classB.name}:</span>
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
                <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 w-28 sm:w-36 truncate shrink-0">{classA.name}:</span>
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
                <span className="text-base sm:text-lg font-black text-cyan-600 dark:text-cyan-400 w-28 sm:w-36 truncate shrink-0">{classB.name}:</span>
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
                <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 w-28 sm:w-36 truncate shrink-0">{classA.name}:</span>
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
                <span className="text-base sm:text-lg font-black text-cyan-600 dark:text-cyan-400 w-28 sm:w-36 truncate shrink-0">{classB.name}:</span>
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

      {/* Right: 6-Tier Academic Distribution as a True 3D Isometric Histogram */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111728] border-0 shadow-sm dark:shadow-xl hover:shadow-md transition-shadow min-w-0 overflow-hidden space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-white/5 pb-3 gap-2">
          <span className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Học Lực
          </span>
          <div className="flex items-center gap-3">
            <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">
              {classA.name} <span className="text-xs font-bold text-slate-400 dark:text-slate-500">({classA.studentCount} HS)</span>
            </span>
            <span className="text-slate-400 dark:text-slate-600 font-bold text-xs">VS</span>
            <span className="text-base sm:text-lg font-black text-cyan-600 dark:text-cyan-400">
              {classB.name} <span className="text-xs font-bold text-slate-400 dark:text-slate-500">({classB.studentCount} HS)</span>
            </span>
          </div>
        </div>

        {/* 6-Milestone Dual 3D Isometric Histogram */}
        <DualHistogram3D classA={classA} classB={classB} />
      </div>
    </div>
  );
};
