import { useState, useEffect, useCallback, useRef } from 'react';
import { showToast } from '../../../components/Toast';

interface UseExamProctoringProps {
  enabled: boolean;
  isStudent: boolean;
  onViolation?: (count: number, reason: string) => void;
}

export const useExamProctoring = ({
  enabled,
  isStudent,
  onViolation,
}: UseExamProctoringProps) => {
  // Proctoring is strictly disabled unless both enabled and isStudent are true
  const [isProctoringActive, setIsProctoringActive] = useState<boolean>(Boolean(isStudent && enabled));
  const [violationCount, setViolationCount] = useState<number>(0);
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [lastViolationReason, setLastViolationReason] = useState<string>('');
  const lastViolationTimeRef = useRef<number>(0);

  const triggerViolation = useCallback(
    (reason: string) => {
      if (!isProctoringActive || !isStudent) return;
      const now = Date.now();
      // Cooldown of 4 seconds between violation triggers to avoid flooding
      if (now - lastViolationTimeRef.current < 4000) return;
      lastViolationTimeRef.current = now;

      setViolationCount((prev) => {
        const next = prev + 1;
        if (onViolation) onViolation(next, reason);
        return next;
      });
      setLastViolationReason(reason);
      setShowWarningModal(true);
    },
    [isProctoringActive, isStudent, onViolation]
  );

  useEffect(() => {
    if (!isProctoringActive || !isStudent) return;

    // 1. Tab switch & visibility change detector
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation('Rời khỏi màn hình làm bài / Chuyển sang Tab khác');
      }
    };

    // 2. Block developer tools, inspection, copy & printing shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.key === 'S' || e.key === 's' || e.key === 'P' || e.key === 'p'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation('Cố gắng mở công cụ kiểm tra (DevTools / View Source / Print)');
      }

      // In student mode: prevent Ctrl+C / Ctrl+V / Ctrl+X
      if (isStudent && e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V' || e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        e.stopPropagation();
        showToast('Thao tác Sao chép / Dán đã bị vô hiệu hóa trong phòng thi!', 'warning');
      }
    };

    // 3. Block context menu (right click) in student mode
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      showToast('Chuột phải đã bị khóa trong phòng thi!', 'warning');
      return false;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('contextmenu', handleContextMenu, true);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, [isProctoringActive, isStudent, triggerViolation]);

  return {
    isProctoringActive,
    setIsProctoringActive,
    violationCount,
    showWarningModal,
    setShowWarningModal,
    lastViolationReason,
    dismissWarning: () => {
      setShowWarningModal(false);
      lastViolationTimeRef.current = Date.now() + 2000; // grace period after dismiss
    },
  };
};
