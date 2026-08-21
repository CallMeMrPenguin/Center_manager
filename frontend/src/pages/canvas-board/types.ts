export type CanvasTool = 
  | 'select' 
  | 'pen' 
  | 'highlighter' 
  | 'eraser' 
  | 'line' 
  | 'arrow' 
  | 'rect' 
  | 'circle' 
  | 'crop';

export interface Point {
  x: number;
  y: number;
}

export interface CanvasItemImage {
  id: string;
  img: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  originalSrc?: string;
}

export interface SnapGuide {
  type: 'vertical' | 'horizontal';
  pos: number;
  start: number;
  end: number;
}

export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const PRESET_COLORS = [
  { label: 'Vàng', value: '#ffd600' },
  { label: 'Đỏ', value: '#ff3344' },
  { label: 'Xanh lam', value: '#00b0ff' },
  { label: 'Xanh lá', value: '#00e676' },
  { label: 'Cam', value: '#ff9100' },
  { label: 'Tím hồng', value: '#e040fb' },
  { label: 'Trắng', value: '#ffffff' },
  { label: 'Đen', value: '#000000' },
];
