import { useEffect, useState, useRef } from 'react';

interface UseWhiteboardUIAdjustmentsProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  excalidrawAPI: any | null;
  eraserSize: number;
  setEraserSize: (size: number) => void;
}

/**
 * Manages UI adjustments for Whiteboard:
 * 1. Toggles properties panel on re-clicking the active tool (hidden by default).
 * 2. Injects big paint brush Highlighter button next to Pencil.
 * 3. Enforces keep-selected-tool-active (tool lock always on).
 * 4. Injects eraser size slider into properties panel when eraser is selected.
 * 5. Hides Sloppiness controls.
 */
export function useWhiteboardUIAdjustments({
  containerRef,
  excalidrawAPI,
  eraserSize,
  setEraserSize,
}: UseWhiteboardUIAdjustmentsProps) {
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isHighlighterMode, setIsHighlighterMode] = useState(false);

  const isPropertiesOpenRef = useRef(isPropertiesOpen);
  isPropertiesOpenRef.current = isPropertiesOpen;

  const isHighlighterModeRef = useRef(isHighlighterMode);
  isHighlighterModeRef.current = isHighlighterMode;

  const eraserSizeRef = useRef(eraserSize);
  eraserSizeRef.current = eraserSize;

  const setEraserSizeRef = useRef(setEraserSize);
  setEraserSizeRef.current = setEraserSize;

  // Toggle hide-properties-panel CSS class on container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (isPropertiesOpen) {
      container.classList.remove('hide-properties-panel');
    } else {
      container.classList.add('hide-properties-panel');
    }
  }, [containerRef, isPropertiesOpen]);

  // Toolbar button interception & properties panel toggle logic
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !excalidrawAPI) return;

    const handleToolbarClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Check if user clicked a tool button inside toolbar
      const toolBtn = target.closest('[data-testid^="toolbar-"], .custom-highlighter-tool-btn') as HTMLElement | null;
      if (!toolBtn) return;

      const appState = excalidrawAPI.getAppState();
      const currentTool = appState.activeTool?.type;

      // Handle custom highlighter button click
      if (toolBtn.classList.contains('custom-highlighter-tool-btn')) {
        e.preventDefault();
        e.stopPropagation();

        if (isHighlighterModeRef.current) {
          // Re-clicked active highlighter: toggle properties panel
          setIsPropertiesOpen((prev) => !prev);
        } else {
          // Switch to highlighter mode: freedraw with 35% opacity & 16px width
          setIsHighlighterMode(true);
          setIsPropertiesOpen(false);
          excalidrawAPI.updateScene({
            appState: {
              activeTool: { type: 'freedraw', locked: true },
              currentItemOpacity: 35,
              currentItemStrokeWidth: 16,
            },
          });
        }
        return;
      }

      // Handle native freedraw pen tool button click
      const testId = toolBtn.getAttribute('data-testid');
      if (testId === 'toolbar-freedraw') {
        if (!isHighlighterModeRef.current && currentTool === 'freedraw') {
          // Re-clicked active pen: toggle properties panel
          setIsPropertiesOpen((prev) => !prev);
        } else {
          // Switch back to normal solid pen (100% opacity, 2px stroke)
          setIsHighlighterMode(false);
          setIsPropertiesOpen(false);
          excalidrawAPI.updateScene({
            appState: {
              activeTool: { type: 'freedraw', locked: true },
              currentItemOpacity: 100,
              currentItemStrokeWidth: 2,
            },
          });
        }
        return;
      }

      // Any other tool: check if re-clicked
      const clickedTool = testId?.replace('toolbar-', '');
      if (clickedTool && clickedTool === currentTool) {
        setIsPropertiesOpen((prev) => !prev);
      } else {
        setIsPropertiesOpen(false);
        setIsHighlighterMode(false);
      }
    };

    container.addEventListener('click', handleToolbarClick, true);

    return () => {
      container.removeEventListener('click', handleToolbarClick, true);
    };
  }, [containerRef, excalidrawAPI]);

  // Enforce tool lock always on and inject custom DOM elements (Highlighter button & Eraser slider)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !excalidrawAPI) return;

    const syncDOM = () => {
      const appState = excalidrawAPI.getAppState();

      // 1. Enforce active tool locked = true always
      if (appState.activeTool && !appState.activeTool.locked) {
        excalidrawAPI.updateScene({
          appState: {
            activeTool: { ...appState.activeTool, locked: true },
          },
        });
      }

      // 2. Hide Sloppiness fieldsets
      const fieldsets = Array.from(container.querySelectorAll('fieldset'));
      fieldsets.forEach((fs) => {
        const legendText = (fs.querySelector('legend')?.textContent || '').toLowerCase();
        if (legendText.includes('sloppiness') || legendText.includes('độ thô') || legendText.includes('nét vẽ')) {
          fs.style.display = 'none';
        }
      });

      // 3. Inject big paint brush Highlighter button right next to native Freedraw button
      const freedrawBtn = container.querySelector('[data-testid="toolbar-freedraw"]') as HTMLElement | null;
      if (freedrawBtn && freedrawBtn.parentElement) {
        let hlBtn = container.querySelector('.custom-highlighter-tool-btn') as HTMLButtonElement | null;
        if (!hlBtn) {
          hlBtn = document.createElement('button');
          hlBtn.type = 'button';
          hlBtn.className = 'custom-highlighter-tool-btn';
          hlBtn.title = 'Bút dạ quang (Highlighter)';
          hlBtn.setAttribute('aria-label', 'Bút dạ quang');

          // Big paint brush SVG icon
          hlBtn.innerHTML = `
            <div class="ToolIcon__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="m14 12-8.5 8.5a2.12 2.12 0 1 1-3-3L11 9" />
                <path d="M16 16l6-6" />
                <path d="m18 10 2-2a2.83 2.83 0 0 0-4-4l-2 2" />
                <path d="m15 13 2 2" />
              </svg>
            </div>
          `;

          freedrawBtn.parentElement.insertBefore(hlBtn, freedrawBtn.nextSibling);
        }

        // Sync active state on highlighter button
        if (isHighlighterModeRef.current && appState.activeTool?.type === 'freedraw') {
          hlBtn.classList.add('active');
          freedrawBtn.classList.remove('active');
          const freedrawInput = freedrawBtn.querySelector('input') as HTMLInputElement | null;
          if (freedrawInput) freedrawInput.checked = false;
        } else {
          hlBtn.classList.remove('active');
        }
      }

      // 4. Inject Eraser Size Slider in properties panel when eraser is active
      const isEraser = appState.activeTool?.type === 'eraser';
      const propertiesPanel = container.querySelector('.App-menu__left') as HTMLElement | null;

      if (propertiesPanel && isEraser) {
        let eraserFieldset = propertiesPanel.querySelector('.custom-eraser-size-fieldset') as HTMLElement | null;
        if (!eraserFieldset) {
          eraserFieldset = document.createElement('fieldset');
          eraserFieldset.className = 'custom-eraser-size-fieldset';
          eraserFieldset.style.cssText = 'border: none; padding: 4px 8px; margin: 4px 0; width: 100%;';
          eraserFieldset.innerHTML = `
            <legend style="font-size: 11px; font-weight: 700; opacity: 0.8; margin-bottom: 6px;">Độ lớn tẩy: <span class="eraser-val">${eraserSizeRef.current}px</span></legend>
            <input type="range" min="6" max="64" step="2" value="${eraserSizeRef.current}" class="custom-eraser-slider" style="width: 100%; cursor: pointer;" />
          `;

          const slider = eraserFieldset.querySelector('.custom-eraser-slider') as HTMLInputElement | null;
          const valLabel = eraserFieldset.querySelector('.eraser-val') as HTMLElement | null;

          if (slider) {
            slider.addEventListener('input', (ev) => {
              const val = parseInt((ev.target as HTMLInputElement).value, 10) || 24;
              if (valLabel) valLabel.textContent = `${val}px`;
              setEraserSizeRef.current(val);
            });
          }

          propertiesPanel.prepend(eraserFieldset);
        }
      }
    };

    let rafId: number | null = null;
    const scheduleDOMSync = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        syncDOM();
      });
    };

    const uiLayer = container.querySelector('.layer-ui__wrapper') || container;
    const observer = new MutationObserver(scheduleDOMSync);
    observer.observe(uiLayer, { childList: true, subtree: true });

    syncDOM();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [containerRef, excalidrawAPI]);

  return {
    isPropertiesOpen,
    setIsPropertiesOpen,
    isHighlighterMode,
  };
}
