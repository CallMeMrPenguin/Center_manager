import React, { useState } from 'react';
import { GraduationCap, ShieldCheck, ArrowRight, Shuffle } from 'lucide-react';
import { showToast } from '../../components/Toast';
import { api } from '../../api';
import { AuthUser } from '../../utils/authUtils';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleStudentQuickLogin = async () => {
    try {
      setLoading(true);
      const studentList = await api.getStudents();
      const picked = studentList && studentList.length > 0
        ? studentList[Math.floor(Math.random() * studentList.length)]
        : { id: 1, full_name: 'Trần Gia Bảo', class_name: 'Lớp 7A' };

      const studentUser: AuthUser = {
        id: String(picked.id),
        studentId: picked.id,
        name: picked.full_name,
        role: 'student',
        className: picked.class_name || picked.grade || 'Lớp học',
      };
      localStorage.setItem('auth_user', JSON.stringify(studentUser));
      showToast(`Đăng nhập thành công: ${studentUser.name} (${studentUser.className})`, 'success');
      onLogin(studentUser);
    } catch {
      const fallbackUser: AuthUser = {
        id: '1',
        studentId: 1,
        name: 'Trần Gia Bảo',
        role: 'student',
        className: 'Lớp 7A (Tiếng Anh Nâng Cao)',
      };
      localStorage.setItem('auth_user', JSON.stringify(fallbackUser));
      showToast(`Đăng nhập: ${fallbackUser.name}`, 'success');
      onLogin(fallbackUser);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen w-screen bg-[#08090e] flex items-center justify-center p-4 select-none relative overflow-hidden font-sans">
      <div className="w-full max-w-xl bg-[#0c0f1e] border border-[#212c4b] rounded-3xl p-6 sm:p-10 shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative z-10 space-y-8">
        {/* App Branding Header with Official Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-2 shadow-[0_0_25px_rgba(92,54,245,0.4)] mb-2">
            <img src="/logo.png" alt="Center Manager Logo" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">
            Hệ Thống Quản Lý Trung Tâm
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            EduPlatform — Nền tảng học tập, chấm thi & quản lý đào tạo trực tuyến
          </p>
        </div>

        {/* 2 Big Quick-Login Action Cards */}
        <div className="space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
            Chọn hình thức đăng nhập nhanh
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Log in as Random Student */}
            <button
              type="button"
              onClick={handleStudentQuickLogin}
              disabled={loading}
              className="p-5 rounded-2xl bg-[#121729] hover:bg-[#181f38] border border-[#263152] hover:border-emerald-500/60 text-left transition cursor-pointer group shadow-lg flex flex-col justify-between space-y-4 relative overflow-hidden active:scale-98 disabled:opacity-60"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <GraduationCap size={22} />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                  <Shuffle size={10} />
                  <span>Random</span>
                </span>
              </div>

              <div>
                <h3 className="text-sm font-black text-white group-hover:text-emerald-300 transition">
                  Đăng Nhập Học Sinh
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Đăng nhập ngẫu nhiên 1 học sinh trong lớp để làm bài & xem điểm.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>Vào học sinh</span>
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
                  Quản lý học sinh, giao bài tập, ngân hàng đề thi & thống kê.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
                <span>Vào quản trị</span>
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
