import React, { useRef, useState } from 'react';
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
  const [hoveredVal, setHoveredVal] = useState<T | null>(null);
  const activeVal =
    controlledValue !== undefined
      ? controlledValue
      : controlledActiveId !== undefined
      ? controlledActiveId
      : internalVal;

  const containerRef = useRef<HTMLDivElement>(null);

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
      onMouseLeave={() => setHoveredVal(null)}
      className={`relative inline-flex items-center rounded-xl bg-slate-200/70 dark:bg-white/10 border-0 select-none shadow-xs ${sizeClasses} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
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
            type="button"
            disabled={disabled}
            onClick={() => handleButtonClick(itemVal, disabled)}
            onMouseEnter={() => setHoveredVal(itemVal)}
            onMouseLeave={() => setHoveredVal((prev) => (prev === itemVal ? null : prev))}
            className={`relative flex items-center justify-center font-bold transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-0 ${buttonSizeClasses} ${
              fit === 'fluid' || fullWidth ? 'flex-1' : ''
            } ${
              isActive
                ? 'text-white font-extrabold z-10'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white z-10'
            }`}
          >
            {/* Sliding Hover Pill Background (matching schedule datepicker day hover) */}
            {hoveredVal === itemVal && !isActive && (
              <motion.div
                layoutId={`${layoutId || 'segmented-control'}-hover`}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-0 rounded-lg bg-slate-300/70 dark:bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_0_12px_rgba(92,54,245,0.25)] pointer-events-none z-0"
              />
            )}

            {/* Sliding Active Pill Background */}
            {isActive && (
              <motion.div
                layoutId={layoutId || 'segmented-control-active'}
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                className={`absolute inset-0 rounded-lg shadow-xs z-0 ${
                  activeColor || 'bg-[#2563eb]'
                }`}
              />
            )}

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
