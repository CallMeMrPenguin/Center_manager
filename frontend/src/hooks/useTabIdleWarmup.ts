import { useEffect, useRef, useCallback } from 'react';
import { prefetchTabChunk, CORE_PREMOUNT_TABS, HEAVY_ISOLATED_TABS } from '../utils/tabPreloader';
import { AuthUser } from '../utils/authUtils';

interface UseTabIdleWarmupOptions {
  currentUser: AuthUser | null;
  allowedTabIds: string[];
  visitedTabIds: Set<string>;
  setVisitedTabIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

/**
 * Enterprise-grade Progressive Tab Pre-warming Engine.
 * 
 * 1. Intent Prefetching: Pre-downloads JS chunk and mounts on menu hover/touch.
 * 2. Idle Chunk Preloading: Silently caches JS bundles during browser idle moments (0 DOM overhead).
 * 3. Lazy Mount on Demand: Tabs only mount into DOM when actually requested, preventing background DOM bloat.
 */
export function useTabIdleWarmup({
  currentUser,
  allowedTabIds,
  visitedTabIds,
  setVisitedTabIds,
}: UseTabIdleWarmupOptions) {
  const visitedRef = useRef(visitedTabIds);
  visitedRef.current = visitedTabIds;

  // Manual prefetch trigger for hover/touch intent
  const prefetchTab = useCallback((tabId: string, immediatePreMount = true) => {
    // Always pre-download the JS chunk
    prefetchTabChunk(tabId);

    // If it's a core tab and not yet in visitedTabIds, mount it on hover intent
    if (immediatePreMount && !HEAVY_ISOLATED_TABS.includes(tabId)) {
      setVisitedTabIds((prev) => {
        if (prev.has(tabId)) return prev;
        const next = new Set(prev);
        next.add(tabId);
        return next;
      });
    }
  }, [setVisitedTabIds]);

  useEffect(() => {
    if (!currentUser) return;

    let isCancelled = false;
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const idleIds: number[] = [];

    // Filter candidate tabs to preload JS bundles in order of priority
    const candidates = CORE_PREMOUNT_TABS.filter((id) => allowedTabIds.includes(id));

    const scheduleNext = (index: number) => {
      if (index >= candidates.length || isCancelled) return;

      const tabId = candidates[index];

      const delayTimer = setTimeout(() => {
        if (isCancelled) return;

        const executePreload = () => {
          if (isCancelled) return;
          // Preload JS chunk only (zero DOM or API call overhead)
          prefetchTabChunk(tabId);
          // Stagger next tab chunk by 800ms
          scheduleNext(index + 1);
        };

        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          const idleId = (window as any).requestIdleCallback(executePreload, { timeout: 3000 });
          idleIds.push(idleId);
        } else {
          executePreload();
        }
      }, 800);

      timers.push(delayTimer);
    };

    // Begin preloading chunks 1500ms after initial page settles
    const initialTimer = setTimeout(() => {
      scheduleNext(0);
    }, 1500);
    timers.push(initialTimer);

    return () => {
      isCancelled = true;
      timers.forEach((t) => clearTimeout(t));
      if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        idleIds.forEach((id) => (window as any).cancelIdleCallback(id));
      }
    };
  }, [currentUser, allowedTabIds]);

  return { prefetchTab };
}
