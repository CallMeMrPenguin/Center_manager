import React, { useState } from 'react';
import { Droplets, Save, FileSpreadsheet, Zap, Sparkles, Play } from 'lucide-react';
import { LiquidFillButton } from '../../../components/ui/liquid-button';

export function LiquidButtonDemo() {
  const [liquidFillLevel, setLiquidFillLevel] = useState(65);

  return (
    <div className="space-y-6">
      <div className="bg-[#080b14] border border-[#1b2444] p-6 rounded-2xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Droplets size={18} className="text-cyan-400" />
              <span>Liquid Wave Fill Button (Hiệu Ứng Rót Nước Đầy Cốc)</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Khi rê chuột qua, lớp chất lỏng chuyển động dạng sóng sin dâng từ đáy lên đỉnh như nước đổ vào cốc, tích hợp hiệu ứng khúc xạ phát sáng.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Độ rót thử nghiệm:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={liquidFillLevel}
              onChange={(e) => setLiquidFillLevel(Number(e.target.value))}
              className="w-32 accent-[#5c36f5] cursor-pointer"
            />
            <span className="text-xs font-mono font-black text-indigo-400 w-10">{liquidFillLevel}%</span>
          </div>
        </div>

        {/* Live Hover Demo Matrix */}
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase text-slate-400 block tracking-wider">
            1. Tự Động Đổ Đầy Khi Hover (6 Hệ Màu Chất Lỏng)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <LiquidFillButton variant="indigo" icon={<Save size={16} />}>
              Lưu Bảng Điểm
            </LiquidFillButton>
            <LiquidFillButton variant="cyan" icon={<Droplets size={16} />}>
              Nước Đại Dương
            </LiquidFillButton>
            <LiquidFillButton variant="emerald" icon={<FileSpreadsheet size={16} />}>
              Xuất Excel
            </LiquidFillButton>
            <LiquidFillButton variant="amber" icon={<Zap size={16} />}>
              Smart Predict
            </LiquidFillButton>
            <LiquidFillButton variant="rose" icon={<Sparkles size={16} />}>
              Mật Nho Ruby
            </LiquidFillButton>
            <LiquidFillButton variant="purple" icon={<Play size={16} />}>
              Luyện Đề Thi
            </LiquidFillButton>
          </div>
        </div>

        {/* Size Matrix */}
        <div className="space-y-4 pt-2 border-t border-white/5">
          <span className="text-xs font-bold uppercase text-slate-400 block tracking-wider">
            2. Các Kích Thước (Size Matrix)
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <LiquidFillButton size="sm" variant="indigo" icon={<Save size={13} />}>
              Nhỏ (SM)
            </LiquidFillButton>
            <LiquidFillButton size="md" variant="cyan" icon={<Droplets size={16} />}>
              Vừa (MD Standard)
            </LiquidFillButton>
            <LiquidFillButton size="lg" variant="purple" icon={<Sparkles size={18} />}>
              Lớn (LG Hero Action)
            </LiquidFillButton>
          </div>
        </div>

        {/* Controlled Level Bar */}
        <div className="space-y-4 pt-2 border-t border-white/5">
          <span className="text-xs font-bold uppercase text-slate-400 block tracking-wider">
            3. Điều Khiển Mức Chất Lỏng Theo Phần Trăm (Progress Simulation)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-[#0c0f1e] border border-white/10 rounded-2xl space-y-3 flex flex-col items-center">
              <span className="text-xs font-bold text-slate-300">Theo Slider ({liquidFillLevel}%)</span>
              <LiquidFillButton
                variant="indigo"
                autoFillOnHover={false}
                fillPercentage={liquidFillLevel}
                icon={<Droplets size={16} />}
              >
                Mức Nước {liquidFillLevel}%
              </LiquidFillButton>
            </div>
            <div className="p-4 bg-[#0c0f1e] border border-white/10 rounded-2xl space-y-3 flex flex-col items-center">
              <span className="text-xs font-bold text-slate-300">Đầy 50% (Cyan)</span>
              <LiquidFillButton
                variant="cyan"
                autoFillOnHover={false}
                fillPercentage={50}
                icon={<Zap size={16} />}
              >
                Đang Tải 50%
              </LiquidFillButton>
            </div>
            <div className="p-4 bg-[#0c0f1e] border border-white/10 rounded-2xl space-y-3 flex flex-col items-center">
              <span className="text-xs font-bold text-slate-300">Đầy 90% (Emerald)</span>
              <LiquidFillButton
                variant="emerald"
                autoFillOnHover={false}
                fillPercentage={90}
                icon={<Play size={16} />}
              >
                Hoàn Tất 90%
              </LiquidFillButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiquidButtonDemo;
