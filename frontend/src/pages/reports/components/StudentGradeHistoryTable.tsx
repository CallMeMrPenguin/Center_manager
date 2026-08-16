import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { History, Edit3 } from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import { formatFullDate } from '../utils';
import { format1Dec } from '../../../utils';

interface StudentGradeHistoryTableProps {
  loading: boolean;
  sessionRecords: any[];
  selectedStudentObj: any;
  stats: { sessionCount: number };
  onOpenEditModal: (record: any) => void;
  hasSelectedStudent: boolean;
}

export const StudentGradeHistoryTable: React.FC<StudentGradeHistoryTableProps> = ({
  loading,
  sessionRecords,
  selectedStudentObj,
  stats,
  onOpenEditModal,
  hasSelectedStudent,
}) => {
  const historyColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'stt',
      header: () => <div className="text-center w-full">STT</div>,
      meta: { headerText: 'STT', exportValue: (_: any, idx: number) => idx + 1 },
      cell: ({ row }) => <div className="text-center font-bold text-slate-400">{row.index + 1}</div>,
      enableSorting: false,
      enableGlobalFilter: false,
    },
    {
      accessorKey: 'date',
      header: 'Thời Gian',
      meta: { headerText: 'Thời Gian', exportValue: (r: any) => formatFullDate(r.date) },
      cell: (info) => (
        <span className="font-mono text-base font-bold text-indigo-300">
          {formatFullDate(info.getValue<string>())}
        </span>
      ),
    },
    {
      accessorKey: 'class_name',
      header: 'Lớp Học',
      meta: { headerText: 'Lớp Học', exportValue: (r: any) => r.class_name || 'Lớp học' },
      cell: (info) => (
        <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#1c2442] text-slate-300 border border-[#303d68]">
          {info.getValue<string>() || 'Lớp học'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-center w-full">Điểm Danh</div>,
      meta: { headerText: 'Điểm Danh', exportValue: (r: any) => r.status || 'Có mặt' },
      cell: ({ getValue }) => {
        const st = getValue<string>() || 'Có mặt';
        const isAbsent = st.includes('Vắng') || st.includes('Nghỉ');
        return (
          <div className="text-center">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold ${isAbsent ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
              {st}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'check_1',
      header: () => <div className="text-center w-full">Check 1</div>,
      meta: { headerText: 'Check 1', exportValue: (r: any) => Number(r.check_1) > 0 ? format1Dec(Number(r.check_1)) : '-' },
      cell: (info) => {
        const val = Number(info.getValue()) || 0;
        return <div className="text-center font-extrabold text-blue-400 font-mono text-base">{val > 0 ? format1Dec(val) : '-'}</div>;
      },
    },
    {
      accessorKey: 'check_2',
      header: () => <div className="text-center w-full">Check 2</div>,
      meta: { headerText: 'Check 2', exportValue: (r: any) => Number(r.check_2) > 0 ? format1Dec(Number(r.check_2)) : '-' },
      cell: (info) => {
        const val = Number(info.getValue()) || 0;
        return <div className="text-center font-extrabold text-purple-400 font-mono text-base">{val > 0 ? format1Dec(val) : '-'}</div>;
      },
    },
    {
      accessorKey: 'homework',
      header: () => <div className="text-center w-full">Homework</div>,
      meta: { headerText: 'Homework', exportValue: (r: any) => Number(r.homework) > 0 ? format1Dec(Number(r.homework)) : '-' },
      cell: (info) => {
        const val = Number(info.getValue()) || 0;
        return <div className="text-center font-extrabold text-emerald-400 font-mono text-base">{val > 0 ? format1Dec(val) : '-'}</div>;
      },
    },
    {
      accessorKey: 'notes',
      header: 'Ghi Chú',
      meta: { headerText: 'Ghi Chú', exportValue: (r: any) => r.notes || '-' },
      cell: (info) => <span className="text-xs text-slate-400 truncate max-w-xs block">{info.getValue<string>() || '-'}</span>,
    },
    {
      id: 'actions',
      header: () => <div className="text-center w-full">Thao Tác</div>,
      meta: { headerText: 'Thao Tác' },
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => (
        <div className="text-center">
          <button
            onClick={(e) => { e.stopPropagation(); onOpenEditModal(row.original); }}
            className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition cursor-pointer border border-indigo-500/20 inline-flex items-center gap-1 text-[11px] font-bold"
            title="Sửa điểm buổi học này"
          >
            <Edit3 size={12} />
            <span>Sửa</span>
          </button>
        </div>
      ),
    },
  ], [onOpenEditModal]);

  return (
    <div className={`bg-[#0d1120] border border-[#1d2644] rounded-2xl flex flex-col shadow-2xl mb-8 ${hasSelectedStudent ? 'animate-cascade-5' : 'animate-cascade-4'}`}>
      <div className="px-5 py-4 border-b border-[#181f36] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <History size={18} className="text-indigo-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            {selectedStudentObj
              ? `LỊCH SỬ ĐIỂM SỐ & ĐIỂM DANH — HỌC SINH: ${selectedStudentObj.full_name.toUpperCase()}`
              : `LỊCH SỬ ĐIỂM SỐ CHI TIẾT TẤT CẢ BUỔI HỌC (${sessionRecords.length} BẢN GHI)`
            }
          </h3>
        </div>
        {selectedStudentObj && (
          <span className="text-xs font-extrabold text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20">
            Tổng cộng: {sessionRecords.length} buổi học ({stats.sessionCount} có mặt, {sessionRecords.length - stats.sessionCount} vắng mặt)
          </span>
        )}
      </div>
      <DataTable
        tableId="reports-history-table"
        data={sessionRecords}
        columns={historyColumns}
        loading={loading}
        searchPlaceholder="Tìm theo ngày, trạng thái, ghi chú..."
        emptyMessage="Chưa có lịch sử điểm số."
        pageSize={20}
        exportFilename={`lich_su_diem_${selectedStudentObj ? selectedStudentObj.full_name : 'lop'}`}
      />
    </div>
  );
};
