import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { History, Edit3 } from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import { formatFullDate } from '../utils';
import { format1Dec } from '../../../utils';

interface StudentGradeHistoryTableProps {
  loading: boolean;
  sessionRecords: any[];
  selectedStudentObj: any;
  stats: any;
  onOpenEditModal: (rec: any) => void;
  hasSelectedStudent: boolean;
  isTestMode?: boolean;
}

const getSkillStyle = (skillKey?: string) => {
  const norm = (skillKey || '').toLowerCase().trim();
  if (norm === 'grammar' || norm === 'ngữ pháp') {
    return {
      scoreColor: 'text-purple-400',
      topicColor: 'text-purple-300/80',
      badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      label: 'Ngữ Pháp',
    };
  }
  if (norm === 'mixed' || norm === 'tổng hợp') {
    return {
      scoreColor: 'text-amber-400',
      topicColor: 'text-amber-300/80',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      label: 'Tổng Hợp',
    };
  }
  if (norm === 'mock_test' || norm === 'luyện đề') {
    return {
      scoreColor: 'text-rose-400',
      topicColor: 'text-rose-300/80',
      badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      label: 'Luyện Đề',
    };
  }
  // Default to vocab (Từ vựng) - Blue
  return {
    scoreColor: 'text-blue-400',
    topicColor: 'text-blue-300/80',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    label: 'Từ Vựng',
  };
};

export const StudentGradeHistoryTable: React.FC<StudentGradeHistoryTableProps> = ({
  loading,
  sessionRecords,
  selectedStudentObj,
  stats,
  onOpenEditModal,
  hasSelectedStudent,
  isTestMode,
}) => {
  const historyColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'stt',
      header: () => <div className="text-center w-full">STT</div>,
      meta: { headerText: 'STT', exportValue: (_: any, idx: number) => idx + 1 },
      cell: ({ row }) => <div className="text-center font-bold text-slate-400">{row.index + 1}</div>,
      enableSorting: false,
      enableGlobalFilter: false,
    },
    {
      accessorKey: 'date',
      header: 'Thời Gian',
      meta: { headerText: 'Thời Gian', exportValue: (r: any) => formatFullDate(r.date) },
      cell: (info) => (
        <span className="font-mono text-base font-bold text-indigo-300">
          {formatFullDate(info.getValue<string>())}
        </span>
      ),
    },
    {
      id: 'student_name',
      accessorFn: (r: any) => r.student_name || r.full_name || 'Học sinh',
      header: 'Học Sinh',
      meta: {
        headerText: 'Học Sinh',
        exportValue: (r: any) => `${r.student_name || r.full_name || 'Học sinh'}${r.nickname ? ` (${r.nickname})` : ''}`,
      },
      cell: ({ row }) => {
        const r = row.original;
        const name = r.student_name || r.full_name || 'Học sinh';
        const nick = r.nickname;
        return (
          <div className="flex flex-col py-0.5">
            <span className="font-bold text-slate-100 text-sm">{name}</span>
            {nick && (
              <span className="text-[11px] text-indigo-400 font-semibold">{nick}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'class_name',
      header: 'Lớp Học',
      meta: { headerText: 'Lớp Học', exportValue: (r: any) => r.class_name || 'Lớp học' },
      cell: (info) => (
        <span className="font-bold text-slate-300">
          {info.getValue<string>() || 'Lớp học'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-center w-full">Điểm Danh</div>,
      meta: { headerText: 'Điểm Danh', exportValue: (r: any) => r.status || 'Có mặt' },
      cell: ({ getValue }) => {
        const st = getValue<string>() || 'Có mặt';
        const isAbsent = st.includes('Vắng') || st.includes('Nghỉ');
        return (
          <div className={`text-center font-bold text-sm sm:text-base ${isAbsent ? 'text-rose-400' : 'text-emerald-400'}`}>
            {st}
          </div>
        );
      },
    },
    {
      id: 'vocab',
      header: () => <div className="text-center w-full">Từ Vựng</div>,
      meta: {
        headerText: 'Từ Vựng',
        exportValue: (r: any) => {
          const c1Val = Number(r.check_1) || 0;
          const c2Val = Number(r.check_2) || 0;
          const c1Skill = String(r.check_1_skill || (r.check_1_test_type === 'grammar' ? 'grammar' : 'vocab')).toLowerCase().trim();
          const c2Skill = String(r.check_2_skill || (r.check_2_test_type === 'vocab' ? 'vocab' : 'grammar')).toLowerCase().trim();
          const vScores: number[] = [];
          if (c1Val > 0 && (c1Skill !== 'grammar' && c1Skill !== 'ngữ pháp')) vScores.push(c1Val);
          if (c2Val > 0 && (c2Skill === 'vocab' || c2Skill === 'từ vựng')) vScores.push(c2Val);
          return vScores.length > 0 ? vScores.map(v => format1Dec(v)).join(' | ') : '-';
        }
      },
      cell: ({ row }) => {
        const r = row.original;
        const c1Val = Number(r.check_1) || 0;
        const c2Val = Number(r.check_2) || 0;
        const c1Skill = String(r.check_1_skill || (r.check_1_test_type === 'grammar' ? 'grammar' : 'vocab')).toLowerCase().trim();
        const c2Skill = String(r.check_2_skill || (r.check_2_test_type === 'vocab' ? 'vocab' : 'grammar')).toLowerCase().trim();
        const c1Topic = r.check_1_topic || (c1Skill === 'grammar' ? r.grammar_topic : r.topic) || '';
        const c2Topic = r.check_2_topic || (c2Skill === 'vocab' ? r.topic : r.grammar_topic) || '';

        const vocabChecks: { checkNum: number; score: number; topic: string }[] = [];
        if (c1Val > 0 && c1Skill !== 'grammar' && c1Skill !== 'ngữ pháp') {
          vocabChecks.push({ checkNum: 1, score: c1Val, topic: c1Topic });
        }
        if (c2Val > 0 && (c2Skill === 'vocab' || c2Skill === 'từ vựng')) {
          vocabChecks.push({ checkNum: 2, score: c2Val, topic: c2Topic });
        }

        if (vocabChecks.length === 0) {
          return <div className="text-center font-mono font-bold text-slate-500 text-sm">-</div>;
        }

        if (vocabChecks.length === 1) {
          const chk = vocabChecks[0];
          return (
            <div className="text-center py-0.5">
              <div className="font-extrabold text-blue-400 font-mono text-base leading-tight">
                {format1Dec(chk.score)}
              </div>
              {chk.topic && (
                <span className="text-[10px] text-blue-300/80 font-medium truncate max-w-[140px] block mx-auto mt-0.5" title={chk.topic}>
                  {chk.topic}
                </span>
              )}
            </div>
          );
        }

        return (
          <div className="flex flex-col items-center gap-1 py-0.5">
            {vocabChecks.map((chk, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                <span className="text-[10px] font-bold text-blue-300 font-mono">C{chk.checkNum}:</span>
                <span className="font-extrabold text-blue-400 font-mono text-xs">{format1Dec(chk.score)}</span>
                {chk.topic && (
                  <span className="text-[9px] text-blue-300/70 truncate max-w-[90px]" title={chk.topic}>
                    ({chk.topic})
                  </span>
                )}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      id: 'grammar',
      header: () => <div className="text-center w-full">Ngữ Pháp</div>,
      meta: {
        headerText: 'Ngữ Pháp',
        exportValue: (r: any) => {
          const c1Val = Number(r.check_1) || 0;
          const c2Val = Number(r.check_2) || 0;
          const c1Skill = String(r.check_1_skill || (r.check_1_test_type === 'grammar' ? 'grammar' : 'vocab')).toLowerCase().trim();
          const c2Skill = String(r.check_2_skill || (r.check_2_test_type === 'vocab' ? 'vocab' : 'grammar')).toLowerCase().trim();
          const gScores: number[] = [];
          if (c1Val > 0 && (c1Skill === 'grammar' || c1Skill === 'ngữ pháp')) gScores.push(c1Val);
          if (c2Val > 0 && c2Skill !== 'vocab' && c2Skill !== 'từ vựng') gScores.push(c2Val);
          return gScores.length > 0 ? gScores.map(v => format1Dec(v)).join(' | ') : '-';
        }
      },
      cell: ({ row }) => {
        const r = row.original;
        const c1Val = Number(r.check_1) || 0;
        const c2Val = Number(r.check_2) || 0;
        const c1Skill = String(r.check_1_skill || (r.check_1_test_type === 'grammar' ? 'grammar' : 'vocab')).toLowerCase().trim();
        const c2Skill = String(r.check_2_skill || (r.check_2_test_type === 'vocab' ? 'vocab' : 'grammar')).toLowerCase().trim();
        const c1Topic = r.check_1_topic || (c1Skill === 'grammar' ? r.grammar_topic : r.topic) || '';
        const c2Topic = r.check_2_topic || (c2Skill === 'vocab' ? r.topic : r.grammar_topic) || '';

        const grammarChecks: { checkNum: number; score: number; topic: string }[] = [];
        if (c1Val > 0 && (c1Skill === 'grammar' || c1Skill === 'ngữ pháp')) {
          grammarChecks.push({ checkNum: 1, score: c1Val, topic: c1Topic });
        }
        if (c2Val > 0 && c2Skill !== 'vocab' && c2Skill !== 'từ vựng') {
          grammarChecks.push({ checkNum: 2, score: c2Val, topic: c2Topic });
        }

        if (grammarChecks.length === 0) {
          return <div className="text-center font-mono font-bold text-slate-500 text-sm">-</div>;
        }

        if (grammarChecks.length === 1) {
          const chk = grammarChecks[0];
          return (
            <div className="text-center py-0.5">
              <div className="font-extrabold text-purple-400 font-mono text-base leading-tight">
                {format1Dec(chk.score)}
              </div>
              {chk.topic && (
                <span className="text-[10px] text-purple-300/80 font-medium truncate max-w-[140px] block mx-auto mt-0.5" title={chk.topic}>
                  {chk.topic}
                </span>
              )}
            </div>
          );
        }

        return (
          <div className="flex flex-col items-center gap-1 py-0.5">
            {grammarChecks.map((chk, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                <span className="text-[10px] font-bold text-purple-300 font-mono">C{chk.checkNum}:</span>
                <span className="font-extrabold text-purple-400 font-mono text-xs">{format1Dec(chk.score)}</span>
                {chk.topic && (
                  <span className="text-[9px] text-purple-300/70 truncate max-w-[90px]" title={chk.topic}>
                    ({chk.topic})
                  </span>
                )}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'homework',
      header: () => <div className="text-center w-full">BTVN</div>,
      meta: { headerText: 'BTVN', exportValue: (r: any) => Number(r.homework) > 0 ? format1Dec(Number(r.homework)) : '-' },
      cell: ({ row }) => {
        const r = row.original;
        const val = Number(r.homework) || 0;
        const topic = r.homework_topic || '';
        return (
          <div className="text-center py-0.5">
            <div className="font-extrabold text-emerald-400 font-mono text-base leading-tight">
              {val > 0 ? format1Dec(val) : '-'}
            </div>
            {topic && (
              <span className="block text-[10px] text-emerald-300/80 font-medium truncate max-w-[140px] mx-auto mt-0.5" title={topic}>
                {topic}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'notes',
      header: 'Ghi Chú',
      meta: { headerText: 'Ghi Chú', exportValue: (r: any) => r.notes || '-' },
      cell: (info) => <span className="text-xs text-slate-400 truncate max-w-xs block">{info.getValue<string>() || '-'}</span>,
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
            onClick={(e) => { e.stopPropagation(); onOpenEditModal(row.original); }}
            className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition cursor-pointer border border-indigo-500/20 inline-flex items-center gap-1 text-[11px] font-bold"
            title="Sửa điểm buổi học này"
          >
            <Edit3 size={12} />
            <span>Sửa</span>
          </button>
        </div>
      ),
    },
  ], [onOpenEditModal]);

  return (
    <div className={`bg-[#0d1120] border border-[#1d2644] rounded-2xl flex flex-col shadow-2xl mb-8 ${hasSelectedStudent ? 'animate-cascade-5' : 'animate-cascade-4'}`}>
      <div className="px-5 py-4 border-b border-[#181f36] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <History size={18} className="text-indigo-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            {selectedStudentObj
              ? `LỊCH SỬ ĐIỂM SỐ & ĐIỂM DANH — HỌC SINH: ${selectedStudentObj.full_name.toUpperCase()}`
              : `LỊCH SỬ ĐIỂM SỐ CHI TIẾT TẤT CẢ BUỔI HỌC (${sessionRecords.length} BẢN GHI)`
            }
          </h3>
        </div>
        {selectedStudentObj && (
          <span className="text-xs font-extrabold text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20">
            Tổng cộng: {sessionRecords.length} buổi học ({stats.sessionCount} có mặt, {sessionRecords.length - stats.sessionCount} vắng mặt)
          </span>
        )}
      </div>
      <DataTable
        tableId="reports-history-table"
        data={sessionRecords}
        columns={historyColumns}
        loading={loading}
        searchPlaceholder="Tìm theo học sinh, ngày, lớp, trạng thái, ghi chú..."
        emptyMessage="Chưa có lịch sử điểm số."
        pageSize={10}
        initialSorting={[{ id: 'date', desc: true }]}
        exportFilename={`lich_su_diem_${selectedStudentObj ? selectedStudentObj.full_name : 'lop'}`}
      />
    </div>
  );
};
