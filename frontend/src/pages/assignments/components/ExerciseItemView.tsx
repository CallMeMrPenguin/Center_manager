import React from 'react';
import { cleanOptionPrefix } from '../../../utils';
import { ExerciseItem } from './types';

interface ExerciseItemViewProps {
  exercise: ExerciseItem;
  userAnswer?: string;
  isSubmitted: boolean;
  onSelectOption: (id: number, opt: string) => void;
  renderFormattedText: (text: string) => React.ReactNode;
}

export const ExerciseItemView: React.FC<ExerciseItemViewProps> = ({
  exercise,
  userAnswer,
  isSubmitted,
  onSelectOption,
  renderFormattedText,
}) => {
  const isAnswered = !!userAnswer;
  const isCorrect = isSubmitted && (userAnswer === exercise.answer || cleanOptionPrefix(userAnswer || '') === cleanOptionPrefix(exercise.answer));
  const isWrong = isSubmitted && isAnswered && !isCorrect;

  return (
    <div className="space-y-4">
      {/* Section Header (if present) */}
      {exercise.sectionTitle && (
        <div className="pt-4 border-t-2 border-slate-200">
          <h2 className="text-sm font-black text-indigo-900 uppercase tracking-wide bg-indigo-50/70 border-l-4 border-indigo-600 px-3 py-2 rounded-r-lg">
            {exercise.sectionTitle}
          </h2>
        </div>
      )}

      {/* Word Bank Box (if present) */}
      {exercise.wordBank && exercise.wordBank.length > 0 && (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3.5 text-center space-y-1.5">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
            Khung Từ Vựng Tham Khảo (Word Bank)
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {exercise.wordBank.map((word, wIdx) => (
              <span key={wIdx} className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 shadow-sm">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Reading Passage Quote Card (if present) */}
      {exercise.passage && (
        <div className="bg-slate-50/80 border-l-4 border-indigo-500 rounded-r-xl p-4 text-xs font-serif text-slate-800 leading-relaxed italic space-y-2">
          <span className="font-sans font-black text-[10px] text-indigo-700 uppercase tracking-widest block not-italic">
            Đoạn Văn Đọc Hiểu:
          </span>
          <p>{exercise.passage}</p>
        </div>
      )}

      {/* Question Item Row */}
      <div
        className={`p-4 rounded-xl transition border ${
          isCorrect
            ? 'bg-emerald-50/60 border-emerald-300'
            : isWrong
            ? 'bg-rose-50/60 border-rose-300'
            : 'bg-white border-transparent hover:border-slate-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <span className="font-black text-xs text-indigo-700 pt-0.5 shrink-0">
            {exercise.qNum}.
          </span>

          <div className="flex-1 space-y-3">
            {/* Question Stem Text */}
            <div className="text-sm font-bold text-slate-900 leading-relaxed">
              {renderFormattedText(exercise.text)}
            </div>

            {/* Multiple Choice Options (A, B, C, D) */}
            {exercise.options && exercise.options.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                {exercise.options.map((opt, optIdx) => {
                  const optLetter = String.fromCharCode(65 + optIdx);
                  const isSelected = userAnswer === opt;
                  const isOptCorrect = isSubmitted && (opt === exercise.answer || cleanOptionPrefix(opt) === cleanOptionPrefix(exercise.answer));
                  const isOptWrong = isSubmitted && isSelected && !isOptCorrect;

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => onSelectOption(exercise.id, opt)}
                      className={`p-2.5 rounded-xl text-left border flex items-center gap-2.5 transition cursor-pointer text-xs select-none ${
                        isOptCorrect
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold shadow-sm'
                          : isOptWrong
                          ? 'bg-rose-100 border-rose-400 text-rose-950 font-bold line-through'
                          : isSelected
                          ? 'bg-indigo-100 border-indigo-600 text-indigo-950 font-black shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/50'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                          isOptCorrect
                            ? 'bg-emerald-600 text-white'
                            : isOptWrong
                            ? 'bg-rose-600 text-white'
                            : isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {optLetter}
                      </span>
                      <span className="flex-1">
                        {renderFormattedText(opt)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Explanation box after submission */}
            {isSubmitted && exercise.explanation && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2.5 text-xs text-indigo-950 space-y-0.5">
                <span className="font-bold text-indigo-700 block">
                  Đáp án đúng: <strong>{exercise.answer}</strong>
                </span>
                <p className="text-slate-700 italic">{exercise.explanation}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
