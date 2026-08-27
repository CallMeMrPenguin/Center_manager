import React, { useMemo } from 'react';
import {
  ChevronRight,
  BarChart3,
  Layers,
  GraduationCap,
  GitCompare,
  Calendar,
  RotateCcw,
  RefreshCw,
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
          icon: <Layers className="h-7 w-7 text-indigo-400" />,
        };
      case 'skills':
        return {
          breadcrumb: 'KỸ NĂNG & THEO DÕI UNIT',
          title: 'Phân Tích Kỹ Năng & Lỗ Hổng Unit',
          icon: <GraduationCap className="h-7 w-7 text-indigo-400" />,
        };
      case 'benchmark':
        return {
          breadcrumb: 'SO SÁNH GIỮA CÁC LỚP',
          title: 'So Sánh Tương Quan Giữa Các Lớp',
          icon: <GitCompare className="h-7 w-7 text-indigo-400" />,
        };
      case 'overview':
      default:
        return {
          breadcrumb: 'TỔNG QUAN HIỆU SUẤT',
          title: 'Báo Cáo Hiệu Suất Học Tập',
          icon: <BarChart3 className="h-7 w-7 text-indigo-400" />,
        };
    }
  }, [activeReportTab]);

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#181f36] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-black uppercase text-indigo-400 tracking-wider">
            <span>BÁO CÁO THỐNG KÊ</span>
            <ChevronRight size={12} className="text-slate-500" />
            <span className="text-white transition-colors duration-200">{tabMeta.breadcrumb}</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1 tracking-tight flex items-center gap-3">
            {tabMeta.icon}
            <span>{tabMeta.title}</span>
          </h1>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Academic Year Selector */}
          <CustomSelect
            icon={<Calendar size={14} className="text-indigo-400" />}
            value={selectedAcademicYear}
            onChange={(val) => setSelectedAcademicYear(String(val))}
            options={academicYears.map(y => ({ value: y, label: `Năm học ${y}` }))}
            className="w-40 shrink-0"
          />

          {/* Class Selector (or Cross-class indicator on Benchmark tab) */}
          {activeReportTab !== 'benchmark' ? (
            <CustomSelect
              icon={<GraduationCap size={14} className="text-indigo-400" />}
              value={selectedClassId}
              onChange={(val) => { setSelectedClassId(String(val)); setSelectedStudentId(''); }}
              options={[
                { value: '', label: 'Tất cả lớp học' },
                ...classes.map(c => ({ value: String(c.id), label: `${c.class_name} (${c.grade || 'Lớp 6'})` }))
              ]}
              className="w-44 shrink-0"
            />
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold shrink-0">
              <GitCompare size={14} className="text-blue-400" />
              <span>Chế độ so sánh tất cả lớp</span>
            </div>
          )}

          <button
            onClick={onOpenResetModal}
            className="group flex items-center gap-0 hover:gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-all duration-300 cursor-pointer shadow-sm active:scale-95 shrink-0"
            title="Đặt Lại Điểm Số"
          >
            <RotateCcw size={14} className="shrink-0" />
            <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">
              Đặt Lại Điểm Số
            </span>
          </button>

          <button
            onClick={() => loadAnalyticsData()}
            className="p-2.5 rounded-xl bg-[#121626] hover:bg-[#1e2640] text-slate-300 hover:text-white border border-[#202842] transition cursor-pointer shadow-sm shrink-0"
            title="Làm mới báo cáo"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-indigo-400" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
};
