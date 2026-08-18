import React, { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../components/DataTable';
import { LayoutGrid } from 'lucide-react';
import { trunc1Dec } from '../../../utils';

interface HeatmapUnit {
  unit_key: string;
  skill: string;
  avg_score: number;
}

interface StudentUnitData {
  skill: string;
  ema_score: number;
  last_score?: number;
  test_count: number;
  mastery_status: 'mastered' | 'partial' | 'regressed' | 'not_yet';
  last_tested?: string;
}

interface HeatmapStudent {
  student_id: number;
  student_name: string;
  nickname: string;
  class_name: string;
  units: Record<string, StudentUnitData>;
}

interface MasteryHeatmapProps {
  units: HeatmapUnit[];
  students: HeatmapStudent[];
  onSelectStudent?: (studentId: number) => void;
}

export const MasteryHeatmap: React.FC<MasteryHeatmapProps> = ({
  units,
  students,
  onSelectStudent,
}) => {
  const [skillFilter, setSkillFilter] = useState<'all' | 'vocab' | 'grammar'>('all');
  const [hoveredCell, setHoveredCell] = useState<{
    studentName: string;
    unitKey: string;
    data: StudentUnitData;
    x: number;
    y: number;
    showBelow: boolean;
  } | null>(null);

  const filteredUnits = useMemo(() => {
    if (skillFilter === 'all') return units;
    return units.filter((u) => u.skill === skillFilter);
  }, [units, skillFilter]);

  // Vibrant, bright 4-color scale: Xanh (>=8.0), Vàng (6.5-7.9), Cam (5.0-6.4), Đỏ (<5.0)
  const getCellStyle = (ema?: number) => {
    if (ema === undefined || ema === null) {
      return {
        bg: 'bg-[#0e1322]',
        textColor: 'text-slate-600',
        label: '-',
      };
    }
    const score = Number(ema);
    if (score >= 8.0) {
      return {
        bg: 'bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-200',
        textColor: 'text-emerald-300 font-black',
        label: trunc1Dec(score),
      };
    }
    if (score >= 6.5) {
      return {
        bg: 'bg-amber-500/25 hover:bg-amber-500/40 text-amber-200',
        textColor: 'text-amber-300 font-bold',
        label: trunc1Dec(score),
      };
    }
    if (score >= 5.0) {
      return {
        bg: 'bg-orange-500/25 hover:bg-orange-500/40 text-orange-200',
        textColor: 'text-orange-300 font-bold',
        label: trunc1Dec(score),
      };
    }
    // Score < 5.0: Bright Red
    return {
      bg: 'bg-rose-500/30 hover:bg-rose-500/45 text-rose-200',
      textColor: 'text-rose-300 font-black',
      label: trunc1Dec(score),
    };
  };

  const handleCellMouseMove = (e: React.MouseEvent, studentName: string, unitKey: string, data: StudentUnitData) => {
    const x = e.clientX;
    const y = e.clientY;
    const showBelow = y < 220;
    setHoveredCell({
      studentName,
      unitKey,
      data,
      x: Math.min(window.innerWidth - 150, Math.max(150, x)),
      y: showBelow ? y + 20 : y - 20,
      showBelow,
    });
  };

  const columns = useMemo<ColumnDef<HeatmapStudent>[]>(() => {
    const baseCols: ColumnDef<HeatmapStudent>[] = [
      {
        id: 'stt',
        header: () => <div className="text-center w-full">STT</div>,
        cell: ({ row }) => <div className="text-center font-bold text-slate-400">{row.index + 1}</div>,
        enableSorting: false,
        enableGlobalFilter: false,
        size: 55,
        minSize: 45,
      },
      {
        accessorKey: 'student_name',
        header: 'Học Sinh',
        size: 190,
        minSize: 160,
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 py-1">
            <span className="font-bold text-white group-hover:text-indigo-300 transition text-xs">
              {row.original.student_name}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {row.original.nickname && (
                <span className="text-[10px] font-extrabold text-indigo-300 bg-indigo-500/15 px-1.5 py-0.2 rounded border border-indigo-500/20">
                  {row.original.nickname}
                </span>
              )}
              <span className="text-[10px] text-slate-400 font-semibold bg-[#121626] px-1.5 py-0.2 rounded border border-white/5">
                {row.original.class_name || 'Lớp học'}
              </span>
            </div>
          </div>
        ),
      },
    ];

    const unitCols: ColumnDef<HeatmapStudent>[] = filteredUnits.map((u) => ({
      id: `unit_${u.unit_key}`,
      header: () => (
        <div className="text-center py-0.5">
          <div className="text-[11px] font-black text-white truncate max-w-[130px]" title={u.unit_key}>
            {u.unit_key}
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <span
              className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                u.skill === 'vocab'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              }`}
            >
              {u.skill === 'vocab' ? 'Từ Vựng' : 'Ngữ Pháp'}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold font-mono">
              TB {trunc1Dec(u.avg_score)}
            </span>
          </div>
        </div>
      ),
      accessorFn: (row) => row.units?.[u.unit_key]?.ema_score ?? -1,
      size: 110,
      minSize: 95,
      cell: ({ row }) => {
        const uData = row.original.units?.[u.unit_key];
        const ema = uData?.ema_score;
        const cellStyle = getCellStyle(ema);

        return (
          <div
            onMouseMove={(e) => {
              if (uData) handleCellMouseMove(e, row.original.student_name, u.unit_key, uData);
            }}
            onMouseLeave={() => setHoveredCell(null)}
            className={`w-full h-full min-h-[40px] flex items-center justify-center font-mono text-xs font-black transition-colors cursor-pointer select-none -m-3 p-3 ${cellStyle.bg} ${cellStyle.textColor}`}
          >
            {cellStyle.label}
          </div>
        );
      },
    }));

    return [...baseCols, ...unitCols];
  }, [filteredUnits]);

  const toolbarLeft = (
    <div className="relative flex bg-[#0d1018] p-1 rounded-xl border border-white/10 text-xs font-bold shrink-0 w-64">
      <div
        className="absolute top-1 bottom-1 rounded-lg bg-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.5)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
        style={{
          left: skillFilter === 'all'
            ? '4px'
            : skillFilter === 'vocab'
              ? 'calc((100% / 3) + 1px)'
              : 'calc(((100% / 3) * 2) + 1px)',
          width: 'calc((100% / 3) - 4px)',
        }}
      />
      <button
        onClick={() => setSkillFilter('all')}
        className={`flex-1 relative z-10 py-1 text-center transition cursor-pointer ${
          skillFilter === 'all' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
        }`}
      >
        Tất Cả
      </button>
      <button
        onClick={() => setSkillFilter('vocab')}
        className={`flex-1 relative z-10 py-1 text-center transition cursor-pointer ${
          skillFilter === 'vocab' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
        }`}
      >
        Từ Vựng
      </button>
      <button
        onClick={() => setSkillFilter('grammar')}
        className={`flex-1 relative z-10 py-1 text-center transition cursor-pointer ${
          skillFilter === 'grammar' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
        }`}
      >
        Ngữ Pháp
      </button>
    </div>
  );

  return (
    <div className="bg-[#0c0f1d] border border-white/10 rounded-2xl p-5 space-y-4 select-none shadow-lg">
      {/* Title Bar */}
      <div className="border-b border-white/5 pb-3">
        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          <LayoutGrid size={16} className="text-indigo-400" />
          Ma Trận Nắm Vững Kiến Thức (Mastery Heatmap)
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Bảng màu trực quan theo thang đo 4 mức (Đỏ &lt; 5.0, Cam 5.0-6.4, Vàng 6.5-7.9, Xanh &ge; 8.0).
        </p>
      </div>

      {/* TanStack DataTable with Dynamic Columns */}
      <DataTable<HeatmapStudent>
        tableId="mastery-heatmap-table"
        data={students}
        columns={columns}
        pageSize={20}
        searchPlaceholder="Tìm kiếm học sinh..."
        emptyMessage="Chưa có dữ liệu bài kiểm tra nào."
        toolbarLeft={toolbarLeft}
        exportFilename="ma_tran_nam_vung_kien_thuc"
        onRowClick={(row) => onSelectStudent && onSelectStudent(row.student_id)}
        initialSorting={[{ id: 'student_name', desc: false }]}
      />

      {/* 4-Color Scale Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/5 text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-300">Thang Điểm 4 Mức:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/40 border border-emerald-500/80 block" />
            <span className="text-emerald-300 font-bold">Xanh: Nắm Vững (&ge; 8.0)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/40 border border-amber-500/80 block" />
            <span className="text-amber-300 font-bold">Vàng: Đang Tiến Bộ (6.5 – 7.9)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-orange-500/40 border border-orange-500/80 block" />
            <span className="text-orange-300 font-bold">Cam: Cần Củng Cố (5.0 – 6.4)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500/40 border border-rose-500/80 block" />
            <span className="text-rose-300 font-bold">Đỏ: Chưa Đạt (&lt; 5.0)</span>
          </div>
        </div>

        <span className="text-slate-500 italic text-[10px]">
          Điểm số là điểm EMA tích lũy của học sinh đối với từng bài học
        </span>
      </div>

      {/* Dynamic Colorful Hover Tooltip (Follows cursor, zero jump, rich design) */}
      {hoveredCell && (
        <div
          style={{
            position: 'fixed',
            left: hoveredCell.x,
            top: hoveredCell.y,
            transform: hoveredCell.showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
          }}
          className="z-50 pointer-events-none bg-[#0e1224] border-2 border-indigo-500/60 rounded-2xl p-4 shadow-[0_15px_35px_rgba(0,0,0,0.85)] text-xs text-white space-y-2.5 min-w-[240px] select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-black text-white text-sm">{hoveredCell.studentName}</span>
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
              hoveredCell.data.skill === 'vocab'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
            }`}>
              {hoveredCell.data.skill === 'vocab' ? 'Từ Vựng' : 'Ngữ Pháp'}
            </span>
          </div>

          {/* Unit Title */}
          <div className="text-xs font-bold text-indigo-300">
            {hoveredCell.unitKey}
          </div>

          {/* Stats */}
          <div className="space-y-1.5 bg-[#080b16] p-2.5 rounded-xl border border-white/5 font-mono text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Điểm EMA Tích Lũy:</span>
              <span className={`font-black text-sm ${
                hoveredCell.data.ema_score >= 8.0 ? 'text-emerald-400' :
                hoveredCell.data.ema_score >= 6.5 ? 'text-amber-400' :
                hoveredCell.data.ema_score >= 5.0 ? 'text-orange-400' : 'text-rose-400'
              }`}>
                {trunc1Dec(hoveredCell.data.ema_score)} / 10
              </span>
            </div>

            {hoveredCell.data.last_score !== undefined && (
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Điểm Test Gần Nhất:</span>
                <span className="font-bold text-white">{trunc1Dec(hoveredCell.data.last_score)}đ</span>
              </div>
            )}

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Số Lần Đã Test:</span>
              <span className="font-bold text-indigo-300">{hoveredCell.data.test_count} buổi</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-slate-400 font-medium">Trạng thái:</span>
            <span className={`font-black px-2 py-0.5 rounded-md ${
              hoveredCell.data.ema_score >= 8.0 ? 'bg-emerald-500/20 text-emerald-300' :
              hoveredCell.data.ema_score >= 6.5 ? 'bg-amber-500/20 text-amber-300' :
              hoveredCell.data.ema_score >= 5.0 ? 'bg-orange-500/20 text-orange-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {hoveredCell.data.ema_score >= 8.0 ? 'Nắm Vững' :
               hoveredCell.data.ema_score >= 6.5 ? 'Đang Tiến Bộ' :
               hoveredCell.data.ema_score >= 5.0 ? 'Cần Củng Cố' : 'Chưa Đạt (Kèm Gấp)'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
