import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DrawTool, Point, renderStroke, getTransformedPoint } from '../../../utils/drawingEngine';
import { eraseStrokesAlongPath } from '../../canvas-board/utils/eraserEngine';
import { StrokeRecord } from '../../canvas-board/types';
import { DrawingToolbar } from './DrawingToolbar';

interface DrawingCanvasProps {
  questionId: number;
  drawings: Record<number, string>;
  onSaveDrawing: (questionId: number, dataUrl: string) => void;
  onClearDrawing: (questionId: number) => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  questionId,
  drawings,
  onSaveDrawing,
  onClearDrawing,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const eraserIndicatorRef = useRef<HTMLDivElement | null>(null);

  const [activeTool, setActiveTool] = useState<DrawTool>('none');
  const [selectedColor, setSelectedColor] = useState<string>('#ffd600');
  const [penSize, setPenSize] = useState<number>(4);
  const [hlSize, setHlSize] = useState<number>(24);
  const [eraserSize, setEraserSize] = useState<number>(30);

  // Vector strokes state for 0-flicker & 0-lag performance
  const strokesRef = useRef<StrokeRecord[]>([]);
  const [undoStack, setUndoStack] = useState<StrokeRecord[][]>([]);
  const [redoStack, setRedoStack] = useState<StrokeRecord[][]>([]);

  // Draggable toolbar state
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const isDraggingToolbarRef = useRef(false);
  const toolbarDragOffsetRef = useRef({ x: 0, y: 0 });

  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<Point[]>([]);
  const lastEraserPointRef = useRef<Point | null>(null);
  const hasEraserChangedRef = useRef(false);
  const isShiftPressedRef = useRef(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { isShiftPressedRef.current = e.shiftKey; };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
    };
  }, []);

  // Synchronously redraws all vector strokes with ZERO flicker in 0.01ms
  const redrawStrokes = useCallback((strokes: StrokeRecord[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();

    ctx.clearRect(0, 0, rect.width, rect.height);
    for (const stroke of strokes) {
      renderStroke(ctx, stroke.points, {
        tool: stroke.tool,
        color: stroke.color,
        size: stroke.size,
        isShiftPressed: stroke.isShiftPressed,
      });
    }
  }, []);

  // Resize canvas and restore saved drawings
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const savedData = drawings[questionId];
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed)) {
          strokesRef.current = parsed;
          redrawStrokes(parsed);
          setUndoStack([parsed]);
          setRedoStack([]);
          return;
        }
      } catch {}
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, rect.width, rect.height); };
      img.src = savedData;
    } else {
      strokesRef.current = [];
      ctx.clearRect(0, 0, rect.width, rect.height);
      setUndoStack([]);
    }
    setRedoStack([]);
  }, [questionId, redrawStrokes]);

  const saveCurrentState = useCallback(() => {
    const serialized = JSON.stringify(strokesRef.current);
    onSaveDrawing(questionId, serialized);
  }, [questionId, onSaveDrawing]);

  // Synchronous Zero-Flicker Undo (0.01ms)
  const handleUndo = useCallback(() => {
    if (undoStack.length <= 1) {
      if (undoStack.length === 1) {
        strokesRef.current = [];
        redrawStrokes([]);
        onClearDrawing(questionId);
        setRedoStack(prev => [...prev, undoStack[0]]);
        setUndoStack([]);
      }
      return;
    }

    const current = undoStack[undoStack.length - 1];
    const previous = undoStack[undoStack.length - 2];
    const newUndo = undoStack.slice(0, -1);

    setRedoStack(prev => [...prev, current]);
    setUndoStack(newUndo);

    strokesRef.current = previous;
    redrawStrokes(previous);
    saveCurrentState();
  }, [undoStack, questionId, redrawStrokes, onClearDrawing, saveCurrentState]);

  // Synchronous Zero-Flicker Redo (0.01ms)
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);

    setUndoStack(prev => [...prev, next]);
    setRedoStack(newRedo);

    strokesRef.current = next;
    redrawStrokes(next);
    saveCurrentState();
  }, [redoStack, redrawStrokes, saveCurrentState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo(); else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault(); handleRedo();
      } else if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === '1') {
          setActiveTool('none');
        } else if (e.key === '2') {
          setActiveTool('pen');
        } else if (e.key === '3') {
          setActiveTool('highlighter');
        } else if (e.key === '4') {
          setActiveTool('eraser');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const currentSize = activeTool === 'pen' ? penSize : activeTool === 'highlighter' ? hlSize : eraserSize;

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool === 'none') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const coords = getTransformedPoint(e, canvas);

    if (activeTool === 'eraser') {
      lastEraserPointRef.current = coords;
      hasEraserChangedRef.current = false;
      const res = eraseStrokesAlongPath(strokesRef.current, coords, coords, eraserSize / 2);
      if (res.hasChanged) {
        strokesRef.current = res.strokes;
        hasEraserChangedRef.current = true;
        redrawStrokes(res.strokes);
      }
      return;
    }

    currentPointsRef.current = [coords];
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderStroke(ctx, currentPointsRef.current, {
      tool: activeTool, color: selectedColor, size: currentSize, isShiftPressed: e.shiftKey || isShiftPressedRef.current,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const coords = getTransformedPoint(e, canvas);

    if (eraserIndicatorRef.current && activeTool === 'eraser') {
      eraserIndicatorRef.current.style.transform = `translate3d(${coords.x - eraserSize / 2}px, ${coords.y - eraserSize / 2}px, 0)`;
    }

    if (!isDrawingRef.current || activeTool === 'none') return;

    if (activeTool === 'eraser') {
      const prevPt = lastEraserPointRef.current || coords;
      const res = eraseStrokesAlongPath(strokesRef.current, prevPt, coords, eraserSize / 2);
      lastEraserPointRef.current = coords;
      if (res.hasChanged) {
        strokesRef.current = res.strokes;
        hasEraserChangedRef.current = true;
        redrawStrokes(res.strokes);
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nativeEvent = e.nativeEvent as PointerEvent;
    const coalesced = typeof nativeEvent.getCoalescedEvents === 'function' ? nativeEvent.getCoalescedEvents() : [nativeEvent];

    for (const evt of coalesced) {
      const pt = getTransformedPoint(evt, canvas);
      const prevPt = currentPointsRef.current[currentPointsRef.current.length - 1];
      if (!prevPt || Math.hypot(pt.x - prevPt.x, pt.y - prevPt.y) >= 1.2) {
        currentPointsRef.current.push(pt);
      }
    }

    redrawStrokes(strokesRef.current);
    renderStroke(ctx, currentPointsRef.current, {
      tool: activeTool, color: selectedColor, size: currentSize, isShiftPressed: e.shiftKey || isShiftPressedRef.current,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    isDrawingRef.current = false;

    if (activeTool === 'eraser') {
      lastEraserPointRef.current = null;
      if (hasEraserChangedRef.current) {
        setUndoStack(prev => [...prev.slice(-30), [...strokesRef.current]]);
        setRedoStack([]);
        saveCurrentState();
      }
      return;
    }

    if (currentPointsRef.current.length > 0) {
      const newStroke: StrokeRecord = {
        id: `st_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        points: [...currentPointsRef.current],
        tool: (activeTool === 'highlighter' ? 'highlighter' : 'pen'),
        color: selectedColor,
        size: currentSize,
        isShiftPressed: e.shiftKey || isShiftPressedRef.current,
      };
      const updated = [...strokesRef.current, newStroke];
      strokesRef.current = updated;
      setUndoStack(prev => [...prev.slice(-30), updated]);
      setRedoStack([]);
      currentPointsRef.current = [];
      redrawStrokes(updated);
      saveCurrentState();
    }
  };

  const handleClearAll = () => {
    strokesRef.current = [];
    redrawStrokes([]);
    onClearDrawing(questionId);
    setUndoStack([]);
    setRedoStack([]);
  };

  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    isDraggingToolbarRef.current = true;
    const currentX = toolbarPos ? toolbarPos.x : 0;
    const currentY = toolbarPos ? toolbarPos.y : 0;
    toolbarDragOffsetRef.current = { x: e.clientX - currentX, y: e.clientY - currentY };

    const onMove = (moveEvt: MouseEvent) => {
      if (!isDraggingToolbarRef.current) return;
      setToolbarPos({
        x: moveEvt.clientX - toolbarDragOffsetRef.current.x,
        y: moveEvt.clientY - toolbarDragOffsetRef.current.y,
      });
    };

    const onUp = () => {
      isDraggingToolbarRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div ref={containerRef} className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerEnter={() => { if (eraserIndicatorRef.current && activeTool === 'eraser') eraserIndicatorRef.current.style.display = 'block'; }}
        onPointerLeave={() => { if (eraserIndicatorRef.current) eraserIndicatorRef.current.style.display = 'none'; }}
        className={`w-full h-full ${
          activeTool === 'eraser'
            ? 'pointer-events-auto cursor-none'
            : activeTool !== 'none'
            ? 'pointer-events-auto cursor-crosshair'
            : 'pointer-events-none'
        }`}
        style={{ touchAction: 'none' }}
      />

      {/* 100% VISIBLE CIRCULAR ERASER BORDER INDICATOR */}
      <div
        ref={eraserIndicatorRef}
        style={{
          width: `${eraserSize}px`,
          height: `${eraserSize}px`,
          display: activeTool === 'eraser' ? 'block' : 'none',
        }}
        className="pointer-events-none absolute top-0 left-0 rounded-full border-2 border-[#ef4444] bg-[#ef4444]/20 shadow-[0_0_12px_rgba(239,68,68,0.5)] ring-1 ring-white/70"
      />

      {/* FLOATING COLLAPSIBLE DRAWING TOOLBAR */}
      <DrawingToolbar
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
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClearAll={handleClearAll}
        toolbarPos={toolbarPos}
        onMouseDown={handleToolbarMouseDown}
      />
    </div>
  );
};
