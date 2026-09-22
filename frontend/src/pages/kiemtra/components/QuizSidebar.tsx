import React from 'react';
import { Question, TimerMode } from '../types';

interface QuizSidebarProps {
  activeQuestions: Question[];
  currentIndex: number;
  setCurrentIndex: (idx: number | ((prev: number) => number)) => void;
  userAnswers: Record<number, string>;
  bookmarkedQuestions: Record<number, boolean>;
  isSidebarCollapsed: boolean;
  timerMode: TimerMode;
  perQuestionSeconds: number;
  setQuestionTimer: (s: number | ((prev: number) => number)) => void;
  onFinishTest: () => void;
}

export const QuizSidebar: React.FC<QuizSidebarProps> = ({
  activeQuestions,
  currentIndex,
  setCurrentIndex,
  userAnswers,
  bookmarkedQuestions,
  isSidebarCollapsed,
  timerMode,
  perQuestionSeconds,
  setQuestionTimer,
  onFinishTest,
}) => {
  const totalQuestions = activeQuestions.length;
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div
      className={`transition-all duration-300 flex flex-col bg-white dark:bg-[#10172c] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm dark:shadow-xl shrink-0 ${
        isSidebarCollapsed ? 'w-0 p-0 border-0 opacity-0 overflow-hidden pointer-events-none' : 'w-72'
      }`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10 shrink-0">
        <div className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">Danh Sách Câu Hỏi</div>
        <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 font-mono">
          {answeredCount}/{totalQuestions} đã làm
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2 py-3 overflow-y-auto flex-1 content-start pr-1">
        {activeQuestions.map((item, idx) => {
          const isDone = !!userAnswers[item.id];
          const isCurr = idx === currentIndex;
          const isMarked = !!bookmarkedQuestions[item.id];

          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentIndex(idx);
                if (timerMode === 'per_question') setQuestionTimer(perQuestionSeconds);
              }}
              className={`h-9 rounded-xl font-black text-xs transition cursor-pointer relative flex items-center justify-center border ${
                isCurr
                  ? 'bg-[#2563eb] text-white border-blue-400 shadow-[0_0_12px_rgba(37,99,235,0.5)] scale-105 z-10'
                  : isDone
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-slate-100 dark:bg-[#141829] text-slate-700 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{idx + 1}</span>
              {isMarked && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white dark:border-[#0c0f1e]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="pt-3 border-t border-slate-200 dark:border-white/10 shrink-0">
        <button
          onClick={onFinishTest}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition cursor-pointer shadow-[0_4px_14px_rgba(16,185,129,0.4)] border border-white/20 active:scale-95"
        >
          Nộp Bài Sớm
        </button>
      </div>
    </div>
  );
};
