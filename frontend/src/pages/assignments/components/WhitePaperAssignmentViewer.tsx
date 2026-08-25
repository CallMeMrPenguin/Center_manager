import React, { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Award, Printer, Save, Maximize2, Minimize2, CheckCircle2, ChevronRight, PenTool } from 'lucide-react';
import { Assignment } from '../types';
import { ExerciseItem } from './types';
import { WhitePaperHeader } from './WhitePaperHeader';
import { ExerciseItemView } from './ExerciseItemView';
import { UlnDocumentRenderer, SectionProgressGroup } from './UlnDocumentRenderer';
import { DrawingCorrectionCanvas } from './DrawingCorrectionCanvas';
import { parseUlnContent } from '../utils/ulnParser';
import { SAMPLE_UNIT12_ULN_TEXT } from '../constants/sampleUlnTest';
import { cleanOptionPrefix, format1Dec } from '../../../utils';
import { showToast } from '../../../components/Toast';

interface WhitePaperAssignmentViewerProps {
  assignment: Assignment;
  studentName?: string;
  isPreview?: boolean;
  onBack: () => void;
  onSubmitSuccess?: (score: number) => void;
}

export const WhitePaperAssignmentViewer: React.FC<WhitePaperAssignmentViewerProps> = ({
  assignment,
  studentName = 'Học Sinh',
  isPreview = true,
  onBack,
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
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-[#06070a] overflow-y-auto p-3 sm:p-6' : ''} space-y-4 pb-12 select-none font-sans`}>
      {/* 1. TOP FLOATING NAVIGATION BAR */}
      <div className="bg-[#0c0f1e] border border-[#1e2742] rounded-2xl p-3.5 shadow-xl flex flex-wrap items-center justify-between gap-3 sticky top-2 z-40">
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
              <h3 className="text-sm font-black text-white">{assignment.title}</h3>
              {isPreview && (
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Xem Trước Phiếu Bài Tập (Nền Trắng A4)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Học sinh: <strong className="text-slate-200">{studentName}</strong> | Trạng thái: <strong className="text-indigo-300">{isSubmitted ? `Đã nộp (${submissionCount} lần)` : 'Đang làm bài'}</strong>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Chế độ Chữa bài (Bút vẽ / Chấm điểm) */}
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

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold border border-white/10 transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold border border-white/10 transition cursor-pointer"
          >
            <Printer size={14} />
            <span>In Đề / PDF</span>
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

      {/* 2. MAIN LAYOUT WITH INSTRUCTION-GROUPED PROGRESS SIDEBAR */}
      <div className="flex gap-5 max-w-7xl mx-auto items-start">
        {/* Progress Sidebar */}
        {progress.total > 0 && (
          <div className="w-72 shrink-0 bg-[#0c0f1e] border border-[#212c4b] rounded-2xl p-4 sticky top-20 shadow-xl space-y-3.5 hidden md:block">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Tiến Độ Làm Bài</span>
              </div>
              <span className="text-xs font-black text-indigo-400">{progress.answered}/{progress.total} ({pct}%)</span>
            </div>

            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>

            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
              {progress.sections.map((sec, sIdx) => (
                <div key={sIdx} className="space-y-1.5 pt-2.5 first:pt-0 border-t border-white/10 first:border-none">
                  {/* Clickable Instruction Title */}
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(sec.id);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="text-left w-full text-[11px] font-black text-indigo-300 hover:text-indigo-200 transition cursor-pointer leading-tight flex items-start gap-1"
                  >
                    <ChevronRight size={12} className="shrink-0 mt-0.5 text-indigo-400" />
                    <span className="line-clamp-2">{sec.title}</span>
                  </button>

                  {/* Question Pills Matrix */}
                  <div className="flex flex-wrap gap-1 pl-3.5">
                    {sec.items.map((item, itIdx) => (
                      <button
                        key={itIdx}
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(item.id);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className={`w-6 h-6 rounded text-[11px] font-bold transition flex items-center justify-center cursor-pointer ${
                          item.isAnswered
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'bg-white/5 hover:bg-white/15 text-slate-300 border border-white/10'
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
        )}

        {/* 3. PURE WHITE PAPER WORKSHEET CANVAS (A4 PAPER SHEET STANDARD) */}
        <div
          style={{ colorScheme: 'light' }}
          className="relative white-paper-container flex-1 bg-white text-slate-950 shadow-2xl rounded-2xl p-6 sm:p-10 border border-slate-200 space-y-5 print:p-0 print:border-none print:shadow-none"
        >
          {/* Drawing Correction Layer Overlay */}
          <DrawingCorrectionCanvas isActive={isCorrectionMode} />

          <WhitePaperHeader
            assignment={assignment}
            studentName={studentName}
            isSubmitted={isSubmitted}
            finalScore={String(finalScore)}
            correctCount={progress.answered}
            total={progress.total}
          />

          {/* Sequential Questions */}
          {ulnNodes.length > 0 ? (
            <UlnDocumentRenderer
              nodes={ulnNodes}
              isSubmitted={false}
              onProgressUpdate={(ans, tot, sec) => setProgress({ answered: ans, total: tot, sections: sec })}
            />
          ) : (
            <div className="space-y-6">
              {fallbackExercises.map((ex) => (
                <ExerciseItemView
                  key={ex.id}
                  exercise={ex}
                  userAnswer={userAnswers[ex.id]}
                  isSubmitted={false}
                  onSelectOption={handleSelectOption}
                  renderFormattedText={(t) => t}
                />
              ))}
            </div>
          )}

          <div className="border-t-2 border-slate-800 pt-5 text-center text-xs text-slate-500 font-semibold print:block">
            --- HẾT PHIẾU BÀI TẬP ---
          </div>
        </div>
      </div>
    </div>
  );
};
