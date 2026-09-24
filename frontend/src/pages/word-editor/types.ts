export type PaperSize = 'A4' | 'Letter';
export type Orientation = 'portrait' | 'landscape';

export interface MarginConfig {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export type RibbonTab = 'home' | 'insert' | 'layout' | 'merge';

export type SaveStatus = 'saved' | 'saving' | 'dirty' | 'offline';

export interface MergeFieldItem {
  key: string;
  label: string;
  group: 'student' | 'class' | 'teacher' | 'center' | 'date';
  example: string;
}

export const MERGE_FIELDS: MergeFieldItem[] = [
  { key: '{{ten_hoc_sinh}}', label: 'Tên Học Sinh', group: 'student', example: 'Nguyễn Văn An' },
  { key: '{{ma_hoc_sinh}}', label: 'Mã Học Sinh', group: 'student', example: 'HS-2026-089' },
  { key: '{{lop_hoc}}', label: 'Tên Lớp Học', group: 'class', example: 'Tiếng Anh 6A1' },
  { key: '{{khoa_hoc}}', label: 'Khóa Học', group: 'class', example: 'Luyện thi Chuyên Anh' },
  { key: '{{ten_giao_vien}}', label: 'Tên Giáo Viên', group: 'teacher', example: 'Thầy Trần Văn Bình' },
  { key: '{{sdt_gv}}', label: 'SĐT Giáo Viên', group: 'teacher', example: '0912 345 678' },
  { key: '{{ten_trung_tam}}', label: 'Tên Trung Tâm', group: 'center', example: 'Trung Tâm Ngoại Ngữ & Bồi Dưỡng Văn Hóa' },
  { key: '{{dia_chi_tt}}', label: 'Địa Chỉ Trung Tâm', group: 'center', example: '123 Đường Giáo Dục, Quận 1' },
  { key: '{{sdt_tt}}', label: 'Hotline Trung Tâm', group: 'center', example: '0901 234 567' },
  { key: '{{ngay_hien_tai}}', label: 'Ngày Hiện Tại', group: 'date', example: '24/09/2026' },
  { key: '{{thang_hoc}}', label: 'Tháng / Kỳ Học', group: 'date', example: 'Tháng 09/2026' },
  { key: '{{nam_hoc}}', label: 'Năm Học', group: 'date', example: '2026 - 2027' },
  { key: '{{hoc_phi}}', label: 'Số Tiền Học Phí', group: 'student', example: '1.200.000 đ' },
  { key: '{{han_dong}}', label: 'Hạn Đóng Phí', group: 'student', example: '10/10/2026' },
];

export interface WordDocTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  content_html: string;
}
