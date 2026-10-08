import React from 'react';
import { Edit3, User, MapPin, Users, ArrowRight } from 'lucide-react';
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

      {/* 1. Header: Grade Pill + Title + Single Pen Edit */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center justify-between gap-2">
          <span
            style={{
              backgroundColor: hexToRGBA(cardColor, 0.15),
              color: cardColor,
            }}
            className="text-[10.5px] font-black uppercase px-2.5 py-0.5 rounded-md tracking-wider shrink-0"
          >
            {cls.grade || 'Lớp học'}
          </span>

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

        <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {cls.class_name}
        </h3>
      </div>

      {/* 2. Metadata (Clean layout, single boundary - NO nested card-in-card) */}
      <div className="my-3 space-y-1.5 text-xs">
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

      {/* 3. Action Footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
        <span>Vào lớp học</span>
        <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  );
};
