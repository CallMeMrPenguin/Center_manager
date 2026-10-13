import { useState, useRef } from 'react';

export function useDraggableToolbar() {
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const isDraggingToolbarRef = useRef(false);
  const toolbarDragOffsetRef = useRef({ x: 0, y: 0 });

  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    isDraggingToolbarRef.current = true;
    const currentX = toolbarPos ? toolbarPos.x : 0;
    const currentY = toolbarPos ? toolbarPos.y : 0;
    toolbarDragOffsetRef.current = { x: e.clientX - currentX, y: e.clientY - currentY };

    const onMove = (moveEvt: MouseEvent) => {
      if (!isDraggingToolbarRef.current) return;
      setToolbarPos({
        x: moveEvt.clientX - toolbarDragOffsetRef.current.x,
        y: moveEvt.clientY - toolbarDragOffsetRef.current.y,
      });
    };

    const onUp = () => {
      isDraggingToolbarRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleToolbarTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    isDraggingToolbarRef.current = true;
    const touch = e.touches[0];
    const currentX = toolbarPos ? toolbarPos.x : 0;
    const currentY = toolbarPos ? toolbarPos.y : 0;
    toolbarDragOffsetRef.current = { x: touch.clientX - currentX, y: touch.clientY - currentY };

    const onTouchMove = (moveEvt: TouchEvent) => {
      if (!isDraggingToolbarRef.current || moveEvt.touches.length === 0) return;
      const t = moveEvt.touches[0];
      setToolbarPos({
        x: t.clientX - toolbarDragOffsetRef.current.x,
        y: t.clientY - toolbarDragOffsetRef.current.y,
      });
    };

    const onTouchEnd = () => {
      isDraggingToolbarRef.current = false;
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };

    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
  };

  return {
    toolbarPos,
    handleToolbarMouseDown,
    handleToolbarTouchStart,
  };
}
