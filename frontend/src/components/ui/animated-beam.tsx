import React, { forwardRef, useEffect, useId, useState } from 'react';
import { motion } from 'framer-motion';

export interface BeamContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const BeamContainer = forwardRef<HTMLDivElement, BeamContainerProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative overflow-hidden ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
BeamContainer.displayName = 'BeamContainer';

export interface BeamNodeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const BeamNode = forwardRef<HTMLDivElement, BeamNodeProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`z-10 flex items-center justify-center rounded-2xl shadow-lg transition-transform duration-200 hover:scale-105 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
BeamNode.displayName = 'BeamNode';

export interface AnimatedBeamProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  fromRef: React.RefObject<HTMLDivElement | null>;
  toRef: React.RefObject<HTMLDivElement | null>;
  curvature?: number;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
  className?: string;
}

export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = 3,
  delay = 0,
  pathColor = '#212d52',
  pathWidth = 2,
  pathOpacity = 0.4,
  gradientStartColor = '#3b82f6',
  gradientStopColor = '#8b5cf6',
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

      // Control points for curvature
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;

      // Perpendicular vector for arc curvature
      const curveOffset = Math.sqrt(deltaX * deltaX + deltaY * deltaY) * curvature;
      const normY = deltaX !== 0 ? (deltaX / Math.sqrt(deltaX * deltaX + deltaY * deltaY)) : 1;
      const normX = deltaY !== 0 ? (-deltaY / Math.sqrt(deltaX * deltaX + deltaY * deltaY)) : 0;

      const cp1X = midX + normX * curveOffset;
      const cp1Y = midY + normY * curveOffset;

      const d = `M ${startX} ${startY} Q ${cp1X} ${cp1Y} ${endX} ${endY}`;
      setPathD(d);
    };

    updatePath();

    const resizeObserver = new ResizeObserver(() => updatePath());
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    if (fromRef.current) resizeObserver.observe(fromRef.current);
    if (toRef.current) resizeObserver.observe(toRef.current);

    window.addEventListener('resize', updatePath);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePath);
    };
  }, [containerRef, fromRef, toRef, curvature, startXOffset, startYOffset, endXOffset, endYOffset]);

  if (!pathD) return null;

  return (
    <svg
      fill="none"
      width={svgDimensions.width}
      height={svgDimensions.height}
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none absolute left-0 top-0 transform-gpu stroke-2 ${className}`}
      viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
    >
      {/* Background Static Path */}
      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
      />

      {/* Animated Light Beam */}
      <path
        d={pathD}
        stroke={`url(#${gradientId})`}
        strokeWidth={pathWidth + 1}
        strokeLinecap="round"
      />

      <defs>
        <motion.linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          initial={{
            x1: reverse ? '100%' : '0%',
            x2: reverse ? '100%' : '0%',
            y1: reverse ? '100%' : '0%',
            y2: reverse ? '100%' : '0%',
          }}
          animate={{
            x1: reverse ? ['100%', '0%'] : ['0%', '100%'],
            x2: reverse ? ['100%', '0%'] : ['0%', '100%'],
            y1: reverse ? ['100%', '0%'] : ['0%', '100%'],
            y2: reverse ? ['100%', '0%'] : ['0%', '100%'],
          }}
          transition={{
            duration,
            delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <stop offset="0%" stopColor={gradientStartColor} stopOpacity="0" />
          <stop offset="20%" stopColor={gradientStartColor} stopOpacity="0.8" />
          <stop offset="50%" stopColor={gradientStopColor} stopOpacity="1" />
          <stop offset="80%" stopColor={gradientStopColor} stopOpacity="0.8" />
          <stop offset="100%" stopColor={gradientStartColor} stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </svg>
  );
};

export default AnimatedBeam;
