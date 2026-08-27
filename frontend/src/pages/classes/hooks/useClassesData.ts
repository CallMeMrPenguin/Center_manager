import { useState, useEffect, useMemo, useCallback } from 'react';
import { ClassItem, TeacherCM, EnrolledStudent } from '../types';
import { api } from '../../../api';
import { showToast } from '../../../components/Toast';
import { useConfirm } from '../../../components/ConfirmDialog';
import { notifyDataChanged } from '../../../utils';

export function useClassesData() {
  const confirm = useConfirm();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherCM[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);

  const filteredClasses = useMemo(() => {
    if (!search.trim()) return classes;
    const q = search.trim().toLowerCase();
    return classes.filter(
      (cls) =>
        (cls.class_name || '').toLowerCase().includes(q) ||
        (cls.teacher_name || '').toLowerCase().includes(q) ||
        (cls.room || '').toLowerCase().includes(q) ||
        (cls.grade || '').toLowerCase().includes(q)
    );
  }, [classes, search]);

  const loadClasses = useCallback(async (silent?: boolean | any) => {
    const isSilent = silent === true;
    if (!isSilent) setLoading(true);
    try {
      const [data, tch, st] = await Promise.all([
        api.getClasses(search),
        api.getTeachersCM(),
        api.getStudents()
      ]);
      setClasses(data || []);
      setTeachers(tch || []);
      setAllStudents(st || []);
    } catch (err: any) {
      if (!isSilent) showToast('Không thể tải danh sách lớp học: ' + err.message, 'error');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadClasses();
    const handleDataChanged = () => {
      loadClasses(true);
    };
    window.addEventListener('data-changed', handleDataChanged);
    window.addEventListener('data-invalidated', handleDataChanged);
    return () => {
      window.removeEventListener('data-changed', handleDataChanged);
      window.removeEventListener('data-invalidated', handleDataChanged);
    };
  }, [loadClasses]);

  useEffect(() => {
    const handleOpenClassEvent = (e: any) => {
      const classId = e.detail?.classId;
      if (classId) {
        const target = classes.find((c) => c.id === classId);
        if (target) setSelectedClass(target);
      }
    };
    window.addEventListener('open-class-detail', handleOpenClassEvent);
    return () => {
      window.removeEventListener('open-class-detail', handleOpenClassEvent);
    };
  }, [classes]);

  const handleDeleteClass = async (cls: ClassItem) => {
    const ok = await confirm({
      title: 'Xóa Lớp Học',
      message: `Bạn có chắc chắn muốn xóa lớp học ${cls.class_name}?`,
      confirmText: 'Xóa lớp',
      type: 'danger',
    });
    if (ok) {
      try {
        await api.deleteClass(cls.id);
        showToast('Đã xóa lớp học!', 'success');
        if (selectedClass?.id === cls.id) setSelectedClass(null);
        loadClasses();
        notifyDataChanged();
      } catch (err: any) {
        showToast('Không thể xóa: ' + err.message, 'error');
      }
    }
  };

  return {
    classes,
    filteredClasses,
    teachers,
    allStudents,
    loading,
    search,
    setSearch,
    selectedClass,
    setSelectedClass,
    loadClasses,
    handleDeleteClass,
  };
}
