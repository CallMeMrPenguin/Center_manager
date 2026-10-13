import React from 'react';
import { Edit3 } from 'lucide-react';
import { SinglePenButtonProps } from './types';

/**
 * Standard Single Pen Action Button matching AGENTS.md Rule 3.5.
 * Replaces the anti-pattern of separate Trash bin + Edit pen icons.
 */
export const SinglePenButton: React.FC<SinglePenButtonProps> = ({
  onClick,
  title = 'Chỉnh sửa bản ghi (Xóa nằm trong modal chỉnh sửa)',
  size = 15,
  className = '',
  disabled = false,
  ...props
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-lg bg-white dark:bg-[#181a20] text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/15 transition cursor-pointer border-0 shadow-[0_2px_10px_rgba(15,23,42,0.13),0_0_6px_rgba(15,23,42,0.07)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.18),0_0_8px_rgba(15,23,42,0.09)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.55),0_0_6px_rgba(0,0,0,0.35)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      <Edit3 size={size} />
    </button>
  );
};

export default SinglePenButton;
