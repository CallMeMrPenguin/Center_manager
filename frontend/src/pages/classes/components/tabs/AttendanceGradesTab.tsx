import React from 'react';
import { Layers, Save, FileCheck2 } from 'lucide-react';
import { ClassItem, EnrolledStudent, AttendanceRecord } from '../../types';
import { DataTable } from '../../../../components/DataTable';
import { useAttendanceColumns } from '../../hooks/useAttendanceColumns';
import { useSessionOverview } from './useSessionOverview';
import { exportClassReportPng } from '../../utils/exportClassReportPng';
import { SessionOverviewBanner } from './SessionOverviewBanner';
import { showToast } from '../../../../components/Toast';

interface AttendanceGradesTabProps {
  selectedClass: ClassItem;
  enrolledStudents: EnrolledStudent[];
  attendanceDate: string;
  attendanceRecords: AttendanceRecord[];
  onUpdateRecord: (studentId: number, field: string, value: any) => void;
  parseAndFormatScore: (val: any) => string;
  onOpenStudentActionModal: (student: EnrolledStudent) => void;
  onExportExcel: (thresholds?: any) => void;
  onExportDocx: () => void;
  onOpenTestConfigModal?: () => void;
  onCircularSwap?: () => void;
  onSaveAttendance?: () => void;
  savingAttendance?: boolean;
  autoSaveStatus?: 'idle' | 'saving' | 'saved';
}

export const AttendanceGradesTab: React.FC<AttendanceGradesTabProps> = ({
  selectedClass,
  enrolledStudents,
  attendanceDate,
  attendanceRecords,
  onUpdateRecord,
  parseAndFormatScore,
  onOpenStudentActionModal,
  onExportExcel,
  onExportDocx,
  onOpenTestConfigModal,
  onCircularSwap,
  onSaveAttendance,
  savingAttendance = false,
  autoSaveStatus = 'idle',
}) => {
  const sessionOverview = useSessionOverview(attendanceRecords);

  const { attendanceColumns } = useAttendanceColumns({
    attendanceRecords,
    enrolledStudents,
    onUpdateRecord,
    parseAndFormatScore,
    onOpenStudentActionModal,
  });

  const handleExportExcelWithThresholds = () => {
    onExportExcel({
      check_1: sessionOverview.threshC1,
      check_2: sessionOverview.threshC2,
      homework: sessionOverview.threshHw,
      divergence: sessionOverview.divergenceMin,
    });
  };

  const handleExportPng = async () => {
    if (onSaveAttendance) {
      await onSaveAttendance();
    }
    await exportClassReportPng({
      classItem: selectedClass,
      attendanceDate,
      records: attendanceRecords,
      thresholds: {
        check_1: sessionOverview.threshC1,
        check_2: sessionOverview.threshC2,
        homework: sessionOverview.threshHw,
        divergence: sessionOverview.divergenceMin,
      },
    });
  };

  const handleFilterStudentChip = (name: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(name);
      showToast(`Đã sao chép "${name}" để dán tìm kiếm`, 'info');
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. TÓM TẮT & TỔNG QUAN BUỔI HỌC */}
      <SessionOverviewBanner
        attendanceRecords={attendanceRecords}
        attendanceDate={attendanceDate}
        onFilterStudent={handleFilterStudentChip}
        overview={sessionOverview}
      />

      {/* 2. UNIFIED ATTENDANCE & GRADES DATATABLE */}
      <div className="bg-white dark:bg-[#0d1018] rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <DataTable
          tableId="classes-attendance-table"
          data={attendanceRecords}
          columns={attendanceColumns}
          pageSize={20}
          exportFilename={`diem_danh_${selectedClass?.class_name || ''}_${attendanceDate}`}
          onExportExcel={handleExportExcelWithThresholds}
          onExportPng={handleExportPng}
          onExportDocx={onExportDocx}
          toolbarRight={
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {onOpenTestConfigModal && (
                <button
                  type="button"
                  onClick={onOpenTestConfigModal}
                  className="group flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-[#181a20] dark:hover:bg-[#20232b] text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border-0 text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs outline-none shrink-0"
                  title="Cấu Hình Điểm (Check 1 & Check 2)"
                >
                  <Layers size={13} className="text-blue-500 dark:text-blue-400 shrink-0" />
                  <span className="max-w-0 opacity-0 group-hover:max-w-[160px] group-hover:opacity-100 2xl:max-w-none 2xl:opacity-100 transition-all duration-200 ease-in-out whitespace-nowrap overflow-hidden inline-block">
                    Cấu Hình Điểm
                  </span>
                </button>
              )}

              {onCircularSwap && (
                <button
                  type="button"
                  onClick={onCircularSwap}
                  className="group flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-[#181a20] dark:hover:bg-[#20232b] text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border-0 text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs outline-none shrink-0"
                  title="Sơ đồ chấm bài giữa các học sinh"
                >
                  <FileCheck2 size={13} className="text-purple-500 dark:text-purple-400 shrink-0" />
                  <span className="max-w-0 opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 xl:max-w-none xl:opacity-100 transition-all duration-200 ease-in-out whitespace-nowrap overflow-hidden inline-block">
                    Sơ Đồ Chấm Bài
                  </span>
                </button>
              )}

              {autoSaveStatus === 'saving' && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="hidden sm:inline">Đang lưu...</span>
                </div>
              )}

              {autoSaveStatus === 'saved' && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="hidden sm:inline">Đã tự động lưu</span>
                </div>
              )}

              {onSaveAttendance && (
                <button
                  type="button"
                  onClick={onSaveAttendance}
                  disabled={savingAttendance}
                  className="group flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer border-0 disabled:opacity-50 shrink-0"
                  title="Lưu"
                >
                  <Save size={13} className="shrink-0" />
                  <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 lg:max-w-none lg:opacity-100 transition-all duration-200 ease-in-out whitespace-nowrap overflow-hidden inline-block">
                    {savingAttendance ? 'Đang lưu...' : 'Lưu'}
                  </span>
                </button>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
};
