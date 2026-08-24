import React, { useRef, useState, useLayoutEffect, useEffect, useCallback } from 'react';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
  activeColor?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fit?: 'content' | 'fluid';
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className = '',
  activeColor = 'bg-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.5)]',
  size = 'md',
  fit = 'content',
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<T, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 4, width: 0 });
  const [hasMeasured, setHasMeasured] = useState(false);

  const updateIndicator = useCallback(() => {
    const btn = buttonRefs.current.get(value);
    const container = containerRef.current;
    if (btn && container) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const left = btnRect.left - containerRect.left;
      const width = btnRect.width;
      if (width > 0) {
        setIndicatorStyle({ left, width });
        setHasMeasured(true);
      }
    }
  }, [value]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator, options]);

  useEffect(() => {
    const handleResize = () => updateIndicator();
    window.addEventListener('resize', handleResize);

    // Recalculate when fonts finish loading to prevent text width shifts
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => updateIndicator());
    }

    let observer: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => updateIndicator());
      observer.observe(containerRef.current);
      buttonRefs.current.forEach((btn) => {
        if (btn) observer?.observe(btn);
      });
    }

    const raf1 = requestAnimationFrame(updateIndicator);
    const raf2 = setTimeout(updateIndicator, 50);

    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(raf2);
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
    };
  }, [updateIndicator]);

  const sizeStyles = {
    xs: 'py-0.5 px-2.5 text-[11px]',
    sm: 'py-1 px-3 text-xs',
    md: 'py-1.5 px-3.5 text-xs',
    lg: 'py-2 px-4.5 text-sm',
  };

  const pyClass = sizeStyles[size] || sizeStyles.md;
  const isExplicitlyFluid = fit === 'fluid' || className.includes('w-full') || className.includes('flex-1');

  return (
    <div
      ref={containerRef}
      className={`relative ${
        isExplicitlyFluid ? 'flex w-full' : 'inline-flex w-fit'
      } items-center bg-[#090d16] p-1 rounded-xl border border-[#1b253b] font-bold select-none max-w-full overflow-x-auto scrollbar-none ${className}`}
    >
      {/* Dynamic Sliding Pill Indicator */}
      <div
        className={`absolute top-1 bottom-1 rounded-lg ${activeColor} transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none ${
          hasMeasured && indicatorStyle.width > 0 ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
        }}
      />

      {/* Option Buttons */}
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              if (el) buttonRefs.current.set(opt.value, el);
              else buttonRefs.current.delete(opt.value);
            }}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`${
              isExplicitlyFluid ? 'flex-1' : 'shrink-0'
            } relative z-10 ${pyClass} text-center transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              isActive ? 'text-white font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
                }`}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
