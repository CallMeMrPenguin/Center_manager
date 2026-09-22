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

  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateIndicator = useCallback(() => {
    const activeIndex = items.findIndex((btn) => (btn.value ?? btn.id) === activeVal);
    const targetIndex =
      hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < items.length
        ? hoveredIndex
        : activeIndex >= 0
        ? activeIndex
        : 0;

    const targetElement = buttonRefs.current[targetIndex];
    if (targetElement) {
      setIndicatorStyle({
        left: targetElement.offsetLeft,
        width: targetElement.offsetWidth,
      });
    }
  }, [activeVal, hoveredIndex, items]);

  useEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  // Recalculate on window resize or tab switch
  useEffect(() => {
    const handleResize = () => {
      updateIndicator();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateIndicator]);

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
      className={`relative flex items-center bg-slate-200/90 dark:bg-[#090c15] p-0.5 rounded-lg border border-slate-300 dark:border-[#1b233d] shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] select-none shrink-0 transition-colors duration-200 ${
        isFluid ? 'w-full' : 'inline-flex w-fit'
      } ${className}`}
    >
      {/* 1. Fluid Gliding Highlight Pill (Always active, glides to hovered item, returns to active) */}
      <motion.div
        aria-hidden="true"
        className={`absolute top-0.5 bottom-0.5 rounded-md pointer-events-none z-0 ${
          activeColor ||
          'bg-blue-600 shadow-sm border border-blue-500/60'
        }`}
        initial={false}
        animate={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          opacity: indicatorStyle.width > 0 ? 1 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 450,
          damping: 32,
        }}
      />

      {/* 2. Button Items */}
      {items.map((item, index) => {
        const itemVal = (item.value ?? item.id) as T;
        const isActive = itemVal === activeVal;
        const isHovered = hoveredIndex === index;
        const isTarget = hoveredIndex !== null ? isHovered : isActive;
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
            className={`relative z-10 flex items-center justify-center font-black transition-colors cursor-pointer select-none ${
              isFluid ? 'flex-1' : 'shrink-0'
            } ${sizeClasses} ${
              item.disabled
                ? 'opacity-35 cursor-not-allowed text-slate-400 dark:text-slate-500'
                : isTarget
                ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]'
                : isActive
                ? 'text-blue-600 dark:text-blue-400 font-black'
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
                    ? 'bg-white/25 text-white shadow-sm'
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
