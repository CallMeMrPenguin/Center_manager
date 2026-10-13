import React, { useEffect, useRef, useState } from 'react';
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
  layoutId,
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

  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverStyle, setHoverStyle] = useState({ left: 0, width: 0 });
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeIndex = items.findIndex(
    (opt, idx) => (opt.value ?? opt.id ?? String(idx)) === activeVal
  );

  useEffect(() => {
    const activeElement = buttonRefs.current[activeIndex];
    if (activeElement) {
      setIndicatorStyle({
        left: activeElement.offsetLeft,
        width: activeElement.offsetWidth,
      });
    }
  }, [activeVal, activeIndex, items]);

  useEffect(() => {
    const updatePositions = () => {
      const activeElement = buttonRefs.current[activeIndex];
      if (activeElement) {
        setIndicatorStyle({
          left: activeElement.offsetLeft,
          width: activeElement.offsetWidth,
        });
      }
    };
    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, [activeIndex]);

  useEffect(() => {
    if (hoveredIndex !== null) {
      const hoveredElement = buttonRefs.current[hoveredIndex];
      if (hoveredElement) {
        setHoverStyle({
          left: hoveredElement.offsetLeft,
          width: hoveredElement.offsetWidth,
        });
      }
    }
  }, [hoveredIndex]);

  const handleButtonClick = (buttonVal: T, disabled?: boolean) => {
    if (disabled) return;
    if (controlledValue === undefined && controlledActiveId === undefined) {
      setInternalVal(buttonVal);
    }
    onChange?.(buttonVal);
  };

  const sizeClasses = {
    xs: 'p-0.5 text-[11px] gap-0.5',
    sm: 'p-0.5 text-xs gap-1',
    md: 'p-1 text-xs gap-1',
    lg: 'p-1.5 text-sm gap-1.5',
  }[size];

  const buttonSizeClasses = {
    xs: 'px-2 py-0.5 min-h-[24px]',
    sm: 'px-2.5 py-1 min-h-[28px]',
    md: 'px-3.5 py-1.5 min-h-[32px]',
    lg: 'px-4.5 py-2 min-h-[38px]',
  }[size];

  return (
    <div
      ref={containerRef}
      onMouseLeave={() => setHoveredIndex(null)}
      className={`relative inline-flex items-center rounded-xl bg-slate-200/70 dark:bg-white/10 border-0 select-none shadow-[0_1px_3px_rgba(15,23,42,0.1),0_1px_2px_rgba(15,23,42,0.06)] ${sizeClasses} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      role="group"
    >
      {/* Sliding Hover Pill Background */}
      <motion.div
        className="absolute top-1 bottom-1 rounded-lg bg-black/10 dark:bg-white/15 pointer-events-none"
        initial={false}
        animate={{
          left: hoverStyle.left,
          width: hoverStyle.width,
          opacity: hoveredIndex !== null && hoveredIndex !== activeIndex ? 1 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
      />

      {/* Sliding Active Pill Background */}
      <motion.div
        className={`absolute top-1 bottom-1 rounded-lg shadow-[0_1px_4px_rgba(0,0,0,0.2)] pointer-events-none ${
          activeColor || 'bg-[#2563eb]'
        }`}
        initial={false}
        animate={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          opacity: indicatorStyle.width > 0 ? 1 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
      />

      {items.map((opt, idx) => {
        const itemVal = (opt.value ?? opt.id ?? String(idx)) as T;
        const isActive = activeVal === itemVal;
        const disabled = opt.disabled;

        const renderIcon = () => {
          if (!opt.icon) return null;
          if (React.isValidElement(opt.icon)) {
            return <span className="shrink-0">{opt.icon}</span>;
          }
          if (typeof opt.icon === 'function') {
            const IconComp = opt.icon as React.ComponentType<{ size: number; className?: string }>;
            return <IconComp size={size === 'xs' ? 12 : 14} className="shrink-0" />;
          }
          return null;
        };

        return (
          <button
            key={itemVal}
            ref={(el) => {
              buttonRefs.current[idx] = el;
            }}
            type="button"
            disabled={disabled}
            onClick={() => handleButtonClick(itemVal, disabled)}
            onMouseEnter={() => setHoveredIndex(idx)}
            className={`relative z-10 flex items-center justify-center font-bold transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-0 ${buttonSizeClasses} ${
              fit === 'fluid' || fullWidth ? 'flex-1' : ''
            } ${
              isActive
                ? 'text-white font-extrabold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <div className="relative z-10 flex items-center gap-1.5 truncate">
              {renderIcon()}
              {opt.label && <span className="truncate">{opt.label}</span>}
              {opt.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-black ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-300 dark:bg-white/20 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {opt.badge}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
