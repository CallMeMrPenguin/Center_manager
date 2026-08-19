import React, { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../components/DataTable';
import { Save, RefreshCw } from 'lucide-react';
import { api } from '../../../api';
import { showToast } from '../../../components/Toast';

export const EXERCISE_TYPE_LABELS: Record<string, string> = {
  "pr": "Pronunciation (Phát âm)",
  "st": "Stress (Trọng âm)",
  "sy": "Synonym (Từ đồng nghĩa)",
  "an": "Antonym (Từ trái nghĩa)",
  "sg": "Sign (Biển báo)",
  "nt": "Notice (Thông báo)",
  "cz": "Cloze Passage (Điền từ đoạn văn)",
  "ro": "Reordering (Sắp xếp câu)",
  "rd": "Reading (Đọc hiểu)",
  "er": "Error Identification (Tìm lỗi sai)",
  "fb": "Fill in the Blank (Điền vào chỗ trống)",
  "rw": "Rewrite Sentences (Viết lại câu)"
};

interface ExerciseConfigTabProps {
  exerciseConfig: Record<string, string>;
  onRefresh: () => void;
}

export const ExerciseConfigTab: React.FC<ExerciseConfigTabProps> = ({
  exerciseConfig,
  onRefresh,
}) => {
  const [config, setConfig] = useState<Record<string, string>>(exerciseConfig);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setConfig(exerciseConfig);
  }, [exerciseConfig]);

  const handleSave = async (key: string, val: string) => {
    const updated = { ...config, [key]: val.trim() };
    setSaving(true);
    try {
      await api.saveExerciseConfig(updated);
      setConfig(updated);
      setEditingKey(null);
      showToast("Đã cập nhật hướng dẫn dạng bài thành công!", "success");
      onRefresh();
    } catch (e: any) {
      showToast("Không thể lưu cấu hình hướng dẫn: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const exerciseRows = useMemo(() => {
    return Object.entries(EXERCISE_TYPE_LABELS).map(([code, label]) => ({
      code,
      label,
      instruction: config[code] || "",
    }));
  }, [config]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Mã Dạng',
        cell: (info) => (
          <span className="font-mono font-bold text-indigo-400 uppercase text-xs">
            {info.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'label',
        header: 'Tên Dạng Bài',
        cell: (info) => (
          <span className="font-bold text-white text-xs">{info.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'instruction',
        header: 'Tiêu Đề Hướng Dẫn In Ra Đề Thi',
        cell: ({ row }) => {
          const item = row.original;
          const isEditing = editingKey === item.code;
          return isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#0c0f1d] border border-indigo-500 rounded-lg focus:outline-none text-xs text-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave(item.code, editValue);
                if (e.key === 'Escape') setEditingKey(null);
              }}
            />
          ) : (
            <span className="text-xs text-slate-300 italic font-medium">
              {item.instruction || <span className="text-slate-600">(Mặc định hệ thống)</span>}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-center w-full">Thao Tác</div>,
        cell: ({ row }) => {
          const item = row.original;
          const isEditing = editingKey === item.code;
          return isEditing ? (
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => handleSave(item.code, editValue)}
                disabled={saving}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Save size={12} />
                <span>Lưu</span>
              </button>
              <button
                onClick={() => setEditingKey(null)}
                className="px-2.5 py-1 bg-[#151f32] hover:bg-slate-800 text-slate-400 rounded-lg font-bold text-xs cursor-pointer"
              >
                Hủy
              </button>
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={() => {
                  setEditingKey(item.code);
                  setEditValue(item.instruction);
                }}
                className="px-3 py-1 bg-[#121626] border border-[#202842] hover:border-indigo-500 text-slate-300 hover:text-white rounded-lg font-bold text-xs transition cursor-pointer"
              >
                Chỉnh sửa
              </button>
            </div>
          );
        },
      },
    ],
    [editingKey, editValue, saving, config]
  );

  return (
    <div className="flex flex-col gap-4 bg-[#0c0f1d] border border-white/10 p-5 rounded-2xl w-full shadow-lg">
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Cấu Hình Tiêu Đề Hướng Dẫn Dạng Bài
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Tiêu đề này sẽ được in ở đầu mỗi phần bài tập trong đề thi và tài liệu khi xuất file.
          </p>
        </div>
        <span className="text-xs bg-[#121626] border border-[#202842] px-3 py-1 rounded-xl text-slate-300 font-bold">
          {Object.keys(EXERCISE_TYPE_LABELS).length} Dạng Bài
        </span>
      </div>

      <DataTable
        tableId="exercise-config-table"
        data={exerciseRows}
        columns={columns}
        pageSize={10}
        searchPlaceholder="Tìm mã dạng, tên dạng bài..."
        exportFilename="cau_hinh_dang_bai"
      />
    </div>
  );
};
