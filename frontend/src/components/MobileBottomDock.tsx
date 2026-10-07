import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUserScrollingRef = useRef(false);

  // Reorder tabs to strictly match desktop visual SECTIONS order
  const canonicalTabs = useMemo(() => {
    const sortedIds = getVisualTabOrder(orderedTabIds);
    return sortedIds
      .map((id) => TAB_DEFINITIONS.find((t) => t.id === id))
      .filter(Boolean) as typeof TAB_DEFINITIONS;
  }, [orderedTabIds]);

  const activeIndex = canonicalTabs.findIndex((t) => t.id === activeTab);
  const currentTab = canonicalTabs[activeIndex] || TAB_DEFINITIONS.find((t) => t.id === activeTab);

  // Idle timer management (dims and shrinks dock when inactive for 2.5s)
  const resetIdleTimer = useCallback(() => {
    setIsIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 2500);
  }, []);

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [resetIdleTimer]);

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

  // When activeTab changes from outside, auto-center it
  useEffect(() => {
    if (!isUserScrollingRef.current) {
      centerTab(activeTab, true);
    }
  }, [activeTab, centerTab]);

  // Handle touch swipe / scroll interaction
  const handleScroll = useCallback(() => {
    resetIdleTimer();
    isUserScrollingRef.current = true;

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
      if (!containerRef.current) return;

      // Find the tab closest to screen center
      const containerRect = containerRef.current.getBoundingClientRect();
      const centerX = containerRect.left + containerRect.width / 2;

      const buttons = Array.from(
        containerRef.current.querySelectorAll<HTMLButtonElement>('[data-dock-tab]')
      );

      let closestId: string | null = null;
      let minDistance = Infinity;

      buttons.forEach((btn) => {
        const rect = btn.getBoundingClientRect();
        const btnCenter = rect.left + rect.width / 2;
        const dist = Math.abs(btnCenter - centerX);
        if (dist < minDistance) {
          minDistance = dist;
          closestId = btn.getAttribute('data-dock-tab');
        }
      });

      if (closestId && closestId !== activeTab && minDistance < 60) {
        setActiveTab(closestId);
        centerTab(closestId, true);
      }
    }, 140);
  }, [activeTab, centerTab, resetIdleTimer, setActiveTab]);

  return (
    <div
      className="fixed bottom-3 inset-x-0 z-40 flex flex-col items-center pointer-events-none md:hidden select-none"
      onTouchStart={resetIdleTimer}
      onTouchMove={resetIdleTimer}
      onPointerDown={resetIdleTimer}
      onMouseEnter={resetIdleTimer}
    >
      {/* Floating Active Tab Label Pill */}
      {currentTab && (
        <div
          className={`pointer-events-none mb-1.5 px-3 py-1 rounded-full bg-[#0c0f1e]/95 dark:bg-[#0c0f1e]/95 text-white font-extrabold text-[11px] shadow-lg border border-blue-500/30 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isIdle ? 'opacity-0 -translate-y-1 scale-90' : 'opacity-100 translate-y-0 scale-100'
          }`}
        >
          <span>{currentTab.label}</span>
        </div>
      )}

      {/* Fisheye Dock Carousel Row (No Background on Container) */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={`w-full max-w-full overflow-x-auto no-scrollbar scroll-smooth flex items-center py-2 px-[calc(50vw-24px)] gap-3.5 snap-x snap-mandatory pointer-events-auto bg-transparent transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isIdle
            ? 'opacity-55 scale-90 translate-y-1'
            : 'opacity-100 scale-100 translate-y-0'
        }`}
        style={{ overscrollBehaviorX: 'contain' }}
      >
        {canonicalTabs.map((tab, idx) => {
          const Icon = tab.icon;
          const isSelected = tab.id === activeTab;
          const distance = Math.abs(idx - activeIndex);

          // Fisheye scale factor: Center / selected is largest, neighbors shrink smoothly
          let scaleClass = 'scale-80 opacity-70';
          if (isSelected) {
            scaleClass = 'scale-125 opacity-100 z-20';
          } else if (distance === 1) {
            scaleClass = 'scale-100 opacity-90 z-10';
          } else if (distance === 2) {
            scaleClass = 'scale-90 opacity-80 z-0';
          }

          return (
            <button
              key={tab.id}
              data-dock-tab={tab.id}
              type="button"
              onClick={() => {
                resetIdleTimer();
                setActiveTab(tab.id);
                centerTab(tab.id, true);
              }}
              className={`snap-center shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ease-out cursor-pointer active:scale-95 ${scaleClass} ${
                isSelected
                  ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/50 ring-2 ring-blue-400/60'
                  : 'bg-white dark:bg-[#141724] text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-white/10 shadow-md shadow-black/25 hover:text-blue-600 dark:hover:text-white'
              }`}
              title={tab.label}
              aria-label={tab.label}
            >
              <Icon
                size={isSelected ? 20 : 18}
                strokeWidth={isSelected ? 2.6 : 2}
                className="shrink-0 transition-transform duration-200"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
