// Helper utilities for Class Report image/document generation

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
