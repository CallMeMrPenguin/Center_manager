import React, { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, CheckCircle2, Award, Sparkles, RefreshCw, Bookmark, Send, FileText } from 'lucide-react';
import { Assignment } from '../types';
import { cleanOptionPrefix, trunc1Dec } from '../../../utils';
import { showToast } from '../../../components/Toast';

interface QuestionItem {
  id: number;
  text: string;
  options: string[];
  answer: string;
  explanation?: string;
}

interface OnlineAssignmentRunnerProps {
  assignment: Assignment;
  studentId?: number;
  studentName?: string;
  isPreview?: boolean;
  onBack: () => void;
  onSubmitSuccess?: (score: number) => void;
}

export const OnlineAssignmentRunner: React.FC<OnlineAssignmentRunnerProps> = ({
  assignment,
  studentId,
  studentName = 'Học Sinh',
  isPreview = true,
  onBack,
  onSubmitSuccess,
}) => {
  // Parse questions from assignment.content_json or fallback to sample test
  const questions: QuestionItem[] = useMemo(() => {
    if (assignment.content_json && assignment.content_json.trim()) {
      try {
        const parsed = JSON.parse(assignment.content_json);
        const qList = Array.isArray(parsed) ? parsed : parsed.questions || [];
        if (qList.length > 0) {
          return qList.map((q: any, idx: number) => ({
            id: q.id || idx + 1,
            text: q.text || q.question_text || q.question || `Câu hỏi số ${idx + 1}`,
            options: Array.isArray(q.options)
              ? q.options.map((o: any) => cleanOptionPrefix(String(o)))
              : [q.option_1, q.option_2, q.option_3, q.option_4].filter(Boolean).map((o: any) => cleanOptionPrefix(String(o))),
            answer: cleanOptionPrefix(String(q.answer || 'A')),
            explanation: q.explanation || '',
          }));
        }
      } catch (e) {
        console.error('Failed to parse assignment content_json:', e);
      }
    }

    // Default built-in sample test for instant preview / test running
    return [
      {
        id: 1,
        text: 'Choose the word whose underlined part is pronounced differently from the others:',
        options: ['[th]ink', '[th]at', '[th]ank', '[th]in'],
        answer: '[th]at',
        explanation: 'Option B is pronounced /ð/, others are /θ/.',
      },
      {
        id: 2,
        text: 'She has been studying English ______ five years.',
        options: ['since', 'for', 'in', 'at'],
        answer: 'for',
        explanation: 'Dùng "for" trước một khoảng thời gian (five years).',
      },
      {
        id: 3,
        text: 'If it ______ tomorrow, we will stay at home.',
        options: ['rains', 'will rain', 'rained', 'is raining'],
        answer: 'rains',
        explanation: 'Câu điều kiện loại 1: If + Present Simple, will + V.',
      },
      {
        id: 4,
        text: 'The book ______ you gave me yesterday is very interesting.',
        options: ['which', 'who', 'whom', 'whose'],
        answer: 'which',
        explanation: 'Dùng đại từ quan hệ "which" thay thế cho danh từ chỉ vật (The book).',
      },
      {
        id: 5,
        text: 'They decided ______ to the cinema because it was too late.',
        options: ['not to go', 'not going', 'to not go', 'to go not'],
        answer: 'not to go',
        explanation: 'Cấu trúc: decide (not) to + V.',
      },
    ];
  }, [assignment.content_json]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [bookmarks, setBookmarks] = useState<Record<number, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentQ = questions[currentIndex] || questions[0];

  const handleSelectOption = (opt: string) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [currentQ.id]: opt }));
  };

  const handleToggleBookmark = () => {
    setBookmarks((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  // Calculate score
  const total = questions.length;
  const correctCount = useMemo(() => {
    let count = 0;
    questions.forEach((q) => {
      const uAns = (userAnswers[q.id] || '').trim().toLowerCase();
      const cAns = (q.answer || '').trim().toLowerCase();
      if (uAns && (uAns === cAns || cleanOptionPrefix(uAns) === cleanOptionPrefix(cAns))) {
        count++;
      }
    });
    return count;
  }, [questions, userAnswers]);

  const finalScore = useMemo(() => {
    return total > 0 ? trunc1Dec((correctCount / total) * 10) : '0.0';
  }, [correctCount, total]);

  const handleSubmit = () => {
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < total) {
      if (!window.confirm(`Bạn mới trả lời ${answeredCount}/${total} câu hỏi. Bạn có chắc muốn nộp bài ngay bây giờ?`)) {
        return;
      }
    }
    setIsSubmitted(true);
    showToast(`Đã nộp bài thành công! Điểm số của bạn: ${finalScore}/10.0`, 'success');
    if (onSubmitSuccess) {
      onSubmitSuccess(parseFloat(String(finalScore)));
    }
  };


  const renderFormattedText = useCallback((text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[[^\]]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const content = part.slice(1, -1);
        return (
          <span
            key={index}
            className="underline decoration-indigo-400 decoration-2 underline-offset-4 font-black text-indigo-300 px-0.5"
          >
            {content}
          </span>
        );
      }
      return part;
    });
  }, []);

  return (
    <div className="space-y-4 select-none">
      {/* Top Navigation Banner */}
      <div className="bg-[#0c0f1e] border border-[#1e2742] rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
            title="Quay lại"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-white">
                {assignment.title}
              </h3>
              {isPreview && (
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Chế Độ Xem Trước (Preview)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Học sinh: <strong className="text-slate-200">{studentName}</strong> | Tổng số: <strong className="text-indigo-300">{total} câu hỏi</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!isSubmitted ? (
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#6c48f7] text-white text-xs font-black shadow-[0_0_15px_rgba(92,54,245,0.4)] transition cursor-pointer active:scale-95"
            >
              <Send size={14} />
              <span>Nộp Bài Thi</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-black">
                <Award size={15} />
                <span>Điểm: {finalScore}/10.0 ({correctCount}/{total} câu đúng)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setUserAnswers({});
                  setCurrentIndex(0);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition"
              >
                <RefreshCw size={13} />
                <span>Làm lại</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Question Solving Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left 3 cols: Question Card */}
        <div className="lg:col-span-3 bg-[#0c0f1e] border border-[#1e2742] rounded-2xl p-6 shadow-xl space-y-6 flex flex-col justify-between min-h-[420px]">
          <div className="space-y-4">
            {/* Question Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-xs">
                  {currentIndex + 1}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  Câu hỏi {currentIndex + 1} trên {total}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleBookmark}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  bookmarks[currentQ.id]
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                    : 'bg-white/5 text-slate-400 border-transparent hover:text-white'
                }`}
              >
                <Bookmark size={13} className={bookmarks[currentQ.id] ? 'fill-amber-400' : ''} />
                <span>{bookmarks[currentQ.id] ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
              </button>
            </div>

            {/* Question Content */}
            <div className="text-base font-bold text-slate-100 leading-relaxed min-h-[50px]">
              {renderFormattedText(currentQ.text)}
            </div>

            {/* Multiple Choice Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {currentQ.options.map((opt, optIdx) => {
                const optLetter = String.fromCharCode(65 + optIdx);
                const isSelected = userAnswers[currentQ.id] === opt;
                const isCorrect = isSubmitted && (opt === currentQ.answer || cleanOptionPrefix(opt) === cleanOptionPrefix(currentQ.answer));
                const isWrongSelected = isSubmitted && isSelected && !isCorrect;

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full p-4 rounded-xl text-left border flex items-start gap-3 transition-all cursor-pointer select-none active:scale-[0.99] ${
                      isCorrect
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : isWrongSelected
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-200 font-bold'
                        : isSelected
                        ? 'bg-[#5c36f5]/25 border-indigo-500 text-white font-black shadow-[0_0_12px_rgba(92,54,245,0.4)]'
                        : 'bg-[#121626] border-[#232c49] text-slate-300 hover:border-slate-500 hover:bg-[#161b2e]'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                        isCorrect
                          ? 'bg-emerald-500 text-white'
                          : isWrongSelected
                          ? 'bg-rose-500 text-white'
                          : isSelected
                          ? 'bg-[#5c36f5] text-white'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {optLetter}
                    </span>
                    <span className="text-sm font-semibold flex-1 pt-0.5">
                      {renderFormattedText(opt)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Explanation box when submitted */}
            {isSubmitted && currentQ.explanation && (
              <div className="bg-[#121628] border border-indigo-500/20 rounded-xl p-3.5 space-y-1 text-xs">
                <span className="font-black text-indigo-400 uppercase tracking-wider block">
                  Giải thích đáp án:
                </span>
                <p className="text-slate-300">{currentQ.explanation}</p>
              </div>
            )}
          </div>

          {/* Question Navigation Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition disabled:opacity-30 cursor-pointer"
            >
              Câu Trước
            </button>
            <span className="text-xs font-mono font-bold text-slate-400">
              {currentIndex + 1} / {total}
            </span>
            <button
              type="button"
              disabled={currentIndex === total - 1}
              onClick={() => setCurrentIndex((prev) => Math.min(total - 1, prev + 1))}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition disabled:opacity-30 cursor-pointer"
            >
              Câu Tiếp
            </button>
          </div>
        </div>

        {/* Right 1 col: Question Number Grid Palette */}
        <div className="bg-[#0c0f1e] border border-[#1e2742] rounded-2xl p-4 shadow-xl space-y-4">
          <div className="border-b border-white/5 pb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 block">
              Danh Sách Câu Hỏi
            </span>
            <span className="text-[11px] text-slate-500">
              Đã làm: {Object.keys(userAnswers).length}/{total}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isAnswered = !!userAnswers[q.id];
              const isBookmarked = !!bookmarks[q.id];

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 rounded-xl font-bold text-xs flex items-center justify-center relative transition cursor-pointer active:scale-95 ${
                    isCurrent
                      ? 'border-2 border-indigo-400 bg-indigo-500/30 text-white font-black shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                      : isAnswered
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-[#121626] border border-[#232c49] text-slate-400 hover:border-slate-500 hover:text-white'
                  }`}
                >
                  <span>{idx + 1}</span>
                  {isBookmarked && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick instructions */}
          <div className="space-y-1 text-[11px] text-slate-400 pt-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-md bg-emerald-500/30 border border-emerald-500/50" />
              <span>Đã chọn đáp án</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-md bg-[#121626] border border-[#232c49]" />
              <span>Chưa làm</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Đã đánh dấu xem lại</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
