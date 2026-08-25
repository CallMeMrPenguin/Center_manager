import React, { useState, useEffect } from 'react';
import { X, Trash2, Save, UserCheck, Shield } from 'lucide-react';
import { api } from '../../../api';
import { showToast } from '../../../components/Toast';
import { CustomSelect, SelectOption } from '../../../components/CustomSelect';
import { AppUser } from '../types';
import { ROLES } from '../hooks/useUsersData';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser | null;
  onSuccess: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Giáo viên');
  const [status, setStatus] = useState('Hoạt động');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name);
      setUsername(user.username);
      setPassword(''); // Password blank when editing unless changing
      setRole(user.role || 'Giáo viên');
      setStatus(user.status || 'Hoạt động');
    } else {
      setDisplayName('');
      setUsername('');
      setPassword('');
      setRole('Giáo viên');
      setStatus('Hoạt động');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const roleOptions: SelectOption[] = ROLES.map((r) => ({
    value: r,
    label: r,
  }));

  const statusOptions: SelectOption[] = [
    { value: 'Hoạt động', label: 'Hoạt động' },
    { value: 'Tạm khóa', label: 'Tạm khóa' },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      showToast('Vui lòng nhập tên đăng nhập', 'error');
      return;
    }
    if (!user && !password.trim()) {
      showToast('Vui lòng nhập mật khẩu cho tài khoản mới', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        display_name: displayName.trim() || username.trim(),
        username: username.trim(),
        role,
        status,
      };
      if (password.trim()) {
        payload.password = password.trim();
      }

      if (user) {
        await api.updateUser(user.id, payload);
        showToast('Đã cập nhật thông tin tài khoản thành công!', 'success');
      } else {
        await api.createUser(payload);
        showToast('Đã tạo tài khoản mới thành công!', 'success');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to save user:', err);
      showToast('Lỗi khi lưu tài khoản: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (user.username === 'admin') {
      showToast('Không thể xóa tài khoản Quản trị viên mặc định', 'error');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${user.display_name}" (${user.username})?`)) {
      return;
    }
    try {
      setDeleting(true);
      await api.deleteUser(user.id);
      showToast('Đã xóa tài khoản thành công!', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      showToast('Lỗi khi xóa tài khoản: ' + err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 select-none animate-fade-in">
      <div className="bg-[#0c0f1e] border border-[#212c4b] rounded-2xl w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <UserCheck size={18} className="text-indigo-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              {user ? 'Chỉnh Sửa Tài Khoản' : 'Thêm Tài Khoản Mới'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Tên Hiển Thị <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn An"
              className="w-full bg-[#121626] border border-[#263152] focus:border-indigo-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-inner"
              required
            />
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Tên Đăng Nhập <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ví dụ: teacher_an"
              className="w-full bg-[#121626] border border-[#263152] focus:border-indigo-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-inner"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              {user ? 'Mật Khẩu Mới (Để trống nếu không đổi)' : 'Mật Khẩu'} {!user && <span className="text-rose-400">*</span>}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={user ? '••••••••' : 'Nhập mật khẩu...'}
              className="w-full bg-[#121626] border border-[#263152] focus:border-indigo-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-inner"
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Vai Trò & Quyền Hạn
            </label>
            <CustomSelect
              value={role}
              onChange={(val) => setRole(String(val))}
              options={roleOptions}
              icon={<Shield size={14} className="text-indigo-400" />}
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Trạng Thái Tài Khoản
            </label>
            <CustomSelect
              value={status}
              onChange={(val) => setStatus(String(val))}
              options={statusOptions}
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
            {/* Merged Single Pen Action: Delete inside Edit Modal */}
            {user ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || user.username === 'admin'}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 transition cursor-pointer active:scale-95 disabled:opacity-40"
              >
                <Trash2 size={14} />
                <span>{deleting ? 'Đang xóa...' : 'Xóa tài khoản'}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#6c48f7] text-white text-xs font-black shadow-[0_0_15px_rgba(92,54,245,0.4)] transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Save size={14} />
                <span>{saving ? 'Đang lưu...' : 'Lưu tài khoản'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
