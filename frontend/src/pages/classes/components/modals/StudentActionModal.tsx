import React, { useState } from 'react';
import { Edit3, X, Trash2 } from 'lucide-react';
import { ClassItem, EnrolledStudent } from '../../types';

interface StudentActionModalProps {
  isOpen: boolean;
  student: EnrolledStudent | null;
  selectedClass: ClassItem | null;
  onClose: () => void;
  onUnenroll: (studentId: number) => Promise<void> | void;
}

export const StudentActionModal: React.FC<StudentActionModalProps> = ({
  isOpen,
  student,
  selectedClass,
  onClose,
  onUnenroll,
}) => {
  const [removing, setRemoving] = useState(false);
  if (!isOpen || !student) return null;

  const handleUnenroll = async () => {
    setRemoving(true);
    try {
      await onUnenroll(student.id);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-mac-dropdown">
      <div className="bg-white dark:bg-[#0f1528] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl dark:shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#14192b]">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
            <span>Học Sinh: {student.full_name}</span>
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
            Quản lý trạng thái tham gia lớp học của học sinh trong lớp{' '}
            <span className="text-indigo-600 dark:text-indigo-400 font-black">{selectedClass?.class_name}</span>.
          </p>

          <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex flex-col gap-2">
            <button
              type="button"
              disabled={removing}
              onClick={handleUnenroll}
              className="w-full py-2.5 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 hover:bg-rose-500/20 dark:hover:bg-rose-500/30 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={14} />
              <span>{removing ? 'Đang rút khỏi lớp...' : 'Rút Học Sinh Khỏi Lớp Này'}</span>
            </button>

            <button
              type="button"
              disabled={removing}
              onClick={onClose}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
