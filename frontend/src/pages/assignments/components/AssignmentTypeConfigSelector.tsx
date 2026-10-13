import React from 'react';
import { AssignmentType } from '../types';
import { CustomSelect } from '../../../components/CustomSelect';

interface AssignmentTypeConfigSelectorProps {
  assignmentType: AssignmentType;
  onChangeAssignmentType: (type: AssignmentType) => void;
  timeLimit: number | null;
  onChangeTimeLimit: (limit: number | null) => void;
  maxAttempts: number;
  onChangeMaxAttempts: (attempts: number) => void;
  proctoringEnabled: boolean;
  onChangeProctoring: (enabled: boolean) => void;
}

const TYPE_OPTIONS: { id: AssignmentType; label: string }[] = [
  { id: 'practice', label: 'Ôn luyện' },
  { id: 'homework_1', label: 'Bài về nhà' },
  { id: 'homework_2', label: 'Bài kiểm tra' },
];

export const AssignmentTypeConfigSelector: React.FC<AssignmentTypeConfigSelectorProps> = ({
  assignmentType,
  onChangeAssignmentType,
  timeLimit,
  onChangeTimeLimit,
  maxAttempts,
  onChangeMaxAttempts,
  proctoringEnabled,
  onChangeProctoring,
}) => {
  const activeIndex = TYPE_OPTIONS.findIndex((o) => o.id === assignmentType);

  return (
    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/10">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Loại bài tập <span className="text-rose-500 dark:text-rose-400">*</span>
        </label>

        {/* Sliding Pill Segmented Control */}
        <div className="relative flex bg-slate-100 dark:bg-[#0d1018] p-0.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs shrink-0 font-bold select-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
          <div
            className="absolute top-0.5 bottom-0.5 rounded-md bg-blue-600 shadow-xs transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
            style={{
              left: `calc((100% / 3) * ${activeIndex} + 1px)`,
              width: 'calc((100% / 3) - 2px)',
            }}
          />
          {TYPE_OPTIONS.map((opt) => {
            const active = assignmentType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeAssignmentType(opt.id)}
                className={`flex-1 relative z-10 py-1.5 text-center transition-colors cursor-pointer text-xs ${
                  active ? 'text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Extra Config for Homework 2 */}
      {assignmentType === 'homework_2' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-[#212c4b]">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Thời Gian Làm Bài</label>
            <CustomSelect
              value={timeLimit || 0}
              onChange={(val) => {
                const v = Number(val);
                onChangeTimeLimit(v > 0 ? v : null);
              }}
              options={[
                { value: 0, label: 'Không giới hạn' },
                { value: 15, label: '15 phút' },
                { value: 30, label: '30 phút' },
                { value: 45, label: '45 phút' },
                { value: 60, label: '60 phút' },
                { value: 90, label: '90 phút' },
              ]}
              className="w-full text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Số Lần Nộp Tối Đa</label>
            <CustomSelect
              value={maxAttempts}
              onChange={(val) => onChangeMaxAttempts(Number(val))}
              options={[
                { value: 1, label: '1 lần (Khóa sau khi nộp)' },
                { value: 2, label: '2 lần' },
                { value: 3, label: '3 lần' },
                { value: 0, label: 'Không giới hạn' },
              ]}
              className="w-full text-xs"
            />
          </div>

          <div className="space-y-1 flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300 py-1.5">
              <input
                type="checkbox"
                checked={proctoringEnabled}
                onChange={(e) => onChangeProctoring(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-white/20 accent-blue-600 cursor-pointer"
              />
              <span>Theo dõi màn hình</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
