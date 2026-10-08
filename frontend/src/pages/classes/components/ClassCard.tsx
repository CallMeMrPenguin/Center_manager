import React from 'react';
import { Edit3, User, MapPin, Users } from 'lucide-react';
import { ClassItem, getClassColor, hexToRGBA } from '../types';

interface ClassCardProps {
  cls: ClassItem;
  index: number;
  onSelect: (cls: ClassItem) => void;
  onEdit: (cls: ClassItem) => void;
}

export const ClassCard: React.FC<ClassCardProps> = ({
  cls,
  index,
  onSelect,
  onEdit,
}) => {
  const cardColor = getClassColor(cls, index);

  return (
    <div
      onClick={() => onSelect(cls)}
      className="bg-white dark:bg-[#111728] border border-slate-200/90 dark:border-white/10 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-blue-400/50 dark:hover:border-blue-500/40 group relative overflow-hidden select-none"
    >
      {/* Top Color Accent Line */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: cardColor }}
      />

      {/* 1. Header: Class Name + Single Pen Edit */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {cls.class_name}
        </h3>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(cls);
          }}
          className="w-7 h-7 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center transition cursor-pointer shrink-0"
          title="Chỉnh sửa lớp học"
        >
          <Edit3 size={13} />
        </button>
      </div>

      {/* 2. Metadata (Clean layout, single boundary - NO nested card-in-card) */}
      <div className="my-2.5 space-y-1.5 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <User size={13} className="text-slate-400 shrink-0" />
          <span className="truncate font-semibold">{cls.teacher_name || 'Chưa phân công'}</span>
        </div>

        <div className="flex items-center justify-between gap-2 text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 truncate">
            <MapPin size={13} className="text-slate-400 shrink-0" />
            <span className="truncate">{cls.room || 'Chưa xếp phòng'}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 font-mono font-bold text-slate-700 dark:text-slate-300">
            <Users size={12} className="text-slate-400" />
            <span>{cls.student_count || 0} HS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
