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
  getMasteryRateStyle,
  MasteryColorSettings,
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
  masteryColorConfig?: MasteryColorSettings;
}

const CARD_WIDTH = 290;

function computeTooltipPos(targetRect: TargetRect, width: number, height: number) {
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Prefer placing tooltip to the right of targetRect with a 16px safe gap
  const spaceRight = windowWidth - (targetRect.left + targetRect.width + 16);
  const spaceLeft = targetRect.left - 16;

  let left: number;
  if (spaceRight >= width) {
    left = targetRect.left + targetRect.width + 16;
  } else if (spaceLeft >= width) {
    left = targetRect.left - width - 16;
  } else {
    // If not enough side space on small screens, center horizontally
    left = Math.max(12, Math.min(windowWidth - width - 12, targetRect.left + targetRect.width / 2 - width / 2));
  }

  // Vertical positioning: align near top of target element, keeping inside viewport
  let top = targetRect.top - 6;
  if (top + height > windowHeight - 16) {
    top = windowHeight - height - 16;
  }
  if (top < 16) {
    top = 16;
  }

  return { left, top };
}

export const MasteryTooltip: React.FC<MasteryTooltipProps> = ({
  hoveredCol,
  hoveredCell,
  masteryColorConfig,
}) => {
  if (typeof document === 'undefined') return null;

  // 1. Column Header Tooltip
  if (hoveredCol) {
    const { unit, targetRect, grade } = hoveredCol;
    const unitInfo = resolveFullUnitInfo(unit.unit_key, unit.unit_name, grade, unit.skill, unit.grammar_topic);
    const scoreStyle = getBadgeStyle(unit.avg_score);
    const rateStyle = getMasteryRateStyle(unit.mastery_pct, masteryColorConfig);
    const { left, top } = computeTooltipPos(targetRect, CARD_WIDTH, 260);

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
            width: `${CARD_WIDTH}px`,
            pointerEvents: 'none',
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

          {/* Grammar Topic / Vocab Theme Display */}
          {unit.skill === 'grammar' ? (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-2.5 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                <span>Chủ Điểm Ngữ Pháp</span>
                {unitInfo.grammarTopics?.length > 1 && (
                  <span className="text-[9px] bg-purple-500/20 px-1.5 py-0.5 rounded-full font-bold">
                    {unitInfo.grammarTopics.length} cấu trúc
                  </span>
                )}
              </div>
              <div className="text-xs font-black text-purple-700 dark:text-purple-200 leading-snug">
                {unitInfo.grammarTopic || unitInfo.grammarSummaryVi || 'Ngữ pháp trọng tâm Unit'}
              </div>
              {unitInfo.grammarSummaryVi && unitInfo.grammarSummaryVi !== unitInfo.grammarTopic && (
                <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                  {unitInfo.grammarSummaryVi}
                </div>
              )}
              {unitInfo.grammarTopics && unitInfo.grammarTopics.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {unitInfo.grammarTopics.map((gt, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md"
                    >
                      {gt}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5 space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Chủ Đề Từ Vựng
              </div>
              <div className="text-xs font-black text-blue-700 dark:text-blue-200 leading-snug">
                {unitInfo.unitName}
              </div>
              {unitInfo.vietnameseTitle && (
                <div className="text-[11px] text-slate-600 dark:text-slate-300">
                  {unitInfo.vietnameseTitle}
                </div>
              )}
            </div>
          )}

          {/* Unit theme context footer */}
          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between px-0.5">
            <span>Unit: {unit.unit_key}</span>
            {unitInfo.unitName && unit.skill === 'grammar' && (
              <span className="truncate max-w-[160px] text-right font-medium">
                Chủ đề: {unitInfo.unitName}
              </span>
            )}
          </div>

          {/* Class Average Score & Stats */}
          <div className="bg-slate-50 dark:bg-[#080b16] p-2.5 rounded-xl border border-slate-200 dark:border-white/5 space-y-2 font-mono text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400 font-sans font-medium">
                Điểm TB Cả Lớp:
              </span>
              <span className={`font-black text-sm ${scoreStyle.textColor}`}>
                TB {trunc1Dec(unit.avg_score)} / 10
              </span>
            </div>

            {unit.mastery_pct !== undefined && (
              <div className="space-y-1 pt-1 border-t border-slate-200 dark:border-white/5">
                <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <span className="text-slate-600 dark:text-slate-400 font-sans font-medium">
                    Tỷ Lệ Nắm Vững:
                  </span>
                  <span className={`font-black px-2 py-0.5 rounded-md ${rateStyle.badgeClass}`}>
                    {unit.mastery_pct}%
                    {unit.mastered_count !== undefined && unit.student_count !== undefined && (
                      <span className="text-[10px] ml-1 opacity-80 font-sans">
                        ({unit.mastered_count}/{unit.student_count} HS)
                      </span>
                    )}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-[#1a2035] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${rateStyle.barColor}`}
                    style={{ width: `${Math.min(100, Math.max(0, unit.mastery_pct))}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-sans pt-0.5">
                  <span>Mức độ: {rateStyle.label}</span>
                  <span>{rateStyle.levelName}</span>
                </div>
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
    const unitInfo = resolveFullUnitInfo(
      unit.unit_key,
      unit.unit_name || data?.unit_name,
      grade || student.grade,
      unit.skill,
      unit.grammar_topic || data?.grammar_topic
    );
    const hasData = Boolean(data && data.ema_score !== undefined && data.ema_score >= 0);
    const scoreStyle = hasData ? getBadgeStyle(data?.ema_score) : null;
    const statusInfo = getStatusBadge(data?.mastery_status, data?.ema_score);

    const { left, top } = computeTooltipPos(targetRect, CARD_WIDTH, 240);

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
            width: `${CARD_WIDTH}px`,
            pointerEvents: 'none',
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

          {/* Grammar Topic / Vocab Theme Display */}
          {unit.skill === 'grammar' ? (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-2 space-y-0.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Ngữ pháp: {unit.unit_key}
              </div>
              <div className="text-xs font-black text-purple-700 dark:text-purple-200 leading-snug">
                {unitInfo.grammarTopic || unitInfo.grammarSummaryVi || unitInfo.unitName}
              </div>
              {unitInfo.grammarSummaryVi && unitInfo.grammarSummaryVi !== unitInfo.grammarTopic && (
                <div className="text-[10px] text-slate-600 dark:text-slate-300 line-clamp-2">
                  {unitInfo.grammarSummaryVi}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2 space-y-0.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Từ vựng: {unit.unit_key}
              </div>
              <div className="text-xs font-black text-blue-700 dark:text-blue-200 leading-snug">
                {unitInfo.unitName}
              </div>
              {unitInfo.vietnameseTitle && (
                <div className="text-[10px] text-slate-600 dark:text-slate-300">
                  {unitInfo.vietnameseTitle}
                </div>
              )}
            </div>
          )}

          {/* Score Stats */}
          <div className="space-y-1.5 bg-slate-50 dark:bg-[#080b16] p-2.5 rounded-xl border border-slate-200 dark:border-white/5 font-mono text-[11px]">
            {hasData && data ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400 font-sans font-medium">Điểm EMA Tích Lũy:</span>
                  <span className={`font-black text-sm ${scoreStyle?.textColor}`}>{trunc1Dec(data.ema_score)} / 10</span>
                </div>
                {data.last_score !== undefined && (
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span className="text-slate-600 dark:text-slate-400 font-sans font-medium">Điểm Test Gần Nhất:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{trunc1Dec(data.last_score)}đ</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <span className="text-slate-600 dark:text-slate-400 font-sans font-medium">Số Lần Đã Test:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-300">{data.test_count} buổi</span>
                </div>
                {data.last_tested && (
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span className="text-slate-600 dark:text-slate-400 font-sans font-medium">Ngày Test:</span>
                    <span className="font-semibold text-slate-500">{data.last_tested}</span>
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
              <span className="text-slate-600 dark:text-slate-400 font-sans font-medium">Điểm TB Cả Lớp:</span>
              <span className="font-extrabold text-slate-700 dark:text-slate-300">TB {trunc1Dec(unit.avg_score)} / 10</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between pt-0.5 text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Trạng thái:</span>
            <span className={`font-black px-2 py-0.5 rounded-md ${statusInfo.className}`}>{statusInfo.label}</span>
          </div>
        </motion.div>
      </AnimatePresence>,
      document.body
    );
  }

  return null;
};
