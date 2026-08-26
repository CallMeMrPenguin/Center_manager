import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, Flag, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight,
  Maximize2, Minimize2
} from 'lucide-react';
import { Question, TimerMode } from '../types';
import { showToast } from '../../../components/Toast';
import { cleanOptionPrefix } from '../../../utils';
import { DrawingCanvas } from './DrawingCanvas';
import { QuizSidebar } from './QuizSidebar';
import { QuizPopoutTimer } from './QuizPopoutTimer';
import { QuizQuestionContent } from './QuizQuestionContent';

interface QuizRunningViewProps {
  activeQuestions: Question[];
  currentIndex: number;
  setCurrentIndex: (idx: number | ((prev: number) => number)) => void;
  userAnswers: Record<number, string>;
  setUserAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  bookmarkedQuestions: Record<number, boolean>;
  toggleBookmark: (id: number) => void;
  timerMode: TimerMode;
  timerRemaining: number;
  setTimerRemaining: (s: number | ((prev: number) => number)) => void;
  globalTimeSeconds: number;
  questionTimer: number;
  setQuestionTimer: (s: number | ((prev: number) => number)) => void;
  perQuestionSeconds: number;
  formattedTimerRemaining: string;
  isTimerPaused: boolean;
  setIsTimerPaused: React.Dispatch<React.SetStateAction<boolean>>;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onFinishTest: () => void;
  onExitToImport?: () => void;
  renderFormattedText: (text: string) => React.ReactNode;
}

export const QuizRunningView: React.FC<QuizRunningViewProps> = ({
  activeQuestions,
  currentIndex,
  setCurrentIndex,
  userAnswers,
  setUserAnswers,
  bookmarkedQuestions,
  toggleBookmark,
  timerMode,
  timerRemaining,
  setTimerRemaining,
  globalTimeSeconds,
  questionTimer,
  setQuestionTimer,
  perQuestionSeconds,
  formattedTimerRemaining,
  isTimerPaused,
  setIsTimerPaused,
  isFullscreen,
  onToggleFullscreen,
  onFinishTest,
  onExitToImport,
  renderFormattedText,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isFullscreen);
  const [eliminatedOptions, setEliminatedOptions] = useState<Record<number, string[]>>({});
  const [drawings, setDrawings] = useState<Record<number, string>>({});

  const handleSaveDrawing = useCallback((id: number, url: string) => {
    setDrawings(p => ({ ...p, [id]: url }));
  }, []);

  const handleClearDrawing = useCallback((id: number) => {
    setDrawings(p => {
      const c = { ...p };
      delete c[id];
      return c;
    });
  }, []);

  // Popout Draggable Timer State
  const [showPopoutTimer, setShowPopoutTimer] = useState<boolean>(true);
  const [timerPos, setTimerPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (isFullscreen) setIsSidebarCollapsed(true);
  }, [isFullscreen]);

  // Keyboard Arrow Left & Right question navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex(p => Math.max(0, (typeof p === 'number' ? p : currentIndex) - 1));
        if (timerMode === 'per_question') setQuestionTimer(perQuestionSeconds);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex(p => Math.min(activeQuestions.length - 1, (typeof p === 'number' ? p : currentIndex) + 1));
        if (timerMode === 'per_question') setQuestionTimer(perQuestionSeconds);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, activeQuestions.length, timerMode, perQuestionSeconds, setCurrentIndex, setQuestionTimer]);

  const handleResetTimer = () => {
    if (timerMode === 'global') {
      setTimerRemaining(globalTimeSeconds);
      setIsTimerPaused(false);
      showToast("Đã đặt lại thời gian làm bài!", "success");
    } else if (timerMode === 'per_question') {
      setQuestionTimer(perQuestionSeconds);
      setIsTimerPaused(false);
      showToast("Đã đặt lại thời gian câu hỏi!", "success");
    }
  };

  const q = activeQuestions[currentIndex];
  const totalQuestions = activeQuestions.length;
  const isBookmarked = q ? !!bookmarkedQuestions[q.id] : false;
  const currentEliminated = q ? eliminatedOptions[q.id] || [] : [];
  const progressPct = totalQuestions > 0 ? Math.round((Object.keys(userAnswers).length / totalQuestions) * 100) : 0;

  const handleEliminateOne = () => {
    if (!q || q.type !== 'mcq' || !q.options || q.options.length <= 1) return;
    const cleanOpts = q.options.map(o => cleanOptionPrefix(o));
    const correctClean = cleanOptionPrefix(q.answer);
    const wrongOptions = cleanOpts.filter(o => o !== correctClean && !currentEliminated.includes(o));
    if (wrongOptions.length === 0) { showToast("Không còn phương án sai để loại!", "warning"); return; }
    const randomPick = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    setEliminatedOptions(prev => ({ ...prev, [q.id]: [...(prev[q.id] || []), randomPick] }));
    showToast("Đã loại trừ 1 phương án sai!", "success");
  };

  const handleFiftyFifty = () => {
    if (!q || q.type !== 'mcq' || !q.options || q.options.length <= 1) return;
    const cleanOpts = q.options.map(o => cleanOptionPrefix(o));
    const correctClean = cleanOptionPrefix(q.answer);
    const wrongOptions = cleanOpts.filter(o => o !== correctClean && !currentEliminated.includes(o));
    if (wrongOptions.length === 0) { showToast("Không còn phương án sai để loại!", "warning"); return; }
    const toRemoveCount = Math.min(wrongOptions.length, Math.max(1, Math.floor(cleanOpts.length / 2)));
    const shuffled = [...wrongOptions].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, toRemoveCount);
    setEliminatedOptions(prev => ({ ...prev, [q.id]: [...(prev[q.id] || []), ...picked] }));
    showToast(`Đã loại trừ ${picked.length} phương án sai!`, "success");
  };

  const handleResetLifelines = () => {
    if (!q) return;
    setEliminatedOptions(prev => {
      const copy = { ...prev };
      delete copy[q.id];
      return copy;
    });
    showToast("Đã khôi phục các lựa chọn!", "success");
  };

  if (!q) return null;

  return (
    <div className="flex-1 flex gap-6 overflow-hidden min-h-0 relative">
      {/* LEFT QUESTION GRID SIDEBAR */}
      <QuizSidebar
        activeQuestions={activeQuestions}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
        userAnswers={userAnswers}
        bookmarkedQuestions={bookmarkedQuestions}
        isSidebarCollapsed={isSidebarCollapsed}
        timerMode={timerMode}
        perQuestionSeconds={perQuestionSeconds}
        setQuestionTimer={setQuestionTimer}
        onFinishTest={onFinishTest}
      />

      {/* MAIN QUESTION DISPLAY AREA WITH INTERACTIVE DRAWING CANVAS */}
      <div className="flex-1 flex flex-col bg-[#0c0f1e] border border-[#1d2744] rounded-2xl p-6 sm:p-8 shadow-2xl overflow-y-auto justify-between relative">
        <DrawingCanvas
          questionId={q.id}
          drawings={drawings}
          onSaveDrawing={handleSaveDrawing}
          onClearDrawing={handleClearDrawing}
        />

        {/* FLOATING DRAGGABLE TIMER DOCK - Positioned at fixed top-20 left-8 */}
        {showPopoutTimer && (
          <QuizPopoutTimer
            timerMode={timerMode}
            timerPos={timerPos}
            setTimerPos={setTimerPos}
            formattedTimerRemaining={formattedTimerRemaining}
            timerRemaining={timerRemaining}
            globalTimeSeconds={globalTimeSeconds}
            questionTimer={questionTimer}
            perQuestionSeconds={perQuestionSeconds}
            isTimerPaused={isTimerPaused}
            onClose={() => setShowPopoutTimer(false)}
            onTogglePause={() => setIsTimerPaused(!isTimerPaused)}
            onReset={handleResetTimer}
          />
        )}

        <div className="space-y-5 relative z-10">
          {/* TOP ACTION BAR */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-xl">
                <span className="text-xs text-indigo-300 font-extrabold">{progressPct}% Hoàn thành</span>
                <div className="w-20 h-2 bg-[#161a29] rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT CONTROLS */}
            <div className="flex items-center gap-2">
              {onExitToImport && (
                <button
                  onClick={() => {
                    if (window.confirm("Bạn có chắc chắn muốn rời bài làm hiện tại để chọn đề khác?")) {
                      onExitToImport();
                    }
                  }}
                  className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition cursor-pointer"
                  title="Quay lại để chọn đề khác"
                >
                  Đổi đề
                </button>
              )}

              <button
                onClick={() => setShowPopoutTimer(!showPopoutTimer)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  showPopoutTimer
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-400 shadow-sm'
                    : 'bg-[#121626] text-slate-400 border-[#263152] hover:text-white'
                }`}
                title="Bật / Ẩn đồng hồ nổi"
              >
                <Clock
                  size={13}
                  className={
                    timerMode === 'none'
                      ? 'text-emerald-400'
                      : timerMode === 'global'
                      ? 'text-indigo-400'
                      : 'text-amber-400'
                  }
                />
                <span>{timerMode === 'per_question' ? `${questionTimer}s` : formattedTimerRemaining}</span>
              </button>

              <button
                onClick={() => toggleBookmark(q.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  isBookmarked ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
                title="Đánh dấu câu hỏi để xem lại"
              >
                <Flag size={13} className={isBookmarked ? "fill-rose-500 text-rose-500" : ""} />
                <span>{isBookmarked ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
              </button>

              <button
                onClick={onToggleFullscreen}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-black transition cursor-pointer ${
                  isFullscreen ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-[#121626] text-slate-300 hover:text-white border-[#263152]'
                }`}
                title={isFullscreen ? "Thoát toàn màn hình (Esc)" : "Toàn màn hình"}
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                <span className="hidden sm:inline">{isFullscreen ? 'Thoát' : 'Toàn Màn Hình'}</span>
              </button>

              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1.5 rounded-xl bg-[#121626] hover:bg-[#1e2640] text-slate-300 hover:text-white border border-[#263152] transition cursor-pointer"
                title={isSidebarCollapsed ? "Mở rộng danh sách câu hỏi" : "Thu gọn danh sách"}
              >
                {isSidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
              </button>
            </div>
          </div>

          {/* MAIN QUESTION BODY */}
          <QuizQuestionContent
            question={q}
            currentIndex={currentIndex}
            userAnswer={userAnswers[q.id] || ''}
            eliminatedOptions={currentEliminated}
            onAnswerSelect={(id, ans) => setUserAnswers(p => ({ ...p, [id]: ans }))}
            onEliminateOne={handleEliminateOne}
            onFiftyFifty={handleFiftyFifty}
            onResetLifelines={handleResetLifelines}
            renderFormattedText={renderFormattedText}
          />
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-6 relative z-10">
          <button
            disabled={currentIndex === 0}
            onClick={() => {
              setCurrentIndex(p => Math.max(0, (typeof p === 'number' ? p : currentIndex) - 1));
              if (timerMode === 'per_question') setQuestionTimer(perQuestionSeconds);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold disabled:opacity-30 cursor-pointer border border-white/5"
          >
            <ArrowLeft size={14} />
            <span>Câu trước</span>
          </button>

          <div className="text-xs font-black text-slate-400 font-mono">
            {currentIndex + 1} / {totalQuestions}
          </div>

          {currentIndex < activeQuestions.length - 1 ? (
            <button
              onClick={() => {
                setCurrentIndex(p => Math.min(activeQuestions.length - 1, (typeof p === 'number' ? p : currentIndex) + 1));
                if (timerMode === 'per_question') setQuestionTimer(perQuestionSeconds);
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] text-white text-xs font-extrabold shadow-[0_4px_16px_rgba(92,54,245,0.4)] transition cursor-pointer border border-white/20 active:scale-95"
            >
              <span>Câu tiếp</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={onFinishTest}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-[0_4px_16px_rgba(16,185,129,0.4)] transition cursor-pointer border border-white/20 active:scale-95"
            >
              <span>Nộp Bài</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
