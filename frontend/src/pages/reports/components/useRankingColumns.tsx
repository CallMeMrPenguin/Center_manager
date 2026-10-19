import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MiniTrendSparkline } from './MiniTrendSparkline';
import { getStudentTier } from '../types';
import { format1Dec } from '../../../utils';
import { computeStudentOverallScore } from '../utils';

interface UseRankingColumnsProps {
  studentSessionsMap: Record<string, any[]>;
  selectedStudentId?: string;
}

export function useRankingColumns({ studentSessionsMap }: UseRankingColumnsProps) {
  const rankingColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'stt',
      header: () => <div className="text-center w-full">STT</div>,
      meta: { headerText: 'STT', exportValue: (_: any, idx: number) => idx + 1 },
      cell: ({ row }) => <div className="text-center font-extrabold text-slate-700 dark:text-slate-300 text-sm sm:text-base">{row.index + 1}</div>,
      enableSorting: false,
      enableGlobalFilter: false,
    },
    {
      accessorKey: 'full_name',
      header: 'Họ và Tên',
      meta: { headerText: 'Họ và Tên', exportValue: (r: any) => `${r.full_name}${r.nickname ? ` (${r.nickname})` : ''}` },
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg flex items-center justify-between gap-2">
            <span>{r.full_name}{r.nickname ? ` - ${r.nickname}` : ''}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'class_name',
      header: 'Lớp Học',
      meta: { headerText: 'Lớp Học', exportValue: (r: any) => r.class_name || 'Lớp học' },
      cell: (info) => (
        <span className="font-bold text-slate-700 dark:text-slate-300 text-sm sm:text-base">
          {info.getValue<string>() || 'Lớp học'}
        </span>
      ),
    },
    {
      id: 'present_count',
      accessorFn: (r) => (r.total_sessions > 0 ? (r.present_count / r.total_sessions) * 100 : 100),
      header: () => <div className="text-center w-full">Điểm Danh</div>,
      meta: {
        headerText: 'Điểm Danh',
        exportValue: (r: any) => {
          const total = r.total_sessions || 0;
          const present = r.present_count || 0;
          const pct = total > 0 ? Math.round((present / total) * 100) : 100;
          return `${pct}% (${present}/${total} buổi)`;
        },
      },
      cell: ({ row }) => {
        const r = row.original;
        const total = r.total_sessions || 0;
        const present = r.present_count || 0;
        const pct = total > 0 ? Math.round((present / total) * 100) : 100;

        let pctColor = 'text-emerald-700 dark:text-emerald-400';
        let subColor = 'text-emerald-800 dark:text-emerald-300';
        let badgeBg = 'bg-emerald-500/15';
        if (total > 0) {
          if (pct < 50) {
            pctColor = 'text-rose-700 dark:text-rose-400';
            subColor = 'text-rose-800 dark:text-rose-300';
            badgeBg = 'bg-rose-500/15';
          } else if (pct < 75) {
            pctColor = 'text-orange-700 dark:text-orange-400';
            subColor = 'text-orange-800 dark:text-orange-300';
            badgeBg = 'bg-orange-500/15';
          } else if (pct < 90) {
            pctColor = 'text-amber-700 dark:text-amber-400';
            subColor = 'text-amber-800 dark:text-amber-300';
            badgeBg = 'bg-amber-500/15';
          }
        }

        return (
          <div className="text-center py-0.5 flex flex-col items-center justify-center">
            <div className={`font-mono font-extrabold text-base leading-tight ${pctColor}`}>
              {pct}%
            </div>
            <div className={`text-[10px] font-mono font-bold mt-1 px-2 py-0.5 rounded-md border-0 shadow-2xs ${badgeBg} ${subColor}`}>
              {present}/{total} buổi
            </div>
          </div>
        );
      },
    },
    {
      id: 'avg_vocab',
      accessorFn: (r) => Number(r.avg_vocab ?? r.avg_check_1 ?? 0),
      header: () => <div className="text-center w-full">Từ Vựng</div>,
      meta: {
        headerText: 'Từ Vựng',
        exportValue: (r: any) => {
          const v = Number(r.avg_vocab ?? r.avg_check_1);
          return v > 0 ? format1Dec(v) : '-';
        },
      },
      cell: ({ row }) => {
        const val = Number(row.original.avg_vocab ?? row.original.avg_check_1) || 0;
        const pred = Number(row.original.pred_c1 ?? row.original.pred_vocab) || 0;
        return (
          <div className="text-center py-0.5 flex flex-col items-center justify-center">
            <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-sm sm:text-base">
              {val > 0 ? format1Dec(val) : '-'}
            </span>
            {pred > 0 && (
              <div
                className={`text-[10px] font-mono font-bold mt-1 px-1.5 py-0.5 rounded border-0 shadow-2xs inline-flex items-center gap-0.5 leading-none ${
                  pred >= 8.0
                    ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-500/15'
                    : pred >= 6.5
                    ? 'text-cyan-800 dark:text-cyan-300 bg-cyan-500/15'
                    : pred >= 5.0
                    ? 'text-amber-800 dark:text-amber-300 bg-amber-500/15'
                    : 'text-rose-800 dark:text-rose-300 bg-rose-500/15'
                }`}
              >
                <span>PD: {format1Dec(pred)}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'avg_grammar',
      accessorFn: (r) => Number(r.avg_grammar ?? r.avg_check_2 ?? 0),
      header: () => <div className="text-center w-full">Ngữ Pháp</div>,
      meta: {
        headerText: 'Ngữ Pháp',
        exportValue: (r: any) => {
          const v = Number(r.avg_grammar ?? r.avg_check_2);
          return v > 0 ? format1Dec(v) : '-';
        },
      },
      cell: ({ row }) => {
        const val = Number(row.original.avg_grammar ?? row.original.avg_check_2) || 0;
        const pred = Number(row.original.pred_c2 ?? row.original.pred_grammar) || 0;
        return (
          <div className="text-center py-0.5 flex flex-col items-center justify-center">
            <span className="font-mono font-extrabold text-purple-600 dark:text-purple-400 text-sm sm:text-base">
              {val > 0 ? format1Dec(val) : '-'}
            </span>
            {pred > 0 && (
              <div
                className={`text-[10px] font-mono font-bold mt-1 px-1.5 py-0.5 rounded border-0 shadow-2xs inline-flex items-center gap-0.5 leading-none ${
                  pred >= 8.0
                    ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-500/15'
                    : pred >= 6.5
                    ? 'text-cyan-800 dark:text-cyan-300 bg-cyan-500/15'
                    : pred >= 5.0
                    ? 'text-amber-800 dark:text-amber-300 bg-amber-500/15'
                    : 'text-rose-800 dark:text-rose-300 bg-rose-500/15'
                }`}
              >
                <span>PD: {format1Dec(pred)}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'avg_homework',
      id: 'avg_homework',
      header: () => <div className="text-center w-full">BTVN</div>,
      meta: {
        headerText: 'BTVN',
        exportValue: (r: any) =>
          Number(r.avg_homework) > 0 ? format1Dec(Number(r.avg_homework)) : '-',
      },
      cell: ({ row, getValue }) => {
        const val = Number(getValue()) || 0;
        const pred = Number(row.original.pred_hw ?? row.original.pred_homework) || 0;
        return (
          <div className="text-center py-0.5 flex flex-col items-center justify-center">
            <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
              {val > 0 ? format1Dec(val) : '-'}
            </span>
            {pred > 0 && (
              <div
                className={`text-[10px] font-mono font-bold mt-1 px-1.5 py-0.5 rounded border-0 shadow-2xs inline-flex items-center gap-0.5 leading-none ${
                  pred >= 8.0
                    ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-500/15'
                    : pred >= 6.5
                    ? 'text-cyan-800 dark:text-cyan-300 bg-cyan-500/15'
                    : pred >= 5.0
                    ? 'text-amber-800 dark:text-amber-300 bg-amber-500/15'
                    : 'text-rose-800 dark:text-rose-300 bg-rose-500/15'
                }`}
              >
                <span>PD: {format1Dec(pred)}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'trend_sparkline',
      header: () => <div className="text-center w-full">Xu Hướng</div>,
      meta: {
        headerText: 'Xu Hướng',
        exportValue: (r: any) =>
          Number(r.trend_slope || 0) > 0
            ? `+${format1Dec(Number(r.trend_slope))}/buổi`
            : `${format1Dec(Number(r.trend_slope || 0))}/buổi`,
      },
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const r = row.original;
        const sSessions = (studentSessionsMap[r.student_id] || []).filter(
          (sess) =>
            Number(sess.check_1) > 0 ||
            Number(sess.check_2) > 0 ||
            Number(sess.homework) > 0 ||
            Number(sess.homework_2) > 0
        );
        const recentScores = sSessions
          .slice(-5)
          .map((sess) => {
            const c1 = Number(sess.check_1 || 0);
            const c2 = Number(sess.check_2 || 0);
            const hw = Number(sess.homework || 0);
            const hw2 = Number(sess.homework_2 || 0);
            const valid = [c1, c2, hw, hw2].filter((v) => v > 0);
            return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
          })
          .filter((v) => v > 0);
        const slope = Number(r.trend_slope || 0);
        const ema = Number(r.ema_level || 0);
        return <MiniTrendSparkline points={recentScores} slope={slope} ema={ema} />;
      },
    },
    {
      id: 'rankTier',
      header: () => <div className="text-center w-full">Hạng</div>,
      meta: {
        headerText: 'Hạng',
        exportValue: (r: any) => {
          const avg = computeStudentOverallScore(r);
          if (avg === 0) return 'Chưa xếp hạng';
          const tier = getStudentTier(avg);
          return `${tier.name} (${tier.title})`;
        },
      },
      accessorFn: (r: any) => computeStudentOverallScore(r),
      cell: ({ getValue }) => {
        const avg = getValue<number>();
        if (avg === 0) {
          return (
            <div className="text-center">
              <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-500/10 text-slate-400 border-0 shadow-2xs">
                Chưa xếp hạng
              </span>
            </div>
          );
        }
        const tier = getStudentTier(avg);
        return (
          <div className="flex items-center justify-center gap-3 py-0.5">
            <div className="w-12 h-12 flex items-center justify-center shrink-0">
              <img
                src={tier.badge}
                alt={tier.name}
                className={`w-full h-full object-contain ${tier.scale || 'scale-100'} transform hover:scale-115 transition-transform duration-200`}
              />
            </div>
            <div className="text-left">
              <span className={`text-base font-black font-sans block leading-tight ${tier.text}`}>
                {tier.name}
              </span>
              <span className={`text-xs font-bold leading-tight ${tier.text} opacity-75`}>
                {tier.title}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: 'overallAvg',
      header: () => <div className="text-center w-full">Đánh Giá</div>,
      meta: {
        headerText: 'Đánh Giá',
        exportValue: (r: any) => {
          const avg = computeStudentOverallScore(r);
          if (avg === 0) return 'Chưa có điểm';
          const tier = getStudentTier(avg);
          return `${tier.title} (${format1Dec(avg)})`;
        },
      },
      accessorFn: (r: any) => computeStudentOverallScore(r),
      cell: ({ getValue }) => {
        const avg = getValue<number>();
        if (avg === 0) {
          return (
            <div className="text-center py-0.5 flex flex-col items-center justify-center">
              <span className="font-mono font-extrabold text-slate-500 text-sm sm:text-base">-</span>
              <div className="text-[10px] font-mono font-bold mt-1 px-1.5 py-0.5 rounded border-0 shadow-2xs inline-flex items-center gap-0.5 leading-none bg-slate-500/10 text-slate-400">
                <span>Chưa có điểm</span>
              </div>
            </div>
          );
        }
        const tier = getStudentTier(avg);
        return (
          <div className="text-center py-0.5 flex flex-col items-center justify-center">
            <span className={`font-mono font-extrabold text-sm sm:text-base ${tier.text}`}>
              {format1Dec(avg)}
            </span>
            <div className={`text-[10px] font-mono font-bold mt-1 px-2 py-0.5 rounded border-0 shadow-2xs inline-flex items-center gap-0.5 leading-none ${tier.bg} ${tier.text}`}>
              <span>{tier.title}</span>
            </div>
          </div>
        );
      },
    },
  ], [studentSessionsMap]);

  return { rankingColumns };
}
