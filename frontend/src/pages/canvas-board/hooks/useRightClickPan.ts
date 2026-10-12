import { useEffect, useRef } from 'react';

interface UseRightClickPanProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  excalidrawAPI: any | null;
}

/**
 * Enables smooth right-click drag-to-pan like traditional whiteboard/canvas apps,
 * and completely suppresses the OS and Excalidraw context selection menus on right-click.
 */
export function useRightClickPan({ containerRef, excalidrawAPI }: UseRightClickPanProps) {
  const isPanningRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startScrollRef = useRef({ scrollX: 0, scrollY: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !excalidrawAPI) return;

    const handlePointerDown = (e: PointerEvent) => {
      // Right mouse button click (button === 2)
      if (e.button === 2) {
        e.preventDefault();
        e.stopPropagation();

        isPanningRef.current = true;
        startPosRef.current = { x: e.clientX, y: e.clientY };

        const appState = excalidrawAPI.getAppState();
        startScrollRef.current = {
          scrollX: appState.scrollX || 0,
          scrollY: appState.scrollY || 0,
        };

        container.style.cursor = 'grabbing';
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPanningRef.current) return;

      e.preventDefault();
      e.stopPropagation();

      const appState = excalidrawAPI.getAppState();
      const zoom = appState.zoom?.value || 1;

      const deltaX = (e.clientX - startPosRef.current.x) / zoom;
      const deltaY = (e.clientY - startPosRef.current.y) / zoom;

      excalidrawAPI.updateScene({
        appState: {
          scrollX: startScrollRef.current.scrollX + deltaX,
          scrollY: startScrollRef.current.scrollY + deltaY,
        },
      });
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.button === 2 || isPanningRef.current) {
        if (isPanningRef.current) {
          e.preventDefault();
          e.stopPropagation();
        }
        isPanningRef.current = false;
        container.style.cursor = '';
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      // Suppress right-click context menu everywhere inside whiteboard
      e.preventDefault();
      e.stopPropagation();
    };

    // Capture phase on container to intercept before Excalidraw's canvas listeners
    container.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('pointermove', handlePointerMove, true);
    window.addEventListener('pointerup', handlePointerUp, true);
    window.addEventListener('pointercancel', handlePointerUp, true);
    container.addEventListener('contextmenu', handleContextMenu, true);

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('pointermove', handlePointerMove, true);
      window.removeEventListener('pointerup', handlePointerUp, true);
      window.removeEventListener('pointercancel', handlePointerUp, true);
      container.removeEventListener('contextmenu', handleContextMenu, true);
      container.style.cursor = '';
    };
  }, [containerRef, excalidrawAPI]);
}
