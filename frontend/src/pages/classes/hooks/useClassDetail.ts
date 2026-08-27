import { useState, useEffect, useRef, useCallback, startTransition } from 'react';
import { ClassItem, EnrolledStudent, AttendanceRecord } from '../types';
import { api } from '../../../api';
import { showToast } from '../../../components/Toast';
import { getLocalDateStr, notifyDataChanged } from '../../../utils';

export function useClassDetail(selectedClass: ClassItem | null) {
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(() => getLocalDateStr());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const attendanceRecordsRef = useRef<AttendanceRecord[]>([]);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [selectedClassWeeklyDays, setSelectedClassWeeklyDays] = useState<number[]>([]);

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
    }
  }, [selectedClass?.id, attendanceDate, loadClassDetailData]);

  const loadAttendanceData = useCallback(async (clsId: number, dateStr: string) => {
    try {
      const data = await api.getClassAttendance(clsId, dateStr);
      const recs = data.records || [];
      attendanceRecordsRef.current = recs;
      setAttendanceRecords(recs);
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

    const numVal = parseFloat(valStr);
    if (numVal > 10) {
      if (valStr.startsWith('10')) {
        return '10';
      } else {
        const digits = valStr.replace('.', '').replace('-', '');
        if (digits.length >= 2) {
          return `${digits[0]}.${digits[1]}`;
        } else if (digits.length === 1) {
          return `${digits[0]}`;
        }
      }
    }
    return String(numVal);
  }, []);

  const saveDebounceRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
      }
    };
  }, []);

  const handleUpdateRecord = useCallback(
    (studentId: number, field: string, value: any, syncParentState = false) => {
      const prev = attendanceRecordsRef.current;
      const newRecs = prev.map((rec) => {
        if (rec.student_id !== studentId) return rec;
        const updated = { ...rec, [field]: value };
        const c1 = updated.check_1 !== null && updated.check_1 !== undefined && updated.check_1 !== '' ? Number(updated.check_1) : null;
        const c2 = updated.check_2 !== null && updated.check_2 !== undefined && updated.check_2 !== '' ? Number(updated.check_2) : null;
        const hw = updated.homework !== null && updated.homework !== undefined && updated.homework !== '' ? Number(updated.homework) : null;
        const hasScore = (c1 !== null && c1 > 0) || (c2 !== null && c2 > 0) || (hw !== null && hw > 0);

        if (field !== 'status' && hasScore && updated.status === 'Vắng mặt') {
          updated.status = 'Có mặt';
        }
        return updated;
      });

      attendanceRecordsRef.current = newRecs;

      // Only re-render the whole table when attendance status changes or when explicitly requested
      // This keeps cell-by-cell score tabbing 100% stable, fast, and free of focus-stealing re-renders!
      if (syncParentState || field === 'status') {
        startTransition(() => {
          setAttendanceRecords(newRecs);
        });
      }

      // Debounce auto-save to backend
      if (selectedClass && newRecs.length > 0) {
        if (saveDebounceRef.current) {
          clearTimeout(saveDebounceRef.current);
        }
        saveDebounceRef.current = setTimeout(async () => {
          try {
            await api.saveClassAttendance(selectedClass.id, attendanceDate, attendanceRecordsRef.current);
            notifyDataChanged(['attendance', 'reports', 'analytics']);
          } catch (err: any) {
            console.error('Tự động lưu thất bại:', err);
          }
        }, 800);
      }
    },
    [selectedClass, attendanceDate]
  );

  const applyAutoAttendanceStatus = useCallback((records: AttendanceRecord[], targetDateStr: string) => {
    const todayStr = getLocalDateStr();
    const isPastDate = targetDateStr < todayStr;

    const newRecords = records.map((rec) => {
      const c1 = rec.check_1 !== null && rec.check_1 !== undefined && rec.check_1 !== '' ? Number(rec.check_1) : null;
      const c2 = rec.check_2 !== null && rec.check_2 !== undefined && rec.check_2 !== '' ? Number(rec.check_2) : null;
      const hw = rec.homework !== null && rec.homework !== undefined && rec.homework !== '' ? Number(rec.homework) : null;
      const hasScore = (c1 !== null && c1 > 0) || (c2 !== null && c2 > 0) || (hw !== null && hw > 0);
      const hasNote = rec.notes && String(rec.notes).trim() !== '';

      let newStatus = rec.status;
      if (hasScore) {
        newStatus = 'Có mặt';
      } else if (isPastDate && !hasScore && !hasNote && !rec.id) {
        newStatus = 'Vắng mặt';
      } else if (!newStatus) {
        newStatus = 'Có mặt';
      }
      return { ...rec, status: newStatus };
    });
    return { records: newRecords };
  }, []);

  const handleSaveAttendance = async () => {
    if (!selectedClass) return;
    setSavingAttendance(true);
    try {
      const { records: finalRecords } = applyAutoAttendanceStatus(attendanceRecords, attendanceDate);
      attendanceRecordsRef.current = finalRecords;
      setAttendanceRecords(finalRecords);
      await api.saveClassAttendance(selectedClass.id, attendanceDate, finalRecords);
      showToast('Đã lưu bảng điểm danh và điểm học sinh!', 'success');
      notifyDataChanged();
    } catch (err: any) {
      showToast('Lưu thất bại: ' + err.message, 'error');
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedClass) return;
    try {
      const res = await api.exportClassExcel(selectedClass.id, attendanceDate, attendanceRecords);
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
      const res = await api.exportClassDocx(selectedClass.id, attendanceDate, attendanceRecords);
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
      loadEnrolledStudents(selectedClass.id);
      loadAttendanceData(selectedClass.id, attendanceDate);
      notifyDataChanged();
    } catch (err: any) {
      showToast('Không thể bỏ ghi danh: ' + err.message, 'error');
    }
  };

  return {
    enrolledStudents,
    attendanceDate,
    setAttendanceDate,
    attendanceRecords,
    savingAttendance,
    selectedClassWeeklyDays,
    loadAttendanceData,
    loadEnrolledStudents,
    handleUpdateRecord,
    parseAndFormatScore,
    handleSaveAttendance,
    handleExportExcel,
    handleExportDocx,
    handleUnenrollStudent,
  };
}
