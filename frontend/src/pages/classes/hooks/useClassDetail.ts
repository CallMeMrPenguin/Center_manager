import { useState, useEffect, useRef, useCallback } from 'react';
import { ClassItem, EnrolledStudent, AttendanceRecord } from '../types';
import { api } from '../../../api';
import { showToast } from '../../../components/Toast';
import { getLocalDateStr, notifyDataChanged } from '../../../utils';
import { parseAndFormatScore, applyAutoAttendanceStatus } from '../utils/attendanceHelpers';

export function useClassDetail(selectedClass: ClassItem | null) {
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(() => {
    return sessionStorage.getItem('center_manager_last_att_date') || getLocalDateStr();
  });
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const attendanceRecordsRef = useRef<AttendanceRecord[]>([]);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [selectedClassWeeklyDays, setSelectedClassWeeklyDays] = useState<number[]>([]);

  const isDirtyRef = useRef(false);
  const currentClassIdRef = useRef<number | null>(selectedClass?.id ?? null);
  const currentDateRef = useRef<string>(attendanceDate);
  const stateUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    currentClassIdRef.current = selectedClass?.id ?? null;
  }, [selectedClass?.id]);

  useEffect(() => {
    currentDateRef.current = attendanceDate;
  }, [attendanceDate]);

  // Parallelized loader for class students, attendance records, and schedule
  const loadClassDetailData = useCallback(async (clsId: number, dateStr: string) => {
    try {
      const [attData, enrolled, slots] = await Promise.all([
        api.getClassAttendance(clsId, dateStr),
        api.getClassStudents(clsId),
        api.getClassWeeklySchedule(clsId).catch(() => [])
      ]);

      let recs = attData?.records || [];
      // Restore unsaved draft from sessionStorage if available
      try {
        const savedDraft = sessionStorage.getItem(`cm_draft_${clsId}_${dateStr}`);
        if (savedDraft) {
          const parsedDraft = JSON.parse(savedDraft);
          if (Array.isArray(parsedDraft) && parsedDraft.length > 0) {
            recs = parsedDraft;
            isDirtyRef.current = true;
          }
        }
      } catch (_) {}

      attendanceRecordsRef.current = recs;
      setAttendanceRecords(recs);
      setEnrolledStudents(enrolled || []);
      if (!isDirtyRef.current) isDirtyRef.current = false;

      if (slots && Array.isArray(slots)) {
        const dayMap: Record<string, number> = {
          'Chủ nhật': 0, 'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4, 'Thứ 6': 5, 'Thứ 7': 6,
        };
        const days = slots.map((s: any) => dayMap[s.day_of_week]).filter((d: any) => d !== undefined);
        setSelectedClassWeeklyDays(days);
      } else {
        setSelectedClassWeeklyDays([]);
      }
    } catch (err: any) {
      showToast('Không thể tải dữ liệu lớp học: ' + err.message, 'error');
    }
  }, []);

  // Single unified effect on class selection or date change
  useEffect(() => {
    if (selectedClass) {
      loadClassDetailData(selectedClass.id, attendanceDate);
    } else {
      setSelectedClassWeeklyDays([]);
      setEnrolledStudents([]);
      setAttendanceRecords([]);
      attendanceRecordsRef.current = [];
      isDirtyRef.current = false;
    }
  }, [selectedClass?.id, attendanceDate, loadClassDetailData]);

  const loadAttendanceData = useCallback(async (clsId: number, dateStr: string) => {
    try {
      const data = await api.getClassAttendance(clsId, dateStr);
      const recs = data.records || [];
      attendanceRecordsRef.current = recs;
      setAttendanceRecords(recs);
      isDirtyRef.current = false;
    } catch (err: any) {
      showToast('Không thể tải bảng điểm danh: ' + err.message, 'error');
    }
  }, []);

  const loadEnrolledStudents = useCallback(async (clsId: number) => {
    try {
      const enrolled = await api.getClassStudents(clsId);
      setEnrolledStudents(enrolled);
      return enrolled;
    } catch (err: any) {
      showToast('Lỗi khi tải học sinh lớp: ' + err.message, 'error');
      return [];
    }
  }, []);

  // Save changes silently to backend DB and invalidate caches (on tab change, unmount, etc.)
  const flushSaveAttendance = useCallback(async (silent = true) => {
    const classId = currentClassIdRef.current;
    const dateStr = currentDateRef.current;
    if (!isDirtyRef.current || !classId || !dateStr) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    try {
      const currentRecords = attendanceRecordsRef.current.length > 0 ? attendanceRecordsRef.current : attendanceRecords;
      const { records: finalRecords } = applyAutoAttendanceStatus(currentRecords);
      isDirtyRef.current = false;
      await api.saveClassAttendance(classId, dateStr, finalRecords);
      sessionStorage.removeItem(`cm_draft_${classId}_${dateStr}`);
      if (!silent) {
        showToast('Đã tự động lưu bảng điểm!', 'success');
      }
      notifyDataChanged(['attendance', 'reports', 'analytics']);
    } catch (err: any) {
      console.error('Tự động lưu bảng điểm thất bại:', err);
    }
  }, [applyAutoAttendanceStatus, attendanceRecords]);

  // Flush on unmount, page refresh (F5), or tab hide
  useEffect(() => {
    const handleBeforeUnload = () => {
      const classId = currentClassIdRef.current;
      const dateStr = currentDateRef.current;
      if (isDirtyRef.current && classId && dateStr) {
        const currentRecords = attendanceRecordsRef.current.length > 0 ? attendanceRecordsRef.current : [];
        const { records: finalRecords } = applyAutoAttendanceStatus(currentRecords);
        try {
          const payload = JSON.stringify({ date: dateStr, records: finalRecords });
          if (navigator.sendBeacon) {
            navigator.sendBeacon(`/api/classes/${classId}/attendance`, new Blob([payload], { type: 'application/json' }));
          } else {
            api.saveClassAttendance(classId, dateStr, finalRecords).catch(() => {});
          }
        } catch {
          api.saveClassAttendance(classId, dateStr, finalRecords).catch(() => {});
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isDirtyRef.current) {
        flushSaveAttendance(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      const classId = currentClassIdRef.current;
      const dateStr = currentDateRef.current;
      if (isDirtyRef.current && classId && dateStr) {
        api.saveClassAttendance(classId, dateStr, attendanceRecordsRef.current).catch(() => {});
      }
    };
  }, [applyAutoAttendanceStatus, flushSaveAttendance]);

  const handleUpdateRecord = useCallback(
    (studentId: number, field: string, value: any, immediate = false) => {
      const prev = attendanceRecordsRef.current;
      const newRecs = prev.map((rec) => {
        if (rec.student_id !== studentId) return rec;
        const updated = { ...rec, [field]: value };
        const c1 = updated.check_1 !== null && updated.check_1 !== undefined && updated.check_1 !== '' ? Number(updated.check_1) : null;
        const c2 = updated.check_2 !== null && updated.check_2 !== undefined && updated.check_2 !== '' ? Number(updated.check_2) : null;
        const hw = updated.homework !== null && updated.homework !== undefined && updated.homework !== '' ? Number(updated.homework) : null;
        const mock = updated.mock_test !== null && updated.mock_test !== undefined && updated.mock_test !== '' ? Number(updated.mock_test) : null;
        const hasScore = (c1 !== null && c1 > 0) || (c2 !== null && c2 > 0) || (hw !== null && hw > 0) || (mock !== null && mock > 0);

        if (field !== 'status' && hasScore && updated.status === 'Vắng mặt') {
          updated.status = 'Có mặt';
        }
        return updated;
      });

      attendanceRecordsRef.current = newRecs;
      isDirtyRef.current = true;

      // Fail-safe draft in sessionStorage
      const cid = currentClassIdRef.current;
      const cdate = currentDateRef.current;
      if (cid && cdate) {
        try {
          sessionStorage.setItem(`cm_draft_${cid}_${cdate}`, JSON.stringify(newRecs));
        } catch (_) {}
      }

      // Synchronize React state: immediate on status change, blur, or key navigation; debounced 200ms when typing
      if (field === 'status' || immediate) {
        if (stateUpdateTimerRef.current) {
          clearTimeout(stateUpdateTimerRef.current);
          stateUpdateTimerRef.current = null;
        }
        setAttendanceRecords(newRecs);
      } else {
        if (stateUpdateTimerRef.current) clearTimeout(stateUpdateTimerRef.current);
        stateUpdateTimerRef.current = setTimeout(() => {
          setAttendanceRecords(attendanceRecordsRef.current);
        }, 200);
      }

      // Debounced background auto-save to database (1500ms after last keystroke)
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      setAutoSaveStatus('saving');
      autoSaveTimerRef.current = setTimeout(async () => {
        const classId = currentClassIdRef.current;
        const dateStr = currentDateRef.current;
        if (!isDirtyRef.current || !classId || !dateStr) {
          setAutoSaveStatus('idle');
          return;
        }
        try {
          const { records: finalRecords } = applyAutoAttendanceStatus(attendanceRecordsRef.current);
          isDirtyRef.current = false;
          await api.saveClassAttendance(classId, dateStr, finalRecords);
          sessionStorage.removeItem(`cm_draft_${classId}_${dateStr}`);
          setAutoSaveStatus('saved');
          notifyDataChanged(['attendance', 'reports', 'analytics']);
          setTimeout(() => setAutoSaveStatus('idle'), 2500);
        } catch (e) {
          console.error('Tự động lưu bảng điểm thất bại:', e);
          setAutoSaveStatus('idle');
        }
      }, 1500);
    },
    [applyAutoAttendanceStatus]
  );

  const handleDateChange = useCallback(async (newDate: string) => {
    if (newDate === attendanceDate) return;
    if (isDirtyRef.current && selectedClass) {
      try {
        await api.saveClassAttendance(selectedClass.id, attendanceDate, attendanceRecordsRef.current);
        sessionStorage.removeItem(`cm_draft_${selectedClass.id}_${attendanceDate}`);
        isDirtyRef.current = false;
        notifyDataChanged(['attendance', 'reports', 'analytics']);
      } catch (e) {}
    }
    sessionStorage.setItem('center_manager_last_att_date', newDate);
    setAttendanceDate(newDate);
  }, [attendanceDate, selectedClass]);

  const handleSaveAttendance = async () => {
    if (!selectedClass) return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    setSavingAttendance(true);
    try {
      const currentRecords = attendanceRecordsRef.current.length > 0 ? attendanceRecordsRef.current : attendanceRecords;
      const { records: finalRecords } = applyAutoAttendanceStatus(currentRecords);
      attendanceRecordsRef.current = finalRecords;
      setAttendanceRecords(finalRecords);
      isDirtyRef.current = false;
      await api.saveClassAttendance(selectedClass.id, attendanceDate, finalRecords);
      sessionStorage.removeItem(`cm_draft_${selectedClass.id}_${attendanceDate}`);
      setAutoSaveStatus('saved');
      showToast('Đã lưu bảng điểm danh và điểm học sinh vào cơ sở dữ liệu!', 'success');
      notifyDataChanged(['attendance', 'reports', 'analytics']);
      setTimeout(() => setAutoSaveStatus('idle'), 2500);
    } catch (err: any) {
      showToast('Lưu thất bại: ' + err.message, 'error');
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleExportExcel = async (thresholds?: any) => {
    if (!selectedClass) return;
    try {
      const recordsToExport = attendanceRecordsRef.current.length > 0 ? attendanceRecordsRef.current : attendanceRecords;
      const res = await api.exportClassExcel(selectedClass.id, attendanceDate, recordsToExport, thresholds);
      if (res && res.filename) {
        showToast(`Đã xuất file Excel: ${res.filename}`, 'success', 'MỞ FILE', () => {
          api.openLocalFile(res.filename);
        });
      }
    } catch (err: any) {
      showToast('Xuất Excel thất bại: ' + err.message, 'error');
    }
  };

  const handleExportDocx = async () => {
    if (!selectedClass) return;
    try {
      const recordsToExport = attendanceRecordsRef.current.length > 0 ? attendanceRecordsRef.current : attendanceRecords;
      const res = await api.exportClassDocx(selectedClass.id, attendanceDate, recordsToExport);
      if (res && res.filename) {
        showToast(`Đã xuất file Word: ${res.filename}`, 'success', 'MỞ FILE', () => {
          api.openLocalFile(res.filename);
        });
      }
    } catch (err: any) {
      showToast('Xuất Word thất bại: ' + err.message, 'error');
    }
  };

  const handleUnenrollStudent = async (stId: number) => {
    if (!selectedClass) return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    isDirtyRef.current = false;
    try {
      sessionStorage.removeItem(`cm_draft_${selectedClass.id}_${attendanceDate}`);
    } catch (_) {}

    // Optimistically update enrolled students and attendance records immediately for 0ms lag
    setEnrolledStudents((prev) => prev.filter((s) => s.id !== stId));
    const nextRecs = attendanceRecordsRef.current.filter((r) => r.student_id !== stId);
    attendanceRecordsRef.current = nextRecs;
    setAttendanceRecords(nextRecs);

    try {
      await api.unenrollStudent(selectedClass.id, stId);
      showToast('Đã xoá học sinh khỏi lớp!', 'success');
      await Promise.all([
        loadEnrolledStudents(selectedClass.id),
        loadAttendanceData(selectedClass.id, attendanceDate),
      ]);
      notifyDataChanged(['classes', 'students', 'attendance', 'seating']);
    } catch (err: any) {
      showToast('Không thể bỏ ghi danh: ' + err.message, 'error');
      // Rollback on failure
      loadEnrolledStudents(selectedClass.id);
      loadAttendanceData(selectedClass.id, attendanceDate);
    }
  };

  const handleDeleteAttendanceDate = async () => {
    if (!selectedClass || !attendanceDate) return;
    isDirtyRef.current = false;
    try {
      await api.deleteClassAttendance(selectedClass.id, attendanceDate);
      showToast(`Đã xóa lịch học và điểm danh ngày ${attendanceDate}!`, 'success');
      await loadAttendanceData(selectedClass.id, attendanceDate);
      notifyDataChanged(['attendance', 'schedule', 'sessions', 'reports', 'analytics', 'classes']);
    } catch (err: any) {
      showToast('Xóa lịch học thất bại: ' + err.message, 'error');
    }
  };

  return {
    enrolledStudents,
    attendanceDate,
    setAttendanceDate: handleDateChange,
    attendanceRecords,
    savingAttendance,
    autoSaveStatus,
    selectedClassWeeklyDays,
    loadAttendanceData,
    loadEnrolledStudents,
    handleUpdateRecord,
    parseAndFormatScore,
    handleSaveAttendance,
    flushSaveAttendance,
    handleDeleteAttendanceDate,
    handleExportExcel,
    handleExportDocx,
    handleUnenrollStudent,
  };
}
