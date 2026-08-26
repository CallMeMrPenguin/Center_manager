import React, { useState, useEffect } from 'react';
import { 
  X, User, Phone, Home, GraduationCap, Calendar, 
  KeyRound, Shield, Trash2, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import { VietnameseInput } from '../../../components/VietnameseInput';
import { CustomDatePicker } from '../../../components/CustomDatePicker';
import { CustomSelect } from '../../../components/CustomSelect';
import { Student } from '../../../types';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStudent: Student | null;
  formData: Partial<Student>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Student>>>;
  onSave: (e: React.FormEvent) => void;
  onDelete?: (st: Student) => void;
  highlightMissingFields?: boolean;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  editingStudent,
  formData,
  setFormData,
  onSave,
  onDelete,
  highlightMissingFields = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 select-none animate-fade-in">
      <div className="bg-[#0c0f1e] border border-[#212c4b] rounded-2xl w-full max-w-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh] font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0 bg-[#0d1222]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#5c36f5]/20 text-[#5c36f5] rounded-xl border border-[#5c36f5]/30">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {editingStudent ? 'Cập Nhật Thông Tin Học Sinh' : 'Thêm Học Sinh Mới'}
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                {editingStudent ? `Mã HS: hs_${(editingStudent.id || 0).toString().padStart(4, '0')}` : 'Nhập thông tin hồ sơ & tài khoản đăng nhập'}
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

        {/* Modal Body Form */}
        <form onSubmit={onSave} className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
          {/* SECTION 1: HỌC SINH */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5 pb-1 border-b border-white/5">
              <GraduationCap size={14} />
              <span>1. Thông Tin Học Sinh & Trường Lớp</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Họ và tên <span className="text-rose-400">*</span>
                </label>
                <VietnameseInput
                  value={formData.full_name || ''}
                  onValueChange={(val) => setFormData((p) => ({ ...p, full_name: val }))}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full bg-[#13192c] border border-[#232e4d] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 font-bold focus:outline-none focus:border-[#5c36f5]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Biệt danh (Nickname):</label>
                <VietnameseInput
                  value={formData.nickname || ''}
                  onValueChange={(val) => setFormData((p) => ({ ...p, nickname: val }))}
                  placeholder="Ví dụ: Bống, Nhím, Tom..."
                  className="w-full bg-[#13192c] border border-[#232e4d] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 font-bold focus:outline-none focus:border-[#5c36f5]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Khối lớp:</label>
                <CustomSelect
                  value={formData.grade || 'Lớp 6'}
                  onChange={(val) => setFormData((p) => ({ ...p, grade: String(val) }))}
                  options={[
                    { value: 'Lớp 6', label: 'Lớp 6' },
                    { value: 'Lớp 7', label: 'Lớp 7' },
                    { value: 'Lớp 8', label: 'Lớp 8' },
                    { value: 'Lớp 9', label: 'Lớp 9' },
                    { value: 'Lớp 10', label: 'Lớp 10' },
                    { value: 'Lớp 11', label: 'Lớp 11' },
                    { value: 'Lớp 12', label: 'Lớp 12' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Giới tính:</label>
                <CustomSelect
                  value={formData.gender || 'Nam'}
                  onChange={(val) => setFormData((p) => ({ ...p, gender: String(val) }))}
                  options={[
                    { value: 'Nam', label: 'Nam' },
                    { value: 'Nữ', label: 'Nữ' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Ngày sinh:</label>
                <CustomDatePicker
                  value={formData.date_of_birth || ''}
                  onChange={(val) => setFormData((p) => ({ ...p, date_of_birth: val }))}
                  placeholder="Chọn ngày sinh"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Trạng thái:</label>
                <CustomSelect
                  value={formData.status || 'Đang học'}
                  onChange={(val) => setFormData((p) => ({ ...p, status: String(val) }))}
                  options={[
                    { value: 'Đang học', label: 'Đang học' },
                    { value: 'Đã nghỉ', label: 'Đã nghỉ' },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Trường đang học:</label>
                <VietnameseInput
                  value={formData.school || ''}
                  onValueChange={(val) => setFormData((p) => ({ ...p, school: val }))}
                  placeholder="Ví dụ: THCS Trưng Vương"
                  className="w-full bg-[#13192c] border border-[#232e4d] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 font-bold focus:outline-none focus:border-[#5c36f5]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Ngày nhập học:</label>
                <CustomDatePicker
                  value={formData.enroll_date || ''}
                  onChange={(val) => setFormData((p) => ({ ...p, enroll_date: val }))}
                  placeholder="Chọn ngày nhập học"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: PHỤ HUYNH */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5 pb-1 border-b border-white/5">
              <Phone size={14} />
              <span>2. Thông Tin Phụ Huynh & Liên Hệ</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Họ tên Bố:</label>
                <VietnameseInput
                  value={formData.father_name || ''}
                  onValueChange={(val) => setFormData((p) => ({ ...p, father_name: val }))}
                  placeholder="Ví dụ: Nguyễn Văn Nam"
                  className="w-full bg-[#13192c] border border-[#232e4d] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 font-bold focus:outline-none focus:border-[#5c36f5]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Số điện thoại Bố:</label>
                <input
                  type="text"
                  value={formData.father_phone || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, father_phone: e.target.value }))}
                  placeholder="Ví dụ: 0912345678"
                  className="w-full bg-[#13192c] border border-[#232e4d] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 font-bold focus:outline-none focus:border-[#5c36f5]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Họ tên Mẹ:</label>
                <VietnameseInput
                  value={formData.mother_name || ''}
                  onValueChange={(val) => setFormData((p) => ({ ...p, mother_name: val }))}
                  placeholder="Ví dụ: Trần Thị Lan"
                  className="w-full bg-[#13192c] border border-[#232e4d] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 font-bold focus:outline-none focus:border-[#5c36f5]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Số điện thoại Mẹ:</label>
                <input
                  type="text"
                  value={formData.mother_phone || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, mother_phone: e.target.value }))}
                  placeholder="Ví dụ: 0987654321"
                  className="w-full bg-[#13192c] border border-[#232e4d] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 font-bold focus:outline-none focus:border-[#5c36f5]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Địa chỉ thường trú:</label>
              <VietnameseInput
                value={formData.address || ''}
                onValueChange={(val) => setFormData((p) => ({ ...p, address: val }))}
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                className="w-full bg-[#13192c] border border-[#232e4d] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 font-bold focus:outline-none focus:border-[#5c36f5]"
              />
            </div>
          </div>

          {/* SECTION 3: TÀI KHOẢN HỆ THỐNG */}
          <div className="space-y-3.5 bg-[#101526] p-4 rounded-xl border border-indigo-500/20">
            <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5 pb-1 border-b border-white/5">
              <KeyRound size={14} />
              <span>3. Tài Khoản Đăng Nhập Hệ Thống (Student App Account)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Tên đăng nhập:</label>
                <input
                  type="text"
                  value={formData.account_username || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, account_username: e.target.value.trim().toLowerCase() }))}
                  placeholder={editingStudent?.id ? `hs_${String(editingStudent.id).padStart(4, '0')}` : 'Tự động tạo (hs_XXXX)'}
                  className="w-full bg-[#161c30] border border-[#2c385d] rounded-xl px-3.5 py-2 text-xs text-indigo-300 font-mono font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {editingStudent ? 'Mật khẩu mới (Nếu đổi):' : 'Mật khẩu khởi tạo:'}
                </label>
                <input
                  type="password"
                  value={formData.account_password || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, account_password: e.target.value }))}
                  placeholder={editingStudent ? 'Để trống nếu giữ nguyên' : 'Mặc định: 123456'}
                  className="w-full bg-[#161c30] border border-[#2c385d] rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Trạng thái TK:</label>
                <CustomSelect
                  value={formData.account_status || (formData.status !== 'Đã nghỉ' ? 'Hoạt động' : 'Tạm khóa')}
                  onChange={(val) => setFormData((p) => ({ ...p, account_status: String(val) }))}
                  options={[
                    { value: 'Hoạt động', label: 'Hoạt động' },
                    { value: 'Tạm khóa', label: 'Tạm khóa' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: GHI CHÚ */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Ghi chú thêm về học sinh:</label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Đặc điểm học lực, tính cách, lưu ý sức khỏe..."
              className="w-full bg-[#13192c] border border-[#232e4d] rounded-xl p-3 text-xs text-white placeholder:text-slate-500 font-medium focus:outline-none focus:border-[#5c36f5]"
            />
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            {editingStudent && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(editingStudent)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-black border border-rose-500/30 transition cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Xóa học sinh</span>
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
                <span>{editingStudent ? 'Lưu Thay Đổi' : 'Thêm Học Sinh'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
