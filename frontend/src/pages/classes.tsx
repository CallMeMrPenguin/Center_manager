import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen, Plus, Search, Edit3, Trash2, Users, User, MapPin, Pencil,
  Shuffle, FileCheck2, Save, X, RefreshCw, AlertTriangle, AlertCircle, UserPlus, ChevronLeft, ChevronRight, Move,
  Calendar, FileSpreadsheet, FileText, CheckCircle2, Minus, CheckSquare, Square, Filter, Eye, EyeOff
} from 'lucide-react';
import { api } from '../api';
import { showToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import RelationshipsTab from '../components/seating/RelationshipsTab';
import BlossomResultModal from '../components/seating/BlossomResultModal';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { CustomSelect } from '../components/CustomSelect';
import { getLocalDateStr, notifyDataChanged } from '../utils';
import { DataTable } from '../components/DataTable';
import { ColumnDef } from '@tanstack/react-table';

interface ClassItem {
  id: number;
  class_name: string;
  teacher_id?: number;
  teacher_name?: string;
  grade?: string;
  subject?: string;
  room?: string;
  status: 'Đang hoạt động' | 'Tạm dừng' | 'Đã kết thúc';
  color?: string;
  notes?: string;
  student_count?: number;
}

interface EnrolledStudent {
  id: number;
  full_name: string;
  grade?: string;
}

interface TeacherCM {
  id: number;
  full_name: string;
}

const GRADE_LIST = ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5', 'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12'];
const WEEKDAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

const DEFAULT_PALETTE = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#f43f5e'  // Rose
];

function getClassColor(cls: ClassItem, index: number): string {
  if (cls.color && cls.color.startsWith('#')) {
    return cls.color;
  }
  const notesMatch = (cls.notes || '').match(/#COLOR:(#[0-9a-fA-F]{6})/);
  if (notesMatch) {
    return notesMatch[1];
  }
  return DEFAULT_PALETTE[(cls.id || index) % DEFAULT_PALETTE.length];
}

function hexToRGBA(hex: string, alpha: number): string {
  let c = (hex || '#3b82f6').replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(59, 130, 246, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const CheckScoreInput = React.memo(({
  rec,
  field,
  onUpdateRecord,
  parseAndFormatScore
}: {
  rec: any;
  field: 'check_1' | 'check_2' | 'homework';
  onUpdateRecord: (studentId: number, field: string, value: any) => void;
  parseAndFormatScore: (val: any) => string;
}) => {
  const [val, setVal] = useState(rec[field] ?? '');

  useEffect(() => {
    setVal(rec[field] ?? '');
  }, [rec[field]]);

  const predKey = field === 'check_1' ? 'pred_c1' : field === 'check_2' ? 'pred_c2' : 'pred_hw';
  const defaultPred = field === 'check_1' ? 8.5 : field === 'check_2' ? 8.0 : 9.0;
  const predVal = rec[predKey] !== undefined ? rec[predKey] : Math.min(10.0, Math.max(0.0, (Number(val) || defaultPred)));
  const badgeColor = field === 'check_1' ? 'text-indigo-300' : field === 'check_2' ? 'text-purple-300' : 'text-emerald-300';
  const label = field === 'check_1' ? 'Check 1' : field === 'check_2' ? 'Check 2' : 'HW';

  return (
    <div className="flex flex-col items-center justify-center gap-0.5">
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={(e) => {
          const formatted = parseAndFormatScore(e.target.value);
          setVal(formatted);
          onUpdateRecord(rec.student_id, field, formatted);
        }}
        placeholder="0-10"
        className="w-20 bg-[#161a29] border border-white/10 rounded-lg px-2.5 py-1 text-white font-extrabold text-xs focus:outline-none focus:border-indigo-500 text-center"
      />
      <div className={`text-[9px] ${badgeColor} font-bold text-center mt-0.5`} title={`Dự đoán điểm ${label}`}>
        {rec.prediction_model ? `${rec.prediction_model}: ` : 'Dự đoán: '}{predVal}
      </div>
    </div>
  );
});

export default function ClassesPage() {
  const confirm = useConfirm();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherCM[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const filteredClasses = useMemo(() => {
    if (!search.trim()) return classes;
    const q = search.trim().toLowerCase();
    return classes.filter(cls =>
      (cls.class_name || '').toLowerCase().includes(q) ||
      (cls.teacher_name || '').toLowerCase().includes(q) ||
      (cls.room || '').toLowerCase().includes(q) ||
      (cls.grade || '').toLowerCase().includes(q)
    );
  }, [classes, search]);

  // Selected class detail state
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'grades' | 'seating' | 'relationships'>('grades');

  // Blossom matching result modal state
  const [blossomModalOpen, setBlossomModalOpen] = useState(false);
  const [blossomPairs, setBlossomPairs] = useState<any[]>([]);
  const [blossomUnmatched, setBlossomUnmatched] = useState<any[]>([]);
  const [mixingGA, setMixingGA] = useState(false);

  // Enrolled students in selected class
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);

  // Attendance & Daily Grades state
  const [attendanceDate, setAttendanceDate] = useState(() => getLocalDateStr());
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Class create/edit modal & Multi-day schedule with per-day time & duration
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [classForm, setClassForm] = useState<Partial<ClassItem>>({
    class_name: '',
    teacher_id: undefined,
    grade: 'Lớp 6',
    subject: '',
    room: '',
    status: 'Đang hoạt động',
    notes: ''
  });
  const defaultClassDayConfigs = () => WEEKDAYS.reduce((acc, day) => {
    acc[day] = { checked: day === 'Thứ 2' || day === 'Thứ 4', time: '18:00', duration: 90 };
    return acc;
  }, {} as Record<string, { checked: boolean; time: string; duration: number }>);
  const [classDayConfigs, setClassDayConfigs] = useState(defaultClassDayConfigs());

  // Multi-Student Enroll Modal state
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [filterByClassGrade, setFilterByClassGrade] = useState(true);
  const [enrollSearch, setEnrollSearch] = useState('');
  const [selectedStudentIdsToEnroll, setSelectedStudentIdsToEnroll] = useState<number[]>([]);
  const [enrollingBatch, setEnrollingBatch] = useState(false);

  // Edit/Action Enrolled Student Modal
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedEnrolledStudent, setSelectedEnrolledStudent] = useState<EnrolledStudent | null>(null);

  // Seating layout state
  const [numCols, setNumCols] = useState(3);
  const [desksPerCol, setDesksPerCol] = useState(3);
  const [seatingGrid, setSeatingGrid] = useState<any[]>([]);

  // Drag and Drop State for Seating
  const [draggedSeat, setDraggedSeat] = useState<{ colIdx: number; deskIdx: number; posIdx: number } | null>(null);
  const [draggedUnassigned, setDraggedUnassigned] = useState<EnrolledStudent | null>(null);

  // Paper swap result modal
  const [gradingPairsModal, setGradingPairsModal] = useState(false);
  const [gradingPairs, setGradingPairs] = useState<any[]>([]);

  // Collapsible unassigned seating panel
  const [showUnassignedPanel, setShowUnassignedPanel] = useState(true);

  // Column filtering & pagination state for Attendance & Daily Scores table
  const [colFilterName, setColFilterName] = useState('');
  const [colFilterStatus, setColFilterStatus] = useState('ALL');
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);
  const [tablePage, setTablePage] = useState(1);
  const tablePageSize = 20;

  const loadClasses = async (silent?: boolean | any) => {
    const isSilent = silent === true;
    if (!isSilent) setLoading(true);
    try {
      const data = await api.getClasses(search);
      setClasses(data);
      const tch = await api.getTeachersCM();
      setTeachers(tch);
      const st = await api.getStudents();
      setAllStudents(st);
    } catch (err: any) {
      if (!isSilent) showToast("Không thể tải danh sách lớp học: " + err.message, "error");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleOpenEnrollModal = async () => {
    try {
      const st = await api.getStudents();
      setAllStudents(st);
      if (selectedClass) {
        const enrolled = await api.getClassStudents(selectedClass.id);
        setEnrolledStudents(enrolled);
      }
      setSelectedStudentIdsToEnroll([]);
      setEnrollSearch('');
      setEnrollModalOpen(true);
    } catch (err: any) {
      showToast("Không thể tải danh sách học sinh: " + err.message, "error");
    }
  };

  useEffect(() => {
    loadClasses();
    const handleDataChanged = () => {
      loadClasses(true);
      if (selectedClass) {
        loadClassDetailData(selectedClass);
      }
    };
    window.addEventListener('data-changed', handleDataChanged);
    return () => window.removeEventListener('data-changed', handleDataChanged);
  }, [search, selectedClass?.id]);

  useEffect(() => {
    const handleOpenClassEvent = (e: any) => {
      const classId = e.detail?.classId;
      if (classId) {
        const target = classes.find(c => c.id === classId);
        if (target) setSelectedClass(target);
      }
    };
    window.addEventListener('open-class-detail', handleOpenClassEvent);
    return () => {
      window.removeEventListener('open-class-detail', handleOpenClassEvent);
    };
  }, [classes]);

  const loadAttendanceData = async (clsId: number, dateStr: string) => {
    try {
      const data = await api.getClassAttendance(clsId, dateStr);
      setAttendanceRecords(data.records || []);
    } catch (err: any) {
      showToast("Không thể tải bảng điểm danh: " + err.message, "error");
    }
  };

  const loadClassDetailData = async (cls: ClassItem) => {
    try {
      const enrolled = await api.getClassStudents(cls.id);
      setEnrolledStudents(enrolled);
      loadAttendanceData(cls.id, attendanceDate);

      // Seating
      const seating = await api.getClassSeating(cls.id);
      if (seating && seating.layout_json && seating.layout_json !== '[]') {
        try {
          const parsed = JSON.parse(seating.layout_json);
          setSeatingGrid(parsed);
          setNumCols(parsed.length || 3);
          if (parsed.length > 0 && parsed[0].desks_in_col) {
            setDesksPerCol(parsed[0].desks_in_col);
          }
        } catch (e) {
          initEmptySeating(3, 3, enrolled);
        }
      } else {
        initEmptySeating(3, 3, enrolled);
      }
    } catch (err: any) {
      showToast("Lỗi khi tải chi tiết lớp học: " + err.message, "error");
    }
  };

  const [selectedClassWeeklyDays, setSelectedClassWeeklyDays] = useState<number[]>([]);

  useEffect(() => {
    if (selectedClass) {
      loadClassDetailData(selectedClass);
      api.getClassWeeklySchedule(selectedClass.id).then(slots => {
        if (slots && Array.isArray(slots)) {
          const dayMap: Record<string, number> = {
            'Chủ nhật': 0, 'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4, 'Thứ 6': 5, 'Thứ 7': 6
          };
          const days = slots.map((s: any) => dayMap[s.day_of_week]).filter((d: any) => d !== undefined);
          setSelectedClassWeeklyDays(days);
        } else {
          setSelectedClassWeeklyDays([]);
        }
      }).catch(() => setSelectedClassWeeklyDays([]));
    } else {
      setSelectedClassWeeklyDays([]);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && (activeSubTab === 'grades' || activeSubTab === 'seating')) {
      loadAttendanceData(selectedClass.id, attendanceDate);
    }
  }, [attendanceDate, activeSubTab, selectedClass?.id]);

  const applyAutoAttendanceStatus = useCallback((records: any[], targetDateStr: string) => {
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
      } else if (isPastDate && !hasScore && !hasNote) {
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
      setAttendanceRecords(finalRecords);
      await api.saveClassAttendance(selectedClass.id, attendanceDate, finalRecords);
      showToast("Đã lưu bảng điểm danh và điểm học sinh!", "success");
    } catch (err: any) {
      showToast("Lưu thất bại: " + err.message, "error");
    } finally {
      setSavingAttendance(false);
    }
  };

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

  const handleUpdateRecord = useCallback(async (studentId: number, field: string, value: any) => {
    let updatedRecords: any[] = [];
    setAttendanceRecords((prev) => {
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
      updatedRecords = newRecs;
      return newRecs;
    });

    if (selectedClass && updatedRecords.length > 0) {
      try {
        await api.saveClassAttendance(selectedClass.id, attendanceDate, updatedRecords);
      } catch (err: any) {
        console.error("Tự động lưu thất bại:", err);
      }
    }
  }, [selectedClass, attendanceDate]);

  const handleExportExcel = async () => {
    if (!selectedClass) return;
    try {
      const res = await api.exportClassExcel(selectedClass.id, attendanceDate, attendanceRecords);
      if (res && res.filename) {
        showToast(
          `Đã xuất file Excel: ${res.filename}`,
          'success',
          'MỞ FILE',
          () => {
            api.openLocalFile(res.filename);
          }
        );
      }
    } catch (err: any) {
      showToast("Xuất Excel thất bại: " + err.message, "error");
    }
  };

  const handleExportDocx = async () => {
    if (!selectedClass) return;
    try {
      const res = await api.exportClassDocx(selectedClass.id, attendanceDate, attendanceRecords);
      if (res && res.filename) {
        showToast(
          `Đã xuất file Word: ${res.filename}`,
          'success',
          'MỞ FILE',
          () => {
            api.openLocalFile(res.filename);
          }
        );
      }
    } catch (err: any) {
      showToast("Xuất Word thất bại: " + err.message, "error");
    }
  };

  const initEmptySeating = (cols: number, desks: number, studentsList: EnrolledStudent[]) => {
    const layout = [];
    for (let c = 0; c < cols; c++) {
      const colObj: any = { col_index: c, desks_in_col: desks, seats: [] };
      for (let d = 0; d < desks; d++) {
        colObj.seats.push(
          { desk: d, position: 0, student_id: null, student_name: null },
          { desk: d, position: 1, student_id: null, student_name: null }
        );
      }
      layout.push(colObj);
    }

    let stIdx = 0;
    for (let c = 0; c < cols; c++) {
      for (let d = 0; d < desks; d++) {
        for (let p = 0; p < 2; p++) {
          if (stIdx < studentsList.length) {
            const st = studentsList[stIdx];
            layout[c].seats[d * 2 + p] = {
              desk: d,
              position: p,
              student_id: st.id,
              student_name: st.full_name
            };
            stIdx++;
          }
        }
      }
    }
    setSeatingGrid(layout);
  };

  const handleOpenCreateClass = () => {
    setEditingClass(null);
    setClassForm({
      class_name: '',
      teacher_id: undefined,
      grade: 'Lớp 6',
      subject: 'Tiếng Anh',
      room: '',
      status: 'Đang hoạt động',
      notes: ''
    });
    setClassDayConfigs(defaultClassDayConfigs());
    setClassModalOpen(true);
  };

  const handleOpenEditClass = async (cls: ClassItem) => {
    setEditingClass(cls);
    setClassForm({ ...cls });
    try {
      const slots = await api.getClassWeeklySchedule(cls.id);
      const newCfgs = defaultClassDayConfigs();
      WEEKDAYS.forEach(d => { newCfgs[d].checked = false; });
      if (slots && slots.length > 0) {
        slots.forEach((s: any) => {
          if (newCfgs[s.day_of_week]) {
            newCfgs[s.day_of_week] = {
              checked: true,
              time: s.start_time || '18:00',
              duration: s.duration || 90
            };
          }
        });
      }
      setClassDayConfigs(newCfgs);
    } catch (err) {
      setClassDayConfigs(defaultClassDayConfigs());
    }
    setClassModalOpen(true);
  };

  const handleDeleteClass = async (cls: ClassItem) => {
    const ok = await confirm({
      title: "Xóa Lớp Học",
      message: `Bạn có chắc chắn muốn xóa lớp học ${cls.class_name}?`,
      confirmText: "Xóa lớp",
      type: "danger"
    });
    if (ok) {
      try {
        await api.deleteClass(cls.id);
        showToast("Đã xóa lớp học!", "success");
        if (selectedClass?.id === cls.id) setSelectedClass(null);
        loadClasses();
      } catch (err: any) {
        showToast("Không thể xóa: " + err.message, "error");
      }
    }
  };

  // Batch Multi-Student Enrollment Handler
  const handleBatchEnrollStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || selectedStudentIdsToEnroll.length === 0) return;
    setEnrollingBatch(true);
    try {
      await Promise.all(
        selectedStudentIdsToEnroll.map(stId => api.enrollStudent(selectedClass.id, stId))
      );
      showToast(`Đã ghi danh ${selectedStudentIdsToEnroll.length} học sinh vào lớp ${selectedClass.class_name}!`, "success");
      setEnrollModalOpen(false);
      setSelectedStudentIdsToEnroll([]);
      loadClassDetailData(selectedClass);
    } catch (err: any) {
      showToast("Ghi danh thất bại: " + err.message, "error");
    } finally {
      setEnrollingBatch(false);
    }
  };

  const handleUnenrollStudent = async (stId: number) => {
    if (!selectedClass) return;
    try {
      await api.unenrollStudent(selectedClass.id, stId);
      showToast("Đã xoá học sinh khỏi lớp!", "success");
      setActionModalOpen(false);
      loadClassDetailData(selectedClass);
    } catch (err: any) {
      showToast("Không thể bỏ ghi danh: " + err.message, "error");
    }
  };

  const handleAutoMixSeating = async () => {
    if (!selectedClass) return;
    try {
      const colsConfig = seatingGrid.map(col => ({
        col_index: col.col_index,
        desks_in_col: col.desks_in_col || desksPerCol
      }));
      const res = await api.mixClassSeating(selectedClass.id, numCols, desksPerCol, colsConfig, attendanceDate);
      if (res.layout) {
        setSeatingGrid(res.layout);
        showToast("Đã trộn ngẫu nhiên sơ đồ lớp!", "success");
      }
    } catch (err: any) {
      showToast("Trộn thất bại: " + err.message, "error");
    }
  };

  const handleGeneticMixSeating = async () => {
    if (!selectedClass) return;
    setMixingGA(true);
    try {
      const colsConfig = seatingGrid.map(col => ({
        col_index: col.col_index,
        desks_in_col: col.desks_in_col || desksPerCol
      }));
      const res = await api.geneticMixSeating(selectedClass.id, {
        num_cols: numCols,
        desks_per_col: desksPerCol,
        cols_config: colsConfig,
        date: attendanceDate
      });
      if (res.layout) {
        setSeatingGrid(res.layout);
        showToast(`Đã tối ưu sơ đồ lớp bằng Genetic Algorithm!`, "success");
      }
    } catch (err: any) {
      showToast("Trộn thông minh thất bại: " + err.message, "error");
    } finally {
      setMixingGA(false);
    }
  };

  const handleBlossomSwap = async () => {
    if (!selectedClass) return;
    try {
      const res = await api.blossomSwapPairs(selectedClass.id, { date: attendanceDate });
      setBlossomPairs(res.pairs || []);
      setBlossomUnmatched(res.unmatched || []);
      setBlossomModalOpen(true);
    } catch (err: any) {
      showToast("Ghép cặp Blossom thất bại: " + err.message, "error");
    }
  };

  const handleAddColumn = () => {
    const newGrid = JSON.parse(JSON.stringify(seatingGrid));
    const newColIdx = newGrid.length;
    const colDesks = desksPerCol || 3;
    const seats = [];
    for (let d = 0; d < colDesks; d++) {
      seats.push(
        { desk: d, position: 0, student_id: null, student_name: null },
        { desk: d, position: 1, student_id: null, student_name: null }
      );
    }
    newGrid.push({
      col_index: newColIdx,
      desks_in_col: colDesks,
      seats
    });
    setSeatingGrid(newGrid);
    setNumCols(newGrid.length);
  };

  const handleRemoveColumn = () => {
    if (seatingGrid.length <= 1) return;
    const newGrid = JSON.parse(JSON.stringify(seatingGrid));
    newGrid.pop();
    setSeatingGrid(newGrid);
    setNumCols(newGrid.length);
  };

  const handleAddDeskToCol = (colIdx: number) => {
    const newGrid = JSON.parse(JSON.stringify(seatingGrid));
    const col = newGrid[colIdx];
    if (!col) return;
    const newDeskIdx = col.desks_in_col || 0;
    col.desks_in_col = newDeskIdx + 1;
    col.seats.push(
      { desk: newDeskIdx, position: 0, student_id: null, student_name: null },
      { desk: newDeskIdx, position: 1, student_id: null, student_name: null }
    );
    setSeatingGrid(newGrid);
  };

  const handleRemoveDeskFromCol = (colIdx: number) => {
    const newGrid = JSON.parse(JSON.stringify(seatingGrid));
    const col = newGrid[colIdx];
    if (!col || (col.desks_in_col || 1) <= 1) return;
    col.desks_in_col -= 1;
    col.seats.pop();
    col.seats.pop();
    setSeatingGrid(newGrid);
  };

  const handleSaveSeating = async () => {
    if (!selectedClass) return;
    try {
      await api.saveClassSeating(selectedClass.id, desksPerCol, JSON.stringify(seatingGrid));
      showToast("Đã lưu sơ đồ lớp học thành công!", "success");
    } catch (err: any) {
      showToast("Không thể lưu sơ đồ: " + err.message, "error");
    }
  };

  const handleClearSeat = (colIdx: number, deskIdx: number, posIdx: number) => {
    const newGrid = JSON.parse(JSON.stringify(seatingGrid));
    const seatIndex = deskIdx * 2 + posIdx;
    const seat = newGrid[colIdx]?.seats[seatIndex];
    if (seat) {
      seat.student_id = null;
      seat.student_name = null;
      setSeatingGrid(newGrid);
    }
  };

  const handleDropOnSeat = (targetColIdx: number, targetDeskIdx: number, targetPosIdx: number) => {
    const newGrid = JSON.parse(JSON.stringify(seatingGrid));
    const targetSeatIndex = targetDeskIdx * 2 + targetPosIdx;
    const targetSeat = newGrid[targetColIdx].seats[targetSeatIndex];

    if (draggedUnassigned) {
      targetSeat.student_id = draggedUnassigned.id;
      targetSeat.student_name = draggedUnassigned.full_name;
      setSeatingGrid(newGrid);
      setDraggedUnassigned(null);
      return;
    }

    if (draggedSeat) {
      const sourceSeatIndex = draggedSeat.deskIdx * 2 + draggedSeat.posIdx;
      const sourceSeat = newGrid[draggedSeat.colIdx].seats[sourceSeatIndex];

      const tempId = targetSeat.student_id;
      const tempName = targetSeat.student_name;

      targetSeat.student_id = sourceSeat.student_id;
      targetSeat.student_name = sourceSeat.student_name;

      sourceSeat.student_id = tempId;
      sourceSeat.student_name = tempName;

      setSeatingGrid(newGrid);
      setDraggedSeat(null);
    }
  };

  // Filter candidate students for enrollment
  const enrolledStudentIds = new Set(enrolledStudents.map(s => s.id));
  const availableStudentsForEnrollment = allStudents.filter(s => {
    if (enrolledStudentIds.has(s.id)) return false;
    if (filterByClassGrade && selectedClass?.grade) {
      if (s.grade !== selectedClass.grade) return false;
    }
    if (enrollSearch.trim()) {
      const q = enrollSearch.toLowerCase().trim();
      const matchName = s.full_name?.toLowerCase().includes(q);
      const matchSchool = s.school?.toLowerCase().includes(q);
      const matchGrade = s.grade?.toLowerCase().includes(q);
      if (!matchName && !matchSchool && !matchGrade) return false;
    }
    return true;
  });

  const allCandidateIds = availableStudentsForEnrollment.map(s => s.id);
  const isAllSelected = allCandidateIds.length > 0 && allCandidateIds.every(id => selectedStudentIdsToEnroll.includes(id));

  const toggleSelectAllCandidate = () => {
    if (isAllSelected) {
      setSelectedStudentIdsToEnroll([]);
    } else {
      setSelectedStudentIdsToEnroll(allCandidateIds);
    }
  };

  const toggleSelectStudentToEnroll = (stId: number) => {
    if (selectedStudentIdsToEnroll.includes(stId)) {
      setSelectedStudentIdsToEnroll(selectedStudentIdsToEnroll.filter(id => id !== stId));
    } else {
      setSelectedStudentIdsToEnroll([...selectedStudentIdsToEnroll, stId]);
    }
  };

  const attendanceColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'stt',
      header: 'STT',
      enableSorting: false,
      cell: ({ row }) => <span className="font-bold text-slate-400">{row.index + 1}</span>,
    },
    {
      accessorKey: 'student_name',
      header: 'Họ và Tên Học Sinh',
      cell: ({ row }) => (
        <span className="font-extrabold text-white text-base block truncate">
          {row.original.student_name}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Điểm Danh',
      cell: ({ row }) => {
        const rec = row.original;
        const isAbsent = rec.status === 'Vắng mặt';
        return (
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                const newStatus = isAbsent ? 'Có mặt' : 'Vắng mặt';
                handleUpdateRecord(rec.student_id, 'status', newStatus);
              }}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer border flex items-center justify-center gap-1.5 ${
                isAbsent
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 hover:bg-rose-500/30'
                  : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isAbsent ? 'bg-rose-400' : 'bg-emerald-400'}`} />
              <span>{rec.status || 'Có mặt'}</span>
            </button>
          </div>
        );
      },
    },
    {
      accessorKey: 'check_1',
      header: 'Check 1',
      cell: ({ row }) => (
        <CheckScoreInput
          rec={row.original}
          field="check_1"
          onUpdateRecord={handleUpdateRecord}
          parseAndFormatScore={parseAndFormatScore}
        />
      ),
    },
    {
      accessorKey: 'check_2',
      header: 'Check 2',
      cell: ({ row }) => (
        <CheckScoreInput
          rec={row.original}
          field="check_2"
          onUpdateRecord={handleUpdateRecord}
          parseAndFormatScore={parseAndFormatScore}
        />
      ),
    },
    {
      accessorKey: 'homework',
      header: 'Homework',
      cell: ({ row }) => (
        <CheckScoreInput
          rec={row.original}
          field="homework"
          onUpdateRecord={handleUpdateRecord}
          parseAndFormatScore={parseAndFormatScore}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Thao Tác',
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const rec = row.original;
        const enrolledInfo = enrolledStudents.find((s) => s.id === rec.student_id);
        return (
          <div className="flex items-center justify-center">
            <button
              onClick={() => {
                setSelectedEnrolledStudent(enrolledInfo || { id: rec.student_id, full_name: rec.student_name });
                setActionModalOpen(true);
              }}
              className="p-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition cursor-pointer"
              title="Tùy chọn học sinh"
            >
              <Edit3 size={14} />
            </button>
          </div>
        );
      },
    },
  ], [enrolledStudents, handleUpdateRecord, parseAndFormatScore]);

  // Absent students lookup for seating chart
  const absentStudentIds = useMemo(() => {
    const set = new Set<number>();
    attendanceRecords.forEach((r: any) => {
      if (r.status === 'Vắng mặt') {
        set.add(r.student_id);
      }
    });
    return set;
  }, [attendanceRecords]);

  // Seating grid calculations
  const assignedStudentIdsInSeating = new Set<number>();
  seatingGrid.forEach(col => {
    if (col.seats) {
      col.seats.forEach((seat: any) => {
        if (seat.student_id) assignedStudentIdsInSeating.add(seat.student_id);
      });
    }
  });
  const unassignedStudents = enrolledStudents.filter(st => !assignedStudentIdsInSeating.has(st.id));

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto">
      {/* HEADER SECTION */}
      {!selectedClass ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                <BookOpen className="h-7 w-7 text-indigo-400" />
                Quản Lý Lớp Học & Sơ Đồ Chỗ Ngồi
              </h1>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Tạo lớp, điểm danh, xếp sơ đồ chỗ ngồi thông minh và phân công đổi bài tự động.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadClasses}
                className="p-2.5 rounded-xl bg-[#121626] hover:bg-[#1e2640] text-slate-300 hover:text-white border border-[#202842] transition cursor-pointer shadow-sm"
                title="Làm mới danh sách lớp"
              >
                <RefreshCw size={14} className={loading ? "animate-spin text-indigo-400" : ""} />
              </button>

              <button
                onClick={handleOpenCreateClass}
                className="group flex items-center gap-0 hover:gap-2 bg-[#5c36f5] hover:bg-[#7351f7] text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-[0_4px_16px_rgba(92,54,245,0.4)] transition-all duration-300 cursor-pointer border border-white/20 active:scale-95"
                title="Tạo Lớp Học Mới"
              >
                <Plus size={16} className="shrink-0" />
                <span className="max-w-0 opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">
                  Tạo Lớp Học Mới
                </span>
              </button>
            </div>
          </div>

          {/* SEARCH & FILTER */}
          <div className="flex items-center justify-between bg-[#0f131f] border border-white/10 p-3.5 rounded-2xl">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm lớp học theo tên lớp, giáo viên, phòng..."
                className="w-full bg-[#161a29] border border-white/10 text-white text-xs rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 font-medium"
              />
            </div>
          </div>

          {/* CLASS GRID LIST */}
          <div className="flex-1 min-h-[360px]">
            {loading && classes.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-400 gap-3 py-20">
                <RefreshCw className="h-7 w-7 text-indigo-400 animate-spin" />
                <span className="text-xs font-bold">Đang tải danh sách lớp...</span>
              </div>
            ) : classes.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-400 gap-3 py-20 text-center">
                <AlertCircle className="h-10 w-10 text-indigo-400/60" />
                <p className="text-sm font-black text-white">Chưa có lớp học nào được tạo</p>
                <p className="text-xs text-slate-500">Bấm "Tạo Lớp Học Mới" để bắt đầu quản lý.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredClasses.map((cls, idx) => {
                  const cardColor = getClassColor(cls, idx);
                  const borderColor = hexToRGBA(cardColor, 0.35);
                  const glowShadow = `0 0 24px ${hexToRGBA(cardColor, 0.22)}`;
                  const hoverGlowShadow = `0 0 38px ${hexToRGBA(cardColor, 0.4)}`;

                  return (
                    <div
                      key={cls.id}
                      onClick={() => setSelectedClass(cls)}
                      style={{
                        borderColor: borderColor,
                        boxShadow: glowShadow
                      }}
                      className="bg-[#0a0d1a] border rounded-[28px] p-6 space-y-5 cursor-pointer transition-all duration-300 group relative overflow-hidden hover:-translate-y-1 hover:brightness-110"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = hoverGlowShadow;
                        e.currentTarget.style.borderColor = hexToRGBA(cardColor, 0.6);
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = glowShadow;
                        e.currentTarget.style.borderColor = borderColor;
                      }}
                    >
                      {/* Top Header: Grade Pill + Circular Edit Pencil Button */}
                      <div className="flex items-center justify-between">
                        <span
                          style={{
                            backgroundColor: cardColor,
                            boxShadow: `0 4px 14px ${hexToRGBA(cardColor, 0.45)}`
                          }}
                          className="text-xs font-black uppercase px-4 py-1.5 rounded-full tracking-wider text-white shadow-md"
                        >
                          {cls.grade || 'LỚP 8'}
                        </span>

                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenEditClass(cls); }}
                          style={{
                            borderColor: hexToRGBA(cardColor, 0.35),
                            backgroundColor: hexToRGBA(cardColor, 0.12),
                            color: cardColor
                          }}
                          className="w-11 h-11 rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-95 hover:brightness-125"
                          title="Chỉnh sửa hoặc xóa lớp"
                        >
                          <Pencil size={18} />
                        </button>
                      </div>

                      {/* Class Title */}
                      <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-slate-100 transition-colors">
                        {cls.class_name}
                      </h3>

                      {/* 3 Detail Info Rows */}
                      <div className="space-y-2.5">
                        {/* Teacher */}
                        <div className="flex items-center gap-3 bg-[#0e1325] border border-white/5 p-3 rounded-2xl">
                          <div
                            style={{
                              backgroundColor: hexToRGBA(cardColor, 0.15),
                              color: cardColor
                            }}
                            className="p-2.5 rounded-xl flex items-center justify-center shrink-0"
                          >
                            <User size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-medium text-slate-400 block leading-tight">Giáo viên</span>
                            <span className="text-sm font-bold text-white block truncate">{cls.teacher_name || 'Chưa phân công'}</span>
                          </div>
                        </div>

                        {/* Room */}
                        <div className="flex items-center gap-3 bg-[#0e1325] border border-white/5 p-3 rounded-2xl">
                          <div
                            style={{
                              backgroundColor: hexToRGBA(cardColor, 0.15),
                              color: cardColor
                            }}
                            className="p-2.5 rounded-xl flex items-center justify-center shrink-0"
                          >
                            <MapPin size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-medium text-slate-400 block leading-tight">Phòng</span>
                            <span className="text-sm font-bold text-white block truncate">{cls.room || 'Chưa xếp'}</span>
                          </div>
                        </div>

                        {/* Students */}
                        <div className="flex items-center gap-3 bg-[#0e1325] border border-white/5 p-3 rounded-2xl">
                          <div
                            style={{
                              backgroundColor: hexToRGBA(cardColor, 0.15),
                              color: cardColor
                            }}
                            className="p-2.5 rounded-xl flex items-center justify-center shrink-0"
                          >
                            <Users size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-medium text-slate-400 block leading-tight">Học sinh</span>
                            <span className="text-sm font-bold text-white block">{cls.student_count || 0} học sinh</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button: Vào lớp (NO ARROW) */}
                      <div className="pt-1">
                        <button
                          onClick={() => setSelectedClass(cls)}
                          style={{
                            backgroundColor: cardColor,
                            boxShadow: `0 4px 20px ${hexToRGBA(cardColor, 0.4)}`
                          }}
                          className="w-full py-3.5 px-6 rounded-2xl font-bold text-base text-white shadow-lg transition-all duration-300 cursor-pointer text-center active:scale-98 hover:brightness-110 flex items-center justify-center"
                        >
                          Vào lớp
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* CLASS DETAIL VIEW */
        <div className="space-y-6">
          {/* HEADER BACK NAVIGATION */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0f1320] border border-white/10 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedClass(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer border border-white/5"
                title="Quay lại danh sách lớp"
              >
                <ChevronLeft size={16} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white">{selectedClass.class_name}</h2>
                  <span className="px-2 py-0.5 text-[10px] font-black bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-500/30">
                    {selectedClass.grade || 'Lớp 6'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">GV: {selectedClass.teacher_name || 'Chưa phân công'} | Phòng: {selectedClass.room || 'N/A'}</p>
              </div>
            </div>

            {/* SUB TAB SELECTOR WITH SMOOTH SLIDING PILL ANIMATION */}
            <div className="relative flex bg-[#0d1018] border border-white/10 p-1 rounded-xl text-xs font-bold select-none min-w-[460px]">
              <div
                className="absolute top-1 bottom-1 rounded-lg bg-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.5)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
                style={{
                  left: activeSubTab === 'grades'
                    ? '4px'
                    : activeSubTab === 'seating'
                    ? 'calc(33.333% + 1px)'
                    : 'calc(66.666% + 1px)',
                  width: 'calc(33.333% - 4px)',
                }}
              />
              <button
                onClick={() => setActiveSubTab('grades')}
                className={`flex-1 relative z-10 py-1.5 px-3 text-center transition-colors cursor-pointer ${
                  activeSubTab === 'grades' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Điểm Danh & Điểm ({enrolledStudents.length})
              </button>
              <button
                onClick={() => setActiveSubTab('seating')}
                className={`flex-1 relative z-10 py-1.5 px-3 text-center transition-colors cursor-pointer ${
                  activeSubTab === 'seating' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sơ Đồ Lớp
              </button>
              <button
                onClick={() => setActiveSubTab('relationships')}
                className={`flex-1 relative z-10 py-1.5 px-3 text-center transition-colors cursor-pointer whitespace-nowrap ${
                  activeSubTab === 'relationships' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Nhóm Bạn & Xung Đột</span>
              </button>
            </div>
          </div>

          {/* SUB TAB 3: RELATIONSHIPS & FRIEND GROUPS */}
          {activeSubTab === 'relationships' && selectedClass && (
            <RelationshipsTab
              classId={selectedClass.id}
              enrolledStudents={enrolledStudents}
              onRefreshClass={() => loadClassDetailData(selectedClass)}
            />
          )}

          {/* SUB TAB 1: ATTENDANCE & DAILY GRADES */}
          {activeSubTab === 'grades' && (
            <div className="space-y-4">
              {/* CLASS SUMMARY CARD */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-[#0d1018] border border-white/10 p-4 rounded-2xl">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-400 block tracking-wider">Giáo Viên & Phòng</span>
                  <span className="text-sm font-black text-white block">{selectedClass.teacher_name || 'Chưa phân công'}</span>
                  <span className="text-[11px] text-slate-400 block">Phòng: {selectedClass.room || 'Chưa xếp phòng'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-400 block tracking-wider">Khối & Môn Học</span>
                  <span className="text-sm font-black text-white block">{selectedClass.grade || 'Khác'}</span>
                  <span className="text-[11px] text-slate-400 block">Môn: {selectedClass.subject || 'N/A'}</span>
                </div>
                <div className="space-y-1 col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-400 block tracking-wider">Ghi Chú Lớp Học</span>
                    <span className="text-xs text-slate-300 block italic max-w-sm truncate">{selectedClass.notes || 'Không có ghi chú'}</span>
                  </div>
                  <button
                    onClick={() => handleOpenEditClass(selectedClass)}
                    className="group flex items-center gap-0 hover:gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-xl font-bold text-xs transition-all duration-300 cursor-pointer"
                    title="Sửa Thông Tin"
                  >
                    <Edit3 size={13} className="shrink-0" />
                    <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">Sửa Thông Tin</span>
                  </button>
                </div>
              </div>

              {/* ACTION TOOLBAR */}
              <div className="flex flex-wrap justify-between items-center bg-[#0d1018] border border-white/10 p-4 rounded-2xl gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Calendar size={15} className="text-indigo-400" />
                    <span>Ngày học:</span>
                  </span>
                  <CustomDatePicker
                    value={attendanceDate}
                    onChange={setAttendanceDate}
                    highlightDaysOfWeek={selectedClassWeeklyDays}
                    className="w-44"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenEnrollModal}
                    className="group flex items-center gap-0 hover:gap-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all duration-300 cursor-pointer"
                    title="Ghi Danh Học Sinh"
                  >
                    <UserPlus size={14} className="shrink-0" />
                    <span className="max-w-0 opacity-0 group-hover:max-w-[160px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">Ghi Danh Học Sinh</span>
                  </button>

                  <button
                    onClick={handleSaveAttendance}
                    disabled={savingAttendance}
                    className="group flex items-center gap-0 hover:gap-1.5 bg-[#5c36f5] hover:bg-[#7351f7] text-white px-3.5 py-1.5 rounded-xl font-extrabold text-xs shadow-[0_4px_12px_rgba(92,54,245,0.4)] transition-all duration-300 cursor-pointer border border-white/20"
                    title="Lưu Bảng Điểm"
                  >
                    <Save size={14} className="shrink-0" />
                    <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">{savingAttendance ? 'Đang lưu...' : 'Lưu Bảng Điểm'}</span>
                  </button>
                </div>
              </div>

              {/* UNIFIED ATTENDANCE & GRADES DATATABLE */}
              <DataTable
                tableId="classes-attendance-table"
                data={attendanceRecords}
                columns={attendanceColumns}
                pageSize={20}
                exportFilename={`diem_danh_${selectedClass?.class_name || ''}_${attendanceDate}`}
                onExportExcel={handleExportExcel}
                onExportDocx={handleExportDocx}
              />
            </div>
          )}

          {/* SUB TAB 2: SEATING LAYOUT BUILDER & DRAG-DROP */}
          {activeSubTab === 'seating' && (
            <div className="space-y-4">
              {/* TOOLBAR */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d1018] border border-white/10 p-3.5 rounded-2xl">
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-300">
                  <div className="flex items-center gap-1.5 bg-[#121624] border border-white/10 px-2.5 py-1 rounded-xl">
                    <span className="text-[11px]">Tổng Cột:</span>
                    <button onClick={handleRemoveColumn} className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 text-white font-extrabold flex items-center justify-center cursor-pointer" title="Xóa 1 cột">-</button>
                    <span className="font-extrabold text-indigo-400 px-1">{seatingGrid.length || numCols}</span>
                    <button onClick={handleAddColumn} className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 text-white font-extrabold flex items-center justify-center cursor-pointer" title="Thêm 1 cột">+</button>
                  </div>

                  <div className="flex items-center gap-2 bg-[#121624] border border-white/10 px-2.5 py-1 rounded-xl">
                    <Calendar size={13} className="text-indigo-400" />
                    <CustomDatePicker
                      value={attendanceDate}
                      onChange={setAttendanceDate}
                      highlightDaysOfWeek={selectedClassWeeklyDays}
                      className="w-36 text-xs"
                    />
                  </div>

                  {absentStudentIds.size > 0 && (
                    <span className="flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-xl text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                      <span>Vắng mặt: {absentStudentIds.size} học sinh</span>
                    </span>
                  )}

                  {!showUnassignedPanel && (
                    <button
                      onClick={() => setShowUnassignedPanel(true)}
                      className="flex items-center gap-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-3 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer"
                      title="Hiện danh sách học sinh chưa xếp chỗ"
                    >
                      <ChevronRight size={14} />
                      <span>Mở DSHS Chưa Xếp ({unassignedStudents.length})</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleAutoMixSeating}
                    className="group flex items-center gap-0 hover:gap-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all duration-300 cursor-pointer"
                    title="Trộn Ngẫu Nhiên"
                  >
                    <Shuffle size={14} className="shrink-0" />
                    <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">Trộn Ngẫu Nhiên</span>
                  </button>

                  <button
                    onClick={handleGeneticMixSeating}
                    disabled={mixingGA}
                    className="group flex items-center gap-0 hover:gap-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all duration-300 cursor-pointer disabled:opacity-50"
                    title="Trộn Thông Minh (AI/GA)"
                  >
                    <RefreshCw size={14} className={`shrink-0 ${mixingGA ? "animate-spin" : ""}`} />
                    <span className="max-w-0 opacity-0 group-hover:max-w-[160px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">{mixingGA ? "Đang chạy GA..." : "Trộn Thông Minh"}</span>
                  </button>

                  <button
                    onClick={handleBlossomSwap}
                    className="group flex items-center gap-0 hover:gap-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all duration-300 cursor-pointer"
                    title="Đổi Bàn (Blossom)"
                  >
                    <FileCheck2 size={14} className="shrink-0" />
                    <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">Đổi Bàn</span>
                  </button>

                  <button
                    onClick={handleSaveSeating}
                    className="group flex items-center gap-0 hover:gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl font-extrabold text-xs shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-all duration-300 cursor-pointer border border-white/10"
                    title="Lưu Sơ Đồ"
                  >
                    <Save size={14} className="shrink-0" />
                    <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">Lưu Sơ Đồ</span>
                  </button>
                </div>
              </div>

              {/* SEATING GRID & UNASSIGNED SIDEBAR */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 transition-all duration-300">
                {/* UNASSIGNED ROSTER SIDEBAR WITH COLLAPSE BUTTON */}
                {showUnassignedPanel && (
                  <div className="bg-[#0d1018] border border-white/10 p-4 rounded-2xl space-y-3 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase text-slate-300 flex items-center gap-2">
                        <span>Học Sinh Chưa Xếp Chỗ</span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px]">{unassignedStudents.length}</span>
                      </h4>
                      <button
                        onClick={() => setShowUnassignedPanel(false)}
                        className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                        title="Thu gọn khung này"
                      >
                        <ChevronLeft size={16} />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500">Kéo và thả học sinh vào vị trí bàn học bên phải.</p>

                    <div className="space-y-2 max-h-[calc(100vh-320px)] min-h-[240px] overflow-y-auto pr-1">
                      {unassignedStudents.map((st) => {
                        const isStAbsent = absentStudentIds.has(st.id);
                        return (
                          <div
                            key={st.id}
                            draggable
                            onDragStart={() => {
                              setDraggedUnassigned(st);
                              setDraggedSeat(null);
                            }}
                            className={`p-2.5 rounded-xl border cursor-grab active:cursor-grabbing text-xs font-extrabold flex items-center justify-between shadow-md transition ${
                              isStAbsent
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:border-rose-400'
                                : 'bg-[#14192b] border-white/10 text-white hover:border-indigo-500/60'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Move size={12} className="text-slate-500 shrink-0" />
                              <span className={`truncate ${isStAbsent ? 'line-through text-rose-200 opacity-80' : ''}`}>{st.full_name}</span>
                            </div>
                            {isStAbsent && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0 ml-1">
                                Vắng
                              </span>
                            )}
                          </div>
                        );
                      })}
                      {unassignedStudents.length === 0 && (
                        <div className="text-center py-8 text-[11px] text-slate-500 font-bold">
                          Đã xếp đủ tất cả học sinh!
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* GRAPHICAL SEATING GRID */}
                <div className={`${showUnassignedPanel ? 'md:col-span-3' : 'md:col-span-4'} bg-[#080a10] border border-white/10 rounded-2xl p-6 overflow-x-auto min-h-[420px] flex justify-center items-start gap-8 transition-all`}>
                  {seatingGrid.map((col, colIdx) => (
                    <div key={colIdx} className="flex flex-col items-center gap-4">
                      {/* PER-COLUMN DESK CONTROLS */}
                      <div className="flex items-center gap-2 bg-[#121624] border border-white/10 px-3 py-1 rounded-xl text-xs font-bold text-slate-300">
                        <span className="text-[10px] font-black uppercase text-indigo-400">Cột {colIdx + 1}</span>
                        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleRemoveDeskFromCol(colIdx)}
                            className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-rose-400 font-extrabold"
                            title="Xóa 1 bàn ở cột này"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="text-[10px] font-extrabold text-white px-1">{col.desks_in_col || desksPerCol} bàn</span>
                          <button
                            type="button"
                            onClick={() => handleAddDeskToCol(colIdx)}
                            className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-emerald-400 font-extrabold"
                            title="Thêm 1 bàn vào cột này"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      </div>

                      {Array.from({ length: col.desks_in_col || desksPerCol }).map((_, deskIdx) => {
                        const seatLeft = col.seats ? col.seats[deskIdx * 2] : null;
                        const seatRight = col.seats ? col.seats[deskIdx * 2 + 1] : null;
                        const isLeftAbsent = seatLeft?.student_id ? absentStudentIds.has(seatLeft.student_id) : false;
                        const isRightAbsent = seatRight?.student_id ? absentStudentIds.has(seatRight.student_id) : false;

                        return (
                          <div key={deskIdx} className="bg-[#121626] border border-white/10 p-3 rounded-2xl shadow-md w-60 flex flex-col gap-2">
                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider text-center border-b border-white/5 pb-1">
                              Bàn {deskIdx + 1}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              {/* LEFT SEAT */}
                              <div
                                draggable={Boolean(seatLeft?.student_name)}
                                onDragStart={() => {
                                  setDraggedSeat({ colIdx, deskIdx, posIdx: 0 });
                                  setDraggedUnassigned(null);
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleDropOnSeat(colIdx, deskIdx, 0)}
                                className={`group/seat relative p-2 rounded-xl border flex flex-col items-center justify-center min-h-[56px] text-center transition cursor-pointer ${seatLeft?.student_name
                                    ? isLeftAbsent
                                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-200 cursor-grab active:cursor-grabbing hover:border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                                      : 'bg-indigo-500/10 border-indigo-500/30 text-white cursor-grab active:cursor-grabbing hover:border-indigo-400'
                                    : 'bg-white/[0.02] border-dashed border-white/10 text-slate-600 hover:border-white/20'
                                  }`}
                              >
                                {seatLeft?.student_name ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleClearSeat(colIdx, deskIdx, 0);
                                      }}
                                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-black flex items-center justify-center opacity-0 group-hover/seat:opacity-100 transition shadow cursor-pointer z-10"
                                      title="Bỏ xếp chỗ"
                                    >
                                      ×
                                    </button>
                                    <span className={`text-xs font-extrabold truncate w-full ${isLeftAbsent ? 'line-through text-rose-200 opacity-90' : ''}`}>
                                      {seatLeft.student_name}
                                    </span>
                                    {isLeftAbsent && (
                                      <span className="mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/30 text-rose-300 border border-rose-500/50">
                                        Vắng mặt
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-[10px] text-slate-500">Thả vào đây</span>
                                )}
                              </div>

                              {/* RIGHT SEAT */}
                              <div
                                draggable={Boolean(seatRight?.student_name)}
                                onDragStart={() => {
                                  setDraggedSeat({ colIdx, deskIdx, posIdx: 1 });
                                  setDraggedUnassigned(null);
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleDropOnSeat(colIdx, deskIdx, 1)}
                                className={`group/seat relative p-2 rounded-xl border flex flex-col items-center justify-center min-h-[56px] text-center transition cursor-pointer ${seatRight?.student_name
                                    ? isRightAbsent
                                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-200 cursor-grab active:cursor-grabbing hover:border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                                      : 'bg-indigo-500/10 border-indigo-500/30 text-white cursor-grab active:cursor-grabbing hover:border-indigo-400'
                                    : 'bg-white/[0.02] border-dashed border-white/10 text-slate-600 hover:border-white/20'
                                  }`}
                              >
                                {seatRight?.student_name ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleClearSeat(colIdx, deskIdx, 1);
                                      }}
                                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-black flex items-center justify-center opacity-0 group-hover/seat:opacity-100 transition shadow cursor-pointer z-10"
                                      title="Bỏ xếp chỗ"
                                    >
                                      ×
                                    </button>
                                    <span className={`text-xs font-extrabold truncate w-full ${isRightAbsent ? 'line-through text-rose-200 opacity-90' : ''}`}>
                                      {seatRight.student_name}
                                    </span>
                                    {isRightAbsent && (
                                      <span className="mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/30 text-rose-300 border border-rose-500/50">
                                        Vắng mặt
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-[10px] text-slate-500">Thả vào đây</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT CLASS MODAL */}
      {classModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-mac-dropdown">
          <div className="bg-[#0f1320] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#14192b]">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-400" />
                <span>{editingClass ? 'Cập Nhật Lớp Học' : 'Tạo Lớp Học Mới'}</span>
              </h3>
              <button onClick={() => setClassModalOpen(false)} className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!classForm.class_name?.trim()) {
                showToast("Tên lớp học không được để trống!", "error");
                return;
              }
              try {
                let cid = editingClass?.id;
                if (editingClass) {
                  await api.updateClass(editingClass.id, classForm);
                } else {
                  const res = await api.createClass(classForm);
                  cid = res.id;
                }

                // Sync weekly slots from per-weekday classDayConfigs
                if (cid) {
                  const slotsPayload = WEEKDAYS.filter(d => classDayConfigs[d]?.checked).map(day => ({
                    day_of_week: day,
                    start_time: classDayConfigs[day].time,
                    duration: classDayConfigs[day].duration,
                    notes: classForm.room || ""
                  }));
                  await api.replaceClassWeeklySlots(cid, slotsPayload);
                }

                if (editingClass) {
                  showToast("Đã cập nhật lớp học và lịch học!", "success");
                } else {
                  showToast("Đã tạo lớp học mới và đồng bộ lịch học!", "success");
                }
                setClassModalOpen(false);
                loadClasses(true);
                window.dispatchEvent(new CustomEvent('data-changed'));
              } catch (err: any) {
                showToast("Lỗi khi lưu: " + err.message, "error");
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">Tên Lớp Học *</label>
                <input
                  type="text"
                  required
                  value={classForm.class_name || ''}
                  onChange={(e) => setClassForm({ ...classForm, class_name: e.target.value })}
                  placeholder="Ví dụ: Tiếng Anh Lớp 8A1"
                  className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">Khối Lớp</label>
                  <CustomSelect
                    value={classForm.grade || 'Lớp 6'}
                    onChange={(val) => setClassForm({ ...classForm, grade: val })}
                    options={GRADE_LIST.map(g => ({ value: g, label: g }))}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">Giáo Viên Phụ Trách</label>
                  <CustomSelect
                    value={classForm.teacher_id || ''}
                    onChange={(val) => setClassForm({ ...classForm, teacher_id: val ? Number(val) : undefined })}
                    options={[
                      { value: '', label: '-- Chưa phân công --' },
                      ...teachers.map(t => ({ value: t.id, label: t.full_name }))
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">Môn Học</label>
                  <input
                    type="text"
                    value={classForm.subject || ''}
                    onChange={(e) => setClassForm({ ...classForm, subject: e.target.value })}
                    placeholder="Tiếng Anh"
                    className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">Phòng Học</label>
                  <input
                    type="text"
                    value={classForm.room || ''}
                    onChange={(e) => setClassForm({ ...classForm, room: e.target.value })}
                    placeholder="Phòng 201"
                    className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">Màu Sắc Lịch Trình</label>
                <div className="flex items-center gap-2 flex-wrap bg-[#141928] p-2.5 rounded-xl border border-white/10">
                  {['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1', '#fb7185'].map(hex => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setClassForm({ ...classForm, color: hex })}
                      className={`w-6 h-6 rounded-full border-2 transition cursor-pointer ${
                        (classForm.color || '#7c3aed') === hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>

              {/* MULTI-DAY SCHEDULE SELECTOR (PER-WEEKDAY TIME & DURATION) */}
              <div className="space-y-2 border-t border-white/10 pt-3">
                <label className="block text-[11px] font-extrabold text-indigo-400 uppercase tracking-wider mb-2">
                  Lịch Học Theo Thứ (Cấu hình giờ & thời lượng riêng từng thứ)
                </label>
                <div className="space-y-2 bg-[#141928] p-3 rounded-xl border border-white/10">
                  {WEEKDAYS.map(day => {
                    const cfg = classDayConfigs[day] || { checked: false, time: '18:00', duration: 90 };
                    return (
                      <div key={day} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setClassDayConfigs(p => ({ ...p, [day]: { ...p[day], checked: !p[day]?.checked } }))}
                          className={`shrink-0 h-5 w-5 rounded-lg border-2 flex items-center justify-center text-[9px] font-black transition cursor-pointer ${cfg.checked ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-transparent border-white/20 text-transparent'}`}
                        >
                          ✓
                        </button>
                        <span className={`text-xs font-bold w-16 shrink-0 ${cfg.checked ? 'text-white' : 'text-slate-500'}`}>{day}</span>
                        <input
                          type="time"
                          value={cfg.time}
                          disabled={!cfg.checked}
                          onChange={e => setClassDayConfigs(p => ({ ...p, [day]: { ...p[day], time: e.target.value } }))}
                          className={`flex-1 bg-[#0d1018] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 ${!cfg.checked ? 'opacity-30' : ''}`}
                        />
                        <input
                          type="number"
                          value={cfg.duration}
                          min={30}
                          max={240}
                          step={15}
                          disabled={!cfg.checked}
                          onChange={e => setClassDayConfigs(p => ({ ...p, [day]: { ...p[day], duration: parseInt(e.target.value) || 90 } }))}
                          className={`w-14 bg-[#0d1018] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 ${!cfg.checked ? 'opacity-30' : ''}`}
                        />
                        <span className={`text-[10px] text-slate-500 shrink-0 ${!cfg.checked ? 'opacity-30' : ''}`}>phút</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                {editingClass ? (
                  <button
                    type="button"
                    onClick={() => { setClassModalOpen(false); handleDeleteClass(editingClass); }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-bold border border-rose-500/30 transition cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Xóa Lớp Học</span>
                  </button>
                ) : <div />}
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setClassModalOpen(false)} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold cursor-pointer">Hủy</button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] text-white text-xs font-extrabold border border-white/20 cursor-pointer shadow-[0_4px_12px_rgba(92,54,245,0.4)]">Lưu Lớp Học</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MULTI-STUDENT BATCH ENROLLMENT MODAL */}
      {enrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-mac-dropdown">
          <div className="bg-[#0f1320] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#14192b]">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-400" />
                <span>Ghi Danh Học Sinh Vào Lớp: {selectedClass?.class_name}</span>
              </h3>
              <button onClick={() => setEnrollModalOpen(false)} className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleBatchEnrollStudents} className="p-5 flex flex-col space-y-4 overflow-hidden flex-1">
              {/* TOP CONTROLS: SEARCH & GRADE FILTER */}
              <div className="space-y-3 bg-[#141928] p-3.5 rounded-xl border border-white/5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Lọc học sinh thuộc khối {selectedClass?.grade}:</span>
                  <button
                    type="button"
                    onClick={() => setFilterByClassGrade(!filterByClassGrade)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-black border transition ${filterByClassGrade ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300' : 'bg-slate-700 text-slate-400'
                      }`}
                  >
                    {filterByClassGrade ? 'BẬT (Khối ' + selectedClass?.grade + ')' : 'TẮT (Hiện Tất Cả)'}
                  </button>
                </div>

                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={enrollSearch}
                    onChange={(e) => setEnrollSearch(e.target.value)}
                    placeholder="Tìm theo tên học sinh, trường học..."
                    className="w-full bg-[#0d1018] border border-white/10 text-white text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              {/* SELECTION BAR & COUNTER */}
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={toggleSelectAllCandidate}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                >
                  {isAllSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  <span>{isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả danh sách'}</span>
                </button>

                <span className="text-xs font-extrabold text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                  Đã chọn: <span className="text-indigo-400">{selectedStudentIdsToEnroll.length}</span> / {availableStudentsForEnrollment.length} học sinh
                </span>
              </div>

              {/* STUDENT CHECKBOX LIST */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[220px] max-h-[360px]">
                {availableStudentsForEnrollment.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 font-bold bg-[#121624] rounded-xl border border-white/5">
                    Không tìm thấy học sinh phù hợp chưa ghi danh.
                  </div>
                ) : (
                  availableStudentsForEnrollment.map(s => {
                    const isChecked = selectedStudentIdsToEnroll.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleSelectStudentToEnroll(s.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition ${isChecked
                            ? 'bg-indigo-500/15 border-indigo-500/40 text-white shadow-sm'
                            : 'bg-[#121624] border-white/5 text-slate-300 hover:bg-white/[0.04]'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${isChecked ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-white/20 bg-white/5'
                            }`}>
                            {isChecked && <span className="text-xs font-black">✓</span>}
                          </div>
                          <div>
                            <span className="font-extrabold text-sm text-white block">{s.full_name}</span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {s.grade || 'Lớp 6'} | {s.school || 'Chưa xếp trường'} | {s.gender || 'Nam'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ACTION FOOTER */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEnrollModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-bold hover:bg-white/10 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={selectedStudentIdsToEnroll.length === 0 || enrollingBatch}
                  className="px-5 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] disabled:opacity-50 text-white text-xs font-extrabold border border-white/20 shadow-md transition"
                >
                  {enrollingBatch ? 'Đang ghi danh...' : `Thêm (${selectedStudentIdsToEnroll.length}) học sinh vào lớp`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENROLLED STUDENT ACTION MODAL */}
      {actionModalOpen && selectedEnrolledStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-mac-dropdown">
          <div className="bg-[#0f1320] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#14192b]">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-indigo-400" />
                <span>Học Sinh: {selectedEnrolledStudent.full_name}</span>
              </h3>
              <button onClick={() => setActionModalOpen(false)} className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-300 font-semibold">
                Quản lý trạng thái tham gia lớp học của học sinh trong lớp <span className="text-indigo-400 font-black">{selectedClass?.class_name}</span>.
              </p>

              <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleUnenrollStudent(selectedEnrolledStudent.id)}
                  className="w-full py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Rút Học Sinh Khỏi Lớp Này</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActionModalOpen(false)}
                  className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-bold transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAPER SWAP MODAL */}
      {gradingPairsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-mac-dropdown">
          <div className="bg-[#0f1320] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#14192b]">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-indigo-400" />
                <span>Danh Sách Phân Công Chấm Bài Đổi Đề</span>
              </h3>
              <button onClick={() => setGradingPairsModal(false)} className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              <p className="text-xs text-slate-400 font-medium">Thuật toán ghép cặp 1-đối-1 (Cả 2 học sinh đổi bài cho nhau) sao cho tối ưu điểm số và tránh trùng Nhóm / Bàn:</p>
              <div className="space-y-2">
                {gradingPairs.map((p, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${p.same_group_conflict ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-[#14192b] border-white/10 text-white'
                    }`}>
                    <span>{p.student1_name || p.grader_name}</span>
                    <span className="text-indigo-400 font-black text-xs">↔ Đổi bài với ↔</span>
                    <span>{p.student2_name || p.owner_name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-white/10 flex justify-end">
              <button onClick={() => setGradingPairsModal(false)} className="px-5 py-2 bg-[#5c36f5] text-white text-xs font-bold rounded-xl">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* BLOSSOM MATCHING MODAL */}
      <BlossomResultModal
        isOpen={blossomModalOpen}
        onClose={() => setBlossomModalOpen(false)}
        pairs={blossomPairs}
        unmatched={blossomUnmatched}
      />
    </div>
  );
}
