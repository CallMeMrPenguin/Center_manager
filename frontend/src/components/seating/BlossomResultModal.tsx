import React from 'react';
import { FileCheck2, X, AlertTriangle, CheckCircle2, UserX, ArrowLeftRight } from 'lucide-react';

interface SwapPair {
  student1_id?: number;
  student1_name: string;
  student1_group?: string;
  student2_id?: number;
  student2_name: string;
  student2_group?: string;
  same_group_conflict?: boolean;
  is_trusted?: boolean;
}

interface UnmatchedStudent {
  id?: number;
  name: string;
  group?: string;
  reason: string;
}

interface BlossomResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  pairs: SwapPair[];
  unmatched?: UnmatchedStudent[];
}

export default function BlossomResultModal({ isOpen, onClose, pairs, unmatched = [] }: BlossomResultModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-mac-dropdown">
      <div className="bg-[#0f1320] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#14192b]">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-indigo-400" />
            <span>Phân Công Đổi Bài (Blossom Matching)</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Matched Pairs */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-black uppercase text-indigo-400 tracking-wider">
              Danh sách cặp đổi bài ({pairs.length})
            </h4>

            {pairs.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 text-center text-xs text-slate-500 font-medium">
                Chưa có cặp đổi bài nào được tạo.
              </div>
            ) : (
              pairs.map((p, idx) => {
                const hasConflict = p.same_group_conflict;
                const isTrusted = p.is_trusted;

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                      hasConflict
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                        : isTrusted
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                        : 'bg-[#14192b] border-white/10 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <CheckCircle2 size={15} className={hasConflict ? 'text-rose-400' : isTrusted ? 'text-amber-400' : 'text-emerald-400'} />
                      <div className="truncate">
                        <span className="text-white font-extrabold">{p.student1_name}</span>
                        {p.student1_group && p.student1_group !== 'N/A' && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                            {p.student1_group}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="px-3 text-center shrink-0 flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1 text-indigo-400 font-extrabold text-[11px]">
                        <ArrowLeftRight size={13} className="shrink-0" />
                        <span>Đổi bài</span>
                      </div>
                      {isTrusted && (
                        <span className="text-[9px] text-amber-400 font-extrabold">Đã tin cậy</span>
                      )}
                      {hasConflict && (
                        <span className="text-[9px] text-rose-400 font-extrabold">Trùng nhóm</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end text-right">
                      <div className="truncate">
                        <span className="text-white font-extrabold">{p.student2_name}</span>
                        {p.student2_group && p.student2_group !== 'N/A' && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                            {p.student2_group}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Unmatched Students */}
          {unmatched.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-white/10">
              <h4 className="text-[11px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <UserX size={14} />
                Học sinh chưa thể ghép cặp ({unmatched.length})
              </h4>
              
              <div className="space-y-1.5">
                {unmatched.map((u, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#181d2f] border border-amber-500/30 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-white">{u.name}</span>
                      {u.group && u.group !== 'N/A' && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                          {u.group}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-amber-400 font-bold block">{u.reason}</span>
                      <span className="text-[10px] text-slate-400 font-medium italic">Gợi ý: Gán vào nhóm 3 người đổi bài vòng tròn</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end bg-[#14192b]">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#5c36f5] hover:bg-[#7351f7] text-white text-xs font-bold rounded-xl transition cursor-pointer border border-white/20"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
