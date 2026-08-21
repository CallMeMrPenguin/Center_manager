import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Upload, FileText, RotateCcw, Download, ChevronLeft, ChevronRight, Maximize2, Minimize2
} from 'lucide-react';
import { showToast } from '../../components/Toast';
import { CanvasTool, Point } from './types';
import { CanvasToolbar } from './components/CanvasToolbar';

// Configure PDFjs worker for Vite
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
} catch (e) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export default function CanvasBoardPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // File state
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [docName, setDocName] = useState<string>('Bảng vẽ trống');

  // Tool state
  const [activeTool, setActiveTool] = useState<CanvasTool>('pen');
  const [selectedColor, setSelectedColor] = useState<string>('#ffd600');
  const [penSize, setPenSize] = useState<number>(4);
  const [hlSize, setHlSize] = useState<number>(24);
  const [eraserSize, setEraserSize] = useState<number>(30);
  const [shapeSize, setShapeSize] = useState<number>(3);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Per-page drawings store (Scratchpad in-memory)
  const [pageDrawings, setPageDrawings] = useState<Record<number, string>>({});
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  const isDrawingRef = useRef(false);
  const pointsRef = useRef<Point[]>([]);
  const startSnapshotRef = useRef<ImageData | null>(null);
  const startPointRef = useRef<Point>({ x: 0, y: 0 });

  const [canvasDimensions, setCanvasDimensions] = useState({ width: 900, height: 600 });

  // Render PDF Page or Image onto Background Canvas
  const renderBackground = useCallback(async () => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    const ctx = bgCanvas.getContext('2d');
    if (!ctx) return;

    if (pdfDoc) {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale: 1.5 });
        bgCanvas.width = viewport.width;
        bgCanvas.height = viewport.height;
        setCanvasDimensions({ width: viewport.width, height: viewport.height });

        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (err: any) {
        showToast("Lỗi hiển thị trang PDF: " + err.message, "error");
      }
    } else if (bgImage) {
      bgCanvas.width = bgImage.width;
      bgCanvas.height = bgImage.height;
      setCanvasDimensions({ width: bgImage.width, height: bgImage.height });
      ctx.drawImage(bgImage, 0, 0);
    } else {
      bgCanvas.width = 960;
      bgCanvas.height = 640;
      setCanvasDimensions({ width: 960, height: 640 });
      ctx.fillStyle = '#0f1322';
      ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    }
  }, [pdfDoc, currentPage, bgImage]);

  // Synchronize Drawing Canvas & restore annotations
  useEffect(() => {
    renderBackground().then(() => {
      const drawCanvas = drawCanvasRef.current;
      if (!drawCanvas) return;
      drawCanvas.width = canvasDimensions.width;
      drawCanvas.height = canvasDimensions.height;

      const ctx = drawCanvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

      const saved = pageDrawings[currentPage];
      if (saved) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = saved;
        setUndoStack([saved]);
      } else {
        setUndoStack([]);
      }
      setRedoStack([]);
    });
  }, [renderBackground, currentPage, canvasDimensions.width, canvasDimensions.height]);

  const saveDrawing = useCallback(() => {
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    const dataUrl = drawCanvas.toDataURL('image/png');
    setPageDrawings(prev => ({ ...prev, [currentPage]: dataUrl }));
    setUndoStack(prev => [...prev.slice(-25), dataUrl]);
    setRedoStack([]);
  }, [currentPage]);

  // Handle PDF / Image file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPageDrawings({});
    setUndoStack([]);
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
        showToast(`Đã mở file PDF: ${file.name} (${loadedPdf.numPages} trang)`, "success");
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
    if (undoStack.length <= 1) {
      if (undoStack.length === 1) {
        const drawCanvas = drawCanvasRef.current;
        if (!drawCanvas) return;
        const ctx = drawCanvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        setRedoStack(prev => [...prev, undoStack[0]]);
        setUndoStack([]);
        setPageDrawings(prev => {
          const c = { ...prev };
          delete c[currentPage];
          return c;
        });
      }
      return;
    }

    const current = undoStack[undoStack.length - 1];
    const previous = undoStack[undoStack.length - 2];
    setRedoStack(prev => [...prev, current]);
    setUndoStack(prev => prev.slice(0, -1));

    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    const ctx = drawCanvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      setPageDrawings(prev => ({ ...prev, [currentPage]: previous }));
    };
    img.src = previous;
  }, [undoStack, currentPage]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, next]);
    setRedoStack(prev => prev.slice(0, -1));

    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    const ctx = drawCanvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      setPageDrawings(prev => ({ ...prev, [currentPage]: next }));
    };
    img.src = next;
  }, [redoStack, currentPage]);

  // Keyboard shortcut for Undo (Ctrl+Z) & Redo (Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement> | PointerEvent) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const currentSize = activeTool === 'pen' ? penSize : activeTool === 'highlighter' ? hlSize : activeTool === 'eraser' ? eraserSize : shapeSize;

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool === 'none') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const coords = getCoordinates(e);
    startPointRef.current = coords;
    pointsRef.current = [coords];

    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    startSnapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (activeTool === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = selectedColor;
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, penSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, eraserSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || activeTool === 'none') return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    const nativeEvent = e.nativeEvent as PointerEvent;
    const coalesced = typeof nativeEvent.getCoalescedEvents === 'function' ? nativeEvent.getCoalescedEvents() : [nativeEvent];

    for (const evt of coalesced) {
      pointsRef.current.push(getCoordinates(evt));
    }

    const pts = pointsRef.current;
    if (pts.length < 2) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (activeTool === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = penSize;
      ctx.globalAlpha = 1.0;

      const p1 = pts[pts.length - 2];
      const p2 = pts[pts.length - 1];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      ctx.stroke();
    } else if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = eraserSize;

      const p1 = pts[pts.length - 2];
      const p2 = pts[pts.length - 1];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      ctx.stroke();
    } else if (activeTool === 'highlighter') {
      if (startSnapshotRef.current) ctx.putImageData(startSnapshotRef.current, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = hlSize;
      ctx.globalAlpha = 0.35;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const xc = (pts[i].x + pts[i + 1].x) / 2;
        const yc = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    } else if (['line', 'arrow', 'rect', 'circle'].includes(activeTool)) {
      if (startSnapshotRef.current) ctx.putImageData(startSnapshotRef.current, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = selectedColor;
      ctx.fillStyle = selectedColor;
      ctx.lineWidth = shapeSize;
      ctx.globalAlpha = 1.0;

      const s = startPointRef.current;
      ctx.beginPath();
      if (activeTool === 'line') {
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      } else if (activeTool === 'rect') {
        ctx.strokeRect(s.x, s.y, coords.x - s.x, coords.y - s.y);
      } else if (activeTool === 'circle') {
        const radius = Math.hypot(coords.x - s.x, coords.y - s.y);
        ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (activeTool === 'arrow') {
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        const angle = Math.atan2(coords.y - s.y, coords.x - s.x);
        const headlen = Math.max(12, shapeSize * 3);
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        ctx.lineTo(coords.x - headlen * Math.cos(angle - Math.PI / 6), coords.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(coords.x - headlen * Math.cos(angle + Math.PI / 6), coords.y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    isDrawingRef.current = false;
    pointsRef.current = [];
    startSnapshotRef.current = null;
    saveDrawing();
  };

  const handleExportPNG = () => {
    const bgCanvas = bgCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!bgCanvas || !drawCanvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = bgCanvas.width;
    exportCanvas.height = bgCanvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(bgCanvas, 0, 0);
    ctx.drawImage(drawCanvas, 0, 0);

    const a = document.createElement('a');
    a.href = exportCanvas.toDataURL('image/png');
    a.download = `Canvas_${docName.replace(/\.[^/.]+$/, "")}_Trang${currentPage}.png`;
    a.click();
    showToast("Đã tải ảnh xuất thành công!", "success");
  };

  return (
    <div className={`h-full flex flex-col bg-[#070913] ${isFullscreen ? 'fixed inset-0 z-[99999] p-4' : 'p-6 space-y-4 overflow-hidden'}`}>
      {/* HEADER BAR */}
      <div className="flex items-center justify-between bg-[#0c0f1e] border border-[#1d2744] px-5 py-3 rounded-2xl shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <FileText size={18} />
          </div>
          <div>
            <h1 className="text-sm font-black text-white flex items-center gap-2">
              <span>Bảng Vẽ Tự Do & Chú Thích PDF</span>
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 font-bold">
                Scratchpad (Không lưu DB)
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-semibold truncate max-w-sm">{docName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 bg-[#070913] border border-white/10 px-2.5 py-1 rounded-xl">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer">
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-mono font-bold text-white px-1">Trang {currentPage} / {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer">
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] text-white text-xs font-black transition cursor-pointer border border-white/20 shadow-sm">
            <Upload size={13} />
            <span>Mở PDF / Ảnh</span>
            <input type="file" accept=".pdf,image/*" onChange={handleFileUpload} className="hidden" />
          </label>

          <button onClick={() => { setPdfDoc(null); setBgImage(null); setTotalPages(1); setCurrentPage(1); setDocName('Bảng vẽ trống'); setPageDrawings({}); setUndoStack([]); setRedoStack([]); }} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition cursor-pointer">
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

      {/* DRAWING WORKSPACE */}
      <div className="flex-1 flex flex-col bg-[#0c0f1e] border border-[#1d2744] rounded-2xl overflow-hidden shadow-2xl relative">
        <CanvasToolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          currentSize={currentSize}
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
            const drawCanvas = drawCanvasRef.current;
            if (!drawCanvas) return;
            const ctx = drawCanvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
            setPageDrawings(prev => { const c = { ...prev }; delete c[currentPage]; return c; });
            setUndoStack([]);
            setRedoStack([]);
          }}
        />

        <div ref={containerRef} className="flex-1 overflow-auto p-4 flex items-center justify-center relative bg-[#070913]/90">
          <div className="relative shadow-2xl border border-white/10 rounded-xl overflow-hidden" style={{ width: `${canvasDimensions.width}px`, height: `${canvasDimensions.height}px` }}>
            <canvas ref={bgCanvasRef} className="absolute inset-0 block" />
            <canvas
              ref={drawCanvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`absolute inset-0 block ${activeTool !== 'none' ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
              style={{ touchAction: 'none' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
