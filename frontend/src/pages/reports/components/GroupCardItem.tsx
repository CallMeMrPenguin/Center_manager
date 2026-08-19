import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getStudentTier } from '../types';
import { format1Dec } from '../../../utils';

interface GroupCardItemProps {
  group: any;
  onSelectRankingStudent?: (studentId: number) => void;
}

export const GroupCardItem: React.FC<GroupCardItemProps> = ({
  group,
  onSelectRankingStudent,
}) => {
  return (
    <div className={`rounded-2xl border ${group.borderCls} bg-[#0c101c] overflow-hidden flex flex-col justify-between shadow-xl`}>
      {/* Group Header */}
      <div className={`p-4 ${group.headerBg} border-b border-white/5 space-y-2`}>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-white">{group.title}</h4>
          <span className={`text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full border ${group.badgeCls}`}>
            {group.students.length} Học Sinh
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold">
          <span>{group.subtitle}</span>
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span>EMA: <strong className="text-white">{group.avgEma}</strong></span>
            <span>|</span>
            <span>σ: <strong className="text-white">{group.groupSd}</strong></span>
          </div>
        </div>

        {/* Pedagogy Focus Box */}
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-slate-300">
          <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Định Hướng Sư Phạm:</span>
          {group.pedagogyAdvice}
        </div>
      </div>

      {/* Student List */}
      <div className="p-3 space-y-1.5 max-h-72 overflow-y-auto scrollbar-thin">
        {group.students.map((s: any, sIdx: number) => {
          const ema = s.ema_level && Number(s.ema_level) > 0 ? Number(s.ema_level) : (Number(s.avg_check_1 || 0) * 0.55 + Number(s.avg_check_2 || 0) * 0.35 + Number(s.avg_homework || 0) * 0.1);
          const tier = getStudentTier(ema);
          const slope = Number(s.trend_slope || 0);
          const isUp = slope > 0.05;
          const isDown = slope < -0.05;
          const pi = s.performance_index ? Number(s.performance_index) : null;

          return (
            <div
              key={s.student_id || sIdx}
              onClick={() => onSelectRankingStudent && onSelectRankingStudent(s.student_id)}
              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#111628] hover:bg-[#18203a] border border-white/5 transition cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-bold text-slate-500 font-mono w-4 shrink-0">{sIdx + 1}.</span>
                <div className="min-w-0">
                  <span className="text-xs font-extrabold text-white truncate block">
                    {s.full_name} {s.nickname ? `(${s.nickname})` : ''}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{s.class_name || 'Lớp học'}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Trend Slope Badge */}
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-black ${isUp ? 'bg-emerald-500/20 text-emerald-400' : isDown ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-500/20 text-slate-400'}`}>
                  {isUp ? <TrendingUp size={10} /> : isDown ? <TrendingDown size={10} /> : <Minus size={10} />}
                  <span>{slope > 0 ? `+${format1Dec(slope)}` : format1Dec(slope)}</span>
                </span>

                {/* Performance Index (PI) */}
                {pi !== null && pi > 0 && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    PI {format1Dec(pi)}
                  </span>
                )}

                {/* EMA Score */}
                <span className={`text-[11px] font-mono font-black px-2 py-0.5 rounded-lg bg-black/40 border border-white/10 ${tier.text}`}>
                  {format1Dec(ema)}
                </span>
              </div>
            </div>
          );
        })}

        {group.students.length === 0 && (
          <div className="p-4 text-center text-xs text-slate-500 italic">
            Chưa có học sinh nào trong nhóm này
          </div>
        )}
      </div>
    </div>
  );
};
