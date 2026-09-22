import React from 'react';
import { AlertTriangle } from 'lucide-react';
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
    cardBg: 'bg-blue-50/90 dark:bg-[#0c1838] border border-blue-200 dark:border-blue-800/60 shadow-xs hover:shadow-md',
    title: 'text-blue-700 dark:text-blue-300',
    lt: 'text-blue-700 dark:text-blue-400',
    inputBox: 'bg-white dark:bg-[#121626] border border-blue-200 dark:border-blue-700/60 shadow-2xs',
    input: 'text-blue-900 dark:text-blue-100',
    chipBorder: 'border-blue-200 hover:border-blue-500 dark:border-blue-800/70 dark:hover:border-blue-400',
    scoreBadge: 'bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700/60',
  },
  purple: {
    cardBg: 'bg-purple-50/90 dark:bg-[#1e103c] border border-purple-200 dark:border-purple-800/60 shadow-xs hover:shadow-md',
    title: 'text-purple-700 dark:text-purple-300',
    lt: 'text-purple-700 dark:text-purple-400',
    inputBox: 'bg-white dark:bg-[#121626] border border-purple-200 dark:border-purple-700/60 shadow-2xs',
    input: 'text-purple-900 dark:text-purple-100',
    chipBorder: 'border-purple-200 hover:border-purple-500 dark:border-purple-800/70 dark:hover:border-purple-400',
    scoreBadge: 'bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700/60',
  },
  emerald: {
    cardBg: 'bg-emerald-50/90 dark:bg-[#0b241c] border border-emerald-200 dark:border-emerald-800/60 shadow-xs hover:shadow-md',
    title: 'text-emerald-700 dark:text-emerald-300',
    lt: 'text-emerald-700 dark:text-emerald-400',
    inputBox: 'bg-white dark:bg-[#121626] border border-emerald-200 dark:border-emerald-700/60 shadow-2xs',
    input: 'text-emerald-900 dark:text-emerald-100',
    chipBorder: 'border-emerald-200 hover:border-emerald-500 dark:border-emerald-800/70 dark:hover:border-emerald-400',
    scoreBadge: 'bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700/60',
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
    <div
      className={`${styles.cardBg} rounded-2xl p-3.5 flex flex-col justify-between min-h-[140px] transition-all`}
    >
      <div>
        <div className="flex items-center justify-between mb-2.5 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-xs font-black ${styles.title} uppercase tracking-wider shrink-0`}>
              {title}
            </span>
            <div className={`flex items-center gap-0.5 ${styles.inputBox} px-2 py-0.5 rounded-lg transition-colors`}>
              <span className={`text-[11px] ${styles.lt} font-black select-none`}>&lt;</span>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={threshInput}
                onChange={(e) => onThreshChange(e.target.value)}
                className={`w-10 bg-transparent ${styles.input} font-black font-mono text-xs text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                title={`Nhập điểm lọc cho ${title} (mặc định theo TB)`}
              />
              <span className="text-[10px] text-slate-500 font-bold select-none">đ</span>
            </div>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full font-black text-xs shrink-0 shadow-xs ${
              students.length > 0
                ? 'bg-rose-500 text-white dark:bg-rose-600'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700'
            }`}
          >
            {students.length} HS
          </span>
        </div>
        {students.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {students.map((s) => (
              <button
                key={s.student_id}
                type="button"
                onClick={() => onFilterStudent?.(s.student_name)}
                className={`px-2.5 py-1 rounded-xl bg-white dark:bg-[#141724] border ${styles.chipBorder} shadow-xs hover:shadow-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer text-slate-900 dark:text-slate-100`}
                title="Bấm để sao chép tên tìm kiếm"
              >
                <span>{s.student_name}</span>
                <span className={`px-1.5 py-0.5 rounded-md ${styles.scoreBadge} font-mono font-black text-[11px]`}>
                  ({format1Dec(s.score)})
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
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
    <div className="bg-amber-50/90 dark:bg-[#281a09] border border-amber-200 dark:border-amber-800/60 shadow-xs hover:shadow-md rounded-2xl p-3.5 flex flex-col justify-between min-h-[140px] transition-all">
      <div>
        <div className="flex items-center justify-between mb-2.5 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider shrink-0">
              Độ Lệch
            </span>
            <div className="flex items-center gap-0.5 bg-white dark:bg-[#121626] border border-amber-200 dark:border-amber-700/60 px-2 py-0.5 rounded-lg shadow-2xs transition-colors">
              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-black select-none">&gt;</span>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={threshInput}
                onChange={(e) => onThreshChange(e.target.value)}
                className="w-10 bg-transparent text-amber-900 dark:text-amber-100 font-black font-mono text-xs text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                title="Nhập ngưỡng độ lệch BTVN > Check (mặc định 1.5đ)"
              />
              <span className="text-[10px] text-slate-500 font-bold select-none">đ</span>
            </div>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full font-black text-xs shrink-0 shadow-xs ${
              students.length > 0
                ? 'bg-amber-500 text-white dark:bg-amber-600'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700'
            }`}
          >
            {students.length} HS
          </span>
        </div>
        {students.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {students.map((s) => (
              <button
                key={s.student_id}
                type="button"
                onClick={() => onFilterStudent?.(s.student_name)}
                className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#141724] border border-amber-300/80 hover:border-amber-500 dark:border-amber-800/70 dark:hover:border-amber-400 shadow-xs hover:shadow-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer text-slate-900 dark:text-slate-100"
                title={`BTVN: ${format1Dec(s.homework)}, TB Check: ${format1Dec(s.checkAvg)} (Lệch: ${format1Dec(s.diff)} đ). Bấm để sao chép.`}
              >
                <span>{s.student_name}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 font-mono font-black text-[11px]">
                  ({format1Dec(s.diff)}đ)
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
            Không có trường hợp lệch điểm bất thường
          </p>
        )}
      </div>
    </div>
  );
};
