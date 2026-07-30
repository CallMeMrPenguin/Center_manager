import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  FileCheck, Upload, Play, RefreshCw, CheckCircle2, XCircle, 
  Clock, Shuffle, Save, ArrowLeft, ArrowRight, Highlighter, Eye, EyeOff, Printer,
  ChevronLeft, ChevronRight, Bookmark, Flag, Maximize2, Minimize2, MoreVertical, Sparkles, RotateCcw, Check,
  Code, FileText, GripVertical, Move
} from 'lucide-react';
import { api } from '../api';
import { showToast } from '../components/Toast';
import { VietnameseInput } from '../components/VietnameseInput';

import { getLocalDateStr, notifyDataChanged, trunc1Dec, cleanOptionPrefix } from '../utils';

interface Question {
  id: number;
  type: 'mcq' | 'fill';
  question: string;
  instruction?: string;
  options?: string[];
  answer: string;
  explanation?: string;
  points?: number;
}

interface TestData {
  title: string;
  questions: Question[];
}

export default function KiemTraPage() {
  const [step, setStep] = useState<'import' | 'settings' | 'running' | 'results'>('import');
  const [importTab, setImportTab] = useState<'file' | 'json'>('file');
  const [pastedJson, setPastedJson] = useState('');
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState<TestData | null>(null);

  // Settings state
  const [timerMode, setTimerMode] = useState<'none' | 'global' | 'per_question'>('none');
  const [globalTimeSeconds, setGlobalTimeSeconds] = useState(1800); // 30 mins default
  const [perQuestionSeconds, setPerQuestionSeconds] = useState(45);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  
  // Student Score Assignment
  const [classesList, setClassesList] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('');
  const [scoreSlot, setScoreSlot] = useState<'check_1' | 'check_2' | 'homework'>('check_1');

  // Quiz Execution state
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Record<number, boolean>>({});
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [questionTimer, setQuestionTimer] = useState(0);

  // UI Modes & Popout Draggable Timer
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timerPos, setTimerPos] = useState({ x: 30, y: 30 });
  const [timerSize, setTimerSize] = useState({ width: 240, height: 130 });
  const [isDraggingTimer, setIsDraggingTimer] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizingTimer, setIsResizingTimer] = useState(false);
  const [resizeMode, setResizeMode] = useState<'se' | 'e' | 's'>('se');
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 240, h: 130 });
  const [showPopoutTimer, setShowPopoutTimer] = useState(true);

  // Review & Annotation mode state
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlights, setHighlights] = useState<Record<number, string[]>>({});
  const [showAnswerToggle, setShowAnswerToggle] = useState(true);
  const [isScoreSaved, setIsScoreSaved] = useState(false);

  // Review Pagination State
  const [reviewPage, setReviewPage] = useState(1);
  const pageSize = 20;

  // Auto initialize popout timer position on fullscreen toggle
  useEffect(() => {
    if (isFullscreen) {
      const initialX = Math.max(20, window.innerWidth - 270);
      const initialY = 80;
      setTimerPos({ x: initialX, y: initialY });
      setShowPopoutTimer(true);
    }
  }, [isFullscreen]);

  // Handle dragging floating timer widget across screen
  useEffect(() => {
    if (!isDraggingTimer) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(10, Math.min(window.innerWidth - timerSize.width, e.clientX - dragOffset.x));
      const newY = Math.max(10, Math.min(window.innerHeight - timerSize.height, e.clientY - dragOffset.y));
      setTimerPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDraggingTimer(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingTimer, dragOffset, timerSize.width, timerSize.height]);

  // Handle resizing floating timer widget
  useEffect(() => {
    if (!isResizingTimer) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      const newW = resizeMode === 's'
        ? resizeStart.w
        : Math.max(160, Math.min(1200, resizeStart.w + deltaX));

      const newH = resizeMode === 'e'
        ? resizeStart.h
        : Math.max(90, Math.min(600, resizeStart.h + deltaY));

      setTimerSize({ width: newW, height: newH });
    };

    const handleMouseUp = () => {
      setIsResizingTimer(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingTimer, resizeStart, resizeMode]);

  const handleTimerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingTimer(true);
    setDragOffset({
      x: e.clientX - timerPos.x,
      y: e.clientY - timerPos.y
    });
  };

  const handleTimerResizeMouseDown = (e: React.MouseEvent, mode: 'se' | 'e' | 's' = 'se') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingTimer(true);
    setResizeMode(mode);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      w: timerSize.width,
      h: timerSize.height
    });
  };

  useEffect(() => {
    loadClasses();
    const handleDataChanged = () => loadClasses();
    window.addEventListener('data-changed', handleDataChanged);
    return () => window.removeEventListener('data-changed', handleDataChanged);
  }, []);

  const loadClasses = async () => {
    try {
      const cls = await api.getClasses();
      setClassesList(cls);
    } catch (e) {}
  };

  useEffect(() => {
    if (selectedClassId) {
      api.getClassStudents(Number(selectedClassId)).then(setStudentsList).catch(() => {});
    } else {
      setStudentsList([]);
    }
  }, [selectedClassId]);

  // Handle File Import
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const res = await api.parseQuizFile(file);
      if (res && res.questions && res.questions.length > 0) {
        // Clean option prefixes on file load
        const cleanedData = {
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

  // Handle Direct JSON Paste Parse
  const handleParsePastedJson = () => {
    const trimmed = pastedJson.trim();
    if (!trimmed) {
      showToast("Vui lòng dán nội dung JSON đề thi!", "warning");
      return;
    }
    try {
      let parsed = JSON.parse(trimmed);
      let title = "Đề Thi Từ JSON";
      let rawQuestions: any[] = [];

      if (Array.isArray(parsed)) {
        rawQuestions = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        if (parsed.title) title = parsed.title;
        if (Array.isArray(parsed.questions)) {
          rawQuestions = parsed.questions;
        } else if (Array.isArray(parsed.exercises)) {
          rawQuestions = parsed.exercises;
        } else if (Array.isArray(parsed.data)) {
          rawQuestions = parsed.data;
        }
      }

      if (!rawQuestions || !rawQuestions.length) {
        showToast("Không tìm thấy danh sách câu hỏi trong dữ liệu JSON!", "error");
        return;
      }

      const topInstruction = parsed.instruction || parsed.guide || parsed.yêu_cầu || undefined;

      const questions: Question[] = rawQuestions.map((q: any, index: number) => {
        let rawQText = '';
        if (Array.isArray(q.x)) {
          rawQText = q.x.filter(Boolean).join('\n');
        } else if (typeof q.x === 'string') {
          rawQText = q.x;
        } else if (Array.isArray(q.question)) {
          rawQText = q.question.filter(Boolean).join('\n');
        } else if (typeof q.question === 'string') {
          rawQText = q.question;
        } else if (q.sentence && q.prompt) {
          const promptStr = String(q.prompt).trim().startsWith('(') ? q.prompt.trim() : `(${q.prompt.trim()})`;
          rawQText = `${q.sentence.trim()}\n${promptStr}`;
        } else if (q.sentence) {
          rawQText = q.sentence;
        } else if (q.passage) {
          rawQText = q.passage;
        } else if (q.content || q.stem) {
          rawQText = q.content || q.stem;
        } else {
          rawQText = `Câu ${index + 1}`;
        }

        const opts = q.options || q.o || [];
        const ans = q.answer || q.a || q.correct || '';
        const qType = q.type || (q.t ? (q.t === 'fill' ? 'fill' : 'mcq') : (opts.length > 0 ? 'mcq' : 'fill'));
        const instruction = q.instruction || (q.passage ? `Đoạn văn: ${q.passage}` : topInstruction);

        return {
          id: q.id || q.number || index + 1,
          type: qType === 'mcq' ? 'mcq' : 'fill',
          question: rawQText,
          instruction,
          options: Array.isArray(opts) ? opts.map((o: any) => cleanOptionPrefix(String(o))) : [],
          answer: String(ans),
          explanation: q.explanation || ''
        };
      });

      const data: TestData = { title, questions };
      setTestData(data);
      setStep('settings');
      showToast(`Đã nạp bài kiểm tra thành công với ${questions.length} câu hỏi!`, "success");
    } catch (err: any) {
      showToast("Cú pháp JSON không hợp lệ: " + err.message, "error");
    }
  };

  // Start Test
  const handleStartTest = () => {
    if (!testData || !testData.questions.length) return;

    let qList = testData.questions.map((q) => {
      let opts = q.options ? [...q.options] : [];
      if (shuffleOptions && opts.length > 1) {
        opts.sort(() => Math.random() - 0.5);
      }
      return { ...q, options: opts };
    });

    if (shuffleQuestions) {
      qList.sort(() => Math.random() - 0.5);
    }

    setActiveQuestions(qList);
    setCurrentIndex(0);
    setUserAnswers({});
    setBookmarkedQuestions({});
    setIsScoreSaved(false);

    if (timerMode === 'global') {
      setTimerRemaining(globalTimeSeconds);
    } else if (timerMode === 'per_question') {
      setQuestionTimer(perQuestionSeconds);
    }

    setStep('running');
  };

  // Global Timer Countdown Effect
  useEffect(() => {
    if (step !== 'running' || timerMode !== 'global') return;
    if (timerRemaining <= 0) {
      handleFinishTest();
      showToast("Hết giờ làm bài! Bài thi đã tự động nộp.", "warning");
      return;
    }
    const interval = setInterval(() => {
      setTimerRemaining(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timerMode, timerRemaining]);

  // Per Question Timer Effect
  useEffect(() => {
    if (step !== 'running' || timerMode !== 'per_question') return;
    if (questionTimer <= 0) {
      if (currentIndex < activeQuestions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setQuestionTimer(perQuestionSeconds);
      } else {
        handleFinishTest();
      }
      return;
    }
    const interval = setInterval(() => {
      setQuestionTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timerMode, questionTimer, currentIndex]);

  const handleAnswerSelect = (questionId: number, answerVal: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answerVal }));
  };

  const toggleBookmark = (questionId: number) => {
    setBookmarkedQuestions(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleFinishTest = () => {
    setStep('results');
  };

  // Calculate final score out of 10
  const totalQuestions = activeQuestions.length;
  const correctCount = useMemo(() => {
    let count = 0;
    activeQuestions.forEach(q => {
      const userAns = (userAnswers[q.id] || '').trim().toLowerCase();
      const correctAns = (q.answer || '').trim().toLowerCase();
      if (userAns && userAns === correctAns) {
        count++;
      }
    });
    return count;
  }, [activeQuestions, userAnswers]);

  const calculatedScore = useMemo(() => {
    return totalQuestions > 0 ? trunc1Dec((correctCount / totalQuestions) * 10) : 0;
  }, [correctCount, totalQuestions]);

  const handleSaveScoreToDB = async () => {
    if (!selectedClassId || !selectedStudentId) {
      showToast("Vui lòng chọn Lớp học và Học sinh ở bước Thiết lập để lưu điểm!", "error");
      return;
    }
    try {
      await api.upsertScore({
        student_id: Number(selectedStudentId),
        class_id: Number(selectedClassId),
        test_title: testData?.title || 'Bài kiểm tra',
        test_date: getLocalDateStr(),
        score_type: scoreSlot,
        score: calculatedScore,
        max_score: 10,
        notes: `Đúng ${correctCount}/${totalQuestions} câu`
      });
      setIsScoreSaved(true);
      showToast("Đã lưu điểm thành công vào hệ thống!", "success");
      notifyDataChanged();
    } catch (err: any) {
      showToast("Lỗi lưu điểm: " + err.message, "error");
    }
  };

  const handleToggleHighlightText = (qId: number) => {
    const selection = window.getSelection()?.toString().trim();
    if (selection) {
      setHighlights(prev => ({
        ...prev,
        [qId]: [...(prev[qId] || []), selection]
      }));
    }
  };

  // FORMATTING RULE: Bracketed text [word] is rendered UNDERLINED without brackets
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

  const answeredCount = useMemo(() => {
    return Object.keys(userAnswers).filter(k => userAnswers[Number(k)]).length;
  }, [userAnswers]);

  const progressPct = useMemo(() => {
    return totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  }, [answeredCount, totalQuestions]);

  const formattedTimerRemaining = useMemo(() => {
    const mins = Math.floor(timerRemaining / 60);
    const secs = timerRemaining % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [timerRemaining]);

  return (
    <div className={`h-full flex flex-col bg-[#070913] ${isFullscreen ? 'fixed inset-0 z-[100] p-6 overflow-y-auto' : 'p-6 space-y-6 overflow-y-auto'}`}>
      
      {/* PERSISTENT HEADER BAR (HIDDEN DURING QUIZ RUNNING TO MAXIMIZE SPACE) */}
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
            {/* ALWAYS AVAILABLE FULLSCREEN FOCUS BUTTON */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
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
        <div className="space-y-6 max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center">
          
          {/* TAB MODE TOGGLE */}
          <div className="flex items-center justify-center gap-2 p-1.5 bg-[#0c0f1d] border border-white/10 rounded-2xl w-fit mx-auto shadow-lg">
            <button
              onClick={() => setImportTab('file')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                importTab === 'file' ? 'bg-[#5c36f5] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Upload size={15} />
              <span>Tải File (.DOCX / .JSON / .CSV)</span>
            </button>

            <button
              onClick={() => setImportTab('json')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                importTab === 'json' ? 'bg-[#5c36f5] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Code size={15} />
              <span>Dán Cấu Trúc JSON</span>
            </button>
          </div>

          {importTab === 'file' ? (
            <div className="p-10 bg-[#0d1018] border border-dashed border-white/20 rounded-2xl text-center space-y-5 shadow-2xl animate-mac-dropdown">
              <div className="h-20 w-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_30px_rgba(92,54,245,0.3)] mx-auto">
                <Upload size={36} />
              </div>

              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-lg font-black text-white">Tải Đề Thi Lên (DOCX / JSON / CSV)</h3>
                <p className="text-xs text-slate-400">
                  Kéo thả file bài tập hoặc click nút bên dưới để tải đề thi từ máy tính.
                </p>
              </div>

              <label className="inline-flex items-center gap-2 bg-[#5c36f5] hover:bg-[#7351f7] text-white px-6 py-3 rounded-xl font-extrabold text-xs shadow-[0_4px_16px_rgba(92,54,245,0.4)] transition cursor-pointer border border-white/20 active:scale-95">
                {loading ? <RefreshCw className="animate-spin" size={16} /> : <Upload size={16} />}
                <span>Chọn Đề Thi Từ Máy Tính</span>
                <input type="file" accept=".docx,.json,.csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          ) : (
            <div className="p-6 bg-[#0d1018] border border-white/10 rounded-2xl space-y-4 shadow-2xl animate-mac-dropdown">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code size={18} className="text-indigo-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Dán Nội Dung JSON Đề Thi</h3>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Hỗ trợ các dạng JSON mảng hoặc object đề thi</span>
              </div>

              <textarea
                rows={10}
                value={pastedJson}
                onChange={(e) => setPastedJson(e.target.value)}
                placeholder={`Dán nội dung JSON đề thi vào đây, ví dụ:\n[\n  {\n    "question": "We have English lessons _____ Tuesday.",\n    "options": ["on", "up", "at", "in"],\n    "answer": "on"\n  }\n]`}
                className="w-full bg-[#060810] border border-white/10 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500/60 leading-relaxed resize-y"
              />

              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-slate-400">
                  Tip: Bạn có thể copy JSON từ ChatGPT, Claude hoặc Prompt Generator.
                </p>
                <button
                  onClick={handleParsePastedJson}
                  className="flex items-center gap-2 bg-[#5c36f5] hover:bg-[#7351f7] text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-[0_4px_16px_rgba(92,54,245,0.4)] transition cursor-pointer border border-white/20 active:scale-95"
                >
                  <FileText size={15} />
                  <span>Nạp Đề Thi Từ JSON</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: SETTINGS */}
      {step === 'settings' && testData && (
        <div className="bg-[#0d1018] border border-white/10 p-6 rounded-2xl space-y-6 max-w-2xl mx-auto w-full my-auto shadow-2xl">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-lg font-black text-white">{testData.title || 'Đề Thi Mới'}</h2>
            <p className="text-xs text-indigo-400 font-bold mt-1">Tổng cộng {testData.questions.length} câu hỏi sẵn sàng.</p>
          </div>

          <div className="space-y-4">
            {/* TIMER MODE */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-300 mb-2">Chế Độ Hạn Giờ (Timer)</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setTimerMode('none')}
                  className={`p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    timerMode === 'none' ? 'bg-indigo-500/20 border-indigo-400 text-white shadow-md' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  Không Hạn Giờ
                </button>
                <button
                  onClick={() => setTimerMode('global')}
                  className={`p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    timerMode === 'global' ? 'bg-indigo-500/20 border-indigo-400 text-white shadow-md' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  Hạn Giờ Toàn Bài
                </button>
                <button
                  onClick={() => setTimerMode('per_question')}
                  className={`p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    timerMode === 'per_question' ? 'bg-indigo-500/20 border-indigo-400 text-white shadow-md' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  Hạn Giờ Từng Câu
                </button>
              </div>

              {timerMode === 'global' && (
                <div className="mt-3 flex items-center gap-3 bg-[#121626] p-3 rounded-xl border border-white/10">
                  <span className="text-xs text-slate-300 font-semibold">Thời gian làm bài (Phút):</span>
                  <input
                    type="number"
                    value={Math.round(globalTimeSeconds / 60)}
                    onChange={(e) => setGlobalTimeSeconds((parseInt(e.target.value) || 15) * 60)}
                    className="w-24 bg-[#0d1018] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold"
                  />
                </div>
              )}

              {timerMode === 'per_question' && (
                <div className="mt-3 flex items-center gap-3 bg-[#121626] p-3 rounded-xl border border-white/10">
                  <span className="text-xs text-slate-300 font-semibold">Giây đếm ngược mỗi câu:</span>
                  <input
                    type="number"
                    value={perQuestionSeconds}
                    onChange={(e) => setPerQuestionSeconds(parseInt(e.target.value) || 30)}
                    className="w-24 bg-[#0d1018] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold"
                  />
                </div>
              )}
            </div>

            {/* SHUFFLE TOGGLES */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3.5 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-2">
                  <Shuffle size={15} className="text-indigo-400" />
                  <span className="text-xs font-extrabold text-white">Xáo Trộn Thứ Tự Câu Hỏi</span>
                </div>
                <button
                  onClick={() => setShuffleQuestions(!shuffleQuestions)}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 border cursor-pointer ${
                    shuffleQuestions ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-700 border-slate-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${shuffleQuestions ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-2">
                  <Shuffle size={15} className="text-indigo-400" />
                  <span className="text-xs font-extrabold text-white">Xáo Trộn Thứ Tự Đáp Án</span>
                </div>
                <button
                  onClick={() => setShuffleOptions(!shuffleOptions)}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 border cursor-pointer ${
                    shuffleOptions ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-700 border-slate-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${shuffleOptions ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* ASSIGNMENT FOR STUDENT */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-black uppercase text-slate-300">Gán Điểm Học Sinh (Tùy Chọn)</label>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : '')}
                  className="bg-[#161a29] border border-white/10 text-white text-xs font-bold rounded-xl px-3 py-2 cursor-pointer"
                >
                  <option value="">-- Chọn Lớp Học --</option>
                  {classesList.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                </select>

                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value ? Number(e.target.value) : '')}
                  className="bg-[#161a29] border border-white/10 text-white text-xs font-bold rounded-xl px-3 py-2 cursor-pointer"
                >
                  <option value="">-- Chọn Học Sinh --</option>
                  {studentsList.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>

              {selectedStudentId && (
                <div className="flex items-center gap-3 bg-[#121626] p-3 rounded-xl border border-white/10">
                  <span className="text-xs text-slate-300 font-semibold">Cột điểm:</span>
                  <select
                    value={scoreSlot}
                    onChange={(e) => setScoreSlot(e.target.value as any)}
                    className="bg-[#0d1018] border border-white/10 text-white text-xs font-bold rounded-xl px-3 py-1.5 cursor-pointer"
                  >
                    <option value="check_1">Kiểm tra 1</option>
                    <option value="check_2">Kiểm tra 2</option>
                    <option value="homework">Bài tập về nhà</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              onClick={() => setStep('import')}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
            >
              Quay Lại
            </button>
            <button
              onClick={handleStartTest}
              className="flex items-center gap-2 bg-[#5c36f5] hover:bg-[#7351f7] text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-[0_4px_16px_rgba(92,54,245,0.4)] transition cursor-pointer border border-white/20 active:scale-95"
            >
              <Play size={16} />
              <span>Bắt Đầu Làm Bài</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: RUNNING QUIZ MODE (SINGLE UNIFIED CONTAINER WITH 1 SCROLL BAR) */}
      {step === 'running' && activeQuestions.length > 0 && (
        <div className="flex-1 flex gap-5 min-h-0 select-none">
          
          {/* LEFT PALETTE SIDEBAR (COLLAPSIBLE) */}
          {!isSidebarCollapsed && (
            <div className="w-64 bg-[#0d101d] border border-[#1e263d] p-5 rounded-2xl flex flex-col justify-between shrink-0 shadow-2xl space-y-4 overflow-y-auto animate-slide-up">
              <div className="space-y-5">
                {/* TIẾN ĐỘ CÂU HỎI */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">TIẾN ĐỘ CÂU HỎI</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black text-white">{answeredCount} / {totalQuestions}</span>
                    <span className="text-xs font-bold text-indigo-400">{progressPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#161a29] rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }}></div>
                  </div>
                </div>

                {/* DANH SÁCH CÂU HỎI PALETTE GRID */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">DANH SÁCH CÂU HỎI</span>
                  <div className="grid grid-cols-5 gap-2">
                    {activeQuestions.map((q, idx) => {
                      const isCurrent = currentIndex === idx;
                      const isAns = !!userAnswers[q.id];
                      const isBookmarked = !!bookmarkedQuestions[q.id];

                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            setCurrentIndex(idx);
                            if (timerMode === 'per_question') setQuestionTimer(perQuestionSeconds);
                          }}
                          className={`h-9 rounded-xl font-extrabold text-xs transition cursor-pointer relative flex items-center justify-center border ${
                            isCurrent
                              ? 'bg-[#5c36f5] text-white border-white/40 shadow-[0_0_12px_rgba(92,54,245,0.6)] scale-105 z-10'
                              : isBookmarked
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : isAns
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-[#14192b] text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span>{idx + 1}</span>
                          {isBookmarked && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-black" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STATUS LEGEND */}
                <div className="space-y-1.5 pt-2 border-t border-white/5 text-[11px] font-bold text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#5c36f5]" />
                    <span>Đang làm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Đã trả lời</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                    <span>Chưa trả lời</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Đánh dấu</span>
                  </div>
                </div>

                {/* DIGITAL CLOCK CARD */}
                {timerMode === 'global' && (
                  <div className="bg-[#13192c] border border-[#232d4e] p-4 rounded-2xl flex items-center justify-between shadow-inner">
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">THỜI GIAN</span>
                      <span className="text-xl font-black text-emerald-400 font-mono">{formattedTimerRemaining}</span>
                      <span className="text-[10px] text-slate-500 block font-semibold">/ {Math.round(globalTimeSeconds / 60)}:00</span>
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs bg-emerald-500/10">
                      <Clock size={18} />
                    </div>
                  </div>
                )}
              </div>

              {/* SIDEBAR ACTION BUTTONS */}
              <div className="space-y-2 pt-3 border-t border-white/5">
                <button
                  onClick={() => toggleBookmark(activeQuestions[currentIndex]?.id)}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    bookmarkedQuestions[activeQuestions[currentIndex]?.id]
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-[#14192b] border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  <Flag size={14} className={bookmarkedQuestions[activeQuestions[currentIndex]?.id] ? "fill-rose-500 text-rose-500" : ""} />
                  <span>{bookmarkedQuestions[activeQuestions[currentIndex]?.id] ? 'BỎ ĐÁNH DẤU' : 'ĐÁNH DẤU CÂU HỎI'}</span>
                </button>

                <button
                  onClick={handleFinishTest}
                  className="w-full flex items-center justify-center gap-2 bg-[#5c36f5] hover:bg-[#7351f7] text-white py-3 px-3 rounded-xl font-black text-xs shadow-[0_4px_16px_rgba(92,54,245,0.45)] transition cursor-pointer border border-white/20 active:scale-95"
                >
                  <span>NỘP BÀI</span>
                </button>
              </div>
            </div>
          )}

          {/* RIGHT QUESTION CANVAS (SINGLE UNIFIED SCROLLBAR CONTAINER) */}
          <div className="flex-1 bg-[#0d101d] border border-[#1e263d] p-5 sm:p-7 md:p-8 rounded-2xl flex flex-col justify-between shadow-2xl overflow-y-auto">
            {(() => {
              const q = activeQuestions[currentIndex];
              const rawAns = userAnswers[q.id] || '';
              const currentAns = cleanOptionPrefix(rawAns);
              const isBookmarked = !!bookmarkedQuestions[q.id];

              return (
                <div className="flex-1 flex flex-col justify-between space-y-3.5">
                  <div className="space-y-3.5">
                    
                    {/* MERGED CONTROL & PROGRESS HEADER BAR INSIDE CANVAS */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-2.5">
                      {/* Left: Exit Button + Progress Badge */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setStep('settings')}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer border border-white/10 text-xs font-extrabold"
                          title="Thoát chế độ làm bài"
                        >
                          <ArrowLeft size={15} />
                          <span>Thoát</span>
                        </button>

                        <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-xl">
                          <span className="text-xs text-indigo-300 font-extrabold">
                            {progressPct}% Hoàn thành
                          </span>
                          <div className="w-20 h-2 bg-[#161a29] rounded-full overflow-hidden border border-white/10">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Right: Timer + Bookmark + Fullscreen + Sidebar Toggle */}
                      <div className="flex items-center gap-2">
                        {timerMode === 'global' && (
                          <button
                            onClick={() => setShowPopoutTimer(!showPopoutTimer)}
                            className="flex items-center gap-2 bg-[#121626] hover:bg-[#1c233c] border border-[#263152] px-3 py-1 rounded-xl shadow-inner transition cursor-pointer"
                            title="Nhấp để Ẩn / Hiện Cửa sổ Đồng hồ nổi"
                          >
                            <Clock size={14} className="text-indigo-400" />
                            <span className="text-xs text-slate-400 font-bold">Còn lại</span>
                            <span className="text-xs font-black text-white font-mono">{formattedTimerRemaining}</span>
                          </button>
                        )}

                        {timerMode === 'per_question' && (
                          <button
                            onClick={() => setShowPopoutTimer(!showPopoutTimer)}
                            className="flex items-center gap-2 bg-[#121626] hover:bg-[#1c233c] border border-[#263152] px-3 py-1 rounded-xl shadow-inner transition cursor-pointer"
                            title="Nhấp để Ẩn / Hiện Cửa sổ Đồng hồ nổi"
                          >
                            <Clock size={14} className="text-amber-400" />
                            <span className="text-xs text-slate-400 font-bold">Thời gian câu</span>
                            <span className="text-xs font-black text-amber-400 font-mono">{questionTimer}s</span>
                          </button>
                        )}

                        <button
                          onClick={() => toggleBookmark(q.id)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
                            isBookmarked ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Flag size={13} className={isBookmarked ? "fill-rose-500 text-rose-500" : ""} />
                          <span>{isBookmarked ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
                        </button>

                        <button
                          onClick={() => setIsFullscreen(!isFullscreen)}
                          className={`p-1.5 rounded-xl border transition cursor-pointer ${
                            isFullscreen ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-[#121626] text-slate-300 hover:text-white border-[#263152]'
                          }`}
                          title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                        >
                          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                        </button>

                        <button
                          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                          className="p-1.5 rounded-xl bg-[#121626] hover:bg-[#1e2640] text-slate-300 hover:text-white border border-[#263152] transition cursor-pointer"
                          title={isSidebarCollapsed ? "Mở rộng danh sách câu hỏi" : "Thu gọn danh sách câu hỏi"}
                        >
                          {isSidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* INSTRUCTION */}
                    {q.instruction && (
                      <div className="text-base sm:text-lg font-bold text-indigo-300 leading-relaxed bg-indigo-500/10 border border-indigo-500/20 p-3 sm:p-4 rounded-xl shadow-sm">
                        {q.instruction}
                      </div>
                    )}

                    {/* QUESTION STEM WITH INLINE BLUE Q PREFIX (Q1. Q2. Q3.) */}
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight flex flex-wrap items-baseline gap-2 sm:gap-3">
                      <span className="text-[#5c36f5] sm:text-indigo-400 font-black">
                        Q{currentIndex + 1}.
                      </span>
                      <span>{renderFormattedText(q.question)}</span>
                    </h2>

                    {/* MCQ OPTIONS WITH EVEN LARGER TYPOGRAPHY & COMPACT TIGHT INNER PADDING */}
                    {q.type === 'mcq' && q.options && (
                      <div className="grid grid-cols-1 gap-2.5 sm:gap-3 pt-1">
                        {q.options.map((opt, oIdx) => {
                          const cleanOpt = cleanOptionPrefix(opt);
                          const isSelected = currentAns === cleanOpt || rawAns === opt || rawAns === cleanOpt;
                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleAnswerSelect(q.id, cleanOpt)}
                              className={`px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-2.5 rounded-2xl border text-left font-black transition-all duration-200 cursor-pointer flex items-center gap-3.5 sm:gap-5 ${
                                isSelected
                                  ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-[0_0_30px_rgba(92,54,245,0.5)] ring-2 ring-indigo-400'
                                  : 'bg-[#121626] border-white/10 text-slate-100 hover:bg-white/5 hover:border-white/20'
                              }`}
                            >
                              <span className={`w-10 h-10 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-xl flex items-center justify-center text-lg sm:text-xl md:text-2xl font-black shrink-0 transition ${
                                isSelected ? 'bg-[#5c36f5] text-white shadow-lg' : 'bg-white/10 text-slate-300'
                              }`}>
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span className="leading-tight flex-1 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black">{renderFormattedText(cleanOpt)}</span>
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
                          className="w-full bg-[#161a29] border border-white/20 text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold rounded-2xl px-5 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-inner"
                        />
                      </div>
                    )}
                  </div>

                  {/* BOTTOM NAVIGATION BAR */}
                  <div className="flex items-center justify-between pt-6 border-t border-white/10">
                    <button
                      disabled={currentIndex === 0}
                      onClick={() => {
                        setCurrentIndex(p => Math.max(0, p - 1));
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
                          setCurrentIndex(p => Math.min(activeQuestions.length - 1, p + 1));
                          if (timerMode === 'per_question') setQuestionTimer(perQuestionSeconds);
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] text-white text-xs font-extrabold shadow-[0_4px_16px_rgba(92,54,245,0.4)] transition cursor-pointer border border-white/20 active:scale-95"
                      >
                        <span>Câu tiếp</span>
                        <ArrowRight size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={handleFinishTest}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-[0_4px_16px_rgba(16,185,129,0.4)] transition cursor-pointer border border-white/20 active:scale-95"
                      >
                        <span>Nộp Bài</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* GLOBAL TRANSPARENT OVERLAY CAPTURING MOUSE DURING DRAG OR RESIZE */}
          {(isDraggingTimer || isResizingTimer) && (
            <div
              className={`fixed inset-0 z-[9999] bg-transparent ${
                isDraggingTimer
                  ? 'cursor-move'
                  : resizeMode === 'e'
                  ? 'cursor-ew-resize'
                  : resizeMode === 's'
                  ? 'cursor-ns-resize'
                  : 'cursor-se-resize'
              }`}
            />
          )}

          {/* FLOATING DRAGGABLE & RESIZABLE POPOUT TIMER WIDGET */}
          {timerMode !== 'none' && (isFullscreen || showPopoutTimer) && (() => {
            const dynamicFontSize = Math.max(20, Math.min(timerSize.width * 0.18, timerSize.height * 0.45));
            const dynamicSubtextSize = Math.max(10, Math.min(timerSize.width * 0.045, 15));

            return (
              <div
                style={{
                  position: 'fixed',
                  left: `${timerPos.x}px`,
                  top: `${timerPos.y}px`,
                  width: `${timerSize.width}px`,
                  height: `${timerSize.height}px`,
                  zIndex: 300,
                }}
                className="overflow-hidden min-w-[160px] min-h-[90px] max-w-[1200px] max-h-[600px] bg-[#0c0f1e] border-2 border-indigo-500/50 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col transition-shadow duration-200 select-none relative group/timer"
              >
                {/* DRAG HEADER HANDLE */}
                <div
                  onMouseDown={handleTimerMouseDown}
                  className="cursor-move select-none flex items-center justify-between bg-[#141a2e] px-3 py-1.5 border-b border-[#253259] rounded-t-2xl shrink-0 z-10"
                  title="Kéo thanh này để di chuyển đồng hồ tự do trên màn hình"
                >
                  <div className="flex items-center gap-1.5 text-indigo-400 font-black text-xs min-w-0">
                    <GripVertical size={14} className="text-slate-400 shrink-0" />
                    <Clock size={13} className={timerMode === 'global' ? "text-emerald-400 shrink-0" : "text-amber-400 shrink-0"} />
                    <span className="text-[11px] text-white tracking-wide font-extrabold uppercase truncate">
                      {timerMode === 'global' ? 'Đồng Hồ Tổng' : 'Thời Gian Câu'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setTimerPos({ x: Math.max(20, window.innerWidth - 270), y: 80 });
                        setTimerSize({ width: 240, height: 130 });
                      }}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition cursor-pointer"
                      title="Đặt lại vị trí & kích thước ban đầu"
                    >
                      <RotateCcw size={12} />
                    </button>
                    {isFullscreen && (
                      <button
                        onClick={() => setShowPopoutTimer(!showPopoutTimer)}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition cursor-pointer"
                        title={showPopoutTimer ? "Thu gọn đồng hồ" : "Mở rộng đồng hồ"}
                      >
                        {showPopoutTimer ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* TIMER BODY DISPLAY */}
                <div className="flex-1 p-2 sm:p-3 flex flex-col items-center justify-center bg-[#070913] text-center select-none overflow-hidden relative">
                  {timerMode === 'global' ? (
                    <>
                      <div
                        style={{ fontSize: `${dynamicFontSize}px`, lineHeight: 1 }}
                        className="font-black text-emerald-400 font-mono tracking-wider drop-shadow-[0_0_12px_rgba(52,211,153,0.3)] transition-all duration-75"
                      >
                        {formattedTimerRemaining}
                      </div>
                      <span
                        style={{ fontSize: `${dynamicSubtextSize}px` }}
                        className="font-bold text-slate-400 mt-1 truncate max-w-full px-1"
                      >
                        Tổng: {Math.round(globalTimeSeconds / 60)} phút
                      </span>
                    </>
                  ) : (
                    <>
                      <div
                        style={{ fontSize: `${dynamicFontSize}px`, lineHeight: 1 }}
                        className="font-black text-amber-400 font-mono tracking-wider drop-shadow-[0_0_12px_rgba(251,191,36,0.3)] transition-all duration-75"
                      >
                        {questionTimer}s
                      </div>
                      <span
                        style={{ fontSize: `${dynamicSubtextSize}px` }}
                        className="font-bold text-slate-400 mt-1 truncate max-w-full px-1"
                      >
                        Giới hạn câu: {perQuestionSeconds}s
                      </span>
                    </>
                  )}

                  {/* RIGHT EDGE RESIZE HANDLE */}
                  <div
                    onMouseDown={(e) => handleTimerResizeMouseDown(e, 'e')}
                    className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-indigo-500/40 transition-colors z-20"
                    title="Kéo cạnh này để thay đổi chiều rộng"
                  />

                  {/* BOTTOM EDGE RESIZE HANDLE */}
                  <div
                    onMouseDown={(e) => handleTimerResizeMouseDown(e, 's')}
                    className="absolute bottom-0 left-0 right-0 h-2.5 cursor-ns-resize hover:bg-indigo-500/40 transition-colors z-20"
                    title="Kéo cạnh này để thay đổi chiều cao"
                  />

                  {/* CORNER RESIZE HANDLE (SE) */}
                  <div
                    onMouseDown={(e) => handleTimerResizeMouseDown(e, 'se')}
                    className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize flex items-end justify-end p-1.5 z-30 text-indigo-400 hover:text-indigo-200 transition-all select-none bg-indigo-500/10 hover:bg-indigo-500/30 rounded-tl-xl border-t border-l border-indigo-500/30 group/corner"
                    title="Kéo góc này để chỉnh kích thước đồng hồ tự do"
                  >
                    <svg width="14" height="14" viewBox="0 0 10 10" fill="currentColor" className="group-hover/corner:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]">
                      <path d="M8 0L10 2L2 10L0 8L8 0Z M8 5L10 7L7 10L5 8L8 5Z" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* STEP 4: RESULTS & REVIEW (HIGH PERFORMANCE MEMOIZED RENDER) */}
      {step === 'results' && (
        <div className="space-y-6 max-w-4xl mx-auto w-full">
          {/* SCORE CARD */}
          <div className="kpi-card-purple p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-2xl">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase text-purple-300 tracking-widest block">Kết Quả Bài Làm</span>
              <h2 className="text-3xl font-black text-white">Điểm: {calculatedScore} / 10</h2>
              <p className="text-xs text-purple-200 font-semibold">Đúng {correctCount} trên {totalQuestions} câu hỏi ({progressPct}% đã trả lời).</p>
            </div>

            <div className="flex items-center gap-3">
              {selectedStudentId && (
                <button
                  disabled={isScoreSaved}
                  onClick={handleSaveScoreToDB}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg transition cursor-pointer disabled:opacity-50 border border-white/10 active:scale-95"
                >
                  <Save size={15} />
                  <span>{isScoreSaved ? 'Đã Lưu Điểm' : 'Lưu Điểm Vào Hệ Thống'}</span>
                </button>
              )}

              <button
                onClick={() => setStep('import')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer border border-white/10"
              >
                Làm Bài Khác
              </button>
            </div>
          </div>

          {/* REVIEW TOOLBAR */}
          <div className="flex flex-wrap items-center justify-between bg-[#0d1018] border border-white/10 p-3.5 rounded-2xl gap-3 shadow-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAnswerToggle(!showAnswerToggle)}
                className="flex items-center gap-1.5 text-xs font-extrabold text-slate-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition"
              >
                {showAnswerToggle ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{showAnswerToggle ? 'Ẩn Đáp Án Đúng' : 'Hiện Đáp Án Đúng'}</span>
              </button>

              <button
                onClick={() => setHighlightMode(!highlightMode)}
                className={`flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  highlightMode ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-white/5 border-white/5 text-slate-300'
                }`}
              >
                <Highlighter size={14} />
                <span>Bút Bôi Đen ({highlightMode ? 'BẬT' : 'TẮT'})</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">20 câu/trang</span>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs font-extrabold text-slate-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition"
              >
                <Printer size={14} />
                <span>In / Xuất PDF</span>
              </button>
            </div>
          </div>

          {/* QUESTION REVIEW LIST WITH PAGINATION */}
          {(() => {
            const totalPages = Math.ceil(activeQuestions.length / pageSize);
            const currentPageIndex = Math.min(reviewPage, totalPages || 1);
            const pagedQuestions = activeQuestions.slice((currentPageIndex - 1) * pageSize, currentPageIndex * pageSize);

            return (
              <div className="space-y-4">
                <div className="space-y-4">
                  {pagedQuestions.map((q, pIdx) => {
                    const actualIdx = (currentPageIndex - 1) * pageSize + pIdx;
                    return (
                      <QuestionReviewCard
                        key={q.id}
                        q={q}
                        idx={actualIdx}
                        userAns={(userAnswers[q.id] || '').trim()}
                        showAnswerToggle={showAnswerToggle}
                        highlightMode={highlightMode}
                        onHighlightText={handleToggleHighlightText}
                        renderFormattedText={renderFormattedText}
                      />
                    );
                  })}
                </div>

                {/* PAGINATION NAVIGATION BAR */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between bg-[#0d1018] border border-white/10 p-3.5 rounded-2xl text-xs font-bold text-slate-300">
                    <button
                      disabled={currentPageIndex <= 1}
                      onClick={() => setReviewPage(p => Math.max(1, p - 1))}
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      ← Trang trước
                    </button>

                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalPages }).map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setReviewPage(pageNum)}
                            className={`w-7 h-7 rounded-lg font-extrabold text-xs transition cursor-pointer ${
                              currentPageIndex === pageNum
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      disabled={currentPageIndex >= totalPages}
                      onClick={() => setReviewPage(p => Math.min(totalPages, p + 1))}
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      Trang sau →
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

const QuestionReviewCard = React.memo(({
  q,
  idx,
  userAns,
  showAnswerToggle,
  highlightMode,
  onHighlightText,
  renderFormattedText
}: {
  q: Question;
  idx: number;
  userAns: string;
  showAnswerToggle: boolean;
  highlightMode: boolean;
  onHighlightText: (qId: number) => void;
  renderFormattedText: (text: string) => React.ReactNode;
}) => {
  const isCorrect = userAns.toLowerCase() === (q.answer || '').trim().toLowerCase();

  return (
    <div className="bg-[#0d1018] border border-white/10 p-6 rounded-2xl space-y-3 shadow-xl">
      <div className="text-xs sm:text-sm font-bold text-indigo-300 border-b border-indigo-500/20 pb-2">
        Câu {idx + 1}: {q.instruction || ''}
      </div>

      <div className="flex items-start justify-between gap-3">
        <span
          onMouseUp={() => highlightMode && onHighlightText(q.id)}
          className="text-base sm:text-lg font-black text-white leading-relaxed whitespace-pre-wrap flex-1"
        >
          {renderFormattedText(q.question)}
        </span>

        <span className={`px-3 py-1 rounded-xl text-xs font-black shrink-0 border ${
          isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {isCorrect ? 'ĐÚNG' : 'SAI'}
        </span>
      </div>

      {q.type === 'mcq' && q.options && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-bold pt-1">
          {q.options.map((opt, oIdx) => {
            const cleanOpt = cleanOptionPrefix(opt);
            const cleanUserAns = cleanOptionPrefix(userAns);
            const cleanRightAns = cleanOptionPrefix((q.answer || '').trim());
            const isUserChoice = userAns === opt || cleanUserAns === cleanOpt;
            const isRightAns = (q.answer || '').trim() === opt || cleanRightAns === cleanOpt;
            return (
              <div
                key={oIdx}
                className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                  isRightAns && showAnswerToggle
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-extrabold shadow-sm'
                    : isUserChoice
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-[#141824] border-white/5 text-slate-300'
                }`}
              >
                <span className="w-6 h-6 rounded-lg bg-white/10 text-xs font-black flex items-center justify-center shrink-0">
                  {String.fromCharCode(65 + oIdx)}
                </span>
                <span>{renderFormattedText(cleanOpt)}</span>
              </div>
            );
          })}
        </div>
      )}

      {q.type === 'fill' && (
        <div className="text-sm font-semibold space-y-1.5 pt-1">
          <p className="text-slate-300">Đã chọn: <span className="font-extrabold text-white">{userAns || '(Trống)'}</span></p>
          {showAnswerToggle && <p className="text-emerald-400 font-extrabold">Đáp án đúng: {q.answer}</p>}
        </div>
      )}

      {q.explanation && (
        <p className="text-sm text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl font-medium">
          Giải thích: {q.explanation}
        </p>
      )}
    </div>
  );
});
