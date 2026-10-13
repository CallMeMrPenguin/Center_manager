import React from 'react';
import { Upload, X, Plus } from 'lucide-react';
import { CustomSelect, SelectOption } from '../../../components/CustomSelect';
import { TagSelector } from './TagSelector';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadFiles: File[];
  onSetUploadFiles: (files: File[]) => void;
  uploadFolderId: string;
  onChangeFolderId: (id: string) => void;
  uploadTags: string[];
  onChangeTags: (tags: string[]) => void;
  folderOptions: SelectOption[];
  availableTags: string[];
  onSubmit: () => void;
  loading: boolean;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  uploadFiles,
  onSetUploadFiles,
  uploadFolderId,
  onChangeFolderId,
  uploadTags,
  onChangeTags,
  folderOptions,
  availableTags,
  onSubmit,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4 animate-scale-up">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Upload size={14} className="text-blue-500" />
            Tải Lên Tài Liệu Mới
          </h3>
          <button onClick={onClose} aria-label="Đóng" className="text-slate-400 hover:text-slate-700 transition cursor-pointer">
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-slate-500 uppercase">
              Chọn tệp tin (Giữ Ctrl để chọn nhiều):
            </label>
            <input
              type="file"
              id="doc-upload-input"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  onSetUploadFiles(Array.from(e.target.files));
                }
              }}
              className="hidden"
            />
            <label
              htmlFor="doc-upload-input"
              className="w-full py-6 border border-dashed border-slate-300 hover:border-blue-500 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50 hover:bg-blue-50/50 transition"
            >
              <Plus size={18} className="text-slate-400" />
              <span className="text-xs text-slate-600 font-bold text-center px-4">
                {uploadFiles.length > 0
                  ? `Đã chọn ${uploadFiles.length} tệp tin`
                  : 'Kéo thả hoặc nhấp chọn tệp tin'}
              </span>
            </label>
          </div>

          {uploadFiles.length > 0 && (
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto border border-slate-200 p-2 rounded-xl bg-slate-50 font-mono">
              <label className="text-[8px] font-bold text-slate-500 uppercase px-1">
                Danh sách tệp tin ({uploadFiles.length}):
              </label>
              {uploadFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between text-[10px] text-slate-700 bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                  <span className="truncate pr-4">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => onSetUploadFiles(uploadFiles.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-red-500 transition cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-slate-500 uppercase">Thư mục lưu trữ:</label>
            <CustomSelect
              value={uploadFolderId}
              onChange={(val) => onChangeFolderId(String(val))}
              options={folderOptions}
              className="w-full text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-slate-500 uppercase">Nhãn dán (Chọn từ danh sách hoặc nhập mới):</label>
            <TagSelector
              selectedTags={uploadTags}
              onChange={onChangeTags}
              availableTags={availableTags}
              placeholder="Nhấp để chọn hoặc nhập nhãn mới..."
            />
          </div>
        </div>

        <div className="flex gap-2.5 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-bold rounded-xl border border-slate-200 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            disabled={loading || uploadFiles.length === 0}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs text-white font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            {loading ? 'Đang tải lên...' : `Tải Lên (${uploadFiles.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};
