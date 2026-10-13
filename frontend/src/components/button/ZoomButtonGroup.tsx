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
      className={`flex items-center gap-0.5 bg-white dark:bg-[#181a20] rounded-xl p-0.5 border-0 shadow-[0_2px_10px_rgba(15,23,42,0.13),0_0_6px_rgba(15,23,42,0.07)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.18),0_0_8px_rgba(15,23,42,0.09)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.55),0_0_6px_rgba(0,0,0,0.35)] !h-8 ${className}`}
    >
      <Button
        variant="ghost"
        size="icon-xs"
        type="button"
        onClick={() => setZoomLevel((z) => Math.min(maxZoom, Number((z + step).toFixed(2))))}
        title="Phóng to biểu đồ"
        className="!p-1.5 text-slate-700 dark:text-slate-200"
      >
        <ZoomIn size={14} />
      </Button>

      <Button
        variant="ghost"
        size="icon-xs"
        type="button"
        onClick={() => setZoomLevel((z) => Math.max(minZoom, Number((z - step).toFixed(2))))}
        title="Thu nhỏ biểu đồ"
        className="!p-1.5 text-slate-700 dark:text-slate-200"
      >
        <ZoomOut size={14} />
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
          className="!p-1.5 text-slate-700 dark:text-slate-200"
        >
          <RotateCcw size={13} />
        </Button>
      )}
    </div>
  );
};

export default ZoomButtonGroup;
