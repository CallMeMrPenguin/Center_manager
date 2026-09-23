import React, { useMemo, useState } from 'react';
import { FileCheck2, X, ArrowRight, UserX, Copy, Check, RotateCw } from 'lucide-react';
import { showToast } from '../Toast';

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
  const [copied, setCopied] = useState(false);

  // Build the ordered circular chain A -> B -> C -> ... -> A
  const orderedChain = useMemo(() => {
    if (!pairs || pairs.length === 0) return [];

    const pairMap = new Map<string, SwapPair>();
    pairs.forEach((p) => {
      const g = (p.grader_name || p.student1_name || '').trim();
      if (g) pairMap.set(g, p);
    });

    const chain: { name: string; targetName: string; group?: string; sameGroupConflict?: boolean }[] = [];
    const visited = new Set<string>();

    let current = pairs[0];
    while (current) {
      const gName = (current.grader_name || current.student1_name || '').trim();
      const oName = (current.owner_name || current.student2_name || '').trim();
      if (visited.has(gName)) break;
      visited.add(gName);

      chain.push({
        name: gName,
        targetName: oName,
        group: current.grader_group || current.student1_group,
        sameGroupConflict: current.same_group_conflict,
      });

      current = pairMap.get(oName)!;
    }

    // Append any disconnected pairs if present
    if (chain.length < pairs.length) {
      pairs.forEach((p) => {
        const gName = (p.grader_name || p.student1_name || '').trim();
        const oName = (p.owner_name || p.student2_name || '').trim();
        if (!visited.has(gName)) {
          visited.add(gName);
          chain.push({
            name: gName,
            targetName: oName,
            group: p.grader_group || p.student1_group,
            sameGroupConflict: p.same_group_conflict,
          });
        }
      });
    }

    return chain;
  }, [pairs]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (orderedChain.length === 0) return;
    const text = orderedChain
      .map((item, idx) => `${idx + 1}. ${item.name} ➔ ${item.targetName}`)
      .join('\n');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      showToast('Đã sao chép danh sách đổi bài chéo vào bộ nhớ tạm!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-mac-dropdown">
      <div className="bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121624]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Sơ Đồ Chuyển Bài
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Chu trình khép kín ({orderedChain.length} học sinh)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content: No Card-in-Card, directly on modal background */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {orderedChain.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-medium">
              Chưa có phân công chuyển bài nào.
            </div>
          ) : (
            <>
              {/* Flow ribbon directly on modal background */}
              <div className="flex flex-wrap items-center gap-1.5 py-1 select-none">
                {orderedChain.map((node, idx) => (
                  <React.Fragment key={idx}>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/5 text-xs font-bold text-slate-800 dark:text-slate-100">
                      <span className="text-[10px] font-mono font-black text-indigo-600 dark:text-indigo-400">
                        {idx + 1}.
                      </span>
                      <span>{node.name}</span>
                    </div>
                    <ArrowRight size={13} className="text-indigo-500 dark:text-indigo-400 shrink-0" />
                  </React.Fragment>
                ))}
                {/* Loopback indicator */}
                {orderedChain.length > 0 && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black">
                    <RotateCw size={11} />
                    <span>Khép về {orderedChain[0]?.name}</span>
                  </div>
                )}
              </div>

              {/* Minimal 2-Column List with clean dividers, zero card-in-card */}
              <div className="pt-3 border-t border-slate-100 dark:border-white/5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  {orderedChain.map((item, idx) => {
                    const isLast = idx === orderedChain.length - 1;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-white/5 text-xs"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono text-[11px] font-bold text-slate-400 w-5">
                            {idx + 1}.
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {item.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <ArrowRight size={12} className="text-indigo-400 dark:text-indigo-500" />
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {item.targetName}
                          </span>
                          {isLast && (
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                              (Khép vòng)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Unmatched Students */}
          {unmatched.length > 0 && (
            <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-white/5">
              <h4 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
                <UserX size={14} />
                Không tham gia chấm ({unmatched.length})
              </h4>

              <div className="space-y-1">
                {unmatched.map((u, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{u.name}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">{u.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#121624]">
          <button
            type="button"
            onClick={handleCopy}
            disabled={orderedChain.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-xs font-bold transition cursor-pointer border-0 disabled:opacity-50"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép sơ đồ'}</span>
          </button>

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
}
