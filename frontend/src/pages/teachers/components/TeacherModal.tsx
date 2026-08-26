import React from 'react';
import { 
  X, UserCheck, Phone, Calendar, KeyRound, Shield, Trash2, CheckCircle2 
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 select-none animate-fade-in font-sans">
      <div className="bg-[#0c0f1e] border border-[#212c4b] rounded-2xl w-full max-w-xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0 bg-[#0d1222]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#5c36f5]/20 text-[#5c36f5] rounded-xl border border-[#5c36f5]/30">
              <UserCheck size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {editingTeacher ? 'Cập Nhật Hồ Sơ Giáo Viên' : 'Thêm Giáo Viên / Trợ Giảng'}
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                {editingTeacher ? `Mã GV: gv_${(editingTeacher.id || 0).toString().padStart(4, '0')}` : 'Nhập thông tin nhân sự & cấp tài khoản đăng nhập'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={onSave} className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
          {/* SECTION 1: THÔNG TIN NHÂN SỰ */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5 pb-1 border-b border-white/5">
              <UserCheck size={14} />
              <span>1. Thông Tin Nhân Sự</span>
            </h4>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Họ và tên <span className="text-rose-400">*</span>
              </label>
              <VietnameseInput
                value={formData.full_name || ''}
                onValueChange={(val) => setFormData((p) => ({ ...p, full_name: val }))}
                placeholder="Ví dụ: Cô Thu Hương"
                className="w-full bg-[#13192c] border border-[#232e4d] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 font-bold focus:outline-none focus:border-[#5c36f5]"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Vai trò chuyên môn:</label>
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
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Số điện thoại:</label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="Ví dụ: 0912345678"
                  className="w-full bg-[#13192c] border border-[#232e4d] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 font-bold focus:outline-none focus:border-[#5c36f5]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Ngày sinh:</label>
              <CustomDatePicker
                value={formData.date_of_birth || ''}
                onChange={(val) => setFormData((p) => ({ ...p, date_of_birth: val }))}
                placeholder="Chọn ngày sinh"
              />
            </div>
          </div>

          {/* SECTION 2: TÀI KHOẢN HỆ THỐNG */}
          <div className="space-y-3.5 bg-[#101526] p-4 rounded-xl border border-indigo-500/20">
            <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5 pb-1 border-b border-white/5">
              <KeyRound size={14} />
              <span>2. Tài Khoản Đăng Nhập Hệ Thống (Staff App Account)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Tên đăng nhập:</label>
                <input
                  type="text"
                  value={formData.account_username || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, account_username: e.target.value.trim().toLowerCase() }))}
                  placeholder={editingTeacher?.id ? `gv_${String(editingTeacher.id).padStart(4, '0')}` : 'Tự động tạo (gv_XXXX)'}
                  className="w-full bg-[#161c30] border border-[#2c385d] rounded-xl px-3.5 py-2 text-xs text-indigo-300 font-mono font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {editingTeacher ? 'Mật khẩu mới (Nếu đổi):' : 'Mật khẩu khởi tạo:'}
                </label>
                <input
                  type="password"
                  value={formData.account_password || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, account_password: e.target.value }))}
                  placeholder={editingTeacher ? 'Để trống nếu giữ nguyên' : 'Mặc định: 123456'}
                  className="w-full bg-[#161c30] border border-[#2c385d] rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Phân quyền vai trò:</label>
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
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Trạng thái tài khoản:</label>
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
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Ghi chú thêm:</label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Chuyên môn giảng dạy, kinh nghiệm, lớp phụ trách..."
              className="w-full bg-[#13192c] border border-[#232e4d] rounded-xl p-3 text-xs text-white placeholder:text-slate-500 font-medium focus:outline-none focus:border-[#5c36f5]"
            />
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            {editingTeacher && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(editingTeacher)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-black border border-rose-500/30 transition cursor-pointer"
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
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#6e4af7] text-white text-xs font-black shadow-[0_0_15px_rgba(92,54,245,0.5)] transition cursor-pointer"
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
