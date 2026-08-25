import React, { useState, useEffect } from 'react';
import { BookOpen, X, Trash2 } from 'lucide-react';
import { ClassItem, TeacherCM, ClassDayConfig, GRADE_LIST, WEEKDAYS } from '../../types';
import { CustomSelect } from '../../../../components/CustomSelect';
import { api } from '../../../../api';
import { showToast } from '../../../../components/Toast';

interface ClassFormModalProps {
  isOpen: boolean;
  editingClass: ClassItem | null;
  teachers: TeacherCM[];
  onClose: () => void;
  onSaved: () => void;
  onDeleteClass?: (cls: ClassItem) => void;
}

export const ClassFormModal: React.FC<ClassFormModalProps> = ({
  isOpen,
  editingClass,
  teachers,
  onClose,
  onSaved,
  onDeleteClass,
}) => {
  const defaultClassDayConfigs = () =>
    WEEKDAYS.reduce((acc, day) => {
      acc[day] = { checked: day === 'Thứ 2' || day === 'Thứ 4', time: '18:00', duration: 90 };
      return acc;
    }, {} as Record<string, ClassDayConfig>);

  const [classForm, setClassForm] = useState<Partial<ClassItem>>({
    class_name: '',
    teacher_id: undefined,
    grade: 'Lớp 6',
    subject: 'Tiếng Anh',
    room: '',
    status: 'Đang hoạt động',
    notes: '',
  });

  const [classDayConfigs, setClassDayConfigs] = useState<Record<string, ClassDayConfig>>(defaultClassDayConfigs());

  useEffect(() => {
    if (editingClass) {
      setClassForm({ ...editingClass });
      api.getClassWeeklySchedule(editingClass.id).then((slots) => {
        const newCfgs = defaultClassDayConfigs();
        WEEKDAYS.forEach((d) => {
          newCfgs[d].checked = false;
        });
        if (slots && slots.length > 0) {
          slots.forEach((s: any) => {
            if (newCfgs[s.day_of_week]) {
              newCfgs[s.day_of_week] = {
                checked: true,
                time: s.start_time || '18:00',
                duration: s.duration || 90,
              };
            }
          });
        }
        setClassDayConfigs(newCfgs);
      }).catch(() => {
        setClassDayConfigs(defaultClassDayConfigs());
      });
    } else {
      setClassForm({
        class_name: '',
        teacher_id: undefined,
        grade: 'Lớp 6',
        subject: 'Tiếng Anh',
        room: '',
        status: 'Đang hoạt động',
        notes: '',
      });
      setClassDayConfigs(defaultClassDayConfigs());
    }
  }, [editingClass, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.class_name?.trim()) {
      showToast('Tên lớp học không được để trống!', 'error');
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

      if (cid) {
        const slotsPayload = WEEKDAYS.filter((d) => classDayConfigs[d]?.checked).map((day) => ({
          day_of_week: day,
          start_time: classDayConfigs[day].time,
          duration: classDayConfigs[day].duration,
          notes: classForm.room || '',
        }));
        await api.replaceClassWeeklySlots(cid, slotsPayload);
      }

      showToast(editingClass ? 'Đã cập nhật lớp học và lịch học!' : 'Đã tạo lớp học mới và đồng bộ lịch học!', 'success');
      onSaved();
    } catch (err: any) {
      showToast('Lỗi khi lưu: ' + err.message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-mac-dropdown">
      <div className="bg-[#0f1320] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#14192b]">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-400" />
            <span>{editingClass ? 'Cập Nhật Lớp Học' : 'Tạo Lớp Học Mới'}</span>
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
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
                options={GRADE_LIST.map((g) => ({ value: g, label: g }))}
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">Giáo Viên Phụ Trách</label>
              <CustomSelect
                value={classForm.teacher_id || ''}
                onChange={(val) => setClassForm({ ...classForm, teacher_id: val ? Number(val) : undefined })}
                options={[
                  { value: '', label: '-- Chưa phân công --' },
                  ...teachers.map((t) => ({ value: t.id, label: t.full_name })),
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
              {['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1', '#fb7185'].map((hex) => (
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

          {/* MULTI-DAY SCHEDULE SELECTOR */}
          <div className="space-y-2 border-t border-white/10 pt-3">
            <label className="block text-[11px] font-extrabold text-indigo-400 uppercase tracking-wider mb-2">
              Lịch Học Theo Thứ (Cấu hình giờ & thời lượng riêng từng thứ)
            </label>
            <div className="space-y-2 bg-[#141928] p-3 rounded-xl border border-white/10">
              {WEEKDAYS.map((day) => {
                const cfg = classDayConfigs[day] || { checked: false, time: '18:00', duration: 90 };
                return (
                  <div key={day} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setClassDayConfigs((p) => ({ ...p, [day]: { ...p[day], checked: !p[day]?.checked } }))}
                      className={`shrink-0 h-5 w-5 rounded-lg border-2 flex items-center justify-center text-[9px] font-black transition cursor-pointer ${
                        cfg.checked ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-transparent border-white/20 text-transparent'
                      }`}
                    >
                      ✓
                    </button>
                    <span className={`text-xs font-bold w-16 shrink-0 ${cfg.checked ? 'text-white' : 'text-slate-500'}`}>{day}</span>
                    <input
                      type="time"
                      value={cfg.time}
                      disabled={!cfg.checked}
                      onChange={(e) => setClassDayConfigs((p) => ({ ...p, [day]: { ...p[day], time: e.target.value } }))}
                      className={`flex-1 bg-[#0d1018] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 ${
                        !cfg.checked ? 'opacity-30' : ''
                      }`}
                    />
                    <input
                      type="number"
                      value={cfg.duration}
                      min={30}
                      max={240}
                      step={15}
                      disabled={!cfg.checked}
                      onChange={(e) => setClassDayConfigs((p) => ({ ...p, [day]: { ...p[day], duration: parseInt(e.target.value) || 90 } }))}
                      className={`w-14 bg-[#0d1018] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 ${
                        !cfg.checked ? 'opacity-30' : ''
                      }`}
                    />
                    <span className={`text-[10px] text-slate-500 shrink-0 ${!cfg.checked ? 'opacity-30' : ''}`}>phút</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            {editingClass && onDeleteClass ? (
              <button
                type="button"
                onClick={() => onDeleteClass(editingClass)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-bold border border-rose-500/30 transition cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Xóa Lớp Học</span>
              </button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold cursor-pointer">
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] text-white text-xs font-extrabold border border-white/20 cursor-pointer shadow-[0_4px_12px_rgba(92,54,245,0.4)]"
              >
                Lưu Lớp Học
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
