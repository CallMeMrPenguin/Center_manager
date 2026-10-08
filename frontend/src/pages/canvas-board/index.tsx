import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { showToast } from '../../components/Toast';
import { CanvasTool, Point, CanvasItemImage, CanvasTextBox, SnapGuide, CropBox, StrokeRecord } from './types';
import { HandleType } from './utils/imageTransform';
import { CanvasToolbar } from './components/CanvasToolbar';
import { CanvasBottomBar, GridType } from './components/CanvasBottomBar';
import { CanvasTextBoxOverlay } from './components/CanvasTextBoxOverlay';
import { useCanvasViewport } from './hooks/useCanvasViewport';
import { useCanvasHistory } from './hooks/useCanvasHistory';
import { useCanvasImport } from './hooks/useCanvasImport';
import { useCanvasPointerInteraction } from './hooks/useCanvasPointerInteraction';
import { useCanvasShortcuts } from './hooks/useCanvasShortcuts';
import { useCanvasPdfLoader } from './hooks/useCanvasPdfLoader';
import { useCanvasRedraw } from './hooks/useCanvasRedraw';
import { getTransformedPoint } from '../../utils/drawingEngine';
import { formatExportTimestamp } from '../../utils';

try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
} catch {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export default function CanvasBoardPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [canvasImages, setCanvasImages] = useState<CanvasItemImage[]>([]);
  const [canvasTextBoxes, setCanvasTextBoxes] = useState<CanvasTextBox[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'image' | 'text' | null>(null);
  const [isCroppingImageId, setIsCroppingImageId] = useState<string | null>(null);
  const [activeCropBox, setActiveCropBox] = useState<CropBox | null>(null);
  const [docName, setDocName] = useState<string>('Bảng vẽ trắng (Canvas)');

  const { zoom, setZoom, pan, setPan, isPanningRef, lastMousePosRef, isShiftPressedRef } = useCanvasViewport();

  const [gridType, setGridType] = useState<GridType>('grid');
  const [activeTool, setActiveTool] = useState<CanvasTool>('pen');
  const [selectedColor, setSelectedColor] = useState<string>('#ff3344');
  const [selectedBgColor, setSelectedBgColor] = useState<string>('#ffffff');
  const [selectedFontFamily, setSelectedFontFamily] = useState<string>('"Times New Roman", Times, serif');
  const [textSize, setTextSize] = useState<number>(20);
  const [penSize, setPenSize] = useState<number>(4);
  const [hlSize, setHlSize] = useState<number>(24);
  const [eraserSize, setEraserSize] = useState<number>(50);
  const [shapeSize, setShapeSize] = useState<number>(3);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [pageStrokes, setPageStrokes] = useState<Record<number, StrokeRecord[]>>({});
  const pageStrokesRef = useRef<Record<number, StrokeRecord[]>>(pageStrokes);
  pageStrokesRef.current = pageStrokes;

  const isDrawingRef = useRef(false);
  const isDraggingItemRef = useRef(false);
  const resizeHandleRef = useRef<HandleType>('none');
  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const activeSnapGuidesRef = useRef<SnapGuide[]>([]);
  const currentStrokePointsRef = useRef<Point[]>([]);
  const lastEraserWorldPtRef = useRef<Point | null>(null);
  const hoverWorldPtRef = useRef<Point | null>(null);

  const { undoStackLength, redoStackLength, pushHistorySnapshot, handleUndo, handleRedo } = useCanvasHistory({
    currentPage,
    pageStrokes,
    setPageStrokes,
    canvasImages,
    setCanvasImages,
    canvasTextBoxes,
    setCanvasTextBoxes,
  });

  const { importFiles, handleFileInputChange, getViewportCenterWorld } = useCanvasImport({
    containerRef,
    canvasRef,
    pan,
    zoom,
    canvasImages,
    setCanvasImages,
    setSelectedId,
    setSelectedType,
    setActiveTool,
    setPdfDoc,
    setTotalPages,
    setCurrentPage,
    setDocName,
    pushHistorySnapshot,
  });

  // Fullscreen sync
  const isCanvasFullscreenRef = useRef(false);
  useEffect(() => {
    const handleFs = () => {
      if (!document.fullscreenElement) {
        isCanvasFullscreenRef.current = false;
        setIsFullscreen(false);
      } else if (isCanvasFullscreenRef.current) {
        setIsFullscreen(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFs);
    document.addEventListener('webkitfullscreenchange', handleFs);
    return () => {
      document.removeEventListener('fullscreenchange', handleFs);
      document.removeEventListener('webkitfullscreenchange', handleFs);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      isCanvasFullscreenRef.current = true;
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
        isCanvasFullscreenRef.current = false;
        setIsFullscreen((p) => !p);
      });
    } else {
      isCanvasFullscreenRef.current = false;
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useCanvasShortcuts({
    handleUndo,
    handleRedo,
    selectedId,
    selectedType,
    setSelectedId,
    setSelectedType,
    pushHistorySnapshot,
    currentPage,
    setActiveTool,
    setCanvasImages,
    setPageStrokes,
    setCanvasTextBoxes,
  });

  useCanvasPdfLoader({
    pdfDoc,
    currentPage,
    getViewportCenterWorld,
    setCanvasImages,
    setSelectedId,
    setSelectedType,
  });

  const { redrawCanvas } = useCanvasRedraw({
    canvasRef,
    containerRef,
    pan,
    zoom,
    gridType,
    canvasImages,
    selectedId,
    selectedType,
    isCroppingImageId,
    activeCropBox,
    currentPage,
    pageStrokesRef,
    isDrawingRef,
    currentStrokePointsRef,
    activeTool,
    selectedColor,
    penSize,
    hlSize,
    shapeSize,
    isShiftPressedRef,
    activeSnapGuidesRef,
    hoverWorldPtRef,
    eraserSize,
  });

  const { handleDoubleClick, handlePointerDown, handlePointerMove, handlePointerUp, handleWheel } =
    useCanvasPointerInteraction({
      canvasRef,
      containerRef,
      pan,
      setPan,
      zoom,
      setZoom,
      activeTool,
      setActiveTool,
      selectedColor,
      selectedBgColor,
      selectedFontFamily,
      textSize,
      penSize,
      hlSize,
      eraserSize,
      shapeSize,
      canvasImages,
      setCanvasImages,
      canvasTextBoxes,
      setCanvasTextBoxes,
      selectedId,
      setSelectedId,
      selectedType,
      setSelectedType,
      isCroppingImageId,
      setIsCroppingImageId,
      activeCropBox,
      setActiveCropBox,
      currentPage,
      pageStrokesRef,
      setPageStrokes,
      isPanningRef,
      lastMousePosRef,
      isShiftPressedRef,
      isDrawingRef,
      isDraggingItemRef,
      resizeHandleRef,
      dragOffsetRef,
      activeSnapGuidesRef,
      currentStrokePointsRef,
      lastEraserWorldPtRef,
      hoverWorldPtRef,
      pushHistorySnapshot,
      redrawCanvas,
    });

  const handleFitDocument = useCallback(() => {
    const container = containerRef.current;
    if (!container || canvasImages.length === 0) {
      setZoom(1.0);
      setPan({ x: 100, y: 80 });
      return;
    }
    const rect = container.getBoundingClientRect();
    const first = canvasImages[0];
    const scale = Math.min((rect.width - 80) / first.width, (rect.height - 80) / first.height, 1.5);
    setZoom(scale);
    setPan({ x: (rect.width - first.width * scale) / 2, y: (rect.height - first.height * scale) / 2 });
  }, [canvasImages, setZoom, setPan]);

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `Canvas_${docName.replace(/\.[^/.]+$/, '')}_Trang${currentPage}_${formatExportTimestamp()}.png`;
    a.click();
    showToast('Đã tải ảnh xuất thành công', 'success');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      const canvas = canvasRef.current;
      const targetPos = canvas ? getTransformedPoint(e as unknown as React.PointerEvent<HTMLCanvasElement>, canvas, pan, zoom) : undefined;
      importFiles(files, targetPos);
    }
  };

  const handleNewBoard = () => {
    setPdfDoc(null);
    setCanvasImages([]);
    setCanvasTextBoxes([]);
    setSelectedId(null);
    setTotalPages(1);
    setCurrentPage(1);
    setDocName('Bảng vẽ trắng (Canvas)');
    setPageStrokes({});
    setZoom(1.0);
    setPan({ x: 100, y: 80 });
  };

  const mainContent = (
    <div className={`h-full flex flex-col bg-[#f1f5f9] dark:bg-[#070913] ${isFullscreen ? 'fixed inset-0 z-[99999] p-0' : 'p-3 sm:p-4 overflow-hidden'}`}>
      <div className="flex-1 flex flex-col bg-white dark:bg-[#0c0f1e] rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 dark:border-white/10 relative select-none">
        <CanvasToolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          selectedBgColor={selectedBgColor}
          setSelectedBgColor={setSelectedBgColor}
          selectedFontFamily={selectedFontFamily}
          setSelectedFontFamily={setSelectedFontFamily}
          textSize={textSize}
          setTextSize={setTextSize}
          currentSize={activeTool === 'pen' ? penSize : activeTool === 'highlighter' ? hlSize : activeTool === 'eraser' ? eraserSize : activeTool === 'text' ? textSize : shapeSize}
          penSize={penSize}
          setPenSize={setPenSize}
          hlSize={hlSize}
          setHlSize={setHlSize}
          eraserSize={eraserSize}
          setEraserSize={setEraserSize}
          setShapeSize={setShapeSize}
          undoStackLength={undoStackLength}
          redoStackLength={redoStackLength}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClearPage={() => {
            pushHistorySnapshot();
            setPageStrokes((prev) => ({ ...prev, [currentPage]: [] }));
          }}
          fileInputRef={fileInputRef}
          handleFileInputChange={handleFileInputChange}
          onNewBoard={handleNewBoard}
          onExportPNG={handleExportPNG}
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
        />

        <div
          ref={containerRef}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={handleDrop}
          className="flex-1 w-full h-full relative overflow-hidden bg-[#ffffff]"
        >
          <canvas
            ref={canvasRef}
            onContextMenu={(e) => e.preventDefault()}
            onDoubleClick={handleDoubleClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={() => {
              hoverWorldPtRef.current = null;
              redrawCanvas();
            }}
            onWheel={handleWheel}
            className={`w-full h-full block ${activeTool === 'select' ? (isDraggingItemRef.current ? 'cursor-move' : 'cursor-default') : activeTool === 'eraser' ? 'cursor-none' : 'cursor-crosshair'}`}
            style={{ touchAction: 'none' }}
          />

          <CanvasTextBoxOverlay
            textBoxes={canvasTextBoxes}
            selectedId={selectedType === 'text' ? selectedId : null}
            onSelect={(id) => {
              setSelectedId(id);
              setSelectedType('text');
            }}
            onUpdate={(updated) => setCanvasTextBoxes((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))}
            onDelete={(id) => {
              pushHistorySnapshot();
              setCanvasTextBoxes((prev) => prev.filter((t) => t.id !== id));
              if (selectedId === id) {
                setSelectedId(null);
                setSelectedType(null);
              }
            }}
            zoom={zoom}
            pan={pan}
            activeTool={activeTool}
          />

          <CanvasBottomBar
            zoom={zoom}
            setZoom={setZoom}
            onResetZoom={() => {
              setZoom(1.0);
              setPan({ x: 100, y: 80 });
            }}
            onFitDocument={handleFitDocument}
            gridType={gridType}
            setGridType={setGridType}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );

  if (isFullscreen) return ReactDOM.createPortal(mainContent, document.body);
  return mainContent;
}
