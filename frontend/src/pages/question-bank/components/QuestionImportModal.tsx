import React from 'react';
import { Upload, X, HelpCircle } from 'lucide-react';

interface QuestionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCsvFile: File | null;
  onSelectFile: (file: File | null) => void;
  pastedCsv: string;
  onChangePastedCsv: (val: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export const QuestionImportModal: React.FC<QuestionImportModalProps> = ({
  isOpen,
  onClose,
  selectedCsvFile,
  onSelectFile,
  pastedCsv,
  onChangePastedCsv,
  onSubmit,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-4 text-slate-800 max-h-[90vh] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Upload className="text-blue-500" size={16} />
            Nhập Câu Hỏi Từ CSV
          </h3>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-1"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto pr-1">
          <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Cách 1: Chọn tệp CSV từ máy tính</label>
            <div className="flex items-center gap-3 mt-1">
              <label className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl cursor-pointer transition flex items-center gap-2 border-0 shadow-[0_2px_10px_rgba(15,23,42,0.13),0_0_6px_rgba(15,23,42,0.07)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.18),0_0_8px_rgba(15,23,42,0.09)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.55),0_0_6px_rgba(0,0,0,0.35)]">
                <Upload size={14} />
                <span>Chọn tệp CSV</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    onSelectFile(file);
                    e.target.value = '';
                  }}
                />
              </label>
              <span className="text-xs text-slate-500 truncate flex-1">
                {selectedCsvFile ? selectedCsvFile.name : 'Chưa chọn tệp'}
              </span>
              {selectedCsvFile && (
                <button
                  type="button"
                  onClick={() => onSelectFile(null)}
                  className="text-rose-500 hover:text-rose-600 text-xs font-semibold cursor-pointer"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Cách 2: Dán trực tiếp nội dung CSV</label>
            <textarea
              value={pastedCsv}
              onChange={(e) => onChangePastedCsv(e.target.value)}
              placeholder="Dán nội dung CSV câu hỏi tại đây..."
              rows={6}
              className="bg-white border border-slate-300 focus:border-blue-500 p-3 rounded-xl text-xs text-slate-900 outline-none placeholder-slate-400 transition font-mono mt-1 shadow-xs"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[10px] text-blue-700 leading-normal flex gap-2">
            <HelpCircle size={14} className="shrink-0 mt-0.5 text-blue-600" />
            <span className="text-slate-600">
              File CSV nên chứa các cột:{' '}
              <strong className="text-blue-600">Grade, Unit, Type, Question, Options, Answer, Level</strong>.
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
            disabled={loading || (!selectedCsvFile && !pastedCsv.trim())}
            className="px-5 py-2 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer"
          >
            {loading ? 'Đang kiểm tra...' : 'Bắt đầu kiểm tra'}
          </button>
        </div>
      </div>
    </div>
  );
};
