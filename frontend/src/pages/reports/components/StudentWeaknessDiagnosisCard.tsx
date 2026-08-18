import React, { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../components/DataTable';
import { AlertTriangle } from 'lucide-react';
import { trunc1Dec, format1Dec } from '../../../utils';

export interface StudentWeakUnitItem {
  unit_key: string;
  skill: 'vocab' | 'grammar';
  topic_name: string;
  avg_score: number;
  test_count: number;
}

export interface StudentRemedialSummaryRow {
  id: string;
  student_id: number;
  student_name: string;
  nickname: string;
  class_name: string;
  weak_units: StudentWeakUnitItem[];
  total_weak_count: number;
  grammar_count: number;
  vocab_count: number;
  urgent_count: number;
  lowest_score: number;
  status: string;
}

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

  // Aggregate student weaknesses (No fake Unit 1 in real mode!)
  const studentRemedialList = useMemo<StudentRemedialSummaryRow[]>(() => {
    if (heatmapStudents && heatmapStudents.length > 0) {
      const rows: StudentRemedialSummaryRow[] = [];

      heatmapStudents.forEach(st => {
        if (selectedStudentId && selectedStudentId !== '0' && selectedStudentId !== '' && String(st.student_id) !== String(selectedStudentId)) {
          return;
        }

        const weakUnits: StudentWeakUnitItem[] = [];
        Object.entries(st.units || {}).forEach(([uKey, uData]: [string, any]) => {
          if (uData.ema_score !== undefined && uData.ema_score !== null && uData.ema_score < 6.5) {
            weakUnits.push({
              unit_key: uKey,
              skill: (uData.skill as any) || 'grammar',
              topic_name: uKey,
              avg_score: trunc1Dec(uData.ema_score),
              test_count: uData.test_count || 1,
            });
          }
        });

        if (weakUnits.length > 0) {
          weakUnits.sort((a, b) => a.avg_score - b.avg_score);
          const urgentCount = weakUnits.filter(u => u.avg_score < 5.0).length;
          const grammarCount = weakUnits.filter(u => u.skill === 'grammar').length;
          const vocabCount = weakUnits.filter(u => u.skill === 'vocab').length;
          const lowestScore = weakUnits[0]?.avg_score ?? 0;

          rows.push({
            id: String(st.student_id),
            student_id: st.student_id,
            student_name: st.student_name,
            nickname: st.nickname || '',
            class_name: st.class_name || '',
            weak_units: weakUnits,
            total_weak_count: weakUnits.length,
            grammar_count: grammarCount,
            vocab_count: vocabCount,
            urgent_count: urgentCount,
            lowest_score: lowestScore,
            status: urgentCount > 0 ? 'Cần Phụ Đạo Gấp' : 'Cần Củng Cố',
          });
        }
      });

      return rows.sort((a, b) => (b.urgent_count - a.urgent_count) || (b.total_weak_count - a.total_weak_count));
    }

    // Fallback ONLY when explicit topics exist in sessionRecords or in test mode
    let list = selectedClassId ? sessionRecords.filter(r => String(r.class_id) === selectedClassId) : sessionRecords;
    if (selectedStudentId && selectedStudentId !== '0' && selectedStudentId !== '') {
      list = list.filter(r => String(r.student_id) === String(selectedStudentId));
    }
    if (!list || list.length === 0) return [];

    const studentScoreMap = new Map<number, {
      name: string;
      nickname: string;
      className: string;
      unitMap: Map<string, { unit_key: string; skill: 'vocab' | 'grammar'; topic_name: string; scores: number[] }>;
    }>();

    list.forEach(r => {
      // In real data mode, DO NOT invent Unit 1 if topic is empty!
      const uKey = r.topic || (isTestMode ? `Unit ${Math.min(12, Math.floor(((r.session_id || 1001) - 1001) / 2) + 1)}` : null);
      if (!uKey) return; // Skip sessions with no test topic configured

      if (r.attendance !== 'absent') {
        const sid = Number(r.student_id);
        if (!studentScoreMap.has(sid)) {
          studentScoreMap.set(sid, {
            name: r.full_name,
            nickname: r.nickname || '',
            className: r.class_name || '',
            unitMap: new Map(),
          });
        }

        const gTopic = r.check_2_topic || r.grammar_topic || `${uKey}: Ngữ pháp`;
        const vTopic = r.check_1_topic || `${uKey}: Từ vựng`;

        const stData = studentScoreMap.get(sid)!;

        // Collect vocab scores
        if (r.check_1 !== null && r.check_1 !== undefined) {
          const vk = `${uKey}-vocab`;
          if (!stData.unitMap.has(vk)) {
            stData.unitMap.set(vk, { unit_key: uKey, skill: 'vocab', topic_name: vTopic, scores: [] });
          }
          stData.unitMap.get(vk)!.scores.push(Number(r.check_1));
        }

        // Collect grammar scores
        if (r.check_2 !== null && r.check_2 !== undefined) {
          const gk = `${uKey}-grammar`;
          if (!stData.unitMap.has(gk)) {
            stData.unitMap.set(gk, { unit_key: uKey, skill: 'grammar', topic_name: gTopic, scores: [] });
          }
          stData.unitMap.get(gk)!.scores.push(Number(r.check_2));
        }
      }
    });

    const rows: StudentRemedialSummaryRow[] = [];

    studentScoreMap.forEach((stData, sid) => {
      const weakUnits: StudentWeakUnitItem[] = [];

      stData.unitMap.forEach((uData) => {
        if (uData.scores.length > 0) {
          const avg = trunc1Dec(uData.scores.reduce((a, b) => a + b, 0) / uData.scores.length);
          if (avg < 6.5) {
            weakUnits.push({
              unit_key: uData.unit_key,
              skill: uData.skill,
              topic_name: uData.topic_name,
              avg_score: avg,
              test_count: uData.scores.length,
            });
          }
        }
      });

      if (weakUnits.length > 0) {
        weakUnits.sort((a, b) => a.avg_score - b.avg_score);
        const urgentCount = weakUnits.filter(u => u.avg_score < 5.0).length;
        const grammarCount = weakUnits.filter(u => u.skill === 'grammar').length;
        const vocabCount = weakUnits.filter(u => u.skill === 'vocab').length;
        const lowestScore = weakUnits[0]?.avg_score ?? 0;

        rows.push({
          id: String(sid),
          student_id: sid,
          student_name: stData.name,
          nickname: stData.nickname,
          class_name: stData.className,
          weak_units: weakUnits,
          total_weak_count: weakUnits.length,
          grammar_count: grammarCount,
          vocab_count: vocabCount,
          urgent_count: urgentCount,
          lowest_score: lowestScore,
          status: urgentCount > 0 ? 'Cần Phụ Đạo Gấp' : 'Cần Củng Cố',
        });
      }
    });

    return rows.sort((a, b) => (b.urgent_count - a.urgent_count) || (b.total_weak_count - a.total_weak_count));
  }, [heatmapStudents, sessionRecords, selectedClassId, selectedStudentId, isTestMode]);

  const filteredData = useMemo(() => {
    if (skillFilter === 'all') return studentRemedialList;
    if (skillFilter === 'grammar') {
      return studentRemedialList.filter(r => r.grammar_count > 0);
    }
    return studentRemedialList.filter(r => r.vocab_count > 0);
  }, [studentRemedialList, skillFilter]);

  const stats = useMemo(() => {
    const totalStudents = studentRemedialList.length;
    const urgentCount = studentRemedialList.filter(r => r.urgent_count > 0).length;
    const totalGrammarWeak = studentRemedialList.reduce((sum, r) => sum + r.grammar_count, 0);
    const totalVocabWeak = studentRemedialList.reduce((sum, r) => sum + r.vocab_count, 0);
    return { totalStudents, urgentCount, totalGrammarWeak, totalVocabWeak };
  }, [studentRemedialList]);

  const columns = useMemo<ColumnDef<StudentRemedialSummaryRow>[]>(() => [
    {
      id: 'stt',
      header: () => <div className="text-center w-full">STT</div>,
      meta: { headerText: 'STT', exportValue: (_: any, idx: number) => idx + 1 },
      cell: ({ row }) => <div className="text-center font-bold text-slate-400">{row.index + 1}</div>,
      enableSorting: false,
      enableGlobalFilter: false,
    },
    {
      accessorKey: 'student_name',
      header: 'Học Sinh',
      meta: { headerText: 'Học Sinh', exportValue: (r: StudentRemedialSummaryRow) => `${r.student_name} ${r.nickname ? `(${r.nickname})` : ''}` },
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-bold text-white group-hover:text-indigo-300 transition text-xs">
            {row.original.student_name}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {row.original.nickname && (
              <span className="text-[10px] font-extrabold text-indigo-300 bg-indigo-500/15 px-1.5 py-0.5 rounded border border-indigo-500/20">
                {row.original.nickname}
              </span>
            )}
            <span className="text-[10px] text-slate-400 font-semibold bg-[#121626] px-1.5 py-0.5 rounded border border-white/5">
              {row.original.class_name || 'Lớp học'}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'total_weak_count',
      header: () => <div className="text-center w-full">Số Bài Cần Kèm</div>,
      meta: { headerText: 'Số Bài Cần Kèm', exportValue: (r: StudentRemedialSummaryRow) => `${r.total_weak_count} bài` },
      cell: ({ row }) => (
        <div className="text-center space-y-1">
          <span className="font-mono font-black text-rose-400 text-sm block">
            {row.original.total_weak_count} bài
          </span>
          <div className="flex items-center justify-center gap-1 flex-wrap">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {row.original.grammar_count} Ngữ Pháp
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {row.original.vocab_count} Từ Vựng
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'weak_units_list',
      header: 'Các Unit Điểm Thấp Cần Kèm',
      enableSorting: false,
      meta: {
        headerText: 'Danh Sách Unit',
        exportValue: (r: StudentRemedialSummaryRow) => r.weak_units.map(u => `${u.unit_key} (${u.skill === 'grammar' ? 'NP' : 'TV'}: ${format1Dec(u.avg_score)}đ)`).join(', ')
      },
      cell: ({ row }) => {
        const units = row.original.weak_units;
        const topUnits = units.slice(0, 4);
        const remaining = units.length - 4;

        return (
          <div className="flex items-center gap-1.5 flex-wrap py-1">
            {topUnits.map((u, i) => {
              const isUrgent = u.avg_score < 5.0;
              const isGrammar = u.skill === 'grammar';
              return (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${
                    isUrgent
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-mono'
                      : 'bg-orange-500/20 text-orange-300 border-orange-500/40 font-mono'
                  }`}
                  title={`${u.topic_name} - ${format1Dec(u.avg_score)}đ (${u.test_count} lần kiểm tra)`}
                >
                  <span className={`text-[9px] font-black uppercase px-1 py-0.2 rounded ${
                    isGrammar ? 'bg-purple-500/30 text-purple-200' : 'bg-blue-500/30 text-blue-200'
                  }`}>
                    {isGrammar ? 'NP' : 'TV'}
                  </span>
                  <span>{u.unit_key}</span>
                  <span className="font-black text-white">{format1Dec(u.avg_score)}đ</span>
                </span>
              );
            })}
            {remaining > 0 && (
              <span className="text-[10px] font-bold text-slate-400 bg-[#121626] border border-white/10 px-2 py-0.5 rounded-lg">
                +{remaining} bài khác
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'lowest_score',
      header: () => <div className="text-center w-full">Điểm Thấp Nhất</div>,
      meta: { headerText: 'Điểm Thấp Nhất', exportValue: (r: StudentRemedialSummaryRow) => format1Dec(r.lowest_score) },
      cell: ({ getValue }) => {
        const val = getValue<number>();
        return (
          <div className="text-center font-mono font-black text-sm">
            <span className={val < 5.0 ? 'text-rose-400' : 'text-orange-400'}>
              {format1Dec(val)}đ
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-center w-full">Mức Độ</div>,
      meta: { headerText: 'Mức Độ', exportValue: (r: StudentRemedialSummaryRow) => r.status },
      cell: ({ getValue }) => {
        const status = getValue<string>();
        const isUrgent = status === 'Cần Phụ Đạo Gấp';
        return (
          <div className="text-center">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                isUrgent
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-orange-500/20 text-orange-300 border-orange-500/40'
              }`}
            >
              {status}
            </span>
          </div>
        );
      },
    },
  ], []);

  const toolbarLeft = (
    <div className="relative flex bg-[#0d1018] p-1 rounded-xl border border-white/10 text-xs font-bold shrink-0 w-80">
      <div
        className="absolute top-1 bottom-1 rounded-lg bg-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.5)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
        style={{
          left: skillFilter === 'all'
            ? '4px'
            : skillFilter === 'grammar'
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
        Tất Cả ({studentRemedialList.length})
      </button>
      <button
        onClick={() => setSkillFilter('grammar')}
        className={`flex-1 relative z-10 py-1 text-center transition cursor-pointer ${
          skillFilter === 'grammar' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
        }`}
      >
        Ngữ Pháp
      </button>
      <button
        onClick={() => setSkillFilter('vocab')}
        className={`flex-1 relative z-10 py-1 text-center transition cursor-pointer ${
          skillFilter === 'vocab' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
        }`}
      >
        Từ Vựng
      </button>
    </div>
  );

  return (
    <div className="bg-[#0c0f1d] border border-white/10 rounded-2xl p-5 space-y-4 select-none shadow-lg animate-cascade-2">
      {/* Title Bar */}
      <div className="border-b border-white/5 pb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400" />
            Danh Sách Học Sinh Cần Phụ Đạo & Kèm Cặp Trọng Điểm
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Tổng hợp danh sách học sinh có bài học &lt; 6.5đ. Bấm vào học sinh để mở Ma trận Nắm vững.
          </p>
        </div>
      </div>

      {/* Quick Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#080c18] border border-white/5 p-3.5 rounded-xl">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase text-slate-400">Học Sinh Cần Kèm</span>
          <div className="text-xl font-black text-amber-400 font-mono">{stats.totalStudents} HS</div>
          <span className="text-[10px] text-slate-500 font-medium block">Có bài học &lt; 6.5đ</span>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase text-slate-400">Cần Phụ Đạo Gấp</span>
          <div className="text-xl font-black text-rose-400 font-mono">{stats.urgentCount} HS</div>
          <span className="text-[10px] text-slate-500 font-medium block">Có bài kiểm tra &lt; 5.0đ</span>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase text-slate-400">Tổng Lượt Ngữ Pháp Hổng</span>
          <div className="text-xl font-black text-purple-400 font-mono">{stats.totalGrammarWeak} lượt</div>
          <span className="text-[10px] text-slate-500 font-medium block">Cần củng cố cấu trúc ngữ pháp</span>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase text-slate-400">Tổng Lượt Từ Vựng Hổng</span>
          <div className="text-xl font-black text-blue-400 font-mono">{stats.totalVocabWeak} lượt</div>
          <span className="text-[10px] text-slate-500 font-medium block">Cần kiểm tra lại từ vựng unit</span>
        </div>
      </div>

      {/* TanStack DataTable */}
      <DataTable<StudentRemedialSummaryRow>
        tableId="student-weakness-diagnosis-table"
        data={filteredData}
        columns={columns}
        pageSize={20}
        searchPlaceholder="Tìm theo tên học sinh, lớp..."
        emptyMessage="Chưa có dữ liệu bài kiểm tra nào hoặc không phát hiện học sinh nào dưới 6.5đ."
        toolbarLeft={toolbarLeft}
        exportFilename="danh_sach_hoc_sinh_can_phu_dao"
        onRowClick={(row) => onSelectStudent && onSelectStudent(row.student_id)}
        initialSorting={[{ id: 'total_weak_count', desc: true }]}
      />
    </div>
  );
};
