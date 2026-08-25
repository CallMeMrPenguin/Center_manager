import React from 'react';
import { Database, Cloud, ShieldCheck, KeyRound } from 'lucide-react';

export const SystemSettingsTab: React.FC = () => {
  return (
    <div className="space-y-4 select-none">
      {/* 1. Offline-First & Local DB Status */}
      <div className="bg-[#0c0f1e] border border-[#1e2742] rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
          <Database size={18} className="text-emerald-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Cơ Sở Dữ Liệu Cục Bộ (SQLite Offline-First)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#121626] border border-[#232c49] rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
              Trạng Thái Cơ Sở Dữ Liệu
            </span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Đang kết nối (Tốt)</span>
            </div>
          </div>

          <div className="bg-[#121626] border border-[#232c49] rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
              Mã Hóa Mật Khẩu
            </span>
            <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs">
              <KeyRound size={13} />
              <span>SHA-256 Hashing</span>
            </div>
          </div>

          <div className="bg-[#121626] border border-[#232c49] rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
              Tự Động Sao Lưu
            </span>
            <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
              <ShieldCheck size={13} />
              <span>Cục bộ tự động</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Supabase Cloud Sync (Future Ready) */}
      <div className="bg-[#0c0f1e] border border-[#1e2742] rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
          <Cloud size={18} className="text-sky-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Đồng Bộ Đám Mây & Supabase Auth
          </h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Hệ thống hiện tại hoạt động theo kiến trúc <strong>Offline-First</strong> độc lập và bảo mật 100% trên máy tính của bạn. Trong các bản cập nhật tiếp theo, tài khoản và phân quyền sẽ được tích hợp với <strong>Supabase</strong> để tự động đồng bộ hóa dữ liệu 2 chiều khi có kết nối Internet.
        </p>

        <div className="bg-[#121626] border border-[#232c49] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">
              Supabase Project URL
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Chưa cấu hình (Sẵn sàng)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">
              Trạng thái đồng bộ đám mây
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Sẵn sàng cho Supabase
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
