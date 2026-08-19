import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { GradeTypeItem } from '../../../types';
import { SummaryTooltipCard } from './SummaryTooltipCard';

interface SummaryStripProps {
  engine: any;
  gradeTypesList: GradeTypeItem[];
  hasSelectedStudent?: boolean;
}

export const SummaryStrip: React.FC<SummaryStripProps> = React.memo(({ engine, gradeTypesList, hasSelectedStudent }) => {
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 bg-[#0c0f1e] border border-[#1e2746] rounded-xl text-center items-center relative shadow-md divide-y sm:divide-y-0 sm:divide-x divide-[#1e2746]">
      {/* 1. Next Session Prediction */}
      <div className="relative group p-2.5">
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
          <SummaryTooltipCard
            title="Dự Đoán Điểm Buổi Tiếp Theo"
            titleColor="text-indigo-300"
            onClose={() => setActiveTooltip(null)}
            whatItReflects="Điểm số dự kiến học sinh có khả năng đạt được trong buổi học tới dựa trên phân tích chuỗi thời gian và đà phong độ gần đây."
            footer={
              <>
                <span className="font-bold text-slate-300 block">Mô hình tính toán ({engine.prediction_model}):</span>
                <div>Dưới 5 buổi: EMA (Trung bình trượt hàm mũ)</div>
                <div>5 đến 19 buổi: Weighted OLS (Hồi quy trọng số lùi)</div>
                <div>Từ 20 buổi trở lên: Holt-Winters (Dự phóng bậc cao)</div>
              </>
            }
          >
            <div className="bg-[#0d1120] p-2.5 rounded-lg border border-[#202948] space-y-1.5 font-mono text-[10px]">
              <div className="text-slate-400 font-bold border-b border-white/5 pb-1">
                Công thức: Dự Đoán = 30% C1 + 45% C2 + 10% HW + 15% Luyện Đề
              </div>
              <div className="flex items-center justify-between text-blue-400">
                <span>Từ Vựng Dự Đoán:</span>
                <span className="font-black">{engine.pred_c1 ?? 0} đ</span>
              </div>
              <div className="flex items-center justify-between text-purple-400">
                <span>Ngữ Pháp Dự Đoán:</span>
                <span className="font-black">{engine.pred_c2 ?? 0} đ</span>
              </div>
              <div className="flex items-center justify-between text-emerald-400">
                <span>Homework Dự Đoán:</span>
                <span className="font-black">{engine.pred_hw ?? 0} đ</span>
              </div>
            </div>
          </SummaryTooltipCard>
        )}
      </div>

      {/* 2. EMA Skill Level */}
      <div className="relative group p-2.5">
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
        <span className={`text-sm font-black font-mono ${engine.ema_level < 4.6 ? 'text-rose-500' :
          engine.ema_level < 6.0 ? 'text-amber-400' :
            engine.ema_level < 8.0 ? 'text-blue-400' : 'text-emerald-400'
          }`}>{engine.ema_level}</span>
        <span className="text-[10px] text-slate-400 font-semibold block">Học Lực Gần Nhất</span>

        {activeTooltip === 'ema' && (
          <SummaryTooltipCard
            title="Trình Độ Năng Lực Hiện Tại (EMA)"
            titleColor="text-emerald-300"
            onClose={() => setActiveTooltip(null)}
            whatItReflects="Năng lực học thuật thực chất trong 3-4 buổi học gần nhất. Thuật toán giảm dần ảnh hưởng từ các điểm số quá cũ ở đầu kỳ để phản ánh chính xác phong độ hiện tại."
            footer={
              <div className="space-y-1">
                <span className="text-[10px] font-black text-emerald-300 uppercase block">Thang Điểm Học Lực EMA:</span>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <span className="text-emerald-400">≥ 8.0: Xuất Sắc / Giỏi</span>
                  <span className="text-blue-400">7.0 - 7.9: Khá</span>
                  <span className="text-amber-400">4.6 - 6.9: Trung Bình</span>
                  <span className="text-rose-400">Dưới 4.6: Yếu / Cần Bổ Trợ</span>
                </div>
              </div>
            }
          >
            <div className="bg-[#0d1120] p-2.5 rounded-lg border border-[#202948] space-y-1 font-mono text-[10px]">
              <div className="text-slate-400 font-bold border-b border-white/5 pb-1">
                Công thức: EMA_mới = 0.5 × Điểm_mới + 0.5 × EMA_cũ
              </div>
              <div className="flex items-center justify-between text-blue-400">
                <span>Từ Vựng EMA (35%):</span>
                <span className="font-black">{engine.ema_c1 ?? 0} đ</span>
              </div>
              <div className="flex items-center justify-between text-purple-400">
                <span>Ngữ Pháp EMA (55%):</span>
                <span className="font-black">{engine.ema_c2 ?? 0} đ</span>
              </div>
              <div className="flex items-center justify-between text-emerald-400">
                <span>Homework EMA (10%):</span>
                <span className="font-black">{engine.ema_hw ?? 0} đ</span>
              </div>
            </div>
          </SummaryTooltipCard>
        )}
      </div>

      {/* 3. Volatility / Standard Deviation (SD) */}
      <div className="relative group p-2.5">
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
          <SummaryTooltipCard
            title="Độ Ổn Định & Biến Động Điểm Số (SD)"
            titleColor="text-cyan-300"
            onClose={() => setActiveTooltip(null)}
            whatItReflects="Độ lệch chuẩn điểm số đo mức độ ổn định hay trồi sụt của học sinh qua các buổi kiểm tra. Độ lệch càng nhỏ thể hiện học sinh làm bài càng đều tay và chắc chắn."
            footer={
              <div className="space-y-1">
                <span className="text-[10px] font-black text-cyan-300 uppercase block">Thang Phân Loại Phong Độ:</span>
                <div className="space-y-0.5 text-[10px]">
                  <div className="text-emerald-400">σ dưới 0.5: Rất Ổn Định (Làm bài cực kỳ đều)</div>
                  <div className="text-cyan-400">0.5 đến 1.0: Ổn Định (Phong độ vững vàng)</div>
                  <div className="text-amber-400">1.1 đến 2.2: Biến Động (Có bài cao bài thấp)</div>
                  <div className="text-rose-400">σ trên 2.2: Biến Động Mạnh (Cần theo dõi sát)</div>
                </div>
              </div>
            }
          >
            <div className="bg-[#0d1120] p-2.5 rounded-lg border border-[#202948] space-y-1 font-mono text-[10px]">
              <div className="text-slate-400 font-bold border-b border-white/5 pb-1">
                Công thức: σ = Căn bậc hai của Phương sai điểm số
              </div>
              {gradeTypesList.map(gt => (
                <div key={gt.id} className="flex items-center justify-between" style={{ color: gt.color || '#3b82f6' }}>
                  <span>{gt.label} ({gt.weight}%):</span>
                  <span className="font-black">σ = {((engine as any)[`std_dev_${gt.id}`] ?? engine.std_dev ?? 0)}</span>
                </div>
              ))}
            </div>
          </SummaryTooltipCard>
        )}
      </div>

      {/* 4. Growth Rate (Trend Rate) */}
      <div className="relative group p-2.5">
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
          <SummaryTooltipCard
            title="Tốc Độ Tăng Trưởng (Trend Rate)"
            titleColor="text-purple-300"
            onClose={() => setActiveTooltip(null)}
            whatItReflects="Mức độ tiến bộ hoặc sa sút trung bình sau mỗi buổi học (tính bằng số điểm tăng/giảm trên mỗi buổi)."
            footer={
              <div className="space-y-1">
                <span className="text-[10px] font-black text-purple-300 uppercase block">Thang Phân Loại Xu Hướng:</span>
                <div className="space-y-0.5 text-[10px]">
                  <div className="text-emerald-400">Trên +0.3 đ/buổi: Tăng trưởng mạnh</div>
                  <div className="text-cyan-400">+0.1 đến +0.3 đ/buổi: Đang cải thiện tiến bộ</div>
                  <div className="text-slate-300">-0.1 đến +0.1 đ/buổi: Duy trì ổn định</div>
                  <div className="text-amber-400">-0.3 đến -0.1 đ/buổi: Giảm nhẹ</div>
                  <div className="text-rose-400">Dưới -0.3 đ/buổi: Suy giảm nhanh (Cần trao đổi)</div>
                </div>
              </div>
            }
          >
            <div className="bg-[#0d1120] p-2.5 rounded-lg border border-[#202948] space-y-1 font-mono text-[10px]">
              <div className="text-slate-400 font-bold border-b border-white/5 pb-1">
                Công thức: Hệ số góc a trong đường hồi quy y = ax + b
              </div>
              <div className="flex items-center justify-between text-purple-300 font-bold">
                <span>Tốc độ thay đổi:</span>
                <span>{engine.trend_slope > 0 ? `+${engine.trend_slope}` : engine.trend_slope} đ/buổi</span>
              </div>
            </div>
          </SummaryTooltipCard>
        )}
      </div>

      {/* 5. Performance Index (PI) */}
      <div className="relative group p-2.5">
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
          <SummaryTooltipCard
            title="Chỉ Số Phong Độ PI (Thang 0 - 100)"
            titleColor="text-indigo-300"
            onClose={() => setActiveTooltip(null)}
            whatItReflects="Điểm số phong độ toàn diện chuẩn hóa theo thang 100, tổng hợp đồng thời cả 5 trụ cột học tập cốt lõi của học sinh."
            footer={
              <div className="space-y-1">
                <span className="text-[10px] font-black text-indigo-300 uppercase block">Thang Đánh Giá Học Lực PI:</span>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <span className="text-emerald-400">≥ 90: Xuất Sắc</span>
                  <span className="text-blue-400">80 - 89: Giỏi / Rất Tốt</span>
                  <span className="text-cyan-400">65 - 79: Khá</span>
                  <span className="text-amber-400">50 - 64: Trung Bình</span>
                  <span className="text-orange-400">35 - 49: Yếu (Hổng KT)</span>
                  <span className="text-rose-400">Dưới 35: Kém (Phụ Đạo)</span>
                </div>
              </div>
            }
          >
            <div className="bg-[#0d1120] p-2.5 rounded-lg border border-[#202948] space-y-1 text-[10px]">
              <div className="text-slate-400 font-bold border-b border-white/5 pb-1 font-mono">
                Trọng số tính điểm PI:
              </div>
              <div className="text-slate-300">40% Năng lực hiện tại (Điểm EMA gần nhất)</div>
              <div className="text-slate-300">25% Đà tiến bộ (Tốc độ tăng trưởng)</div>
              <div className="text-slate-300">15% Độ ổn định (Mức độ đều tay)</div>
              <div className="text-slate-300">10% Điểm lịch sử cả quá trình</div>
              <div className="text-slate-300">10% Tỷ lệ chuyên cần đi học</div>
            </div>
          </SummaryTooltipCard>
        )}
      </div>

      {/* 6. Overall Rating */}
      <div className="relative group p-2.5">
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
          <SummaryTooltipCard
            title="Nhận Xét & Khuyến Nghị Sư Phạm"
            titleColor="text-indigo-300"
            alignRight={true}
            onClose={() => setActiveTooltip(null)}
            whatItReflects="Đánh giá sư phạm tổng quát và các khuyến nghị can thiệp cụ thể dành cho giáo viên và phụ huynh."
          >
            <div className="space-y-1.5 text-[10px] text-slate-300 leading-relaxed">
              {engine.recommendations && engine.recommendations.length > 0 ? (
                engine.recommendations.map((rec: string, i: number) => (
                  <div key={i} className="flex items-start gap-1.5 bg-[#0d1120] p-2 rounded-lg border border-[#202948]">
                    <span className="text-indigo-400 font-bold shrink-0">›</span>
                    <span>{rec}</span>
                  </div>
                ))
              ) : (
                <div className="bg-[#0d1120] p-2 rounded-lg border border-[#202948]">
                  Đánh giá: Học sinh duy trì phong độ tốt. Tiếp tục phát huy trong các kỳ tới.
                </div>
              )}
            </div>
          </SummaryTooltipCard>
        )}
      </div>
    </div>
  );
});
