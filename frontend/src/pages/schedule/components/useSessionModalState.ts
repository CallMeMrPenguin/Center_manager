import { useState, useEffect } from 'react';
import { ClassSession, DAYS, DAY_NUM, SessionScheduleItem } from '../types';

interface UseSessionModalStateProps {
  isOpen: boolean;
  editing: ClassSession | null;
  form: Partial<ClassSession>;
  setForm: React.Dispatch<React.SetStateAction<Partial<ClassSession>>>;
  mode: 'recurring' | 'temporary';
  setMode: (m: 'recurring' | 'temporary') => void;
  selectedMonth: string;
  sessions?: ClassSession[];
  setEditing?: React.Dispatch<React.SetStateAction<ClassSession | null>>;
  setColor?: (c: string) => void;
}

export function useSessionModalState({
  isOpen,
  editing,
  form,
  setForm,
  mode,
  setMode,
  selectedMonth,
  sessions,
  setEditing,
  setColor,
}: UseSessionModalStateProps) {
  const [calYear, setCalYear] = useState(() => {
    const [y] = selectedMonth.split('-').map(Number);
    return y || new Date().getFullYear();
  });
  const [calMonth, setCalMonth] = useState(() => {
    const [, m] = selectedMonth.split('-').map(Number);
    return m || new Date().getMonth() + 1;
  });

  const [selectedItems, setSelectedItems] = useState<SessionScheduleItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const [y, m] = selectedMonth.split('-').map(Number);
    if (y && m) {
      setCalYear(y);
      setCalMonth(m);
    }

    if (editing) {
      const dStr = editing.date;
      const [ey, em, ed] = dStr.split('-').map(Number);
      const dt = new Date(ey, em - 1, ed);
      const dayNum = dt.getDay();
      const dayName = DAYS.find((k) => DAY_NUM[k] === dayNum) || 'Thứ 2';

      setSelectedItems([
        {
          id: dStr,
          date: dStr,
          dayOfWeek: dayNum,
          dayName,
          label: `${dayName}, ${String(ed).padStart(2, '0')}/${String(em).padStart(2, '0')}/${ey}`,
          start_time: editing.start_time || '18:00',
          duration: editing.duration || 90,
        },
      ]);
      setCalYear(ey);
      setCalMonth(em);
    } else {
      const baseDate = form.date || `${y}-${String(m).padStart(2, '0')}-01`;
      const [by, bm, bd] = baseDate.split('-').map(Number);
      const dt = new Date(by, bm - 1, bd);
      const dayNum = dt.getDay();
      const dayName = DAYS.find((k) => DAY_NUM[k] === dayNum) || 'Thứ 2';

      if (mode === 'recurring') {
        setSelectedItems([
          {
            id: dayName,
            dayOfWeek: dayNum,
            dayName,
            label: `${dayName} hàng tuần`,
            start_time: form.start_time || '18:00',
            duration: form.duration || 90,
          },
        ]);
      } else {
        setSelectedItems([
          {
            id: baseDate,
            date: baseDate,
            dayOfWeek: dayNum,
            dayName,
            label: `${dayName}, ${String(bd).padStart(2, '0')}/${String(bm).padStart(2, '0')}/${by}`,
            start_time: form.start_time || '18:00',
            duration: form.duration || 90,
          },
        ]);
      }
    }
  }, [isOpen, editing, selectedMonth]);

  const handleModeChange = (newMode: 'recurring' | 'temporary') => {
    setMode(newMode);
    const currTime = selectedItems[0]?.start_time || form.start_time || '18:00';
    const currDur = selectedItems[0]?.duration || form.duration || 90;

    if (newMode === 'recurring') {
      const firstDate = selectedItems[0]?.date || form.date || `${calYear}-${String(calMonth).padStart(2, '0')}-01`;
      const [y, m, d] = firstDate.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const dayNum = dt.getDay();
      const dayName = DAYS.find((k) => DAY_NUM[k] === dayNum) || 'Thứ 2';
      setSelectedItems([
        {
          id: dayName,
          dayOfWeek: dayNum,
          dayName,
          label: `${dayName} hàng tuần`,
          start_time: currTime,
          duration: currDur,
        },
      ]);
    } else {
      const baseDate = form.date || `${calYear}-${String(calMonth).padStart(2, '0')}-01`;
      const [y, m, d] = baseDate.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const dayNum = dt.getDay();
      const dayName = DAYS.find((k) => DAY_NUM[k] === dayNum) || 'Thứ 2';
      setSelectedItems([
        {
          id: baseDate,
          date: baseDate,
          dayOfWeek: dayNum,
          dayName,
          label: `${dayName}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`,
          start_time: currTime,
          duration: currDur,
        },
      ]);
    }
  };

  const handlePrevMonth = () => {
    if (calMonth === 1) {
      setCalYear((prev) => prev - 1);
      setCalMonth(12);
    } else {
      setCalMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 12) {
      setCalYear((prev) => prev + 1);
      setCalMonth(1);
    } else {
      setCalMonth((prev) => prev + 1);
    }
  };

  const handleToggleDayOfWeek = (dayNum: number) => {
    const dayName = DAYS.find((k) => DAY_NUM[k] === dayNum) || 'Thứ 2';
    const exists = selectedItems.some((i) => i.id === dayName);
    const currTime = selectedItems[0]?.start_time || '18:00';
    const currDur = selectedItems[0]?.duration || 90;

    if (exists) {
      if (selectedItems.length > 1) {
        setSelectedItems((prev) => prev.filter((i) => i.id !== dayName));
      }
    } else {
      setSelectedItems((prev) => [
        ...prev,
        {
          id: dayName,
          dayOfWeek: dayNum,
          dayName,
          label: `${dayName} hàng tuần`,
          start_time: currTime,
          duration: currDur,
        },
      ]);
    }
  };

  const handleToggleDate = (dateStr: string, dayOfWeek: number) => {
    if (editing) {
      // If clicking a date where this class has an existing session, switch editing to that session
      const matched = sessions?.find(
        (s) => s.class_id === form.class_id && s.date === dateStr
      );
      if (matched) {
        setEditing?.(matched);
        setForm({ ...matched });
        if (matched.color && setColor) setColor(matched.color);
        const [my, mm, md] = dateStr.split('-').map(Number);
        const mdt = new Date(my, mm - 1, md);
        const mDayName = DAYS.find((k) => DAY_NUM[k] === mdt.getDay()) || 'Thứ 2';
        setSelectedItems([
          {
            id: dateStr,
            date: dateStr,
            dayOfWeek: mdt.getDay(),
            dayName: mDayName,
            label: `${mDayName}, ${String(md).padStart(2, '0')}/${String(mm).padStart(2, '0')}/${my}`,
            start_time: matched.start_time || '18:00',
            duration: matched.duration || 90,
          },
        ]);
        return;
      }

      // If clicked date has no existing session, adjust the date of current session
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const dayName = DAYS.find((k) => DAY_NUM[k] === dt.getDay()) || 'Thứ 2';
      setForm((prev) => ({ ...prev, date: dateStr }));
      setSelectedItems([
        {
          id: dateStr,
          date: dateStr,
          dayOfWeek: dt.getDay(),
          dayName,
          label: `${dayName}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`,
          start_time: selectedItems[0]?.start_time || editing.start_time || '18:00',
          duration: selectedItems[0]?.duration || editing.duration || 90,
        },
      ]);
      return;
    }

    if (mode === 'recurring') {
      handleToggleDayOfWeek(dayOfWeek);
      return;
    }

    const exists = selectedItems.some((i) => i.id === dateStr);
    const currTime = selectedItems[0]?.start_time || '18:00';
    const currDur = selectedItems[0]?.duration || 90;

    if (exists) {
      if (selectedItems.length > 1) {
        setSelectedItems((prev) => prev.filter((i) => i.id !== dateStr));
      }
    } else {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const dayName = DAYS.find((k) => DAY_NUM[k] === dt.getDay()) || 'Thứ 2';
      setSelectedItems((prev) => [
        ...prev,
        {
          id: dateStr,
          date: dateStr,
          dayOfWeek: dt.getDay(),
          dayName,
          label: `${dayName}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`,
          start_time: currTime,
          duration: currDur,
        },
      ]);
    }
  };

  const handleChangeTime = (id: string, startTime: string, duration: number) => {
    setSelectedItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, start_time: startTime, duration } : i))
    );
  };

  const handleRemoveItem = (id: string) => {
    if (selectedItems.length > 1) {
      setSelectedItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleSyncAllTimes = () => {
    if (selectedItems.length <= 1) return;
    const first = selectedItems[0];
    setSelectedItems((prev) =>
      prev.map((i) => ({ ...i, start_time: first.start_time, duration: first.duration }))
    );
  };

  const selectedDatesList = selectedItems.map((i) => i.date).filter(Boolean) as string[];
  const selectedDaysOfWeekList = selectedItems
    .map((i) => i.dayOfWeek)
    .filter((d): d is number => d !== undefined);

  return {
    calYear,
    calMonth,
    selectedItems,
    selectedDatesList,
    selectedDaysOfWeekList,
    handlePrevMonth,
    handleNextMonth,
    handleModeChange,
    handleToggleDate,
    handleToggleDayOfWeek,
    handleChangeTime,
    handleRemoveItem,
    handleSyncAllTimes,
  };
}
