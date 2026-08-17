import React, { useState, useMemo } from 'react';
import { Search, User, Layers, Info } from 'lucide-react';
import { trunc1Dec } from '../../../utils';

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
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState<'all' | 'vocab' | 'grammar'>('all');
  const [hoveredCell, setHoveredCell] = useState<{
    studentName: string;
    unitKey: string;
    data: StudentUnitData;
    x: number;
    y: number;
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

  const getStatusBadge = (status?: string, ema?: number) => {
    if (!status) {
      return {
        bg: 'bg-white/5',
        text: 'text-slate-500',
        label: '-',
        border: 'border-transparent',
      };
    }
    switch (status) {
      case 'mastered':
        return {
          bg: 'bg-emerald-500/20 hover:bg-emerald-500/30',
          text: 'text-emerald-300 font-black',
          label: trunc1Dec(ema ?? 8.0),
          border: 'border-emerald-500/30',
        };
      case 'partial':
        return {
          bg: 'bg-amber-500/20 hover:bg-amber-500/30',
          text: 'text-amber-300 font-bold',
          label: trunc1Dec(ema ?? 6.5),
          border: 'border-amber-500/30',
        };
      case 'regressed':
        return {
          bg: 'bg-rose-500/20 hover:bg-rose-500/30',
          text: 'text-rose-300 font-bold',
          label: trunc1Dec(ema ?? 5.5),
          border: 'border-rose-500/30',
        };
      default:
        return {
          bg: 'bg-slate-500/15 hover:bg-slate-500/25',
          text: 'text-slate-400',
          label: trunc1Dec(ema ?? 5.0),
          border: 'border-slate-500/20',
        };
    }
  };

  return (
    <div className="bg-[#0c0f1d] border border-white/10 rounded-2xl p-5 space-y-5 select-none shadow-lg">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Layers size={18} className="text-indigo-400" />
            Ma Trận Nắm Vững Kiến Thức (Mastery Heatmap)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Theo dõi mức độ nắm vững từng bài học và chủ đề của từng học sinh theo chuẩn Bloom.
          </p>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Skill Filter Segmented Control */}
          <div className="flex bg-[#121626] p-1 rounded-xl border border-white/10 text-xs font-bold">
            <button
              onClick={() => setSkillFilter('all')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                skillFilter === 'all' ? 'bg-[#5c36f5] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất Cả
            </button>
            <button
              onClick={() => setSkillFilter('vocab')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                skillFilter === 'vocab' ? 'bg-[#5c36f5] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Từ Vựng
            </button>
            <button
              onClick={() => setSkillFilter('grammar')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                skillFilter === 'grammar' ? 'bg-[#5c36f5] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Ngữ Pháp
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm học sinh..."
              className="bg-[#121626] border border-white/10 text-white text-xs rounded-xl pl-9 pr-3 py-1.5 focus:outline-none focus:border-indigo-500 w-44"
            />
          </div>
        </div>
      </div>

      {/* Heatmap Table Grid */}
      {filteredUnits.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs font-bold space-y-2">
          <Info size={24} className="mx-auto text-indigo-400/50" />
          <p className="text-white">Chưa có bài học nào được cấu hình kiểm tra</p>
          <p className="text-slate-500">
            Hãy vào trang Quản Lý Lớp Học &rarr; Chọn ngày học &rarr; Bấm "Cấu Hình Bài Kiểm Tra".
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-white/5 rounded-xl scrollbar-thin">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#121626] border-b border-white/10 text-slate-300">
                <th className="py-3 px-4 sticky left-0 z-20 bg-[#121626] min-w-[180px] font-black uppercase text-[11px] tracking-wider border-r border-white/10">
                  Học Sinh
                </th>
                {filteredUnits.map((u) => (
                  <th
                    key={u.unit_key}
                    className="py-2.5 px-3 text-center min-w-[110px] font-bold border-r border-white/5"
                  >
                    <div className="text-[11px] text-white truncate max-w-[120px] mx-auto font-black" title={u.unit_key}>
                      {u.unit_key}
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <span
                        className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                          u.skill === 'vocab'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-purple-500/20 text-purple-300'
                        }`}
                      >
                        {u.skill === 'vocab' ? 'Từ Vựng' : 'Ngữ Pháp'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        TB: {trunc1Dec(u.avg_score)}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {filteredStudents.map((st, idx) => (
                <tr
                  key={st.student_id}
                  className={`hover:bg-white/[0.02] transition-colors ${
                    idx % 2 === 1 ? 'bg-[#0d1018]' : 'bg-[#0c0f1d]'
                  }`}
                >
                  <td className="py-2.5 px-4 sticky left-0 z-10 bg-[#0c0f1d] border-r border-white/10 whitespace-nowrap">
                    <button
                      onClick={() => onSelectStudent && onSelectStudent(st.student_id)}
                      className="text-left font-bold text-white hover:text-indigo-400 transition flex items-center gap-2 group cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[10px] font-black shrink-0">
                        {st.student_name.charAt(0)}
                      </div>
                      <div>
                        <span className="block leading-tight">{st.student_name}</span>
                        {st.nickname && (
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({st.nickname})
                          </span>
                        )}
                      </div>
                    </button>
                  </td>

                  {filteredUnits.map((u) => {
                    const uData = st.units?.[u.unit_key];
                    const badge = getStatusBadge(uData?.mastery_status, uData?.ema_score);

                    return (
                      <td
                        key={u.unit_key}
                        className="py-2 px-2 text-center border-r border-white/5"
                        onMouseEnter={(e) => {
                          if (uData) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredCell({
                              studentName: st.student_name,
                              unitKey: u.unit_key,
                              data: uData,
                              x: rect.left + rect.width / 2,
                              y: rect.top - 8,
                            });
                          }
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <div
                          className={`w-full py-1.5 px-2 rounded-lg border text-center transition cursor-default ${badge.bg} ${badge.border} ${badge.text}`}
                        >
                          {badge.label}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/5 text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-300">Chú Thích Trạng Thái:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50 block" />
            <span className="text-slate-300 font-bold">Nắm Vững (&ge; 8.0)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/50 block" />
            <span className="text-slate-300 font-bold">Đang Tiến Bộ (6.5 - 7.9)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500/50 block" />
            <span className="text-slate-300 font-bold">Cần Ôn Lại (Giảm sút)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-500/20 border border-slate-500/30 block" />
            <span className="text-slate-400 font-medium">Chưa Đạt (&lt; 6.5)</span>
          </div>
        </div>

        <span className="text-slate-500 italic text-[10px]">
          Con số hiển thị là điểm EMA tích lũy của học sinh trên bài học đó
        </span>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredCell && (
        <div
          style={{
            position: 'fixed',
            left: hoveredCell.x,
            top: hoveredCell.y,
            transform: 'translate(-50%, -100%)',
          }}
          className="z-50 pointer-events-none bg-[#121626] border border-[#212c4b] rounded-xl p-3 shadow-2xl text-xs text-white space-y-1 min-w-[200px]"
        >
          <div className="font-black text-indigo-300 border-b border-white/10 pb-1 flex justify-between">
            <span>{hoveredCell.studentName}</span>
            <span className="text-slate-400 font-normal">{hoveredCell.unitKey}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-300">
            <span>Điểm EMA Tích Lũy:</span>
            <strong className="text-white">{trunc1Dec(hoveredCell.data.ema_score)} / 10</strong>
          </div>
          {hoveredCell.data.last_score !== undefined && (
            <div className="flex justify-between text-[11px] text-slate-300">
              <span>Điểm Lần Gần Nhất:</span>
              <strong className="text-white">{trunc1Dec(hoveredCell.data.last_score)} / 10</strong>
            </div>
          )}
          <div className="flex justify-between text-[11px] text-slate-300">
            <span>Số Lần Kiểm Tra:</span>
            <strong className="text-white">{hoveredCell.data.test_count} lần</strong>
          </div>
          {hoveredCell.data.last_tested && (
            <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
              <span>Ngày test gần nhất:</span>
              <span>{hoveredCell.data.last_tested}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
