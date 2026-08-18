import React, { useState, useMemo } from 'react';
import { LayoutGrid, CreditCard, Sparkles, AlertCircle } from 'lucide-react';
import { trunc1Dec, format1Dec } from '../../../utils';

interface HeatmapUnit {
  unit_key: string;
  skill: string;
  avg_score: number;
}

interface StudentUnitData {
  skill: string;
  ema_score: number;
  last_score?: number;
  test_count: number;
  mastery_status: 'mastered' | 'partial' | 'regressed' | 'not_yet';
  last_tested?: string;
}

interface HeatmapStudent {
  student_id: number;
  student_name: string;
  nickname: string;
  class_name: string;
  units: Record<string, StudentUnitData>;
}

interface MasteryHeatmapProps {
  units: HeatmapUnit[];
  students: HeatmapStudent[];
  onSelectStudent?: (studentId: number) => void;
}

export const MasteryHeatmap: React.FC<MasteryHeatmapProps> = ({
  units,
  students,
  onSelectStudent,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'cards'>('grid');
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState<'all' | 'vocab' | 'grammar'>('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{
    studentName: string;
    unitKey: string;
    data: StudentUnitData;
    x: number;
    y: number;
    showBelow: boolean;
  } | null>(null);

  const filteredUnits = useMemo(() => {
    if (skillFilter === 'all') return units;
    return units.filter((u) => u.skill === skillFilter);
  }, [units, skillFilter]);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.student_name.toLowerCase().includes(q) ||
        (s.nickname && s.nickname.toLowerCase().includes(q))
    );
  }, [students, search]);

  const displayedStudents = useMemo(() => {
    if (!isExpanded && !search.trim() && filteredStudents.length > 8 && viewMode === 'grid') {
      return filteredStudents.slice(0, 8);
    }
    return filteredStudents;
  }, [filteredStudents, isExpanded, search, viewMode]);

  // Full-cell colors: Xanh (>=8.0), Vàng (6.5-7.9), Cam (5.0-6.4), Đỏ (<5.0)
  const getCellStyle = (ema?: number) => {
    if (ema === undefined || ema === null) {
      return {
        tdBg: 'bg-[#0a0d18]',
        tdBorder: 'border-white/5',
        textColor: 'text-slate-600',
        label: '-',
      };
    }
    const score = Number(ema);
    if (score >= 8.0) {
      return {
        tdBg: 'bg-emerald-950/70 hover:bg-emerald-900/90',
        tdBorder: 'border-emerald-500/25',
        textColor: 'text-emerald-300 font-black',
        label: trunc1Dec(score),
      };
    }
    if (score >= 6.5) {
      return {
        tdBg: 'bg-amber-950/70 hover:bg-amber-900/90',
        tdBorder: 'border-amber-500/25',
        textColor: 'text-amber-300 font-bold',
        label: trunc1Dec(score),
      };
    }
    if (score >= 5.0) {
      return {
        tdBg: 'bg-orange-950/70 hover:bg-orange-900/90',
        tdBorder: 'border-orange-500/25',
        textColor: 'text-orange-300 font-bold',
        label: trunc1Dec(score),
      };
    }
    // Score < 5.0: Red (Chưa đạt / Cần kèm gấp)
    return {
      tdBg: 'bg-rose-950/70 hover:bg-rose-900/90',
      tdBorder: 'border-rose-500/30',
      textColor: 'text-rose-300 font-black',
      label: trunc1Dec(score),
    };
  };

  const handleCellMouseMove = (e: React.MouseEvent, studentName: string, unitKey: string, data: StudentUnitData) => {
    const x = e.clientX;
    const y = e.clientY;
    const showBelow = y < 220;
    setHoveredCell({
      studentName,
      unitKey,
      data,
      x: Math.min(window.innerWidth - 150, Math.max(150, x)),
      y: showBelow ? y + 20 : y - 20,
      showBelow,
    });
  };

  return (
    <div className="bg-[#0c0f1d] border border-white/10 rounded-2xl p-5 space-y-5 select-none shadow-lg">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <LayoutGrid size={18} className="text-indigo-400" />
            Ma Trận Nắm Vững Kiến Thức (Mastery Heatmap)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Bảng màu trực quan theo thang đo 4 mức (Đỏ &lt; 5.0, Cam 5.0-6.4, Vàng 6.5-7.9, Xanh &ge; 8.0).
          </p>
        </div>

        {/* Filter Pills & View Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="relative flex bg-[#121626] p-1 rounded-xl border border-white/10 text-xs font-bold w-48">
            <div
              className="absolute top-1 bottom-1 rounded-lg bg-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.5)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
              style={{
                left: viewMode === 'grid' ? '4px' : 'calc(50% + 1px)',
                width: 'calc(50% - 4px)',
              }}
            />
            <button
              onClick={() => setViewMode('grid')}
              className={`flex-1 relative z-10 py-1 text-center transition cursor-pointer flex items-center justify-center gap-1 ${
                viewMode === 'grid' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid size={12} />
              <span>Ma Trận</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex-1 relative z-10 py-1 text-center transition cursor-pointer flex items-center justify-center gap-1 ${
                viewMode === 'cards' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard size={12} />
              <span>Dạng Thẻ</span>
            </button>
          </div>

          {/* Skill Filter */}
          <div className="relative flex bg-[#121626] p-1 rounded-xl border border-white/10 text-xs font-bold w-60">
            <div
              className="absolute top-1 bottom-1 rounded-lg bg-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.5)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
              style={{
                left: skillFilter === 'all'
                  ? '4px'
                  : skillFilter === 'vocab'
                    ? 'calc((100% / 3) + 1px)'
                    : 'calc(((100% / 3) * 2) + 1px)',
                width: 'calc((100% / 3) - 4px)',
              }}
            />
            <button
              onClick={() => setSkillFilter('all')}
              className={`flex-1 relative z-10 py-1 text-center transition cursor-pointer ${
                skillFilter === 'all' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất Cả
            </button>
            <button
              onClick={() => setSkillFilter('vocab')}
              className={`flex-1 relative z-10 py-1 text-center transition cursor-pointer ${
                skillFilter === 'vocab' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Từ Vựng
            </button>
            <button
              onClick={() => setSkillFilter('grammar')}
              className={`flex-1 relative z-10 py-1 text-center transition cursor-pointer ${
                skillFilter === 'grammar' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Ngữ Pháp
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm học sinh..."
            className="bg-[#121626] border border-white/10 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 w-44"
          />
        </div>
      </div>

      {filteredUnits.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs font-bold space-y-2">
          <p className="text-white">Chưa có bài học nào được cấu hình kiểm tra</p>
          <p className="text-slate-500">
            Hãy vào trang Quản Lý Lớp Học &rarr; Chọn ngày học &rarr; Bấm "Cấu Hình Bài Kiểm Tra".
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* 1. FULL-CELL COLOR MATRIX VIEW (No inner rounded pill!) */
        <div className="space-y-3">
          <div className="overflow-x-auto border border-white/10 rounded-xl scrollbar-thin">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#121626] border-b border-white/10 text-slate-300">
                  <th className="py-3.5 px-4 sticky left-0 z-20 bg-[#121626] min-w-[200px] font-black uppercase text-[11px] tracking-wider border-r border-white/10">
                    Học Sinh ({displayedStudents.length}/{filteredStudents.length})
                  </th>
                  {filteredUnits.map((u) => (
                    <th
                      key={u.unit_key}
                      className="py-3 px-3 text-center min-w-[110px] font-bold border-r border-white/10"
                    >
                      <div className="text-[11px] text-white truncate max-w-[120px] mx-auto font-black" title={u.unit_key}>
                        {u.unit_key}
                      </div>
                      <div className="flex items-center justify-center gap-1.5 mt-1">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                            u.skill === 'vocab'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}
                        >
                          {u.skill === 'vocab' ? 'Từ Vựng' : 'Ngữ Pháp'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold font-mono">
                          TB {trunc1Dec(u.avg_score)}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {displayedStudents.map((st) => (
                  <tr
                    key={st.student_id}
                    className="hover:brightness-110 transition-all duration-150"
                  >
                    <td className="py-3 px-4 sticky left-0 z-10 bg-[#0c0f1d] border-r border-b border-white/10 whitespace-nowrap">
                      <button
                        onClick={() => onSelectStudent && onSelectStudent(st.student_id)}
                        className="text-left font-bold text-white hover:text-indigo-400 transition flex items-center gap-2 group cursor-pointer"
                      >
                        <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[10px] font-black shrink-0">
                          {st.student_name.charAt(0)}
                        </div>
                        <div>
                          <span className="block leading-tight font-bold">{st.student_name}</span>
                          {st.nickname && (
                            <span className="text-[10px] text-slate-500 font-semibold">
                              ({st.nickname})
                            </span>
                          )}
                        </div>
                      </button>
                    </td>

                    {filteredUnits.map((u) => {
                      const uData = st.units?.[u.unit_key];
                      const cellStyle = getCellStyle(uData?.ema_score);

                      return (
                        <td
                          key={u.unit_key}
                          onMouseMove={(e) => {
                            if (uData) handleCellMouseMove(e, st.student_name, u.unit_key, uData);
                          }}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`py-3 px-3 text-center border-r border-b font-mono text-xs transition-colors cursor-pointer select-none ${cellStyle.tdBg} ${cellStyle.tdBorder} ${cellStyle.textColor}`}
                        >
                          {cellStyle.label}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Compact / Expand Toggle */}
          {filteredStudents.length > 8 && !search.trim() && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => setIsExpanded(prev => !prev)}
                className="px-4 py-1.5 rounded-xl bg-[#161c32] hover:bg-[#20294a] text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition cursor-pointer shadow-sm active:scale-95"
              >
                {isExpanded
                  ? 'Thu Gọn Danh Sách (Hiện 8 Học Sinh)'
                  : `Xem Toàn Bộ (${filteredStudents.length} Học Sinh)`}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* 2. STUDENT MASTERY CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((st) => {
            const unitList = Object.entries(st.units || {});
            const masteredList = unitList.filter(([_, d]) => (d.ema_score ?? 0) >= 8.0);
            const partialList = unitList.filter(([_, d]) => (d.ema_score ?? 0) >= 6.5 && (d.ema_score ?? 0) < 8.0);
            const orangeList = unitList.filter(([_, d]) => (d.ema_score ?? 0) >= 5.0 && (d.ema_score ?? 0) < 6.5);
            const redList = unitList.filter(([_, d]) => (d.ema_score ?? 0) < 5.0);
            const totalWeak = orangeList.length + redList.length;

            return (
              <div
                key={st.student_id}
                onClick={() => onSelectStudent && onSelectStudent(st.student_id)}
                className="bg-[#121626] border border-white/10 hover:border-indigo-500/40 p-4 rounded-2xl space-y-3 cursor-pointer transition group shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-black text-xs">
                      {st.student_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white group-hover:text-indigo-300 transition">
                        {st.student_name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        {st.nickname && <span>({st.nickname})</span>}
                        <span>{st.class_name || 'Lớp học'}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-white/5 px-2 py-0.5 rounded text-slate-300">
                    {unitList.length} bài test
                  </span>
                </div>

                {/* Distribution Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span className="text-emerald-400 font-bold">{masteredList.length} Vững</span>
                    <span className="text-amber-400 font-bold">{partialList.length} Khá</span>
                    <span className="text-orange-400 font-bold">{orangeList.length} Củng Cố</span>
                    <span className="text-rose-400 font-bold">{redList.length} Yếu</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1e2744] overflow-hidden flex">
                    <div style={{ width: `${(masteredList.length / (unitList.length || 1)) * 100}%` }} className="bg-emerald-500 h-full" />
                    <div style={{ width: `${(partialList.length / (unitList.length || 1)) * 100}%` }} className="bg-amber-500 h-full" />
                    <div style={{ width: `${(orangeList.length / (unitList.length || 1)) * 100}%` }} className="bg-orange-500 h-full" />
                    <div style={{ width: `${(redList.length / (unitList.length || 1)) * 100}%` }} className="bg-rose-500 h-full" />
                  </div>
                </div>

                {/* Weak Units Tags */}
                {totalWeak > 0 ? (
                  <div className="space-y-1 pt-1 border-t border-white/5">
                    <span className="text-[10px] font-black uppercase text-rose-400 block">
                      Bài Học Cần Kèm ({totalWeak}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {[...redList, ...orangeList].slice(0, 4).map(([uKey, d]) => (
                        <span
                          key={uKey}
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border font-mono ${
                            d.ema_score < 5.0
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                          }`}
                        >
                          {uKey}: {format1Dec(d.ema_score)}đ
                        </span>
                      ))}
                      {totalWeak > 4 && (
                        <span className="text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                          +{totalWeak - 4} bài khác
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-emerald-400 font-bold pt-1 border-t border-white/5">
                    ✓ Toàn bộ bài học đều đạt chuẩn (&ge; 6.5đ)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4-Color Scale Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/5 text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-300">Thang Điểm 4 Mức:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/60 block" />
            <span className="text-emerald-300 font-bold">Xanh: Nắm Vững (&ge; 8.0)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/60 block" />
            <span className="text-amber-300 font-bold">Vàng: Đang Tiến Bộ (6.5 – 7.9)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-orange-500/30 border border-orange-500/60 block" />
            <span className="text-orange-300 font-bold">Cam: Cần Củng Cố (5.0 – 6.4)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500/60 block" />
            <span className="text-rose-300 font-bold">Đỏ: Chưa Đạt (&lt; 5.0)</span>
          </div>
        </div>

        <span className="text-slate-500 italic text-[10px]">
          Điểm số là điểm EMA tích lũy của học sinh đối với từng bài học
        </span>
      </div>

      {/* Dynamic Colorful Hover Tooltip (Follows cursor, zero jump, rich design) */}
      {hoveredCell && (
        <div
          style={{
            position: 'fixed',
            left: hoveredCell.x,
            top: hoveredCell.y,
            transform: hoveredCell.showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
          }}
          className="z-50 pointer-events-none bg-[#0e1224] border-2 border-indigo-500/60 rounded-2xl p-4 shadow-[0_15px_35px_rgba(0,0,0,0.85)] text-xs text-white space-y-2.5 min-w-[240px] select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-black text-white text-sm">{hoveredCell.studentName}</span>
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
              hoveredCell.data.skill === 'vocab'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
            }`}>
              {hoveredCell.data.skill === 'vocab' ? 'Từ Vựng' : 'Ngữ Pháp'}
            </span>
          </div>

          {/* Unit Title */}
          <div className="text-xs font-bold text-indigo-300">
            {hoveredCell.unitKey}
          </div>

          {/* Stats */}
          <div className="space-y-1.5 bg-[#080b16] p-2.5 rounded-xl border border-white/5 font-mono text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Điểm EMA Tích Lũy:</span>
              <span className={`font-black text-sm ${
                hoveredCell.data.ema_score >= 8.0 ? 'text-emerald-400' :
                hoveredCell.data.ema_score >= 6.5 ? 'text-amber-400' :
                hoveredCell.data.ema_score >= 5.0 ? 'text-orange-400' : 'text-rose-400'
              }`}>
                {trunc1Dec(hoveredCell.data.ema_score)} / 10
              </span>
            </div>

            {hoveredCell.data.last_score !== undefined && (
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Điểm Test Gần Nhất:</span>
                <span className="font-bold text-white">{trunc1Dec(hoveredCell.data.last_score)}đ</span>
              </div>
            )}

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Số Lần Đã Test:</span>
              <span className="font-bold text-indigo-300">{hoveredCell.data.test_count} buổi</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-slate-400 font-medium">Trạng thái:</span>
            <span className={`font-black px-2 py-0.5 rounded-md ${
              hoveredCell.data.ema_score >= 8.0 ? 'bg-emerald-500/20 text-emerald-300' :
              hoveredCell.data.ema_score >= 6.5 ? 'bg-amber-500/20 text-amber-300' :
              hoveredCell.data.ema_score >= 5.0 ? 'bg-orange-500/20 text-orange-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {hoveredCell.data.ema_score >= 8.0 ? 'Nắm Vững' :
               hoveredCell.data.ema_score >= 6.5 ? 'Đang Tiến Bộ' :
               hoveredCell.data.ema_score >= 5.0 ? 'Cần Củng Cố' : 'Chưa Đạt (Kèm Gấp)'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
