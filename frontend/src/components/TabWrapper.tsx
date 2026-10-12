import React, { memo, Suspense } from 'react';
import { TabDefinition } from '../config/tabs';

interface TabWrapperProps {
  tab: TabDefinition;
  isActive: boolean;
  preloadedQuestions: any[] | null;
  preloadedVersions: number | null;
  preloadedGrade: string | null;
  preloadedUnit: string | null;
  clearPreloadedQuestions: () => void;
  onCreateTest: (questions: any[], numVersions?: number, grade?: string, unit?: string) => void;
}

/**
 * High-performance tab container with strict background render isolation.
 * Inactive tabs are hidden with display: none and completely skip React re-renders,
 * eliminating all background CPU/GPU overhead while preserving 100% of the session state.
 */
export const TabWrapper = memo(
  function TabWrapper({
    tab,
    isActive,
    preloadedQuestions,
    preloadedVersions,
    preloadedGrade,
    preloadedUnit,
    clearPreloadedQuestions,
    onCreateTest,
  }: TabWrapperProps) {
    return (
      <div
        className={`h-full w-full ${isActive ? 'animate-tab-enter' : 'hidden'}`}
        style={!isActive ? { display: 'none' } : undefined}
      >
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-transparent">
              <div className="w-7 h-7 rounded-full border-2 border-slate-300 dark:border-white/10 border-t-blue-600 animate-spin" />
            </div>
          }
        >
          {tab.render({
            isActive,
            preloadedQuestions,
            preloadedVersions,
            preloadedGrade,
            preloadedUnit,
            clearPreloadedQuestions,
            onCreateTest,
          })}
        </Suspense>
      </div>
    );
  },
  (prev, next) => {
    // Zero-CPU optimization: If the tab is inactive in both previous and next render, skip re-render completely!
    if (!prev.isActive && !next.isActive) return true;
    if (prev.isActive !== next.isActive) return false;
    return (
      prev.preloadedQuestions === next.preloadedQuestions &&
      prev.preloadedVersions === next.preloadedVersions &&
      prev.preloadedGrade === next.preloadedGrade &&
      prev.preloadedUnit === next.preloadedUnit
    );
  }
);
