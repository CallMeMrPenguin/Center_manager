import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, Flag, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight,
  Maximize2, Minimize2, RotateCcw, Play, Pause, X, Move
} from 'lucide-react';
import { Question, TimerMode } from '../types';
import { showToast } from '../../../components/Toast';
import { cleanOptionPrefix } from '../../../utils';
import { DrawingCanvas } from './DrawingCanvas';

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
  renderFormattedText,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isFullscreen);
  const [eliminatedOptions, setEliminatedOptions] = useState<Record<number, string[]>>({});
  const [drawings, setDrawings] = useState<Record<number, string>>({});

  // Popout Draggable Timer State
  const [showPopoutTimer, setShowPopoutTimer] = useState<boolean>(true);
  const [timerPos, setTimerPos] = useState({ x: Math.max(20, window.innerWidth - 280), y: 90 });
  const isDraggingTimerRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Auto collapse sidebar when entering fullscreen
  useEffect(() => {
    if (isFullscreen) {
      setIsSidebarCollapsed(true);
    }
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

  // Draggable popout window listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingTimerRef.current) {
        const newX = Math.max(10, Math.min(window.innerWidth - 240, e.clientX - dragOffsetRef.current.x));
        const newY = Math.max(10, Math.min(window.innerHeight - 140, e.clientY - dragOffsetRef.current.y));
        setTimerPos({ x: newX, y: newY });
      }
    };
    const handleMouseUp = () => {
      isDraggingTimerRef.current = false;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleTimerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingTimerRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - timerPos.x,
      y: e.clientY - timerPos.y,
    };
  };

  const handleResetTimer = () => {
    if (timerMode === 'global') {
      setTimerRemaining(globalTimeSeconds);
      showToast("Đã đặt lại thời gian làm bài!", "success");
    } else if (timerMode === 'per_question') {
      setQuestionTimer(perQuestionSeconds);
      showToast("Đã đặt lại thời gian câu hỏi!", "success");
    }
  };

  const totalQuestions = activeQuestions.length;
  const q = activeQuestions[currentIndex];
  const isBookmarked = q ? !!bookmarkedQuestions[q.id] : false;
  const rawAns = q ? (userAnswers[q.id] || '') : '';
  const currentAns = cleanOptionPrefix(rawAns);
  const currentEliminated = q ? (eliminatedOptions[q.id] || []) : [];

  const answeredCount = Object.keys(userAnswers).filter(k => (userAnswers[Number(k)] || '').trim() !== '').length;
  const progressPct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // Lifeline: 25/75 (Eliminate 1 Random Wrong Option)
  const handleEliminateOne = () => {
    if (!q || q.type !== 'mcq' || !q.options || q.options.length <= 1) {
      showToast("Trợ giúp chỉ áp dụng cho câu hỏi trắc nghiệm!", "warning");
      return;
    }

    const cleanOpts = q.options.map(o => cleanOptionPrefix(o));
    const cleanCorrect = cleanOptionPrefix((q.answer || '').trim());

    const wrongCandidates = cleanOpts.filter(o => 
      o.toLowerCase() !== cleanCorrect.toLowerCase() && !currentEliminated.includes(o)
    );

    if (wrongCandidates.length === 0) {
      showToast("Không còn phương án sai nào để loại trừ!", "warning");
      return;
    }

    const randomPick = wrongCandidates[Math.floor(Math.random() * wrongCandidates.length)];
    const updated = [...currentEliminated, randomPick];
    setEliminatedOptions(prev => ({ ...prev, [q.id]: updated }));
    showToast(`Đã loại trừ 1 phương án sai (25/75)`, "success");
  };

  // Lifeline: 50/50 Help (Eliminates half of the wrong options)
  const handleFiftyFifty = () => {
    if (!q || q.type !== 'mcq' || !q.options || q.options.length <= 2) {
      showToast("Trợ giúp 50/50 yêu cầu ít nhất 3 phương án!", "warning");
      return;
    }

    const cleanOpts = q.options.map(o => cleanOptionPrefix(o));
    const cleanCorrect = cleanOptionPrefix((q.answer || '').trim());

    const allWrong = cleanOpts.filter(o => o.toLowerCase() !== cleanCorrect.toLowerCase());
    const countToEliminate = Math.max(1, Math.floor(cleanOpts.length / 2));

    const shuffledWrong = [...allWrong].sort(() => Math.random() - 0.5);
    const chosenToEliminate = shuffledWrong.slice(0, countToEliminate);

    setEliminatedOptions(prev => ({ ...prev, [q.id]: chosenToEliminate }));
    showToast(`Đã kích hoạt trợ giúp 50/50!`, "success");
  };

  const handleResetLifelines = () => {
    if (!q) return;
    setEliminatedOptions(prev => {
      const copy = { ...prev };
      delete copy[q.id];
      return copy;
    });
    showToast("Đã khôi phục lại các lựa chọn!", "success");
  };

  const handleAnswerSelect = (questionId: number, answerVal: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answerVal }));
  };

  const handleSaveDrawing = (questionId: number, dataUrl: string) => {
    setDrawings(prev => ({ ...prev, [questionId]: dataUrl }));
  };

  const handleClearDrawing = (questionId: number) => {
    setDrawings(prev => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  if (!q) return null;

  return (
    <div className="flex-1 flex gap-6 overflow-hidden min-h-0 relative">
      {/* LEFT QUESTION GRID SIDEBAR */}
      <div
        className={`transition-all duration-300 flex flex-col bg-[#0c0f1e] border border-[#1d2744] rounded-2xl p-4 shadow-xl shrink-0 ${
          isSidebarCollapsed ? 'w-0 p-0 border-0 opacity-0 overflow-hidden pointer-events-none' : 'w-72'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="text-xs font-black uppercase text-white tracking-wider">Danh Sách Câu Hỏi</div>
          <span className="text-[11px] font-extrabold text-indigo-400 font-mono">
            {answeredCount}/{totalQuestions} đã làm
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2 py-3 overflow-y-auto flex-1 content-start pr-1">
          {activeQuestions.map((item, idx) => {
            const isDone = !!userAnswers[item.id];
            const isCurr = idx === currentIndex;
            const isMarked = !!bookmarkedQuestions[item.id];

            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  if (timerMode === 'per_question') setQuestionTimer(perQuestionSeconds);
                }}
                className={`h-9 rounded-xl font-black text-xs transition cursor-pointer relative flex items-center justify-center border ${
                  isCurr
                    ? 'bg-[#5c36f5] text-white border-indigo-400 shadow-[0_0_12px_rgba(92,54,245,0.6)] scale-105 z-10'
                    : isDone
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-[#141829] text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
                }`}
              >
                <span>{idx + 1}</span>
                {isMarked && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-[#0c0f1e]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-white/10 shrink-0">
          <button
            onClick={onFinishTest}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition cursor-pointer shadow-[0_4px_14px_rgba(16,185,129,0.4)] border border-white/20 active:scale-95"
          >
            Nộp Bài Sớm
          </button>
        </div>
      </div>

      {/* MAIN QUESTION DISPLAY AREA WITH INTERACTIVE DRAWING CANVAS */}
      <div className="flex-1 flex flex-col bg-[#0c0f1e] border border-[#1d2744] rounded-2xl p-6 sm:p-8 shadow-2xl overflow-y-auto justify-between relative">
        
        {/* DRAWING / ANNOTATION CANVAS LAYER OVER QUESTION */}
        <DrawingCanvas
          questionId={q.id}
          drawings={drawings}
          onSaveDrawing={handleSaveDrawing}
          onClearDrawing={handleClearDrawing}
        />

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
              {timerMode !== 'none' && (
                <button
                  onClick={() => setShowPopoutTimer(!showPopoutTimer)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    showPopoutTimer
                      ? 'bg-indigo-600/30 text-indigo-300 border-indigo-400 shadow-sm'
                      : 'bg-[#121626] text-slate-400 border-[#263152] hover:text-white'
                  }`}
                  title="Bật / Ẩn cửa sổ đồng hồ nổi"
                >
                  <Clock size={13} className={timerMode === 'global' ? 'text-indigo-400' : 'text-amber-400'} />
                  <span>{timerMode === 'global' ? formattedTimerRemaining : `${questionTimer}s`}</span>
                </button>
              )}

              <button
                onClick={() => toggleBookmark(q.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  isBookmarked
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
                title="Đánh dấu câu hỏi để xem lại"
              >
                <Flag size={13} className={isBookmarked ? "fill-rose-500 text-rose-500" : ""} />
                <span>{isBookmarked ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
              </button>

              <button
                onClick={onToggleFullscreen}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-black transition cursor-pointer ${
                  isFullscreen
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                    : 'bg-[#121626] text-slate-300 hover:text-white border-[#263152]'
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

          {/* INSTRUCTION */}
          {q.instruction && (
            <div className="text-sm sm:text-base font-bold text-indigo-300 leading-relaxed bg-indigo-500/10 border border-indigo-500/20 p-3 sm:p-4 rounded-xl shadow-sm">
              {q.instruction}
            </div>
          )}

          {/* QUESTION STEM */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight tracking-tight flex flex-wrap items-baseline gap-2 sm:gap-3">
            <span className="text-[#5c36f5] sm:text-indigo-400 font-black">
              Q{currentIndex + 1}.
            </span>
            <span>{renderFormattedText(q.question)}</span>
          </h2>

          {/* LIFELINE BUTTONS: 25/75 & 50/50 */}
          {q.type === 'mcq' && q.options && q.options.length > 1 && (
            <div className="flex items-center gap-2 pt-1 pb-1">
              <button
                onClick={handleEliminateOne}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-500/30 text-xs font-black transition cursor-pointer active:scale-95 shadow-sm"
                title="Bỏ 1 phương án sai (25/75)"
              >
                25/75
              </button>

              <button
                onClick={handleFiftyFifty}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-purple-300 border border-purple-500/30 text-xs font-black transition cursor-pointer active:scale-95 shadow-sm"
                title="Loại 50% phương án sai"
              >
                50/50
              </button>

              {currentEliminated.length > 0 && (
                <button
                  onClick={handleResetLifelines}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-xs font-bold transition cursor-pointer"
                  title="Khôi phục lại các lựa chọn đã loại"
                >
                  Khôi phục
                </button>
              )}
            </div>
          )}

          {/* MCQ OPTIONS */}
          {q.type === 'mcq' && q.options && (
            <div className="grid grid-cols-1 gap-2.5 sm:gap-3 pt-1">
              {q.options.map((opt, oIdx) => {
                const cleanOpt = cleanOptionPrefix(opt);
                const isEliminated = currentEliminated.includes(cleanOpt);
                const isSelected = !isEliminated && (currentAns === cleanOpt || rawAns === opt || rawAns === cleanOpt);

                return (
                  <button
                    key={oIdx}
                    disabled={isEliminated}
                    onClick={() => handleAnswerSelect(q.id, cleanOpt)}
                    className={`px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-2.5 rounded-2xl border text-left font-black transition-all duration-200 cursor-pointer flex items-center gap-3.5 sm:gap-5 ${
                      isEliminated
                        ? 'opacity-25 pointer-events-none line-through border-dashed border-red-500/40 bg-red-950/20 text-slate-500 cursor-not-allowed'
                        : isSelected
                        ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-[0_0_30px_rgba(92,54,245,0.5)] ring-2 ring-indigo-400'
                        : 'bg-[#121626] border-white/10 text-slate-100 hover:bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <span
                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-base sm:text-lg md:text-xl font-black shrink-0 transition ${
                        isEliminated
                          ? 'bg-red-500/20 text-red-400'
                          : isSelected
                          ? 'bg-[#5c36f5] text-white shadow-lg'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="leading-tight flex-1 text-lg sm:text-xl md:text-2xl font-black">
                      {renderFormattedText(cleanOpt)}
                    </span>
                    {isEliminated && (
                      <span className="text-[11px] font-black text-red-400/90 bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20">
                        [Đã loại trừ]
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* FILL IN THE BLANK */}
          {q.type === 'fill' && (
            <div className="pt-2">
              <input
                type="text"
                value={rawAns}
                onChange={(e) => handleAnswerSelect(q.id, e.target.value)}
                placeholder="Nhập câu trả lời của bạn..."
                className="w-full bg-[#161a29] border border-white/20 text-white text-xl sm:text-2xl md:text-3xl font-bold rounded-2xl px-5 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-inner"
              />
            </div>
          )}
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
            <span>Câu trước (←)</span>
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
              <span>Câu tiếp (→)</span>
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

      {/* DRAGGABLE POPOUT TIMER WINDOW */}
      {timerMode !== 'none' && showPopoutTimer && (
        <div
          style={{ left: `${timerPos.x}px`, top: `${timerPos.y}px` }}
          className="fixed z-50 bg-[#0c0f1e] border border-[#263152] rounded-2xl shadow-2xl p-3 w-56 select-none"
        >
          {/* Draggable Titlebar */}
          <div
            onMouseDown={handleTimerMouseDown}
            className="flex items-center justify-between cursor-move pb-2 border-b border-white/10"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <Move size={12} className="text-indigo-400" />
              <span>Đồng hồ nổi</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowPopoutTimer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Đóng đồng hồ nổi"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Large Digital Timer Countdown Display */}
          <div className="py-3 text-center">
            <div className={`text-3xl font-black font-mono tracking-tight ${
              timerMode === 'global' ? 'text-indigo-400' : 'text-amber-400'
            }`}>
              {timerMode === 'global' ? formattedTimerRemaining : `${questionTimer}s`}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
              {timerMode === 'global' ? 'Thời gian làm bài' : 'Thời gian câu hỏi'}
            </div>
          </div>

          {/* Action Buttons: Reset & Pause/Play */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            <button
              onClick={() => setIsTimerPaused(!isTimerPaused)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition cursor-pointer border border-white/10"
              title={isTimerPaused ? "Tiếp tục đếm giờ" : "Tạm dừng đếm giờ"}
            >
              {isTimerPaused ? <Play size={12} /> : <Pause size={12} />}
              <span>{isTimerPaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
            </button>

            <button
              onClick={handleResetTimer}
              className="flex items-center justify-center p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer border border-white/10"
              title="Đặt lại thời gian về ban đầu"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
