import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

interface SummaryTooltipCardProps {
  title: string;
  titleColor?: string;
  onClose?: () => void;
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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        className={`absolute bottom-full mb-3 ${
          alignRight ? 'right-0' : 'left-1/2 -translate-x-1/2'
        } w-88 p-4 bg-[#0d1224] border border-[#232f54] text-slate-200 text-[11px] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] z-50 text-left font-sans space-y-2.5 pointer-events-auto select-none`}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-indigo-400 shrink-0" />
            <span className={`font-black text-xs ${titleColor}`}>{title}</span>
          </div>
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              type="button"
              className="text-slate-400 hover:text-white transition cursor-pointer p-0.5"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="space-y-1 text-[11px]">
          <span className="font-bold text-slate-300 block text-[10px] uppercase tracking-wider text-indigo-400/90">
            Chỉ số này phản ánh gì:
          </span>
          <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{whatItReflects}</p>
        </div>

        {children}

        {footer && (
          <div className="pt-2 border-t border-white/10 text-[10px] text-slate-400 space-y-1">
            {footer}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
