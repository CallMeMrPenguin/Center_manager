import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { filterWithNearMatchFallback } from '../utils/fuzzySearch';

export interface SelectOption {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (val: any) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  placement?: 'auto' | 'top' | 'bottom';
}

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

  const handleSelect = (optVal: string | number) => {
    if (disabled) return;
    onChange(optVal);
    setIsOpen(false);
  };

  const { results: filteredOptions, isNearMatch } = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return { results: options, isNearMatch: false };
    }
    return filterWithNearMatchFallback(
      options,
      searchQuery,
      (opt) => opt.label,
      5,
      0.18
    );
  }, [options, searchQuery]);

  const hasCustomWidth = className.includes('w-') || className.includes('min-w-') || className.includes('max-w-');

  return (
    <div className={`relative inline-block ${hasCustomWidth ? '' : 'w-full'} ${className}`} ref={containerRef}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-white dark:bg-[#141417] border-2 border-slate-300 dark:border-[#27272a] hover:border-blue-500 rounded-xl px-3.5 py-2 text-xs font-extrabold text-slate-900 dark:text-white transition-all cursor-pointer shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled ? 'opacity-40 cursor-not-allowed' : ''
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-blue-600 dark:text-blue-400 shrink-0 font-bold">{icon}</span>}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-blue-600 dark:text-blue-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* CUSTOM DUAL THEME POPOVER MENU WITH ELEVATED SOLID CONTRAST */}
      {isOpen && !disabled && (
        <div
          className={`absolute left-0 right-0 ${
            openUpwards ? 'bottom-full mb-2' : 'top-full mt-2'
          } z-[9999] bg-white dark:bg-[#141417] border-2 border-slate-300 dark:border-[#27272a] rounded-2xl shadow-[0_16px_48px_rgba(15,23,42,0.22)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.95)] ring-1 ring-black/5 dark:ring-white/10 p-2 space-y-1.5 max-h-64 flex flex-col select-none animate-slide-up`}
        >
          {searchable && (
            <div className="p-1 border-b border-slate-200 dark:border-white/10 shrink-0">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-slate-100 dark:bg-[#1c1c21] border-2 border-slate-300 dark:border-[#27272a] text-slate-900 dark:text-white placeholder:text-slate-500 font-bold text-xs rounded-xl pl-8 pr-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="overflow-y-auto space-y-1 flex-1 scrollbar-thin">
            {isNearMatch && filteredOptions.length > 0 && (
              <div className="px-2.5 py-1 text-[10px] font-black text-amber-700 dark:text-amber-400 bg-amber-500/15 rounded-lg border border-amber-500/30">
                Gợi ý gần đúng nhất ({filteredOptions.length}):
              </div>
            )}
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400 text-center font-bold">
                Không tìm thấy tùy chọn
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#2563eb] text-white shadow-md font-black'
                        : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#1c1c21] hover:text-blue-600 dark:hover:text-white font-extrabold'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <span className="truncate">{opt.label}</span>
                    </div>
                    {isSelected && <Check size={14} className="text-white shrink-0 stroke-[2.5]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
