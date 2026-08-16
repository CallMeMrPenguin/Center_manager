import React from 'react';
import { AnimatedProgressBar } from './AnimatedProgressBar';
import { TIERS_CONFIG } from '../types';
import { format1Dec } from '../../../utils';

interface DualComparisonBarsProps {
  classA: any;
  classB: any;
}

export const DualComparisonBars: React.FC<DualComparisonBarsProps> = ({ classA, classB }) => {
  return (
    <div className="space-y-6 pt-1 animate-cascade-3">
      {/* 1. Component Scores Dual Progress Bars */}
      <div className="p-5 rounded-2xl bg-[#0b0f19] border border-[#1b253b] space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#161f33] pb-3">
          <span className="text-xs font-black uppercase tracking-wider text-white">SO SÁNH THÀNH PHẦN ĐIỂM</span>
          <div className="flex items-center gap-4 text-xs font-extrabold">
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
              {classA.name}
            </span>
            <span className="text-slate-600 font-bold">VS</span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
              {classB.name}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Check 1 */}
          <div className="space-y-2 p-3.5 rounded-xl bg-[#0e1322] border border-[#1e2744]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-300 uppercase">Check 1 (35%)</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-400 w-20 truncate shrink-0">{classA.name}:</span>
                <div className="flex-1 h-2.5 bg-[#090d16] rounded-full overflow-hidden p-0.5 border border-white/5">
                  <AnimatedProgressBar pct={(classA.avgCheck1 / 10) * 100} color="#3b82f6" delayMs={500} />
                </div>
                <span className="text-xs font-mono font-black text-blue-300 w-11 text-right shrink-0">{format1Dec(classA.avgCheck1)} đ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-cyan-400 w-20 truncate shrink-0">{classB.name}:</span>
                <div className="flex-1 h-2.5 bg-[#090d16] rounded-full overflow-hidden p-0.5 border border-white/5">
                  <AnimatedProgressBar pct={(classB.avgCheck1 / 10) * 100} color="#06b6d4" delayMs={600} />
                </div>
                <span className="text-xs font-mono font-black text-cyan-300 w-11 text-right shrink-0">{format1Dec(classB.avgCheck1)} đ</span>
              </div>
            </div>
          </div>

          {/* Check 2 */}
          <div className="space-y-2 p-3.5 rounded-xl bg-[#0e1322] border border-[#1e2744]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-300 uppercase">Check 2 (55%)</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-400 w-20 truncate shrink-0">{classA.name}:</span>
                <div className="flex-1 h-2.5 bg-[#090d16] rounded-full overflow-hidden p-0.5 border border-white/5">
                  <AnimatedProgressBar pct={(classA.avgCheck2 / 10) * 100} color="#3b82f6" delayMs={700} />
                </div>
                <span className="text-xs font-mono font-black text-blue-300 w-11 text-right shrink-0">{format1Dec(classA.avgCheck2)} đ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-cyan-400 w-20 truncate shrink-0">{classB.name}:</span>
                <div className="flex-1 h-2.5 bg-[#090d16] rounded-full overflow-hidden p-0.5 border border-white/5">
                  <AnimatedProgressBar pct={(classB.avgCheck2 / 10) * 100} color="#06b6d4" delayMs={800} />
                </div>
                <span className="text-xs font-mono font-black text-cyan-300 w-11 text-right shrink-0">{format1Dec(classB.avgCheck2)} đ</span>
              </div>
            </div>
          </div>

          {/* Homework */}
          <div className="space-y-2 p-3.5 rounded-xl bg-[#0e1322] border border-[#1e2744]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-300 uppercase">Homework (10%)</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-400 w-20 truncate shrink-0">{classA.name}:</span>
                <div className="flex-1 h-2.5 bg-[#090d16] rounded-full overflow-hidden p-0.5 border border-white/5">
                  <AnimatedProgressBar pct={(classA.avgHomework / 10) * 100} color="#3b82f6" delayMs={900} />
                </div>
                <span className="text-xs font-mono font-black text-blue-300 w-11 text-right shrink-0">{format1Dec(classA.avgHomework)} đ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-cyan-400 w-20 truncate shrink-0">{classB.name}:</span>
                <div className="flex-1 h-2.5 bg-[#090d16] rounded-full overflow-hidden p-0.5 border border-white/5">
                  <AnimatedProgressBar pct={(classB.avgHomework / 10) * 100} color="#06b6d4" delayMs={1000} />
                </div>
                <span className="text-xs font-mono font-black text-cyan-300 w-11 text-right shrink-0">{format1Dec(classB.avgHomework)} đ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 6-Tier Academic Rank Distribution Duel — Symmetrical Tug-of-War Comparative Ladder (Matching Reference Screenshot) */}
      <div className="p-6 rounded-2xl bg-[#0b0f19] border border-[#1b253b] space-y-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between border-b border-[#161f33] pb-4 gap-2">
          <span className="text-sm font-black uppercase tracking-wider text-white">
            PHÂN BỐ 6 HẠNG BẬC HỌC LỰC
          </span>
          <div className="flex items-center gap-5 text-xs font-extrabold">
            <span className="text-blue-400 font-extrabold">{classA.name} ({classA.studentCount} HS)</span>
            <span className="text-cyan-400 font-extrabold">{classB.name} ({classB.studentCount} HS)</span>
          </div>
        </div>

        <div className="space-y-3.5 max-w-4xl mx-auto">
          {TIERS_CONFIG.slice().reverse().map((tier, tierIdx) => {
            const countA = classA.tierDistribution.find((t: any) => t.tier === tier.tier)?.count || 0;
            const pctA = classA.tierDistribution.find((t: any) => t.tier === tier.tier)?.pct || 0;
            const countB = classB.tierDistribution.find((t: any) => t.tier === tier.tier)?.count || 0;
            const pctB = classB.tierDistribution.find((t: any) => t.tier === tier.tier)?.pct || 0;

            return (
              <div key={tier.tier} className="flex items-center justify-between gap-4">
                {/* Left: Class A Count & Bar */}
                <div className="flex-1 flex items-center justify-end gap-3 min-w-0">
                  <span className="text-xs font-mono font-bold text-white shrink-0">
                    {countA} ({pctA}%)
                  </span>
                  <div className="flex-1 max-w-[200px] h-3 bg-[#0d1222] rounded-full overflow-hidden flex justify-end p-0.5 border border-white/5 relative">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(59,130,246,0.6)] flex items-center justify-end"
                      style={{ width: `${Math.max(pctA > 0 ? 6 : 0, pctA)}%` }}
                    >
                      {pctA > 0 && <span className="w-2 h-2 rounded-full bg-blue-300 shrink-0 mr-0.5" />}
                    </div>
                  </div>
                </div>

                {/* Center: Tier Pill Capsule */}
                <div className="w-44 py-1.5 px-4 bg-[#111728] border border-[#232d4e] rounded-full flex items-center justify-center gap-2.5 shrink-0 shadow-inner">
                  <img src={tier.badge} alt={tier.name} className="w-5 h-5 object-contain shrink-0 drop-shadow" />
                  <span className="text-xs font-black text-white truncate">{tier.name}</span>
                </div>

                {/* Right: Class B Bar & Count */}
                <div className="flex-1 flex items-center justify-start gap-3 min-w-0">
                  <div className="flex-1 max-w-[200px] h-3 bg-[#0d1222] rounded-full overflow-hidden p-0.5 border border-white/5 relative">
                    <div
                      className="h-full bg-cyan-400 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(6,182,212,0.6)] flex items-center justify-end"
                      style={{ width: `${Math.max(pctB > 0 ? 6 : 0, pctB)}%` }}
                    >
                      {pctB > 0 && <span className="w-2 h-2 rounded-full bg-white shrink-0 mr-0.5" />}
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-white shrink-0">
                    {countB} ({pctB}%)
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
