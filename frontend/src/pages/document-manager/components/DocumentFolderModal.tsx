import React from 'react';
import { FolderPlus, X } from 'lucide-react';
import { CustomSelect, SelectOption } from '../../../components/CustomSelect';

interface DocumentFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderName: string;
  onChangeFolderName: (name: string) => void;
  parentId: string;
  onChangeParentId: (id: string) => void;
  onSubmit: () => void;
  parentOptions: SelectOption[];
}

export const DocumentFolderModal: React.FC<DocumentFolderModalProps> = ({
  isOpen,
  onClose,
  folderName,
  onChangeFolderName,
  parentId,
  onChangeParentId,
  onSubmit,
  parentOptions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4 animate-scale-up">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <FolderPlus size={14} className="text-blue-500" />
            Tạo Thư Mục Mới
          </h3>
          <button onClick={onClose} aria-label="Đóng" className="text-slate-400 hover:text-slate-700 transition cursor-pointer">
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-slate-500 uppercase">Tên thư mục:</label>
            <input
              type="text"
              placeholder="Nhập tên thư mục..."
              value={folderName}
              onChange={(e) => onChangeFolderName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none transition"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-slate-500 uppercase">Thư mục cha:</label>
            <CustomSelect
              value={parentId}
              onChange={(val) => onChangeParentId(String(val))}
              options={parentOptions}
              className="w-full text-xs"
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
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-xs text-white font-extrabold rounded-xl transition cursor-pointer shadow-sm"
          >
            Tạo Thư Mục
          </button>
        </div>
      </div>
    </div>
  );
};
