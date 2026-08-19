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

  return (
    <div className={`relative inline-block w-full ${className}`} ref={containerRef}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-[#121626] border border-[#263152] hover:border-indigo-500/50 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition-all cursor-pointer shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
          disabled ? 'opacity-40 cursor-not-allowed' : ''
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-indigo-400 shrink-0">{icon}</span>}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-indigo-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* CUSTOM DARK POPOVER MENU */}
      {isOpen && !disabled && (
        <div
          className={`absolute left-0 right-0 ${
            openUpwards ? 'bottom-full mb-2' : 'top-full mt-2'
          } z-[9999] bg-[#0c0f1e] border border-[#212c4b] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] p-1.5 space-y-1 max-h-64 flex flex-col select-none animate-slide-up`}
        >
          {searchable && (
            <div className="p-1 border-b border-white/5 shrink-0">
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
            </div>
          )}

          <div className="overflow-y-auto space-y-1 flex-1 scrollbar-thin">
            {isNearMatch && filteredOptions.length > 0 && (
              <div className="px-2.5 py-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 rounded-lg">
                Gợi ý gần đúng nhất ({filteredOptions.length}):
              </div>
            )}
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-500 text-center font-semibold">
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#5c36f5] text-white shadow-sm'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <span className="truncate">{opt.label}</span>
                    </div>
                    {isSelected && <Check size={14} className="text-white shrink-0" />}
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
