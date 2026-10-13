import React, { useState } from 'react';
import { X, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { api } from '../../api';
import { showToast } from '../toast/index';
import { getCurrentUser } from '../../utils/authUtils';
import { Button } from '../button';

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'admin';

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin && !oldPassword.trim()) {
      showToast('Vui lòng nhập mật khẩu hiện tại!', 'warning');
      return;
    }

    if (!newPassword.trim()) {
      showToast('Vui lòng nhập mật khẩu mới!', 'warning');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự!', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp với mật khẩu mới!', 'warning');
      return;
    }

    try {
      setLoading(true);
      await api.changePassword({
        username: currentUser?.username || '',
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
        is_admin: isAdmin,
      });
      showToast('Đổi mật khẩu thành công!', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      showToast('Lỗi đổi mật khẩu: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 select-none animate-fade-in font-sans">
      <div className="bg-white border-0 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
              <KeyRound size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Đổi Mật Khẩu
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                Tài khoản: @{currentUser?.username || 'user'} ({currentUser?.rawRole || currentUser?.role})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isAdmin && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Mật khẩu hiện tại <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu cũ của bạn"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-3.5 pr-9 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showOld ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Mật khẩu mới (Tối thiểu 6 ký tự) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                className="w-full bg-white border border-slate-300 rounded-xl pl-3.5 pr-9 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full bg-white border border-slate-300 rounded-xl pl-3.5 pr-9 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading}
              loading={loading}
              leftIcon={<CheckCircle2 size={14} />}
            >
              {loading ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
