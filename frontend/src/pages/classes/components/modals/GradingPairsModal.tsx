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
      <div className="bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-[#161c30]">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Danh Sách Phân Công Chấm Bài 1-Đổi-1</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-3 overflow-y-auto flex-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Danh sách cặp 1-đối-1 (Cả 2 học sinh đổi bài cho nhau):
          </p>
          <div className="space-y-2">
            {gradingPairs.map((p, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold shadow-2xs ${
                  p.same_group_conflict
                    ? 'bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300'
                    : 'bg-white dark:bg-[#161c30] border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200'
                }`}
              >
                <span className="font-extrabold text-slate-900 dark:text-white">{p.student1_name || p.grader_name}</span>
                <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs">
                  <ArrowLeftRight size={13} className="shrink-0" />
                  <span>Đổi bài với</span>
                </div>
                <span className="font-extrabold text-slate-900 dark:text-white">{p.student2_name || p.owner_name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200/80 dark:border-white/10 flex justify-end bg-slate-50 dark:bg-[#161c30]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-xs border-0"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
