import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { GradeTypeItem } from '../../../types';

interface SummaryStripProps {
  engine: any;
  gradeTypesList: GradeTypeItem[];
}

export const SummaryStrip: React.FC<SummaryStripProps> = ({ engine, gradeTypesList }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // 6-Tier Realistic Educational Scale for PI (Scale 0 - 100)
  const pi = engine.performance_index != null ? Number(engine.performance_index) : 85.0;
  let piColor = 'text-emerald-400';
  let piLabel = 'Xuất Sắc (Vững Vàng)';
  let piSubColor = 'text-emerald-400 font-bold';

  if (pi < 35) {
    piColor = 'text-rose-500';
    piLabel = 'Kém (Cần Phụ Đạo)';
    piSubColor = 'text-rose-400 font-extrabold';
  } else if (pi < 50) {
    piColor = 'text-orange-400';
    piLabel = 'Yếu (Hổng Kiến Thức)';
    piSubColor = 'text-orange-400 font-bold';
  } else if (pi < 65) {
    piColor = 'text-amber-400';
    piLabel = 'Trung Bình (Cần Củng Cố)';
    piSubColor = 'text-amber-400 font-bold';
  } else if (pi < 80) {
    piColor = 'text-cyan-400';
    piLabel = 'Khá (Đang Tiến Bộ)';
    piSubColor = 'text-cyan-400 font-bold';
  } else if (pi < 90) {
    piColor = 'text-blue-400';
    piLabel = 'Giỏi / Rất Tốt';
    piSubColor = 'text-blue-400 font-bold';
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-[#0f1426] border border-[#1d2644] p-3 rounded-xl text-center items-center relative shadow-lg">
      {/* 1. Next Session Prediction */}
      <div className="relative group p-1">
        <div className="flex items-center justify-center gap-1">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Dự Đoán Buổi Tới</span>
          <button
            type="button"
            onClick={() => setActiveTooltip(activeTooltip === 'forecast' ? null : 'forecast')}
            className="text-slate-500 hover:text-indigo-400 cursor-pointer"
            title="Xem chi tiết dự đoán"
          >
            <Info size={11} />
          </button>
        </div>
        <span className="text-sm font-black text-indigo-400 font-mono">{engine.predicted_next} Điểm</span>
        <span className="text-[10px] text-slate-400 font-semibold block">{engine.prediction_model ?? 'Smart Predict'}</span>

        {activeTooltip === 'forecast' && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-80 p-4 bg-[#161c34] border border-[#2c375e] text-slate-200 text-[11px] rounded-xl shadow-2xl z-30 text-left font-sans space-y-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="font-extrabold text-indigo-300">
                Dự Đoán Điểm Buổi Tiếp Theo:
              </span>
              <span className="font-mono font-black text-indigo-300">{engine.predicted_next}đ</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              Dự báo điểm số bằng thuật toán chuỗi thời gian dựa trên lịch sử và đà học tập:
            </p>
            <div className="space-y-1 my-1 font-mono text-[10px] font-bold bg-[#0d1120] p-2 rounded-lg border border-[#202948]">
              <div className="flex items-center justify-between text-blue-400">
                <span>Check 1 Dự Đoán:</span>
                <span>{engine.pred_c1 ?? 0}đ</span>
              </div>
              <div className="flex items-center justify-between text-purple-400">
                <span>Check 2 Dự Đoán:</span>
                <span>{engine.pred_c2 ?? 0}đ</span>
              </div>
              <div className="flex items-center justify-between text-emerald-400">
                <span>Homework Dự Đoán:</span>
                <span>{engine.pred_hw ?? 0}đ</span>
              </div>
            </div>
            <div className="pt-1.5 border-t border-white/10 text-[10px] text-slate-400 space-y-0.5">
              <span className="font-bold text-slate-300 block">Cơ chế mô hình ({engine.prediction_model}):</span>
              <span>• &lt; 5 buổi: EMA (Trung bình trượt hàm mũ)</span><br />
              <span>• 5–19 buổi: Weighted OLS (Hồi quy trọng số lùi)</span><br />
              <span>• ≥ 20 buổi: Holt-Winters (Dự phóng bậc cao)</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. EMA Skill Level */}
      <div className="border-l border-[#1d2644] relative group p-1">
        <div className="flex items-center justify-center gap-1">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Trình Độ EMA</span>
          <button
            type="button"
            onClick={() => setActiveTooltip(activeTooltip === 'ema' ? null : 'ema')}
            className="text-slate-500 hover:text-emerald-400 cursor-pointer"
            title="Xem chi tiết EMA"
          >
            <Info size={11} />
          </button>
        </div>
        <span className={`text-sm font-black font-mono ${engine.ema_level < 5.0 ? 'text-rose-500' :
          engine.ema_level < 6.5 ? 'text-amber-400' :
            engine.ema_level < 8.0 ? 'text-blue-400' : 'text-emerald-400'
          }`}>{engine.ema_level}</span>
        <span className="text-[10px] text-slate-400 font-semibold block">Học Lực Gần Nhất</span>

        {activeTooltip === 'ema' && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-80 p-4 bg-[#161c34] border border-[#2c375e] text-slate-200 text-[11px] rounded-xl shadow-2xl z-30 text-left font-sans space-y-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="font-extrabold text-emerald-300">
                Trình Độ Năng Lực Hiện Tại (EMA):
              </span>
              <span className="font-mono font-black text-emerald-300">{engine.ema_level} / 10</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              Điểm số phản ánh đúng thực lực trong <strong>3–4 buổi học gần nhất</strong> (áp dụng hàm mũ EMA $\alpha=0.5$ giảm dần ảnh hưởng từ các điểm số quá cũ đầu kỳ):
            </p>
            <div className="space-y-1 my-1 font-mono text-[10px] font-bold bg-[#0d1120] p-2 rounded-lg border border-[#202948]">
              <div className="flex items-center justify-between text-blue-400">
                <span>Check 1 EMA (35%):</span>
                <span>{engine.ema_c1 ?? 0}đ</span>
              </div>
              <div className="flex items-center justify-between text-purple-400">
                <span>Check 2 EMA (55%):</span>
                <span>{engine.ema_c2 ?? 0}đ</span>
              </div>
              <div className="flex items-center justify-between text-emerald-400">
                <span>Homework EMA (10%):</span>
                <span>{engine.ema_hw ?? 0}đ</span>
              </div>
            </div>
            <div className="pt-1.5 border-t border-white/10 text-[10px] font-semibold text-slate-300 space-y-1">
              <span className="text-[10px] font-black text-emerald-300 uppercase block">Thang Điểm Học Lực EMA:</span>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <span className="text-emerald-400">≥8.5: Xuất Sắc</span>
                <span className="text-blue-400">7.5–8.4: Giỏi</span>
                <span className="text-cyan-400">6.5–7.4: Khá</span>
                <span className="text-amber-400">5.0–6.4: Trung Bình</span>
                <span className="text-rose-400 col-span-2">&lt;5.0: Yếu / Cần Bổ Trợ</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Volatility / Standard Deviation (SD) */}
      <div className="border-l border-[#1d2644] relative group p-1">
        <div className="flex items-center justify-center gap-1">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Độ Biến Động (SD)</span>
          <button
            type="button"
            onClick={() => setActiveTooltip(activeTooltip === 'sd' ? null : 'sd')}
            className="text-slate-500 hover:text-cyan-400 cursor-pointer"
            title="Xem chi tiết độ biến động"
          >
            <Info size={11} />
          </button>
        </div>
        <span className={`text-sm font-black font-mono ${engine.std_dev > 2.0 ? 'text-rose-500' :
          engine.std_dev > 1.0 ? 'text-amber-400' :
            engine.std_dev < 0.5 ? 'text-emerald-400' : 'text-cyan-400'
          }`}>σ = {engine.std_dev}</span>
        <span className={`text-[10px] font-semibold block truncate ${engine.consistency_label?.includes('mạnh') ? 'text-rose-400 font-extrabold' :
          engine.consistency_label?.includes('Biến động') ? 'text-amber-400 font-bold' :
            engine.consistency_label?.includes('Rất ổn định') ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}>{engine.consistency_label}</span>

        {activeTooltip === 'sd' && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-80 p-4 bg-[#161c34] border border-[#2c375e] text-slate-200 text-[11px] rounded-xl shadow-2xl z-30 text-left font-sans space-y-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="font-extrabold text-cyan-300">
                Độ Ổn Định & Biến Động Điểm Số (SD):
              </span>
              <span className="font-mono font-black text-cyan-300">σ = {engine.std_dev}</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              Đo độ lệch chuẩn dư ($RMSE$) quanh đường xu hướng để nhận diện học sinh làm bài đều tay hay bị trồi sụt thất thường:
            </p>
            <div className="space-y-1 my-1 font-mono text-[10px] font-bold bg-[#0d1120] p-2 rounded-lg border border-[#202948]">
              {gradeTypesList.map(gt => (
                <div key={gt.id} className="flex items-center justify-between" style={{ color: gt.color || '#3b82f6' }}>
                  <span>{gt.label} ({gt.weight}%):</span>
                  <span>σ = {((engine as any)[`std_dev_${gt.id}`] ?? engine.std_dev ?? 0)}</span>
                </div>
              ))}
            </div>
            <div className="pt-1.5 border-t border-white/10 text-[10px] font-semibold text-slate-300 space-y-1">
              <span className="text-[10px] font-black text-cyan-300 uppercase block">Thang Phân Loại Phong Độ:</span>
              <div className="space-y-0.5 text-[10px]">
                <div className="text-emerald-400">σ &lt; 0.5: Rất Ổn Định (Làm bài cực kỳ đều)</div>
                <div className="text-cyan-400">0.5 ≤ σ ≤ 1.0: Ổn Định (Phong độ vững vàng)</div>
                <div className="text-amber-400">1.1 ≤ σ ≤ 2.2: Biến Động (Có bài cao bài thấp)</div>
                <div className="text-rose-400">σ &gt; 2.2: Biến Động Mạnh (Cần theo dõi sát)</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Growth Rate (Trend Rate) */}
      <div className="border-l border-[#1d2644] relative group p-1">
        <div className="flex items-center justify-center gap-1">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Tốc Độ Tăng Trưởng</span>
          <button
            type="button"
            onClick={() => setActiveTooltip(activeTooltip === 'trend' ? null : 'trend')}
            className="text-slate-500 hover:text-purple-400 cursor-pointer"
            title="Xem chi tiết tốc độ tăng trưởng"
          >
            <Info size={11} />
          </button>
        </div>
        <span className="text-sm font-black text-purple-300 font-mono">{engine.trend_slope > 0 ? `+${engine.trend_slope}` : engine.trend_slope}/buổi</span>
        <span className={`text-[10px] font-bold block truncate ${engine.trend_label?.includes('Giảm') || engine.trend_label?.includes('Suy giảm') ? 'text-rose-400' :
          engine.trend_label?.includes('Ổn định') ? 'text-slate-300' : 'text-emerald-400'
          }`}>{engine.trend_label}</span>

        {activeTooltip === 'trend' && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-80 p-4 bg-[#161c34] border border-[#2c375e] text-slate-200 text-[11px] rounded-xl shadow-2xl z-30 text-left font-sans space-y-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="font-extrabold text-purple-300">
                Tốc Độ Tăng Trưởng (Trend Rate):
              </span>
              <span className="font-mono font-black text-purple-300">{engine.trend_slope > 0 ? `+${engine.trend_slope}` : engine.trend_slope}đ/buổi</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              Hệ số góc hồi quy tuyến tính ($a$ trong phương trình $y = ax + b$), đo mức tăng hoặc sụt giảm trung bình sau mỗi buổi học:
            </p>
            <div className="pt-1.5 border-t border-white/10 text-[10px] font-semibold text-slate-300 space-y-1">
              <span className="text-[10px] font-black text-purple-300 uppercase block">Thang Phân Loại Xu Hướng:</span>
              <div className="space-y-0.5 text-[10px]">
                <div className="text-emerald-400">&gt; +0.3đ/buổi: Tăng trưởng mạnh ↗</div>
                <div className="text-cyan-400">+0.1 đến +0.3đ/buổi: Đang cải thiện tiến bộ</div>
                <div className="text-slate-300">-0.1 đến +0.1đ/buổi: Duy trì ổn định</div>
                <div className="text-amber-400">-0.3 đến -0.1đ/buổi: Giảm nhẹ ↘</div>
                <div className="text-rose-400">&lt; -0.3đ/buổi: Suy giảm nhanh ⚠️ (Cần trao đổi)</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Performance Index (PI) */}
      <div className="border-l border-[#1d2644] relative group p-1">
        <div className="flex items-center justify-center gap-1">
          <span className="text-[10px] font-black uppercase text-slate-400 block">
            Chỉ Số PI
          </span>
          <button
            type="button"
            onClick={() => setActiveTooltip(activeTooltip === 'pi' ? null : 'pi')}
            className="text-slate-500 hover:text-indigo-400 cursor-pointer"
            title="Xem chi tiết chỉ số PI"
          >
            <Info size={11} />
          </button>
        </div>
        <span className={`text-sm font-black font-mono ${piColor}`}>
          {pi} / 100
        </span>
        <span className={`text-[10px] block truncate ${piSubColor}`}>
          {piLabel}
        </span>

        {activeTooltip === 'pi' && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-80 p-4 bg-[#161c34] border border-[#2c375e] text-slate-200 text-[11px] rounded-xl shadow-2xl z-30 text-left font-sans space-y-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="font-extrabold text-indigo-300">
                Chỉ Số Phong Độ PI (Scale 0 - 100):
              </span>
              <span className={`font-mono font-black ${piColor}`}>{pi}đ</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              Tổng hợp 5 yếu tố học tập cốt lõi:
              <br />• <strong>40% EMA</strong>: Trình độ năng lực qua các bài kiểm tra gần nhất.
              <br />• <strong>25% Trend</strong>: Đà phát triển / tốc độ tiến bộ qua từng buổi.
              <br />• <strong>15% Độ ổn định (SD)</strong>: Độ đều tay, tránh dao động thất thường.
              <br />• <strong>10% Điểm lịch sử</strong>: Điểm trung bình cả quá trình.
              <br />• <strong>10% Chuyên cần</strong>: Tỷ lệ tham gia buổi học đầy đủ.
            </p>
            <div className="pt-2 border-t border-white/10 text-[10px] font-semibold text-slate-300 space-y-1">
              <span className="text-[10px] font-black text-indigo-300 uppercase block">Thang Đánh Giá Học Lực:</span>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <span className="text-emerald-400">≥90: Xuất Sắc</span>
                <span className="text-blue-400">80–89: Giỏi / Rất Tốt</span>
                <span className="text-cyan-400">65–79: Khá</span>
                <span className="text-amber-400">50–64: Trung Bình</span>
                <span className="text-orange-400">35–49: Yếu (Hổng KT)</span>
                <span className="text-rose-400">0–34: Kém (Phụ Đạo)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. Overall Rating */}
      <div className="border-l border-[#1d2644] relative group p-1">
        <div className="flex items-center justify-center gap-1">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Xếp Loại Chung</span>
          <button
            type="button"
            onClick={() => setActiveTooltip(activeTooltip === 'rating' ? null : 'rating')}
            className="text-slate-500 hover:text-indigo-400 cursor-pointer"
            title="Xem khuyến nghị sư phạm"
          >
            <Info size={11} />
          </button>
        </div>
        <span className={`text-xs font-black flex items-center justify-center gap-1 ${engine.rating_label?.includes('Kém') || engine.rating_label?.includes('NGUY CƠ') ? 'text-rose-500 font-extrabold animate-pulse' :
          engine.rating_label?.includes('Yếu') ? 'text-orange-400' :
            engine.rating_label?.includes('Trung Bình') ? 'text-amber-400' :
              engine.rating_label?.includes('Khá') ? 'text-cyan-400' :
                engine.rating_label?.includes('Giỏi') ? 'text-blue-400' : 'text-emerald-400'
          }`}>
          {engine.rating_label ?? 'Tốt'}
        </span>
        <span className="text-[10px] text-slate-400 font-semibold block truncate">Đánh Giá Học Lực</span>

        {activeTooltip === 'rating' && (
          <div className="absolute bottom-full mb-2 right-0 w-80 p-4 bg-[#161c34] border border-[#2c375e] text-slate-200 text-[11px] rounded-xl shadow-2xl z-30 text-left font-sans space-y-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="font-extrabold text-indigo-300">
                Nhận Xét & Khuyến Nghị Sư Phạm:
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase">{engine.rating_label}</span>
            </div>
            <div className="space-y-1.5 text-[10px] text-slate-300 leading-relaxed">
              {engine.recommendations && engine.recommendations.length > 0 ? (
                engine.recommendations.map((rec: string, i: number) => (
                  <div key={i} className="flex items-start gap-1.5 bg-[#0d1120] p-2 rounded-lg border border-[#202948]">
                    <span className="text-indigo-400 font-bold shrink-0">•</span>
                    <span>{rec}</span>
                  </div>
                ))
              ) : (
                <div className="bg-[#0d1120] p-2 rounded-lg border border-[#202948]">
                  Đánh giá: Học sinh duy trì phong độ tốt. Tiếp tục phát huy trong các kỳ tới.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
