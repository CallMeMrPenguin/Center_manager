export interface TestConfigItemData {
  skill: string;
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

export interface UnitDetail {
  unit: string;
  unit_num: string;
  name: string;
  grammar: string;
  grammar_topics?: string[];
  label: string;
}

export interface TestConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  date: string;
  grade?: string;
  onSaved?: (config: SessionTestConfigData) => void;
}

export const DEFAULT_CONFIG: SessionTestConfigData = {
  mode: 'two_separate',
  check_1: { skill: 'vocab', units: ['Unit 1'], topic: '', grammar_topic: '' },
  check_2: { skill: 'grammar', units: ['Unit 1'], topic: '', grammar_topic: '' },
  notes: '',
};

export const getPrimaryGrammarTopic = (u?: UnitDetail): string => {
  if (!u) return '';
  if (u.grammar_topics && u.grammar_topics.length > 0) return u.grammar_topics[0];
  if (u.grammar) {
    const parts = u.grammar.split(/[\n,&/]+/).map((s) => s.trim()).filter(Boolean);
    return parts[0] || u.grammar;
  }
  return '';
};
