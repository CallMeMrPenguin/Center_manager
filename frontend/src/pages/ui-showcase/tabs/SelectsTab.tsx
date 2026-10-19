import React, { useState } from 'react';
import { BookOpen, User, GraduationCap, School } from 'lucide-react';
import { CustomSelect, CustomMultiSelect } from '../../../components/select';
import { ComponentCard } from '../components/ComponentCard';
import { selectSources } from '../sources/selectSources';
import { ComponentSourceItem } from '../types';

interface SelectsTabProps {
  onViewCode: (item: ComponentSourceItem) => void;
}

export const SelectsTab: React.FC<SelectsTabProps> = ({ onViewCode }) => {
  const [grade, setGrade] = useState('12');
  const [subject, setSubject] = useState('math');
  const [selectedUnits, setSelectedUnits] = useState<string[]>(['u1', 'u3']);

  const getSource = (id: string) => selectSources.find((s) => s.id === id)!;

  const gradeOptions = [
    { value: '10', label: 'Khối 10 (Chương trình mới)', icon: <School size={14} /> },
    { value: '11', label: 'Khối 11 (Chương trình mới)', icon: <School size={14} /> },
    { value: '12', label: 'Khối 12 (Ôn thi tốt nghiệp & ĐGNL)', icon: <GraduationCap size={14} /> },
  ];

  const subjectOptions = [
    { value: 'math', label: 'Toán Học (Đại Số & Hình Học)' },
    { value: 'physics', label: 'Vật Lý (Cơ - Nhiệt - Điện - Quang)' },
    { value: 'chemistry', label: 'Hóa Học (Hữu Cơ & Vô Cơ)' },
    { value: 'english', label: 'Tiếng Anh (IELTS & THPT QG)' },
  ];

  const unitOptions = [
    { value: 'u1', label: 'Unit 1: Life Stories & Achievements' },
    { value: 'u2', label: 'Unit 2: Your Body and Health Care' },
    { value: 'u3', label: 'Unit 3: Music and Global Arts' },
    { value: 'u4', label: 'Unit 4: For a Better Community' },
    { value: 'u5', label: 'Unit 5: Inventions & Technologies' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. CUSTOM SELECT */}
      <ComponentCard item={getSource('select-custom')} onViewCode={onViewCode}>
        <div className="w-full max-w-xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                Chọn Khối Lớp (Có Icon & Auto Placement):
              </label>
              <CustomSelect
                value={grade}
                onChange={(val) => setGrade(String(val))}
                options={gradeOptions}
                placeholder="Chọn khối lớp..."
                icon={<BookOpen size={14} />}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                Chọn Môn Học (Có Tìm Kiếm Fuzzy):
              </label>
              <CustomSelect
                value={subject}
                onChange={(val) => setSubject(String(val))}
                options={subjectOptions}
                placeholder="Tìm môn học..."
                searchable={true}
                searchPlaceholder="Gõ tên môn học..."
              />
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-white/5 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-300">
            Giá trị đã chọn: <span className="font-bold text-blue-600 dark:text-blue-400">Khối: {grade} | Môn: {subject}</span>
          </div>
        </div>
      </ComponentCard>

      {/* 2. CUSTOM MULTI SELECT */}
      <ComponentCard item={getSource('select-custom-multi')} onViewCode={onViewCode}>
        <div className="w-full max-w-xl space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Chọn Nhiều Bài Học (Multi-Select có thẻ chips & tìm kiếm):
            </label>
            <CustomMultiSelect
              values={selectedUnits}
              onChange={(vals) => setSelectedUnits(vals)}
              options={unitOptions}
              placeholder="Chọn các Unit học..."
              searchPlaceholder="Tìm bài học theo tên..."
            />
          </div>

          <div className="p-3 bg-white dark:bg-white/5 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-300">
            Đã chọn {selectedUnits.length} mục: <span className="font-bold text-blue-600 dark:text-blue-400">{selectedUnits.join(', ') || 'Chưa chọn'}</span>
          </div>
        </div>
      </ComponentCard>
    </div>
  );
};
