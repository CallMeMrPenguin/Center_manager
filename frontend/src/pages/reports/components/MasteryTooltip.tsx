import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeatmapUnit,
  HeatmapStudent,
  StudentUnitData,
  resolveFullUnitInfo,
  getBadgeStyle,
  getStatusBadge,
} from './heatmapUtils';
import { trunc1Dec } from '../../../utils';

export interface TargetRect {
  left: number;
  top: number;
  width: number;
  height: number;
  bottom: number;
}

export interface HoveredColState {
  unit: HeatmapUnit;
  targetRect: TargetRect;
  grade?: string;
}

export interface HoveredCellState {
  student: HeatmapStudent;
  unit: HeatmapUnit;
  data?: StudentUnitData;
  targetRect: TargetRect;
  grade?: string;
}

interface MasteryTooltipProps {
  hoveredCol: HoveredColState | null;
  hoveredCell: HoveredCellState | null;
}

export const MasteryTooltip: React.FC<MasteryTooltipProps> = ({
  hoveredCol,
  hoveredCell,
}) => {
  if (typeof document === 'undefined') return null;

  // 1. Column Header Tooltip
  if (hoveredCol) {
    const { unit, targetRect, grade } = hoveredCol;
    const unitInfo = resolveFullUnitInfo(unit.unit_key, unit.unit_name, grade);
    const scoreStyle = getBadgeStyle(unit.avg_score);

    const cardWidth = 270;
    const cardHeight = 165;

    // Center horizontally over the target element, clamped to viewport edges
    let left = targetRect.left + targetRect.width / 2 - cardWidth / 2;
    left = Math.max(12, Math.min(window.innerWidth - cardWidth - 12, left));

    // Place directly above the header by default; flip below if too close to top edge
    let top = targetRect.top - cardHeight - 10;
    if (top < 10) {
      top = targetRect.bottom + 10;
    }

    return createPortal(
      <AnimatePresence>
        <motion.div
          key={`col-${unit.unit_id || unit.unit_key}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            left: `${left}px`,
            top: `${top}px`,
            width: `${cardWidth}px`,
          }}
          className="z-50 pointer-events-none bg-white dark:bg-[#0e1224] rounded-2xl p-3.5 shadow-xl dark:shadow-[0_16px_40px_rgba(0,0,0,0.95)] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white space-y-2.5 select-none"
        >
          {/* Header: Unit Key & Skill */}
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-white/10">
            <span className="font-black text-slate-900 dark:text-white text-sm">
              {unit.unit_key}
            </span>
            <span
              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                unit.skill === 'vocab'
                  ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                  : 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
              }`}
            >
              {unit.skill === 'vocab' ? 'Từ Vựng' : 'Ngữ Pháp'}
            </span>
          </div>

          {/* Unit Full Name & Vietnamese Title */}
          <div className="space-y-0.5">
            {unitInfo.unitName && (
              <div className="text-xs font-extrabold text-indigo-600 dark:text-indigo-300 leading-snug">
                {unitInfo.unitName}
              </div>
            )}
            {unitInfo.vietnameseTitle && (
              <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                {unitInfo.vietnameseTitle}
              </div>
            )}
          </div>

          {/* Class Average Score & Stats */}
          <div className="bg-slate-50 dark:bg-[#080b16] p-2.5 rounded-xl border border-slate-200 dark:border-white/5 space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400 font-sans font-medium">
                Điểm TB Cả Lớp:
              </span>
              <span className={`font-black text-sm ${scoreStyle.textColor}`}>
                TB {trunc1Dec(unit.avg_score)} / 10
              </span>
            </div>

            {unit.mastery_pct !== undefined && unit.mastery_pct > 0 && (
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span className="text-slate-600 dark:text-slate-400 font-sans font-medium">
                  Tỷ Lệ Nắm Vững:
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {unit.mastery_pct}%
                  {unit.mastered_count !== undefined && unit.student_count !== undefined && (
                    <span className="text-[10px] text-slate-500 ml-1">
                      ({unit.mastered_count}/{unit.student_count} HS)
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Footer Hint */}
          <div className="text-[10px] text-slate-500 italic text-center">
            Rê chuột vào điểm học sinh để xem chi tiết
          </div>
        </motion.div>
      </AnimatePresence>,
      document.body
    );
  }

  // 2. Student Cell Tooltip
  if (hoveredCell) {
    const { student, unit, data, targetRect, grade } = hoveredCell;
    const unitInfo = resolveFullUnitInfo(unit.unit_key, unit.unit_name || data?.unit_name, grade || student.grade);
    const hasData = Boolean(data && data.ema_score !== undefined && data.ema_score >= 0);
    const scoreStyle = hasData ? getBadgeStyle(data?.ema_score) : null;
    const statusInfo = getStatusBadge(data?.mastery_status, data?.ema_score);

    const cardWidth = 270;
    const cardHeight = 225;

    // Center horizontally over the target cell, clamped to viewport edges
    let left = targetRect.left + targetRect.width / 2 - cardWidth / 2;
    left = Math.max(12, Math.min(window.innerWidth - cardWidth - 12, left));

    // Place directly above the cell by default; flip below if too close to top edge
    let top = targetRect.top - cardHeight - 10;
    if (top < 10) {
      top = targetRect.bottom + 10;
    }

    return createPortal(
      <AnimatePresence>
        <motion.div
          key={`cell-${student.student_id}-${unit.unit_id || unit.unit_key}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            left: `${left}px`,
            top: `${top}px`,
            width: `${cardWidth}px`,
          }}
          className="z-50 pointer-events-none bg-white dark:bg-[#0e1224] rounded-2xl p-3.5 shadow-xl dark:shadow-[0_16px_40px_rgba(0,0,0,0.95)] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white space-y-2.5 select-none"
        >
          {/* Header: Student Name & Skill Badge */}
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-white/10">
            <div className="flex flex-col min-w-0">
              <span className="font-black text-slate-900 dark:text-white text-sm truncate">
                {student.student_name}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {student.nickname && (
                  <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/15 px-1.5 py-0.5 rounded">
                    {student.nickname}
                  </span>
                )}
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                  {student.class_name}
                </span>
              </div>
            </div>

            <span
              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                unit.skill === 'vocab'
                  ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                  : 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
              }`}
            >
              {unit.skill === 'vocab' ? 'Từ Vựng' : 'Ngữ Pháp'}
            </span>
          </div>

          {/* Unit Info: Key, Full Name & Vietnamese Title */}
          <div className="space-y-0.5">
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              {unit.unit_key}
            </div>
            {unitInfo.unitName && (
              <div className="text-xs font-extrabold text-indigo-600 dark:text-indigo-300 leading-snug">
                {unitInfo.unitName}
              </div>
            )}
            {unitInfo.vietnameseTitle && (
              <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                {unitInfo.vietnameseTitle}
              </div>
            )}
          </div>

          {/* Score Stats */}
          <div className="space-y-1.5 bg-slate-50 dark:bg-[#080b16] p-2.5 rounded-xl border border-slate-200 dark:border-white/5 font-mono text-[11px]">
            {hasData && data ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400 font-sans font-medium">
                    Điểm EMA Tích Lũy:
                  </span>
                  <span className={`font-black text-sm ${scoreStyle?.textColor}`}>
                    {trunc1Dec(data.ema_score)} / 10
                  </span>
                </div>

                {data.last_score !== undefined && (
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span className="text-slate-600 dark:text-slate-400 font-sans font-medium">
                      Điểm Test Gần Nhất:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {trunc1Dec(data.last_score)}đ
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <span className="text-slate-600 dark:text-slate-400 font-sans font-medium">
                    Số Lần Đã Test:
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-300">
                    {data.test_count} buổi
                  </span>
                </div>

                {data.last_tested && (
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span className="text-slate-600 dark:text-slate-400 font-sans font-medium">
                      Ngày Test:
                    </span>
                    <span className="font-semibold text-slate-500">
                      {data.last_tested}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-slate-500 text-center py-1 font-sans">
                Chưa có bài kiểm tra cho bài học này
              </div>
            )}

            {/* Class Average Info on Student Tooltip */}
            <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-white/5">
              <span className="text-slate-600 dark:text-slate-400 font-sans font-medium">
                Điểm TB Cả Lớp:
              </span>
              <span className="font-extrabold text-slate-700 dark:text-slate-300">
                TB {trunc1Dec(unit.avg_score)} / 10
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between pt-0.5 text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Trạng thái:
            </span>
            <span className={`font-black px-2 py-0.5 rounded-md ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>,
      document.body
    );
  }

  return null;
};
