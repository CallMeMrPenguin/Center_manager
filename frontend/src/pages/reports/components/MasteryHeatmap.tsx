import React, { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../components/DataTable';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { LayoutGrid, Palette } from 'lucide-react';
import {
  HeatmapUnit,
  HeatmapStudent,
  StudentUnitData,
  resolveFullUnitInfo,
  getBadgeStyle,
  getMasteryRateStyle,
  useMasteryRateColors,
} from './heatmapUtils';
import {
  MasteryTooltip,
  HoveredColState,
  HoveredCellState,
} from './MasteryTooltip';
import { MasteryColorModal } from './MasteryColorModal';

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
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const masteryColorConfig = useMasteryRateColors();

  const filteredUnits = useMemo(() => {
    if (skillFilter === 'all') return units;
    return units.filter((u) => u.skill === skillFilter);
  }, [units, skillFilter]);

  const handleHeaderMouseEnter = (e: React.MouseEvent<HTMLElement>, unit: HeatmapUnit) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredCell(null);
    setHoveredCol({
      unit,
      targetRect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
      },
      grade,
    });
  };

  const handleHeaderMouseLeave = () => {
    setHoveredCol(null);
  };

  const handleCellMouseEnter = (
    e: React.MouseEvent<HTMLElement>,
    student: HeatmapStudent,
    unit: HeatmapUnit,
    data?: StudentUnitData
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredCol(null);
    setHoveredCell({
      student,
      unit,
      data,
      targetRect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
      },
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
      const unitInfo = resolveFullUnitInfo(u.unit_key, u.unit_name, grade, u.skill, u.grammar_topic);
      const isGrammar = u.skill === 'grammar';
      const grammarTopic = unitInfo.grammarTopic || unitInfo.grammarSummaryVi || (unitInfo.grammarTopics && unitInfo.grammarTopics[0]);
      const rateStyle = getMasteryRateStyle(u.mastery_pct, masteryColorConfig);

      return {
        id: `unit_${colKey}`,
        header: () => (
          <div
            onMouseEnter={(e) => handleHeaderMouseEnter(e, u)}
            onMouseLeave={handleHeaderMouseLeave}
            className="flex flex-col items-center justify-center w-full py-1 cursor-pointer select-none group/unit-hdr"
            title={unitInfo.fullTitle}
          >
            {/* Unit Key */}
            <div className="text-xs font-black text-slate-900 dark:text-white tracking-tight leading-snug text-center whitespace-normal break-words px-1 max-w-[130px]">
              {u.unit_key}
            </div>

            {/* Skill badge */}
            <div className="mt-1 flex items-center justify-center">
              <span
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block transition-transform duration-150 group-hover/unit-hdr:scale-105 ${
                  isGrammar
                    ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                    : 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                }`}
              >
                {isGrammar ? 'Ngữ Pháp' : 'Từ Vựng'}
              </span>
            </div>

            {/* Specific Grammar Topic for Grammar / Unit Topic for Vocab */}
            <div className="mt-1 px-1 w-full text-center">
              {isGrammar ? (
                <div
                  className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300 truncate max-w-[125px] mx-auto bg-purple-500/10 px-1.5 py-0.5 rounded"
                  title={`Ngữ pháp: ${grammarTopic || 'Cốt lõi'}`}
                >
                  {grammarTopic || 'Ngữ pháp Unit'}
                </div>
              ) : (
                <div
                  className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate max-w-[125px] mx-auto px-0.5"
                  title={`Chủ đề: ${unitInfo.unitName}`}
                >
                  {unitInfo.unitName || 'Từ vựng Unit'}
                </div>
              )}
            </div>

            {/* Tỷ Lệ Nắm Vững with custom level color */}
            {u.mastery_pct !== undefined && (
              <div className="mt-1 flex items-center justify-center">
                <span
                  className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md transition-all ${rateStyle.badgeClass}`}
                  title={`Tỷ lệ nắm vững cả lớp: ${u.mastery_pct}% (${u.mastered_count ?? 0}/${u.student_count ?? 0} HS) - ${rateStyle.label}`}
                >
                  {u.mastery_pct}%
                </span>
              </div>
            )}
          </div>
        ),
        accessorFn: (row) => {
          const uData =
            row.units?.[colKey] ||
            (row.units?.[u.unit_key]?.skill === u.skill ? row.units?.[u.unit_key] : undefined);
          return uData?.ema_score ?? -1;
        },
        size: 135,
        minSize: 115,
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
                onMouseEnter={(e) => handleCellMouseEnter(e, row.original, u, uData)}
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
  }, [filteredUnits, grade, masteryColorConfig]);

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
          Bảng màu trực quan theo thang đo 4 mức. Cột ngữ pháp hiển thị rõ chủ điểm ngữ pháp và tỷ lệ nắm vững theo màu từng cấp độ.
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

      {/* 4-Color Scale Legend & Custom Mastery Rate Level Scale */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-600 dark:text-slate-400">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-slate-800 dark:text-slate-300">Thang Điểm EMA (4 Mức):</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 block" />
              <span className="text-emerald-700 dark:text-emerald-300 font-bold">Nắm Vững (&ge; 8.0)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500 block" />
              <span className="text-amber-700 dark:text-amber-300 font-bold">Đang Tiến Bộ (6.5 – 7.9)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-orange-500 block" />
              <span className="text-orange-700 dark:text-orange-300 font-bold">Cần Củng Cố (5.0 – 6.4)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500 block" />
              <span className="text-rose-700 dark:text-rose-300 font-bold">Chưa Đạt (&lt; 5.0)</span>
            </div>
          </div>

          <span className="text-slate-500 italic text-[10px]">
            Điểm EMA tích lũy qua các buổi kiểm tra của từng học sinh
          </span>
        </div>

        {/* Thang Tỷ Lệ Nắm Vững (Mastery Rate) with Active Custom Colors */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-800 dark:text-slate-300">Thang Tỷ Lệ Nắm Vững:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: masteryColorConfig.tiers.level_4.hex }} />
              <span className="font-extrabold text-slate-700 dark:text-slate-300">
                {masteryColorConfig.tiers.level_4.label} (&ge; {masteryColorConfig.tiers.level_4.minPct}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: masteryColorConfig.tiers.level_3.hex }} />
              <span className="font-extrabold text-slate-700 dark:text-slate-300">
                {masteryColorConfig.tiers.level_3.label} (&ge; {masteryColorConfig.tiers.level_3.minPct}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: masteryColorConfig.tiers.level_2.hex }} />
              <span className="font-extrabold text-slate-700 dark:text-slate-300">
                {masteryColorConfig.tiers.level_2.label} (&ge; {masteryColorConfig.tiers.level_2.minPct}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: masteryColorConfig.tiers.level_1.hex }} />
              <span className="font-extrabold text-slate-700 dark:text-slate-300">
                {masteryColorConfig.tiers.level_1.label} (&lt; {masteryColorConfig.tiers.level_2.minPct}%)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsColorModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold transition cursor-pointer text-xs"
          >
            <Palette size={13} />
            <span>Tùy Chỉnh Màu Thang Đo</span>
          </button>
        </div>
      </div>

      {/* Dynamic Hover Tooltip for Column Headers & Student Cells */}
      <MasteryTooltip hoveredCol={hoveredCol} hoveredCell={hoveredCell} />

      {/* Custom Color Settings Modal */}
      <MasteryColorModal
        isOpen={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
      />
    </div>
  );
};
