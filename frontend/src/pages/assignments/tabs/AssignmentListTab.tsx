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
              className="px-3.5 py-1.5 rounded-xl bg-[#5c36f5] hover:bg-[#6c48f7] text-white text-xs font-black shadow-[0_0_12px_rgba(92,54,245,0.4)] transition cursor-pointer active:scale-95"
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
        cell: (info) => <span className="font-bold text-slate-200">{info.getValue<string>()}</span>,
      },
      {
        accessorKey: 'class_name',
        header: 'Lớp Học',
        cell: (info) => <span className="font-semibold text-slate-300">{info.getValue<string>() || '-'}</span>,
      },
      {
        accessorKey: 'title',
        header: 'Tiêu Đề Bài Tập',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline block">
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
          return <span className={`font-semibold ${isOverdue ? 'text-rose-400' : 'text-slate-300'}`}>{val}</span>;
        },
      },
      {
        accessorKey: 'submitted_count',
        header: 'Đã Nộp / Sĩ Số',
        cell: ({ row }) => {
          const submitted = row.original.submitted_count || 0;
          const total = row.original.total_enrolled || 0;
          const rate = row.original.submission_rate || 0;
          return (
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-200">{submitted}/{total}</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                rate >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : rate >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>{rate}%</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'avg_score',
        header: 'Điểm TB',
        cell: (info) => {
          const val = info.getValue<number | null>();
          return <span className="font-mono font-bold text-indigo-400">{val !== null && val !== undefined ? val.toFixed(1) : '-'}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao Tác',
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPlayPreview(row.original);
              }}
              className="px-3 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-white text-xs font-black border border-indigo-500/30 transition cursor-pointer active:scale-95"
              title="Xem trước đề & chỉnh sửa key"
            >
              Preview
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditAssignment(row.original);
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#6c48f7] text-white text-xs font-bold shadow-lg cursor-pointer transition active:scale-95"
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
