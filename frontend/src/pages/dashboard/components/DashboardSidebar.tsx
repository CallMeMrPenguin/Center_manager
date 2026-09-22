import React, { useState } from 'react';
import { PlusCircle, Calendar, FileCheck, BarChart3, CheckCircle, AlertTriangle } from 'lucide-react';
import { StudentAlertItem } from '../types';

interface DashboardSidebarProps {
  alerts: StudentAlertItem[];
  onNavigate: (tab: string, extraData?: { classId?: number }) => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ alerts, onNavigate }) => {
  const [shiftNote, setShiftNote] = useState<string>(() => {
    return localStorage.getItem('cm_shift_notes_today') || '';
  });
  const [noteSaved, setNoteSaved] = useState(false);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setShiftNote(text);
    localStorage.setItem('cm_shift_notes_today', text);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Quick Launchpad */}
      <div className="bg-white dark:bg-[#0f1528] rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors duration-200">
        <h2 className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3.5">
          Phím Tác Vụ Nhanh
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('students')}
            className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#13192c] dark:hover:bg-[#19223c] border border-slate-200 dark:border-[#1e2844] text-left transition cursor-pointer"
          >
            <PlusCircle size={15} className="text-blue-500 dark:text-blue-400 shrink-0" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Tiếp nhận học sinh</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('schedule')}
            className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#13192c] dark:hover:bg-[#19223c] border border-slate-200 dark:border-[#1e2844] text-left transition cursor-pointer"
          >
            <Calendar size={15} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Xếp lịch học</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('kiemtra')}
            className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#13192c] dark:hover:bg-[#19223c] border border-slate-200 dark:border-[#1e2844] text-left transition cursor-pointer"
          >
            <FileCheck size={15} className="text-amber-500 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Tạo đề thi</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#13192c] dark:hover:bg-[#19223c] border border-slate-200 dark:border-[#1e2844] text-left transition cursor-pointer"
          >
            <BarChart3 size={15} className="text-indigo-500 dark:text-indigo-400 shrink-0" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Báo cáo học vụ</span>
          </button>
        </div>
      </div>

      {/* 2. Operational Shift Noticeboard */}
      <div className="bg-white dark:bg-[#0f1528] rounded-2xl p-5 flex flex-col gap-2 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Bảng Ghi Chú Ca Trực
          </span>
          {noteSaved && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle size={10} /> Đã lưu
            </span>
          )}
        </div>
        <textarea
          value={shiftNote}
          onChange={handleNoteChange}
          placeholder="Ghi chú dặn dò ca trực hôm nay (in đề, học sinh xin về sớm, dặn phụ huynh)..."
          rows={3}
          className="w-full bg-slate-50 dark:bg-[#13192c] border border-slate-200 dark:border-[#1e2844] focus:border-blue-500 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium outline-none resize-none transition"
        />
      </div>

      {/* 3. Attention Radar */}
      <div className="bg-white dark:bg-[#0f1528] rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors duration-200">
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Học Sinh Cần Lưu Ý
          </span>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {alerts.length} mục
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
            Tất cả học sinh đều đang trong trạng thái học tập ổn định
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((al) => (
              <div
                key={al.student_id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-[#13192c] border border-slate-300 dark:border-[#1e2844] text-xs"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle size={13} className="text-amber-500 dark:text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block leading-tight">{al.student_name}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{al.class_name}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                  {al.issue}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
