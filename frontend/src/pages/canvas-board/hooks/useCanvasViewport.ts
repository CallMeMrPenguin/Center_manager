import { useState, useEffect, useRef } from 'react';
import { Point } from '../types';

export function useCanvasViewport() {
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });

  const isPanningRef = useRef(false);
  const isRightClickZoomingRef = useRef(false);
  const rightClickStartRef = useRef<{ x: number; y: number; startZoom: number } | null>(null);
  const lastMousePosRef = useRef<Point>({ x: 0, y: 0 });
  const isShiftPressedRef = useRef(false);
  const isSpacePressedRef = useRef(false);

  // Track Shift & Space keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') isSpacePressedRef.current = true;
      isShiftPressedRef.current = e.shiftKey;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') isSpacePressedRef.current = false;
      isShiftPressedRef.current = e.shiftKey;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Arrow Keys Navigation
  useEffect(() => {
    const handleArrowNav = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      const step = 60;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setPan(p => ({ ...p, x: p.x + step }));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setPan(p => ({ ...p, x: p.x - step }));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setPan(p => ({ ...p, y: p.y + step }));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setPan(p => ({ ...p, y: p.y - step }));
      }
    };
    window.addEventListener('keydown', handleArrowNav);
    return () => window.removeEventListener('keydown', handleArrowNav);
  }, []);

  return {
    zoom,
    setZoom,
    pan,
    setPan,
    isPanningRef,
    isRightClickZoomingRef,
    rightClickStartRef,
    lastMousePosRef,
    isShiftPressedRef,
    isSpacePressedRef,
  };
}
