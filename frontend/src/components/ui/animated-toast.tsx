import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, RotateCcw, Loader2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface StackedToast extends ToastItem {}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  addToast: () => '',
  removeToast: () => {},
});

export const useAnimatedToast = () => useContext(ToastContext);

export const AnimatedToastProvider: React.FC<{
  children: React.ReactNode;
  position?: 'top-right' | 'top-center' | 'bottom-right';
  maxToasts?: number;
}> = ({ children, position = 'top-right', maxToasts = 3 }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { ...toast, id };

      setToasts((prev) => [newToast, ...prev].slice(0, maxToasts));

      const duration = toast.duration || 4000;
      setTimeout(() => {
        removeToast(id);
      }, duration);

      return id;
    },
    [maxToasts, removeToast]
  );

  const positionClasses = {
    'top-right': 'top-5 right-5 items-end',
    'top-center': 'top-5 left-1/2 -translate-x-1/2 items-center',
    'bottom-right': 'bottom-5 right-5 items-end',
  }[position];

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}

      {/* Render Stacked Toasts */}
      <div className={`fixed z-[9999] pointer-events-none flex flex-col gap-2.5 ${positionClasses}`}>
        {toasts.map((toast, index) => {
          return (
            <div
              key={toast.id}
              style={{
                transform: `scale(${1 - index * 0.04}) translateY(${index * 4}px)`,
                opacity: 1 - index * 0.15,
                zIndex: 100 - index,
              }}
              className="pointer-events-auto transition-all duration-200"
            >
              <ToastCard toast={toast} onClose={() => removeToast(toast.id)} />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onClose: () => void }> = ({ toast, onClose }) => {
  const typeStyles = {
    success: {
      border: 'border-emerald-500/40',
      bg: 'bg-[#0c121e]',
      icon: <CheckCircle2 className="text-emerald-400 shrink-0" size={17} />,
      titleColor: 'text-emerald-300',
    },
    error: {
      border: 'border-rose-500/40',
      bg: 'bg-[#150d18]',
      icon: <AlertCircle className="text-rose-400 shrink-0" size={17} />,
      titleColor: 'text-rose-300',
    },
    warning: {
      border: 'border-amber-500/40',
      bg: 'bg-[#16120c]',
      icon: <AlertTriangle className="text-amber-400 shrink-0" size={17} />,
      titleColor: 'text-amber-300',
    },
    info: {
      border: 'border-indigo-500/40',
      bg: 'bg-[#0c0f1e]',
      icon: <Info className="text-indigo-400 shrink-0" size={17} />,
      titleColor: 'text-indigo-300',
    },
    default: {
      border: 'border-white/10',
      bg: 'bg-[#0f1320]',
      icon: <Info className="text-slate-400 shrink-0" size={17} />,
      titleColor: 'text-white',
    },
  }[toast.type || 'default'];

  return (
    <div
      className={`w-84 sm:w-96 p-3.5 rounded-2xl border ${typeStyles.border} ${typeStyles.bg} shadow-[0_16px_40px_rgba(0,0,0,0.9)] flex items-start gap-3 select-none animate-in fade-in slide-in-from-top-3 duration-200`}
    >
      <div className="mt-0.5">{typeStyles.icon}</div>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className={`text-xs font-black ${typeStyles.titleColor} truncate`}>
            {toast.title}
          </h4>
        )}
        <p className="text-xs text-slate-200 font-semibold leading-snug break-words">
          {toast.message}
        </p>

        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              onClose();
            }}
            className="mt-2 text-xs font-black text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const StackedNotifications: React.FC<{
  toasts: StackedToast[];
  onRemove: (id: string) => void;
  maxVisible?: number;
}> = ({ toasts, onRemove, maxVisible = 3 }) => {
  const visible = toasts.slice(0, maxVisible);

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none">
      {visible.map((t, idx) => (
        <div
          key={t.id}
          style={{
            transform: `scale(${1 - idx * 0.04}) translateY(${idx * 4}px)`,
            opacity: 1 - idx * 0.15,
            zIndex: 100 - idx,
          }}
          className="pointer-events-auto transition-all duration-200"
        >
          <ToastCard toast={t} onClose={() => onRemove(t.id)} />
        </div>
      ))}
    </div>
  );
};

export const UndoToast: React.FC<{
  open: boolean;
  onClose: () => void;
  onUndo: () => void;
  message?: string;
  duration?: number;
}> = ({ open, onClose, onUndo, message = 'Đã thực hiện thay đổi', duration = 5000 }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!open) {
      setProgress(100);
      return;
    }

    const interval = 50;
    const step = (interval / duration) * 100;
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p <= step) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return p - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#0c0f1e] border border-[#212c4b] rounded-2xl p-3.5 shadow-2xl flex items-center gap-4 select-none animate-in fade-in slide-in-from-bottom-3 duration-200 min-w-[320px]">
      <span className="text-xs font-bold text-white flex-1">{message}</span>
      <button
        type="button"
        onClick={() => {
          onUndo();
          onClose();
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] text-white text-xs font-black transition cursor-pointer shadow-md"
      >
        <RotateCcw size={13} />
        <span>Hoàn tác</span>
      </button>

      {/* Progress countdown bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 bg-[#5c36f5] rounded-b-2xl transition-all"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export function usePromiseToast() {
  const { addToast, removeToast } = useAnimatedToast();

  return useCallback(
    async <T,>({
      promise,
      loading = 'Đang xử lý...',
      success = 'Hoàn tất thành công!',
      error = 'Đã xảy ra lỗi!',
    }: {
      promise: Promise<T>;
      loading?: string;
      success?: string | ((data: T) => string);
      error?: string | ((err: any) => string);
    }): Promise<T> => {
      const toastId = addToast({
        title: 'Đang thực hiện',
        message: loading,
        type: 'info',
        duration: 20000,
      });

      try {
        const result = await promise;
        removeToast(toastId);
        const successMsg = typeof success === 'function' ? success(result) : success;
        addToast({
          title: 'Thành công',
          message: successMsg,
          type: 'success',
          duration: 3500,
        });
        return result;
      } catch (err: any) {
        removeToast(toastId);
        const errorMsg = typeof error === 'function' ? error(err) : error;
        addToast({
          title: 'Thất bại',
          message: errorMsg,
          type: 'error',
          duration: 4500,
        });
        throw err;
      }
    },
    [addToast, removeToast]
  );
}
