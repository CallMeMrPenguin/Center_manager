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
            className={`bg-white border ${
              isDanger 
                ? 'border-rose-200 shadow-[0_10px_30px_rgba(239,68,68,0.15)]' 
                : isWarning 
                ? 'border-amber-200 shadow-[0_10px_30px_rgba(245,158,11,0.15)]' 
                : 'border-slate-200 shadow-2xl'
            } rounded-2xl w-full max-w-sm p-6 flex flex-col gap-4 text-slate-800 animate-mac-modal`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${
                  isDanger 
                    ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                    : isWarning 
                    ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                    : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                }`}>
                  {isDanger || isWarning ? (
                    <AlertTriangle size={18} />
                  ) : (
                    <HelpCircle size={18} />
                  )}
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  {options?.title || "Xác nhận"}
                </h3>
              </div>
              <button
                onClick={handleCancel}
                className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-1 rounded-xl hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            {/* Message Body */}
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {options?.message}
            </p>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-1">
              <button
                onClick={handleCancel}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-200 transition-all py-2.5 px-4 cursor-pointer active:scale-95"
              >
                {options?.cancelText || "Hủy bỏ"}
              </button>
              <button
                onClick={handleConfirm}
                className={`text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer py-2.5 px-4 active:scale-95 ${
                  isDanger 
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-md border border-rose-500' 
                    : isWarning 
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-md border border-amber-500'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-md border border-blue-500'
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
