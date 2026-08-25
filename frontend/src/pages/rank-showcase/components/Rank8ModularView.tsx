import React, { useState, useRef } from 'react';
import { Play, RefreshCw, Flame, SunMedium, Layers, Sliders, Sparkles, Box, ShieldCheck } from 'lucide-react';
import { ModularRank8Assemble, ModularRank8Handle } from './ModularRank8Assemble';

const PART_ITEMS = [
  { name: 'Vương Miện Hoàng Gia', file: 'crown.png', layer: 'Layer 4 (Đỉnh)' },
  { name: 'Đại Hồng Ngọc Apex', file: 'gem_diamond.png', layer: 'Layer 4 (Đỉnh)' },
  { name: 'Khiên Vàng Ngọc Đỏ', file: 'core_shield.png', layer: 'Layer 3 (Trung Tâm)' },
  { name: 'Chữ V Hoàng Kim', file: 'chevron.png', layer: 'Layer 3 (Đế Khiên)' },
  { name: 'Rồng Vàng Tả Hộ', file: 'dragon_left.png', layer: 'Layer 2 (Cánh Rồng)' },
  { name: 'Rồng Vàng Hữu Hộ', file: 'dragon_right.png', layer: 'Layer 2 (Cánh Rồng)' },
  { name: 'Cánh Thiên Thần Trái', file: 'wing_left_main.png', layer: 'Layer 2 (Cánh Chính)' },
  { name: 'Cánh Thiên Thần Phải', file: 'wing_right_main.png', layer: 'Layer 2 (Cánh Chính)' },
  { name: 'Cánh Ngoài Tả', file: 'wing_left_outer.png', layer: 'Layer 2 (Cánh Ngoài)' },
  { name: 'Cánh Ngoài Hữu', file: 'wing_right_outer.png', layer: 'Layer 2 (Cánh Ngoài)' },
  { name: 'Áo Choàng Nhung Tả', file: 'cape_left.png', layer: 'Layer 1 (Hậu Cảnh)' },
  { name: 'Áo Choàng Nhung Hữu', file: 'cape_right.png', layer: 'Layer 1 (Hậu Cảnh)' },
  { name: 'Dải Lụa Hoàng Gia', file: 'ribbon_flow.png', layer: 'Layer 1 (Dải Lụa)' },
  { name: 'Hồng Ngọc Treo Dưới', file: 'pendant_crystal.png', layer: 'Layer 3 (Trang Sức)' },
  { name: 'Chuỗi Hạt Vàng Tả', file: 'pendant_bead_l.png', layer: 'Layer 3 (Trang Sức)' },
  { name: 'Chuỗi Hạt Vàng Hữu', file: 'pendant_bead_r.png', layer: 'Layer 3 (Trang Sức)' },
  { name: 'Vòng Hào Quang Tả', file: 'aura_swirl_left.png', layer: 'Layer 1 (Năng Lượng)' },
  { name: 'Vòng Hào Quang Hữu', file: 'aura_swirl_right.png', layer: 'Layer 1 (Năng Lượng)' },
];

export const Rank8ModularView: React.FC = () => {
  const emblemRef = useRef<ModularRank8Handle | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualProgress, setManualProgress] = useState(1.0);
  const [enable3D, setEnable3D] = useState(true);

  return (
    <div className="space-y-6 select-none">
      {/* 1. Main Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Large Hologram Stage */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center p-6 sm:p-10 bg-[#0a0d1a] border border-[#1b2444] rounded-3xl relative overflow-hidden min-h-[520px]">
          {/* Ambient Lighting Dome */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] h-[440px] rounded-full pointer-events-none opacity-20"
            style={{
              background: 'radial-gradient(circle, #fbbf24 0%, #ff3344 40%, transparent 70%)',
            }}
          />

          {/* Interactive Multi-Layer Rank 8 Assemble Canvas */}
          <ModularRank8Assemble
            ref={emblemRef}
            size={440}
            autoAssemble={!manualMode}
            isManualControl={manualMode}
            manualProgress={manualProgress}
            enable3DTilt={enable3D}
          />

          {/* Glowing Holographic Pedestal */}
          <div className="w-80 h-3.5 mt-2 rounded-full bg-[#151c36] border border-[#2b396b] shadow-[0_0_30px_rgba(251,191,36,0.4)] flex items-center justify-center">
            <div className="w-52 h-1.5 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 animate-pulse" />
          </div>

          {/* Title Ribbon */}
          <div className="mt-5 text-center space-y-1">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black shadow-sm">
              <Sparkles size={14} />
              <span>TIER 8 — QUÁN QUÂN HOÀNG KIM (SUPREME CHAMPION)</span>
            </div>
            <p className="text-xs text-slate-400 font-semibold">
              Hệ thống ghép nối đa tầng từ 28 mảnh linh kiện rời rạc với chiều sâu 3D Parallax & Vật lý lò xo
            </p>
          </div>

          {/* Action Trigger Buttons */}
          <div className="relative z-20 flex flex-wrap items-center justify-center gap-2.5 mt-6">
            <button
              onClick={() => {
                setManualMode(false);
                emblemRef.current?.assemble();
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#5c36f5] hover:bg-[#704df7] text-white text-xs font-black transition cursor-pointer shadow-lg shadow-indigo-500/25"
            >
              <Play size={13} fill="currentColor" />
              <span>Hợp Thể Điện Ảnh (Cinematic Assemble)</span>
            </button>

            <button
              onClick={() => emblemRef.current?.explode()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-black border border-rose-500/30 transition cursor-pointer"
            >
              <Flame size={13} />
              <span>Nổ Rời Mảnh Ghép (Explode & Snap)</span>
            </button>

            <button
              onClick={() => emblemRef.current?.triggerSheen()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 transition cursor-pointer"
            >
              <SunMedium size={13} />
              <span>Quét Ánh Kim (Sheen)</span>
            </button>

            <button
              onClick={() => {
                setManualMode(false);
                emblemRef.current?.disassemble();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Tách Rời (Disassemble)</span>
            </button>
          </div>
        </div>

        {/* Right: Manual Scrubbing Controller & Piece Explorer */}
        <div className="lg:col-span-4 space-y-4">
          {/* Manual Scrubbing Box */}
          <div className="p-5 bg-[#0c0f1e] border border-[#1e2746] rounded-3xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-amber-400" />
                <h3 className="text-sm font-black text-white">Thanh Tua Ghép Từng Mảnh</h3>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={manualMode}
                  onChange={(e) => setManualMode(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#5c36f5] cursor-pointer"
                />
                <span>Chế độ Tua tay</span>
              </label>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Tiến Trình Ghép Nối (Assembly Timeline)</span>
                <span className="font-mono text-amber-400 font-black">
                  {Math.round(manualProgress * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={manualProgress}
                onChange={(e) => {
                  setManualMode(true);
                  const val = parseFloat(e.target.value);
                  setManualProgress(val);
                  emblemRef.current?.setProgress(val);
                }}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                <span>0% (Tách Rời)</span>
                <span>50% (Cánh & Rồng)</span>
                <span>100% (Khóa Khớp)</span>
              </div>
            </div>

            {/* 3D Tilt Toggle */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Hiệu Ứng Nghiêng 3D (Parallax Tilt)</span>
              <input
                type="checkbox"
                checked={enable3D}
                onChange={(e) => setEnable3D(e.target.checked)}
                className="w-4 h-4 rounded accent-[#5c36f5] cursor-pointer"
              />
            </div>
          </div>

          {/* Component Pieces Inventory / Explorer */}
          <div className="p-5 bg-[#0c0f1e] border border-[#1e2746] rounded-3xl space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <Layers size={16} className="text-indigo-400" />
              <h3 className="text-sm font-black text-white">Danh Mục 28 Mảnh Linh Kiện Rời</h3>
            </div>

            <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {PART_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 rounded-xl bg-[#080b14] border border-[#1b2444] hover:border-amber-500/40 transition"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#141829] flex items-center justify-center p-1 border border-white/10 shrink-0">
                    <img
                      src={`/ranks/tier_8_parts/${item.file}`}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{item.name}</div>
                    <div className="text-[10px] text-slate-400 font-medium truncate">{item.layer}</div>
                  </div>
                  <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
