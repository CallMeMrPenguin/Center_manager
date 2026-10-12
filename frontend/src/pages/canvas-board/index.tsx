import React, { useState, useRef, useEffect, memo } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { useExcalidrawFileImporter } from './hooks/useExcalidrawFileImporter';
import { CanvasStrokeWidthBar } from './components/CanvasStrokeWidthBar';
import { useSidebarStrokeSlider } from './hooks/useSidebarStrokeSlider';
import { UploadCloud } from 'lucide-react';

function CanvasBoardPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [excalidrawAPI, setExcalidrawAPI] = useState<any | null>(null);
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [opacity, setOpacity] = useState<number>(100);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const { isImporting, processAndImportFiles } = useExcalidrawFileImporter(excalidrawAPI);

  // Sync stroke slider with Excalidraw left sidebar
  useSidebarStrokeSlider({
    containerRef,
    excalidrawAPI,
    strokeWidth,
    setStrokeWidth,
  });

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
      }}
    >
      {/* Top Floating Control Bar: Multi-file Import & Stroke width slider like opacity */}
      <div className="absolute top-3 right-4 z-20 pointer-events-auto">
        <CanvasStrokeWidthBar
          excalidrawAPI={excalidrawAPI}
          strokeWidth={strokeWidth}
          setStrokeWidth={setStrokeWidth}
          opacity={opacity}
          setOpacity={setOpacity}
          isImporting={isImporting}
          onImportFiles={processAndImportFiles}
        />
      </div>

      {/* Drag & Drop Overlay */}
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

      <Excalidraw
        excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
        theme="light"
        langCode="vi-VN"
        gridModeEnabled={false}
        zenModeEnabled={false}
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
