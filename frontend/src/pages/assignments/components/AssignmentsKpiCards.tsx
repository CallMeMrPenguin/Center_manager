import React from 'react';

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
      cardClass: 'kpi-card-blue',
      textColor: 'text-blue-500 dark:text-blue-400',
    },
    {
      title: 'Đang Mở / Sắp Hết Hạn',
      value: kpis.dueUpcoming,
      desc: 'Bài tập còn hạn nộp',
      cardClass: 'kpi-card-purple',
      textColor: 'text-purple-500 dark:text-purple-400',
    },
    {
      title: 'Tỷ Lệ Nộp Bài',
      value: `${kpis.avgRate}%`,
      desc: 'Trung bình toàn bộ bài tập',
      cardClass: 'kpi-card-green',
      textColor: 'text-emerald-500 dark:text-emerald-400',
    },
    {
      title: 'Điểm BTVN Trung Bình',
      value: kpis.avgScore,
      desc: 'Thang điểm 10.0',
      cardClass: 'kpi-card-amber',
      textColor: 'text-amber-500 dark:text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`${card.cardClass} bg-white dark:bg-[#0c0f1e] rounded-2xl p-4 flex flex-col justify-between shadow-xs border-0 relative overflow-hidden transition-all duration-200`}
        >
          <div className="mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {card.title}
            </span>
          </div>

          <div className="space-y-1">
            <div className={`text-2xl font-black ${card.textColor} tracking-tight`}>
              {card.value}
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {card.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
