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
    border: 'border-blue-200 dark:border-blue-500/20',
    title: 'text-blue-600 dark:text-blue-400',
    lt: 'text-blue-600 dark:text-blue-400',
    input: 'text-blue-900 dark:text-blue-300',
    tagBg: 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/25',
    score: 'text-rose-600 dark:text-rose-400',
  },
  purple: {
    border: 'border-purple-200 dark:border-purple-500/20',
    title: 'text-purple-600 dark:text-purple-400',
    lt: 'text-purple-600 dark:text-purple-400',
    input: 'text-purple-900 dark:text-purple-300',
    tagBg: 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/25',
    score: 'text-rose-600 dark:text-rose-400',
  },
  emerald: {
    border: 'border-emerald-200 dark:border-emerald-500/20',
    title: 'text-emerald-600 dark:text-emerald-400',
    lt: 'text-emerald-600 dark:text-emerald-400',
    input: 'text-emerald-900 dark:text-emerald-300',
    tagBg: 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/25',
    score: 'text-rose-600 dark:text-rose-400',
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
      className={`bg-slate-50 dark:bg-[#080b14] border ${styles.border} rounded-xl p-3 flex flex-col justify-between min-h-[140px] shadow-sm dark:shadow-none transition-colors`}
    >
      <div>
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-xs font-black ${styles.title} uppercase tracking-wider shrink-0`}>
              {title}
            </span>
            <div className="flex items-center gap-0.5 bg-slate-200/60 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 px-1.5 py-0.5 rounded-lg transition-colors">
              <span className={`text-[11px] ${styles.lt} font-black select-none`}>&lt;</span>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={threshInput}
                onChange={(e) => onThreshChange(e.target.value)}
                className={`w-10 bg-transparent ${styles.input} font-black text-xs text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                title={`Nhập điểm lọc cho ${title} (mặc định theo TB)`}
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium select-none">đ</span>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded-md font-extrabold text-[11px] shrink-0 ${
              students.length > 0
                ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
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
                className={`px-2 py-0.5 rounded-lg ${styles.tagBg} border text-xs font-bold flex items-center gap-1 transition cursor-pointer`}
                title="Bấm để sao chép tên tìm kiếm"
              >
                <span>{s.student_name}</span>
                <span className={`${styles.score} font-black`}>({format1Dec(s.score)})</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic py-2">
            Không có học sinh dưới điểm chuẩn
          </p>
        )}
      </div>
    </div>
  );
};

interface DivergenceCardProps {
  students: DiscrepancyStudent[];
  onFilterStudent?: (studentName: string) => void;
}

export const DivergenceCard: React.FC<DivergenceCardProps> = ({
  students,
  onFilterStudent,
}) => {
  return (
    <div className="bg-slate-50 dark:bg-[#080b14] border border-amber-200 dark:border-amber-500/30 rounded-xl p-3 flex flex-col justify-between min-h-[140px] shadow-sm dark:shadow-none transition-colors">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-amber-500 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Độ Lệch
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-md font-extrabold text-[11px] shrink-0 ${
              students.length > 0
                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40'
                : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
            }`}
          >
            {students.length} HS
          </span>
        </div>
        {students.length > 0 ? (
          <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto pr-1">
            {students.map((s) => (
              <button
                key={s.student_id}
                type="button"
                onClick={() => onFilterStudent?.(s.student_name)}
                className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-500/25 text-xs font-bold flex items-center justify-between transition cursor-pointer text-left"
                title={`BTVN: ${format1Dec(s.homework)}, TB Check: ${format1Dec(s.checkAvg)} (Lệch: ${format1Dec(s.diff)} đ). Bấm để sao chép.`}
              >
                <span className="truncate max-w-[120px]">{s.student_name}</span>
                <span className="text-amber-600 dark:text-amber-400 font-black shrink-0">
                  {format1Dec(s.diff)} đ
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic py-2">
            Không có trường hợp lệch điểm bất thường
          </p>
        )}
      </div>
    </div>
  );
};
