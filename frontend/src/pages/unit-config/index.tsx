import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { api } from '../../api';
import { Settings, Save, RefreshCw, BookOpen, FileText } from 'lucide-react';
import { showToast } from '../../components/Toast';
import { DataTable } from '../../components/DataTable';
import { ExerciseConfigTab } from './components/ExerciseConfigTab';

interface UnitConfigItem {
  name: string;
  grammar: string;
  grammar_topics?: string[];
}

export default function UnitConfig() {
  const [config, setConfig] = useState<Record<string, Record<string, UnitConfigItem | string>>>({});
  const [loading, setLoading] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('6');
  const [editingKey, setEditingKey] = useState<{ grade: string; unit: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [editGrammar, setEditGrammar] = useState('');
  const [activeGrades, setActiveGrades] = useState<string[]>(['6', '7', '8', '9', '10', '11', '12']);
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'units' | 'exercises'>('units');
  const [exerciseConfig, setExerciseConfig] = useState<Record<string, string>>({});

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
        if (!selectedGrade || !res.grades.includes(selectedGrade)) {
          setSelectedGrade(res.grades[0]);
        }
      }
    } catch {
      // Use fallback grades
    }
  };

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const data: any = await api.getUnitConfig();
      setConfig(data);
    } catch {
      showToast("Không thể tải cấu hình tên Unit", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchExerciseConfig = async () => {
    try {
      const data = await api.getExerciseConfig();
      setExerciseConfig(data);
    } catch {
      showToast("Không thể tải cấu hình tên bài tập", "error");
    }
  };

  const handleSave = async (grade: string, unit: string, nameVal: string, grammarVal: string) => {
    const updated: any = { ...config };
    if (!updated[grade]) updated[grade] = {};
    
    const topics = grammarVal
      .split(/[\n,&/]+/)
      .map(s => s.trim())
      .filter(Boolean);

    updated[grade][unit] = {
      name: nameVal.trim(),
      grammar: grammarVal.trim(),
      grammar_topics: topics
    };

    setLoading(true);
    try {
      await api.saveUnitConfig(updated);
      setConfig(updated);
      setEditingKey(null);
      showToast(`Đã cập nhật Unit ${unit} Lớp ${grade} thành công!`, "success");
    } catch {
      showToast("Không thể lưu cấu hình", "error");
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (grade: string, unit: string, currentName: string, currentGrammar: string) => {
    setEditingKey({ grade, unit });
    setEditName(currentName);
    setEditGrammar(currentGrammar);
  };

  // Build rows for TanStack Table
  const rows = useMemo(() => {
    const list: { key: string; grade: string; unit: string; name: string; grammar: string; grammarTopics: string[] }[] = [];
    const gradeUnits = config[selectedGrade] || {};
    
    Object.entries(gradeUnits).forEach(([unit, val]) => {
      const key = `U${unit}_G${selectedGrade}`;
      const name = typeof val === 'object' && val !== null ? val.name || '' : String(val || '');
      const grammar = typeof val === 'object' && val !== null ? val.grammar || '' : '';
      const rawTopics = typeof val === 'object' && val !== null ? (val as any).grammar_topics : null;
      let grammarTopics: string[] = [];
      if (Array.isArray(rawTopics) && rawTopics.length > 0) {
        grammarTopics = rawTopics;
      } else if (grammar) {
        grammarTopics = grammar.split(/[\n,&/]+/).map(s => s.trim()).filter(Boolean);
      }
      list.push({ key, grade: selectedGrade, unit, name, grammar, grammarTopics });
    });

    list.sort((a, b) => parseInt(a.unit) - parseInt(b.unit));
    return list;
  }, [config, selectedGrade]);

  const unitColumns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'key',
        header: 'Mã',
        cell: (info) => (
          <span className="font-mono font-bold text-indigo-400 text-xs">
            {info.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'unit',
        header: 'Bài Học',
        cell: (info) => (
          <span className="font-black text-white text-xs">
            Unit {info.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Tên Bài Học / Từ Vựng (Topic)',
        cell: ({ row }) => {
          const item = row.original;
          const isEditing = editingKey?.grade === item.grade && editingKey?.unit === item.unit;
          return isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="VD: My New School..."
              className="w-full px-3 py-1.5 bg-[#0c0f1d] border border-blue-500 rounded-lg focus:outline-none text-xs text-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave(item.grade, item.unit, editName, editGrammar);
                if (e.key === 'Escape') setEditingKey(null);
              }}
            />
          ) : (
            <span className="font-bold text-white text-xs">{item.name || '-'}</span>
          );
        },
      },
      {
        accessorKey: 'grammar',
        header: 'Chủ Đề Ngữ Pháp (Nhiều chủ đề ngăn cách bằng dấu phẩy hoặc &)',
        cell: ({ row }) => {
          const item = row.original;
          const isEditing = editingKey?.grade === item.grade && editingKey?.unit === item.unit;
          return isEditing ? (
            <div className="space-y-1">
              <input
                type="text"
                value={editGrammar}
                onChange={(e) => setEditGrammar(e.target.value)}
                placeholder="VD: Present Simple, Adverbs of Frequency..."
                className="w-full px-3 py-1.5 bg-[#0c0f1d] border border-purple-500 rounded-lg focus:outline-none text-xs text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave(item.grade, item.unit, editName, editGrammar);
                  if (e.key === 'Escape') setEditingKey(null);
                }}
              />
              <span className="text-[10px] text-slate-500 block">Nhập nhiều chủ đề cách nhau bằng dấu phẩy (,) hoặc (&) để chọn riêng từng chủ đề khi kiểm tra</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 items-center">
              {item.grammarTopics && item.grammarTopics.length > 0 ? (
                item.grammarTopics.map((gt: string, idx: number) => (
                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-semibold">
                    {gt}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-600 font-normal">Chưa cấu hình</span>
              )}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-center w-full">Thao Tác</div>,
        cell: ({ row }) => {
          const item = row.original;
          const isEditing = editingKey?.grade === item.grade && editingKey?.unit === item.unit;
          return isEditing ? (
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => handleSave(item.grade, item.unit, editName, editGrammar)}
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
                onClick={() => startEditing(item.grade, item.unit, item.name, item.grammar)}
                className="px-3 py-1 bg-[#121626] border border-[#202842] hover:border-indigo-500 text-slate-300 hover:text-white rounded-lg font-bold text-xs transition cursor-pointer"
              >
                Chỉnh sửa
              </button>
            </div>
          );
        },
      },
    ],
    [editingKey, editName, editGrammar]
  );

  return (
    <div className="h-full w-full bg-transparent overflow-y-auto p-6 select-none text-slate-100 flex flex-col gap-6">
      {/* Page Title */}
      <div className="pb-3 border-b border-[#181f36] flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white mb-1 flex items-center gap-2">
            <Settings size={22} className="text-indigo-400" />
            <span>Cấu Hình Tên Unit & Ngữ Pháp Theo Khối Lớp</span>
          </h1>
          <p className="text-xs text-slate-400">
            Quản lý tên bài học và chủ đề ngữ pháp theo từng khối lớp từ 6 đến 12 để phục vụ kiểm tra và xuất tài liệu.
          </p>
        </div>
        <button
          onClick={() => {
            fetchConfig();
            fetchExerciseConfig();
          }}
          disabled={loading}
          className="group flex items-center gap-1.5 px-3.5 py-2 bg-[#121626] border border-[#202842] hover:border-indigo-500 text-slate-300 hover:text-white rounded-xl transition text-xs font-bold cursor-pointer"
          title="Làm mới"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-indigo-400" : ""} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Sub-tabs Segmented Control */}
      <div className="flex bg-[#090d16] p-1 rounded-xl border border-[#1b253b] max-w-md text-xs font-bold">
        <button
          onClick={() => setActiveTab('units')}
          className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'units'
              ? 'bg-[#5c36f5] text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen size={13} />
          <span>Tên Unit & Ngữ Pháp</span>
        </button>
        <button
          onClick={() => setActiveTab('exercises')}
          className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'exercises'
              ? 'bg-[#5c36f5] text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText size={13} />
          <span>Hướng Dẫn Dạng Bài</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'units' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left: Grade Selector */}
          <div className="flex flex-col gap-2 bg-[#0c0f1d] border border-white/10 p-4 rounded-2xl shadow-lg">
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider px-2 mb-2 border-b border-white/5 pb-2 flex items-center gap-1.5">
              <BookOpen size={13} />
              <span>Chọn Khối Lớp</span>
            </h3>
            {activeGrades.map((g) => {
              const uCount = Object.keys(config[g] || {}).length;
              return (
                <button
                  key={g}
                  onClick={() => {
                    setSelectedGrade(g);
                    setEditingKey(null);
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    selectedGrade === g
                      ? 'bg-indigo-600/25 border border-indigo-500 text-white font-black shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>Khối Lớp {g}</span>
                  <span className="text-[11px] bg-[#121626] border border-[#202842] px-2 py-0.5 rounded-md text-slate-300 font-mono">
                    {uCount} Unit
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Unit Table */}
          <div className="lg:col-span-3 flex flex-col gap-4 bg-[#0c0f1d] border border-white/10 p-5 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">
                  Danh Sách Unit Khối Lớp {selectedGrade}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bấm "Chỉnh sửa" để đổi tên chủ đề bài học hoặc cập nhật chủ đề ngữ pháp cho từng Unit.
                </p>
              </div>
              <span className="text-xs bg-[#121626] border border-[#202842] px-3 py-1 rounded-xl text-indigo-300 font-bold">
                {rows.length} Bài Học
              </span>
            </div>

            <DataTable
              tableId="unit-config-units-table"
              exportFilename={`cau_hinh_unit_lop_${selectedGrade}`}
              data={rows}
              columns={unitColumns}
              emptyMessage={`Chưa có bài học nào cho Khối Lớp ${selectedGrade}.`}
              pageSize={20}
              searchPlaceholder="Tìm kiếm bài học, chủ đề ngữ pháp..."
            />
          </div>
        </div>
      ) : (
        <ExerciseConfigTab
          exerciseConfig={exerciseConfig}
          onRefresh={fetchExerciseConfig}
        />
      )}
    </div>
  );
}
