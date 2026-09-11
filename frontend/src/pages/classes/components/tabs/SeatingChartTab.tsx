import React from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, Shuffle, RefreshCw,
  FileCheck2, Save, Move, Minus, Plus,
} from 'lucide-react';
import { EnrolledStudent, SeatingCol } from '../../types';
import { CustomDatePicker } from '../../../../components/CustomDatePicker';

interface SeatingChartTabProps {
  seatingGrid: SeatingCol[];
  numCols: number;
  desksPerCol: number;
  attendanceDate: string;
  selectedClassWeeklyDays: number[];
  absentStudentIds: Set<number>;
  unassignedStudents: EnrolledStudent[];
  showUnassignedPanel: boolean;
  mixingGA: boolean;
  onDateChange: (date: string) => void;
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
  attendanceDate,
  selectedClassWeeklyDays,
  absentStudentIds,
  unassignedStudents,
  showUnassignedPanel,
  mixingGA,
  onDateChange,
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
  return (
    <div className="space-y-4">
      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d1018] border border-white/10 p-3.5 rounded-2xl">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-300">
          <div className="flex items-center gap-1.5 bg-[#121624] border border-white/10 px-2.5 py-1 rounded-xl">
            <span className="text-[11px]">Tổng Cột:</span>
            <button
              onClick={onRemoveColumn}
              className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 text-white font-extrabold flex items-center justify-center cursor-pointer"
              title="Xóa 1 cột"
            >
              -
            </button>
            <span className="font-extrabold text-indigo-400 px-1">{seatingGrid.length || numCols}</span>
            <button
              onClick={onAddColumn}
              className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 text-white font-extrabold flex items-center justify-center cursor-pointer"
              title="Thêm 1 cột"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-2 bg-[#121624] border border-white/10 px-2.5 py-1 rounded-xl">
            <Calendar size={13} className="text-indigo-400" />
            <CustomDatePicker
              value={attendanceDate}
              onChange={onDateChange}
              highlightDaysOfWeek={selectedClassWeeklyDays}
              className="w-36 text-xs"
            />
          </div>

          {absentStudentIds.size > 0 && (
            <span className="flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-xl text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              <span>Vắng mặt: {absentStudentIds.size} học sinh</span>
            </span>
          )}

          {!showUnassignedPanel && (
            <button
              onClick={() => onToggleUnassignedPanel(true)}
              className="flex items-center gap-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-3 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer"
              title="Hiện danh sách học sinh chưa xếp chỗ"
            >
              <ChevronRight size={14} />
              <span>Mở DSHS Chưa Xếp ({unassignedStudents.length})</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onAutoMixSeating}
            className="group flex items-center gap-0 hover:gap-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all duration-300 cursor-pointer"
            title="Trộn Ngẫu Nhiên"
          >
            <Shuffle size={14} className="shrink-0" />
            <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">
              Trộn Ngẫu Nhiên
            </span>
          </button>

          <button
            onClick={onGeneticMixSeating}
            disabled={mixingGA}
            className="group flex items-center gap-0 hover:gap-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all duration-300 cursor-pointer disabled:opacity-50"
            title="Trộn Thông Minh (AI/GA)"
          >
            <RefreshCw size={14} className={`shrink-0 ${mixingGA ? 'animate-spin' : ''}`} />
            <span className="max-w-0 opacity-0 group-hover:max-w-[160px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">
              {mixingGA ? 'Đang chạy GA...' : 'Trộn Thông Minh'}
            </span>
          </button>

          <button
            onClick={onBlossomSwap}
            className="group flex items-center gap-0 hover:gap-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all duration-300 cursor-pointer"
            title="Đổi Bài (Blossom)"
          >
            <FileCheck2 size={14} className="shrink-0" />
            <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">
              Đổi Bài
            </span>
          </button>

          <button
            onClick={onSaveSeating}
            className="group flex items-center gap-0 hover:gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl font-extrabold text-xs shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-all duration-300 cursor-pointer border border-white/10"
            title="Lưu Sơ Đồ"
          >
            <Save size={14} className="shrink-0" />
            <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">
              Lưu Sơ Đồ
            </span>
          </button>
        </div>
      </div>

      {/* SEATING GRID & UNASSIGNED SIDEBAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 transition-all duration-300">
        {/* UNASSIGNED ROSTER SIDEBAR WITH COLLAPSE BUTTON */}
        {showUnassignedPanel && (
          <div className="bg-[#0d1018] border border-white/10 p-4 rounded-2xl space-y-3 transition-all duration-300">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-slate-300 flex items-center gap-2">
                <span>Học Sinh Chưa Xếp Chỗ</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px]">
                  {unassignedStudents.length}
                </span>
              </h4>
              <button
                onClick={() => onToggleUnassignedPanel(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                title="Thu gọn khung này"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
            <p className="text-[10px] text-slate-500">Kéo và thả học sinh vào vị trí bàn học bên phải.</p>

            <div className="space-y-2 max-h-[calc(100vh-320px)] min-h-[240px] overflow-y-auto pr-1">
              {unassignedStudents.map((st) => {
                const isStAbsent = absentStudentIds.has(st.id);
                return (
                  <div
                    key={st.id}
                    draggable
                    onDragStart={() => onDragStartUnassigned(st)}
                    className={`p-2.5 rounded-xl border cursor-grab active:cursor-grabbing text-xs font-extrabold flex items-center justify-between shadow-md transition ${
                      isStAbsent
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:border-rose-400'
                        : 'bg-[#14192b] border-white/10 text-white hover:border-indigo-500/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Move size={12} className="text-slate-500 shrink-0" />
                      <span className={`truncate ${isStAbsent ? 'line-through text-rose-200 opacity-80' : ''}`}>
                        {st.full_name}
                      </span>
                    </div>
                    {isStAbsent && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0 ml-1">
                        Vắng
                      </span>
                    )}
                  </div>
                );
              })}
              {unassignedStudents.length === 0 && (
                <div className="text-center py-8 text-[11px] text-slate-500 font-bold">
                  Đã xếp đủ tất cả học sinh!
                </div>
              )}
            </div>
          </div>
        )}

        {/* GRAPHICAL SEATING GRID */}
        <div
          className={`${
            showUnassignedPanel ? 'md:col-span-3' : 'md:col-span-4'
          } bg-[#080a10] border border-white/10 rounded-2xl p-6 overflow-x-auto min-h-[420px] flex justify-center items-start gap-8 transition-all`}
        >
          {seatingGrid.map((col, colIdx) => (
            <div key={colIdx} className="flex flex-col items-center gap-4">
              {/* PER-COLUMN DESK CONTROLS */}
              <div className="flex items-center gap-2 bg-[#121624] border border-white/10 px-3 py-1 rounded-xl text-xs font-bold text-slate-300">
                <span className="text-[10px] font-black uppercase text-indigo-400">Cột {colIdx + 1}</span>
                <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => onRemoveDeskFromCol(colIdx)}
                    className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-rose-400 font-extrabold cursor-pointer"
                    title="Xóa 1 bàn ở cột này"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="text-[10px] font-extrabold text-white px-1">
                    {col.desks_in_col || desksPerCol} bàn
                  </span>
                  <button
                    type="button"
                    onClick={() => onAddDeskToCol(colIdx)}
                    className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-emerald-400 font-extrabold cursor-pointer"
                    title="Thêm 1 bàn vào cột này"
                  >
                    <Plus size={11} />
                  </button>
                </div>
              </div>

              {Array.from({ length: col.desks_in_col || desksPerCol }).map((_, deskIdx) => {
                const seatLeft = col.seats ? col.seats[deskIdx * 2] : null;
                const seatRight = col.seats ? col.seats[deskIdx * 2 + 1] : null;
                const isLeftAbsent = seatLeft?.student_id ? absentStudentIds.has(seatLeft.student_id) : false;
                const isRightAbsent = seatRight?.student_id ? absentStudentIds.has(seatRight.student_id) : false;

                return (
                  <div key={deskIdx} className="bg-[#121626] border border-white/10 p-3 rounded-2xl shadow-md w-60 flex flex-col gap-2">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider text-center border-b border-white/5 pb-1">
                      Bàn {deskIdx + 1}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* LEFT SEAT */}
                      <div
                        draggable={Boolean(seatLeft?.student_name)}
                        onDragStart={() => onDragStartSeat({ colIdx, deskIdx, posIdx: 0 })}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => onDropOnSeat(colIdx, deskIdx, 0)}
                        className={`group/seat relative p-2 rounded-xl border flex flex-col items-center justify-center min-h-[56px] text-center transition cursor-pointer ${
                          seatLeft?.student_name
                            ? isLeftAbsent
                              ? 'bg-rose-500/15 border-rose-500/40 text-rose-200 cursor-grab active:cursor-grabbing hover:border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                              : 'bg-indigo-500/10 border-indigo-500/30 text-white cursor-grab active:cursor-grabbing hover:border-indigo-400'
                            : 'bg-white/[0.02] border-dashed border-white/10 text-slate-600 hover:border-white/20'
                        }`}
                      >
                        {seatLeft?.student_name ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onClearSeat(colIdx, deskIdx, 0);
                              }}
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-black flex items-center justify-center opacity-0 group-hover/seat:opacity-100 transition shadow cursor-pointer z-10"
                              title="Bỏ xếp chỗ"
                            >
                              ×
                            </button>
                            <span className={`text-xs font-extrabold truncate w-full ${isLeftAbsent ? 'line-through text-rose-200 opacity-90' : ''}`}>
                              {seatLeft.student_name}
                            </span>
                            {isLeftAbsent && (
                              <span className="mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/30 text-rose-300 border border-rose-500/50">
                                Vắng mặt
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-500">Thả vào đây</span>
                        )}
                      </div>

                      {/* RIGHT SEAT */}
                      <div
                        draggable={Boolean(seatRight?.student_name)}
                        onDragStart={() => onDragStartSeat({ colIdx, deskIdx, posIdx: 1 })}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => onDropOnSeat(colIdx, deskIdx, 1)}
                        className={`group/seat relative p-2 rounded-xl border flex flex-col items-center justify-center min-h-[56px] text-center transition cursor-pointer ${
                          seatRight?.student_name
                            ? isRightAbsent
                              ? 'bg-rose-500/15 border-rose-500/40 text-rose-200 cursor-grab active:cursor-grabbing hover:border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                              : 'bg-indigo-500/10 border-indigo-500/30 text-white cursor-grab active:cursor-grabbing hover:border-indigo-400'
                            : 'bg-white/[0.02] border-dashed border-white/10 text-slate-600 hover:border-white/20'
                        }`}
                      >
                        {seatRight?.student_name ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onClearSeat(colIdx, deskIdx, 1);
                              }}
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-black flex items-center justify-center opacity-0 group-hover/seat:opacity-100 transition shadow cursor-pointer z-10"
                              title="Bỏ xếp chỗ"
                            >
                              ×
                            </button>
                            <span className={`text-xs font-extrabold truncate w-full ${isRightAbsent ? 'line-through text-rose-200 opacity-90' : ''}`}>
                              {seatRight.student_name}
                            </span>
                            {isRightAbsent && (
                              <span className="mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/30 text-rose-300 border border-rose-500/50">
                                Vắng mặt
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-500">Thả vào đây</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
