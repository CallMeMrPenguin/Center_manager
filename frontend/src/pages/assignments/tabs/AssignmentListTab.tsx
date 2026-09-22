import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit3, Plus } from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import { Assignment } from '../types';

interface AssignmentListTabProps {
  assignments: Assignment[];
  loading: boolean;
  isStudent?: boolean;
  onEditAssignment: (assignment: Assignment) => void;
  onViewSubmissions: (assignment: Assignment) => void;
  onPlayPreview: (assignment: Assignment) => void;
  onOpenCreateModal: () => void;
}

export const AssignmentListTab: React.FC<AssignmentListTabProps> = ({
  assignments,
  loading,
  isStudent = false,
  onEditAssignment,
  onViewSubmissions,
  onPlayPreview,
  onOpenCreateModal,
}) => {
  const columns = useMemo<ColumnDef<Assignment>[]>(() => {
    // Student View: Simple list with only title, due date, status and single "Vào Làm Bài" action button
    if (isStudent) {
      return [
        {
          accessorKey: 'assigned_date',
          header: 'Ngày Giao',
          cell: (info) => <span className="font-bold text-slate-300 text-xs">{info.getValue<string>()}</span>,
        },
        {
          accessorKey: 'title',
          header: 'Tên Bài Tập',
          cell: ({ row }) => (
            <div className="space-y-0.5">
              <span className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline block text-sm">
                {row.original.title}
              </span>
              {row.original.description && (
                <span className="text-[11px] text-slate-400 line-clamp-1 block">{row.original.description}</span>
              )}
            </div>
          ),
        },
        {
          accessorKey: 'due_date',
          header: 'Hạn Nộp',
          cell: (info) => {
            const val = info.getValue<string>();
            const today = new Date().toISOString().slice(0, 10);
            const isOverdue = val < today;
            return (
              <span className={`text-xs font-semibold ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                {val}
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
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPlayPreview(row.original);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-sm transition cursor-pointer active:scale-95"
            >
              Vào Làm Bài
            </button>
          ),
        },
      ];
    }

    // Teacher / Admin View
    return [
      {
        accessorKey: 'assigned_date',
        header: 'Ngày Giao',
        cell: (info) => <span className="font-bold text-slate-800 dark:text-slate-200">{info.getValue<string>()}</span>,
      },
      {
        accessorKey: 'class_name',
        header: 'Lớp Học',
        cell: (info) => <span className="font-semibold text-slate-700 dark:text-slate-300">{info.getValue<string>() || '-'}</span>,
      },
      {
        accessorKey: 'title',
        header: 'Tiêu đề',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline block">
              {row.original.title}
            </span>
            {row.original.description && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 block">{row.original.description}</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'due_date',
        header: 'Hạn Nộp',
        cell: (info) => {
          const val = info.getValue<string>();
          const today = new Date().toISOString().slice(0, 10);
          const isOverdue = val < today;
          return <span className={`font-bold ${isOverdue ? 'text-rose-700 dark:text-rose-400 font-extrabold' : 'text-slate-900 dark:text-slate-300'}`}>{val}</span>;
        },
      },
      {
        accessorKey: 'submitted_count',
        header: 'Đã nộp',
        cell: ({ row }) => {
          const submitted = row.original.submitted_count || 0;
          const total = row.original.total_enrolled || 0;
          return (
            <div className="flex items-center justify-center">
              <span className="font-extrabold text-slate-900 dark:text-slate-100 font-mono text-sm">{submitted}/{total}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'avg_score',
        header: 'Trung bình',
        cell: (info) => {
          const val = info.getValue<number | null>();
          return <span className="font-mono font-black text-base text-indigo-700 dark:text-indigo-400">{val !== null && val !== undefined ? val.toFixed(1) : '-'}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao Tác',
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditAssignment(row.original);
              }}
              className="p-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-0 shadow-2xs hover:shadow-xs transition cursor-pointer"
              title="Chỉnh sửa hoặc xóa bài tập"
            >
              <Edit3 size={15} />
            </button>
          </div>
        ),
      },
    ];
  }, [isStudent, onPlayPreview, onEditAssignment]);

  return (
    <DataTable<Assignment>
      data={assignments}
      columns={columns}
      loading={loading}
      pageSize={20}
      exportFilename="danh_sach_bai_tap_venha"
      searchPlaceholder={isStudent ? 'Tìm bài tập...' : 'Tìm theo tiêu đề, lớp học...'}
      onRowClick={(row) => {
        if (isStudent) {
          onPlayPreview(row);
        } else {
          onViewSubmissions(row);
        }
      }}
      emptyMessage={
        <div className="py-12 text-center space-y-3">
          <p className="text-slate-400 text-sm">Chưa có bài tập nào trong danh sách.</p>
          {!isStudent && (
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm cursor-pointer transition active:scale-95"
            >
              <Plus size={14} />
              <span>Giao Bài Tập Đầu Tiên</span>
            </button>
          )}
        </div>
      }
    />
  );
};
