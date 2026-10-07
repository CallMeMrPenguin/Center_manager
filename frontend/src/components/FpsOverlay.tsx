import React, { useState, useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';

export const FpsOverlay: React.FC = () => {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('debug_fps_mode') === 'true';
    } catch {
      return false;
    }
  });

  const [fps, setFps] = useState<number>(60);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const handleDebugChanged = () => {
      try {
        setEnabled(localStorage.getItem('debug_fps_mode') === 'true');
      } catch {}
    };
    window.addEventListener('debug-mode-changed', handleDebugChanged);
    window.addEventListener('storage', handleDebugChanged);
    return () => {
      window.removeEventListener('debug-mode-changed', handleDebugChanged);
      window.removeEventListener('storage', handleDebugChanged);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    frameCountRef.current = 0;
    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      frameCountRef.current += 1;
      const elapsed = now - lastTimeRef.current;

      if (elapsed >= 500) {
        const currentFps = Math.round((frameCountRef.current * 1000) / elapsed);
        setFps(Math.min(currentFps, 120));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [enabled]);

  if (!enabled) return null;

  // Color gradient & status depending on FPS
  let colorClasses = 'text-emerald-400 bg-[#07130e]/95 border-emerald-500/40 shadow-[0_0_14px_rgba(16,185,129,0.25)]';
  let statusText = 'Mượt (60 FPS)';
  if (fps < 40) {
    colorClasses = 'text-rose-400 bg-[#16080b]/95 border-rose-500/40 shadow-[0_0_14px_rgba(244,63,94,0.3)] animate-pulse';
    statusText = 'Giật lag';
  } else if (fps < 55) {
    colorClasses = 'text-amber-400 bg-[#161206]/95 border-amber-500/40 shadow-[0_0_14px_rgba(245,158,11,0.25)]';
    statusText = 'Trung bình';
  }

  return (
    <div className="fixed top-3 right-16 z-[999999] pointer-events-none select-none font-mono">
      <div className={`flex items-center gap-2 px-3 py-1 rounded-xl border text-xs font-black backdrop-blur-none transition-colors duration-200 ${colorClasses}`}>
        <Activity size={13} className="animate-pulse" />
        <span>{fps} FPS</span>
        <span className="text-[10px] opacity-75 font-sans font-bold">({statusText})</span>
      </div>
    </div>
  );
};
