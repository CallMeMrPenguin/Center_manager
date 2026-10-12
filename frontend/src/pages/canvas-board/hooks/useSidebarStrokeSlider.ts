import { useEffect, useRef } from 'react';

interface UseSidebarStrokeSliderProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  excalidrawAPI: any | null;
  strokeWidth: number;
  setStrokeWidth: (w: number) => void;
}

/**
 * Injects a smooth stroke width range slider into Excalidraw's left sidebar settings,
 * matching 100% the layout, classes and visual styling of Excalidraw's native Opacity slider.
 */
export function useSidebarStrokeSlider({
  containerRef,
  excalidrawAPI,
  strokeWidth,
  setStrokeWidth,
}: UseSidebarStrokeSliderProps) {
  const strokeWidthRef = useRef(strokeWidth);
  strokeWidthRef.current = strokeWidth;

  const setStrokeWidthRef = useRef(setStrokeWidth);
  setStrokeWidthRef.current = setStrokeWidth;

  const excalidrawAPIRef = useRef(excalidrawAPI);
  excalidrawAPIRef.current = excalidrawAPI;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;

    const updateSliderVisual = (
      rangeInput: HTMLInputElement,
      bubbleEl: HTMLElement | null,
      val: number
    ) => {
      const min = 1;
      const max = 24;
      const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));

      // Native Excalidraw track gradient fill matching Opacity slider
      rangeInput.style.background = `linear-gradient(to right, var(--color-slider-track, #c5c4f6) 0%, var(--color-slider-track, #c5c4f6) ${pct}%, var(--button-bg, #ececf4) ${pct}%, var(--button-bg, #ececf4) 100%)`;

      if (bubbleEl) {
        const inputWidth = rangeInput.offsetWidth || 180;
        const thumbWidth = 15;
        const position = (pct / 100) * (inputWidth - thumbWidth) + thumbWidth / 2;
        bubbleEl.style.left = `${position}px`;
        bubbleEl.textContent = `${val}px`;
        bubbleEl.style.display = 'block';
      }
    };

    const syncSlider = () => {
      // Find the stroke width section in Excalidraw's left sidebar
      const thinBtn = container.querySelector('[data-testid="strokeWidth-thin"]') as HTMLElement | null;
      let targetFieldset: HTMLElement | null = null;

      if (thinBtn) {
        targetFieldset = thinBtn.closest('fieldset');
      }

      if (!targetFieldset) {
        const fieldsets = Array.from(container.querySelectorAll('fieldset'));
        targetFieldset = fieldsets.find((fs) => {
          const text = (fs.querySelector('legend')?.textContent || '').toLowerCase();
          return text.includes('stroke width') || text.includes('độ dày nét');
        }) || null;
      }

      if (!targetFieldset) return;

      // Hide the 3 default buttons
      const buttonList = (targetFieldset.querySelector('.buttonList') as HTMLElement | null)
        || (thinBtn?.parentElement as HTMLElement | null);

      if (buttonList && buttonList.style.display !== 'none') {
        buttonList.style.display = 'none';
      }

      let sliderWrapper = targetFieldset.querySelector('.custom-sidebar-stroke-wrapper') as HTMLElement | null;

      if (!sliderWrapper) {
        sliderWrapper = document.createElement('div');
        sliderWrapper.className = 'custom-sidebar-stroke-wrapper range-wrapper';
        sliderWrapper.style.cssText =
          'position: relative; width: 100%; padding-top: 10px; padding-bottom: 24px; margin-top: 2px;';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '1';
        slider.max = '24';
        slider.step = '0.5';
        slider.className = 'range-input custom-stroke-slider-input';
        slider.value = String(strokeWidthRef.current);
        slider.style.cssText =
          'width: 100%; height: 4px; -webkit-appearance: none; border-radius: 2px; outline: none; cursor: pointer;';
        slider.title = `Độ dày nét: ${strokeWidthRef.current}px`;

        // Floating value bubble underneath the thumb, tracking position dynamically
        const valueBubble = document.createElement('div');
        valueBubble.className = 'value-bubble';
        valueBubble.style.cssText =
          'position: absolute; bottom: 0; transform: translateX(-50%); font-size: 12px; color: var(--text-primary-color, currentColor); font-weight: 600; white-space: nowrap;';

        slider.addEventListener('input', (e) => {
          const val = parseFloat((e.target as HTMLInputElement).value) || 1;
          slider.title = `Độ dày nét: ${val}px`;
          updateSliderVisual(slider, valueBubble, val);
          setStrokeWidthRef.current(val);

          const api = excalidrawAPIRef.current;
          if (api) {
            const appState = api.getAppState();
            const selectedIds = appState.selectedElementIds || {};
            const hasSelection = Object.keys(selectedIds).some((id: string) => selectedIds[id]);

            if (hasSelection) {
              const elements = api.getSceneElements().map((el: any) => {
                if (selectedIds[el.id]) return { ...el, strokeWidth: val };
                return el;
              });
              api.updateScene({
                elements,
                appState: { currentItemStrokeWidth: val },
                commitToHistory: true,
              });
            } else {
              api.updateScene({
                appState: { currentItemStrokeWidth: val },
              });
            }
          }
        });

        sliderWrapper.appendChild(slider);
        sliderWrapper.appendChild(valueBubble);
        targetFieldset.appendChild(sliderWrapper);

        requestAnimationFrame(() => {
          updateSliderVisual(slider, valueBubble, strokeWidthRef.current);
        });
      } else {
        const sliderInput = sliderWrapper.querySelector('input') as HTMLInputElement | null;
        const valueBubble = sliderWrapper.querySelector('.value-bubble') as HTMLElement | null;
        const oldZero = sliderWrapper.querySelector('.zero-label');
        if (oldZero) oldZero.remove();
        const oldMax = sliderWrapper.querySelector('.max-label');
        if (oldMax) oldMax.remove();

        if (sliderInput && sliderInput.value !== String(strokeWidthRef.current)) {
          sliderInput.value = String(strokeWidthRef.current);
          updateSliderVisual(sliderInput, valueBubble, strokeWidthRef.current);
        }
      }
    };

    // Throttle mutation checks to RAF to prevent lag
    const scheduleSync = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        syncSlider();
      });
    };

    // Observe UI layer only, avoiding canvas render loop mutations
    const uiLayer = container.querySelector('.layer-ui__wrapper') || container;
    const observer = new MutationObserver(scheduleSync);

    observer.observe(uiLayer, {
      childList: true,
      subtree: true,
    });

    syncSlider();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [containerRef]);
}
