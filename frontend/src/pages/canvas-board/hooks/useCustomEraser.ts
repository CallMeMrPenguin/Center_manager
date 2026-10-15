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

    const eraseAtScenePoint = (fromPoint: Point, toPoint: Point) => {
      const allElements = excalidrawAPI.getSceneElements();
      const freedrawElements = allElements.filter((el: any) => el.type === 'freedraw' && !el.isDeleted);
      const otherElements = allElements.filter((el: any) => el.type !== 'freedraw' || el.isDeleted);

      const appState = excalidrawAPI.getAppState();
      const zoom = appState.zoom?.value || 1;
      // Convert screen circle radius to scene radius so it matches visual red circle exactly
      const sceneRadius = (eraserSizeRef.current / 2) / zoom;

      let hasAnyChange = false;
      let survivingFreedrawElements = freedrawElements;

      // 1. Partial vector erase for freedraw strokes
      if (freedrawElements.length > 0) {
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

        const { strokes: resultStrokes, hasChanged } = eraseStrokesAlongPath(
          strokeRecords,
          fromPoint,
          toPoint,
          sceneRadius
        );

        if (hasChanged) {
          hasAnyChange = true;
          survivingFreedrawElements = [];
          resultStrokes.forEach((st) => {
            const baseEl = elementMetaMap.get(st.id) || freedrawElements[0];
            if (!st.points || st.points.length < 2) return;

            const startX = st.points[0].x;
            const startY = st.points[0].y;
            const relativePoints = st.points.map((p) => [p.x - startX, p.y - startY]);
            const xs = relativePoints.map((p) => p[0]);
            const ys = relativePoints.map((p) => p[1]);

            survivingFreedrawElements.push({
              ...baseEl,
              id: st.id,
              x: startX,
              y: startY,
              width: Math.max(1, Math.max(...xs) - Math.min(...xs)),
              height: Math.max(1, Math.max(...ys) - Math.min(...ys)),
              points: relativePoints,
              pressures: relativePoints.map(() => 0.5),
              simulatePressure: false,
              roughness: 0,
              strokeWidth: st.size || baseEl.strokeWidth,
              strokeColor: st.color || baseEl.strokeColor,
              updated: Date.now(),
            });
          });
        }
      }

      // 2. Erase non-freedraw elements (shapes, lines, text) when touched by eraser
      const modifiedOther = otherElements.map((el: any) => {
        if (el.isDeleted) return el;
        const elLeft = el.x;
        const elRight = el.x + (el.width || 0);
        const elTop = el.y;
        const elBottom = el.y + (el.height || 0);

        const hit =
          toPoint.x >= elLeft - sceneRadius &&
          toPoint.x <= elRight + sceneRadius &&
          toPoint.y >= elTop - sceneRadius &&
          toPoint.y <= elBottom + sceneRadius;

        if (hit) {
          hasAnyChange = true;
          return { ...el, isDeleted: true, updated: Date.now() };
        }
        return el;
      });

      if (hasAnyChange) {
        excalidrawAPI.updateScene({
          elements: [...modifiedOther, ...survivingFreedrawElements],
        });
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return; // Only primary left-click

      // NEVER intercept clicks on UI controls (slider, buttons, popups, toolbars)
      const target = e.target as HTMLElement | null;
      if (target?.closest('.custom-eraser-size-bar, input, button, select, label, [role="button"], .App-toolbar, .App-menu, .layer-ui__wrapper')) {
        return;
      }

      const appState = excalidrawAPI.getAppState();
      if (appState.activeTool?.type !== 'eraser') return;

      e.preventDefault();
      e.stopPropagation();

      isErasingRef.current = true;
      const pt = getSceneCoords(e.clientX, e.clientY);
      lastPointRef.current = pt;

      // Erase immediately on click (pointer down) matching old canvas logic!
      eraseAtScenePoint(pt, pt);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const appState = excalidrawAPI.getAppState();
      const isEraser = appState.activeTool?.type === 'eraser';
      setIsEraserActive(isEraser);

      if (isEraser) {
        container.classList.add('eraser-active');
        const rect = container.getBoundingClientRect();
        setCursorPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      } else {
        container.classList.remove('eraser-active');
        setCursorPos(null);
      }

      if (!isErasingRef.current || !isEraser || !lastPointRef.current) return;

      e.preventDefault();
      e.stopPropagation();

      const currentPoint = getSceneCoords(e.clientX, e.clientY);
      eraseAtScenePoint(lastPointRef.current, currentPoint);
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

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;
      if (e.key === '[' || e.key === '{') {
        e.preventDefault();
        setEraserSize((prev) => Math.max(6, prev - 4));
      } else if (e.key === ']' || e.key === '}') {
        e.preventDefault();
        setEraserSize((prev) => Math.min(80, prev + 4));
      }
    };

    container.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('pointermove', handlePointerMove, true);
    window.addEventListener('pointerup', handlePointerUp, true);
    window.addEventListener('pointercancel', handlePointerUp, true);
    container.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      container.classList.remove('eraser-active');
      container.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('pointermove', handlePointerMove, true);
      window.removeEventListener('pointerup', handlePointerUp, true);
      window.removeEventListener('pointercancel', handlePointerUp, true);
      container.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, excalidrawAPI]);

  return {
    eraserSize,
    setEraserSize,
    cursorPos,
    isEraserActive,
  };
}
