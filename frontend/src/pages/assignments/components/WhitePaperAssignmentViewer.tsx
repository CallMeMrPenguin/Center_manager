import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { ArrowLeft, Award, Save, Maximize2, Minimize2, PenTool, KeyRound, RefreshCw, Layers, ShieldCheck, Clock } from 'lucide-react';
import { Assignment, AssignmentDailyLog, AssignmentQuizConfig } from '../types';
import { ExerciseItem } from './types';
import { WhitePaperHeader } from './WhitePaperHeader';
import { ExerciseItemView } from './ExerciseItemView';
import { UlnDocumentRenderer, SectionProgressGroup } from './UlnDocumentRenderer';
import { DrawingCorrectionCanvas } from './DrawingCorrectionCanvas';
import { ExamWarningModal } from './ExamWarningModal';
import { ExamTimerHeader } from './ExamTimerHeader';
import { ExamSidebarProgress } from './ExamSidebarProgress';
import { useExamProctoring } from '../hooks/useExamProctoring';
import { parseUlnContent } from '../utils/ulnParser';
import { filterNodesByAssignedSections } from '../utils/ulnSectionExtractor';
import { extractAnswerKeysFromUln } from '../utils/answerKeyEvaluator';
import { SAMPLE_UNIT12_ULN_TEXT } from '../constants/sampleUlnTest';
import { format1Dec } from '../../../utils';
import { showToast } from '../../../components/Toast';

interface WhitePaperAssignmentViewerProps {
  assignment: Assignment;
  studentName?: string;
  isPreview?: boolean;
  isReviewMode?: boolean;
  initialAnswers?: Record<string, string>;
  initialDailyLogs?: AssignmentDailyLog[];
  initialScore?: number | null;
  onBack: () => void;
  onEditAnswerKey?: (assignment: Assignment) => void;
  onSubmitSuccess?: (score: number) => void;
}

export const WhitePaperAssignmentViewer: React.FC<WhitePaperAssignmentViewerProps> = ({
  assignment,
  studentName = 'Học Sinh',
  isPreview = true,
  isReviewMode = false,
  initialAnswers,
  initialDailyLogs,
  initialScore,
  onBack,
  onEditAnswerKey,
  onSubmitSuccess,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCorrectionMode, setIsCorrectionMode] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>(initialAnswers || {});
  const [isSubmitted, setIsSubmitted] = useState(isReviewMode || (initialScore !== undefined && initialScore !== null));
  const [submissionCount, setSubmissionCount] = useState(isReviewMode ? 1 : 0);
  const [finalScore, setFinalScore] = useState<number>(initialScore ?? 0);
  const [dailyLogs] = useState<AssignmentDailyLog[]>(initialDailyLogs || []);
  const [retryWrongOnly, setRetryWrongOnly] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ answered: number; total: number; sections: SectionProgressGroup[] }>({
    answered: 0,
    total: 0,
    sections: [],
  });

  // Parse assignment quiz_config
  const quizConfig: AssignmentQuizConfig = useMemo(() => {
    if (!assignment.quiz_config) return { assignment_type: 'homework_1' };
    try {
      return JSON.parse(assignment.quiz_config);
    } catch {
      return { assignment_type: 'homework_1' };
    }
  }, [assignment.quiz_config]);

  const assignmentType = quizConfig.assignment_type || 'homework_1';
  const isTimedExam = assignmentType === 'homework_2' && !!quizConfig.time_limit_minutes && !isPreview && !isReviewMode;
  const isMaxAttemptsReached = !!quizConfig.max_attempts && quizConfig.max_attempts > 0 && submissionCount >= quizConfig.max_attempts;

  // Answer Key visibility rule:
  // - Teacher preview / review: always visible
  // - Practice mode: immediately visible after submitting
  // - Homework 1 / Homework 2: only revealed on the next day / past due date
  const canShowAnswers = useMemo(() => {
    if (isPreview || isReviewMode) return true;
    if (assignmentType === 'practice') return isSubmitted;
    if (isSubmitted) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const isPastDueDate = !!assignment.due_date && todayStr > assignment.due_date;
      const isPastAssignedDate = !!assignment.assigned_date && todayStr > assignment.assigned_date;
      return isPastDueDate || isPastAssignedDate;
    }
    return false;
  }, [isPreview, isReviewMode, assignmentType, isSubmitted, assignment.due_date, assignment.assigned_date]);

  // Anti-cheat Proctoring: strictly enabled for student homework_2 exams
  const {
    violationCount,
    showWarningModal,
    lastViolationReason,
    dismissWarning,
  } = useExamProctoring({
    enabled: !isPreview && !isReviewMode && quizConfig.proctoring_enabled !== false,
    isStudent: !isPreview && !isReviewMode,
  });

  // Sync fullscreen state
  const isViewerFullscreenRef = useRef(false);
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        isViewerFullscreenRef.current = false;
        setIsFullscreen(false);
      } else if (isViewerFullscreenRef.current) {
        setIsFullscreen(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      isViewerFullscreenRef.current = true;
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
        isViewerFullscreenRef.current = false;
      });
    } else {
      isViewerFullscreenRef.current = false;
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Parse ULN document nodes and filter by assigned sections
  const ulnNodes = useMemo(() => {
    const raw = assignment.content_json && assignment.content_json.trim()
      ? assignment.content_json
      : SAMPLE_UNIT12_ULN_TEXT;
    const parsed = parseUlnContent(raw);
    return filterNodesByAssignedSections(parsed, quizConfig.assigned_sections);
  }, [assignment.content_json, quizConfig.assigned_sections]);

  // Extract answer keys from assignment content
  const answerKeys = useMemo(() => {
    return extractAnswerKeysFromUln(assignment.content_json || SAMPLE_UNIT12_ULN_TEXT);
  }, [assignment.content_json]);

  // Fallback exercises
  const fallbackExercises: ExerciseItem[] = useMemo(() => [
    {
      id: 1,
      qNum: 1,
      type: 'pr',
      sectionTitle: 'A. PHONETICS - I. Choose the word that has the underlined part pronounced differently.',
      text: 'Choose the word whose underlined part is pronounced differently:',
      options: ['[po]{u}ttery', 'fl[ow]{u}er', '[si]{u}lent', '[se]{u}rvice'],
      answer: 'pottery',
    },
  ], []);

  const handleSelectOption = useCallback((exId: number, opt: string) => {
    setUserAnswers((prev) => ({ ...prev, [String(exId)]: opt }));
  }, []);

  const handleSubmit = () => {
    if (isMaxAttemptsReached) {
      showToast(`Đã đạt giới hạn tối đa ${quizConfig.max_attempts} lần nộp bài!`, 'warning');
      return;
    }

    const total = progress.total || fallbackExercises.length || 10;
    const answered = progress.answered || Object.keys(userAnswers).length;
    const score = Number(format1Dec((answered / (total || 1)) * (assignment.max_score || 10)));

    setFinalScore(score);
    setIsSubmitted(true);
    setSubmissionCount((prev) => prev + 1);

    const typeMsg =
      assignmentType === 'homework_2'
        ? ' (Đã lưu điểm vào BTVN 2)'
        : assignmentType === 'homework_1'
        ? ' (Đã lưu điểm vào BTVN 1)'
        : ' (Bài Ôn Luyện)';

    showToast(`Đã nộp bài thành công! Điểm: ${score}/10.0${typeMsg}`, 'success');
    if (onSubmitSuccess) onSubmitSuccess(score);
  };

  const pct = progress.total > 0 ? Math.round((progress.answered / progress.total) * 100) : 0;

  const mainContent = (
    <div
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      className={`${
        isFullscreen
          ? 'fixed inset-0 z-[99999] bg-[#08090e] overflow-y-auto p-3 sm:p-6 flex flex-col'
          : 'relative'
      } space-y-4 pb-12 select-none font-sans`}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* 1. DOCKED TOP NAVIGATION BAR */}
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
          {/* Exam Countdown Timer for HW2 */}
          {isTimedExam && (
            <ExamTimerHeader
              timeLimitMinutes={quizConfig.time_limit_minutes || 45}
              onTimeExpired={handleSubmit}
              isSubmitted={isSubmitted}
            />
          )}

          {/* Retry Wrong Questions Mode (Practice Only) */}
          {assignmentType === 'practice' && isSubmitted && canShowAnswers && (
            <button
              type="button"
              onClick={() => setRetryWrongOnly(!retryWrongOnly)}
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

          {/* Answer Key Editor (Teacher Mode) */}
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
            onClick={() => setIsCorrectionMode(!isCorrectionMode)}
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
            onClick={toggleBrowserFullscreen}
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
              onClick={handleSubmit}
              disabled={isMaxAttemptsReached}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#6c48f7] disabled:opacity-40 text-white text-xs font-black shadow-[0_0_15px_rgba(92,54,245,0.4)] transition cursor-pointer active:scale-95"
            >
              <Save size={14} />
              <span>Nộp Bài</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. DUAL-PANE LAYOUT: SIDEBAR ON LEFT TIGHTLY ADJACENT TO EXAM SHEET */}
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-start justify-center gap-4 w-full">
        {/* Left Question Navigation Sidebar */}
        <ExamSidebarProgress
          answered={progress.answered}
          total={progress.total || 10}
          pct={pct}
          sections={progress.sections}
        />

        {/* Right A4 Paper Test View */}
        <div className={`flex-1 ${isFullscreen ? 'max-w-[1020px]' : 'max-w-[850px]'} w-full space-y-4 transition-all duration-200`}>
          {/* Post-submission Next-Day Notice for Homework Mode */}
          {isSubmitted && !canShowAnswers && !isPreview && !isReviewMode && (
            <div className="p-3.5 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 text-xs flex items-center gap-2.5 shadow-lg">
              <ShieldCheck size={18} className="text-indigo-400 shrink-0" />
              <div className="flex-1">
                <strong className="text-white">Đã nộp bài thành công (Điểm: {finalScore}/10.0)!</strong>
                <p className="text-indigo-300/80 mt-0.5 flex items-center gap-1">
                  <Clock size={12} />
                  <span>Đáp án chi tiết & giải thích sẽ tự động hiển thị vào ngày mai (hoặc sau hạn nộp bài).</span>
                </p>
              </div>
            </div>
          )}

          <div className="white-paper-container relative w-full bg-white text-slate-900 rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-slate-300 p-6 sm:p-12 min-h-[1100px] flex flex-col justify-between font-sans">
            <DrawingCorrectionCanvas
              isActive={isCorrectionMode}
              assignmentId={assignment.id}
              studentName={studentName}
              pageKey="white_paper"
            />

            <div className="space-y-6">
              <WhitePaperHeader
                assignment={assignment}
                studentName={studentName}
                isSubmitted={isSubmitted}
                finalScore={String(finalScore)}
                correctCount={progress.answered}
                total={progress.total || 10}
              />

              {ulnNodes.length > 0 ? (
                <UlnDocumentRenderer
                  nodes={ulnNodes}
                  initialAnswers={userAnswers}
                  answerKeys={answerKeys}
                  dailyLogs={dailyLogs}
                  isSubmitted={isSubmitted}
                  showAnswerKeys={canShowAnswers}
                  onProgressUpdate={(ans, tot, secs) => {
                    setProgress({ answered: ans, total: tot, sections: secs });
                  }}
                />
              ) : (
                <div className="space-y-6 pt-4">
                  {fallbackExercises.map((item) => (
                    <ExerciseItemView
                      key={item.id}
                      exercise={item}
                      userAnswer={userAnswers[String(item.id)]}
                      isSubmitted={isSubmitted}
                      onSelectOption={handleSelectOption}
                      renderFormattedText={(t) => <span>{t}</span>}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="border-t-2 border-slate-800 pt-5 text-center text-xs text-slate-500 font-semibold">
              <p>--- HẾT BÀI KIỂM TRA ---</p>
            </div>
          </div>
        </div>
      </div>

      {/* Anti-cheat Tab Switch Warning Modal */}
      {!isPreview && !isReviewMode && (
        <ExamWarningModal
          isOpen={showWarningModal}
          violationCount={violationCount}
          reason={lastViolationReason}
          onDismiss={dismissWarning}
        />
      )}
    </div>
  );

  if (isFullscreen) {
    return ReactDOM.createPortal(mainContent, document.body);
  }

  return mainContent;
};
