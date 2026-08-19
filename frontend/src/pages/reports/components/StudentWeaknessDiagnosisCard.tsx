import React, { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../components/DataTable';
import { AlertTriangle } from 'lucide-react';
import { format1Dec } from '../../../utils';
import {
  computeWeaknessRemedialList,
  StudentRemedialSummaryRow,
  StudentWeakUnitItem,
} from '../utils/computeWeaknessRemedial';

export type { StudentWeakUnitItem, StudentRemedialSummaryRow };

interface StudentWeaknessDiagnosisCardProps {
  sessionRecords: any[];
  studentRankings: any[];
  selectedClassId: string;
  selectedStudentId?: string;
  onSelectStudent?: (studentId: number) => void;
  heatmapStudents?: any[];
  isTestMode?: boolean;
}

export const StudentWeaknessDiagnosisCard: React.FC<StudentWeaknessDiagnosisCardProps> = ({
  sessionRecords,
  selectedClassId,
  selectedStudentId,
  onSelectStudent,
  heatmapStudents,
  isTestMode,
}) => {
  const [skillFilter, setSkillFilter] = useState<'all' | 'grammar' | 'vocab'>('all');

  const studentRemedialList = useMemo<StudentRemedialSummaryRow[]>(() => {
    return computeWeaknessRemedialList({
      heatmapStudents,
      sessionRecords,
      selectedClassId,
      selectedStudentId,
      isTestMode,
    });
  }, [heatmapStudents, sessionRecords, selectedClassId, selectedStudentId, isTestMode]);

  const filteredData = useMemo(() => {
    if (skillFilter === 'all') return studentRemedialList;
    if (skillFilter === 'grammar') {
      return studentRemedialList.filter((r) => r.grammar_count > 0);
    }
    return studentRemedialList.filter((r) => r.vocab_count > 0);
  }, [studentRemedialList, skillFilter]);

  const stats = useMemo(() => {
    const totalStudents = studentRemedialList.length;
    const urgentCount = studentRemedialList.filter((r) => r.urgent_count > 0).length;
    const totalGrammarWeak = studentRemedialList.reduce((sum, r) => sum + r.grammar_count, 0);
    const totalVocabWeak = studentRemedialList.reduce((sum, r) => sum + r.vocab_count, 0);
    return { totalStudents, urgentCount, totalGrammarWeak, totalVocabWeak };
  }, [studentRemedialList]);

  const columns = useMemo<ColumnDef<StudentRemedialSummaryRow>[]>(
    () => [
      {
        id: 'stt',
        header: () => <div className="text-center w-full">STT</div>,
        meta: { headerText: 'STT', exportValue: (_: any, idx: number) => idx + 1 },
        cell: ({ row }) => (
          <div className="text-center font-bold text-slate-400 text-xs">{row.index + 1}</div>
        ),
        enableSorting: false,
        enableGlobalFilter: false,
      },
      {
        accessorKey: 'student_name',
        header: 'Học Sinh',
        meta: {
          headerText: 'Học Sinh',
          exportValue: (r: StudentRemedialSummaryRow) => `${r.student_name}${r.nickname ? ` (${r.nickname})` : ''}`,
        },
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="font-extrabold text-white text-sm flex items-center justify-between gap-2">
              <span>
                {r.student_name}
                {r.nickname ? ` - ${r.nickname}` : ''}
              </span>
              {r.class_name && (
                <span className="text-[10px] text-slate-400 font-normal">({r.class_name})</span>
              )}
            </div>
          );
        },
      },
      {
        id: 'status_badge',
        header: () => <div className="text-center w-full">Mức Độ Cảnh Báo</div>,
        meta: { headerText: 'Mức Độ', exportValue: (r: StudentRemedialSummaryRow) => r.status },
        accessorFn: (r: StudentRemedialSummaryRow) => (r.urgent_count > 0 ? 2 : 1),
        cell: ({ row }) => {
          const r = row.original;
          const isUrgent = r.urgent_count > 0;
          return (
            <div className="text-center">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black border ${
                  isUrgent
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                }`}
              >
                {isUrgent && <AlertTriangle size={12} className="text-rose-400" />}
                {r.status}
              </span>
            </div>
          );
        },
      },
      {
        id: 'weak_topics_list',
        header: 'Chuyên Đề Cần Ôn Tập & Điểm EMA',
        meta: {
          headerText: 'Chuyên Đề Yếu',
          exportValue: (r: StudentRemedialSummaryRow) =>
            r.weak_units
              .map(
                (u: StudentWeakUnitItem) =>
                  `[${u.skill === 'grammar' ? 'Ngữ Pháp' : 'Từ Vựng'}] ${u.topic_name}: ${format1Dec(
                    u.avg_score
                  )}đ`
              )
              .join(', '),
        },
        cell: ({ row }) => {
          const units = row.original.weak_units;
          return (
            <div className="flex flex-wrap items-center gap-1.5 py-1">
              {units.map((u, i) => {
                const isUrgent = u.avg_score < 5.0;
                const isGrammar = u.skill === 'grammar';
                return (
                  <span
                    key={`${u.unit_key}-${i}`}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                      isUrgent
                        ? 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                        : isGrammar
                        ? 'bg-purple-950/50 border-purple-500/40 text-purple-200'
                        : 'bg-blue-950/50 border-blue-500/40 text-blue-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isUrgent ? 'bg-rose-400' : isGrammar ? 'bg-purple-400' : 'bg-blue-400'
                      }`}
                    />
                    <span className="truncate max-w-[150px]" title={u.topic_name}>
                      {u.topic_name}
                    </span>
                    <span
                      className={`font-mono font-black ${
                        isUrgent ? 'text-rose-300' : 'text-slate-300'
                      }`}
                    >
                      {format1Dec(u.avg_score)}đ
                    </span>
                  </span>
                );
              })}
            </div>
          );
        },
      },
      {
        id: 'weak_counts',
        header: () => <div className="text-center w-full">Tổng Số Chuyên Đề Hổng</div>,
        meta: { headerText: 'Số Chuyên Đề', exportValue: (r: StudentRemedialSummaryRow) => r.total_weak_count },
        accessorFn: (r: StudentRemedialSummaryRow) => r.total_weak_count,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="text-center font-mono font-bold text-xs space-x-1">
              <span className="text-white font-extrabold">{r.total_weak_count}</span>
              <span className="text-slate-500">
                ({r.grammar_count} NP, {r.vocab_count} TV)
              </span>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="bg-[#0c0f1d] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4 select-none">
      {/* 1. Header with Stats & Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400" />
              Chẩn Đoán Lỗ Hổng Kiến Thức & Danh Sách Cần Phụ Đạo
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Tổng hợp các Unit/chuyên đề có điểm EMA dưới 6.5đ để giáo viên lên lộ trình bổ trợ cá
            nhân hóa
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-[#121626] border border-white/10 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setSkillFilter('all')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              skillFilter === 'all'
                ? 'bg-indigo-600 text-white font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tất Cả ({stats.totalStudents})
          </button>
          <button
            type="button"
            onClick={() => setSkillFilter('grammar')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              skillFilter === 'grammar'
                ? 'bg-purple-600 text-white font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hổng Ngữ Pháp
          </button>
          <button
            type="button"
            onClick={() => setSkillFilter('vocab')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              skillFilter === 'vocab'
                ? 'bg-blue-600 text-white font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hổng Từ Vựng
          </button>
        </div>
      </div>

      {/* 2. Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-[#121626] border border-white/5 p-3 rounded-xl">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">
            Học Sinh Cần Bổ Trợ
          </span>
          <span className="text-xl font-black text-amber-400 font-mono">
            {stats.totalStudents} em
          </span>
        </div>
        <div className="bg-[#121626] border border-rose-500/20 p-3 rounded-xl">
          <span className="text-rose-400 block text-[10px] uppercase font-bold">
            Cần Phụ Đạo Gấp (&lt;5đ)
          </span>
          <span className="text-xl font-black text-rose-400 font-mono">
            {stats.urgentCount} em
          </span>
        </div>
        <div className="bg-[#121626] border border-purple-500/20 p-3 rounded-xl">
          <span className="text-purple-400 block text-[10px] uppercase font-bold">
            Lượt Hổng Ngữ Pháp
          </span>
          <span className="text-xl font-black text-purple-400 font-mono">
            {stats.totalGrammarWeak} chuyên đề
          </span>
        </div>
        <div className="bg-[#121626] border border-blue-500/20 p-3 rounded-xl">
          <span className="text-blue-400 block text-[10px] uppercase font-bold">
            Lượt Hổng Từ Vựng
          </span>
          <span className="text-xl font-black text-blue-400 font-mono">
            {stats.totalVocabWeak} chuyên đề
          </span>
        </div>
      </div>

      {/* 3. DataTable */}
      <DataTable
        tableId="student-weakness-diagnosis-table"
        exportFilename="danh_sach_hoc_sinh_can_phu_dao"
        data={filteredData}
        columns={columns}
        searchPlaceholder="Tìm học sinh cần phụ đạo theo tên..."
        emptyMessage="Không có học sinh nào bị hổng kiến thức trong phạm vi này."
        pageSize={20}
        onRowClick={(row) => onSelectStudent?.(row.student_id)}
      />
    </div>
  );
};
