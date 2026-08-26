import React, { useId, useState } from 'react';
import { motion } from 'framer-motion';

export interface SegmentOption<T extends string = string> {
  value?: T;
  id?: T;
  label: string;
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
  activeColor = 'bg-[#5c36f5] shadow-[0_0_18px_rgba(92,54,245,0.65)]',
  size = 'md',
  fit = 'content',
  fullWidth,
  layoutId: customLayoutId,
}: SegmentedControlProps<T>) {
  const autoId = useId();
  const baseLayoutId = customLayoutId || `seg-${autoId.replace(/:/g, '')}`;

  const items = options || buttons || [];
  const initialVal = controlledValue ?? controlledActiveId ?? defaultActive ?? (items.length > 0 ? (items[0].value ?? items[0].id) : undefined);
  const [internalVal, setInternalVal] = useState<T | undefined>(initialVal);
  const [hoveredVal, setHoveredVal] = useState<T | null>(null);

  const activeVal = controlledValue !== undefined ? controlledValue : (controlledActiveId !== undefined ? controlledActiveId : internalVal);

  const isFluid = fullWidth || fit === 'fluid' || className.includes('w-full') || className.includes('flex-1');

  const handleSelect = (val: T, disabled?: boolean) => {
    if (disabled) return;
    if (controlledValue === undefined && controlledActiveId === undefined) {
      setInternalVal(val);
    }
    onChange?.(val);
  };

  const sizeClasses = {
    xs: 'text-[11px] py-1 px-2.5 gap-1.5',
    sm: 'text-xs py-1.5 px-3 gap-1.5',
    md: 'text-xs py-2 px-3.5 gap-2',
    lg: 'text-sm py-2.5 px-4.5 gap-2.5',
  }[size];

  const iconSizes = {
    xs: 12,
    sm: 13,
    md: 14,
    lg: 16,
  }[size];

  return (
    <div
      onMouseLeave={() => setHoveredVal(null)}
      className={`relative flex items-center bg-[#090c15] p-1 rounded-xl border border-[#1b233d] select-none shrink-0 ${
        isFluid ? 'w-full' : 'inline-flex w-fit'
      } ${className}`}
    >
      {items.map((item) => {
        const itemVal = (item.value ?? item.id) as T;
        const isActive = itemVal === activeVal;
        const isHovered = itemVal === hoveredVal && !isActive && !item.disabled;
        const Icon = item.icon;

        return (
          <button
            key={String(itemVal)}
            type="button"
            disabled={item.disabled}
            onClick={() => handleSelect(itemVal, item.disabled)}
            onMouseEnter={() => setHoveredVal(itemVal)}
            className={`relative z-10 text-center transition-colors duration-150 cursor-pointer flex items-center justify-center font-bold whitespace-nowrap ${
              isFluid ? 'flex-1' : 'shrink-0'
            } ${sizeClasses} ${
              item.disabled
                ? 'opacity-30 cursor-not-allowed text-slate-500'
                : isActive
                ? 'text-white font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {/* Active Sliding Pill with Framer Motion Spring */}
            {isActive && (
              <motion.div
                layoutId={`${baseLayoutId}-active`}
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                className={`absolute inset-0 rounded-lg ${activeColor} border border-white/20 z-0 pointer-events-none`}
              />
            )}

            {/* Hover Glow Pill */}
            {isHovered && (
              <motion.div
                layoutId={`${baseLayoutId}-hover`}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute inset-0 rounded-lg bg-white/[0.06] border border-white/10 z-0 pointer-events-none"
              />
            )}

            {/* Icon */}
            {Icon && (
              <span className="relative z-10 shrink-0 flex items-center justify-center">
                {typeof Icon === 'function' ? (
                  <Icon size={iconSizes} />
                ) : (
                  Icon
                )}
              </span>
            )}

            {/* Label */}
            <span className="relative z-10 truncate">{item.label}</span>

            {/* Badge */}
            {item.badge !== undefined && (
              <span
                className={`relative z-10 ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black shrink-0 transition-colors font-mono ${
                  isActive
                    ? 'bg-white/25 text-white shadow-sm'
                    : 'bg-white/10 text-slate-400'
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
