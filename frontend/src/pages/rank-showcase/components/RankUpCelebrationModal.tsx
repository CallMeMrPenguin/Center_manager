import React, { useRef, useState } from 'react';
import { Trophy, X, ArrowRight, RefreshCw, CheckCircle2, SunMedium } from 'lucide-react';
import { TIERS_CONFIG, StudentTier } from '../../reports/types';
import { RankEmblemAssemble, RankEmblemAssembleHandle } from './RankEmblemAssemble';

interface RankUpCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTier?: StudentTier;
}

export const RankUpCelebrationModal: React.FC<RankUpCelebrationModalProps> = ({
  isOpen,
  onClose,
  targetTier = TIERS_CONFIG[4],
}) => {
  const emblemRef = useRef<RankEmblemAssembleHandle | null>(null);
  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(
    Math.max(1, targetTier.tier - 1)
  );

  if (!isOpen) return null;

  const currentTier = TIERS_CONFIG[selectedTierIndex];
  const prevTier = TIERS_CONFIG[Math.max(0, selectedTierIndex - 1)];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0c0f1e] border border-[#212c4b] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center overflow-hidden">
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full opacity-25 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${currentTier.color} 0%, transparent 70%)`,
          }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Header Ribbon */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black">
            <Trophy size={13} />
            <span>MÔ PHỎNG THĂNG HẠNG (RANK UP)</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-wide">
            CHÚC MỪNG HỌC SINH!
          </h2>
          <p className="text-xs text-slate-400 font-semibold">
            Nguyễn Văn An đã chính thức vượt ngưỡng điểm và đạt cấp bậc mới!
          </p>
        </div>

        {/* Rank Progression Flow */}
        <div className="flex items-center justify-center gap-3 p-3 bg-[#080b14] border border-[#1b2444] rounded-2xl">
          {/* Old Rank */}
          <div className="flex items-center gap-2 opacity-60">
            <img src={prevTier.badge} alt={prevTier.name} className="w-8 h-8 object-contain" />
            <div className="text-left leading-tight">
              <div className="text-[10px] text-slate-500 font-bold">Hạng cũ</div>
              <div className="text-xs font-bold text-slate-300">{prevTier.name}</div>
            </div>
          </div>

          <ArrowRight size={16} className="text-indigo-400" />

          {/* New Rank */}
          <div className="flex items-center gap-2">
            <img src={currentTier.badge} alt={currentTier.name} className="w-9 h-9 object-contain drop-shadow" />
            <div className="text-left leading-tight">
              <div className="text-[10px] text-amber-400 font-bold">Hạng mới</div>
              <div className="text-xs font-black text-white" style={{ color: currentTier.color }}>
                {currentTier.name}
              </div>
            </div>
          </div>
        </div>

        {/* Big Game-Style Emblem Assemble Spotlight */}
        <div className="relative flex flex-col items-center justify-center py-2">
          <RankEmblemAssemble
            ref={emblemRef}
            key={`modal_${currentTier.tier}`}
            imageSrc={currentTier.badge}
            size={220}
            tierColor={currentTier.color}
            tierName={currentTier.name}
            particleCount={45}
          />

          <div
            className="text-lg font-black tracking-wider uppercase mt-2"
            style={{ color: currentTier.color }}
          >
            {currentTier.name} — {currentTier.title}
          </div>
        </div>

        {/* Tier Selector Dropdown / Pills to test any tier */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {TIERS_CONFIG.map((t, idx) => (
            <button
              key={t.tier}
              onClick={() => setSelectedTierIndex(idx)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                selectedTierIndex === idx
                  ? 'bg-[#5c36f5] text-white border-transparent shadow-sm'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => emblemRef.current?.assemble()}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition cursor-pointer flex-1"
          >
            <RefreshCw size={13} />
            <span>Hợp Thể Lại</span>
          </button>

          <button
            onClick={() => emblemRef.current?.triggerSheen()}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 transition cursor-pointer"
            title="Quét ánh kim"
          >
            <SunMedium size={14} />
          </button>

          <button
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#5c36f5] hover:bg-[#704df7] text-white text-xs font-black transition cursor-pointer flex-1 shadow-lg shadow-indigo-500/25"
          >
            <CheckCircle2 size={14} />
            <span>Xác Nhận</span>
          </button>
        </div>
      </div>
    </div>
  );
};
