import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Scale } from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import { computeClassAnalyticsSd } from '../utils';
import { format1Dec, trunc1Dec } from '../../../utils';

interface ClassBenchmarkTableProps {
  loading: boolean;
  classes: any[];
  studentRankings: any[];
  sessionRecords: any[];
  selectedClassId: string;
  analyticsSummary: any;
  classAnalyticsMap: Record<string, any>;
}

export const ClassBenchmarkTable: React.FC<ClassBenchmarkTableProps> = ({
  loading,
  classes,
  studentRankings,
  sessionRecords,
  selectedClassId,
  analyticsSummary,
  classAnalyticsMap,
}) => {
  const crossClassBenchmark = useMemo(() => {
    if (!classes || classes.length === 0 || !studentRankings) return [];

    return classes.map(c => {
      const cStudents = studentRankings.filter(s => String(s.class_id) === String(c.id));
      const totalStudents = cStudents.length;

      if (totalStudents === 0) {
        return {
          class_id: c.id,
          class_name: c.class_name,
          grade: c.grade || 'Chưa phân lớp',
          studentCount: 0,
          attendancePct: 100,
          avgEma: 0,
          improvingPct: 0,
          classSd: 0,
          evaluation: 'Chưa có học sinh'
        };
      }

      const emaScores = cStudents.map(s => Number(s.ema_level || 0)).filter(v => v > 0);
      const avgEma = emaScores.length > 0 ? trunc1Dec(emaScores.reduce((a, b) => a + b, 0) / emaScores.length) : 0;

      const cSessionRecords = sessionRecords.filter(r => String(r.class_id) === String(c.id));
      const classSd = classAnalyticsMap[String(c.id)]?.std_dev !== undefined
        ? classAnalyticsMap[String(c.id)].std_dev
        : (selectedClassId === String(c.id) && analyticsSummary?.std_dev !== undefined)
          ? analyticsSummary.std_dev
          : computeClassAnalyticsSd(cSessionRecords);

      let totalPresent = 0, totalSessions = 0;
      cStudents.forEach(s => {
        totalPresent += s.present_count || 0;
        totalSessions += s.total_sessions || 0;
      });
      const attendancePct = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 100;

      const improvingCount = cStudents.filter(s => Number(s.trend_slope || 0) >= 0.05).length;
      const improvingPct = Math.round((improvingCount / totalStudents) * 100);

      let evaluation = 'Tiến bộ tốt';
      if (avgEma >= 8.5 && classSd < 1.0) evaluation = 'Đồng đều & Xuất sắc';
      else if (classSd >= 3.0) evaluation = 'Phân hóa rất mạnh';
      else if (avgEma < 6.5) evaluation = 'Cần hỗ trợ học lực';

      return {
        class_id: c.id,
        class_name: c.class_name,
        grade: c.grade || 'Chưa phân lớp',
        studentCount: totalStudents,
        attendancePct,
        avgEma,
        improvingPct,
        classSd,
        evaluation
      };
    });
  }, [classes, studentRankings, sessionRecords, selectedClassId, analyticsSummary, classAnalyticsMap]);

  const classBenchmarkColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'stt',
      header: () => <div className="text-center w-full">STT</div>,
      meta: { headerText: 'STT' },
      cell: ({ row }) => <div className="text-center font-bold text-slate-400">{row.index + 1}</div>,
      enableSorting: false,
    },
    {
      accessorKey: 'class_name',
      header: 'Tên Lớp Học',
      meta: { headerText: 'Tên Lớp Học' },
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-white block text-sm">{row.original.class_name}</span>
          <span className="text-[10px] text-slate-400 font-semibold">{row.original.grade}</span>
        </div>
      ),
    },
    {
      accessorKey: 'studentCount',
      header: () => <div className="text-center w-full">Sĩ Số</div>,
      meta: { headerText: 'Sĩ Số' },
      cell: ({ getValue }) => <div className="text-center font-mono font-bold text-slate-200">{getValue<number>()} học sinh</div>,
    },
    {
      accessorKey: 'attendancePct',
      header: () => <div className="text-center w-full">Chuyên Cần %</div>,
      meta: { headerText: 'Chuyên Cần %' },
      cell: ({ getValue }) => {
        const val = getValue<number>();
        return (
          <div className="text-center">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-black border ${val >= 90 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
              val >= 80 ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}>{val}%</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'avgEma',
      header: () => <div className="text-center w-full">Điểm EMA TB</div>,
      meta: { headerText: 'Điểm EMA TB' },
      cell: ({ getValue }) => <div className="text-center font-mono font-black text-indigo-300 text-sm">{getValue<number>() > 0 ? format1Dec(getValue<number>()) : '-'}</div>,
    },
    {
      accessorKey: 'improvingPct',
      header: () => <div className="text-center w-full">Tỷ Lệ Tiến Bộ</div>,
      meta: { headerText: 'Tỷ Lệ Tiến Bộ' },
      cell: ({ getValue }) => <div className="text-center font-mono font-bold text-emerald-400">{getValue<number>()}% lớp</div>,
    },
    {
      accessorKey: 'classSd',
      header: () => <div className="text-center w-full">Độ Lệch Chuẩn (σ)</div>,
      meta: { headerText: 'Độ Lệch Chuẩn (σ)' },
      cell: ({ getValue }) => <div className="text-center font-mono font-bold text-cyan-300">σ = {getValue<number>()}</div>,
    },
    {
      accessorKey: 'evaluation',
      header: () => <div className="text-center w-full">Đánh Giá Hiệu Quả</div>,
      meta: { headerText: 'Đánh Giá Hiệu Quả' },
      cell: ({ getValue }) => {
        const ev = getValue<string>();
        const isExcel = ev.includes('Xuất sắc') || ev.includes('Tiến bộ');
        return (
          <div className="text-center">
            <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-black border ${isExcel ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
              {ev}
            </span>
          </div>
        );
      },
    },
  ], []);

  return (
    <div className="bg-[#0b0f19] border border-[#1b253b] rounded-2xl p-6 shadow-xl space-y-4 animate-cascade-2">
      <div className="flex items-center gap-3 border-b border-[#161f33] pb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
          <Scale size={20} />
        </div>
        <div>
          <h3 className="text-base font-black text-white uppercase tracking-wider">
            BẢNG XẾP HẠNG & SO SÁNH TỔNG QUAN CÁC LỚP
          </h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Đánh giá toàn diện sĩ số, mức điểm EMA, độ lệch chuẩn và tỷ lệ tăng trưởng giữa các lớp học trong trung tâm.
          </p>
        </div>
      </div>

      <DataTable
        tableId="reports-class-benchmark-table"
        exportFilename="bang_so_sanh_cac_lop"
        data={crossClassBenchmark}
        columns={classBenchmarkColumns}
        loading={loading}
        searchPlaceholder="Tìm kiếm lớp học..."
        emptyMessage="Chưa có dữ liệu lớp học để so sánh."
        pageSize={10}
      />
    </div>
  );
};
