import React, { forwardRef, useEffect, useId, useState } from 'react';
import { motion } from 'framer-motion';

export interface BeamNodeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const BeamNode = forwardRef<HTMLDivElement, BeamNodeProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative z-10 flex items-center justify-center rounded-2xl border border-white/15 bg-[#0e1326] p-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.6)] ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
BeamNode.displayName = 'BeamNode';

export interface BeamContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const BeamContainer = forwardRef<HTMLDivElement, BeamContainerProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative flex w-full items-center justify-center overflow-hidden rounded-2xl border border-[#1e2744] bg-[#070a14] p-8 select-none ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
BeamContainer.displayName = 'BeamContainer';

export interface AnimatedBeamProps {
  className?: string;
  containerRef: React.RefObject<HTMLElement | null>;
  fromRef: React.RefObject<HTMLElement | null>;
  toRef: React.RefObject<HTMLElement | null>;
  curvature?: number;
  reverse?: boolean;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  delay?: number;
  duration?: number;
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
}

export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = 2.4,
  delay = 0,
  pathColor = 'rgba(255, 255, 255, 0.15)',
  pathWidth = 2,
  pathOpacity = 0.6,
  gradientStartColor = '#6366f1',
  gradientStopColor = '#a855f7',
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
  className = '',
}) => {
  const id = useId();
  const [pathD, setPathD] = useState('');
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

  const gradientId = `beam-grad-${id.replace(/:/g, '')}`;

  useEffect(() => {
    const updatePath = () => {
      if (!containerRef.current || !fromRef.current || !toRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const fromRect = fromRef.current.getBoundingClientRect();
      const toRect = toRef.current.getBoundingClientRect();

      setSvgDimensions({
        width: containerRect.width,
        height: containerRect.height,
      });

      const startX = fromRect.left - containerRect.left + fromRect.width / 2 + startXOffset;
      const startY = fromRect.top - containerRect.top + fromRect.height / 2 + startYOffset;

      const endX = toRect.left - containerRect.left + toRect.width / 2 + endXOffset;
      const endY = toRect.top - containerRect.top + toRect.height / 2 + endYOffset;

      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // Control points for quadratic bezier curvature
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;

      // Perpendicular vector for arc curvature
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const curveOffset = distance * curvature;
      const normY = distance !== 0 ? deltaX / distance : 1;
      const normX = distance !== 0 ? -deltaY / distance : 0;

      const cp1X = midX + normX * curveOffset;
      const cp1Y = midY + normY * curveOffset;

      const d = `M ${startX} ${startY} Q ${cp1X} ${cp1Y} ${endX} ${endY}`;
      setPathD(d);
    };

    // Immediate & deferred execution to ensure layout completion
    updatePath();
    const rafId = requestAnimationFrame(updatePath);
    const timerId = setTimeout(updatePath, 80);

    const resizeObserver = new ResizeObserver(() => updatePath());
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    if (fromRef.current) resizeObserver.observe(fromRef.current);
    if (toRef.current) resizeObserver.observe(toRef.current);

    window.addEventListener('resize', updatePath);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePath);
    };
  }, [containerRef, fromRef, toRef, curvature, startXOffset, startYOffset, endXOffset, endYOffset]);

  if (!pathD || svgDimensions.width === 0) return null;

  return (
    <svg
      fill="none"
      width={svgDimensions.width}
      height={svgDimensions.height}
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none absolute left-0 top-0 transform-gpu z-0 ${className}`}
      viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
    >
      {/* 1. Static Background Track Path */}
      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
      />

      {/* 2. Flowing Luminous Beam Particle Dash */}
      <motion.path
        d={pathD}
        stroke={`url(#${gradientId})`}
        strokeWidth={pathWidth + 2.5}
        strokeLinecap="round"
        strokeDasharray="160 360"
        initial={{ strokeDashoffset: reverse ? -520 : 520 }}
        animate={{ strokeDashoffset: reverse ? 520 : -520 }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          filter: `drop-shadow(0 0 8px ${gradientStopColor}) drop-shadow(0 0 16px ${gradientStartColor})`,
        }}
      />

      {/* 3. Gradient Definition */}
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor={gradientStartColor} stopOpacity="0.2" />
          <stop offset="40%" stopColor={gradientStartColor} stopOpacity="1" />
          <stop offset="70%" stopColor={gradientStopColor} stopOpacity="1" />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0.2" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default AnimatedBeam;
