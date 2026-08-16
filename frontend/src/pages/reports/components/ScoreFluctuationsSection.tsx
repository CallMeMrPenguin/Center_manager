import React, { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Activity, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import { format1Dec, trunc1Dec } from '../../../utils';

interface ScoreFluctuationsSectionProps {
  loading: boolean;
  studentRankings: any[];
  sessionRecords: any[];
  selectedClassId: string;
  selectedStudentId: string;
  onSelectRankingStudent: (studentId: number) => void;
}

export const ScoreFluctuationsSection: React.FC<ScoreFluctuationsSectionProps> = ({
  loading,
  studentRankings,
  sessionRecords,
  selectedClassId,
  selectedStudentId,
  onSelectRankingStudent,
}) => {
  const [isGrowthSectionOpen, setIsGrowthSectionOpen] = useState(false);

  const scoreFluctuations = useMemo(() => {
    const rawList = selectedClassId ? studentRankings.filter(r => String(r.class_id) === selectedClassId) : studentRankings;
    if (!rawList || rawList.length === 0) return [];

    const studentSessionsMap: Record<number, any[]> = {};
    sessionRecords.forEach(r => {
      const sid = r.student_id;
      if (sid) {
        if (!studentSessionsMap[sid]) studentSessionsMap[sid] = [];
        studentSessionsMap[sid].push(r);
      }
    });

    const list: any[] = [];
    rawList.forEach(s => {
      const sSessions = (studentSessionsMap[s.student_id] || [])
        .filter(r => Number(r.check_1) > 0 || Number(r.check_2) > 0 || Number(r.homework) > 0)
        .sort((a, b) => (a.date > b.date ? 1 : -1));

      const getSessionScore = (r: any) => {
        const c1 = Number(r.check_1 || 0);
        const c2 = Number(r.check_2 || 0);
        const hw = Number(r.homework || 0);
        const valid = [c1, c2, hw].filter(v => v > 0);
        return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
      };

      let baseline = 0;
      let current = 0;
      let delta = 0;

      if (sSessions.length >= 1) {
        const sampleCount = Math.min(3, sSessions.length);
        const firstSample = sSessions.slice(0, sampleCount).map(getSessionScore);
        baseline = trunc1Dec(firstSample.reduce((a, b) => a + b, 0) / firstSample.length);

        const latestSample = sSessions.slice(-sampleCount).map(getSessionScore);
        current = trunc1Dec(latestSample.reduce((a, b) => a + b, 0) / latestSample.length);
        delta = trunc1Dec(current - baseline);
      } else {
        const ema = Number(s.ema_level || 0);
        baseline = trunc1Dec(ema);
        current = trunc1Dec(ema);
        delta = 0.0;
      }

      let statusLabel = 'Duy trì ổn định';
      let statusType: 'breakthrough' | 'improving' | 'stable' | 'declining' | 'critical' = 'stable';
      const isHighTier = current >= 8.0 || baseline >= 8.5;

      if (delta >= 1.5) {
        statusLabel = `Bứt phá mạnh (+${format1Dec(delta)})`;
        statusType = 'breakthrough';
      } else if (delta >= 0.5) {
        statusLabel = `Tiến bộ tốt (+${format1Dec(delta)})`;
        statusType = 'improving';
      } else if (isHighTier && delta >= -0.8) {
        statusLabel = delta >= 0 ? `Giữ vững phong độ cao (+${format1Dec(delta)})` : `Duy trì xuất sắc (${format1Dec(delta)})`;
        statusType = 'stable';
      } else if (delta <= -1.5) {
        statusLabel = `Sụt giảm nghiêm trọng (${format1Dec(delta)})`;
        statusType = 'critical';
      } else if (delta <= -0.5) {
        statusLabel = isHighTier ? `Giảm nhẹ ở mức giỏi (${format1Dec(delta)})` : `Có chiều hướng giảm (${format1Dec(delta)})`;
        statusType = isHighTier ? 'stable' : 'declining';
      } else {
        statusLabel = delta > 0 ? `Tăng nhẹ (+${format1Dec(delta)})` : delta < 0 ? `Biến động nhẹ (${format1Dec(delta)})` : 'Duy trì ổn định';
        statusType = 'stable';
      }

      list.push({
        student_id: s.student_id,
        full_name: s.full_name,
        nickname: s.nickname,
        class_name: s.class_name,
        class_id: s.class_id,
        baseline,
        current,
        delta,
        statusLabel,
        statusType,
        sessionCount: sSessions.length,
        ema: Number(s.ema_level || 0)
      });
    });

    return list.sort((a, b) => b.delta - a.delta);
  }, [studentRankings, sessionRecords, selectedClassId]);

  const fluctuationColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'stt',
      header: () => <div className="text-center w-full">STT</div>,
      meta: { headerText: 'STT', exportValue: (_: any, idx: number) => idx + 1 },
      cell: ({ row }) => <div className="text-center font-bold text-slate-400">{row.index + 1}</div>,
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
          <div className="font-extrabold text-white text-sm flex items-center justify-between gap-2">
            <span>{r.full_name}{r.nickname ? ` - ${r.nickname}` : ''}</span>
            {isSelected && <span className="text-[10px] text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded font-mono font-bold">Đang chọn</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'class_name',
      header: 'Lớp Học',
      meta: { headerText: 'Lớp Học', exportValue: (r: any) => r.class_name || 'Lớp học' },
      cell: (info) => (
        <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#1c2442] text-indigo-300 border border-[#303d68]">
          {info.getValue<string>() || 'Lớp học'}
        </span>
      ),
    },
    {
      accessorKey: 'baseline',
      header: () => <div className="text-center w-full">Đầu Vào (3 buổi đầu)</div>,
      meta: { headerText: 'Đầu Vào (3 buổi đầu)', exportValue: (r: any) => r.baseline > 0 ? format1Dec(r.baseline) : '-' },
      cell: ({ getValue }) => <div className="text-center font-mono font-bold text-slate-300 text-sm">{getValue<number>() > 0 ? format1Dec(getValue<number>()) : '-'}</div>,
    },
    {
      accessorKey: 'current',
      header: () => <div className="text-center w-full">Hiện Tại (3 buổi gần nhất)</div>,
      meta: { headerText: 'Hiện Tại (3 buổi gần nhất)', exportValue: (r: any) => r.current > 0 ? format1Dec(r.current) : '-' },
      cell: ({ getValue }) => <div className="text-center font-mono font-black text-indigo-300 text-sm">{getValue<number>() > 0 ? format1Dec(getValue<number>()) : '-'}</div>,
    },
    {
      accessorKey: 'delta',
      header: () => <div className="text-center w-full">Mức Biến Động</div>,
      meta: { headerText: 'Mức Biến Động', exportValue: (r: any) => r.delta > 0 ? `+${format1Dec(r.delta)}` : format1Dec(r.delta) },
      cell: ({ row }) => {
        const delta = Number(row.original.delta || 0);
        const isUp = delta > 0.05;
        const isDown = delta < -0.05;
        return (
          <div className="text-center">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-mono font-black border ${isUp ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
              isDown ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
                'bg-slate-500/15 text-slate-300 border-slate-500/30'
              }`}>
              {isUp ? <TrendingUp size={13} /> : isDown ? <TrendingDown size={13} /> : <Minus size={13} />}
              <span>{delta > 0 ? `+${format1Dec(delta)}` : format1Dec(delta)}</span>
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'statusLabel',
      header: () => <div className="text-center w-full">Đánh Giá Xu Hướng</div>,
      meta: { headerText: 'Đánh Giá Xu Hướng', exportValue: (r: any) => r.statusLabel },
      cell: ({ row }) => {
        const type = row.original.statusType;
        const label = row.original.statusLabel;
        const cls =
          type === 'breakthrough' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
            type === 'improving' ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' :
              type === 'declining' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                type === 'critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                  'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';

        return (
          <div className="text-center">
            <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black border ${cls}`}>{label}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'sessionCount',
      header: () => <div className="text-center w-full">Số Buổi Đã Học</div>,
      meta: { headerText: 'Số Buổi Đã Học', exportValue: (r: any) => `${r.sessionCount} buổi` },
      cell: ({ getValue }) => <div className="text-center font-mono font-bold text-slate-400 text-xs">{getValue<number>()} buổi</div>,
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
            onClick={(e) => { e.stopPropagation(); onSelectRankingStudent(row.original.student_id); }}
            className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition cursor-pointer border border-indigo-500/20 inline-flex items-center text-[11px] font-bold"
          >
            <span>Xem chi tiết</span>
          </button>
        </div>
      ),
    },
  ], [selectedStudentId, onSelectRankingStudent]);

  return (
    <div className="bg-[#0b0f19] border border-[#1b253b] rounded-2xl p-6 shadow-xl space-y-6 animate-cascade-4">
      <div onClick={() => setIsGrowthSectionOpen(!isGrowthSectionOpen)} className="flex flex-wrap items-center justify-between gap-4 cursor-pointer select-none border-b border-[#161f33] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              THEO DÕI BIẾN ĐỘNG & ĐÀ BỨT PHÁ ĐIỂM SỐ
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              So sánh mức điểm 3 buổi đầu vào so với 3 buổi học gần nhất của từng học sinh.
            </p>
          </div>
        </div>
        <div className="p-1 rounded-lg text-slate-400 hover:text-white">
          {isGrowthSectionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {isGrowthSectionOpen && (
        <DataTable
          tableId="reports-fluctuations-table"
          exportFilename="bien_dong_diem_so"
          data={scoreFluctuations}
          columns={fluctuationColumns}
          loading={loading}
          searchPlaceholder="Tìm học sinh theo tên..."
          emptyMessage="Không có dữ liệu biến động điểm số."
          pageSize={20}
          onRowClick={(r: any) => onSelectRankingStudent(r.student_id)}
        />
      )}
    </div>
  );
};
