import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface CustomMultiSelectProps {
  values?: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  placement?: 'auto' | 'top' | 'bottom';
}

export const CustomMultiSelect: React.FC<CustomMultiSelectProps> = ({
  values = [],
  onChange,
  options = [],
  placeholder = 'Chọn các bài học...',
  searchPlaceholder = 'Tìm kiếm bài học...',
  className = '',
  disabled = false,
  placement = 'auto',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const safeValues = Array.isArray(values)
    ? values
    : typeof values === 'string' && (values as string).trim()
    ? [(values as string).trim()]
    : [];

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
      setSearchQuery('');
      if (placement === 'top') {
        setOpenUpwards(true);
      } else if (placement === 'bottom') {
        setOpenUpwards(false);
      } else if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUpwards(spaceBelow < 280 && rect.top > 280);
      }
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, placement]);

  const handleToggleOption = (val: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (disabled) return;
    const exists = safeValues.includes(val);
    const next = exists ? safeValues.filter((v) => v !== val) : [...safeValues, val];
    onChange(next);
  };

  const handleRemoveTag = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(safeValues.filter((v) => v !== val));
  };

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(options.map((o) => o.value));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const filteredOptions = searchQuery.trim()
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          opt.value.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          (opt.sublabel && opt.sublabel.toLowerCase().includes(searchQuery.toLowerCase().trim()))
      )
    : options;

  const selectedOptions = options.filter((o) => safeValues.includes(o.value));

  return (
    <div className={`relative inline-block w-full ${className}`} ref={containerRef}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[38px] flex items-center justify-between bg-white dark:bg-[#101426] border-2 border-slate-300 dark:border-[#2a375f] hover:border-indigo-500 rounded-xl px-3.5 py-1.5 text-xs font-extrabold text-slate-900 dark:text-white transition-all cursor-pointer shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          disabled ? 'opacity-40 cursor-not-allowed' : ''
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 mr-2 text-left">
          {selectedOptions.length === 0 ? (
            <span className="text-slate-500 font-bold">{placeholder}</span>
          ) : selectedOptions.length <= 2 ? (
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-500/25 border border-indigo-200 dark:border-indigo-500/40 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-lg text-[11px] font-black"
              >
                <span>{opt.value}</span>
                <span
                  onClick={(e) => handleRemoveTag(opt.value, e)}
                  className="hover:text-rose-600 dark:hover:text-white p-0.5 rounded transition cursor-pointer"
                  title="Xóa"
                >
                  <X size={11} />
                </span>
              </span>
            ))
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 bg-[#5c36f5] text-white px-2 py-0.5 rounded-lg text-[11px] font-black">
                {safeValues.length} bài học đã chọn
              </span>
              <span className="text-slate-600 dark:text-slate-400 text-[11px] font-bold truncate max-w-[150px]">
                ({safeValues.join(', ')})
              </span>
            </div>
          )}
        </div>

        <ChevronDown
          size={14}
          className={`text-indigo-600 dark:text-indigo-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* MULTI-SELECT DROPDOWN MENU */}
      {isOpen && !disabled && (
        <div
          className={`absolute left-0 right-0 ${
            openUpwards ? 'bottom-full mb-2' : 'top-full mt-2'
          } z-[9999] bg-white dark:bg-[#161d36] border-2 border-slate-300 dark:border-[#3b4d82] rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.25)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.95)] ring-1 ring-black/5 dark:ring-white/10 p-2.5 space-y-2 max-h-64 flex flex-col select-none animate-slide-up`}
        >
          {/* Search Input */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-slate-100 dark:bg-[#0c1020] border-2 border-slate-300 dark:border-[#2a375f] text-slate-900 dark:text-white placeholder:text-slate-500 font-bold text-xs rounded-xl pl-8 pr-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center justify-between px-1 text-[11px] border-b border-slate-200 dark:border-white/10 pb-1.5 shrink-0">
            <span className="text-slate-600 dark:text-slate-400 font-bold">
              Đã chọn: <strong className="text-indigo-700 dark:text-indigo-300 font-black">{safeValues.length}</strong>/{options.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-black transition cursor-pointer"
              >
                Chọn tất cả
              </button>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-rose-700 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-300 font-black transition cursor-pointer"
              >
                Bỏ chọn
              </button>
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto space-y-1 flex-1 scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-xs text-slate-500 dark:text-slate-400 text-center font-bold">
                Không tìm thấy bài học phù hợp
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = safeValues.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={(e) => handleToggleOption(opt.value, e)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#5c36f5] text-white shadow-sm'
                        : 'text-slate-900 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-white/10 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition shrink-0 ${
                          isSelected
                            ? 'bg-white border-white text-indigo-700'
                            : 'border-slate-400 dark:border-slate-600 bg-white dark:bg-[#0c0f1d]'
                        }`}
                      >
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </div>
                      <div className="truncate">
                        <span className={`mr-1.5 font-black ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{opt.value}:</span>
                        <span className={isSelected ? 'text-white/95' : 'text-slate-700 dark:text-slate-300 font-medium'}>
                          {opt.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
