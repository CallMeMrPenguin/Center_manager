import React, { useState, useMemo } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Flame, Zap } from 'lucide-react';
import { trunc1Dec } from '../../../utils';

interface LearningBottlenecksSectionProps {
  studentRankings: any[];
  selectedClassId: string;
}

export const LearningBottlenecksSection: React.FC<LearningBottlenecksSectionProps> = ({
  studentRankings,
  selectedClassId,
}) => {
  const [isBottlenecksSectionOpen, setIsBottlenecksSectionOpen] = useState(false);

  const learningBottlenecks = useMemo(() => {
    const rawList = selectedClassId ? studentRankings.filter(r => String(r.class_id) === selectedClassId) : studentRankings;
    if (!rawList || rawList.length === 0) return { type1: [], type2: [] };
    const type1: any[] = [];
    const type2: any[] = [];
    rawList.forEach(s => {
      const hw = Number(s.avg_homework || 0);
      const c1 = Number(s.avg_check_1 || 0);
      const c2 = Number(s.avg_check_2 || 0);
      const inClass = Math.max(c1, c2);
      if (hw >= 8.5 && inClass <= 5.5 && inClass > 0) {
        type1.push({ ...s, gap: trunc1Dec(hw - inClass), hw: trunc1Dec(hw), inClass: trunc1Dec(inClass) });
      } else if (inClass >= 8.5 && hw <= 5.5 && hw > 0) {
        type2.push({ ...s, gap: trunc1Dec(inClass - hw), hw: trunc1Dec(hw), inClass: trunc1Dec(inClass) });
      }
    });
    return { type1, type2 };
  }, [studentRankings, selectedClassId]);

  return (
    <div className="bg-white dark:bg-[#0b0f19] border border-slate-300/80 dark:border-[#1b253b] rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.08),0_2px_4px_-1px_rgba(15,23,42,0.04)] dark:shadow-xl space-y-6 animate-cascade-5">
      <div onClick={() => setIsBottlenecksSectionOpen(!isBottlenecksSectionOpen)} className="flex flex-wrap items-center justify-between gap-4 cursor-pointer select-none border-b border-slate-200 dark:border-[#161f33] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0">
            <HelpCircle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              CHẨN ĐOÁN NÚT THẮT HỌC TẬP (BOTTLENECKS)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              Phát hiện sự chênh lệch bất thường giữa kết quả kiểm tra trên lớp và bài tập về nhà.
            </p>
          </div>
        </div>
        <div className="p-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-200 dark:bg-[#1c202c] dark:hover:bg-[#252a3a] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-0 shadow-xs hover:shadow-sm transition cursor-pointer flex items-center justify-center">
          {isBottlenecksSectionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {isBottlenecksSectionOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl bg-amber-500/5 dark:bg-[#14121a] border border-amber-500/20 dark:border-amber-500/30 space-y-3">
            <h4 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <Flame size={14} /> BTVN Cao - Kiểm Tra Lớp Thấp ({learningBottlenecks.type1.length})
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Nguy cơ nhờ người làm hộ BTVN hoặc áp lực tâm lý phòng thi.</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
              {learningBottlenecks.type1.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-50 dark:bg-black/30 border border-slate-200/50 dark:border-transparent">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{s.full_name}</span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono">BTVN: {s.hw} | Lớp: {s.inClass} (Chênh: {s.gap})</span>
                </div>
              ))}
              {learningBottlenecks.type1.length === 0 && <span className="text-xs text-slate-400 dark:text-slate-500 italic">Không có học sinh trong nhóm này</span>}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-500/5 dark:bg-[#0e1622] border border-blue-500/20 dark:border-cyan-500/30 space-y-3">
            <h4 className="text-xs font-black uppercase text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
              <Zap size={14} /> Kiểm Tra Lớp Cao - BTVN Thấp ({learningBottlenecks.type2.length})
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Học sinh có tố chất nhưng lười làm bài tập hoặc thiếu kỷ luật.</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
              {learningBottlenecks.type2.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-50 dark:bg-black/30 border border-slate-200/50 dark:border-transparent">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{s.full_name}</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-mono">Lớp: {s.inClass} | BTVN: {s.hw} (Chênh: {s.gap})</span>
                </div>
              ))}
              {learningBottlenecks.type2.length === 0 && <span className="text-xs text-slate-400 dark:text-slate-500 italic">Không có học sinh trong nhóm này</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
