import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon, Plus, RefreshCw,
} from 'lucide-react';
import { api } from '../../api';
import { showToast } from '../../components/Toast';
import { CustomSelect } from '../../components/CustomSelect';
import { CustomDatePicker } from '../../components/CustomDatePicker';
import { DataTable } from '../../components/DataTable';
import { SegmentedControl } from '../../components/SegmentedControl';
import { getLocalDateStr } from '../../utils';
import {
  ClassSession, DayCfg, PALETTE_20, DAY_HDRS, DAYS,
  getSessionColor
} from './types';
import { SessionModal } from './components/SessionModal';
import { ScheduleCalendarView } from './components/ScheduleCalendarView';
import { ScheduleKpiCards } from './components/ScheduleKpiCards';
import { useScheduleColumns } from './hooks/useScheduleColumns';
import { useScheduleActions } from './hooks/useScheduleActions';
import { getUrlParam, setUrlParams, useUrlSync } from '../../utils/navigation';

export default function SchedulePage() {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>(() => {
    const v = getUrlParam('view');
    if (v === 'month' || v === 'week' || v === 'list') return v;
    return 'month';
  });

  const handleChangeViewMode = (mode: 'month' | 'week' | 'list') => {
    setViewMode(mode);
    setUrlParams({ view: mode });
  };

  useUrlSync(() => {
    const v = getUrlParam('view');
    if (v === 'month' || v === 'week' || v === 'list') {
      setViewMode(v);
    }
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const n = new Date(d);
    n.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    return n;
  });
  const [classesList, setClassesList] = useState<any[]>([]);
  const [classFilter, setClassFilter] = useState('');
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; dateStr: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClassSession | null>(null);
  const [mode, setMode] = useState<'single' | 'weekdays'>('weekdays');
  const [color, setColor] = useState('#2563eb');
  const [form, setForm] = useState<Partial<ClassSession>>({
    class_id: undefined,
    date: getLocalDateStr(),
    start_time: '18:00',
    duration: 90,
    status: 'Sắp diễn ra',
    notes: '',
  });

  const defaultDayCfgs = () =>
    DAYS.reduce((a, d) => {
      a[d] = { checked: d === 'Thứ 2' || d === 'Thứ 4', time: '18:00', duration: 90 };
      return a;
    }, {} as Record<string, DayCfg>);

  const [dayCfgs, setDayCfgs] = useState<Record<string, DayCfg>>(defaultDayCfgs());

  const loadData = async (silent?: boolean | any) => {
    const isSilent = silent === true;
    if (!isSilent) setLoading(true);
    try {
      const cls = await api.getClasses();
      setClassesList(cls);
      let all: ClassSession[] = [];
      for (const c of cls) {
        if (!classFilter || String(c.id) === classFilter) {
          const ss = await api.getClassSessions(c.id, selectedMonth);
          all = all.concat(
            ss.map((s: any) => ({
              ...s,
              class_name: c.class_name,
              teacher_name: c.teacher_name,
              room: c.room,
            }))
          );
        }
      }
      all.sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
      setSessions(all);
    } catch (e: any) {
      if (!isSilent) showToast('Không thể tải lịch học: ' + e.message, 'error');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const h = () => loadData(true);
    window.addEventListener('data-changed', h);
    return () => window.removeEventListener('data-changed', h);
  }, [selectedMonth, classFilter]);

  useEffect(() => {
    const close = () => setCtxMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const today = getLocalDateStr();
  const [yr, mo] = selectedMonth.split('-').map(Number);
  const firstDay = new Date(yr, mo - 1, 1);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const startOff = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const totalCells = Math.ceil((startOff + daysInMonth) / 7) * 7;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return { header: DAY_HDRS[i], dateStr: getLocalDateStr(d), dayNum: d.getDate() };
  });

  const changeWeek = (dir: number) => {
    const n = new Date(weekStart);
    n.setDate(weekStart.getDate() + dir * 7);
    setWeekStart(n);
  };

  const openAdd = (dateStr?: string) => {
    setEditing(null);
    setMode(dateStr ? 'single' : 'weekdays');
    const firstCls = classesList[0];
    const firstCid = firstCls?.id || 1;
    const initialColor = firstCls?.color || PALETTE_20[(firstCid * 3 + 1) % PALETTE_20.length];
    setColor(initialColor);
    setForm({
      class_id: firstCid,
      date: dateStr || today,
      start_time: '18:00',
      duration: 90,
      status: 'Sắp diễn ra',
      notes: '',
    });
    setDayCfgs(defaultDayCfgs());
    setModalOpen(true);
  };

  const openEdit = (sess: ClassSession) => {
    setEditing(sess);
    setMode('single');
    setColor(getSessionColor(sess));
    setForm({ ...sess });
    setModalOpen(true);
  };

  const { save, del } = useScheduleActions({
    classesList,
    sessions,
    selectedMonth,
    daysInMonth,
    yr,
    mo,
    loadData,
    form,
    color,
    editing,
    mode,
    dayCfgs,
    setModalOpen,
  });

  const total = sessions.length;
  const done = sessions.filter((s) => s.status === 'Đã học').length;
  const upcoming = sessions.filter((s) => s.status === 'Sắp diễn ra').length;

  const sessionColumns = useScheduleColumns(openEdit);

  return (
    <div className="h-full flex flex-col p-5 gap-5 overflow-y-auto bg-[#f1f5f9] dark:bg-[#09090b] text-slate-800 dark:text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            BẢNG LỊCH HỌC
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#141417] dark:hover:bg-[#1c1c21] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-0 transition cursor-pointer shadow-xs hover:shadow-sm"
            title="Tải lại lịch học"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-blue-500 dark:text-blue-400' : ''} />
          </button>
          <button
            type="button"
            onClick={() => openAdd()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer border-0 shadow-xs hover:shadow-sm"
            title="Thêm Lịch Học"
          >
            <Plus size={14} />
            <span>Thêm Lịch Học</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <ScheduleKpiCards total={total} done={done} upcoming={upcoming} />

      {/* UNIFIED CONTAINER: Integrated Toolbar + Calendar / List */}
      <div className="calendar-container-depth flex-1 min-h-0 select-none flex flex-col">
        {/* Integrated Top Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#111728] border-b border-slate-200 dark:border-white/10 px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <CustomDatePicker
              mode="month"
              value={selectedMonth}
              onChange={(val) => {
                if (val) setSelectedMonth(val.slice(0, 7));
              }}
              placeholder="Chọn tháng..."
              className="w-48"
            />
            <CustomSelect
              value={classFilter}
              onChange={(val) => setClassFilter(val)}
              options={[
                { value: '', label: 'Tất cả lớp học' },
                ...classesList.map((c) => ({ value: String(c.id), label: c.class_name })),
              ]}
              className="w-48"
            />
          </div>
          <div className="flex items-center gap-2">
            <SegmentedControl<'month' | 'week' | 'list'>
              value={viewMode}
              onChange={handleChangeViewMode}
              options={[
                { value: 'month', label: 'LỊCH THÁNG' },
                { value: 'week', label: 'LỊCH TUẦN' },
                { value: 'list', label: 'DANH SÁCH' },
              ]}
              activeColor="bg-[#2563eb]"
              size="sm"
            />
          </div>
        </div>

        {/* MONTH / WEEK VIEW */}
        {(viewMode === 'month' || viewMode === 'week') && (
          <ScheduleCalendarView
            viewMode={viewMode}
            selectedMonth={selectedMonth}
            totalCells={totalCells}
            startOff={startOff}
            daysInMonth={daysInMonth}
            yr={yr}
            mo={mo}
            today={today}
            sessions={sessions}
            weekDays={weekDays}
            changeWeek={changeWeek}
            setWeekStart={setWeekStart}
            openAdd={openAdd}
            openEdit={openEdit}
            setCtxMenu={setCtxMenu}
          />
        )}

        {/* LIST VIEW */}
        {viewMode === 'list' && (
          <div className="p-4 flex-1 min-h-0 overflow-auto flex flex-col">
            <DataTable
              tableId="schedule-table"
              exportFilename="lich_hoc"
              data={sessions}
              columns={sessionColumns}
              loading={loading}
              loadingMessage="Đang tải lịch học..."
              emptyMessage="Không có buổi học nào."
              pageSize={20}
            />
          </div>
        )}
      </div>

      {/* CONTEXT MENU */}
      {ctxMenu && (
        <div
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
          className="fixed z-[999] bg-white dark:bg-[#141417] border border-slate-300 dark:border-[#27272a] rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.25)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.95)] ring-1 ring-black/5 dark:ring-white/10 py-2 min-w-[170px] animate-mac-dropdown select-none"
        >
          <button
            type="button"
            onClick={() => {
              openAdd(ctxMenu.dateStr);
              setCtxMenu(null);
            }}
            className="w-full text-left px-4 py-2 text-xs font-black text-slate-900 dark:text-white hover:bg-indigo-50 dark:hover:bg-white/10 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Thêm buổi học</span>
          </button>
        </div>
      )}

      {/* MODAL */}
      <SessionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        form={form}
        setForm={setForm}
        mode={mode}
        setMode={setMode}
        color={color}
        setColor={setColor}
        dayCfgs={dayCfgs}
        setDayCfgs={setDayCfgs}
        classesList={classesList}
        selectedMonth={selectedMonth}
        onSave={save}
        onDelete={del}
      />
    </div>
  );
}
