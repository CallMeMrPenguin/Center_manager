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
        left: pos.x,
        top: pos.y,
      }}
    >
      <span className="w-0.5 h-4 bg-blue-600 animate-pulse mr-1" />
      <span className="text-xs text-blue-600/75 select-none font-sans">Văn bản...</span>
    </div>
  );
});

export default TextBoxPlacementPreview;
