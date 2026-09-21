import React, { useMemo } from 'react';
import { Info } from 'lucide-react';
import { AnimatedProgressBar } from './AnimatedProgressBar';
import { TIERS_CONFIG, getStudentTier } from '../types';
import { computeStudentOverallScore } from '../utils';

interface TierDistributionCardProps {
  studentRankings: any[];
  selectedClassId: string;
  selectedDistFilter: 'all' | number;
  setSelectedDistFilter: (val: 'all' | number | ((prev: 'all' | number) => 'all' | number)) => void;
}

export const TierDistributionCard: React.FC<TierDistributionCardProps> = ({
  studentRankings,
  selectedClassId,
  selectedDistFilter,
  setSelectedDistFilter,
}) => {
  const tierDistribution = useMemo(() => {
    const rawList = selectedClassId ? studentRankings.filter(r => String(r.class_id) === selectedClassId) : studentRankings;
    const total = rawList ? rawList.length : 0;
    if (total === 0) {
      return {
        tiers: TIERS_CONFIG.slice().reverse().map(t => ({ ...t, count: 0, pct: 0 })),
        total: 0
      };
    }

    const counts: Record<number, number> = {};
    rawList.forEach(s => {
      const score = computeStudentOverallScore(s);
      const tierObj = getStudentTier(score);
      counts[tierObj.tier] = (counts[tierObj.tier] || 0) + 1;
    });

    return {
      tiers: TIERS_CONFIG.slice().reverse().map(t => ({
        ...t,
        count: counts[t.tier] || 0,
        pct: Math.round(((counts[t.tier] || 0) / total) * 100)
      })),
      total
    };
  }, [studentRankings, selectedClassId]);

  return (
    <div className="bg-white dark:bg-[#0b0f19] border border-slate-300/80 dark:border-[#1b253b] p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(15,23,42,0.08),0_2px_4px_-1px_rgba(15,23,42,0.04)] dark:shadow-xl flex flex-col gap-5 animate-cascade-1">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-[#161f33] pb-4">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider">PHÂN BỐ HẠNG BẬC HỌC LỰC</h4>
          <div className="group relative">
            <Info size={14} className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors" />
            <div className="absolute left-0 top-full mt-1.5 hidden group-hover:block z-50 w-64 p-2.5 rounded-xl bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#28334e] text-[11px] text-slate-700 dark:text-slate-300 shadow-xl pointer-events-none">
              Phân bố học sinh theo 8 cấp bậc danh hiệu học lực. Nhấp vào từng bậc để lọc danh sách học sinh.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedDistFilter !== 'all' && (
            <button
              onClick={() => setSelectedDistFilter('all')}
              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30 transition cursor-pointer mr-2"
            >
              Bỏ Lọc Hạng
            </button>
          )}
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Tổng số: <strong className="text-slate-900 dark:text-white font-mono">{tierDistribution.total}</strong> học sinh
          </span>
        </div>
      </div>

      <div className="space-y-3.5">
        {tierDistribution.tiers.map(t => {
          const isSelected = selectedDistFilter === t.tier;
          return (
            <div
              key={t.tier}
              onClick={() => setSelectedDistFilter(prev => prev === t.tier ? 'all' : t.tier)}
              className={`flex items-center justify-between gap-4 py-2 px-3 rounded-xl transition-all cursor-pointer select-none ${isSelected ? 'bg-indigo-50 dark:bg-white/10 ring-1 ring-indigo-200 dark:ring-white/20' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}
            >
              <div className="flex items-center gap-3 w-36 shrink-0">
                <img src={t.badge} alt={t.name} className="w-9 h-9 object-contain shrink-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{t.name}</span>
              </div>
              <div className="flex-1 h-3 bg-slate-100 dark:bg-[#0e1424] rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-white/5 mx-2">
                <AnimatedProgressBar
                  key={`deep-tier-${selectedClassId}-${t.tier}-${t.pct}`}
                  pct={t.pct}
                  color={t.color}
                  delayMs={750 + (8 - t.tier) * 60}
                />
              </div>
              <span className="text-sm font-black text-slate-900 dark:text-white font-mono w-10 text-right shrink-0">{t.count}</span>
              <span className="text-sm font-black font-mono w-14 text-right shrink-0" style={{ color: t.color }}>{t.pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
