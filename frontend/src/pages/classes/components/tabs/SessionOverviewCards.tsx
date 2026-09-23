import React from 'react';
import { format1Dec } from '../../../../utils';
import { DiscrepancyStudent } from './useSessionOverview';

interface BelowThresholdCardProps {
  title: string;
  theme: 'blue' | 'purple' | 'emerald';
  threshInput: string;
  onThreshChange: (val: string) => void;
  students: { student_id: number; student_name: string; score: number }[];
  onFilterStudent?: (studentName: string) => void;
}

const THEME_STYLES = {
  blue: {
    title: 'text-blue-600 dark:text-blue-400',
    chipScore: 'text-blue-600 dark:text-blue-400',
  },
  purple: {
    title: 'text-purple-600 dark:text-purple-400',
    chipScore: 'text-purple-600 dark:text-purple-400',
  },
  emerald: {
    title: 'text-emerald-600 dark:text-emerald-400',
    chipScore: 'text-emerald-600 dark:text-emerald-400',
  },
};

export const BelowThresholdCard: React.FC<BelowThresholdCardProps> = ({
  title,
  theme,
  threshInput,
  onThreshChange,
  students,
  onFilterStudent,
}) => {
  const styles = THEME_STYLES[theme];

  return (
    <div className="bg-white dark:bg-[#121626] rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-sm flex flex-col justify-between min-h-[135px] transition-all">
      <div>
        {/* Top Header: Title on Left, Controls cleanly separated on Right */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <span className={`text-xs font-black ${styles.title} uppercase tracking-wider shrink-0`}>
            {title}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Threshold pill */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-lg border border-slate-200/80 dark:border-white/10 text-xs font-bold">
              <span className="text-slate-400 dark:text-slate-500 select-none">&lt;</span>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={threshInput}
                onChange={(e) => onThreshChange(e.target.value)}
                className="w-8 text-center font-mono font-black text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-xs"
                title={`Nhập điểm lọc cho ${title} (mặc định theo TB)`}
              />
            </div>

            {/* Student Count Badge */}
            <span
              className={`px-2 py-0.5 rounded-lg font-black text-xs shrink-0 ${
                students.length > 0
                  ? 'bg-rose-500 text-white dark:bg-rose-600 shadow-2xs'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/10'
              }`}
            >
              {students.length} HS
            </span>
          </div>
        </div>

        {/* Student List or Empty State */}
        {students.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {students.map((s) => (
              <button
                key={s.student_id}
                type="button"
                onClick={() => onFilterStudent?.(s.student_name)}
                className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 shadow-2xs text-xs font-bold flex items-center gap-1.5 transition cursor-pointer text-slate-800 dark:text-slate-100"
                title="Bấm để sao chép tên tìm kiếm"
              >
                <span>{s.student_name}</span>
                <span className={`font-mono font-black text-[11px] ${styles.chipScore}`}>
                  ({format1Dec(s.score)})
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
            Không có học sinh dưới điểm chuẩn
          </p>
        )}
      </div>
    </div>
  );
};

interface DivergenceCardProps {
  threshInput: string;
  onThreshChange: (val: string) => void;
  students: DiscrepancyStudent[];
  onFilterStudent?: (studentName: string) => void;
}

export const DivergenceCard: React.FC<DivergenceCardProps> = ({
  threshInput,
  onThreshChange,
  students,
  onFilterStudent,
}) => {
  return (
    <div className="bg-white dark:bg-[#121626] rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-sm flex flex-col justify-between min-h-[135px] transition-all">
      <div>
        {/* Top Header: Title on Left, Controls cleanly separated on Right */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider shrink-0">
            Độ Lệch
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Threshold pill */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-lg border border-slate-200/80 dark:border-white/10 text-xs font-bold">
              <span className="text-slate-400 dark:text-slate-500 select-none font-bold">&gt;</span>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={threshInput}
                onChange={(e) => onThreshChange(e.target.value)}
                className="w-8 text-center font-mono font-black text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-xs"
                title="Nhập ngưỡng độ lệch BTVN > Check (mặc định 1.5)"
              />
            </div>

            {/* Student Count Badge */}
            <span
              className={`px-2 py-0.5 rounded-lg font-black text-xs shrink-0 ${
                students.length > 0
                  ? 'bg-amber-500 text-white dark:bg-amber-600 shadow-2xs'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/10'
              }`}
            >
              {students.length} HS
            </span>
          </div>
        </div>

        {/* Student List or Empty State */}
        {students.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {students.map((s) => (
              <button
                key={s.student_id}
                type="button"
                onClick={() => onFilterStudent?.(s.student_name)}
                className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 shadow-2xs text-xs font-bold flex items-center gap-1.5 transition cursor-pointer text-slate-800 dark:text-slate-100"
                title={`BTVN: ${format1Dec(s.homework)}, TB Check: ${format1Dec(s.checkAvg)} (Lệch: ${format1Dec(s.diff)}). Bấm để sao chép.`}
              >
                <span>{s.student_name}</span>
                <span className="font-mono font-black text-[11px] text-amber-600 dark:text-amber-400">
                  ({format1Dec(s.diff)})
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
            Không có trường hợp lệch điểm bất thường
          </p>
        )}
      </div>
    </div>
  );
};
