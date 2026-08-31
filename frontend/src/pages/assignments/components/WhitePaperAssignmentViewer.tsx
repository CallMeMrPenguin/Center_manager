import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { ShieldCheck, Clock } from 'lucide-react';
import { Assignment, AssignmentDailyLog, AssignmentQuizConfig } from '../types';
import { ExerciseItem } from './types';
import { WhitePaperHeader } from './WhitePaperHeader';
import { ExerciseItemView } from './ExerciseItemView';
import { UlnDocumentRenderer, SectionProgressGroup } from './UlnDocumentRenderer';
import { DrawingCorrectionCanvas } from './DrawingCorrectionCanvas';
import { ExamWarningModal } from './ExamWarningModal';
import { ExamSidebarProgress } from './ExamSidebarProgress';
import { WhitePaperTopNav } from './WhitePaperTopNav';
import { useExamProctoring } from '../hooks/useExamProctoring';
import { parseUlnContent } from '../utils/ulnParser';
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

  const {
    violationCount,
    showWarningModal,
    lastViolationReason,
    dismissWarning,
  } = useExamProctoring({
    enabled: !isPreview && !isReviewMode && quizConfig.proctoring_enabled !== false,
    isStudent: !isPreview && !isReviewMode,
  });

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

  // Always load all nodes of the exam paper so unassigned parts can be shown grayed out
  const ulnNodes = useMemo(() => {
    const raw = assignment.content_json && assignment.content_json.trim()
      ? assignment.content_json
      : SAMPLE_UNIT12_ULN_TEXT;
    return parseUlnContent(raw);
  }, [assignment.content_json]);

  const answerKeys = useMemo(() => {
    return extractAnswerKeysFromUln(assignment.content_json || SAMPLE_UNIT12_ULN_TEXT);
  }, [assignment.content_json]);

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
      <WhitePaperTopNav
        assignment={assignment}
        studentName={studentName}
        isPreview={isPreview}
        isReviewMode={isReviewMode}
        isSubmitted={isSubmitted}
        submissionCount={submissionCount}
        finalScore={finalScore}
        assignmentType={assignmentType}
        quizConfig={quizConfig}
        isTimedExam={isTimedExam}
        isMaxAttemptsReached={isMaxAttemptsReached}
        isFullscreen={isFullscreen}
        isCorrectionMode={isCorrectionMode}
        retryWrongOnly={retryWrongOnly}
        canShowAnswers={canShowAnswers}
        onBack={onBack}
        onEditAnswerKey={onEditAnswerKey}
        onToggleCorrection={() => setIsCorrectionMode(!isCorrectionMode)}
        onToggleFullscreen={toggleBrowserFullscreen}
        onToggleRetryWrong={() => setRetryWrongOnly(!retryWrongOnly)}
        onSubmit={handleSubmit}
      />

      {/* 2. DUAL-PANE LAYOUT: SIDEBAR ON LEFT TIGHTLY ADJACENT TO EXAM SHEET */}
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-start justify-center gap-4 w-full">
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
                  assignedSections={quizConfig.assigned_sections}
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
