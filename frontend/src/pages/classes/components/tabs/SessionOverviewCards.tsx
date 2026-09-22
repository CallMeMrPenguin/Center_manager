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
    cardBg: 'bg-blue-50/70 hover:bg-blue-50/90',
    title: 'text-blue-700',
    lt: 'text-blue-700',
    input: 'text-blue-900',
    score: 'text-rose-600',
  },
  purple: {
    cardBg: 'bg-purple-50/70 hover:bg-purple-50/90',
    title: 'text-purple-700',
    lt: 'text-purple-700',
    input: 'text-purple-900',
    score: 'text-rose-600',
  },
  emerald: {
    cardBg: 'bg-emerald-50/70 hover:bg-emerald-50/90',
    title: 'text-emerald-700',
    lt: 'text-emerald-700',
    input: 'text-emerald-900',
    score: 'text-rose-600',
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
      className={`${styles.cardBg} rounded-2xl p-4 flex flex-col justify-between min-h-[140px] shadow-sm hover:shadow transition-all`}
    >
      <div>
        <div className="flex items-center justify-between mb-2.5 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-xs font-black ${styles.title} uppercase tracking-wider shrink-0`}>
              {title}
            </span>
            <div className="flex items-center gap-0.5 bg-white/90 hover:bg-white px-2 py-0.5 rounded-lg shadow-2xs transition-colors">
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
              <span className="text-[10px] text-slate-500 font-medium select-none">đ</span>
            </div>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full font-black text-xs shrink-0 bg-white shadow-2xs ${
              students.length > 0 ? 'text-rose-600' : 'text-emerald-600'
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
                className="px-2.5 py-1 rounded-xl bg-white shadow-2xs hover:bg-white/90 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer text-slate-800"
                title="Bấm để sao chép tên tìm kiếm"
              >
                <span>{s.student_name}</span>
                <span className={`${styles.score} font-black`}>({format1Dec(s.score)})</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic py-2">
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
    <div className="bg-amber-50/70 hover:bg-amber-50/90 rounded-2xl p-4 flex flex-col justify-between min-h-[140px] shadow-sm hover:shadow transition-all">
      <div>
        <div className="flex items-center justify-between mb-2.5 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-black text-amber-700 uppercase tracking-wider shrink-0">
              Độ Lệch
            </span>
            <div className="flex items-center gap-0.5 bg-white/90 hover:bg-white px-2 py-0.5 rounded-lg shadow-2xs transition-colors">
              <span className="text-[11px] text-amber-700 font-black select-none">&gt;</span>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={threshInput}
                onChange={(e) => onThreshChange(e.target.value)}
                className="w-10 bg-transparent text-amber-900 font-black text-xs text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                title="Nhập ngưỡng độ lệch BTVN > Check (mặc định 1.5đ)"
              />
              <span className="text-[10px] text-slate-500 font-medium select-none">đ</span>
            </div>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full font-black text-xs shrink-0 bg-white shadow-2xs ${
              students.length > 0 ? 'text-amber-700' : 'text-emerald-600'
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
                className="px-2.5 py-1 rounded-xl bg-white shadow-2xs hover:bg-white/90 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer text-slate-800"
                title={`BTVN: ${format1Dec(s.homework)}, TB Check: ${format1Dec(s.checkAvg)} (Lệch: ${format1Dec(s.diff)} đ). Bấm để sao chép.`}
              >
                <span>{s.student_name}</span>
                <span className="text-amber-700 font-black">
                  ({format1Dec(s.diff)}đ)
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic py-2">
            Không có trường hợp lệch điểm bất thường
          </p>
        )}
      </div>
    </div>
  );
};
