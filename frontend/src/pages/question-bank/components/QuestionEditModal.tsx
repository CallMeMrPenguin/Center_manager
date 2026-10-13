import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { DbQuestion } from '../../../types';
import { CustomSelect } from '../../../components/CustomSelect';
import { TYPE_MAP, DIFFICULTY_LEVELS } from '../constants';

interface QuestionEditModalProps {
  question: DbQuestion | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, data: Partial<DbQuestion>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  availableGrades: string[];
}

export const QuestionEditModal: React.FC<QuestionEditModalProps> = ({
  question,
  isOpen,
  onClose,
  onSave,
  onDelete,
  availableGrades,
}) => {
  const [formData, setFormData] = useState<Partial<DbQuestion>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (question) {
      setFormData({
        grade: question.grade || '',
        unit: question.unit || '',
        t: question.t || 'mq',
        x: question.x || '',
        o: [...(question.o || ['', '', '', ''])],
        a: question.a || 'A',
        level: question.level || 'NHẬN BIẾT',
        frequency: question.frequency || '0',
      });
    }
  }, [question]);

  if (!isOpen || !question) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(question.id, formData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!question.id) return;
    setIsSaving(true);
    try {
      await onDelete(question.id);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-slate-800 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Chỉnh Sửa Câu Hỏi
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              ID #{question.id} | Dạng: {TYPE_MAP[question.t] || question.t}
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
          <div className="grid grid-cols-3 gap-3">
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
              <label className="text-[10px] font-bold text-slate-500 uppercase">Unit</label>
              <input
                type="text"
                value={formData.unit || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="1"
                className="w-full px-3 py-2 bg-white border border-slate-300 text-xs rounded-xl outline-none text-slate-900 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Dạng bài</label>
              <CustomSelect
                value={String(formData.t || 'mq')}
                onChange={(val) => setFormData(prev => ({ ...prev, t: String(val) }))}
                options={Object.entries(TYPE_MAP).map(([k, v]) => ({ value: k, label: v }))}
                className="w-full text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Nội dung câu hỏi</label>
            <textarea
              required
              rows={3}
              value={formData.x || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, x: e.target.value }))}
              placeholder="Nhập nội dung câu hỏi..."
              className="w-full px-3 py-2 bg-white border border-slate-300 text-xs font-medium rounded-xl outline-none text-slate-900 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Các tùy chọn trả lời (A, B, C, D)</label>
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((optIdx) => {
                const letter = String.fromCharCode(65 + optIdx);
                return (
                  <div key={optIdx} className="flex items-center gap-2">
                    <span className="w-5 text-center font-bold text-xs text-blue-600">{letter}.</span>
                    <input
                      type="text"
                      value={formData.o?.[optIdx] || ''}
                      onChange={(e) => {
                        const newOpts = [...(formData.o || ['', '', '', ''])];
                        newOpts[optIdx] = e.target.value;
                        setFormData(prev => ({ ...prev, o: newOpts }));
                      }}
                      placeholder={`Lựa chọn ${letter}`}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 text-xs rounded-lg outline-none text-slate-900 focus:border-blue-500"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Đáp án đúng</label>
              <CustomSelect
                value={String(formData.a || 'A')}
                onChange={(val) => setFormData(prev => ({ ...prev, a: String(val) }))}
                options={['A', 'B', 'C', 'D'].map(l => ({ value: l, label: `Đáp án ${l}` }))}
                className="w-full text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Độ khó</label>
              <CustomSelect
                value={String(formData.level || 'NHẬN BIẾT')}
                onChange={(val) => setFormData(prev => ({ ...prev, level: String(val) }))}
                options={DIFFICULTY_LEVELS.map(lvl => ({ value: lvl, label: lvl }))}
                className="w-full text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Tần suất dùng</label>
              <input
                type="number"
                min={0}
                value={formData.frequency || '0'}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-300 text-xs rounded-xl outline-none text-slate-900 focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 mt-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition cursor-pointer border border-rose-200"
            >
              <Trash2 size={13} />
              <span>Xóa câu hỏi này</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
