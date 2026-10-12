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
      zeroEl: HTMLElement | null,
      maxEl: HTMLElement | null,
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

        if (val <= 1.2) {
          bubbleEl.style.display = 'none';
          if (zeroEl) zeroEl.style.opacity = '1';
          if (maxEl) maxEl.style.opacity = '1';
        } else if (val <= 3) {
          bubbleEl.style.display = 'block';
          if (zeroEl) zeroEl.style.opacity = '0';
          if (maxEl) maxEl.style.opacity = '1';
        } else if (val >= 22) {
          bubbleEl.style.display = 'block';
          if (zeroEl) zeroEl.style.opacity = '1';
          if (maxEl) maxEl.style.opacity = '0';
        } else {
          bubbleEl.style.display = 'block';
          if (zeroEl) zeroEl.style.opacity = '1';
          if (maxEl) maxEl.style.opacity = '1';
        }
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

        // 1px unit label at bottom left, matching the '0' label of the opacity slider
        const zeroLabel = document.createElement('div');
        zeroLabel.className = 'zero-label';
        zeroLabel.textContent = '1px';
        zeroLabel.style.cssText =
          'position: absolute; bottom: 0; left: 4px; font-size: 12px; color: var(--text-primary-color, currentColor); font-weight: 500; transition: opacity 0.15s ease;';

        // 24px max label at bottom right
        const maxLabel = document.createElement('div');
        maxLabel.className = 'max-label';
        maxLabel.textContent = '24px';
        maxLabel.style.cssText =
          'position: absolute; bottom: 0; right: 4px; font-size: 12px; color: var(--text-primary-color, currentColor); font-weight: 500; transition: opacity 0.15s ease;';

        // Floating value bubble underneath the thumb, matching the value bubble of the opacity slider
        const valueBubble = document.createElement('div');
        valueBubble.className = 'value-bubble';
        valueBubble.style.cssText =
          'position: absolute; bottom: 0; transform: translateX(-50%); font-size: 12px; color: var(--text-primary-color, currentColor); font-weight: 600; white-space: nowrap;';

        slider.addEventListener('input', (e) => {
          const val = parseFloat((e.target as HTMLInputElement).value) || 1;
          slider.title = `Độ dày nét: ${val}px`;
          updateSliderVisual(slider, valueBubble, zeroLabel, maxLabel, val);
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
        sliderWrapper.appendChild(zeroLabel);
        sliderWrapper.appendChild(maxLabel);
        sliderWrapper.appendChild(valueBubble);
        targetFieldset.appendChild(sliderWrapper);

        requestAnimationFrame(() => {
          updateSliderVisual(slider, valueBubble, zeroLabel, maxLabel, strokeWidthRef.current);
        });
      } else {
        const sliderInput = sliderWrapper.querySelector('input') as HTMLInputElement | null;
        const valueBubble = sliderWrapper.querySelector('.value-bubble') as HTMLElement | null;
        const zeroLabel = sliderWrapper.querySelector('.zero-label') as HTMLElement | null;
        const maxLabel = sliderWrapper.querySelector('.max-label') as HTMLElement | null;
        if (sliderInput && sliderInput.value !== String(strokeWidthRef.current)) {
          sliderInput.value = String(strokeWidthRef.current);
          updateSliderVisual(sliderInput, valueBubble, zeroLabel, maxLabel, strokeWidthRef.current);
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
