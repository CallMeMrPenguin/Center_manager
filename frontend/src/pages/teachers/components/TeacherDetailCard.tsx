import React, { useState } from 'react';
import { 
  UserCheck, Edit3, KeyRound, AlertCircle, Eye, EyeOff 
} from 'lucide-react';
import { TeacherCM } from '../../../types';
import { getCurrentUser } from '../../../utils/authUtils';

interface TeacherDetailCardProps {
  teacher: TeacherCM;
  onEdit: () => void;
}

export const TeacherDetailCard: React.FC<TeacherDetailCardProps> = ({ teacher, onEdit }) => {
  const [showPassword, setShowPassword] = useState(false);
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'admin';

  const initial = teacher.full_name?.trim() ? teacher.full_name.trim().charAt(0).toUpperCase() : 'G';
  const username = teacher.account_username || `gv_${(teacher.id || 0).toString().padStart(4, '0')}`;
  const accountStatus = teacher.account_status || 'Hoạt động';
  const accountRole = teacher.account_role || teacher.role || 'Giáo viên';
  const plainPassword = teacher.account_plain_password || teacher.account_password || '123456';

  return (
    <div className="bg-slate-50/70 dark:bg-[#0c0f1e] px-6 py-4.5 border-l-4 border-l-blue-600 dark:border-l-indigo-500 border-t border-slate-200 dark:border-[#212c4b] space-y-3.5 font-sans">
      {/* Top Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3.5">
          {/* Avatar Icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center text-white font-black text-base shadow-sm shrink-0 border border-white/20">
            {initial}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {teacher.full_name}
              </h3>
              <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg ${
                teacher.role === 'Giáo viên'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-[#1e2540] dark:text-[#a5b4fc]'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-[#132a22] dark:text-[#34d399]'
              }`}>
                {teacher.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              {teacher.phone ? `SĐT: ${teacher.phone}` : 'Chưa cập nhật số điện thoại'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-sm transition cursor-pointer"
        >
          <Edit3 size={13} />
          <span>Sửa thông tin</span>
        </button>
      </div>

      {/* 2-Column Information (Clean divided layout, zero card-in-card) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-white/10">
        {/* Column 1: Personnel Info */}
        <div className="space-y-2.5 pb-2 md:pb-0 md:pr-4">
          <h4 className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
            <UserCheck size={12} />
            <span>Thông Tin Nhân Sự</span>
          </h4>
          <div className="space-y-2 text-slate-700 dark:text-slate-300 font-semibold">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Vai trò chuyên môn:</span>
              <span className="font-bold text-slate-900 dark:text-white">{teacher.role}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Số điện thoại:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {teacher.phone ? (
                  <a href={`tel:${teacher.phone}`} className="text-indigo-600 dark:text-cyan-400 hover:underline">
                    {teacher.phone}
                  </a>
                ) : (
                  '-'
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Ngày sinh:</span>
              <span className="font-bold text-slate-900 dark:text-white">{teacher.date_of_birth || '-'}</span>
            </div>
          </div>
        </div>

        {/* Column 2: App Login Account */}
        <div className="space-y-2.5 pt-3 md:pt-0 md:pl-4">
          <h4 className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
            <KeyRound size={12} />
            <span>Tài Khoản Đăng Nhập App</span>
          </h4>
          <div className="space-y-2 text-slate-700 dark:text-slate-300 font-semibold">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Tên đăng nhập:</span>
              <span className="font-mono font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 px-2.5 py-0.5 rounded-md">
                {username}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Mật khẩu:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                  {showPassword ? plainPassword : '••••••'}
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition cursor-pointer"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Quyền hạn TK:</span>
              <span className="font-bold text-slate-900 dark:text-white">{accountRole}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Trạng thái TK:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                accountStatus === 'Hoạt động' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
              }`}>
                {accountStatus}
              </span>
            </div>
            {teacher.account_last_login && (
              <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-200 dark:border-white/5">
                <span>Đăng nhập cuối:</span>
                <span>{teacher.account_last_login}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      {teacher.notes && (
        <div className="pt-2 border-t border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
          <AlertCircle size={13} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <strong className="text-slate-800 dark:text-white">Ghi chú:</strong> {teacher.notes}
          </div>
        </div>
      )}
    </div>
  );
};
