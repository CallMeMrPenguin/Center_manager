import React from 'react';
import { FileCheck2, X, ArrowLeftRight } from 'lucide-react';
import { GradingPair } from '../../types';

interface GradingPairsModalProps {
  isOpen: boolean;
  gradingPairs: GradingPair[];
  onClose: () => void;
}

export const GradingPairsModal: React.FC<GradingPairsModalProps> = ({
  isOpen,
  gradingPairs,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-mac-dropdown">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-indigo-600" />
            <span>Danh Sách Phân Công Chấm Bài Đổi Đề</span>
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-slate-600 font-medium">
            Thuật toán ghép cặp 1-đối-1 (Cả 2 học sinh đổi bài cho nhau) sao cho tối ưu điểm số và tránh trùng Nhóm / Bàn:
          </p>
          <div className="space-y-2">
            {gradingPairs.map((p, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                  p.same_group_conflict
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <span className="font-extrabold text-slate-900">{p.student1_name || p.grader_name}</span>
                <div className="flex items-center gap-1 text-indigo-600 font-extrabold text-xs">
                  <ArrowLeftRight size={13} className="shrink-0" />
                  <span>Đổi bài với</span>
                </div>
                <span className="font-extrabold text-slate-900">{p.student2_name || p.owner_name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 flex justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition cursor-pointer shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
