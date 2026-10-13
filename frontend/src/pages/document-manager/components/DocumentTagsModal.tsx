import React from 'react';
import { Tag, X } from 'lucide-react';
import { TagSelector } from './TagSelector';

interface DocumentTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  tags: string[];
  onChangeTags: (tags: string[]) => void;
  availableTags: string[];
  onSubmit: () => void;
  submitLabel?: string;
}

export const DocumentTagsModal: React.FC<DocumentTagsModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  tags,
  onChangeTags,
  availableTags,
  onSubmit,
  submitLabel = 'Lưu Thay Đổi',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4 animate-scale-up">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Tag size={14} className="text-blue-500" />
            {title}
          </h3>
          <button onClick={onClose} aria-label="Đóng" className="text-slate-400 hover:text-slate-700 transition cursor-pointer">
            <X size={14} />
          </button>
        </div>

        {description && (
          <p className="text-[10px] text-slate-600 leading-relaxed">{description}</p>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-bold text-slate-500 uppercase">
            Các nhãn dán (Chọn hoặc nhập mới):
          </label>
          <TagSelector
            selectedTags={tags}
            onChange={onChangeTags}
            availableTags={availableTags}
            placeholder="Chọn hoặc gõ nhãn mới..."
          />
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
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
