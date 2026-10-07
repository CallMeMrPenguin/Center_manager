import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { TAB_DEFINITIONS } from '../config/tabs';
import { SECTIONS } from './Sidebar';
import { isRealMobileDevice } from '../utils/deviceUtils';

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
  if (!isRealMobileDevice()) return null;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Track the tab currently closest to screen center in real time as user scrolls
  const [scrolledCenterTabId, setScrolledCenterTabId] = useState<string>(activeTab);
  const scrollSettleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reorder tabs to strictly match desktop visual SECTIONS order
  const canonicalTabs = useMemo(() => {
    const sortedIds = getVisualTabOrder(orderedTabIds);
    return sortedIds
      .map((id) => TAB_DEFINITIONS.find((t) => t.id === id))
      .filter(Boolean) as typeof TAB_DEFINITIONS;
  }, [orderedTabIds]);

  const activeIndex = canonicalTabs.findIndex((t) => t.id === activeTab);
  const displayedTab =
    canonicalTabs.find((t) => t.id === scrolledCenterTabId) ||
    canonicalTabs[activeIndex] ||
    TAB_DEFINITIONS.find((t) => t.id === activeTab);

  // Keep scrolled center in sync when activeTab changes from outside
  useEffect(() => {
    setScrolledCenterTabId(activeTab);
  }, [activeTab]);

  // Idle timer management (dims to translucent and shrinks dock when inactive for 2.5s)
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
      if (scrollSettleTimerRef.current) clearTimeout(scrollSettleTimerRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
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

  // When activeTab changes, auto-center it
  useEffect(() => {
    centerTab(activeTab, true);
  }, [activeTab, centerTab]);

  // Find the tab closest to center in real time during scroll
  const findClosestTabToCenter = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;
    const buttons = Array.from(
      containerRef.current.querySelectorAll<HTMLButtonElement>('[data-dock-tab]')
    );

    let closestId: string | null = null;
    let minDistance = Infinity;

    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const rect = btn.getBoundingClientRect();
      const btnCenter = rect.left + rect.width / 2;
      const dist = Math.abs(btnCenter - centerX);
      if (dist < minDistance) {
        minDistance = dist;
        closestId = btn.getAttribute('data-dock-tab');
      }
    }

    if (closestId && closestId !== scrolledCenterTabId) {
      setScrolledCenterTabId(closestId);
    }
  }, [scrolledCenterTabId]);

  // Real-time 60fps scroll listener:
  // - Highlights & shifts up the icon closest to center while user scrolls
  // - If user stops scrolling without selecting, automatically returns dock to active tab after 1.2s
  const handleScroll = useCallback(() => {
    resetIdleTimer();
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      findClosestTabToCenter();
    });

    if (scrollSettleTimerRef.current) clearTimeout(scrollSettleTimerRef.current);
    scrollSettleTimerRef.current = setTimeout(() => {
      // Revert preview back to active tab and smooth scroll back to selected tab
      setScrolledCenterTabId(activeTab);
      centerTab(activeTab, true);
    }, 1200);
  }, [activeTab, centerTab, findClosestTabToCenter, resetIdleTimer]);

  return (
    <div
      className="fixed bottom-2 inset-x-0 z-40 flex flex-col items-center pointer-events-none md:hidden select-none"
      onTouchStart={resetIdleTimer}
      onTouchMove={resetIdleTimer}
      onPointerDown={resetIdleTimer}
      onMouseEnter={resetIdleTimer}
    >
      {/* Floating Active Tab Label Pill: Updates LIVE as user scrolls */}
      {displayedTab && (
        <div
          className={`pointer-events-none mb-1 px-3 py-0.5 rounded-full bg-white/95 dark:bg-[#0c0f1e]/95 text-slate-800 dark:text-white font-black text-[11px] shadow-md border-0 transition-all duration-200 ease-out ${
            isIdle
              ? 'opacity-0 -translate-y-1 scale-90'
              : 'opacity-100 translate-y-0 scale-100'
          }`}
        >
          <span>{displayedTab.label}</span>
        </div>
      )}

      {/* Fisheye Dock Carousel Row (No Background on Container, merges over main view) */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={`w-full max-w-full overflow-x-auto no-scrollbar scroll-smooth flex items-center py-1.5 px-[calc(50vw-22px)] gap-3.5 snap-x snap-mandatory pointer-events-auto bg-transparent transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isIdle
            ? 'opacity-35 scale-90 translate-y-1'
            : 'opacity-100 scale-100 translate-y-0'
        }`}
        style={{ overscrollBehaviorX: 'contain' }}
      >
        {canonicalTabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = tab.id === activeTab;
          const isCenterPreview = !isSelected && tab.id === scrolledCenterTabId;

          // Only the selected tab is the largest icon.
          // Centered preview icon shifts up slightly while scrolling.
          let transformClasses = 'scale-95 opacity-80 translate-y-0';
          if (isSelected) {
            transformClasses = 'scale-120 opacity-100 z-20 translate-y-0';
          } else if (isCenterPreview) {
            transformClasses = 'scale-100 opacity-95 z-10 -translate-y-2';
          }

          return (
            <button
              key={tab.id}
              data-dock-tab={tab.id}
              type="button"
              onClick={() => {
                if (scrollSettleTimerRef.current) clearTimeout(scrollSettleTimerRef.current);
                resetIdleTimer();
                setActiveTab(tab.id);
                setScrolledCenterTabId(tab.id);
                centerTab(tab.id, true);
              }}
              className={`snap-center shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ease-out cursor-pointer active:scale-95 border-0 ${transformClasses} ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/35 font-bold'
                  : 'bg-white/95 dark:bg-[#141724]/95 text-slate-700 dark:text-slate-300 shadow-md shadow-black/15 hover:text-blue-600 dark:hover:text-white'
              }`}
              title={tab.label}
              aria-label={tab.label}
            >
              <Icon
                size={isSelected ? 20 : 18}
                strokeWidth={isSelected ? 2.5 : 2}
                className="shrink-0 transition-transform duration-200"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
