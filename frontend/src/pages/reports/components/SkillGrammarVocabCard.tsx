import React, { useMemo } from 'react';
import { BookOpen, Award, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { trunc1Dec, format1Dec } from '../../../utils';

interface SkillGrammarVocabCardProps {
  sessionRecords: any[];
  studentRankings: any[];
  selectedClassId: string;
  onSelectRankingStudent?: (studentId: number) => void;
}

export const SkillGrammarVocabCard: React.FC<SkillGrammarVocabCardProps> = ({
  sessionRecords,
  studentRankings,
  selectedClassId,
  onSelectRankingStudent,
}) => {
  const analysis = useMemo(() => {
    const list = selectedClassId ? sessionRecords.filter(r => String(r.class_id) === selectedClassId) : sessionRecords;
    const rankings = selectedClassId ? studentRankings.filter(r => String(r.class_id) === selectedClassId) : studentRankings;

    const vocabScores: number[] = [];
    const grammarScores: number[] = [];

    list.forEach(r => {
      if (r.attendance !== 'absent') {
        if (r.check_1 !== null && r.check_1 !== undefined && !isNaN(Number(r.check_1))) vocabScores.push(Number(r.check_1));
        if (r.check_2 !== null && r.check_2 !== undefined && !isNaN(Number(r.check_2))) grammarScores.push(Number(r.check_2));
      }
    });

    const avgVocab = vocabScores.length > 0 ? trunc1Dec(vocabScores.reduce((a, b) => a + b, 0) / vocabScores.length) : 0;
    const avgGrammar = grammarScores.length > 0 ? trunc1Dec(grammarScores.reduce((a, b) => a + b, 0) / grammarScores.length) : 0;

    // Student skill gaps
    const vocabLeaning: any[] = [];
    const grammarLeaning: any[] = [];
    const balanced: any[] = [];

    rankings.forEach(s => {
      const v = Number(s.avg_check_1 || 0);
      const g = Number(s.avg_check_2 || 0);
      const diff = trunc1Dec(v - g);
      if (diff >= 0.8 && v > 0 && g > 0) {
        vocabLeaning.push({ ...s, diff, v, g });
      } else if (diff <= -0.8 && v > 0 && g > 0) {
        grammarLeaning.push({ ...s, diff: Math.abs(diff), v, g });
      } else if (v > 0 && g > 0) {
        balanced.push({ ...s, diff: Math.abs(diff), v, g });
      }
    });

    return {
      avgVocab,
      avgGrammar,
      vocabLeaning,
      grammarLeaning,
      balanced,
    };
  }, [sessionRecords, studentRankings, selectedClassId]);

  return (
    <div className="bg-[#0b0f19] border border-[#1b253b] rounded-2xl p-6 shadow-xl space-y-6 animate-cascade-4 select-none">
      <div className="flex items-center justify-between gap-4 border-b border-[#161f33] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              PHÂN TÍCH TƯƠNG QUAN: TỪ VỰNG (CHECK 1) VS. NGỮ PHÁP (CHECK 2)
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Đánh giá sự cân bằng giữa khả năng ghi nhớ từ vựng và tư duy cấu trúc ngữ pháp của học sinh.
            </p>
          </div>
        </div>
      </div>

      {/* Overview Comparison Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[#121626] border border-blue-500/30 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase text-blue-400 tracking-wider">Trung Bình Từ Vựng (Check 1)</span>
            <div className="text-2xl font-black text-blue-300 font-mono">{format1Dec(analysis.avgVocab)} đ</div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
            Trọng số 35%
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#121626] border border-purple-500/30 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase text-purple-400 tracking-wider">Trung Bình Ngữ Pháp (Check 2)</span>
            <div className="text-2xl font-black text-purple-300 font-mono">{format1Dec(analysis.avgGrammar)} đ</div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
            Trọng số 55%
          </span>
        </div>
      </div>

      {/* Grouping analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vocab > Grammar */}
        <div className="p-4 rounded-xl bg-[#101422] border border-blue-500/25 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-blue-300 flex items-center gap-1.5">
              <span>Mạnh Từ Vựng - Yếu Ngữ Pháp</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-[10px] font-mono font-black">{analysis.vocabLeaning.length} HS</span>
            </h4>
          </div>
          <p className="text-[11px] text-slate-400">
            Học sinh có vốn từ tốt nhưng cần rèn luyện thêm về cấu trúc câu, thì động từ và bài tập biến đổi câu.
          </p>
          <div className="space-y-1.5 max-h-44 overflow-y-auto scrollbar-thin">
            {analysis.vocabLeaning.map((s, i) => (
              <div
                key={i}
                onClick={() => onSelectRankingStudent && onSelectRankingStudent(s.student_id)}
                className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-[#14192b] hover:bg-indigo-500/15 transition cursor-pointer border border-white/5"
              >
                <span className="font-bold text-slate-200">{s.full_name}</span>
                <span className="text-blue-300 font-mono text-[11px]">Từ vựng: <strong>{s.v}</strong> | Ngữ pháp: <strong>{s.g}</strong></span>
              </div>
            ))}
            {analysis.vocabLeaning.length === 0 && (
              <span className="text-xs text-slate-500 italic block py-2">Không có học sinh bị lệch nhóm này</span>
            )}
          </div>
        </div>

        {/* Grammar > Vocab */}
        <div className="p-4 rounded-xl bg-[#101422] border border-purple-500/25 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-purple-300 flex items-center gap-1.5">
              <span>Mạnh Ngữ Pháp - Yếu Từ Vựng</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-[10px] font-mono font-black">{analysis.grammarLeaning.length} HS</span>
            </h4>
          </div>
          <p className="text-[11px] text-slate-400">
            Học sinh nắm chắc quy tắc ngữ pháp nhưng cần tăng cường mở rộng vốn từ vựng và bài tập đọc hiểu.
          </p>
          <div className="space-y-1.5 max-h-44 overflow-y-auto scrollbar-thin">
            {analysis.grammarLeaning.map((s, i) => (
              <div
                key={i}
                onClick={() => onSelectRankingStudent && onSelectRankingStudent(s.student_id)}
                className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-[#14192b] hover:bg-purple-500/15 transition cursor-pointer border border-white/5"
              >
                <span className="font-bold text-slate-200">{s.full_name}</span>
                <span className="text-purple-300 font-mono text-[11px]">Ngữ pháp: <strong>{s.g}</strong> | Từ vựng: <strong>{s.v}</strong></span>
              </div>
            ))}
            {analysis.grammarLeaning.length === 0 && (
              <span className="text-xs text-slate-500 italic block py-2">Không có học sinh bị lệch nhóm này</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
