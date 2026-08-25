import React, { useRef } from 'react';
import { Play, Sparkles, RefreshCw, Flame, SunMedium } from 'lucide-react';
import { TIERS_CONFIG, StudentTier } from '../../reports/types';
import { RankEmblemAssemble, RankEmblemAssembleHandle } from './RankEmblemAssemble';
import { RankShowcaseConfig } from '../types';

interface RankAllGridViewProps {
  config: RankShowcaseConfig;
  onSelectTier: (tier: StudentTier) => void;
}

export const RankAllGridView: React.FC<RankAllGridViewProps> = ({
  config,
  onSelectTier,
}) => {
  const emblemRefs = useRef<Record<number, RankEmblemAssembleHandle | null>>({});

  const handleAssembleAll = () => {
    Object.values(emblemRefs.current).forEach((c, idx) => {
      setTimeout(() => c?.assemble(), idx * 120);
    });
  };

  const handleDisassembleAll = () => {
    Object.values(emblemRefs.current).forEach((c, idx) => {
      setTimeout(() => c?.disassemble(), idx * 80);
    });
  };

  const handleBlastAll = () => {
    Object.values(emblemRefs.current).forEach((c, idx) => {
      setTimeout(() => c?.blast(), idx * 70);
    });
  };

  const handleSheenAll = () => {
    Object.values(emblemRefs.current).forEach((c, idx) => {
      setTimeout(() => c?.triggerSheen(), idx * 90);
    });
  };

  return (
    <div className="space-y-6 select-none">
      {/* Action Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-[#0c0f1e] border border-[#1e2746] rounded-2xl">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            <span>Toàn Bộ 8 Cấp Bậc (All 8 Tiers Grid)</span>
          </h3>
          <p className="text-xs text-slate-400 font-semibold">Tất cả biểu tượng giữ nguyên độ phân giải HD cùng bụi phát sáng và hiệu ứng dập khóa chuẩn game</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAssembleAll}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#5c36f5] hover:bg-[#704df7] text-white text-xs font-black transition cursor-pointer shadow-md"
          >
            <Play size={13} fill="currentColor" />
            <span>Hợp Thể Cả 8 Rank</span>
          </button>

          <button
            onClick={handleSheenAll}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 transition cursor-pointer"
          >
            <SunMedium size={13} />
            <span>Quét Ánh Kim Toàn Bộ</span>
          </button>

          <button
            onClick={handleBlastAll}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 transition cursor-pointer"
          >
            <Flame size={13} />
            <span>Sóng Nổ Hạt</span>
          </button>

          <button
            onClick={handleDisassembleAll}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Tan Biến</span>
          </button>
        </div>
      </div>

      {/* 8 Ranks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {TIERS_CONFIG.map((tier) => {
          return (
            <div
              key={tier.tier}
              className="p-5 bg-[#0a0d1a] border border-[#1b2444] rounded-3xl flex flex-col items-center justify-between text-center transition hover:border-[#5c36f5]/50 group"
            >
              {/* Top Tier Badge */}
              <div className="w-full flex items-center justify-between">
                <span
                  className="text-[10px] font-black px-2.5 py-0.5 rounded-md border"
                  style={{
                    backgroundColor: `${tier.color}15`,
                    borderColor: `${tier.color}40`,
                    color: tier.color,
                  }}
                >
                  Tier {tier.tier}
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  {tier.minScore} - {tier.maxScore}đ
                </span>
              </div>

              {/* Game-Style Emblem Assemble Canvas */}
              <div className="my-2 relative flex items-center justify-center">
                <RankEmblemAssemble
                  ref={(el) => { emblemRefs.current[tier.tier] = el; }}
                  imageSrc={tier.badge}
                  size={160}
                  tierColor={tier.color}
                  tierName={tier.name}
                  particleCount={30}
                  enableMouseInteraction={config.enableMouseInteraction}
                />
              </div>

              {/* Title & Info */}
              <div className="space-y-0.5">
                <h4 className="text-base font-black text-white">{tier.name}</h4>
                <p className="text-xs text-slate-400 font-semibold">{tier.title}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 mt-4 w-full pt-3 border-t border-white/5">
                <button
                  onClick={() => emblemRefs.current[tier.tier]?.assemble()}
                  className="flex-1 py-1 rounded-lg bg-white/5 hover:bg-[#5c36f5] hover:text-white text-slate-300 text-[11px] font-bold transition cursor-pointer border border-white/10"
                >
                  Hợp thể
                </button>
                <button
                  onClick={() => emblemRefs.current[tier.tier]?.triggerSheen()}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-slate-400 text-[11px] transition cursor-pointer border border-white/10"
                  title="Quét ánh kim"
                >
                  <SunMedium size={13} />
                </button>
                <button
                  onClick={() => emblemRefs.current[tier.tier]?.blast()}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 text-[11px] transition cursor-pointer border border-white/10"
                  title="Sóng nổ"
                >
                  <Flame size={13} />
                </button>
                <button
                  onClick={() => onSelectTier(tier)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white text-[11px] transition cursor-pointer border border-white/10"
                  title="Mở sân khấu chi tiết"
                >
                  <Sparkles size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
