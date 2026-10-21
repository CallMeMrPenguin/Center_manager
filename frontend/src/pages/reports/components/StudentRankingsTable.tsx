import React, { useCallback } from 'react';
import { GraduationCap } from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import { CustomSelect } from '../../../components/CustomSelect';
import { exportRankingsExcel } from '../utils/exportRankingsExcel';
import { exportRankingsVisual } from '../utils/exportRankingsVisual';
import { DistributionScoreBin } from '../utils/distributionAnalytics';
import { useRankingColumns } from './useRankingColumns';

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
  const { rankingColumns } = useRankingColumns({ studentSessionsMap, selectedStudentId });

  const getResolvedVisibleCols = (info?: { visibleColumnIds?: string[] }) => {
    let visibleColumnIds = info?.visibleColumnIds;
    if (!visibleColumnIds || visibleColumnIds.length === 0) {
      try {
        const layout = localStorage.getItem('dt_layout_reports-rankings-table');
        if (layout) {
          const parsed = JSON.parse(layout);
          const vis = parsed.visibility || {};
          const ord: string[] = parsed.order || [];
          const defaultCols = ['stt', 'full_name', 'class_name', 'present_count', 'avg_vocab', 'avg_grammar', 'avg_homework', 'avg_mock_test', 'trend_sparkline', 'rankTier', 'overallAvg'];
          const baseOrder = ord.length ? ord : defaultCols;
          visibleColumnIds = baseOrder.filter((id) => vis[id] !== false && defaultCols.includes(id));
        }
      } catch (e) {}
    }
    return visibleColumnIds;
  };

  const handleExportRankingsExcel = useCallback((info?: { visibleColumnIds?: string[] }) => {
    const visibleColumnIds = getResolvedVisibleCols(info);
    exportRankingsExcel({
      classes,
      selectedClassId,
      studentRankings,
      filteredRankings,
      visibleColumnIds,
    });
  }, [selectedClassId, classes, studentRankings, filteredRankings]);

  const handleExportRankingsPdf = useCallback((info?: { visibleColumnIds?: string[] }) => {
    const visibleColumnIds = getResolvedVisibleCols(info);
    const selClass = classes.find((c) => String(c.id) === selectedClassId);
    exportRankingsVisual({
      className: selClass?.class_name || 'Tất Cả Lớp',
      rankings: filteredRankings,
      visibleColumnIds,
      asPdf: true,
    });
  }, [classes, selectedClassId, filteredRankings]);

  const handleExportRankingsPng = useCallback((info?: { visibleColumnIds?: string[] }) => {
    const visibleColumnIds = getResolvedVisibleCols(info);
    const selClass = classes.find((c) => String(c.id) === selectedClassId);
    exportRankingsVisual({
      className: selClass?.class_name || 'Tất Cả Lớp',
      rankings: filteredRankings,
      visibleColumnIds,
      asPdf: false,
    });
  }, [classes, selectedClassId, filteredRankings]);

  return (
    <div className={`bg-white dark:bg-[#141417] border-0 rounded-2xl flex flex-col shadow-sm dark:shadow-xl mb-8 transition-colors ${hasSelectedStudent ? 'animate-cascade-4' : 'animate-cascade-3'}`}>
      <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            BẢNG XẾP HẠNG
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Xếp hạng học sinh theo điểm trung bình tổng hợp và tiến độ học tập
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CustomSelect
            value={selectedClassId}
            onChange={(val) => {
              setSelectedClassId(val);
              setSelectedStudentId('');
            }}
            options={[
              { value: '', label: 'Tất cả lớp học' },
              ...classes.map((c) => ({
                value: String(c.id),
                label: c.class_name,
              })),
            ]}
            icon={<GraduationCap size={15} className="text-blue-500" />}
            className="w-44"
          />
        </div>
      </div>

      {/* Active Histogram Score Bin Filter Bar */}
      {selectedScoreBin && (
        <div className="mx-5 my-3 flex items-center justify-between bg-blue-950/70 border-0 px-4 py-2.5 rounded-xl text-xs font-bold text-blue-200 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
            <span>
              Đang lọc theo mức điểm: <strong className="text-white font-mono text-sm">{selectedScoreBin.rangeLabel}</strong> ({filteredRankings.length} học sinh)
            </span>
          </div>
          <button
            type="button"
            onClick={onClearScoreBin}
            className="px-3 py-1 rounded-lg bg-blue-600/40 hover:bg-blue-600/70 text-white font-bold transition cursor-pointer border-0 shadow-2xs hover:shadow-xs"
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
        onExportPdf={handleExportRankingsPdf}
        onExportPng={handleExportRankingsPng}
        getRowClassName={(row: any) =>
          String(row.student_id) === String(selectedStudentId)
            ? '!bg-blue-500/15 dark:!bg-blue-600/25 hover:!bg-blue-500/25 dark:hover:!bg-blue-600/35 font-black ring-1 ring-inset ring-blue-500/50 shadow-inner'
            : ''
        }
      />
    </div>
  );
});
