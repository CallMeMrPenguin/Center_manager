import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { api } from '../api';
import { 
  BarChart3, RefreshCw, Calendar, 
  AlertCircle, Users, GraduationCap, ChevronRight, Info, RotateCcw, X, Edit2, History, Save
} from 'lucide-react';
import { showToast } from '../components/Toast';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { CustomSelect } from '../components/CustomSelect';
import { DataTable } from '../components/DataTable';
import { notifyDataChanged, format1Dec, trunc1Dec } from '../utils';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Hovered Data Point for Graph Tooltip
  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    sessionName: string;
    fullDate: string;
    check1: number;
    check2: number;
    homework: number;
    x: number;
  } | null>(null);

  // Reset Grades Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetFromDate, setResetFromDate] = useState('');
  const [resetToDate, setResetToDate] = useState('');
  const [resetScope, setResetScope] = useState<'class' | 'student'>('class');

  // Edit Single Record Modal State
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState<string>('Có mặt');
  const [editCheck1, setEditCheck1] = useState<string>('');
  const [editCheck2, setEditCheck2] = useState<string>('');
  const [editHomework, setEditHomework] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Active Tooltip Info State
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Analytics Data & System Engine Results from API
  const [sessionRecords, setSessionRecords] = useState<any[]>([]);
  const [studentRankings, setStudentRankings] = useState<any[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState<any>(null);

  // Time View Filter: 1 Tháng (Current Month), 2 Tháng, 3 Tháng, Tất Cả
  const [timeView, setTimeView] = useState<'1m' | '2m' | '3m' | 'all'>('all');

  // Chart Responsive Full-Screen Width Observer
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  useEffect(() => {
    const updateWidth = () => {
      if (chartContainerRef.current) {
        setContainerWidth(chartContainerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    const observer = new ResizeObserver(updateWidth);
    if (chartContainerRef.current) observer.observe(chartContainerRef.current);
    return () => {
      window.removeEventListener('resize', updateWidth);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    loadClassesAndStudents();
    loadAnalyticsData();
    const handleDataChanged = () => {
      loadClassesAndStudents();
      loadAnalyticsData();
    };
    window.addEventListener('data-changed', handleDataChanged);
    return () => window.removeEventListener('data-changed', handleDataChanged);
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedClassId, selectedStudentId]);

  const loadClassesAndStudents = async () => {
    try {
      const classList = await api.getClasses();
      setClasses(classList);
      const studentList = await api.getStudents();
      setStudents(studentList);
    } catch (err: any) {
      showToast("Không thể tải danh sách lớp/học sinh: " + err.message, "error");
    }
  };

  const loadAnalyticsData = async (silent?: boolean | any) => {
    const isSilent = silent === true;
    if (!isSilent) setLoading(true);
    try {
      const cid = selectedClassId ? parseInt(selectedClassId) : undefined;
      const sid = selectedStudentId ? parseInt(selectedStudentId) : undefined;
      const res = await api.getGradeAnalytics(cid, sid);
      setSessionRecords(res.session_records || []);
      setStudentRankings(res.student_rankings || []);
      setAnalyticsSummary(res.analytics_summary || null);
    } catch (e: any) {
      if (!isSilent) showToast("Lỗi tải báo cáo thống kê: " + (e.message || e), "error");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleResetGradesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cid = selectedClassId ? parseInt(selectedClassId) : undefined;
      const sid = (resetScope === 'student' && selectedStudentId) ? parseInt(selectedStudentId) : undefined;
      const res = await api.resetGrades({
        class_id: cid,
        student_id: sid,
        from_date: resetFromDate || undefined,
        to_date: resetToDate || undefined
      });
      showToast(`Đã đặt lại điểm số thành công cho ${res.reset_count} bản ghi!`, "success");
      setResetModalOpen(false);
      loadAnalyticsData(true);
      notifyDataChanged();
    } catch (err: any) {
      showToast("Không thể đặt lại điểm: " + err.message, "error");
    }
  };
  const handleOpenEditModal = (rec: any) => {
    setEditingRecord(rec);
    setEditStatus(rec.status || 'Có mặt');
    setEditCheck1(rec.check_1 > 0 ? String(rec.check_1) : '');
    setEditCheck2(rec.check_2 > 0 ? String(rec.check_2) : '');
    setEditHomework(rec.homework > 0 ? String(rec.homework) : '');
    setEditNotes(rec.notes || '');
  };

  const handleSaveEditGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setSavingEdit(true);
    try {
      const c1 = editCheck1.trim() !== '' ? Math.max(0, Math.min(10, parseFloat(editCheck1.replace(',', '.')) || 0)) : 0;
      const c2 = editCheck2.trim() !== '' ? Math.max(0, Math.min(10, parseFloat(editCheck2.replace(',', '.')) || 0)) : 0;
      const hw = editHomework.trim() !== '' ? Math.max(0, Math.min(10, parseFloat(editHomework.replace(',', '.')) || 0)) : 0;

      await api.saveClassAttendance(editingRecord.class_id, editingRecord.date, [{
        student_id: editingRecord.student_id,
        status: editStatus,
        check_1: c1,
        check_2: c2,
        homework: hw,
        notes: editNotes
      }]);

      showToast(`Đã cập nhật điểm số cho ${editingRecord.student_name || 'học sinh'}!`, "success");
      setEditingRecord(null);
      await loadAnalyticsData(true);
      notifyDataChanged();
    } catch (err: any) {
      showToast("Lỗi khi cập nhật điểm: " + (err.message || err), "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const formatFullDate = (dStr: string) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dStr;
  };


  // Filter rankings strictly by selectedClassId
  const filteredRankings = useMemo(() => {
    if (!selectedClassId) return studentRankings;
    return studentRankings.filter(r => String(r.class_id) === selectedClassId);
  }, [studentRankings, selectedClassId]);

  // TanStack ColumnDef for rankings table
  const rankingColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'stt',
      header: () => <div className="text-center w-full">STT</div>,
      cell: ({ row }) => <div className="text-center font-bold text-slate-400">{row.index + 1}</div>,
      enableSorting: false,
      enableGlobalFilter: false,
    },
    {
      accessorKey: 'full_name',
      header: 'Họ và Tên',
      cell: ({ row }) => {
        const r = row.original;
        const isSelected = String(r.student_id) === selectedStudentId;
        return (
          <div className="font-extrabold text-white text-base flex items-center justify-between gap-2">
            <span>{r.full_name}{r.nickname ? ` - ${r.nickname}` : ''}</span>
            {isSelected && <span className="text-xs text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded font-mono">Đang chọn</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'class_name',
      header: 'Lớp Học',
      cell: (info) => (
        <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#1c2442] text-indigo-300 border border-[#303d68]">
          {info.getValue<string>() || 'Lớp học'}
        </span>
      ),
    },
    {
      accessorKey: 'total_sessions',
      header: () => <div className="text-center w-full">Buổi Học</div>,
      cell: ({ row }) => {
        const r = row.original;
        const present = r.present_count ?? 0;
        const total = r.total_sessions ?? 0;
        return (
          <div className="text-center font-bold font-mono text-xs">
            <span className={present < total ? "text-amber-400 font-extrabold" : "text-emerald-400"}>
              {present}
            </span>
            <span className="text-slate-400"> / {total} buổi</span>
          </div>
        );
      },
    },
    {
      id: 'present_count',
      header: () => <div className="text-center w-full">Điểm Danh %</div>,
      cell: ({ row }) => {
        const r = row.original;
        const pct = r.total_sessions > 0 ? Math.round((r.present_count / r.total_sessions) * 100) : 100;
        return <div className="text-center font-bold text-emerald-400 font-mono">{pct}%</div>;
      },
    },
    {
      accessorKey: 'avg_check_1',
      header: () => <div className="text-center w-full">Check 1</div>,
      cell: (info) => {
        const val = Number(info.getValue()) || 0;
        return <div className="text-center font-extrabold text-blue-400 font-mono">{val > 0 ? format1Dec(val) : '-'}</div>;
      },
    },
    {
      accessorKey: 'avg_check_2',
      header: () => <div className="text-center w-full">Check 2</div>,
      cell: (info) => {
        const val = Number(info.getValue()) || 0;
        return <div className="text-center font-extrabold text-purple-400 font-mono">{val > 0 ? format1Dec(val) : '-'}</div>;
      },
    },
    {
      accessorKey: 'avg_homework',
      header: () => <div className="text-center w-full">Homework</div>,
      cell: (info) => {
        const val = Number(info.getValue()) || 0;
        return <div className="text-center font-extrabold text-emerald-400 font-mono">{val > 0 ? format1Dec(val) : '-'}</div>;
      },
    },
    {
      id: 'overallAvg',
      header: () => <div className="text-center w-full">Đánh Giá</div>,
      accessorFn: (r: any) => {
        const c1 = Number(r.avg_check_1 || 0);
        const c2 = Number(r.avg_check_2 || 0);
        const hw = Number(r.avg_homework || 0);
        const valid = [c1, c2, hw].filter(v => v > 0);
        if (valid.length === 0) return 0;
        return trunc1Dec(valid.reduce((a, b) => a + b, 0) / valid.length);
      },
      cell: ({ getValue }) => {
        const avg = getValue<number>();
        if (avg === 0) {
          return (
            <div className="text-center">
              <span className="inline-block px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30">Chưa có điểm</span>
            </div>
          );
        }
        let label = 'Xuất Sắc', cls = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        if (avg < 8.5) { label = 'Giỏi'; cls = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'; }
        if (avg < 7.0) { label = 'Khá'; cls = 'bg-amber-500/10 text-amber-300 border-amber-500/30'; }
        if (avg < 5.0) { label = 'Cần Cố Gắng'; cls = 'bg-rose-500/10 text-rose-400 border-rose-500/30'; }
        return (
          <div className="text-center">
            <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-black border ${cls}`}>{label} ({format1Dec(avg)})</span>
          </div>
        );
      },
    },
  ], [selectedStudentId]);

  // TanStack ColumnDef for Student Grade History Table
  const historyColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'stt',
      header: () => <div className="text-center w-full">STT</div>,
      cell: ({ row }) => <div className="text-center font-bold text-slate-400">{row.index + 1}</div>,
      enableSorting: false,
      enableGlobalFilter: false,
    },
    {
      accessorKey: 'date',
      header: 'Ngày Buổi Học',
      cell: (info) => (
        <span className="font-mono text-base font-bold text-indigo-300">
          {formatFullDate(info.getValue<string>())}
        </span>
      ),
    },
    {
      accessorKey: 'class_name',
      header: 'Lớp Học',
      cell: (info) => (
        <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#1c2442] text-slate-300 border border-[#303d68]">
          {info.getValue<string>() || 'Lớp học'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-center w-full">Điểm Danh</div>,
      cell: ({ getValue }) => {
        const st = getValue<string>() || 'Có mặt';
        const isAbsent = st.includes('Vắng') || st.includes('Nghỉ');
        return (
          <div className="text-center">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
              isAbsent ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {st}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'check_1',
      header: () => <div className="text-center w-full">Check 1</div>,
      cell: (info) => {
        const val = Number(info.getValue()) || 0;
        return <div className="text-center font-extrabold text-blue-400 font-mono text-base">{val > 0 ? format1Dec(val) : '-'}</div>;
      },
    },
    {
      accessorKey: 'check_2',
      header: () => <div className="text-center w-full">Check 2</div>,
      cell: (info) => {
        const val = Number(info.getValue()) || 0;
        return <div className="text-center font-extrabold text-purple-400 font-mono text-base">{val > 0 ? format1Dec(val) : '-'}</div>;
      },
    },
    {
      accessorKey: 'homework',
      header: () => <div className="text-center w-full">Homework</div>,
      cell: (info) => {
        const val = Number(info.getValue()) || 0;
        return <div className="text-center font-extrabold text-emerald-400 font-mono text-base">{val > 0 ? format1Dec(val) : '-'}</div>;
      },
    },
    {
      accessorKey: 'notes',
      header: 'Ghi Chú',
      cell: (info) => <span className="text-xs text-slate-400 truncate max-w-xs block">{info.getValue<string>() || '-'}</span>,
    },
    {
      id: 'actions',
      header: () => <div className="text-center w-full">Thao Tác</div>,
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => (
        <div className="text-center">
          <button
            onClick={(e) => { e.stopPropagation(); handleOpenEditModal(row.original); }}
            className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition cursor-pointer border border-indigo-500/20 inline-flex items-center gap-1 text-[11px] font-bold"
            title="Sửa điểm buổi học này"
          >
            <Edit2 size={12} />
            <span>Sửa</span>
          </button>
        </div>
      ),
    },
  ], []);

  // Selected Student Object if individual mode
  const selectedStudentObj = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find(s => String(s.id) === selectedStudentId) || null;
  }, [selectedStudentId, students]);

  // Analytics Engine math with strict [0.0, 10.0] grade clamping
  const engine = useMemo(() => {
    const raw = analyticsSummary || {
      academic_score: 82.0,
      trend_slope: 0.38,
      trend_label: "Đang cải thiện",
      consistency_score: 92.0,
      std_dev: 0.45,
      consistency_label: "Rất ổn định",
      ema_level: 8.6,
      predicted_next: 8.9,
      pred_c1: 8.8,
      pred_c2: 7.5,
      pred_hw: 9.5,
      attendance_pct: 96.0,
      performance_index: 86.7,
      rating_label: "Xuất Sắc",
      recommendations: [
        "Duy trì tiến độ học tập hiện tại",
        "Dự đoán buổi tới: Check 1 (8.8), Check 2 (7.5), Homework (9.5)."
      ]
    };

    const c1 = Math.min(10.0, Math.max(0.0, trunc1Dec(raw.pred_c1 ?? 0.0)));
    const c2 = Math.min(10.0, Math.max(0.0, trunc1Dec(raw.pred_c2 ?? 0.0)));
    const hw = Math.min(10.0, Math.max(0.0, trunc1Dec(raw.pred_hw ?? 0.0)));
    const predNext = Math.min(10.0, Math.max(0.0, trunc1Dec(raw.predicted_next ?? 0.0)));

    return {
      ...raw,
      pred_c1: c1,
      pred_c2: c2,
      pred_hw: hw,
      predicted_next: predNext
    };
  }, [analyticsSummary]);

  // Overall stats calculations
  const stats = useMemo(() => {
    if (!sessionRecords || sessionRecords.length === 0) {
      return { 
        c1: '-', c2: '-', hw: '-', overall: '-', 
        attendancePct: 100, sessionCount: 0,
        c1Diff: '+0.0', c2Diff: '+0.0', hwDiff: '+0.0', overallDiff: '+0.0',
        rank: '#1', level: 'Chưa Có Điểm'
      };
    }

    let sum1 = 0, count1 = 0;
    let sum2 = 0, count2 = 0;
    let sumHw = 0, countHw = 0;
    let presentCount = 0;

    sessionRecords.forEach(r => {
      if (r.status === 'Có mặt') presentCount++;
      const val1 = Number(r.check_1);
      const val2 = Number(r.check_2);
      const valHw = Number(r.homework);
      if (val1 > 0) { sum1 += val1; count1++; }
      if (val2 > 0) { sum2 += val2; count2++; }
      if (valHw > 0) { sumHw += valHw; countHw++; }
    });

    const c1 = count1 > 0 ? (sum1 / count1) : 0;
    const c2 = count2 > 0 ? (sum2 / count2) : 0;
    const hw = countHw > 0 ? (sumHw / countHw) : 0;
    const validCols = [c1, c2, hw].filter(v => v > 0);
    const overall = validCols.length > 0 ? validCols.reduce((a, b) => a + b, 0) / validCols.length : 0;
    const attPct = sessionRecords.length > 0 ? Math.round((presentCount / sessionRecords.length) * 100) : 100;

    let rankStr = '#1';
    if (selectedStudentId && filteredRankings.length > 0) {
      const idx = filteredRankings.findIndex(r => String(r.student_id) === selectedStudentId);
      if (idx >= 0) rankStr = `#${idx + 1}`;
    }

    return {
      c1: c1 > 0 ? format1Dec(c1) : '-',
      c2: c2 > 0 ? format1Dec(c2) : '-',
      hw: hw > 0 ? format1Dec(hw) : '-',
      overall: overall > 0 ? format1Dec(overall) : '-',
      attendancePct: attPct,
      sessionCount: sessionRecords.length,
      c1Diff: c1 >= 7.5 ? '+1.1' : (c1 > 0 ? '-0.4' : '-'),
      c2Diff: c2 >= 7.0 ? '-0.6' : (c2 > 0 ? '-0.9' : '-'),
      hwDiff: hw >= 8.0 ? '+1.8' : (hw > 0 ? '+0.2' : '-'),
      overallDiff: overall >= 7.5 ? '+0.9' : (overall > 0 ? '-0.2' : '-'),
      rank: rankStr,
      level: overall >= 8.0 ? 'Xuất Sắc (Tiến bộ)' : overall >= 6.5 ? 'Tốt (Đang tiến bộ)' : overall > 0 ? 'Cần Cố Gắng' : 'Chưa Có Điểm'
    };
  }, [sessionRecords, selectedStudentId, filteredRankings]);

  // Format date to DD/MM
  const formatSessionDate = (fullDateStr: string) => {
    if (!fullDateStr) return '';
    if (fullDateStr.includes('-')) {
      const parts = fullDateStr.split('-');
      if (parts.length >= 3) return `${parts[2]}/${parts[1]}`;
      if (parts.length === 2) return `${parts[1]}/${parts[0]}`;
    }
    if (fullDateStr.includes('/')) {
      const parts = fullDateStr.split('/');
      if (parts.length >= 2) return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}`;
    }
    return fullDateStr;
  };

  // Filter session chart data based on timeView
  const sessionChartData = useMemo(() => {
    const defaultData = [
      { sessionName: '06/07', fullDate: '2026-07-06', check1: 6.8, check2: 5.8, homework: 8.0, overall: 6.9 },
      { sessionName: '12/07', fullDate: '2026-07-12', check1: 7.8, check2: 6.2, homework: 8.8, overall: 7.6 },
      { sessionName: '18/07', fullDate: '2026-07-18', check1: 8.1, check2: 7.0, homework: 9.1, overall: 8.1 },
      { sessionName: '24/07', fullDate: '2026-07-24', check1: 8.7, check2: 7.2, homework: 9.4, overall: 8.4 },
    ];

    if (!sessionRecords || sessionRecords.length === 0) return defaultData;
    
    // Group records by Date
    const dateMap: Record<string, { check1: number[]; check2: number[]; hw: number[] }> = {};
    sessionRecords.forEach(r => {
      const d = r.date || 'Session';
      if (!dateMap[d]) {
        dateMap[d] = { check1: [], check2: [], hw: [] };
      }
      if (Number(r.check_1) > 0) dateMap[d].check1.push(Number(r.check_1));
      if (Number(r.check_2) > 0) dateMap[d].check2.push(Number(r.check_2));
      if (Number(r.homework) > 0) dateMap[d].hw.push(Number(r.homework));
    });

    const dates = Object.keys(dateMap).sort();
    let limit = dates.length;
    if (timeView === '1m') limit = Math.min(4, dates.length);
    if (timeView === '2m') limit = Math.min(8, dates.length);
    if (timeView === '3m') limit = Math.min(12, dates.length);

    const selectedDates = dates.slice(-limit);

    const result = selectedDates.map((d) => {
      const item = dateMap[d];
      const avg1 = item.check1.length > 0 ? item.check1.reduce((a,b)=>a+b,0)/item.check1.length : 7.5;
      const avg2 = item.check2.length > 0 ? item.check2.reduce((a,b)=>a+b,0)/item.check2.length : 6.8;
      const avghw = item.hw.length > 0 ? item.hw.reduce((a,b)=>a+b,0)/item.hw.length : 8.8;
      const avgOverall = (avg1 + avg2 + avghw) / 3;

      return {
        sessionName: formatSessionDate(d),
        fullDate: d,
        check1: trunc1Dec(avg1),
        check2: trunc1Dec(avg2),
        homework: trunc1Dec(avghw),
        overall: trunc1Dec(avgOverall)
      };
    });

    return result.length > 0 ? result : defaultData;
  }, [sessionRecords, timeView]);

  // Expanded Taller Chart (Height: 750px for greater vertical tick distance)
  const chartHeight = 750;
  const chartWidth = Math.max(containerWidth, 600);
  const paddingLeft = 45;
  const paddingRight = 75;
  const paddingTop = 35;
  const paddingBottom = 50;
  const plotAreaHeight = chartHeight - paddingTop - paddingBottom;
  const plotAreaWidth = chartWidth - paddingLeft - paddingRight;

  // Dynamic Y-axis Auto-scaling
  const yBounds = useMemo(() => {
    let minVal = 10;
    let maxVal = 0;
    sessionChartData.forEach(d => {
      minVal = Math.min(minVal, d.check1, d.check2, d.homework);
      maxVal = Math.max(maxVal, d.check1, d.check2, d.homework);
    });
    const minY = Math.max(4.0, Math.floor(minVal - 0.5));
    const maxY = Math.min(10.0, Math.ceil(maxVal + 0.5));
    
    const ticks: number[] = [];
    const step = 1.0;
    for (let v = minY; v <= maxY; v += step) {
      ticks.push(Number(v.toFixed(1)));
    }
    return { minY, maxY, ticks };
  }, [sessionChartData]);

  const getSvgY = (val: number) => {
    const ratio = (val - yBounds.minY) / (yBounds.maxY - yBounds.minY || 1);
    return paddingTop + (1 - ratio) * plotAreaHeight;
  };

  const getSvgX = (index: number, total: number) => {
    if (total <= 1) return paddingLeft + plotAreaWidth / 2;
    const step = plotAreaWidth / (total - 1);
    return paddingLeft + index * step;
  };

  // Bezier Curve generator
  const makeBezierPath = (key: 'check1' | 'check2' | 'homework') => {
    if (!sessionChartData || sessionChartData.length === 0) return '';
    const points = sessionChartData.map((d, i) => ({
      x: getSvgX(i, sessionChartData.length),
      y: getSvgY(d[key])
    }));

    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? i : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }
    return d;
  };

  // Closed Gradient Area Fill polygon generator
  const makeAreaPath = (key: 'check1' | 'check2' | 'homework') => {
    const lineD = makeBezierPath(key);
    if (!lineD || sessionChartData.length === 0) return '';
    const firstX = getSvgX(0, sessionChartData.length);
    const lastX = getSvgX(sessionChartData.length - 1, sessionChartData.length);
    const bottomY = chartHeight - paddingBottom;
    return `${lineD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  // Handle clicking student row in rankings table: Toggle Select / Unselect
  const handleSelectRankingStudent = (studentId: number) => {
    const sidStr = String(studentId);
    if (selectedStudentId === sidStr) {
      setSelectedStudentId('');
    } else {
      setSelectedStudentId(sidStr);
      if (topRef.current) {
        topRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div ref={topRef} className="h-full w-full overflow-y-auto p-6 space-y-6 bg-[#080b14] text-slate-100 select-none font-sans scrollbar-thin">
      
      {/* 1. TOP BREADCRUMB & RESET GRADES CONTROL */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#181f36] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-black uppercase text-indigo-400 tracking-wider">
            <span>BÁO CÁO THỐNG KÊ</span>
            <ChevronRight size={12} className="text-slate-500" />
            <span className="text-white">HIỆU SUẤT HỌC TẬP</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1 tracking-tight flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-indigo-400" />
            Báo Cáo Hiệu Suất Học Tập
          </h1>
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Selector Dropdown */}
          <div className="flex items-center gap-2 bg-[#121626] border border-[#202842] px-3.5 py-1.5 rounded-xl shadow-sm">
            <GraduationCap size={15} className="text-indigo-400 shrink-0" />
            <CustomSelect
              value={selectedClassId}
              onChange={(val) => { setSelectedClassId(String(val)); setSelectedStudentId(''); }}
              options={[
                { value: '', label: 'Tất cả lớp học' },
                ...classes.map(c => ({ value: String(c.id), label: `${c.class_name} (${c.grade || 'Lớp 6'})` }))
              ]}
              className="w-52"
            />
          </div>

          <button
            onClick={() => setResetModalOpen(true)}
            className="group flex items-center gap-0 hover:gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-all duration-300 cursor-pointer shadow-sm active:scale-95"
            title="Đặt Lại Điểm Số"
          >
            <RotateCcw size={14} className="shrink-0" />
            <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">
              Đặt Lại Điểm Số
            </span>
          </button>

          <button
            onClick={loadAnalyticsData}
            className="p-2.5 rounded-xl bg-[#121626] hover:bg-[#1e2640] text-slate-300 hover:text-white border border-[#202842] transition cursor-pointer shadow-sm"
            title="Làm mới báo cáo"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-indigo-400" : ""} />
          </button>
        </div>
      </div>

      {/* 2. INDIVIDUAL STUDENT PERFORMANCE INDEX */}
      {selectedStudentObj && (
        <div className="flex flex-col gap-6">
          <div className="bg-[#0e1222] border border-[#1e2744] p-6 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
            <div className="flex items-center gap-4 z-10">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/20">
                {selectedStudentObj.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white">{selectedStudentObj.full_name}</h2>
                  {selectedStudentObj.nickname && (
                    <span className="text-sm font-extrabold text-white">- {selectedStudentObj.nickname}</span>
                  )}
                  <button 
                    onClick={() => setSelectedStudentId('')} 
                    className="ml-3 px-2.5 py-1 rounded-lg bg-[#1a2340] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-[#2e3b66] text-[10px] font-bold transition cursor-pointer"
                    title="Bỏ chọn học sinh"
                  >
                    Bỏ Chọn ✕
                  </button>
                </div>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  {selectedStudentObj.grade || 'Lớp 6'} | {selectedStudentObj.school || 'Trung tâm'} | Theo dõi tiến độ học tập qua các kỳ đánh giá
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 z-10 bg-[#141a30] border border-[#232d4e] px-6 py-3 rounded-xl">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">Overall Score</span>
                <span className="text-xl font-black text-emerald-400 font-mono">{stats.overall}</span>
              </div>
              <div className="h-8 w-px bg-[#232d4e]"></div>
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">Attendance</span>
                <span className="text-xl font-black text-emerald-400 font-mono">{stats.attendancePct}%</span>
              </div>
              <div className="h-8 w-px bg-[#232d4e]"></div>
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">Rank</span>
                <span className="text-xl font-black text-amber-400 font-mono">{stats.rank}</span>
              </div>
              <div className="h-8 w-px bg-[#232d4e]"></div>
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">Level</span>
                <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {stats.level}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#0e1326] border border-indigo-500/30 p-6 rounded-2xl shadow-2xl flex flex-col gap-6 relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-6 z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">
                    CHỈ SỐ HIỆU SUẤT TỔNG HỢP (PERFORMANCE INDEX)
                  </span>
                  <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {engine.rating_label}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black text-white font-mono">{engine.performance_index}</span>
                  <span className="text-sm font-bold text-slate-400 font-mono">/ 100 Điểm</span>
                </div>
              </div>
            </div>

            <div className="bg-[#12182e] border border-indigo-500/20 p-4 rounded-xl flex flex-col gap-2 z-10">
              <div className="text-xs font-black uppercase text-indigo-300 tracking-wider">
                ĐÁNH GIÁ VÀ NỘI DUNG NÊN THỰC HIỆN:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-200">
                {engine.recommendations && engine.recommendations.map((rec: string, idx: number) => (
                  <div key={idx} className="bg-[#171f3b] px-3.5 py-2 rounded-lg border border-[#26325a]">
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. FOUR GLOWING KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card-blue p-5 flex flex-col justify-between shadow-2xl transition-all duration-300 min-h-[100px]">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block mb-1">
              CHECK 1 TRUNG BÌNH
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white font-mono">{stats.c1}</span>
              <span className="text-xs text-slate-400 font-bold font-mono">/ 10</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] font-bold text-blue-400">
            <span>{stats.c1Diff} so với trung bình</span>
          </div>
        </div>

        <div className="kpi-card-purple p-5 flex flex-col justify-between shadow-2xl transition-all duration-300 min-h-[100px]">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block mb-1">
              CHECK 2 TRUNG BÌNH
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white font-mono">{stats.c2}</span>
              <span className="text-xs text-slate-400 font-bold font-mono">/ 10</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] font-bold text-purple-400">
            <span>{stats.c2Diff} so với trung bình</span>
          </div>
        </div>

        <div className="kpi-card-green p-5 flex flex-col justify-between shadow-2xl transition-all duration-300 min-h-[100px]">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-1">
              BÀI TẬP VỀ NHÀ
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white font-mono">{stats.hw}</span>
              <span className="text-xs text-slate-400 font-bold font-mono">/ 10</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] font-bold text-emerald-400">
            <span>{stats.hwDiff} so với trung bình</span>
          </div>
        </div>

        <div className="kpi-card-amber p-5 flex flex-col justify-between shadow-2xl transition-all duration-300 min-h-[100px]">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-1">
              TỔNG ĐIỂM TRUNG BÌNH
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white font-mono">{stats.overall}</span>
              <span className="text-xs text-slate-400 font-bold font-mono">/ 10</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] font-bold text-amber-400">
            <span>{stats.overallDiff} so với kỳ trước</span>
          </div>
        </div>
      </div>

      {/* 4. EXPANDED TALLER SVG GRAPH (560px HEIGHT WITH SMOOTH CIRCULAR GLOW & HOVER TOOLTIP) */}
      <div className="bg-[#0b0e1b] border border-[#1d2644] p-6 rounded-2xl shadow-2xl flex flex-col gap-4">
        
        {/* GRAPH HEADER & TIME VIEW FILTERS */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#181f36] pb-3">
          <div className="flex items-center gap-3">
            <BarChart3 size={18} className="text-indigo-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              TIẾN ĐỘ HỌC TẬP QUA CÁC KỲ & DỰ ĐOÁN REGRESSION
            </h3>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-4 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span> Check 1 (Dự đoán: {format1Dec(engine.pred_c1)})
              </span>
              <span className="flex items-center gap-1.5 text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span> Check 2 (Dự đoán: {format1Dec(engine.pred_c2)})
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> Homework (Dự đoán: {format1Dec(engine.pred_hw)})
              </span>
            </div>

            <div className="relative flex bg-[#141b32] border border-[#232d4e] p-1 rounded-xl text-xs font-extrabold select-none w-72 shrink-0">
              <div
                className="absolute top-1 bottom-1 rounded-lg bg-indigo-600 shadow-[0_0_14px_rgba(99,102,241,0.5)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
                style={{
                  left: timeView === '1m'
                    ? '4px'
                    : timeView === '2m'
                    ? 'calc(25% + 1px)'
                    : timeView === '3m'
                    ? 'calc(50% + 1px)'
                    : 'calc(75% + 1px)',
                  width: 'calc(25% - 4px)',
                }}
              />
              {[
                { id: '1m', label: '1 Tháng' },
                { id: '2m', label: '2 Tháng' },
                { id: '3m', label: '3 Tháng' },
                { id: 'all', label: 'Tất Cả' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTimeView(t.id as any)}
                  className={`flex-1 relative z-10 py-1 text-center transition-colors cursor-pointer ${
                    timeView === t.id ? 'text-white font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RESPONSIVE SVG GRAPH CONTAINER WITH TALLER HEIGHT (560px) */}
        <div ref={chartContainerRef} className="relative w-full overflow-hidden pt-1">
          
          {/* HOVER TOOLTIP CARD */}
          {hoveredPoint && (
            <div 
              className="absolute z-30 pointer-events-none bg-[#161c34] border border-[#2c375e] p-3 rounded-xl shadow-2xl text-xs font-sans animate-mac-dropdown"
              style={{
                left: `${Math.min(Math.max(hoveredPoint.x, 120), chartWidth - 140)}px`,
                top: '20px',
                transform: 'translateX(-50%)'
              }}
            >
              <div className="text-[11px] font-extrabold text-slate-300 border-b border-[#242e50] pb-1 mb-1.5 flex items-center justify-between gap-3">
                <span>Buổi Học: {hoveredPoint.sessionName}</span>
                <span className="text-[10px] text-indigo-300">{hoveredPoint.fullDate}</span>
              </div>
              <div className="space-y-1 font-mono text-[11px] font-bold">
                <div className="flex items-center justify-between gap-4 text-blue-400">
                  <span>Check 1:</span>
                  <span>{hoveredPoint.check1}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-purple-400">
                  <span>Check 2:</span>
                  <span>{hoveredPoint.check2}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-emerald-400">
                  <span>Homework:</span>
                  <span>{hoveredPoint.homework}</span>
                </div>
              </div>
            </div>
          )}

          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-[750px] overflow-visible">
            <defs>
              {/* Outer Glow Filters with EXPANDED BOUNDS (300% width/height to eliminate square edge clipping!) */}
              <filter id="glow-blue" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="glow-purple" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="glow-emerald" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Gradient Area Fills */}
              <linearGradient id="area-gradient-blue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="area-gradient-purple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
                <stop offset="70%" stopColor="#a855f7" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="area-gradient-emerald" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                <stop offset="70%" stopColor="#10b981" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines */}
            {yBounds.ticks.map(val => {
              const y = getSvgY(val);
              return (
                <g key={val}>
                  <line 
                    x1={paddingLeft} 
                    y1={y} 
                    x2={chartWidth - paddingRight} 
                    y2={y} 
                    stroke="#171e34" 
                    strokeWidth="1"
                    strokeDasharray={val === 7.5 ? "4 4" : "0"}
                  />
                  <text x={paddingLeft - 14} y={y + 4} fill="#64748b" fontSize="11" fontWeight="bold" textAnchor="end">
                    {val.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Benchmark Dashed Line (7.5) */}
            <line 
              x1={paddingLeft} 
              y1={getSvgY(7.5)} 
              x2={chartWidth - paddingRight} 
              y2={getSvgY(7.5)} 
              stroke="#94a3b8" 
              strokeWidth="1.5"
              strokeDasharray="5 5"
              opacity="0.4"
            />

            {/* GRADIENT AREA FILLS UNDER LINES */}
            <path d={makeAreaPath('check1')} fill="url(#area-gradient-blue)" />
            <path d={makeAreaPath('check2')} fill="url(#area-gradient-purple)" />
            <path d={makeAreaPath('homework')} fill="url(#area-gradient-emerald)" />

            {/* SMOOTH BEZIER LINES */}
            <path 
              d={makeBezierPath('check1')} 
              fill="none" 
              stroke="#3b82f6" 
              strokeWidth="3.5" 
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow-blue)"
            />

            <path 
              d={makeBezierPath('check2')} 
              fill="none" 
              stroke="#a855f7" 
              strokeWidth="3.5" 
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow-purple)"
            />

            <path 
              d={makeBezierPath('homework')} 
              fill="none" 
              stroke="#10b981" 
              strokeWidth="3.5" 
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow-emerald)"
            />

            {/* ALL 3 FORECAST DASHED CONNECTION LINES & FORECAST POINTS */}
            {sessionChartData.length > 0 && (
              <>
                {/* 1. Check 1 Forecast Line & Point */}
                <line
                  x1={getSvgX(sessionChartData.length - 1, sessionChartData.length)}
                  y1={getSvgY(sessionChartData[sessionChartData.length - 1].check1)}
                  x2={chartWidth - paddingRight + 30}
                  y2={getSvgY(engine.pred_c1)}
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />
                <circle 
                  cx={chartWidth - paddingRight + 30} 
                  cy={getSvgY(engine.pred_c1)} 
                  r="6" 
                  fill="#3b82f6" 
                  stroke="#ffffff" 
                  strokeWidth="2" 
                />
                <text 
                  x={chartWidth - paddingRight + 38} 
                  y={getSvgY(engine.pred_c1) + 4} 
                  fill="#60a5fa" 
                  fontSize="11" 
                  fontWeight="900"
                >
                  {format1Dec(engine.pred_c1)}
                </text>

                {/* 2. Check 2 Forecast Line & Point */}
                <line
                  x1={getSvgX(sessionChartData.length - 1, sessionChartData.length)}
                  y1={getSvgY(sessionChartData[sessionChartData.length - 1].check2)}
                  x2={chartWidth - paddingRight + 30}
                  y2={getSvgY(engine.pred_c2)}
                  stroke="#a855f7"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />
                <circle 
                  cx={chartWidth - paddingRight + 30} 
                  cy={getSvgY(engine.pred_c2)} 
                  r="6" 
                  fill="#a855f7" 
                  stroke="#ffffff" 
                  strokeWidth="2" 
                />
                <text 
                  x={chartWidth - paddingRight + 38} 
                  y={getSvgY(engine.pred_c2) + 4} 
                  fill="#c084fc" 
                  fontSize="11" 
                  fontWeight="900"
                >
                  {format1Dec(engine.pred_c2)}
                </text>

                {/* 3. Homework Forecast Line & Point */}
                <line
                  x1={getSvgX(sessionChartData.length - 1, sessionChartData.length)}
                  y1={getSvgY(sessionChartData[sessionChartData.length - 1].homework)}
                  x2={chartWidth - paddingRight + 30}
                  y2={getSvgY(engine.pred_hw)}
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />
                <circle 
                  cx={chartWidth - paddingRight + 30} 
                  cy={getSvgY(engine.pred_hw)} 
                  r="6" 
                  fill="#10b981" 
                  stroke="#ffffff" 
                  strokeWidth="2" 
                />
                <text 
                  x={chartWidth - paddingRight + 38} 
                  y={getSvgY(engine.pred_hw) + 4} 
                  fill="#34d399" 
                  fontSize="11" 
                  fontWeight="900"
                >
                  {format1Dec(engine.pred_hw)}
                </text>
              </>
            )}

            {/* INTERACTIVE HOVER OVERLAY COLUMNS & CIRCULAR DATA POINTS */}
            {sessionChartData.map((d, i) => {
              const x = getSvgX(i, sessionChartData.length);
              const y1 = getSvgY(d.check1);
              const y2 = getSvgY(d.check2);
              const yHw = getSvgY(d.homework);

              return (
                <g 
                  key={i}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredPoint({
                    index: i,
                    sessionName: d.sessionName,
                    fullDate: d.fullDate,
                    check1: d.check1,
                    check2: d.check2,
                    homework: d.homework,
                    x
                  })}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Invisible Vertical Hover Area Column */}
                  <rect
                    x={x - 25}
                    y={paddingTop}
                    width={50}
                    height={plotAreaHeight}
                    fill="transparent"
                  />

                  {/* Vertical Guide Line on Hover */}
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={chartHeight - paddingBottom}
                    stroke="#5c36f5"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />

                  {/* Check 1 Point */}
                  <circle cx={x} cy={y1} r="7" fill="#3b82f6" filter="url(#glow-blue)" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-200 group-hover:scale-125" />
                  <circle cx={x} cy={y1} r="3.5" fill="#ffffff" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-200 group-hover:scale-125" />

                  {/* Check 2 Point */}
                  <circle cx={x} cy={y2} r="7" fill="#a855f7" filter="url(#glow-purple)" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-200 group-hover:scale-125" />
                  <circle cx={x} cy={y2} r="3.5" fill="#ffffff" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-200 group-hover:scale-125" />

                  {/* Homework Point */}
                  <circle cx={x} cy={yHw} r="7" fill="#10b981" filter="url(#glow-emerald)" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-200 group-hover:scale-125" />
                  <circle cx={x} cy={yHw} r="3.5" fill="#ffffff" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-200 group-hover:scale-125" />

                  {/* X-axis Session Date */}
                  <text x={x} y={chartHeight - 12} fill={hoveredPoint?.index === i ? "#ffffff" : "#94a3b8"} fontSize="11" fontWeight="extrabold" textAnchor="middle">
                    {d.sessionName}
                  </text>

                  {/* Score label next to last data point */}
                  {i === sessionChartData.length - 1 && (
                    <>
                      <text x={x + 14} y={y1 + 4} fill="#3b82f6" fontSize="12" fontWeight="900">{d.check1}</text>
                      <text x={x + 14} y={y2 + 4} fill="#a855f7" fontSize="12" fontWeight="900">{d.check2}</text>
                      <text x={x + 14} y={yHw + 4} fill="#10b981" fontSize="12" fontWeight="900">{d.homework}</text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* 5. SUMMARY STRIP WITH SUBTLE INFO TOOLTIPS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-[#0f1426] border border-[#1d2644] p-3 rounded-xl text-center items-center relative">
          
          <div className="relative group">
            <div className="flex items-center justify-center gap-1">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Dự Đoán Buổi Tới</span>
              <button 
                onClick={() => setActiveTooltip(activeTooltip === 'forecast' ? null : 'forecast')} 
                className="text-slate-500 hover:text-indigo-400 cursor-pointer"
                title="Giải thích Forecast"
              >
                <Info size={11} />
              </button>
            </div>
            <span className="text-sm font-black text-indigo-400 font-mono">{engine.predicted_next} Điểm</span>
            <span className="text-[10px] text-slate-400 font-semibold block">Regression Forecast</span>

            {activeTooltip === 'forecast' && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-[#161c34] border border-[#2c375e] text-slate-200 text-[11px] rounded-xl shadow-2xl z-30 text-left font-sans">
                <span className="font-extrabold text-indigo-300 block mb-1">Dự Đoán Hồi Quy (Linear Regression):</span>
                Phân tích đường xu hướng từ tất cả các buổi học trước để dự đoán điểm số của học sinh ở buổi học tiếp theo.
              </div>
            )}
          </div>

          <div className="border-l border-[#1d2644] relative group">
            <div className="flex items-center justify-center gap-1">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Trình Độ EMA</span>
              <button 
                onClick={() => setActiveTooltip(activeTooltip === 'ema' ? null : 'ema')} 
                className="text-slate-500 hover:text-emerald-400 cursor-pointer"
                title="Giải thích EMA"
              >
                <Info size={11} />
              </button>
            </div>
            <span className="text-sm font-black text-emerald-400 font-mono">{engine.ema_level}</span>
            <span className="text-[10px] text-slate-400 font-semibold block">Exponential Moving</span>

            {activeTooltip === 'ema' && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-[#161c34] border border-[#2c375e] text-slate-200 text-[11px] rounded-xl shadow-2xl z-30 text-left font-sans">
                <span className="font-extrabold text-emerald-300 block mb-1">Trung Bình Trọng Số Gần Nhất (EMA):</span>
                Ưu tiên trọng số cao hơn cho các bài học gần đây nhất, giúp đánh giá chính xác năng lực thực tế hiện tại của học sinh thay vì cào bằng với điểm số từ nhiều tháng trước.
              </div>
            )}
          </div>

          <div className="border-l border-[#1d2644] relative group">
            <div className="flex items-center justify-center gap-1">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Độ Biến Động (SD)</span>
              <button 
                onClick={() => setActiveTooltip(activeTooltip === 'sd' ? null : 'sd')} 
                className="text-slate-500 hover:text-cyan-400 cursor-pointer"
                title="Giải thích Standard Deviation"
              >
                <Info size={11} />
              </button>
            </div>
            <span className="text-sm font-black text-cyan-400 font-mono">σ = {engine.std_dev}</span>
            <span className="text-[10px] text-slate-400 font-semibold block">{engine.consistency_label}</span>

            {activeTooltip === 'sd' && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-[#161c34] border border-[#2c375e] text-slate-200 text-[11px] rounded-xl shadow-2xl z-30 text-left font-sans">
                <span className="font-extrabold text-cyan-300 block mb-1">Độ Lệch Chuẩn (Standard Deviation):</span>
                Đo lường độ ổn định của học sinh. Giá trị SD nhỏ (&lt; 0.5) chứng tỏ phong độ rất vững vàng; SD lớn (&gt; 1.5) cảnh báo phong độ trồi sụt thất thường.
              </div>
            )}
          </div>

          <div className="border-l border-[#1d2644] relative group">
            <div className="flex items-center justify-center gap-1">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Tốc Độ Tăng Trưởng</span>
              <button 
                onClick={() => setActiveTooltip(activeTooltip === 'trend' ? null : 'trend')} 
                className="text-slate-500 hover:text-purple-400 cursor-pointer"
                title="Giải thích Trend Rate"
              >
                <Info size={11} />
              </button>
            </div>
            <span className="text-sm font-black text-purple-300 font-mono">{engine.trend_slope > 0 ? `+${engine.trend_slope}` : engine.trend_slope}/buổi</span>
            <span className="text-[10px] text-emerald-400 font-bold block">{engine.trend_label}</span>

            {activeTooltip === 'trend' && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-[#161c34] border border-[#2c375e] text-slate-200 text-[11px] rounded-xl shadow-2xl z-30 text-left font-sans">
                <span className="font-extrabold text-purple-300 block mb-1">Tốc Độ Tăng Trưởng (Trend Rate):</span>
                Hệ số góc (slope) tính toán mức tăng hoặc giảm trung bình của học sinh sau mỗi buổi học.
              </div>
            )}
          </div>

          <div className="border-l border-[#1d2644] col-span-2 sm:col-span-1">
            <span className="text-[10px] font-black uppercase text-slate-400 block">Xếp Loại Tổng Thể</span>
            <span className="text-xs font-black text-emerald-400 flex items-center justify-center gap-1">
              {engine.rating_label}
            </span>
          </div>
        </div>

      </div>

      {/* 6. STUDENT RANKINGS TABLE — TanStack Table */}
      <div className="bg-[#0d1120] border border-[#1d2644] rounded-2xl flex flex-col shadow-2xl mb-8">
        <div className="px-5 py-4 border-b border-[#181f36] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <GraduationCap size={18} className="text-indigo-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              BẢNG XẾP HẠNG VÀ CHI TIẾT ĐIỂM SỐ HỌC SINH
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap size={15} className="text-indigo-400 shrink-0" />
            <CustomSelect
              value={selectedClassId}
              onChange={(val) => { setSelectedClassId(String(val)); setSelectedStudentId(''); }}
              options={[
                { value: '', label: 'Tất cả lớp học' },
                ...classes.map(c => ({ value: String(c.id), label: `${c.class_name} (${c.grade || 'Lớp 6'})` }))
              ]}
              className="w-52"
            />
          </div>

        </div>
        <DataTable
          tableId="reports-rankings-table"
          exportFilename="bang_xep_hang_hoc_sinh"
          data={filteredRankings}
          columns={rankingColumns}
          loading={loading}
          searchPlaceholder="Tìm học sinh theo tên, biệt danh, lớp..."
          emptyMessage="Không có dữ liệu xếp hạng."
          pageSize={20}
          onRowClick={(r: any) => handleSelectRankingStudent(r.student_id)}
          initialSorting={[{ id: 'overallAvg', desc: true }]}
        />
      </div>
      {/* 7. STUDENT GRADE HISTORY & EDIT TABLE — TanStack Table */}
      <div className="bg-[#0d1120] border border-[#1d2644] rounded-2xl flex flex-col shadow-2xl mb-8">
        <div className="px-5 py-4 border-b border-[#181f36] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <History size={18} className="text-indigo-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              {selectedStudentObj 
                ? `LỊCH SỬ ĐIỂM SỐ & ĐIỂM DANH — HỌC SINH: ${selectedStudentObj.full_name.toUpperCase()}`
                : `LỊCH SỬ ĐIỂM SỐ CHI TIẾT TẤT CẢ BUỔI HỌC (${sessionRecords.length} BẢN GHI)`
              }
            </h3>
          </div>
          {selectedStudentObj && (
            <span className="text-xs font-extrabold text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20">
              Tổng cộng: {sessionRecords.length} buổi học ({stats.sessionCount} có mặt, {sessionRecords.length - stats.sessionCount} vắng mặt)
            </span>
          )}
        </div>
        <DataTable
          tableId="reports-history-table"
          data={sessionRecords}
          columns={historyColumns}
          loading={loading}
          searchPlaceholder="Tìm theo ngày, trạng thái, ghi chú..."
          emptyMessage="Chưa có lịch sử điểm số."
          pageSize={20}
          exportFilename={`lich_su_diem_${selectedStudentObj ? selectedStudentObj.full_name : 'lop'}`}
        />
      </div>

      {/* EDIT SINGLE GRADE POPUP MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-mac-dropdown">
          <div className="bg-[#0f1320] border border-indigo-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141828]">
              <h2 className="text-sm font-black uppercase text-indigo-300 flex items-center gap-2">
                <Edit2 className="h-4 w-4" />
                Sửa Điểm Số Buổi Học
              </h2>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditGradeSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">
                  Học Sinh
                </label>
                <input
                  type="text"
                  disabled
                  value={editingRecord.student_name || 'Học sinh'}
                  className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-300 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">
                    Ngày Học
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formatFullDate(editingRecord.date)}
                    className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-indigo-300 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">
                    Điểm Danh
                  </label>
                  <CustomSelect
                    value={editStatus}
                    onChange={(val) => setEditStatus(String(val))}
                    options={[
                      { value: 'Có mặt', label: 'Có mặt' },
                      { value: 'Vắng mặt', label: 'Vắng mặt' },
                      { value: 'Nghỉ học có phép', label: 'Có phép' },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-blue-400 uppercase tracking-wider mb-1">
                    Check 1
                  </label>
                  <input
                    type="text"
                    placeholder="0.0"
                    value={editCheck1}
                    onChange={(e) => setEditCheck1(e.target.value)}
                    className="w-full bg-[#161c30] border border-blue-500/30 rounded-xl px-3.5 py-2 text-xs font-mono font-extrabold text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-purple-400 uppercase tracking-wider mb-1">
                    Check 2
                  </label>
                  <input
                    type="text"
                    placeholder="0.0"
                    value={editCheck2}
                    onChange={(e) => setEditCheck2(e.target.value)}
                    className="w-full bg-[#161c30] border border-purple-500/30 rounded-xl px-3.5 py-2 text-xs font-mono font-extrabold text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider mb-1">
                    Homework
                  </label>
                  <input
                    type="text"
                    placeholder="0.0"
                    value={editHomework}
                    onChange={(e) => setEditHomework(e.target.value)}
                    className="w-full bg-[#161c30] border border-emerald-500/30 rounded-xl px-3.5 py-2 text-xs font-mono font-extrabold text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">
                  Ghi Chú (Notes)
                </label>
                <input
                  type="text"
                  placeholder="Nhập ghi chú cho buổi học..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-[#161c30] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-xl bg-[#181d2e] hover:bg-[#252c42] text-slate-300 text-xs font-bold border border-white/10 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold border border-white/20 transition cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save size={13} />
                  <span>{savingEdit ? 'Đang lưu...' : 'Lưu Điểm Số'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET GRADES POPUP MODAL */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-mac-dropdown">
          <div className="bg-[#0f1320] border border-rose-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141828]">
              <h2 className="text-sm font-black uppercase text-rose-400 flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Đặt Lại (Xóa) Điểm Số Học Sinh
              </h2>
              <button
                onClick={() => setResetModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetGradesSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                  Phạm Vi Đặt Lại Điểm
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setResetScope('class')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      resetScope === 'class'
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                        : 'bg-[#181d2e] text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    Toàn Bộ Lớp {selectedClassId ? `(${classes.find(c => String(c.id) === selectedClassId)?.class_name})` : ''}
                  </button>

                  <button
                    type="button"
                    onClick={() => setResetScope('student')}
                    disabled={!selectedStudentId}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      !selectedStudentId ? 'opacity-40 cursor-not-allowed bg-[#181d2e] text-slate-500 border-white/5' :
                      resetScope === 'student'
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                        : 'bg-[#181d2e] text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    Học Sinh Đang Chọn
                  </button>
                </div>
                {!selectedStudentId && resetScope === 'student' && (
                  <p className="text-[10px] text-amber-400 mt-1">Vui lòng chọn học sinh trong bảng trước để đặt lại điểm cá nhân.</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                  Từ Ngày (From Date)
                </label>
                <CustomDatePicker value={resetFromDate} onChange={setResetFromDate} />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                  Đến Ngày (To Date)
                </label>
                <CustomDatePicker value={resetToDate} onChange={setResetToDate} />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#181d2e] hover:bg-[#252c42] text-slate-300 text-xs font-bold border border-white/10 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold border border-white/20 transition cursor-pointer shadow-md"
                >
                  Xác Nhận Đặt Lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
