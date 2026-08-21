import React from 'react';
import { cleanOptionPrefix } from '../../../utils';
import { Question } from '../types';

interface QuizReviewCardProps {
  q: Question;
  idx: number;
  userAns: string;
  showAnswerToggle: boolean;
  highlightMode: boolean;
  onHighlightText: (qId: number) => void;
  renderFormattedText: (text: string) => React.ReactNode;
}

export const QuizReviewCard = React.memo<QuizReviewCardProps>(({
  q,
  idx,
  userAns,
  showAnswerToggle,
  highlightMode,
  onHighlightText,
  renderFormattedText,
}) => {
  const cleanUserAns = cleanOptionPrefix(userAns).trim().toLowerCase();
  const cleanRightAns = cleanOptionPrefix(q.answer || '').trim().toLowerCase();
  const isCorrect = !!cleanUserAns && cleanUserAns === cleanRightAns;

  return (
    <div className="bg-[#0d1018] border border-white/10 p-6 rounded-2xl space-y-3 shadow-xl">
      <div className="text-xs sm:text-sm font-bold text-indigo-300 border-b border-indigo-500/20 pb-2 flex items-center justify-between">
        <span>Câu {idx + 1}: {q.instruction || ''}</span>
        <span className={`px-3 py-1 rounded-xl text-xs font-black shrink-0 border ${
          isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {isCorrect ? 'ĐÚNG' : 'SAI'}
        </span>
      </div>

      <div className="flex items-start justify-between gap-3">
        <span
          onMouseUp={() => highlightMode && onHighlightText(q.id)}
          className="text-base sm:text-lg font-black text-white leading-relaxed whitespace-pre-wrap flex-1"
        >
          {renderFormattedText(q.question)}
        </span>
      </div>

      {q.type === 'mcq' && q.options && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-bold pt-1">
          {q.options.map((opt, oIdx) => {
            const cleanOpt = cleanOptionPrefix(opt);
            const optLower = cleanOpt.trim().toLowerCase();
            const isUserChoice = cleanUserAns === optLower || userAns === opt;
            const isRightChoice = cleanRightAns === optLower || (q.answer || '').trim() === opt;

            return (
              <div
                key={oIdx}
                className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                  isRightChoice && showAnswerToggle
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-extrabold shadow-sm'
                    : isUserChoice
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-[#141824] border-white/5 text-slate-300'
                }`}
              >
                <span className="w-6 h-6 rounded-lg bg-white/10 text-xs font-black flex items-center justify-center shrink-0">
                  {String.fromCharCode(65 + oIdx)}
                </span>
                <span className="flex-1">{renderFormattedText(cleanOpt)}</span>
                {isRightChoice && showAnswerToggle && (
                  <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    Đáp án đúng
                  </span>
                )}
                {isUserChoice && !isRightChoice && (
                  <span className="text-[11px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                    Đã chọn
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {q.type === 'fill' && (
        <div className="text-sm font-semibold space-y-1.5 pt-1">
          <p className="text-slate-300">Đã chọn: <span className="font-extrabold text-white">{userAns || '(Trống)'}</span></p>
          {showAnswerToggle && <p className="text-emerald-400 font-extrabold">Đáp án đúng: {q.answer}</p>}
        </div>
      )}

      {q.explanation && (
        <p className="text-sm text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl font-medium">
          Giải thích: {q.explanation}
        </p>
      )}
    </div>
  );
});
