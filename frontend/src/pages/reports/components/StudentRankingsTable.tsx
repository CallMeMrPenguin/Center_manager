import React, { useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { GraduationCap } from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import { CustomSelect } from '../../../components/CustomSelect';
import { MiniTrendSparkline } from './MiniTrendSparkline';
import { getStudentTier } from '../types';
import { format1Dec, trunc1Dec } from '../../../utils';
import { exportRankingsExcel } from '../utils/exportRankingsExcel';
import { DistributionScoreBin } from '../utils/distributionAnalytics';

interface StudentRankingsTableProps {
  loading: boolean;
  classes: any[];
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  studentRankings: any[];
  filteredRankings: any[];
  studentSessionsMap: Record<string, any[]>;
  onSelectRankingStudent?: (studentId: number) => void;
  hasSelectedStudent: boolean;
  selectedScoreBin?: DistributionScoreBin | null;
  onClearScoreBin?: () => void;
  isTestMode?: boolean;
}

export const StudentRankingsTable: React.FC<StudentRankingsTableProps> = React.memo(({
  loading,
  classes,
  selectedClassId,
  setSelectedClassId,
  selectedStudentId,
  setSelectedStudentId,
  studentRankings,
  filteredRankings,
  studentSessionsMap,
  onSelectRankingStudent,
  hasSelectedStudent,
  selectedScoreBin,
  onClearScoreBin,
}) => {
  const handleExportRankingsExcel = useCallback(() => {
    exportRankingsExcel({
      classes,
      selectedClassId,
      studentRankings,
      filteredRankings,
    });
  }, [selectedClassId, classes, studentRankings, filteredRankings]);

  const rankingColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'stt',
      header: () => <div className="text-center w-full">STT</div>,
      meta: { headerText: 'STT', exportValue: (_: any, idx: number) => idx + 1 },
      cell: ({ row }) => <div className="text-center font-bold text-slate-300 text-sm sm:text-base">{row.index + 1}</div>,
      enableSorting: false,
      enableGlobalFilter: false,
    },
    {
      accessorKey: 'full_name',
      header: 'Họ và Tên',
      meta: { headerText: 'Họ và Tên', exportValue: (r: any) => `${r.full_name}${r.nickname ? ` (${r.nickname})` : ''}` },
      cell: ({ row }) => {
        const r = row.original;
        const isSelected = String(r.student_id) === selectedStudentId;
        return (
          <div className="font-extrabold text-white text-base sm:text-lg flex items-center justify-between gap-2">
            <span>{r.full_name}{r.nickname ? ` - ${r.nickname}` : ''}</span>
            {isSelected && <span className="text-xs text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded font-mono">Đang chọn</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'class_name',
      header: 'Lớp Học',
      meta: { headerText: 'Lớp Học', exportValue: (r: any) => r.class_name || 'Lớp học' },
      cell: (info) => (
        <span className="font-bold text-slate-300 text-sm sm:text-base">
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
          const pct = r.total_sessions > 0 ? ((r.present_count / r.total_sessions) * 100).toFixed(0) : '100';
          return `${pct}%`;
        }
      },
      cell: ({ row }) => {
        const r = row.original;
        const pct = r.total_sessions > 0 ? Math.round((r.present_count / r.total_sessions) * 100) : 100;
        return (
          <div className="text-center font-mono font-bold text-slate-300 text-sm sm:text-base">
            {pct}%
          </div>
        );
      },
    },
    {
      accessorKey: 'avg_check_1',
      header: () => <div className="text-center w-full">Check 1</div>,
      meta: { headerText: 'Check 1', exportValue: (r: any) => Number(r.avg_check_1) > 0 ? format1Dec(Number(r.avg_check_1)) : '-' },
      cell: ({ getValue }) => {
        const val = Number(getValue()) || 0;
        return (
          <div className="text-center font-mono font-extrabold text-blue-400 text-sm sm:text-base">
            {val > 0 ? format1Dec(val) : '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'avg_check_2',
      header: () => <div className="text-center w-full">Check 2</div>,
      meta: { headerText: 'Check 2', exportValue: (r: any) => Number(r.avg_check_2) > 0 ? format1Dec(Number(r.avg_check_2)) : '-' },
      cell: ({ getValue }) => {
        const val = Number(getValue()) || 0;
        return (
          <div className="text-center font-mono font-extrabold text-purple-400 text-sm sm:text-base">
            {val > 0 ? format1Dec(val) : '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'avg_homework',
      header: () => <div className="text-center w-full">BTVN</div>,
      meta: { headerText: 'BTVN', exportValue: (r: any) => Number(r.avg_homework) > 0 ? format1Dec(Number(r.avg_homework)) : '-' },
      cell: ({ getValue }) => {
        const val = Number(getValue()) || 0;
        return (
          <div className="text-center font-mono font-extrabold text-emerald-400 text-sm sm:text-base">
            {val > 0 ? format1Dec(val) : '-'}
          </div>
        );
      },
    },
    {
      id: 'trend_sparkline',
      header: () => <div className="text-center w-full">Xu Hướng</div>,
      meta: { headerText: 'Xu Hướng', exportValue: (r: any) => Number(r.trend_slope || 0) > 0 ? `+${format1Dec(Number(r.trend_slope))}/buổi` : `${format1Dec(Number(r.trend_slope || 0))}/buổi` },
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const r = row.original;
        const sSessions = (studentSessionsMap[r.student_id] || [])
          .filter(sess => Number(sess.check_1) > 0 || Number(sess.check_2) > 0 || Number(sess.homework) > 0);
        const recentScores = sSessions.slice(-5).map(sess => {
          const c1 = Number(sess.check_1 || 0);
          const c2 = Number(sess.check_2 || 0);
          const hw = Number(sess.homework || 0);
          const valid = [c1, c2, hw].filter(v => v > 0);
          return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
        }).filter(v => v > 0);
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
          const c1 = Number(r.avg_check_1 || 0);
          const c2 = Number(r.avg_check_2 || 0);
          const hw = Number(r.avg_homework || 0);
          const valid = [c1, c2, hw].filter(v => v > 0);
          if (valid.length === 0) return 'Chưa xếp hạng';
          const avg = trunc1Dec(valid.reduce((a, b) => a + b, 0) / valid.length);
          const tier = getStudentTier(avg);
          return `${tier.name} (${tier.title})`;
        }
      },
      accessorFn: (r: any) => {
        const c1 = Number(r.avg_check_1 || 0);
        const c2 = Number(r.avg_check_2 || 0);
        const hw = Number(r.avg_homework || 0);
        const valid = [c1, c2, hw].filter(v => v > 0);
        if (valid.length === 0) return 0;
        return trunc1Dec(valid.reduce((a, b) => a + b, 0) / valid.length);
      },
      cell: ({ getValue }) => {
        const avg = getValue<number>();
        if (avg === 0) {
          return (
            <div className="text-center">
              <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30">Chưa xếp hạng</span>
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
                className={`w-full h-full object-contain ${tier.scale || 'scale-100'} drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] transform hover:scale-115 transition-transform duration-200`}
              />
            </div>
            <div className="text-left">
              <span className={`text-base font-black font-sans block leading-tight ${tier.text}`}>{tier.name}</span>
              <span className="text-xs text-slate-400 font-bold">{tier.title}</span>
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
          const c1 = Number(r.avg_check_1 || 0);
          const c2 = Number(r.avg_check_2 || 0);
          const hw = Number(r.avg_homework || 0);
          const valid = [c1, c2, hw].filter(v => v > 0);
          if (valid.length === 0) return 'Chưa có điểm';
          const avg = trunc1Dec(valid.reduce((a, b) => a + b, 0) / valid.length);
          let label = 'Xuất Sắc';
          if (avg >= 9.6) label = 'Xuất Chúng';
          else if (avg >= 9.2) label = 'Vượt Trội';
          else if (avg >= 8.7) label = 'Ưu Tú';
          else if (avg >= 8.0) label = 'Xuất Sắc';
          else if (avg >= 7.0) label = 'Giỏi';
          else if (avg >= 6.0) label = 'Khá';
          else if (avg >= 4.6) label = 'Trung Bình';
          else label = 'Yếu';
          return `${label} (${format1Dec(avg)})`;
        }
      },
      accessorFn: (r: any) => {
        const c1 = Number(r.avg_check_1 || 0);
        const c2 = Number(r.avg_check_2 || 0);
        const hw = Number(r.avg_homework || 0);
        const valid = [c1, c2, hw].filter(v => v > 0);
        if (valid.length === 0) return 0;
        return trunc1Dec(valid.reduce((a, b) => a + b, 0) / valid.length);
      },
      cell: ({ getValue }) => {
        const avg = getValue<number>();
        if (avg === 0) {
          return (
            <div className="text-center">
              <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30">Chưa có điểm</span>
            </div>
          );
        }
        let label = 'Xuất Sắc', cls = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35';
        if (avg >= 9.6) { label = 'Xuất Chúng'; cls = 'bg-amber-500/15 text-amber-300 border-amber-500/40 font-black'; }
        else if (avg >= 9.2) { label = 'Vượt Trội'; cls = 'bg-pink-500/15 text-pink-300 border-pink-500/35 font-bold'; }
        else if (avg >= 8.7) { label = 'Ưu Tú'; cls = 'bg-purple-500/15 text-purple-300 border-purple-500/35 font-bold'; }
        else if (avg >= 8.0) { label = 'Xuất Sắc'; cls = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35 font-bold'; }
        else if (avg >= 7.0) { label = 'Giỏi'; cls = 'bg-indigo-500/15 text-indigo-300 border-indigo-500/35 font-semibold'; }
        else if (avg >= 6.0) { label = 'Khá'; cls = 'bg-yellow-500/15 text-yellow-300 border-yellow-500/35 font-semibold'; }
        else if (avg >= 4.6) { label = 'Trung Bình'; cls = 'bg-sky-500/15 text-sky-300 border-sky-500/35'; }
        else { label = 'Yếu'; cls = 'bg-amber-700/15 text-amber-500 border-amber-700/35'; }
        return (
          <div className="text-center">
            <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black border ${cls}`}>{label} ({format1Dec(avg)})</span>
          </div>
        );
      },
    },
  ], [selectedStudentId, studentSessionsMap]);

  return (
    <div className={`bg-[#0d1120] border border-[#1d2644] rounded-2xl flex flex-col shadow-2xl mb-8 ${hasSelectedStudent ? 'animate-cascade-4' : 'animate-cascade-3'}`}>
      <div className="px-5 py-4 border-b border-[#181f36] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <GraduationCap size={18} className="text-indigo-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            BẢNG XẾP HẠNG VÀ CHI TIẾT ĐIỂM SỐ HỌC SINH
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <GraduationCap size={15} className="text-indigo-400 shrink-0" />
          <CustomSelect
            value={selectedClassId}
            onChange={(val) => { setSelectedClassId(String(val)); setSelectedStudentId(''); }}
            options={[
              { value: '', label: 'Tất cả lớp học' },
              ...classes.map(c => ({ value: String(c.id), label: `${c.class_name} (${c.grade || 'Lớp 6'})` }))
            ]}
            className="w-52"
          />
        </div>
      </div>

      {/* Active Histogram Score Bin Filter Bar */}
      {selectedScoreBin && (
        <div className="mx-5 my-3 flex items-center justify-between bg-indigo-950/70 border border-indigo-500/40 px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-200 shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
            <span>
              Đang lọc theo mức điểm: <strong className="text-white font-mono text-sm">{selectedScoreBin.rangeLabel}</strong> ({filteredRankings.length} học sinh)
            </span>
          </div>
          <button
            type="button"
            onClick={onClearScoreBin}
            className="px-3 py-1 rounded-lg bg-indigo-600/40 hover:bg-indigo-600/70 text-white font-bold transition cursor-pointer border border-indigo-400/30"
          >
            ✕ Bỏ lọc phổ điểm
          </button>
        </div>
      )}

      <DataTable
        tableId="reports-rankings-table"
        exportFilename="bang_xep_hang_hoc_sinh"
        data={filteredRankings}
        columns={rankingColumns}
        loading={loading}
        searchPlaceholder="Tìm học sinh theo tên, biệt danh, lớp..."
        emptyMessage="Không có dữ liệu xếp hạng."
        pageSize={20}
        onRowClick={(r: any) => onSelectRankingStudent?.(r.student_id)}
        initialSorting={[{ id: 'overallAvg', desc: true }]}
        onExportExcel={handleExportRankingsExcel}
      />
    </div>
  );
});
