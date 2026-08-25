import React, { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { BellRing, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import { WarningSettings } from '../types';
import { format1Dec } from '../../../utils';

interface EarlyWarningSectionProps {
  loading: boolean;
  studentRankings: any[];
  sessionRecords: any[];
  selectedClassId: string;
  warningAbsentPct: number;
  warningConsecutiveAbsent: number;
  warningTrendThreshold: number;
  showWarningSettings: boolean;
  setShowWarningSettings: (val: boolean | ((prev: boolean) => boolean)) => void;
  onUpdateWarningSettings: (updates: Partial<WarningSettings>) => void;
  onSelectRankingStudent: (studentId: number) => void;
}

export const EarlyWarningSection: React.FC<EarlyWarningSectionProps> = ({
  loading,
  studentRankings,
  sessionRecords,
  selectedClassId,
  warningAbsentPct,
  warningConsecutiveAbsent,
  warningTrendThreshold,
  showWarningSettings,
  setShowWarningSettings,
  onUpdateWarningSettings,
  onSelectRankingStudent,
}) => {
  const [isWarningSectionOpen, setIsWarningSectionOpen] = useState(false);

  const atRiskStudents = useMemo(() => {
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
      const sSessions = (studentSessionsMap[s.student_id] || []).sort((a, b) => (a.date > b.date ? 1 : -1));

      let consecutiveAbsent = 0;
      for (let i = sSessions.length - 1; i >= 0; i--) {
        const st = sSessions[i].status || 'Có mặt';
        if (st.includes('Vắng') || st.includes('Nghỉ')) {
          consecutiveAbsent++;
        } else {
          break;
        }
      }

      const total = s.total_sessions || sSessions.length || 0;
      const present = s.present_count ?? sSessions.filter(r => r.status === 'Có mặt').length;
      const absent = total - present;
      const absentPct = total > 0 ? Math.round((absent / total) * 100) : 0;
      const slope = Number(s.trend_slope || 0);
      const ema = Number(s.ema_level || 0);

      const riskTags: string[] = [];
      if (consecutiveAbsent >= warningConsecutiveAbsent) {
        riskTags.push(`Vắng liên tiếp ${consecutiveAbsent} buổi`);
      }
      if (absentPct >= warningAbsentPct && total >= 3) {
        riskTags.push(`Tỷ lệ vắng ${absentPct}% (vượt ${warningAbsentPct}%)`);
      }
      if (slope <= warningTrendThreshold) {
        riskTags.push(`Điểm giảm dốc (${format1Dec(slope)}/buổi)`);
      }
      if (ema < 6.0 && ema > 0) {
        riskTags.push(`Học lực yếu (EMA ${format1Dec(ema)})`);
      }

      if (riskTags.length > 0) {
        list.push({
          ...s,
          consecutiveAbsent,
          absentPct,
          riskTags,
          isUrgent: consecutiveAbsent >= 3 || riskTags.length >= 2,
        });
      }
    });

    return list.sort((a, b) => b.riskTags.length - a.riskTags.length);
  }, [studentRankings, sessionRecords, selectedClassId, warningAbsentPct, warningConsecutiveAbsent, warningTrendThreshold]);

  const warningColumns = useMemo<ColumnDef<any>[]>(() => [
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
        return (
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${r.isUrgent ? 'bg-rose-600' : 'bg-amber-600'}`}>
              {r.full_name ? r.full_name.slice(0, 2).toUpperCase() : 'HS'}
            </div>
            <div>
              <span className="font-extrabold text-white text-sm block">{r.full_name} {r.nickname ? `(${r.nickname})` : ''}</span>
              <span className="text-[10px] text-slate-400 font-semibold">{r.class_name || 'Lớp học'}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'class_name',
      header: 'Lớp Học',
      meta: { headerText: 'Lớp Học', exportValue: (r: any) => r.class_name || 'Lớp học' },
      cell: (info) => (
        <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#1c2442] text-rose-300 border border-rose-500/20">
          {info.getValue<string>() || 'Lớp học'}
        </span>
      ),
    },
    {
      accessorKey: 'isUrgent',
      header: () => <div className="text-center w-full">Mức Độ</div>,
      meta: { headerText: 'Mức Độ', exportValue: (r: any) => r.isUrgent ? 'Nguy Cơ Cao' : 'Cần Theo Dõi' },
      cell: ({ getValue }) => {
        const isUrgent = getValue<boolean>();
        return (
          <div className="text-center">
            <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black border ${isUrgent ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'}`}>
              {isUrgent ? 'Nguy Cơ Cao' : 'Cần Theo Dõi'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'riskTags',
      header: 'Lý Do Cảnh Báo',
      meta: { headerText: 'Lý Do Cảnh Báo', exportValue: (r: any) => (r.riskTags || []).join(', ') },
      cell: ({ getValue }) => {
        const tags = getValue<string[]>() || [];
        return (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag: string, idx: number) => (
              <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/40 text-rose-300 border border-rose-500/20">{tag}</span>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'ema_level',
      header: () => <div className="text-center w-full">Điểm EMA</div>,
      meta: { headerText: 'Điểm EMA', exportValue: (r: any) => r.ema_level ? format1Dec(Number(r.ema_level)) : '-' },
      cell: (info) => {
        const val = Number(info.getValue()) || 0;
        return <div className="text-center font-extrabold text-white font-mono text-sm">{val > 0 ? format1Dec(val) : '-'}</div>;
      },
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
            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-white transition cursor-pointer border border-rose-500/30 text-[11px] font-bold inline-flex items-center"
          >
            <span>Xem chi tiết</span>
          </button>
        </div>
      ),
    },
  ], [onSelectRankingStudent]);

  return (
    <div className="bg-[#120d18] border border-rose-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl transition-all animate-cascade-2">
      <div onClick={() => setIsWarningSectionOpen(!isWarningSectionOpen)} className="flex flex-wrap items-center justify-between gap-4 cursor-pointer select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-md shadow-rose-500/10 shrink-0">
            <BellRing size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                CẢNH BÁO SỚM & HỌC SINH NGUY CƠ
              </h4>
              {atRiskStudents.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white font-mono animate-pulse">
                  {atRiskStudents.length} CẦN LƯU Ý
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  An Toàn
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Tự động rà soát học sinh có tỷ lệ vắng &gt;={warningAbsentPct}%, vắng liên tiếp &gt;={warningConsecutiveAbsent} buổi hoặc điểm dốc giảm &lt;={warningTrendThreshold}/buổi.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setShowWarningSettings(!showWarningSettings); }}
            className="p-1.5 rounded-lg bg-[#1e1322] hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition cursor-pointer flex items-center gap-1"
          >
            <SlidersHorizontal size={13} />
            <span className="text-[11px]">Ngưỡng</span>
          </button>
          <div className="p-1 rounded-lg text-slate-400 hover:text-white">
            {isWarningSectionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      {isWarningSectionOpen && (
        <div className="mt-4 pt-4 border-t border-rose-500/20 space-y-4">
          {showWarningSettings && (
            <div className="p-4 rounded-xl bg-[#180e1e] border border-rose-500/30 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-300 mb-1">Tỷ lệ vắng tối đa (%)</label>
                <input
                  type="number"
                  value={warningAbsentPct}
                  onChange={(e) => onUpdateWarningSettings({ absentPct: Number(e.target.value) || 0 })}
                  className="w-full bg-[#120a16] border border-rose-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-300 mb-1">Vắng liên tiếp (Buổi)</label>
                <input
                  type="number"
                  value={warningConsecutiveAbsent}
                  onChange={(e) => onUpdateWarningSettings({ consecutiveAbsent: Number(e.target.value) || 0 })}
                  className="w-full bg-[#120a16] border border-rose-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-300 mb-1">Ngưỡng dốc giảm (Điểm/b)</label>
                <input
                  type="number"
                  step="0.05"
                  value={warningTrendThreshold}
                  onChange={(e) => onUpdateWarningSettings({ trendThreshold: Number(e.target.value) || 0 })}
                  className="w-full bg-[#120a16] border border-rose-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>
          )}

          <DataTable
            tableId="reports-warning-table"
            exportFilename="hoc_sinh_nguy_co"
            data={atRiskStudents}
            columns={warningColumns}
            loading={loading}
            searchPlaceholder="Tìm học sinh nguy cơ..."
            emptyMessage="Không có học sinh nào nằm trong danh sách nguy cơ!"
            pageSize={10}
            onRowClick={(r: any) => onSelectRankingStudent(r.student_id)}
          />
        </div>
      )}
    </div>
  );
};
