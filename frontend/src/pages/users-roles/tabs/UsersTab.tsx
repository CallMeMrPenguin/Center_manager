import React, { useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit3, Plus, CheckCircle2, Lock, RefreshCw, Eye, EyeOff, Users, GraduationCap, Filter } from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import { CustomSelect, SelectOption } from '../../../components/CustomSelect';
import { SegmentedControl } from '../../../components/SegmentedControl';
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
  const [subTab, setSubTab] = useState<'staff' | 'student'>('staff');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Split users into Staff/Teachers vs Students
  const staffUsers = useMemo(() => {
    return users.filter(
      (u) => u.role !== 'Học sinh' && !u.username.toLowerCase().startsWith('hs_')
    );
  }, [users]);

  const studentUsers = useMemo(() => {
    return users.filter(
      (u) => u.role === 'Học sinh' || u.username.toLowerCase().startsWith('hs_')
    );
  }, [users]);

  // Dynamic Grade & Class options for students
  const gradeOptions = useMemo<SelectOption[]>(() => {
    const rawGrades = Array.from(
      new Set(studentUsers.map((s) => s.grade).filter(Boolean))
    ) as string[];
    rawGrades.sort();
    return [
      { value: 'all', label: 'Tất cả các khối' },
      ...rawGrades.map((g) => ({
        value: g,
        label: g.startsWith('Khối') || g.startsWith('Lớp') ? g : `Khối ${g}`,
      })),
    ];
  }, [studentUsers]);

  const classOptions = useMemo<SelectOption[]>(() => {
    const rawClasses = Array.from(
      new Set(studentUsers.map((s) => s.class_name).filter(Boolean))
    ) as string[];
    rawClasses.sort();
    return [
      { value: 'all', label: 'Tất cả các lớp' },
      ...rawClasses.map((c) => ({
        value: c,
        label: c,
      })),
    ];
  }, [studentUsers]);

  // Filtered students by Grade and Class
  const filteredStudents = useMemo(() => {
    return studentUsers.filter((s) => {
      if (selectedGrade !== 'all' && s.grade !== selectedGrade) return false;
      if (selectedClass !== 'all' && s.class_name !== selectedClass) return false;
      return true;
    });
  }, [studentUsers, selectedGrade, selectedClass]);

  // Staff Table Columns
  const staffColumns = useMemo<ColumnDef<AppUser>[]>(
    () => [
      {
        accessorKey: 'display_name',
        header: 'Tên Hiển Thị',
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
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
        id: 'password',
        header: 'Mật Khẩu',
        cell: ({ row }) => {
          const u = row.original;
          const isVisible = !!visiblePasswords[u.id];
          const pwd = u.plain_password || '123456';
          return (
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {isVisible ? pwd : '••••••'}
              </span>
              <button
                type="button"
                onClick={() => setVisiblePasswords((prev) => ({ ...prev, [u.id]: !prev[u.id] }))}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                title={isVisible ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
              >
                {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          );
        },
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
          } else if (role === 'Kế toán') {
            badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30';
          } else {
            badgeClass = 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30';
          }
          return (
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-black border inline-block ${badgeClass}`}>
              {role}
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
    [onEditUser, visiblePasswords]
  );

  // Student Table Columns
  const studentColumns = useMemo<ColumnDef<AppUser>[]>(
    () => [
      {
        accessorKey: 'display_name',
        header: 'Học Sinh',
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
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
        id: 'password',
        header: 'Mật Khẩu',
        cell: ({ row }) => {
          const u = row.original;
          const isVisible = !!visiblePasswords[u.id];
          const pwd = u.plain_password || '123456';
          return (
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {isVisible ? pwd : '••••••'}
              </span>
              <button
                type="button"
                onClick={() => setVisiblePasswords((prev) => ({ ...prev, [u.id]: !prev[u.id] }))}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                title={isVisible ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
              >
                {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          );
        },
      },
      {
        accessorKey: 'class_name',
        header: 'Lớp Học',
        cell: (info) => {
          const val = info.getValue<string>();
          return val ? (
            <span className="text-xs px-2.5 py-0.5 rounded-lg font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30">
              {val}
            </span>
          ) : (
            <span className="text-xs text-slate-400 italic">Chưa xếp lớp</span>
          );
        },
      },
      {
        accessorKey: 'grade',
        header: 'Khối Lớp',
        cell: (info) => {
          const val = info.getValue<string>();
          return val ? (
            <span className="text-xs px-2.5 py-0.5 rounded-lg font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">
              {val}
            </span>
          ) : (
            <span className="text-xs text-slate-400">-</span>
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
        id: 'actions',
        header: 'Thao Tác',
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEditUser(row.original)}
              className="p-1.5 rounded-lg btn-neutral text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer border-0 shadow-2xs active:scale-95"
              title="Chỉnh sửa tài khoản học sinh"
            >
              <Edit3 size={13} />
            </button>
          </div>
        ),
      },
    ],
    [onEditUser, visiblePasswords]
  );

  return (
    <div className="space-y-4">
      {/* Category Toggle: Giáo Viên & Nhân Sự vs Học Sinh */}
      <div className="bg-white dark:bg-[#111728] border-0 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl<'staff' | 'student'>
          value={subTab}
          onChange={setSubTab}
          options={[
            {
              value: 'staff',
              label: `Giáo Viên & Nhân Sự (${staffUsers.length})`,
              icon: Users,
            },
            {
              value: 'student',
              label: `Học Sinh (${studentUsers.length})`,
              icon: GraduationCap,
            },
          ]}
          activeColor="bg-[#2563eb]"
          size="sm"
        />

        {/* Action button on right */}
        <div className="flex items-center gap-2">
          {subTab === 'student' && onSyncStudents && (
            <button
              type="button"
              onClick={onSyncStudents}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold border-0 shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50"
              title="Tự động tạo hoặc đồng bộ tài khoản cho toàn bộ học sinh"
            >
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
              <span>{syncing ? 'Đang đồng bộ...' : 'Tạo TK Cho Toàn Bộ HS'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs border-0 transition cursor-pointer active:scale-95"
            title="Thêm tài khoản mới"
          >
            <Plus size={14} />
            <span>Thêm Tài Khoản</span>
          </button>
        </div>
      </div>

      {/* Sub-view: Staff Table */}
      {subTab === 'staff' ? (
        <DataTable<AppUser>
          data={staffUsers}
          columns={staffColumns}
          loading={loading}
          loadingMessage="Đang tải danh sách tài khoản nhân sự..."
          emptyMessage="Chưa có tài khoản nhân sự nào"
          pageSize={20}
          showPagination={true}
          enableGlobalSearch={true}
          enableColumnVisibility={true}
          enableExport={true}
          exportFilename="tai_khoan_nhan_su"
          searchPlaceholder="Tìm nhân sự theo tên, vai trò..."
        />
      ) : (
        /* Sub-view: Student Table with Grade and Class Filters */
        <div className="space-y-3">
          {/* Filters Bar for Students */}
          <div className="bg-white dark:bg-[#111728] border-0 rounded-2xl p-3 shadow-sm flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
              <Filter size={13} className="text-blue-500" />
              <span>Bộ lọc học sinh:</span>
            </div>

            <div className="w-48">
              <CustomSelect
                value={selectedGrade}
                onChange={(val) => setSelectedGrade(String(val))}
                options={gradeOptions}
                placeholder="Chọn khối lớp"
              />
            </div>

            <div className="w-52">
              <CustomSelect
                value={selectedClass}
                onChange={(val) => setSelectedClass(String(val))}
                options={classOptions}
                placeholder="Chọn lớp học"
              />
            </div>

            {(selectedGrade !== 'all' || selectedClass !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedGrade('all');
                  setSelectedClass('all');
                }}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            )}

            <div className="ml-auto text-xs text-slate-500 dark:text-slate-400 font-bold">
              Hiển thị: <span className="text-slate-900 dark:text-white">{filteredStudents.length}</span> / {studentUsers.length} học sinh
            </div>
          </div>

          <DataTable<AppUser>
            data={filteredStudents}
            columns={studentColumns}
            loading={loading}
            loadingMessage="Đang tải danh sách tài khoản học sinh..."
            emptyMessage="Không tìm thấy học sinh phù hợp với bộ lọc"
            pageSize={20}
            showPagination={true}
            enableGlobalSearch={true}
            enableColumnVisibility={true}
            enableExport={true}
            exportFilename="tai_khoan_hoc_sinh"
            searchPlaceholder="Tìm học sinh theo tên, lớp..."
          />
        </div>
      )}
    </div>
  );
};
