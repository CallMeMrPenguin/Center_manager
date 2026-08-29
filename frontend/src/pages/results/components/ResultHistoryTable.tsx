import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../components/DataTable';
import { StudentResultRecord } from '../types';
import { trunc1Dec } from '../hooks/useStudentResults';

interface ResultHistoryTableProps {
  records: StudentResultRecord[];
  loading: boolean;
}

export const ResultHistoryTable: React.FC<ResultHistoryTableProps> = ({ records, loading }) => {
  const columns = useMemo<ColumnDef<StudentResultRecord>[]>(
    () => [
      {
        accessorKey: 'date',
        header: 'Ngày Học',
        cell: (info) => (
          <span className="font-bold text-slate-200">
            {info.getValue<string>() || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'class_name',
        header: 'Lớp Học',
        cell: (info) => (
          <span className="font-semibold text-slate-300">
            {info.getValue<string>() || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Điểm Danh',
        cell: (info) => {
          const status = info.getValue<string>();
          const isPresent = status === 'Có mặt';
          return (
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-black inline-flex items-center gap-1 border ${
                isPresent
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isPresent ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              {status || 'Có mặt'}
            </span>
          );
        },
      },
      {
        accessorKey: 'check_1',
        header: () => <div className="text-center w-full">Kiểm Tra 1</div>,
        cell: ({ row }) => {
          const r = row.original;
          const val = r.check_1;
          const isGrammar = r.check_1_skill === 'grammar';
          const topic = r.check_1_topic || (isGrammar ? r.grammar_topic : r.topic);
          return (
            <div className="text-center py-0.5">
              <span className={`font-mono font-bold ${isGrammar ? 'text-purple-400' : 'text-blue-400'}`}>
                {trunc1Dec(val)}
              </span>
              {topic && (
                <div className="mt-0.5 flex flex-col items-center">
                  <span className={`text-[10px] ${isGrammar ? 'text-purple-300/80' : 'text-blue-300/80'} font-medium truncate max-w-[130px] block`} title={topic}>
                    {topic}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold mt-0.5 ${
                    isGrammar ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                  }`}>
                    {isGrammar ? 'Ngữ Pháp' : 'Từ Vựng'}
                  </span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'check_2',
        header: () => <div className="text-center w-full">Kiểm Tra 2</div>,
        cell: ({ row }) => {
          const r = row.original;
          const val = r.check_2;
          const isGrammar = r.check_2_skill === 'grammar';
          const topic = r.check_2_topic || (isGrammar ? r.grammar_topic : r.topic);
          return (
            <div className="text-center py-0.5">
              <span className={`font-mono font-bold ${isGrammar ? 'text-purple-400' : 'text-blue-400'}`}>
                {trunc1Dec(val)}
              </span>
              {topic && (
                <div className="mt-0.5 flex flex-col items-center">
                  <span className={`text-[10px] ${isGrammar ? 'text-purple-300/80' : 'text-blue-300/80'} font-medium truncate max-w-[130px] block`} title={topic}>
                    {topic}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold mt-0.5 ${
                    isGrammar ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                  }`}>
                    {isGrammar ? 'Ngữ Pháp' : 'Từ Vựng'}
                  </span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'homework',
        header: 'BTVN',
        cell: (info) => {
          const val = info.getValue<number | null>();
          return (
            <span className="font-mono font-bold text-amber-400">
              {trunc1Dec(val)}
            </span>
          );
        },
      },
      {
        accessorKey: 'mock_test',
        header: 'Thi Thử',
        cell: (info) => {
          const val = info.getValue<number | null>();
          return (
            <span className="font-mono font-bold text-emerald-400">
              {trunc1Dec(val)}
            </span>
          );
        },
      },
      {
        accessorKey: 'notes',
        header: 'Ghi Chú',
        cell: (info) => (
          <span className="text-xs text-slate-400 max-w-[200px] truncate block">
            {info.getValue<string>() || '-'}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
        Lịch Sử Điểm Từng Buổi Học
      </h3>

      <DataTable<StudentResultRecord>
        data={records}
        columns={columns}
        loading={loading}
        loadingMessage="Đang tải dữ liệu điểm học sinh..."
        emptyMessage="Chưa có dữ liệu điểm buổi học nào cho học sinh này"
        pageSize={20}
        showPagination={true}
        enableGlobalSearch={true}
        enableColumnVisibility={true}
        enableExport={true}
        exportFilename="ket_qua_hoc_tap"
        searchPlaceholder="Tìm kiếm theo ngày, lớp, ghi chú..."
      />
    </div>
  );
};
