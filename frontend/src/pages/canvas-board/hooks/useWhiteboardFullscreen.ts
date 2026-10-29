import { useEffect, useState, useRef } from 'react';

interface UseWhiteboardFullscreenProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  excalidrawAPI: any | null;
}

/**
 * Manages full-screen mode for the whiteboard:
 * 1. Expands the canvas board over the entire screen, hiding sidetabs, headers, and footers.
 * 2. Injects a matching fullscreen toggle button into Excalidraw's top toolbar.
 * 3. Keeps canvas dimensions and coordinate projection synchronized upon entering/exiting.
 */
export function useWhiteboardFullscreen({
  containerRef,
  excalidrawAPI,
}: UseWhiteboardFullscreenProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isFullscreenRef = useRef(false);
  isFullscreenRef.current = isFullscreen;

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    const willBeFullscreen = !isFullscreenRef.current;
    isFullscreenRef.current = willBeFullscreen;
    setIsFullscreen(willBeFullscreen);

    if (willBeFullscreen) {
      container.classList.add('whiteboard-fullscreen-mode');
      document.body.classList.add('whiteboard-fullscreen-active');
      if (!document.fullscreenElement && container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      }
    } else {
      container.classList.remove('whiteboard-fullscreen-mode');
      document.body.classList.remove('whiteboard-fullscreen-active');
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }

    [0, 50, 150, 300].forEach((ms) => {
      setTimeout(() => {
        try {
          excalidrawAPI?.refresh();
        } catch {}
      }, ms);
    });
  };

  // Listen to custom global toggle event from toolbar click interceptor
  useEffect(() => {
    const handler = () => toggleFullscreen();
    window.addEventListener('toggle-whiteboard-fullscreen', handler);
    return () => window.removeEventListener('toggle-whiteboard-fullscreen', handler);
  }, []);

  // Sync with native fullscreen changes (e.g. user presses Esc key)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleFullscreenChange = () => {
      const isNativeFs = !!document.fullscreenElement;
      if (!isNativeFs && isFullscreenRef.current) {
        isFullscreenRef.current = false;
        setIsFullscreen(false);
        container.classList.remove('whiteboard-fullscreen-mode');
        document.body.classList.remove('whiteboard-fullscreen-active');
        [0, 50, 150].forEach((ms) => {
          setTimeout(() => {
            try {
              excalidrawAPI?.refresh();
            } catch {}
          }, ms);
        });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreenRef.current) {
        toggleFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      container?.classList.remove('whiteboard-fullscreen-mode');
      document.body.classList.remove('whiteboard-fullscreen-active');
    };
  }, [containerRef, excalidrawAPI]);

  // Inject Fullscreen Toggle button into Excalidraw's toolbar
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;

    const syncFullscreenBtn = () => {
      const freedrawBtn = container.querySelector('[data-testid="toolbar-freedraw"]') as HTMLElement | null;
      const toolbarContainer = (freedrawBtn && freedrawBtn.parentElement) || container.querySelector('.App-toolbar');

      if (!toolbarContainer) return;

      let fsBtn = container.querySelector('.custom-fullscreen-tool-btn') as HTMLButtonElement | null;
      if (!fsBtn) {
        fsBtn = document.createElement('button');
        fsBtn.type = 'button';
        fsBtn.className = 'custom-fullscreen-tool-btn';
        fsBtn.addEventListener('pointerdown', (ev) => {
          ev.stopPropagation();
        });
        fsBtn.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          toggleFullscreen();
        });
        toolbarContainer.appendChild(fsBtn);
      } else if (fsBtn.parentElement !== toolbarContainer) {
        toolbarContainer.appendChild(fsBtn);
      }

      const isFs = isFullscreenRef.current;
      fsBtn.title = isFs ? 'Thu nhỏ màn hình (Esc)' : 'Toàn màn hình (Mở rộng)';
      fsBtn.setAttribute('aria-label', isFs ? 'Thu nhỏ màn hình' : 'Toàn màn hình');
      fsBtn.classList.toggle('active', isFs);

      fsBtn.innerHTML = `
        <div class="ToolIcon__icon">
          ${
            isFs
              ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                   <polyline points="4 14 10 14 10 20"/>
                   <polyline points="20 10 14 10 14 4"/>
                   <line x1="14" x2="21" y1="10" y2="3"/>
                   <line x1="10" x2="3" y1="14" y2="21"/>
                 </svg>`
              : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                   <polyline points="15 3 21 3 21 9"/>
                   <polyline points="9 21 3 21 3 15"/>
                   <line x1="21" x2="14" y1="3" y2="10"/>
                   <line x1="3" x2="10" y1="21" y2="14"/>
                 </svg>`
          }
        </div>
      `;
    };

    const scheduleSync = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        syncFullscreenBtn();
      });
    };

    const uiLayer = container.querySelector('.layer-ui__wrapper') || container;
    const observer = new MutationObserver(scheduleSync);
    observer.observe(uiLayer, { childList: true, subtree: true });

    syncFullscreenBtn();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [containerRef]);

  return {
    isFullscreen,
    toggleFullscreen,
  };
}
