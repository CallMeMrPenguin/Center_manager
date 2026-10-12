import React, { useCallback, useEffect, useRef } from 'react';
import {
  CanvasItemImage,
  CanvasTool,
  CropBox,
  Point,
  SnapGuide,
  StrokeRecord,
} from '../types';
import { GridType } from '../components/CanvasBottomBar';
import { renderCanvasFrame } from '../utils/canvasRenderer';

interface UseCanvasRedrawProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  pan: Point;
  zoom: number;
  gridType: GridType;
  canvasImages: CanvasItemImage[];
  selectedId: string | null;
  selectedType: 'image' | 'text' | null;
  isCroppingImageId: string | null;
  activeCropBox: CropBox | null;
  currentPage: number;
  pageStrokesRef: React.MutableRefObject<Record<number, StrokeRecord[]>>;
  isDrawingRef: React.MutableRefObject<boolean>;
  currentStrokePointsRef: React.MutableRefObject<Point[]>;
  activeTool: CanvasTool;
  selectedColor: string;
  penSize: number;
  hlSize: number;
  shapeSize: number;
  isShiftPressedRef: React.MutableRefObject<boolean>;
  activeSnapGuidesRef: React.MutableRefObject<SnapGuide[]>;
  hoverWorldPtRef: React.MutableRefObject<Point | null>;
  eraserSize: number;
}

export function useCanvasRedraw({
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
}: UseCanvasRedrawProps) {
  const rafIdRef = useRef<number | null>(null);

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
        currentStrokes: pageStrokesRef.current[currentPage] || [],
        inProgressStroke:
          isDrawingRef.current && currentStrokePointsRef.current.length > 0
            ? {
                points: currentStrokePointsRef.current,
                tool: activeTool,
                color: selectedColor,
                size: activeTool === 'pen' ? penSize : activeTool === 'highlighter' ? hlSize : shapeSize,
                isShiftPressed: isShiftPressedRef.current,
              }
            : null,
        activeSnapGuides: activeSnapGuidesRef.current,
        hoverWorldPt: hoverWorldPtRef.current,
        eraserSize,
        activeTool,
      });
    });
  }, [
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
  ]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  return { redrawCanvas };
}
