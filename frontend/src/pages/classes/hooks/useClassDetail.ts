import { useState, useEffect, useRef, useCallback } from 'react';
import { ClassItem, EnrolledStudent, AttendanceRecord } from '../types';
import { api } from '../../../api';
import { showToast } from '../../../components/Toast';
import { getLocalDateStr, notifyDataChanged } from '../../../utils';

export function useClassDetail(selectedClass: ClassItem | null) {
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(() => {
    return sessionStorage.getItem('center_manager_last_att_date') || getLocalDateStr();
  });
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const attendanceRecordsRef = useRef<AttendanceRecord[]>([]);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [selectedClassWeeklyDays, setSelectedClassWeeklyDays] = useState<number[]>([]);

  const isDirtyRef = useRef(false);
  const currentClassIdRef = useRef<number | null>(selectedClass?.id ?? null);
  const currentDateRef = useRef<string>(attendanceDate);

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

      const recs = attData?.records || [];
      attendanceRecordsRef.current = recs;
      setAttendanceRecords(recs);
      setEnrolledStudents(enrolled || []);
      isDirtyRef.current = false;

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

  const parseAndFormatScore = useCallback((val: any): string => {
    if (val === undefined || val === null || val === '') return '';
    let valStr = String(val).trim().replace(',', '.');
    if (!valStr) return '';
    if (isNaN(Number(valStr))) return '';

    let numVal = parseFloat(valStr);
    if (numVal < 0) return '';
    if (numVal > 10) {
      if (valStr.startsWith('10')) {
        numVal = 10;
      } else {
        const digits = valStr.replace('.', '').replace('-', '');
        if (digits.length >= 2) {
          numVal = parseFloat(`${digits[0]}.${digits[1]}`);
        } else if (digits.length === 1) {
          numVal = parseFloat(digits[0]);
        } else {
          return '';
        }
      }
    }
    if (numVal > 10) numVal = 10;
    // 1-decimal truncation per Rule 17
    const truncated = Math.floor(numVal * 10 + 0.0000001) / 10;
    return truncated % 1 === 0 ? String(truncated.toFixed(0)) : truncated.toFixed(1);
  }, []);

  const applyAutoAttendanceStatus = useCallback((records: AttendanceRecord[]) => {
    const newRecords = records.map((rec) => {
      const isAbsent = rec.status === 'Vắng mặt' || rec.status === 'Nghỉ học';

      const formatScoreField = (val: any) => {
        if (isAbsent) {
          return val !== null && val !== undefined && val !== '' ? String(val) : null;
        }
        // Missing / empty score should remain null, never default to '0' per Rule 8
        if (val === null || val === undefined || val === '') return null;
        return String(val);
      };

      const status = rec.status || 'Có mặt';
      return {
        ...rec,
        status,
        check_1: formatScoreField(rec.check_1),
        check_2: formatScoreField(rec.check_2),
        homework: formatScoreField(rec.homework),
        mock_test: formatScoreField(rec.mock_test),
      };
    });
    return { records: newRecords };
  }, []);

  // Save changes silently to backend DB and invalidate caches (on tab change, unmount, etc.)
  const flushSaveAttendance = useCallback(async (silent = true) => {
    const classId = currentClassIdRef.current;
    const dateStr = currentDateRef.current;
    if (!isDirtyRef.current || !classId || !dateStr) return;

    try {
      const currentRecords = attendanceRecordsRef.current.length > 0 ? attendanceRecordsRef.current : attendanceRecords;
      const { records: finalRecords } = applyAutoAttendanceStatus(currentRecords);
      isDirtyRef.current = false;
      await api.saveClassAttendance(classId, dateStr, finalRecords);
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
    (studentId: number, field: string, value: any) => {
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

      // Status buttons require immediate UI feedback
      if (field === 'status') {
        setAttendanceRecords(newRecs);
      }
    },
    []
  );

  const handleDateChange = useCallback(async (newDate: string) => {
    if (newDate === attendanceDate) return;
    if (isDirtyRef.current && selectedClass) {
      try {
        await api.saveClassAttendance(selectedClass.id, attendanceDate, attendanceRecordsRef.current);
        isDirtyRef.current = false;
        notifyDataChanged(['attendance', 'reports', 'analytics']);
      } catch (e) {}
    }
    sessionStorage.setItem('center_manager_last_att_date', newDate);
    setAttendanceDate(newDate);
  }, [attendanceDate, selectedClass]);

  const handleSaveAttendance = async () => {
    if (!selectedClass) return;
    setSavingAttendance(true);
    try {
      const currentRecords = attendanceRecordsRef.current.length > 0 ? attendanceRecordsRef.current : attendanceRecords;
      const { records: finalRecords } = applyAutoAttendanceStatus(currentRecords);
      attendanceRecordsRef.current = finalRecords;
      setAttendanceRecords(finalRecords);
      isDirtyRef.current = false;
      await api.saveClassAttendance(selectedClass.id, attendanceDate, finalRecords);
      showToast('Đã lưu bảng điểm danh và điểm học sinh vào cơ sở dữ liệu!', 'success');
      notifyDataChanged(['attendance', 'reports', 'analytics']);
    } catch (err: any) {
      showToast('Lưu thất bại: ' + err.message, 'error');
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedClass) return;
    try {
      const recordsToExport = attendanceRecordsRef.current.length > 0 ? attendanceRecordsRef.current : attendanceRecords;
      const res = await api.exportClassExcel(selectedClass.id, attendanceDate, recordsToExport);
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
    try {
      await api.unenrollStudent(selectedClass.id, stId);
      showToast('Đã xoá học sinh khỏi lớp!', 'success');
      // Optimistically update enrolled students and attendance records immediately
      setEnrolledStudents((prev) => prev.filter((s) => s.id !== stId));
      const nextRecs = attendanceRecordsRef.current.filter((r) => r.student_id !== stId);
      attendanceRecordsRef.current = nextRecs;
      setAttendanceRecords(nextRecs);

      // Re-fetch fresh state from server
      await Promise.all([
        loadEnrolledStudents(selectedClass.id),
        loadAttendanceData(selectedClass.id, attendanceDate),
      ]);
      notifyDataChanged(['classes', 'students', 'attendance', 'seating']);
    } catch (err: any) {
      showToast('Không thể bỏ ghi danh: ' + err.message, 'error');
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
