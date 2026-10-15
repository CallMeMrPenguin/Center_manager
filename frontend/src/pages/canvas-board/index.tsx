import React, { useState, useRef, useEffect, memo } from 'react';
import { Excalidraw, MainMenu } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import './canvasBoardOverrides.css';
import { useExcalidrawFileImporter } from './hooks/useExcalidrawFileImporter';
import { useSidebarStrokeSlider } from './hooks/useSidebarStrokeSlider';
import { useImageStrokeBinder } from './hooks/useImageStrokeBinder';
import { useRightClickPan } from './hooks/useRightClickPan';
import { useUniformPenPressure } from './hooks/useUniformPenPressure';
import { useCustomEraser } from './hooks/useCustomEraser';
import { useWhiteboardUIAdjustments } from './hooks/useWhiteboardUIAdjustments';
import { EraserSizeBar } from './components/EraserSizeBar';
import { TextBoxPlacementPreview } from './components/TextBoxPlacementPreview';
import { RightClickPanIndicator } from './components/RightClickPanIndicator';
import { Point } from './types';
import { UploadCloud } from 'lucide-react';

function CanvasBoardPage({ isActive = true }: { isActive?: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [excalidrawAPI, setExcalidrawAPI] = useState<any | null>(null);
  const [strokeWidth, setStrokeWidth] = useState<number>(1.2);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Text tool placement preview state
  const [textPreviewPos, setTextPreviewPos] = useState<Point | null>(null);
  const [isTextToolActive, setIsTextToolActive] = useState<boolean>(false);
  const [isTypingText, setIsTypingText] = useState<boolean>(false);

  // File import (Natural name sorting & 2-column wrapping layout)
  const { isImporting, processAndImportFiles } = useExcalidrawFileImporter(excalidrawAPI);

  // Smooth stroke width slider in left sidebar (supports ultra-fine down to 0.2px)
  useSidebarStrokeSlider({
    containerRef,
    excalidrawAPI,
    strokeWidth,
    setStrokeWidth,
  });

  // Bind strokes drawn over images so they move together
  useImageStrokeBinder({
    containerRef,
    excalidrawAPI,
  });

  // Hold right-click to pan freely & suppress context menu
  const { isPanning } = useRightClickPan({
    containerRef,
    excalidrawAPI,
  });

  // Uniform pen pressure (removes velocity distortion) and enforces Architect default (roughness 0)
  useUniformPenPressure({
    containerRef,
    excalidrawAPI,
  });

  // Partial vector eraser ported from legacy canvas with adjustable size
  const { eraserSize, setEraserSize, cursorPos, isEraserActive } = useCustomEraser({
    containerRef,
    excalidrawAPI,
  });

  // Tool customization panel toggle, big paint brush highlighter, style button & UI cleanups
  useWhiteboardUIAdjustments({
    containerRef,
    excalidrawAPI,
    eraserSize,
    setEraserSize,
    strokeWidth,
  });

  // Force Excalidraw canvas bounding rect refresh on tab active / resize to prevent coordinate shift
  useEffect(() => {
    if (isActive && excalidrawAPI) {
      const timer = setTimeout(() => {
        try {
          excalidrawAPI.refresh();
        } catch {
          // Ignore if unmounted
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isActive, excalidrawAPI]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !excalidrawAPI) return;

    const ro = new ResizeObserver(() => {
      try {
        excalidrawAPI.refresh();
      } catch {
        // Ignore if unmounted
      }
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, [excalidrawAPI]);

  // Track cursor position for Text Box placement preview
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !excalidrawAPI) return;

    const handlePointerMove = (e: PointerEvent) => {
      const appState = excalidrawAPI.getAppState();
      const isText = appState.activeTool?.type === 'text';
      setIsTextToolActive(isText);

      if (isText) {
        const isWysiwygActive = !!container.querySelector('.excalidraw-wysiwyg');
        setIsTypingText(isWysiwygActive);

        if (!isWysiwygActive) {
          const rect = container.getBoundingClientRect();
          setTextPreviewPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
        } else {
          setTextPreviewPos(null);
        }
      } else {
        setTextPreviewPos(null);
        setIsTypingText(false);
      }
    };

    container.addEventListener('pointermove', handlePointerMove, true);
    return () => {
      container.removeEventListener('pointermove', handlePointerMove, true);
    };
  }, [containerRef, excalidrawAPI]);

  // Intercept the native Image tool in Excalidraw's top toolbar to enable multi-file picker
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleToolbarClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const imageBtn = target.closest(
        '[data-testid="toolbar-image"], [data-testid="image"], input[value="image"], label[title*="Ảnh"], label[title*="Image"], button[aria-label*="Image"]'
      );

      if (imageBtn) {
        e.preventDefault();
        e.stopPropagation();
        fileInputRef.current?.click();
      }
    };

    container.addEventListener('click', handleToolbarClick, true);

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === '9' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('click', handleToolbarClick, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Global paste handler to intercept image/PDF screenshots or clipboard files
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || []);
      const files: File[] = [];
      for (const item of items) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        processAndImportFiles(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processAndImportFiles]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAndImportFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processAndImportFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="canvas-board-wrapper hide-properties-panel h-full w-full overflow-hidden flex flex-col relative bg-[#f8f9fa]"
      style={{
        contain: 'strict',
        isolation: 'isolate',
        transform: 'translateZ(0)',
        contentVisibility: isActive ? 'visible' : 'hidden',
        pointerEvents: isActive ? 'auto' : 'none',
      }}
    >
      {/* Hidden Multi-file input (supports multiple images & PDFs at once) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-blue-600/10 border-3 border-dashed border-blue-500 rounded-2xl flex flex-col items-center justify-center pointer-events-none text-blue-700 dark:text-blue-300">
          <UploadCloud size={48} className="animate-bounce mb-2 stroke-[2.2]" />
          <span className="text-base font-black">
            Thả các tệp ảnh hoặc PDF vào đây
          </span>
          <span className="text-xs font-semibold opacity-80 mt-1">
            Hỗ trợ nhập cùng lúc nhiều ảnh và trích xuất mọi trang PDF
          </span>
        </div>
      )}

      {/* Loading indicator when processing large batches */}
      {isImporting && (
        <div className="absolute top-4 right-4 z-50 bg-white/95 dark:bg-[#0c0f1e]/95 border border-slate-200 dark:border-[#212c4b] shadow-xl px-4 py-2.5 rounded-2xl flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Đang xử lý và chèn tệp ảnh / PDF...
          </span>
        </div>
      )}

      {/* Floating Eraser Size Toolbar (Always accessible when eraser is active) */}
      <EraserSizeBar
        isVisible={isEraserActive}
        size={eraserSize}
        onSizeChange={setEraserSize}
      />

      {/* Text Box Placement Preview Tooltip */}
      <TextBoxPlacementPreview
        isVisible={isTextToolActive && !isTypingText}
        pos={textPreviewPos}
      />

      {/* Right-click Pan Active indicator & bottom hint */}
      <RightClickPanIndicator isPanning={isPanning} />

      {/* Custom Partial Vector Eraser visual circular cursor (Red Circle only) */}
      {isEraserActive && cursorPos && (
        <div
          className="custom-eraser-circular-cursor"
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            width: eraserSize,
            height: eraserSize,
          }}
        />
      )}

      <Excalidraw
        excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
        theme="light"
        langCode="vi-VN"
        gridModeEnabled={false}
        zenModeEnabled={false}
        detectScroll={true}
        autoFocus={false}
        initialData={{
          appState: {
            activeTool: {
              type: 'freedraw',
              customType: null,
              locked: true,
              lastActiveTool: null,
            } as any,
            currentItemRoughness: 0,
            currentItemStrokeWidth: 1.2,
          },
        }}
        UIOptions={{
          canvasActions: {
            saveToActiveFile: false,
            loadScene: true,
            export: { saveFileToDisk: true },
            toggleTheme: true,
          },
        }}
      >
        <MainMenu>
          <MainMenu.DefaultItems.LoadScene />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.DefaultItems.ToggleTheme />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
        </MainMenu>
      </Excalidraw>
    </div>
  );
}

export default memo(CanvasBoardPage);

