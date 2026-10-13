import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CustomTimePickerProps {
  value: string; // 'HH:mm' 24-hour format (e.g. '18:00')
  onChange: (time24: string) => void;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

const ITEM_HEIGHT = 32; // px per item
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1 - 12
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 0 - 59
const PERIODS = ['AM', 'PM'] as const;

// 24h ('18:00') -> { h12: 6, m: 0, period: 'PM', display: '06:00 PM' }
function parse24to12(val: string) {
  if (!val || !val.includes(':')) {
    return { h12: 6, m: 0, period: 'PM' as const, display: '06:00 PM' };
  }
  const [hStr, mStr] = val.split(':');
  let h24 = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  if (isNaN(h24)) h24 = 18;
  const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const display = `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  return { h12, m, period, display };
}

// 12h -> 24h ('18:00')
function convert12to24(h12: number, m: number, period: 'AM' | 'PM'): string {
  let h24 = h12;
  if (period === 'PM') {
    h24 = h12 === 12 ? 12 : h12 + 12;
  } else {
    h24 = h12 === 12 ? 0 : h12;
  }
  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Parse user-typed string into 24h format
function parseUserTypedString(str: string): string | null {
  const clean = str.trim().toLowerCase();
  const isPM = clean.includes('pm') || clean.includes('chiều') || clean.includes('tối');
  const isAM = clean.includes('am') || clean.includes('sáng');

  const match = clean.match(/(\d{1,2})[:\s\.\-](\d{1,2})/);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = Math.min(59, Math.max(0, parseInt(match[2], 10)));
    if (isNaN(h)) return null;

    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    if (h >= 0 && h <= 23) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  const singleNumMatch = clean.match(/^(\d{1,2})$/);
  if (singleNumMatch) {
    let h = parseInt(singleNumMatch[1], 10);
    if (isPM && h < 12) h += 12;
    if (h >= 0 && h <= 23) {
      return `${String(h).padStart(2, '0')}:00`;
    }
  }
  return null;
}

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  value,
  onChange,
  className = '',
  inputClassName = '',
  disabled = false,
  required = false,
  placeholder = '06:00 PM',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const parsed = parse24to12(value);
  const [inputText, setInputText] = useState(parsed.display);

  const containerRef = useRef<HTMLDivElement>(null);
  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minScrollRef = useRef<HTMLDivElement>(null);
  const periodScrollRef = useRef<HTMLDivElement>(null);
  const isScrollingByCodeRef = useRef(false);

  // Sync input text when external value changes
  useEffect(() => {
    setInputText(parse24to12(value).display);
  }, [value]);

  // Scroll a specific column wheel to an index with smooth animation
  const scrollWheelToIndex = useCallback((ref: React.RefObject<HTMLDivElement | null>, index: number) => {
    if (!ref.current) return;
    isScrollingByCodeRef.current = true;
    ref.current.scrollTo({
      top: index * ITEM_HEIGHT,
      behavior: 'smooth',
    });
    setTimeout(() => {
      isScrollingByCodeRef.current = false;
    }, 300);
  }, []);

  // Sync wheels to current value whenever popover opens or value changes
  const syncWheelsToValue = useCallback((valStr: string) => {
    const { h12, m, period } = parse24to12(valStr);
    const hourIdx = HOURS.indexOf(h12);
    const minIdx = MINUTES.indexOf(m);
    const periodIdx = PERIODS.indexOf(period);

    if (hourIdx >= 0) scrollWheelToIndex(hourScrollRef, hourIdx);
    if (minIdx >= 0) scrollWheelToIndex(minScrollRef, minIdx);
    if (periodIdx >= 0) scrollWheelToIndex(periodScrollRef, periodIdx);
  }, [scrollWheelToIndex]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        syncWheelsToValue(value);
      }, 50);
    }
  }, [isOpen, value, syncWheelsToValue]);

  // Handle typing inside text input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputText(text);

    const parsed24 = parseUserTypedString(text);
    if (parsed24) {
      onChange(parsed24);
      syncWheelsToValue(parsed24);
    }
  };

  const handleInputBlur = () => {
    const parsed24 = parseUserTypedString(inputText);
    if (parsed24) {
      onChange(parsed24);
      setInputText(parse24to12(parsed24).display);
    } else {
      setInputText(parse24to12(value).display);
    }
  };

  // Wheel selection handlers
  const handleSelectHour = (h: number) => {
    const { m, period } = parse24to12(value);
    const new24 = convert12to24(h, m, period);
    onChange(new24);
    scrollWheelToIndex(hourScrollRef, HOURS.indexOf(h));
  };

  const handleSelectMinute = (m: number) => {
    const { h12, period } = parse24to12(value);
    const new24 = convert12to24(h12, m, period);
    onChange(new24);
    scrollWheelToIndex(minScrollRef, MINUTES.indexOf(m));
  };

  const handleSelectPeriod = (p: 'AM' | 'PM') => {
    const { h12, m } = parse24to12(value);
    const new24 = convert12to24(h12, m, p);
    onChange(new24);
    scrollWheelToIndex(periodScrollRef, PERIODS.indexOf(p));
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const [openUpwards, setOpenUpwards] = useState(false);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpwards(spaceBelow < 250 && rect.top > 250);
    }
  }, [isOpen]);

  const { h12: currentH12, m: currentM, period: currentPeriod } = parse24to12(value);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* 1. Main Direct-Editable Text Input (No clock icon) */}
      <input
        type="text"
        disabled={disabled}
        required={required}
        value={inputText}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        onBlur={handleInputBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleInputBlur();
            setIsOpen(false);
          }
        }}
        placeholder={placeholder}
        className={`bg-white dark:bg-[#181d2e] border-0 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white font-black shadow-2xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 w-24 text-center cursor-pointer transition select-none tracking-wide ${inputClassName}`}
      />

      {/* 2. Interactive Time Wheel Popover */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: openUpwards ? 6 : -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUpwards ? 6 : -6, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className={`absolute z-50 ${
              openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            } right-0 bg-white dark:bg-[#141928] rounded-2xl shadow-xl dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] p-3 border-0 w-60 select-none animate-in`}
          >
            {/* Column Headers */}
            <div className="grid grid-cols-3 text-center pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/5">
              <span>Giờ</span>
              <span>Phút</span>
              <span>Buổi</span>
            </div>

            {/* 3 Wheels Container with Center Highlight Lens */}
            <div className="relative h-[160px] my-1">
              {/* Apple / iOS Center Lens Indicator */}
              <div
                className="absolute inset-x-0 rounded-xl bg-slate-100 dark:bg-white/10 pointer-events-none shadow-2xs z-0"
                style={{
                  top: ITEM_HEIGHT * 2, // 64px
                  height: ITEM_HEIGHT, // 32px
                }}
              />

              <div className="relative z-10 grid grid-cols-3 h-full divide-x divide-transparent">
                {/* WHEEL 1: HOURS (01 - 12) */}
                <div
                  ref={hourScrollRef}
                  className="h-full overflow-y-auto scrollbar-none snap-y snap-mandatory scroll-smooth"
                  style={{
                    paddingTop: ITEM_HEIGHT * 2,
                    paddingBottom: ITEM_HEIGHT * 2,
                  }}
                  onScroll={(e) => {
                    if (isScrollingByCodeRef.current) return;
                    const top = (e.target as HTMLDivElement).scrollTop;
                    const idx = Math.round(top / ITEM_HEIGHT);
                    const selectedH = HOURS[idx];
                    if (selectedH && selectedH !== currentH12) {
                      const new24 = convert12to24(selectedH, currentM, currentPeriod);
                      onChange(new24);
                    }
                  }}
                >
                  {HOURS.map((h) => {
                    const isSelected = h === currentH12;
                    return (
                      <div
                        key={h}
                        onClick={() => handleSelectHour(h)}
                        style={{ height: ITEM_HEIGHT }}
                        className={`snap-center flex items-center justify-center text-xs transition-all cursor-pointer font-bold ${
                          isSelected
                            ? 'text-blue-600 dark:text-blue-400 font-black scale-110'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white opacity-70'
                        }`}
                      >
                        {String(h).padStart(2, '0')}
                      </div>
                    );
                  })}
                </div>

                {/* WHEEL 2: MINUTES (00 - 59) */}
                <div
                  ref={minScrollRef}
                  className="h-full overflow-y-auto scrollbar-none snap-y snap-mandatory scroll-smooth"
                  style={{
                    paddingTop: ITEM_HEIGHT * 2,
                    paddingBottom: ITEM_HEIGHT * 2,
                  }}
                  onScroll={(e) => {
                    if (isScrollingByCodeRef.current) return;
                    const top = (e.target as HTMLDivElement).scrollTop;
                    const idx = Math.round(top / ITEM_HEIGHT);
                    const selectedM = MINUTES[idx];
                    if (selectedM !== undefined && selectedM !== currentM) {
                      const new24 = convert12to24(currentH12, selectedM, currentPeriod);
                      onChange(new24);
                    }
                  }}
                >
                  {MINUTES.map((m) => {
                    const isSelected = m === currentM;
                    return (
                      <div
                        key={m}
                        onClick={() => handleSelectMinute(m)}
                        style={{ height: ITEM_HEIGHT }}
                        className={`snap-center flex items-center justify-center text-xs transition-all cursor-pointer font-bold ${
                          isSelected
                            ? 'text-blue-600 dark:text-blue-400 font-black scale-110'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white opacity-70'
                        }`}
                      >
                        {String(m).padStart(2, '0')}
                      </div>
                    );
                  })}
                </div>

                {/* WHEEL 3: AM / PM */}
                <div
                  ref={periodScrollRef}
                  className="h-full overflow-y-auto scrollbar-none snap-y snap-mandatory scroll-smooth"
                  style={{
                    paddingTop: ITEM_HEIGHT * 2,
                    paddingBottom: ITEM_HEIGHT * 2,
                  }}
                  onScroll={(e) => {
                    if (isScrollingByCodeRef.current) return;
                    const top = (e.target as HTMLDivElement).scrollTop;
                    const idx = Math.round(top / ITEM_HEIGHT);
                    const selectedP = PERIODS[idx];
                    if (selectedP && selectedP !== currentPeriod) {
                      const new24 = convert12to24(currentH12, currentM, selectedP);
                      onChange(new24);
                    }
                  }}
                >
                  {PERIODS.map((p) => {
                    const isSelected = p === currentPeriod;
                    return (
                      <div
                        key={p}
                        onClick={() => handleSelectPeriod(p)}
                        style={{ height: ITEM_HEIGHT }}
                        className={`snap-center flex items-center justify-center text-xs transition-all cursor-pointer font-bold ${
                          isSelected
                            ? 'text-blue-600 dark:text-blue-400 font-black scale-110'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white opacity-70'
                        }`}
                      >
                        {p}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-white/5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const now24 = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                  onChange(now24);
                  syncWheelsToValue(now24);
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer border-0 bg-transparent"
              >
                Hiện tại
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-0.5 rounded-lg bg-blue-600 text-white font-black hover:bg-blue-700 transition cursor-pointer border-0 shadow-2xs"
              >
                Xong
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomTimePicker;
