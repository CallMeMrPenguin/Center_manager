import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Shuffle, RefreshCw,
  FileCheck2, Save, Move, Minus, Plus, Search,
} from 'lucide-react';
import { EnrolledStudent, SeatingCol } from '../../types';
import { ClassroomPodium } from './ClassroomPodium';
import { DeskCard } from './DeskCard';

interface SeatingChartTabProps {
  seatingGrid: SeatingCol[];
  numCols: number;
  desksPerCol: number;
  absentStudentIds: Set<number>;
  unassignedStudents: EnrolledStudent[];
  showUnassignedPanel: boolean;
  mixingGA: boolean;
  onToggleUnassignedPanel: (show: boolean) => void;
  onAddColumn: () => void;
  onRemoveColumn: () => void;
  onAddDeskToCol: (colIdx: number) => void;
  onRemoveDeskFromCol: (colIdx: number) => void;
  onAutoMixSeating: () => void;
  onGeneticMixSeating: () => void;
  onBlossomSwap: () => void;
  onSaveSeating: () => void;
  onClearSeat: (colIdx: number, deskIdx: number, posIdx: number) => void;
  onDropOnSeat: (targetColIdx: number, targetDeskIdx: number, targetPosIdx: number) => void;
  onDragStartSeat: (seatPos: { colIdx: number; deskIdx: number; posIdx: number }) => void;
  onDragStartUnassigned: (student: EnrolledStudent) => void;
}

export const SeatingChartTab: React.FC<SeatingChartTabProps> = ({
  seatingGrid,
  numCols,
  desksPerCol,
  absentStudentIds,
  unassignedStudents,
  showUnassignedPanel,
  mixingGA,
  onToggleUnassignedPanel,
  onAddColumn,
  onRemoveColumn,
  onAddDeskToCol,
  onRemoveDeskFromCol,
  onAutoMixSeating,
  onGeneticMixSeating,
  onBlossomSwap,
  onSaveSeating,
  onClearSeat,
  onDropOnSeat,
  onDragStartSeat,
  onDragStartUnassigned,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUnassigned = useMemo(() => {
    if (!searchQuery.trim()) return unassignedStudents;
    const q = searchQuery.toLowerCase().trim();
    return unassignedStudents.filter(
      (s) => s.full_name?.toLowerCase().includes(q) || s.nickname?.toLowerCase().includes(q)
    );
  }, [unassignedStudents, searchQuery]);

  const totalSeats = useMemo(() => {
    return seatingGrid.reduce((acc, col) => acc + (col.desks_in_col || desksPerCol) * 2, 0);
  }, [seatingGrid, desksPerCol]);

  const totalOccupied = useMemo(() => {
    return seatingGrid.reduce((acc, col) => {
      if (!col.seats) return acc;
      return acc + col.seats.filter((s) => Boolean(s?.student_name)).length;
    }, 0);
  }, [seatingGrid]);

  const occupancyPct = totalSeats > 0 ? Math.round((totalOccupied / totalSeats) * 100) : 0;

  return (
    <div className="space-y-4 font-sans select-none">
      {/* 1. TOP CLASSROOM ACTION TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#0d1018] border border-slate-300 dark:border-white/10 p-3.5 rounded-2xl shadow-sm transition-colors">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-300">
          {/* Column Count Controller */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#121624] border border-slate-300 dark:border-white/10 px-3 py-1 rounded-xl shadow-xs">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Số Dãy:</span>
            <button
              type="button"
              onClick={onRemoveColumn}
              className="w-5 h-5 rounded bg-white dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-white font-black flex items-center justify-center cursor-pointer border border-slate-300 dark:border-transparent transition-all"
              title="Xóa 1 dãy bàn"
            >
              -
            </button>
            <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 px-1.5">
              {seatingGrid.length || numCols}
            </span>
            <button
              type="button"
              onClick={onAddColumn}
              className="w-5 h-5 rounded bg-white dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-white font-black flex items-center justify-center cursor-pointer border border-slate-300 dark:border-transparent transition-all"
              title="Thêm 1 dãy bàn"
            >
              +
            </button>
          </div>

          {/* Absent Students Badge */}
          {absentStudentIds.size > 0 && (
            <span className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 px-3 py-1 rounded-xl text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Vắng mặt: {absentStudentIds.size} học sinh</span>
            </span>
          )}

          {/* Open Unassigned Panel Button (if collapsed) */}
          {!showUnassignedPanel && (
            <button
              type="button"
              onClick={() => onToggleUnassignedPanel(true)}
              className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/40 px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer"
              title="Hiện danh sách học sinh chưa xếp chỗ"
            >
              <ChevronRight size={14} />
              <span>Chưa xếp chỗ ({unassignedStudents.length})</span>
            </button>
          )}
        </div>

        {/* Action Buttons: Mix, AI, Swap, Save */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onAutoMixSeating}
            className="group flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/40 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer"
            title="Trộn ngẫu nhiên vị trí ngồi"
          >
            <Shuffle size={14} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
            <span>Trộn Ngẫu Nhiên</span>
          </button>

          <button
            type="button"
            onClick={onGeneticMixSeating}
            disabled={mixingGA}
            className="group flex items-center gap-1.5 bg-cyan-50 dark:bg-cyan-500/20 hover:bg-cyan-100 dark:hover:bg-cyan-500/30 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer disabled:opacity-50"
            title="Trộn thông minh tối ưu học lực"
          >
            <RefreshCw size={14} className={`shrink-0 text-cyan-600 dark:text-cyan-400 ${mixingGA ? 'animate-spin' : ''}`} />
            <span>{mixingGA ? 'Đang chạy GA...' : 'Trộn Thông Minh'}</span>
          </button>

          <button
            type="button"
            onClick={onBlossomSwap}
            className="group flex items-center gap-1.5 bg-purple-50 dark:bg-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-500/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/40 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer"
            title="Đổi bài chấm chéo"
          >
            <FileCheck2 size={14} className="shrink-0 text-purple-600 dark:text-purple-400" />
            <span>Đổi Bài Chéo</span>
          </button>

          <button
            type="button"
            onClick={onSaveSeating}
            className="group flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl font-black text-xs shadow-sm transition cursor-pointer border border-emerald-500/40"
            title="Lưu cấu hình sơ đồ chỗ ngồi"
          >
            <Save size={14} className="shrink-0" />
            <span>Lưu Sơ Đồ</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN SEATING WORKSPACE */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 transition-all duration-300">
        {/* UNASSIGNED STUDENTS ROSTER PANEL */}
        {showUnassignedPanel && (
          <div className="bg-white dark:bg-[#0d1018] border border-slate-300 dark:border-white/10 p-4 rounded-2xl space-y-3 shadow-sm transition-all flex flex-col">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200 flex items-center gap-2">
                <span>Chưa Xếp Chỗ</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-[10px] font-black">
                  {unassignedStudents.length}
                </span>
              </h4>
              <button
                type="button"
                onClick={() => onToggleUnassignedPanel(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                title="Thu gọn danh sách"
              >
                <ChevronLeft size={16} />
              </button>
            </div>

            {/* Quick Live Search for Unassigned Students */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm học sinh..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#121624] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 font-semibold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Kéo học sinh và thả vào các ghế trống bên phải.
            </p>

            {/* Draggable Roster List */}
            <div className="space-y-1.5 max-h-[calc(100vh-360px)] min-h-[220px] overflow-y-auto pr-1">
              {filteredUnassigned.map((st) => {
                const isStAbsent = absentStudentIds.has(st.id);
                return (
                  <div
                    key={st.id}
                    draggable
                    onDragStart={() => onDragStartUnassigned(st)}
                    className={`p-2 rounded-xl border cursor-grab active:cursor-grabbing text-xs font-bold flex items-center justify-between shadow-2xs transition ${
                      isStAbsent
                        ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 hover:border-rose-400'
                        : 'bg-slate-50 dark:bg-[#14192b] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:border-indigo-400 dark:hover:border-indigo-500/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Move size={11} className="text-slate-400 shrink-0" />
                      <span className={`truncate ${isStAbsent ? 'line-through opacity-80' : ''}`}>
                        {st.full_name} {st.nickname ? `(${st.nickname})` : ''}
                      </span>
                    </div>
                    {isStAbsent && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40 shrink-0">
                        Vắng
                      </span>
                    )}
                  </div>
                );
              })}
              {filteredUnassigned.length === 0 && (
                <div className="text-center py-8 text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                  {searchQuery ? 'Không tìm thấy học sinh phù hợp' : 'Đã xếp đủ tất cả học sinh!'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CLASSROOM GRID CANVAS WITH PODIUM & DOUBLE DESKS */}
        <div
          className={`${
            showUnassignedPanel ? 'md:col-span-3' : 'md:col-span-4'
          } bg-[#e2e8f0]/80 dark:bg-[#080a10] border border-slate-300 dark:border-white/10 rounded-2xl p-6 overflow-x-auto min-h-[460px] flex flex-col items-center gap-6 transition-all shadow-inner`}
        >
          {/* TEACHER PODIUM & BLACKBOARD (FRONT OF CLASSROOM) */}
          <ClassroomPodium
            totalOccupied={totalOccupied}
            totalSeats={totalSeats}
            occupancyPct={occupancyPct}
          />

          {/* COLUMNS / DÃY BÀN HỌC */}
          <div className="flex justify-center items-start gap-8 w-full">
            {seatingGrid.map((col, colIdx) => (
              <div key={colIdx} className="flex flex-col items-center gap-4">
                {/* COLUMN HEADER PILL */}
                <div className="flex items-center gap-2 bg-white dark:bg-[#121624] border border-slate-300 dark:border-white/10 px-3 py-1.5 rounded-xl text-xs font-black text-slate-800 dark:text-slate-200 shadow-sm">
                  <span className="text-[11px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-black">
                    Dãy {colIdx + 1}
                  </span>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 rounded-lg p-0.5 border border-slate-200 dark:border-transparent">
                    <button
                      type="button"
                      onClick={() => onRemoveDeskFromCol(colIdx)}
                      className="w-5 h-5 rounded hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-rose-500 font-black cursor-pointer transition-colors"
                      title="Xóa 1 bàn ở dãy này"
                    >
                      <Minus size={11} strokeWidth={2.5} />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-slate-800 dark:text-white px-1">
                      {col.desks_in_col || desksPerCol} bàn
                    </span>
                    <button
                      type="button"
                      onClick={() => onAddDeskToCol(colIdx)}
                      className="w-5 h-5 rounded hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-emerald-600 font-black cursor-pointer transition-colors"
                      title="Thêm 1 bàn vào dãy này"
                    >
                      <Plus size={11} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* DESK CARDS IN THIS COLUMN */}
                {Array.from({ length: col.desks_in_col || desksPerCol }).map((_, deskIdx) => {
                  const seatLeft = col.seats ? col.seats[deskIdx * 2] : null;
                  const seatRight = col.seats ? col.seats[deskIdx * 2 + 1] : null;
                  const isLeftAbsent = seatLeft?.student_id ? absentStudentIds.has(seatLeft.student_id) : false;
                  const isRightAbsent = seatRight?.student_id ? absentStudentIds.has(seatRight.student_id) : false;

                  return (
                    <DeskCard
                      key={deskIdx}
                      colIdx={colIdx}
                      deskIdx={deskIdx}
                      seatLeft={seatLeft}
                      seatRight={seatRight}
                      isLeftAbsent={isLeftAbsent}
                      isRightAbsent={isRightAbsent}
                      onClearSeat={onClearSeat}
                      onDropOnSeat={onDropOnSeat}
                      onDragStartSeat={onDragStartSeat}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
