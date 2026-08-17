import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../components/DataTable';
import { trunc1Dec } from '../../../utils';
import { BookOpen, Sparkles, Layers } from 'lucide-react';

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
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg shrink-0 ${
                row.original.skill === 'vocab'
                  ? 'bg-blue-500/10 text-blue-400'
                  : row.original.skill === 'grammar'
                  ? 'bg-purple-500/10 text-purple-400'
                  : 'bg-indigo-500/10 text-indigo-400'
              }`}
            >
              {row.original.skill === 'vocab' ? (
                <BookOpen size={14} />
              ) : row.original.skill === 'grammar' ? (
                <Sparkles size={14} />
              ) : (
                <Layers size={14} />
              )}
            </div>
            <span className="font-bold text-white text-xs">{row.original.unit_key}</span>
          </div>
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
            <div className="text-left">
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
          const barColor =
            pct >= 75
              ? 'bg-emerald-500'
              : pct >= 50
              ? 'bg-blue-500'
              : pct >= 30
              ? 'bg-amber-500'
              : 'bg-rose-500';
          return (
            <div className="space-y-1 min-w-[120px]">
              <div className="flex justify-between text-[11px]">
                <span className="font-bold text-white">{pct}%</span>
                <span className="text-slate-400">
                  {row.original.mastered_count}/{row.original.student_count} hs
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#161a29] rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} rounded-full transition-all duration-300`}
                  style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        id: 'reinforcement',
        header: 'Cần Hỗ Trợ',
        accessorFn: (row) => row.weak_count + row.regressed_count,
        cell: ({ row }) => {
          const count = row.original.weak_count + row.original.regressed_count;
          if (count === 0) {
            return (
              <span className="text-[11px] text-emerald-400 font-bold">
                Tất cả đều đạt
              </span>
            );
          }
          return (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-rose-400 font-black">
                {count} học sinh
              </span>
              {row.original.regressed_count > 0 && (
                <span className="text-[10px] text-amber-400 font-normal">
                  ({row.original.regressed_count} giảm sút)
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'recommendation',
        header: 'Khuyến Nghị Sư Phạm',
        cell: ({ getValue }) => (
          <span className="text-xs text-slate-300 italic block max-w-xs truncate" title={getValue<string>()}>
            {getValue<string>()}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="bg-[#0c0f1d] border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg select-none">
      <div className="border-b border-white/5 pb-3">
        <h3 className="text-base font-black text-white">
          Thống Kê Chi Tiết Từng Bài Học & Kỹ Năng
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Bảng tổng hợp điểm số, mức độ nắm vững và khuyến nghị sư phạm cho từng đơn vị kiến thức.
        </p>
      </div>

      <DataTable
        tableId="unit-breakdown-datatable"
        data={data}
        columns={columns}
        pageSize={20}
        searchPlaceholder="Tìm bài học, kỹ năng, chủ đề..."
        exportFilename="thong_ke_ky_nang_unit"
        emptyMessage="Chưa có dữ liệu bài học nào được kiểm tra."
      />
    </div>
  );
};
