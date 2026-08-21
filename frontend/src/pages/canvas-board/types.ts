export type CanvasTool = 'none' | 'pen' | 'highlighter' | 'eraser' | 'line' | 'arrow' | 'rect' | 'circle';

export interface Point {
  x: number;
  y: number;
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
