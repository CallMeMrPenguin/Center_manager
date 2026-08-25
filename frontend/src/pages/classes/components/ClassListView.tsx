import React from 'react';
import { BookOpen, Plus, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { ClassItem } from '../types';
import { ClassCard } from './ClassCard';

interface ClassListViewProps {
  classes: ClassItem[];
  filteredClasses: ClassItem[];
  loading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  onRefresh: () => void;
  onCreateClass: () => void;
  onSelectClass: (cls: ClassItem) => void;
  onEditClass: (cls: ClassItem) => void;
}

export const ClassListView: React.FC<ClassListViewProps> = ({
  classes,
  filteredClasses,
  loading,
  search,
  onSearchChange,
  onRefresh,
  onCreateClass,
  onSelectClass,
  onEditClass,
}) => {
  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
            <BookOpen className="h-7 w-7 text-indigo-400" />
            Quản Lý Lớp Học & Sơ Đồ Chỗ Ngồi
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Tạo lớp, điểm danh, xếp sơ đồ chỗ ngồi thông minh và phân công đổi bài tự động.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-[#121626] hover:bg-[#1e2640] text-slate-300 hover:text-white border border-[#202842] transition cursor-pointer shadow-sm"
            title="Làm mới danh sách lớp"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-400' : ''} />
          </button>

          <button
            onClick={onCreateClass}
            className="group flex items-center gap-0 hover:gap-2 bg-[#5c36f5] hover:bg-[#7351f7] text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-[0_4px_16px_rgba(92,54,245,0.4)] transition-all duration-300 cursor-pointer border border-white/20 active:scale-95"
            title="Tạo Lớp Học Mới"
          >
            <Plus size={16} className="shrink-0" />
            <span className="max-w-0 opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">
              Tạo Lớp Học Mới
            </span>
          </button>
        </div>
      </div>

      {/* SEARCH & FILTER */}
      <div className="flex items-center justify-between bg-[#0f131f] border border-white/10 p-3.5 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm lớp học theo tên lớp, giáo viên, phòng..."
            className="w-full bg-[#161a29] border border-white/10 text-white text-xs rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 font-medium"
          />
        </div>
      </div>

      {/* CLASS GRID LIST */}
      <div className="flex-1 min-h-[360px]">
        {loading && classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-3 py-20">
            <RefreshCw className="h-7 w-7 text-indigo-400 animate-spin" />
            <span className="text-xs font-bold">Đang tải danh sách lớp...</span>
          </div>
        ) : classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-3 py-20 text-center">
            <AlertCircle className="h-10 w-10 text-indigo-400/60" />
            <p className="text-sm font-black text-white">Chưa có lớp học nào được tạo</p>
            <p className="text-xs text-slate-500">Bấm "Tạo Lớp Học Mới" để bắt đầu quản lý.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClasses.map((cls, idx) => (
              <ClassCard
                key={cls.id}
                cls={cls}
                index={idx}
                onSelect={onSelectClass}
                onEdit={onEditClass}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
