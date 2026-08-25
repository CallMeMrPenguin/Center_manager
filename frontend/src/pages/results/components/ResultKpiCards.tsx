import React from 'react';
import { Award, CheckCircle2, FileText, Sparkles, UserCheck } from 'lucide-react';
import { StudentProfileSummary } from '../types';
import { trunc1Dec } from '../hooks/useStudentResults';

interface ResultKpiCardsProps {
  summary: StudentProfileSummary | null;
}

export const ResultKpiCards: React.FC<ResultKpiCardsProps> = ({ summary }) => {
  if (!summary) return null;

  const cards = [
    {
      title: 'Kiểm Tra 1',
      value: trunc1Dec(summary.avg_check_1),
      desc: 'Điểm trung bình Kiểm tra 1',
      icon: <Award size={18} className="text-blue-400" />,
      cardClass: 'kpi-card-blue',
      textColor: 'text-blue-400',
    },
    {
      title: 'Kiểm Tra 2',
      value: trunc1Dec(summary.avg_check_2),
      desc: 'Điểm trung bình Kiểm tra 2',
      icon: <CheckCircle2 size={18} className="text-purple-400" />,
      cardClass: 'kpi-card-purple',
      textColor: 'text-purple-400',
    },
    {
      title: 'Bài Tập Về Nhà',
      value: trunc1Dec(summary.avg_homework),
      desc: 'Điểm trung bình BTVN',
      icon: <FileText size={18} className="text-amber-400" />,
      cardClass: 'kpi-card-amber',
      textColor: 'text-amber-400',
    },
    {
      title: 'Thi Thử / Đánh Giá',
      value: trunc1Dec(summary.avg_mock_test),
      desc: 'Điểm trung bình Thi thử',
      icon: <Sparkles size={18} className="text-emerald-400" />,
      cardClass: 'kpi-card-green',
      textColor: 'text-emerald-400',
    },
    {
      title: 'Tỷ Lệ Chuyên Cần',
      value: `${Math.trunc(summary.attendance_rate)}%`,
      desc: `${summary.present_sessions}/${summary.total_sessions} buổi có mặt`,
      icon: <UserCheck size={18} className="text-teal-400" />,
      cardClass: 'kpi-card-blue',
      textColor: 'text-teal-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`${card.cardClass} bg-[#0c0f1e] border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden transition-all duration-200 hover:border-white/20`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              {card.title}
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
              {card.icon}
            </div>
          </div>

          <div className="space-y-1">
            <div className={`text-2xl font-black ${card.textColor} tracking-tight font-mono`}>
              {card.value}
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              {card.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
