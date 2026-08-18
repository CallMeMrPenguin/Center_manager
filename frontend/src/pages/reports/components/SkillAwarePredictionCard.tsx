import React from 'react';
import { Sparkles, AlertCircle, CheckCircle, Calendar, UserX } from 'lucide-react';
import { trunc1Dec } from '../../../utils';

interface AtRiskStudent {
  student_id: number;
  student_name: string;
  nickname: string;
  pred_c1: number;
  pred_c2: number;
  reason: string;
}

interface SkillPredictionData {
  has_upcoming_config: boolean;
  session_date?: string;
  check_1_info?: {
    skill: string;
    units: string[];
    topic: string;
  };
  check_2_info?: {
    skill: string;
    units: string[];
    topic: string;
  };
  at_risk_students?: AtRiskStudent[];
  summary: string;
}

interface SkillAwarePredictionCardProps {
  prediction: SkillPredictionData | null;
  onSelectStudent?: (studentId: number) => void;
}

export const SkillAwarePredictionCard: React.FC<SkillAwarePredictionCardProps> = ({
  prediction,
  onSelectStudent,
}) => {
  if (!prediction || !prediction.has_upcoming_config) {
    return (
      <div className="bg-[#0c0f1d] border border-white/10 rounded-2xl p-5 shadow-lg space-y-3 select-none">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-base font-black text-white">
              Dự Đoán Năng Lực Buổi Học Tới (Skill-Aware Prediction)
            </h3>
            <p className="text-xs text-slate-400">
              Dự báo kết quả học sinh theo đúng nội dung và bài học cụ thể của buổi kiểm tra tiếp theo.
            </p>
          </div>
        </div>

        <div className="bg-[#121626] border border-white/5 rounded-xl p-4 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-bold">
            <Calendar size={14} />
            <span>Chưa có buổi học tiếp theo được cấu hình bài kiểm tra</span>
          </div>
          <p className="text-slate-400">
            Để kích hoạt tính năng dự đoán ngữ cảnh: Vào trang <strong>Quản Lý Lớp Học</strong> &rarr; Chọn ngày học tiếp theo &rarr; Bấm <strong>"Cấu Hình Bài Kiểm Tra"</strong> và chọn bài học/chủ đề sẽ kiểm tra. Hệ thống sẽ tự động đối chiếu lịch sử nắm vững của từng học sinh để cảnh báo sớm!
          </p>
        </div>
      </div>
    );
  }

  const atRisk = prediction.at_risk_students || [];

  return (
    <div className="bg-[#0c0f1d] border border-indigo-500/30 rounded-2xl p-5 shadow-xl space-y-5 select-none relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">
                Dự Báo Năng Lực Buổi Học Sắp Tới
              </h3>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {prediction.session_date}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{prediction.summary}</p>
          </div>
        </div>

        {/* Content Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="bg-[#121626] border border-blue-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-blue-400">Từ Vựng:</span>
            <span className="text-white font-bold">
              {prediction.check_1_info?.units?.join(', ') || 'Chung'}
            </span>
          </div>
          <div className="bg-[#121626] border border-purple-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-purple-400">Ngữ Pháp:</span>
            <span className="text-white font-bold">
              {prediction.check_2_info?.topic || prediction.check_2_info?.units?.join(', ') || 'Chung'}
            </span>
          </div>
        </div>
      </div>

      {/* At-Risk Students Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
            <AlertCircle size={14} className={atRisk.length > 0 ? 'text-amber-400' : 'text-emerald-400'} />
            Học Sinh Có Nguy Cơ Cần Phụ Đạo Trước ({atRisk.length} học sinh)
          </span>
          {atRisk.length === 0 && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle size={14} />
              Toàn bộ học sinh đều đã đạt chuẩn cho bài học này
            </span>
          )}
        </div>

        {atRisk.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {atRisk.map((st) => (
              <div
                key={st.student_id}
                onClick={() => onSelectStudent && onSelectStudent(st.student_id)}
                className="bg-[#121626] border border-amber-500/20 hover:border-amber-500/40 p-3.5 rounded-xl space-y-2 cursor-pointer transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white group-hover:text-indigo-300 transition text-xs">
                    {st.student_name}
                  </span>
                  <div className="flex gap-1.5 text-[11px] font-extrabold">
                    <span className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                      Từ Vựng: {trunc1Dec(st.pred_c1)}
                    </span>
                    <span className="text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                      Ngữ Pháp: {trunc1Dec(st.pred_c2)}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed italic">
                  {st.reason}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#121626] border border-emerald-500/20 p-4 rounded-xl text-xs text-slate-300 flex items-center gap-3">
            <CheckCircle size={18} className="text-emerald-400 shrink-0" />
            <span>
              Dựa trên dữ liệu lịch sử, các học sinh trong lớp đều có điểm EMA &ge; 6.5 đối với các chủ đề sẽ kiểm tra trong buổi học tiếp theo.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
