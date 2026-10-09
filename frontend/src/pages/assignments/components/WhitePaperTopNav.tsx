import React from 'react';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { Assignment, AssignmentQuizConfig } from '../types';
import { ExamTimerHeader } from './ExamTimerHeader';

interface WhitePaperTopNavProps {
  assignment: Assignment;
  studentName: string;
  isPreview: boolean;
  isReviewMode: boolean;
  isSubmitted: boolean;
  submissionCount: number;
  finalScore: number;
  assignmentType: string;
  quizConfig: AssignmentQuizConfig;
  isTimedExam: boolean;
  isMaxAttemptsReached: boolean;
  isFullscreen: boolean;
  isCorrectionMode: boolean;
  retryWrongOnly: boolean;
  canShowAnswers: boolean;
  onBack: () => void;
  onEditAnswerKey?: (assignment: Assignment) => void;
  onToggleCorrection: () => void;
  onToggleFullscreen: () => void;
  onToggleRetryWrong: () => void;
  onSubmit: () => void;
}

export const WhitePaperTopNav: React.FC<WhitePaperTopNavProps> = ({
  assignment,
  studentName,
  isPreview,
  isReviewMode,
  isSubmitted,
  submissionCount,
  finalScore,
  assignmentType,
  quizConfig,
  isTimedExam,
  isMaxAttemptsReached,
  isFullscreen,
  isCorrectionMode,
  retryWrongOnly,
  canShowAnswers,
  onBack,
  onEditAnswerKey,
  onToggleCorrection,
  onToggleFullscreen,
  onToggleRetryWrong,
  onSubmit,
}) => {
  return (
    <div className="sticky top-0 z-40 bg-white dark:bg-[#10172c] border-b border-slate-200 dark:border-[#1e2742] px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs -mx-6 -mt-6 mb-6 before:absolute before:-top-40 before:inset-x-0 before:h-40 before:bg-white dark:before:bg-[#10172c] before:pointer-events-none">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition cursor-pointer shrink-0"
          title="Quay lại"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[240px] sm:max-w-md">
              {assignment.title}
            </h3>
            {assignmentType === 'practice' && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300">
                Ôn luyện
              </span>
            )}
            {assignmentType === 'homework_2' && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                Kiểm tra
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
            <span>Học sinh: <strong className="text-slate-800 dark:text-slate-200">{studentName}</strong></span>
            <span>Trạng thái: <strong className="text-blue-600 dark:text-blue-400 font-semibold">{isSubmitted ? `Đã nộp (${submissionCount} lần)` : 'Đang làm bài'}</strong></span>
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        {isTimedExam && (
          <ExamTimerHeader
            timeLimitMinutes={quizConfig.time_limit_minutes || 45}
            onTimeExpired={onSubmit}
            isSubmitted={isSubmitted}
          />
        )}

        {assignmentType === 'practice' && isSubmitted && canShowAnswers && (
          <button
            type="button"
            onClick={onToggleRetryWrong}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
              retryWrongOnly
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
            }`}
          >
            {retryWrongOnly ? 'Đang làm lại câu sai' : 'Làm lại câu sai'}
          </button>
        )}

        {isPreview && !isReviewMode && onEditAnswerKey && (
          <button
            type="button"
            onClick={() => onEditAnswerKey(assignment)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
          >
            Sửa đáp án
          </button>
        )}

        <button
          type="button"
          onClick={onToggleCorrection}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
            isCorrectionMode
              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
          }`}
        >
          Canvas
        </button>

        <button
          type="button"
          onClick={onToggleFullscreen}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-white/10 transition cursor-pointer"
          title={isFullscreen ? 'Thu nhỏ (Esc)' : 'Toàn màn hình'}
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>

        {isSubmitted && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
            Điểm: {finalScore}/10.0
          </div>
        )}

        {!isReviewMode && !isSubmitted && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isMaxAttemptsReached}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer"
          >
            Nộp bài
          </button>
        )}
      </div>
    </div>
  );
};
