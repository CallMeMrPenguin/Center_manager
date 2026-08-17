import React, { useState, useEffect } from 'react';
import { X, Layers, Save } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import { CustomMultiSelect } from './CustomMultiSelect';
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

  useEffect(() => {
    if (isOpen && classId && date) {
      setLoading(true);
      Promise.all([
        api.getSessionTestConfig(classId, date),
        api.getUnitSuggestions(grade),
      ])
        .then(([resConfig, resSugg]) => {
          const list = resSugg?.units_detailed || [];
          setUnitsDetailed(list);

          if (resConfig?.test_config) {
            setConfig({
              mode: 'two_separate',
              check_1: {
                skill: resConfig.test_config.check_1?.skill || 'vocab',
                units: resConfig.test_config.check_1?.units || (list[0] ? [list[0].unit] : ['Unit 1']),
                topic: resConfig.test_config.check_1?.topic || list[0]?.name || '',
                grammar_topic: resConfig.test_config.check_1?.grammar_topic || '',
              },
              check_2: {
                skill: resConfig.test_config.check_2?.skill || 'grammar',
                units: resConfig.test_config.check_2?.units || (list[0] ? [list[0].unit] : ['Unit 1']),
                topic: resConfig.test_config.check_2?.topic || '',
                grammar_topic: resConfig.test_config.check_2?.grammar_topic || list[0]?.grammar || '',
              },
              notes: resConfig.test_config.notes || '',
            });
          } else {
            const first = list[0];
            setConfig({
              mode: 'two_separate',
              check_1: {
                skill: 'vocab',
                units: first ? [first.unit] : ['Unit 1'],
                topic: first?.name || '',
                grammar_topic: '',
              },
              check_2: {
                skill: 'grammar',
                units: first ? [first.unit] : ['Unit 1'],
                topic: '',
                grammar_topic: first?.grammar || '',
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

  const handleMultiSelectCheck1 = (selectedUnits: string[]) => {
    const matchedNames = selectedUnits
      .map((ukey) => unitsDetailed.find((u) => u.unit === ukey)?.name)
      .filter(Boolean);

    setConfig((prev) => ({
      ...prev,
      check_1: {
        ...prev.check_1,
        units: selectedUnits,
        topic: matchedNames.join(' | '),
      },
    }));
  };

  const handleMultiSelectCheck2 = (selectedUnits: string[]) => {
    const matchedGrammars = selectedUnits
      .map((ukey) => {
        const item = unitsDetailed.find((u) => u.unit === ukey);
        return item?.grammar || item?.name;
      })
      .filter(Boolean);

    setConfig((prev) => ({
      ...prev,
      check_2: {
        ...prev.check_2,
        units: selectedUnits,
        grammar_topic: matchedGrammars.join(' | '),
        topic: matchedGrammars.join(' | '),
      },
    }));
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

  const check1UnitOptions = unitsDetailed.map((u) => ({
    value: u.unit,
    label: u.name ? `${u.name}` : u.unit,
  }));

  const check2UnitOptions = unitsDetailed.map((u) => ({
    value: u.unit,
    label: u.grammar ? `${u.grammar}` : u.name ? `${u.name}` : u.unit,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 select-none animate-mac-backdrop">
      <div className="bg-[#0c0f1d] border border-white/10 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-mac-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121626]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Cấu Hình Bài Kiểm Tra Buổi Học</h2>
              <span className="text-xs text-slate-400">
                Ngày học: <strong className="text-indigo-300">{date}</strong> | Khối lớp: <strong className="text-white">{grade || 'Lớp 6'}</strong>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs font-bold">
              Đang tải danh sách bài học & cấu hình...
            </div>
          ) : (
            <>
              {/* CHECK 1 CONFIG CARD */}
              <div className="bg-[#121626] border border-white/5 rounded-xl p-4 space-y-3.5">
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
                      Chủ Đề
                    </label>
                    <CustomMultiSelect
                      values={config.check_1.units}
                      onChange={handleMultiSelectCheck1}
                      options={check1UnitOptions}
                      placeholder="Chọn các Unit..."
                      searchPlaceholder="Tìm kiếm bài học..."
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* CHECK 2 CONFIG CARD */}
              <div className="bg-[#121626] border border-white/5 rounded-xl p-4 space-y-3.5">
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
                      Chủ Đề
                    </label>
                    <CustomMultiSelect
                      values={config.check_2.units}
                      onChange={handleMultiSelectCheck2}
                      options={check2UnitOptions}
                      placeholder="Chọn các Unit..."
                      searchPlaceholder="Tìm kiếm bài học..."
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#121626]">
          <div className="text-[11px] text-slate-400 font-medium">
            Tự động đồng bộ với ma trận nắm vững kiến thức.
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
              className="px-5 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] text-white text-xs font-black shadow-md transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
