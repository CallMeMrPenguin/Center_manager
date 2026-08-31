import React from 'react';
import { Layers, CheckSquare, Square } from 'lucide-react';
import { UlnSectionItem } from '../types';

interface SectionScopeSelectorProps {
  sections: UlnSectionItem[];
  selectedSectionIds: number[];
  onToggleSection: (sectionId: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export const SectionScopeSelector: React.FC<SectionScopeSelectorProps> = ({
  sections,
  selectedSectionIds,
  onToggleSection,
  onSelectAll,
  onDeselectAll,
}) => {
  if (!sections || sections.length <= 1) return null;

  const totalSections = sections.length;
  const isAllSelected = selectedSectionIds.length === totalSections;
  const isNoneSelected = selectedSectionIds.length === 0;

  // Calculate total selected questions
  const selectedQuestionCount = sections
    .filter((s) => selectedSectionIds.includes(s.id))
    .reduce((sum, s) => sum + (s.questionCount || 0), 0);

  const totalQuestions = sections.reduce((sum, s) => sum + (s.questionCount || 0), 0);

  return (
    <div className="space-y-2 p-3 rounded-2xl bg-[#0d1018] border border-[#212c4b]">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-indigo-400" />
          <span className="text-xs font-bold text-slate-200">Phạm Vi Giao Bài (Từng Phần / Bài Tập)</span>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {selectedSectionIds.length}/{totalSections} bài ({selectedQuestionCount}/{totalQuestions} câu)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            disabled={isAllSelected}
            className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition cursor-pointer disabled:opacity-40"
          >
            Chọn tất cả
          </button>
          <span className="text-slate-600 text-xs">|</span>
          <button
            type="button"
            onClick={onDeselectAll}
            disabled={isNoneSelected}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-200 transition cursor-pointer disabled:opacity-40"
          >
            Bỏ chọn
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto scrollbar-thin pr-1 pt-1">
        {sections.map((sec) => {
          const isChecked = selectedSectionIds.includes(sec.id);
          return (
            <div
              key={sec.id}
              onClick={() => onToggleSection(sec.id)}
              className={`flex items-start gap-2.5 p-2 rounded-xl border transition cursor-pointer select-none ${
                isChecked
                  ? 'bg-indigo-950/40 border-indigo-500/40 text-white shadow-sm'
                  : 'bg-[#121626]/60 border-white/5 text-slate-400 hover:border-white/20'
              }`}
            >
              <div className="mt-0.5 shrink-0 text-indigo-400">
                {isChecked ? <CheckSquare size={14} /> : <Square size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold leading-snug truncate">
                  {sec.title}
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {sec.questionCount} câu hỏi
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
