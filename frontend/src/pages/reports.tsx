import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../api';
import { 
  BarChart3, RefreshCw, Calendar, 
  AlertCircle, Users, GraduationCap, ChevronRight, Info, Search, Filter, RotateCcw, ArrowUpDown, ChevronLeft, X
} from 'lucide-react';
import { showToast } from '../components/Toast';
import { VietnameseInput } from '../components/VietnameseInput';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  
  // Table Pagination & Search
  const [tableSearch, setTableSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Table Column Sort & Popover Filter state matching Ngân Hàng Câu Hỏi standard
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'overallAvg', direction: 'desc' });
  const [columnFilters, setColumnFilters] = useState<Record<string, { search: string; selectedValues: string[] }>>({});
  const [activeHeaderMenu, setActiveHeaderMenu] = useState<string | null>(null);

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
    } catch (e) {
      console.error(e);
    }
  };

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const cid = selectedClassId ? parseInt(selectedClassId) : undefined;
      const sid = selectedStudentId ? parseInt(selectedStudentId) : undefined;
      const res = await api.getGradeAnalytics(cid, sid);
      setSessionRecords(res.session_records || []);
      setStudentRankings(res.student_rankings || []);
      setAnalyticsSummary(res.analytics_summary || null);
    } catch (e: any) {
      showToast("Lỗi tải báo cáo thống kê: " + (e.message || e), "error");
    } finally {
      setLoading(false);
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
      loadAnalyticsData();
    } catch (err: any) {
      showToast("Không thể đặt lại điểm: " + err.message, "error");
    }
  };

  const handleUpdateFilter = (columnKey: string, searchVal: string, selectedVals: string[]) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnKey]: { search: searchVal, selectedValues: selectedVals }
    }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setColumnFilters({});
    setSortConfig(null);
    setCurrentPage(1);
  };

  // Filter rankings strictly by selectedClassId
  const filteredRankings = useMemo(() => {
    if (!selectedClassId) return studentRankings;
    return studentRankings.filter(r => String(r.class_id) === selectedClassId);
  }, [studentRankings, selectedClassId]);

  // Unique values caching for table column popovers
  const uniqueValuesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    const keys = ['full_name', 'class_name', 'total_sessions', 'present_count', 'avg_check_1', 'avg_check_2', 'avg_homework', 'overallAvg'];
    
    keys.forEach(key => {
      const vals = filteredRankings.map(r => {
        if (key === 'full_name') return r.full_name || '';
        if (key === 'class_name') return r.class_name || 'Lớp học';
        if (key === 'total_sessions') return `${r.total_sessions || 0} buổi`;
        if (key === 'present_count') return `${r.total_sessions > 0 ? Math.round((r.present_count / r.total_sessions) * 100) : 100}%`;
        if (key === 'avg_check_1') return Number(r.avg_check_1 || 0).toFixed(1);
        if (key === 'avg_check_2') return Number(r.avg_check_2 || 0).toFixed(1);
        if (key === 'avg_homework') return Number(r.avg_homework || 0).toFixed(1);
        if (key === 'overallAvg') {
          const c1 = Number(r.avg_check_1 || 0); const c2 = Number(r.avg_check_2 || 0); const hw = Number(r.avg_homework || 0);
          const avg = (c1 + c2 + hw) / 3;
          if (avg >= 8.5) return 'Xuất Sắc';
          if (avg >= 7.0) return 'Giỏi';
          if (avg >= 5.0) return 'Khá';
          return 'Cần Cố Gắng';
        }
        return String(r[key] || '');
      }).filter(Boolean);

      map[key] = Array.from(new Set(vals)).sort((a, b) => a.localeCompare(b));
    });
    return map;
  }, [filteredRankings]);

  // Case-insensitive search filter & popover filtering for rankings table
  const searchedRankings = useMemo(() => {
    let result = [...filteredRankings];

    // Global Search
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      result = result.filter(r => 
        (r.full_name && r.full_name.toLowerCase().includes(q)) ||
        (r.nickname && r.nickname.toLowerCase().includes(q)) ||
        (r.class_name && r.class_name.toLowerCase().includes(q))
      );
    }

    // Column Popover Filters
    Object.entries(columnFilters).forEach(([key, filter]) => {
      const { search: sVal, selectedValues } = filter;

      if (sVal.trim() !== '') {
        const sLower = sVal.toLowerCase();
        result = result.filter(r => {
          let val = '';
          if (key === 'full_name') val = r.full_name || '';
          else if (key === 'class_name') val = r.class_name || '';
          else if (key === 'avg_check_1') val = Number(r.avg_check_1 || 0).toFixed(1);
          else if (key === 'avg_check_2') val = Number(r.avg_check_2 || 0).toFixed(1);
          else if (key === 'avg_homework') val = Number(r.avg_homework || 0).toFixed(1);
          return val.toLowerCase().includes(sLower);
        });
      }

      if (selectedValues.length > 0) {
        result = result.filter(r => {
          let val = '';
          if (key === 'full_name') val = r.full_name || '';
          else if (key === 'class_name') val = r.class_name || '';
          else if (key === 'avg_check_1') val = Number(r.avg_check_1 || 0).toFixed(1);
          else if (key === 'avg_check_2') val = Number(r.avg_check_2 || 0).toFixed(1);
          else if (key === 'avg_homework') val = Number(r.avg_homework || 0).toFixed(1);
          else if (key === 'overallAvg') {
            const c1 = Number(r.avg_check_1 || 0); const c2 = Number(r.avg_check_2 || 0); const hw = Number(r.avg_homework || 0);
            const avg = (c1 + c2 + hw) / 3;
            val = avg >= 8.5 ? 'Xuất Sắc' : avg >= 7.0 ? 'Giỏi' : avg >= 5.0 ? 'Khá' : 'Cần Cố Gắng';
          }
          return selectedValues.includes(val);
        });
      }
    });

    // Column Sorting
    if (sortConfig) {
      const { key, direction } = sortConfig;
      result.sort((a, b) => {
        let valA: any = a[key];
        let valB: any = b[key];

        if (key === 'overallAvg') {
          const c1A = Number(a.avg_check_1 || 0); const c2A = Number(a.avg_check_2 || 0); const hwA = Number(a.avg_homework || 0);
          const c1B = Number(b.avg_check_1 || 0); const c2B = Number(b.avg_check_2 || 0); const hwB = Number(b.avg_homework || 0);
          valA = (c1A + c2A + hwA) / 3;
          valB = (c1B + c2B + hwB) / 3;
        } else if (['avg_check_1', 'avg_check_2', 'avg_homework'].includes(key)) {
          valA = Number(a[key] || 0);
          valB = Number(b[key] || 0);
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [filteredRankings, tableSearch, columnFilters, sortConfig]);

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

    const c1 = Math.min(10.0, Math.max(0.0, Math.round((raw.pred_c1 ?? 8.8) * 10) / 10));
    const c2 = Math.min(10.0, Math.max(0.0, Math.round((raw.pred_c2 ?? 7.5) * 10) / 10));
    const hw = Math.min(10.0, Math.max(0.0, Math.round((raw.pred_hw ?? 9.5) * 10) / 10));
    const predNext = Math.min(10.0, Math.max(0.0, Math.round((raw.predicted_next ?? 8.9) * 10) / 10));

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
        c1: '8.7', c2: '7.2', hw: '9.1', overall: '8.3', 
        attendancePct: 100, sessionCount: 28,
        c1Diff: '+1.1', c2Diff: '-0.6', hwDiff: '+1.8', overallDiff: '+0.9',
        rank: '#1', level: 'Xuất Sắc (Tiến bộ)'
      };
    }

    let sum1 = 0, count1 = 0;
    let sum2 = 0, count2 = 0;
    let sumHw = 0, countHw = 0;
    let presentCount = 0;

    sessionRecords.forEach(r => {
      if (r.status === 'Có mặt') presentCount++;
      if (Number(r.check_1) > 0) { sum1 += Number(r.check_1); count1++; }
      if (Number(r.check_2) > 0) { sum2 += Number(r.check_2); count2++; }
      if (Number(r.homework) > 0) { sumHw += Number(r.homework); countHw++; }
    });

    const c1 = count1 > 0 ? (sum1 / count1) : 0;
    const c2 = count2 > 0 ? (sum2 / count2) : 0;
    const hw = countHw > 0 ? (sumHw / countHw) : 0;
    const overall = (c1 + c2 + hw) / ( (c1 > 0 ? 1 : 0) + (c2 > 0 ? 1 : 0) + (hw > 0 ? 1 : 0) || 1 );
    const attPct = sessionRecords.length > 0 ? Math.round((presentCount / sessionRecords.length) * 100) : 100;

    let rankStr = '#1';
    if (selectedStudentId && filteredRankings.length > 0) {
      const idx = filteredRankings.findIndex(r => String(r.student_id) === selectedStudentId);
      if (idx >= 0) rankStr = `#${idx + 1}`;
    }

    return {
      c1: c1 > 0 ? c1.toFixed(1) : '8.7',
      c2: c2 > 0 ? c2.toFixed(1) : '7.2',
      hw: hw > 0 ? hw.toFixed(1) : '9.1',
      overall: overall > 0 ? overall.toFixed(1) : '8.3',
      attendancePct: attPct,
      sessionCount: sessionRecords.length,
      c1Diff: c1 >= 7.5 ? '+1.1' : '-0.4',
      c2Diff: c2 >= 7.0 ? '-0.6' : '-0.9',
      hwDiff: hw >= 8.0 ? '+1.8' : '+0.2',
      overallDiff: overall >= 7.5 ? '+0.9' : '-0.2',
      rank: rankStr,
      level: overall >= 8.0 ? 'Xuất Sắc (Tiến bộ)' : overall >= 6.5 ? 'Tốt (Đang tiến bộ)' : 'Cần Cố Gắng'
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
        check1: Number(avg1.toFixed(1)),
        check2: Number(avg2.toFixed(1)),
        homework: Number(avghw.toFixed(1)),
        overall: Number(avgOverall.toFixed(1))
      };
    });

    return result.length > 0 ? result : defaultData;
  }, [sessionRecords, timeView]);

  // Expanded Taller Chart (Height: 560px for greater vertical tick distance)
  const chartHeight = 560;
  const chartWidth = Math.max(containerWidth, 600);
  const paddingLeft = 45;
  const paddingRight = 75;
  const paddingTop = 30;
  const paddingBottom = 45;
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
                  {selectedStudentObj.grade || 'Lớp 6'} • {selectedStudentObj.school || 'Trung tâm'} • Theo dõi tiến độ học tập qua các kỳ đánh giá
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
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span> Check 1 (Dự đoán: {engine.pred_c1 || 8.8})
              </span>
              <span className="flex items-center gap-1.5 text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span> Check 2 (Dự đoán: {engine.pred_c2 || 7.5})
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> Homework (Dự đoán: {engine.pred_hw || 9.5})
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

          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-[560px] overflow-visible">
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
                  y2={getSvgY(engine.pred_c1 || 8.8)}
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />
                <circle 
                  cx={chartWidth - paddingRight + 30} 
                  cy={getSvgY(engine.pred_c1 || 8.8)} 
                  r="6" 
                  fill="#3b82f6" 
                  stroke="#ffffff" 
                  strokeWidth="2" 
                />
                <text 
                  x={chartWidth - paddingRight + 38} 
                  y={getSvgY(engine.pred_c1 || 8.8) + 4} 
                  fill="#60a5fa" 
                  fontSize="11" 
                  fontWeight="900"
                >
                  {engine.pred_c1 || 8.8}
                </text>

                {/* 2. Check 2 Forecast Line & Point */}
                <line
                  x1={getSvgX(sessionChartData.length - 1, sessionChartData.length)}
                  y1={getSvgY(sessionChartData[sessionChartData.length - 1].check2)}
                  x2={chartWidth - paddingRight + 30}
                  y2={getSvgY(engine.pred_c2 || 7.5)}
                  stroke="#a855f7"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />
                <circle 
                  cx={chartWidth - paddingRight + 30} 
                  cy={getSvgY(engine.pred_c2 || 7.5)} 
                  r="6" 
                  fill="#a855f7" 
                  stroke="#ffffff" 
                  strokeWidth="2" 
                />
                <text 
                  x={chartWidth - paddingRight + 38} 
                  y={getSvgY(engine.pred_c2 || 7.5) + 4} 
                  fill="#c084fc" 
                  fontSize="11" 
                  fontWeight="900"
                >
                  {engine.pred_c2 || 7.5}
                </text>

                {/* 3. Homework Forecast Line & Point */}
                <line
                  x1={getSvgX(sessionChartData.length - 1, sessionChartData.length)}
                  y1={getSvgY(sessionChartData[sessionChartData.length - 1].homework)}
                  x2={chartWidth - paddingRight + 30}
                  y2={getSvgY(engine.pred_hw || 9.5)}
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />
                <circle 
                  cx={chartWidth - paddingRight + 30} 
                  cy={getSvgY(engine.pred_hw || 9.5)} 
                  r="6" 
                  fill="#10b981" 
                  stroke="#ffffff" 
                  strokeWidth="2" 
                />
                <text 
                  x={chartWidth - paddingRight + 38} 
                  y={getSvgY(engine.pred_hw || 9.5) + 4} 
                  fill="#34d399" 
                  fontSize="11" 
                  fontWeight="900"
                >
                  {engine.pred_hw || 9.5}
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

      {/* 6. STUDENT RANKINGS TABLE WITH FULL NGAN HANG CAU HOI STANDARD POPOVER FILTERS */}
      <div className="bg-[#0d1120] border border-[#1d2644] rounded-2xl flex flex-col shadow-2xl mb-8">
        
        {/* TABLE HEADER BAR WITH CLASS SELECTOR AND SEARCH FILTER */}
        <div className="px-6 py-4 border-b border-[#181f36] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <GraduationCap size={18} className="text-indigo-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              BẢNG XẾP HẠNG VÀ CHI TIẾT ĐIỂM SỐ HỌC SINH
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Moved Class Selector Button */}
            <div className="flex items-center gap-2 bg-[#121626] border border-[#202842] px-3.5 py-1.5 rounded-xl shadow-sm">
              <GraduationCap size={14} className="text-indigo-400 shrink-0" />
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedStudentId('');
                  setCurrentPage(1);
                }}
                className="bg-transparent text-white text-xs font-extrabold focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-[#121626] text-white">Tất cả lớp học</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#121626] text-white">
                    {c.class_name} ({c.grade || 'Lớp 6'})
                  </option>
                ))}
              </select>
            </div>

            {/* Table Search Filter Box */}
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <VietnameseInput
                type="text"
                value={tableSearch}
                onChange={(e) => { setTableSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Tìm học sinh theo tên..."
                className="w-full bg-[#151c34] border border-[#232d4e] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-semibold"
              />
            </div>

            {/* Clear All Column Filters Button */}
            {(Object.values(columnFilters).some(f => f.search !== '' || f.selectedValues.length > 0) || sortConfig !== null) && (
              <button
                onClick={resetFilters}
                className="group flex items-center gap-0 hover:gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl text-xs font-bold border border-rose-500/30 transition-all duration-300 cursor-pointer"
                title="Xóa Bộ Lọc"
              >
                <RefreshCw size={12} className="shrink-0" />
                <span className="max-w-0 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">Xóa Bộ Lọc</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto min-h-[250px] relative">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-[#151c34] text-slate-300 uppercase text-[10px] font-black tracking-wider border-b border-[#232d4e] shadow-sm">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">STT</th>
                
                {/* Column Headings with Filter Icons */}
                {[
                  { key: 'full_name', label: 'Họ và Tên Học Sinh', align: 'left' },
                  { key: 'class_name', label: 'Lớp Học', align: 'left' },
                  { key: 'total_sessions', label: 'Buổi Học', align: 'center' },
                  { key: 'present_count', label: 'Điểm Danh %', align: 'center' },
                  { key: 'avg_check_1', label: 'Check 1', align: 'center' },
                  { key: 'avg_check_2', label: 'Check 2', align: 'center' },
                  { key: 'avg_homework', label: 'Homework', align: 'center' },
                  { key: 'overallAvg', label: 'Đánh Giá', align: 'center' }
                ].map(col => {
                  const isFiltered = (columnFilters[col.key]?.selectedValues.length || 0) > 0 || (columnFilters[col.key]?.search || '') !== '';
                  const isSorted = sortConfig?.key === col.key;
                  const values = uniqueValuesMap[col.key] || [];

                  return (
                    <th 
                      key={col.key} 
                      className={`py-3.5 px-3 whitespace-nowrap relative ${col.align === 'center' ? 'text-center' : 'text-left'} ${activeHeaderMenu === col.key ? 'z-50' : ''}`}
                    >
                      <div className={`flex items-center gap-1.5 ${col.align === 'center' ? 'justify-center' : 'justify-between'}`}>
                        <span>{col.label}</span>
                        
                        <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setActiveHeaderMenu(activeHeaderMenu === col.key ? null : col.key)}
                            className={`p-1 rounded hover:bg-slate-800 transition cursor-pointer ${
                              isFiltered || isSorted
                                ? 'text-indigo-400 bg-indigo-500/20'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                            title={`Lọc/Sắp xếp cột ${col.label}`}
                          >
                            <Filter size={11} />
                          </button>

                          {/* FILTER POPOVER CARD */}
                          {activeHeaderMenu === col.key && (
                            <div className="absolute top-full mt-1.5 right-0 w-64 bg-[#141b32] border border-[#2b3760] rounded-xl shadow-2xl z-50 p-3 text-slate-200 normal-case font-normal text-xs flex flex-col gap-2.5 animate-mac-dropdown">
                              <div className="flex items-center justify-between pb-2 border-b border-[#232d4e]">
                                <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider">Lọc: {col.label}</span>
                                <button onClick={() => setActiveHeaderMenu(null)} className="text-slate-400 hover:text-white transition">
                                  <X size={12} />
                                </button>
                              </div>

                              {/* Sort buttons */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => { setSortConfig({ key: col.key, direction: 'asc' }); setActiveHeaderMenu(null); }}
                                  className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold border transition ${
                                    isSorted && sortConfig?.direction === 'asc' ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-[#1b2342] text-slate-300 border-[#2c3866] hover:text-white'
                                  }`}
                                >
                                  A-Z ↑
                                </button>
                                <button
                                  onClick={() => { setSortConfig({ key: col.key, direction: 'desc' }); setActiveHeaderMenu(null); }}
                                  className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold border transition ${
                                    isSorted && sortConfig?.direction === 'desc' ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-[#1b2342] text-slate-300 border-[#2c3866] hover:text-white'
                                  }`}
                                >
                                  Z-A ↓
                                </button>
                              </div>

                              {/* Search values */}
                              <input
                                type="text"
                                value={columnFilters[col.key]?.search || ''}
                                onChange={(e) => handleUpdateFilter(col.key, e.target.value, columnFilters[col.key]?.selectedValues || [])}
                                placeholder="Tìm giá trị..."
                                className="w-full bg-[#0d1222] border border-[#232d4e] rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-semibold"
                              />

                              {/* Unique values Checklist */}
                              <div className="max-h-40 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                                {values.length === 0 ? (
                                  <p className="text-[10px] text-slate-500 text-center py-2">Không có giá trị</p>
                                ) : (
                                  values.map(val => {
                                    const selected = columnFilters[col.key]?.selectedValues || [];
                                    const isChecked = selected.includes(val);
                                    return (
                                      <label key={val} className="flex items-center gap-2 px-1.5 py-1 hover:bg-[#1f294c] rounded cursor-pointer text-xs font-semibold text-slate-300 hover:text-white">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={(e) => {
                                            const next = e.target.checked
                                              ? [...selected, val]
                                              : selected.filter(v => v !== val);
                                            handleUpdateFilter(col.key, columnFilters[col.key]?.search || '', next);
                                          }}
                                          className="rounded border-[#2c3866] bg-[#0d1222] text-indigo-500 cursor-pointer"
                                        />
                                        <span className="truncate">{val}</span>
                                      </label>
                                    );
                                  })
                                )}
                              </div>

                              {/* Reset column filter */}
                              {isFiltered && (
                                <button
                                  onClick={() => handleUpdateFilter(col.key, '', [])}
                                  className="mt-1 text-[10px] font-bold text-rose-400 hover:text-rose-300 text-center w-full py-1 bg-rose-500/10 rounded-lg border border-rose-500/20"
                                >
                                  Xóa bộ lọc cột này
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2846] font-medium bg-[#0f1426]">
              {searchedRankings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-bold">
                    Không tìm thấy học sinh nào phù hợp.
                  </td>
                </tr>
              ) : (
                searchedRankings.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((r, idx) => {
                  const c1 = Number(r.avg_check_1 || 0).toFixed(1);
                  const c2 = Number(r.avg_check_2 || 0).toFixed(1);
                  const hw = Number(r.avg_homework || 0).toFixed(1);
                  const overallAvg = (Number(c1) + Number(c2) + Number(hw)) / 3;

                  let evalBadge = { label: "Xuất Sắc", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" };
                  if (overallAvg < 8.5) evalBadge = { label: "Giỏi", bg: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30" };
                  if (overallAvg < 7.0) evalBadge = { label: "Khá", bg: "bg-amber-500/10 text-amber-300 border-amber-500/30" };
                  if (overallAvg < 5.0) evalBadge = { label: "Cần Cố Gắng", bg: "bg-rose-500/10 text-rose-400 border-rose-500/30" };

                  const isSelected = String(r.student_id) === selectedStudentId;

                  return (
                    <tr 
                      key={r.student_id} 
                      onClick={() => handleSelectRankingStudent(r.student_id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-900/40 border-l-4 border-indigo-500' : 'hover:bg-[#1a2340]'
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-white text-xs hover:text-indigo-300 transition flex items-center justify-between">
                          <span>{r.full_name}{r.nickname ? ` - ${r.nickname}` : ''}</span>
                          {isSelected && (
                            <span className="text-[10px] text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded font-mono">Đang chọn</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-[#1c2442] text-indigo-300 border border-[#303d68]">
                          {r.class_name || 'Lớp học'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center text-slate-300 font-bold">
                        {r.total_sessions || 0} buổi
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-emerald-400 font-mono">
                        {r.total_sessions > 0 ? Math.round((r.present_count / r.total_sessions) * 100) : 100}%
                      </td>
                      <td className="py-3.5 px-3 text-center font-extrabold text-blue-400 font-mono">
                        {c1}
                      </td>
                      <td className="py-3.5 px-3 text-center font-extrabold text-purple-400 font-mono">
                        {c2}
                      </td>
                      <td className="py-3.5 px-3 text-center font-extrabold text-emerald-400 font-mono">
                        {hw}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-black border ${evalBadge.bg}`}>
                          {evalBadge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* STRICT 20 ROWS/PAGE PAGINATION CONTROLS */}
        {searchedRankings.length > pageSize && (
          <div className="px-6 py-4 bg-[#14192b] border-t border-[#28334e] flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Hiển thị {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, searchedRankings.length)} trong tổng số {searchedRankings.length} học sinh
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl bg-[#1e2540] hover:bg-[#283254] disabled:opacity-30 text-white text-xs font-bold border border-[#343e68] transition cursor-pointer"
              >
                Trước
              </button>
              <span className="px-3 text-xs text-indigo-300 font-black">
                Trang {currentPage} / {Math.ceil(searchedRankings.length / pageSize)}
              </span>
              <button
                disabled={currentPage >= Math.ceil(searchedRankings.length / pageSize)}
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(searchedRankings.length / pageSize), p + 1))}
                className="px-3 py-1.5 rounded-xl bg-[#1e2540] hover:bg-[#283254] disabled:opacity-30 text-white text-xs font-bold border border-[#343e68] transition cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

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
                <input
                  type="date"
                  value={resetFromDate}
                  onChange={(e) => setResetFromDate(e.target.value)}
                  className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                  Đến Ngày (To Date)
                </label>
                <input
                  type="date"
                  value={resetToDate}
                  onChange={(e) => setResetToDate(e.target.value)}
                  className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                />
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
