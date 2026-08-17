import React, { useState, useEffect } from 'react';
import { X, Layers, Save, Plus, Check } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import { api } from '../api';
import { showToast } from './Toast';

export interface TestConfigItemData {
  skill: string; // 'vocab' | 'grammar' | 'mixed'
  units: string[];
  topic: string;
  grammar_topic: string;
}

export interface SessionTestConfigData {
  mode: string; // 'two_separate' | 'single_split'
  check_1: TestConfigItemData;
  check_2: TestConfigItemData;
  notes: string;
}

interface TestConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  date: string;
  grade?: string;
  onSaved?: (config: SessionTestConfigData) => void;
}

const DEFAULT_CONFIG: SessionTestConfigData = {
  mode: 'two_separate',
  check_1: {
    skill: 'vocab',
    units: ['Unit 1'],
    topic: '',
    grammar_topic: '',
  },
  check_2: {
    skill: 'grammar',
    units: ['Unit 1'],
    topic: '',
    grammar_topic: 'Present Simple',
  },
  notes: '',
};

export const TestConfigModal: React.FC<TestConfigModalProps> = ({
  isOpen,
  onClose,
  classId,
  date,
  grade,
  onSaved,
}) => {
  const [config, setConfig] = useState<SessionTestConfigData>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unitSuggestions, setUnitSuggestions] = useState<string[]>([]);
  const [grammarSuggestions, setGrammarSuggestions] = useState<string[]>([]);
  const [customUnitInput1, setCustomUnitInput1] = useState('');
  const [customUnitInput2, setCustomUnitInput2] = useState('');

  useEffect(() => {
    if (isOpen && classId && date) {
      setLoading(true);
      Promise.all([
        api.getSessionTestConfig(classId, date),
        api.getUnitSuggestions(grade),
      ])
        .then(([resConfig, resSugg]) => {
          if (resConfig?.test_config) {
            setConfig({
              mode: resConfig.test_config.mode || 'two_separate',
              check_1: {
                skill: resConfig.test_config.check_1?.skill || 'vocab',
                units: resConfig.test_config.check_1?.units || [],
                topic: resConfig.test_config.check_1?.topic || '',
                grammar_topic: resConfig.test_config.check_1?.grammar_topic || '',
              },
              check_2: {
                skill: resConfig.test_config.check_2?.skill || 'grammar',
                units: resConfig.test_config.check_2?.units || [],
                topic: resConfig.test_config.check_2?.topic || '',
                grammar_topic: resConfig.test_config.check_2?.grammar_topic || '',
              },
              notes: resConfig.test_config.notes || '',
            });
          } else {
            setConfig(DEFAULT_CONFIG);
          }

          if (resSugg) {
            setUnitSuggestions(resSugg.units || []);
            setGrammarSuggestions(resSugg.grammar_topics || []);
          }
        })
        .catch(() => {
          setConfig(DEFAULT_CONFIG);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, classId, date, grade]);

  if (!isOpen) return null;

  const handleToggleUnit = (part: 'check_1' | 'check_2', unitName: string) => {
    setConfig((prev) => {
      const currentUnits = prev[part].units || [];
      const exists = currentUnits.includes(unitName);
      const nextUnits = exists
        ? currentUnits.filter((u) => u !== unitName)
        : [...currentUnits, unitName];
      return {
        ...prev,
        [part]: {
          ...prev[part],
          units: nextUnits,
        },
      };
    });
  };

  const handleAddCustomUnit = (part: 'check_1' | 'check_2') => {
    const val = part === 'check_1' ? customUnitInput1.trim() : customUnitInput2.trim();
    if (!val) return;
    handleToggleUnit(part, val);
    if (part === 'check_1') setCustomUnitInput1('');
    else setCustomUnitInput2('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveSessionTestConfig(classId, {
        date,
        class_id: classId,
        mode: config.mode,
        check_1: config.check_1,
        check_2: config.check_2,
        notes: config.notes,
      });
      showToast('Đã lưu cấu hình bài kiểm tra cho buổi học.', 'success');
      if (onSaved) onSaved(config);
      onClose();
    } catch (err: any) {
      showToast('Lỗi lưu cấu hình bài kiểm tra: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const skillOptions = [
    { value: 'vocab', label: 'Từ Vựng (Vocabulary)' },
    { value: 'grammar', label: 'Ngữ Pháp (Grammar)' },
    { value: 'mixed', label: 'Tổng Hợp (Mixed)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 select-none">
      <div className="bg-[#0c0f1d] border border-[#212c4b] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121626]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Cấu Hình Bài Kiểm Tra</h2>
              <span className="text-xs text-slate-400">
                Buổi học ngày: <strong className="text-indigo-300">{date}</strong>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs font-bold">
              Đang tải cấu hình...
            </div>
          ) : (
            <>
              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">Hình Thức Kiểm Tra</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setConfig((p) => ({ ...p, mode: 'two_separate' }))}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      config.mode === 'two_separate'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                        : 'bg-[#121626] border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-black">2 Bài Test Riêng Biệt</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Check 1 và Check 2 là 2 bài test với nội dung khác nhau.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig((p) => ({ ...p, mode: 'single_split' }))}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      config.mode === 'single_split'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                        : 'bg-[#121626] border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-black">1 Bài Test Lớn (2 Phần)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Check 1 là Phần 1, Check 2 là Điểm Toàn Bài.
                    </div>
                  </button>
                </div>
              </div>

              {/* CHECK 1 CONFIG */}
              <div className="bg-[#121626] border border-white/5 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-400">
                    Cấu Hình Check 1
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {config.mode === 'single_split' ? 'Phần 1' : 'Bài Kiểm Tra 1'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Kỹ Năng Đánh Giá
                    </label>
                    <CustomSelect
                      value={config.check_1.skill}
                      onChange={(val) =>
                        setConfig((p) => ({
                          ...p,
                          check_1: { ...p.check_1, skill: String(val) },
                        }))
                      }
                      options={skillOptions}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Chủ Đề / Nội Dung Cụ Thể
                    </label>
                    <input
                      type="text"
                      value={config.check_1.topic}
                      onChange={(e) =>
                        setConfig((p) => ({
                          ...p,
                          check_1: { ...p.check_1, topic: e.target.value },
                        }))
                      }
                      placeholder="VD: Family, Friends, School..."
                      className="w-full bg-[#0c0f1d] border border-[#212c4b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Unit / Lessons Tag Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    Bài Học / Units Áp Dụng (Chọn một hoặc nhiều)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {unitSuggestions.slice(0, 10).map((u) => {
                      const selected = config.check_1.units.includes(u);
                      return (
                        <button
                          key={u}
                          type="button"
                          onClick={() => handleToggleUnit('check_1', u)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            selected
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-[#0c0f1d] border border-[#212c4b] text-slate-300 hover:text-white'
                          }`}
                        >
                          {selected && <Check size={11} />}
                          <span>{u}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={customUnitInput1}
                      onChange={(e) => setCustomUnitInput1(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomUnit('check_1');
                        }
                      }}
                      placeholder="Thêm bài khác (VD: Ôn tập kỳ 1)..."
                      className="flex-1 bg-[#0c0f1d] border border-[#212c4b] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCustomUnit('check_1')}
                      className="px-3 py-1.5 bg-[#212c4b] hover:bg-[#2d3b66] text-white rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <Plus size={12} />
                      <span>Thêm</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* CHECK 2 CONFIG */}
              <div className="bg-[#121626] border border-white/5 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-400">
                    Cấu Hình Check 2
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {config.mode === 'single_split' ? 'Toàn Bài' : 'Bài Kiểm Tra 2'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Kỹ Năng Đánh Giá
                    </label>
                    <CustomSelect
                      value={config.check_2.skill}
                      onChange={(val) =>
                        setConfig((p) => ({
                          ...p,
                          check_2: { ...p.check_2, skill: String(val) },
                        }))
                      }
                      options={skillOptions}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Chủ Đề Ngữ Pháp / Nội Dung
                    </label>
                    <input
                      type="text"
                      value={config.check_2.grammar_topic || config.check_2.topic}
                      onChange={(e) =>
                        setConfig((p) => ({
                          ...p,
                          check_2: {
                            ...p.check_2,
                            grammar_topic: e.target.value,
                            topic: e.target.value,
                          },
                        }))
                      }
                      placeholder="VD: Present Simple, Passive Voice..."
                      className="w-full bg-[#0c0f1d] border border-[#212c4b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Quick Grammar topic chips */}
                {config.check_2.skill === 'grammar' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 block">
                      Gợi Ý Chủ Đề Ngữ Pháp Phổ Biến:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {grammarSuggestions.slice(0, 6).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() =>
                            setConfig((p) => ({
                              ...p,
                              check_2: { ...p.check_2, grammar_topic: g, topic: g },
                            }))
                          }
                          className="px-2 py-0.5 rounded-lg bg-[#0c0f1d] border border-[#212c4b] hover:border-purple-500 text-[11px] text-slate-300 hover:text-white transition"
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unit / Lessons Tag Selector for Check 2 */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    Bài Học / Units Áp Dụng:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {unitSuggestions.slice(0, 10).map((u) => {
                      const selected = config.check_2.units.includes(u);
                      return (
                        <button
                          key={u}
                          type="button"
                          onClick={() => handleToggleUnit('check_2', u)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            selected
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'bg-[#0c0f1d] border border-[#212c4b] text-slate-300 hover:text-white'
                          }`}
                        >
                          {selected && <Check size={11} />}
                          <span>{u}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={customUnitInput2}
                      onChange={(e) => setCustomUnitInput2(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomUnit('check_2');
                        }
                      }}
                      placeholder="Thêm bài khác..."
                      className="flex-1 bg-[#0c0f1d] border border-[#212c4b] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCustomUnit('check_2')}
                      className="px-3 py-1.5 bg-[#212c4b] hover:bg-[#2d3b66] text-white rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <Plus size={12} />
                      <span>Thêm</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#121626]">
          <div className="text-xs text-slate-400 font-medium">
            Thông tin sẽ được dùng để phân tích điểm và dự đoán năng lực học sinh.
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="px-5 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] text-white text-xs font-black shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save size={14} />
              <span>{saving ? 'Đang Lưu...' : 'Lưu Cấu Hình'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
