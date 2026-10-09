import React, { useMemo } from 'react';
import {
  ChevronRight,
  GraduationCap,
  GitCompare,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { CustomSelect } from '../../../components/CustomSelect';

interface ReportsHeaderProps {
  activeReportTab: 'overview' | 'deep' | 'skills' | 'benchmark';
  selectedAcademicYear: string;
  setSelectedAcademicYear: (y: string) => void;
  academicYears: string[];
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  setSelectedStudentId: (id: string) => void;
  classes: any[];
  loading: boolean;
  loadAnalyticsData: () => void;
  onOpenResetModal: () => void;
}

export const ReportsHeader: React.FC<ReportsHeaderProps> = ({
  activeReportTab,
  selectedAcademicYear,
  setSelectedAcademicYear,
  academicYears,
  selectedClassId,
  setSelectedClassId,
  setSelectedStudentId,
  classes,
  loading,
  loadAnalyticsData,
  onOpenResetModal,
}) => {
  const tabMeta = useMemo(() => {
    switch (activeReportTab) {
      case 'deep':
        return {
          breadcrumb: 'THỐNG KÊ SÂU & RỦI RO',
          title: 'Thống Kê Sâu & Cảnh Báo Sớm',
        };
      case 'skills':
        return {
          breadcrumb: 'KỸ NĂNG & THEO DÕI UNIT',
          title: 'Phân Tích Kỹ Năng & Lỗ Hổng Unit',
        };
      case 'benchmark':
        return {
          breadcrumb: 'SO SÁNH GIỮA CÁC LỚP',
          title: 'So Sánh Giữa Các Lớp',
        };
      case 'overview':
      default:
        return {
          breadcrumb: 'TỔNG QUAN',
          title: 'Báo Cáo Hiệu Suất Học Tập',
        };
    }
  }, [activeReportTab]);

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-[#181f36] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
            <span>BÁO CÁO THỐNG KÊ</span>
            <ChevronRight size={12} className="text-slate-400 dark:text-slate-500" />
            <span className="text-slate-900 dark:text-white transition-colors duration-200">{tabMeta.breadcrumb}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
            {tabMeta.title}
          </h1>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Academic Year Selector */}
          <CustomSelect
            icon={<Calendar size={14} className="text-indigo-500 dark:text-indigo-400" />}
            value={selectedAcademicYear}
            onChange={(val) => setSelectedAcademicYear(String(val))}
            options={academicYears.map(y => ({ value: y, label: `Năm học ${y}` }))}
            className="w-40 shrink-0"
            triggerClassName="!bg-white hover:!bg-slate-50 dark:!bg-[#141417] dark:hover:!bg-[#1c1c21] text-slate-900 dark:text-white shadow-xs hover:shadow-sm"
          />

          {/* Class Selector (not needed on Benchmark tab) */}
          {activeReportTab !== 'benchmark' && (
            <CustomSelect
              icon={<GraduationCap size={14} className="text-indigo-500 dark:text-indigo-400" />}
              value={selectedClassId}
              onChange={(val) => { setSelectedClassId(String(val)); setSelectedStudentId(''); }}
              options={[
                { value: '', label: 'Tất cả lớp học' },
                ...classes.map(c => ({ value: String(c.id), label: c.class_name }))
              ]}
              className="w-44 shrink-0"
              triggerClassName="!bg-white hover:!bg-slate-50 dark:!bg-[#141417] dark:hover:!bg-[#1c1c21] text-slate-900 dark:text-white shadow-xs hover:shadow-sm"
            />
          )}

          <button
            onClick={onOpenResetModal}
            className="group flex items-center gap-0 hover:gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-rose-50 dark:bg-[#181d2e] dark:hover:bg-rose-500/20 text-rose-600 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200 border-0 shadow-xs hover:shadow-sm text-xs font-bold transition-all duration-300 cursor-pointer active:scale-95 shrink-0"
            title="Đặt Lại Điểm Số"
          >
            <RotateCcw size={14} className="shrink-0" />
            <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">
              Đặt Lại Điểm Số
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
