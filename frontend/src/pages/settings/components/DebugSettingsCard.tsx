import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck } from 'lucide-react';
import { showToast } from '../../../components/Toast';

export const DebugSettingsCard: React.FC = () => {
  const [debugFps, setDebugFps] = useState<boolean>(() => {
    try {
      return localStorage.getItem('debug_fps_mode') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggle = () => {
    const nextVal = !debugFps;
    setDebugFps(nextVal);
    try {
      if (nextVal) {
        localStorage.setItem('debug_fps_mode', 'true');
        showToast('Đã kích hoạt chế độ gỡ lỗi (Hiển thị FPS thực tế)', 'success');
      } else {
        localStorage.removeItem('debug_fps_mode');
        showToast('Đã tắt chế độ gỡ lỗi FPS', 'info');
      }
      window.dispatchEvent(new Event('debug-mode-changed'));
    } catch (e: any) {
      showToast('Lỗi lưu cài đặt: ' + e.message, 'error');
    }
  };

  return (
    <div className="bg-white dark:bg-[#141417] rounded-2xl p-6 flex flex-col gap-4 shadow-sm dark:shadow-none border border-slate-200 dark:border-[#27272a]">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-3">
        <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Activity size={15} className="text-emerald-500" />
          Chế Độ Gỡ Lỗi & Giám Sát FPS (Debug Mode)
        </h3>
        <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
          debugFps
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'
        }`}>
          {debugFps ? 'ĐANG BẬT' : 'ĐANG TẮT'}
        </span>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        Khi kích hoạt, ứng dụng sẽ hiển thị huy hiệu đo tốc độ khung hình (FPS) thời gian thực ở góc trên màn hình để kiểm tra giật lag. Khung hình lý tưởng là 60 FPS (xanh lá), chuyển sang vàng (40-54 FPS) hoặc đỏ (&lt;40 FPS) nếu phát hiện sụt giảm hiệu năng.
      </p>

      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#0c0f1a] border border-slate-200/70 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={16} className={debugFps ? 'text-emerald-500' : 'text-slate-400'} />
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Hiển thị FPS thực tế trên toàn bộ ứng dụng
          </span>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            debugFps ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              debugFps ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
};
