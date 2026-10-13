import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './Button';

export interface CollapseButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
  size?: 'xs' | 'sm';
  title?: string;
  className?: string;
}

export const CollapseButton: React.FC<CollapseButtonProps> = ({
  isCollapsed,
  onToggle,
  size = 'xs',
  title,
  className = '',
}) => {
  const defaultTitle = isCollapsed ? 'Mở rộng' : 'Thu gọn';
  return (
    <Button
      type="button"
      variant="white"
      size={`icon-${size}` as any}
      onClick={onToggle}
      title={title || defaultTitle}
      className={`shadow-xs hover:shadow-sm border-0 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition ${className}`}
    >
      {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
    </Button>
  );
};

export default CollapseButton;
