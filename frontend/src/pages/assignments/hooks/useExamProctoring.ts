import { useState, useEffect, useCallback } from 'react';
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
  const [isProctoringActive, setIsProctoringActive] = useState<boolean>(enabled);
  const [violationCount, setViolationCount] = useState<number>(0);
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [lastViolationReason, setLastViolationReason] = useState<string>('');

  const triggerViolation = useCallback(
    (reason: string) => {
      if (!isProctoringActive) return;
      setViolationCount((prev) => {
        const next = prev + 1;
        if (onViolation) onViolation(next, reason);
        return next;
      });
      setLastViolationReason(reason);
      setShowWarningModal(true);
    },
    [isProctoringActive, onViolation]
  );

  useEffect(() => {
    if (!isProctoringActive) return;

    // 1. Tab switch & visibility change detector
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation('Rời khỏi màn hình làm bài / Chuyển sang Tab khác');
      }
    };

    // 2. Window blur detector (e.g. clicking outside or alt-tabbing)
    const handleWindowBlur = () => {
      triggerViolation('Mất tiêu điểm cửa sổ thi / Click chuột ra ngoài ứng dụng');
    };

    // 3. Block developer tools, inspection, copy & printing shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 or Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (DevTools)
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

    // 4. Block context menu (right click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      showToast('Chuột phải đã bị khóa trong phòng thi!', 'warning');
      return false;
    };

    // 5. Block text selection
    const handleSelectStart = (e: Event) => {
      if (isStudent) {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          return true; // Allow selecting text inside typing inputs
        }
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('selectstart', handleSelectStart, true);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('selectstart', handleSelectStart, true);
    };
  }, [isProctoringActive, isStudent, triggerViolation]);

  return {
    isProctoringActive,
    setIsProctoringActive,
    violationCount,
    showWarningModal,
    setShowWarningModal,
    lastViolationReason,
    dismissWarning: () => setShowWarningModal(false),
  };
};
