import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
}

export const PdfIcon: React.FC<IconProps> = ({
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
      {/* File Page Outline */}
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      {/* P */}
      <path d="M7 13.5v5" />
      <path d="M7 13.5h1.7a1.25 1.25 0 0 1 0 2.5H7" />
      {/* D */}
      <path d="M11.2 13.5v5" />
      <path d="M11.2 13.5h1.2a1.8 1.8 0 0 1 1.8 1.8v1.4a1.8 1.8 0 0 1-1.8 1.8h-1.2" />
      {/* F */}
      <path d="M16.5 18.5v-5h2.5" />
      <path d="M16.5 16h1.8" />
    </svg>
  );
};
