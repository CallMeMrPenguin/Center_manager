import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface CustomMultiSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
}

export const CustomMultiSelect: React.FC<CustomMultiSelectProps> = ({
  values = [],
  onChange,
  options = [],
  placeholder = 'Chọn các bài học...',
  searchPlaceholder = 'Tìm kiếm bài học...',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleToggleOption = (val: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (disabled) return;
    const exists = values.includes(val);
    const next = exists ? values.filter((v) => v !== val) : [...values, val];
    onChange(next);
  };

  const handleRemoveTag = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(values.filter((v) => v !== val));
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
          (opt.sublabel && opt.sublabel.toLowerCase().includes(searchQuery.toLowerCase().trim()))
      )
    : options;

  const selectedOptions = options.filter((o) => values.includes(o.value));

  return (
    <div className={`relative inline-block w-full ${className}`} ref={containerRef}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[38px] flex items-center justify-between bg-[#121626] border border-[#263152] hover:border-indigo-500/50 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition-all cursor-pointer shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
          disabled ? 'opacity-40 cursor-not-allowed' : ''
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 mr-2 text-left">
          {selectedOptions.length === 0 ? (
            <span className="text-slate-400 font-medium">{placeholder}</span>
          ) : selectedOptions.length <= 2 ? (
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 bg-[#5c36f5]/25 border border-[#5c36f5]/40 text-indigo-200 px-2 py-0.5 rounded-lg text-[11px] font-black"
              >
                <span>{opt.value}</span>
                <span
                  onClick={(e) => handleRemoveTag(opt.value, e)}
                  className="hover:text-white p-0.5 rounded transition cursor-pointer"
                >
                  <X size={11} />
                </span>
              </span>
            ))
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 bg-[#5c36f5] text-white px-2 py-0.5 rounded-lg text-[11px] font-black">
                {values.length} bài học đã chọn
              </span>
              <span className="text-slate-400 text-[11px] font-medium truncate max-w-[150px]">
                ({values.join(', ')})
              </span>
            </div>
          )}
        </div>

        <ChevronDown
          size={14}
          className={`text-indigo-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* MULTI-SELECT DROPDOWN MENU */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 mt-2 z-[9999] bg-[#0c0f1e] border border-[#212c4b] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] p-2 space-y-2 max-h-72 flex flex-col select-none animate-slide-up">
          {/* Search Input */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-[#161a29] border border-white/10 text-white text-xs rounded-lg pl-8 pr-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center justify-between px-1 text-[11px] border-b border-white/5 pb-1.5 shrink-0">
            <span className="text-slate-400 font-bold">
              Đã chọn: <strong className="text-indigo-300">{values.length}</strong>/{options.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-indigo-400 hover:text-indigo-300 font-bold transition cursor-pointer"
              >
                Chọn tất cả
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-rose-400 hover:text-rose-300 font-bold transition cursor-pointer"
              >
                Bỏ chọn
              </button>
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto space-y-1 flex-1 scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-xs text-slate-500 text-center font-semibold">
                Không tìm thấy bài học phù hợp
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = values.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={(e) => handleToggleOption(opt.value, e)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#5c36f5]/20 border border-[#5c36f5]/50 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition shrink-0 ${
                          isSelected
                            ? 'bg-[#5c36f5] border-[#5c36f5] text-white'
                            : 'border-slate-600 bg-[#0c0f1d]'
                        }`}
                      >
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </div>
                      <div className="truncate">
                        <span className="font-black text-white mr-1.5">{opt.value}:</span>
                        <span className={isSelected ? 'text-indigo-200' : 'text-slate-300'}>
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
