import React from 'react';
import { Construction, Sparkles } from 'lucide-react';

interface WaitingForDevelopmentProps {
  title: string;
}

export default function WaitingForDevelopment({ title }: WaitingForDevelopmentProps) {
  return (
    <div className="h-full w-full bg-transparent flex flex-col items-center justify-center p-8 select-none overflow-hidden relative">
      <div className="gradient-border-card max-w-md w-full py-12 px-8 flex flex-col items-center justify-center text-center relative rounded-2xl animate-mac-modal">
        
        {/* Animated Icon Container */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full scale-125 animate-ping opacity-30 duration-[3000ms]" />
          <div className="h-20 w-20 rounded-2xl bg-indigo-500/20 border-2 border-indigo-400/80 flex items-center justify-center shadow-[0_0_30px_rgba(92,54,245,0.6)] relative z-10">
            <Construction size={40} className="text-white drop-shadow-[0_0_12px_rgba(255,255,255,1)]" />
          </div>
          <div className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <Sparkles size={12} className="text-amber-400 animate-spin duration-[4000ms]" />
          </div>
        </div>

        {/* Feature Title */}
        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/15 px-3 py-1 rounded-full border border-indigo-500/25 mb-3.5">
          {title}
        </span>

        {/* Header Text */}
        <h2 className="text-lg font-black text-white mb-2.5 tracking-tight uppercase">
          Tính Năng Đang Phát Triển
        </h2>

        {/* Paragraph Text */}
        <p className="text-xs text-slate-400 font-bold leading-relaxed max-w-[280px]">
          Phân hệ này đang được hoàn thiện để mang lại trải nghiệm xuất sắc nhất.
        </p>

        {/* Decorative Progress Bar */}
        <div className="w-full bg-slate-900 border border-white/5 h-1.5 rounded-full mt-8 overflow-hidden relative">
          <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#5c36f5] to-cyan-400 rounded-full shadow-[0_0_12px_rgba(92,54,245,0.8)]" style={{ width: '60%' }} />
        </div>
        
        <div className="flex justify-between w-full mt-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
          <span>Trạng thái: Đang hoàn thiện</span>
          <span className="text-indigo-400">60%</span>
        </div>
      </div>
    </div>
  );
}
