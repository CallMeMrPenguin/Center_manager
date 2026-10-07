import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { GradeTypeItem } from '../../../types';
import { showToast } from '../../../components/Toast';

interface GradeTypesCardProps {
  gradeTypes: GradeTypeItem[];
  setGradeTypes: React.Dispatch<React.SetStateAction<GradeTypeItem[]>>;
  onSave: () => void;
}

export const GradeTypesCard: React.FC<GradeTypesCardProps> = ({
  gradeTypes,
  setGradeTypes,
  onSave,
}) => {
  const [newGradeLabel, setNewGradeLabel] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAutoRebalance = () => {
    if (gradeTypes.length === 0) return;
    const equalWeight = Number((100 / gradeTypes.length).toFixed(1));
    let currentSum = 0;
    const rebalanced = gradeTypes.map((gt, idx) => {
      if (idx === gradeTypes.length - 1) {
        const lastW = Number((100 - currentSum).toFixed(1));
        return { ...gt, weight: Math.max(0, lastW) };
      }
      currentSum += equalWeight;
      return { ...gt, weight: equalWeight };
    });
    setGradeTypes(rebalanced);
    showToast('Đã tự động cân bằng các trọng số', 'success');
  };

  const handleAddGradeType = () => {
    if (!newGradeLabel.trim()) {
      showToast('Vui lòng nhập tên loại điểm mới', 'warning');
      return;
    }
    const cleanLabel = newGradeLabel.trim();
    const cleanId = cleanLabel.toLowerCase().replace(/[^a-z0-9]/g, '_') || `grade_${Date.now()}`;
    if (gradeTypes.some((gt) => gt.id === cleanId)) {
      showToast('Loại điểm này đã tồn tại', 'warning');
      return;
    }
    const colors = ['#3b82f6', '#a855f7', '#f59e0b', '#10b981', '#ec4899', '#06b6d4', '#f97316'];
    const assignedColor = colors[gradeTypes.length % colors.length];
    const updated = [...gradeTypes, { id: cleanId, label: cleanLabel, weight: 0, color: assignedColor }];
    setGradeTypes(updated);
    setNewGradeLabel('');
    setShowAddModal(false);
    showToast(`Đã thêm '${cleanLabel}'`, 'success');
  };

  const handleRemoveGradeType = (id: string) => {
    if (gradeTypes.length <= 1) {
      showToast('Phải duy trì ít nhất 1 loại điểm', 'warning');
      return;
    }
    setGradeTypes((prev) => prev.filter((gt) => gt.id !== id));
    showToast('Đã xóa loại điểm', 'warning');
  };

  const currentTotal = gradeTypes.reduce((acc, c) => acc + (Number(c.weight) || 0), 0);

  return (
    <div className="bg-white dark:bg-[#141417] rounded-2xl p-6 flex flex-col gap-4 shadow-xs dark:shadow-none border border-slate-200 dark:border-[#27272a]">
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-3 flex-wrap gap-2">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Phân loại điểm & Trọng số
        </h3>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
              Math.abs(currentTotal - 100) < 0.1
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            }`}
          >
            Tổng: {currentTotal.toFixed(1)}%
          </span>
          <button
            type="button"
            onClick={handleAutoRebalance}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10 text-xs font-semibold transition cursor-pointer"
            title="Tự động chia đều trọng số cho tất cả loại điểm"
          >
            Tự động cân bằng
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400">
        Thiết lập trọng số % để tính điểm tổng kết và theo dõi tiến độ học tập.
      </p>

      <div className="flex flex-col gap-3">
        {gradeTypes.map((gt, idx) => (
          <div
            key={gt.id || idx}
            className="flex items-center gap-3 bg-slate-50 dark:bg-[#1c1c21] p-3 rounded-xl border border-slate-200 dark:border-[#27272a]"
          >
            <div className="w-3 h-8 rounded-lg shrink-0" style={{ backgroundColor: gt.color || '#3b82f6' }} />
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tên loại điểm</span>
                <input
                  type="text"
                  value={gt.label}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGradeTypes((prev) => prev.map((item, i) => (i === idx ? { ...item, label: val } : item)));
                  }}
                  className="bg-white dark:bg-[#121626] border border-slate-300 dark:border-[#283558] px-3 py-1.5 rounded-lg text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-500 w-full"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Trọng số (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={gt.weight}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setGradeTypes((prev) => prev.map((item, i) => (i === idx ? { ...item, weight: val } : item)));
                  }}
                  className="bg-white dark:bg-[#121626] border border-slate-300 dark:border-[#283558] px-3 py-1.5 rounded-lg text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-500 w-full"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveGradeType(gt.id)}
              className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg transition border border-rose-200 dark:border-rose-500/25 shrink-0 cursor-pointer"
              title="Xóa loại điểm này"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {showAddModal ? (
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#0d1222] p-3 rounded-xl border border-slate-300 dark:border-white/10">
          <input
            type="text"
            placeholder="Nhập tên loại điểm mới (VD: Kiểm tra miệng, Chuyên cần...)"
            value={newGradeLabel}
            onChange={(e) => setNewGradeLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddGradeType()}
            className="bg-white dark:bg-[#121626] border border-slate-300 dark:border-[#283558] px-3 py-2 rounded-lg text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-500 flex-1"
            autoFocus
          />
          <button
            type="button"
            onClick={handleAddGradeType}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition cursor-pointer"
          >
            Thêm
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(false)}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg transition cursor-pointer"
          >
            Hủy
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-800 hover:border-slate-400 bg-slate-50/50 dark:bg-[#0b0f19]/50 text-slate-600 dark:text-slate-400 font-semibold text-xs rounded-xl transition cursor-pointer"
        >
          + Thêm loại điểm mới
        </button>
      )}

      <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-white/10">
        <button
          type="button"
          onClick={onSave}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer"
        >
          Lưu trọng số
        </button>
      </div>
    </div>
  );
};
