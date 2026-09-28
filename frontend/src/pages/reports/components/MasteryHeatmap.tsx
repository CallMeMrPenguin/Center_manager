import React, { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../components/DataTable';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { LayoutGrid } from 'lucide-react';
import {
  HeatmapUnit,
  HeatmapStudent,
  StudentUnitData,
  resolveFullUnitInfo,
  getBadgeStyle,
} from './heatmapUtils';
import {
  MasteryTooltip,
  HoveredColState,
  HoveredCellState,
} from './MasteryTooltip';

export * from './heatmapUtils';

interface MasteryHeatmapProps {
  units: HeatmapUnit[];
  students: HeatmapStudent[];
  onSelectStudent?: (studentId: number) => void;
  grade?: string;
}

export const MasteryHeatmap: React.FC<MasteryHeatmapProps> = ({
  units,
  students,
  onSelectStudent,
  grade,
}) => {
  const [skillFilter, setSkillFilter] = useState<'all' | 'vocab' | 'grammar'>('all');
  const [hoveredCol, setHoveredCol] = useState<HoveredColState | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HoveredCellState | null>(null);

  const filteredUnits = useMemo(() => {
    if (skillFilter === 'all') return units;
    return units.filter((u) => u.skill === skillFilter);
  }, [units, skillFilter]);

  const handleHeaderMouseMove = (e: React.MouseEvent, unit: HeatmapUnit) => {
    setHoveredCell(null);
    setHoveredCol({
      unit,
      x: e.clientX,
      y: e.clientY,
      grade,
    });
  };

  const handleHeaderMouseLeave = () => {
    setHoveredCol(null);
  };

  const handleCellMouseMove = (
    e: React.MouseEvent,
    student: HeatmapStudent,
    unit: HeatmapUnit,
    data?: StudentUnitData
  ) => {
    setHoveredCol(null);
    setHoveredCell({
      student,
      unit,
      data,
      x: e.clientX,
      y: e.clientY,
      grade: student.grade || grade,
    });
  };

  const handleCellMouseLeave = () => {
    setHoveredCell(null);
  };

  const columns = useMemo<ColumnDef<HeatmapStudent>[]>(() => {
    const baseCols: ColumnDef<HeatmapStudent>[] = [
      {
        id: 'stt',
        header: () => <div className="text-center w-full">STT</div>,
        cell: ({ row }) => (
          <div className="text-center font-bold text-slate-500 dark:text-slate-400">
            {row.index + 1}
          </div>
        ),
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
      const unitInfo = resolveFullUnitInfo(u.unit_key, u.unit_name, grade);

      return {
        id: `unit_${colKey}`,
        header: () => (
          <div
            onMouseMove={(e) => handleHeaderMouseMove(e, u)}
            onMouseLeave={handleHeaderMouseLeave}
            className="flex flex-col items-center justify-center w-full py-1 cursor-pointer select-none group/unit-hdr"
            title={unitInfo.fullTitle}
          >
            {/* Unit Key without being truncated or covered */}
            <div className="text-xs font-black text-slate-900 dark:text-white tracking-tight leading-snug text-center whitespace-normal break-words px-1 max-w-[130px]">
              {u.unit_key}
            </div>
            {/* Skill badge - average removed from heading text and visible on hover */}
            <div className="mt-1">
              <span
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block transition-transform duration-150 group-hover/unit-hdr:scale-105 ${
                  u.skill === 'vocab'
                    ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                    : 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                }`}
              >
                {u.skill === 'vocab' ? 'Từ Vựng' : 'Ngữ Pháp'}
              </span>
            </div>
          </div>
        ),
        accessorFn: (row) => {
          const uData =
            row.units?.[colKey] ||
            (row.units?.[u.unit_key]?.skill === u.skill ? row.units?.[u.unit_key] : undefined);
          return uData?.ema_score ?? -1;
        },
        size: 130,
        minSize: 110,
        cell: ({ row }) => {
          const uData =
            row.original.units?.[colKey] ||
            (row.original.units?.[u.unit_key]?.skill === u.skill
              ? row.original.units?.[u.unit_key]
              : undefined);
          const ema = uData?.ema_score;
          const style = getBadgeStyle(ema);

          return (
            <div className="flex items-center justify-center py-0.5">
              <span
                onMouseMove={(e) => handleCellMouseMove(e, row.original, u, uData)}
                onMouseLeave={handleCellMouseLeave}
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
  }, [filteredUnits, grade]);

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
          Bảng màu trực quan theo thang đo 4 mức. Rê chuột vào tiêu đề cột hoặc ô điểm từng học sinh để xem tên Unit và điểm trung bình.
        </p>
      </div>

      {/* TanStack DataTable with Clean Layout */}
      <DataTable<HeatmapStudent>
        tableId="mastery-heatmap-table"
        data={students}
        columns={columns}
        pageSize={20}
        enableColumnReorder={false}
        enableColumnResizing={true}
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

      {/* Dynamic Hover Tooltip for Column Headers & Student Cells */}
      <MasteryTooltip hoveredCol={hoveredCol} hoveredCell={hoveredCell} />
    </div>
  );
};
