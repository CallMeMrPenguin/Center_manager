import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

export interface VercelTabItem<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface VercelTabsProps<T extends string = string> {
  tabs: VercelTabItem<T>[];
  value?: T;
  defaultValue?: T;
  onChange?: (val: T) => void;
  className?: string;
  indicatorColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function VercelTabs<T extends string = string>({
  tabs,
  value: controlledValue,
  defaultValue,
  onChange,
  className = '',
  indicatorColor,
  size = 'md',
}: VercelTabsProps<T>) {
  const [internalValue, setInternalValue] = useState<T>(defaultValue || tabs[0]?.value);
  const activeTab = controlledValue !== undefined ? controlledValue : internalValue;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeIndex = tabs.findIndex((tab) => tab.value === activeTab);
  const targetIndex =
    hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < tabs.length
      ? hoveredIndex
      : activeIndex >= 0
      ? activeIndex
      : 0;

  const updateIndicatorPosition = useCallback(() => {
    const targetElement = tabRefs.current[targetIndex];
    if (targetElement) {
      setIndicatorStyle({
        left: targetElement.offsetLeft,
        width: targetElement.offsetWidth,
      });
    }
  }, [targetIndex]);

  useEffect(() => {
    updateIndicatorPosition();
    const frameId = requestAnimationFrame(updateIndicatorPosition);
    return () => cancelAnimationFrame(frameId);
  }, [updateIndicatorPosition]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicatorPosition);
    return () => window.removeEventListener('resize', updateIndicatorPosition);
  }, [updateIndicatorPosition]);

  const handleSelect = (tabValue: T) => {
    if (controlledValue === undefined) {
      setInternalValue(tabValue);
    }
    onChange?.(tabValue);
  };

  const sizeStyles = {
    sm: 'h-[32px] px-3 text-xs gap-1.5',
    md: 'h-[38px] px-4 text-sm gap-2',
    lg: 'h-[44px] px-5 text-base gap-2.5',
  }[size];

  return (
    <div
      role="tablist"
      onMouseLeave={() => setHoveredIndex(null)}
      className={`relative flex items-center bg-slate-200/90 dark:bg-[#090c15] p-1 rounded-2xl border border-slate-300 dark:border-[#1b233d] shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] select-none shrink-0 overflow-x-auto scrollbar-none transition-colors duration-200 ${className}`}
    >
      {/* 1. Fluid Gliding Highlight Pill (Always active, glides to hovered item, returns to active) */}
      <motion.div
        aria-hidden="true"
        className={`absolute top-1 bottom-1 rounded-xl pointer-events-none z-0 ${
          indicatorColor ||
          'bg-blue-600 dark:bg-blue-600 shadow-[0_0_14px_rgba(37,99,235,0.45)]'
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

      {/* 2. Tab Buttons */}
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.value;
        const isHovered = hoveredIndex === index;
        const isTarget = hoveredIndex !== null ? isHovered : isActive;

        return (
          <button
            key={tab.value}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => handleSelect(tab.value)}
            onMouseEnter={() => setHoveredIndex(index)}
            className={`z-10 relative flex-1 flex items-center justify-center cursor-pointer rounded-xl border-0 bg-transparent outline-none transition-colors duration-200 font-black whitespace-nowrap ${sizeStyles} ${
              isTarget
                ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]'
                : isActive
                ? 'text-blue-600 dark:text-blue-400 font-black'
                : 'text-slate-800 dark:text-neutral-200 hover:text-black dark:hover:text-white'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-colors ${
                  isTarget
                    ? 'bg-white/25 text-white shadow-xs'
                    : isActive
                    ? 'bg-blue-600/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300'
                    : 'bg-slate-300 dark:bg-white/10 text-slate-800 dark:text-slate-300'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default VercelTabs;
