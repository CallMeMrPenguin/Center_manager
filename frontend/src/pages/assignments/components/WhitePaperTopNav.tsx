import React from 'react';
import { ArrowLeft, Award, Save, Maximize2, Minimize2, PenTool, KeyRound, RefreshCw, Layers } from 'lucide-react';
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
    <div className="sticky top-0 z-40 bg-[#0c0f1e] border-b border-[#1e2742] px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg -mx-6 -mt-6 mb-6 before:absolute before:-top-40 before:inset-x-0 before:h-40 before:bg-[#0c0f1e] before:pointer-events-none">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
          title="Quay lại"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-white truncate max-w-[240px] sm:max-w-md">
              {assignment.title}
            </h3>
            {assignmentType === 'practice' && (
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                Bài Ôn Luyện
              </span>
            )}
            {assignmentType === 'homework_2' && (
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                Bài Kiểm Tra (HW2)
              </span>
            )}
            {quizConfig.assigned_sections && quizConfig.assigned_sections.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Layers size={10} />
                <span>Giao {quizConfig.assigned_sections.length} bài</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Học sinh: <strong className="text-slate-200">{studentName}</strong> | Trạng thái:{' '}
            <strong className="text-indigo-300">
              {isSubmitted ? `Đã nộp (${submissionCount} lần)` : 'Đang làm bài'}
            </strong>
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
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              retryWrongOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
            }`}
          >
            <RefreshCw size={13} className={retryWrongOnly ? 'animate-spin' : ''} />
            <span>{retryWrongOnly ? 'Đang làm lại câu sai' : 'Làm lại câu sai'}</span>
          </button>
        )}

        {isPreview && !isReviewMode && onEditAnswerKey && (
          <button
            type="button"
            onClick={() => onEditAnswerKey(assignment)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border-indigo-500/30 active:scale-95"
          >
            <KeyRound size={14} className="text-indigo-400" />
            <span>Sửa Đáp Án</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleCorrection}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
            isCorrectionMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
          }`}
        >
          <PenTool size={14} />
          <span>Bút Chấm</span>
        </button>

        <button
          type="button"
          onClick={onToggleFullscreen}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold border border-white/10 transition cursor-pointer active:scale-95"
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
        </button>

        {isSubmitted && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-black">
            <Award size={15} />
            <span>Điểm: {finalScore}/10.0</span>
          </div>
        )}

        {!isReviewMode && !isSubmitted && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isMaxAttemptsReached}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#6c48f7] disabled:opacity-40 text-white text-xs font-black shadow-[0_0_15px_rgba(92,54,245,0.4)] transition cursor-pointer active:scale-95"
          >
            <Save size={14} />
            <span>Nộp Bài</span>
          </button>
        )}
      </div>
    </div>
  );
};
