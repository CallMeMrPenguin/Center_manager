import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TAB_DEFINITIONS } from '../config/tabs';
import { SECTIONS } from './Sidebar';

interface MobileBottomDockProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
  orderedTabIds: string[];
}

// Concise 1-2 word labels for mobile tabbar to prevent awkward ellipsis truncation
const MOBILE_SHORT_LABELS: Record<string, string> = {
  reports: 'Báo Cáo',
  dashboard: 'Tổng Quan',
  students: 'Học Sinh',
  classes: 'Lớp Học',
  schedule: 'Lịch Học',
  teachers: 'Nhân Sự',
  courses: 'Khóa Học',
  kiemtra: 'Kiểm Tra',
  formatter: 'Soạn Đề',
  'question-bank': 'Ngân Hàng',
  assignments: 'Bài Tập',
  results: 'Kết Quả',
  'vocab-bank': 'Từ Vựng',
  'unit-config': 'Cấu Hình',
  'file-manager': 'Tài Liệu',
  'word-editor': 'Văn Bản',
  'canvas-board': 'Canvas',
  payments: 'Thanh Toán',
  invoices: 'Hóa Đơn',
  'users-roles': 'Tài Khoản',
  settings: 'Cài Đặt',
};

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
          isFewTabs ? 'justify-around px-3' : 'justify-start px-3 gap-1'
        }`}
      >
        {canonicalTabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = tab.id === activeTab;
          const displayLabel = MOBILE_SHORT_LABELS[tab.id] || tab.label;

          return (
            <button
              key={tab.id}
              data-dock-tab={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                centerTab(tab.id, true);
              }}
              className="relative shrink-0 w-[72px] h-16 flex flex-col items-center justify-center cursor-pointer select-none transition-transform active:scale-95"
              title={tab.label}
              aria-label={tab.label}
            >
              {isSelected ? (
                /* ACTIVE ITEM: Wide Organic Dome + Snugly Nested Pop-up Circle */
                <motion.div
                  layoutId="activeCurvedDomeIndicator"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                >
                  {/* Wide Organic Curved Dome SVG (116px wide, seamlessly hugs the circle) */}
                  <div className="absolute -top-[23px] left-1/2 -translate-x-1/2 w-[116px] h-[25px] pointer-events-none z-10 overflow-visible">
                    <svg
                      viewBox="0 0 116 25"
                      className="w-full h-full block text-white dark:text-[#0c0f1e]"
                    >
                      {/* Solid dome background fill - overlaps 2px into bar for seamless fusion */}
                      <path
                        d="M 0 24 C 24 24, 34 13, 44 5 C 52 -1, 64 -1, 72 5 C 82 13, 92 24, 116 24 L 116 26 L 0 26 Z"
                        fill="currentColor"
                      />
                      {/* Seamless hair-line stroke matching bar's top border */}
                      <path
                        d="M 0 24 C 24 24, 34 13, 44 5 C 52 -1, 64 -1, 72 5 C 82 13, 92 24, 116 24"
                        fill="none"
                        stroke="rgba(226, 232, 240, 0.9)"
                        className="dark:stroke-white/10"
                        strokeWidth="1.1"
                      />
                    </svg>
                  </div>

                  {/* Popped-Up Circle nested harmoniously half-in half-out */}
                  <motion.div
                    initial={{ scale: 0.6, y: 8 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                    className="absolute -top-4.5 left-1/2 -translate-x-1/2 z-20 w-[48px] h-[48px] rounded-full bg-blue-600 flex items-center justify-center text-white ring-4 ring-white dark:ring-[#0c0f1e] shadow-md shadow-blue-600/30"
                  >
                    <Icon size={22} strokeWidth={2.6} />
                  </motion.div>

                  {/* Active Text Label - Short & Crisp, never truncated */}
                  <span className="text-[10.5px] font-black text-blue-600 dark:text-blue-400 mt-6 tracking-tight truncate max-w-[68px] text-center select-none">
                    {displayLabel}
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
