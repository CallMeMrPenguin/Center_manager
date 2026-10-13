import { useState, createContext, useContext, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export type ConfirmFunction = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFunction | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}

export interface ConfirmProviderProps {
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-white border border-slate-300 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${
                  isDanger 
                    ? 'bg-rose-50 text-rose-600' 
                    : isWarning 
                    ? 'bg-amber-50 text-amber-600' 
                    : 'bg-blue-50 text-blue-600'
                }`}>
                  {isDanger || isWarning ? <AlertTriangle size={20} /> : <HelpCircle size={20} />}
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {options?.title || 'Xác nhận thao tác'}
                </h3>
              </div>
              <button
                onClick={handleCancel}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                {options?.message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                {options?.cancelText || 'Hủy bỏ'}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-2xs cursor-pointer ${
                  isDanger
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : isWarning
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {options?.confirmText || 'Đồng ý'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </ConfirmContext.Provider>
  );
}

export default ConfirmProvider;
