import React, { useState } from 'react';
import { GraduationCap, ShieldCheck, ArrowRight, UserCheck, Sparkles, BookOpen, Lock } from 'lucide-react';
import { showToast } from '../../components/Toast';

export interface AuthUser {
  id: string;
  name: string;
  role: 'student' | 'admin';
  avatar?: string;
  className?: string;
}

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleStudentQuickLogin = () => {
    const studentUser: AuthUser = {
      id: 'student_001',
      name: 'Nguyễn Hoàng Nam',
      role: 'student',
      className: 'Lớp 7A1 (Tiếng Anh Nâng Cao)',
    };
    localStorage.setItem('auth_user', JSON.stringify(studentUser));
    showToast('Đăng nhập thành công với tư cách Học Sinh!', 'success');
    onLogin(studentUser);
  };

  const handleAdminQuickLogin = () => {
    const adminUser: AuthUser = {
      id: 'admin_001',
      name: 'Quản Trị Viên / Giáo Viên',
      role: 'admin',
    };
    localStorage.setItem('auth_user', JSON.stringify(adminUser));
    showToast('Đăng nhập thành công với tư cách Quản Trị Viên!', 'success');
    onLogin(adminUser);
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      showToast('Vui lòng nhập tên đăng nhập!', 'error');
      return;
    }
    const isStudent = username.toLowerCase().includes('student') || username.toLowerCase().includes('hocsinh');
    const user: AuthUser = {
      id: isStudent ? 'student_001' : 'admin_001',
      name: username,
      role: isStudent ? 'student' : 'admin',
    };
    localStorage.setItem('auth_user', JSON.stringify(user));
    showToast(`Đăng nhập thành công với vai trò: ${isStudent ? 'Học Sinh' : 'Quản Trị Viên'}`, 'success');
    onLogin(user);
  };

  return (
    <div className="min-h-screen w-screen bg-[#08090e] flex items-center justify-center p-4 select-none relative overflow-hidden font-sans">
      {/* Ambient background glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#5c36f5]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl bg-[#0c0f1e]/95 border border-[#212c4b] rounded-3xl p-6 sm:p-10 shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative z-10 space-y-8 backdrop-blur-none">
        {/* App Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5c36f5] to-indigo-700 text-white shadow-[0_0_25px_rgba(92,54,245,0.6)] mb-2">
            <BookOpen size={28} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">
            Hệ Thống Quản Lý Trung Tâm
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Center Manager App — Nền tảng học tập, chấm thi & quản lý đào tạo trực tuyến
          </p>
        </div>

        {/* 2 Big Quick-Login Action Cards */}
        <div className="space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
            Chọn hình thức đăng nhập nhanh
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Log in as Student */}
            <button
              type="button"
              onClick={handleStudentQuickLogin}
              className="p-5 rounded-2xl bg-[#121729] hover:bg-[#181f38] border border-[#263152] hover:border-[#5c36f5]/60 text-left transition cursor-pointer group shadow-lg flex flex-col justify-between space-y-4 relative overflow-hidden active:scale-98"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <GraduationCap size={22} />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Học Sinh
                </span>
              </div>

              <div>
                <h3 className="text-sm font-black text-white group-hover:text-emerald-300 transition">
                  Đăng Nhập Học Sinh
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Làm bài tập về nhà, luyện đề thi, nộp bài & theo dõi kết quả.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>Vào làm bài</span>
                <ArrowRight size={13} />
              </div>
            </button>

            {/* 2. Log in as Admin / Teacher */}
            <button
              type="button"
              onClick={handleAdminQuickLogin}
              className="p-5 rounded-2xl bg-[#121729] hover:bg-[#181f38] border border-[#263152] hover:border-[#5c36f5]/60 text-left transition cursor-pointer group shadow-lg flex flex-col justify-between space-y-4 relative overflow-hidden active:scale-98"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#5c36f5]/20 text-indigo-400 border border-[#5c36f5]/40 flex items-center justify-center shadow-[0_0_15px_rgba(92,54,245,0.4)]">
                  <ShieldCheck size={22} />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#5c36f5]/15 text-indigo-300 border border-[#5c36f5]/30">
                  Quản Trị
                </span>
              </div>

              <div>
                <h3 className="text-sm font-black text-white group-hover:text-indigo-300 transition">
                  Đăng Nhập Quản Trị
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Quản lý học sinh, ngân hàng đề thi, chấm bài & thống kê.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
                <span>Vào quản lý</span>
                <ArrowRight size={13} />
              </div>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-white/5 text-[11px] text-slate-500 font-medium">
          Dữ liệu ngoại tuyến an toàn 100% — Phiên bản 1.0.0
        </div>
      </div>
    </div>
  );
};
