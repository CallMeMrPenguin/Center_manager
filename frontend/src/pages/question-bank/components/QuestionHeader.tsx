import React from 'react';
import { Sparkles, Upload, Trash2 } from 'lucide-react';
import { Button } from '../../../components/button';
import PromptManager from '../../../components/PromptManager';
import { DEFAULT_QUESTION_BANK_PROMPTS } from '../constants';

interface QuestionHeaderProps {
  totalCount: number;
  selectedCount: number;
  loading: boolean;
  onOpenCreateTest: () => void;
  onOpenImport: () => void;
  onDeleteSelected: () => void;
  onOpenDeleteModal: () => void;
}

export const QuestionHeader: React.FC<QuestionHeaderProps> = ({
  totalCount,
  selectedCount,
  loading,
  onOpenCreateTest,
  onOpenImport,
  onDeleteSelected,
  onOpenDeleteModal,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">NGÂN HÀNG CÂU HỎI</h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Tổng số: <strong className="text-blue-600">{totalCount}</strong> câu hỏi trong cơ sở dữ liệu
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <PromptManager
          storageKey="prompts_question_bank"
          tabTitle="Ngân Hàng Câu Hỏi"
          defaultPrompts={DEFAULT_QUESTION_BANK_PROMPTS}
        />

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenCreateTest}
          leftIcon={<Sparkles size={14} />}
        >
          Tạo Đề Thi
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
          className="hover:!text-rose-600"
        >
          Xóa Dữ Liệu
        </Button>
      </div>
    </div>
  );
};
