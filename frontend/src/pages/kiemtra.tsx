import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { api } from '../api';
import { FileCheck, Maximize2, Minimize2 } from 'lucide-react';
import { trunc1Dec, cleanOptionPrefix } from '../utils';
import { showToast } from '../components/Toast';
import { Question, TestData, TimerMode } from './kiemtra/types';
import { QuizImportView } from './kiemtra/components/QuizImportView';
import { QuizSettingsView } from './kiemtra/components/QuizSettingsView';
import { QuizRunningView } from './kiemtra/components/QuizRunningView';
import { QuizResultsView } from './kiemtra/components/QuizResultsView';

export default function KiemTraPage() {
  const [step, setStep] = useState<'import' | 'settings' | 'running' | 'results'>('import');
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState<TestData | null>(null);

  // Settings state
  const [timerMode, setTimerMode] = useState<TimerMode>('none');
  const [globalTimeSeconds, setGlobalTimeSeconds] = useState(1800); // 30 mins default
  const [perQuestionSeconds, setPerQuestionSeconds] = useState(45);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);

  // Quiz Execution state
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Record<number, boolean>>({});
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [questionTimer, setQuestionTimer] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // Fullscreen Management
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isQuizFullscreenRef = React.useRef(false);

  // Sync fullscreen state with browser events (Esc / F11)
  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement) {
        isQuizFullscreenRef.current = false;
        setIsFullscreen(false);
      } else if (isQuizFullscreenRef.current) {
        setIsFullscreen(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      isQuizFullscreenRef.current = true;
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        isQuizFullscreenRef.current = false;
        setIsFullscreen(prev => !prev);
      });
    } else {
      isQuizFullscreenRef.current = false;
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  }, []);

  // Handle File Upload (.docx / .json / .csv)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const res = await api.parseQuizFile(file);
      if (res && res.questions && res.questions.length > 0) {
        const cleanedData: TestData = {
          ...res,
          questions: res.questions.map((q: any) => ({
            ...q,
            options: Array.isArray(q.options) ? q.options.map((o: any) => cleanOptionPrefix(String(o))) : []
          }))
        };
        setTestData(cleanedData);
        setStep('settings');
        showToast(`Đã tải bài kiểm tra với ${res.questions.length} câu hỏi!`, "success");
      } else {
        showToast("Không tìm thấy câu hỏi nào trong file!", "error");
      }
    } catch (err: any) {
      showToast("Lỗi đọc file: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Start Test
  const handleStartTest = () => {
    if (!testData || !testData.questions.length) return;

    let qList = testData.questions.map((q) => {
      let opts = q.options ? [...q.options] : [];
      let resolvedAnswer = q.answer;
      if (q.options && q.options.length > 0) {
        const cleanAns = cleanOptionPrefix(q.answer.trim());
        if (/^[A-E]$/i.test(cleanAns)) {
          const idx = cleanAns.toUpperCase().charCodeAt(0) - 65;
          if (idx >= 0 && idx < q.options.length) {
            resolvedAnswer = q.options[idx];
          }
        }
      }
      if (shuffleOptions && opts.length > 1) {
        opts.sort(() => Math.random() - 0.5);
      }
      return { ...q, options: opts, answer: resolvedAnswer };
    });

    if (shuffleQuestions) {
      qList.sort(() => Math.random() - 0.5);
    }

    setActiveQuestions(qList);
    setCurrentIndex(0);
    setUserAnswers({});
    setBookmarkedQuestions({});
    setIsTimerPaused(false);
    setElapsedSeconds(0);

    if (timerMode === 'global') {
      setTimerRemaining(globalTimeSeconds);
    } else if (timerMode === 'per_question') {
      setQuestionTimer(perQuestionSeconds);
    }

    setStep('running');
  };

  // Stopwatch Effect for 'none' mode
  useEffect(() => {
    if (step !== 'running' || timerMode !== 'none' || isTimerPaused) return;
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timerMode, isTimerPaused]);

  // Global Timer Countdown Effect
  useEffect(() => {
    if (step !== 'running' || timerMode !== 'global' || isTimerPaused) return;
    if (timerRemaining <= 0) {
      setStep('results');
      showToast("Hết giờ làm bài! Bài thi đã tự động nộp.", "warning");
      return;
    }
    const interval = setInterval(() => {
      setTimerRemaining(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timerMode, timerRemaining, isTimerPaused]);

  // Per Question Timer Effect
  useEffect(() => {
    if (step !== 'running' || timerMode !== 'per_question' || isTimerPaused) return;
    if (questionTimer <= 0) {
      if (currentIndex < activeQuestions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setQuestionTimer(perQuestionSeconds);
      } else {
        setStep('results');
      }
      return;
    }
    const interval = setInterval(() => {
      setQuestionTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timerMode, questionTimer, currentIndex, activeQuestions.length, perQuestionSeconds, isTimerPaused]);

  const toggleBookmark = (questionId: number) => {
    setBookmarkedQuestions(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  // Calculate final score out of 10
  const totalQuestions = activeQuestions.length;
  const correctCount = useMemo(() => {
    let count = 0;
    activeQuestions.forEach(q => {
      const userAns = cleanOptionPrefix(userAnswers[q.id] || '').trim().toLowerCase();
      const correctAns = cleanOptionPrefix(q.answer || '').trim().toLowerCase();
      if (userAns && userAns === correctAns) {
        count++;
      }
    });
    return count;
  }, [activeQuestions, userAnswers]);

  const calculatedScore = useMemo(() => {
    return totalQuestions > 0 ? trunc1Dec((correctCount / totalQuestions) * 10) : 0;
  }, [correctCount, totalQuestions]);

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

  const formattedTimerRemaining = useMemo(() => {
    if (timerMode === 'none') {
      const mins = Math.floor(elapsedSeconds / 60);
      const secs = elapsedSeconds % 60;
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    const mins = Math.max(0, Math.floor(timerRemaining / 60));
    const secs = Math.max(0, timerRemaining % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [timerMode, elapsedSeconds, timerRemaining]);

  // Main Content JSX
  const mainContent = (
    <div className={`h-full flex flex-col bg-[#070913] ${isFullscreen ? 'fixed inset-0 z-[99999] p-6 overflow-y-auto' : 'p-6 space-y-6 overflow-y-auto'}`}>
      {/* PERSISTENT HEADER BAR */}
      {step !== 'running' && (
        <div className="flex items-center justify-between bg-[#0c0f1e] border border-[#1d2744] px-6 py-3.5 rounded-2xl shadow-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <FileCheck size={20} />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Kiểm Tra & Quiz Runner
              </h1>
              <p className="text-[11px] text-slate-400 font-semibold">
                {testData?.title || 'Đánh giá năng lực học sinh'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleFullscreen}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-black transition cursor-pointer ${
                isFullscreen ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-[#121626] text-slate-300 hover:text-white border-[#263152]'
              }`}
              title={isFullscreen ? "Thoát toàn màn hình" : "Chế độ làm bài tập trung (Toàn màn hình)"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              <span>{isFullscreen ? 'Thoát Toàn Màn Hình' : 'Toàn Màn Hình'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: IMPORT FILE / PASTE JSON */}
      {step === 'import' && (
        <QuizImportView
          loading={loading}
          onFileUpload={handleFileUpload}
          onDataLoaded={(data) => {
            setTestData(data);
            setStep('settings');
          }}
        />
      )}

      {/* STEP 2: SETTINGS */}
      {step === 'settings' && testData && (
        <QuizSettingsView
          testData={testData}
          timerMode={timerMode}
          setTimerMode={setTimerMode}
          globalTimeSeconds={globalTimeSeconds}
          setGlobalTimeSeconds={setGlobalTimeSeconds}
          perQuestionSeconds={perQuestionSeconds}
          setPerQuestionSeconds={setPerQuestionSeconds}
          shuffleQuestions={shuffleQuestions}
          setShuffleQuestions={setShuffleQuestions}
          shuffleOptions={shuffleOptions}
          setShuffleOptions={setShuffleOptions}
          onBack={() => setStep('import')}
          onStartTest={handleStartTest}
        />
      )}

      {/* STEP 3: RUNNING QUIZ */}
      {step === 'running' && (
        <QuizRunningView
          activeQuestions={activeQuestions}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          userAnswers={userAnswers}
          setUserAnswers={setUserAnswers}
          bookmarkedQuestions={bookmarkedQuestions}
          toggleBookmark={toggleBookmark}
          timerMode={timerMode}
          timerRemaining={timerRemaining}
          setTimerRemaining={setTimerRemaining}
          globalTimeSeconds={globalTimeSeconds}
          questionTimer={questionTimer}
          setQuestionTimer={setQuestionTimer}
          perQuestionSeconds={perQuestionSeconds}
          formattedTimerRemaining={formattedTimerRemaining}
          isTimerPaused={isTimerPaused}
          setIsTimerPaused={setIsTimerPaused}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onFinishTest={() => setStep('results')}
          onExitToImport={() => setStep('import')}
          renderFormattedText={renderFormattedText}
        />
      )}

      {/* STEP 4: RESULTS & REVIEW */}
      {step === 'results' && (
        <QuizResultsView
          testData={testData}
          activeQuestions={activeQuestions}
          userAnswers={userAnswers}
          calculatedScore={calculatedScore}
          correctCount={correctCount}
          totalQuestions={totalQuestions}
          onRetake={() => setStep('settings')}
          renderFormattedText={renderFormattedText}
        />
      )}
    </div>
  );

  // If in Fullscreen mode, render via Portal to document.body
  if (isFullscreen) {
    return ReactDOM.createPortal(mainContent, document.body);
  }

  return mainContent;
}
