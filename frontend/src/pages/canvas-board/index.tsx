import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { Upload, RotateCcw, Download, Maximize2, Minimize2, Palette } from 'lucide-react';
import { showToast } from '../../components/Toast';
import { CanvasTool, Point, CanvasItemImage, CanvasTextBox, SnapGuide, CropBox, StrokeRecord } from './types';
import { CanvasToolbar } from './components/CanvasToolbar';
import { CanvasBottomBar, GridType } from './components/CanvasBottomBar';
import { CanvasTextBoxOverlay } from './components/CanvasTextBoxOverlay';
import { useCanvasViewport } from './hooks/useCanvasViewport';
import { useCanvasHistory } from './hooks/useCanvasHistory';
import { useCanvasImport } from './hooks/useCanvasImport';
import { renderCanvasFrame } from './utils/canvasRenderer';
import { hitTestImage, calculateAutoAlign, applyWordCrop, isStrokeFullyInsideImage, HandleType } from './utils/imageTransform';
import { eraseStrokesAlongPath } from './utils/eraserEngine';
import { getTransformedPoint } from '../../utils/drawingEngine';

try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
} catch {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export default function CanvasBoardPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const rafIdRef = useRef<number | null>(null);

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
  const [penSize, setPenSize] = useState<number>(4);
  const [hlSize, setHlSize] = useState<number>(24);
  const [eraserSize, setEraserSize] = useState<number>(50);
  const [shapeSize, setShapeSize] = useState<number>(3);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [pageStrokes, setPageStrokes] = useState<Record<number, StrokeRecord[]>>({});

  const isDrawingRef = useRef(false);
  const isDraggingItemRef = useRef(false);
  const resizeHandleRef = useRef<HandleType>('none');
  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const activeSnapGuidesRef = useRef<SnapGuide[]>([]);
  const currentStrokePointsRef = useRef<Point[]>([]);
  const lastEraserWorldPtRef = useRef<Point | null>(null);
  const hoverWorldPtRef = useRef<Point | null>(null);

  const {
    undoStackLength,
    redoStackLength,
    pushHistorySnapshot,
    handleUndo,
    handleRedo,
  } = useCanvasHistory({
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
  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => setIsFullscreen(p => !p));
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard shortcuts (Undo/Redo/Delete/Tools)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo(); else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput && selectedId) {
        e.preventDefault();
        pushHistorySnapshot();
        if (selectedType === 'image') {
          setCanvasImages(prev => prev.filter(i => i.id !== selectedId));
          setPageStrokes(prev => ({
            ...prev,
            [currentPage]: (prev[currentPage] || []).filter(st => st.imageId !== selectedId),
          }));
        } else if (selectedType === 'text') {
          setCanvasTextBoxes(prev => prev.filter(t => t.id !== selectedId));
        }
        setSelectedId(null);
        setSelectedType(null);
        showToast('Đã xóa phần tử!', 'success');
      } else if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === '1') setActiveTool('select');
        else if (e.key === '2') setActiveTool('pen');
        else if (e.key === '3') setActiveTool('highlighter');
        else if (e.key === '4') setActiveTool('eraser');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleUndo, handleRedo, selectedId, selectedType, pushHistorySnapshot, currentPage, setActiveTool]);

  // PDF Page Loader: centers page image in viewport
  useEffect(() => {
    if (!pdfDoc) return;
    let isCancelled = false;
    pdfDoc.getPage(currentPage).then(async (page: any) => {
      const viewport = page.getViewport({ scale: 2.0 });
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = viewport.width;
      tempCanvas.height = viewport.height;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!isCancelled) {
          const img = new Image();
          img.onload = () => {
            const center = getViewportCenterWorld();
            const w = viewport.width / 2;
            const h = viewport.height / 2;
            const newImgItem: CanvasItemImage = {
              id: 'pdf_page_' + currentPage,
              img,
              x: center.x - w / 2,
              y: center.y - h / 2,
              width: w,
              height: h,
            };
            setCanvasImages([newImgItem]);
            setSelectedId(newImgItem.id);
            setSelectedType('image');
          };
          img.src = tempCanvas.toDataURL('image/png');
        }
      }
    });
    return () => { isCancelled = true; };
  }, [pdfDoc, currentPage, getViewportCenterWorld]);

  const currentStrokes = pageStrokes[currentPage] || [];

  // Redraw Canvas (RAF throttled for 60 FPS performance)
  const redrawCanvas = useCallback(() => {
    if (rafIdRef.current) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      renderCanvasFrame({
        ctx,
        canvas,
        containerRect: rect,
        dpr,
        pan,
        zoom,
        gridType,
        canvasImages,
        selectedId,
        selectedType,
        isCroppingImageId,
        activeCropBox,
        currentStrokes,
        inProgressStroke: isDrawingRef.current && currentStrokePointsRef.current.length > 0 ? {
          points: currentStrokePointsRef.current,
          tool: activeTool,
          color: selectedColor,
          size: activeTool === 'pen' ? penSize : activeTool === 'highlighter' ? hlSize : shapeSize,
          isShiftPressed: isShiftPressedRef.current,
        } : null,
        activeSnapGuides: activeSnapGuidesRef.current,
        hoverWorldPt: hoverWorldPtRef.current,
        eraserSize,
        activeTool,
      });
    });
  }, [
    pan, zoom, gridType, canvasImages, selectedId, selectedType,
    isCroppingImageId, activeCropBox, currentStrokes, activeTool,
    selectedColor, penSize, hlSize, shapeSize, eraserSize,
  ]);

  useEffect(() => { redrawCanvas(); }, [redrawCanvas]);

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

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const worldPt = getTransformedPoint(e.nativeEvent as unknown as PointerEvent, canvas, pan, zoom);

    for (let i = canvasImages.length - 1; i >= 0; i--) {
      const img = canvasImages[i];
      if (worldPt.x >= img.x && worldPt.x <= img.x + img.width && worldPt.y >= img.y && worldPt.y <= img.y + img.height) {
        setIsCroppingImageId(img.id);
        setActiveCropBox({ x: img.x, y: img.y, width: img.width, height: img.height });
        setSelectedId(img.id);
        setSelectedType('image');
        showToast('Chế độ cắt ảnh: Kéo mép để cắt!', 'success');
        return;
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.currentTarget.setPointerCapture(e.pointerId);

    if (e.button === 2) {
      isPanningRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (e.button === 0) {
      const worldPt = getTransformedPoint(e, canvas, pan, zoom);

      if (activeTool === 'text') {
        pushHistorySnapshot();
        const newTextBox: CanvasTextBox = {
          id: 'text_' + Date.now(),
          x: worldPt.x,
          y: worldPt.y,
          width: 180,
          height: 46,
          text: '',
          color: selectedColor,
          bgColor: selectedBgColor,
          fontSize: 20,
          fontFamily: 'Times New Roman',
        };
        setCanvasTextBoxes(prev => [...prev, newTextBox]);
        setSelectedId(newTextBox.id);
        setSelectedType('text');
        setActiveTool('select');
        redrawCanvas();
        return;
      }

      if (activeTool === 'select') {
        let clickedImg: CanvasItemImage | null = null;
        let handle: HandleType = 'none';

        if (selectedId && selectedType === 'image') {
          const selected = canvasImages.find(i => i.id === selectedId);
          if (selected) {
            const hit = hitTestImage(worldPt, selected, 12 / zoom, isCroppingImageId === selected.id);
            if (hit.hit) { clickedImg = selected; handle = hit.handle; }
          }
        }

        if (!clickedImg) {
          for (let i = canvasImages.length - 1; i >= 0; i--) {
            const hit = hitTestImage(worldPt, canvasImages[i], 12 / zoom);
            if (hit.hit) { clickedImg = canvasImages[i]; handle = hit.handle; break; }
          }
        }

        if (clickedImg) {
          pushHistorySnapshot();
          setSelectedId(clickedImg.id);
          setSelectedType('image');
          resizeHandleRef.current = handle;
          isDraggingItemRef.current = true;
          dragOffsetRef.current = { x: worldPt.x - clickedImg.x, y: worldPt.y - clickedImg.y };
        } else {
          setSelectedId(null);
          setSelectedType(null);
          if (isCroppingImageId) {
            setIsCroppingImageId(null);
            setActiveCropBox(null);
          }
        }
        redrawCanvas();
        return;
      }

      if (activeTool === 'eraser') {
        isDrawingRef.current = true;
        pushHistorySnapshot();
        lastEraserWorldPtRef.current = worldPt;
        const res = eraseStrokesAlongPath(currentStrokes, worldPt, worldPt, eraserSize / 2);
        if (res.hasChanged) setPageStrokes(prev => ({ ...prev, [currentPage]: res.strokes }));
        redrawCanvas();
        return;
      }

      pushHistorySnapshot();
      isDrawingRef.current = true;
      currentStrokePointsRef.current = [worldPt];
      redrawCanvas();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isPanningRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const worldPt = getTransformedPoint(e, canvas, pan, zoom);
    hoverWorldPtRef.current = worldPt;

    if (isDraggingItemRef.current && selectedId && selectedType === 'image') {
      const targetImg = canvasImages.find(i => i.id === selectedId);
      if (!targetImg) return;

      if (isCroppingImageId === selectedId) {
        setActiveCropBox(prev => {
          const cb = prev || { x: targetImg.x, y: targetImg.y, width: targetImg.width, height: targetImg.height };
          let { x, y, width, height } = cb;
          if (resizeHandleRef.current === 'r' || resizeHandleRef.current === 'br') width = Math.max(30, worldPt.x - x);
          if (resizeHandleRef.current === 'b' || resizeHandleRef.current === 'br') height = Math.max(30, worldPt.y - y);
          if (resizeHandleRef.current === 'l' || resizeHandleRef.current === 'tl') { const r = x + width; x = Math.min(r - 30, worldPt.x); width = r - x; }
          if (resizeHandleRef.current === 't' || resizeHandleRef.current === 'tl') { const b = y + height; y = Math.min(b - 30, worldPt.y); height = b - y; }
          return { x, y, width, height };
        });
      } else {
        setCanvasImages(prev => prev.map(item => {
          if (item.id !== selectedId) return item;
          let newX = item.x, newY = item.y, newW = item.width, newH = item.height;

          if (resizeHandleRef.current === 'inside') {
            const rawX = worldPt.x - dragOffsetRef.current.x;
            const rawY = worldPt.y - dragOffsetRef.current.y;
            const snap = calculateAutoAlign({ x: rawX, y: rawY, width: item.width, height: item.height }, prev.filter(i => i.id !== selectedId));
            newX = snap.snappedX; newY = snap.snappedY; activeSnapGuidesRef.current = snap.guides;

            const moveDx = newX - item.x; const moveDy = newY - item.y;
            if (moveDx !== 0 || moveDy !== 0) {
              setPageStrokes(sPrev => ({
                ...sPrev,
                [currentPage]: (sPrev[currentPage] || []).map(st => {
                  if (st.imageId === item.id) return { ...st, points: st.points.map(p => ({ x: p.x + moveDx, y: p.y + moveDy })) };
                  if (!st.imageId && isStrokeFullyInsideImage(st, item)) {
                    return { ...st, imageId: item.id, points: st.points.map(p => ({ x: p.x + moveDx, y: p.y + moveDy })) };
                  }
                  return st;
                })
              }));
            }
          } else if (resizeHandleRef.current === 'br') {
            newW = Math.max(30, worldPt.x - item.x); newH = Math.max(30, worldPt.y - item.y);
          } else if (resizeHandleRef.current === 'bl') {
            const right = item.x + item.width; newX = Math.min(right - 30, worldPt.x); newW = right - newX; newH = Math.max(30, worldPt.y - item.y);
          } else if (resizeHandleRef.current === 'tr') {
            const bottom = item.y + item.height; newY = Math.min(bottom - 30, worldPt.y); newW = Math.max(30, worldPt.x - item.x); newH = bottom - newY;
          } else if (resizeHandleRef.current === 'tl') {
            const right = item.x + item.width; const bottom = item.y + item.height; newX = Math.min(right - 30, worldPt.x); newY = Math.min(bottom - 30, worldPt.y); newW = right - newX; newH = bottom - newY;
          }
          return { ...item, x: newX, y: newY, width: newW, height: newH };
        }));
      }
      return;
    }

    if (activeTool === 'eraser' && isDrawingRef.current) {
      const prevPt = lastEraserWorldPtRef.current || worldPt;
      const res = eraseStrokesAlongPath(currentStrokes, prevPt, worldPt, eraserSize / 2);
      lastEraserWorldPtRef.current = worldPt;
      if (res.hasChanged) setPageStrokes(prev => ({ ...prev, [currentPage]: res.strokes }));
      redrawCanvas();
      return;
    }

    if (isDrawingRef.current && activeTool !== 'select' && activeTool !== 'eraser') {
      const nativeEvent = e.nativeEvent as PointerEvent;
      const coalesced = typeof nativeEvent.getCoalescedEvents === 'function' ? nativeEvent.getCoalescedEvents() : [nativeEvent];
      const pts = currentStrokePointsRef.current;
      for (const evt of coalesced) {
        const pt = getTransformedPoint(evt, canvas, pan, zoom);
        const lastPt = pts[pts.length - 1];
        if (!lastPt || Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y) >= 0.5) {
          pts.push(pt);
        }
      }
      redrawCanvas();
    } else {
      redrawCanvas();
    }
  };

  const handlePointerUp = async (e: React.PointerEvent<HTMLCanvasElement>) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    isPanningRef.current = false; activeSnapGuidesRef.current = [];
    lastEraserWorldPtRef.current = null;

    if (isDraggingItemRef.current) {
      isDraggingItemRef.current = false;
      resizeHandleRef.current = 'none';
      if (isCroppingImageId && activeCropBox) {
        const target = canvasImages.find(i => i.id === isCroppingImageId);
        if (target) {
          const cropped = await applyWordCrop(target, activeCropBox);
          setCanvasImages(prev => prev.map(i => i.id === target.id ? cropped : i));
          setSelectedId(cropped.id);
        }
      }
      redrawCanvas();
    }

    if (isDrawingRef.current && activeTool !== 'select' && activeTool !== 'eraser') {
      isDrawingRef.current = false;
      if (currentStrokePointsRef.current.length > 0) {
        const tempStroke: StrokeRecord = {
          id: 'stroke_' + Date.now(),
          points: [...currentStrokePointsRef.current],
          tool: activeTool,
          color: selectedColor,
          size: activeTool === 'pen' ? penSize : activeTool === 'highlighter' ? hlSize : shapeSize,
          isShiftPressed: isShiftPressedRef.current,
        };
        const insideImg = canvasImages.find(img => isStrokeFullyInsideImage(tempStroke, img));
        if (insideImg) tempStroke.imageId = insideImg.id;
        setPageStrokes(prev => ({ ...prev, [currentPage]: [...(prev[currentPage] || []), tempStroke] }));
      }
      currentStrokePointsRef.current = [];
      redrawCanvas();
    } else if (isDrawingRef.current) {
      isDrawingRef.current = false;
    }
  };

  // High-performance smooth wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const newZoom = Math.min(30.0, Math.max(0.1, zoom * zoomFactor));
    setPan({
      x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
      y: mouseY - (mouseY - pan.y) * (newZoom / zoom),
    });
    setZoom(newZoom);
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `Canvas_${docName.replace(/\.[^/.]+$/, '')}_Trang${currentPage}.png`;
    a.click();
    showToast('Đã tải ảnh xuất thành công!', 'success');
  };

  // Drag and Drop files directly onto canvas
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      const canvas = canvasRef.current;
      const targetPos = canvas ? getTransformedPoint(e as unknown as React.PointerEvent<HTMLCanvasElement>, canvas, pan, zoom) : undefined;
      importFiles(files, targetPos);
    }
  };

  const mainContent = (
    <div className={`h-full flex flex-col bg-[#070913] ${isFullscreen ? 'fixed inset-0 z-[99999] p-2' : 'p-6 space-y-4 overflow-hidden'}`}>
      <div className="flex items-center justify-between bg-[#0c0f1e] border border-[#1d2744] px-5 py-3 rounded-2xl shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400"><Palette size={18} /></div>
          <div>
            <h1 className="text-sm font-black text-white flex items-center gap-2">
              <span>Canvas Bảng Vẽ Trắng</span>
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 font-bold">Scratchpad</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-semibold truncate max-w-sm">{docName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] text-white text-xs font-black transition cursor-pointer border border-white/20 shadow-sm">
            <Upload size={13} />
            <span>Import</span>
            <input ref={fileInputRef} type="file" accept=".pdf,image/*" multiple onChange={handleFileInputChange} className="hidden" />
          </label>
          <button
            onClick={() => {
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
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition cursor-pointer"
          >
            <RotateCcw size={13} /> <span className="hidden sm:inline">Bảng mới</span>
          </button>
          <button onClick={handleExportPNG} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition cursor-pointer">
            <Download size={13} /> <span className="hidden sm:inline">Tải ảnh</span>
          </button>
          <button onClick={toggleFullscreen} className="p-2 rounded-xl bg-[#121626] text-slate-300 hover:text-white border border-[#263152] transition cursor-pointer">
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#ffffff] border border-[#1d2744] rounded-2xl overflow-hidden shadow-2xl relative select-none">
        <CanvasToolbar
          activeTool={activeTool} setActiveTool={setActiveTool}
          selectedColor={selectedColor} setSelectedColor={setSelectedColor}
          selectedBgColor={selectedBgColor} setSelectedBgColor={setSelectedBgColor}
          currentSize={activeTool === 'pen' ? penSize : activeTool === 'highlighter' ? hlSize : activeTool === 'eraser' ? eraserSize : shapeSize}
          penSize={penSize} setPenSize={setPenSize} hlSize={hlSize} setHlSize={setHlSize} eraserSize={eraserSize} setEraserSize={setEraserSize} setShapeSize={setShapeSize}
          undoStackLength={undoStackLength} redoStackLength={redoStackLength} onUndo={handleUndo} onRedo={handleRedo}
          onClearPage={() => { pushHistorySnapshot(); setPageStrokes(prev => ({ ...prev, [currentPage]: [] })); }}
        />

        <div
          ref={containerRef}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
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
            onPointerLeave={() => { hoverWorldPtRef.current = null; redrawCanvas(); }}
            onWheel={handleWheel}
            className={`w-full h-full block ${activeTool === 'select' ? (isDraggingItemRef.current ? 'cursor-move' : 'cursor-default') : activeTool === 'eraser' ? 'cursor-none' : 'cursor-crosshair'}`}
            style={{ touchAction: 'none' }}
          />

          <CanvasTextBoxOverlay
            textBoxes={canvasTextBoxes}
            selectedId={selectedType === 'text' ? selectedId : null}
            onSelect={(id) => { setSelectedId(id); setSelectedType('text'); }}
            onUpdate={(updated) => setCanvasTextBoxes(prev => prev.map(t => t.id === updated.id ? updated : t))}
            zoom={zoom} pan={pan} activeTool={activeTool}
          />

          <CanvasBottomBar
            zoom={zoom} setZoom={setZoom} onResetZoom={() => { setZoom(1.0); setPan({ x: 100, y: 80 }); }}
            onFitDocument={handleFitDocument} gridType={gridType} setGridType={setGridType}
            currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );

  if (isFullscreen) return ReactDOM.createPortal(mainContent, document.body);
  return mainContent;
}
