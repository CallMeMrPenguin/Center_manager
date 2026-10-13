import React from 'react';
import { BarChart2, TrendingUp } from 'lucide-react';
import { Button } from './Button';

export interface ViewModeButtonProps {
  currentMode: 'timeline' | 'distribution';
  onToggle: (nextMode: 'timeline' | 'distribution') => void;
  className?: string;
}

export const ViewModeButton: React.FC<ViewModeButtonProps> = ({
  currentMode,
  onToggle,
  className = '',
}) => {
  const isTimeline = currentMode === 'timeline';

  return (
    <Button
      variant="white"
      size="icon-sm"
      type="button"
      onClick={() => onToggle(isTimeline ? 'distribution' : 'timeline')}
      title={isTimeline ? 'Chuyển sang xem phổ điểm' : 'Chuyển sang xem tiến độ học tập'}
      className={`!h-8 !w-8 ${className}`}
    >
      {isTimeline ? <BarChart2 size={16} /> : <TrendingUp size={16} />}
    </Button>
  );
};

export default ViewModeButton;
