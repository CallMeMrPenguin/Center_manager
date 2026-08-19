import React from 'react';
import { X } from 'lucide-react';

interface SummaryTooltipCardProps {
  title: string;
  titleColor?: string;
  onClose: () => void;
  whatItReflects: string;
  alignRight?: boolean;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export const SummaryTooltipCard: React.FC<SummaryTooltipCardProps> = ({
  title,
  titleColor = 'text-indigo-300',
  onClose,
  whatItReflects,
  alignRight = false,
  children,
  footer,
}) => {
  return (
    <div
      className={`absolute bottom-full mb-2 ${
        alignRight ? 'right-0' : 'left-1/2 -translate-x-1/2'
      } w-84 p-4 bg-[#161c34] border border-[#2c375e] text-slate-200 text-[11px] rounded-xl shadow-2xl z-30 text-left font-sans space-y-2.5`}
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
        <span className={`font-extrabold ${titleColor}`}>{title}</span>
        <button
          onClick={onClose}
          type="button"
          className="text-slate-400 hover:text-white cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-1 text-[11px]">
        <span className="font-bold text-slate-300 block">Chỉ số này phản ánh gì:</span>
        <p className="text-[10px] text-slate-400 leading-relaxed">{whatItReflects}</p>
      </div>

      {children}

      {footer && <div className="pt-1 border-t border-white/10 text-[10px] text-slate-400 space-y-0.5">{footer}</div>}
    </div>
  );
};
