import React, { memo } from 'react';
import { Mouse } from 'lucide-react';

interface RightClickPanIndicatorProps {
  isPanning: boolean;
}

export const RightClickPanIndicator = memo(function RightClickPanIndicator({
  isPanning: _isPanning,
}: RightClickPanIndicatorProps) {
  // Suppress both the live panning badge and desktop helper indicator as requested
  return null;
});

export default RightClickPanIndicator;
