import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { ArrowLeft, Award, Save, Maximize2, Minimize2, ChevronRight, PenTool, KeyRound } from 'lucide-react';
import { Assignment, AssignmentDailyLog } from '../types';
import { ExerciseItem } from './types';
import { WhitePaperHeader } from './WhitePaperHeader';
import { ExerciseItemView } from './ExerciseItemView';
import { UlnDocumentRenderer, SectionProgressGroup } from './UlnDocumentRenderer';
import { DrawingCorrectionCanvas } from './DrawingCorrectionCanvas';
import { ExamWarningModal } from './ExamWarningModal';
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
  const [progress, setProgress] = useState<{ answered: number; total: number; sections: SectionProgressGroup[] }>({
    answered: 0,
    total: 0,
    sections: [],
  });

  // Anti-cheat Proctoring: strictly disabled for preview, review & teacher modes
  const {
    violationCount,
    showWarningModal,
    lastViolationReason,
    dismissWarning,
  } = useExamProctoring({
    enabled: !isPreview && !isReviewMode,
    isStudent: !isPreview && !isReviewMode,
  });

  // Sync fullscreen state with browser events (F11 / Esc)
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

  // Parse ULN document nodes
  const ulnNodes = useMemo(() => {
    const raw = assignment.content_json && assignment.content_json.trim()
      ? assignment.content_json
      : SAMPLE_UNIT12_ULN_TEXT;
    return parseUlnContent(raw);
  }, [assignment.content_json]);

  // Extract answer keys from assignment content for instant student vs key comparison
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
    const total = progress.total || fallbackExercises.length || 10;
    const answered = progress.answered || Object.keys(userAnswers).length;
    const score = Number(format1Dec((answered / (total || 1)) * (assignment.max_score || 10)));

    setFinalScore(score);
    setIsSubmitted(true);
    setSubmissionCount((prev) => prev + 1);
    showToast(`Đã nộp bài thành công! Điểm: ${score}/10.0 (Đã làm ${answered}/${total} câu)`, 'success');
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
              {isReviewMode ? (
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Bài Làm Học Sinh: {studentName}
                </span>
              ) : isPreview ? (
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Xem Trước Phiếu Bài Tập (A4)
                </span>
              ) : (
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Phòng Thi Trực Tuyến
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
          {/* Answer Key Editor (Teacher Mode) */}
          {isPreview && !isReviewMode && onEditAnswerKey && (
            <button
              type="button"
              onClick={() => onEditAnswerKey(assignment)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border-indigo-500/30 active:scale-95"
              title="Chỉnh sửa bảng đáp án & tự động chấm lại điểm cho toàn bộ học sinh"
            >
              <KeyRound size={14} className="text-indigo-400" />
              <span>Sửa Đáp Án Đề Thi</span>
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
            title="Bật/Tắt bút chấm vẽ trực tiếp lên bài làm"
          >
            <PenTool size={14} />
            <span>Bút Chấm Bài</span>
          </button>

          {/* Fullscreen Expansion Toggle Button */}
          <button
            type="button"
            onClick={toggleBrowserFullscreen}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold border border-white/10 transition cursor-pointer active:scale-95"
            title="Mở rộng toàn màn hình F11"
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

          {!isReviewMode && (
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#6c48f7] text-white text-xs font-black shadow-[0_0_15px_rgba(92,54,245,0.4)] transition cursor-pointer active:scale-95"
            >
              <Save size={14} />
              <span>{isSubmitted ? 'Cập Nhật & Nộp Lại' : 'Nộp Bài'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. DUAL-PANE LAYOUT: SIDEBAR ON LEFT TIGHTLY ADJACENT TO EXAM SHEET */}
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-start justify-center gap-4 w-full">
        {/* Left Question Navigation Sidebar (Sticky & Tight) */}
        <div className="w-full lg:w-72 lg:sticky lg:top-20 shrink-0 space-y-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xl text-slate-900 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Tiến Độ Làm Bài
              </h4>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {progress.answered}/{progress.total || 10} ({pct}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden p-0.5 border border-slate-200">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300 shadow-xs"
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Question Quick-Jump Grid */}
            <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-3 scrollbar-thin">
              {progress.sections.map((sec) => (
                <div key={sec.id} className="space-y-1.5">
                  <div className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                    <ChevronRight size={12} className="shrink-0 mt-0.5 text-indigo-500" />
                    <span className="truncate">{sec.title}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {sec.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(item.id);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer border ${
                          item.isAnswered
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-100 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 border-slate-200'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right A4 Paper Test View (Expands to Wide Format in Fullscreen) */}
        <div className={`flex-1 ${isFullscreen ? 'max-w-[1020px]' : 'max-w-[850px]'} w-full space-y-4 transition-all duration-200`}>
          <div className="white-paper-container relative w-full bg-white text-slate-900 rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-slate-300 p-6 sm:p-12 min-h-[1100px] flex flex-col justify-between font-sans">
            {/* Drawing Correction Layer (Fixed Full Canvas) */}
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

              {/* ULN Document Rendering with In-Place Multi-Session Checkpoint Separators and Answer Key Comparisons */}
              {ulnNodes.length > 0 ? (
                <UlnDocumentRenderer
                  nodes={ulnNodes}
                  initialAnswers={userAnswers}
                  answerKeys={answerKeys}
                  dailyLogs={dailyLogs}
                  isSubmitted={isSubmitted}
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

            {/* Test Footer */}
            <div className="border-t-2 border-slate-800 pt-5 text-center text-xs text-slate-500 font-semibold">
              <p>--- HẾT BÀI KIỂM TRA ---</p>
            </div>
          </div>
        </div>
      </div>

      {/* Anti-cheat Tab Switch Warning Modal (Student Mode Only) */}
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
