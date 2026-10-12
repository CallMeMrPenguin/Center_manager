import React, { memo } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

function CanvasBoardPage() {
  return (
    <div
      className="h-full w-full overflow-hidden flex flex-col relative bg-[#f8f9fa]"
      style={{
        contain: 'strict',
        isolation: 'isolate',
      }}
    >
      <Excalidraw
        theme="light"
        langCode="vi-VN"
        gridModeEnabled={false}
        zenModeEnabled={false}
        UIOptions={{
          canvasActions: {
            saveToActiveFile: false,
            loadScene: true,
            export: { saveFileToDisk: true },
            toggleTheme: true,
          },
        }}
      />
    </div>
  );
}

export default memo(CanvasBoardPage);
