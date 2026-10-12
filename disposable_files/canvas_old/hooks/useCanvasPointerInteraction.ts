import React, { useRef } from 'react';
import { CanvasTool, Point, CanvasItemImage, CanvasTextBox, SnapGuide, CropBox, StrokeRecord } from '../types';
import { getTransformedPoint } from '../../../utils/drawingEngine';
import { hitTestImage, calculateAutoAlign, applyWordCrop, isStrokeFullyInsideImage, HandleType } from '../utils/imageTransform';
import { eraseStrokesAlongPath } from '../utils/eraserEngine';
import { showToast } from '../../../components/Toast';

interface UseCanvasPointerInteractionProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  pan: Point;
  setPan: React.Dispatch<React.SetStateAction<Point>>;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  activeTool: CanvasTool;
  setActiveTool: (tool: CanvasTool) => void;
  selectedColor: string;
  selectedBgColor: string;
  selectedFontFamily: string;
  textSize: number;
  penSize: number;
  hlSize: number;
  eraserSize: number;
  shapeSize: number;
  canvasImages: CanvasItemImage[];
  setCanvasImages: React.Dispatch<React.SetStateAction<CanvasItemImage[]>>;
  canvasTextBoxes: CanvasTextBox[];
  setCanvasTextBoxes: React.Dispatch<React.SetStateAction<CanvasTextBox[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selectedType: 'image' | 'text' | null;
  setSelectedType: (type: 'image' | 'text' | null) => void;
  isCroppingImageId: string | null;
  setIsCroppingImageId: (id: string | null) => void;
  activeCropBox: CropBox | null;
  setActiveCropBox: React.Dispatch<React.SetStateAction<CropBox | null>>;
  currentPage: number;
  pageStrokesRef: React.MutableRefObject<Record<number, StrokeRecord[]>>;
  setPageStrokes: React.Dispatch<React.SetStateAction<Record<number, StrokeRecord[]>>>;
  isPanningRef: React.MutableRefObject<boolean>;
  lastMousePosRef: React.MutableRefObject<Point>;
  isShiftPressedRef: React.MutableRefObject<boolean>;
  isDrawingRef: React.MutableRefObject<boolean>;
  isDraggingItemRef: React.MutableRefObject<boolean>;
  resizeHandleRef: React.MutableRefObject<HandleType>;
  dragOffsetRef: React.MutableRefObject<Point>;
  activeSnapGuidesRef: React.MutableRefObject<SnapGuide[]>;
  currentStrokePointsRef: React.MutableRefObject<Point[]>;
  lastEraserWorldPtRef: React.MutableRefObject<Point | null>;
  hoverWorldPtRef: React.MutableRefObject<Point | null>;
  pushHistorySnapshot: () => void;
  redrawCanvas: () => void;
}

export function useCanvasPointerInteraction({
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
}: UseCanvasPointerInteractionProps) {
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
        showToast('Chế độ cắt ảnh: Kéo mép để cắt', 'success');
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
          fontSize: textSize,
          fontFamily: selectedFontFamily,
        };
        setCanvasTextBoxes((prev) => [...prev, newTextBox]);
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
          const selected = canvasImages.find((i) => i.id === selectedId);
          if (selected) {
            const hit = hitTestImage(worldPt, selected, 12 / zoom, isCroppingImageId === selected.id);
            if (hit.hit) {
              clickedImg = selected;
              handle = hit.handle;
            }
          }
        }

        if (!clickedImg) {
          for (let i = canvasImages.length - 1; i >= 0; i--) {
            const hit = hitTestImage(worldPt, canvasImages[i], 12 / zoom);
            if (hit.hit) {
              clickedImg = canvasImages[i];
              handle = hit.handle;
              break;
            }
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
        const strokes = pageStrokesRef.current[currentPage] || [];
        const res = eraseStrokesAlongPath(strokes, worldPt, worldPt, eraserSize / 2);
        if (res.hasChanged) setPageStrokes((prev) => ({ ...prev, [currentPage]: res.strokes }));
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
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const worldPt = getTransformedPoint(e, canvas, pan, zoom);
    hoverWorldPtRef.current = worldPt;

    if (isDraggingItemRef.current && selectedId && selectedType === 'image') {
      const targetImg = canvasImages.find((i) => i.id === selectedId);
      if (!targetImg) return;

      if (isCroppingImageId === selectedId) {
        setActiveCropBox((prev) => {
          const cb = prev || { x: targetImg.x, y: targetImg.y, width: targetImg.width, height: targetImg.height };
          let { x, y, width, height } = cb;
          if (resizeHandleRef.current === 'r' || resizeHandleRef.current === 'br') width = Math.max(30, worldPt.x - x);
          if (resizeHandleRef.current === 'b' || resizeHandleRef.current === 'br') height = Math.max(30, worldPt.y - y);
          if (resizeHandleRef.current === 'l' || resizeHandleRef.current === 'tl') {
            const r = x + width;
            x = Math.min(r - 30, worldPt.x);
            width = r - x;
          }
          if (resizeHandleRef.current === 't' || resizeHandleRef.current === 'tl') {
            const b = y + height;
            y = Math.min(b - 30, worldPt.y);
            height = b - y;
          }
          return { x, y, width, height };
        });
      } else {
        setCanvasImages((prev) =>
          prev.map((item) => {
            if (item.id !== selectedId) return item;
            let newX = item.x,
              newY = item.y,
              newW = item.width,
              newH = item.height;

            if (resizeHandleRef.current === 'inside') {
              const rawX = worldPt.x - dragOffsetRef.current.x;
              const rawY = worldPt.y - dragOffsetRef.current.y;
              const snap = calculateAutoAlign(
                { x: rawX, y: rawY, width: item.width, height: item.height },
                prev.filter((i) => i.id !== selectedId)
              );
              newX = snap.snappedX;
              newY = snap.snappedY;
              activeSnapGuidesRef.current = snap.guides;

              const moveDx = newX - item.x;
              const moveDy = newY - item.y;
              if (moveDx !== 0 || moveDy !== 0) {
                setPageStrokes((sPrev) => ({
                  ...sPrev,
                  [currentPage]: (sPrev[currentPage] || []).map((st) => {
                    if (st.imageId === item.id) {
                      return { ...st, points: st.points.map((p) => ({ x: p.x + moveDx, y: p.y + moveDy })) };
                    }
                    if (!st.imageId && isStrokeFullyInsideImage(st, item)) {
                      return { ...st, imageId: item.id, points: st.points.map((p) => ({ x: p.x + moveDx, y: p.y + moveDy })) };
                    }
                    return st;
                  }),
                }));
              }
            } else if (resizeHandleRef.current === 'br') {
              newW = Math.max(30, worldPt.x - item.x);
              newH = Math.max(30, worldPt.y - item.y);
            } else if (resizeHandleRef.current === 'bl') {
              const right = item.x + item.width;
              newX = Math.min(right - 30, worldPt.x);
              newW = right - newX;
              newH = Math.max(30, worldPt.y - item.y);
            } else if (resizeHandleRef.current === 'tr') {
              const bottom = item.y + item.height;
              newY = Math.min(bottom - 30, worldPt.y);
              newW = Math.max(30, worldPt.x - item.x);
              newH = bottom - newY;
            } else if (resizeHandleRef.current === 'tl') {
              const right = item.x + item.width;
              const bottom = item.y + item.height;
              newX = Math.min(right - 30, worldPt.x);
              newY = Math.min(bottom - 30, worldPt.y);
              newW = right - newX;
              newH = bottom - newY;
            }
            return { ...item, x: newX, y: newY, width: newW, height: newH };
          })
        );
      }
      return;
    }

    if (activeTool === 'eraser' && isDrawingRef.current) {
      const prevPt = lastEraserWorldPtRef.current || worldPt;
      const strokesToErase = pageStrokesRef.current[currentPage] || [];
      const res = eraseStrokesAlongPath(strokesToErase, prevPt, worldPt, eraserSize / 2);
      lastEraserWorldPtRef.current = worldPt;
      if (res.hasChanged) {
        pageStrokesRef.current = { ...pageStrokesRef.current, [currentPage]: res.strokes };
        setPageStrokes((prev) => ({ ...prev, [currentPage]: res.strokes }));
      }
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
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    isPanningRef.current = false;
    activeSnapGuidesRef.current = [];
    lastEraserWorldPtRef.current = null;

    if (isDraggingItemRef.current) {
      isDraggingItemRef.current = false;
      resizeHandleRef.current = 'none';
      if (isCroppingImageId && activeCropBox) {
        const target = canvasImages.find((i) => i.id === isCroppingImageId);
        if (target) {
          const cropped = await applyWordCrop(target, activeCropBox);
          setCanvasImages((prev) => prev.map((i) => (i.id === target.id ? cropped : i)));
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
        const insideImg = canvasImages.find((img) => isStrokeFullyInsideImage(tempStroke, img));
        if (insideImg) tempStroke.imageId = insideImg.id;

        const currentList = pageStrokesRef.current[currentPage] || [];
        const nextList = [...currentList, tempStroke];
        pageStrokesRef.current = { ...pageStrokesRef.current, [currentPage]: nextList };
        setPageStrokes((prev) => ({ ...prev, [currentPage]: nextList }));
      }
      currentStrokePointsRef.current = [];
      redrawCanvas();
    } else if (isDrawingRef.current) {
      isDrawingRef.current = false;
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const newZoom = Math.min(200.0, Math.max(0.01, zoom * zoomFactor));
    setPan({
      x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
      y: mouseY - (mouseY - pan.y) * (newZoom / zoom),
    });
    setZoom(newZoom);
  };

  return {
    handleDoubleClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
  };
}
