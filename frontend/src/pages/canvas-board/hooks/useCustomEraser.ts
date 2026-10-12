import { useState, useEffect, useRef } from 'react';
import { eraseStrokesAlongPath } from '../utils/eraserEngine';
import { StrokeRecord, Point } from '../types';

interface UseCustomEraserProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  excalidrawAPI: any | null;
}

/**
 * High-speed partial vector eraser engine ported from the legacy canvas.
 * Instead of deleting entire strokes in one click, this splits and removes
 * only the partial stroke segments intersected by the eraser circle.
 */
export function useCustomEraser({ containerRef, excalidrawAPI }: UseCustomEraserProps) {
  const [eraserSize, setEraserSize] = useState<number>(24);
  const [cursorPos, setCursorPos] = useState<Point | null>(null);
  const [isEraserActive, setIsEraserActive] = useState<boolean>(false);

  const eraserSizeRef = useRef(eraserSize);
  eraserSizeRef.current = eraserSize;

  const isErasingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);

  // Track active tool & handle partial erasing
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !excalidrawAPI) return;

    const getSceneCoords = (clientX: number, clientY: number): Point => {
      const rect = container.getBoundingClientRect();
      const appState = excalidrawAPI.getAppState();
      const zoom = appState.zoom?.value || 1;
      return {
        x: (clientX - rect.left) / zoom - (appState.scrollX || 0),
        y: (clientY - rect.top) / zoom - (appState.scrollY || 0),
      };
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return; // Only primary left-click
      const appState = excalidrawAPI.getAppState();
      if (appState.activeTool?.type !== 'eraser') return;

      e.preventDefault();
      e.stopPropagation();

      isErasingRef.current = true;
      lastPointRef.current = getSceneCoords(e.clientX, e.clientY);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const appState = excalidrawAPI.getAppState();
      const isEraser = appState.activeTool?.type === 'eraser';
      setIsEraserActive(isEraser);

      if (isEraser) {
        const rect = container.getBoundingClientRect();
        setCursorPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      } else {
        setCursorPos(null);
      }

      if (!isErasingRef.current || !isEraser || !lastPointRef.current) return;

      e.preventDefault();
      e.stopPropagation();

      const currentPoint = getSceneCoords(e.clientX, e.clientY);
      const allElements = excalidrawAPI.getSceneElements();

      // Separate freedraw elements from other elements
      const freedrawElements = allElements.filter((el: any) => el.type === 'freedraw' && !el.isDeleted);
      const otherElements = allElements.filter((el: any) => el.type !== 'freedraw' || el.isDeleted);

      if (freedrawElements.length === 0) {
        lastPointRef.current = currentPoint;
        return;
      }

      // Convert Excalidraw freedraw elements to StrokeRecords
      const elementMetaMap = new Map<string, any>();
      const strokeRecords: StrokeRecord[] = freedrawElements.map((el: any) => {
        elementMetaMap.set(el.id, el);
        return {
          id: el.id,
          points: el.points.map(([dx, dy]: [number, number]) => ({
            x: el.x + dx,
            y: el.y + dy,
          })),
          tool: 'pen',
          color: el.strokeColor,
          size: el.strokeWidth,
        };
      });

      const radius = eraserSizeRef.current / 2;
      const { strokes: resultStrokes, hasChanged } = eraseStrokesAlongPath(
        strokeRecords,
        lastPointRef.current,
        currentPoint,
        radius
      );

      if (hasChanged) {
        // Convert surviving stroke segments back into Excalidraw freedraw elements
        const survivingFreedrawElements: any[] = [];

        resultStrokes.forEach((st) => {
          // If original exists and unchanged
          const baseEl = elementMetaMap.get(st.id) || freedrawElements[0];
          if (!st.points || st.points.length < 2) return;

          const startX = st.points[0].x;
          const startY = st.points[0].y;
          const relativePoints = st.points.map((p) => [p.x - startX, p.y - startY]);

          survivingFreedrawElements.push({
            ...baseEl,
            id: st.id,
            x: startX,
            y: startY,
            width: Math.max(...relativePoints.map((p) => Math.abs(p[0]))),
            height: Math.max(...relativePoints.map((p) => Math.abs(p[1]))),
            points: relativePoints,
            pressures: relativePoints.map(() => 0.5),
            simulatePressure: false,
            roughness: 0,
            strokeWidth: st.size || baseEl.strokeWidth,
            strokeColor: st.color || baseEl.strokeColor,
            updated: Date.now(),
          });
        });

        excalidrawAPI.updateScene({
          elements: [...otherElements, ...survivingFreedrawElements],
        });
      }

      lastPointRef.current = currentPoint;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (isErasingRef.current) {
        e.preventDefault();
        e.stopPropagation();
        isErasingRef.current = false;
        lastPointRef.current = null;
        excalidrawAPI.updateScene({ commitToHistory: true });
      }
    };

    const handlePointerLeave = () => {
      setCursorPos(null);
      if (isErasingRef.current) {
        isErasingRef.current = false;
        lastPointRef.current = null;
      }
    };

    container.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('pointermove', handlePointerMove, true);
    window.addEventListener('pointerup', handlePointerUp, true);
    window.addEventListener('pointercancel', handlePointerUp, true);
    container.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('pointermove', handlePointerMove, true);
      window.removeEventListener('pointerup', handlePointerUp, true);
      window.removeEventListener('pointercancel', handlePointerUp, true);
      container.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [containerRef, excalidrawAPI]);

  return {
    eraserSize,
    setEraserSize,
    cursorPos,
    isEraserActive,
  };
}
