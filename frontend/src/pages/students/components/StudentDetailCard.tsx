import React from 'react';
import { 
  Phone, Home, GraduationCap, Edit3, 
  KeyRound, AlertCircle
} from 'lucide-react';
import { Student } from '../../../types';

interface StudentDetailCardProps {
  student: Student;
  onEdit: () => void;
}

export const StudentDetailCard: React.FC<StudentDetailCardProps> = ({ student, onEdit }) => {
  const initial = student.full_name?.trim() ? student.full_name.trim().charAt(0).toUpperCase() : 'H';
  const username = student.account_username || `hs_${(student.id || 0).toString().padStart(4, '0')}`;
  const accountStatus = student.account_status || (student.status !== 'Đã nghỉ' ? 'Hoạt động' : 'Tạm khóa');

  return (
    <div className="bg-white dark:bg-[#0b0f1d] rounded-2xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-4 font-sans">
      {/* Top Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3.5">
          {/* Avatar Icon */}
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-sm dark:shadow-[0_0_15px_rgba(92,54,245,0.4)] shrink-0 border border-white/20">
            {initial}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {student.full_name}
              </h3>
              {student.nickname && (
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/20 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-500/30">
                  {student.nickname}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5 flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-bold">
                {student.grade || 'Lớp 6'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-bold">
                {student.gender || 'Nam'}
              </span>
              {student.school && (
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {student.school}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-sm transition cursor-pointer"
          >
            <Edit3 size={13} />
            <span>Sửa thông tin & Tài khoản</span>
          </button>
        </div>
      </div>

      {/* 3-Column Detailed Information Grid (Clean dividers, zero card-in-card) */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-white/10 text-xs">
        {/* Column 1: Academic & Personal Info */}
        <div className="space-y-2.5 pb-4 md:pb-0 md:pr-4">
          <h4 className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
            <GraduationCap size={13} />
            <span>Học Tập & Cá Nhân</span>
          </h4>
          <div className="space-y-2 text-slate-700 dark:text-slate-300 font-semibold">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Lớp đang học:</span>
              <span className="font-bold text-slate-900 dark:text-white text-right">{student.enrolled_classes || 'Chưa xếp lớp'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Ngày sinh:</span>
              <span className="font-bold text-slate-900 dark:text-white">{student.date_of_birth || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Ngày nhập học:</span>
              <span className="font-bold text-slate-900 dark:text-white">{student.enroll_date || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Trạng thái:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                student.status === 'Đang học' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30' : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
              }`}>
                {student.status || 'Đang học'}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: Parent Contacts & Address */}
        <div className="space-y-2.5 py-4 md:py-0 md:px-4">
          <h4 className="text-[10px] font-black uppercase text-cyan-600 dark:text-cyan-400 tracking-wider flex items-center gap-1.5">
            <Phone size={13} />
            <span>Liên Hệ Phụ Huynh</span>
          </h4>
          <div className="space-y-2 text-slate-700 dark:text-slate-300 font-semibold">
            <div>
              <span className="text-slate-500 dark:text-slate-400 font-medium block text-[11px]">Bố:</span>
              <span className="text-slate-900 dark:text-white font-bold">{student.father_name || 'Chưa có thông tin'}</span>
              {student.father_phone && (
                <a href={`tel:${student.father_phone}`} className="ml-1 text-indigo-600 dark:text-cyan-400 hover:underline">
                  ({student.father_phone})
                </a>
              )}
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 font-medium block text-[11px]">Mẹ:</span>
              <span className="text-slate-900 dark:text-white font-bold">{student.mother_name || 'Chưa có thông tin'}</span>
              {student.mother_phone && (
                <a href={`tel:${student.mother_phone}`} className="ml-1 text-indigo-600 dark:text-cyan-400 hover:underline">
                  ({student.mother_phone})
                </a>
              )}
            </div>
            {student.address && (
              <div className="pt-1 border-t border-slate-200 dark:border-white/5 flex items-start gap-1">
                <Home size={12} className="text-slate-500 mt-0.5 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300 text-[11px] truncate">{student.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: System Login Account Credentials */}
        <div className="space-y-2.5 pt-4 md:pt-0 md:pl-4">
          <h4 className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
            <KeyRound size={13} />
            <span>Tài Khoản Đăng Nhập App</span>
          </h4>
          <div className="space-y-2 text-slate-700 dark:text-slate-300 font-semibold">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Tên đăng nhập:</span>
              <span className="font-mono font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/30">
                {username}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Mật khẩu:</span>
              <span className="text-slate-400 font-mono">••••••</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Trạng thái TK:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                accountStatus === 'Hoạt động' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30' : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
              }`}>
                {accountStatus}
              </span>
            </div>
            {student.account_last_login && (
              <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-200 dark:border-white/5">
                <span>Đăng nhập cuối:</span>
                <span>{student.account_last_login}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes Row */}
      {student.notes && (
        <div className="pt-3 border-t border-slate-200 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
          <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <strong className="text-slate-900 dark:text-white">Ghi chú:</strong> {student.notes}
          </div>
        </div>
      )}
    </div>
  );
};
