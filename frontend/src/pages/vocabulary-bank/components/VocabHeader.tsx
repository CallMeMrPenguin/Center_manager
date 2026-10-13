import React from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import PromptManager from '../../../components/PromptManager';
import { DEFAULT_VOCABULARY_BANK_PROMPTS } from '../constants';

interface VocabHeaderProps {
  totalCount: number;
  selectedCount: number;
  loading: boolean;
  onOpenExport: () => void;
  onOpenImport: () => void;
  onDeleteSelected: () => void;
  onOpenDeleteModal: () => void;
}

export const VocabHeader: React.FC<VocabHeaderProps> = ({
  totalCount,
  selectedCount,
  loading,
  onOpenExport,
  onOpenImport,
  onDeleteSelected,
  onOpenDeleteModal,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">DANH SÁCH TỪ VỰNG CHỦ ĐỀ</h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Tổng số: <strong className="text-blue-600">{totalCount}</strong> từ vựng trong cơ sở dữ liệu
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <PromptManager
          storageKey="prompts_vocabulary_bank"
          tabTitle="Từ Vựng Chủ Đề"
          defaultPrompts={DEFAULT_VOCABULARY_BANK_PROMPTS}
        />

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
        >
          <Download size={14} />
          <span>Xuất Tệp</span>
        </button>

        <button
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
        >
          <Upload size={14} className="text-blue-600" />
          <span>Nhập CSV</span>
        </button>

        {selectedCount > 0 && (
          <button
            onClick={onDeleteSelected}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Xóa ({selectedCount})</span>
          </button>
        )}

        <button
          onClick={onOpenDeleteModal}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
        >
          <Trash2 size={14} className="text-rose-500" />
          <span>Xóa Dữ Liệu</span>
        </button>
      </div>
    </div>
  );
};
