import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, RotateCcw } from 'lucide-react';

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

export interface ShowToastOptions {
  message: string;
  title?: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function showToast(
  messageOrOptions: string | ShowToastOptions,
  type: ToastType = 'success',
  actionLabel?: string,
  onClickAction?: () => void
) {
  if (typeof window === 'undefined') return;

  if (typeof messageOrOptions === 'object' && messageOrOptions !== null) {
    const event = new CustomEvent('show-animated-toast', { detail: messageOrOptions });
    window.dispatchEvent(event);
  } else {
    const action = actionLabel && onClickAction ? { label: actionLabel, onClick: onClickAction } : undefined;
    const event = new CustomEvent('show-animated-toast', {
      detail: {
        message: messageOrOptions,
        type,
        action,
      },
    });
    window.dispatchEvent(event);
  }
}

showToast.success = (message: string, title?: string) => showToast({ message, type: 'success', title });
showToast.error = (message: string, title?: string) => showToast({ message, type: 'error', title });
showToast.warning = (message: string, title?: string) => showToast({ message, type: 'warning', title });
showToast.info = (message: string, title?: string) => showToast({ message, type: 'info', title });

export const AnimatedToastProvider: React.FC<{
  children: React.ReactNode;
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-left';
  maxToasts?: number;
}> = ({ children, position = 'bottom-right', maxToasts = 4 }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { ...toast, id };

      setToasts((prev) => [newToast, ...prev].slice(0, maxToasts));

      const duration = toast.duration || (toast.action ? 6000 : 4000);
      setTimeout(() => {
        removeToast(id);
      }, duration);

      return id;
    },
    [maxToasts, removeToast]
  );

  useEffect(() => {
    const handleCustomToast = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.message) {
        addToast(detail);
      }
    };

    window.addEventListener('show-animated-toast', handleCustomToast);
    window.addEventListener('show-toast', handleCustomToast);
    return () => {
      window.removeEventListener('show-animated-toast', handleCustomToast);
      window.removeEventListener('show-toast', handleCustomToast);
    };
  }, [addToast]);

  const positionClasses = {
    'top-right': 'top-5 right-5 items-end',
    'top-center': 'top-5 left-1/2 -translate-x-1/2 items-center',
    'bottom-right': 'bottom-5 right-5 items-end',
    'bottom-left': 'bottom-5 left-5 items-start',
  }[position];

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}

      {/* Render Stacked Toasts with Framer Motion 3D Depth & Zero-Blur GPU Surface */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed z-[99999] pointer-events-none flex flex-col gap-2.5 ${positionClasses}`}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast, index) => {
            const isBottom = position.startsWith('bottom');
            const scale = isHovered ? 1 : 1 - index * 0.04;
            const y = isHovered ? 0 : (isBottom ? -index * 6 : index * 6);
            const opacity = isHovered ? 1 : 1 - index * 0.15;

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: isBottom ? 20 : -20, scale: 0.9 }}
                animate={{ opacity, y, scale }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                style={{ zIndex: 100 - index }}
                className="pointer-events-auto"
              >
                <ToastCard toast={toast} onClose={() => removeToast(toast.id)} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onClose: () => void }> = ({ toast, onClose }) => {
  const typeStyles = {
    success: {
      border: 'border-emerald-500/40',
      bg: 'bg-[#0c1320]',
      icon: <CheckCircle2 className="text-emerald-400 shrink-0" size={18} />,
      titleColor: 'text-emerald-300',
    },
    error: {
      border: 'border-rose-500/40',
      bg: 'bg-[#180e1a]',
      icon: <AlertCircle className="text-rose-400 shrink-0" size={18} />,
      titleColor: 'text-rose-300',
    },
    warning: {
      border: 'border-amber-500/40',
      bg: 'bg-[#18130c]',
      icon: <AlertTriangle className="text-amber-400 shrink-0" size={18} />,
      titleColor: 'text-amber-300',
    },
    info: {
      border: 'border-indigo-500/40',
      bg: 'bg-[#0c0f20]',
      icon: <Info className="text-indigo-400 shrink-0" size={18} />,
      titleColor: 'text-indigo-300',
    },
    default: {
      border: 'border-white/15',
      bg: 'bg-[#0f1322]',
      icon: <Info className="text-slate-400 shrink-0" size={18} />,
      titleColor: 'text-white',
    },
  }[toast.type || 'default'];

  return (
    <div
      className={`w-80 sm:w-96 p-3.5 rounded-2xl border ${typeStyles.border} ${typeStyles.bg} shadow-[0_16px_40px_rgba(0,0,0,0.95)] flex items-start gap-3 select-none`}
    >
      <div className="mt-0.5">{typeStyles.icon}</div>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className={`text-xs font-black ${typeStyles.titleColor} truncate mb-0.5`}>
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
  const [isHovered, setIsHovered] = useState(false);
  const visible = toasts.slice(0, maxVisible);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2.5 items-end pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {visible.map((t, idx) => {
          const scale = isHovered ? 1 : 1 - idx * 0.04;
          const y = isHovered ? 0 : -idx * 6;
          const opacity = isHovered ? 1 : 1 - idx * 0.15;

          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity, y, scale }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              style={{ zIndex: 100 - idx }}
              className="pointer-events-auto"
            >
              <ToastCard toast={t} onClose={() => onRemove(t.id)} />
            </motion.div>
          );
        })}
      </AnimatePresence>
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
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] bg-[#0c0f1e] border border-[#212c4b] rounded-2xl p-4 shadow-2xl flex items-center gap-4 select-none min-w-[320px] overflow-hidden"
        >
          <span className="text-xs font-bold text-white flex-1">{message}</span>
          <button
            type="button"
            onClick={() => {
              onUndo();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] text-white text-xs font-black transition cursor-pointer shadow-[0_0_14px_rgba(92,54,245,0.5)]"
          >
            <RotateCcw size={13} />
            <span>Hoàn tác</span>
          </button>

          {/* Animated Progress countdown bar */}
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
            onAnimationComplete={onClose}
            className="absolute bottom-0 left-0 h-1 bg-[#5c36f5]"
          />
        </motion.div>
      )}
    </AnimatePresence>
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

export default AnimatedToastProvider;
