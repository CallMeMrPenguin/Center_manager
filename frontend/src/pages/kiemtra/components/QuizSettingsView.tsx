import React from 'react';
import { Play, Clock, Shuffle, UserCheck, ArrowLeft } from 'lucide-react';
import { CustomSelect } from '../../../components/CustomSelect';
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
  classesList: any[];
  studentsList: any[];
  selectedClassId: number | '';
  setSelectedClassId: (id: number | '') => void;
  selectedStudentId: number | '';
  setSelectedStudentId: (id: number | '') => void;
  scoreSlot: 'check_1' | 'check_2' | 'homework';
  setScoreSlot: (slot: 'check_1' | 'check_2' | 'homework') => void;
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
  classesList,
  studentsList,
  selectedClassId,
  setSelectedClassId,
  selectedStudentId,
  setSelectedStudentId,
  scoreSlot,
  setScoreSlot,
  onBack,
  onStartTest,
}) => {
  return (
    <div className="bg-[#0d1018] border border-white/10 p-6 rounded-2xl space-y-6 max-w-2xl mx-auto w-full my-auto shadow-2xl">
      <div className="border-b border-white/10 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white">{testData.title || 'Đề Thi Mới'}</h2>
          <p className="text-xs text-indigo-400 font-bold mt-1">
            Tổng cộng {testData.questions.length} câu hỏi sẵn sàng làm bài.
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition border border-white/10 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Chọn lại file</span>
        </button>
      </div>

      <div className="space-y-5">
        {/* TIMER MODE */}
        <div>
          <label className="block text-xs font-black uppercase text-slate-300 mb-2 flex items-center gap-1.5">
            <Clock size={14} className="text-indigo-400" />
            <span>Chế Độ Hạn Giờ (Timer)</span>
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={() => setTimerMode('none')}
              className={`p-3 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                timerMode === 'none'
                  ? 'bg-[#5c36f5] text-white border-indigo-400 shadow-md'
                  : 'bg-[#121626] text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              Không Giới Hạn
            </button>
            <button
              onClick={() => setTimerMode('global')}
              className={`p-3 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                timerMode === 'global'
                  ? 'bg-[#5c36f5] text-white border-indigo-400 shadow-md'
                  : 'bg-[#121626] text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              Tổng Thời Gian
            </button>
            <button
              onClick={() => setTimerMode('per_question')}
              className={`p-3 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                timerMode === 'per_question'
                  ? 'bg-[#5c36f5] text-white border-indigo-400 shadow-md'
                  : 'bg-[#121626] text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              Từng Câu Hỏi
            </button>
          </div>

          {timerMode === 'global' && (
            <div className="mt-3 flex items-center gap-3 bg-[#121626] p-3 rounded-xl border border-white/5">
              <span className="text-xs font-bold text-slate-300">Thời gian làm bài (Phút):</span>
              <input
                type="number"
                min="1"
                max="180"
                value={Math.round(globalTimeSeconds / 60)}
                onChange={(e) => setGlobalTimeSeconds(Math.max(1, parseInt(e.target.value) || 1) * 60)}
                className="bg-[#070913] border border-white/20 text-white rounded-lg px-3 py-1.5 text-xs font-black w-24 text-center focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {timerMode === 'per_question' && (
            <div className="mt-3 flex items-center gap-3 bg-[#121626] p-3 rounded-xl border border-white/5">
              <span className="text-xs font-bold text-slate-300">Thời gian mỗi câu (Giây):</span>
              <input
                type="number"
                min="5"
                max="300"
                value={perQuestionSeconds}
                onChange={(e) => setPerQuestionSeconds(Math.max(5, parseInt(e.target.value) || 5))}
                className="bg-[#070913] border border-white/20 text-white rounded-lg px-3 py-1.5 text-xs font-black w-24 text-center focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {/* SHUFFLE CONTROLS */}
        <div>
          <label className="block text-xs font-black uppercase text-slate-300 mb-2 flex items-center gap-1.5">
            <Shuffle size={14} className="text-indigo-400" />
            <span>Tùy Chọn Xáo Trộn Đề Thi</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#121626] border border-white/5 cursor-pointer hover:border-white/20 transition">
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-[#070913] border-white/20 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-200">Xáo trộn thứ tự câu hỏi</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#121626] border border-white/5 cursor-pointer hover:border-white/20 transition">
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-[#070913] border-white/20 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-200">Xáo trộn các phương án (A, B, C, D)</span>
            </label>
          </div>
        </div>

        {/* STUDENT & CLASS ASSIGNMENT */}
        <div>
          <label className="block text-xs font-black uppercase text-slate-300 mb-2 flex items-center gap-1.5">
            <UserCheck size={14} className="text-indigo-400" />
            <span>Gán Học Sinh & Cột Điểm (Tùy chọn lưu điểm)</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="block text-[11px] font-bold text-slate-300 mb-1.5">Lớp học</span>
              <CustomSelect
                placeholder="-- Chọn lớp --"
                value={selectedClassId ? String(selectedClassId) : ''}
                onChange={(val) => {
                  setSelectedClassId(val ? Number(val) : '');
                  setSelectedStudentId('');
                }}
                options={[
                  { value: '', label: '-- Chọn lớp --' },
                  ...classesList.map(c => ({ value: String(c.id), label: c.name }))
                ]}
              />
            </div>

            <div>
              <span className="block text-[11px] font-bold text-slate-300 mb-1.5">Học sinh</span>
              <CustomSelect
                placeholder="-- Chọn học sinh --"
                value={selectedStudentId ? String(selectedStudentId) : ''}
                onChange={(val) => setSelectedStudentId(val ? Number(val) : '')}
                options={[
                  { value: '', label: '-- Chọn học sinh --' },
                  ...studentsList.map(s => ({ value: String(s.id), label: s.name }))
                ]}
                disabled={!selectedClassId}
              />
            </div>

            <div>
              <span className="block text-[11px] font-bold text-slate-300 mb-1.5">Cột điểm</span>
              <CustomSelect
                placeholder="Chọn cột điểm"
                value={scoreSlot}
                onChange={(val) => setScoreSlot(val as any)}
                options={[
                  { value: 'check_1', label: 'Check 1 (Đầu giờ)' },
                  { value: 'check_2', label: 'Check 2 (Cuối giờ)' },
                  { value: 'homework', label: 'Homework (BTVN)' }
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={onStartTest}
          className="w-full flex items-center justify-center gap-2 bg-[#5c36f5] hover:bg-[#7351f7] text-white py-3.5 rounded-xl font-black text-sm shadow-[0_4px_20px_rgba(92,54,245,0.45)] transition cursor-pointer border border-white/20 active:scale-[0.99]"
        >
          <Play size={17} className="fill-white" />
          <span>BẮT ĐẦU LÀM BÀI THI</span>
        </button>
      </div>
    </div>
  );
};
