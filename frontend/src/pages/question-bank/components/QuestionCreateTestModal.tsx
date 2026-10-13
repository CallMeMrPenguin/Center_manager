import React from 'react';
import { Sparkles, X, CheckSquare, Square } from 'lucide-react';
import { CustomSelect } from '../../../components/CustomSelect';
import { TYPE_MAP, DIFFICULTY_LEVELS } from '../constants';
import { CreateTestConfig } from '../utils/testGeneration';

interface QuestionCreateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CreateTestConfig;
  onChangeConfig: React.Dispatch<React.SetStateAction<CreateTestConfig>>;
  onSubmit: () => void;
  selectedCount: number;
  availableGrades: string[];
  uniqueTypesInBank: string[];
}

export const QuestionCreateTestModal: React.FC<QuestionCreateTestModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  onSubmit,
  selectedCount,
  availableGrades,
  uniqueTypesInBank,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-4 text-slate-800 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="text-blue-500" size={16} />
            Cấu Hình Tạo Đề Thi
          </h3>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-1"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Question Source Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Nguồn câu hỏi:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChangeConfig((prev) => ({ ...prev, source: 'selected' }))}
                disabled={selectedCount === 0}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  config.source === 'selected'
                    ? 'bg-blue-50 border-blue-400 text-blue-600 font-extrabold'
                    : selectedCount === 0
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Đã tích chọn ({selectedCount} câu)
              </button>
              <button
                type="button"
                onClick={() => onChangeConfig((prev) => ({ ...prev, source: 'bank' }))}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  config.source === 'bank'
                    ? 'bg-blue-50 border-blue-400 text-blue-600 font-extrabold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Lọc từ Ngân Hàng
              </button>
            </div>
          </div>

          {/* Number of Versions Input */}
          <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Số lượng đề cần tạo (Versions):</label>
            <input
              type="number"
              min={1}
              max={50}
              value={config.numVersions}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                onChangeConfig((prev) => ({ ...prev, numVersions: val }));
              }}
              className="bg-white border border-slate-300 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none font-bold shadow-xs"
            />
          </div>

          {/* Filters (Active if source is 'bank') */}
          {config.source !== 'selected' && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl grid grid-cols-3 gap-3 animate-fade-in">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Khối lớp:</label>
                <CustomSelect
                  value={config.grade}
                  onChange={(val) => onChangeConfig((prev) => ({ ...prev, grade: String(val) }))}
                  options={[
                    { value: '', label: 'Tất cả' },
                    ...availableGrades.map((g) => ({ value: g, label: `Lớp ${g}` })),
                  ]}
                  className="w-full text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Unit:</label>
                <input
                  type="text"
                  value={config.unit}
                  onChange={(e) => onChangeConfig((prev) => ({ ...prev, unit: e.target.value }))}
                  placeholder="Ví dụ: 1 hoặc 2"
                  className="bg-white border border-slate-300 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none shadow-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Độ khó:</label>
                <CustomSelect
                  disabled={config.useDifficultyDistribution}
                  value={config.useDifficultyDistribution ? '' : (config.respectDifficulty ? config.targetDifficulty : '')}
                  onChange={(val) => {
                    const sVal = String(val);
                    onChangeConfig((prev) => ({
                      ...prev,
                      respectDifficulty: sVal !== '',
                      targetDifficulty: sVal || 'NHẬN BIẾT',
                    }));
                  }}
                  options={[
                    { value: '', label: 'Tất cả' },
                    ...DIFFICULTY_LEVELS.map((lvl) => ({ value: lvl, label: lvl })),
                  ]}
                  className="w-full text-xs"
                />
              </div>
            </div>
          )}

          {/* Counts Split per Exercise Type & Difficulty */}
          {config.source !== 'selected' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Cấu hình số câu & độ khó:
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onChangeConfig((prev) => ({ ...prev, useTypeDistribution: !prev.useTypeDistribution }))}
                    className="text-slate-600 hover:text-slate-900 cursor-pointer flex items-center"
                  >
                    {config.useTypeDistribution ? (
                      <CheckSquare size={16} className="text-blue-500 mr-1.5" />
                    ) : (
                      <Square size={16} className="mr-1.5" />
                    )}
                    <span className="text-xs text-slate-700 font-bold">Phân bổ theo dạng</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeConfig((prev) => ({ ...prev, useDifficultyDistribution: !prev.useDifficultyDistribution }))}
                    className="text-slate-600 hover:text-slate-900 cursor-pointer flex items-center"
                  >
                    {config.useDifficultyDistribution ? (
                      <CheckSquare size={16} className="text-blue-500 mr-1.5" />
                    ) : (
                      <Square size={16} className="mr-1.5" />
                    )}
                    <span className="text-xs text-slate-700 font-bold">Phân bổ độ khó</span>
                  </button>
                </div>
              </div>

              {config.useDifficultyDistribution && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col gap-3 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-700">Tỷ lệ độ khó (%)</span>
                    <span className={`text-[10px] font-bold ${
                      config.difficultyPctNhanBiet + config.difficultyPctThongHieu + config.difficultyPctVanDung === 100
                        ? 'text-emerald-600'
                        : 'text-rose-500 animate-pulse'
                    }`}>
                      Tổng: {config.difficultyPctNhanBiet + config.difficultyPctThongHieu + config.difficultyPctVanDung}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Nhận biết:</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={config.difficultyPctNhanBiet}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                          onChangeConfig((prev) => ({ ...prev, difficultyPctNhanBiet: val }));
                        }}
                        className="bg-white border border-slate-300 px-3 py-1.5 rounded-xl text-xs text-slate-900 font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Thông hiểu:</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={config.difficultyPctThongHieu}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                          onChangeConfig((prev) => ({ ...prev, difficultyPctThongHieu: val }));
                        }}
                        className="bg-white border border-slate-300 px-3 py-1.5 rounded-xl text-xs text-slate-900 font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Vận dụng:</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={config.difficultyPctVanDung}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                          onChangeConfig((prev) => ({ ...prev, difficultyPctVanDung: val }));
                        }}
                        className="bg-white border border-slate-300 px-3 py-1.5 rounded-xl text-xs text-slate-900 font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[10px] text-blue-700 leading-relaxed flex gap-2">
            <Sparkles size={14} className="shrink-0 mt-0.5 text-blue-600" />
            <span>
              <strong>Thông tin:</strong> Câu hỏi sau khi tạo/lọc sẽ được chuyển thẳng sang dạng JSON ở tab <strong>Trình tạo đề thi</strong> để bạn xuất file Word/Excel/CSV hoặc in ấn.
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 mt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            className="px-5 py-2 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer"
          >
            Tạo Đề Thi
          </button>
        </div>
      </div>
    </div>
  );
};
