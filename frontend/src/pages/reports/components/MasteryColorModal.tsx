import React, { useState } from 'react';
import { X, Palette, RotateCcw, Check, Sparkles } from 'lucide-react';
import {
  MasteryColorSettings,
  MASTERY_PALETTES,
  getMasteryRateConfig,
  saveMasteryRateConfig,
  resetMasteryRateConfig,
} from './masteryRateColorConfig';

interface MasteryColorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MasteryColorModal: React.FC<MasteryColorModalProps> = ({ isOpen, onClose }) => {
  const [currentConfig, setCurrentConfig] = useState<MasteryColorSettings>(getMasteryRateConfig);

  if (!isOpen) return null;

  const handleApplyPalette = (paletteKey: string) => {
    const pal = MASTERY_PALETTES[paletteKey];
    if (!pal) return;

    setCurrentConfig((prev) => ({
      ...prev,
      paletteId: paletteKey,
      tiers: {
        level_4: {
          ...prev.tiers.level_4,
          hex: pal.colors.level_4,
          textColor: paletteKey === 'neon_vibrant' ? 'text-cyan-400' : paletteKey === 'space_indigo' ? 'text-emerald-400' : 'text-emerald-400',
          barColor: paletteKey === 'neon_vibrant' ? 'bg-cyan-500' : paletteKey === 'space_indigo' ? 'bg-emerald-400' : 'bg-emerald-500',
          badgeClass: paletteKey === 'neon_vibrant'
            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
            : paletteKey === 'space_indigo'
            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
        },
        level_3: {
          ...prev.tiers.level_3,
          hex: pal.colors.level_3,
          textColor: paletteKey === 'neon_vibrant' ? 'text-purple-400' : paletteKey === 'space_indigo' ? 'text-indigo-400' : 'text-blue-400',
          barColor: paletteKey === 'neon_vibrant' ? 'bg-purple-500' : paletteKey === 'space_indigo' ? 'bg-indigo-500' : 'bg-blue-500',
          badgeClass: paletteKey === 'neon_vibrant'
            ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
            : paletteKey === 'space_indigo'
            ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
            : 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
        },
        level_2: {
          ...prev.tiers.level_2,
          hex: pal.colors.level_2,
          textColor: paletteKey === 'neon_vibrant' ? 'text-orange-400' : paletteKey === 'space_indigo' ? 'text-yellow-400' : 'text-amber-400',
          barColor: paletteKey === 'neon_vibrant' ? 'bg-orange-500' : paletteKey === 'space_indigo' ? 'bg-yellow-500' : 'bg-amber-500',
          badgeClass: paletteKey === 'neon_vibrant'
            ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
            : paletteKey === 'space_indigo'
            ? 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30'
            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
        },
        level_1: {
          ...prev.tiers.level_1,
          hex: pal.colors.level_1,
          textColor: paletteKey === 'neon_vibrant' ? 'text-pink-400' : paletteKey === 'space_indigo' ? 'text-rose-400' : 'text-rose-400',
          barColor: paletteKey === 'neon_vibrant' ? 'bg-pink-500' : paletteKey === 'space_indigo' ? 'bg-rose-500' : 'bg-rose-500',
          badgeClass: paletteKey === 'neon_vibrant'
            ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30'
            : paletteKey === 'space_indigo'
            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
        },
      },
    }));
  };

  const handleThresholdChange = (key: 'level_4' | 'level_3' | 'level_2', val: number) => {
    setCurrentConfig((prev) => ({
      ...prev,
      tiers: {
        ...prev.tiers,
        [key]: {
          ...prev.tiers[key],
          minPct: Math.max(0, Math.min(100, val)),
        },
      },
    }));
  };

  const handleSave = () => {
    saveMasteryRateConfig(currentConfig);
    onClose();
  };

  const handleReset = () => {
    const def = resetMasteryRateConfig();
    setCurrentConfig(def);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fade-in select-none">
      <div className="w-full max-w-lg bg-[#0c0f1e] border border-[#212c4b] rounded-2xl shadow-2xl p-5 space-y-4 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
              <Palette size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Tùy Chỉnh Màu Thang Đo Nắm Vững
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cấu hình màu sắc và ngưỡng phần trăm cho từng level tỷ lệ nắm vững
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Preset Palettes */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-400" />
            <span>Bộ Màu Sắc Đề Xuất</span>
          </label>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(MASTERY_PALETTES).map(([pKey, pVal]) => {
              const isSelected = currentConfig.paletteId === pKey;
              return (
                <button
                  key={pKey}
                  type="button"
                  onClick={() => handleApplyPalette(pKey)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/15'
                      : 'border-white/10 bg-[#121626] hover:border-white/20'
                  }`}
                >
                  <span className="text-xs font-extrabold text-slate-200">
                    {pVal.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {Object.values(pVal.colors).map((c, idx) => (
                      <span
                        key={idx}
                        className="w-4 h-4 rounded-full border border-black/30 block shadow-sm"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    {isSelected && <Check size={14} className="text-indigo-400 ml-1.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 Levels Threshold & Visual Preview */}
        <div className="space-y-2 pt-1">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
            Ngưỡng Tỷ Lệ & Màu Sắc Từng Mức
          </label>
          <div className="space-y-2">
            {/* Level 4 */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#121626] border border-white/5 gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-4 h-4 rounded-md shrink-0 block"
                  style={{ backgroundColor: currentConfig.tiers.level_4.hex }}
                />
                <div>
                  <div className="text-xs font-black text-white">
                    {currentConfig.tiers.level_4.label}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Đạt chuẩn xuất sắc
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold">&ge;</span>
                <input
                  type="number"
                  min={50}
                  max={95}
                  value={currentConfig.tiers.level_4.minPct}
                  onChange={(e) => handleThresholdChange('level_4', Number(e.target.value))}
                  className="w-16 px-2 py-1 rounded-lg bg-[#0c0f1e] border border-white/10 text-xs font-mono font-bold text-white text-center focus:border-indigo-500 outline-none"
                />
                <span className="text-xs text-slate-400 font-bold">%</span>
              </div>
            </div>

            {/* Level 3 */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#121626] border border-white/5 gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-4 h-4 rounded-md shrink-0 block"
                  style={{ backgroundColor: currentConfig.tiers.level_3.hex }}
                />
                <div>
                  <div className="text-xs font-black text-white">
                    {currentConfig.tiers.level_3.label}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Đang tiến bộ ổn định
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold">&ge;</span>
                <input
                  type="number"
                  min={40}
                  max={80}
                  value={currentConfig.tiers.level_3.minPct}
                  onChange={(e) => handleThresholdChange('level_3', Number(e.target.value))}
                  className="w-16 px-2 py-1 rounded-lg bg-[#0c0f1e] border border-white/10 text-xs font-mono font-bold text-white text-center focus:border-indigo-500 outline-none"
                />
                <span className="text-xs text-slate-400 font-bold">%</span>
              </div>
            </div>

            {/* Level 2 */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#121626] border border-white/5 gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-4 h-4 rounded-md shrink-0 block"
                  style={{ backgroundColor: currentConfig.tiers.level_2.hex }}
                />
                <div>
                  <div className="text-xs font-black text-white">
                    {currentConfig.tiers.level_2.label}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Cần củng cố thêm
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold">&ge;</span>
                <input
                  type="number"
                  min={20}
                  max={60}
                  value={currentConfig.tiers.level_2.minPct}
                  onChange={(e) => handleThresholdChange('level_2', Number(e.target.value))}
                  className="w-16 px-2 py-1 rounded-lg bg-[#0c0f1e] border border-white/10 text-xs font-mono font-bold text-white text-center focus:border-indigo-500 outline-none"
                />
                <span className="text-xs text-slate-400 font-bold">%</span>
              </div>
            </div>

            {/* Level 1 */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#121626] border border-white/5 gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-4 h-4 rounded-md shrink-0 block"
                  style={{ backgroundColor: currentConfig.tiers.level_1.hex }}
                />
                <div>
                  <div className="text-xs font-black text-white">
                    {currentConfig.tiers.level_1.label}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Nhóm học sinh dưới chuẩn
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono font-bold pr-2">
                <span>&lt; {currentConfig.tiers.level_2.minPct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Mặc Định</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#5c36f5] hover:bg-[#6c48f8] text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              <Check size={14} />
              <span>Áp Dụng</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
