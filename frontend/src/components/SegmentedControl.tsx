import React, { useEffect, useRef, useState, useCallback, useId } from 'react';
import { motion } from 'framer-motion';

export interface SegmentOption<T extends string = string> {
  value?: T;
  id?: T;
  label?: string | null;
  isLogo?: boolean;
  icon?: React.ComponentType<{ size: number; className?: string }> | React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  options?: SegmentOption<T>[];
  buttons?: SegmentOption<T>[];
  value?: T;
  activeId?: T;
  defaultActive?: T;
  onChange?: (val: T) => void;
  className?: string;
  activeColor?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fit?: 'content' | 'fluid';
  fullWidth?: boolean;
  layoutId?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  buttons,
  value: controlledValue,
  activeId: controlledActiveId,
  defaultActive,
  onChange,
  className = '',
  activeColor,
  size = 'md',
  fit = 'content',
  fullWidth,
}: SegmentedControlProps<T>) {
  const items = options || buttons || [];
  const initialVal =
    controlledValue ??
    controlledActiveId ??
    defaultActive ??
    (items.length > 0 ? (items[0].value ?? items[0].id) : undefined);

  const [internalVal, setInternalVal] = useState<T | undefined>(initialVal);
  const activeVal =
    controlledValue !== undefined
      ? controlledValue
      : controlledActiveId !== undefined
      ? controlledActiveId
      : internalVal;

  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverStyle, setHoverStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeIndex = items.findIndex((btn) => (btn.value ?? btn.id) === activeVal);
    const activeElement = buttonRefs.current[activeIndex];

    if (activeElement) {
      setIndicatorStyle({
        left: activeElement.offsetLeft,
        width: activeElement.offsetWidth,
      });
    }
  }, [activeVal, items]);

  useEffect(() => {
    if (hoveredIndex !== null) {
      const hoveredElement = buttonRefs.current[hoveredIndex];
      if (hoveredElement) {
        setHoverStyle({
          left: hoveredElement.offsetLeft,
          width: hoveredElement.offsetWidth,
        });
      }
    } else {
      if (containerRef.current) {
        setHoverStyle({
          left: 0,
          width: containerRef.current.offsetWidth,
        });
      }
    }
  }, [hoveredIndex]);

  useEffect(() => {
    if (containerRef.current) {
      setHoverStyle({
        left: 0,
        width: containerRef.current.offsetWidth,
      });
    }
  }, [items]);

  // Recalculate on window resize or tab switch
  useEffect(() => {
    const handleResize = () => {
      const activeIndex = items.findIndex((btn) => (btn.value ?? btn.id) === activeVal);
      const activeElement = buttonRefs.current[activeIndex];
      if (activeElement) {
        setIndicatorStyle({
          left: activeElement.offsetLeft,
          width: activeElement.offsetWidth,
        });
      }
      if (hoveredIndex === null && containerRef.current) {
        setHoverStyle({
          left: 0,
          width: containerRef.current.offsetWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeVal, hoveredIndex, items]);

  const handleButtonClick = (buttonVal: T, disabled?: boolean) => {
    if (disabled) return;
    if (controlledValue === undefined && controlledActiveId === undefined) {
      setInternalVal(buttonVal);
    }
    onChange?.(buttonVal);
  };

  const isFluid = fullWidth || fit === 'fluid' || className.includes('w-full') || className.includes('flex-1');

  const sizeClasses = {
    xs: 'text-[11px] py-1 px-2.5 gap-1 min-h-[26px]',
    sm: 'text-xs py-1 px-3 gap-1.5 min-h-[28px]',
    md: 'text-xs py-1.5 px-3.5 gap-1.5 min-h-[32px]',
    lg: 'text-sm py-2 px-4 gap-2 min-h-[38px]',
  }[size];

  const iconSizes = {
    xs: 12,
    sm: 13,
    md: 14,
    lg: 16,
  }[size];

  return (
    <div
      ref={containerRef}
      role="group"
      onMouseLeave={() => setHoveredIndex(null)}
      className={`relative inline-flex items-center justify-start rounded-full select-none shrink-0 transition-colors ${
        isFluid ? 'w-full' : 'w-fit'
      } ${className}`}
    >
      {/* 1. Full-width Initial Hover Background that Collapses onto Hovered Item */}
      <motion.div
        aria-hidden="true"
        className="absolute top-0 bottom-0 rounded-full bg-black/10 dark:bg-white/15 pointer-events-none z-0"
        animate={{
          left: hoverStyle.left,
          width: hoverStyle.width,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
      />

      {/* 2. Tactile Active Indicator Pill */}
      <motion.div
        aria-hidden="true"
        className={`absolute top-0 bottom-0 rounded-full pointer-events-none z-0 ${
          activeColor ||
          'bg-gradient-to-b from-[#A8A8A8] to-[#D3D3D3] shadow-[inset_0_1px_0_0_rgba(0,0,0,0.15),inset_0_-1px_0_0_rgba(255,255,255,0.30),inset_0_0_0_1px_rgba(0,0,0,0.10),inset_0_-6px_10.5px_0_rgba(0,0,0,0.08)] dark:from-[#D3D3D3] dark:to-[#A8A8A8] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.30),inset_0_-1px_0_0_rgba(255,255,255,0.60),inset_0_0_0_1px_rgba(255,255,255,0.30),inset_0_-6px_10.5px_0_rgba(255,255,255,0.13)]'
        }`}
        animate={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
      />

      {/* 3. Button Items */}
      {items.map((item, index) => {
        const itemVal = (item.value ?? item.id) as T;
        const isActive = itemVal === activeVal;
        const Icon = item.icon;

        return (
          <button
            key={String(itemVal)}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            disabled={item.disabled}
            onClick={() => handleButtonClick(itemVal, item.disabled)}
            onMouseEnter={() => setHoveredIndex(index)}
            className={`relative z-10 flex items-center justify-center font-black rounded-full transition-colors cursor-pointer select-none ${
              isFluid ? 'flex-1' : 'shrink-0'
            } ${sizeClasses} ${
              item.disabled
                ? 'opacity-35 cursor-not-allowed text-slate-400 dark:text-slate-500'
                : isActive
                ? activeColor
                  ? 'text-white drop-shadow-xs'
                  : 'text-black [text-shadow:_0px_1px_0px_rgb(255_255_255_/_0.65)] dark:text-black/80'
                : 'text-slate-800 dark:text-neutral-200 hover:text-black dark:hover:text-white'
            }`}
          >
            {/* Optional Icon */}
            {Icon && (
              <span className="relative z-10 shrink-0 flex items-center justify-center">
                {React.isValidElement(Icon)
                  ? Icon
                  : typeof Icon === 'function' ||
                    (typeof Icon === 'object' && Icon !== null && ('render' in Icon || '$$typeof' in Icon))
                  ? React.createElement(Icon as any, { size: iconSizes })
                  : null}
              </span>
            )}

            {/* Label */}
            {item.label && <span className="relative z-10 truncate">{item.label}</span>}

            {/* Optional Badge */}
            {item.badge !== undefined && (
              <span
                className={`relative z-10 ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black shrink-0 transition-colors font-mono ${
                  isActive
                    ? 'bg-white/30 text-black dark:text-black shadow-xs'
                    : 'bg-slate-300 dark:bg-white/10 text-slate-800 dark:text-slate-300'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export const SegmentedButton = SegmentedControl;
export default SegmentedControl;
