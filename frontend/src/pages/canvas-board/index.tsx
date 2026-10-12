import React, { useState, useRef, useEffect, memo } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { useExcalidrawFileImporter } from './hooks/useExcalidrawFileImporter';
import { useSidebarStrokeSlider } from './hooks/useSidebarStrokeSlider';
import { UploadCloud } from 'lucide-react';

function CanvasBoardPage({ isActive = true }: { isActive?: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [excalidrawAPI, setExcalidrawAPI] = useState<any | null>(null);
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const { isImporting, processAndImportFiles } = useExcalidrawFileImporter(excalidrawAPI);

  // Sync stroke slider inside Excalidraw's left sidebar settings window
  useSidebarStrokeSlider({
    containerRef,
    excalidrawAPI,
    strokeWidth,
    setStrokeWidth,
  });

  // Intercept the native Image tool in Excalidraw's top toolbar to enable multi-file picker
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleToolbarClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Check if clicked element or its parent is the Image tool button
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

    // Also support hotkey '9' (default Excalidraw image shortcut)
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
      className="h-full w-full overflow-hidden flex flex-col relative bg-[#f8f9fa]"
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

      <Excalidraw
        excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
        theme="light"
        langCode="vi-VN"
        gridModeEnabled={false}
        zenModeEnabled={false}
        detectScroll={false}
        autoFocus={false}
        UIOptions={{
          canvasActions: {
            saveToActiveFile: false,
            loadScene: true,
            export: { saveFileToDisk: true },
            toggleTheme: true,
          },
        }}
      />
    </div>
  );
}

export default memo(CanvasBoardPage);
