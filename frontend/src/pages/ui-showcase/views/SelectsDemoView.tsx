import React, { useState } from 'react';
import { BookOpen, GraduationCap, School, Code2, Copy, Check } from 'lucide-react';
import { CustomSelect, CustomMultiSelect } from '../../../components/select';
import { showToast } from '../../../components/Toast';
import { selectSources } from '../sources/selectSources';
import { ComponentSourceItem } from '../types';

interface SelectsDemoViewProps {
  onViewCode: (item: ComponentSourceItem) => void;
}

export const SelectsDemoView: React.FC<SelectsDemoViewProps> = ({ onViewCode }) => {
  const [grade, setGrade] = useState('12');
  const [subject, setSubject] = useState('math');
  const [selectedUnits, setSelectedUnits] = useState<string[]>(['u1', 'u3']);

  const customSelectSource = selectSources[0];
  const customMultiSource = selectSources[1];

  const gradeOptions = [
    { value: '10', label: 'Khối 10 (Chương trình mới GDPT 2018)', icon: <School size={14} /> },
    { value: '11', label: 'Khối 11 (Chương trình phân hóa)', icon: <School size={14} /> },
    { value: '12', label: 'Khối 12 (Luyện Thi Đại Học & ĐGNL)', icon: <GraduationCap size={14} /> },
  ];

  const subjectOptions = [
    { value: 'math', label: 'Toán Học (Đại Số & Giải Tích, Hình Học)' },
    { value: 'physics', label: 'Vật Lý (Cơ Học, Sóng, Điện Từ)' },
    { value: 'chemistry', label: 'Hóa Học (Hữu Cơ, Vô Cơ)' },
    { value: 'english', label: 'Tiếng Anh (IELTS, THPT Quốc Gia)' },
  ];

  const unitOptions = [
    { value: 'u1', label: 'Unit 1: Life Stories & Inspirations' },
    { value: 'u2', label: 'Unit 2: Your Body and Healthcare' },
    { value: 'u3', label: 'Unit 3: Music and Global Arts' },
    { value: 'u4', label: 'Unit 4: For a Better Community' },
    { value: 'u5', label: 'Unit 5: Inventions & Technologies' },
    { value: 'u6', label: 'Unit 6: Gender Equality in Education' },
  ];

  return (
    <div className="bg-white dark:bg-[#141417] border border-slate-200/90 dark:border-[#27272a] p-6 rounded-2xl shadow-sm space-y-8">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Dropdown & Lựa Chọn Danh Sách (CustomSelect & MultiSelect)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Chuẩn hóa giao diện sáng/tối phẳng không viền, thay thế hoàn toàn thẻ select gốc của OS. Tích hợp tìm kiếm mờ (fuzzy search) và tự động tính hướng mở (auto placement).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onViewCode(customSelectSource)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer border-0 shadow-2xs"
          >
            <Code2 size={13} />
            <span>Mã Nguồn File (CustomSelect.tsx)</span>
          </button>
        </div>
      </div>

      {/* 1. CUSTOM SELECT */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
            1. Dropdown Chọn Đơn Giá Trị (Single Select)
          </h4>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(customSelectSource.usageCode);
              showToast('Đã sao chép ví dụ sử dụng CustomSelect!', 'success');
            }}
            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline border-0 bg-transparent cursor-pointer"
          >
            <Copy size={12} />
            <span>Chép Cách Dùng</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 dark:bg-[#0c0f1e] rounded-2xl border border-slate-100 dark:border-white/5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Có Icon & Hỗ Trợ Placement Tự Động:
            </label>
            <CustomSelect
              value={grade}
              onChange={(val) => setGrade(String(val))}
              options={gradeOptions}
              placeholder="Chọn khối lớp..."
              icon={<BookOpen size={14} />}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Có Ô Tìm Kiếm Mờ (Fuzzy Search):
            </label>
            <CustomSelect
              value={subject}
              onChange={(val) => setSubject(String(val))}
              options={subjectOptions}
              placeholder="Tìm môn học..."
              searchable={true}
              searchPlaceholder="Gõ môn học (Toán, Lý, Hóa...)..."
            />
          </div>
        </div>

        <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-300">
          Giá trị state: <span className="font-bold text-blue-600 dark:text-blue-400">Khối lớp: {grade} | Môn: {subject}</span>
        </div>
      </div>

      {/* 2. CUSTOM MULTI SELECT */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
            2. Dropdown Chọn Nhiều Giá Trị (Multi-Select Với Thẻ Chips)
          </h4>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(customMultiSource.usageCode);
                showToast('Đã sao chép ví dụ sử dụng CustomMultiSelect!', 'success');
              }}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline border-0 bg-transparent cursor-pointer"
            >
              <Copy size={12} />
              <span>Chép Cách Dùng</span>
            </button>
            <button
              type="button"
              onClick={() => onViewCode(customMultiSource)}
              className="text-xs font-bold text-blue-600 hover:underline border-0 bg-transparent cursor-pointer"
            >
              Xem Mã Nguồn File
            </button>
          </div>
        </div>

        <div className="p-5 bg-slate-50 dark:bg-[#0c0f1e] rounded-2xl border border-slate-100 dark:border-white/5 space-y-4">
          <div className="w-full max-w-md">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Chọn Các Bài Học Cần Đưa Vào Đề Thi:
            </label>
            <CustomMultiSelect
              values={selectedUnits}
              onChange={(vals) => setSelectedUnits(vals)}
              options={unitOptions}
              placeholder="Chọn các bài học..."
              searchPlaceholder="Tìm kiếm tên bài học..."
            />
          </div>

          <div className="p-3 bg-white dark:bg-white/5 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-300">
            Đã chọn {selectedUnits.length} bài học: <span className="font-bold text-blue-600 dark:text-blue-400">{selectedUnits.join(', ') || 'Chưa chọn bài nào'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
