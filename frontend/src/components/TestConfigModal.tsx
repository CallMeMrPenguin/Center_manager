import React, { useState, useEffect } from 'react';
import { X, Layers, Save, Check } from 'lucide-react';
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
  mode: string; // 'two_separate'
  check_1: TestConfigItemData;
  check_2: TestConfigItemData;
  notes: string;
}

interface UnitDetail {
  unit: string;
  unit_num: string;
  name: string;
  grammar: string;
  label: string;
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
    grammar_topic: '',
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
  const [unitsDetailed, setUnitsDetailed] = useState<UnitDetail[]>([]);
  const [unitGrammarMap, setUnitGrammarMap] = useState<Record<string, string>>({});
  const [unitNameMap, setUnitNameMap] = useState<Record<string, string>>({});
  const [grammarSuggestions, setGrammarSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && classId && date) {
      setLoading(true);
      Promise.all([
        api.getSessionTestConfig(classId, date),
        api.getUnitSuggestions(grade),
      ])
        .then(([resConfig, resSugg]) => {
          if (resSugg) {
            setUnitsDetailed(resSugg.units_detailed || []);
            setUnitGrammarMap(resSugg.unit_grammar_map || {});
            setUnitNameMap(resSugg.unit_name_map || {});
            setGrammarSuggestions(resSugg.grammar_topics || []);
          }

          if (resConfig?.test_config) {
            setConfig({
              mode: 'two_separate',
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
            // Pick first unit from suggestions
            const firstUnit = resSugg?.units_detailed?.[0];
            setConfig({
              mode: 'two_separate',
              check_1: {
                skill: 'vocab',
                units: firstUnit ? [firstUnit.unit] : ['Unit 1'],
                topic: firstUnit?.name || '',
                grammar_topic: '',
              },
              check_2: {
                skill: 'grammar',
                units: firstUnit ? [firstUnit.unit] : ['Unit 1'],
                topic: '',
                grammar_topic: firstUnit?.grammar || '',
              },
              notes: '',
            });
          }
        })
        .catch(() => {
          setConfig(DEFAULT_CONFIG);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, classId, date, grade]);

  if (!isOpen) return null;

  const handleToggleUnit = (part: 'check_1' | 'check_2', unitKey: string) => {
    setConfig((prev) => {
      const currentUnits = prev[part].units || [];
      const exists = currentUnits.includes(unitKey);
      const nextUnits = exists
        ? currentUnits.filter((u) => u !== unitKey)
        : [...currentUnits, unitKey];

      let nextTopic = prev[part].topic;
      let nextGrammar = prev[part].grammar_topic;

      // Auto populate topic name if empty or only 1 unit selected
      if (!exists && nextUnits.length === 1) {
        if (part === 'check_1' && !nextTopic && unitNameMap[unitKey]) {
          nextTopic = unitNameMap[unitKey];
        }
        if (part === 'check_2' && !nextGrammar && unitGrammarMap[unitKey]) {
          nextGrammar = unitGrammarMap[unitKey];
        }
      }

      return {
        ...prev,
        [part]: {
          ...prev[part],
          units: nextUnits,
          topic: nextTopic,
          grammar_topic: nextGrammar,
        },
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveSessionTestConfig(classId, {
        date,
        class_id: classId,
        mode: 'two_separate',
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
              <h2 className="text-base font-black text-white">Cấu Hình Bài Kiểm Tra Buổi Học</h2>
              <span className="text-xs text-slate-400">
                Ngày học: <strong className="text-indigo-300">{date}</strong> | Khối lớp: <strong className="text-white">{grade || 'Lớp 6'}</strong>
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
              Đang tải danh sách bài học & cấu hình...
            </div>
          ) : (
            <>
              {/* CHECK 1 CONFIG */}
              <div className="bg-[#121626] border border-white/5 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-400">
                    Cấu Hình Check 1
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Bài Kiểm Tra 1
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
                      Chủ Đề Từ Vựng / Nội Dung
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

                {/* Unit / Lessons Tag Selector from Unit Config */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    Chọn Bài Học / Units Từ Cấu Hình (Có thể chọn nhiều):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {unitsDetailed.map((u) => {
                      const selected = config.check_1.units.includes(u.unit);
                      return (
                        <button
                          key={u.unit}
                          type="button"
                          onClick={() => handleToggleUnit('check_1', u.unit)}
                          className={`p-2 rounded-xl text-left transition border cursor-pointer ${
                            selected
                              ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                              : 'bg-[#0c0f1d] border-[#212c4b] text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-black">
                            <span>{u.unit}</span>
                            {selected && <Check size={13} className="text-blue-400" />}
                          </div>
                          {u.name && (
                            <div className="text-[10px] text-slate-400 truncate mt-0.5" title={u.name}>
                              {u.name}
                            </div>
                          )}
                        </button>
                      );
                    })}
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
                    Bài Kiểm Tra 2
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
                      Chủ Đề Ngữ Pháp (Grammar Topic)
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

                {/* Unit / Lessons Tag Selector from Unit Config */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    Chọn Bài Học / Units Cho Check 2:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {unitsDetailed.map((u) => {
                      const selected = config.check_2.units.includes(u.unit);
                      return (
                        <button
                          key={u.unit}
                          type="button"
                          onClick={() => handleToggleUnit('check_2', u.unit)}
                          className={`p-2 rounded-xl text-left transition border cursor-pointer ${
                            selected
                              ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm'
                              : 'bg-[#0c0f1d] border-[#212c4b] text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-black">
                            <span>{u.unit}</span>
                            {selected && <Check size={13} className="text-purple-400" />}
                          </div>
                          {u.grammar ? (
                            <div className="text-[10px] text-purple-300 truncate mt-0.5" title={u.grammar}>
                              {u.grammar}
                            </div>
                          ) : u.name ? (
                            <div className="text-[10px] text-slate-400 truncate mt-0.5" title={u.name}>
                              {u.name}
                            </div>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Grammar suggestions */}
                {config.check_2.skill === 'grammar' && grammarSuggestions.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-slate-400 block">
                      Hoặc Chọn Nhanh Chủ Đề Ngữ Pháp Khác:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {grammarSuggestions.slice(0, 8).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() =>
                            setConfig((p) => ({
                              ...p,
                              check_2: { ...p.check_2, grammar_topic: g, topic: g },
                            }))
                          }
                          className="px-2.5 py-1 rounded-lg bg-[#0c0f1d] border border-[#212c4b] hover:border-purple-500 text-[11px] text-slate-300 hover:text-white transition cursor-pointer"
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#121626]">
          <div className="text-xs text-slate-400 font-medium">
            Thông tin sẽ được tự động đồng bộ để tính toán độ nắm vững kiến thức của học sinh.
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="px-5 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] text-white text-xs font-black shadow-lg transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
