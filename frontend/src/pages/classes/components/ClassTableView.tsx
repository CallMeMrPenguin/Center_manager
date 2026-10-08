import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit3, ArrowRight, User } from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import { ClassItem, getClassColor, hexToRGBA } from '../types';

interface ClassTableViewProps {
  classes: ClassItem[];
  loading: boolean;
  onSelectClass: (cls: ClassItem) => void;
  onEditClass: (cls: ClassItem) => void;
}

export const ClassTableView: React.FC<ClassTableViewProps> = ({
  classes,
  loading,
  onSelectClass,
  onEditClass,
}) => {
  const columns = useMemo<ColumnDef<ClassItem>[]>(
    () => [
      {
        id: 'stt',
        header: () => <div className="text-center w-full">STT</div>,
        size: 55,
        cell: ({ row }) => (
          <div className="text-center font-bold text-slate-600 dark:text-slate-400 text-xs">
            {row.index + 1}
          </div>
        ),
      },
      {
        accessorKey: 'class_name',
        header: 'Tên Lớp Học',
        cell: ({ row }) => {
          const cls = row.original;
          const color = getClassColor(cls, row.index);
          return (
            <div
              onClick={() => onSelectClass(cls)}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div
                style={{
                  backgroundColor: hexToRGBA(color, 0.18),
                  color: color,
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0"
              >
                {cls.class_name.charAt(0).toUpperCase()}
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {cls.class_name}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'grade',
        header: 'Khối Lớp',
        cell: (info) => {
          const val = info.getValue<string>();
          return (
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300">
              {val || 'Chưa phân khối'}
            </span>
          );
        },
      },
      {
        accessorKey: 'teacher_name',
        header: 'Giáo Viên Phụ Trách',
        cell: (info) => {
          const val = info.getValue<string>();
          return (
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-xs">
              <User size={13} className="text-slate-400 shrink-0" />
              <span>{val || 'Chưa phân công'}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'room',
        header: 'Phòng Học',
        cell: (info) => {
          const val = info.getValue<string>();
          return (
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {val || 'Chưa xếp phòng'}
            </span>
          );
        },
      },
      {
        accessorKey: 'student_count',
        header: 'Sĩ Số',
        cell: (info) => {
          const val = info.getValue<number>() || 0;
          return (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
              {val} học sinh
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao Tác',
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const cls = row.original;
          return (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => onSelectClass(cls)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer active:scale-95"
                title="Vào lớp học"
              >
                <span>Vào lớp</span>
                <ArrowRight size={12} />
              </button>

              <button
                type="button"
                onClick={() => onEditClass(cls)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer active:scale-95"
                title="Chỉnh sửa lớp học"
              >
                <Edit3 size={13} />
              </button>
            </div>
          );
        },
      },
    ],
    [onSelectClass, onEditClass]
  );

  return (
    <DataTable<ClassItem>
      data={classes}
      columns={columns}
      loading={loading}
      loadingMessage="Đang tải danh sách lớp học..."
      emptyMessage="Không tìm thấy lớp học nào phù hợp"
      pageSize={20}
      showPagination={true}
      enableGlobalSearch={false}
      enableColumnVisibility={true}
      enableExport={true}
      exportFilename="danh_sach_lop_hoc"
      onRowClick={onSelectClass}
    />
  );
};
