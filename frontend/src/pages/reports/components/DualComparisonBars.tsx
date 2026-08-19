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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1 animate-cascade-3">
      {/* Left: Dual Progress Bars for each metric */}
      <div className="p-5 rounded-xl bg-[#090d17] border border-[#192236] space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <span className="text-xs font-black uppercase tracking-wider text-white">
            SO SÁNH THÀNH PHẦN ĐIỂM
          </span>
          <div className="flex items-center gap-4 text-xs font-extrabold">
            <div className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
              <span>{classA.name}</span>
            </div>
            <span className="text-slate-600 font-bold">VS</span>
            <div className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
              <span>{classB.name}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* 1. Từ Vựng */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-400">
              <span>Từ Vựng (35%)</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-blue-400 w-24 truncate shrink-0">{classA.name}:</span>
                <div className="flex-1 h-3 bg-[#111726] rounded-md overflow-hidden p-0.5 border border-white/5">
                  <AnimatedProgressBar
                    key={`comp-c1-a-${compareClassAId}-${compareClassBId}-${classA.avgCheck1}`}
                    pct={(classA.avgCheck1 / 10) * 100}
                    gradientClass="bg-blue-500 rounded-sm shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    delayMs={750}
                  />
                </div>
                <span className="text-xs font-mono font-black text-blue-300 w-12 text-right shrink-0">{format1Dec(classA.avgCheck1)} đ</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-cyan-400 w-24 truncate shrink-0">{classB.name}:</span>
                <div className="flex-1 h-3 bg-[#111726] rounded-md overflow-hidden p-0.5 border border-white/5">
                  <AnimatedProgressBar
                    key={`comp-c1-b-${compareClassAId}-${compareClassBId}-${classB.avgCheck1}`}
                    pct={(classB.avgCheck1 / 10) * 100}
                    gradientClass="bg-cyan-500 rounded-sm shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                    delayMs={750}
                  />
                </div>
                <span className="text-xs font-mono font-black text-cyan-300 w-12 text-right shrink-0">{format1Dec(classB.avgCheck1)} đ</span>
              </div>
            </div>
          </div>

          {/* 2. Ngữ Pháp */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-400">
              <span>Ngữ Pháp (55%)</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-blue-400 w-24 truncate shrink-0">{classA.name}:</span>
                <div className="flex-1 h-3 bg-[#111726] rounded-md overflow-hidden p-0.5 border border-white/5">
                  <AnimatedProgressBar
                    key={`comp-c2-a-${compareClassAId}-${compareClassBId}-${classA.avgCheck2}`}
                    pct={(classA.avgCheck2 / 10) * 100}
                    gradientClass="bg-blue-500 rounded-sm shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    delayMs={830}
                  />
                </div>
                <span className="text-xs font-mono font-black text-blue-300 w-12 text-right shrink-0">{format1Dec(classA.avgCheck2)} đ</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-cyan-400 w-24 truncate shrink-0">{classB.name}:</span>
                <div className="flex-1 h-3 bg-[#111726] rounded-md overflow-hidden p-0.5 border border-white/5">
                  <AnimatedProgressBar
                    key={`comp-c2-b-${compareClassAId}-${compareClassBId}-${classB.avgCheck2}`}
                    pct={(classB.avgCheck2 / 10) * 100}
                    gradientClass="bg-cyan-500 rounded-sm shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                    delayMs={830}
                  />
                </div>
                <span className="text-xs font-mono font-black text-cyan-300 w-12 text-right shrink-0">{format1Dec(classB.avgCheck2)} đ</span>
              </div>
            </div>
          </div>

          {/* 3. Homework */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-400">
              <span>Homework (10%)</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-blue-400 w-24 truncate shrink-0">{classA.name}:</span>
                <div className="flex-1 h-3 bg-[#111726] rounded-md overflow-hidden p-0.5 border border-white/5">
                  <AnimatedProgressBar
                    key={`comp-hw-a-${compareClassAId}-${compareClassBId}-${classA.avgHomework}`}
                    pct={(classA.avgHomework / 10) * 100}
                    gradientClass="bg-blue-500 rounded-sm shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    delayMs={910}
                  />
                </div>
                <span className="text-xs font-mono font-black text-blue-300 w-12 text-right shrink-0">{format1Dec(classA.avgHomework)} đ</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-cyan-400 w-24 truncate shrink-0">{classB.name}:</span>
                <div className="flex-1 h-3 bg-[#111726] rounded-md overflow-hidden p-0.5 border border-white/5">
                  <AnimatedProgressBar
                    key={`comp-hw-b-${compareClassAId}-${compareClassBId}-${classB.avgHomework}`}
                    pct={(classB.avgHomework / 10) * 100}
                    gradientClass="bg-cyan-500 rounded-sm shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                    delayMs={910}
                  />
                </div>
                <span className="text-xs font-mono font-black text-cyan-300 w-12 text-right shrink-0">{format1Dec(classB.avgHomework)} đ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: 6-Tier Academic Rank Distribution Duel — Symmetrical Tug-of-War Comparative Ladder */}
      <div className="p-5 rounded-xl bg-[#090d17] border border-[#192236] space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between border-b border-white/5 pb-3 gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Award size={16} className="text-amber-400" />
            Phân Bố 6 Hạng Bậc Học Lực
          </span>
          <div className="flex items-center gap-4 text-xs font-extrabold">
            <div className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
              <span>{classA.name} ({classA.studentCount} HS)</span>
            </div>
            <span className="text-slate-600 font-bold">VS</span>
            <div className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
              <span>{classB.name} ({classB.studentCount} HS)</span>
            </div>
          </div>
        </div>

        {/* 8-Tier Dual Butterfly Comparison Ladder (Quán Quân -> Đồng) */}
        <div className="space-y-2.5">
          {TIERS_CONFIG.slice().reverse().map((tier, tierIdx) => {
            const countA = classA.tierDistribution.find((t: any) => t.tier === tier.tier)?.count || 0;
            const pctA = classA.tierDistribution.find((t: any) => t.tier === tier.tier)?.pct || 0;
            const countB = classB.tierDistribution.find((t: any) => t.tier === tier.tier)?.count || 0;
            const pctB = classB.tierDistribution.find((t: any) => t.tier === tier.tier)?.pct || 0;

            return (
              <div
                key={tier.tier}
                className="bg-[#0c101d] border border-[#1b253b] hover:border-indigo-500/30 py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-between gap-4 group"
              >
                {/* LEFT: Class A Bar & Percentage */}
                <div className="flex-1 flex items-center justify-end gap-3 min-w-0">
                  <span className="text-xs font-mono font-black text-blue-400 shrink-0">
                    {countA} HS <span className="text-[11px] text-slate-400 font-normal">({pctA}%)</span>
                  </span>
                  <div className="flex-1 h-3.5 bg-[#121829] rounded-full overflow-hidden flex justify-end p-0.5 border border-white/5">
                    <AnimatedProgressBar
                      key={`bench-a-${compareClassAId}-${compareClassBId}-${tier.tier}-${pctA}`}
                      pct={pctA}
                      gradientClass="bg-gradient-to-l from-blue-500 to-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                      delayMs={750 + tierIdx * 60}
                    />
                  </div>
                </div>

                {/* CENTER: Tier Badge, Name & Score */}
                <div className="flex items-center justify-center gap-2.5 w-48 shrink-0 py-1.5 px-3 bg-[#121728] rounded-xl border border-white/5 shadow-inner">
                  <div className="w-9 h-9 flex items-center justify-center shrink-0">
                    <img src={tier.badge} alt={tier.name} className={`w-full h-full object-contain ${tier.scale || 'scale-100'} drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]`} />
                  </div>
                  <div className="text-center">
                    <span className={`text-xs font-black block leading-tight ${tier.text}`}>{tier.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono font-semibold">{tier.minScore} - {tier.maxScore}đ</span>
                  </div>
                </div>

                {/* RIGHT: Class B Bar & Percentage */}
                <div className="flex-1 flex items-center justify-start gap-3 min-w-0">
                  <div className="flex-1 h-3.5 bg-[#121829] rounded-full overflow-hidden p-0.5 border border-white/5">
                    <AnimatedProgressBar
                      key={`bench-b-${compareClassAId}-${compareClassBId}-${tier.tier}-${pctB}`}
                      pct={pctB}
                      gradientClass="bg-gradient-to-r from-cyan-500 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                      delayMs={750 + tierIdx * 80}
                    />
                  </div>
                  <span className="text-xs font-mono font-black text-cyan-400 shrink-0">
                    {countB} HS <span className="text-[11px] text-slate-400 font-normal">({pctB}%)</span>
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
