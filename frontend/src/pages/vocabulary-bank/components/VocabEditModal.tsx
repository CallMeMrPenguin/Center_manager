import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { DbVocab } from '../../../types';
import { CustomSelect } from '../../../components/CustomSelect';
import { Button } from '../../../components/button';

interface VocabEditModalProps {
  vocab: DbVocab | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, data: Partial<DbVocab>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  availableGrades: string[];
  difficultiesList: string[];
  posList: string[];
}

export const VocabEditModal: React.FC<VocabEditModalProps> = ({
  vocab,
  isOpen,
  onClose,
  onSave,
  onDelete,
  availableGrades,
  difficultiesList,
  posList,
}) => {
  const [formData, setFormData] = useState<Partial<DbVocab>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (vocab) {
      setFormData({
        grade: vocab.grade || '',
        unit: vocab.unit || '',
        vocabulary: vocab.vocabulary || '',
        pos: vocab.pos || '',
        ipa: vocab.ipa || '',
        meaning: vocab.meaning || '',
        difficulty: vocab.difficulty || '',
        root_word: vocab.root_word || '',
      });
    }
  }, [vocab]);

  if (!isOpen || !vocab) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(vocab.id, formData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!vocab.id) return;
    setIsSaving(true);
    try {
      await onDelete(vocab.id);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-white border-0 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-slate-800 animate-fade-in">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Chỉnh Sửa Từ Vựng
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              ID #{vocab.id} - {vocab.vocabulary}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-1"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Khối Lớp</label>
              <CustomSelect
                value={String(formData.grade || '')}
                onChange={(val) => setFormData(prev => ({ ...prev, grade: String(val) }))}
                options={availableGrades.map(g => ({ value: g, label: `Lớp ${g}` }))}
                className="w-full text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Unit / Bài học</label>
              <input
                type="text"
                value={formData.unit || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="Ví dụ: 1"
                className="w-full px-3 py-2 bg-white border border-slate-300 text-xs rounded-xl outline-none text-slate-900 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Từ Vựng</label>
              <input
                type="text"
                required
                value={formData.vocabulary || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, vocabulary: e.target.value }))}
                placeholder="Vocabulary"
                className="w-full px-3 py-2 bg-white border border-slate-300 text-xs font-bold rounded-xl outline-none text-slate-900 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Phiên Âm (IPA)</label>
              <input
                type="text"
                value={formData.ipa || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, ipa: e.target.value }))}
                placeholder="/.../"
                className="w-full px-3 py-2 bg-white border border-slate-300 text-xs rounded-xl outline-none text-slate-900 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Loại Từ (POS)</label>
              <CustomSelect
                value={String(formData.pos || '')}
                onChange={(val) => setFormData(prev => ({ ...prev, pos: String(val) }))}
                options={posList.map(p => ({ value: p, label: p }))}
                className="w-full text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Mức Độ</label>
              <CustomSelect
                value={String(formData.difficulty || '')}
                onChange={(val) => setFormData(prev => ({ ...prev, difficulty: String(val) }))}
                options={difficultiesList.map(d => ({ value: d, label: d }))}
                className="w-full text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Dịch Nghĩa Tiếng Việt</label>
            <input
              type="text"
              required
              value={formData.meaning || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, meaning: e.target.value }))}
              placeholder="Nghĩa của từ..."
              className="w-full px-3 py-2 bg-white border border-slate-300 text-xs rounded-xl outline-none text-slate-900 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Từ Gốc (Root Word)</label>
            <input
              type="text"
              value={formData.root_word || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, root_word: e.target.value }))}
              placeholder="Từ gốc..."
              className="w-full px-3 py-2 bg-white border border-slate-300 text-xs rounded-xl outline-none text-slate-900 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 mt-2">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={isSaving}
              leftIcon={<Trash2 size={13} />}
            >
              Xóa từ vựng này
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSaving}
                loading={isSaving}
              >
                Lưu Thay Đổi
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
