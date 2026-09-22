import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Calendar as CalendarIcon, Clock, CheckCircle2, Plus, RefreshCw,
  Edit3
} from 'lucide-react';
import { api } from '../../api';
import { showToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';
import { CustomSelect } from '../../components/CustomSelect';
import { CustomDatePicker } from '../../components/CustomDatePicker';
import { DataTable } from '../../components/DataTable';
import { SegmentedControl } from '../../components/SegmentedControl';
import { getLocalDateStr } from '../../utils';
import {
  ClassSession, DayCfg, PALETTE_20, DAY_HDRS, DAY_NUM, DAYS,
  getSessionColor, calcEndTime, timeToMin
} from './types';
import { SessionModal } from './components/SessionModal';
import { ScheduleCalendarView } from './components/ScheduleCalendarView';
import { getUrlParam, setUrlParams, useUrlSync } from '../../utils/navigation';

export default function SchedulePage() {
  const confirm = useConfirm();
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

  const checkSingleConflict = (target: { id?: number; class_id: number; date: string; start_time: string; duration: number }) => {
    const targetStart = timeToMin(target.start_time);
    const targetEnd = targetStart + target.duration;
    const targetCls = classesList.find((c) => c.id === target.class_id);
    const targetTeacherId = form.teacher_id || targetCls?.teacher_id;
    const targetRoom = form.room || targetCls?.room;

    for (const s of sessions) {
      if (target.id && s.id === target.id) continue;
      if (s.date !== target.date) continue;
      if (s.status === 'Hủy') continue;

      const sStart = timeToMin(s.start_time);
      const sEnd = sStart + s.duration;
      const overlaps = targetStart < sEnd && targetEnd > sStart;

      if (overlaps) {
        const sTeacherId = s.teacher_id || classesList.find((c) => c.id === s.class_id)?.teacher_id;
        if (targetTeacherId && sTeacherId && targetTeacherId === sTeacherId) {
          const tName = s.teacher_name || 'Giáo viên';
          return {
            error: `Trùng lịch giáo viên: ${tName} đã có ca dạy lớp "${s.class_name}" (${s.start_time} - ${calcEndTime(s.start_time, s.duration)})`,
          };
        }

        const sRoom = s.room || classesList.find((c) => c.id === s.class_id)?.room;
        if (targetRoom && sRoom && targetRoom.trim().toLowerCase() === sRoom.trim().toLowerCase()) {
          return {
            error: `Trùng phòng học: Phòng "${targetRoom}" đã được dùng bởi lớp "${s.class_name}" (${s.start_time} - ${calcEndTime(s.start_time, s.duration)})`,
          };
        }
      }
    }
    return null;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.class_id) {
      showToast('Vui lòng chọn lớp học!', 'error');
      return;
    }
    const notes = `#COLOR:${color} ${(form.notes || '').replace(/#COLOR:#[0-9a-fA-F]{6}/g, '').trim()}`.trim();

    try {
      if (editing) {
        const conflict = checkSingleConflict({
          id: editing.id,
          class_id: form.class_id,
          date: form.date!,
          start_time: form.start_time!,
          duration: form.duration!,
        });
        if (conflict?.error) {
          showToast(conflict.error, 'error');
          return;
        }
        await api.updateClassSession(form.class_id, editing.id, { ...form, notes, color });
        showToast('Cập nhật buổi học thành công!', 'success');
      } else if (mode === 'single') {
        const conflict = checkSingleConflict({
          class_id: form.class_id,
          date: form.date!,
          start_time: form.start_time!,
          duration: form.duration!,
        });
        if (conflict?.error) {
          showToast(conflict.error, 'error');
          return;
        }
        await api.addClassSession(form.class_id, { ...form, notes, color });
        showToast('Tạo buổi học thành công!', 'success');
      } else {
        const enabled = DAYS.filter((d) => dayCfgs[d]?.checked);
        if (!enabled.length) {
          showToast('Vui lòng chọn ít nhất 1 thứ trong tuần!', 'error');
          return;
        }

        const pendingItems: Array<{ date: string; start_time: string; duration: number }> = [];
        for (let d = 1; d <= daysInMonth; d++) {
          const dt = new Date(yr, mo - 1, d);
          const dayName = DAYS.find((k) => DAY_NUM[k] === dt.getDay());
          if (dayName && dayCfgs[dayName]?.checked) {
            const cfg = dayCfgs[dayName];
            const ds = `${yr}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            pendingItems.push({ date: ds, start_time: cfg.time, duration: cfg.duration });
          }
        }

        for (const item of pendingItems) {
          await api.addClassSession(form.class_id, {
            ...form,
            date: item.date,
            start_time: item.start_time,
            duration: item.duration,
            notes,
            color,
          });
        }
        showToast(`Đã tạo thành công ${pendingItems.length} buổi học tháng ${selectedMonth}!`, 'success');
      }

      window.dispatchEvent(new CustomEvent('data-changed'));
      setModalOpen(false);
      loadData(true);
    } catch (e: any) {
      showToast('Lỗi khi lưu: ' + e.message, 'error');
    }
  };

  const del = async (sess: ClassSession) => {
    const ok = await confirm({
      title: 'Xóa Buổi Học',
      message: `Bạn có chắc muốn xóa buổi học ngày ${sess.date} lớp ${sess.class_name}?`,
      confirmText: 'Xóa',
      type: 'danger',
    });
    if (ok) {
      try {
        await api.deleteClassSession(sess.id);
        window.dispatchEvent(new CustomEvent('data-changed'));
        loadData(true);
        showToast('Đã xóa buổi học!', 'success');
      } catch (e: any) {
        showToast('Lỗi: ' + e.message, 'error');
      }
    }
  };

  const total = sessions.length;
  const done = sessions.filter((s) => s.status === 'Đã học').length;
  const upcoming = sessions.filter((s) => s.status === 'Sắp diễn ra').length;

  const sessionColumns = useMemo<ColumnDef<ClassSession>[]>(() => [
    {
      accessorKey: 'date',
      header: 'Ngày Học',
      cell: (info) => <span className="font-bold text-slate-900 dark:text-white text-base">{info.getValue<string>()}</span>,
    },
    {
      accessorKey: 'class_name',
      header: 'Lớp Học',
      cell: ({ row }) => {
        const s = row.original;
        const hex = getSessionColor(s);
        return <span className="font-extrabold text-base" style={{ color: hex }}>{s.class_name}</span>;
      },
    },
    {
      id: 'time',
      header: 'Giờ / Thời Lượng',
      cell: ({ row }) => {
        const s = row.original;
        return (
          <span className="text-slate-800 dark:text-slate-200 text-base font-semibold">
            {s.start_time} – {calcEndTime(s.start_time, s.duration)} ({s.duration}p)
          </span>
        );
      },
    },
    {
      accessorKey: 'teacher_name',
      header: 'Giáo Viên',
      cell: (info) => <span className="text-slate-700 dark:text-slate-300 text-base font-semibold">{info.getValue<string>() || 'Mặc định'}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Trạng Thái',
      cell: (info) => {
        const st = info.getValue<string>();
        return (
          <span className={`inline-block px-2.5 py-0.5 rounded-xl text-xs font-black border ${
            st === 'Đã học'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : st === 'Hủy'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
          }`}>
            {st}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-center w-full">Thao Tác</div>,
      size: 70,
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => openEdit(row.original)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition cursor-pointer border border-slate-200 dark:border-white/5"
            title="Sửa buổi học"
          >
            <Edit3 size={13} />
          </button>
        </div>
      ),
    },
  ], []);

  return (
    <div className="h-full flex flex-col p-5 gap-5 overflow-y-auto bg-[#e2e8f0] dark:bg-[#09090b] text-slate-800 dark:text-slate-100 font-sans">
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
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#141417] dark:hover:bg-[#1c1c21] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#27272a] transition cursor-pointer shadow-sm"
            title="Tải lại lịch học"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-blue-500 dark:text-blue-400' : ''} />
          </button>
          <button
            type="button"
            onClick={() => openAdd()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer border border-blue-400/30 shadow-md"
            title="Thêm Lịch Học"
          >
            <Plus size={14} />
            <span>Thêm Lịch Học</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 shrink-0">
        <div className="bg-white dark:bg-[#141417] border-0 p-4.5 flex items-center justify-between rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors duration-200">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Trong Tháng</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{total}</p>
          </div>
          <div className="p-2.5 bg-blue-500/10 border-0 rounded-xl text-blue-600 dark:text-blue-400">
            <CalendarIcon size={18} />
          </div>
        </div>
        <div className="bg-white dark:bg-[#141417] border-0 p-4.5 flex items-center justify-between rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors duration-200">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Đã Hoàn Thành</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{done}</p>
          </div>
          <div className="p-2.5 bg-emerald-500/10 border-0 rounded-xl text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={18} />
          </div>
        </div>
        <div className="bg-white dark:bg-[#141417] border-0 p-4.5 flex items-center justify-between rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors duration-200">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400">Sắp Diễn Ra</p>
            <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{upcoming}</p>
          </div>
          <div className="p-2.5 bg-cyan-500/10 border-0 rounded-xl text-cyan-600 dark:text-cyan-400">
            <Clock size={18} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#141417] border-0 p-3 rounded-2xl shrink-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors duration-200">
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
        <div className="flex-1 min-h-0 overflow-auto flex flex-col">
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
