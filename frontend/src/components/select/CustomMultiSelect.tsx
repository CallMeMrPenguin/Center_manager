import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { MultiSelectOption, CustomMultiSelectProps } from './types';

export { type MultiSelectOption, type CustomMultiSelectProps };

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
        className={`w-full min-h-[38px] flex items-center justify-between bg-white hover:bg-slate-50 dark:bg-[#181a20] dark:hover:bg-[#20232b] border-0 rounded-xl px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 transition-all cursor-pointer shadow-[0_2px_10px_rgba(15,23,42,0.13),0_0_6px_rgba(15,23,42,0.07)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.18),0_0_8px_rgba(15,23,42,0.09)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.55),0_0_6px_rgba(0,0,0,0.35)] outline-none ${
          disabled ? 'opacity-40 cursor-not-allowed' : ''
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 mr-2 text-left">
          {selectedOptions.length === 0 ? (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          ) : selectedOptions.length <= 2 ? (
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 px-2 py-0.5 rounded-lg text-[11px] font-bold"
              >
                <span>{opt.value}</span>
                <span
                  onClick={(e) => handleRemoveTag(opt.value, e)}
                  className="hover:text-rose-600 p-0.5 rounded transition cursor-pointer"
                  title="Xóa"
                >
                  <X size={11} />
                </span>
              </span>
            ))
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 bg-blue-600 text-white px-2 py-0.5 rounded-lg text-[11px] font-bold">
                {safeValues.length} bài học đã chọn
              </span>
              <span className="text-slate-600 text-[11px] font-bold truncate max-w-[150px]">
                ({safeValues.join(', ')})
              </span>
            </div>
          )}
        </div>

        <ChevronDown
          size={14}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {/* MULTI-SELECT DROPDOWN MENU */}
      {isOpen && !disabled && (
        <div
          className={`absolute left-0 right-0 ${
            openUpwards ? 'bottom-full mb-2' : 'top-full mt-2'
          } z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 space-y-2 max-h-64 flex flex-col select-none outline-none`}
        >
          {/* Search Input */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 font-bold text-xs rounded-xl pl-8 pr-2.5 py-1.5 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center justify-between px-1 text-[11px] border-b border-slate-100 pb-1.5 shrink-0">
            <span className="text-slate-500 font-bold">
              Đã chọn: <strong className="text-blue-600 font-black">{safeValues.length}</strong>/{options.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-blue-600 hover:text-blue-800 font-bold transition cursor-pointer"
              >
                Chọn tất cả
              </button>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-rose-600 hover:text-rose-800 font-bold transition cursor-pointer"
              >
                Bỏ chọn
              </button>
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto space-y-1 flex-1 scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-xs text-slate-400 text-center font-bold">
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
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-800 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition shrink-0 ${
                          isSelected
                            ? 'bg-white border-white text-blue-700'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </div>
                      <div className="truncate">
                        <span className={`mr-1.5 font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>{opt.value}:</span>
                        <span className={isSelected ? 'text-white/95' : 'text-slate-600 font-normal'}>
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

export default CustomMultiSelect;
