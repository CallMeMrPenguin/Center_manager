import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
  actionLabel?: string;
  onClickAction?: () => void;
}

export function showToast(
  message: string, 
  type: 'success' | 'error' | 'warning' = 'success',
  actionLabel?: string,
  onClickAction?: () => void
) {
  const event = new CustomEvent('show-toast', { detail: { message, type, actionLabel, onClickAction } });
  window.dispatchEvent(event);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const { message, type, actionLabel, onClickAction } = (e as CustomEvent).detail;
      const id = Math.random().toString(36).substring(2, 9);
      
      setToasts((prev) => [...prev, { id, message, type, actionLabel, onClickAction }]);

      // Increase timeout slightly for interactive toasts
      const duration = onClickAction ? 6000 : 3500;
      setTimeout(() => {
        removeToast(id);
      }, duration);
    };

    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => {
        const classes = {
          success: 'bg-[#0d1018]/95 border-l-4 border-l-emerald-500 border-white/10 text-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.85)]',
          error: 'bg-[#0d1018]/95 border-l-4 border-l-rose-500 border-white/10 text-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.85)]',
          warning: 'bg-[#0d1018]/95 border-l-4 border-l-amber-500 border-white/10 text-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.85)]',
        };

        const Icon = {
          success: <CheckCircle2 className="text-emerald-400 shrink-0 text-glow-green" size={18} />,
          error: <AlertCircle className="text-rose-400 shrink-0 text-glow-red" size={18} />,
          warning: <Info className="text-amber-400 shrink-0 text-glow-blue" size={18} />,
        };

        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 p-3.5 rounded-[14px] border backdrop-blur-xl transition-all animate-mac-dropdown ${
              classes[toast.type]
            }`}
          >
            {Icon[toast.type]}
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-200">{toast.message}</span>
              {toast.actionLabel && toast.onClickAction && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.onClickAction!();
                    removeToast(toast.id);
                  }}
                  className="w-fit bg-[#5c36f5]/20 hover:bg-[#5c36f5]/40 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wider uppercase transition cursor-pointer self-start"
                >
                  {toast.actionLabel}
                </button>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer self-start"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

