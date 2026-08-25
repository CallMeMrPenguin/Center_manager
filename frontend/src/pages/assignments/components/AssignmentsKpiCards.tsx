import React from 'react';
import { BookCheck, CalendarClock, CheckCircle, Trophy } from 'lucide-react';

interface AssignmentsKpiCardsProps {
  kpis: {
    total: number;
    dueUpcoming: number;
    avgRate: number;
    avgScore: string;
  };
}

export const AssignmentsKpiCards: React.FC<AssignmentsKpiCardsProps> = ({ kpis }) => {
  const cards = [
    {
      title: 'Tổng Số Bài Tập',
      value: kpis.total,
      desc: 'Đã giao cho các lớp',
      icon: <BookCheck size={18} className="text-blue-400" />,
      cardClass: 'kpi-card-blue',
      textColor: 'text-blue-400',
    },
    {
      title: 'Đang Mở / Sắp Hết Hạn',
      value: kpis.dueUpcoming,
      desc: 'Bài tập còn hạn nộp',
      icon: <CalendarClock size={18} className="text-purple-400" />,
      cardClass: 'kpi-card-purple',
      textColor: 'text-purple-400',
    },
    {
      title: 'Tỷ Lệ Nộp Bài',
      value: `${kpis.avgRate}%`,
      desc: 'Trung bình toàn bộ bài tập',
      icon: <CheckCircle size={18} className="text-emerald-400" />,
      cardClass: 'kpi-card-green',
      textColor: 'text-emerald-400',
    },
    {
      title: 'Điểm BTVN Trung Bình',
      value: kpis.avgScore,
      desc: 'Thang điểm 10.0',
      icon: <Trophy size={18} className="text-amber-400" />,
      cardClass: 'kpi-card-amber',
      textColor: 'text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className={`text-2xl font-black ${card.textColor} tracking-tight`}>
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
