import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
}

export const WhiteboardIcon: React.FC<IconProps> = ({
  size = 20,
  strokeWidth = 2,
  className = '',
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Whiteboard Board Frame */}
      <rect x="2" y="3" width="20" height="12" rx="2" />
      {/* Board Stand / Legs */}
      <path d="M7 21l2-6" />
      <path d="M17 21l-2-6" />
      {/* Marker Tray */}
      <path d="M8 15h8" />
    </svg>
  );
};
