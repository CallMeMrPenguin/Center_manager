import React, { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../components/DataTable';
import { AlertCircle, BookOpen, Sparkles } from 'lucide-react';
import { trunc1Dec, format1Dec } from '../../../utils';

export interface WeaknessTableRow {
  id: string;
  student_id: number;
  student_name: string;
  nickname: string;
  class_name: string;
  unit_key: string;
  skill: 'vocab' | 'grammar';
  topic_name: string;
  avg_score: number;
  test_count: number;
  status: string;
}

interface StudentWeaknessDiagnosisCardProps {
  sessionRecords: any[];
  studentRankings: any[];
  selectedClassId: string;
  selectedStudentId?: string;
  onSelectStudent?: (studentId: number) => void;
}

export const StudentWeaknessDiagnosisCard: React.FC<StudentWeaknessDiagnosisCardProps> = ({
  sessionRecords,
  selectedClassId,
  selectedStudentId,
  onSelectStudent,
}) => {
  const [skillFilter, setSkillFilter] = useState<'all' | 'grammar' | 'vocab'>('all');

  // Flattened array of weaknesses for DataTable
  const rawWeaknessList = useMemo<WeaknessTableRow[]>(() => {
    let list = selectedClassId ? sessionRecords.filter(r => String(r.class_id) === selectedClassId) : sessionRecords;
    if (selectedStudentId) {
      list = list.filter(r => String(r.student_id) === selectedStudentId);
    }
    if (!list || list.length === 0) return [];

    // Map: student_id -> Map<unit_skill_key, { ...scores }>
    const studentScoreMap = new Map<number, {
      name: string;
      nickname: string;
      className: string;
      unitMap: Map<string, { unit_key: string; skill: 'vocab' | 'grammar'; topic_name: string; scores: number[] }>;
    }>();

    list.forEach(r => {
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

        const uKey = r.topic || `Unit ${Math.min(12, Math.floor(((r.session_id || 1001) - 1001) / 2) + 1)}`;
        const gTopic = r.check_2_topic || r.grammar_topic || 'Ngữ pháp';
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
            stData.unitMap.set(gk, { unit_key: uKey, skill: 'grammar', topic_name: `${uKey} (${gTopic})`, scores: [] });
          }
          stData.unitMap.get(gk)!.scores.push(Number(r.check_2));
        }
      }
    });

    const rows: WeaknessTableRow[] = [];

    studentScoreMap.forEach((stData, sid) => {
      stData.unitMap.forEach((uData) => {
        if (uData.scores.length > 0) {
          const avg = trunc1Dec(uData.scores.reduce((a, b) => a + b, 0) / uData.scores.length);
          if (avg < 6.5) {
            rows.push({
              id: `${sid}-${uData.unit_key}-${uData.skill}`,
              student_id: sid,
              student_name: stData.name,
              nickname: stData.nickname,
              class_name: stData.className,
              unit_key: uData.unit_key,
              skill: uData.skill,
              topic_name: uData.topic_name,
              avg_score: avg,
              test_count: uData.scores.length,
              status: avg < 5.0 ? 'Cần Phụ Đạo Gấp' : 'Cần Củng Cố',
            });
          }
        }
      });
    });

    return rows.sort((a, b) => a.avg_score - b.avg_score);
  }, [sessionRecords, selectedClassId]);

  const filteredData = useMemo(() => {
    if (skillFilter === 'all') return rawWeaknessList;
    return rawWeaknessList.filter(r => r.skill === skillFilter);
  }, [rawWeaknessList, skillFilter]);

  const columns = useMemo<ColumnDef<WeaknessTableRow>[]>(() => [
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
      meta: { headerText: 'Học Sinh', exportValue: (r: WeaknessTableRow) => `${r.student_name} ${r.nickname ? `(${r.nickname})` : ''}` },
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-white group-hover:text-indigo-300 transition">
            {row.original.student_name}
          </span>
          {row.original.nickname && (
            <span className="text-[11px] text-slate-400 font-semibold">
              Biệt danh: {row.original.nickname}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'class_name',
      header: 'Lớp Học',
      meta: { headerText: 'Lớp Học', exportValue: (r: WeaknessTableRow) => r.class_name },
      cell: (info) => <span className="font-bold text-slate-300">{info.getValue<string>() || 'Lớp học'}</span>,
    },
    {
      accessorKey: 'unit_key',
      header: 'Bài Học / Unit',
      meta: { headerText: 'Bài Học', exportValue: (r: WeaknessTableRow) => r.unit_key },
      cell: (info) => (
        <span className="font-bold font-mono text-indigo-300">
          {info.getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'skill',
      header: () => <div className="text-center w-full">Kỹ Năng</div>,
      meta: { headerText: 'Kỹ Năng', exportValue: (r: WeaknessTableRow) => r.skill === 'grammar' ? 'Ngữ Pháp' : 'Từ Vựng' },
      cell: ({ getValue }) => {
        const skill = getValue<string>();
        const isGrammar = skill === 'grammar';
        return (
          <div className="text-center">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black border ${
                isGrammar
                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                  : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
              }`}
            >
              {isGrammar ? 'Ngữ Pháp' : 'Từ Vựng'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'topic_name',
      header: 'Chủ Đề Chi Tiết',
      meta: { headerText: 'Chủ Đề', exportValue: (r: WeaknessTableRow) => r.topic_name },
      cell: (info) => (
        <span className="text-xs text-slate-300 truncate max-w-[200px] block" title={info.getValue<string>()}>
          {info.getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'avg_score',
      header: () => <div className="text-center w-full">Điểm TB Unit</div>,
      meta: { headerText: 'Điểm TB Unit', exportValue: (r: WeaknessTableRow) => format1Dec(r.avg_score) },
      cell: ({ getValue }) => {
        const val = getValue<number>();
        const isCritical = val < 5.0;
        return (
          <div className="text-center font-mono font-black text-sm">
            <span className={isCritical ? 'text-rose-400' : 'text-amber-400'}>
              {format1Dec(val)}đ
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'test_count',
      header: () => <div className="text-center w-full">Số Lần Test</div>,
      meta: { headerText: 'Số Lần Test', exportValue: (r: WeaknessTableRow) => r.test_count },
      cell: (info) => (
        <div className="text-center font-mono font-bold text-slate-400">
          {info.getValue<number>()} buổi
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-center w-full">Định Hướng Sư Phạm</div>,
      meta: { headerText: 'Định Hướng', exportValue: (r: WeaknessTableRow) => r.status },
      cell: ({ getValue }) => {
        const status = getValue<string>();
        const isUrgent = status === 'Cần Phụ Đạo Gấp';
        return (
          <div className="text-center">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                isUrgent
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {status}
            </span>
          </div>
        );
      },
    },
  ], []);

  const stats = useMemo(() => {
    const uniqueStudents = new Set(rawWeaknessList.map(r => r.student_id)).size;
    const urgentCount = rawWeaknessList.filter(r => r.status === 'Cần Phụ Đạo Gấp').length;
    const grammarCount = rawWeaknessList.filter(r => r.skill === 'grammar').length;
    const vocabCount = rawWeaknessList.filter(r => r.skill === 'vocab').length;
    return { uniqueStudents, urgentCount, grammarCount, vocabCount };
  }, [rawWeaknessList]);

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
        Tất Cả ({rawWeaknessList.length})
      </button>
      <button
        onClick={() => setSkillFilter('grammar')}
        className={`flex-1 relative z-10 py-1 text-center transition cursor-pointer ${
          skillFilter === 'grammar' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
        }`}
      >
        Ngữ Pháp ({stats.grammarCount})
      </button>
      <button
        onClick={() => setSkillFilter('vocab')}
        className={`flex-1 relative z-10 py-1 text-center transition cursor-pointer ${
          skillFilter === 'vocab' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
        }`}
      >
        Từ Vựng ({stats.vocabCount})
      </button>
    </div>
  );

  return (
    <div className="bg-[#0c0f1d] border border-white/10 rounded-2xl p-5 space-y-4 select-none shadow-lg animate-cascade-2">
      {/* Title Bar */}
      <div className="border-b border-white/5 pb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Danh Sách Học Sinh Cần Phụ Đạo Theo Bài Học & Kỹ Năng
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Bảng thống kê chi tiết toàn bộ các Unit có điểm trung bình dưới 6.5 để giáo viên lên kế hoạch kèm cặp trọng điểm.
          </p>
        </div>
      </div>

      {/* Quick Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#080c18] border border-white/5 p-3.5 rounded-xl">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase text-slate-400">Học Sinh Cần Kèm</span>
          <div className="text-xl font-black text-amber-400 font-mono">{stats.uniqueStudents} HS</div>
          <span className="text-[10px] text-slate-500 font-medium block">Có bài học &lt; 6.5đ</span>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase text-slate-400">Cần Phụ Đạo Gấp</span>
          <div className="text-xl font-black text-rose-400 font-mono">{stats.urgentCount} lượt</div>
          <span className="text-[10px] text-slate-500 font-medium block">Điểm trung bình &lt; 5.0đ</span>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase text-slate-400">Hổng Kiến Thức Ngữ Pháp</span>
          <div className="text-xl font-black text-purple-400 font-mono">{stats.grammarCount} lượt</div>
          <span className="text-[10px] text-slate-500 font-medium block">Cần ôn lại cấu trúc ngữ pháp</span>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase text-slate-400">Hổng Kiến Thức Từ Vựng</span>
          <div className="text-xl font-black text-blue-400 font-mono">{stats.vocabCount} lượt</div>
          <span className="text-[10px] text-slate-500 font-medium block">Cần kiểm tra lại từ vựng unit</span>
        </div>
      </div>

      {/* TanStack DataTable */}
      <DataTable<WeaknessTableRow>
        tableId="student-weakness-diagnosis-table"
        data={filteredData}
        columns={columns}
        pageSize={20}
        searchPlaceholder="Tìm theo tên học sinh, bài học, chủ đề..."
        emptyMessage="Tuyệt vời! Không phát hiện bài học nào dưới 6.5 điểm."
        toolbarLeft={toolbarLeft}
        exportFilename="danh_sach_hoc_sinh_can_phu_dao"
        onRowClick={(row) => onSelectStudent && onSelectStudent(row.student_id)}
        initialSorting={[{ id: 'avg_score', desc: false }]}
      />
    </div>
  );
};
