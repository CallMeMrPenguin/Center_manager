import { useEffect } from 'react';
import { CanvasTool, CanvasItemImage, CanvasTextBox, StrokeRecord } from '../types';
import { showToast } from '../../../components/Toast';

interface UseCanvasShortcutsProps {
  handleUndo: () => void;
  handleRedo: () => void;
  selectedId: string | null;
  selectedType: 'image' | 'text' | null;
  setSelectedId: (id: string | null) => void;
  setSelectedType: (type: 'image' | 'text' | null) => void;
  pushHistorySnapshot: () => void;
  currentPage: number;
  setActiveTool: (tool: CanvasTool) => void;
  setCanvasImages: React.Dispatch<React.SetStateAction<CanvasItemImage[]>>;
  setPageStrokes: React.Dispatch<React.SetStateAction<Record<number, StrokeRecord[]>>>;
  setCanvasTextBoxes: React.Dispatch<React.SetStateAction<CanvasTextBox[]>>;
}

export function useCanvasShortcuts({
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
}: UseCanvasShortcutsProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput && selectedId) {
        e.preventDefault();
        pushHistorySnapshot();
        if (selectedType === 'image') {
          setCanvasImages((prev) => prev.filter((i) => i.id !== selectedId));
          setPageStrokes((prev) => ({
            ...prev,
            [currentPage]: (prev[currentPage] || []).filter((st) => st.imageId !== selectedId),
          }));
        } else if (selectedType === 'text') {
          setCanvasTextBoxes((prev) => prev.filter((t) => t.id !== selectedId));
        }
        setSelectedId(null);
        setSelectedType(null);
        showToast('Đã xóa phần tử', 'success');
      } else if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === '1') setActiveTool('select');
        else if (e.key === '2') setActiveTool('pen');
        else if (e.key === '3') setActiveTool('highlighter');
        else if (e.key === '4') setActiveTool('eraser');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [
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
  ]);
}
