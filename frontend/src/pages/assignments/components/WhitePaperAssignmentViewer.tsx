import React, { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Award, Save, Maximize2, Minimize2, ChevronRight, PenTool, KeyRound } from 'lucide-react';
import { Assignment } from '../types';
import { ExerciseItem } from './types';
import { WhitePaperHeader } from './WhitePaperHeader';
import { ExerciseItemView } from './ExerciseItemView';
import { UlnDocumentRenderer, SectionProgressGroup } from './UlnDocumentRenderer';
import { DrawingCorrectionCanvas } from './DrawingCorrectionCanvas';
import { parseUlnContent } from '../utils/ulnParser';
import { SAMPLE_UNIT12_ULN_TEXT } from '../constants/sampleUlnTest';
import { format1Dec } from '../../../utils';
import { showToast } from '../../../components/Toast';

interface WhitePaperAssignmentViewerProps {
  assignment: Assignment;
  studentName?: string;
  isPreview?: boolean;
  onBack: () => void;
  onEditAnswerKey?: (assignment: Assignment) => void;
  onSubmitSuccess?: (score: number) => void;
}

export const WhitePaperAssignmentViewer: React.FC<WhitePaperAssignmentViewerProps> = ({
  assignment,
  studentName = 'Học Sinh',
  isPreview = true,
  onBack,
  onEditAnswerKey,
  onSubmitSuccess,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCorrectionMode, setIsCorrectionMode] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [progress, setProgress] = useState<{ answered: number; total: number; sections: SectionProgressGroup[] }>({
    answered: 0,
    total: 0,
    sections: [],
  });

  // Parse ULN document nodes
  const ulnNodes = useMemo(() => {
    const raw = assignment.content_json && assignment.content_json.trim()
      ? assignment.content_json
      : SAMPLE_UNIT12_ULN_TEXT;
    return parseUlnContent(raw);
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
    setUserAnswers((prev) => ({ ...prev, [exId]: opt }));
  }, []);

  const handleSubmit = () => {
    const total = progress.total || fallbackExercises.length || 10;
    const answered = progress.answered || Object.keys(userAnswers).length;
    const score = Number(format1Dec((answered / (total || 1)) * (assignment.max_score || 10)));

    setFinalScore(score);
    setIsSubmitted(true);
    setSubmissionCount((prev) => prev + 1);
    showToast(`Đã nộp bài thành công! Điểm: ${score}/10.0 (Đã hoàn thành ${answered}/${total} câu)`, 'success');
    if (onSubmitSuccess) onSubmitSuccess(score);
  };

  const pct = progress.total > 0 ? Math.round((progress.answered / progress.total) * 100) : 0;

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      className={`${
        isFullscreen
          ? 'fixed inset-0 z-[100] bg-[#08090e] overflow-y-auto p-3 sm:p-6 flex flex-col'
          : 'relative'
      } space-y-4 pb-12 select-none font-sans`}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* 1. STICKY TOP TITLE BAR (Permanently Fixed at Top on Scroll) */}
      <div className="bg-[#0c0f1e]/95 border border-[#1e2742] rounded-2xl p-3.5 shadow-2xl flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40">
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
              <h3 className="text-sm font-black text-white truncate max-w-[280px] sm:max-w-md">
                {assignment.title}
              </h3>
              {isPreview && (
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Xem Trước Phiếu Bài Tập (Nền Trắng A4)
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
          {isPreview && onEditAnswerKey && (
            <button
              type="button"
              onClick={() => onEditAnswerKey(assignment)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.3)] active:scale-95"
              title="Chỉnh sửa đáp án chuẩn & tự động tính lại điểm"
            >
              <KeyRound size={14} />
              <span>Sửa Đáp Án (Key)</span>
            </button>
          )}

          {/* Correction Mode Canvas (Teacher Preview Only) */}
          {isPreview && (
            <button
              type="button"
              onClick={() => setIsCorrectionMode(!isCorrectionMode)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                isCorrectionMode
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                  : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
              }`}
            >
              <PenTool size={14} />
              <span>{isCorrectionMode ? 'Đang Chữa Bài (Bút Vẽ)' : 'Chế Độ Chữa Bài'}</span>
            </button>
          )}

          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold border border-white/10 transition cursor-pointer active:scale-95"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
          </button>

          {isSubmitted && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-black">
              <Award size={15} />
              <span>Điểm: {finalScore}/10.0 ({progress.answered}/{progress.total} câu)</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#6c48f7] text-white text-xs font-black shadow-[0_0_15px_rgba(92,54,245,0.4)] transition cursor-pointer active:scale-95"
          >
            <Save size={14} />
            <span>{isSubmitted ? 'Cập Nhật & Nộp Lại' : 'Nộp Bài'}</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN LAYOUT WITH LIGHT-THEME QUESTION PROGRESS SIDEBAR & WHITE PAPER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left A4 Paper Test View */}
        <div className="lg:col-span-9 flex justify-center">
          <div className="relative w-full max-w-[850px] bg-white text-slate-900 rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-slate-300 p-8 sm:p-14 min-h-[1100px] flex flex-col justify-between font-sans">
            {/* Drawing Correction Layer (Fixed Full Canvas) */}
            <DrawingCorrectionCanvas isActive={isCorrectionMode} />

            <div className="space-y-6">
              <WhitePaperHeader
                assignment={assignment}
                studentName={studentName}
                isSubmitted={isSubmitted}
                finalScore={String(finalScore)}
                correctCount={progress.answered}
                total={progress.total || 10}
              />

              {/* ULN Document Rendering */}
              {ulnNodes.length > 0 ? (
                <UlnDocumentRenderer
                  nodes={ulnNodes}
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
                      userAnswer={userAnswers[item.id]}
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

        {/* Right Question Navigation Sidebar (Light Clean Paper Theme) */}
        <div className="lg:col-span-3 lg:sticky lg:top-24 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xl text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
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
            <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-3 scrollbar-thin">
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
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer border ${
                          item.isAnswered
                            ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-500'
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
      </div>
    </div>
  );
};
