import React from 'react';
import { 
  UserCheck, Phone, Calendar, Edit3, Shield, KeyRound, Clock, AlertCircle 
} from 'lucide-react';
import { TeacherCM } from '../../../types';

interface TeacherDetailCardProps {
  teacher: TeacherCM;
  onEdit: () => void;
}

export const TeacherDetailCard: React.FC<TeacherDetailCardProps> = ({ teacher, onEdit }) => {
  const initial = teacher.full_name?.trim() ? teacher.full_name.trim().charAt(0).toUpperCase() : 'G';
  const username = teacher.account_username || `gv_${(teacher.id || 0).toString().padStart(4, '0')}`;
  const accountStatus = teacher.account_status || 'Hoạt động';
  const accountRole = teacher.account_role || teacher.role || 'Giáo viên';

  return (
    <div className="bg-[#0b0f1d] border border-[#1e2746] rounded-2xl p-5 shadow-2xl space-y-4 animate-fade-in font-sans">
      {/* Top Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3.5">
          {/* Avatar Icon */}
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center text-white font-black text-lg shadow-[0_0_15px_rgba(92,54,245,0.4)] shrink-0 border border-white/20">
            {initial}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">
                {teacher.full_name}
              </h3>
              <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg border ${
                teacher.role === 'Giáo viên'
                  ? 'bg-[#1e2540] border-[#343e68] text-[#a5b4fc]'
                  : 'bg-[#132a22] border-[#059669] text-[#34d399]'
              }`}>
                {teacher.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              {teacher.phone ? `SĐT: ${teacher.phone}` : 'Chưa cập nhật số điện thoại'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#5c36f5] hover:bg-[#6e4af7] text-white text-xs font-black shadow-[0_0_14px_rgba(92,54,245,0.45)] transition cursor-pointer"
        >
          <Edit3 size={13} />
          <span>Sửa thông tin & Tài khoản</span>
        </button>
      </div>

      {/* 2-Column Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Column 1: Personnel Info */}
        <div className="bg-[#101526] p-3.5 rounded-xl border border-white/5 space-y-2.5">
          <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
            <UserCheck size={12} />
            <span>Thông Tin Nhân Sự</span>
          </h4>
          <div className="space-y-1.5 text-slate-300 font-semibold">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Vai trò chuyên môn:</span>
              <span className="font-bold text-white">{teacher.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Số điện thoại:</span>
              <span className="font-bold text-white">
                {teacher.phone ? (
                  <a href={`tel:${teacher.phone}`} className="text-cyan-400 hover:underline">
                    {teacher.phone}
                  </a>
                ) : (
                  '-'
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Ngày sinh:</span>
              <span className="font-bold text-white">{teacher.date_of_birth || '-'}</span>
            </div>
          </div>
        </div>

        {/* Column 2: App Login Account */}
        <div className="bg-[#101526] p-3.5 rounded-xl border border-white/5 space-y-2.5">
          <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
            <KeyRound size={12} />
            <span>Tài Khoản Đăng Nhập App</span>
          </h4>
          <div className="space-y-1.5 text-slate-300 font-semibold">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Tên đăng nhập:</span>
              <span className="font-mono font-black text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-md border border-indigo-500/30">
                {username}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Quyền hạn TK:</span>
              <span className="font-bold text-white">{accountRole}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Trạng thái TK:</span>
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-black ${
                accountStatus === 'Hoạt động' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {accountStatus}
              </span>
            </div>
            {teacher.account_last_login && (
              <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-white/5">
                <span>Đăng nhập cuối:</span>
                <span>{teacher.account_last_login}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      {teacher.notes && (
        <div className="bg-[#141a2e] px-4 py-2.5 rounded-xl border border-white/5 text-xs text-slate-300 flex items-start gap-2">
          <AlertCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <strong className="text-white">Ghi chú:</strong> {teacher.notes}
          </div>
        </div>
      )}
    </div>
  );
};
