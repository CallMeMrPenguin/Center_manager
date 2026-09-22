import React, { useEffect } from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

interface ExamWarningModalProps {
  isOpen: boolean;
  violationCount: number;
  reason: string;
  onDismiss: () => void;
}

export const ExamWarningModal: React.FC<ExamWarningModalProps> = ({
  isOpen,
  violationCount,
  reason,
  onDismiss,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onDismiss]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-white border-2 border-rose-300 rounded-3xl w-full max-w-md p-6 shadow-2xl text-center space-y-5 relative">
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          title="Đóng cảnh báo (Esc)"
        >
          <X size={18} />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600 animate-pulse">
          <ShieldAlert size={36} />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-rose-700 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 inline-block">
            Cảnh Báo Vi Phạm Phòng Thi
          </span>
          <h3 className="text-lg font-black text-slate-900">
            Phát Hiện Rời Khỏi Màn Hình Làm Bài!
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Hệ thống đã ghi nhận hành động: <strong className="text-rose-600">{reason || 'Rời khỏi trang thi'}</strong>.
          </p>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-rose-800 font-bold">
            <AlertTriangle size={16} />
            <span>Tổng số lần vi phạm:</span>
          </div>
          <span className="font-mono text-base font-black text-rose-700 bg-rose-100 px-3 py-0.5 rounded-lg border border-rose-300">
            {violationCount} lần
          </span>
        </div>

        <p className="text-[11px] text-slate-500 italic">
          Lưu ý: Mọi lần chuyển tab hoặc rời màn hình đều được lưu vào báo cáo bài làm của học sinh.
        </p>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition cursor-pointer active:scale-98"
        >
          Tôi Đã Hiểu & Tiếp Tục Làm Bài
        </button>
      </div>
    </div>
  );
};
