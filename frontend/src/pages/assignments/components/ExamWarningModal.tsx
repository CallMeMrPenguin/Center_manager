import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-[#0f1322] border-2 border-rose-500/80 rounded-3xl w-full max-w-md p-6 shadow-[0_0_60px_rgba(244,63,94,0.4)] text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400 animate-pulse">
          <ShieldAlert size={36} />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-rose-400 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 inline-block">
            Cảnh Báo Vi Phạm Phòng Thi
          </span>
          <h3 className="text-lg font-black text-white">
            Phát Hiện Rời Khỏi Màn Hình Làm Bài!
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Hệ thống đã ghi nhận hành động: <strong className="text-rose-300">{reason || 'Rời khỏi trang thi'}</strong>.
          </p>
        </div>

        <div className="bg-rose-950/40 border border-rose-500/30 rounded-2xl p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-rose-300 font-bold">
            <AlertTriangle size={16} />
            <span>Tổng số lần vi phạm:</span>
          </div>
          <span className="font-mono text-base font-black text-rose-400 bg-rose-500/20 px-3 py-0.5 rounded-lg border border-rose-500/40">
            {violationCount} lần
          </span>
        </div>

        <p className="text-[11px] text-slate-400 italic">
          Lưu ý: Mọi lần chuyển tab, thu nhỏ cửa sổ hoặc mất tiêu điểm đều được tự động lưu vào báo cáo chấm điểm gửi cho giáo viên.
        </p>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-[0_0_20px_rgba(244,63,94,0.5)] transition cursor-pointer active:scale-98"
        >
          Tôi Đã Hiểu & Tiếp Tục Làm Bài
        </button>
      </div>
    </div>
  );
};
