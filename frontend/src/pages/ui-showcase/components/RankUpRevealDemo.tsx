import React, { useState } from 'react';
import { Trophy, Sparkles, Play, Sliders, Shield, Zap } from 'lucide-react';
import { TIERS_CONFIG, StudentTier } from '../../reports/types';
import { RankUpRevealModal } from '../../../components/rank-reveal/RankUpRevealModal';
import { RankRevealOptions } from '../../../components/rank-reveal/types';

export const RankUpRevealDemo: React.FC = () => {
  const [oldTierIndex, setOldTierIndex] = useState(3); // Bạch Kim (Tier 4)
  const [newTierIndex, setNewTierIndex] = useState(4); // Kim Cương (Tier 5)
  const [studentName, setStudentName] = useState('Nguyễn Hoàng Nam');
  const [className, setClassName] = useState('Chuyên Anh A1');
  const [oldScore, setOldScore] = useState(7.8);
  const [newScore, setNewScore] = useState(8.5);

  const [options, setOptions] = useState<RankRevealOptions>({
    enableShake: true,
    enableShards: true,
    enableShockwave: true,
    enableGodRays: true,
    enableWings: true,
    playbackSpeed: 1.0,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const oldTier: StudentTier = TIERS_CONFIG[oldTierIndex];
  const newTier: StudentTier = TIERS_CONFIG[newTierIndex];

  const handleLaunch = () => {
    setIsModalOpen(true);
  };

  const toggleOption = (key: keyof RankRevealOptions) => {
    setOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HERO CARD */}
      <div className="bg-white dark:bg-[#141417] border border-slate-200/90 dark:border-[#27272a] p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20 shrink-0">
              <Trophy size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Rank-up Reveal FX (Hiệu Ứng Thăng Hạng Điện Ảnh)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-500 border border-indigo-500/30">
                  Game Grade
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mô phỏng hiệu ứng nứt vỡ (Shatter), rơi dập (Emblem Slam), rung chấn camera, sóng xung kích và hào quang nguyên tố.
              </p>
            </div>
          </div>

          <button
            onClick={handleLaunch}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#5c36f5] hover:bg-[#6c47ff] text-white font-black text-xs shadow-[0_0_20px_rgba(92,54,245,0.4)] transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <Play size={16} className="fill-white" />
            <span>KÍCH HOẠT RANK-UP REVEAL</span>
          </button>
        </div>
      </div>

      {/* 2. PLAYGROUND SETTINGS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: TIER SELECTION (7 COLS) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#141417] border border-slate-200/90 dark:border-[#27272a] p-6 rounded-2xl shadow-sm space-y-6">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Shield size={16} className="text-indigo-500" />
            <span>Chọn Bậc Thăng Hạng (Old Tier &rarr; New Tier)</span>
          </h3>

          {/* Current vs Next Badge Display */}
          <div className="flex items-center justify-around p-4 rounded-xl bg-slate-50 dark:bg-[#0c0f1e] border border-slate-200 dark:border-white/10">
            {/* Old Tier Preview */}
            <div className="flex flex-col items-center text-center space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bậc Cũ (Sẽ Vỡ Vụn)</span>
              <div className="w-20 h-20 flex items-center justify-center p-2 rounded-xl bg-black/20 border border-white/5">
                <img src={oldTier.badge} alt={oldTier.name} className="w-16 h-16 object-contain" />
              </div>
              <span className="text-xs font-black" style={{ color: oldTier.color }}>
                {oldTier.name} ({oldTier.title})
              </span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <Zap size={22} className="text-amber-500 animate-pulse" />
              <span className="text-[10px] font-mono text-slate-400">UPGRADE</span>
            </div>

            {/* New Tier Preview */}
            <div className="flex flex-col items-center text-center space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bậc Mới (Slam & Tỏa Sáng)</span>
              <div
                className="w-20 h-20 flex items-center justify-center p-2 rounded-xl bg-black/20 border"
                style={{ borderColor: `${newTier.color}40`, boxShadow: `0 0 15px ${newTier.color}30` }}
              >
                <img src={newTier.badge} alt={newTier.name} className="w-16 h-16 object-contain" />
              </div>
              <span className="text-xs font-black" style={{ color: newTier.color }}>
                {newTier.name} ({newTier.title})
              </span>
            </div>
          </div>

          {/* Tier Buttons Grid */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
              1. Chọn Bậc Cũ (Xuất Phát):
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {TIERS_CONFIG.map((t, idx) => (
                <button
                  key={`old_${t.tier}`}
                  onClick={() => setOldTierIndex(idx)}
                  className={`flex flex-col items-center p-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                    oldTierIndex === idx
                      ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-[#0c0f1e] border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-200'
                  }`}
                >
                  <img src={t.badge} alt={t.name} className="w-8 h-8 object-contain mb-1" />
                  <span className="truncate w-full text-center">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
              2. Chọn Bậc Mới (Đích Đến):
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {TIERS_CONFIG.map((t, idx) => (
                <button
                  key={`new_${t.tier}`}
                  onClick={() => setNewTierIndex(idx)}
                  className={`flex flex-col items-center p-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                    newTierIndex === idx
                      ? 'bg-amber-500/20 border-amber-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-[#0c0f1e] border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-200'
                  }`}
                >
                  <img src={t.badge} alt={t.name} className="w-8 h-8 object-contain mb-1" />
                  <span className="truncate w-full text-center">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FX PARAMETERS & STUDENT INFO (5 COLS) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#141417] border border-slate-200/90 dark:border-[#27272a] p-6 rounded-2xl shadow-sm space-y-6">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders size={16} className="text-amber-500" />
            <span>Tùy Chỉnh Hiệu Ứng & Dữ Liệu Demo</span>
          </h3>

          {/* Speed Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
              Tốc Độ Hoạt Cảnh (Playback Speed):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '1.0x (Chuẩn)', val: 1.0 },
                { label: '0.5x (Chậm)', val: 0.5 },
                { label: '0.25x (Siêu Chậm)', val: 0.25 },
              ].map((sp) => (
                <button
                  key={sp.val}
                  onClick={() => setOptions((p) => ({ ...p, playbackSpeed: sp.val }))}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    options.playbackSpeed === sp.val
                      ? 'bg-[#5c36f5] border-[#5c36f5] text-white'
                      : 'bg-slate-50 dark:bg-[#0c0f1e] border-slate-200 dark:border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Effect Toggles */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
              Bật / Tắt Các Lớp Hiệu Ứng:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { key: 'enableShake', label: 'Camera Shake (Rung Chấn)' },
                { key: 'enableShards', label: 'Vỡ Vụn (Triangle Shards)' },
                { key: 'enableShockwave', label: 'Sóng Xung Kích (Shockwave)' },
                { key: 'enableGodRays', label: 'Chùm Tia Sáng (God Rays)' },
                { key: 'enableWings', label: 'Bung Cánh (SVG Wings)' },
              ].map((fx) => {
                const k = fx.key as keyof RankRevealOptions;
                const active = options[k] !== false;
                return (
                  <button
                    key={fx.key}
                    onClick={() => toggleOption(k)}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                      active
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-50 dark:bg-[#0c0f1e] border-slate-200 dark:border-white/5 text-slate-500'
                    }`}
                  >
                    <span className="text-[11px] font-semibold">{fx.label}</span>
                    <span className="text-[10px] font-bold font-mono">{active ? 'ON' : 'OFF'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Student Info Inputs */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/5">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
              Thông Tin Khắc Lên Ruy Băng:
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Tên Học Sinh</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0c0f1e] border border-slate-200 dark:border-white/10 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Lớp Học</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0c0f1e] border border-slate-200 dark:border-white/10 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Điểm Cũ</label>
                <input
                  type="number"
                  step="0.1"
                  value={oldScore}
                  onChange={(e) => setOldScore(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0c0f1e] border border-slate-200 dark:border-white/10 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Điểm Mới</label>
                <input
                  type="number"
                  step="0.1"
                  value={newScore}
                  onChange={(e) => setNewScore(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0c0f1e] border border-slate-200 dark:border-white/10 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. RANK UP REVEAL MODAL */}
      <RankUpRevealModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        oldTier={oldTier}
        newTier={newTier}
        studentName={studentName}
        className={className}
        oldScore={oldScore}
        newScore={newScore}
        options={options}
      />
    </div>
  );
};
