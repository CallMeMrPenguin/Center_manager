import React from 'react';
import { AssignmentType } from '../types';

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

const TYPE_OPTIONS: { id: AssignmentType; label: string; desc: string }[] = [
  { id: 'practice', label: '1. Bài Ôn Luyện', desc: 'Không giới hạn thời gian / lần làm, xem đáp án tức thì & làm lại câu sai.' },
  { id: 'homework_1', label: '2. Bài Về Nhà (HW1)', desc: 'Có hạn nộp, tự động ghi nhận điểm vào cột Homework 1 buổi tới.' },
  { id: 'homework_2', label: '3. Bài Kiểm Tra (HW2)', desc: 'Giới hạn thời gian & số lần, theo dõi màn hình, điểm ghi vào cột Homework 2.' },
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
    <div className="space-y-3 pt-2 border-t border-white/10">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-300">
          Kiểu Bài Giao <span className="text-rose-400">*</span>
        </label>

        {/* Sliding Pill Segmented Control */}
        <div className="relative flex bg-[#0d1018] p-1 rounded-xl border border-white/10 text-xs shrink-0 font-bold select-none">
          <div
            className="absolute top-1 bottom-1 rounded-lg bg-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.5)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
            style={{
              left: `calc((100% / 3) * ${activeIndex} + 2px)`,
              width: 'calc((100% / 3) - 4px)',
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
                  active ? 'text-white font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-indigo-300/80 px-1 font-medium">
          {TYPE_OPTIONS[activeIndex]?.desc}
        </p>
      </div>

      {/* Extra Config for Homework 2 */}
      {assignmentType === 'homework_2' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-[#121626] border border-[#212c4b]">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">Thời Gian Làm Bài</label>
            <select
              value={timeLimit || 0}
              onChange={(e) => {
                const v = Number(e.target.value);
                onChangeTimeLimit(v > 0 ? v : null);
              }}
              className="w-full bg-[#0c0f1e] border border-[#212c4b] text-white rounded-lg px-2.5 py-1.5 text-xs font-bold"
            >
              <option value="0">Không giới hạn</option>
              <option value="15">15 phút</option>
              <option value="30">30 phút</option>
              <option value="45">45 phút</option>
              <option value="60">60 phút</option>
              <option value="90">90 phút</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">Số Lần Nộp Tối Đa</label>
            <select
              value={maxAttempts}
              onChange={(e) => onChangeMaxAttempts(Number(e.target.value))}
              className="w-full bg-[#0c0f1e] border border-[#212c4b] text-white rounded-lg px-2.5 py-1.5 text-xs font-bold"
            >
              <option value="1">1 lần (Khóa sau khi nộp)</option>
              <option value="2">2 lần</option>
              <option value="3">3 lần</option>
              <option value="0">Không giới hạn</option>
            </select>
          </div>

          <div className="space-y-1 flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300 py-1.5">
              <input
                type="checkbox"
                checked={proctoringEnabled}
                onChange={(e) => onChangeProctoring(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 accent-[#5c36f5] cursor-pointer"
              />
              <span>Theo dõi màn hình</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
