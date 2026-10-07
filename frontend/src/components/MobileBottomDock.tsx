import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TAB_DEFINITIONS } from '../config/tabs';
import { SECTIONS } from './Sidebar';

interface MobileBottomDockProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
  orderedTabIds: string[];
}

// Canonical tab order matching the desktop visual SECTIONS hierarchy
export function getVisualTabOrder(orderedTabIds: string[]): string[] {
  const result: string[] = [];
  SECTIONS.forEach((section) => {
    orderedTabIds.forEach((tabId) => {
      const item = TAB_DEFINITIONS.find((t) => t.id === tabId);
      if (item && item.section === section.id && !result.includes(tabId)) {
        result.push(tabId);
      }
    });
  });
  // Append any remaining tabs
  orderedTabIds.forEach((tabId) => {
    if (!result.includes(tabId)) {
      result.push(tabId);
    }
  });
  return result;
}

export const MobileBottomDock: React.FC<MobileBottomDockProps> = ({
  activeTab,
  setActiveTab,
  orderedTabIds,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Reorder tabs to strictly match desktop visual SECTIONS order
  const canonicalTabs = useMemo(() => {
    const sortedIds = getVisualTabOrder(orderedTabIds);
    return sortedIds
      .map((id) => TAB_DEFINITIONS.find((t) => t.id === id))
      .filter(Boolean) as typeof TAB_DEFINITIONS;
  }, [orderedTabIds]);

  // Center the active tab icon smoothly in the scroll view
  const centerTab = useCallback((tabId: string, smooth = true) => {
    if (!containerRef.current) return;
    const btn = containerRef.current.querySelector<HTMLButtonElement>(`[data-dock-tab="${tabId}"]`);
    if (btn) {
      btn.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, []);

  // Auto-center active tab on mount or external activeTab change
  useEffect(() => {
    centerTab(activeTab, true);
  }, [activeTab, centerTab]);

  const isFewTabs = canonicalTabs.length <= 4;

  return (
    <nav
      aria-label="Thanh điều hướng chính mobile"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden select-none h-[88px] pointer-events-none"
    >
      {/* 1. Solid Bottom Bar Surface */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-white dark:bg-[#0c0f1e] border-t border-slate-200/90 dark:border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-6px_28px_rgba(0,0,0,0.55)] pointer-events-auto" />

      {/* 2. Scrollable Tabs Track with Headroom for Popped-Up Dome */}
      <div
        ref={containerRef}
        className={`relative z-10 w-full h-full overflow-x-auto overflow-y-visible no-scrollbar pt-6 flex items-center pointer-events-auto ${
          isFewTabs ? 'justify-around px-3' : 'justify-start px-4 gap-1.5'
        }`}
      >
        {canonicalTabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              data-dock-tab={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                centerTab(tab.id, true);
              }}
              className="relative shrink-0 w-16 h-16 flex flex-col items-center justify-center cursor-pointer select-none transition-transform active:scale-95"
              title={tab.label}
              aria-label={tab.label}
            >
              {isSelected ? (
                /* ACTIVE ITEM: Curved Dome Notch Background + Popped Up Elevated Circle Icon */
                <motion.div
                  layoutId="activeCurvedDomeIndicator"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                >
                  {/* Curved Dome SVG Background popping up from the bar */}
                  <div className="absolute -top-[24px] left-1/2 -translate-x-1/2 w-[76px] h-[25px] pointer-events-none z-10 overflow-visible">
                    <svg
                      viewBox="0 0 76 25"
                      className="w-full h-full block text-white dark:text-[#0c0f1e]"
                    >
                      {/* Solid dome background fill */}
                      <path
                        d="M 0 24 C 10 24, 14 12, 22 5 C 30 -2, 46 -2, 54 5 C 62 12, 66 24, 76 24 L 76 25 L 0 25 Z"
                        fill="currentColor"
                      />
                      {/* Top curved border stroke matching bar's border-t */}
                      <path
                        d="M 0 24 C 10 24, 14 12, 22 5 C 30 -2, 46 -2, 54 5 C 62 12, 66 24, 76 24"
                        fill="none"
                        stroke="#cbd5e1"
                        className="dark:stroke-white/10"
                        strokeWidth="1.2"
                      />
                    </svg>
                  </div>

                  {/* Popped-Up Circle with White Ring */}
                  <motion.div
                    initial={{ scale: 0.6, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                    className="absolute -top-5.5 left-1/2 -translate-x-1/2 z-20 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white ring-4 ring-white dark:ring-[#0c0f1e] shadow-lg shadow-blue-600/35"
                  >
                    <Icon size={22} strokeWidth={2.6} />
                  </motion.div>

                  {/* Active Text Label */}
                  <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 mt-6 tracking-tight truncate max-w-[64px] text-center select-none">
                    {tab.label}
                  </span>
                </motion.div>
              ) : (
                /* INACTIVE ITEM: Clean minimalist icon sitting on the bar */
                <div className="flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                  <Icon size={21} strokeWidth={2} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
