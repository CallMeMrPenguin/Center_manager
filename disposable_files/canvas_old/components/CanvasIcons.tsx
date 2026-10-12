import React from 'react';

export const ChiselHighlighterIcon: React.FC<{ size?: number; className?: string }> = ({ size = 15, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m9 11-6 6v3h3l6-6" />
    <path d="m22 7-4-4-5 5 4 4 5-5z" />
    <line x1="2" y1="22" x2="11" y2="22" stroke="#eab308" strokeWidth="2.5" />
  </svg>
);
