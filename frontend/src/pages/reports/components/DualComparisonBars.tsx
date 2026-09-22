import React from 'react';
import { Award } from 'lucide-react';
import { AnimatedProgressBar } from './AnimatedProgressBar';
import { TIERS_CONFIG } from '../types';
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
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
              <span>{classA.name}</span>
            </div>
            <span className="text-slate-400 dark:text-slate-600 font-bold">VS</span>
            <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
              <span>{classB.name}</span>
            </div>
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

      {/* Right: 6-Tier Academic Rank Distribution Duel — Clean Borderless Rows */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111728] border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow min-w-0 overflow-hidden space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-white/5 pb-3 gap-2">
          <span className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Award size={18} className="text-amber-500" />
            Phân Bố 6 Hạng Bậc Học Lực
          </span>
          <div className="flex items-center gap-4 text-sm font-extrabold">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
              <span>{classA.name} ({classA.studentCount} HS)</span>
            </div>
            <span className="text-slate-400 dark:text-slate-600 font-bold">VS</span>
            <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
              <span>{classB.name} ({classB.studentCount} HS)</span>
            </div>
          </div>
        </div>

        {/* Clean Symmetrical Comparison Ladder (No Nested Boxes) */}
        <div className="space-y-1 pt-1">
          {TIERS_CONFIG.slice().reverse().map((tier, tierIdx) => {
            const countA = classA.tierDistribution.find((t: any) => t.tier === tier.tier)?.count || 0;
            const pctA = classA.tierDistribution.find((t: any) => t.tier === tier.tier)?.pct || 0;
            const countB = classB.tierDistribution.find((t: any) => t.tier === tier.tier)?.count || 0;
            const pctB = classB.tierDistribution.find((t: any) => t.tier === tier.tier)?.pct || 0;

            return (
              <div
                key={tier.tier}
                className="hover:bg-slate-50/80 dark:hover:bg-white/5 py-2 px-2.5 rounded-xl transition-all duration-150 flex items-center justify-between gap-3 min-w-0"
              >
                {/* LEFT: Class A Bar & Percentage */}
                <div className="flex-1 flex items-center justify-end gap-2.5 min-w-0">
                  <span className="text-xs font-mono font-black text-blue-600 dark:text-blue-400 shrink-0">
                    {countA} HS <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">({pctA}%)</span>
                  </span>
                  <div className="flex-1 h-3.5 bg-slate-100 dark:bg-[#161d30] rounded-full overflow-hidden flex justify-end p-0.5 min-w-[32px]">
                    <AnimatedProgressBar
                      key={`bench-a-${compareClassAId}-${compareClassBId}-${tier.tier}-${pctA}`}
                      pct={pctA}
                      gradientClass="bg-gradient-to-l from-blue-500 to-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                      delayMs={750 + tierIdx * 60}
                    />
                  </div>
                </div>

                {/* CENTER: Tier Badge & Name (Clean, Borderless) */}
                <div className="flex items-center justify-center gap-1.5 w-32 shrink-0 py-1 px-2 rounded-lg bg-slate-100/70 dark:bg-white/5">
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    <img src={tier.badge} alt={tier.name} className={`w-full h-full object-contain ${tier.scale || 'scale-100'}`} />
                  </div>
                  <div className="text-center min-w-0">
                    <span className={`text-xs font-black block leading-tight truncate ${tier.text}`}>{tier.name}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold leading-none">{tier.minScore}-{tier.maxScore}đ</span>
                  </div>
                </div>

                {/* RIGHT: Class B Bar & Percentage */}
                <div className="flex-1 flex items-center justify-start gap-2.5 min-w-0">
                  <div className="flex-1 h-3.5 bg-slate-100 dark:bg-[#161d30] rounded-full overflow-hidden p-0.5 min-w-[32px]">
                    <AnimatedProgressBar
                      key={`bench-b-${compareClassAId}-${compareClassBId}-${tier.tier}-${pctB}`}
                      pct={pctB}
                      gradientClass="bg-gradient-to-r from-cyan-500 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                      delayMs={750 + tierIdx * 80}
                    />
                  </div>
                  <span className="text-xs font-mono font-black text-cyan-600 dark:text-cyan-400 shrink-0">
                    {countB} HS <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">({pctB}%)</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
