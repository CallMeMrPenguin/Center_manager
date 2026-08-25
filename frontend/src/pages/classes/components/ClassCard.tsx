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
  const borderColor = hexToRGBA(cardColor, 0.35);
  const glowShadow = `0 0 24px ${hexToRGBA(cardColor, 0.22)}`;
  const hoverGlowShadow = `0 0 38px ${hexToRGBA(cardColor, 0.4)}`;

  return (
    <div
      onClick={() => onSelect(cls)}
      style={{
        borderColor: borderColor,
        boxShadow: glowShadow,
      }}
      className="bg-[#0a0d1a] border rounded-[28px] p-6 space-y-5 cursor-pointer transition-all duration-300 group relative overflow-hidden hover:-translate-y-1 hover:brightness-110"
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = hoverGlowShadow;
        e.currentTarget.style.borderColor = hexToRGBA(cardColor, 0.6);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = glowShadow;
        e.currentTarget.style.borderColor = borderColor;
      }}
    >
      {/* Top Header: Grade Pill + Circular Edit Pencil Button */}
      <div className="flex items-center justify-between">
        <span
          style={{
            backgroundColor: cardColor,
            boxShadow: `0 4px 14px ${hexToRGBA(cardColor, 0.45)}`,
          }}
          className="text-xs font-black uppercase px-4 py-1.5 rounded-full tracking-wider text-white shadow-md"
        >
          {cls.grade || 'LỚP 8'}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(cls);
          }}
          style={{
            borderColor: hexToRGBA(cardColor, 0.35),
            backgroundColor: hexToRGBA(cardColor, 0.12),
            color: cardColor,
          }}
          className="w-11 h-11 rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-95 hover:brightness-125"
          title="Chỉnh sửa hoặc xóa lớp"
        >
          <Pencil size={18} />
        </button>
      </div>

      {/* Class Title */}
      <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-slate-100 transition-colors">
        {cls.class_name}
      </h3>

      {/* 3 Detail Info Rows */}
      <div className="space-y-2.5">
        {/* Teacher */}
        <div className="flex items-center gap-3 bg-[#0e1325] border border-white/5 p-3 rounded-2xl">
          <div
            style={{
              backgroundColor: hexToRGBA(cardColor, 0.15),
              color: cardColor,
            }}
            className="p-2.5 rounded-xl flex items-center justify-center shrink-0"
          >
            <User size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-400 block leading-tight">Giáo viên</span>
            <span className="text-sm font-bold text-white block truncate">{cls.teacher_name || 'Chưa phân công'}</span>
          </div>
        </div>

        {/* Room */}
        <div className="flex items-center gap-3 bg-[#0e1325] border border-white/5 p-3 rounded-2xl">
          <div
            style={{
              backgroundColor: hexToRGBA(cardColor, 0.15),
              color: cardColor,
            }}
            className="p-2.5 rounded-xl flex items-center justify-center shrink-0"
          >
            <MapPin size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-400 block leading-tight">Phòng</span>
            <span className="text-sm font-bold text-white block truncate">{cls.room || 'Chưa xếp'}</span>
          </div>
        </div>

        {/* Students */}
        <div className="flex items-center gap-3 bg-[#0e1325] border border-white/5 p-3 rounded-2xl">
          <div
            style={{
              backgroundColor: hexToRGBA(cardColor, 0.15),
              color: cardColor,
            }}
            className="p-2.5 rounded-xl flex items-center justify-center shrink-0"
          >
            <Users size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-400 block leading-tight">Học sinh</span>
            <span className="text-sm font-bold text-white block">{cls.student_count || 0} học sinh</span>
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
