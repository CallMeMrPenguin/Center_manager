import React, { useMemo } from 'react';
import {
  ChevronRight,
  BarChart3,
  Layers,
  GraduationCap,
  GitCompare,
  FlaskConical,
  Calendar,
  RotateCcw,
  RefreshCw,
  Edit3
} from 'lucide-react';
import { CustomSelect } from '../../../components/CustomSelect';

interface ReportsHeaderProps {
  activeReportTab: 'overview' | 'deep' | 'skills' | 'benchmark';
  isTestMode: boolean;
  toggleTestMode: () => void;
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
  onOpenTestDatasetModal: () => void;
}

export const ReportsHeader: React.FC<ReportsHeaderProps> = ({
  activeReportTab,
  isTestMode,
  toggleTestMode,
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
  onOpenTestDatasetModal,
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
          {/* Test Mode Toggle */}
          <button
            type="button"
            onClick={toggleTestMode}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer border shrink-0 ${
              isTestMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-[#121626] text-slate-400 hover:text-white border-[#202842] hover:border-slate-600'
            }`}
            title={isTestMode ? "Chế độ Test đang BẬT: Nhấp để chuyển về dữ liệu thực" : "Nhấp để BẬT chế độ Test (20 buổi học / học sinh)"}
          >
            <FlaskConical size={14} className={isTestMode ? "text-amber-400 animate-pulse" : "text-slate-400"} />
            <span>Chế Độ Test (20 Buổi)</span>
            <span className={`w-2 h-2 rounded-full ${isTestMode ? 'bg-amber-400 animate-ping' : 'bg-slate-600'}`} />
          </button>

          {/* Academic Year Selector */}
          <CustomSelect
            icon={<Calendar size={14} className="text-indigo-400" />}
            value={selectedAcademicYear}
            onChange={(val) => setSelectedAcademicYear(String(val))}
            options={academicYears.map(y => ({ value: y, label: `Năm học ${y}` }))}
            className="w-40 shrink-0"
          />

          {/* Class Selector */}
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

      {/* Test Mode Active Banner */}
      {isTestMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <FlaskConical size={18} className="text-amber-400" />
            </div>
            <div>
              <div className="font-black text-amber-200 uppercase tracking-wide flex items-center gap-2">
                <span>Chế Độ Test Dữ Liệu Mẫu (20 Buổi Học / Học Sinh)</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">Đang Bật</span>
              </div>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Đang mô phỏng 20 buổi học với hệ thống điểm Từ Vựng, Ngữ Pháp, BTVN và phân bố đủ 8 cấp bậc xếp hạng (Đồng $\to$ Quán Quân). Không ảnh hưởng đến dữ liệu thực.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenTestDatasetModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-black transition cursor-pointer shrink-0 active:scale-95"
            >
              <Edit3 size={13} />
              <span>Xem & Sửa Dữ Liệu Test</span>
            </button>
            <button
              onClick={toggleTestMode}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-black transition cursor-pointer shrink-0 active:scale-95"
            >
              Tắt Chế Độ Test
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
