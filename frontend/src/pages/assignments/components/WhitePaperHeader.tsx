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
  const numericScore = parseFloat(String(finalScore)) || 0;

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
            <span className="text-xs text-slate-500">
              Thang điểm: {assignment.max_score || 10} điểm
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

        {/* Student Info Fill Header */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-700">
          <div>
            Họ và tên: <strong className="text-indigo-900">{studentName}</strong>
          </div>
          <div>
            Lớp: <strong className="text-indigo-900">{assignment.class_name || 'Lớp học'}</strong>
          </div>
          <div className="text-right font-bold text-indigo-700">
            {isSubmitted ? `Kết quả: ${finalScore}/10.0 điểm` : 'Điểm số: ______ / 10.0'}
          </div>
        </div>
      </div>

      {/* Graded Summary Score Card on White Sheet */}
      {isSubmitted && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md">
              {finalScore}
            </div>
            <div>
              <h4 className="text-sm font-black text-emerald-900">
                KẾT QUẢ ĐẠT ĐƯỢC: {finalScore}/10.0 ĐIỂM
              </h4>
              <p className="text-xs text-emerald-800 font-semibold">
                Số câu trả lời chính xác: {correctCount} trên tổng số {total} câu hỏi.
              </p>
            </div>
          </div>
          <span className="text-xs font-black uppercase px-3 py-1 bg-emerald-200 text-emerald-900 rounded-full">
            {numericScore >= 8.5 ? 'Xuất Sắc' : numericScore >= 7.0 ? 'Giỏi' : numericScore >= 5.0 ? 'Đạt Yêu Cầu' : 'Cần Cố Gắng Thêm'}
          </span>
        </div>
      )}
    </div>
  );
};
