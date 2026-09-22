import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface DuplicateWarningModalProps {
  message: string | null;
  onClose: () => void;
}

export const DuplicateWarningModal: React.FC<DuplicateWarningModalProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-black/60 select-none animate-fade-in font-sans">
      <div className="bg-white border border-amber-300 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
            <AlertCircle size={22} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Cảnh Báo Trùng Tên Học Sinh
            </h3>
            <p className="text-[11px] text-amber-700 font-semibold">Cần điền đầy đủ thông tin định danh</p>
          </div>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          {message}
        </p>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition cursor-pointer shadow-md"
          >
            Đã Hiểu & Điền Tiếp
          </button>
        </div>
      </div>
    </div>
  );
};
