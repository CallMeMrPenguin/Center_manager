import React from 'react';
import { GraduationCap, ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react';

interface ClassroomPodiumProps {
  colsCount: number;
  activeCol: number;
  onSelectCol: (colIdx: number) => void;
}

export const ClassroomPodium: React.FC<ClassroomPodiumProps> = ({
  colsCount,
  activeCol,
  onSelectCol,
}) => {
  const safeActiveCol = Math.max(0, Math.min(colsCount - 1, activeCol));

  return (
    <div className="w-full min-w-max flex justify-center items-center gap-8 select-none mb-1">
      {Array.from({ length: colsCount }).map((_, colIdx) => {
        const isActive = colIdx === safeActiveCol;

        return (
          <div
            key={colIdx}
            className="w-[310px] flex justify-center items-center"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              onSelectCol(colIdx);
            }}
          >
            {isActive ? (
              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', 'teacher-desk');
                  e.dataTransfer.effectAllowed = 'move';
                }}
                className="w-full flex items-center justify-between gap-2 bg-white dark:bg-[#12162a] border-0 rounded-2xl py-2 px-3 shadow-md transition-all cursor-grab active:cursor-grabbing select-none group"
                title="Kéo thả hoặc dùng mũi tên để dời bàn giáo viên thẳng dãy bất kỳ"
              >
                {/* Move Left */}
                <button
                  type="button"
                  disabled={colIdx === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCol(Math.max(0, colIdx - 1));
                  }}
                  className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors"
                  title="Dời bàn giáo viên sang dãy bên trái"
                >
                  <ChevronLeft size={14} strokeWidth={2.5} />
                </button>

                {/* Desk Label & Icon */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-xs shrink-0">
                    <GraduationCap size={14} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white truncate">
                    Bàn Giáo Viên
                  </span>
                </div>

                {/* Move Right */}
                <button
                  type="button"
                  disabled={colIdx === colsCount - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCol(Math.min(colsCount - 1, colIdx + 1));
                  }}
                  className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors"
                  title="Dời bàn giáo viên sang dãy bên phải"
                >
                  <ChevronRight size={14} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onSelectCol(colIdx)}
                className="w-full py-2 px-3 rounded-2xl border-0 bg-slate-200/50 dark:bg-white/5 hover:bg-indigo-50/80 dark:hover:bg-indigo-500/15 flex items-center justify-center gap-1.5 transition-all cursor-pointer opacity-40 hover:opacity-100 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-2xs"
                title={`Đặt bàn giáo viên thẳng Dãy ${colIdx + 1}`}
              >
                <MoveHorizontal size={12} className="shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Đặt bàn GV thẳng Dãy {colIdx + 1}
                </span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
