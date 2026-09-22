import React, { useEffect, useRef, useState, useCallback } from 'react';

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
  const [hoverStyle, setHoverStyle] = useState<{ left: string; width: string }>({ left: '0px', width: '0px' });
  const [activeStyle, setActiveStyle] = useState<{ left: string; width: string }>({ left: '0px', width: '0px' });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeIndex = tabs.findIndex((tab) => tab.value === activeTab);

  const updateActivePosition = useCallback(() => {
    if (activeIndex >= 0) {
      const activeElement = tabRefs.current[activeIndex];
      if (activeElement) {
        setActiveStyle({
          left: `${activeElement.offsetLeft}px`,
          width: `${activeElement.offsetWidth}px`,
        });
      }
    }
  }, [activeIndex]);

  useEffect(() => {
    if (hoveredIndex !== null) {
      const hoveredElement = tabRefs.current[hoveredIndex];
      if (hoveredElement) {
        setHoverStyle({
          left: `${hoveredElement.offsetLeft}px`,
          width: `${hoveredElement.offsetWidth}px`,
        });
      }
    }
  }, [hoveredIndex]);

  useEffect(() => {
    updateActivePosition();
    const frameId = requestAnimationFrame(updateActivePosition);
    return () => cancelAnimationFrame(frameId);
  }, [updateActivePosition]);

  useEffect(() => {
    window.addEventListener('resize', updateActivePosition);
    return () => window.removeEventListener('resize', updateActivePosition);
  }, [updateActivePosition]);

  const handleSelect = (tabValue: T) => {
    if (controlledValue === undefined) {
      setInternalValue(tabValue);
    }
    onChange?.(tabValue);
  };

  const sizeStyles = {
    sm: 'h-[30px] px-3 text-xs gap-1.5',
    md: 'h-[36px] px-4 text-sm gap-2',
    lg: 'h-[42px] px-5 text-base gap-2.5',
  }[size];

  return (
    <div
      role="tablist"
      onMouseLeave={() => setHoveredIndex(null)}
      className={`relative flex items-center gap-1 select-none overflow-x-auto scrollbar-none border-b border-slate-200 dark:border-white/10 ${className}`}
    >
      {/* 1. Smooth Hover Highlight Pill */}
      <div
        aria-hidden="true"
        className="absolute top-1 bottom-1.5 flex items-center rounded-xl bg-slate-200/60 dark:bg-white/10 transition-all duration-200 ease-out pointer-events-none"
        style={{
          ...hoverStyle,
          opacity: hoveredIndex !== null ? 1 : 0,
        }}
      />

      {/* 2. Active Indicator Line with Glowing Accent */}
      <div
        aria-hidden="true"
        className={`absolute bottom-0 h-[3px] rounded-full transition-all duration-300 ease-out pointer-events-none ${
          indicatorColor || 'bg-blue-600 dark:bg-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.7)]'
        }`}
        style={activeStyle}
      />

      {/* 3. Tab Buttons */}
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.value;

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
            className={`z-10 relative flex items-center justify-center cursor-pointer rounded-lg border-0 bg-transparent outline-none transition-colors duration-200 font-bold whitespace-nowrap pb-1.5 ${sizeStyles} ${
              isActive
                ? 'text-blue-600 dark:text-white font-black'
                : 'text-slate-700 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300'
                    : 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-400'
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
