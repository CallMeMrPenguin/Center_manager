export type CanvasTool = 
  | 'select' 
  | 'text'
  | 'pen' 
  | 'highlighter' 
  | 'eraser' 
  | 'line' 
  | 'arrow' 
  | 'rect' 
  | 'circle';

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
  cropBox?: CropBox;
}

export interface CanvasTextBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
  bgColor: string;
  fontSize: number;
  fontFamily: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
}

export const FONT_FAMILIES = [
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, sans-serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'Georgia', value: 'Georgia, serif' },
];

export const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 44, 56, 72];

export interface StrokeRecord {
  id: string;
  points: Point[];
  tool: CanvasTool;
  color: string;
  size: number;
  isShiftPressed?: boolean;
  imageId?: string;
}

export interface SnapGuide {
  type: 'vertical' | 'horizontal';
  pos: number;
  start: number;
  end: number;
  gapText?: string;
  gapStart?: Point;
  gapEnd?: Point;
  gapCenter?: Point;
}

export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const PRESET_COLORS = [
  { label: 'Đỏ', value: '#ff3344' },
  { label: 'Xanh lam', value: '#00b0ff' },
  { label: 'Xanh lá', value: '#00e676' },
  { label: 'Vàng', value: '#ffd600' },
  { label: 'Cam', value: '#ff9100' },
  { label: 'Tím hồng', value: '#e040fb' },
  { label: 'Đen', value: '#1a1a1a' },
  { label: 'Trắng', value: '#ffffff' },
];

export const PRESET_BG_COLORS = [
  { label: 'Trắng', value: '#ffffff' },
  { label: 'Vàng nhạt', value: '#fef08a' },
  { label: 'Hồng nhạt', value: '#fbcfe8' },
  { label: 'Xanh nhạt', value: '#bae6fd' },
  { label: 'Xanh ngọc', value: '#bbf7d0' },
  { label: 'Trong suốt', value: 'transparent' },
];
