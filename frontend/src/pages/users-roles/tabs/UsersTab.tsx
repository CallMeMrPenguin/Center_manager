import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit3, Plus, Shield, User, CheckCircle2, Lock, UserPlus, RefreshCw } from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import { AppUser } from '../types';

interface UsersTabProps {
  users: AppUser[];
  loading: boolean;
  syncing?: boolean;
  onSyncStudents?: () => void;
  onEditUser: (user: AppUser) => void;
  onOpenCreateModal: () => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  users,
  loading,
  syncing = false,
  onSyncStudents,
  onEditUser,
  onOpenCreateModal,
}) => {

  const columns = useMemo<ColumnDef<AppUser>[]>(
    () => [
      {
        accessorKey: 'display_name',
        header: 'Tên Hiển Thị',
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-0 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
              {row.original.display_name.charAt(0).toUpperCase()}
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">
              {row.original.display_name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'username',
        header: 'Tên Đăng Nhập',
        cell: (info) => (
          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
            @{info.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Vai Trò',
        cell: (info) => {
          const role = info.getValue<string>();
          let badgeClass = 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30';
          if (role === 'Quản trị viên') {
            badgeClass = 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30';
          } else if (role === 'Giáo viên') {
            badgeClass = 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30';
          } else if (role === 'Trợ giảng') {
            badgeClass = 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30';
          } else if (role === 'Học sinh') {
            badgeClass = 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30';
          } else if (role === 'Kế toán') {
            badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30';
          }
          return (
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-black border inline-flex items-center gap-1 ${badgeClass}`}>
              <Shield size={11} />
              <span>{role}</span>
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        cell: (info) => {
          const status = info.getValue<string>();
          const isActive = status === 'Hoạt động';
          return (
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-black inline-flex items-center gap-1 border ${
                isActive
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                  : 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
              }`}
            >
              {isActive ? <CheckCircle2 size={12} /> : <Lock size={12} />}
              <span>{status || 'Hoạt động'}</span>
            </span>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Ngày Tạo',
        cell: (info) => {
          const val = info.getValue<string>();
          return (
            <span className="text-xs text-slate-600 dark:text-slate-400 font-bold font-mono">
              {val ? val.slice(0, 10) : '-'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao Tác',
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            {/* Single Pen Action: Edit and Delete inside Modal */}
            <button
              type="button"
              onClick={() => onEditUser(row.original)}
              className="p-1.5 rounded-lg btn-neutral text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer border-0 shadow-2xs active:scale-95"
              title="Chỉnh sửa tài khoản"
            >
              <Edit3 size={13} />
            </button>
          </div>
        ),
      },
    ],
    [onEditUser]
  );

  return (
    <div className="space-y-4">
      <DataTable<AppUser>
        data={users}
        columns={columns}
        loading={loading}
        loadingMessage="Đang tải danh sách tài khoản..."
        emptyMessage="Chưa có tài khoản nào được tạo"
        pageSize={20}
        showPagination={true}
        enableGlobalSearch={true}
        enableColumnVisibility={true}
        enableExport={true}
        exportFilename="danh_sach_tai_khoan"
        searchPlaceholder="Tìm kiếm tài khoản theo tên, vai trò..."
        toolbarRight={
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {onSyncStudents && (
              <button
                type="button"
                onClick={onSyncStudents}
                disabled={syncing}
                className="group flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold border-0 shadow-xs transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                title="Tự động tạo hoặc đồng bộ tài khoản cho toàn bộ học sinh"
              >
                <RefreshCw size={13} className={`${syncing ? 'animate-spin' : ''} shrink-0`} />
                <span className="max-w-0 opacity-0 group-hover:max-w-[180px] group-hover:opacity-100 xl:max-w-none xl:opacity-100 transition-all duration-200 ease-in-out whitespace-nowrap overflow-hidden inline-block">
                  {syncing ? 'Đang đồng bộ...' : 'Tạo TK Cho Toàn Bộ HS'}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="group flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs border-0 transition-all duration-200 cursor-pointer active:scale-95 shrink-0"
              title="Thêm tài khoản mới"
            >
              <Plus size={14} className="shrink-0" />
              <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 lg:max-w-none lg:opacity-100 transition-all duration-200 ease-in-out whitespace-nowrap overflow-hidden inline-block">
                Thêm Tài Khoản
              </span>
            </button>
          </div>
        }
      />
    </div>
  );
};


