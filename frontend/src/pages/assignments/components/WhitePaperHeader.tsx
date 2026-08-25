import React from 'react';
import { Assignment } from '../types';

interface WhitePaperHeaderProps {
  assignment: Assignment;
  studentName: string;
  isSubmitted: boolean;
  finalScore: string;
  correctCount: number;
  total: number;
}

export const WhitePaperHeader: React.FC<WhitePaperHeaderProps> = ({
  assignment,
  studentName,
  isSubmitted,
  finalScore,
  correctCount,
  total,
}) => {
  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="border-b-2 border-slate-800 pb-5 space-y-3 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-indigo-700 block">
              TRUNG TÂM BỒI DƯỠNG KIẾN THỨC
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              Năm học 2025 - 2026
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-700 block">
              Hạn nộp: {assignment.due_date || 'Theo thông báo'}
            </span>
          </div>
        </div>

        <div className="py-2 text-center space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
            {assignment.title || 'PHIẾU BÀI TẬP VỀ NHÀ'}
          </h1>
          {assignment.description && (
            <p className="text-xs italic text-slate-600 max-w-xl mx-auto">
              {assignment.description}
            </p>
          )}
        </div>

        {/* Student Info Box (Họ tên, Lớp, Hạn nộp) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-700">
          <div>
            Họ và tên: <strong className="text-indigo-900">{studentName}</strong>
          </div>
          <div>
            Lớp: <strong className="text-indigo-900">{assignment.class_name || 'Lớp học'}</strong>
          </div>
          <div className="sm:text-right">
            Hạn nộp: <strong className="text-indigo-900">{assignment.due_date || 'Theo thông báo'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
