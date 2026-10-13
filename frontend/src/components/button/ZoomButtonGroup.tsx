import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface ZoomButtonGroupProps {
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  setPanOffset?: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  minZoom?: number;
  maxZoom?: number;
  step?: number;
  className?: string;
}

export const ZoomButtonGroup: React.FC<ZoomButtonGroupProps> = ({
  setZoomLevel,
  setPanOffset,
  minZoom = 0.6,
  maxZoom = 2.5,
  step = 0.2,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center gap-0.5 bg-white dark:bg-[#181a20] rounded-xl p-0.5 border-0 shadow-2xs ${className}`}
    >
      <Button
        variant="ghost"
        size="icon-xs"
        type="button"
        onClick={() => setZoomLevel((z) => Math.min(maxZoom, Number((z + step).toFixed(2))))}
        title="Phóng to biểu đồ"
      >
        <ZoomIn size={13} />
      </Button>

      <Button
        variant="ghost"
        size="icon-xs"
        type="button"
        onClick={() => setZoomLevel((z) => Math.max(minZoom, Number((z - step).toFixed(2))))}
        title="Thu nhỏ biểu đồ"
      >
        <ZoomOut size={13} />
      </Button>

      {setPanOffset && (
        <Button
          variant="ghost"
          size="icon-xs"
          type="button"
          onClick={() => {
            setZoomLevel(1.0);
            setPanOffset({ x: 0, y: 0 });
          }}
          title="Đặt lại góc nhìn ban đầu"
        >
          <RotateCcw size={13} />
        </Button>
      )}
    </div>
  );
};

export default ZoomButtonGroup;
