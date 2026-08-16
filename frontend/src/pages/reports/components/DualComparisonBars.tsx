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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1 animate-cascade-3">
      {/* Left: Dual Progress Bars */}
      <div className="p-5 rounded-xl bg-[#0e1322] border border-[#1e2744] space-y-4">
        <div className="flex items-center justify-between border-b border-[#182236] pb-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-300">So Sánh Thành Phần Điểm</span>
          <div className="flex items-center gap-3 text-[10px] font-bold">
            <span className="flex items-center gap-1 text-blue-400"><span className="w-2 h-2 rounded-sm bg-blue-500"></span> {classA.name}</span>
            <span className="flex items-center gap-1 text-cyan-400"><span className="w-2 h-2 rounded-sm bg-cyan-500"></span> {classB.name}</span>
          </div>
        </div>

        {/* Check 1 */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase">Check 1 (35%)</span>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-blue-400 w-24 truncate shrink-0">{classA.name}:</span>
              <div className="flex-1 h-2.5 bg-[#090d16] rounded-full overflow-hidden p-0.5 border border-white/5">
                <AnimatedProgressBar pct={(classA.avgCheck1 / 10) * 100} color="#3b82f6" delayMs={500} />
              </div>
              <span className="text-xs font-mono font-black text-blue-300 w-12 text-right shrink-0">{format1Dec(classA.avgCheck1)} đ</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-cyan-400 w-24 truncate shrink-0">{classB.name}:</span>
              <div className="flex-1 h-2.5 bg-[#090d16] rounded-full overflow-hidden p-0.5 border border-white/5">
                <AnimatedProgressBar pct={(classB.avgCheck1 / 10) * 100} color="#06b6d4" delayMs={600} />
              </div>
              <span className="text-xs font-mono font-black text-cyan-300 w-12 text-right shrink-0">{format1Dec(classB.avgCheck1)} đ</span>
            </div>
          </div>
        </div>

        {/* Check 2 */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase">Check 2 (55%)</span>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-blue-400 w-24 truncate shrink-0">{classA.name}:</span>
              <div className="flex-1 h-2.5 bg-[#090d16] rounded-full overflow-hidden p-0.5 border border-white/5">
                <AnimatedProgressBar pct={(classA.avgCheck2 / 10) * 100} color="#3b82f6" delayMs={700} />
              </div>
              <span className="text-xs font-mono font-black text-blue-300 w-12 text-right shrink-0">{format1Dec(classA.avgCheck2)} đ</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-cyan-400 w-24 truncate shrink-0">{classB.name}:</span>
              <div className="flex-1 h-2.5 bg-[#090d16] rounded-full overflow-hidden p-0.5 border border-white/5">
                <AnimatedProgressBar pct={(classB.avgCheck2 / 10) * 100} color="#06b6d4" delayMs={800} />
              </div>
              <span className="text-xs font-mono font-black text-cyan-300 w-12 text-right shrink-0">{format1Dec(classB.avgCheck2)} đ</span>
            </div>
          </div>
        </div>

        {/* Homework */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase">Homework (10%)</span>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-blue-400 w-24 truncate shrink-0">{classA.name}:</span>
              <div className="flex-1 h-2.5 bg-[#090d16] rounded-full overflow-hidden p-0.5 border border-white/5">
                <AnimatedProgressBar pct={(classA.avgHomework / 10) * 100} color="#3b82f6" delayMs={900} />
              </div>
              <span className="text-xs font-mono font-black text-blue-300 w-12 text-right shrink-0">{format1Dec(classA.avgHomework)} đ</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-cyan-400 w-24 truncate shrink-0">{classB.name}:</span>
              <div className="flex-1 h-2.5 bg-[#090d16] rounded-full overflow-hidden p-0.5 border border-white/5">
                <AnimatedProgressBar pct={(classB.avgHomework / 10) * 100} color="#06b6d4" delayMs={1000} />
              </div>
              <span className="text-xs font-mono font-black text-cyan-300 w-12 text-right shrink-0">{format1Dec(classB.avgHomework)} đ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: 6-Tier Dual Butterfly Comparison Ladder */}
      <div className="p-5 rounded-xl bg-[#0e1322] border border-[#1e2744] space-y-3">
        <div className="flex items-center justify-between border-b border-[#182236] pb-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-300">Phân Bố 6 Hạng Bậc Học Lực</span>
          <div className="flex items-center gap-4 text-[10px] font-bold">
            <span className="text-blue-400">{classA.name} ({classA.studentCount} HS)</span>
            <span className="text-cyan-400">{classB.name} ({classB.studentCount} HS)</span>
          </div>
        </div>

        <div className="space-y-2">
          {TIERS_CONFIG.slice().reverse().map(tier => {
            const countA = classA.tierDistribution.find((t: any) => t.tier === tier.tier)?.count || 0;
            const pctA = classA.tierDistribution.find((t: any) => t.tier === tier.tier)?.pct || 0;
            const countB = classB.tierDistribution.find((t: any) => t.tier === tier.tier)?.count || 0;
            const pctB = classB.tierDistribution.find((t: any) => t.tier === tier.tier)?.pct || 0;

            return (
              <div key={tier.tier} className="flex items-center gap-2">
                <div className="flex-1 flex items-center justify-end gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-blue-300">{countA} ({pctA}%)</span>
                  <div className="w-24 h-2 bg-[#090d16] rounded-full overflow-hidden flex justify-end">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${pctA}%` }} />
                  </div>
                </div>

                <div className="w-28 flex items-center justify-center gap-1.5 py-0.5 px-1 rounded-lg bg-[#141b2e] border border-white/5 shrink-0">
                  <img src={tier.badge} alt={tier.name} className="w-4 h-4 object-contain shrink-0" />
                  <span className="text-[10px] font-black text-slate-200 truncate">{tier.name}</span>
                </div>

                <div className="flex-1 flex items-center justify-start gap-1.5">
                  <div className="w-24 h-2 bg-[#090d16] rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full transition-all duration-700" style={{ width: `${pctB}%` }} />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-cyan-300">{countB} ({pctB}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
