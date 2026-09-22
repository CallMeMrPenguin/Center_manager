import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit3 } from 'lucide-react';
import { ClassSession, getSessionColor, calcEndTime } from '../types';

export function useScheduleColumns(onEdit: (sess: ClassSession) => void) {
  return useMemo<ColumnDef<ClassSession>[]>(() => [
    {
      accessorKey: 'date',
      header: 'Ngày Học',
      cell: (info) => <span className="font-bold text-slate-900 dark:text-white text-base">{info.getValue<string>()}</span>,
    },
    {
      accessorKey: 'class_name',
      header: 'Lớp Học',
      cell: ({ row }) => {
        const s = row.original;
        const hex = getSessionColor(s);
        return <span className="font-extrabold text-base" style={{ color: hex }}>{s.class_name}</span>;
      },
    },
    {
      id: 'time',
      header: 'Giờ / Thời Lượng',
      cell: ({ row }) => {
        const s = row.original;
        return (
          <span className="text-slate-800 dark:text-slate-200 text-base font-semibold">
            {s.start_time} – {calcEndTime(s.start_time, s.duration)} ({s.duration}p)
          </span>
        );
      },
    },
    {
      accessorKey: 'teacher_name',
      header: 'Giáo Viên',
      cell: (info) => <span className="text-slate-700 dark:text-slate-300 text-base font-semibold">{info.getValue<string>() || 'Mặc định'}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Trạng Thái',
      cell: (info) => {
        const st = info.getValue<string>();
        return (
          <span className={`inline-block px-2.5 py-0.5 rounded-xl text-xs font-black border-0 shadow-2xs ${
            st === 'Đã học'
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : st === 'Hủy'
              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
              : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
          }`}>
            {st}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-center w-full">Thao Tác</div>,
      size: 70,
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => onEdit(row.original)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition cursor-pointer border-0 shadow-2xs hover:shadow-xs"
            title="Sửa buổi học"
          >
            <Edit3 size={13} />
          </button>
        </div>
      ),
    },
  ], [onEdit]);
}
