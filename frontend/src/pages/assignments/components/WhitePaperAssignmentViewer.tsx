import React, { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Award, Printer, Send, RefreshCw } from 'lucide-react';
import { Assignment } from '../types';
import { ExerciseItem } from './types';
import { WhitePaperHeader } from './WhitePaperHeader';
import { ExerciseItemView } from './ExerciseItemView';
import { UlnDocumentRenderer } from './UlnDocumentRenderer';
import { parseUlnContent } from '../utils/ulnParser';
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
  // Parse ULN document nodes if raw ULN text or JSON
  const ulnNodes = useMemo(() => {
    if (assignment.content_json && assignment.content_json.trim()) {
      return parseUlnContent(assignment.content_json);
    }
    return [];
  }, [assignment.content_json]);

  // Fallback exercises when no ULN text is provided
  const fallbackExercises: ExerciseItem[] = useMemo(() => [
    {
      id: 1,
      qNum: 1,
      type: 'pr',
      sectionTitle: 'A. PHONETICS - I. Choose the word that has the underlined part pronounced differently from the others.',
      text: 'Choose the word whose underlined part is pronounced differently:',
      options: ['[po]{u}ttery', 'fl[ow]{u}er', '[si]{u}lent', '[se]{u}rvice'],
      answer: 'pottery',
      explanation: 'Option A is pronounced /ɒ/, whereas others are /əʊ/ or /aɪ/.',
    },
    {
      id: 2,
      qNum: 2,
      type: 'pr',
      text: 'Choose the word whose underlined part is pronounced differently:',
      options: ['g[i]{u}rl', 'exp[e]{u}rt', '[o]{u}pen', 'b[u]{u}rn'],
      answer: 'open',
      explanation: 'Option C is pronounced /əʊ/, whereas others are /ɜː/.',
    },
    {
      id: 3,
      qNum: 3,
      type: 'wb',
      sectionTitle: 'B. VOCABULARY - II. Complete the sentences with the words from the box.',
      wordBank: ['gardening', 'painting', 'swimming', 'origami', 'karate'],
      text: 'She usually goes <blank> with her friends in the pool near her school.',
      options: ['gardening', 'painting', 'swimming', 'origami'],
      answer: 'swimming',
      explanation: 'Cụm từ: go swimming (đi bơi).',
    },
    {
      id: 4,
      qNum: 4,
      type: 'wb',
      text: 'Sarah likes <blank>. She plants lots of flowers and vegetables in her home garden.',
      options: ['gardening', 'painting', 'swimming', 'karate'],
      answer: 'gardening',
      explanation: 'Làm vườn (gardening) phù hợp với "plants flowers and vegetables".',
    },
    {
      id: 5,
      qNum: 5,
      type: 'fb',
      sectionTitle: 'C. GRAMMAR - III. Put the verbs in brackets into the correct form.',
      text: 'I <blank> (not visit) my parents very often because of my busy schedule.',
      options: ['do not visit', 'does not visit', 'not visit', 'did not visit'],
      answer: 'do not visit',
      explanation: 'Thì hiện tại đơn với chủ ngữ I: do not visit.',
    },
    {
      id: 6,
      qNum: 6,
      type: 'fb',
      text: 'My brother <blank> (play) tennis every weekend, but he <blank> (not like) watching it on TV.',
      options: ['plays / does not like', 'play / do not like', 'is playing / not like', 'played / didn\'t like'],
      answer: 'plays / does not like',
      explanation: 'Chủ ngữ "My brother" là ngôi thứ 3 số ít: plays và does not like.',
    },
    {
      id: 7,
      qNum: 7,
      type: 'rd',
      sectionTitle: 'D. READING - IV. Read the passage and answer the questions.',
      passage: 'Ha Long Bay is a UNESCO World Heritage Site in Quang Ninh Province, Vietnam. The bay features thousands of limestone karsts and isles in various shapes and sizes. Many tourists visit Ha Long Bay each year to enjoy boat tours, explore caves, and discover the floating fishing villages.',
      text: 'Where is Ha Long Bay located?',
      options: ['In Quang Ninh Province', 'In Ha Noi City', 'In Da Nang City', 'In Hue City'],
      answer: 'In Quang Ninh Province',
      explanation: 'Thông tin trong đoạn 1: "in Quang Ninh Province, Vietnam".',
    },
    {
      id: 8,
      qNum: 8,
      type: 'rd',
      text: 'What is one of the main activities tourists do when visiting Ha Long Bay?',
      options: ['Enjoy boat tours and explore caves', 'Climb snowy mountains', 'Drive fast cars in the desert', 'Build skyscrapers'],
      answer: 'Enjoy boat tours and explore caves',
      explanation: 'Thông tin trong bài: "enjoy boat tours, explore caves".',
    },
    {
      id: 9,
      qNum: 9,
      type: 'rw',
      sectionTitle: 'E. WRITING - V. Rewrite the following sentence so that it has the same meaning.',
      text: 'Living in a big city is more expensive than living in the countryside.\n→ Living in the countryside is <blank>',
      options: ['cheaper than living in a big city', 'more expensive than living in a big city', 'as expensive as a big city', 'cheap than living in a city'],
      answer: 'cheaper than living in a big city',
      explanation: 'So sánh hơn: more expensive than → cheaper than.',
    },
  ], []);

  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSelectOption = (id: number, opt: string) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [id]: opt }));
  };

  // Score Calculation for standard exercises
  const total = fallbackExercises.length;
  const correctCount = useMemo(() => {
    let count = 0;
    fallbackExercises.forEach((ex) => {
      const uAns = (userAnswers[ex.id] || '').trim().toLowerCase();
      const cAns = (ex.answer || '').trim().toLowerCase();
      if (uAns && (uAns === cAns || cleanOptionPrefix(uAns) === cleanOptionPrefix(cAns))) {
        count++;
      }
    });
    return count;
  }, [fallbackExercises, userAnswers]);

  const finalScore = useMemo(() => {
    return total > 0 ? format1Dec((correctCount / total) * 10) : '0.0';
  }, [correctCount, total]);

  const handleSubmit = () => {
    setIsSubmitted(true);
    showToast(`Đã nộp bài thành công! Điểm số: ${finalScore}/10.0`, 'success');
    if (onSubmitSuccess) {
      onSubmitSuccess(parseFloat(String(finalScore)));
    }
  };

  const renderFormattedText = useCallback((text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[[^\]]+\]\{[^}]+\}|\[[^\]]+\])/g);
    return parts.map((part, index) => {
      if (part.includes('{u}') || part.includes('{u,b}')) {
        const wordMatch = part.match(/\[([^\]]+)\]/);
        const word = wordMatch ? wordMatch[1] : part;
        return (
          <span key={index} className="underline decoration-indigo-600 decoration-2 font-black text-indigo-700 px-0.5">
            {word}
          </span>
        );
      }
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <span key={index} className="underline decoration-indigo-600 decoration-2 font-black text-indigo-700 px-0.5">
            {part.slice(1, -1)}
          </span>
        );
      }
      return part;
    });
  }, []);

  return (
    <div className="space-y-6 pb-12 select-none font-sans">
      {/* 1. TOP FLOATING NAVIGATION BAR */}
      <div className="bg-[#0c0f1e] border border-[#1e2742] rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 sticky top-2 z-40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
            title="Quay lại danh sách"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-white">
                {assignment.title}
              </h3>
              {isPreview && (
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Xem Trước Phiếu Bài Tập (Nền Trắng A4)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Học sinh: <strong className="text-slate-200">{studentName}</strong> | Trạng thái: <strong className="text-indigo-300">{isSubmitted ? 'Đã Nộp' : 'Đang Làm Bài'}</strong>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold border border-white/10 transition cursor-pointer"
            title="In đề ra giấy hoặc lưu PDF"
          >
            <Printer size={14} />
            <span>In Đề / PDF</span>
          </button>

          {!isSubmitted ? (
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#6c48f7] text-white text-xs font-black shadow-[0_0_15px_rgba(92,54,245,0.4)] transition cursor-pointer active:scale-95"
            >
              <Send size={14} />
              <span>Nộp Bài Thi</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-black">
                <Award size={15} />
                <span>Điểm: {finalScore}/10.0</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setUserAnswers({});
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Làm lại</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. PURE WHITE PAPER WORKSHEET CANVAS (A4 PAPER SHEET STANDARD) */}
      <div className="bg-white text-slate-900 shadow-2xl rounded-2xl p-6 sm:p-12 max-w-4xl mx-auto border border-slate-200 space-y-8 print:p-0 print:border-none print:shadow-none">
        <WhitePaperHeader
          assignment={assignment}
          studentName={studentName}
          isSubmitted={isSubmitted}
          finalScore={finalScore}
          correctCount={correctCount}
          total={total}
        />

        {/* 3. SEQUENTIAL LIST OF ALL SECTIONS & QUESTIONS */}
        {ulnNodes.length > 0 ? (
          <UlnDocumentRenderer nodes={ulnNodes} isSubmitted={isSubmitted} />
        ) : (
          <div className="space-y-8">
            {fallbackExercises.map((ex) => (
              <ExerciseItemView
                key={ex.id}
                exercise={ex}
                userAnswer={userAnswers[ex.id]}
                isSubmitted={isSubmitted}
                onSelectOption={handleSelectOption}
                renderFormattedText={renderFormattedText}
              />
            ))}
          </div>
        )}

        {/* Worksheet Footer */}
        <div className="border-t-2 border-slate-800 pt-6 text-center text-xs text-slate-500 font-semibold print:block">
          --- HẾT PHIẾU BÀI TẬP ---
        </div>
      </div>
    </div>
  );
};
