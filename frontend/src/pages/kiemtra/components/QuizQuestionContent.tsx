import React from 'react';
import { Question } from '../types';
import { cleanOptionPrefix } from '../../../utils';

interface QuizQuestionContentProps {
  question: Question;
  currentIndex: number;
  userAnswer: string;
  eliminatedOptions: string[];
  onAnswerSelect: (questionId: number, answerVal: string) => void;
  onEliminateOne: () => void;
  onFiftyFifty: () => void;
  onResetLifelines: () => void;
  renderFormattedText: (text: string) => React.ReactNode;
}

export const QuizQuestionContent: React.FC<QuizQuestionContentProps> = ({
  question,
  currentIndex,
  userAnswer,
  eliminatedOptions,
  onAnswerSelect,
  onEliminateOne,
  onFiftyFifty,
  onResetLifelines,
  renderFormattedText,
}) => {
  const currentAns = cleanOptionPrefix(userAnswer);

  return (
    <div className="space-y-4">
      {/* INSTRUCTION */}
      {question.instruction && (
        <div className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-300 leading-relaxed bg-blue-500/10 border border-blue-500/20 p-3 sm:p-4 rounded-xl shadow-xs">
          {question.instruction}
        </div>
      )}

      {/* QUESTION STEM */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight flex flex-wrap items-baseline gap-2 sm:gap-3">
        <span className="text-[#2563eb] sm:text-blue-500 font-black">Q{currentIndex + 1}.</span>
        <span>{renderFormattedText(question.question)}</span>
      </h2>

      {/* LIFELINES */}
      {question.type === 'mcq' && question.options && question.options.length > 1 && (
        <div className="flex items-center gap-2 pt-1 pb-1">
          <button
            onClick={onEliminateOne}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-xs font-black transition cursor-pointer active:scale-95 shadow-xs"
            title="Bỏ 1 phương án sai (25/75)"
          >
            25/75
          </button>
          <button
            onClick={onFiftyFifty}
            className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-xs font-black transition cursor-pointer active:scale-95 shadow-xs"
            title="Loại 50% phương án sai"
          >
            50/50
          </button>
          {eliminatedOptions.length > 0 && (
            <button
              onClick={onResetLifelines}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-white/10 text-xs font-bold transition cursor-pointer"
              title="Khôi phục lại các lựa chọn đã loại"
            >
              Khôi phục
            </button>
          )}
        </div>
      )}

      {/* MCQ OPTIONS */}
      {question.type === 'mcq' && question.options && (
        <div className="grid grid-cols-1 gap-2.5 sm:gap-3 pt-1">
          {question.options.map((opt, oIdx) => {
            const cleanOpt = cleanOptionPrefix(opt);
            const isEliminated = eliminatedOptions.includes(cleanOpt);
            const isSelected = !isEliminated && (currentAns === cleanOpt || userAnswer === opt || userAnswer === cleanOpt);

            return (
              <button
                key={oIdx}
                disabled={isEliminated}
                onClick={() => onAnswerSelect(question.id, cleanOpt)}
                className={`px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-2.5 rounded-2xl border text-left font-black transition-all duration-200 cursor-pointer flex items-center gap-3.5 sm:gap-5 ${
                  isEliminated
                    ? 'opacity-25 pointer-events-none line-through border-dashed border-red-500/40 bg-red-500/10 text-slate-500 cursor-not-allowed'
                    : isSelected
                    ? 'bg-blue-500/15 dark:bg-blue-600/30 border-blue-500 text-slate-900 dark:text-white shadow-md ring-2 ring-blue-500'
                    : 'bg-slate-50 dark:bg-[#141b30] border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <span
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-base sm:text-lg md:text-xl font-black shrink-0 transition ${
                    isEliminated
                      ? 'bg-red-500/20 text-red-500'
                      : isSelected
                      ? 'bg-[#2563eb] text-white shadow-md'
                      : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {String.fromCharCode(65 + oIdx)}
                </span>
                <span className="flex-1 text-sm sm:text-base md:text-lg leading-snug">
                  {renderFormattedText(cleanOpt)}
                </span>
                {isEliminated && (
                  <span className="text-[11px] font-black text-red-400/90 bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20">
                    [Đã loại trừ]
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* FILL IN THE BLANK */}
      {question.type === 'fill' && (
        <div className="pt-2">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => onAnswerSelect(question.id, e.target.value)}
            placeholder="Nhập câu trả lời của bạn..."
            className="w-full bg-white border border-slate-300 text-slate-900 text-xl sm:text-2xl md:text-3xl font-bold rounded-2xl px-5 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      )}
    </div>
  );
};
