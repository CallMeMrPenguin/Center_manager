import React, { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../components/DataTable';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { LayoutGrid } from 'lucide-react';
import { trunc1Dec } from '../../../utils';

interface HeatmapUnit {
  unit_key: string;
  skill: string;
  unit_id?: string;
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

  // Clean glowing badges with vibrant colors
  const getBadgeStyle = (ema?: number) => {
    if (ema === undefined || ema === null) {
      return {
        badgeClass: 'text-slate-400 dark:text-slate-600 font-normal',
        label: '-',
      };
    }
    const score = Number(ema);
    if (score >= 8.0) {
      return {
        badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 hover:scale-105 font-black',
        label: trunc1Dec(score),
      };
    }
    if (score >= 6.5) {
      return {
        badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 hover:scale-105 font-bold',
        label: trunc1Dec(score),
      };
    }
    if (score >= 5.0) {
      return {
        badgeClass: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 hover:bg-orange-500/25 hover:scale-105 font-bold',
        label: trunc1Dec(score),
      };
    }
    // Score < 5.0: Rose/Red
    return {
      badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 hover:bg-rose-500/25 hover:scale-105 font-black',
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
        cell: ({ row }) => <div className="text-center font-bold text-slate-500 dark:text-slate-400">{row.index + 1}</div>,
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
            <span className="font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition text-sm sm:text-base">
              {row.original.student_name}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {row.original.nickname && (
                <span className="text-xs font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/15 px-1.5 py-0.5 rounded">
                  {row.original.nickname}
                </span>
              )}
              <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-[#121626] px-1.5 py-0.5 rounded">
                {row.original.class_name || 'Lớp học'}
              </span>
            </div>
          </div>
        ),
      },
    ];

    const unitCols: ColumnDef<HeatmapStudent>[] = filteredUnits.map((u) => {
      const colKey = u.unit_id || `${u.unit_key}__${u.skill}`;
      return {
        id: `unit_${colKey}`,
        header: () => (
          <div className="flex flex-col items-center justify-center py-1 select-none">
            <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate max-w-[120px]" title={u.unit_key}>
              {u.unit_key}
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                  u.skill === 'vocab'
                    ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                    : 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                }`}
              >
                {u.skill === 'vocab' ? 'Từ Vựng' : 'Ngữ Pháp'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold font-mono">
                TB {trunc1Dec(u.avg_score)}
              </span>
            </div>
          </div>
        ),
        accessorFn: (row) => {
          const uData = row.units?.[colKey] || (row.units?.[u.unit_key]?.skill === u.skill ? row.units?.[u.unit_key] : undefined);
          return uData?.ema_score ?? -1;
        },
        size: 110,
        minSize: 95,
        cell: ({ row }) => {
          const uData = row.original.units?.[colKey] || (row.original.units?.[u.unit_key]?.skill === u.skill ? row.original.units?.[u.unit_key] : undefined);
          const ema = uData?.ema_score;
          const style = getBadgeStyle(ema);

          return (
            <div className="flex items-center justify-center py-0.5">
              <span
                onMouseMove={(e) => {
                  if (uData) handleCellMouseMove(e, row.original.student_name, u.unit_key, uData);
                }}
                onMouseLeave={() => setHoveredCell(null)}
                className={`inline-flex items-center justify-center w-14 h-7 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer ${style.badgeClass}`}
              >
                {style.label}
              </span>
            </div>
          );
        },
      };
    });

    return [...baseCols, ...unitCols];
  }, [filteredUnits]);

  const toolbarLeft = (
    <div className="w-64">
      <SegmentedControl
        value={skillFilter}
        onChange={(val) => setSkillFilter(val as any)}
        options={[
          { value: 'all', label: 'Tất Cả' },
          { value: 'vocab', label: 'Từ Vựng' },
          { value: 'grammar', label: 'Ngữ Pháp' },
        ]}
        size="sm"
      />
    </div>
  );

  return (
    <div className="bg-white dark:bg-[#0c0f1d] rounded-2xl p-5 space-y-4 select-none shadow-sm dark:shadow-lg">
      {/* Title Bar */}
      <div className="pb-1">
        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <LayoutGrid size={16} className="text-blue-600 dark:text-blue-400" />
          Ma Trận Nắm Vững Kiến Thức (Mastery Heatmap)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Bảng màu trực quan theo thang đo 4 mức (Đỏ &lt; 5.0, Cam 5.0-6.4, Vàng 6.5-7.9, Xanh &ge; 8.0).
        </p>
      </div>

      {/* TanStack DataTable with Dynamic Columns */}
      <DataTable<HeatmapStudent>
        tableId="mastery-heatmap-table"
        data={students}
        columns={columns}
        pageSize={10}
        searchPlaceholder="Tìm kiếm học sinh..."
        emptyMessage="Chưa có dữ liệu bài kiểm tra nào."
        toolbarLeft={toolbarLeft}
        exportFilename="ma_tran_nam_vung_kien_thuc"
        borderless={true}
        onRowClick={(row) => onSelectStudent && onSelectStudent(row.student_id)}
        initialSorting={[{ id: 'student_name', desc: false }]}
      />

      {/* 4-Color Scale Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-[11px] text-slate-600 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-800 dark:text-slate-300">Thang Điểm 4 Mức:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 block" />
            <span className="text-emerald-700 dark:text-emerald-300 font-bold">Xanh: Nắm Vững (&ge; 8.0)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 block" />
            <span className="text-amber-700 dark:text-amber-300 font-bold">Vàng: Đang Tiến Bộ (6.5 – 7.9)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-orange-500 block" />
            <span className="text-orange-700 dark:text-orange-300 font-bold">Cam: Cần Củng Cố (5.0 – 6.4)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500 block" />
            <span className="text-rose-700 dark:text-rose-300 font-bold">Đỏ: Chưa Đạt (&lt; 5.0)</span>
          </div>
        </div>

        <span className="text-slate-500 italic text-[10px]">
          Điểm số là điểm EMA tích lũy của học sinh đối với từng bài học
        </span>
      </div>

      {/* Dynamic Colorful Hover Tooltip */}
      {hoveredCell && (
        <div
          style={{
            position: 'fixed',
            left: hoveredCell.x,
            top: hoveredCell.y,
            transform: hoveredCell.showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
          }}
          className="z-50 pointer-events-none bg-white dark:bg-[#0e1224] rounded-2xl p-4 shadow-xl dark:shadow-[0_15px_35px_rgba(0,0,0,0.85)] text-xs text-slate-900 dark:text-white space-y-2.5 min-w-[240px] select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-1">
            <span className="font-black text-slate-900 dark:text-white text-sm">{hoveredCell.studentName}</span>
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
              hoveredCell.data.skill === 'vocab'
                ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                : 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
            }`}>
              {hoveredCell.data.skill === 'vocab' ? 'Từ Vựng' : 'Ngữ Pháp'}
            </span>
          </div>

          {/* Unit Title */}
          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-300">
            {hoveredCell.unitKey}
          </div>

          {/* Stats */}
          <div className="space-y-1.5 bg-slate-50 dark:bg-[#080b16] p-2.5 rounded-xl border border-slate-200 dark:border-white/5 font-mono text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Điểm EMA Tích Lũy:</span>
              <span className={`font-black text-sm ${
                hoveredCell.data.ema_score >= 8.0 ? 'text-emerald-600 dark:text-emerald-400' :
                hoveredCell.data.ema_score >= 6.5 ? 'text-amber-600 dark:text-amber-400' :
                hoveredCell.data.ema_score >= 5.0 ? 'text-orange-600 dark:text-orange-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {trunc1Dec(hoveredCell.data.ema_score)} / 10
              </span>
            </div>

            {hoveredCell.data.last_score !== undefined && (
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span className="text-slate-500 dark:text-slate-400">Điểm Test Gần Nhất:</span>
                <span className="font-bold text-slate-900 dark:text-white">{trunc1Dec(hoveredCell.data.last_score)}đ</span>
              </div>
            )}

            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 dark:text-slate-400">Số Lần Đã Test:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-300">{hoveredCell.data.test_count} buổi</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Trạng thái:</span>
            <span className={`font-black px-2 py-0.5 rounded-md ${
              hoveredCell.data.ema_score >= 8.0 ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' :
              hoveredCell.data.ema_score >= 6.5 ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' :
              hoveredCell.data.ema_score >= 5.0 ? 'bg-orange-500/15 text-orange-700 dark:text-orange-300' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
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
