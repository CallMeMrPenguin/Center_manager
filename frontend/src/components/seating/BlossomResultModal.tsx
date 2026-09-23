import React from 'react';
import { FileCheck2, X, AlertTriangle, CheckCircle2, UserX, ArrowRight, UserCheck, FileText } from 'lucide-react';

interface SwapPair {
  student1_id?: number;
  student1_name: string;
  student1_group?: string;
  student2_id?: number;
  student2_name: string;
  student2_group?: string;
  grader_name?: string;
  owner_name?: string;
  grader_group?: string;
  owner_group?: string;
  same_group_conflict?: boolean;
  is_trusted?: boolean;
  step?: number;
  total?: number;
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
      <div className="bg-white dark:bg-[#121624] border-0 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#161c30]">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Phân Công Đổi Bài Chéo Vòng Tròn</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Circular Chain */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                Chu trình chấm bài khép kín ({pairs.length} học sinh — Không bị lẻ)
              </h4>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/15 px-2 py-0.5 rounded-full">
                Vòng tròn A → B → C → A
              </span>
            </div>

            {pairs.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161c30] text-center text-xs text-slate-500 dark:text-slate-400 font-medium border-0 shadow-2xs">
                Chưa có phân công đổi bài nào.
              </div>
            ) : (
              pairs.map((p, idx) => {
                const hasConflict = p.same_group_conflict;
                const isTrusted = p.is_trusted;
                const graderName = p.grader_name || p.student1_name;
                const ownerName = p.owner_name || p.student2_name;
                const graderGroup = p.grader_group || p.student1_group;
                const ownerGroup = p.owner_group || p.student2_group;
                const isLast = idx === pairs.length - 1;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border-0 flex items-center justify-between text-xs font-bold transition-all shadow-2xs ${
                      hasConflict
                        ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        : isTrusted
                        ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-50 dark:bg-[#161c30] text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {/* Grader */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-black shrink-0">
                        {idx + 1}
                      </div>
                      <div className="truncate">
                        <span className="text-slate-900 dark:text-white font-black">{graderName}</span>
                        {graderGroup && graderGroup !== 'N/A' && (
                          <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold">
                            {graderGroup}
                          </span>
                        )}
                        <span className="block text-[9px] text-slate-600 dark:text-slate-400 font-medium">Người chấm</span>
                      </div>
                    </div>

                    {/* Arrow / Direction */}
                    <div className="px-2 text-center shrink-0 flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-black text-[10px]">
                        <span>chấm bài</span>
                        <ArrowRight size={12} className="shrink-0" />
                      </div>
                      {isLast && (
                        <span className="text-[8px] text-indigo-600 dark:text-indigo-400 font-bold">Khép vòng #1</span>
                      )}
                      {isTrusted && (
                        <span className="text-[8px] text-amber-600 dark:text-amber-400 font-bold">Đã tin cậy</span>
                      )}
                      {hasConflict && (
                        <span className="text-[8px] text-rose-600 dark:text-rose-400 font-bold">Trùng nhóm</span>
                      )}
                    </div>

                    {/* Owner */}
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end text-right">
                      <div className="truncate">
                        <span className="text-slate-900 dark:text-white font-black">{ownerName}</span>
                        {ownerGroup && ownerGroup !== 'N/A' && (
                          <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                            {ownerGroup}
                          </span>
                        )}
                        <span className="block text-[9px] text-slate-600 dark:text-slate-400 font-medium">Chủ bài thi</span>
                      </div>
                      <FileText size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Unmatched Students */}
          {unmatched.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
              <h4 className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
                <UserX size={14} />
                Học sinh không tham gia chấm ({unmatched.length})
              </h4>
              
              <div className="space-y-1.5">
                {unmatched.map((u, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-500/10 border-0 shadow-2xs flex items-center justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-white">{u.name}</span>
                      {u.group && u.group !== 'N/A' && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold">
                          {u.group}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold block">{u.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-white/10 flex justify-end bg-slate-50 dark:bg-[#161c30]">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm border-0"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
