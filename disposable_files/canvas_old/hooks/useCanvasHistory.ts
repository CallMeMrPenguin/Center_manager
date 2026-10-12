import { useState, useCallback } from 'react';
import { StrokeRecord, CanvasItemImage, CanvasTextBox } from '../types';

export interface HistorySnapshot {
  strokes: StrokeRecord[];
  images: CanvasItemImage[];
  textBoxes: CanvasTextBox[];
}

interface UseCanvasHistoryProps {
  currentPage: number;
  pageStrokes: Record<number, StrokeRecord[]>;
  setPageStrokes: React.Dispatch<React.SetStateAction<Record<number, StrokeRecord[]>>>;
  canvasImages: CanvasItemImage[];
  setCanvasImages: React.Dispatch<React.SetStateAction<CanvasItemImage[]>>;
  canvasTextBoxes: CanvasTextBox[];
  setCanvasTextBoxes: React.Dispatch<React.SetStateAction<CanvasTextBox[]>>;
}

export function useCanvasHistory({
  currentPage,
  pageStrokes,
  setPageStrokes,
  canvasImages,
  setCanvasImages,
  canvasTextBoxes,
  setCanvasTextBoxes,
}: UseCanvasHistoryProps) {
  const [undoStack, setUndoStack] = useState<HistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<HistorySnapshot[]>([]);

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
  }, [undoStack, pageStrokes, canvasImages, canvasTextBoxes, currentPage, setPageStrokes, setCanvasImages, setCanvasTextBoxes]);

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
  }, [redoStack, pageStrokes, canvasImages, canvasTextBoxes, currentPage, setPageStrokes, setCanvasImages, setCanvasTextBoxes]);

  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return {
    undoStack,
    redoStack,
    undoStackLength: undoStack.length,
    redoStackLength: redoStack.length,
    pushHistorySnapshot,
    handleUndo,
    handleRedo,
    clearHistory,
  };
}
