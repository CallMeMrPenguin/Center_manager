import { useEffect, useState, useRef } from 'react';
import { toActualStrokeWidth } from './useSidebarStrokeSlider';

interface UseWhiteboardUIAdjustmentsProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  excalidrawAPI: any | null;
  eraserSize: number;
  setEraserSize: (size: number) => void;
  strokeWidth: number;
}

/**
 * Manages UI adjustments for Whiteboard:
 * 1. Toggles properties panel on clicking the Style button or re-clicking the active tool.
 * 2. Injects big paint brush Highlighter button and dedicated Style button next to Pencil.
 * 3. Injects Fullscreen expand/collapse button into toolbar (hiding sidetab and expanding to full screen).
 * 4. Enforces keep-selected-tool-active (tool lock always on).
 * 5. Injects eraser size slider into properties panel when eraser is selected.
 * 6. Safely hides Sloppiness controls without hiding Stroke color picker.
 */
export function useWhiteboardUIAdjustments({
  containerRef,
  excalidrawAPI,
  eraserSize,
  setEraserSize,
  strokeWidth,
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

  const strokeWidthRef = useRef(strokeWidth);
  strokeWidthRef.current = strokeWidth;

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

  // Ensure stroke settings are immediately shown when opening properties
  const openPropertiesPanel = () => {
    setIsPropertiesOpen((prev) => {
      const next = !prev;
      if (next && excalidrawAPI) {
        const appState = excalidrawAPI.getAppState();
        const selectedIds = appState.selectedElementIds || {};
        const elements = excalidrawAPI.getSceneElements?.() || [];
        const hasImageSelected = elements.some((el: any) => selectedIds[el.id] && el.type === 'image');
        const hasStrokeElements = elements.some((el: any) => selectedIds[el.id] && el.type !== 'image');

        // If an image is selected or no stroke-editable elements are selected or tool is not freedraw:
        // Clear image selection and activate freedraw so stroke width & color settings are 100% visible!
        if (hasImageSelected || !hasStrokeElements || appState.activeTool?.type !== 'freedraw') {
          excalidrawAPI.updateScene({
            appState: {
              activeTool: { type: 'freedraw', locked: true },
              selectedElementIds: {},
            },
          });
        }
      }
      return next;
    });
  };

  // Toolbar button interception & properties panel toggle logic
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !excalidrawAPI) return;

    const handleToolbarClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Check if user clicked custom style (palette) button
      const styleBtn = target.closest('.custom-style-tool-btn') as HTMLElement | null;
      if (styleBtn) {
        e.preventDefault();
        e.stopPropagation();
        openPropertiesPanel();
        return;
      }

      // Check if user clicked custom fullscreen button
      const fsBtn = target.closest('.custom-fullscreen-tool-btn') as HTMLElement | null;
      if (fsBtn) {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('toggle-whiteboard-fullscreen'));
        return;
      }

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
          openPropertiesPanel();
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
          openPropertiesPanel();
        } else {
          // Switch back to normal solid pen with preserved stroke width
          setIsHighlighterMode(false);
          setIsPropertiesOpen(false);
          excalidrawAPI.updateScene({
            appState: {
              activeTool: { type: 'freedraw', locked: true },
              currentItemOpacity: 100,
              currentItemStrokeWidth: toActualStrokeWidth(strokeWidthRef.current || 1),
            },
          });
        }
        return;
      }

      // Any other tool: check if re-clicked
      const clickedTool = testId?.replace('toolbar-', '');
      if (clickedTool && clickedTool === currentTool) {
        openPropertiesPanel();
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

  // Enforce tool lock always on and inject custom DOM elements
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

      // 2. Hide Sloppiness fieldsets safely (never hide Stroke or Nét vẽ!)
      const fieldsets = Array.from(container.querySelectorAll('fieldset'));
      fieldsets.forEach((fs) => {
        const hasSloppinessInput = fs.querySelector('[name*="sloppiness"], [data-testid*="sloppiness"]');
        const legendText = (fs.querySelector('legend')?.textContent || '').toLowerCase().trim();
        if (
          hasSloppinessInput ||
          legendText === 'sloppiness' ||
          legendText === 'hoa văn nét' ||
          legendText === 'độ thô'
        ) {
          fs.style.display = 'none';
        }
      });

      // 2b. Hide Hand (Pan) tool button since pan is handled by right-click
      const handBtn = container.querySelector(
        '[data-testid="toolbar-hand"], [data-testid="hand"], input[value="hand"]'
      ) as HTMLElement | null;
      if (handBtn) {
        const handLabel = handBtn.closest('label') || handBtn;
        if (handLabel && handLabel.style.display !== 'none') {
          handLabel.style.display = 'none';
        }
      }

      // 3. Inject Highlighter & Style (Palette) buttons next to native Freedraw button
      const freedrawBtn = container.querySelector('[data-testid="toolbar-freedraw"]') as HTMLElement | null;
      if (freedrawBtn && freedrawBtn.parentElement) {
        let hlBtn = container.querySelector('.custom-highlighter-tool-btn') as HTMLButtonElement | null;
        if (!hlBtn) {
          hlBtn = document.createElement('button');
          hlBtn.type = 'button';
          hlBtn.className = 'custom-highlighter-tool-btn';
          hlBtn.title = 'Bút dạ quang (Highlighter)';
          hlBtn.setAttribute('aria-label', 'Bút dạ quang');

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

        // Dedicated Style / Palette button to quickly toggle colors and stroke width
        let styleBtn = container.querySelector('.custom-style-tool-btn') as HTMLButtonElement | null;
        if (!styleBtn) {
          styleBtn = document.createElement('button');
          styleBtn.type = 'button';
          styleBtn.className = 'custom-style-tool-btn';
          styleBtn.title = 'Bảng màu & Cỡ nét vẽ';
          styleBtn.setAttribute('aria-label', 'Bảng màu & Cỡ nét');

          styleBtn.innerHTML = `
            <div class="ToolIcon__icon">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
                <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
                <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
                <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
              </svg>
            </div>
          `;

          hlBtn.parentElement?.insertBefore(styleBtn, hlBtn.nextSibling);
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

        // Sync active state on style button
        if (isPropertiesOpenRef.current) {
          styleBtn.classList.add('active');
        } else {
          styleBtn.classList.remove('active');
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
            <legend style="font-size: 11px; font-weight: 700; opacity: 0.8; margin-bottom: 6px;">Kích thước: <span class="eraser-val">${eraserSizeRef.current}px</span></legend>
            <input type="range" min="6" max="80" step="2" value="${eraserSizeRef.current}" class="custom-eraser-slider" style="width: 100%; cursor: pointer;" />
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
