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
      // Find stroke width buttons container in Excalidraw's sidebar
      const thinBtn = container.querySelector('button[data-testid="stroke-width-thin"]');
      if (!thinBtn || !thinBtn.parentElement) return;

      const parent = thinBtn.parentElement;
      let existingSlider = parent.querySelector('.custom-sidebar-stroke-slider') as HTMLInputElement | null;

      if (!existingSlider) {
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-sidebar-stroke-slider w-full mt-1.5 flex items-center gap-2';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '1';
        slider.max = '24';
        slider.step = '0.5';
        slider.value = String(strokeWidth);
        slider.className = 'w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600';
        slider.title = `Độ dày nét: ${strokeWidth}px`;

        const label = document.createElement('span');
        label.className = 'text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 min-w-[28px]';
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

        wrapper.appendChild(slider);
        wrapper.appendChild(label);
        parent.appendChild(wrapper);
      } else {
        const sliderInput = existingSlider.querySelector('input') as HTMLInputElement | null;
        const labelSpan = existingSlider.querySelector('span') as HTMLSpanElement | null;
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
