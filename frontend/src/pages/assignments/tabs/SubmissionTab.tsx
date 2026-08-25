import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Save, CheckCircle2, XCircle, KeyRound } from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import { Assignment, AssignmentSubmission } from '../types';

interface SubmissionTabProps {
  assignment: Assignment | null;
  submissions: AssignmentSubmission[];
  loading: boolean;
  onBack: () => void;
  onSaveSubmissions: (updatedSubmissions: AssignmentSubmission[]) => void;
  onEditAnswerKey?: (assignment: Assignment) => void;
}

export const SubmissionTab: React.FC<SubmissionTabProps> = ({
  assignment,
  submissions,
  loading,
  onBack,
  onSaveSubmissions,
  onEditAnswerKey,
}) => {
  const [localList, setLocalList] = useState<AssignmentSubmission[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalList(submissions);
    setIsDirty(false);
  }, [submissions]);

  const handleToggleSubmitted = useCallback((studentId: number) => {
    setLocalList((prev) =>
      prev.map((item) => {
        if (item.student_id === studentId) {
          const next = item.submitted === 1 ? 0 : 1;
          return { ...item, submitted: next };
        }
        return item;
      })
    );
    setIsDirty(true);
  }, []);

  const handleScoreChange = useCallback((studentId: number, val: string) => {
    setLocalList((prev) =>
      prev.map((item) => {
        if (item.student_id === studentId) {
          const num = val === '' ? null : Math.max(0, Math.min(100, parseFloat(val) || 0));
          return { ...item, score: num };
        }
        return item;
      })
    );
    setIsDirty(true);
  }, []);

  const handleNotesChange = useCallback((studentId: number, val: string) => {
    setLocalList((prev) =>
      prev.map((item) => {
        if (item.student_id === studentId) {
          return { ...item, notes: val };
        }
        return item;
      })
    );
    setIsDirty(true);
  }, []);

  const handleMarkAll = (submittedVal: number) => {
    setLocalList((prev) =>
      prev.map((item) => ({ ...item, submitted: submittedVal }))
    );
    setIsDirty(true);
  };

  const columns = useMemo<ColumnDef<AssignmentSubmission>[]>(
    () => [
      {
        accessorKey: 'student_name',
        header: 'Học Sinh',
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-slate-100 block">
              {row.original.student_name}
            </span>
            {row.original.nickname && (
              <span className="text-[10px] text-indigo-400 font-semibold block">
                {row.original.nickname}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'grade',
        header: 'Khối Lớp',
        cell: (info) => (
          <span className="text-xs text-slate-400 font-medium">
            {info.getValue<string>() || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'submitted',
        header: 'Trạng Thái Nộp',
        cell: ({ row }) => {
          const isSub = row.original.submitted === 1;
          return (
            <button
              type="button"
              onClick={() => handleToggleSubmitted(row.original.student_id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                isSub
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isSub ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              <span>{isSub ? 'Đã nộp bài' : 'Chưa nộp'}</span>
            </button>
          );
        },
      },
      {
        accessorKey: 'score',
        header: 'Điểm Số (Thang 10)',
        cell: ({ row }) => (
          <input
            type="number"
            min="0"
            max={assignment?.max_score || 10}
            step="0.1"
            value={row.original.score !== null && row.original.score !== undefined ? row.original.score : ''}
            onChange={(e) => handleScoreChange(row.original.student_id, e.target.value)}
            placeholder="-"
            className="w-20 bg-[#121626] border border-[#263152] focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 py-1 text-xs text-white font-mono font-bold text-center shadow-inner"
          />
        ),
      },
      {
        accessorKey: 'notes',
        header: 'Ghi Chú / Nhận Xét',
        cell: ({ row }) => (
          <input
            type="text"
            value={row.original.notes || ''}
            onChange={(e) => handleNotesChange(row.original.student_id, e.target.value)}
            placeholder="Nhận xét bài làm..."
            className="w-full max-w-xs bg-[#121626] border border-[#263152] focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 py-1 text-xs text-slate-200 shadow-inner"
          />
        ),
      },
    ],
    [assignment, handleToggleSubmitted, handleScoreChange, handleNotesChange]
  );

  if (!assignment) {
    return (
      <div className="bg-[#0c0f1e] border border-[#1e2742] rounded-2xl p-6 text-center space-y-3">
        <p className="text-xs text-slate-400 font-semibold">Chưa chọn bài tập nào</p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition"
        >
          Quay lại danh sách bài tập
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-[#0c0f1e] border border-[#1e2742] rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
            title="Quay lại danh sách"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">
                {assignment.title}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                {assignment.class_name}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Hạn nộp: <strong className="text-slate-300">{assignment.due_date}</strong> (Điểm tối đa: {assignment.max_score || 10})
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {onEditAnswerKey && (
            <button
              type="button"
              onClick={() => onEditAnswerKey(assignment)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold border border-amber-500/30 transition cursor-pointer"
              title="Chỉnh sửa đáp án & tự động tính lại điểm"
            >
              <KeyRound size={14} />
              <span>Sửa Đáp Án & Chấm Lại</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleMarkAll(1)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            Tất cả đã nộp
          </button>
          <button
            type="button"
            onClick={() => handleMarkAll(0)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            Hủy tất cả
          </button>
          <button
            type="button"
            onClick={() => onSaveSubmissions(localList)}
            disabled={!isDirty}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              isDirty
                ? 'bg-[#5c36f5] hover:bg-[#6c48f7] text-white shadow-[0_0_12px_rgba(92,54,245,0.5)]'
                : 'bg-white/5 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Save size={14} />
            <span>Lưu Thay Đổi</span>
          </button>
        </div>
      </div>

      {/* Submissions TanStack DataTable */}
      <DataTable<AssignmentSubmission>
        data={localList}
        columns={columns}
        loading={loading}
        pageSize={20}
        exportFilename={`nop_bai_${assignment.title.toLowerCase().replace(/\s+/g, '_')}`}
        searchPlaceholder="Tìm theo tên học sinh..."
      />
    </div>
  );
};
