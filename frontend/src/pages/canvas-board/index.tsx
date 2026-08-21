import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { Upload, RotateCcw, Download, Maximize2, Minimize2, Palette } from 'lucide-react';
import { showToast } from '../../components/Toast';
import { CanvasTool, Point, CanvasItemImage, SnapGuide, CropBox } from './types';
import { CanvasToolbar } from './components/CanvasToolbar';
import { CanvasBottomBar, GridType } from './components/CanvasBottomBar';
import { useCanvasViewport } from './hooks/useCanvasViewport';
import { hitTestImage, calculateAutoAlign, cropImageItem, HandleType } from './utils/imageTransform';
import { renderStroke, getTransformedPoint } from '../../utils/drawingEngine';

try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
} catch (e) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface StrokeRecord {
  points: Point[];
  tool: CanvasTool;
  color: string;
  size: number;
  isShiftPressed?: boolean;
}

interface HistorySnapshot {
  strokes: StrokeRecord[];
  images: CanvasItemImage[];
}

export default function CanvasBoardPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // File state
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [canvasImages, setCanvasImages] = useState<CanvasItemImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [docName, setDocName] = useState<string>('Bảng vẽ trắng (Canvas)');

  // Viewport Pan, Zoom & Navigation Hook
  const {
    zoom, setZoom, pan, setPan,
    isPanningRef, lastMousePosRef, isShiftPressedRef
  } = useCanvasViewport();

  const [gridType, setGridType] = useState<GridType>('lines');
  const [isAutoAlignEnabled, setIsAutoAlignEnabled] = useState(true);

  // Tool state
  const [activeTool, setActiveTool] = useState<CanvasTool>('pen');
  const [selectedColor, setSelectedColor] = useState<string>('#1a1a1a');
  const [penSize, setPenSize] = useState<number>(4);
  const [hlSize, setHlSize] = useState<number>(24);
  const [eraserSize, setEraserSize] = useState<number>(50);
  const [shapeSize, setShapeSize] = useState<number>(3);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Stroke history per page
  const [pageStrokes, setPageStrokes] = useState<Record<number, StrokeRecord[]>>({});
  const [undoStack, setUndoStack] = useState<HistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<HistorySnapshot[]>([]);

  // Active interaction refs
  const isDrawingRef = useRef(false);
  const isDraggingImageRef = useRef(false);
  const resizeHandleRef = useRef<HandleType>('none');
  const imageDragOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const activeSnapGuidesRef = useRef<SnapGuide[]>([]);
  const cropBoxRef = useRef<CropBox | null>(null);
  const currentStrokePointsRef = useRef<Point[]>([]);
  const [cursorPos, setCursorPos] = useState<Point>({ x: -100, y: -100 });

  // Fullscreen sync
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => setIsFullscreen(p => !p));
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Push state snapshot for Undo / Redo
  const pushHistorySnapshot = useCallback(() => {
    const snapshot: HistorySnapshot = {
      strokes: [...(pageStrokes[currentPage] || [])],
      images: [...canvasImages],
    };
    setUndoStack(prev => [...prev.slice(-30), snapshot]);
    setRedoStack([]);
  }, [pageStrokes, canvasImages, currentPage]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const currentSnap: HistorySnapshot = {
      strokes: [...(pageStrokes[currentPage] || [])],
      images: [...canvasImages],
    };
    const previous = undoStack[undoStack.length - 1];
    setRedoStack(r => [currentSnap, ...r]);
    setUndoStack(u => u.slice(0, -1));
    setPageStrokes(prev => ({ ...prev, [currentPage]: previous.strokes }));
    setCanvasImages(previous.images);
  }, [undoStack, pageStrokes, canvasImages, currentPage]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const [next, ...rest] = redoStack;
    const currentSnap: HistorySnapshot = {
      strokes: [...(pageStrokes[currentPage] || [])],
      images: [...canvasImages],
    };
    setUndoStack(u => [...u, currentSnap]);
    setRedoStack(rest);
    setPageStrokes(prev => ({ ...prev, [currentPage]: next.strokes }));
    setCanvasImages(next.images);
  }, [redoStack, pageStrokes, canvasImages, currentPage]);

  // Global Keyboard listener for Ctrl+Z & Ctrl+Y
  useEffect(() => {
    const handleKeyShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyShortcut);
    return () => window.removeEventListener('keydown', handleKeyShortcut);
  }, [handleUndo, handleRedo]);

  // Render PDF page to image object
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
            const newImgItem: CanvasItemImage = {
              id: 'pdf_page_' + currentPage,
              img,
              x: 50,
              y: 50,
              width: viewport.width / 2,
              height: viewport.height / 2,
            };
            setCanvasImages([newImgItem]);
            setSelectedImageId(newImgItem.id);
          };
          img.src = tempCanvas.toDataURL('image/png');
        }
      }
    });
    return () => { isCancelled = true; };
  }, [pdfDoc, currentPage]);

  const currentStrokes = pageStrokes[currentPage] || [];

  // Redraw Complete Canvas Viewport
  const redrawCanvas = useCallback(() => {
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

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff'; // PURE WHITE BACKGROUND
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.scale(dpr, dpr);
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // 1. Ruled Lines / Grid Pattern on White Canvas
    if (gridType !== 'none') {
      const worldLeft = -pan.x / zoom;
      const worldTop = -pan.y / zoom;
      const worldRight = (rect.width - pan.x) / zoom;
      const worldBottom = (rect.height - pan.y) / zoom;
      const gridSize = 36;
      const startX = Math.floor(worldLeft / gridSize) * gridSize;
      const endX = Math.ceil(worldRight / gridSize) * gridSize;
      const startY = Math.floor(worldTop / gridSize) * gridSize;
      const endY = Math.ceil(worldBottom / gridSize) * gridSize;

      ctx.save();
      if (gridType === 'dots') {
        ctx.fillStyle = '#94a3b8';
        for (let x = startX; x <= endX; x += gridSize) {
          for (let y = startY; y <= endY; y += gridSize) {
            ctx.beginPath();
            ctx.arc(x, y, 1.2 / zoom, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (gridType === 'grid') {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1 / zoom;
        ctx.beginPath();
        for (let x = startX; x <= endX; x += gridSize) { ctx.moveTo(x, startY); ctx.lineTo(x, endY); }
        for (let y = startY; y <= endY; y += gridSize) { ctx.moveTo(startX, y); ctx.lineTo(endX, y); }
        ctx.stroke();
      } else if (gridType === 'lines') {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.2 / zoom;
        ctx.beginPath();
        for (let y = startY; y <= endY; y += gridSize) {
          ctx.moveTo(startX, y);
          ctx.lineTo(endX, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Draw Images
    for (const item of canvasImages) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 15;
      ctx.drawImage(item.img, item.x, item.y, item.width, item.height);
      ctx.restore();

      if (item.id === selectedImageId) {
        ctx.save();
        ctx.strokeStyle = '#5c36f5';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([6 / zoom, 6 / zoom]);
        ctx.strokeRect(item.x - 2 / zoom, item.y - 2 / zoom, item.width + 4 / zoom, item.height + 4 / zoom);
        ctx.setLineDash([]);

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#5c36f5';
        const hs = 8 / zoom;
        const corners = [
          { x: item.x, y: item.y },
          { x: item.x + item.width, y: item.y },
          { x: item.x, y: item.y + item.height },
          { x: item.x + item.width, y: item.y + item.height },
        ];
        for (const c of corners) {
          ctx.fillRect(c.x - hs / 2, c.y - hs / 2, hs, hs);
          ctx.strokeRect(c.x - hs / 2, c.y - hs / 2, hs, hs);
        }
        ctx.restore();
      }
    }

    // 3. Draw Auto Align Magnetic Guides
    for (const guide of activeSnapGuidesRef.current) {
      ctx.save();
      ctx.strokeStyle = '#00b0ff';
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([4 / zoom, 4 / zoom]);
      ctx.beginPath();
      if (guide.type === 'vertical') {
        ctx.moveTo(guide.pos, guide.start);
        ctx.lineTo(guide.pos, guide.end);
      } else {
        ctx.moveTo(guide.start, guide.pos);
        ctx.lineTo(guide.end, guide.pos);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 4. Draw Saved Strokes
    for (const stroke of currentStrokes) {
      renderStroke(ctx, stroke.points, {
        tool: stroke.tool,
        color: stroke.color,
        size: stroke.size,
        isShiftPressed: stroke.isShiftPressed,
      });
    }

    // 5. Draw Active In-Progress Stroke
    if (isDrawingRef.current && currentStrokePointsRef.current.length > 0) {
      renderStroke(ctx, currentStrokePointsRef.current, {
        tool: activeTool,
        color: selectedColor,
        size: activeTool === 'pen' ? penSize : activeTool === 'highlighter' ? hlSize : activeTool === 'eraser' ? eraserSize : shapeSize,
        isShiftPressed: isShiftPressedRef.current,
      });
    }

    // 6. Draw Crop Box Overlay
    if (activeTool === 'crop' && cropBoxRef.current) {
      const cb = cropBoxRef.current;
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(-pan.x / zoom, -pan.y / zoom, rect.width / zoom, rect.height / zoom);
      ctx.clearRect(cb.x, cb.y, cb.width, cb.height);
      ctx.strokeStyle = '#ff9100';
      ctx.lineWidth = 2 / zoom;
      ctx.strokeRect(cb.x, cb.y, cb.width, cb.height);
      ctx.restore();
    }
  }, [pan, zoom, gridType, canvasImages, selectedImageId, currentStrokes, activeTool, selectedColor, penSize, hlSize, eraserSize, shapeSize]);

  useEffect(() => { redrawCanvas(); }, [redrawCanvas]);

  const handleFitDocument = useCallback(() => {
    const container = containerRef.current;
    if (!container || canvasImages.length === 0) {
      setZoom(1.0); setPan({ x: 100, y: 80 }); return;
    }
    const rect = container.getBoundingClientRect();
    const first = canvasImages[0];
    const scale = Math.min((rect.width - 80) / first.width, (rect.height - 80) / first.height, 1.5);
    setZoom(scale);
    setPan({ x: (rect.width - first.width * scale) / 2, y: (rect.height - first.height * scale) / 2 });
  }, [canvasImages, setZoom, setPan]);

  // Multiple File Import (PDF & Multiple Images)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    pushHistorySnapshot();
    const newItems: CanvasItemImage[] = [];

    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const loadedPdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          setPdfDoc(loadedPdf);
          setTotalPages(loadedPdf.numPages);
          setCurrentPage(1);
          setDocName(file.name);
          showToast(`Đã mở PDF: ${file.name} (${loadedPdf.numPages} trang)`, "success");
        } catch (err: any) {
          showToast("Lỗi mở PDF: " + err.message, "error");
        }
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const offsetX = 50 + (idx % 3) * 320;
              const offsetY = 50 + Math.floor(idx / 3) * 280;
              newItems.push({
                id: 'img_' + Date.now() + '_' + idx,
                img,
                x: offsetX,
                y: offsetY,
                width: Math.min(img.width, 600),
                height: (Math.min(img.width, 600) / img.width) * img.height,
                originalSrc: event.target?.result as string,
              });
              resolve();
            };
            img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
        });
      }
    }

    if (newItems.length > 0) {
      setCanvasImages(prev => [...prev, ...newItems]);
      setSelectedImageId(newItems[newItems.length - 1].id);
      setActiveTool('select');
      showToast(`Đã thêm ${newItems.length} ảnh vào canvas!`, "success");
    }
  };

  // Pointer down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.currentTarget.setPointerCapture(e.pointerId);

    // RIGHT CLICK (Button 2): PAN VIEWPORT FREELY
    if (e.button === 2) {
      isPanningRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // LEFT CLICK (Button 0)
    if (e.button === 0) {
      const worldPt = getTransformedPoint(e, canvas, pan, zoom);

      if (activeTool === 'select') {
        let clickedItem: CanvasItemImage | null = null;
        let handle: HandleType = 'none';

        if (selectedImageId) {
          const selected = canvasImages.find(i => i.id === selectedImageId);
          if (selected) {
            const hit = hitTestImage(worldPt, selected, 12 / zoom);
            if (hit.hit) { clickedItem = selected; handle = hit.handle; }
          }
        }

        if (!clickedItem) {
          for (let i = canvasImages.length - 1; i >= 0; i--) {
            const hit = hitTestImage(worldPt, canvasImages[i], 12 / zoom);
            if (hit.hit) { clickedItem = canvasImages[i]; handle = hit.handle; break; }
          }
        }

        if (clickedItem) {
          pushHistorySnapshot();
          setSelectedImageId(clickedItem.id);
          resizeHandleRef.current = handle;
          isDraggingImageRef.current = true;
          imageDragOffsetRef.current = { x: worldPt.x - clickedItem.x, y: worldPt.y - clickedItem.y };
        } else {
          setSelectedImageId(null);
        }
        redrawCanvas();
        return;
      }

      if (activeTool === 'crop') {
        cropBoxRef.current = { x: worldPt.x, y: worldPt.y, width: 0, height: 0 };
        isDrawingRef.current = true;
        return;
      }

      pushHistorySnapshot();
      isDrawingRef.current = true;
      currentStrokePointsRef.current = [worldPt];
      redrawCanvas();
    }
  };

  // Pointer move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setCursorPos({ x: e.clientX, y: e.clientY });

    // 1. Right Click Pan
    if (isPanningRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const worldPt = getTransformedPoint(e, canvas, pan, zoom);

    // 2. Drag / Resize Image
    if (isDraggingImageRef.current && selectedImageId) {
      setCanvasImages(prev => prev.map(item => {
        if (item.id !== selectedImageId) return item;
        let newX = item.x, newY = item.y, newW = item.width, newH = item.height;

        if (resizeHandleRef.current === 'inside') {
          let rawX = worldPt.x - imageDragOffsetRef.current.x;
          let rawY = worldPt.y - imageDragOffsetRef.current.y;
          if (isAutoAlignEnabled) {
            const snap = calculateAutoAlign({ x: rawX, y: rawY, width: item.width, height: item.height }, prev.filter(i => i.id !== selectedImageId));
            newX = snap.snappedX; newY = snap.snappedY; activeSnapGuidesRef.current = snap.guides;
          } else { newX = rawX; newY = rawY; }
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
      return;
    }

    if (activeTool === 'crop' && isDrawingRef.current && cropBoxRef.current) {
      cropBoxRef.current.width = worldPt.x - cropBoxRef.current.x;
      cropBoxRef.current.height = worldPt.y - cropBoxRef.current.y;
      redrawCanvas();
      return;
    }

    if (isDrawingRef.current && activeTool !== 'select') {
      const nativeEvent = e.nativeEvent as PointerEvent;
      const coalesced = typeof nativeEvent.getCoalescedEvents === 'function' ? nativeEvent.getCoalescedEvents() : [nativeEvent];
      for (const evt of coalesced) {
        currentStrokePointsRef.current.push(getTransformedPoint(evt, canvas, pan, zoom));
      }
      redrawCanvas();
    }
  };

  // Pointer up
  const handlePointerUp = async (e: React.PointerEvent<HTMLCanvasElement>) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    isPanningRef.current = false;
    activeSnapGuidesRef.current = [];

    if (isDraggingImageRef.current) {
      isDraggingImageRef.current = false;
      resizeHandleRef.current = 'none';
      redrawCanvas();
    }

    if (activeTool === 'crop' && isDrawingRef.current && cropBoxRef.current) {
      isDrawingRef.current = false;
      const cb = cropBoxRef.current;
      const normCb: CropBox = {
        x: Math.min(cb.x, cb.x + cb.width),
        y: Math.min(cb.y, cb.y + cb.height),
        width: Math.abs(cb.width),
        height: Math.abs(cb.height),
      };
      if (normCb.width > 20 && normCb.height > 20) {
        const targetImg = selectedImageId ? canvasImages.find(i => i.id === selectedImageId) : canvasImages[0];
        if (targetImg) {
          const cropped = await cropImageItem(targetImg, normCb);
          setCanvasImages(prev => prev.map(i => i.id === targetImg.id ? cropped : i));
          setSelectedImageId(cropped.id);
          showToast("Đã cắt ảnh thành công!", "success");
        }
      }
      cropBoxRef.current = null;
      setActiveTool('select');
      redrawCanvas();
      return;
    }

    if (isDrawingRef.current && activeTool !== 'select') {
      isDrawingRef.current = false;
      if (currentStrokePointsRef.current.length > 0) {
        const newStroke: StrokeRecord = {
          points: [...currentStrokePointsRef.current],
          tool: activeTool,
          color: selectedColor,
          size: activeTool === 'pen' ? penSize : activeTool === 'highlighter' ? hlSize : activeTool === 'eraser' ? eraserSize : shapeSize,
          isShiftPressed: isShiftPressedRef.current,
        };
        setPageStrokes(prev => ({ ...prev, [currentPage]: [...(prev[currentPage] || []), newStroke] }));
      }
      currentStrokePointsRef.current = [];
      redrawCanvas();
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const newZoom = Math.min(5.0, Math.max(0.15, zoom * zoomFactor));

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
    a.download = `Canvas_${docName.replace(/\.[^/.]+$/, "")}_Trang${currentPage}.png`;
    a.click();
    showToast("Đã tải ảnh xuất thành công!", "success");
  };

  const mainContent = (
    <div className={`h-full flex flex-col bg-[#070913] ${isFullscreen ? 'fixed inset-0 z-[99999] p-2' : 'p-6 space-y-4 overflow-hidden'}`}>
      {/* HEADER BAR */}
      <div className="flex items-center justify-between bg-[#0c0f1e] border border-[#1d2744] px-5 py-3 rounded-2xl shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Palette size={18} />
          </div>
          <div>
            <h1 className="text-sm font-black text-white flex items-center gap-2">
              <span>Canvas Bảng Vẽ Trắng</span>
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 font-bold">
                Scratchpad
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-semibold truncate max-w-sm">{docName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] text-white text-xs font-black transition cursor-pointer border border-white/20 shadow-sm">
            <Upload size={13} />
            <span>Mở Nhiều Ảnh / PDF</span>
            <input type="file" accept=".pdf,image/*" multiple onChange={handleFileUpload} className="hidden" />
          </label>

          <button onClick={() => { setPdfDoc(null); setCanvasImages([]); setSelectedImageId(null); setTotalPages(1); setCurrentPage(1); setDocName('Bảng vẽ trắng (Canvas)'); setPageStrokes({}); setUndoStack([]); setRedoStack([]); setZoom(1.0); setPan({ x: 100, y: 80 }); }} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition cursor-pointer">
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Bảng trắng mới</span>
          </button>

          <button onClick={handleExportPNG} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition cursor-pointer">
            <Download size={13} />
            <span className="hidden sm:inline">Tải ảnh</span>
          </button>

          <button onClick={toggleFullscreen} className="p-2 rounded-xl bg-[#121626] text-slate-300 hover:text-white border border-[#263152] transition cursor-pointer">
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* INFINITE DRAWING WORKSPACE */}
      <div className="flex-1 flex flex-col bg-[#ffffff] border border-[#1d2744] rounded-2xl overflow-hidden shadow-2xl relative select-none">
        <CanvasToolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          currentSize={activeTool === 'pen' ? penSize : activeTool === 'highlighter' ? hlSize : activeTool === 'eraser' ? eraserSize : shapeSize}
          penSize={penSize}
          setPenSize={setPenSize}
          hlSize={hlSize}
          setHlSize={setHlSize}
          eraserSize={eraserSize}
          setEraserSize={setEraserSize}
          setShapeSize={setShapeSize}
          undoStackLength={undoStack.length}
          redoStackLength={redoStack.length}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClearPage={() => {
            pushHistorySnapshot();
            setPageStrokes(prev => ({ ...prev, [currentPage]: [] }));
          }}
          isAutoAlignEnabled={isAutoAlignEnabled}
          setIsAutoAlignEnabled={setIsAutoAlignEnabled}
          hasSelectedImage={!!selectedImageId}
          onDeleteSelectedImage={() => {
            pushHistorySnapshot();
            setCanvasImages(prev => prev.filter(i => i.id !== selectedImageId));
            setSelectedImageId(null);
            showToast("Đã xóa ảnh được chọn!", "success");
          }}
        />

        {/* FULL VIEWPORT CANVAS CONTAINER */}
        <div ref={containerRef} className="flex-1 w-full h-full relative overflow-hidden bg-[#ffffff]">
          <canvas
            ref={canvasRef}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            className={`w-full h-full block ${
              activeTool === 'select' ? (isDraggingImageRef.current ? 'cursor-move' : 'cursor-default') : activeTool === 'eraser' ? 'cursor-none' : 'cursor-crosshair'
            }`}
            style={{ touchAction: 'none' }}
          />

          {/* Eraser Live Circular Indicator */}
          {activeTool === 'eraser' && cursorPos.x >= 0 && (
            <div
              className="pointer-events-none fixed rounded-full border-2 border-red-500 bg-red-400/20 shadow-sm z-50 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${cursorPos.x}px`,
                top: `${cursorPos.y}px`,
                width: `${eraserSize * zoom}px`,
                height: `${eraserSize * zoom}px`,
              }}
            />
          )}

          <CanvasBottomBar
            zoom={zoom}
            setZoom={setZoom}
            onResetZoom={() => { setZoom(1.0); setPan({ x: 100, y: 80 }); }}
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

  if (isFullscreen) {
    return ReactDOM.createPortal(mainContent, document.body);
  }

  return mainContent;
}
