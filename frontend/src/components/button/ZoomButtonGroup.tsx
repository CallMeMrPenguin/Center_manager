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
      className={`flex items-center gap-1 bg-slate-100 dark:bg-[#181a20] rounded-xl p-1 border-0 shadow-xs ${className}`}
    >
      <Button
        variant="white"
        size="icon-xs"
        type="button"
        onClick={() => setZoomLevel((z) => Math.min(maxZoom, Number((z + step).toFixed(2))))}
        title="Phóng to biểu đồ"
        className="!p-1.5 shadow-xs hover:shadow-sm text-slate-700 dark:text-slate-200"
      >
        <ZoomIn size={14} />
      </Button>

      <Button
        variant="white"
        size="icon-xs"
        type="button"
        onClick={() => setZoomLevel((z) => Math.max(minZoom, Number((z - step).toFixed(2))))}
        title="Thu nhỏ biểu đồ"
        className="!p-1.5 shadow-xs hover:shadow-sm text-slate-700 dark:text-slate-200"
      >
        <ZoomOut size={14} />
      </Button>

      {setPanOffset && (
        <Button
          variant="white"
          size="icon-xs"
          type="button"
          onClick={() => {
            setZoomLevel(1.0);
            setPanOffset({ x: 0, y: 0 });
          }}
          title="Đặt lại góc nhìn ban đầu"
          className="!p-1.5 shadow-xs hover:shadow-sm text-slate-700 dark:text-slate-200"
        >
          <RotateCcw size={13} />
        </Button>
      )}
    </div>
  );
};

export default ZoomButtonGroup;
