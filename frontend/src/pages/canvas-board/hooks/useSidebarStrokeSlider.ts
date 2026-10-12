import { useEffect } from 'react';

interface UseSidebarStrokeSliderProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  excalidrawAPI: any | null;
  strokeWidth: number;
  setStrokeWidth: (w: number) => void;
}

export function useSidebarStrokeSlider({
  containerRef,
  excalidrawAPI,
  strokeWidth,
  setStrokeWidth,
}: UseSidebarStrokeSliderProps) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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

      // Find the container holding the 3 buttons
      const buttonList = targetFieldset.querySelector('.buttonList') as HTMLElement | null
        || thinBtn?.parentElement as HTMLElement | null;

      if (buttonList && buttonList.style.display !== 'none') {
        buttonList.style.display = 'none'; // Hide the 3 static buttons
      }

      let sliderWrapper = targetFieldset.querySelector('.custom-sidebar-stroke-slider') as HTMLElement | null;

      if (!sliderWrapper) {
        sliderWrapper = document.createElement('div');
        sliderWrapper.className = 'custom-sidebar-stroke-slider';
        sliderWrapper.style.cssText =
          'display: flex; align-items: center; gap: 8px; width: 100%; padding-top: 4px; padding-bottom: 2px;';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '1';
        slider.max = '24';
        slider.step = '0.5';
        slider.value = String(strokeWidth);
        slider.style.cssText =
          'flex: 1; height: 6px; border-radius: 9999px; accent-color: var(--color-primary, #6965db); cursor: pointer;';
        slider.title = `Độ dày nét: ${strokeWidth}px`;

        const label = document.createElement('span');
        label.className = 'stroke-width-label';
        label.style.cssText =
          'font-size: 11px; font-weight: 700; font-family: monospace; min-width: 34px; text-align: right; color: var(--color-text, currentColor);';
        label.textContent = `${strokeWidth}px`;

        slider.addEventListener('input', (e) => {
          const val = parseFloat((e.target as HTMLInputElement).value) || 1;
          label.textContent = `${val}px`;
          setStrokeWidth(val);

          if (excalidrawAPI) {
            const appState = excalidrawAPI.getAppState();
            const selectedIds = appState.selectedElementIds || {};
            const hasSelection = Object.keys(selectedIds).some((id: string) => selectedIds[id]);

            if (hasSelection) {
              const elements = excalidrawAPI.getSceneElements().map((el: any) => {
                if (selectedIds[el.id]) return { ...el, strokeWidth: val };
                return el;
              });
              excalidrawAPI.updateScene({
                elements,
                appState: { currentItemStrokeWidth: val },
                commitToHistory: true,
              });
            } else {
              excalidrawAPI.updateScene({
                appState: { currentItemStrokeWidth: val },
              });
            }
          }
        });

        sliderWrapper.appendChild(slider);
        sliderWrapper.appendChild(label);
        targetFieldset.appendChild(sliderWrapper);
      } else {
        const sliderInput = sliderWrapper.querySelector('input') as HTMLInputElement | null;
        const labelSpan = sliderWrapper.querySelector('.stroke-width-label') as HTMLSpanElement | null;
        if (sliderInput && sliderInput.value !== String(strokeWidth)) {
          sliderInput.value = String(strokeWidth);
        }
        if (labelSpan && labelSpan.textContent !== `${strokeWidth}px`) {
          labelSpan.textContent = `${strokeWidth}px`;
        }
      }
    };

    const observer = new MutationObserver(() => {
      syncSlider();
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
    });

    syncSlider();

    return () => {
      observer.disconnect();
    };
  }, [containerRef, excalidrawAPI, strokeWidth, setStrokeWidth]);
}
