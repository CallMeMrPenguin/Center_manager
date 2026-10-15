import React, { memo } from 'react';
import { Type } from 'lucide-react';
import { Point } from '../types';

interface TextBoxPlacementPreviewProps {
  isVisible: boolean;
  pos: Point | null;
}

export const TextBoxPlacementPreview = memo(function TextBoxPlacementPreview({
  isVisible,
  pos,
}: TextBoxPlacementPreviewProps) {
  if (!isVisible || !pos) return null;

  return (
    <div
      className="custom-text-placement-preview"
      style={{
        left: pos.x + 8,
        top: pos.y + 8,
      }}
    >
      <Type size={14} strokeWidth={2.4} className="text-blue-600 animate-pulse" />
      <span className="opacity-90">Nhấp để đặt hộp văn bản...</span>
    </div>
  );
});

export default TextBoxPlacementPreview;
