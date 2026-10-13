import { PromptItem } from '../../components/PromptManager';

export const DEFAULT_QUESTION_BANK_PROMPTS: PromptItem[] = [
  {
    id: 'qb_1',
    title: 'Tạo câu hỏi ngữ pháp (Lớp 9 - Unit 1)',
    content: 'Hãy tạo 10 câu hỏi trắc nghiệm ngữ pháp tiếng Anh lớp 9, Unit 1. Xuất ra dưới định dạng danh sách có các trường: Câu hỏi, 4 Tùy chọn, Đáp án đúng, Độ khó (NHẬN BIẾT, THÔNG HIỂU, VẬN DỤNG) và Khối lớp: 9, Unit: 1.'
  },
  {
    id: 'qb_2',
    title: 'Tạo bài tập tìm lỗi sai (Error Identification)',
    content: 'Tạo 5 câu hỏi tìm lỗi sai (Error Identification) cho khối lớp 11. Các câu hỏi cần có dạng các phần gạch chân đánh dấu bằng (A), (B), (C), (D). Ví dụ: "Because of [his](A) illness, he [could not](B) go to school, [so](C) he was [sadly](D)."'
  }
];

export const TYPE_MAP: Record<string, string> = {
  'pr': 'Pronunciation',
  'st': 'Stress',
  'er': 'Error Identification',
  'sy': 'Synonym',
  'an': 'Antonym',
  'cz': 'Cloze Passage',
  'ro': 'Reordering',
  'rd': 'Reading',
  'fb': 'Fill in the Blank',
  'rw': 'Rewrite Sentences',
  'wf': 'Word Formation',
  'mq': 'Multiple Choice'
};

export const DIFFICULTY_LEVELS = ['NHẬN BIẾT', 'THÔNG HIỂU', 'VẬN DỤNG'];

export function parseUnits(unitStr: string): string[] {
  if (!unitStr) return [];
  const clean = unitStr.replace(/;/g, ',');
  const rangeMatch = clean.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    if (!isNaN(start) && !isNaN(end)) {
      const units: string[] = [];
      const from = Math.min(start, end);
      const to = Math.max(start, end);
      for (let i = from; i <= to; i++) {
        units.push(String(i));
      }
      return units;
    }
  }
  return clean.split(',').map((p) => p.trim()).filter(Boolean);
}
