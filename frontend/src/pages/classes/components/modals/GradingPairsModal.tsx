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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-mac-dropdown">
      <div className="bg-[#0f1320] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#14192b]">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-indigo-400" />
            <span>Danh Sách Phân Công Chấm Bài Đổi Đề</span>
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-slate-400 font-medium">
            Thuật toán ghép cặp 1-đối-1 (Cả 2 học sinh đổi bài cho nhau) sao cho tối ưu điểm số và tránh trùng Nhóm / Bàn:
          </p>
          <div className="space-y-2">
            {gradingPairs.map((p, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                  p.same_group_conflict
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-[#14192b] border-white/10 text-white'
                }`}
              >
                <span>{p.student1_name || p.grader_name}</span>
                <div className="flex items-center gap-1 text-indigo-400 font-extrabold text-xs">
                  <ArrowLeftRight size={13} className="shrink-0" />
                  <span>Đổi bài với</span>
                </div>
                <span>{p.student2_name || p.owner_name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#5c36f5] text-white text-xs font-bold rounded-xl hover:bg-[#7351f7] transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
