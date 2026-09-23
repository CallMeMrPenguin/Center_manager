import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { History } from 'lucide-react';
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
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {info.getValue<string>() || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'class_name',
        header: 'Lớp Học',
        cell: (info) => (
          <span className="font-semibold text-slate-700 dark:text-slate-300">
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
              className={`px-2.5 py-0.5 rounded-full text-xs font-black inline-flex items-center justify-center border-0 shadow-2xs ${
                isPresent
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
              }`}
            >
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
              <span className={`font-mono font-black text-base ${isGrammar ? 'text-purple-700 dark:text-purple-400' : 'text-blue-700 dark:text-blue-400'}`}>
                {trunc1Dec(val)}
              </span>
              {topic && (
                <div className="mt-0.5 flex flex-col items-center">
                  <span className={`text-[10px] ${isGrammar ? 'text-purple-700 dark:text-purple-300' : 'text-blue-700 dark:text-blue-300'} font-semibold truncate max-w-[130px] block`} title={topic}>
                    {topic}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded border-0 shadow-2xs font-bold mt-0.5 ${
                    isGrammar ? 'bg-purple-500/15 text-purple-800 dark:text-purple-300' : 'bg-blue-500/15 text-blue-800 dark:text-blue-300'
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
              <span className={`font-mono font-black text-base ${isGrammar ? 'text-purple-700 dark:text-purple-400' : 'text-blue-700 dark:text-blue-400'}`}>
                {trunc1Dec(val)}
              </span>
              {topic && (
                <div className="mt-0.5 flex flex-col items-center">
                  <span className={`text-[10px] ${isGrammar ? 'text-purple-700 dark:text-purple-300' : 'text-blue-700 dark:text-blue-300'} font-semibold truncate max-w-[130px] block`} title={topic}>
                    {topic}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded border-0 shadow-2xs font-bold mt-0.5 ${
                    isGrammar ? 'bg-purple-500/15 text-purple-800 dark:text-purple-300' : 'bg-blue-500/15 text-blue-800 dark:text-blue-300'
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
            <span className="font-mono font-black text-base text-amber-700 dark:text-amber-400">
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
            <span className="font-mono font-black text-base text-emerald-700 dark:text-emerald-400">
              {trunc1Dec(val)}
            </span>
          );
        },
      },
      {
        accessorKey: 'notes',
        header: 'Ghi Chú',
        cell: (info) => (
          <span className="text-xs text-slate-700 dark:text-slate-300 font-medium max-w-[200px] truncate block">
            {info.getValue<string>() || '-'}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="bg-white dark:bg-[#141417] border border-slate-200 dark:border-[#27272a] rounded-2xl flex flex-col shadow-sm dark:shadow-xl mb-8 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-[#27272a] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <History size={18} className="text-indigo-500 dark:text-indigo-400" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Lịch Sử Điểm Từng Buổi Học
          </h3>
        </div>
      </div>

      <DataTable<StudentResultRecord>
        tableId="student-results-history-table"
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
