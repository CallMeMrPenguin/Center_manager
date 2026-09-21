import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit3 } from 'lucide-react';
import { Student } from '../../../types';

export const createStudentColumns = (
  handleOpenEdit: (student: Student) => void
): ColumnDef<Student>[] => [
  {
    id: 'stt',
    header: () => <div className="text-center w-full">STT</div>,
    size: 55,
    cell: ({ row }) => (
      <div className="text-center font-extrabold text-slate-700 dark:text-slate-300 text-sm sm:text-base">
        {row.index + 1}
      </div>
    ),
  },
  {
    id: 'name',
    accessorKey: 'full_name',
    header: 'Họ và Tên',
    cell: ({ row }) => {
      const st = row.original;
      const initial = st.full_name?.trim() ? st.full_name.trim().charAt(0).toUpperCase() : 'H';
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-[#1b2344] dark:border-[#2d3b6f] dark:text-[#a5b4fc] flex items-center justify-center font-black text-xs shrink-0 shadow-inner">
            {initial}
          </div>
          <div className="font-extrabold text-slate-900 dark:text-white text-base">
            <span>{st.full_name}</span>
            {st.nickname && (
              <span className="ml-1.5 text-xs text-indigo-700 dark:text-indigo-400 font-bold">({st.nickname})</span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: 'account',
    header: 'Tài Khoản App',
    cell: ({ row }) => {
      const st = row.original;
      const username = st.account_username || `hs_${String(st.id || 0).padStart(4, '0')}`;
      return (
        <span className="font-mono text-xs font-black text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-500/25">
          {username}
        </span>
      );
    },
  },
  {
    id: 'classes',
    accessorKey: 'enrolled_classes',
    header: 'Lớp Học',
    cell: ({ row }) => {
      const classes = row.original.enrolled_classes;
      return classes ? (
        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-50 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
          {classes}
        </span>
      ) : (
        <span className="text-slate-500 dark:text-slate-400 text-xs font-bold">Chưa xếp lớp</span>
      );
    },
  },
  {
    id: 'grade',
    accessorKey: 'grade',
    header: 'Khối',
    size: 80,
    cell: ({ row }) => (
      <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-black bg-slate-100 dark:bg-[#222b48] text-slate-800 dark:text-indigo-300 border border-slate-300 dark:border-indigo-500/20">
        {row.original.grade || 'Lớp 6'}
      </span>
    ),
  },
  {
    id: 'gender',
    accessorKey: 'gender',
    header: 'Giới Tính',
    size: 90,
    cell: ({ row }) => (
      <span className="text-slate-800 dark:text-slate-200 text-sm font-bold">
        {row.original.gender || 'Nam'}
      </span>
    ),
  },
  {
    id: 'dob',
    accessorKey: 'date_of_birth',
    header: 'Ngày Sinh',
    cell: (info) => (
      <span className="text-slate-800 dark:text-slate-200 text-sm font-bold font-mono">
        {info.getValue<string>() || '-'}
      </span>
    ),
  },
  {
    id: 'parents',
    header: 'Phụ Huynh',
    cell: ({ row }) => {
      const st = row.original;
      return (
        <div className="text-slate-800 dark:text-slate-200 text-xs font-bold leading-relaxed">
          {st.father_phone && <div>Bố: {st.father_phone}</div>}
          {st.mother_phone && <div>Mẹ: {st.mother_phone}</div>}
          {!st.father_phone && !st.mother_phone && <span className="text-slate-500">-</span>}
        </div>
      );
    },
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: () => <div className="text-center w-full">Trạng Thái</div>,
    size: 110,
    cell: (info) => {
      const st = info.getValue<string>();
      return (
        <div className="text-center">
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-black border ${
            st === 'Đang học'
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
          }`}>
            {st || 'Đang học'}
          </span>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-center w-full">Thao Tác</div>,
    size: 80,
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={() => handleOpenEdit(row.original)}
          className="p-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-white/5 dark:hover:bg-[#5c36f5]/20 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300 border border-slate-300 dark:border-transparent transition cursor-pointer"
          title="Sửa thông tin học sinh"
        >
          <Edit3 size={15} />
        </button>
      </div>
    ),
  },
];
