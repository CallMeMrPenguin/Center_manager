import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
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

  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverStyle, setHoverStyle] = useState({ left: 0, width: 0 });
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeIndex = items.findIndex(
    (opt, idx) => (opt.value ?? opt.id ?? String(idx)) === activeVal
  );

  const updateGeometry = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const activeElement = buttonRefs.current[activeIndex];

    if (activeElement) {
      setIndicatorStyle({
        left: activeElement.offsetLeft,
        width: activeElement.offsetWidth,
      });
    }

    if (hoveredIndex !== null) {
      const hoveredElement = buttonRefs.current[hoveredIndex];
      if (hoveredElement) {
        setHoverStyle({
          left: hoveredElement.offsetLeft,
          width: hoveredElement.offsetWidth,
        });
      }
    } else {
      setHoverStyle({
        left: 0,
        width: container.offsetWidth,
      });
    }
  };

  useLayoutEffect(() => {
    updateGeometry();
  }, [activeVal, activeIndex, hoveredIndex, items]);

  useEffect(() => {
    if (!containerRef.current) return;
    updateGeometry();
    const ro = new ResizeObserver(() => {
      updateGeometry();
    });
    ro.observe(containerRef.current);
    window.addEventListener('resize', updateGeometry);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateGeometry);
    };
  }, [activeIndex, hoveredIndex]);

  const handleButtonClick = (buttonVal: T, disabled?: boolean) => {
    if (disabled) return;
    if (controlledValue === undefined && controlledActiveId === undefined) {
      setInternalVal(buttonVal);
    }
    onChange?.(buttonVal);
  };

  const sizeClasses = {
    xs: { height: 'h-6.5', padding: 'px-2.5 text-[11px]' },
    sm: { height: 'h-7', padding: 'px-3 text-xs' },
    md: { height: 'h-8', padding: 'px-3.5 text-xs' },
    lg: { height: 'h-9', padding: 'px-4 text-sm' },
  }[size];

  const isFluid = fit === 'fluid' || fullWidth;

  return (
    <div
      ref={containerRef}
      onMouseLeave={() => setHoveredIndex(null)}
      className={`relative ${
        isFluid ? 'flex w-full' : 'inline-flex'
      } items-center rounded-full border-0 select-none ${sizeClasses.height} ${className}`}
      role="group"
    >
      {/* 1. Mặc định cả nút được highlight nhẹ toàn cụm, khi hover vùng đó co lại chính xác tại nút con trỏ hover */}
      <motion.div
        className="absolute top-0 bottom-0 rounded-full bg-slate-200/70 dark:bg-white/10 pointer-events-none"
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

      {/* 2. Highlight active fit perfect 100% với nút đã chọn */}
      <motion.div
        className={`absolute top-0 bottom-0 rounded-full shadow-[0_2px_8px_rgba(37,99,235,0.28)] pointer-events-none ${
          activeColor || 'bg-[#2563eb]'
        }`}
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

      {/* 3. Danh sách button options */}
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
            className={`relative z-10 flex h-full items-center justify-center rounded-full font-bold transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-0 ${
              sizeClasses.padding
            } ${isFluid ? 'flex-1 min-w-0' : ''} ${
              isActive
                ? 'text-white font-black'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <div className="relative z-10 flex items-center justify-center gap-1.5 truncate">
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
