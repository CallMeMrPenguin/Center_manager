import React, { useMemo, useState, useEffect } from 'react';
import { FileCheck2, X, ArrowRight, ArrowLeft, UserX, Copy, Check, RotateCw, RotateCcw } from 'lucide-react';
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

const COLS = 5;

export default function BlossomResultModal({ isOpen, onClose, pairs, unmatched = [] }: BlossomResultModalProps) {
  const [copied, setCopied] = useState(false);
  const [excludedNames, setExcludedNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) setExcludedNames(new Set());
  }, [isOpen, pairs]);

  const initialNodes = useMemo(() => {
    if (!pairs || pairs.length === 0) return [];
    const pairMap = new Map<string, SwapPair>();
    pairs.forEach((p) => {
      const g = (p.grader_name || p.student1_name || '').trim();
      if (g) pairMap.set(g, p);
    });

    const nodes: { name: string; group?: string }[] = [];
    const visited = new Set<string>();
    let current = pairs[0];
    while (current) {
      const gName = (current.grader_name || current.student1_name || '').trim();
      const oName = (current.owner_name || current.student2_name || '').trim();
      if (visited.has(gName)) break;
      visited.add(gName);
      nodes.push({ name: gName, group: current.grader_group || current.student1_group });
      current = pairMap.get(oName)!;
    }

    if (nodes.length < pairs.length) {
      pairs.forEach((p) => {
        const gName = (p.grader_name || p.student1_name || '').trim();
        if (!visited.has(gName)) {
          visited.add(gName);
          nodes.push({ name: gName, group: p.grader_group || p.student1_group });
        }
      });
    }
    return nodes;
  }, [pairs]);

  const activeNodes = useMemo(() => initialNodes.filter((n) => !excludedNames.has(n.name)), [initialNodes, excludedNames]);

  const orderedChain = useMemo(() => {
    if (activeNodes.length < 2) return [];
    return activeNodes.map((node, idx) => ({
      name: node.name,
      targetName: activeNodes[(idx + 1) % activeNodes.length].name,
      group: node.group,
    }));
  }, [activeNodes]);

  const snakeRows = useMemo(() => {
    if (activeNodes.length < 2) return [];
    const items = activeNodes.map((n, i) => ({
      name: n.name,
      group: n.group,
      idx: i + 1,
      isFirst: i === 0,
      isLoopback: false,
    }));
    items.push({ name: 'Khép vòng', group: '', idx: 0, isFirst: false, isLoopback: true });

    const rows: (typeof items)[] = [];
    for (let i = 0; i < items.length; i += COLS) rows.push(items.slice(i, i + COLS));
    return rows;
  }, [activeNodes]);

  const handleExclude = (name: string) => {
    setExcludedNames((prev) => new Set([...prev, name]));
    showToast(`Đã loại ${name} khỏi sơ đồ (tự động chuyển cho bạn kế tiếp)`, 'info');
  };

  const handleRestore = (name: string) => {
    setExcludedNames((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
    showToast(`Đã khôi phục ${name} vào sơ đồ chuyển bài`, 'success');
  };

  const handleResetExclusions = () => {
    setExcludedNames(new Set());
    showToast('Đã khôi phục lại toàn bộ danh sách ban đầu', 'success');
  };

  const combinedUnmatched = useMemo(() => {
    const list: Array<{ name: string; group?: string; reason: string; isManual?: boolean }> = [];
    if (activeNodes.length === 1) {
      list.push({ name: activeNodes[0].name, group: activeNodes[0].group, reason: 'Chỉ còn 1 học sinh, không thể tạo cặp đổi bài', isManual: false });
    }
    initialNodes.filter((n) => excludedNames.has(n.name)).forEach((n) => {
      list.push({ name: n.name, group: n.group, reason: 'Đã loại khỏi chu trình (Không nộp BTVN / không có bài)', isManual: true });
    });
    unmatched.forEach((u) => list.push({ name: u.name, group: u.group, reason: u.reason, isManual: false }));
    return list;
  }, [initialNodes, excludedNames, activeNodes, unmatched]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (orderedChain.length === 0) return;
    const text = orderedChain.map((item, idx) => `${idx + 1}. ${item.name} ➔ ${item.targetName}`).join('\n');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      showToast('Đã sao chép danh sách đổi bài chéo vào bộ nhớ tạm!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const totalRows = snakeRows.length;
  const loopbackSpineH = totalRows > 1 ? (totalRows - 1) * 80 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-mac-dropdown">
      <div className="bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121624]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <FileCheck2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Sơ Đồ Chuyển Bài</h3>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>Chu trình khép kín</span>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{orderedChain.length} học sinh</span>
                {excludedNames.size > 0 && <span className="text-rose-500 font-bold">({excludedNames.size} đã loại)</span>}
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Subheader Banner */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <RotateCw size={14} />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">Mỗi học sinh chuyển bài cho người tiếp theo</span>
            <span className="text-slate-400 dark:text-slate-500 font-medium text-[11px] hidden sm:inline">(Bấm vào thẻ học sinh để loại bỏ nếu không nộp BTVN)</span>
          </div>

          {orderedChain.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium space-y-3">
              <p>Chưa có phân công chuyển bài nào (cần tối thiểu 2 học sinh).</p>
              {excludedNames.size > 0 && (
                <button type="button" onClick={handleResetExclusions} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-600/20 transition cursor-pointer border-0">
                  <RotateCcw size={13} />
                  <span>Khôi phục tất cả học sinh ({excludedNames.size})</span>
                </button>
              )}
            </div>
          ) : (
            /* Snake Flow Diagram Workspace */
            <div className="overflow-x-auto py-2">
              <div className="min-w-[860px] mx-auto relative pl-12 pr-12 py-3 select-none">
                {/* Green Loopback Spine Line from Khép Vòng back to Node 1 */}
                {totalRows > 1 && (
                  <svg className="absolute -left-3 top-[32px] pointer-events-none text-emerald-500 dark:text-emerald-400" style={{ height: `${loopbackSpineH}px`, width: '40px' }} viewBox={`0 0 40 ${loopbackSpineH}`} fill="none">
                    <path d={`M 40 ${loopbackSpineH} L 18 ${loopbackSpineH} A 10 10 0 0 1 8 ${loopbackSpineH - 10} L 8 10 A 10 10 0 0 1 18 0 L 36 0`} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <polygon points="36,0 28,-4 28,4" fill="currentColor" />
                  </svg>
                )}

                {/* Rows Stack */}
                <div className="space-y-[28px]">
                  {snakeRows.map((row, rIdx) => {
                    const isRtl = rIdx % 2 === 1;
                    const isLastRow = rIdx === totalRows - 1;

                    return (
                      <div key={rIdx} className="relative">
                        {/* Connecting U-Turn curve to next row */}
                        {!isLastRow && !isRtl && (
                          <div className="absolute -right-9 top-[26px] w-9 h-[80px] pointer-events-none">
                            <svg className="w-full h-full text-blue-400 dark:text-blue-500" viewBox="0 0 36 80" fill="none">
                              <path d="M 0 0 C 32 0, 32 80, 0 80" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                              <polygon points="2,80 10,75 10,85" fill="currentColor" />
                            </svg>
                          </div>
                        )}
                        {!isLastRow && isRtl && (
                          <div className="absolute -left-9 top-[26px] w-9 h-[80px] pointer-events-none">
                            <svg className="w-full h-full text-blue-400 dark:text-blue-500" viewBox="0 0 36 80" fill="none">
                              <path d="M 36 0 C 4 0, 4 80, 36 80" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                              <polygon points="34,80 26,75 26,85" fill="currentColor" />
                            </svg>
                          </div>
                        )}

                        {/* Row Elements */}
                        <div className={`flex items-center gap-2.5 ${isRtl ? 'flex-row-reverse justify-start' : 'flex-row justify-start'}`}>
                          {row.map((item, cIdx) => {
                            const isRowEnd = cIdx === row.length - 1;
                            if (item.isLoopback) {
                              return (
                                <div key="loopback" className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shrink-0 border border-emerald-500/40 transition select-none">
                                  <RotateCw size={13} className="shrink-0" />
                                  <span>Khép vòng</span>
                                </div>
                              );
                            }

                            return (
                              <React.Fragment key={item.name}>
                                {/* Student Card */}
                                <div
                                  onClick={() => handleExclude(item.name)}
                                  className={`group relative flex items-center justify-between w-[150px] sm:w-[158px] h-[52px] px-3.5 rounded-2xl transition-all duration-150 cursor-pointer ${
                                    item.isFirst
                                      ? 'border-2 border-emerald-500 bg-emerald-50/60 dark:bg-emerald-500/10 shadow-[0_0_14px_rgba(16,185,129,0.2)]'
                                      : 'border border-blue-200/80 dark:border-white/10 bg-white dark:bg-[#161c30] shadow-2xs hover:border-rose-400 hover:bg-rose-50/30 dark:hover:bg-rose-500/10 hover:shadow-xs'
                                  }`}
                                  title={`Bấm để loại ${item.name} khỏi sơ đồ (không nộp BTVN)`}
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center shrink-0 shadow-2xs ${item.isFirst ? 'bg-emerald-600 text-white' : 'bg-blue-500 text-white'}`}>
                                      {item.idx}
                                    </span>
                                    <span className="font-bold text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 truncate">
                                      {item.name}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleExclude(item.name); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer border-0 shrink-0"
                                    title="Loại học sinh này"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>

                                {/* Horizontal Directional Arrow */}
                                {!isRowEnd && (
                                  <div className="shrink-0 flex items-center justify-center">
                                    {isRtl ? (
                                      <ArrowLeft size={16} className="text-blue-500 dark:text-blue-400" strokeWidth={2.5} />
                                    ) : (
                                      <ArrowRight size={16} className="text-blue-500 dark:text-blue-400" strokeWidth={2.5} />
                                    )}
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Unmatched / Excluded Section */}
          {combinedUnmatched.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
                  <UserX size={14} />
                  Không tham gia chấm ({combinedUnmatched.length})
                </h4>
                {excludedNames.size > 0 && (
                  <button type="button" onClick={handleResetExclusions} className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer border-0 bg-transparent p-0">
                    <RotateCcw size={11} />
                    Khôi phục tất cả ({excludedNames.size})
                  </button>
                )}
              </div>

              <div className="space-y-1">
                {combinedUnmatched.map((u, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-white/5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{u.name}</span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">{u.reason}</span>
                    </div>
                    {u.isManual && (
                      <button
                        type="button"
                        onClick={() => handleRestore(u.name)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold transition cursor-pointer border-0"
                        title="Khôi phục học sinh này vào sơ đồ"
                      >
                        <RotateCcw size={11} />
                        <span>Thêm lại</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#121624]">
          {excludedNames.size > 0 ? (
            <button
              type="button"
              onClick={handleResetExclusions}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition cursor-pointer border-0"
            >
              <RotateCcw size={13} />
              <span>Khôi phục tất cả ({excludedNames.size})</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopy}
              disabled={orderedChain.length === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép sơ đồ'}</span>
            </button>

            <button type="button" onClick={onClose} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-sm border-0">
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
