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
            <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0">
              {row.original.display_name.charAt(0).toUpperCase()}
            </div>
            <span className="font-bold text-slate-100">
              {row.original.display_name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'username',
        header: 'Tên Đăng Nhập',
        cell: (info) => (
          <span className="font-mono text-xs font-semibold text-slate-300">
            @{info.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Vai Trò',
        cell: (info) => {
          const role = info.getValue<string>();
          let badgeClass = 'bg-slate-500/15 text-slate-300 border-slate-500/30';
          if (role === 'Quản trị viên') {
            badgeClass = 'bg-purple-500/15 text-purple-300 border-purple-500/30';
          } else if (role === 'Giáo viên') {
            badgeClass = 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
          } else if (role === 'Trợ giảng') {
            badgeClass = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
          } else if (role === 'Học sinh') {
            badgeClass = 'bg-teal-500/15 text-teal-300 border-teal-500/30';
          } else if (role === 'Kế toán') {
            badgeClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
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
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
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
            <span className="text-xs text-slate-400 font-medium">
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
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer border border-white/5 active:scale-95"
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
          <div className="flex items-center gap-2">
            {onSyncStudents && (
              <button
                type="button"
                onClick={onSyncStudents}
                disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 hover:text-white text-xs font-bold border border-teal-500/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
                title="Tự động tạo hoặc đồng bộ tài khoản cho toàn bộ học sinh"
              >
                <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                <span>{syncing ? 'Đang đồng bộ...' : 'Tạo TK Cho Toàn Bộ HS'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#6c48f7] text-white text-xs font-black shadow-[0_0_12px_rgba(92,54,245,0.4)] transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Plus size={14} />
              <span>Thêm Tài Khoản</span>
            </button>
          </div>
        }
      />
    </div>
  );
};


