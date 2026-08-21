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
        <div className="text-sm sm:text-base font-bold text-indigo-300 leading-relaxed bg-indigo-500/10 border border-indigo-500/20 p-3 sm:p-4 rounded-xl shadow-sm">
          {question.instruction}
        </div>
      )}

      {/* QUESTION STEM */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight tracking-tight flex flex-wrap items-baseline gap-2 sm:gap-3">
        <span className="text-[#5c36f5] sm:text-indigo-400 font-black">Q{currentIndex + 1}.</span>
        <span>{renderFormattedText(question.question)}</span>
      </h2>

      {/* LIFELINES */}
      {question.type === 'mcq' && question.options && question.options.length > 1 && (
        <div className="flex items-center gap-2 pt-1 pb-1">
          <button
            onClick={onEliminateOne}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-500/30 text-xs font-black transition cursor-pointer active:scale-95 shadow-sm"
            title="Bỏ 1 phương án sai (25/75)"
          >
            25/75
          </button>
          <button
            onClick={onFiftyFifty}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-purple-300 border border-purple-500/30 text-xs font-black transition cursor-pointer active:scale-95 shadow-sm"
            title="Loại 50% phương án sai"
          >
            50/50
          </button>
          {eliminatedOptions.length > 0 && (
            <button
              onClick={onResetLifelines}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-xs font-bold transition cursor-pointer"
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
                    ? 'opacity-25 pointer-events-none line-through border-dashed border-red-500/40 bg-red-950/20 text-slate-500 cursor-not-allowed'
                    : isSelected
                    ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-[0_0_30px_rgba(92,54,245,0.5)] ring-2 ring-indigo-400'
                    : 'bg-[#121626] border-white/10 text-slate-100 hover:bg-white/5 hover:border-white/20'
                }`}
              >
                <span
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-base sm:text-lg md:text-xl font-black shrink-0 transition ${
                    isEliminated ? 'bg-red-500/20 text-red-400' : isSelected ? 'bg-[#5c36f5] text-white shadow-lg' : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {String.fromCharCode(65 + oIdx)}
                </span>
                <span className="leading-tight flex-1 text-lg sm:text-xl md:text-2xl font-black">
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
            className="w-full bg-[#161a29] border border-white/20 text-white text-xl sm:text-2xl md:text-3xl font-bold rounded-2xl px-5 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-inner"
          />
        </div>
      )}
    </div>
  );
};
