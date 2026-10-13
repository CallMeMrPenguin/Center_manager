import React from 'react';
import { Download, X } from 'lucide-react';
import { CustomSelect } from '../../../components/CustomSelect';

interface VocabExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportGrade: string;
  onChangeGrade: (grade: string) => void;
  exportUnit: string;
  onChangeUnit: (unit: string) => void;
  saveToDocs: boolean;
  onChangeSaveToDocs: (save: boolean) => void;
  saveFolderId: string;
  onChangeSaveFolderId: (folderId: string) => void;
  availableGrades: string[];
  folderOptions: Array<{ id: number; name: string; depth: number }>;
  onExportDocx: () => void;
  onExportCsv: () => void;
}

export const VocabExportModal: React.FC<VocabExportModalProps> = ({
  isOpen,
  onClose,
  exportGrade,
  onChangeGrade,
  exportUnit,
  onChangeUnit,
  saveToDocs,
  onChangeSaveToDocs,
  saveFolderId,
  onChangeSaveFolderId,
  availableGrades,
  folderOptions,
  onExportDocx,
  onExportCsv,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="h-14 border-b border-slate-200 bg-slate-50 flex items-center justify-between px-6">
          <span className="text-xs font-black text-slate-900 flex items-center gap-2">
            <Download className="text-blue-500" size={15} />
            CẤU HÌNH XUẤT TỪ VỰNG
          </span>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.66rem] font-bold text-slate-500 uppercase">Khối lớp (Bắt buộc)</label>
            <CustomSelect
              value={exportGrade}
              onChange={(val) => onChangeGrade(String(val))}
              options={availableGrades.map(g => ({ value: g, label: `Lớp ${g}` }))}
              className="w-full text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.66rem] font-bold text-slate-500 uppercase">Unit (Để trống để xuất tất cả)</label>
            <input
              type="text"
              value={exportUnit}
              onChange={(e) => onChangeUnit(e.target.value)}
              placeholder="Ví dụ: 1, 2, 3..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 text-xs rounded-xl text-slate-900 outline-none font-bold shadow-xs focus:border-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 mt-2 px-1 text-slate-700 text-xs font-bold cursor-pointer select-none hover:text-slate-900 transition">
            <input
              type="checkbox"
              checked={saveToDocs}
              onChange={(e) => onChangeSaveToDocs(e.target.checked)}
              className="rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>Lưu vào Tài liệu (Documents)</span>
          </label>

          {saveToDocs && (
            <div className="flex flex-col gap-1.5 mt-1.5">
              <label className="text-[0.66rem] font-bold text-slate-500 uppercase">Thư mục lưu trữ</label>
              <CustomSelect
                value={saveFolderId}
                onChange={(val) => onChangeSaveFolderId(String(val))}
                options={[
                  { value: '', label: 'Trang chủ (Cấp cao nhất)' },
                  ...folderOptions.map(opt => ({
                    value: String(opt.id),
                    label: `${'\u00A0\u00A0'.repeat(opt.depth)}${opt.name}`
                  }))
                ]}
                className="w-full text-xs"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={onExportDocx}
              className="py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs transition cursor-pointer shadow-md text-center"
            >
              Xuất Word
            </button>
            <button
              type="button"
              onClick={onExportCsv}
              className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs transition cursor-pointer shadow-md text-center"
            >
              Xuất CSV
            </button>
            <button
              type="button"
              onClick={onClose}
              className="col-span-2 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer text-center"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
