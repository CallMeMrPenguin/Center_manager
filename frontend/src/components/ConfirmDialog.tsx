import { useState, createContext, useContext, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

type ConfirmFunction = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFunction | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}

interface ConfirmProviderProps {
  children: ReactNode;
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        options,
        resolve
      });
    });
  };

  const handleCancel = () => {
    if (confirmState) {
      confirmState.resolve(false);
      setConfirmState(null);
    }
  };

  const handleConfirm = () => {
    if (confirmState) {
      confirmState.resolve(true);
      setConfirmState(null);
    }
  };

  const options = confirmState?.options;
  const isDanger = options?.type === 'danger';
  const isWarning = options?.type === 'warning';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {confirmState && createPortal(
        <div 
          className="fixed inset-0 bg-black/75 z-[999999] flex items-center justify-center p-4 animate-mac-backdrop"
          onClick={handleCancel}
        >
          <div 
            className={`bg-[#0f1320] border ${
              isDanger 
                ? 'border-rose-500/30 shadow-[0_0_25px_rgba(239,68,68,0.2)]' 
                : isWarning 
                ? 'border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.2)]' 
                : 'border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.9)]'
            } rounded-2xl w-full max-w-sm p-6 flex flex-col gap-4 text-slate-100 animate-mac-modal`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${
                  isDanger 
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25' 
                    : isWarning 
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' 
                    : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25'
                }`}>
                  {isDanger || isWarning ? (
                    <AlertTriangle size={18} />
                  ) : (
                    <HelpCircle size={18} />
                  )}
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  {options?.title || "Xác nhận"}
                </h3>
              </div>
              <button
                onClick={handleCancel}
                className="text-slate-500 hover:text-white transition cursor-pointer p-1 rounded-xl hover:bg-white/5"
              >
                <X size={16} />
              </button>
            </div>

            {/* Message Body */}
            <p className="text-xs text-slate-300 font-semibold leading-relaxed">
              {options?.message}
            </p>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-white/5 mt-1">
              <button
                onClick={handleCancel}
                className="bg-[#181d2f] hover:bg-[#22283f] text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-white/5 transition-all py-2.5 px-4 cursor-pointer active:scale-95"
              >
                {options?.cancelText || "Hủy bỏ"}
              </button>
              <button
                onClick={handleConfirm}
                className={`text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer py-2.5 px-4 active:scale-95 ${
                  isDanger 
                    ? 'bg-rose-500 hover:bg-rose-600 shadow-[0_0_15px_rgba(239,68,68,0.4)] border border-rose-400/30' 
                    : isWarning 
                    ? 'bg-amber-500 hover:bg-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-amber-400/30'
                    : 'bg-[#5c36f5] hover:bg-[#7351f7] shadow-[0_4px_12px_rgba(92,54,245,0.3)] border border-white/10'
                }`}
              >
                {options?.confirmText || (isDanger ? "Xóa" : "Xác nhận")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </ConfirmContext.Provider>
  );
}
