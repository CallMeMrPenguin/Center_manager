import React, { useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

export default function CanvasBoardPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  return (
    <div className="h-full w-full overflow-hidden flex flex-col relative bg-[#121212]">
      <Excalidraw
        theme={theme}
        langCode="vi-VN"
        UIOptions={{
          canvasActions: {
            saveToActiveFile: false,
            loadScene: true,
            export: { saveFileToDisk: true },
          },
        }}
      />
    </div>
  );
}
