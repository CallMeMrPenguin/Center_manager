import React, { useState } from 'react';
import { Award, RotateCcw, Eye, EyeOff, Highlighter } from 'lucide-react';
import { Question, TestData } from '../types';
import { QuizReviewCard } from './QuizReviewCard';

interface QuizResultsViewProps {
  testData: TestData | null;
  activeQuestions: Question[];
  userAnswers: Record<number, string>;
  calculatedScore: number;
  correctCount: number;
  totalQuestions: number;
  onRetake: () => void;
  renderFormattedText: (text: string) => React.ReactNode;
}

export const QuizResultsView: React.FC<QuizResultsViewProps> = ({
  testData,
  activeQuestions,
  userAnswers,
  calculatedScore,
  correctCount,
  totalQuestions,
  onRetake,
  renderFormattedText,
}) => {
  const [showAnswerToggle, setShowAnswerToggle] = useState(true);
  const [highlightMode, setHighlightMode] = useState(false);
  const [, setHighlights] = useState<Record<number, string[]>>({});
  const [reviewPage, setReviewPage] = useState(1);
  const pageSize = 10;

  const handleToggleHighlightText = (qId: number) => {
    const selection = window.getSelection()?.toString().trim();
    if (selection) {
      setHighlights(prev => ({
        ...prev,
        [qId]: [...(prev[qId] || []), selection]
      }));
    }
  };

  const totalPages = Math.ceil(activeQuestions.length / pageSize);
  const startIdx = (reviewPage - 1) * pageSize;
  const currentSlice = activeQuestions.slice(startIdx, startIdx + pageSize);

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      {/* KPI SCORE CARD */}
      <div className="bg-[#0c0f1e] border border-[#1d2744] rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-4 relative overflow-hidden">
        <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_30px_rgba(92,54,245,0.4)] mx-auto">
          <Award size={32} />
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Kết Quả Bài Kiểm Tra</h2>
          <p className="text-xs text-slate-400 font-semibold">{testData?.title || 'Đề thi'}</p>
        </div>

        <div className="flex items-center justify-center gap-6 sm:gap-10 py-3">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-black text-indigo-400 font-mono">
              {calculatedScore} / 10
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Điểm Số</div>
          </div>

          <div className="h-12 w-px bg-white/10" />

          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
              {correctCount} / {totalQuestions}
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Số Câu Đúng</div>
          </div>

          <div className="h-12 w-px bg-white/10" />

          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-black text-rose-400 font-mono">
              {totalQuestions - correctCount} / {totalQuestions}
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Số Câu Sai</div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onRetake}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] text-white text-xs font-black transition cursor-pointer shadow-[0_4px_14px_rgba(92,54,245,0.4)] border border-white/20 active:scale-95"
          >
            <RotateCcw size={14} />
            <span>Làm Lại Bài Thi</span>
          </button>
        </div>
      </div>

      {/* REVIEW CONTROLS */}
      <div className="flex items-center justify-between bg-[#0c0f1e] border border-white/10 px-5 py-3 rounded-2xl shadow-lg">
        <div className="text-xs font-black uppercase text-slate-300 tracking-wider">
          Chi Tiết Bài Làm ({totalQuestions} Câu)
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAnswerToggle(!showAnswerToggle)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              showAnswerToggle ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-white/5 text-slate-300 border-white/10'
            }`}
          >
            {showAnswerToggle ? <Eye size={13} /> : <EyeOff size={13} />}
            <span>{showAnswerToggle ? 'Ẩn Đáp Án' : 'Hiện Đáp Án'}</span>
          </button>

          <button
            onClick={() => setHighlightMode(!highlightMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              highlightMode ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-white/5 text-slate-300 border-white/10'
            }`}
          >
            <Highlighter size={13} />
            <span>{highlightMode ? 'Đang Bật Highlight' : 'Bật Highlight Text'}</span>
          </button>
        </div>
      </div>

      {/* REVIEW LIST WITH PAGINATION */}
      <div className="space-y-4">
        {currentSlice.map((item, localIdx) => {
          const globalIdx = startIdx + localIdx;
          return (
            <QuizReviewCard
              key={item.id}
              q={item}
              idx={globalIdx}
              userAns={userAnswers[item.id] || ''}
              showAnswerToggle={showAnswerToggle}
              highlightMode={highlightMode}
              onHighlightText={handleToggleHighlightText}
              renderFormattedText={renderFormattedText}
            />
          );
        })}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <button
              disabled={reviewPage === 1}
              onClick={() => setReviewPage(p => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 disabled:opacity-30 cursor-pointer border border-white/5"
            >
              ← Trang trước
            </button>
            <span className="text-xs font-black text-slate-400 font-mono">
              Trang {reviewPage} / {totalPages}
            </span>
            <button
              disabled={reviewPage === totalPages}
              onClick={() => setReviewPage(p => Math.min(totalPages, p + 1))}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 disabled:opacity-30 cursor-pointer border border-white/5"
            >
              Trang sau →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
