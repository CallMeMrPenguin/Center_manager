import React, { useRef } from 'react';
import { Play, Sparkles, Flame, RefreshCw, Zap, ShieldAlert, Award, SunMedium } from 'lucide-react';
import { TIERS_CONFIG, StudentTier } from '../../reports/types';
import { RankEmblemAssemble, RankEmblemAssembleHandle } from './RankEmblemAssemble';
import { RankShowcaseConfig } from '../types';

interface RankStageViewProps {
  currentTier: StudentTier;
  onSelectTier: (tier: StudentTier) => void;
  config: RankShowcaseConfig;
  onChangeConfig: (newConfig: Partial<RankShowcaseConfig>) => void;
  onOpenCelebrationModal: () => void;
}

export const RankStageView: React.FC<RankStageViewProps> = ({
  currentTier,
  onSelectTier,
  config,
  onChangeConfig,
  onOpenCelebrationModal,
}) => {
  const emblemRef = useRef<RankEmblemAssembleHandle | null>(null);

  return (
    <div className="space-y-6">
      {/* 1. Quick Tier Switch Bar */}
      <div className="flex items-center gap-2 p-2 bg-[#0c0f1e] border border-[#1e2746] rounded-2xl overflow-x-auto select-none">
        {TIERS_CONFIG.map((t) => {
          const isSelected = t.tier === currentTier.tier;
          return (
            <button
              key={t.tier}
              onClick={() => onSelectTier(t)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition cursor-pointer shrink-0 border ${
                isSelected
                  ? 'bg-[#191f38] border-[#5c36f5] text-white shadow-[0_0_12px_rgba(92,54,245,0.4)]'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <img src={t.badge} alt={t.name} className="w-6 h-6 object-contain" />
              <div className="text-left leading-tight">
                <div className="text-xs font-black">{t.name}</div>
                <div className="text-[10px] text-slate-500 font-bold">{t.minScore} - {t.maxScore}đ</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. Main Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: Particle Hologram Pedestal */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-8 bg-[#0a0d1a] border border-[#1b2444] rounded-3xl relative overflow-hidden min-h-[480px]">
          {/* Subtle Ambient Light Cone */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full pointer-events-none opacity-10"
            style={{
              background: `radial-gradient(circle, ${currentTier.color} 0%, transparent 70%)`,
            }}
          />

          {/* Game-Style Emblem Assemble Stage */}
          <div className="relative z-10 flex flex-col items-center">
            <RankEmblemAssemble
              ref={emblemRef}
              key={`${currentTier.tier}_${config.particleCount}`}
              imageSrc={currentTier.badge}
              size={280}
              tierColor={currentTier.color}
              tierName={currentTier.name}
              particleCount={config.particleCount}
              enableMouseInteraction={config.enableMouseInteraction}
              autoReplay={config.autoReplay}
            />

            {/* Glowing Pedestal Base */}
            <div className="w-64 h-3 mt-4 rounded-full bg-[#151c36] border border-[#2b396b] shadow-[0_0_24px_rgba(92,54,245,0.35)] flex items-center justify-center">
              <div
                className="w-36 h-1 rounded-full animate-pulse"
                style={{ backgroundColor: currentTier.color }}
              />
            </div>

            {/* Rank Metadata Badge */}
            <div className="mt-6 text-center space-y-1 select-none">
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black border shadow-sm"
                style={{
                  backgroundColor: `${currentTier.color}15`,
                  borderColor: `${currentTier.color}40`,
                  color: currentTier.color,
                }}
              >
                <Award size={14} />
                <span>Tier {currentTier.tier} — {currentTier.title}</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-wide">{currentTier.name}</h2>
              <p className="text-xs text-slate-400 font-semibold">Khung điểm chuẩn: {currentTier.minScore} đến {currentTier.maxScore} điểm</p>
            </div>
          </div>

          {/* Interactive Trigger Toolbar */}
          <div className="relative z-20 flex flex-wrap items-center justify-center gap-2.5 mt-8 select-none">
            <button
              onClick={() => emblemRef.current?.assemble()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#704df7] text-white text-xs font-black transition cursor-pointer shadow-lg shadow-indigo-500/25"
            >
              <Play size={13} fill="currentColor" />
              <span>Hợp Thể (Assemble Inflow)</span>
            </button>

            <button
              onClick={() => emblemRef.current?.triggerSheen()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 transition cursor-pointer"
            >
              <SunMedium size={13} />
              <span>Ánh Kim (Sheen Glint)</span>
            </button>

            <button
              onClick={() => emblemRef.current?.blast()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 transition cursor-pointer"
            >
              <Flame size={13} />
              <span>Sóng Nổ Hạt (Blast)</span>
            </button>

            <button
              onClick={() => emblemRef.current?.disassemble()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Tan Biến (Disassemble)</span>
            </button>

            <button
              onClick={onOpenCelebrationModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#191f38] hover:bg-[#232b4d] text-white text-xs font-black border border-[#5c36f5]/50 transition cursor-pointer shadow-md"
            >
              <Sparkles size={13} className="text-amber-400" />
              <span>Mô Phỏng Thăng Hạng</span>
            </button>
          </div>
        </div>

        {/* Right: Fine-Tuning Particle Control Lab */}
        <div className="lg:col-span-5 space-y-4 select-none">
          <div className="p-5 bg-[#0c0f1e] border border-[#1e2746] rounded-3xl space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Zap size={16} className="text-indigo-400" />
              <h3 className="text-sm font-black text-white">Bảng Điều Khiển Hạt & Hiệu Ứng (VFX Lab)</h3>
            </div>

            {/* Particle Density */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Số Lượng Bụi Phát Sáng (Flying Embers)</span>
                <span className="font-mono text-indigo-400">{config.particleCount} hạt</span>
              </div>
              <input
                type="range"
                min={20}
                max={120}
                step={5}
                value={config.particleCount}
                onChange={(e) => onChangeConfig({ particleCount: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#5c36f5]"
              />
            </div>

            {/* Toggles */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-bold text-slate-300">Tương Tác Bụi Sáng Bằng Chuột (Mouse Repel)</span>
                <input
                  type="checkbox"
                  checked={config.enableMouseInteraction}
                  onChange={(e) => onChangeConfig({ enableMouseInteraction: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#5c36f5] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-bold text-slate-300">Tự Động Lặp Lại Hợp Thể (Auto-Replay Loop)</span>
                <input
                  type="checkbox"
                  checked={config.autoReplay}
                  onChange={(e) => onChangeConfig({ autoReplay: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#5c36f5] cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Explanation Card */}
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/25 rounded-2xl flex items-start gap-3">
            <ShieldAlert size={18} className="text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-200 leading-relaxed font-semibold">
              <span className="font-bold text-white">Hiệu ứng chuẩn Game:</span> Biểu tượng Rank luôn sắc nét nguyên bản ở định dạng HD. Khi hợp thể, các hạt bụi năng lượng xoáy tụ vào trung tâm (Inflow Vortex) ➔ Biểu tượng dập vào với lực quán tính lò xo ➔ Sóng nổ hào quang tỏa ra ➔ Vệt ánh sáng kim loại (Metallic Sheen) quét qua bề mặt!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
