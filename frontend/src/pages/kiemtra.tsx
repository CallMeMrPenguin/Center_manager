import React, { useState, useEffect, useRef } from 'react';
import { 
  FileCheck, Upload, Play, RefreshCw, CheckCircle2, XCircle, 
  Clock, Shuffle, Save, ArrowLeft, ArrowRight, Highlighter, Eye, EyeOff, Printer, AlertCircle, Award
} from 'lucide-react';
import { api } from '../api';
import { showToast } from '../components/Toast';

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
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState<TestData | null>(null);

  // Settings state
  const [timerMode, setTimerMode] = useState<'none' | 'global' | 'per_question'>('none');
  const [globalTimeSeconds, setGlobalTimeSeconds] = useState(900); // 15 mins default
  const [perQuestionSeconds, setPerQuestionSeconds] = useState(45);
  const [shuffleToggle, setShuffleToggle] = useState(true);
  
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
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [questionTimer, setQuestionTimer] = useState(0);

  // Review & Annotation mode state
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlights, setHighlights] = useState<Record<number, string[]>>({});
  const [showAnswerToggle, setShowAnswerToggle] = useState(true);
  const [isScoreSaved, setIsScoreSaved] = useState(false);

  // Review Pagination State
  const [reviewPage, setReviewPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    loadClasses();
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
        setTestData(res);
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
      if (shuffleToggle && opts.length > 1) {
        opts.sort(() => Math.random() - 0.5);
      }
      return { ...q, options: opts };
    });

    if (shuffleToggle) {
      qList.sort(() => Math.random() - 0.5);
    }

    setActiveQuestions(qList);
    setCurrentIndex(0);
    setUserAnswers({});
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

  const handleFinishTest = () => {
    setStep('results');
  };

  // Calculate final score out of 10
  const totalQuestions = activeQuestions.length;
  let correctCount = 0;
  activeQuestions.forEach(q => {
    const userAns = (userAnswers[q.id] || '').trim().toLowerCase();
    const correctAns = (q.answer || '').trim().toLowerCase();
    if (userAns && userAns === correctAns) {
      correctCount++;
    }
  });
  const calculatedScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 10 * 10) / 10 : 0;

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
        test_date: new Date().toISOString().split('T')[0],
        score_type: scoreSlot,
        score: calculatedScore,
        max_score: 10,
        notes: `Đúng ${correctCount}/${totalQuestions} câu`
      });
      setIsScoreSaved(true);
      showToast("Đã lưu điểm thành công vào hệ thống!", "success");
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

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
            <FileCheck className="h-7 w-7 text-indigo-400" />
            Kiểm Tra & Quiz Runner
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Nhập đề từ `.docx`, `.json`, `.csv`, cài đặt bộ đếm giờ và nộp điểm trực tiếp cho học sinh.
          </p>
        </div>
      </div>

      {/* STEP 1: IMPORT FILE */}
      {step === 'import' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0d1018] border border-dashed border-white/20 rounded-2xl text-center space-y-5">
          <div className="h-20 w-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_30px_rgba(92,54,245,0.3)]">
            <Upload size={36} />
          </div>

          <div className="space-y-1 max-w-md">
            <h3 className="text-lg font-black text-white">Tải Đề Thi Lên (DOCX / JSON / CSV)</h3>
            <p className="text-xs text-slate-400">
              Kéo thả file bài tập hoặc click nút bên dưới để tải đề thi từ máy tính.
            </p>
          </div>

          <label className="flex items-center gap-2 bg-[#5c36f5] hover:bg-[#7351f7] text-white px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-[0_4px_16px_rgba(92,54,245,0.4)] transition cursor-pointer border border-white/20 active:scale-95">
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Upload size={16} />}
            <span>Chọn Đề Thi Từ Máy Tính</span>
            <input type="file" accept=".docx,.json,.csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      )}

      {/* STEP 2: SETTINGS */}
      {step === 'settings' && testData && (
        <div className="bg-[#0d1018] border border-white/10 p-6 rounded-2xl space-y-6 max-w-2xl mx-auto w-full">
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
                  className={`p-3 rounded-xl border text-xs font-bold transition ${
                    timerMode === 'none' ? 'bg-indigo-500/20 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  Không Hạn Giờ
                </button>
                <button
                  onClick={() => setTimerMode('global')}
                  className={`p-3 rounded-xl border text-xs font-bold transition ${
                    timerMode === 'global' ? 'bg-indigo-500/20 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  Hạn Giờ Toàn Bài
                </button>
                <button
                  onClick={() => setTimerMode('per_question')}
                  className={`p-3 rounded-xl border text-xs font-bold transition ${
                    timerMode === 'per_question' ? 'bg-indigo-500/20 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  Hạn Giờ Từng Câu
                </button>
              </div>

              {timerMode === 'global' && (
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-semibold">Thời gian làm bài (Phút):</span>
                  <input
                    type="number"
                    value={Math.round(globalTimeSeconds / 60)}
                    onChange={(e) => setGlobalTimeSeconds((parseInt(e.target.value) || 15) * 60)}
                    className="w-24 bg-[#161a29] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold"
                  />
                </div>
              )}

              {timerMode === 'per_question' && (
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-semibold">Giây đếm ngược mỗi câu:</span>
                  <input
                    type="number"
                    value={perQuestionSeconds}
                    onChange={(e) => setPerQuestionSeconds(parseInt(e.target.value) || 30)}
                    className="w-24 bg-[#161a29] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold"
                  />
                </div>
              )}
            </div>

            {/* SHUFFLE TOGGLE */}
            <div className="flex items-center justify-between p-3.5 bg-white/5 border border-white/10 rounded-xl">
              <span className="text-xs font-extrabold text-white">Xáo Trộn Câu Hỏi & Đáp Án</span>
              <button
                onClick={() => setShuffleToggle(!shuffleToggle)}
                className={`w-12 h-6 rounded-full transition-colors p-0.5 border ${
                  shuffleToggle ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-700 border-slate-600'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${shuffleToggle ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* ASSIGNMENT FOR STUDENT */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-black uppercase text-slate-300">Gán Điểm Học Sinh (Tùy Chọn)</label>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : '')}
                  className="bg-[#161a29] border border-white/10 text-white text-xs font-bold rounded-xl px-3 py-2"
                >
                  <option value="">-- Chọn Lớp Học --</option>
                  {classesList.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                </select>

                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value ? Number(e.target.value) : '')}
                  className="bg-[#161a29] border border-white/10 text-white text-xs font-bold rounded-xl px-3 py-2"
                >
                  <option value="">-- Chọn Học Sinh --</option>
                  {studentsList.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>

              {selectedStudentId && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-semibold">Cột điểm:</span>
                  <select
                    value={scoreSlot}
                    onChange={(e) => setScoreSlot(e.target.value as any)}
                    className="bg-[#161a29] border border-white/10 text-white text-xs font-bold rounded-xl px-3 py-1.5"
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
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold"
            >
              Quay Lại
            </button>
            <button
              onClick={handleStartTest}
              className="flex items-center gap-2 bg-[#5c36f5] hover:bg-[#7351f7] text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-[0_4px_16px_rgba(92,54,245,0.4)] transition cursor-pointer border border-white/20"
            >
              <Play size={16} />
              <span>Bắt Đầu Làm Bài</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: RUNNING QUIZ MODE */}
      {step === 'running' && activeQuestions.length > 0 && (
        <div className="flex-1 flex flex-col space-y-4 max-w-3xl mx-auto w-full">
          {/* HEADER TIMER & PROGRESS */}
          <div className="bg-[#0d1018] border border-white/10 p-4 rounded-2xl flex items-center justify-between gap-3">
            <div className="text-sm font-black text-white bg-indigo-600/30 px-3.5 py-1.5 rounded-xl border border-indigo-500/30">
              Câu {currentIndex + 1} / {activeQuestions.length}
            </div>

            {timerMode === 'global' && (
              <div className="flex items-center gap-2 text-amber-400 font-mono font-extrabold text-sm bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20 shrink-0">
                <Clock size={16} />
                <span>{Math.floor(timerRemaining / 60)}:{String(timerRemaining % 60).padStart(2, '0')}</span>
              </div>
            )}

            {timerMode === 'per_question' && (
              <div className="flex items-center gap-2 text-indigo-400 font-mono font-extrabold text-sm bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20 shrink-0">
                <Clock size={16} />
                <span>{questionTimer}s</span>
              </div>
            )}
          </div>

          {/* ACTIVE QUESTION CARD */}
          {(() => {
            const q = activeQuestions[currentIndex];
            const currentAns = userAnswers[q.id] || '';
            return (
              <div className="bg-[#0d1018] border border-white/10 p-6 sm:p-8 rounded-2xl flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="text-sm sm:text-base font-bold text-indigo-300 leading-relaxed border-b border-indigo-500/20 pb-3">
                    Câu {currentIndex + 1}/{activeQuestions.length}: {q.instruction || ''}
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-white leading-relaxed whitespace-pre-wrap tracking-wide">
                    {q.question}
                  </h3>

                  {q.type === 'mcq' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = currentAns === opt;
                        return (
                          <button
                            key={oIdx}
                            onClick={() => handleAnswerSelect(q.id, opt)}
                            className={`p-4 sm:p-5 rounded-2xl border text-left text-sm sm:text-base font-extrabold transition-all cursor-pointer flex items-center gap-3.5 ${
                              isSelected
                                ? 'bg-indigo-500/20 border-indigo-400 text-white shadow-[0_0_20px_rgba(92,54,245,0.4)] ring-1 ring-indigo-400'
                                : 'bg-[#121626] border-white/10 text-slate-200 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition ${
                              isSelected ? 'bg-indigo-500 text-white shadow-md' : 'bg-white/10 text-slate-300'
                            }`}>
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="leading-snug">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'fill' && (
                    <div className="pt-2">
                      <input
                        type="text"
                        value={currentAns}
                        onChange={(e) => handleAnswerSelect(q.id, e.target.value)}
                        placeholder="Nhập câu trả lời..."
                        className="w-full bg-[#161a29] border border-white/20 text-white text-base sm:text-lg font-bold rounded-2xl p-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner"
                      />
                    </div>
                  )}
                </div>

                {/* NAVIGATION BUTTONS */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button
                    disabled={currentIndex === 0}
                    onClick={() => {
                      setCurrentIndex(p => Math.max(0, p - 1));
                      if (timerMode === 'per_question') setQuestionTimer(perQuestionSeconds);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold disabled:opacity-40"
                  >
                    <ArrowLeft size={14} />
                    <span>Câu Trước</span>
                  </button>

                  {currentIndex < activeQuestions.length - 1 ? (
                    <button
                      onClick={() => {
                        setCurrentIndex(p => Math.min(activeQuestions.length - 1, p + 1));
                        if (timerMode === 'per_question') setQuestionTimer(perQuestionSeconds);
                      }}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] text-white text-xs font-extrabold"
                    >
                      <span>Câu Tiếp</span>
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={handleFinishTest}
                      className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-[0_4px_16px_rgba(16,185,129,0.4)]"
                    >
                      <CheckCircle2 size={14} />
                      <span>Nộp Bài</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* STEP 4: RESULTS & REVIEW */}
      {step === 'results' && (
        <div className="space-y-6 max-w-4xl mx-auto w-full">
          {/* SCORE CARD */}
          <div className="kpi-card-purple p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase text-purple-300 tracking-widest block">Kết Quả Bài Làm</span>
              <h2 className="text-3xl font-black text-white">Điểm: {calculatedScore} / 10</h2>
              <p className="text-xs text-purple-200">Đúng {correctCount} trên {totalQuestions} câu hỏi.</p>
            </div>

            <div className="flex items-center gap-3">
              {selectedStudentId && (
                <button
                  disabled={isScoreSaved}
                  onClick={handleSaveScoreToDB}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg transition disabled:opacity-50"
                >
                  <Save size={15} />
                  <span>{isScoreSaved ? 'Đã Lưu Điểm' : 'Lưu Điểm Vào Hệ Thống'}</span>
                </button>
              )}

              <button
                onClick={() => setStep('import')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
              >
                Làm Bài Khác
              </button>
            </div>
          </div>

          {/* REVIEW TOOLBAR */}
          <div className="flex flex-wrap items-center justify-between bg-[#0d1018] border border-white/10 p-3.5 rounded-2xl gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAnswerToggle(!showAnswerToggle)}
                className="flex items-center gap-1.5 text-xs font-extrabold text-slate-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10"
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
                className="flex items-center gap-1.5 text-xs font-extrabold text-slate-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10"
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
  onHighlightText
}: {
  q: Question;
  idx: number;
  userAns: string;
  showAnswerToggle: boolean;
  highlightMode: boolean;
  onHighlightText: (qId: number) => void;
}) => {
  const isCorrect = userAns.toLowerCase() === (q.answer || '').trim().toLowerCase();

  return (
    <div className="bg-[#0d1018] border border-white/10 p-6 rounded-2xl space-y-3">
      <div className="text-xs sm:text-sm font-bold text-indigo-300 border-b border-indigo-500/20 pb-2">
        Câu {idx + 1}: {q.instruction || ''}
      </div>

      <div className="flex items-start justify-between gap-3">
        <span
          onMouseUp={() => highlightMode && onHighlightText(q.id)}
          className="text-base sm:text-lg font-black text-white leading-relaxed whitespace-pre-wrap flex-1"
        >
          {q.question}
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
            const isUserChoice = userAns === opt;
            const isRightAns = (q.answer || '').trim() === opt;
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
                <span>{opt}</span>
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
