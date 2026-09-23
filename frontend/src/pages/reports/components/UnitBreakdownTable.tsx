import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../components/DataTable';
import { trunc1Dec } from '../../../utils';

export interface UnitBreakdownItem {
  skill: string;
  unit_key: string;
  avg_score: number;
  student_count: number;
  mastered_count: number;
  partial_count: number;
  regressed_count: number;
  weak_count: number;
  mastery_pct: number;
  recommendation: string;
}

interface UnitBreakdownTableProps {
  data: UnitBreakdownItem[];
}

export const UnitBreakdownTable: React.FC<UnitBreakdownTableProps> = ({ data }) => {
  const columns = useMemo<ColumnDef<UnitBreakdownItem>[]>(
    () => [
      {
        accessorKey: 'unit_key',
        header: 'Bài Học / Chủ Đề',
        cell: ({ row }) => (
          <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">{row.original.unit_key}</span>
        ),
      },
      {
        accessorKey: 'skill',
        header: 'Kỹ Năng',
        cell: ({ getValue }) => {
          const val = getValue<string>();
          const isVocab = val === 'vocab';
          const isGrammar = val === 'grammar';
          return (
            <span
              className={`text-xs font-black uppercase px-2.5 py-1 rounded-full ${
                isVocab
                  ? 'text-blue-700 dark:text-blue-400 bg-blue-500/15'
                  : isGrammar
                  ? 'text-purple-700 dark:text-purple-400 bg-purple-500/15'
                  : 'text-indigo-700 dark:text-indigo-400 bg-indigo-500/15'
              }`}
            >
              {isVocab ? 'Từ Vựng' : isGrammar ? 'Ngữ Pháp' : 'Tổng Hợp'}
            </span>
          );
        },
      },
      {
        accessorKey: 'avg_score',
        header: 'Điểm Trung Bình',
        cell: ({ getValue }) => {
          const score = getValue<number>();
          const colorClass =
            score >= 8.0
              ? 'text-emerald-700 dark:text-emerald-400 font-black'
              : score >= 6.5
              ? 'text-blue-700 dark:text-blue-400 font-extrabold'
              : score >= 5.0
              ? 'text-amber-700 dark:text-amber-400 font-extrabold'
              : 'text-rose-700 dark:text-rose-400 font-black';
          return (
            <div className="text-left font-mono">
              <span className={`text-base font-black ${colorClass}`}>{trunc1Dec(score)}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1 font-bold">/ 10</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'student_count',
        header: 'Số Học Sinh',
        cell: ({ getValue }) => (
          <span className="text-sm text-slate-900 dark:text-slate-200 font-extrabold">
            {getValue<number>()} học sinh
          </span>
        ),
      },
      {
        accessorKey: 'mastery_pct',
        header: 'Tỷ Lệ Nắm Vững',
        size: 160,
        minSize: 140,
        cell: ({ row }) => {
          const pct = row.original.mastery_pct;
          const mastered = row.original.mastered_count;
          const total = row.original.student_count;
          return (
            <div className="min-w-[130px] max-w-[160px] space-y-1.5 py-0.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-black text-slate-900 dark:text-white font-mono shrink-0">{pct}%</span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-mono shrink-0 font-bold">
                  {mastered}/{total} HS
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-[#1e2744] h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    pct >= 75
                      ? 'bg-emerald-500'
                      : pct >= 50
                      ? 'bg-blue-500'
                      : pct >= 25
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'weak_count',
        header: 'Cần Phụ Đạo',
        cell: ({ getValue }) => {
          const count = getValue<number>();
          if (count === 0) {
            return <span className="text-sm text-emerald-700 dark:text-emerald-400 font-extrabold font-mono">0 học sinh</span>;
          }
          return (
            <span className="text-sm font-extrabold text-amber-700 dark:text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-md font-mono">
              {count} học sinh
            </span>
          );
        },
      },
      {
        accessorKey: 'recommendation',
        header: 'Định Hướng Sư Phạm',
        cell: ({ getValue }) => (
          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
            {getValue<string>()}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="bg-white dark:bg-[#0c0f1d] border border-slate-300 dark:border-white/10 rounded-2xl p-5 space-y-4 select-none shadow-sm dark:shadow-lg animate-cascade-3">
      <div>
        <h3 className="text-base font-black text-slate-900 dark:text-white">
          Thống Kê Chi Tiết Từng Unit & Chủ Đề
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Tổng hợp điểm số và tỷ lệ nắm vững để giáo viên đánh giá mức độ tiếp thu của cả lớp.
        </p>
      </div>

      <DataTable<UnitBreakdownItem>
        tableId="unit-breakdown-table"
        data={data}
        columns={columns}
        pageSize={10}
        searchPlaceholder="Tìm theo bài học, kỹ năng..."
        emptyMessage="Chưa có dữ liệu bài học nào."
        exportFilename="thong_ke_ky_nang_unit"
        initialSorting={[{ id: 'avg_score', desc: false }]}
      />
    </div>
  );
};
