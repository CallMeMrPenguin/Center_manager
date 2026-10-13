import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CustomTimePickerProps {
  value: string; // 'HH:mm' 24h format (e.g. '18:00')
  onChange: (time24: string) => void;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

const ITEM_HEIGHT = 32;
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1 - 12
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 0 - 59
const PERIODS = ['AM', 'PM'] as const;

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
  return { h12, m, period, display: `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}` };
}

function convert12to24(h12: number, m: number, period: 'AM' | 'PM'): string {
  let h24 = h12;
  if (period === 'PM') {
    h24 = h12 === 12 ? 12 : h12 + 12;
  } else {
    h24 = h12 === 12 ? 0 : h12;
  }
  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

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
    if (h >= 0 && h <= 23) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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
  const [openUpwards, setOpenUpwards] = useState(false);
  const parsed = parse24to12(value);
  const [inputText, setInputText] = useState(parsed.display);

  const containerRef = useRef<HTMLDivElement>(null);
  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minScrollRef = useRef<HTMLDivElement>(null);
  const periodScrollRef = useRef<HTMLDivElement>(null);
  const isScrollingByCodeRef = useRef(false);

  useEffect(() => {
    setInputText(parse24to12(value).display);
  }, [value]);

  const scrollWheelToIndex = useCallback((ref: React.RefObject<HTMLDivElement | null>, index: number) => {
    if (!ref.current) return;
    isScrollingByCodeRef.current = true;
    ref.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' });
    setTimeout(() => { isScrollingByCodeRef.current = false; }, 250);
  }, []);

  const syncWheelsToValue = useCallback((valStr: string) => {
    const { h12, m, period } = parse24to12(valStr);
    const hIdx = HOURS.indexOf(h12);
    const mIdx = MINUTES.indexOf(m);
    const pIdx = PERIODS.indexOf(period);
    if (hIdx >= 0) scrollWheelToIndex(hourScrollRef, hIdx);
    if (mIdx >= 0) scrollWheelToIndex(minScrollRef, mIdx);
    if (pIdx >= 0) scrollWheelToIndex(periodScrollRef, pIdx);
  }, [scrollWheelToIndex]);

  useEffect(() => {
    if (isOpen) {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setOpenUpwards(window.innerHeight - rect.bottom < 240 && rect.top > 240);
      }
      setTimeout(() => syncWheelsToValue(value), 50);
    }
  }, [isOpen, value, syncWheelsToValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputText(text);
    const p24 = parseUserTypedString(text);
    if (p24) {
      onChange(p24);
      syncWheelsToValue(p24);
    }
  };

  const handleInputBlur = () => {
    const p24 = parseUserTypedString(inputText);
    if (p24) {
      onChange(p24);
      setInputText(parse24to12(p24).display);
    } else {
      setInputText(parse24to12(value).display);
    }
  };

  const { h12: curH, m: curM, period: curP } = parse24to12(value);

  const handleSelectH = useCallback((h: number) => {
    onChange(convert12to24(h, curM, curP));
    scrollWheelToIndex(hourScrollRef, HOURS.indexOf(h));
  }, [curM, curP, onChange, scrollWheelToIndex]);

  const handleSelectM = useCallback((m: number) => {
    onChange(convert12to24(curH, m, curP));
    scrollWheelToIndex(minScrollRef, MINUTES.indexOf(m));
  }, [curH, curP, onChange, scrollWheelToIndex]);

  const handleSelectP = useCallback((p: 'AM' | 'PM') => {
    onChange(convert12to24(curH, curM, p));
    scrollWheelToIndex(periodScrollRef, PERIODS.indexOf(p));
  }, [curH, curM, onChange, scrollWheelToIndex]);

  // Non-passive wheel event listeners (strictly advances by 1 unit per tick)
  useEffect(() => {
    if (!isOpen) return;

    const onWheelHour = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const step = e.deltaY > 0 ? 1 : -1;
      const curIdx = HOURS.indexOf(curH);
      const nextIdx = Math.max(0, Math.min(HOURS.length - 1, curIdx + step));
      handleSelectH(HOURS[nextIdx]);
    };

    const onWheelMin = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const step = e.deltaY > 0 ? 1 : -1;
      const curIdx = MINUTES.indexOf(curM);
      const nextIdx = Math.max(0, Math.min(MINUTES.length - 1, curIdx + step));
      handleSelectM(MINUTES[nextIdx]);
    };

    const onWheelPeriod = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const step = e.deltaY > 0 ? 1 : -1;
      const curIdx = PERIODS.indexOf(curP);
      const nextIdx = Math.max(0, Math.min(PERIODS.length - 1, curIdx + step));
      handleSelectP(PERIODS[nextIdx]);
    };

    const hEl = hourScrollRef.current;
    const mEl = minScrollRef.current;
    const pEl = periodScrollRef.current;

    hEl?.addEventListener('wheel', onWheelHour, { passive: false });
    mEl?.addEventListener('wheel', onWheelMin, { passive: false });
    pEl?.addEventListener('wheel', onWheelPeriod, { passive: false });

    return () => {
      hEl?.removeEventListener('wheel', onWheelHour);
      mEl?.removeEventListener('wheel', onWheelMin);
      pEl?.removeEventListener('wheel', onWheelPeriod);
    };
  }, [isOpen, curH, curM, curP, handleSelectH, handleSelectM, handleSelectP]);

  // Mouse drag-and-drop scrolling handler (smooth drag to scroll with mouse)
  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    ref: React.RefObject<HTMLDivElement | null>,
    type: 'hour' | 'min' | 'period'
  ) => {
    if (e.button !== 0) return;
    const el = ref.current;
    if (!el) return;
    e.preventDefault();

    const startY = e.clientY;
    const startScroll = el.scrollTop;
    let dragged = false;

    // Temporarily disable snap during drag for 60fps smooth tracking
    el.style.scrollSnapType = 'none';
    el.style.scrollBehavior = 'auto';

    const onMove = (me: MouseEvent) => {
      const diff = me.clientY - startY;
      if (Math.abs(diff) > 2) dragged = true;
      el.scrollTop = startScroll - diff;
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);

      el.style.scrollSnapType = 'y mandatory';
      el.style.scrollBehavior = 'smooth';

      if (dragged) {
        const idx = Math.round(el.scrollTop / ITEM_HEIGHT);
        if (type === 'hour') {
          handleSelectH(HOURS[Math.max(0, Math.min(HOURS.length - 1, idx))]);
        } else if (type === 'min') {
          handleSelectM(MINUTES[Math.max(0, Math.min(MINUTES.length - 1, idx))]);
        } else {
          handleSelectP(PERIODS[Math.max(0, Math.min(PERIODS.length - 1, idx))]);
        }
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const wheelColStyle: React.CSSProperties = {
    paddingTop: ITEM_HEIGHT * 2,
    paddingBottom: ITEM_HEIGHT * 2,
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    overflowX: 'hidden',
    overflowY: 'auto',
  };

  return (
    <div ref={containerRef} className={`relative inline-flex items-center justify-center ${className}`}>
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
        className={`bg-white dark:bg-[#181d2e] border-0 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white font-black shadow-[0_2px_10px_rgba(15,23,42,0.13),0_0_6px_rgba(15,23,42,0.07)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.18),0_0_8px_rgba(15,23,42,0.09)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.55),0_0_6px_rgba(0,0,0,0.35)] focus:outline-none focus:ring-1.5 focus:ring-blue-500 w-24 text-center cursor-pointer transition select-none tracking-wide ${inputClassName}`}
      />

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: openUpwards ? 6 : -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUpwards ? 6 : -6, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className={`absolute z-50 ${
              openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            } left-1/2 -translate-x-1/2 bg-white dark:bg-[#141928] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.7)] p-3 border-0 w-60 select-none animate-in`}
          >
            <div className="grid grid-cols-3 text-center pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/5">
              <span>Giờ</span>
              <span>Phút</span>
              <span>Buổi</span>
            </div>

            <div className="relative h-[160px] my-1 overflow-hidden">
              {/* Center Active Selection Band */}
              <div
                className="absolute inset-x-0 rounded-xl bg-slate-100 dark:bg-white/10 pointer-events-none shadow-2xs z-0"
                style={{ top: ITEM_HEIGHT * 2, height: ITEM_HEIGHT }}
              />

              <div className="relative z-10 grid grid-cols-3 h-full divide-x divide-transparent overflow-hidden">
                {/* HOURS */}
                <div
                  ref={hourScrollRef}
                  style={wheelColStyle}
                  onMouseDown={(e) => handleMouseDown(e, hourScrollRef, 'hour')}
                  className="h-full overflow-y-auto overflow-x-hidden no-scrollbar [&::-webkit-scrollbar]:hidden snap-y snap-mandatory scroll-smooth cursor-grab active:cursor-grabbing select-none"
                  onScroll={(e) => {
                    if (isScrollingByCodeRef.current) return;
                    const idx = Math.round((e.target as HTMLDivElement).scrollTop / ITEM_HEIGHT);
                    const sel = HOURS[idx];
                    if (sel && sel !== curH) onChange(convert12to24(sel, curM, curP));
                  }}
                >
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      onClick={() => handleSelectH(h)}
                      style={{ height: ITEM_HEIGHT }}
                      className={`snap-center flex items-center justify-center text-xs transition-all cursor-pointer font-bold ${
                        h === curH ? 'text-blue-600 dark:text-blue-400 font-black scale-110' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 opacity-60'
                      }`}
                    >
                      {String(h).padStart(2, '0')}
                    </div>
                  ))}
                </div>

                {/* MINUTES */}
                <div
                  ref={minScrollRef}
                  style={wheelColStyle}
                  onMouseDown={(e) => handleMouseDown(e, minScrollRef, 'min')}
                  className="h-full overflow-y-auto overflow-x-hidden no-scrollbar [&::-webkit-scrollbar]:hidden snap-y snap-mandatory scroll-smooth cursor-grab active:cursor-grabbing select-none"
                  onScroll={(e) => {
                    if (isScrollingByCodeRef.current) return;
                    const idx = Math.round((e.target as HTMLDivElement).scrollTop / ITEM_HEIGHT);
                    const sel = MINUTES[idx];
                    if (sel !== undefined && sel !== curM) onChange(convert12to24(curH, sel, curP));
                  }}
                >
                  {MINUTES.map((m) => (
                    <div
                      key={m}
                      onClick={() => handleSelectM(m)}
                      style={{ height: ITEM_HEIGHT }}
                      className={`snap-center flex items-center justify-center text-xs transition-all cursor-pointer font-bold ${
                        m === curM ? 'text-blue-600 dark:text-blue-400 font-black scale-110' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 opacity-60'
                      }`}
                    >
                      {String(m).padStart(2, '0')}
                    </div>
                  ))}
                </div>

                {/* PERIODS */}
                <div
                  ref={periodScrollRef}
                  style={wheelColStyle}
                  onMouseDown={(e) => handleMouseDown(e, periodScrollRef, 'period')}
                  className="h-full overflow-y-auto overflow-x-hidden no-scrollbar [&::-webkit-scrollbar]:hidden snap-y snap-mandatory scroll-smooth cursor-grab active:cursor-grabbing select-none"
                  onScroll={(e) => {
                    if (isScrollingByCodeRef.current) return;
                    const idx = Math.round((e.target as HTMLDivElement).scrollTop / ITEM_HEIGHT);
                    const sel = PERIODS[idx];
                    if (sel && sel !== curP) onChange(convert12to24(curH, curM, sel));
                  }}
                >
                  {PERIODS.map((p) => (
                    <div
                      key={p}
                      onClick={() => handleSelectP(p)}
                      style={{ height: ITEM_HEIGHT }}
                      className={`snap-center flex items-center justify-center text-xs transition-all cursor-pointer font-bold ${
                        p === curP ? 'text-blue-600 dark:text-blue-400 font-black scale-110' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 opacity-60'
                      }`}
                    >
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>

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
