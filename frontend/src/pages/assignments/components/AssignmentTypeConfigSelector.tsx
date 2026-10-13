import React from 'react';
import { AssignmentType } from '../types';
import { CustomSelect } from '../../../components/CustomSelect';
import { SegmentedControl } from '../../../components/SegmentedControl';

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

const TYPE_OPTIONS: { value: AssignmentType; label: string }[] = [
  { value: 'practice', label: 'Ôn luyện' },
  { value: 'homework_1', label: 'Bài về nhà' },
  { value: 'homework_2', label: 'Bài kiểm tra' },
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
  return (
    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/10">
      <div className="space-y-1.5">
        <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
          LOẠI BÀI TẬP <span className="text-rose-500 dark:text-rose-400">*</span>
        </label>

        <SegmentedControl<AssignmentType>
          options={TYPE_OPTIONS}
          value={assignmentType}
          onChange={onChangeAssignmentType}
          fit="fluid"
          size="sm"
        />
      </div>

      {/* Extra Config for Homework 2 without outer card */}
      {assignmentType === 'homework_2' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">THỜI GIAN LÀM BÀI</label>
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
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">SỐ LẦN NỘP TỐI ĐA</label>
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
              <span className="text-[11px] font-black uppercase tracking-wider">THEO DÕI MÀN HÌNH</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
