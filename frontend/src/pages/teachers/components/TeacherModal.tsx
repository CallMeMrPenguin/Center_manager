import React, { useState } from 'react';
import { 
  X, UserCheck, KeyRound, Trash2, CheckCircle2, Eye, EyeOff 
} from 'lucide-react';
import { CustomDatePicker } from '../../../components/CustomDatePicker';
import { CustomSelect } from '../../../components/CustomSelect';
import { VietnameseInput } from '../../../components/VietnameseInput';
import { TeacherCM } from '../../../types';

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTeacher: TeacherCM | null;
  formData: Partial<TeacherCM>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<TeacherCM>>>;
  onSave: (e: React.FormEvent) => void;
  onDelete?: (t: TeacherCM) => void;
}

export const TeacherModal: React.FC<TeacherModalProps> = ({
  isOpen,
  onClose,
  editingTeacher,
  formData,
  setFormData,
  onSave,
  onDelete,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 select-none animate-fade-in font-sans">
      <div className="bg-white dark:bg-[#0c0f1e] border border-slate-200 dark:border-[#212c4b] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-[#101526]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-500/30">
              <UserCheck size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {editingTeacher ? 'Cập Nhật Hồ Sơ Giáo Viên' : 'Thêm Giáo Viên / Trợ Giảng'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                {editingTeacher ? `Mã GV: gv_${(editingTeacher.id || 0).toString().padStart(4, '0')}` : 'Nhập thông tin nhân sự & cấp tài khoản đăng nhập'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={onSave} className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
          {/* SECTION 1: THÔNG TIN NHÂN SỰ */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-200 dark:border-white/10">
              <UserCheck size={14} />
              <span>1. Thông Tin Nhân Sự</span>
            </h4>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <VietnameseInput
                value={formData.full_name || ''}
                onValueChange={(val) => setFormData((p) => ({ ...p, full_name: val }))}
                placeholder="Ví dụ: Cô Thu Hương"
                className="w-full bg-white dark:bg-[#101526] border border-slate-300 dark:border-[#212c4b] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 font-bold focus:outline-none focus:border-blue-600"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Vai trò chuyên môn:</label>
                <CustomSelect
                  value={formData.role || 'Giáo viên'}
                  onChange={(val) => setFormData((p) => ({ ...p, role: String(val) as any }))}
                  options={[
                    { value: 'Giáo viên', label: 'Giáo viên' },
                    { value: 'Trợ giảng', label: 'Trợ giảng' },
                    { value: 'Quản trị viên', label: 'Quản trị viên' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Số điện thoại:</label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="Ví dụ: 0912345678"
                  className="w-full bg-white dark:bg-[#101526] border border-slate-300 dark:border-[#212c4b] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 font-bold focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Ngày sinh:</label>
              <CustomDatePicker
                value={formData.date_of_birth || ''}
                onChange={(val) => setFormData((p) => ({ ...p, date_of_birth: val }))}
                placeholder="Chọn ngày sinh"
              />
            </div>
          </div>

          {/* SECTION 2: TÀI KHOẢN HỆ THỐNG */}
          <div className="space-y-3.5 bg-slate-50 dark:bg-[#101526] p-4 rounded-xl border border-slate-200 dark:border-white/10">
            <h4 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-200 dark:border-white/10">
              <KeyRound size={14} />
              <span>2. Tài Khoản Đăng Nhập Hệ Thống (Staff App Account)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Tên đăng nhập:</label>
                <input
                  type="text"
                  value={formData.account_username || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, account_username: e.target.value.trim().toLowerCase() }))}
                  placeholder={editingTeacher?.id ? `gv_${String(editingTeacher.id).padStart(4, '0')}` : 'Tự động tạo (gv_XXXX)'}
                  className="w-full bg-white dark:bg-[#0c0f1e] border border-slate-300 dark:border-[#212c4b] rounded-xl px-3.5 py-2 text-xs text-blue-600 dark:text-cyan-400 font-mono font-bold focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {editingTeacher ? 'Mật khẩu mới (Nếu đổi):' : 'Mật khẩu khởi tạo:'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.account_password || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, account_password: e.target.value }))}
                    placeholder={editingTeacher ? 'Để trống nếu giữ nguyên' : 'Mặc định: 123456'}
                    className="w-full bg-white dark:bg-[#0c0f1e] border border-slate-300 dark:border-[#212c4b] rounded-xl pl-3.5 pr-9 py-2 text-xs text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Phân quyền vai trò:</label>
                <CustomSelect
                  value={formData.account_role || formData.role || 'Giáo viên'}
                  onChange={(val) => setFormData((p) => ({ ...p, account_role: String(val) }))}
                  options={[
                    { value: 'Giáo viên', label: 'Giáo viên' },
                    { value: 'Trợ giảng', label: 'Trợ giảng' },
                    { value: 'Quản trị viên', label: 'Quản trị viên' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Trạng thái tài khoản:</label>
                <CustomSelect
                  value={formData.account_status || 'Hoạt động'}
                  onChange={(val) => setFormData((p) => ({ ...p, account_status: String(val) }))}
                  options={[
                    { value: 'Hoạt động', label: 'Hoạt động' },
                    { value: 'Tạm khóa', label: 'Tạm khóa' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: GHI CHÚ */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Ghi chú thêm:</label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Chuyên môn giảng dạy, kinh nghiệm, lớp phụ trách..."
              className="w-full bg-white dark:bg-[#101526] border border-slate-300 dark:border-[#212c4b] rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 font-medium focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/10">
            {editingTeacher && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(editingTeacher)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-black border border-rose-200 dark:border-rose-500/30 transition cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Xóa giáo viên</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>{editingTeacher ? 'Lưu Thay Đổi' : 'Thêm Giáo Viên'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
