import React, { useState, useMemo } from 'react';
import { AlertCircle, BookOpen, Sparkles, Search } from 'lucide-react';
import { trunc1Dec, format1Dec } from '../../../utils';

interface AggregatedWeakness {
  unit_key: string;
  skill: 'vocab' | 'grammar';
  topic_name: string;
  avg_score: number;
  test_count: number;
}

interface WeaknessStudentItem {
  student_id: number;
  student_name: string;
  nickname: string;
  class_name: string;
  weaknesses: AggregatedWeakness[];
}

interface StudentWeaknessDiagnosisCardProps {
  sessionRecords: any[];
  studentRankings: any[];
  selectedClassId: string;
  onSelectStudent?: (studentId: number) => void;
}

export const StudentWeaknessDiagnosisCard: React.FC<StudentWeaknessDiagnosisCardProps> = ({
  sessionRecords,
  selectedClassId,
  onSelectStudent,
}) => {
  const [skillFilter, setSkillFilter] = useState<'all' | 'grammar' | 'vocab'>('all');
  const [search, setSearch] = useState('');

  const diagnosisList = useMemo(() => {
    const list = selectedClassId ? sessionRecords.filter(r => String(r.class_id) === selectedClassId) : sessionRecords;
    if (!list || list.length === 0) return [];

    // Map: student_id -> Map<unit_skill_key, { ...scores }>
    const studentScoreMap = new Map<number, {
      name: string;
      nickname: string;
      className: string;
      unitMap: Map<string, { unit_key: string; skill: 'vocab' | 'grammar'; topic_name: string; scores: number[] }>;
    }>();

    list.forEach(r => {
      if (r.attendance !== 'absent') {
        const sid = Number(r.student_id);
        if (!studentScoreMap.has(sid)) {
          studentScoreMap.set(sid, {
            name: r.full_name,
            nickname: r.nickname || '',
            className: r.class_name || '',
            unitMap: new Map(),
          });
        }

        const uKey = r.topic || `Unit ${Math.min(12, Math.floor(((r.session_id || 1001) - 1001) / 2) + 1)}`;
        const gTopic = r.check_2_topic || r.grammar_topic || 'Ngữ pháp';
        const vTopic = r.check_1_topic || `${uKey}: Từ vựng`;

        const stData = studentScoreMap.get(sid)!;

        // Collect vocab scores
        if (r.check_1 !== null && r.check_1 !== undefined) {
          const vk = `${uKey}-vocab`;
          if (!stData.unitMap.has(vk)) {
            stData.unitMap.set(vk, { unit_key: uKey, skill: 'vocab', topic_name: vTopic, scores: [] });
          }
          stData.unitMap.get(vk)!.scores.push(Number(r.check_1));
        }

        // Collect grammar scores
        if (r.check_2 !== null && r.check_2 !== undefined) {
          const gk = `${uKey}-grammar`;
          if (!stData.unitMap.has(gk)) {
            stData.unitMap.set(gk, { unit_key: uKey, skill: 'grammar', topic_name: `${uKey} (${gTopic})`, scores: [] });
          }
          stData.unitMap.get(gk)!.scores.push(Number(r.check_2));
        }
      }
    });

    const result: WeaknessStudentItem[] = [];

    studentScoreMap.forEach((stData, sid) => {
      const weakUnits: AggregatedWeakness[] = [];

      stData.unitMap.forEach((uData) => {
        if (uData.scores.length > 0) {
          const avg = trunc1Dec(uData.scores.reduce((a, b) => a + b, 0) / uData.scores.length);
          // Flag as weakness only if unit average is strictly < 6.5
          if (avg < 6.5) {
            weakUnits.push({
              unit_key: uData.unit_key,
              skill: uData.skill,
              topic_name: uData.topic_name,
              avg_score: avg,
              test_count: uData.scores.length,
            });
          }
        }
      });

      if (weakUnits.length > 0) {
        // Sort lowest score first
        weakUnits.sort((a, b) => a.avg_score - b.avg_score);
        result.push({
          student_id: sid,
          student_name: stData.name,
          nickname: stData.nickname,
          class_name: stData.className,
          weaknesses: weakUnits,
        });
      }
    });

    return result.sort((a, b) => b.weaknesses.length - a.weaknesses.length);
  }, [sessionRecords, selectedClassId]);

  const filteredList = useMemo(() => {
    return diagnosisList.filter(item => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches = item.student_name.toLowerCase().includes(q) || item.nickname.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (skillFilter === 'all') return true;
      return item.weaknesses.some(w => w.skill === skillFilter);
    });
  }, [diagnosisList, search, skillFilter]);

  return (
    <div className="bg-[#0c0f1d] border border-white/10 rounded-2xl p-5 space-y-4 select-none shadow-lg animate-cascade-2">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Chẩn Đoán Học Sinh Cần Phụ Đạo Theo Bài Học & Kỹ Năng
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tự động tổng hợp các Unit học sinh chưa đạt chuẩn (Điểm TB &lt; 6.5) để giáo viên bồi dưỡng trọng điểm.
            </p>
          </div>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[#121626] p-1 rounded-xl border border-white/10 text-xs font-bold">
            <button
              onClick={() => setSkillFilter('all')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                skillFilter === 'all' ? 'bg-[#5c36f5] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất Cả ({diagnosisList.length})
            </button>
            <button
              onClick={() => setSkillFilter('grammar')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                skillFilter === 'grammar' ? 'bg-[#5c36f5] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles size={12} />
              <span>Chỉ Ngữ Pháp</span>
            </button>
            <button
              onClick={() => setSkillFilter('vocab')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                skillFilter === 'vocab' ? 'bg-[#5c36f5] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen size={12} />
              <span>Chỉ Từ Vựng</span>
            </button>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm học sinh..."
              className="bg-[#121626] border border-white/10 text-white text-xs rounded-xl pl-9 pr-3 py-1.5 focus:outline-none focus:border-indigo-500 w-36"
            />
          </div>
        </div>
      </div>

      {/* Grid of Compact Student Weakness Cards */}
      {filteredList.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs font-bold">
          <p className="text-emerald-400 font-black text-sm">Tuyệt vời! Không phát hiện bài học nào dưới 6.5 điểm.</p>
          <p className="text-slate-500 mt-1">Toàn bộ học sinh đều đạt kết quả tốt ở các bài kiểm tra.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredList.map((st) => {
            const listToShow = skillFilter === 'all'
              ? st.weaknesses
              : st.weaknesses.filter(w => w.skill === skillFilter);

            if (listToShow.length === 0) return null;

            const visibleChips = listToShow.slice(0, 4);
            const extraCount = listToShow.length - 4;

            return (
              <div
                key={st.student_id}
                onClick={() => onSelectStudent && onSelectStudent(st.student_id)}
                className="bg-[#121626] border border-rose-500/20 hover:border-rose-500/50 rounded-xl p-3.5 space-y-2.5 transition cursor-pointer group"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-rose-500/15 text-rose-400 font-black text-[11px] flex items-center justify-center border border-rose-500/20 shrink-0">
                      {st.student_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition truncate max-w-[140px]">
                        {st.student_name}
                      </h4>
                      {st.nickname && (
                        <span className="text-[10px] text-slate-400 font-semibold block -mt-0.5">
                          {st.nickname} | {st.class_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 text-[10px] font-extrabold border border-rose-500/30 shrink-0">
                    {listToShow.length} Unit yếu
                  </span>
                </div>

                {/* Compact Horizontal Chips Grid */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {visibleChips.map((w, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#0a0d18] border border-white/5 text-[11px]"
                    >
                      <span
                        className={`text-[9px] font-black uppercase px-1 py-0.2 rounded ${
                          w.skill === 'grammar'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {w.skill === 'grammar' ? 'Ngữ Pháp' : 'Từ Vựng'}
                      </span>
                      <span className="text-slate-300 font-medium truncate max-w-[95px]" title={w.topic_name}>
                        {w.unit_key}
                      </span>
                      <strong className="text-rose-400 font-mono text-xs">
                        {format1Dec(w.avg_score)}đ
                      </strong>
                    </span>
                  ))}

                  {extraCount > 0 && (
                    <span className="px-2 py-1 rounded-lg bg-[#14192b] text-[10px] font-bold text-slate-400 border border-white/5 self-center">
                      +{extraCount} bài khác
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
