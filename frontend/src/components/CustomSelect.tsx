import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

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
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Chọn...',
  className = '',
  icon,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optVal: string | number) => {
    if (disabled) return;
    onChange(optVal);
    setIsOpen(false);
  };

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
        <div className="absolute left-0 right-0 mt-2 z-[9999] bg-[#0c0f1e] border border-[#212c4b] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] p-1.5 space-y-1 max-h-60 overflow-y-auto select-none animate-slide-up">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-500 text-center font-semibold">
              Không có tùy chọn
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[#5c36f5] text-white shadow-[0_0_14px_rgba(92,54,245,0.5)]'
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
      )}
    </div>
  );
};
