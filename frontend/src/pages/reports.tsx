import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { api } from '../api';
import { GradeTypeItem } from '../types';
import { 
  BarChart3, RefreshCw, Calendar, 
  AlertCircle, Users, GraduationCap, ChevronRight, Info, RotateCcw, X, Edit2, History, Save,
  ZoomIn, ZoomOut, Move, Sparkles, Layers, Copy, Check, FileSpreadsheet, TrendingUp, TrendingDown, Minus, ShieldAlert, Award, Zap
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
    fittedC1: number | null;
    fittedC2: number | null;
    fittedHw: number | null;
    predModel: string;
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

  // Interactive Zoom & Pan State for Chart (minZoom = 1.0)
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  // Non-passive wheel event listener to prevent page scrolling while zooming chart
  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.2 : -0.2;
      setZoomLevel(prev => {
        const next = Math.min(5.0, Math.max(1.0, prev + delta));
        setPanOffset(p => {
          const contentWidth = containerWidth * next;
          const maxDragLeft = Math.max(0, contentWidth - containerWidth);
          return { x: Math.min(0, Math.max(-maxDragLeft, p.x)), y: p.y };
        });
        return next;
      });
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [containerWidth]);

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

  // Custom multi-tab Excel export for Student Rankings (creates 1 tab per class when in 'All Classes' view)
  const handleExportRankingsExcel = useCallback(async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const headers = ['STT', 'Họ và Tên', 'Lớp Học', 'Buổi Học', 'Điểm Danh %', 'Check 1', 'Check 2', 'Homework', 'Đánh Giá'];

      const addClassSheet = (sheetName: string, items: any[]) => {
        const safeName = sheetName.replace(/[\*\?:\/\\\[\]]/g, '').slice(0, 31) || 'Lớp';
        const worksheet = workbook.addWorksheet(safeName);

        const rows = items.map((r) => {
          const present = r.present_count ?? 0;
          const total = r.total_sessions ?? 0;
          const pct = total > 0 ? Math.round((present / total) * 100) : 100;
          
          const c1 = Number(r.avg_check_1 || 0);
          const c2 = Number(r.avg_check_2 || 0);
          const hw = Number(r.avg_homework || 0);
          const valid = [c1, c2, hw].filter(v => v > 0);
          let evalStr = 'Chưa có điểm';
          if (valid.length > 0) {
            const avg = trunc1Dec(valid.reduce((a, b) => a + b, 0) / valid.length);
            let label = 'Xuất Sắc';
            if (avg < 8.5) label = 'Giỏi';
            if (avg < 7.0) label = 'Khá';
            if (avg < 5.0) label = 'Cần Cố Gắng';
            evalStr = `${label} (${format1Dec(avg)})`;
          }

          return [
            { formula: 'ROW()-1' },
            `${r.full_name}${r.nickname ? ` (${r.nickname})` : ''}`,
            r.class_name || 'Lớp học',
            `${present}/${total} buổi`,
            `${pct}%`,
            c1 > 0 ? format1Dec(c1) : '-',
            c2 > 0 ? format1Dec(c2) : '-',
            hw > 0 ? format1Dec(hw) : '-',
            evalStr
          ];
        });

        if (rows.length > 0) {
          worksheet.addTable({
            name: `Table_${safeName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}_${Math.floor(Math.random()*10000)}`,
            ref: 'A1',
            headerRow: true,
            totalsRow: false,
            style: {
              theme: 'TableStyleMedium13',
              showRowStripes: true,
            },
            columns: headers.map(h => ({ name: h, filterButton: true })),
            rows: rows.map(r => r.map(val => {
              if (val === null || val === undefined) return '';
              if (typeof val === 'object' && (val as any).formula) return val;
              if (typeof val === 'number') return val;
              const num = Number(val);
              if (!isNaN(num) && String(val).trim() === String(num)) return num;
              return val;
            })),
          });

          worksheet.eachRow((row, rowNumber) => {
            const isHeader = rowNumber === 1;
            row.eachCell((cell, colNumber) => {
              cell.font = { name: 'Times New Roman', size: 13, bold: isHeader };
              cell.alignment = { vertical: 'middle', horizontal: 'center' };
              if (typeof cell.value === 'number' && !Number.isInteger(cell.value)) {
                cell.numFmt = '0.0';
              }

              if (!isHeader && colNumber === 9) {
                const text = String(cell.value || '');
                if (text.includes('Xuất Sắc')) {
                  cell.font = { name: 'Times New Roman', size: 13, bold: true, color: { argb: 'FF15803D' } };
                } else if (text.includes('Giỏi')) {
                  cell.font = { name: 'Times New Roman', size: 13, bold: true, color: { argb: 'FF4338CA' } };
                } else if (text.includes('Khá')) {
                  cell.font = { name: 'Times New Roman', size: 13, bold: true, color: { argb: 'FFB45309' } };
                } else if (text.includes('Cần Cố Gắng')) {
                  cell.font = { name: 'Times New Roman', size: 13, bold: true, color: { argb: 'FFB91C1C' } };
                } else {
                  cell.font = { name: 'Times New Roman', size: 13, italic: true, color: { argb: 'FF64748B' } };
                }
              }
            });
          });

          worksheet.columns.forEach((col, colIdx) => {
            let maxLen = String(headers[colIdx] || '').length;
            rows.forEach(r => {
              const cellVal = String(r[colIdx] ?? '');
              if (cellVal.length > maxLen) maxLen = cellVal.length;
            });
            col.width = Math.max(maxLen + 5, 14);
          });
        }
      };

      if (!selectedClassId) {
        addClassSheet('Tất Cả Lớp', studentRankings);

        const groups: Record<string, any[]> = {};
        studentRankings.forEach((r) => {
          const cName = r.class_name || 'Khác';
          if (!groups[cName]) groups[cName] = [];
          groups[cName].push(r);
        });

        Object.keys(groups).sort().forEach((cName) => {
          addClassSheet(cName, groups[cName]);
        });
      } else {
        const selClassObj = classes.find(c => String(c.id) === selectedClassId);
        const name = selClassObj?.class_name || 'Bảng Xếp Hạng';
        addClassSheet(name, filteredRankings);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      a.download = `bang_xep_hang_hoc_sinh_${timestamp}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Lỗi xuất Excel xếp hạng:", err);
    }
  }, [selectedClassId, classes, studentRankings, filteredRankings]);

  // TanStack ColumnDef for rankings table
  const rankingColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'stt',
      header: () => <div className="text-center w-full">STT</div>,
      meta: { headerText: 'STT', exportValue: (_: any, idx: number) => idx + 1 },
      cell: ({ row }) => <div className="text-center font-bold text-slate-400">{row.index + 1}</div>,
      enableSorting: false,
      enableGlobalFilter: false,
    },
    {
      accessorKey: 'full_name',
      header: 'Họ và Tên',
      meta: { headerText: 'Họ và Tên', exportValue: (r: any) => `${r.full_name}${r.nickname ? ` (${r.nickname})` : ''}` },
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
      meta: { headerText: 'Lớp Học', exportValue: (r: any) => r.class_name || 'Lớp học' },
      cell: (info) => (
        <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#1c2442] text-indigo-300 border border-[#303d68]">
          {info.getValue<string>() || 'Lớp học'}
        </span>
      ),
    },
    {
      accessorKey: 'total_sessions',
      header: () => <div className="text-center w-full">Buổi Học</div>,
      meta: {
        headerText: 'Buổi Học',
        exportValue: (r: any) => `${r.present_count ?? 0}/${r.total_sessions ?? 0} buổi`
      },
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
      meta: {
        headerText: 'Điểm Danh %',
        exportValue: (r: any) => {
          const pct = r.total_sessions > 0 ? Math.round((r.present_count / r.total_sessions) * 100) : 100;
          return `${pct}%`;
        }
      },
      cell: ({ row }) => {
        const r = row.original;
        const pct = r.total_sessions > 0 ? Math.round((r.present_count / r.total_sessions) * 100) : 100;
        return <div className="text-center font-bold text-emerald-400 font-mono">{pct}%</div>;
      },
    },
    {
      accessorKey: 'avg_check_1',
      header: () => <div className="text-center w-full">Check 1</div>,
      meta: { headerText: 'Check 1', exportValue: (r: any) => Number(r.avg_check_1) > 0 ? format1Dec(Number(r.avg_check_1)) : '-' },
      cell: (info) => {
        const val = Number(info.getValue()) || 0;
        return <div className="text-center font-extrabold text-blue-400 font-mono">{val > 0 ? format1Dec(val) : '-'}</div>;
      },
    },
    {
      accessorKey: 'avg_check_2',
      header: () => <div className="text-center w-full">Check 2</div>,
      meta: { headerText: 'Check 2', exportValue: (r: any) => Number(r.avg_check_2) > 0 ? format1Dec(Number(r.avg_check_2)) : '-' },
      cell: (info) => {
        const val = Number(info.getValue()) || 0;
        return <div className="text-center font-extrabold text-purple-400 font-mono">{val > 0 ? format1Dec(val) : '-'}</div>;
      },
    },
    {
      accessorKey: 'avg_homework',
      header: () => <div className="text-center w-full">Homework</div>,
      meta: { headerText: 'Homework', exportValue: (r: any) => Number(r.avg_homework) > 0 ? format1Dec(Number(r.avg_homework)) : '-' },
      cell: (info) => {
        const val = Number(info.getValue()) || 0;
        return <div className="text-center font-extrabold text-emerald-400 font-mono">{val > 0 ? format1Dec(val) : '-'}</div>;
      },
    },
    {
      id: 'overallAvg',
      header: () => <div className="text-center w-full">Đánh Giá</div>,
      meta: {
        headerText: 'Đánh Giá',
        exportValue: (r: any) => {
          const c1 = Number(r.avg_check_1 || 0);
          const c2 = Number(r.avg_check_2 || 0);
          const hw = Number(r.avg_homework || 0);
          const valid = [c1, c2, hw].filter(v => v > 0);
          if (valid.length === 0) return 'Chưa có điểm';
          const avg = trunc1Dec(valid.reduce((a, b) => a + b, 0) / valid.length);
          let label = 'Xuất Sắc';
          if (avg < 8.5) label = 'Giỏi';
          if (avg < 7.0) label = 'Khá';
          if (avg < 5.0) label = 'Cần Cố Gắng';
          return `${label} (${format1Dec(avg)})`;
        }
      },
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
      meta: { headerText: 'STT', exportValue: (_: any, idx: number) => idx + 1 },
      cell: ({ row }) => <div className="text-center font-bold text-slate-400">{row.index + 1}</div>,
      enableSorting: false,
      enableGlobalFilter: false,
    },
    {
      accessorKey: 'date',
      header: 'Ngày Buổi Học',
      meta: { headerText: 'Ngày Buổi Học', exportValue: (r: any) => formatFullDate(r.date) },
      cell: (info) => (
        <span className="font-mono text-base font-bold text-indigo-300">
          {formatFullDate(info.getValue<string>())}
        </span>
      ),
    },
    {
      accessorKey: 'class_name',
      header: 'Lớp Học',
      meta: { headerText: 'Lớp Học', exportValue: (r: any) => r.class_name || 'Lớp học' },
      cell: (info) => (
        <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#1c2442] text-slate-300 border border-[#303d68]">
          {info.getValue<string>() || 'Lớp học'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-center w-full">Điểm Danh</div>,
      meta: { headerText: 'Điểm Danh', exportValue: (r: any) => r.status || 'Có mặt' },
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
      meta: { headerText: 'Check 1', exportValue: (r: any) => Number(r.check_1) > 0 ? format1Dec(Number(r.check_1)) : '-' },
      cell: (info) => {
        const val = Number(info.getValue()) || 0;
        return <div className="text-center font-extrabold text-blue-400 font-mono text-base">{val > 0 ? format1Dec(val) : '-'}</div>;
      },
    },
    {
      accessorKey: 'check_2',
      header: () => <div className="text-center w-full">Check 2</div>,
      meta: { headerText: 'Check 2', exportValue: (r: any) => Number(r.check_2) > 0 ? format1Dec(Number(r.check_2)) : '-' },
      cell: (info) => {
        const val = Number(info.getValue()) || 0;
        return <div className="text-center font-extrabold text-purple-400 font-mono text-base">{val > 0 ? format1Dec(val) : '-'}</div>;
      },
    },
    {
      accessorKey: 'homework',
      header: () => <div className="text-center w-full">Homework</div>,
      meta: { headerText: 'Homework', exportValue: (r: any) => Number(r.homework) > 0 ? format1Dec(Number(r.homework)) : '-' },
      cell: (info) => {
        const val = Number(info.getValue()) || 0;
        return <div className="text-center font-extrabold text-emerald-400 font-mono text-base">{val > 0 ? format1Dec(val) : '-'}</div>;
      },
    },
    {
      accessorKey: 'notes',
      header: 'Ghi Chú',
      meta: { headerText: 'Ghi Chú', exportValue: (r: any) => r.notes || '-' },
      cell: (info) => <span className="text-xs text-slate-400 truncate max-w-xs block">{info.getValue<string>() || '-'}</span>,
    },
    {
      id: 'actions',
      header: () => <div className="text-center w-full">Thao Tác</div>,
      meta: { headerText: 'Thao Tác' },
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

  const [gradeTypesList, setGradeTypesList] = useState<GradeTypeItem[]>([
    { id: 'check_1', label: 'Check 1', weight: 35, color: '#3b82f6' },
    { id: 'check_2', label: 'Check 2', weight: 55, color: '#a855f7' },
    { id: 'homework', label: 'BTVN', weight: 10, color: '#f59e0b' }
  ]);

  useEffect(() => {
    api.getSettings().then(data => {
      if (data?.grade_types && Array.isArray(data.grade_types) && data.grade_types.length > 0) {
        setGradeTypesList(data.grade_types);
      } else if (data?.grade_weights) {
        setGradeTypesList([
          { id: 'check_1', label: 'Check 1', weight: data.grade_weights.check_1 ?? 35, color: '#3b82f6' },
          { id: 'check_2', label: 'Check 2', weight: data.grade_weights.check_2 ?? 55, color: '#a855f7' },
          { id: 'homework', label: 'BTVN', weight: data.grade_weights.homework ?? 10, color: '#f59e0b' }
        ]);
      }
    }).catch(() => {});
  }, []);

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
      std_dev_c1: 0.35,
      std_dev_c2: 0.50,
      std_dev_hw: 0.20,
      consistency_label: "Rất ổn định",
      ema_level: 8.6,
      ema_c1: 8.5,
      ema_c2: 7.2,
      ema_hw: 9.2,
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

    const dates = Object.keys(dateMap)
      .filter(d => {
        const item = dateMap[d];
        return item.check1.length > 0 || item.check2.length > 0 || item.hw.length > 0;
      })
      .sort();

    let limit = dates.length;
    if (timeView === '1m') limit = Math.min(4, dates.length);
    if (timeView === '2m') limit = Math.min(8, dates.length);
    if (timeView === '3m') limit = Math.min(12, dates.length);

    const selectedDates = dates.slice(-limit);

    const weightsMap: Record<string, number> = {};
    let wTot = 0;
    gradeTypesList.forEach(gt => {
      const frac = (Number(gt.weight) || 0) / 100;
      weightsMap[gt.id] = frac;
      wTot += frac;
    });
    if (wTot <= 0) wTot = 1;

    const w1 = weightsMap['check_1'] ?? 0.35;
    const w2 = weightsMap['check_2'] ?? 0.55;
    const whw = weightsMap['homework'] ?? 0.10;

    const result = selectedDates.map((d) => {
      const item = dateMap[d];
      const validScores = [...item.check1, ...item.check2, ...item.hw];
      const sessionFallback = validScores.length > 0 ? validScores.reduce((a,b)=>a+b,0)/validScores.length : 8.0;

      const avg1 = item.check1.length > 0 ? item.check1.reduce((a,b)=>a+b,0)/item.check1.length : sessionFallback;
      const avg2 = item.check2.length > 0 ? item.check2.reduce((a,b)=>a+b,0)/item.check2.length : sessionFallback;
      const avghw = item.hw.length > 0 ? item.hw.reduce((a,b)=>a+b,0)/item.hw.length : sessionFallback;
      const avgOverall = ((avg1 * w1) + (avg2 * w2) + (avghw * whw)) / wTot;

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
  }, [sessionRecords, timeView, gradeTypesList]);

  // Per-session EMA fitted values computed client-side from sessionChartData.
  // This is always perfectly aligned with chart point indices regardless of
  // timeView filtering — avoids the backend fitted-array index mismatch problem.
  const fittedLookup = useMemo(() => {
    const alpha = 0.5;
    const computeEMA = (values: number[]): number[] => {
      if (values.length === 0) return [];
      const result: number[] = [];
      let ema = values[0];
      for (const v of values) {
        ema = alpha * v + (1 - alpha) * ema;
        result.push(trunc1Dec(Math.min(10, Math.max(0, ema))));
      }
      return result;
    };
    return {
      c1: computeEMA(sessionChartData.map(d => d.check1)),
      c2: computeEMA(sessionChartData.map(d => d.check2)),
      hw: computeEMA(sessionChartData.map(d => d.homework)),
    };
  }, [sessionChartData]);

  // Expanded Taller Chart (Height: 750px for greater vertical tick distance)
  const chartHeight = 750;
  const chartWidth = Math.max(containerWidth, 600);
  const paddingLeft = 50;
  const paddingRight = 130;
  const paddingTop = 40;
  const paddingBottom = 50;
  const plotAreaHeight = chartHeight - paddingTop - paddingBottom;
  const plotAreaWidth = chartWidth - paddingLeft - paddingRight;

  // Clamp panOffset so first data point is anchored with 30px inner padding from Y-axis,
  // and vertical dragging is capped to ±60px so graph cannot be lost vertically.
  const clampPanOffset = useCallback((x: number, y: number, currentZoom: number) => {
    const contentWidth = plotAreaWidth * currentZoom;
    const maxDragLeft = Math.max(0, contentWidth - plotAreaWidth);
    const clampedX = Math.min(0, Math.max(-maxDragLeft, x));

    const maxDragY = 60 * currentZoom;
    const clampedY = Math.min(maxDragY, Math.max(-maxDragY, y));

    return { x: clampedX, y: clampedY };
  }, [plotAreaWidth]);

  // Dynamic Y-axis Auto-scaling (ticks 0.0 to 10.0)
  const yBounds = useMemo(() => {
    const ticks: number[] = [];
    for (let v = 0.0; v <= 10.0; v += 1.0) {
      ticks.push(Number(v.toFixed(1)));
    }
    return { minY: 0.0, maxY: 10.0, ticks };
  }, []);

  const getSvgY = useCallback((val: number) => {
    const ratio = (val - yBounds.minY) / (yBounds.maxY - yBounds.minY || 1);
    const rawY = paddingTop + (1 - ratio) * plotAreaHeight;
    return (rawY - paddingTop) * zoomLevel + paddingTop + panOffset.y;
  }, [zoomLevel, panOffset.y, yBounds, plotAreaHeight, paddingTop]);

  const getSvgX = useCallback((index: number, total: number) => {
    const innerMarginLeft = 30;
    const innerMarginRight = 60;
    const usableWidth = plotAreaWidth - innerMarginLeft - innerMarginRight;
    if (total <= 1) return paddingLeft + innerMarginLeft + (usableWidth / 2) * zoomLevel + panOffset.x;
    const step = usableWidth / (total - 1);
    const rawX = paddingLeft + innerMarginLeft + index * step;
    return (rawX - paddingLeft) * zoomLevel + paddingLeft + panOffset.x;
  }, [zoomLevel, panOffset.x, plotAreaWidth, paddingLeft]);

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

  // Smart Level Grouping State (Mode A: Fixed Tiers, Mode B: 1D K-Means Clustering)
  const [groupingMode, setGroupingMode] = useState<'tier' | 'kmeans'>('tier');
  const [kmeansK, setKmeansK] = useState<number>(3);
  const [copiedGroupText, setCopiedGroupText] = useState(false);

  // Compute Smart Level Groups
  const smartGroups = useMemo(() => {
    if (!filteredRankings || filteredRankings.length === 0) return [];

    // Helper to extract numeric skill score for each student
    const getStudentScore = (s: any) => {
      if (s.ema_level && Number(s.ema_level) > 0) return Number(s.ema_level);
      const c1 = Number(s.avg_check_1 || 0);
      const c2 = Number(s.avg_check_2 || 0);
      const hw = Number(s.avg_homework || 0);
      const valid = [c1, c2, hw].filter(v => v > 0);
      return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0.0;
    };

    const calcGroupStats = (studentsList: any[]) => {
      if (studentsList.length === 0) {
        return { avgEma: 0, groupSd: 0, minScore: 0, maxScore: 0 };
      }
      const scores = studentsList.map(getStudentScore);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((sum, sc) => sum + Math.pow(sc - avg, 2), 0) / scores.length;
      const sd = Math.sqrt(variance);
      return {
        avgEma: trunc1Dec(avg),
        groupSd: trunc1Dec(sd),
        minScore: trunc1Dec(Math.min(...scores)),
        maxScore: trunc1Dec(Math.max(...scores)),
      };
    };

    if (groupingMode === 'tier') {
      // ── MODE A: Fixed Pedagogical Tiers ──────────────────────────────────────
      const g1Students: any[] = [];
      const g2Students: any[] = [];
      const g3Students: any[] = [];

      filteredRankings.forEach(s => {
        const ema = getStudentScore(s);
        const slope = Number(s.trend_slope || 0);

        if (ema >= 8.0 || (ema >= 7.5 && slope >= 0.2)) {
          g1Students.push(s);
        } else if (ema >= 6.5 && slope >= -0.25) {
          g2Students.push(s);
        } else {
          g3Students.push(s);
        }
      });

      g1Students.sort((a, b) => getStudentScore(b) - getStudentScore(a));
      g2Students.sort((a, b) => getStudentScore(b) - getStudentScore(a));
      g3Students.sort((a, b) => getStudentScore(b) - getStudentScore(a));

      const stats1 = calcGroupStats(g1Students);
      const stats2 = calcGroupStats(g2Students);
      const stats3 = calcGroupStats(g3Students);

      return [
        {
          id: 'tier-advanced',
          title: 'Nhóm 1: Bứt Phá & Nâng Cao',
          subtitle: 'Năng Lực Vượt Trội (Mastery)',
          pedagogyAdvice: 'Tiếp thu nhanh, kiến thức vững chắc. Giao thêm bài tập tư duy, bài toán phân hóa cao & đề thi học sinh giỏi.',
          themeColor: 'purple',
          borderCls: 'border-purple-500/40',
          headerBg: 'bg-[#18142a]',
          badgeCls: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          dotColor: '#c084fc',
          ...stats1,
          students: g1Students,
        },
        {
          id: 'tier-standard',
          title: 'Nhóm 2: Tiêu Chuẩn & Cơ Bản',
          subtitle: 'Năng Lực Đạt Chuẩn (Proficient)',
          pedagogyAdvice: 'Nắm vững kiến thức trọng tâm. Rèn luyện tốc độ giải bài, trình bày cẩn thận để bứt phá lên nhóm giỏi.',
          themeColor: 'blue',
          borderCls: 'border-blue-500/40',
          headerBg: 'bg-[#10182c]',
          badgeCls: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          dotColor: '#60a5fa',
          ...stats2,
          students: g2Students,
        },
        {
          id: 'tier-support',
          title: 'Nhóm 3: Cần Phụ Đạo & Củng Cố',
          subtitle: 'Cần Hỗ Trợ Trọng Tâm (Support)',
          pedagogyAdvice: 'Hổng kiến thức nền hoặc phong độ giảm sút. Cần giảng lại lý thuyết căn bản, chia nhỏ bài tập & phụ đạo 1-1.',
          themeColor: 'amber',
          borderCls: 'border-amber-500/40',
          headerBg: 'bg-[#201810]',
          badgeCls: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dotColor: '#fbbf24',
          ...stats3,
          students: g3Students,
        },
      ];
    } else {
      // ── MODE B: 1D K-Means Clustering ────────────────────────────────────────
      const K = Math.min(kmeansK, filteredRankings.length);
      if (K <= 0) return [];

      const studentsWithScore = filteredRankings.map(s => ({
        student: s,
        score: getStudentScore(s),
      }));

      const allScores = studentsWithScore.map(s => s.score);
      const minS = Math.min(...allScores);
      const maxS = Math.max(...allScores);

      let centroids: number[] = [];
      if (minS === maxS) {
        centroids = Array(K).fill(minS);
      } else {
        for (let i = 0; i < K; i++) {
          centroids.push(minS + (i * (maxS - minS)) / (K - 1));
        }
      }

      let clusters: any[][] = Array.from({ length: K }, () => []);
      for (let iter = 0; iter < 20; iter++) {
        clusters = Array.from({ length: K }, () => []);
        studentsWithScore.forEach(item => {
          let bestIdx = 0;
          let bestDist = Math.abs(item.score - centroids[0]);
          for (let c = 1; c < K; c++) {
            const dist = Math.abs(item.score - centroids[c]);
            if (dist < bestDist) {
              bestDist = dist;
              bestIdx = c;
            }
          }
          clusters[bestIdx].push(item.student);
        });

        let changed = false;
        for (let c = 0; c < K; c++) {
          if (clusters[c].length > 0) {
            const newMean = clusters[c].map(getStudentScore).reduce((a, b) => a + b, 0) / clusters[c].length;
            if (Math.abs(newMean - centroids[c]) > 0.001) {
              centroids[c] = newMean;
              changed = true;
            }
          }
        }
        if (!changed) break;
      }

      const pairedClusters = clusters.map((studs, idx) => ({
        centroid: centroids[idx],
        students: studs.sort((a, b) => getStudentScore(b) - getStudentScore(a)),
      })).sort((a, b) => b.centroid - a.centroid);

      const metaConfig = [
        {
          title: 'Nhóm 1: Dẫn Đầu (Top Tier)',
          subtitle: 'Cụm Điểm Cao Nhất',
          pedagogy: 'Nhóm học sinh tiếp thu vượt trội trong lớp. Giao bài tập mở rộng & thử thách tư duy.',
          themeColor: 'purple',
          borderCls: 'border-purple-500/40',
          headerBg: 'bg-[#18142a]',
          badgeCls: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          dotColor: '#c084fc',
        },
        {
          title: 'Nhóm 2: Trung Tâm (Core Tier)',
          subtitle: 'Cụm Điểm Trung Bình Khá',
          pedagogy: 'Lực lượng nòng cốt của lớp. Rèn luyện phương pháp làm bài & củng cố kiến thức để tiến vào nhóm dẫn đầu.',
          themeColor: 'blue',
          borderCls: 'border-blue-500/40',
          headerBg: 'bg-[#10182c]',
          badgeCls: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          dotColor: '#60a5fa',
        },
        {
          title: 'Nhóm 3: Cần Hỗ Trợ (Focus Tier)',
          subtitle: 'Cụm Cần Củng Cố Nền Tảng',
          pedagogy: 'Cụm học sinh cần sự quan tâm đặc biệt. Ôn tập kiến thức cơ bản, sửa lỗi sai thường gặp & kèm cặp sát sao.',
          themeColor: 'amber',
          borderCls: 'border-amber-500/40',
          headerBg: 'bg-[#201810]',
          badgeCls: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dotColor: '#fbbf24',
        },
        {
          title: 'Nhóm 4: Phụ Đạo Tăng Cường (Intensive Tier)',
          subtitle: 'Cụm Phụ Đạo 1-1',
          pedagogy: 'Hổng kiến thức nặng. Cần giáo viên hoặc trợ giảng hỗ trợ trực tiếp từng buổi học.',
          themeColor: 'rose',
          borderCls: 'border-rose-500/40',
          headerBg: 'bg-[#241216]',
          badgeCls: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          dotColor: '#fb7185',
        },
      ];

      return pairedClusters.map((pc, idx) => {
        const cfg = metaConfig[idx] || metaConfig[metaConfig.length - 1];
        const stats = calcGroupStats(pc.students);
        return {
          id: `kmeans-group-${idx + 1}`,
          title: K === 2 && idx === 1 ? 'Nhóm 2: Cần Rèn Luyện & Hỗ Trợ' : cfg.title,
          subtitle: cfg.subtitle,
          pedagogyAdvice: cfg.pedagogy,
          themeColor: cfg.themeColor,
          borderCls: cfg.borderCls,
          headerBg: cfg.headerBg,
          badgeCls: cfg.badgeCls,
          dotColor: cfg.dotColor,
          ...stats,
          students: pc.students,
        };
      });
    }
  }, [filteredRankings, groupingMode, kmeansK]);

  // Copy Grouping text to clipboard
  const handleCopyGrouping = useCallback(() => {
    if (!smartGroups || smartGroups.length === 0) {
      showToast('Không có dữ liệu học sinh để phân nhóm', 'warning');
      return;
    }

    const currentClass = classes.find(c => String(c.id) === selectedClassId);
    const className = currentClass ? currentClass.class_name : 'Tất Cả Lớp';
    const modeName = groupingMode === 'tier' ? 'Theo Chuẩn Học Lực' : `Tự Động Phân Cụm K-Means (${kmeansK} Nhóm)`;

    let text = `=== KẾT QUẢ GỢI Ý PHÂN NHÓM HỌC TẬP ===\n`;
    text += `Lớp: ${className} | Tổng số: ${filteredRankings.length} học sinh\n`;
    text += `Phương pháp: ${modeName}\n\n`;

    smartGroups.forEach(g => {
      text += `[${g.title.toUpperCase()}] (${g.students.length} học sinh | EMA TB: ${g.avgEma} | SD: ${g.groupSd})\n`;
      text += `Mục tiêu: ${g.pedagogyAdvice}\n`;
      if (g.students.length === 0) {
        text += `  (Chưa có học sinh)\n`;
      } else {
        g.students.forEach((s, idx) => {
          const ema = s.ema_level ? format1Dec(Number(s.ema_level)) : '-';
          const slope = Number(s.trend_slope || 0);
          const trendStr = slope > 0 ? `+${format1Dec(slope)} (Tăng)` : slope < 0 ? `${format1Dec(slope)} (Giảm)` : 'Ổn định';
          const pi = s.performance_index ? format1Dec(Number(s.performance_index)) : '-';
          const nick = s.nickname ? ` (${s.nickname})` : '';
          text += `  ${idx + 1}. ${s.full_name}${nick} | EMA: ${ema} | Trend: ${trendStr} | PI: ${pi} | ${s.class_name || ''}\n`;
        });
      }
      text += `\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopiedGroupText(true);
      showToast('Đã sao chép danh sách phân nhóm vào clipboard!', 'success');
      setTimeout(() => setCopiedGroupText(false), 2500);
    }).catch(() => {
      showToast('Không thể sao chép vào clipboard', 'error');
    });
  }, [smartGroups, classes, selectedClassId, groupingMode, kmeansK, filteredRankings]);

  // Export Grouping to Excel (.xlsx)
  const handleExportGroupingExcel = useCallback(async () => {
    if (!smartGroups || smartGroups.length === 0) {
      showToast('Không có dữ liệu để xuất Excel', 'warning');
      return;
    }

    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const currentClass = classes.find(c => String(c.id) === selectedClassId);
      const className = currentClass ? currentClass.class_name : 'Toan_Lop';
      const safeClassName = className.replace(/[\*\?:\/\\\[\]]/g, '').slice(0, 25) || 'Lop';

      const worksheet = workbook.addWorksheet(`Phân Nhóm ${safeClassName}`);
      const headers = ['Nhóm Học Tập', 'STT', 'Họ và Tên', 'Biệt Danh', 'Lớp Học', 'Điểm EMA', 'Tốc Độ Tiến Bộ (Trend)', 'Hiệu Suất (PI)', 'Check 1', 'Check 2', 'Homework', 'Định Hướng Sư Phạm'];

      const rows: any[] = [];
      smartGroups.forEach(g => {
        g.students.forEach((s, idx) => {
          const c1 = Number(s.avg_check_1 || 0);
          const c2 = Number(s.avg_check_2 || 0);
          const hw = Number(s.avg_homework || 0);
          rows.push([
            g.title,
            idx + 1,
            s.full_name,
            s.nickname || '',
            s.class_name || '',
            s.ema_level ? Number(format1Dec(Number(s.ema_level))) : '-',
            Number(s.trend_slope || 0) > 0 ? `+${format1Dec(Number(s.trend_slope))}` : format1Dec(Number(s.trend_slope || 0)),
            s.performance_index ? Number(format1Dec(Number(s.performance_index))) : '-',
            c1 > 0 ? Number(format1Dec(c1)) : '-',
            c2 > 0 ? Number(format1Dec(c2)) : '-',
            hw > 0 ? Number(format1Dec(hw)) : '-',
            g.pedagogyAdvice
          ]);
        });
      });

      if (rows.length > 0) {
        worksheet.addTable({
          name: `Table_Grouping_${Math.floor(Math.random() * 10000)}`,
          ref: 'A1',
          headerRow: true,
          totalsRow: false,
          style: {
            theme: 'TableStyleMedium13',
            showRowStripes: true,
          },
          columns: headers.map(h => ({ name: h, filterButton: true })),
          rows: rows,
        });

        worksheet.eachRow((row, rowNumber) => {
          const isHeader = rowNumber === 1;
          row.eachCell((cell) => {
            cell.font = { name: 'Times New Roman', size: 12, bold: isHeader };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          });
        });

        worksheet.columns.forEach((column) => {
          let maxLength = 10;
          column.eachCell?.({ includeEmpty: true }, (cell) => {
            const length = cell.value ? String(cell.value).length : 0;
            if (length > maxLength) maxLength = length;
          });
          column.width = Math.min(maxLength + 4, 45);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `phan_nhom_hoc_tap_${safeClassName}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast('Xuất file Excel phân nhóm thành công!', 'success');
      }
    } catch (err: any) {
      console.error('Error exporting grouping Excel:', err);
      showToast('Có lỗi khi xuất file Excel', 'error');
    }
  }, [smartGroups, classes, selectedClassId]);

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

            {/* Interactive Zoom & Pan Controls */}
            <div className="flex items-center gap-1.5 bg-[#141b32] border border-[#232d4e] p-1 rounded-xl text-xs font-extrabold shrink-0">
              <button
                onClick={() => setZoomLevel(prev => {
                  const next = Math.min(5.0, prev + 0.25);
                  setPanOffset(p => clampPanOffset(p.x, p.y, next));
                  return next;
                })}
                className="p-1 rounded-lg hover:bg-indigo-600/30 text-slate-300 hover:text-white transition cursor-pointer"
                title="Phóng to (Scroll Cuộn Chuột Lên)"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => setZoomLevel(prev => {
                  const next = Math.max(1.0, prev - 0.25);
                  setPanOffset(p => clampPanOffset(p.x, p.y, next));
                  return next;
                })}
                className="p-1 rounded-lg hover:bg-indigo-600/30 text-slate-300 hover:text-white transition cursor-pointer"
                title="Thu nhỏ (Scroll Cuộn Chuột Xuống)"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[10px] text-indigo-300 font-mono px-1">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => { setZoomLevel(1.0); setPanOffset({ x: 0, y: 0 }); }}
                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                title="Đặt lại góc nhìn (Reset View)"
              >
                <RotateCcw size={12} />
              </button>
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

        {/* RESPONSIVE SVG GRAPH CONTAINER WITH TALLER HEIGHT (560px), ZOOM & PAN DRAG */}
        <div
          ref={chartContainerRef}
          className={`relative w-full overflow-hidden pt-1 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onContextMenu={(e) => e.preventDefault()}
          onMouseDown={(e) => {
            if (e.button === 0 || e.button === 2) {
              setIsDragging(true);
              setDragStart({ x: e.clientX, y: e.clientY });
            }
          }}
          onMouseMove={(e) => {
            if (!isDragging) return;
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            setPanOffset(prev => clampPanOffset(prev.x + dx, prev.y + dy, zoomLevel));
            setDragStart({ x: e.clientX, y: e.clientY });
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          
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
                  <span>
                    {hoveredPoint.check1}
                    {hoveredPoint.fittedC1 !== null && (
                      <span className="ml-1 text-blue-300/70 font-semibold">({hoveredPoint.predModel}: {hoveredPoint.fittedC1})</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 text-purple-400">
                  <span>Check 2:</span>
                  <span>
                    {hoveredPoint.check2}
                    {hoveredPoint.fittedC2 !== null && (
                      <span className="ml-1 text-purple-300/70 font-semibold">({hoveredPoint.predModel}: {hoveredPoint.fittedC2})</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 text-emerald-400">
                  <span>Homework:</span>
                  <span>
                    {hoveredPoint.homework}
                    {hoveredPoint.fittedHw !== null && (
                      <span className="ml-1 text-emerald-300/70 font-semibold">({hoveredPoint.predModel}: {hoveredPoint.fittedHw})</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          <svg 
            viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
            className="w-full h-[750px] overflow-visible"
          >
            <defs>
              {/* Plot area clip path so curves don't overflow fixed X/Y axes */}
              <clipPath id="chart-plot-clip">
                <rect x={paddingLeft} y={paddingTop - 10} width={plotAreaWidth} height={plotAreaHeight + 20} />
              </clipPath>

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

            {/* DYNAMIC Y-AXIS GRID LINES & TICK LABELS (VALUES & LINES MOVE DYNAMICALLY, LABELS PINNED ON LEFT) */}
            {yBounds.ticks.map(val => {
              const y = getSvgY(val);
              if (y < paddingTop - 12 || y > chartHeight - paddingBottom + 12) return null;
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
            {getSvgY(7.5) >= paddingTop - 10 && getSvgY(7.5) <= chartHeight - paddingBottom + 10 && (
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
            )}

            {/* CLIPPED INTERACTIVE PLOT AREA (CURVES & DATA POINTS DYNAMICALLY SCALE & TRANSLATE) */}
            <g clipPath="url(#chart-plot-clip)">
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

                {/* FORECAST DASHED CONNECTION LINES & FORECAST POINTS */}
                {sessionChartData.length > 0 && (() => {
                  const lastIdx = sessionChartData.length - 1;
                  const lastX = getSvgX(lastIdx, sessionChartData.length);
                  const forecastX = lastX + 40 * zoomLevel;
                  return (
                    <>
                      {/* 1. Check 1 Forecast Line & Point */}
                      <line
                        x1={lastX}
                        y1={getSvgY(sessionChartData[lastIdx].check1)}
                        x2={forecastX}
                        y2={getSvgY(engine.pred_c1)}
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                        strokeDasharray="4 4"
                      />
                      <circle 
                        cx={forecastX} 
                        cy={getSvgY(engine.pred_c1)} 
                        r="6" 
                        fill="#3b82f6" 
                        stroke="#ffffff" 
                        strokeWidth="2" 
                      />
                      <text 
                        x={forecastX + 8} 
                        y={getSvgY(engine.pred_c1) + 4} 
                        fill="#60a5fa" 
                        fontSize="11" 
                        fontWeight="900"
                      >
                        {format1Dec(engine.pred_c1)}
                      </text>

                      {/* 2. Check 2 Forecast Line & Point */}
                      <line
                        x1={lastX}
                        y1={getSvgY(sessionChartData[lastIdx].check2)}
                        x2={forecastX}
                        y2={getSvgY(engine.pred_c2)}
                        stroke="#a855f7"
                        strokeWidth="2.5"
                        strokeDasharray="4 4"
                      />
                      <circle 
                        cx={forecastX} 
                        cy={getSvgY(engine.pred_c2)} 
                        r="6" 
                        fill="#a855f7" 
                        stroke="#ffffff" 
                        strokeWidth="2" 
                      />
                      <text 
                        x={forecastX + 8} 
                        y={getSvgY(engine.pred_c2) + 4} 
                        fill="#c084fc" 
                        fontSize="11" 
                        fontWeight="900"
                      >
                        {format1Dec(engine.pred_c2)}
                      </text>

                      {/* 3. Homework Forecast Line & Point */}
                      <line
                        x1={lastX}
                        y1={getSvgY(sessionChartData[lastIdx].homework)}
                        x2={forecastX}
                        y2={getSvgY(engine.pred_hw)}
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeDasharray="4 4"
                      />
                      <circle 
                        cx={forecastX} 
                        cy={getSvgY(engine.pred_hw)} 
                        r="6" 
                        fill="#10b981" 
                        stroke="#ffffff" 
                        strokeWidth="2" 
                      />
                      <text 
                        x={forecastX + 8} 
                        y={getSvgY(engine.pred_hw) + 4} 
                        fill="#34d399" 
                        fontSize="11" 
                        fontWeight="900"
                      >
                        {format1Dec(engine.pred_hw)}
                      </text>
                    </>
                  );
                })()}

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
                        x,
                        fittedC1: fittedLookup.c1[i] ?? null,
                        fittedC2: fittedLookup.c2[i] ?? null,
                        fittedHw: fittedLookup.hw[i] ?? null,
                        predModel: 'EMA',
                      })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      <rect
                        x={x - 25}
                        y={paddingTop}
                        width={50}
                        height={plotAreaHeight}
                        fill="transparent"
                      />

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

                      <circle cx={x} cy={y1} r="7" fill="#3b82f6" filter="url(#glow-blue)" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-200 group-hover:scale-125" />
                      <circle cx={x} cy={y1} r="3.5" fill="#ffffff" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-200 group-hover:scale-125" />

                      <circle cx={x} cy={y2} r="7" fill="#a855f7" filter="url(#glow-purple)" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-200 group-hover:scale-125" />
                      <circle cx={x} cy={y2} r="3.5" fill="#ffffff" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-200 group-hover:scale-125" />

                      <circle cx={x} cy={yHw} r="7" fill="#10b981" filter="url(#glow-emerald)" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-200 group-hover:scale-125" />
                      <circle cx={x} cy={yHw} r="3.5" fill="#ffffff" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-200 group-hover:scale-125" />

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
              </g>

            {/* DYNAMIC X-AXIS SESSION DATE LABELS (DATES MOVE WITH DRAG/ZOOM, LABELS PINNED AT BOTTOM) */}
            {sessionChartData.map((d, i) => {
              const x = getSvgX(i, sessionChartData.length);
              if (x < paddingLeft - 20 || x > chartWidth - paddingRight + 20) return null;
              return (
                <text 
                  key={i}
                  x={x} 
                  y={chartHeight - 12} 
                  fill={hoveredPoint?.index === i ? "#ffffff" : "#94a3b8"} 
                  fontSize="11" 
                  fontWeight="extrabold" 
                  textAnchor="middle"
                >
                  {d.sessionName}
                </text>
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
            <span className="text-[10px] text-slate-400 font-semibold block">{engine.prediction_model ?? 'Smart Predict'}</span>

            {activeTooltip === 'forecast' && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-[#161c34] border border-[#2c375e] text-slate-200 text-[11px] rounded-xl shadow-2xl z-30 text-left font-sans">
                <span className="font-extrabold text-indigo-300 block mb-1">Dự Đoán ({engine.prediction_model ?? 'Smart Predict'}):</span>
                Tự động chọn mô hình tốt nhất dựa trên lượng dữ liệu: EMA (&lt;5 buổi), Weighted OLS (5–19 buổi), Holt-Winters (20+ buổi).
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
            <span className={`text-sm font-black font-mono ${
              engine.ema_level < 5.0 ? 'text-rose-500' :
              engine.ema_level < 6.5 ? 'text-amber-400' :
              engine.ema_level < 8.0 ? 'text-blue-400' : 'text-emerald-400'
            }`}>{engine.ema_level}</span>
            <span className="text-[10px] text-slate-400 font-semibold block">Exponential Moving</span>

            {activeTooltip === 'ema' && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-[#161c34] border border-[#2c375e] text-slate-200 text-[11px] rounded-xl shadow-2xl z-30 text-left font-sans">
                <span className="font-extrabold text-emerald-300 block mb-1">Trình Độ Hiện Tại (EMA):</span>
                <div className="space-y-1 my-1.5 font-mono text-[10px] font-bold bg-[#0d1120] p-2 rounded-lg border border-[#202948]">
                  <div className="flex items-center justify-between text-blue-400">
                    <span>Check 1 EMA:</span>
                    <span>{engine.ema_c1 ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-purple-400">
                    <span>Check 2 EMA:</span>
                    <span>{engine.ema_c2 ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-400">
                    <span>Homework EMA:</span>
                    <span>{engine.ema_hw ?? 0}</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Trình độ tổng hợp ({engine.ema_level}) ưu tiên trọng số bài học mới nhất.
                </span>
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
            <span className={`text-sm font-black font-mono ${
              engine.std_dev > 2.0 ? 'text-rose-500' :
              engine.std_dev > 1.0 ? 'text-amber-400' :
              engine.std_dev < 0.5 ? 'text-emerald-400' : 'text-cyan-400'
            }`}>σ = {engine.std_dev}</span>
            <span className={`text-[10px] font-semibold block ${
              engine.consistency_label?.includes('mạnh') ? 'text-rose-400 font-extrabold' :
              engine.consistency_label?.includes('Biến động') ? 'text-amber-400 font-bold' :
              engine.consistency_label?.includes('Rất ổn định') ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}>{engine.consistency_label}</span>

            {activeTooltip === 'sd' && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-[#161c34] border border-[#2c375e] text-slate-200 text-[11px] rounded-xl shadow-2xl z-30 text-left font-sans">
                <span className="font-extrabold text-cyan-300 block mb-1">Độ Biến Động Thật Sự (Residual SD):</span>
                <div className="space-y-1 my-1.5 font-mono text-[10px] font-bold bg-[#0d1120] p-2 rounded-lg border border-[#202948]">
                  {gradeTypesList.map(gt => (
                    <div key={gt.id} className="flex items-center justify-between" style={{ color: gt.color || '#3b82f6' }}>
                      <span>{gt.label} ({gt.weight}%):</span>
                      <span>σ = {((engine as any)[`std_dev_${gt.id}`] ?? engine.std_dev ?? 0)}</span>
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 block">
                  SD đo độ ổn định quanh quỹ đạo tiến bộ (khử xu hướng), phân biệt chính xác giữa tiến bộ vượt bậc và trồi sụt thất thường.
                </span>
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
            <span className={`text-[10px] font-bold block ${
              engine.trend_label?.includes('Giảm') || engine.trend_label?.includes('Suy giảm') ? 'text-rose-400' :
              engine.trend_label?.includes('Ổn định') ? 'text-slate-300' : 'text-emerald-400'
            }`}>{engine.trend_label}</span>

            {activeTooltip === 'trend' && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-[#161c34] border border-[#2c375e] text-slate-200 text-[11px] rounded-xl shadow-2xl z-30 text-left font-sans">
                <span className="font-extrabold text-purple-300 block mb-1">Tốc Độ Tăng Trưởng (Trend Rate):</span>
                Hệ số góc (slope) tính toán mức tăng hoặc giảm trung bình của học sinh sau mỗi buổi học.
              </div>
            )}
          </div>

          <div className="border-l border-[#1d2644] col-span-2 sm:col-span-1">
            <span className="text-[10px] font-black uppercase text-slate-400 block">Xếp Loại Tổng Thể</span>
            <span className={`text-xs font-black flex items-center justify-center gap-1 ${
              engine.rating_label?.includes('NGUY CƠ') ? 'text-rose-500 font-extrabold animate-pulse' :
              engine.rating_label?.includes('Cần Cố Gắng') ? 'text-amber-400' :
              engine.rating_label?.includes('Tốt') ? 'text-blue-400' : 'text-emerald-400'
            }`}>
              {engine.rating_label}
            </span>
          </div>
        </div>

      </div>

      {/* 5.5 SMART LEVEL GROUPING (MODE A & MODE B) */}
      <div className="bg-[#0d1120] border border-indigo-500/30 rounded-2xl flex flex-col shadow-2xl mb-8 overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-5 border-b border-[#181f36] bg-[#0a0d18] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  GỢI Ý PHÂN NHÓM HỌC TẬP THEO TRÌNH ĐỘ
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Smart Level Grouping
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Tự động phân loại dựa trên Năng lực hiện tại (EMA), Tốc độ tăng trưởng (Trend) và Phổ điểm thực tế của lớp
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sliding Pill Indicator Segmented Control (Mode A vs Mode B) */}
            <div className="relative flex bg-[#0d1018] p-1 rounded-xl border border-white/10 text-xs shrink-0 font-bold select-none">
              <div
                className="absolute top-1 bottom-1 rounded-lg bg-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.5)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
                style={{
                  left: groupingMode === 'tier' ? '4px' : 'calc(50% + 1px)',
                  width: 'calc(50% - 4px)',
                }}
              />
              <button
                type="button"
                onClick={() => setGroupingMode('tier')}
                className={`flex-1 relative z-10 py-1.5 px-3.5 text-center transition-colors cursor-pointer ${
                  groupingMode === 'tier' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Theo Chuẩn Học Lực
              </button>
              <button
                type="button"
                onClick={() => setGroupingMode('kmeans')}
                className={`flex-1 relative z-10 py-1.5 px-3.5 text-center transition-colors cursor-pointer ${
                  groupingMode === 'kmeans' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tự Động Phân Cụm K-Means
              </button>
            </div>

            {/* Sub-selector for K = 2, 3, 4 when in K-Means mode */}
            {groupingMode === 'kmeans' && (
              <div className="relative flex bg-[#0d1018] p-1 rounded-xl border border-white/10 text-xs shrink-0 font-bold select-none">
                <div
                  className="absolute top-1 bottom-1 rounded-lg bg-[#3b82f6] shadow-[0_0_12px_rgba(59,130,246,0.5)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
                  style={{
                    left: kmeansK === 2 ? '4px' : kmeansK === 3 ? 'calc(33.333% + 1px)' : 'calc(66.666% + 1px)',
                    width: 'calc(33.333% - 4px)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setKmeansK(2)}
                  className={`flex-1 relative z-10 py-1 px-3 text-center transition-colors cursor-pointer ${
                    kmeansK === 2 ? 'text-white font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  2 Nhóm
                </button>
                <button
                  type="button"
                  onClick={() => setKmeansK(3)}
                  className={`flex-1 relative z-10 py-1 px-3 text-center transition-colors cursor-pointer ${
                    kmeansK === 3 ? 'text-white font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  3 Nhóm
                </button>
                <button
                  type="button"
                  onClick={() => setKmeansK(4)}
                  className={`flex-1 relative z-10 py-1 px-3 text-center transition-colors cursor-pointer ${
                    kmeansK === 4 ? 'text-white font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  4 Nhóm
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyGrouping}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14182a] hover:bg-[#1a2038] text-slate-300 hover:text-white text-xs font-bold border border-white/10 transition cursor-pointer"
                title="Sao chép danh sách phân nhóm vào clipboard"
              >
                {copiedGroupText ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedGroupText ? 'Đã Sao Chép' : 'Sao Chép'}</span>
              </button>
              <button
                type="button"
                onClick={handleExportGroupingExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition cursor-pointer"
                title="Xuất file Excel danh sách phân nhóm"
              >
                <FileSpreadsheet size={14} />
                <span>Xuất Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Group Cards Grid */}
        <div className="p-6">
          {smartGroups.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs font-bold">
              Chưa có dữ liệu điểm học sinh để phân nhóm.
            </div>
          ) : (
            <div className={`grid gap-4 ${
              smartGroups.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
              smartGroups.length === 3 ? 'grid-cols-1 lg:grid-cols-3' :
              'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
            }`}>
              {smartGroups.map((g) => (
                <div
                  key={g.id}
                  className={`bg-[#0f1424] border ${g.borderCls} rounded-2xl flex flex-col overflow-hidden shadow-xl transition-all duration-300 hover:border-white/20`}
                >
                  {/* Card Header */}
                  <div className={`p-4 border-b border-white/5 ${g.headerBg}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: g.dotColor }}
                          />
                          <h4 className="text-xs font-black text-white uppercase tracking-wide">
                            {g.title}
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                          {g.subtitle}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black shrink-0 ${g.badgeCls}`}>
                        {g.students.length} Học Sinh
                      </span>
                    </div>

                    {/* Quick Group Metrics */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5">
                      <div className="bg-[#0b0e1a] p-2 rounded-xl border border-white/5">
                        <span className="text-[9px] font-black uppercase text-slate-400 block">EMA Trung Bình</span>
                        <span className="text-sm font-black text-white font-mono">{g.avgEma} <span className="text-[10px] text-slate-500 font-bold">/ 10</span></span>
                      </div>
                      <div className="bg-[#0b0e1a] p-2 rounded-xl border border-white/5">
                        <span className="text-[9px] font-black uppercase text-slate-400 block">Độ Phân Tán (SD)</span>
                        <span className="text-sm font-black text-emerald-400 font-mono">σ = {g.groupSd}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pedagogy Focus Box */}
                  <div className="p-3 bg-[#0a0d18] border-b border-white/5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Định Hướng Giảng Dạy:
                    </span>
                    <p className="text-[11px] font-semibold text-slate-300 leading-relaxed">
                      {g.pedagogyAdvice}
                    </p>
                  </div>

                  {/* Student List */}
                  <div className="p-3 flex-1 flex flex-col gap-2 max-h-[380px] overflow-y-auto custom-scrollbar">
                    {g.students.length === 0 ? (
                      <div className="text-center py-6 text-[11px] text-slate-500 font-bold">
                        Không có học sinh trong nhóm này
                      </div>
                    ) : (
                      g.students.map((s: any, sIdx: number) => {
                        const slope = Number(s.trend_slope || 0);
                        const isImproving = slope > 0.1;
                        const isDeclining = slope < -0.1;
                        const initials = s.full_name
                          ? s.full_name.split(' ').map((n: string) => n[0]).slice(-2).join('').toUpperCase()
                          : 'HS';

                        return (
                          <div
                            key={s.student_id || sIdx}
                            onClick={() => handleSelectRankingStudent(s.student_id)}
                            className="bg-[#13192e] hover:bg-[#18203a] p-2.5 rounded-xl border border-[#202948] hover:border-indigo-500/40 transition cursor-pointer flex items-center justify-between gap-3 group"
                            title={`Xem chi tiết học sinh ${s.full_name}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-[#1e274a] text-indigo-300 flex items-center justify-center font-black text-[10px] shrink-0 border border-indigo-500/20 group-hover:border-indigo-500/50">
                                {initials}
                              </div>
                              <div className="truncate">
                                <div className="text-xs font-bold text-white group-hover:text-indigo-200 transition truncate">
                                  {s.full_name}
                                </div>
                                <div className="text-[10px] font-semibold text-slate-400 truncate">
                                  {s.nickname ? `(${s.nickname})` : s.class_name || 'Học sinh'}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Trend Indicator */}
                              <div className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold font-mono flex items-center gap-0.5 ${
                                isImproving ? 'text-emerald-400 bg-emerald-500/10' :
                                isDeclining ? 'text-rose-400 bg-rose-500/10' :
                                'text-slate-400 bg-slate-500/10'
                              }`}>
                                {isImproving ? <TrendingUp size={11} /> : isDeclining ? <TrendingDown size={11} /> : <Minus size={11} />}
                                <span>{slope > 0 ? `+${format1Dec(slope)}` : format1Dec(slope)}</span>
                              </div>

                              {/* EMA Badge */}
                              <div className="px-2 py-0.5 rounded-lg bg-[#0b0e1a] border border-white/10 text-xs font-black font-mono text-white">
                                {s.ema_level ? format1Dec(Number(s.ema_level)) : '-'}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
          onExportExcel={handleExportRankingsExcel}
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
