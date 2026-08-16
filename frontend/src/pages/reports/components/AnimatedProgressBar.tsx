import React, { useState, useEffect } from 'react';

interface AnimatedProgressBarProps {
  pct: number;
  color?: string;
  gradientClass?: string;
  delayMs?: number;
  durationSec?: number;
  className?: string;
}

export const AnimatedProgressBar = React.memo(({
  pct,
  color,
  gradientClass = '',
  delayMs = 750,
  durationSec = 1.3,
  className = '',
}: AnimatedProgressBarProps) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setWidth(0);
    const timer = setTimeout(() => {
      setWidth(Math.max(pct > 0 ? (pct < 3 ? 3 : pct) : 0, Math.min(100, pct)));
    }, delayMs);
    return () => clearTimeout(timer);
  }, [pct, delayMs]);

  return (
    <div
      style={{
        width: `${width}%`,
        backgroundColor: color,
        transition: `width ${durationSec}s cubic-bezier(0.16, 1, 0.3, 1)`,
      }}
      className={`h-full rounded-full will-change-[width] ${gradientClass} ${className}`}
    />
  );
});
