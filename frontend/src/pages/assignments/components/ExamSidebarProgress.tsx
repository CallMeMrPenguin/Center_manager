import React, { memo } from 'react';
import { ChevronRight } from 'lucide-react';
import { SectionProgressGroup } from './UlnDocumentRenderer';

interface ExamSidebarProgressProps {
  answered: number;
  total: number;
  pct: number;
  sections: SectionProgressGroup[];
}

export const ExamSidebarProgress: React.FC<ExamSidebarProgressProps> = memo(({
  answered,
  total,
  pct,
  sections,
}) => {
  return (
    <div className="w-full lg:w-72 lg:sticky lg:top-20 shrink-0 space-y-3">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xl text-slate-900 space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Tiến Độ Làm Bài
          </h4>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            {answered}/{total || 10} ({pct}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden p-0.5 border border-slate-200">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300 shadow-xs"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Question Quick-Jump Grid */}
        <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-3 scrollbar-thin">
          {sections.map((sec) => (
            <div key={sec.id} className="space-y-1.5">
              <div className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                <ChevronRight size={12} className="shrink-0 mt-0.5 text-indigo-500" />
                <span className="truncate">{sec.title}</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {sec.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(item.id);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className={`py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer border ${
                      item.isAnswered
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-100 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 border-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

ExamSidebarProgress.displayName = 'ExamSidebarProgress';
