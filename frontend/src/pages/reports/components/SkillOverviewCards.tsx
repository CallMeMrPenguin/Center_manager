import React from 'react';
import { trunc1Dec } from '../../../utils';

interface SkillStats {
  vocab_avg: number;
  grammar_avg: number;
  mixed_avg: number;
  mastered_count: number;
  partial_count: number;
  regressed_count: number;
  not_yet_count: number;
  total_instances: number;
  mastery_rate: number;
}

interface SkillOverviewCardsProps {
  stats: SkillStats;
}

export const SkillOverviewCards: React.FC<SkillOverviewCardsProps> = ({ stats }) => {
  const getScoreBadge = (score: number) => {
    if (score >= 8.0) return { label: 'Vững Vàng', color: 'text-emerald-700 bg-emerald-500/15' };
    if (score >= 6.5) return { label: 'Khá Ổn Định', color: 'text-blue-700 bg-blue-500/15' };
    if (score >= 5.0) return { label: 'Trung Bình', color: 'text-amber-700 bg-amber-500/15' };
    return { label: 'Cần Củng Cố', color: 'text-rose-700 bg-rose-500/15' };
  };

  const vocabBadge = getScoreBadge(stats.vocab_avg);
  const grammarBadge = getScoreBadge(stats.grammar_avg);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      {/* 1. VOCAB AVERAGE */}
      <div className="bg-white dark:bg-[#0c101c] p-5 rounded-2xl relative overflow-hidden shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
            Từ Vựng
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
            {stats.vocab_avg > 0 ? trunc1Dec(stats.vocab_avg) : 'N/A'}
            <span className="text-xs font-normal text-slate-500 ml-1">/ 10</span>
          </div>
          {stats.vocab_avg > 0 && (
            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${vocabBadge.color}`}>
              {vocabBadge.label}
            </span>
          )}
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          Điểm trung bình tích lũy các bài kiểm tra từ vựng
        </div>
      </div>

      {/* 2. GRAMMAR AVERAGE */}
      <div className="bg-white dark:bg-[#0c101c] p-5 rounded-2xl relative overflow-hidden shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase text-purple-600 tracking-wider">
            Ngữ Pháp
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
            {stats.grammar_avg > 0 ? trunc1Dec(stats.grammar_avg) : 'N/A'}
            <span className="text-xs font-normal text-slate-500 ml-1">/ 10</span>
          </div>
          {stats.grammar_avg > 0 && (
            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${grammarBadge.color}`}>
              {grammarBadge.label}
            </span>
          )}
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          Điểm trung bình tích lũy các bài kiểm tra ngữ pháp
        </div>
      </div>

      {/* 3. MASTERY RATE % */}
      <div className="bg-white dark:bg-[#0c101c] p-5 rounded-2xl relative overflow-hidden shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase text-emerald-600 tracking-wider">
            Tỷ Lệ Nắm Vững (Mastery)
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
            {stats.mastery_rate}%
          </div>
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            {stats.mastered_count} Lượt Đạt Chuẩn
          </span>
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          Đạt Bloom's Mastery (Điểm EMA &ge; 8.0 qua &ge; 2 lần test)
        </div>
      </div>

      {/* 4. ATTENTION & REINFORCEMENT */}
      <div className="bg-white dark:bg-[#0c101c] p-5 rounded-2xl relative overflow-hidden shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase text-amber-600 tracking-wider">
            Cần Phụ Đạo & Ôn Lại
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
            {stats.not_yet_count + stats.regressed_count}
          </div>
          <div className="flex gap-1.5">
            {stats.regressed_count > 0 && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300">
                {stats.regressed_count} Giảm Sút
              </span>
            )}
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
              {stats.not_yet_count} Chưa Đạt
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          Lượt học sinh - bài học cần giáo viên hỗ trợ củng cố
        </div>
      </div>
    </div>
  );
};
