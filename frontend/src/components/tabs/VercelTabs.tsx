import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

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
}: VercelTabsProps<T>) {
  const [internalValue, setInternalValue] = useState<T>(
    defaultTab || defaultValue || tabs[0]?.value
  );
  const activeTab = controlledValue !== undefined ? controlledValue : internalValue;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeStyle, setActiveStyle] = useState<{ left: string; width: string }>({
    left: '0px',
    width: '0px',
  });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeIndex = tabs.findIndex((tab) => tab.value === activeTab);

  const tablistRef = useRef<HTMLDivElement>(null);

  const updateActivePosition = useCallback(() => {
    if (activeIndex >= 0) {
      const activeElement = tabRefs.current[activeIndex];
      if (activeElement) {
        const { offsetLeft, offsetWidth } = activeElement;
        if (offsetWidth > 0) {
          setActiveStyle({
            left: `${offsetLeft}px`,
            width: `${offsetWidth}px`,
          });
        } else {
          requestAnimationFrame(() => {
            const el = tabRefs.current[activeIndex];
            if (el && el.offsetWidth > 0) {
              setActiveStyle({
                left: `${el.offsetLeft}px`,
                width: `${el.offsetWidth}px`,
              });
            }
          });
        }
      }
    }
  }, [activeIndex]);

  useEffect(() => {
    updateActivePosition();
    const t1 = setTimeout(updateActivePosition, 50);
    const t2 = setTimeout(updateActivePosition, 200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [updateActivePosition, activeIndex, tabs]);

  useEffect(() => {
    if (!tablistRef.current) return;
    const ro = new ResizeObserver(() => {
      updateActivePosition();
    });
    ro.observe(tablistRef.current);
    return () => ro.disconnect();
  }, [updateActivePosition]);

  useEffect(() => {
    window.addEventListener('resize', updateActivePosition);
    return () => window.removeEventListener('resize', updateActivePosition);
  }, [updateActivePosition]);

  const handleSelect = (tabValue: T) => {
    const targetIdx = tabs.findIndex((tab) => tab.value === tabValue);
    if (targetIdx >= 0) {
      const activeElement = tabRefs.current[targetIdx];
      if (activeElement) {
        const { offsetLeft, offsetWidth } = activeElement;
        setActiveStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        });
        try {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } catch (e) {}
      }
    }
    if (controlledValue === undefined) {
      setInternalValue(tabValue);
    }
    onChange?.(tabValue);
  };

  const hasContent = tabs.some((t) => t.content !== undefined);

  return (
    <div className={`flex w-full flex-col ${className}`}>
      <div
        ref={tablistRef}
        role="tablist"
        onMouseLeave={() => setHoveredIndex(null)}
        className="relative flex items-center h-auto select-none gap-[6px] bg-transparent p-0 border-b border-slate-200 dark:border-white/10 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* Active Indicator */}
        <div
          aria-hidden="true"
          className={`absolute bottom-[-1px] h-[2.5px] rounded-full transition-all duration-300 ease-out pointer-events-none ${
            indicatorColor || 'bg-blue-600'
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
              className={`relative z-10 h-[32px] cursor-pointer rounded-lg border-0 bg-transparent px-2.5 sm:px-3 py-1.5 outline-none transition-colors duration-150 flex items-center gap-1.5 select-none shrink-0 whitespace-nowrap text-xs sm:text-sm ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-black'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-bold'
              }`}
            >
              {/* Smooth spring hover highlight: bo vuông 4 góc tròn (rounded-lg) */}
              {hoveredIndex === index && !isActive && (
                <motion.div
                  layoutId="vercel-tab-hover"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="absolute inset-0 rounded-lg bg-slate-200/80 dark:bg-white/10 shadow-2xs pointer-events-none z-0"
                />
              )}

              <span className="relative z-10 flex items-center gap-1.5">
                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                <span className="whitespace-nowrap text-sm leading-5">
                  {tab.label}
                </span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                        : 'bg-slate-200 dark:bg-white/20 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </span>
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
