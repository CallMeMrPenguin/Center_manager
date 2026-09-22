import React from 'react';
import { Database, Cloud, ShieldCheck, KeyRound, Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { AnimatedThemeToggle } from '../../../components/ui/animated-theme-toggle';

export const SystemSettingsTab: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4 select-none">
      {/* 1. Theme & Appearance Settings */}
      <div className="bg-white dark:bg-[#0c0f1e] border border-slate-200 dark:border-[#1e2742] rounded-2xl p-5 shadow-sm dark:shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <Sparkles size={18} className="text-indigo-500 dark:text-indigo-400" />
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Giao Diện & Trải Nghiệm Người Dùng
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lựa chọn bảng màu tối ưu cho môi trường làm việc của bạn
              </p>
            </div>
          </div>
          <AnimatedThemeToggle />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Light Theme Card */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-left cursor-pointer flex flex-col gap-2 relative overflow-hidden ${
              theme === 'light'
                ? 'bg-indigo-50/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                : 'bg-slate-50 hover:bg-slate-100 dark:bg-[#121626] dark:hover:bg-[#181e33] border-slate-200 dark:border-[#232c49]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <Sun size={18} />
                </div>
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Giao Diện Sáng (Light Executive)
                </span>
              </div>
              {theme === 'light' && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500 text-white">
                  Đang dùng
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Tông màu Cool Slate chống lóa mắt, độ tương phản chuẩn Apple HIG & Linear cho môi trường ánh sáng tự nhiên.
            </p>
          </button>

          {/* Dark Theme Card */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-left cursor-pointer flex flex-col gap-2 relative overflow-hidden ${
              theme === 'dark'
                ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                : 'bg-slate-50 hover:bg-slate-100 dark:bg-[#121626] dark:hover:bg-[#181e33] border-slate-200 dark:border-[#232c49]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Moon size={18} />
                </div>
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Giao Diện Tối (Dark Space)
                </span>
              </div>
              {theme === 'dark' && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500 text-white">
                  Đang dùng
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Tông màu Deep Space Indigo huyền bí, êm dịu cho mắt khi làm việc buổi tối và tiết kiệm pin màn hình OLED.
            </p>
          </button>
        </div>
      </div>

      {/* 2. Offline-First & Local DB Status */}
      <div className="bg-white dark:bg-[#0c0f1e] border border-slate-200 dark:border-[#1e2742] rounded-2xl p-5 shadow-sm dark:shadow-lg space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-white/10 pb-3">
          <Database size={18} className="text-emerald-500 dark:text-emerald-400" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Cơ Sở Dữ Liệu Cục Bộ (SQLite Offline-First)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-[#232c49] rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400 block">
              Trạng Thái Cơ Sở Dữ Liệu
            </span>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Đang kết nối (Tốt)</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-[#232c49] rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400 block">
              Mã Hóa Mật Khẩu
            </span>
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
              <KeyRound size={13} />
              <span>SHA-256 Hashing</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-[#232c49] rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400 block">
              Tự Động Sao Lưu
            </span>
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs">
              <ShieldCheck size={13} />
              <span>Cục bộ tự động</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. VPS PostgreSQL Cloud Sync (Future Ready) */}
      <div className="bg-white dark:bg-[#0c0f1e] border border-slate-200 dark:border-[#1e2742] rounded-2xl p-5 shadow-sm dark:shadow-lg space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-white/10 pb-3">
          <Cloud size={18} className="text-sky-500 dark:text-sky-400" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Đồng Bộ Máy Chủ PostgreSQL (VPS)
          </h3>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Hệ thống hoạt động theo kiến trúc <strong>Offline-First</strong> độc lập và bảo mật trên máy tính của bạn với SQLite, đồng thời sẵn sàng kết nối và tự động đồng bộ hóa 2 chiều với máy chủ cơ sở dữ liệu <strong>PostgreSQL trên VPS</strong> của trung tâm khi có kết nối mạng.
        </p>

        <div className="bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-[#232c49] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              PostgreSQL VPS Host / URL
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Chưa cấu hình (Sẵn sàng)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Trạng thái đồng bộ máy chủ
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              Sẵn sàng cho VPS PostgreSQL
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
