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
 * 1. Intent Prefetching: Downloads JS chunk immediately on hover/touch.
 * 2. Staggered Idle Pre-mount: Uses requestIdleCallback to quietly mount core tabs
 *    in <div className="hidden"> one by one during browser idle moments.
 * 3. Heavy Isolation: Never pre-mounts heavy tools (Canvas, Word, Parser) to preserve RAM.
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

    // If it's a core tab and not yet in visitedTabIds, start mounting it immediately
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

    // Filter candidate tabs to mount in order of priority
    const candidates = CORE_PREMOUNT_TABS.filter((id) => allowedTabIds.includes(id));

    const scheduleNext = (index: number) => {
      if (index >= candidates.length || isCancelled) return;

      const tabId = candidates[index];
      // If already visited by user action, skip to next
      if (visitedRef.current.has(tabId)) {
        scheduleNext(index + 1);
        return;
      }

      // Preload chunk first
      prefetchTabChunk(tabId);

      const delayTimer = setTimeout(() => {
        if (isCancelled) return;

        const executeMount = () => {
          if (isCancelled) return;
          setVisitedTabIds((prev) => {
            if (prev.has(tabId)) return prev;
            const next = new Set(prev);
            next.add(tabId);
            return next;
          });
          // Stagger next tab by 1200ms
          scheduleNext(index + 1);
        };

        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          const idleId = (window as any).requestIdleCallback(executeMount, { timeout: 2500 });
          idleIds.push(idleId);
        } else {
          executeMount();
        }
      }, 1200);

      timers.push(delayTimer);
    };

    // Begin warming 1200ms after initial page settles
    const initialTimer = setTimeout(() => {
      scheduleNext(0);
    }, 1200);
    timers.push(initialTimer);

    return () => {
      isCancelled = true;
      timers.forEach((t) => clearTimeout(t));
      if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        idleIds.forEach((id) => (window as any).cancelIdleCallback(id));
      }
    };
  }, [currentUser, allowedTabIds, setVisitedTabIds]);

  return { prefetchTab };
}
