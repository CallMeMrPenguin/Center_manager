import React, { useState } from 'react';

export default function GridEditorPage() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="h-full w-full overflow-hidden flex flex-col bg-[#f3f3f3] relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#f3f3f3] text-slate-700">
          <div className="bg-white/90 p-6 rounded-2xl shadow-lg border border-slate-200/80 flex flex-col items-center max-w-xs w-full text-center">
            <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3.5" />
            <span className="text-sm font-bold text-slate-800">
              Đang mở GridCraft...
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Khởi tạo bảng tính Excel Rust WebAssembly
            </span>
          </div>
        </div>
      )}
      <iframe
        src="/gridcraft/index.html"
        title="GridCraft Spreadsheet Editor"
        className="w-full h-full border-0 bg-[#f3f3f3]"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
