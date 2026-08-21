import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Upload, FileText, RotateCcw, Download, Maximize2, Minimize2
} from 'lucide-react';
import { showToast } from '../../components/Toast';
import { CanvasTool, Point } from './types';
import { CanvasToolbar } from './components/CanvasToolbar';
import { CanvasBottomBar, GridType } from './components/CanvasBottomBar';
import { useCanvasViewport } from './hooks/useCanvasViewport';
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

export default function CanvasBoardPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // File state
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [pdfPageImage, setPdfPageImage] = useState<HTMLImageElement | null>(null);
  const [docName, setDocName] = useState<string>('Bảng vẽ vô hạn (Canvas)');

  // Viewport Pan, Zoom & Navigation Hook
  const {
    zoom, setZoom, pan, setPan,
    isPanningRef, isRightClickZoomingRef, rightClickStartRef,
    lastMousePosRef, isShiftPressedRef, isSpacePressedRef
  } = useCanvasViewport();

  const [gridType, setGridType] = useState<GridType>('dots');

  // Tool state
  const [activeTool, setActiveTool] = useState<CanvasTool>('pen');
  const [selectedColor, setSelectedColor] = useState<string>('#ffd600');
  const [penSize, setPenSize] = useState<number>(4);
  const [hlSize, setHlSize] = useState<number>(24);
  const [eraserSize, setEraserSize] = useState<number>(30);
  const [shapeSize, setShapeSize] = useState<number>(3);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Stroke history per page
  const [pageStrokes, setPageStrokes] = useState<Record<number, StrokeRecord[]>>({});
  const [redoStack, setRedoStack] = useState<StrokeRecord[][]>([]);

  const isDrawingRef = useRef(false);
  const currentStrokePointsRef = useRef<Point[]>([]);

  // Render PDF page to in-memory image
  useEffect(() => {
    if (!pdfDoc) {
      setPdfPageImage(null);
      return;
    }
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
          img.onload = () => setPdfPageImage(img);
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.scale(dpr, dpr);
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // 1. Draw Infinite Grid Pattern
    if (gridType !== 'none') {
      const worldLeft = -pan.x / zoom;
      const worldTop = -pan.y / zoom;
      const worldRight = (rect.width - pan.x) / zoom;
      const worldBottom = (rect.height - pan.y) / zoom;

      const gridSize = 40;
      const startX = Math.floor(worldLeft / gridSize) * gridSize;
      const endX = Math.ceil(worldRight / gridSize) * gridSize;
      const startY = Math.floor(worldTop / gridSize) * gridSize;
      const endY = Math.ceil(worldBottom / gridSize) * gridSize;

      ctx.save();
      if (gridType === 'dots') {
        ctx.fillStyle = '#263152';
        for (let x = startX; x <= endX; x += gridSize) {
          for (let y = startY; y <= endY; y += gridSize) {
            ctx.beginPath();
            ctx.arc(x, y, 1.2 / zoom, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (gridType === 'grid') {
        ctx.strokeStyle = '#182038';
        ctx.lineWidth = 1 / zoom;
        ctx.beginPath();
        for (let x = startX; x <= endX; x += gridSize) {
          ctx.moveTo(x, startY);
          ctx.lineTo(x, endY);
        }
        for (let y = startY; y <= endY; y += gridSize) {
          ctx.moveTo(startX, y);
          ctx.lineTo(endX, y);
        }
        ctx.stroke();
      } else if (gridType === 'lines') {
        ctx.strokeStyle = '#182038';
        ctx.lineWidth = 1 / zoom;
        ctx.beginPath();
        for (let y = startY; y <= endY; y += gridSize) {
          ctx.moveTo(startX, y);
          ctx.lineTo(endX, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Draw Document / Image Background
    const docImg = pdfPageImage || bgImage;
    if (docImg) {
      ctx.save();
      const docW = docImg.width / 2;
      const docH = docImg.height / 2;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 30;
      ctx.fillRect(0, 0, docW, docH);
      ctx.shadowBlur = 0;
      ctx.drawImage(docImg, 0, 0, docW, docH);
      ctx.restore();
    }

    // 3. Draw Saved Strokes for Current Page
    for (const stroke of currentStrokes) {
      renderStroke(ctx, stroke.points, {
        tool: stroke.tool,
        color: stroke.color,
        size: stroke.size,
        isShiftPressed: stroke.isShiftPressed,
      });
    }

    // 4. Draw Active In-Progress Stroke
    if (isDrawingRef.current && currentStrokePointsRef.current.length > 0) {
      renderStroke(ctx, currentStrokePointsRef.current, {
        tool: activeTool,
        color: selectedColor,
        size: activeTool === 'pen' ? penSize : activeTool === 'highlighter' ? hlSize : activeTool === 'eraser' ? eraserSize : shapeSize,
        isShiftPressed: isShiftPressedRef.current,
      });
    }
  }, [pan, zoom, gridType, pdfPageImage, bgImage, currentStrokes, activeTool, selectedColor, penSize, hlSize, eraserSize, shapeSize]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Center / Fit document
  const handleFitDocument = useCallback(() => {
    const container = containerRef.current;
    const docImg = pdfPageImage || bgImage;
    if (!container || !docImg) {
      setZoom(1.0);
      setPan({ x: 100, y: 80 });
      return;
    }
    const rect = container.getBoundingClientRect();
    const docW = docImg.width / 2;
    const docH = docImg.height / 2;
    const scale = Math.min((rect.width - 80) / docW, (rect.height - 80) / docH, 1.5);
    setZoom(scale);
    setPan({
      x: (rect.width - docW * scale) / 2,
      y: (rect.height - docH * scale) / 2,
    });
  }, [pdfPageImage, bgImage, setZoom, setPan]);

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPageStrokes({});
    setRedoStack([]);
    setDocName(file.name);

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadedPdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setPdfDoc(loadedPdf);
        setTotalPages(loadedPdf.numPages);
        setCurrentPage(1);
        setBgImage(null);
        showToast(`Đã mở PDF: ${file.name} (${loadedPdf.numPages} trang)`, "success");
      } catch (err: any) {
        showToast("Lỗi mở file PDF: " + err.message, "error");
      }
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setBgImage(img);
          setPdfDoc(null);
          setTotalPages(1);
          setCurrentPage(1);
          showToast(`Đã nạp ảnh: ${file.name}`, "success");
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (currentStrokes.length === 0) return;
    const last = currentStrokes[currentStrokes.length - 1];
    const newStrokes = currentStrokes.slice(0, -1);
    setRedoStack(r => [[last], ...r]);
    setPageStrokes(prev => ({ ...prev, [currentPage]: newStrokes }));
  }, [currentStrokes, currentPage]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const [nextStrokes, ...rest] = redoStack;
    setRedoStack(rest);
    setPageStrokes(prev => ({ ...prev, [currentPage]: [...(prev[currentPage] || []), ...nextStrokes] }));
  }, [redoStack, currentPage]);

  // Pointer interactions
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.currentTarget.setPointerCapture(e.pointerId);

    // Right Click (Button 2): Start Interactive Zoom Drag
    if (e.button === 2) {
      isRightClickZoomingRef.current = true;
      rightClickStartRef.current = { x: e.clientX, y: e.clientY, startZoom: zoom };
      return;
    }

    // Middle Click, Spacebar, or 'none' Tool: Start Pan
    if (e.button === 1 || isSpacePressedRef.current || activeTool === 'none') {
      isPanningRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Left Click: Start Drawing
    if (e.button === 0 && (activeTool as string) !== 'none') {
      isDrawingRef.current = true;
      const pt = getTransformedPoint(e, canvas, pan, zoom);
      currentStrokePointsRef.current = [pt];
      redrawCanvas();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Right Click Zooming Drag
    if (isRightClickZoomingRef.current && rightClickStartRef.current) {
      const dy = rightClickStartRef.current.y - e.clientY;
      const factor = Math.exp(dy * 0.008);
      const newZoom = Math.min(5.0, Math.max(0.15, rightClickStartRef.current.startZoom * factor));
      setZoom(newZoom);
      return;
    }

    // 2. Panning Drag
    if (isPanningRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // 3. Drawing
    if (isDrawingRef.current && activeTool !== 'none') {
      const nativeEvent = e.nativeEvent as PointerEvent;
      const coalesced = typeof nativeEvent.getCoalescedEvents === 'function' ? nativeEvent.getCoalescedEvents() : [nativeEvent];
      for (const evt of coalesced) {
        currentStrokePointsRef.current.push(getTransformedPoint(evt, canvas, pan, zoom));
      }
      redrawCanvas();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}

    if (isRightClickZoomingRef.current) {
      isRightClickZoomingRef.current = false;
      rightClickStartRef.current = null;
    }

    if (isPanningRef.current) {
      isPanningRef.current = false;
    }

    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      if (currentStrokePointsRef.current.length > 0) {
        const newStroke: StrokeRecord = {
          points: [...currentStrokePointsRef.current],
          tool: activeTool,
          color: selectedColor,
          size: activeTool === 'pen' ? penSize : activeTool === 'highlighter' ? hlSize : activeTool === 'eraser' ? eraserSize : shapeSize,
          isShiftPressed: isShiftPressedRef.current,
        };
        setPageStrokes(prev => ({
          ...prev,
          [currentPage]: [...(prev[currentPage] || []), newStroke]
        }));
        setRedoStack([]);
      }
      currentStrokePointsRef.current = [];
      redrawCanvas();
    }
  };

  // Mouse Wheel Zoom centered on cursor
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const newZoom = Math.min(5.0, Math.max(0.15, zoom * zoomFactor));

    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
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

  return (
    <div className={`h-full flex flex-col bg-[#070913] ${isFullscreen ? 'fixed inset-0 z-[99999] p-2' : 'p-6 space-y-4 overflow-hidden'}`}>
      {/* HEADER BAR */}
      <div className="flex items-center justify-between bg-[#0c0f1e] border border-[#1d2744] px-5 py-3 rounded-2xl shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <FileText size={18} />
          </div>
          <div>
            <h1 className="text-sm font-black text-white flex items-center gap-2">
              <span>Canvas Bảng Vẽ Vô Hạn</span>
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 font-bold">
                Scratchpad (Tự do / Không lưu DB)
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-semibold truncate max-w-sm">{docName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] text-white text-xs font-black transition cursor-pointer border border-white/20 shadow-sm">
            <Upload size={13} />
            <span>Mở PDF / Ảnh</span>
            <input type="file" accept=".pdf,image/*" onChange={handleFileUpload} className="hidden" />
          </label>

          <button onClick={() => { setPdfDoc(null); setBgImage(null); setTotalPages(1); setCurrentPage(1); setDocName('Bảng vẽ vô hạn (Canvas)'); setPageStrokes({}); setRedoStack([]); setZoom(1.0); setPan({ x: 0, y: 0 }); }} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition cursor-pointer">
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Bảng trắng</span>
          </button>

          <button onClick={handleExportPNG} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition cursor-pointer">
            <Download size={13} />
            <span className="hidden sm:inline">Tải ảnh</span>
          </button>

          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 rounded-xl bg-[#121626] text-slate-300 hover:text-white border border-[#263152] transition cursor-pointer">
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* INFINITE DRAWING WORKSPACE (NO BOX BORDER LIMIT) */}
      <div className="flex-1 flex flex-col bg-[#080a14] border border-[#1d2744] rounded-2xl overflow-hidden shadow-2xl relative select-none">
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
          undoStackLength={currentStrokes.length}
          redoStackLength={redoStack.length}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClearPage={() => {
            setPageStrokes(prev => ({ ...prev, [currentPage]: [] }));
            setRedoStack([]);
          }}
        />

        <div ref={containerRef} className="flex-1 w-full h-full relative overflow-hidden bg-[#070913]">
          <canvas
            ref={canvasRef}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            className={`w-full h-full block ${
              activeTool === 'none' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
            }`}
            style={{ touchAction: 'none' }}
          />

          <CanvasBottomBar
            zoom={zoom}
            setZoom={setZoom}
            onResetZoom={() => { setZoom(1.0); setPan({ x: 0, y: 0 }); }}
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
}
