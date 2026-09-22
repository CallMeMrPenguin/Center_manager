import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Search, RefreshCw, AlertCircle, X } from 'lucide-react';
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
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <BookOpen className="h-7 w-7 text-indigo-500 dark:text-indigo-400" />
            Quản Lý Lớp Học & Sơ Đồ Chỗ Ngồi
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-0 shadow-xs transition cursor-pointer"
            title="Làm mới danh sách lớp"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-500 dark:text-indigo-400' : ''} />
          </button>

          <button
            onClick={onCreateClass}
            className="group flex items-center gap-0 hover:gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-3.5 py-2.5 rounded-xl font-bold text-xs border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer active:scale-95"
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
      <div className="flex items-center justify-between bg-white dark:bg-[#141417] border border-slate-200 dark:border-[#27272a] p-3.5 rounded-2xl shadow-sm">
        <motion.div
          animate={{ width: searchFocused ? 420 : 300 }}
          transition={{ type: 'spring', stiffness: 350, damping: 26 }}
          className="relative min-w-[220px]"
        >
          <motion.div
            animate={{ scale: searchFocused ? 1.15 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
          >
            <Search
              size={15}
              className={`transition-colors duration-200 ${
                searchFocused ? 'text-[#2563eb] dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            />
          </motion.div>
          <input
            type="text"
            value={search}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm lớp học theo tên lớp, giáo viên, phòng..."
            className="w-full bg-slate-50 dark:bg-[#1c1c21] border border-slate-200 dark:border-[#27272a] text-slate-900 dark:text-white text-xs rounded-xl pl-10 pr-8 py-2 focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/25 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium transition shadow-inner"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-white/10"
              >
                <X size={13} />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* CLASS GRID LIST */}
      <div className="flex-1 min-h-[360px]">
        {loading && classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-3 py-20">
            <RefreshCw className="h-7 w-7 text-indigo-500 dark:text-indigo-400 animate-spin" />
            <span className="text-xs font-bold">Đang tải danh sách lớp...</span>
          </div>
        ) : classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-3 py-20 text-center">
            <AlertCircle className="h-10 w-10 text-indigo-500/60 dark:text-indigo-400/60" />
            <p className="text-sm font-black text-slate-900 dark:text-white">Chưa có lớp học nào được tạo</p>
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
