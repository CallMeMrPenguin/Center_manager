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
          <span className="font-bold text-white text-xs">{row.original.unit_key}</span>
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
              className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                isVocab
                  ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                  : isGrammar
                  ? 'text-purple-400 bg-purple-500/10 border-purple-500/20'
                  : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
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
              ? 'text-emerald-400 font-black'
              : score >= 6.5
              ? 'text-blue-400 font-bold'
              : score >= 5.0
              ? 'text-amber-400 font-bold'
              : 'text-rose-400 font-black';
          return (
            <div className="text-left font-mono">
              <span className={`text-xs ${colorClass}`}>{trunc1Dec(score)}</span>
              <span className="text-[10px] text-slate-500 ml-1">/ 10</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'student_count',
        header: 'Số Học Sinh',
        cell: ({ getValue }) => (
          <span className="text-xs text-slate-300 font-medium">
            {getValue<number>()} học sinh
          </span>
        ),
      },
      {
        accessorKey: 'mastery_pct',
        header: 'Tỷ Lệ Nắm Vững',
        cell: ({ row }) => {
          const pct = row.original.mastery_pct;
          const mastered = row.original.mastered_count;
          const total = row.original.student_count;
          return (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white font-mono">{pct}%</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {mastered}/{total}
                </span>
              </div>
              <div className="w-full bg-[#1e2744] h-1.5 rounded-full overflow-hidden">
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
            return <span className="text-xs text-emerald-400 font-bold font-mono">0 học sinh</span>;
          }
          return (
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-mono">
              {count} học sinh
            </span>
          );
        },
      },
      {
        accessorKey: 'recommendation',
        header: 'Định Hướng Sư Phạm',
        cell: ({ getValue }) => (
          <span className="text-xs text-slate-400 italic">
            {getValue<string>()}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="bg-[#0c0f1d] border border-white/10 rounded-2xl p-5 space-y-4 select-none shadow-lg animate-cascade-3">
      <div>
        <h3 className="text-base font-black text-white">
          Thống Kê Chi Tiết Từng Unit & Chủ Đề
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Tổng hợp điểm số và tỷ lệ nắm vững để giáo viên đánh giá mức độ tiếp thu của cả lớp.
        </p>
      </div>

      <DataTable<UnitBreakdownItem>
        tableId="unit-breakdown-table"
        data={data}
        columns={columns}
        pageSize={20}
        searchPlaceholder="Tìm theo bài học, kỹ năng..."
        emptyMessage="Chưa có dữ liệu bài học nào."
        exportFilename="thong_ke_ky_nang_unit"
        initialSorting={[{ id: 'avg_score', desc: false }]}
      />
    </div>
  );
};
