import React, { useState, useEffect, memo } from 'react';

interface CanvasTransformOverlayProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  excalidrawAPI: any | null;
}

interface RotationState {
  text: string;
  x: number;
  y: number;
}

interface GapState {
  id: string;
  text: string;
  x: number;
  y: number;
}

/**
 * Real-time HUD overlay that displays:
 * 1. Rotation Angle in degrees (e.g. 45°, 90°) while rotating any element.
 * 2. Spacing / Distance between elements in pixels (e.g. 24px) when adjusting gaps or moving elements.
 */
export const CanvasTransformOverlay = memo(function CanvasTransformOverlay({
  containerRef,
  excalidrawAPI,
}: CanvasTransformOverlayProps) {
  const [rotation, setRotation] = useState<RotationState | null>(null);
  const [gaps, setGaps] = useState<GapState[]>([]);

  useEffect(() => {
    if (!excalidrawAPI) return;

    let rafId: number | null = null;
    let isTracking = false;

    const updateMetrics = () => {
      try {
        const appState = excalidrawAPI.getAppState();
        if (!appState) {
          setRotation(null);
          setGaps([]);
          return;
        }

        const zoom = appState.zoom?.value || 1;
        const scrollX = appState.scrollX || 0;
        const scrollY = appState.scrollY || 0;
        const offsetLeft = appState.offsetLeft || 0;
        const offsetTop = appState.offsetTop || 0;

        const sceneToViewport = (sx: number, sy: number) => ({
          x: (sx + scrollX) * zoom + offsetLeft,
          y: (sy + scrollY) * zoom + offsetTop,
        });

        // 1. Rotation Angle Calculation
        if (appState.isRotating) {
          const selectedIds = appState.selectedElementIds || {};
          const elements = excalidrawAPI.getSceneElements?.() || [];
          const rotatingEl = elements.find((el: any) => selectedIds[el.id]);

          if (rotatingEl) {
            const rawAngle = rotatingEl.angle || 0;
            const deg = Math.round((rawAngle * 180) / Math.PI);
            const normalizedDeg = ((deg % 360) + 360) % 360;

            const pos = sceneToViewport(
              rotatingEl.x + rotatingEl.width / 2,
              rotatingEl.y - 36 / zoom
            );

            setRotation({
              text: `${normalizedDeg}°`,
              x: pos.x,
              y: pos.y,
            });
          } else {
            setRotation(null);
          }
        } else {
          setRotation(null);
        }

        // 2. Element Gap & Distance Calculation
        const detectedGaps: GapState[] = [];
        const snapLines = appState.snapLines || [];

        // 2a. Direct gap snapping from Excalidraw's smart guides
        for (let i = 0; i < snapLines.length; i++) {
          const snapLine = snapLines[i];
          if (snapLine.type === 'gap' && snapLine.points?.length >= 2) {
            const from = snapLine.points[0];
            const to = snapLine.points[1];
            const dist = Math.round(
              snapLine.direction === 'horizontal'
                ? Math.abs(to[0] - from[0])
                : Math.abs(to[1] - from[1])
            );

            if (dist > 0) {
              const mid = sceneToViewport(
                (from[0] + to[0]) / 2,
                (from[1] + to[1]) / 2
              );
              detectedGaps.push({
                id: `snap_${i}_${dist}`,
                text: `${dist}px`,
                x: mid.x,
                y: mid.y,
              });
            }
          }
        }

        // 2b. Multi-element drag spacing calculation
        if (appState.selectedElementsAreBeingDragged && detectedGaps.length === 0) {
          const selectedIds = appState.selectedElementIds || {};
          const elements = excalidrawAPI.getSceneElements?.() || [];
          const draggedEls = elements.filter((el: any) => selectedIds[el.id] && !el.isDeleted);

          if (draggedEls.length === 2) {
            const [a, b] = draggedEls;
            const leftEl = a.x <= b.x ? a : b;
            const rightEl = a.x <= b.x ? b : a;
            const hGap = Math.round(rightEl.x - (leftEl.x + leftEl.width));

            const topEl = a.y <= b.y ? a : b;
            const bottomEl = a.y <= b.y ? b : a;
            const vGap = Math.round(bottomEl.y - (topEl.y + topEl.height));

            // Check horizontal overlap
            const yOverlap = Math.min(leftEl.y + leftEl.height, rightEl.y + rightEl.height) - Math.max(leftEl.y, rightEl.y);
            if (hGap > 0 && yOverlap > 0) {
              const mid = sceneToViewport(
                leftEl.x + leftEl.width + hGap / 2,
                Math.max(leftEl.y, rightEl.y) + yOverlap / 2
              );
              detectedGaps.push({
                id: `h_gap_${hGap}`,
                text: `${hGap}px`,
                x: mid.x,
                y: mid.y,
              });
            }

            // Check vertical overlap
            const xOverlap = Math.min(topEl.x + topEl.width, bottomEl.x + bottomEl.width) - Math.max(topEl.x, bottomEl.x);
            if (vGap > 0 && xOverlap > 0) {
              const mid = sceneToViewport(
                Math.max(topEl.x, bottomEl.x) + xOverlap / 2,
                topEl.y + topEl.height + vGap / 2
              );
              detectedGaps.push({
                id: `v_gap_${vGap}`,
                text: `${vGap}px`,
                x: mid.x,
                y: mid.y,
              });
            }
          }
        }

        setGaps(detectedGaps);
      } catch {
        // Suppress transient render errors
      }
    };

    const loop = () => {
      updateMetrics();
      if (isTracking) {
        rafId = requestAnimationFrame(loop);
      }
    };

    const handlePointerDown = () => {
      isTracking = true;
      if (!rafId) rafId = requestAnimationFrame(loop);
    };

    const handlePointerUp = () => {
      isTracking = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      // Final clear after gesture completes
      setTimeout(() => {
        setRotation(null);
        setGaps([]);
      }, 50);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('pointerdown', handlePointerDown, true);
      window.addEventListener('pointerup', handlePointerUp, true);
      window.addEventListener('pointercancel', handlePointerUp, true);
    }

    return () => {
      isTracking = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (container) {
        container.removeEventListener('pointerdown', handlePointerDown, true);
      }
      window.removeEventListener('pointerup', handlePointerUp, true);
      window.removeEventListener('pointercancel', handlePointerUp, true);
    };
  }, [containerRef, excalidrawAPI]);

  return (
    <>
      {/* 1. Rotation Angle HUD Badge */}
      {rotation && (
        <div
          className="absolute z-50 pointer-events-none select-none flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/95 text-white text-xs font-mono font-bold rounded-lg shadow-xl border border-white/20 animate-in fade-in duration-75"
          style={{
            left: rotation.x,
            top: rotation.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          <span>{rotation.text}</span>
        </div>
      )}

      {/* 2. Gap / Spacing Distance HUD Badges */}
      {gaps.map((gap) => (
        <div
          key={gap.id}
          className="absolute z-50 pointer-events-none select-none flex items-center px-2 py-0.5 bg-rose-600 text-white text-[11px] font-mono font-bold rounded-md shadow-lg border border-white/30 animate-in fade-in duration-75"
          style={{
            left: gap.x,
            top: gap.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span>{gap.text}</span>
        </div>
      ))}
    </>
  );
});

export default CanvasTransformOverlay;
