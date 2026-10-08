import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, RefreshCw, AlertCircle, X, LayoutGrid, List } from 'lucide-react';
import { ClassItem } from '../types';
import { ClassCard } from './ClassCard';
import { ClassTableView } from './ClassTableView';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { CustomSelect, SelectOption } from '../../../components/CustomSelect';

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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  // Dynamic Grade Options
  const gradeOptions = useMemo<SelectOption[]>(() => {
    const rawGrades = Array.from(
      new Set(classes.map((c) => c.grade).filter(Boolean))
    ) as string[];
    rawGrades.sort();
    return [
      { value: 'all', label: 'Tất cả các khối' },
      ...rawGrades.map((g) => ({
        value: g,
        label: g.startsWith('Khối') || g.startsWith('Lớp') ? g : `Khối ${g}`,
      })),
    ];
  }, [classes]);

  // Filtered classes by search and grade
  const displayClasses = useMemo(() => {
    return filteredClasses.filter((c) => {
      if (selectedGrade !== 'all' && c.grade !== selectedGrade) return false;
      return true;
    });
  }, [filteredClasses, selectedGrade]);

  const totalStudents = useMemo(() => {
    return classes.reduce((acc, curr) => acc + (curr.student_count || 0), 0);
  }, [classes]);

  return (
    <div className="space-y-4 sm:space-y-5 select-none">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-[#111728] border-0 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Quản Lý Lớp Học
          </h1>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
              {classes.length} Lớp học
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300">
              {totalStudents} Học sinh
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View mode toggle */}
          <SegmentedControl<'grid' | 'table'>
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'grid', label: 'Lưới Thẻ' },
              { value: 'table', label: 'Bảng Danh Sách' },
            ]}
            activeColor="bg-[#2563eb]"
            size="sm"
          />

          <button
            type="button"
            onClick={onCreateClass}
            className="flex items-center gap-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-3.5 py-2 rounded-xl font-bold text-xs border-0 shadow-xs transition-all duration-200 cursor-pointer active:scale-95 shrink-0"
            title="Tạo Lớp Học Mới"
          >
            <Plus size={14} className="shrink-0" />
            <span>Tạo Lớp</span>
          </button>
        </div>
      </div>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#111728] border-0 rounded-2xl p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Live Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
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

          {/* Grade filter */}
          <div className="w-36 sm:w-44">
            <CustomSelect
              value={selectedGrade}
              onChange={(val) => setSelectedGrade(String(val))}
              options={gradeOptions}
              placeholder="Khối lớp"
            />
          </div>

          {(search || selectedGrade !== 'all') && (
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                setSelectedGrade('all');
              }}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Đặt lại
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="p-2 rounded-xl text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer shrink-0"
          title="Tải lại danh sách"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* 3. CONTENT AREA: COMPACT GRID OR TANSTACK TABLE */}
      <div className="min-h-[360px]">
        {loading && classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-3 py-20">
            <RefreshCw className="h-7 w-7 text-blue-500 animate-spin" />
            <span className="text-xs font-bold">Đang tải danh sách lớp học...</span>
          </div>
        ) : classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-3 py-20 text-center bg-white dark:bg-[#111728] rounded-2xl p-8">
            <AlertCircle className="h-10 w-10 text-blue-500/60" />
            <p className="text-sm font-black text-slate-900 dark:text-white">Chưa có lớp học nào được tạo</p>
            <p className="text-xs text-slate-500">Bấm "Tạo Lớp" để bắt đầu quản lý học sinh và xếp chỗ.</p>
          </div>
        ) : viewMode === 'grid' ? (
          displayClasses.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs font-bold bg-white dark:bg-[#111728] rounded-2xl p-6">
              Không tìm thấy lớp học nào phù hợp với bộ lọc
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
              {displayClasses.map((cls, idx) => (
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
            classes={displayClasses}
            loading={loading}
            onSelectClass={onSelectClass}
            onEditClass={onEditClass}
          />
        )}
      </div>
    </div>
  );
};
