import { useEffect, useRef } from 'react';

interface UseUniformPenPressureProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  excalidrawAPI: any | null;
}

/**
 * Eliminates velocity-based stroke distortion (slow = fat, fast = thin)
 * by normalizing pointer pressure and enforcing constant uniform thickness
 * matching the legacy HTML5 canvas drawing engine.
 * Also enforces roughness: 0 (Architect) across all tools.
 */
export function useUniformPenPressure({
  containerRef,
  excalidrawAPI,
}: UseUniformPenPressureProps) {
  const isNormalizingRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Intercept mouse pointer events and patch event.pressure to 0.4999
    // In Excalidraw's engine, (event.pressure === 0.5) triggers simulatePressure: true.
    // Setting pressure to 0.4999 ensures simulatePressure is FALSE, making stroke width uniform!
    const handlePointerNormalize = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' || e.pressure === 0.5 || e.pressure === 0) {
        try {
          Object.defineProperty(e, 'pressure', {
            value: 0.4999,
            configurable: true,
          });
        } catch {
          // Ignore read-only errors on strict browsers
        }
      }
    };

    container.addEventListener('pointerdown', handlePointerNormalize, true);
    container.addEventListener('pointermove', handlePointerNormalize, true);

    return () => {
      container.removeEventListener('pointerdown', handlePointerNormalize, true);
      container.removeEventListener('pointermove', handlePointerNormalize, true);
    };
  }, [containerRef]);

  // Scene observer to ensure newly committed freedraw elements have uniform pressure and roughness = 0 (Architect)
  useEffect(() => {
    if (!excalidrawAPI) return;

    const intervalId = setInterval(() => {
      if (isNormalizingRef.current) return;

      try {
        const appState = excalidrawAPI.getAppState();
        let needsUpdate = false;
        const updates: any = {};

        if (appState.currentItemRoughness !== 0) {
          updates.currentItemRoughness = 0;
          needsUpdate = true;
        }

        const elements = excalidrawAPI.getSceneElements();
        let hasModifiedElements = false;
        const normalizedElements = elements.map((el: any) => {
          let updated = el;
          if (el.roughness && el.roughness !== 0) {
            updated = { ...updated, roughness: 0 };
            hasModifiedElements = true;
          }
          if (el.type === 'freedraw' && el.simulatePressure) {
            updated = {
              ...updated,
              simulatePressure: false,
              pressures: el.points ? el.points.map(() => 0.5) : [],
            };
            hasModifiedElements = true;
          }
          return updated;
        });

        if (needsUpdate || hasModifiedElements) {
          isNormalizingRef.current = true;
          excalidrawAPI.updateScene({
            ...(hasModifiedElements ? { elements: normalizedElements } : {}),
            appState: updates,
          });
          isNormalizingRef.current = false;
        }
      } catch {
        isNormalizingRef.current = false;
      }
    }, 500);

    return () => clearInterval(intervalId);
  }, [excalidrawAPI]);
}
