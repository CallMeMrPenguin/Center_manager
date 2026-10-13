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
      className={`p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer border border-transparent hover:border-blue-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      <Edit3 size={size} />
    </button>
  );
};

export default SinglePenButton;
