import React, { useState, useEffect, useMemo } from 'react';
import { X, Layers, Save, Check } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import { CustomMultiSelect } from './CustomMultiSelect';
import { api } from '../api';
import { showToast } from './Toast';
import { notifyDataChanged } from '../utils';

export interface TestConfigItemData {
  skill: string; // 'vocab' | 'grammar' | 'mixed'
  units: string[];
  topic: string;
  grammar_topic: string;
}

export interface SessionTestConfigData {
  mode: string;
  check_1: TestConfigItemData;
  check_2: TestConfigItemData;
  notes: string;
}

interface UnitDetail {
  unit: string;
  unit_num: string;
  name: string;
  grammar: string;
  grammar_topics?: string[];
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
  check_1: { skill: 'vocab', units: ['Unit 1'], topic: '', grammar_topic: '' },
  check_2: { skill: 'grammar', units: ['Unit 1'], topic: '', grammar_topic: '' },
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
          const list: UnitDetail[] = resSugg?.units_detailed || [];
          setUnitsDetailed(list);

          const normalizeUnits = (item: any): string[] => {
            if (Array.isArray(item?.units) && item.units.length > 0) {
              return item.units.filter((u: any) => typeof u === 'string' && u.trim());
            }
            if (typeof item?.units === 'string' && item.units.trim()) {
              return item.units.split(',').map((s: string) => s.trim()).filter(Boolean);
            }
            if (typeof item?.unit === 'string' && item.unit.trim()) {
              return [item.unit.trim()];
            }
            return list[0] ? [list[0].unit] : ['Unit 1'];
          };

          if (resConfig?.test_config) {
            const c1 = resConfig.test_config.check_1 || {};
            const c2 = resConfig.test_config.check_2 || {};
            const c1Units = normalizeUnits(c1);
            const c2Units = normalizeUnits(c2);

            setConfig({
              mode: 'two_separate',
              check_1: {
                skill: c1.skill || 'vocab',
                units: c1Units,
                topic: c1.topic || list.find((u) => u.unit === c1Units[0])?.name || list[0]?.name || '',
                grammar_topic: c1.grammar_topic || list.find((u) => u.unit === c1Units[0])?.grammar || '',
              },
              check_2: {
                skill: c2.skill || 'grammar',
                units: c2Units,
                topic: c2.topic || list.find((u) => u.unit === c2Units[0])?.name || '',
                grammar_topic: c2.grammar_topic || list.find((u) => u.unit === c2Units[0])?.grammar || list[0]?.grammar || '',
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
        .catch(() => setConfig(DEFAULT_CONFIG))
        .finally(() => setLoading(false));
    }
  }, [isOpen, classId, date, grade]);

  const skillOptions = [
    { value: 'vocab', label: 'Từ Vựng (Vocabulary)' },
    { value: 'grammar', label: 'Ngữ Pháp (Grammar)' },
    { value: 'mixed', label: 'Tổng Hợp (Mixed)' },
    { value: 'mock_test', label: 'Luyện Đề (Mock Test)' },
  ];

  const getUnitOptions = (skill: string) => {
    return unitsDetailed.map((u) => ({
      value: u.unit,
      label: skill === 'vocab' ? (u.name || u.unit) : (u.grammar ? `${u.unit}: ${u.grammar}` : (u.name || u.unit)),
      sublabel: skill === 'vocab' ? u.grammar : u.name,
    }));
  };

  const getAvailableGrammarTopics = (units: string[]) => {
    const topics: string[] = [];
    units.forEach((ukey) => {
      const u = unitsDetailed.find((item) => item.unit === ukey);
      if (u?.grammar_topics && u.grammar_topics.length > 0) {
        u.grammar_topics.forEach((gt) => { if (gt && !topics.includes(gt)) topics.push(gt); });
      } else if (u?.grammar) {
        u.grammar.split(/[\n,&/]+/).map((s) => s.trim()).forEach((gt) => {
          if (gt && !topics.includes(gt)) topics.push(gt);
        });
      }
    });
    return topics;
  };

  const check1UnitOptions = useMemo(() => getUnitOptions(config.check_1.skill), [unitsDetailed, config.check_1.skill]);
  const check2UnitOptions = useMemo(() => getUnitOptions(config.check_2.skill), [unitsDetailed, config.check_2.skill]);

  const check1GrammarTopics = useMemo(() => getAvailableGrammarTopics(config.check_1.units), [unitsDetailed, config.check_1.units]);
  const check2GrammarTopics = useMemo(() => getAvailableGrammarTopics(config.check_2.units), [unitsDetailed, config.check_2.units]);

  if (!isOpen) return null;

  const handleSkillChange = (checkKey: 'check_1' | 'check_2', skillVal: string) => {
    const isMock = skillVal === 'mock_test';
    setConfig((prev) => ({
      ...prev,
      [checkKey]: {
        ...prev[checkKey],
        skill: skillVal,
        topic: isMock ? (prev[checkKey].topic || 'Luyện đề tổng hợp') : prev[checkKey].topic,
        grammar_topic: isMock ? '' : prev[checkKey].grammar_topic,
      },
    }));
  };

  const handleMultiSelectUnits = (checkKey: 'check_1' | 'check_2', selectedUnits: string[]) => {
    const isMock = config[checkKey].skill === 'mock_test';
    const matchedNames = selectedUnits.map((ukey) => unitsDetailed.find((u) => u.unit === ukey)?.name).filter(Boolean);
    const matchedGrammars = selectedUnits.map((ukey) => unitsDetailed.find((u) => u.unit === ukey)?.grammar).filter(Boolean);
    const topics = getAvailableGrammarTopics(selectedUnits);
    const defaultGrammarTopic = isMock ? '' : (topics.length === 1 ? topics[0] : matchedGrammars.join(' , '));

    setConfig((prev) => ({
      ...prev,
      [checkKey]: {
        ...prev[checkKey],
        units: selectedUnits,
        topic: selectedUnits.length > 0 ? matchedNames.join(' , ') : (isMock ? 'Luyện đề tổng hợp' : ''),
        grammar_topic: defaultGrammarTopic,
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
      notifyDataChanged(['schedule', 'attendance', 'reports', 'analytics', 'classes']);
      if (onSaved) onSaved(config);
      onClose();
    } catch (err: any) {
      showToast('Lỗi lưu cấu hình bài kiểm tra: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderGrammarTopicSelector = (checkKey: 'check_1' | 'check_2', availableTopics: string[]) => {
    const item = config[checkKey];
    if (item.skill !== 'grammar' && item.skill !== 'mixed') return null;
    const currentTopic = item.grammar_topic || '';

    return (
      <div className="mt-2.5 pt-2 border-t border-white/5">
        <label className="text-[11px] font-bold text-purple-300 block mb-1.5 flex items-center justify-between">
          <span>Chủ Đề Ngữ Pháp Kiểm Tra (Chọn 1 hoặc nhiều chủ đề):</span>
          {availableTopics.length > 1 && (
            <span className="text-[10px] text-slate-400 font-normal">Unit có {availableTopics.length} chủ đề</span>
          )}
        </label>
        {availableTopics.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {availableTopics.map((topic) => {
              const isSelected = currentTopic === topic || currentTopic.split(' , ').includes(topic);
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => {
                    let nextTopic = topic;
                    if (currentTopic.split(' , ').includes(topic)) {
                      const remaining = currentTopic.split(' , ').filter(t => t !== topic);
                      nextTopic = remaining.length > 0 ? remaining.join(' , ') : availableTopics.join(' , ');
                    } else if (currentTopic && currentTopic !== availableTopics.join(' , ')) {
                      nextTopic = `${currentTopic} , ${topic}`;
                    }
                    setConfig(prev => ({ ...prev, [checkKey]: { ...prev[checkKey], grammar_topic: nextTopic } }));
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)] border border-purple-400'
                      : 'bg-[#151a2e] text-slate-300 hover:text-white border border-[#212c4b] hover:border-purple-500/50'
                  }`}
                >
                  {isSelected && <Check size={11} className="stroke-[3]" />}
                  <span>{topic}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setConfig(prev => ({ ...prev, [checkKey]: { ...prev[checkKey], grammar_topic: availableTopics.join(' , ') } }))}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                currentTopic === availableTopics.join(' , ')
                  ? 'bg-indigo-600 text-white border border-indigo-400'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              Tất cả chủ đề
            </button>
          </div>
        ) : null}
        <input
          type="text"
          value={item.grammar_topic}
          onChange={(e) => {
            const val = e.target.value;
            setConfig(prev => ({ ...prev, [checkKey]: { ...prev[checkKey], grammar_topic: val } }));
          }}
          placeholder="Tên chủ đề ngữ pháp..."
          className="w-full px-3 py-1.5 bg-[#0a0d17] border border-purple-500/30 focus:border-purple-500 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 select-none animate-mac-backdrop">
      <div className="bg-[#0c0f1d] border border-white/10 w-full max-w-xl rounded-2xl shadow-2xl overflow-visible flex flex-col animate-mac-modal relative max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121626] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Cấu Hình Bài Kiểm Tra Buổi Học</h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                <span>Ngày: <strong className="text-indigo-300">{date}</strong></span>
                <span className="text-slate-600">/</span>
                <span>Khối: <strong className="text-white">{grade || 'Chưa phân khối'}</strong></span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs font-bold">
              Đang tải danh sách bài học & cấu hình...
            </div>
          ) : (
            <>
              {/* CHECK 1 */}
              <div className="bg-[#121626] border border-white/5 rounded-xl p-4 space-y-3 relative">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-400">Cấu Hình Check 1</span>
                  <span className="text-[11px] text-slate-400 font-medium">Bài Kiểm Tra 1</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Kỹ Năng Đánh Giá</label>
                    <CustomSelect
                      value={config.check_1.skill}
                      onChange={(val) => handleSkillChange('check_1', String(val))}
                      options={skillOptions}
                      placement="bottom"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1 flex items-center justify-between">
                      <span>Bài Học (Unit)</span>
                      {config.check_1.skill === 'mock_test' && (
                        <span className="text-[10px] text-amber-400 font-normal">Không bắt buộc</span>
                      )}
                    </label>
                    <CustomMultiSelect
                      values={config.check_1.units}
                      onChange={(units) => handleMultiSelectUnits('check_1', units)}
                      options={check1UnitOptions}
                      placeholder={config.check_1.skill === 'mock_test' ? 'Luyện đề tổng hợp / Chọn Unit (nếu có)...' : 'Chọn các Unit...'}
                      placement="bottom"
                      className="w-full"
                    />
                  </div>
                </div>
                {renderGrammarTopicSelector('check_1', check1GrammarTopics)}
              </div>

              {/* CHECK 2 */}
              <div className="bg-[#121626] border border-white/5 rounded-xl p-4 space-y-3 relative">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-400">Cấu Hình Check 2</span>
                  <span className="text-[11px] text-slate-400 font-medium">Bài Kiểm Tra 2</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Kỹ Năng Đánh Giá</label>
                    <CustomSelect
                      value={config.check_2.skill}
                      onChange={(val) => handleSkillChange('check_2', String(val))}
                      options={skillOptions}
                      placement="top"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1 flex items-center justify-between">
                      <span>Bài Học (Unit)</span>
                      {config.check_2.skill === 'mock_test' && (
                        <span className="text-[10px] text-amber-400 font-normal">Không bắt buộc</span>
                      )}
                    </label>
                    <CustomMultiSelect
                      values={config.check_2.units}
                      onChange={(units) => handleMultiSelectUnits('check_2', units)}
                      options={check2UnitOptions}
                      placeholder={config.check_2.skill === 'mock_test' ? 'Luyện đề tổng hợp / Chọn Unit (nếu có)...' : 'Chọn các Unit...'}
                      placement="top"
                      className="w-full"
                    />
                  </div>
                </div>
                {renderGrammarTopicSelector('check_2', check2GrammarTopics)}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#121626] rounded-b-2xl">
          <div className="text-[11px] text-slate-400 font-medium">Đồng bộ tự động với ma trận kỹ năng & bài học.</div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer">
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
