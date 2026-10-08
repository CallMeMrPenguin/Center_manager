import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, AlertCircle, X, LayoutGrid, List } from 'lucide-react';
import { ClassItem } from '../types';
import { ClassCard } from './ClassCard';
import { ClassTableView } from './ClassTableView';

interface ClassListViewProps {
  classes: ClassItem[];
  filteredClasses: ClassItem[];
  loading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  onRefresh?: () => void;
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
  onCreateClass,
  onSelectClass,
  onEditClass,
}) => {
  const [searchFocused, setSearchFocused] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const totalStudents = useMemo(() => {
    return classes.reduce((acc, curr) => acc + (curr.student_count || 0), 0);
  }, [classes]);

  return (
    <div className="space-y-4 sm:space-y-5 select-none">
      {/* 1. HEADER SECTION - Attached directly to page background (No extra white container) */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Quản Lý Lớp Học
          </h1>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
              {classes.length} Lớp học
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-200/70 text-slate-700 dark:bg-white/10 dark:text-slate-300">
              {totalStudents} Học sinh
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onCreateClass}
          className="flex items-center gap-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all duration-200 cursor-pointer active:scale-95 shrink-0"
          title="Tạo Lớp Học Mới"
        >
          <Plus size={15} className="shrink-0" />
          <span>Tạo Lớp</span>
        </button>
      </div>

      {/* 2. SEARCH & VIEW MODE TOOLBAR */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-[#111728] rounded-2xl p-2.5 sm:p-3 shadow-xs border border-slate-200/80 dark:border-white/5">
        {/* Live Search */}
        <div className="relative flex-1 max-w-md">
          <motion.div
            animate={{ scale: searchFocused ? 1.15 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
          >
            <Search
              size={14}
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
            placeholder="Tìm theo tên lớp, giáo viên, phòng..."
            className="w-full bg-slate-50 dark:bg-[#151c30] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium transition"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-white/10"
              >
                <X size={12} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Minimal Icon-Only View Mode Toggle (Replacing reload/segmented control) */}
        <button
          type="button"
          onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
          className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#151c30] transition cursor-pointer shrink-0"
          title={viewMode === 'grid' ? 'Chuyển sang xem dạng bảng danh sách' : 'Chuyển sang xem dạng lưới thẻ'}
        >
          {viewMode === 'grid' ? <List size={16} /> : <LayoutGrid size={16} />}
        </button>
      </div>

      {/* 3. CONTENT AREA: COMPACT GRID OR TANSTACK TABLE */}
      <div className="min-h-[360px]">
        {loading && classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-3 py-20">
            <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold">Đang tải danh sách lớp học...</span>
          </div>
        ) : classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-3 py-20 text-center bg-white dark:bg-[#111728] rounded-2xl p-8">
            <AlertCircle className="h-10 w-10 text-blue-500/60" />
            <p className="text-sm font-black text-slate-900 dark:text-white">Chưa có lớp học nào được tạo</p>
            <p className="text-xs text-slate-500">Bấm "Tạo Lớp" để bắt đầu quản lý học sinh và xếp chỗ.</p>
          </div>
        ) : viewMode === 'grid' ? (
          filteredClasses.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs font-bold bg-white dark:bg-[#111728] rounded-2xl p-6">
              Không tìm thấy lớp học nào phù hợp với bộ lọc
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
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
          )
        ) : (
          <ClassTableView
            classes={filteredClasses}
            loading={loading}
            onSelectClass={onSelectClass}
            onEditClass={onEditClass}
          />
        )}
      </div>
    </div>
  );
};
