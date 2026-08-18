import React, { useState, useMemo } from 'react';
import { AlertCircle, BookOpen, Sparkles, User, Search } from 'lucide-react';
import { trunc1Dec, format1Dec } from '../../../utils';
import { getStudentTier } from '../types';

interface WeaknessItem {
  student_id: number;
  student_name: string;
  nickname: string;
  class_name: string;
  weaknesses: {
    unit_key: string;
    skill: 'vocab' | 'grammar';
    topic_name: string;
    score: number;
    session_id: number;
  }[];
}

interface StudentWeaknessDiagnosisCardProps {
  sessionRecords: any[];
  studentRankings: any[];
  selectedClassId: string;
  onSelectStudent?: (studentId: number) => void;
}

export const StudentWeaknessDiagnosisCard: React.FC<StudentWeaknessDiagnosisCardProps> = ({
  sessionRecords,
  studentRankings,
  selectedClassId,
  onSelectStudent,
}) => {
  const [skillFilter, setSkillFilter] = useState<'all' | 'grammar' | 'vocab'>('all');
  const [search, setSearch] = useState('');

  const diagnosisList = useMemo(() => {
    const list = selectedClassId ? sessionRecords.filter(r => String(r.class_id) === selectedClassId) : sessionRecords;
    if (!list || list.length === 0) return [];

    const studentMap = new Map<number, WeaknessItem>();

    list.forEach(r => {
      if (r.attendance !== 'absent') {
        const sid = Number(r.student_id);
        if (!studentMap.has(sid)) {
          studentMap.set(sid, {
            student_id: sid,
            student_name: r.full_name,
            nickname: r.nickname || '',
            class_name: r.class_name || '',
            weaknesses: [],
          });
        }

        const uKey = r.topic || `Unit ${Math.min(12, Math.floor(((r.session_id || 1001) - 1001) / 2) + 1)}`;
        const gTopic = r.check_2_topic || r.grammar_topic || 'Ngữ pháp';
        const vTopic = r.check_1_topic || `${uKey}: Từ vựng`;

        const c1 = r.check_1 !== null && r.check_1 !== undefined ? Number(r.check_1) : null;
        const c2 = r.check_2 !== null && r.check_2 !== undefined ? Number(r.check_2) : null;

        // Check 1 (Vocab) weakness threshold: score < 6.5
        if (c1 !== null && c1 < 6.5) {
          studentMap.get(sid)!.weaknesses.push({
            unit_key: uKey,
            skill: 'vocab',
            topic_name: vTopic,
            score: trunc1Dec(c1),
            session_id: r.session_id,
          });
        }

        // Check 2 (Grammar) weakness threshold: score < 6.5
        if (c2 !== null && c2 < 6.5) {
          studentMap.get(sid)!.weaknesses.push({
            unit_key: uKey,
            skill: 'grammar',
            topic_name: `${uKey} (${gTopic})`,
            score: trunc1Dec(c2),
            session_id: r.session_id,
          });
        }
      }
    });

    const result: WeaknessItem[] = [];
    studentMap.forEach(item => {
      if (item.weaknesses.length > 0) {
        result.push(item);
      }
    });

    return result.sort((a, b) => b.weaknesses.length - a.weaknesses.length);
  }, [sessionRecords, selectedClassId]);

  const filteredList = useMemo(() => {
    return diagnosisList.filter(item => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = item.student_name.toLowerCase().includes(q) || item.nickname.toLowerCase().includes(q);
        if (!matchesName) return false;
      }
      if (skillFilter === 'all') return true;
      return item.weaknesses.some(w => w.skill === skillFilter);
    });
  }, [diagnosisList, search, skillFilter]);

  return (
    <div className="bg-[#0c0f1d] border border-white/10 rounded-2xl p-5 space-y-5 select-none shadow-lg animate-cascade-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle size={18} />
          </div>
          <div>
            <h3 className="text-base font-black text-white">
              Chẩn Đoán Học Sinh Cần Phụ Đạo Theo Bài Học & Kỹ Năng
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tự động phát hiện chính xác học sinh đang hổng kiến thức ở bài học hoặc chủ đề ngữ pháp/từ vựng nào (Điểm &lt; 6.5).
            </p>
          </div>
        </div>

        {/* Filter pills & search */}
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
              className="bg-[#121626] border border-white/10 text-white text-xs rounded-xl pl-9 pr-3 py-1.5 focus:outline-none focus:border-indigo-500 w-40"
            />
          </div>
        </div>
      </div>

      {/* Weakness Cards Grid */}
      {filteredList.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs font-bold">
          <p className="text-emerald-400 font-black text-sm">Tuyệt vời! Không phát hiện học sinh nào bị hổng kiến thức nghiêm trọng.</p>
          <p className="text-slate-500 mt-1">Toàn bộ học sinh đều đạt chuẩn trên 6.5 điểm ở các bài kiểm tra.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((st) => {
            const visibleWeaknesses = skillFilter === 'all'
              ? st.weaknesses
              : st.weaknesses.filter(w => w.skill === skillFilter);

            if (visibleWeaknesses.length === 0) return null;

            return (
              <div
                key={st.student_id}
                onClick={() => onSelectStudent && onSelectStudent(st.student_id)}
                className="bg-[#121626] border border-rose-500/20 hover:border-rose-500/40 rounded-xl p-4 space-y-3 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-rose-500/15 text-rose-400 font-bold text-xs flex items-center justify-center border border-rose-500/20">
                      {st.student_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white group-hover:text-indigo-300 transition">
                        {st.student_name}
                        {st.nickname && <span className="text-slate-400 font-semibold ml-1">({st.nickname})</span>}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">{st.class_name}</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black border border-rose-500/30">
                    {visibleWeaknesses.length} Bài Cần Kèm
                  </span>
                </div>

                {/* Weakness chips */}
                <div className="space-y-1.5 pt-1">
                  {visibleWeaknesses.map((w, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-[#0c0f1d] border border-white/5"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                            w.skill === 'grammar'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {w.skill === 'grammar' ? 'Ngữ Pháp' : 'Từ Vựng'}
                        </span>
                        <span className="text-slate-200 font-semibold truncate text-[11px]">
                          {w.topic_name}
                        </span>
                      </div>

                      <span className="text-rose-400 font-mono font-black shrink-0 ml-2 text-xs">
                        {format1Dec(w.score)} đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
