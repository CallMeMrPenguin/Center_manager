import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { Upload, RotateCcw, Download, Maximize2, Minimize2, Palette } from 'lucide-react';
import { showToast } from '../../components/Toast';
import { CanvasTool, Point, CanvasItemImage, CanvasTextBox, SnapGuide, CropBox, StrokeRecord } from './types';
import { CanvasToolbar } from './components/CanvasToolbar';
import { CanvasBottomBar, GridType } from './components/CanvasBottomBar';
import { useCanvasViewport } from './hooks/useCanvasViewport';
import { hitTestImage, calculateAutoAlign, cropImageItem, HandleType } from './utils/imageTransform';
import { eraseStrokesAtPoint } from './utils/eraserEngine';
import { renderStroke, getTransformedPoint } from '../../utils/drawingEngine';

try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
} catch (e) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface HistorySnapshot {
  strokes: StrokeRecord[];
  images: CanvasItemImage[];
  textBoxes: CanvasTextBox[];
}

export default function CanvasBoardPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [canvasImages, setCanvasImages] = useState<CanvasItemImage[]>([]);
  const [canvasTextBoxes, setCanvasTextBoxes] = useState<CanvasTextBox[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'image' | 'text' | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [docName, setDocName] = useState<string>('Bảng vẽ trắng (Canvas)');

  const { zoom, setZoom, pan, setPan, isPanningRef, lastMousePosRef, isShiftPressedRef } = useCanvasViewport();

  const [gridType, setGridType] = useState<GridType>('grid'); // Default: Ô LY (Cả ngang & dọc)
  const [activeTool, setActiveTool] = useState<CanvasTool>('pen');
  const [selectedColor, setSelectedColor] = useState<string>('#ff3344'); // Mực đỏ mặc định
  const [selectedBgColor, setSelectedBgColor] = useState<string>('#ffffff'); // Nền trắng mặc định
  const [penSize, setPenSize] = useState<number>(4);
  const [hlSize, setHlSize] = useState<number>(24);
  const [eraserSize, setEraserSize] = useState<number>(50);
  const [shapeSize, setShapeSize] = useState<number>(3);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [pageStrokes, setPageStrokes] = useState<Record<number, StrokeRecord[]>>({});
  const [undoStack, setUndoStack] = useState<HistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<HistorySnapshot[]>([]);

  const isDrawingRef = useRef(false);
  const isDraggingItemRef = useRef(false);
  const resizeHandleRef = useRef<HandleType>('none');
  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const activeSnapGuidesRef = useRef<SnapGuide[]>([]);
  const cropBoxRef = useRef<CropBox | null>(null);
  const currentStrokePointsRef = useRef<Point[]>([]);
  const [cursorPos, setCursorPos] = useState<Point>({ x: -100, y: -100 });

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

  const pushHistorySnapshot = useCallback(() => {
    const snapshot: HistorySnapshot = {
      strokes: [...(pageStrokes[currentPage] || [])],
      images: [...canvasImages],
      textBoxes: [...canvasTextBoxes],
    };
    setUndoStack(prev => [...prev.slice(-30), snapshot]);
    setRedoStack([]);
  }, [pageStrokes, canvasImages, canvasTextBoxes, currentPage]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const currentSnap: HistorySnapshot = {
      strokes: [...(pageStrokes[currentPage] || [])],
      images: [...canvasImages],
      textBoxes: [...canvasTextBoxes],
    };
    const previous = undoStack[undoStack.length - 1];
    setRedoStack(r => [currentSnap, ...r]);
    setUndoStack(u => u.slice(0, -1));
    setPageStrokes(prev => ({ ...prev, [currentPage]: previous.strokes }));
    setCanvasImages(previous.images);
    setCanvasTextBoxes(previous.textBoxes);
  }, [undoStack, pageStrokes, canvasImages, canvasTextBoxes, currentPage]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const [next, ...rest] = redoStack;
    const currentSnap: HistorySnapshot = {
      strokes: [...(pageStrokes[currentPage] || [])],
      images: [...canvasImages],
      textBoxes: [...canvasTextBoxes],
    };
    setUndoStack(u => [...u, currentSnap]);
    setRedoStack(rest);
    setPageStrokes(prev => ({ ...prev, [currentPage]: next.strokes }));
    setCanvasImages(next.images);
    setCanvasTextBoxes(next.textBoxes);
  }, [redoStack, pageStrokes, canvasImages, canvasTextBoxes, currentPage]);

  // Delete key handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo(); else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault(); handleRedo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput && selectedId) {
        e.preventDefault();
        pushHistorySnapshot();
        if (selectedType === 'image') setCanvasImages(prev => prev.filter(i => i.id !== selectedId));
        else if (selectedType === 'text') setCanvasTextBoxes(prev => prev.filter(t => t.id !== selectedId));
        setSelectedId(null);
        setSelectedType(null);
        showToast("Đã xóa phần tử!", "success");
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleUndo, handleRedo, selectedId, selectedType, pushHistorySnapshot]);

  // PDF Loader
  useEffect(() => {
    if (!pdfDoc) return;
    let isCancelled = false;
    pdfDoc.getPage(currentPage).then(async (page: any) => {
      const viewport = page.getViewport({ scale: 2.0 });
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = viewport.width; tempCanvas.height = viewport.height;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!isCancelled) {
          const img = new Image();
          img.onload = () => {
            const newImgItem: CanvasItemImage = {
              id: 'pdf_page_' + currentPage,
              img, x: 50, y: 50, width: viewport.width / 2, height: viewport.height / 2,
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
  }, [pdfDoc, currentPage]);

  const currentStrokes = pageStrokes[currentPage] || [];

  // Redraw Canvas with Frustum Culling
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`; canvas.style.height = `${rect.height}px`;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.scale(dpr, dpr);
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Visible Viewport Bounds for Culling
    const vpLeft = -pan.x / zoom;
    const vpTop = -pan.y / zoom;
    const vpRight = (rect.width - pan.x) / zoom;
    const vpBottom = (rect.height - pan.y) / zoom;

    // 1. Grid (Ô ly có cả kẻ ngang và kẻ dọc)
    if (gridType !== 'none') {
      const gridSize = 44;
      const startX = Math.floor(vpLeft / gridSize) * gridSize;
      const endX = Math.ceil(vpRight / gridSize) * gridSize;
      const startY = Math.floor(vpTop / gridSize) * gridSize;
      const endY = Math.ceil(vpBottom / gridSize) * gridSize;

      ctx.save();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.3 / zoom;
      ctx.beginPath();
      for (let x = startX; x <= endX; x += gridSize) { ctx.moveTo(x, startY); ctx.lineTo(x, endY); }
      for (let y = startY; y <= endY; y += gridSize) { ctx.moveTo(startX, y); ctx.lineTo(endX, y); }
      ctx.stroke();
      ctx.restore();
    }

    // 2. Images with Frustum Culling
    for (const item of canvasImages) {
      if (item.x + item.width < vpLeft || item.x > vpRight || item.y + item.height < vpTop || item.y > vpBottom) continue;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 10;
      ctx.drawImage(item.img, item.x, item.y, item.width, item.height);
      ctx.restore();

      if (item.id === selectedId && selectedType === 'image') {
        ctx.save();
        ctx.strokeStyle = '#5c36f5'; ctx.lineWidth = 2 / zoom; ctx.setLineDash([6 / zoom, 6 / zoom]);
        ctx.strokeRect(item.x - 2 / zoom, item.y - 2 / zoom, item.width + 4 / zoom, item.height + 4 / zoom);
        ctx.setLineDash([]);
        ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#5c36f5';
        const hs = 8 / zoom;
        const corners = [{ x: item.x, y: item.y }, { x: item.x + item.width, y: item.y }, { x: item.x, y: item.y + item.height }, { x: item.x + item.width, y: item.y + item.height }];
        for (const c of corners) { ctx.fillRect(c.x - hs / 2, c.y - hs / 2, hs, hs); ctx.strokeRect(c.x - hs / 2, c.y - hs / 2, hs, hs); }
        ctx.restore();
      }
    }

    // 3. Text Boxes with Frustum Culling
    for (const tb of canvasTextBoxes) {
      if (tb.x + tb.width < vpLeft || tb.x > vpRight || tb.y + tb.height < vpTop || tb.y > vpBottom) continue;

      ctx.save();
      if (tb.bgColor !== 'transparent') {
        ctx.fillStyle = tb.bgColor; ctx.shadowColor = 'rgba(0,0,0,0.1)'; ctx.shadowBlur = 8;
        ctx.fillRect(tb.x, tb.y, tb.width, tb.height);
      }
      ctx.font = `${tb.fontSize}px "${tb.fontFamily}", serif`;
      ctx.fillStyle = tb.color;
      ctx.textBaseline = 'top';
      ctx.fillText(tb.text || 'Nhập chữ...', tb.x + 8, tb.y + 8);

      if (tb.id === selectedId && selectedType === 'text') {
        ctx.strokeStyle = '#5c36f5'; ctx.lineWidth = 1.5 / zoom; ctx.setLineDash([4 / zoom, 4 / zoom]);
        ctx.strokeRect(tb.x - 2 / zoom, tb.y - 2 / zoom, tb.width + 4 / zoom, tb.height + 4 / zoom);
      }
      ctx.restore();
    }

    // 4. Auto Align Guides with Gap Badges
    for (const guide of activeSnapGuidesRef.current) {
      ctx.save();
      ctx.strokeStyle = '#00b0ff'; ctx.lineWidth = 1.5 / zoom; ctx.setLineDash([4 / zoom, 4 / zoom]);
      ctx.beginPath();
      if (guide.type === 'vertical') { ctx.moveTo(guide.pos, guide.start); ctx.lineTo(guide.pos, guide.end); }
      else { ctx.moveTo(guide.start, guide.pos); ctx.lineTo(guide.end, guide.pos); }
      ctx.stroke();

      if (guide.gapText && guide.gapCenter) {
        ctx.setLineDash([]); ctx.fillStyle = '#00b0ff';
        ctx.font = `bold ${11 / zoom}px sans-serif`;
        ctx.fillText(guide.gapText, guide.gapCenter.x, guide.gapCenter.y);
      }
      ctx.restore();
    }

    // 5. Saved Strokes with Frustum Culling
    for (const stroke of currentStrokes) {
      renderStroke(ctx, stroke.points, { tool: stroke.tool, color: stroke.color, size: stroke.size, isShiftPressed: stroke.isShiftPressed });
    }

    // 6. In-Progress Stroke
    if (isDrawingRef.current && currentStrokePointsRef.current.length > 0 && activeTool !== 'eraser') {
      renderStroke(ctx, currentStrokePointsRef.current, {
        tool: activeTool, color: selectedColor, size: activeTool === 'pen' ? penSize : activeTool === 'highlighter' ? hlSize : shapeSize,
        isShiftPressed: isShiftPressedRef.current,
      });
    }

    // 7. Crop Overlay
    if (activeTool === 'crop' && cropBoxRef.current) {
      const cb = cropBoxRef.current;
      ctx.save(); ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(vpLeft, vpTop, rect.width / zoom, rect.height / zoom);
      ctx.clearRect(cb.x, cb.y, cb.width, cb.height);
      ctx.strokeStyle = '#ff9100'; ctx.lineWidth = 2 / zoom; ctx.strokeRect(cb.x, cb.y, cb.width, cb.height);
      ctx.restore();
    }
  }, [pan, zoom, gridType, canvasImages, canvasTextBoxes, selectedId, selectedType, currentStrokes, activeTool, selectedColor, penSize, hlSize, shapeSize]);

  useEffect(() => { redrawCanvas(); }, [redrawCanvas]);

  const handleFitDocument = useCallback(() => {
    const container = containerRef.current;
    if (!container || canvasImages.length === 0) { setZoom(1.0); setPan({ x: 100, y: 80 }); return; }
    const rect = container.getBoundingClientRect();
    const first = canvasImages[0];
    const scale = Math.min((rect.width - 80) / first.width, (rect.height - 80) / first.height, 1.5);
    setZoom(scale); setPan({ x: (rect.width - first.width * scale) / 2, y: (rect.height - first.height * scale) / 2 });
  }, [canvasImages, setZoom, setPan]);

  // Import handler (5 images per row)
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
          setPdfDoc(loadedPdf); setTotalPages(loadedPdf.numPages); setCurrentPage(1); setDocName(file.name);
          showToast(`Đã mở PDF: ${file.name} (${loadedPdf.numPages} trang)`, "success");
        } catch (err: any) { showToast("Lỗi mở PDF: " + err.message, "error"); }
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const col = idx % 5; const row = Math.floor(idx / 5); const imgW = 280;
              const imgH = (imgW / img.width) * img.height;
              newItems.push({
                id: 'img_' + Date.now() + '_' + idx, img,
                x: 50 + col * (imgW + 30), y: 50 + row * (imgH + 40),
                width: imgW, height: imgH, originalSrc: event.target?.result as string,
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
      setSelectedId(newItems[newItems.length - 1].id);
      setSelectedType('image');
      setActiveTool('select');
      showToast(`Đã thêm ${newItems.length} ảnh (5 ảnh/hàng)!`, "success");
    }
  };

  // Pointer Down
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

      // Insert Text Box Tool
      if (activeTool === 'text') {
        pushHistorySnapshot();
        const newTextBox: CanvasTextBox = {
          id: 'text_' + Date.now(),
          x: worldPt.x,
          y: worldPt.y,
          width: 180,
          height: 50,
          text: 'Văn bản...',
          color: selectedColor, // Mực đỏ mặc định
          bgColor: selectedBgColor, // Nền trắng mặc định
          fontSize: 20,
          fontFamily: 'Times New Roman',
        };
        setCanvasTextBoxes(prev => [...prev, newTextBox]);
        setSelectedId(newTextBox.id);
        setSelectedType('text');
        setEditingTextId(newTextBox.id);
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
            const hit = hitTestImage(worldPt, selected, 12 / zoom);
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
          // Check text boxes
          const clickedText = canvasTextBoxes.find(t =>
            worldPt.x >= t.x && worldPt.x <= t.x + t.width && worldPt.y >= t.y && worldPt.y <= t.y + t.height
          );
          if (clickedText) {
            pushHistorySnapshot();
            setSelectedId(clickedText.id);
            setSelectedType('text');
            isDraggingItemRef.current = true;
            dragOffsetRef.current = { x: worldPt.x - clickedText.x, y: worldPt.y - clickedText.y };
          } else {
            setSelectedId(null);
            setSelectedType(null);
          }
        }
        redrawCanvas();
        return;
      }

      if (activeTool === 'crop') {
        cropBoxRef.current = { x: worldPt.x, y: worldPt.y, width: 0, height: 0 };
        isDrawingRef.current = true;
        return;
      }

      if (activeTool === 'eraser') {
        isDrawingRef.current = true;
        pushHistorySnapshot();
        const { remainingStrokes, erasedCount } = eraseStrokesAtPoint(currentStrokes, worldPt, eraserSize / 2);
        if (erasedCount > 0) setPageStrokes(prev => ({ ...prev, [currentPage]: remainingStrokes }));
        return;
      }

      pushHistorySnapshot();
      isDrawingRef.current = true;
      currentStrokePointsRef.current = [worldPt];
      redrawCanvas();
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setCursorPos({ x: e.clientX, y: e.clientY });

    if (isPanningRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const worldPt = getTransformedPoint(e, canvas, pan, zoom);

    // Drag / Resize Image / Text
    if (isDraggingItemRef.current && selectedId) {
      if (selectedType === 'image') {
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
                  if (st.imageId === item.id || (st.points[0] && st.points[0].x >= item.x && st.points[0].x <= item.x + item.width && st.points[0].y >= item.y && st.points[0].y <= item.y + item.height)) {
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
      } else if (selectedType === 'text') {
        setCanvasTextBoxes(prev => prev.map(t => t.id === selectedId ? { ...t, x: worldPt.x - dragOffsetRef.current.x, y: worldPt.y - dragOffsetRef.current.y } : t));
      }
      return;
    }

    if (activeTool === 'crop' && isDrawingRef.current && cropBoxRef.current) {
      cropBoxRef.current.width = worldPt.x - cropBoxRef.current.x; cropBoxRef.current.height = worldPt.y - cropBoxRef.current.y; redrawCanvas(); return;
    }

    if (activeTool === 'eraser' && isDrawingRef.current) {
      const { remainingStrokes, erasedCount } = eraseStrokesAtPoint(currentStrokes, worldPt, eraserSize / 2);
      if (erasedCount > 0) setPageStrokes(prev => ({ ...prev, [currentPage]: remainingStrokes }));
      return;
    }

    if (isDrawingRef.current && activeTool !== 'select' && activeTool !== 'eraser') {
      const nativeEvent = e.nativeEvent as PointerEvent;
      const coalesced = typeof nativeEvent.getCoalescedEvents === 'function' ? nativeEvent.getCoalescedEvents() : [nativeEvent];
      for (const evt of coalesced) currentStrokePointsRef.current.push(getTransformedPoint(evt, canvas, pan, zoom));
      redrawCanvas();
    }
  };

  // Pointer Up
  const handlePointerUp = async (e: React.PointerEvent<HTMLCanvasElement>) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    isPanningRef.current = false; activeSnapGuidesRef.current = [];

    if (isDraggingItemRef.current) { isDraggingItemRef.current = false; resizeHandleRef.current = 'none'; redrawCanvas(); }

    if (activeTool === 'crop' && isDrawingRef.current && cropBoxRef.current) {
      isDrawingRef.current = false;
      const cb = cropBoxRef.current;
      const normCb: CropBox = { x: Math.min(cb.x, cb.x + cb.width), y: Math.min(cb.y, cb.y + cb.height), width: Math.abs(cb.width), height: Math.abs(cb.height) };
      if (normCb.width > 20 && normCb.height > 20) {
        const targetImg = selectedId && selectedType === 'image' ? canvasImages.find(i => i.id === selectedId) : canvasImages[0];
        if (targetImg) {
          const cropped = await cropImageItem(targetImg, normCb);
          setCanvasImages(prev => prev.map(i => i.id === targetImg.id ? cropped : i));
          setSelectedId(cropped.id); setSelectedType('image'); showToast("Đã cắt ảnh thành công!", "success");
        }
      }
      cropBoxRef.current = null; setActiveTool('select'); redrawCanvas(); return;
    }

    if (isDrawingRef.current && activeTool !== 'select' && activeTool !== 'eraser') {
      isDrawingRef.current = false;
      if (currentStrokePointsRef.current.length > 0) {
        const startPt = currentStrokePointsRef.current[0];
        const insideImg = canvasImages.find(img => startPt.x >= img.x && startPt.x <= img.x + img.width && startPt.y >= img.y && startPt.y <= img.y + img.height);
        const newStroke: StrokeRecord = {
          id: 'stroke_' + Date.now(), points: [...currentStrokePointsRef.current], tool: activeTool,
          color: selectedColor, size: activeTool === 'pen' ? penSize : activeTool === 'highlighter' ? hlSize : shapeSize,
          isShiftPressed: isShiftPressedRef.current, imageId: insideImg?.id,
        };
        setPageStrokes(prev => ({ ...prev, [currentPage]: [...(prev[currentPage] || []), newStroke] }));
      }
      currentStrokePointsRef.current = []; redrawCanvas();
    } else if (isDrawingRef.current) { isDrawingRef.current = false; }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const container = containerRef.current; if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top;
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const newZoom = Math.min(5.0, Math.max(0.15, zoom * zoomFactor));
    setPan({ x: mouseX - (mouseX - pan.x) * (newZoom / zoom), y: mouseY - (mouseY - pan.y) * (newZoom / zoom) });
    setZoom(newZoom);
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const a = document.createElement('a'); a.href = canvas.toDataURL('image/png');
    a.download = `Canvas_${docName.replace(/\.[^/.]+$/, "")}_Trang${currentPage}.png`; a.click();
    showToast("Đã tải ảnh xuất thành công!", "success");
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
            <input type="file" accept=".pdf,image/*" multiple onChange={handleFileUpload} className="hidden" />
          </label>
          <button onClick={() => { setPdfDoc(null); setCanvasImages([]); setCanvasTextBoxes([]); setSelectedId(null); setTotalPages(1); setCurrentPage(1); setDocName('Bảng vẽ trắng (Canvas)'); setPageStrokes({}); setUndoStack([]); setRedoStack([]); setZoom(1.0); setPan({ x: 100, y: 80 }); }} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition cursor-pointer">
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
          undoStackLength={undoStack.length} redoStackLength={redoStack.length} onUndo={handleUndo} onRedo={handleRedo}
          onClearPage={() => { pushHistorySnapshot(); setPageStrokes(prev => ({ ...prev, [currentPage]: [] })); }}
        />

        <div ref={containerRef} className="flex-1 w-full h-full relative overflow-hidden bg-[#ffffff]">
          <canvas
            ref={canvasRef}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            className={`w-full h-full block ${activeTool === 'select' ? (isDraggingItemRef.current ? 'cursor-move' : 'cursor-default') : activeTool === 'eraser' ? 'cursor-none' : 'cursor-crosshair'}`}
            style={{ touchAction: 'none' }}
          />

          {/* Inline Text Box Editing Overlay */}
          {editingTextId && (
            <div
              className="absolute z-40 bg-white border-2 border-[#5c36f5] rounded shadow-xl p-1"
              style={{
                left: `${(canvasTextBoxes.find(t => t.id === editingTextId)?.x || 0) * zoom + pan.x}px`,
                top: `${(canvasTextBoxes.find(t => t.id === editingTextId)?.y || 0) * zoom + pan.y}px`,
              }}
            >
              <textarea
                autoFocus
                defaultValue={canvasTextBoxes.find(t => t.id === editingTextId)?.text || ''}
                onBlur={(e) => {
                  setCanvasTextBoxes(prev => prev.map(t => t.id === editingTextId ? { ...t, text: e.target.value, width: Math.max(120, e.target.value.length * 12) } : t));
                  setEditingTextId(null);
                }}
                className="bg-transparent text-sm font-bold border-0 focus:outline-none resize-none font-serif"
                style={{ color: selectedColor, minWidth: '150px', minHeight: '40px' }}
              />
            </div>
          )}

          {/* Eraser Live Circular Indicator */}
          {activeTool === 'eraser' && cursorPos.x >= 0 && (
            <div
              className="pointer-events-none fixed rounded-full border-2 border-red-500 bg-red-400/20 shadow-sm z-50 transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px`, width: `${eraserSize * zoom}px`, height: `${eraserSize * zoom}px` }}
            />
          )}

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
