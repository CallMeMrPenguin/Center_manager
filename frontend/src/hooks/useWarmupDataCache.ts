import { useEffect } from 'react';
import { api } from '../api';
import { AuthUser } from '../utils/authUtils';

/**
 * Background data prefetcher & cache warmup hook.
 * Pre-populates memory cache in parallel on app startup, ensuring 0ms instant tab switching.
 */
export function useWarmupDataCache(currentUser: AuthUser | null) {
  useEffect(() => {
    if (!currentUser) return;

    const isStudent = currentUser.role === 'student';

    // Warm up core datasets in non-blocking background threads
    const warmup = async () => {
      try {
        if (isStudent) {
          // Student role warmup
          await Promise.allSettled([
            api.getAssignments(),
          ]);
        } else {
          // Teacher / Admin role warmup
          const results = await Promise.allSettled([
            api.getClasses(),
            api.getStudents(),
            api.getTeachersCM(),
            api.getCourses(),
            api.getSettings(),
            api.getActiveGrades(),
            api.getUnitConfig(),
            api.getAssignments(),
          ]);

          // Preload active class details so clicking into any class is 0ms instant even on Vercel
          const classResult = results[0];
          if (classResult.status === 'fulfilled' && Array.isArray(classResult.value)) {
            const activeClasses = classResult.value.slice(0, 6);
            await Promise.allSettled(
              activeClasses.flatMap((cls: any) => [
                api.getClassStudents(cls.id),
                api.getClassWeeklySchedule(cls.id).catch(() => []),
              ])
            );
          }
        }
      } catch (err) {
        console.warn('Background cache warmup notice:', err);
      }
    };

    // Trigger immediately to populate cache
    const timer = setTimeout(warmup, 50);
    return () => clearTimeout(timer);
  }, [currentUser]);
}
