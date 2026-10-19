import { ComponentSourceItem } from '../types';

export const selectSources: ComponentSourceItem[] = [
  {
    id: 'select-custom',
    title: 'CustomSelect (Dropdown Tùy Biến Chuẩn Light & Dark Flat)',
    description: 'Chuẩn dropdown thay thế hoàn toàn thẻ select gốc của trình duyệt (AGENTS.md Rule 2.4). Hỗ trợ tìm kiếm mờ (fuzzy search), tự định hướng hiển thị (auto-placement) và hỗ trợ icon.',
    category: 'selects',
    dependencies: ['lucide-react'],
    filename: 'CustomSelect.tsx',
    usageCode: `import { CustomSelect } from '@/components/select';
import { useState } from 'react';
import { BookOpen } from 'lucide-react';

export function Example() {
  const [val, setVal] = useState('10');

  const options = [
    { value: '10', label: 'Khối 10 (Toán & Khoa Học)' },
    { value: '11', label: 'Khối 11 (Nâng Cao)' },
    { value: '12', label: 'Khối 12 (Luyện Thi Đại Học)' },
  ];

  return (
    <div className="w-64">
      <CustomSelect
        value={val}
        onChange={(newVal) => setVal(String(newVal))}
        options={options}
        placeholder="Chọn khối lớp..."
        searchable={true}
        icon={<BookOpen size={14} />}
      />
    </div>
  );
}`,
    sourceCode: `import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { SelectOption, CustomSelectProps } from './types';

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Chọn...',
  className = '',
  icon,
  disabled = false,
  searchable = false,
  searchPlaceholder = 'Tìm kiếm...',
  placement = 'auto',
  triggerClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (placement === 'top') {
        setOpenUpwards(true);
      } else if (placement === 'bottom') {
        setOpenUpwards(false);
      } else if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUpwards(spaceBelow < 260 && rect.top > 260);
      }
      if (searchable) {
        setSearchQuery('');
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }
  }, [isOpen, searchable, placement]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, searchQuery]);

  return (
    <div className={\`relative inline-block w-full \${className}\`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={\`w-full flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98] border-0 outline-none \${
          triggerClassName || 'bg-white hover:bg-slate-50 dark:bg-[#181a20] dark:hover:bg-[#20232b] text-slate-900 dark:text-white'
        } \${disabled ? 'opacity-40 cursor-not-allowed' : ''}\`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-blue-600 dark:text-blue-400 shrink-0 font-bold">{icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown size={14} className={\`text-blue-600 dark:text-blue-400 shrink-0 transition-transform duration-200 \${isOpen ? 'rotate-180' : ''}\`} />
      </button>

      {isOpen && (
        <div className={\`absolute z-50 w-full min-w-[180px] bg-white dark:bg-[#181a20] rounded-xl shadow-xl overflow-hidden border border-slate-200/80 dark:border-white/10 p-1.5 \${
          openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
        }\`}>
          {searchable && (
            <div className="p-1 mb-1">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-white/5 border-0 text-slate-800 dark:text-white outline-none"
              />
            </div>
          )}
          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-center text-xs text-slate-400">Không có kết quả</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className={\`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg text-left transition cursor-pointer border-0 \${
                    String(opt.value) === String(value)
                      ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold'
                      : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                  }\`}
                >
                  <span className="truncate">{opt.label}</span>
                  {String(opt.value) === String(value) && <Check size={14} className="text-blue-600 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};`,
    typesCode: `export interface SelectOption {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
}

export interface CustomSelectProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  placement?: 'auto' | 'top' | 'bottom';
  triggerClassName?: string;
}`
  },
  {
    id: 'select-custom-multi',
    title: 'CustomMultiSelect (Dropdown Chọn Nhiều Giá Trị & Thẻ Chips)',
    description: 'Dropdown chọn nhiều mục với tags/chips hiển thị, chọn tất cả (Select All), xóa tất cả và lọc tìm kiếm.',
    category: 'selects',
    dependencies: ['lucide-react'],
    filename: 'CustomMultiSelect.tsx',
    usageCode: `import { CustomMultiSelect } from '@/components/select';
import { useState } from 'react';

export function Example() {
  const [selectedUnits, setSelectedUnits] = useState<string[]>(['unit-1', 'unit-2']);

  const options = [
    { value: 'unit-1', label: 'Unit 1: Life Stories' },
    { value: 'unit-2', label: 'Unit 2: Your Body and You' },
    { value: 'unit-3', label: 'Unit 3: Music & Arts' },
    { value: 'unit-4', label: 'Unit 4: For a Better Community' },
  ];

  return (
    <div className="w-80">
      <CustomMultiSelect
        values={selectedUnits}
        onChange={(vals) => setSelectedUnits(vals as string[])}
        options={options}
        placeholder="Chọn các Unit cần học..."
        searchPlaceholder="Tìm kiếm Unit..."
      />
    </div>
  );
}`,
    sourceCode: `import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { MultiSelectOption, CustomMultiSelectProps } from './types';

export const CustomMultiSelect: React.FC<CustomMultiSelectProps> = ({
  values = [],
  onChange,
  options = [],
  placeholder = 'Chọn các mục...',
  searchPlaceholder = 'Tìm kiếm...',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (val: string | number) => {
    const exists = values.includes(val);
    if (exists) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  return (
    <div className={\`relative inline-block w-full \${className}\`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-bold transition bg-white dark:bg-[#181a20] text-slate-900 dark:text-white shadow-xs border-0 cursor-pointer"
      >
        <span className="truncate">
          {values.length === 0 ? placeholder : \`Đã chọn \${values.length} mục\`}
        </span>
        <ChevronDown size={14} className="text-blue-600 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-[#181a20] rounded-xl shadow-xl p-2 border border-slate-200 dark:border-white/10">
          <div className="flex gap-1 mb-2">
            <button
              type="button"
              onClick={() => onChange(options.map((o) => o.value))}
              className="px-2 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded border-0 cursor-pointer"
            >
              Chọn tất cả
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              className="px-2 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded border-0 cursor-pointer"
            >
              Bỏ chọn
            </button>
          </div>
          <div className="max-h-52 overflow-y-auto space-y-0.5">
            {options.map((opt) => {
              const selected = values.includes(opt.value);
              return (
                <div
                  key={String(opt.value)}
                  onClick={() => handleToggle(opt.value)}
                  className={\`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer select-none \${
                    selected ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 font-bold' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                  }\`}
                >
                  <span>{opt.label}</span>
                  {selected && <Check size={14} className="text-blue-600" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};`,
    typesCode: `export interface MultiSelectOption {
  value: string | number;
  label: string;
}

export interface CustomMultiSelectProps {
  values: (string | number)[];
  onChange: (values: (string | number)[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
}`
  }
];
