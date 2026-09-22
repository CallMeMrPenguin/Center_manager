import React from 'react';
import { Construction, Sparkles } from 'lucide-react';

interface WaitingForDevelopmentProps {
  title: string;
}

export default function WaitingForDevelopment({ title }: WaitingForDevelopmentProps) {
  return (
    <div className="h-full w-full bg-transparent flex flex-col items-center justify-center p-8 select-none overflow-hidden relative">
      <div className="bg-white border border-slate-200 shadow-xl max-w-md w-full py-12 px-8 flex flex-col items-center justify-center text-center relative rounded-2xl animate-mac-modal">
        
        {/* Animated Icon Container */}
        <div className="relative mb-6">
          <div className="h-20 w-20 rounded-2xl bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center shadow-md relative z-10">
            <Construction size={40} className="text-indigo-600" />
          </div>
          <div className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
            <Sparkles size={12} className="text-amber-500 animate-spin duration-[4000ms]" />
          </div>
        </div>

        {/* Feature Title */}
        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 mb-3.5">
          {title}
        </span>

        {/* Header Text */}
        <h2 className="text-lg font-black text-slate-900 mb-2.5 tracking-tight uppercase">
          Tính Năng Đang Phát Triển
        </h2>

        {/* Paragraph Text */}
        <p className="text-xs text-slate-600 font-bold leading-relaxed max-w-[280px]">
          Phân hệ này đang được hoàn thiện để mang lại trải nghiệm xuất sắc nhất.
        </p>

        {/* Decorative Progress Bar */}
        <div className="w-full bg-slate-100 border border-slate-200 h-1.5 rounded-full mt-8 overflow-hidden relative">
          <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full" style={{ width: '60%' }} />
        </div>
        
        <div className="flex justify-between w-full mt-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
          <span>Trạng thái: Đang hoàn thiện</span>
          <span className="text-indigo-600 font-bold">60%</span>
        </div>
      </div>
    </div>
  );
}
