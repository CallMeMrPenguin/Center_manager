import React, { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, LogIn } from 'lucide-react';
import { showToast } from '../../components/Toast';
import { api } from '../../api';
import { AuthUser, saveAuthUser, getSavedUsername } from '../../utils/authUtils';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
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
      showToast('Vui lòng nhập tên đăng nhập', 'warning');
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
        showToast(`Đăng nhập thành công: ${authUser.name}`, 'success');
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

  return (
    <div className="min-h-screen w-screen bg-[#08090e] flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden font-sans">
      <div className="w-full max-w-md bg-[#0c0f1e] border border-[#212c4b] rounded-3xl p-7 sm:p-9 shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative z-10 space-y-6">
        {/* App Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-2.5 shadow-[0_0_25px_rgba(92,54,245,0.4)] mb-1">
            <img src="/logo.png" alt="Center Manager Logo" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight uppercase">
            Hệ Thống Quản Lý Trung Tâm
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            EduPlatform — Đăng nhập tài khoản để tiếp tục
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Username Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Tên đăng nhập
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User size={16} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập (admin, hs_0001...)"
                disabled={loading}
                autoFocus={!username}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="text"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#121626] border border-[#212c4b] focus:border-[#5c36f5] focus:ring-1 focus:ring-[#5c36f5] rounded-xl text-white text-xs font-medium placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Mật khẩu
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
                autoFocus={!!username}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
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
              <span>Ghi nhớ đăng nhập</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#5c36f5] hover:bg-[#4f2ee8] text-white font-extrabold text-xs tracking-wide uppercase transition-all duration-200 cursor-pointer shadow-[0_0_20px_rgba(92,54,245,0.4)] flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={16} />
                <span>Đăng Nhập</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-white/5 text-[11px] text-slate-500 font-medium">
          Dữ liệu ngoại tuyến an toàn 100% — Phiên bản 1.0.0
        </div>
      </div>
    </div>
  );
};


