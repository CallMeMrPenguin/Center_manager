import React, { useEffect, useRef, useState, useCallback } from 'react';

export interface VercelTabItem<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  content?: React.ReactNode;
}

export interface VercelTabsProps<T extends string = string> {
  tabs: VercelTabItem<T>[];
  value?: T;
  defaultTab?: T;
  defaultValue?: T;
  onChange?: (val: T) => void;
  className?: string;
  indicatorColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function VercelTabs<T extends string = string>({
  tabs,
  value: controlledValue,
  defaultTab,
  defaultValue,
  onChange,
  className = '',
  indicatorColor,
  size = 'md',
}: VercelTabsProps<T>) {
  const [internalValue, setInternalValue] = useState<T>(
    defaultTab || defaultValue || tabs[0]?.value
  );
  const activeTab = controlledValue !== undefined ? controlledValue : internalValue;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverStyle, setHoverStyle] = useState<{ left?: string; width?: string }>({});
  const [activeStyle, setActiveStyle] = useState<{ left: string; width: string }>({
    left: '0px',
    width: '0px',
  });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeIndex = tabs.findIndex((tab) => tab.value === activeTab);

  useEffect(() => {
    if (hoveredIndex !== null) {
      const hoveredElement = tabRefs.current[hoveredIndex];
      if (hoveredElement) {
        const { offsetLeft, offsetWidth } = hoveredElement;
        setHoverStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        });
      }
    }
  }, [hoveredIndex]);

  const updateActivePosition = useCallback(() => {
    if (activeIndex >= 0) {
      const activeElement = tabRefs.current[activeIndex];
      if (activeElement) {
        const { offsetLeft, offsetWidth } = activeElement;
        setActiveStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        });
      }
    }
  }, [activeIndex]);

  useEffect(() => {
    updateActivePosition();
  }, [updateActivePosition]);

  useEffect(() => {
    requestAnimationFrame(() => {
      updateActivePosition();
    });
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

  const hasContent = tabs.some((t) => t.content !== undefined);

  return (
    <div className={`flex w-full flex-col ${className}`}>
      <div
        role="tablist"
        className="relative flex items-center h-auto select-none gap-[6px] bg-transparent p-0 border-b border-slate-200 dark:border-white/10"
      >
        {/* Hover Highlight */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 flex h-[32px] items-center rounded-[6px] bg-[#0e0f1114] transition-all duration-300 ease-out dark:bg-[#ffffff1a] pointer-events-none"
          style={{
            ...hoverStyle,
            opacity: hoveredIndex !== null ? 1 : 0,
          }}
        />

        {/* Active Indicator */}
        <div
          aria-hidden="true"
          className={`absolute bottom-[-1px] h-[2.5px] rounded-full transition-all duration-300 ease-out pointer-events-none ${
            indicatorColor || 'bg-blue-600 dark:bg-white'
          }`}
          style={activeStyle}
        />

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
              onMouseLeave={() => setHoveredIndex(null)}
              className={`z-10 h-[32px] cursor-pointer rounded-md border-0 bg-transparent px-3 py-1.5 outline-none transition-colors duration-300 flex items-center gap-1.5 select-none ${
                isActive
                  ? 'text-blue-600 dark:text-white font-black'
                  : 'text-[#0e0f1199] dark:text-[#ffffff99] hover:text-[#0e0e10] dark:hover:text-white font-bold'
              }`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span className="whitespace-nowrap text-sm leading-5">
                {tab.label}
              </span>
              {tab.badge !== undefined && (
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
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

      {/* Optional Content Area if tabs provide content */}
      {hasContent && (
        <div className="mt-6 w-full">
          {tabs.map((tab) => {
            if (!tab.content || tab.value !== activeTab) return null;
            return (
              <div key={tab.value} className="fade-in-50 w-full animate-in duration-300">
                {tab.content}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default VercelTabs;
