import React, { useState } from 'react';

export default function WordEditorPage() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="h-full w-full overflow-hidden flex flex-col bg-[#080b14] relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#080b14] text-slate-300">
          <div className="w-9 h-9 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-sm font-semibold tracking-wide text-slate-200">
            Đang tải trình soạn thảo WordCraft...
          </span>
          <span className="text-xs text-slate-400 mt-1">
            Khởi tạo môi trường Rust WebAssembly
          </span>
        </div>
      )}
      <iframe
        src="/wordcraft/index.html"
        title="WordCraft Document Editor"
        className="w-full h-full border-0 bg-[#e6e6e6]"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
