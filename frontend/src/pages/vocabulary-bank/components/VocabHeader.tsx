import React from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import PromptManager from '../../../components/PromptManager';
import { Button } from '../../../components/button';
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

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenExport}
          leftIcon={<Download size={14} />}
        >
          Xuất Tệp
        </Button>

        <Button
          variant="white"
          size="sm"
          onClick={onOpenImport}
          leftIcon={<Upload size={14} className="text-blue-600" />}
        >
          Nhập CSV
        </Button>

        {selectedCount > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={onDeleteSelected}
            disabled={loading}
            leftIcon={<Trash2 size={14} />}
          >
            Xóa ({selectedCount})
          </Button>
        )}

        <Button
          variant="white"
          size="sm"
          onClick={onOpenDeleteModal}
          disabled={loading}
          leftIcon={<Trash2 size={14} className="text-rose-500" />}
        >
          Xóa Dữ Liệu
        </Button>
      </div>
    </div>
  );
};
