import React from 'react';

interface StudentProfileHeaderProps {
  student: any;
  stats: {
    overall: string | number;
    attendancePct: number;
    rank: string;
    level: string;
  };
  onClearStudent: () => void;
}

export const StudentProfileHeader: React.FC<StudentProfileHeaderProps> = ({
  student,
  stats,
  onClearStudent,
}) => {
  if (!student) return null;

  return (
    <div className="animate-cascade-1">
      <div className="bg-[#0e1222] border border-[#1e2744] p-6 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 z-10">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/20">
            {student.full_name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">{student.full_name}</h2>
              {student.nickname && (
                <span className="text-sm font-extrabold text-white">- {student.nickname}</span>
              )}
              <button
                onClick={onClearStudent}
                className="ml-3 px-2.5 py-1 rounded-lg bg-[#1a2340] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-[#2e3b66] text-[10px] font-bold transition cursor-pointer"
                title="Bỏ chọn học sinh"
              >
                Bỏ Chọn ✕
              </button>
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              {student.grade || 'Lớp 6'} | {student.school || 'Trung tâm'} | Theo dõi tiến độ học tập qua các kỳ đánh giá
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 z-10 bg-[#141a30] border border-[#232d4e] px-6 py-3 rounded-xl">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block">Tổng Điểm</span>
            <span className="text-xl font-black text-emerald-400 font-mono">{stats.overall}</span>
          </div>
          <div className="h-8 w-px bg-[#232d4e]"></div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block">Chuyên Cần</span>
            <span className="text-xl font-black text-emerald-400 font-mono">{stats.attendancePct}%</span>
          </div>
          <div className="h-8 w-px bg-[#232d4e]"></div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block">Hạng</span>
            <span className="text-xl font-black text-amber-400 font-mono">{stats.rank}</span>
          </div>
          <div className="h-8 w-px bg-[#232d4e]"></div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block">Học Lực</span>
            <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {stats.level}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
