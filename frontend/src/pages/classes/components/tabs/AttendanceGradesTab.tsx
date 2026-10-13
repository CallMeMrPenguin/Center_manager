import React from 'react';
import { Layers, Save, FileCheck2 } from 'lucide-react';
import { ClassItem, EnrolledStudent, AttendanceRecord } from '../../types';
import { DataTable } from '../../../../components/DataTable';
import { Button } from '../../../../components/button';
import { useAttendanceColumns } from '../../hooks/useAttendanceColumns';
import { useSessionOverview } from './useSessionOverview';
import { exportClassReportPng } from '../../utils/exportClassReportPng';
import { SessionOverviewBanner } from './SessionOverviewBanner';
import { MobileAttendanceMatrix } from './MobileAttendanceMatrix';
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

      {/* 2. MOBILE ONLY: TRANSPOSED MATRIX (X-AXIS = STUDENT NAMES, Y-AXIS = METRICS) */}
      <div className="block md:hidden">
        <MobileAttendanceMatrix
          attendanceRecords={attendanceRecords}
          enrolledStudents={enrolledStudents}
          onUpdateRecord={onUpdateRecord}
          parseAndFormatScore={parseAndFormatScore}
          onOpenStudentActionModal={onOpenStudentActionModal}
        />
      </div>

      {/* 3. DESKTOP ONLY: UNIFIED ATTENDANCE & GRADES DATATABLE */}
      <div className="hidden md:block bg-white dark:bg-[#0d1018] rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <DataTable
          tableId="classes-attendance-table"
          data={attendanceRecords}
          columns={attendanceColumns}
          onRowDoubleClick={(row) => {
            const enrolled = enrolledStudents.find((s) => s.id === row.student_id);
            onOpenStudentActionModal(
              enrolled || { id: row.student_id, full_name: row.student_name }
            );
          }}
          pageSize={20}
          exportFilename={`diem_danh_${selectedClass?.class_name || ''}_${attendanceDate}`}
          onExportExcel={handleExportExcelWithThresholds}
          onExportPng={handleExportPng}
          onExportDocx={onExportDocx}
          toolbarRight={
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {onOpenTestConfigModal && (
                <Button
                  variant="white"
                  size="sm"
                  type="button"
                  onClick={onOpenTestConfigModal}
                  leftIcon={<Layers size={13} className="text-blue-500 dark:text-blue-400 shrink-0" />}
                  className="group shrink-0"
                  title="Cấu Hình Điểm (Check 1 & Check 2)"
                >
                  <span className="max-w-0 opacity-0 group-hover:max-w-[160px] group-hover:opacity-100 2xl:max-w-none 2xl:opacity-100 transition-all duration-200 ease-in-out whitespace-nowrap overflow-hidden inline-block">
                    Cấu Hình Điểm
                  </span>
                </Button>
              )}

              {onCircularSwap && (
                <Button
                  variant="white"
                  size="sm"
                  type="button"
                  onClick={onCircularSwap}
                  leftIcon={<FileCheck2 size={13} className="text-purple-500 dark:text-purple-400 shrink-0" />}
                  className="group shrink-0"
                  title="Sơ đồ chấm bài giữa các học sinh"
                >
                  <span className="max-w-0 opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 xl:max-w-none xl:opacity-100 transition-all duration-200 ease-in-out whitespace-nowrap overflow-hidden inline-block">
                    Sơ Đồ Chấm Bài
                  </span>
                </Button>
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
                <Button
                  variant="success"
                  size="sm"
                  type="button"
                  onClick={onSaveAttendance}
                  disabled={savingAttendance}
                  leftIcon={<Save size={13} className="shrink-0" />}
                  className="group shrink-0"
                  title="Lưu"
                >
                  <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 lg:max-w-none lg:opacity-100 transition-all duration-200 ease-in-out whitespace-nowrap overflow-hidden inline-block">
                    {savingAttendance ? 'Đang lưu...' : 'Lưu'}
                  </span>
                </Button>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
};
