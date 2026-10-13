import React from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { CustomSelect } from '../../../components/CustomSelect';
import { Button } from '../../../components/button';

interface VocabScopedDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  scope: 'all' | 'grade' | 'unit';
  onChangeScope: (scope: 'all' | 'grade' | 'unit') => void;
  grade: string;
  onChangeGrade: (grade: string) => void;
  unit: string;
  onChangeUnit: (unit: string) => void;
  onConfirm: () => void;
  loading: boolean;
  availableGrades: string[];
}

export const VocabScopedDeleteModal: React.FC<VocabScopedDeleteModalProps> = ({
  isOpen,
  onClose,
  scope,
  onChangeScope,
  grade,
  onChangeGrade,
  unit,
  onChangeUnit,
  onConfirm,
  loading,
  availableGrades,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in p-4">
      <div className="w-full max-w-md bg-white border-0 rounded-2xl shadow-xl p-6 flex flex-col gap-4 text-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Trash2 size={16} className="text-rose-500" />
            Xóa Dữ Liệu Từ Vựng
          </h3>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-1"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold text-slate-600">Chọn phạm vi muốn xóa:</label>

          <SegmentedControl<'all' | 'grade' | 'unit'>
            value={scope}
            onChange={onChangeScope}
            options={[
              { value: 'all', label: 'Toàn bộ' },
              { value: 'grade', label: 'Theo Lớp' },
              { value: 'unit', label: 'Lớp & Unit' },
            ]}
            fit="fluid"
            size="sm"
          />

          {scope !== 'all' && (
            <div className="flex flex-col gap-3.5 bg-slate-50 border-0 rounded-xl p-3.5 mt-1.5 shadow-2xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Chọn Khối lớp:</label>
                <CustomSelect
                  value={grade}
                  onChange={(val) => onChangeGrade(String(val))}
                  options={[
                    { value: '', label: '-- Chọn lớp --' },
                    ...availableGrades.map(g => ({ value: g, label: `Lớp ${g}` }))
                  ]}
                  className="w-full text-xs"
                />
              </div>

              {scope === 'unit' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nhập số Unit (Ví dụ: 1 hoặc 2):</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => onChangeUnit(e.target.value)}
                    placeholder="Số Unit"
                    className="bg-white border border-slate-300 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 w-full"
                  />
                </div>
              )}
            </div>
          )}

          <div className="p-3 bg-amber-50 border-0 rounded-xl text-[10px] text-amber-700 leading-relaxed mt-1 flex gap-2 shadow-2xs">
            <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-600" />
            <span>
              <strong>Lưu ý:</strong> Hành động xóa dữ liệu này là vĩnh viễn và không thể khôi phục lại. Bạn nên xuất file dự phòng trước khi xóa.
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 mt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            loading={loading}
          >
            {loading ? 'Đang xóa...' : 'Xác Nhận Xóa'}
          </Button>
        </div>
      </div>
    </div>
  );
};
