import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
  activeColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className = '',
  activeColor = 'bg-blue-600 shadow-[0_0_14px_rgba(37,99,235,0.45)]',
  size = 'md',
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<T, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 4, width: 0 });
  const [hasMeasured, setHasMeasured] = useState(false);

  const updateIndicator = () => {
    const btn = buttonRefs.current.get(value);
    const container = containerRef.current;
    if (btn && container) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const left = btnRect.left - containerRect.left;
      const width = btnRect.width;
      setIndicatorStyle({ left, width });
      setHasMeasured(true);
    }
  };

  useLayoutEffect(() => {
    updateIndicator();
  }, [value, options]);

  useEffect(() => {
    const handleResize = () => updateIndicator();
    window.addEventListener('resize', handleResize);

    let observer: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => updateIndicator());
      observer.observe(containerRef.current);
    }

    const raf = requestAnimationFrame(updateIndicator);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
    };
  }, [value]);

  const pyClass = size === 'sm' ? 'py-1 text-xs' : size === 'lg' ? 'py-2.5 text-sm' : 'py-2 text-xs';

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center bg-[#090d16] p-1 rounded-xl border border-[#1b253b] font-bold select-none ${className}`}
    >
      {/* Dynamic Sliding Pill Indicator */}
      <div
        className={`absolute top-1 bottom-1 rounded-lg ${activeColor} transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none ${
          hasMeasured ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
        }}
      />

      {/* Button Options */}
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
            className={`flex-1 relative z-10 ${pyClass} px-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              isActive ? 'text-white font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
