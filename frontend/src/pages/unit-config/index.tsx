import { useState, useEffect, useMemo } from 'react';
import {
  ColumnDef
} from '@tanstack/react-table';
import { api } from '../../api';
import { Settings, Save, RefreshCw, BookOpen, Check, X, FileText } from 'lucide-react';
import { showToast } from '../../components/Toast';
import { DataTable } from '../../components/DataTable';

const EXERCISE_TYPE_LABELS: Record<string, string> = {
  "pr": "Pronunciation (Phát âm)",
  "st": "Stress (Trọng âm)",
  "mq": "Multiple Choice (Trắc nghiệm tổng hợp)",
  "sy": "Synonym (Từ đồng nghĩa)",
  "an": "Antonym (Từ trái nghĩa)",
  "sg": "Sign (Biển báo)",
  "nt": "Notice (Thông báo)",
  "cz": "Cloze Passage (Điền từ đoạn văn)",
  "ro": "Reordering (Sắp xếp câu)",
  "rd": "Reading (Đọc hiểu)",
  "er": "Error Identification (Tìm lỗi sai)"
};

export default function UnitConfig() {
  const [config, setConfig] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('6');
  const [editingKey, setEditingKey] = useState<{ grade: string; unit: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [activeGrades, setActiveGrades] = useState<string[]>([]);
  
  // Exercise config states
  const [activeTab, setActiveTab] = useState<'units' | 'exercises'>('units');
  const [exerciseConfig, setExerciseConfig] = useState<Record<string, string>>({});
  const [editingExerciseKey, setEditingExerciseKey] = useState<string | null>(null);
  const [editExerciseValue, setEditExerciseValue] = useState('');

  useEffect(() => {
    fetchConfig();
    fetchActiveGrades();
    fetchExerciseConfig();
  }, []);

  const fetchActiveGrades = async () => {
    try {
      const res = await api.getActiveGrades();
      if (res.success && res.grades.length > 0) {
        setActiveGrades(res.grades);
        setSelectedGrade(res.grades[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const data = await api.getUnitConfig();
      setConfig(data);
    } catch (e) {
      showToast("Không thể tải cấu hình tên Unit", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchExerciseConfig = async () => {
    try {
      const data = await api.getExerciseConfig();
      setExerciseConfig(data);
    } catch (e) {
      console.error(e);
      showToast("Không thể tải cấu hình tên bài tập", "error");
    }
  };

  const handleSave = async (grade: string, unit: string, val: string) => {
    const updated = { ...config };
    if (!updated[grade]) updated[grade] = {};
    updated[grade][unit] = val.trim();

    setLoading(true);
    try {
      await api.saveUnitConfig(updated);
      setConfig(updated);
      setEditingKey(null);
      showToast(`Đã cập nhật tên Unit U${unit}_G${grade} thành công!`, "success");
    } catch (e) {
      showToast("Không thể lưu cấu hình", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExercise = async (key: string, val: string) => {
    const updated = { ...exerciseConfig, [key]: val.trim() };
    setLoading(true);
    try {
      await api.saveExerciseConfig(updated);
      setExerciseConfig(updated);
      setEditingExerciseKey(null);
      showToast(`Đã cập nhật hướng dẫn dạng bài thành công!`, "success");
    } catch (e) {
      showToast("Không thể lưu cấu hình hướng dẫn", "error");
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (grade: string, unit: string, currentValue: string) => {
    setEditingKey({ grade, unit });
    setEditValue(currentValue);
  };

  // Build the list of rows for the current view (no manual search — DataTable handles it)
  const rows: { key: string; grade: string; unit: string; name: string }[] = [];
  Object.entries(config).forEach(([grade, units]) => {
    if (grade === selectedGrade) {
      Object.entries(units).forEach(([unit, name]) => {
        const key = `U${unit}_G${grade}`;
        rows.push({ key, grade, unit, name });
      });
    }
  });

  // Sort rows by unit number ascending
  rows.sort((a, b) => parseInt(a.unit) - parseInt(b.unit));

  return (
    <div className="h-full w-full bg-transparent overflow-y-auto px-8 py-6 select-none text-slate-200 flex flex-col gap-6">
      
      {/* Page Title */}
      <div className="pb-2 border-b border-slate-900 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white mb-1 flex items-center gap-2">
            <Settings size={20} className="text-blue-500" />
            {activeTab === 'units' ? 'Cấu Hình Tên Unit Theo Lớp' : 'Cấu Hình Hướng Dẫn Dạng Bài'}
          </h1>
          <p className="text-xs text-slate-400">
            {activeTab === 'units' 
              ? 'Quản lý tên các bài học (Unit) theo khối lớp từ 6 đến 12. Tên này sẽ tự động được áp dụng khi xuất tài liệu hoặc từ vựng.'
              : 'Quản lý câu hướng dẫn (instruction header) tương ứng với từng dạng bài viết. Thay đổi này sẽ hiển thị ở tiêu đề từng phần khi xuất đề thi.'}
          </p>
        </div>
        <button
          onClick={() => {
            fetchConfig();
            fetchExerciseConfig();
          }}
          disabled={loading}
          className="group flex items-center gap-0 hover:gap-1.5 p-2 bg-slate-900 border border-slate-800 hover:bg-gradient-to-tr hover:from-blue-600/10 hover:to-indigo-600/10 hover:border-blue-500/30 text-slate-400 hover:text-white rounded-xl transition-all duration-300 text-xs font-bold cursor-pointer shadow-sm"
          title="Làm mới"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-300 whitespace-nowrap block">Làm mới</span>
        </button>
      </div>

      {/* Sleek Sub-tabs Segment Control */}
      <div className="flex gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-900/60 max-w-md">
        <button
          onClick={() => setActiveTab('units')}
          className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'units'
              ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 shadow-sm'
              : 'text-slate-450 hover:text-slate-200'
          }`}
        >
          <BookOpen size={13} />
          <span>Cấu hình Tên Unit</span>
        </button>
        <button
          onClick={() => setActiveTab('exercises')}
          className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'exercises'
              ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 shadow-sm'
              : 'text-slate-450 hover:text-slate-200'
          }`}
        >
          <FileText size={13} />
          <span>Hướng dẫn Dạng Bài</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'units' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Left Side: Grade Selection Tabs */}
          <div className="flex flex-col gap-2 glass-panel p-4">
            <h3 className="text-[0.66rem] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2 border-b border-slate-900 pb-1.5 flex items-center gap-1.5">
              <BookOpen size={12} className="text-blue-450" /> Chọn Khối Lớp
            </h3>
            {activeGrades.map(g => (
              <button
                key={g}
                onClick={() => {
                  setSelectedGrade(g);
                  setEditingKey(null);
                }}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                  selectedGrade === g
                    ? 'bg-blue-600/15 border border-blue-500/25 text-blue-400 font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                }`}
              >
                <span>Lớp {g}</span>
                <span className="text-[0.66rem] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-md text-slate-500 font-mono">
                  {Object.keys(config[g] || {}).length} Unit
                </span>
              </button>
            ))}
          </div>

          {/* Right Side: Unit Table */}
          <div className="lg:col-span-3 flex flex-col gap-4 glass-panel p-5">
            
            {/* Table 1: Units */}
            <div className="border border-slate-900 rounded-xl overflow-hidden max-h-[500px] flex flex-col">
              {(() => {
                const unitColumns: ColumnDef<any>[] = [
                  {
                    accessorKey: 'key',
                    header: 'Unit_Grade',
                    cell: (info) => <span className="font-mono font-bold text-slate-450">{info.getValue<string>()}</span>,
                  },
                  {
                    accessorKey: 'unit',
                    header: 'Unit',
                    cell: (info) => <span className="font-bold text-white">Unit {info.getValue<string>()}</span>,
                  },
                  {
                    accessorKey: 'name',
                    header: 'Tên Unit',
                    cell: ({ row }) => {
                      const rowItem = row.original;
                      const isEditing = editingKey?.grade === rowItem.grade && editingKey?.unit === rowItem.unit;
                      return isEditing ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full px-3 py-1 bg-[#080b12] border border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 text-xs text-white"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave(rowItem.grade, rowItem.unit, editValue);
                            if (e.key === 'Escape') setEditingKey(null);
                          }}
                        />
                      ) : (
                        <span className="font-semibold text-slate-200">{rowItem.name || '-'}</span>
                      );
                    },
                  },
                  {
                    id: 'actions',
                    header: () => <div className="text-center w-full">Hành động</div>,
                    cell: ({ row }) => {
                      const rowItem = row.original;
                      const isEditing = editingKey?.grade === rowItem.grade && editingKey?.unit === rowItem.unit;
                      return isEditing ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleSave(rowItem.grade, rowItem.unit, editValue)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[0.66rem] flex items-center gap-1 cursor-pointer"
                          >
                            <Save size={10} /> Lưu
                          </button>
                          <button
                            onClick={() => setEditingKey(null)}
                            className="px-2 py-1 bg-[#151f32] hover:bg-slate-800 text-slate-400 rounded font-bold text-[0.66rem] cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <button
                            onClick={() => startEditing(rowItem.grade, rowItem.unit, rowItem.name)}
                            className="px-3 py-1 bg-slate-900 border border-slate-800 hover:bg-gradient-to-tr hover:from-blue-600/10 hover:to-indigo-600/10 hover:border-blue-500/30 text-slate-350 hover:text-white rounded-lg font-bold text-[0.66rem] cursor-pointer transition-all duration-300 shadow-sm"
                          >
                            Chỉnh sửa
                          </button>
                        </div>
                      );
                    },
                  },
                ];

                return (
                  <DataTable
                    data={rows}
                    columns={unitColumns}
                    emptyMessage="Không tìm thấy bài học nào phù hợp."
                    pageSize={20}
                  />
                );
              })()}
            </div>

          </div>

        </div>
      ) : (
        /* Exercise config view */
        <div className="flex flex-col gap-4 glass-panel p-5 w-full">
          <div className="flex justify-between items-center border-b border-slate-900/60 pb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase">Cấu hình tiêu đề hướng dẫn dạng bài</h3>
              <p className="text-[0.66rem] text-slate-500 mt-0.5">Tiêu đề này sẽ được in ở đầu mỗi phần bài tập trong tệp Word đề thi khi biên dịch.</p>
            </div>
            <span className="text-[0.66rem] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-md text-slate-400 font-bold uppercase">
              {Object.keys(EXERCISE_TYPE_LABELS).length} Dạng Bài
            </span>
          </div>

          <div className="border border-slate-900 rounded-xl overflow-hidden max-h-[500px] flex flex-col">
            {(() => {
              const exerciseData = Object.entries(EXERCISE_TYPE_LABELS).map(([key, label]) => ({
                key,
                label,
                instruction: exerciseConfig[key] || '',
              }));

              const exerciseColumns: ColumnDef<any>[] = [
                {
                  accessorKey: 'key',
                  header: 'Ký hiệu (Code)',
                  cell: (info) => <span className="font-mono font-bold text-blue-450">{info.getValue<string>()}</span>,
                },
                {
                  accessorKey: 'label',
                  header: 'Tên dạng bài',
                  cell: (info) => <span className="font-bold text-white">{info.getValue<string>()}</span>,
                },
                {
                  accessorKey: 'instruction',
                  header: 'Nội dung hướng dẫn dạng bài (Instruction Text)',
                  cell: ({ row }) => {
                    const key = row.original.key;
                    const isEditing = editingExerciseKey === key;
                    return isEditing ? (
                      <input
                        type="text"
                        value={editExerciseValue}
                        onChange={(e) => setEditExerciseValue(e.target.value)}
                        className="w-full px-3 py-1 bg-[#080b12] border border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 text-xs text-white"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveExercise(key, editExerciseValue);
                          if (e.key === 'Escape') setEditingExerciseKey(null);
                        }}
                      />
                    ) : (
                      <span className="font-semibold text-slate-300 break-words leading-relaxed">{row.original.instruction || '-'}</span>
                    );
                  },
                },
                {
                  id: 'actions',
                  header: () => <div className="text-center w-full">Hành động</div>,
                  cell: ({ row }) => {
                    const key = row.original.key;
                    const isEditing = editingExerciseKey === key;
                    return isEditing ? (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleSaveExercise(key, editExerciseValue)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[0.66rem] flex items-center gap-1 cursor-pointer"
                        >
                          <Save size={10} /> Lưu
                        </button>
                        <button
                          onClick={() => setEditingExerciseKey(null)}
                          className="px-2 py-1 bg-[#151f32] hover:bg-slate-800 text-slate-400 rounded font-bold text-[0.66rem] cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <button
                          onClick={() => {
                            setEditingExerciseKey(key);
                            setEditExerciseValue(row.original.instruction);
                          }}
                          className="px-3 py-1 bg-slate-900 border border-slate-800 hover:bg-gradient-to-tr hover:from-blue-600/10 hover:to-indigo-600/10 hover:border-blue-500/30 text-slate-350 hover:text-white rounded-lg font-bold text-[0.66rem] cursor-pointer transition-all duration-300 shadow-sm"
                        >
                          Chỉnh sửa
                        </button>
                      </div>
                    );
                  },
                },
              ];

              return (
                <DataTable
                  data={exerciseData}
                  columns={exerciseColumns}
                  pageSize={20}
                />
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}

