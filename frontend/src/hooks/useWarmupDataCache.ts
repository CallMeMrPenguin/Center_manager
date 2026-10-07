import { useEffect } from 'react';
import { api } from '../api';
import { AuthUser } from '../utils/authUtils';

/**
 * High-performance background data prefetcher & progressive cache warmup hook.
 * 
 * Instead of firing 20 concurrent requests at startup (which stalls the event loop and drops frames),
 * it schedules staged non-blocking requests during browser idle time (requestIdleCallback)
 * after initial UI hydration has settled.
 */
export function useWarmupDataCache(currentUser: AuthUser | null) {
  useEffect(() => {
    if (!currentUser) return;

    const isStudent = currentUser.role === 'student';
    let isCancelled = false;
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const idleCallbacks: number[] = [];

    const runIdle = (task: () => Promise<any>, delayMs: number) => {
      const t = setTimeout(() => {
        if (isCancelled) return;
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          const id = (window as any).requestIdleCallback(
            async () => {
              if (!isCancelled) {
                try {
                  await task();
                } catch {}
              }
            },
            { timeout: 3000 }
          );
          idleCallbacks.push(id);
        } else {
          task().catch(() => {});
        }
      }, delayMs);
      timers.push(t);
    };

    if (isStudent) {
      // Student role: lightweight preload of assignments & results
      runIdle(async () => {
        await api.getAssignments();
      }, 800);
    } else {
      // Teacher / Admin: 3-stage progressive warmup

      // Stage 1 (800ms): Lightweight core configs
      runIdle(async () => {
        await Promise.allSettled([
          api.getSettings(),
          api.getActiveGrades(),
          api.getClasses(),
        ]);
      }, 800);

      // Stage 2 (2200ms): Courses & Teachers
      runIdle(async () => {
        await Promise.allSettled([
          api.getCourses(),
          api.getTeachersCM(),
          api.getUnitConfig(),
        ]);
      }, 2200);

      // Stage 3 (4000ms): Students & Assignments
      runIdle(async () => {
        await Promise.allSettled([
          api.getStudents(),
          api.getAssignments(),
        ]);
      }, 4000);
    }

    return () => {
      isCancelled = true;
      timers.forEach((t) => clearTimeout(t));
      if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        idleCallbacks.forEach((id) => (window as any).cancelIdleCallback(id));
      }
    };
  }, [currentUser]);
}
