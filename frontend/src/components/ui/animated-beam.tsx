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

  if (!pathD || svgDimensions.width === 0) return null;

  return (
    <svg
      fill="none"
      width={svgDimensions.width}
      height={svgDimensions.height}
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none absolute left-0 top-0 transform-gpu ${className}`}
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

      {/* 2. Animated Magic UI Flowing Linear Gradient Beam */}
      <path
        d={pathD}
        stroke={`url(#${gradientId})`}
        strokeWidth={pathWidth + 1}
        strokeLinecap="round"
      />

      {/* 3. Glowing Light Particle Pulse Traveling along the Curve */}
      <motion.path
        d={pathD}
        stroke={gradientStopColor}
        strokeWidth={pathWidth + 2}
        strokeLinecap="round"
        strokeDasharray="45 220"
        initial={{ strokeDashoffset: reverse ? -265 : 0 }}
        animate={{ strokeDashoffset: reverse ? 0 : -265 }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          filter: `drop-shadow(0 0 6px ${gradientStopColor}) drop-shadow(0 0 12px ${gradientStartColor})`,
        }}
      />

      <defs>
        <motion.linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          initial={{
            x1: '0%',
            x2: '0%',
            y1: '0%',
            y2: '0%',
          }}
          animate={{
            x1: reverse ? ['90%', '-10%'] : ['-10%', '90%'],
            x2: reverse ? ['100%', '0%'] : ['0%', '100%'],
            y1: ['0%', '0%'],
            y2: ['0%', '0%'],
          }}
          transition={{
            delay,
            duration,
            ease: [0.16, 1, 0.3, 1],
            repeat: Infinity,
          }}
        >
          <stop offset="0%" stopColor={gradientStartColor} stopOpacity="0" />
          <stop offset="10%" stopColor={gradientStartColor} stopOpacity="1" />
          <stop offset="35%" stopColor={gradientStopColor} stopOpacity="1" />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </svg>
  );
};

export default AnimatedBeam;
