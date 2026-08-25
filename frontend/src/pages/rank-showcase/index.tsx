import React, { useState } from 'react';
import { Sparkles, LayoutGrid, Eye, Trophy, Layers } from 'lucide-react';
import { TIERS_CONFIG, StudentTier } from '../reports/types';
import { RankStageView } from './components/RankStageView';
import { RankAllGridView } from './components/RankAllGridView';
import { Rank8ModularView } from './components/Rank8ModularView';
import { RankUpCelebrationModal } from './components/RankUpCelebrationModal';
import { RankShowcaseConfig } from './types';

export default function RankShowcasePage() {
  const [activeTab, setActiveTab] = useState<'modular' | 'stage' | 'grid'>('modular');
  const [currentTier, setCurrentTier] = useState<StudentTier>(TIERS_CONFIG[7]); // Default Quán Quân
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);

  const [config, setConfig] = useState<RankShowcaseConfig>({
    particleCount: 50,
    speed: 1.0,
    enableMouseInteraction: true,
    autoReplay: false,
  });

  const handleChangeConfig = (newConfig: Partial<RankShowcaseConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  const tabs: Array<{ id: 'modular' | 'stage' | 'grid'; label: string; icon: any }> = [
    { id: 'modular', label: 'Ghép Mảnh Rank 8', icon: Layers },
    { id: 'stage', label: 'Sân Khấu Tâm Điểm', icon: Eye },
    { id: 'grid', label: 'Lưới 8 Rank', icon: LayoutGrid },
  ];

  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Top Header Banner */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-[#0c0f1e] border border-[#1d2744] px-6 py-4 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Trophy size={22} />
          </div>
          <div>
            <h1 className="text-base font-black text-white flex items-center gap-2">
              <span>Phòng Thử Nghiệm Hiệu Ứng Rank</span>
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20 font-black">
                Layered Particle VFX
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-semibold">
              Khám phá hiệu ứng ghép nối đa tầng từ 28 mảnh linh kiện rời rạc, bụi năng lượng xoáy tụ và quét ánh kim chuẩn game
            </p>
          </div>
        </div>

        {/* Sliding Pill Indicator Segmented Control (Rule 7) */}
        <div className="relative flex bg-[#0d1018] p-1 rounded-xl border border-white/10 text-xs shrink-0 font-bold select-none min-w-[390px]">
          {/* Sliding Indicator Backdrop */}
          <div
            className="absolute top-1 bottom-1 rounded-lg bg-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.5)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
            style={{
              left: activeIndex === 0 ? '4px' : `calc((100% / 3) * ${activeIndex} + 1px)`,
              width: 'calc((100% / 3) - 4px)',
            }}
          />

          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 relative z-10 py-1.5 px-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  isActive ? 'text-white font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon size={13} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Tab Views */}
      {activeTab === 'modular' ? (
        <Rank8ModularView />
      ) : activeTab === 'stage' ? (
        <RankStageView
          currentTier={currentTier}
          onSelectTier={setCurrentTier}
          config={config}
          onChangeConfig={handleChangeConfig}
          onOpenCelebrationModal={() => setIsCelebrationOpen(true)}
        />
      ) : (
        <RankAllGridView
          config={config}
          onSelectTier={(tier) => {
            setCurrentTier(tier);
            setActiveTab('stage');
          }}
        />
      )}

      {/* 3. Simulated Rank-Up Celebration Modal */}
      <RankUpCelebrationModal
        isOpen={isCelebrationOpen}
        onClose={() => setIsCelebrationOpen(false)}
        targetTier={currentTier}
      />
    </div>
  );
}
