import React from 'react';
import { Play, ArrowLeft } from 'lucide-react';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { TestData, TimerMode } from '../types';

interface QuizSettingsViewProps {
  testData: TestData;
  timerMode: TimerMode;
  setTimerMode: (m: TimerMode) => void;
  globalTimeSeconds: number;
  setGlobalTimeSeconds: (s: number) => void;
  perQuestionSeconds: number;
  setPerQuestionSeconds: (s: number) => void;
  shuffleQuestions: boolean;
  setShuffleQuestions: (s: boolean) => void;
  shuffleOptions: boolean;
  setShuffleOptions: (s: boolean) => void;
  onBack: () => void;
  onStartTest: () => void;
}

export const QuizSettingsView: React.FC<QuizSettingsViewProps> = ({
  testData,
  timerMode,
  setTimerMode,
  globalTimeSeconds,
  setGlobalTimeSeconds,
  perQuestionSeconds,
  setPerQuestionSeconds,
  shuffleQuestions,
  setShuffleQuestions,
  shuffleOptions,
  setShuffleOptions,
  onBack,
  onStartTest,
}) => {
  return (
    <div className="bg-white dark:bg-[#0c0f1e] border border-slate-200 dark:border-[#1d2744] p-8 rounded-3xl space-y-6 max-w-lg mx-auto w-full my-auto shadow-sm dark:shadow-2xl">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{testData.title || 'Đề Thi Mới'}</h2>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-1">
            Tổng cộng {testData.questions.length} câu hỏi sẵn sàng làm bài.
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition border border-slate-200 dark:border-white/10 cursor-pointer shrink-0"
        >
          <ArrowLeft size={14} />
          <span>Chọn lại file</span>
        </button>
      </div>

      {/* TIMER SECTION */}
      <div className="space-y-3">
        <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
          Chế Độ Hạn Giờ (Timer)
        </label>
        <SegmentedControl<TimerMode>
          value={timerMode}
          onChange={setTimerMode}
          options={[
            { value: 'none', label: 'Không Giới Hạn' },
            { value: 'global', label: 'Tổng Thời Gian' },
            { value: 'per_question', label: 'Từng Câu Hỏi' },
          ]}
          fit="fluid"
          size="md"
        />

        {timerMode === 'global' && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Thời gian làm bài (Phút):</span>
            <input
              type="number"
              min="1"
              max="180"
              value={Math.round(globalTimeSeconds / 60)}
              onChange={(e) => setGlobalTimeSeconds(Math.max(1, parseInt(e.target.value) || 1) * 60)}
              className="bg-slate-100 dark:bg-[#070913] border border-slate-200 dark:border-white/20 text-slate-900 dark:text-white rounded-xl px-3 py-1.5 text-xs font-black w-24 text-center focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {timerMode === 'per_question' && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Thời gian mỗi câu (Giây):</span>
            <input
              type="number"
              min="5"
              max="300"
              value={perQuestionSeconds}
              onChange={(e) => setPerQuestionSeconds(Math.max(5, parseInt(e.target.value) || 5))}
              className="bg-slate-100 dark:bg-[#070913] border border-slate-200 dark:border-white/20 text-slate-900 dark:text-white rounded-xl px-3 py-1.5 text-xs font-black w-24 text-center focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}
      </div>

      {/* SHUFFLE SECTION */}
      <div className="space-y-3 pt-2">
        <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
          Tùy Chọn Xáo Trộn Đề Thi
        </label>
        <div className="space-y-2.5">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={shuffleQuestions}
              onChange={(e) => setShuffleQuestions(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-100 dark:bg-[#070913] border-slate-300 dark:border-white/20 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              Xáo trộn thứ tự câu hỏi
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={shuffleOptions}
              onChange={(e) => setShuffleOptions(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-100 dark:bg-[#070913] border-slate-300 dark:border-white/20 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              Xáo trộn các phương án (A, B, C, D)
            </span>
          </label>
        </div>
      </div>

      {/* START BUTTON */}
      <div className="pt-4 border-t border-slate-200 dark:border-white/10">
        <button
          onClick={onStartTest}
          className="w-full flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-3.5 rounded-xl font-black text-sm shadow-[0_4px_20px_rgba(37,99,235,0.45)] transition cursor-pointer border border-white/20 active:scale-[0.99]"
        >
          <Play size={17} className="fill-white" />
          <span>BẮT ĐẦU LÀM BÀI THI</span>
        </button>
      </div>
    </div>
  );
};
