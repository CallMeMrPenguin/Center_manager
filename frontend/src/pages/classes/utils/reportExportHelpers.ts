import { AttendanceRecord } from '../types';
import { format1Dec } from '../../../utils';

export function formatTopicString(cfg: any): string {
  if (!cfg || typeof cfg !== 'object') return '';
  const skillLabels: Record<string, string> = {
    vocab: 'Từ vựng', grammar: 'Ngữ pháp', mixed: 'Tổng hợp',
    mock_test: 'Luyện đề', reading: 'Đọc hiểu', listening: 'Nghe',
    speaking: 'Nói', writing: 'Viết',
  };
  const skillName = skillLabels[cfg.skill] || (cfg.skill ? String(cfg.skill) : '');
  const units = Array.isArray(cfg.units) ? cfg.units.join(', ') : (cfg.units || '');
  const topic = (cfg.topic || cfg.grammar_topic || '').replace(/\|/g, '-').trim();
  const detail = [units, topic].filter(Boolean).join(' - ');
  return (skillName && detail) ? `${skillName}: ${detail}` : (detail || skillName);
}

export function getScoreStyle(val: number): { bg: string; text: string } {
  if (val >= 8.0) return { bg: '#DCFCE7', text: '#15803D' };
  if (val >= 6.5) return { bg: '#E0F2FE', text: '#0369A1' };
  if (val >= 5.0) return { bg: '#FEF3C7', text: '#B45309' };
  return { bg: '#FFE4E6', text: '#BE123C' };
}

export function wrapStudentNames(names: string[], maxChars = 95): string[] {
  if (!names.length) return ['Không có (Tất cả đạt)'];
  const lines: string[] = [];
  let cur = '';
  for (const name of names) {
    const test = cur ? `${cur}, ${name}` : name;
    if (test.length > maxChars && cur) { lines.push(cur); cur = name; }
    else { cur = test; }
  }
  if (cur) lines.push(cur);
  return lines;
}

export function wrapHeaderTopic(text: string, maxChars = 24): string[] {
  if (!text) return [];
  const lines: string[] = [];
  let cur = '';
  for (const w of text.split(' ')) {
    const test = cur ? `${cur} ${w}` : w;
    if (test.length > maxChars && cur) { lines.push(cur); cur = w; }
    else { cur = test; }
  }
  if (cur) lines.push(cur);
  return lines.length === 1 ? [`(${lines[0]})`] : lines.map((l, i) => (i === 0 ? `(${l}` : (i === lines.length - 1 ? `${l})` : l)));
}

export interface ReportColumnConfig {
  id: string;
  header: string;
  width: number;
  subLines?: string[];
  getValue: (r: AttendanceRecord, idx: number, fails: string[], isAbsent: boolean, diffStr: string) => {
    text: string;
    bg?: string;
    textCol?: string;
    bold?: boolean;
  };
  getAvgValue?: (averages: Record<string, number | null>) => string | number;
}

export const REPORT_COLUMN_ALIASES: Record<string, string> = {
  stt: 'stt',
  student_name: 'student_name',
  full_name: 'student_name',
  status: 'status',
  attendance: 'status',
  check_1: 'check_1',
  vocab: 'check_1',
  check_2: 'check_2',
  grammar: 'check_2',
  homework: 'homework',
  homework_1: 'homework',
  hw1: 'homework',
  btvn_1: 'homework',
  homework_2: 'homework_2',
  hw2: 'homework_2',
  btvn_2: 'homework_2',
  mock_test: 'mock_test',
  luyen_de: 'mock_test',
  score_discrepancy: 'score_discrepancy',
  do_lech: 'score_discrepancy',
  need_improvement: 'need_improvement',
  can_co_gang: 'need_improvement',
};

// Điểm > 8.0 dù thấp hơn trung bình vẫn là ĐẠT
export function getFailingStudents(records: AttendanceRecord[], key: keyof AttendanceRecord, thresh: number): string[] {
  return records
    .filter((r) => {
      if (r.status === 'Vắng mặt') return false;
      const val = Number(r[key]);
      return !isNaN(val) && val > 0 && thresh > 0 && val < thresh && val <= 8.0;
    })
    .map((r) => r.student_name);
}

export function computeStudentFails(r: AttendanceRecord, tC1: number, tC2: number, tHw1: number, tHw2: number, tMt: number): string[] {
  const fails: string[] = [];
  const nC1 = Number(r.check_1);
  const nC2 = Number(r.check_2);
  const nH1 = Number(r.homework);
  const nH2 = Number(r.homework_2);
  const nMt = Number(r.mock_test);

  // Điểm > 8.0 dù thấp hơn trung bình vẫn là ĐẠT
  if (!isNaN(nC1) && nC1 > 0 && tC1 > 0 && nC1 < tC1 && nC1 <= 8.0) fails.push('Check 1');
  if (!isNaN(nC2) && nC2 > 0 && tC2 > 0 && nC2 < tC2 && nC2 <= 8.0) fails.push('Check 2');
  if (!isNaN(nH1) && nH1 > 0 && tHw1 > 0 && nH1 < tHw1 && nH1 <= 8.0) fails.push('BTVN 1');
  if (!isNaN(nH2) && nH2 > 0 && tHw2 > 0 && nH2 < tHw2 && nH2 <= 8.0) fails.push('BTVN 2');
  if (!isNaN(nMt) && nMt > 0 && tMt > 0 && nMt < tMt && nMt <= 8.0) fails.push('Luyện Đề');

  return fails;
}

export interface ExportCol {
  id: string;
  header: string;
  width: number;
  subLines?: string[];
  getValue: (
    r: AttendanceRecord,
    idx: number,
    fails: string[],
    isAbsent: boolean,
    diffStr: string
  ) => { text: string; bg?: string; textCol?: string; bold?: boolean };
  getAvg: () => string;
}

export function buildClassExportColumnsMap(params: {
  c1Lines: string[];
  c2Lines: string[];
  tC1: number;
  tC2: number;
  tHw1: number;
  tHw2: number;
  tMt: number;
  diffHw: number;
}): Record<string, ExportCol> {
  const { c1Lines, c2Lines, tC1, tC2, tHw1, tHw2, tMt, diffHw } = params;
  return {
    stt: {
      id: 'stt',
      header: 'STT',
      width: 48,
      getValue: (_r, idx) => ({ text: String(idx + 1), bold: true }),
      getAvg: () => '',
    },
    student_name: {
      id: 'student_name',
      header: 'Họ và Tên',
      width: 190,
      getValue: (r) => ({ text: r.student_name, bold: true, textCol: '#0F172A' }),
      getAvg: () => 'Điểm trung bình (Average)',
    },
    status: {
      id: 'status',
      header: 'Điểm Danh',
      width: 90,
      getValue: (r) => ({ text: r.status || 'Có mặt', textCol: r.status === 'Vắng mặt' ? '#BE123C' : '#0369A1' }),
      getAvg: () => '',
    },
    check_1: {
      id: 'check_1',
      header: 'Check 1',
      width: c1Lines.length > 0 ? 175 : 85,
      subLines: c1Lines,
      getValue: (r, _idx, _f, isAbsent) => {
        const v = Number(r.check_1);
        if (isAbsent || isNaN(v) || v <= 0) return { text: '-' };
        const st = getScoreStyle(v);
        return { text: format1Dec(v), bg: st.bg, textCol: st.text, bold: true };
      },
      getAvg: () => (tC1 > 0 ? format1Dec(tC1) : '-'),
    },
    check_2: {
      id: 'check_2',
      header: 'Check 2',
      width: c2Lines.length > 0 ? 175 : 85,
      subLines: c2Lines,
      getValue: (r, _idx, _f, isAbsent) => {
        const v = Number(r.check_2);
        if (isAbsent || isNaN(v) || v <= 0) return { text: '-' };
        const st = getScoreStyle(v);
        return { text: format1Dec(v), bg: st.bg, textCol: st.text, bold: true };
      },
      getAvg: () => (tC2 > 0 ? format1Dec(tC2) : '-'),
    },
    homework: {
      id: 'homework',
      header: 'BTVN 1',
      width: 80,
      getValue: (r, _idx, _f, isAbsent) => {
        const v = Number(r.homework);
        if (isAbsent || isNaN(v) || v <= 0) return { text: '-' };
        const st = getScoreStyle(v);
        return { text: format1Dec(v), bg: st.bg, textCol: st.text, bold: true };
      },
      getAvg: () => (tHw1 > 0 ? format1Dec(tHw1) : '-'),
    },
    homework_2: {
      id: 'homework_2',
      header: 'BTVN 2',
      width: 80,
      getValue: (r, _idx, _f, isAbsent) => {
        const v = Number(r.homework_2);
        if (isAbsent || isNaN(v) || v <= 0) return { text: '-' };
        const st = getScoreStyle(v);
        return { text: format1Dec(v), bg: st.bg, textCol: st.text, bold: true };
      },
      getAvg: () => (tHw2 > 0 ? format1Dec(tHw2) : '-'),
    },
    mock_test: {
      id: 'mock_test',
      header: 'Luyện Đề',
      width: 80,
      getValue: (r, _idx, _f, isAbsent) => {
        const v = Number(r.mock_test);
        if (isAbsent || isNaN(v) || v <= 0) return { text: '-' };
        const st = getScoreStyle(v);
        return { text: format1Dec(v), bg: st.bg, textCol: st.text, bold: true };
      },
      getAvg: () => (tMt > 0 ? format1Dec(tMt) : '-'),
    },
    score_discrepancy: {
      id: 'score_discrepancy',
      header: 'Độ Lệch',
      width: 85,
      getValue: (_r, _idx, _f, isAbsent, diffStr) => {
        if (isAbsent || diffStr === '-') return { text: '-' };
        const dNum = parseFloat(diffStr);
        const st = !isNaN(dNum)
          ? dNum <= 1.0 ? { bg: '#DCFCE7', text: '#15803D' } : dNum <= 2.5 ? { bg: '#FEF3C7', text: '#B45309' } : { bg: '#FFE4E6', text: '#BE123C' }
          : { bg: '', text: '#1E293B' };
        return { text: diffStr, bg: st.bg, textCol: st.text, bold: true };
      },
      getAvg: () => (diffHw > 0 ? format1Dec(diffHw) : '-'),
    },
    need_improvement: {
      id: 'need_improvement',
      header: 'Cần Cố Gắng (Dưới TB)',
      width: 320,
      getValue: (_r, _idx, fails, isAbsent) => {
        if (isAbsent) return { text: 'Vắng mặt', bg: '#F1F5F9', textCol: '#64748B', bold: true };
        if (fails.length > 0) return { text: `Cần cố gắng (${fails.join(', ')})`, bg: '#FFE4E6', textCol: '#BE123C', bold: true };
        return { text: 'Đạt yêu cầu', bg: '#DCFCE7', textCol: '#15803D', bold: true };
      },
      getAvg: () => 'Đã tính TB lớp',
    },
  };
}
