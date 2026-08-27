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
            api.getGradeAnalytics(undefined, currentUser.studentId ? Number(currentUser.studentId) : undefined),
          ]);
        } else {
          // Teacher / Admin role warmup
          await Promise.allSettled([
            api.getClasses(),
            api.getStudents(),
            api.getTeachersCM(),
            api.getCourses(),
            api.getGradeAnalytics(),
            api.getSettings(),
            api.getActiveGrades(),
            api.getUnitConfig(),
            api.getAssignments(),
          ]);
        }
      } catch (err) {
        console.warn('Background cache warmup notice:', err);
      }
    };

    // Trigger after initial frame to let UI render immediately first
    const timer = setTimeout(warmup, 100);
    return () => clearTimeout(timer);
  }, [currentUser]);
}
