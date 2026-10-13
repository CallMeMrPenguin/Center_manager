import { PromptItem } from '../../components/PromptManager';

export const DEFAULT_VOCABULARY_BANK_PROMPTS: PromptItem[] = [
  {
    id: 'vb_1',
    title: 'Trích xuất từ vựng từ đoạn văn bản',
    content: 'Đọc đoạn văn sau và trích xuất tất cả các từ vựng quan trọng. Với mỗi từ, cung cấp từ loại (pos), phiên âm IPA (ipa), nghĩa tiếng Việt (meaning), mức độ khó (DỄ, TRUNG BÌNH, KHÓ) và từ gốc (root_word nếu có).'
  },
  {
    id: 'vb_2',
    title: 'Tạo danh sách Word Family từ chủ đề',
    content: 'Tạo 10 từ vựng cốt lõi kèm theo các từ family liên quan (danh từ, động từ, tính từ, trạng từ) cho chủ đề "Environment". Định dạng từ gốc bằng dấu ngoặc vuông [ ] và các từ gia đình liên quan bằng dấu ngoặc nhọn { }.'
  }
];

export const VOCAB_DIFFICULTIES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', '1', '2', '3'];
export const VOCAB_POS_LIST = ['n', 'v', 'adj', 'adv', 'prep', 'v phr', 'n phr', 'n/adj', 'v/n'];
