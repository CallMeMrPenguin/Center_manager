import React from 'react';
import { Clock, Trash2, Copy } from 'lucide-react';
import { SessionScheduleItem } from '../types';

interface SelectedDaysTimeListProps {
  items: SessionScheduleItem[];
  onChangeTime: (id: string, startTime: string, duration: number) => void;
  onRemoveItem: (id: string) => void;
  onSyncAllTimes: () => void;
}

export const SelectedDaysTimeList: React.FC<SelectedDaysTimeListProps> = ({
  items,
  onChangeTime,
  onRemoveItem,
  onSyncAllTimes,
}) => {
  if (items.length === 0) {
    return (
      <div className="py-6 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-50/60 dark:bg-[#141928] rounded-xl border-0">
        Chưa có ngày nào được chọn. Hãy bấm vào các ngày trên lịch ở trên.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Clock size={12} className="text-blue-500" />
          <span>Giờ Học Từng Ngày ({items.length} ngày đã chọn)</span>
        </label>
        {items.length > 1 && (
          <button
            type="button"
            onClick={onSyncAllTimes}
            className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition cursor-pointer border-0 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-lg shadow-2xs"
            title="Sao chép giờ của ngày đầu tiên cho tất cả các ngày khác"
          >
            <Copy size={11} />
            <span>Áp dụng giờ cho tất cả</span>
          </button>
        )}
      </div>

      <div className="max-h-52 overflow-y-auto space-y-2 pr-0.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-[#141928] border-0 shadow-xs hover:shadow-sm transition"
          >
            <div className="flex-1 min-w-[120px]">
              <span className="text-xs font-black text-slate-800 dark:text-white block truncate">
                {item.label}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Giờ:</span>
                <input
                  type="time"
                  required
                  value={item.start_time}
                  onChange={(e) => onChangeTime(item.id, e.target.value, item.duration)}
                  className="bg-white dark:bg-[#181d2e] border-0 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs font-bold"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Thời lượng:</span>
                <input
                  type="number"
                  min={15}
                  max={300}
                  step={15}
                  value={item.duration}
                  onChange={(e) => onChangeTime(item.id, item.start_time, parseInt(e.target.value, 10) || 90)}
                  className="w-16 bg-white dark:bg-[#181d2e] border-0 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs font-bold text-center"
                />
                <span className="text-[10px] font-bold text-slate-400">phút</span>
              </div>

              <button
                type="button"
                onClick={() => onRemoveItem(item.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer border-0"
                title="Bỏ chọn ngày này"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
