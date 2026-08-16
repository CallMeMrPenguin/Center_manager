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
    <div className="bg-[#0b0f19] border border-[#1b253b] rounded-2xl p-6 shadow-xl space-y-6 animate-cascade-5">
      <div onClick={() => setIsBottlenecksSectionOpen(!isBottlenecksSectionOpen)} className="flex flex-wrap items-center justify-between gap-4 cursor-pointer select-none border-b border-[#161f33] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <HelpCircle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              CHẨN ĐOÁN NÚT THẮT HỌC TẬP (BOTTLENECKS)
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Phát hiện sự chênh lệch bất thường giữa kết quả kiểm tra trên lớp và bài tập về nhà.
            </p>
          </div>
        </div>
        <div className="p-1 rounded-lg text-slate-400 hover:text-white">
          {isBottlenecksSectionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {isBottlenecksSectionOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl bg-[#14121a] border border-amber-500/30 space-y-3">
            <h4 className="text-xs font-black uppercase text-amber-400 flex items-center gap-2">
              <Flame size={14} /> BTVN Cao - Kiểm Tra Lớp Thấp ({learningBottlenecks.type1.length})
            </h4>
            <p className="text-[11px] text-slate-400">Nguy cơ nhờ người làm hộ BTVN hoặc áp lực tâm lý phòng thi.</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
              {learningBottlenecks.type1.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-black/30">
                  <span className="font-bold text-slate-200">{s.full_name}</span>
                  <span className="text-amber-400 font-mono">BTVN: {s.hw} | Lớp: {s.inClass} (Chênh: {s.gap})</span>
                </div>
              ))}
              {learningBottlenecks.type1.length === 0 && <span className="text-xs text-slate-500 italic">Không có học sinh trong nhóm này</span>}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#121624] border border-blue-500/30 space-y-3">
            <h4 className="text-xs font-black uppercase text-blue-400 flex items-center gap-2">
              <Zap size={14} /> Kiểm Tra Lớp Cao - BTVN Thấp ({learningBottlenecks.type2.length})
            </h4>
            <p className="text-[11px] text-slate-400">Học sinh có tố chất nhưng lười làm bài tập về nhà hoặc thiếu thời gian.</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
              {learningBottlenecks.type2.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-black/30">
                  <span className="font-bold text-slate-200">{s.full_name}</span>
                  <span className="text-blue-400 font-mono">Lớp: {s.inClass} | BTVN: {s.hw} (Chênh: {s.gap})</span>
                </div>
              ))}
              {learningBottlenecks.type2.length === 0 && <span className="text-xs text-slate-500 italic">Không có học sinh trong nhóm này</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
