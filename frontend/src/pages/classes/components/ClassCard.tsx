import React from 'react';
import { Pencil, User, MapPin, Users } from 'lucide-react';
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
  const glowShadow = `0 0 24px ${hexToRGBA(cardColor, 0.15)}`;
  const hoverGlowShadow = `0 0 32px ${hexToRGBA(cardColor, 0.3)}`;

  return (
    <div
      onClick={() => onSelect(cls)}
      style={{
        boxShadow: glowShadow,
      }}
      className="bg-white dark:bg-[#141417] rounded-2xl sm:rounded-[28px] p-4 sm:p-6 space-y-3.5 sm:space-y-5 cursor-pointer transition-all duration-300 group relative overflow-hidden hover:-translate-y-1 hover:brightness-105"
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = hoverGlowShadow;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = glowShadow;
      }}
    >
      {/* Top Header: Grade Pill + Circular Edit Pencil Button */}
      <div className="flex items-center justify-between">
        <span
          style={{
            backgroundColor: cardColor,
            boxShadow: `0 4px 14px ${hexToRGBA(cardColor, 0.35)}`,
          }}
          className="text-xs font-black uppercase px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full tracking-wider text-white shadow-md"
        >
          {cls.grade || 'LỚP 8'}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(cls);
          }}
          style={{
            backgroundColor: hexToRGBA(cardColor, 0.18),
            color: cardColor,
          }}
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 hover:brightness-115"
          title="Chỉnh sửa hoặc xóa lớp"
        >
          <Pencil size={15} />
        </button>
      </div>

      {/* Class Title */}
      <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-slate-100 transition-colors">
        {cls.class_name}
      </h3>

      {/* 3 Detail Info Rows */}
      <div className="space-y-2 sm:space-y-2.5">
        {/* Teacher */}
        <div
          style={{
            backgroundColor: hexToRGBA(cardColor, 0.14),
          }}
          className="flex items-center gap-2.5 sm:gap-3.5 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-200 hover:brightness-95 dark:hover:brightness-125"
        >
          <div
            style={{
              backgroundColor: hexToRGBA(cardColor, 0.26),
              color: cardColor,
            }}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
          >
            <User size={16} strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 block leading-tight">Giáo viên</span>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white block truncate">{cls.teacher_name || 'Chưa phân công'}</span>
          </div>
        </div>

        {/* Room */}
        <div
          style={{
            backgroundColor: hexToRGBA(cardColor, 0.14),
          }}
          className="flex items-center gap-2.5 sm:gap-3.5 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-200 hover:brightness-95 dark:hover:brightness-125"
        >
          <div
            style={{
              backgroundColor: hexToRGBA(cardColor, 0.26),
              color: cardColor,
            }}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
          >
            <MapPin size={16} strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 block leading-tight">Phòng</span>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white block truncate">{cls.room || 'Chưa xếp'}</span>
          </div>
        </div>

        {/* Students */}
        <div
          style={{
            backgroundColor: hexToRGBA(cardColor, 0.14),
          }}
          className="flex items-center gap-2.5 sm:gap-3.5 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-200 hover:brightness-95 dark:hover:brightness-125"
        >
          <div
            style={{
              backgroundColor: hexToRGBA(cardColor, 0.26),
              color: cardColor,
            }}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
          >
            <Users size={16} strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 block leading-tight">Học sinh</span>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white block font-mono">{cls.student_count || 0} học sinh</span>
          </div>
        </div>
      </div>

      {/* Action Button: Vào lớp */}
      <div className="pt-1">
        <button
          onClick={() => onSelect(cls)}
          style={{
            backgroundColor: cardColor,
            boxShadow: `0 4px 20px ${hexToRGBA(cardColor, 0.4)}`,
          }}
          className="w-full py-3.5 px-6 rounded-2xl font-bold text-base text-white shadow-lg transition-all duration-300 cursor-pointer text-center active:scale-98 hover:brightness-110 flex items-center justify-center"
        >
          Vào lớp
        </button>
      </div>
    </div>
  );
};
