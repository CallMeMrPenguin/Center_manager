import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  Shuffle,
  Lock,
  User,
  Eye,
  EyeOff,
  Check,
  Sparkles,
  LogIn,
} from 'lucide-react';
import { showToast } from '../../components/Toast';
import { api } from '../../api';
import { AuthUser, saveAuthUser, getSavedUsername } from '../../utils/authUtils';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [loginMode, setLoginMode] = useState<'form' | 'quick'>('form');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  // Auto-fill remembered username on mount
  useEffect(() => {
    const saved = getSavedUsername();
    if (saved) {
      setUsername(saved);
    }
  }, []);

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser) {
      showToast('Vui lòng nhập tên đăng nhập hoặc mã học sinh', 'warning');
      return;
    }
    if (!cleanPass) {
      showToast('Vui lòng nhập mật khẩu', 'warning');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login(cleanUser, cleanPass);
      if (res && res.success && res.user) {
        const authUser: AuthUser = res.user;
        saveAuthUser(authUser, rememberMe);
        showToast(`Đăng nhập thành công: ${authUser.name} (${authUser.rawRole || authUser.role})`, 'success');
        onLogin(authUser);
      } else {
        showToast('Đăng nhập không thành công', 'error');
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      try {
        const parsed = JSON.parse(errMsg);
        showToast(parsed.detail || 'Tên đăng nhập hoặc mật khẩu không chính xác', 'error');
      } catch {
        showToast(errMsg.replace('Error: ', '') || 'Tên đăng nhập hoặc mật khẩu không chính xác', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStudentLogin = async () => {
    try {
      setLoading(true);
      const studentList = await api.getStudents();
      const picked =
        studentList && studentList.length > 0
          ? studentList[Math.floor(Math.random() * studentList.length)]
          : { id: 4, full_name: 'Top', class_name: 'Kid 9.1' };

      const studentUser: AuthUser = {
        id: String(picked.id),
        studentId: picked.id,
        username: `hs_${String(picked.id).padStart(4, '0')}`,
        name: picked.full_name,
        role: 'student',
        rawRole: 'Học sinh',
        className: picked.class_name || picked.grade || 'Lớp học',
      };
      saveAuthUser(studentUser, rememberMe);
      showToast(`Đăng nhập thành công: ${studentUser.name} (${studentUser.className})`, 'success');
      onLogin(studentUser);
    } catch {
      const fallbackUser: AuthUser = {
        id: '4',
        studentId: 4,
        username: 'hs_0004',
        name: 'Top',
        role: 'student',
        rawRole: 'Học sinh',
        className: 'Kid 9.1',
      };
      saveAuthUser(fallbackUser, rememberMe);
      showToast(`Đăng nhập: ${fallbackUser.name}`, 'success');
      onLogin(fallbackUser);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdminLogin = () => {
    const adminUser: AuthUser = {
      id: '1',
      username: 'admin',
      name: 'Quản Trị Viên',
      role: 'admin',
      rawRole: 'Quản trị viên',
    };
    saveAuthUser(adminUser, rememberMe);
    showToast('Đăng nhập thành công với tư cách Quản Trị Viên!', 'success');
    onLogin(adminUser);
  };

  const handleFillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen w-screen bg-[#08090e] flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden font-sans">
      <div className="w-full max-w-lg bg-[#0c0f1e] border border-[#212c4b] rounded-3xl p-6 sm:p-9 shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative z-10 space-y-6">
        {/* App Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-15 h-15 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-2.5 shadow-[0_0_25px_rgba(92,54,245,0.4)] mb-1">
            <img src="/logo.png" alt="Center Manager Logo" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">
            Hệ Thống Quản Lý Trung Tâm
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            EduPlatform — Nền tảng học tập, chấm thi và quản lý đào tạo
          </p>
        </div>

        {/* Sliding Pill Indicator Segmented Control */}
        <div className="relative flex bg-[#0d1018] p-1 rounded-xl border border-white/10 text-xs shrink-0 font-bold select-none">
          <div
            className="absolute top-1 bottom-1 rounded-lg bg-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.5)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
            style={{
              left: loginMode === 'form' ? '4px' : 'calc(50% + 2px)',
              width: 'calc(50% - 6px)',
            }}
          />
          <button
            type="button"
            onClick={() => setLoginMode('form')}
            className={`flex-1 relative z-10 py-2 text-center transition-colors cursor-pointer ${
              loginMode === 'form' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Đăng Nhập Tài Khoản
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('quick')}
            className={`flex-1 relative z-10 py-2 text-center transition-colors cursor-pointer ${
              loginMode === 'quick' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Đăng Nhập Nhanh
          </button>
        </div>

        {/* TAB 1: FORM LOGIN (Username / Password) */}
        {loginMode === 'form' ? (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Tên đăng nhập / Mã học sinh</span>
                <span className="text-[11px] text-slate-500 font-normal">Ví dụ: admin hoặc hs_0004</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập..."
                  disabled={loading}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#121626] border border-[#212c4b] focus:border-[#5c36f5] focus:ring-1 focus:ring-[#5c36f5] rounded-xl text-white text-xs font-medium placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Mật khẩu</span>
                <span className="text-[11px] text-slate-500 font-normal">Mặc định: admin123 / 123456</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  disabled={loading}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#121626] border border-[#212c4b] focus:border-[#5c36f5] focus:ring-1 focus:ring-[#5c36f5] rounded-xl text-white text-xs font-medium placeholder-slate-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-medium select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#212c4b] bg-[#121626] text-[#5c36f5] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#5c36f5]"
                />
                <span>Lưu thông tin đăng nhập trên thiết bị</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#5c36f5] hover:bg-[#4f2ee8] text-white font-extrabold text-xs tracking-wide uppercase transition-all duration-200 cursor-pointer shadow-[0_0_20px_rgba(92,54,245,0.4)] flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Đăng Nhập Hệ Thống</span>
                </>
              )}
            </button>

            {/* Demo Credentials Quick Fill Chips */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Sparkles size={12} className="text-amber-400" />
                <span>Tài khoản mẫu nhanh:</span>
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleFillDemo('admin', 'admin123')}
                  className="px-2.5 py-1 rounded-lg bg-[#121626] hover:bg-[#181f38] border border-[#212c4b] hover:border-indigo-500/40 text-[11px] font-mono text-indigo-300 hover:text-white transition cursor-pointer"
                >
                  Admin (admin / admin123)
                </button>
                <button
                  type="button"
                  onClick={() => handleFillDemo('hs_0004', '123456')}
                  className="px-2.5 py-1 rounded-lg bg-[#121626] hover:bg-[#181f38] border border-[#212c4b] hover:border-emerald-500/40 text-[11px] font-mono text-emerald-300 hover:text-white transition cursor-pointer"
                >
                  Học sinh (hs_0004 / 123456)
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* TAB 2: QUICK LOGIN (1-Click) */
          <div className="space-y-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
              Chọn tài khoản để truy cập trực tiếp
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* 1. Quick Student Login */}
              <button
                type="button"
                onClick={handleQuickStudentLogin}
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
                    Đăng nhập ngẫu nhiên 1 học sinh trong lớp để làm bài và tra cứu điểm.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                  <span>Vào học sinh</span>
                  <ArrowRight size={13} />
                </div>
              </button>

              {/* 2. Quick Admin Login */}
              <button
                type="button"
                onClick={handleQuickAdminLogin}
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
                    Toàn quyền quản lý học sinh, giao bài tập, ngân hàng đề thi và báo cáo.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
                  <span>Vào quản trị</span>
                  <ArrowRight size={13} />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-white/5 text-[11px] text-slate-500 font-medium">
          Dữ liệu ngoại tuyến an toàn 100% — Phiên bản 1.0.0
        </div>
      </div>
    </div>
  );
};

