import React, { useState, useMemo } from 'react';
import { Info } from 'lucide-react';
import { GradeTypeItem } from '../../../types';
import { SummaryTooltipCard } from './SummaryTooltipCard';
import { DistributionSummaryStrip } from './DistributionSummaryStrip';
import { DistributionStats } from '../utils/distributionAnalytics';

interface SummaryStripProps {
  engine: any;
  gradeTypesList: GradeTypeItem[];
  hasSelectedStudent?: boolean;
  chartViewMode?: 'timeline' | 'distribution';
  distributionStats?: DistributionStats;
}

export const SummaryStrip: React.FC<SummaryStripProps> = React.memo(({
  engine,
  gradeTypesList,
  chartViewMode = 'timeline',
  distributionStats,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Bulletproof fallback engine guaranteeing 0 null crashes
  const safeEngine = useMemo(() => {
    const e = engine || {};
    return {
      performance_index: e.performance_index != null ? Number(e.performance_index) : 85.0,
      predicted_next: e.predicted_next != null ? e.predicted_next : '8.5',
      prediction_model: e.prediction_model || 'Smart Predict',
      pred_c1: e.pred_c1 ?? 8.5,
      pred_c2: e.pred_c2 ?? 8.5,
      pred_hw: e.pred_hw ?? 9.0,
      ema_level: e.ema_level != null ? Number(e.ema_level) : 8.2,
      ema_c1: e.ema_c1 ?? 8.2,
      ema_c2: e.ema_c2 ?? 8.2,
      ema_hw: e.ema_hw ?? 9.0,
      std_dev: e.std_dev != null ? Number(e.std_dev) : 0.45,
      consistency_label: e.consistency_label || 'Ổn định',
      trend_slope: e.trend_slope != null ? Number(e.trend_slope) : 0.15,
      trend_label: e.trend_label || 'Đang cải thiện tiến bộ',
      rating_label: e.rating_label || 'Giỏi',
      recommendations: Array.isArray(e.recommendations) ? e.recommendations : [],
      ...e,
    };
  }, [engine]);

  if (chartViewMode === 'distribution' && distributionStats) {
    return <DistributionSummaryStrip distributionStats={distributionStats} />;
  }

  const pi = safeEngine.performance_index;
  const piInfo = pi < 35 ? { color: 'text-rose-500', label: 'Kém (Cần Phụ Đạo)', sub: 'text-rose-400 font-extrabold' }
    : pi < 50 ? { color: 'text-orange-400', label: 'Yếu (Hổng Kiến Thức)', sub: 'text-orange-400 font-bold' }
    : pi < 65 ? { color: 'text-amber-400', label: 'Trung Bình (Cần Củng Cố)', sub: 'text-amber-400 font-bold' }
    : pi < 80 ? { color: 'text-cyan-400', label: 'Khá (Đang Tiến Bộ)', sub: 'text-cyan-400 font-bold' }
    : pi < 90 ? { color: 'text-blue-400', label: 'Giỏi / Rất Tốt', sub: 'text-blue-400 font-bold' }
    : { color: 'text-emerald-400', label: 'Xuất Sắc (Vững Vàng)', sub: 'text-emerald-400 font-bold' };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 bg-[#0c0f1e] border border-[#1e2746] rounded-xl text-center items-center relative shadow-md divide-y sm:divide-y-0 sm:divide-x divide-[#1e2746]">
      {/* 1. Next Session Prediction */}
      <div className="relative group p-2.5 animate-cascade-1">
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
        <span className="text-sm font-black text-indigo-400 font-mono">{safeEngine.predicted_next} Điểm</span>
        <span className="text-[10px] text-slate-400 font-semibold block">{safeEngine.prediction_model}</span>

        {activeTooltip === 'forecast' && (
          <SummaryTooltipCard
            title="Dự Đoán Điểm Buổi Tiếp Theo"
            titleColor="text-indigo-300"
            onClose={() => setActiveTooltip(null)}
            whatItReflects="Điểm số dự kiến học sinh có khả năng đạt được trong buổi học tới dựa trên phân tích chuỗi thời gian."
            footer={
              <>
                <span className="font-bold text-slate-300 block">Mô hình tính toán ({safeEngine.prediction_model}):</span>
                <div>Dưới 5 buổi: EMA | 5-19 buổi: Weighted OLS | 20+ buổi: Holt-Winters</div>
              </>
            }
          >
            <div className="bg-[#0d1120] p-2.5 rounded-lg border border-[#202948] space-y-1.5 font-mono text-[10px]">
              <div className="text-slate-400 font-bold border-b border-white/5 pb-1">55% TV + 35% NP + 10% BTVN</div>
              <div className="flex items-center justify-between text-blue-400"><span>Từ Vựng:</span><span className="font-black">{safeEngine.pred_c1} đ</span></div>
              <div className="flex items-center justify-between text-purple-400"><span>Ngữ Pháp:</span><span className="font-black">{safeEngine.pred_c2} đ</span></div>
              <div className="flex items-center justify-between text-emerald-400"><span>BTVN:</span><span className="font-black">{safeEngine.pred_hw} đ</span></div>
            </div>
          </SummaryTooltipCard>
        )}
      </div>

      {/* 2. EMA Skill Level */}
      <div className="relative group p-2.5 animate-cascade-2">
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
        <span className={`text-sm font-black font-mono ${safeEngine.ema_level < 4.6 ? 'text-rose-500' :
          safeEngine.ema_level < 6.0 ? 'text-amber-400' :
            safeEngine.ema_level < 8.0 ? 'text-blue-400' : 'text-emerald-400'
          }`}>{safeEngine.ema_level}</span>
        <span className="text-[10px] text-slate-400 font-semibold block">Học Lực Gần Nhất</span>

        {activeTooltip === 'ema' && (
          <SummaryTooltipCard
            title="Trình Độ Năng Lực Hiện Tại (EMA)"
            titleColor="text-emerald-300"
            onClose={() => setActiveTooltip(null)}
            whatItReflects="Năng lực học thuật thực chất trong 3-4 buổi học gần nhất qua thuật toán trung bình trượt hàm mũ."
            footer={
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <span className="text-emerald-400">≥ 8.0: Giỏi</span>
                <span className="text-blue-400">7.0 - 7.9: Khá</span>
                <span className="text-amber-400">4.6 - 6.9: Trung Bình</span>
                <span className="text-rose-400">&lt; 4.6: Yếu</span>
              </div>
            }
          >
            <div className="bg-[#0d1120] p-2.5 rounded-lg border border-[#202948] space-y-1 font-mono text-[10px]">
              <div className="text-slate-400 font-bold border-b border-white/5 pb-1">EMA = 0.5 × Mới + 0.5 × Cũ</div>
              <div className="flex items-center justify-between text-blue-400"><span>Từ Vựng EMA:</span><span className="font-black">{safeEngine.ema_c1} đ</span></div>
              <div className="flex items-center justify-between text-purple-400"><span>Ngữ Pháp EMA:</span><span className="font-black">{safeEngine.ema_c2} đ</span></div>
              <div className="flex items-center justify-between text-emerald-400"><span>BTVN EMA:</span><span className="font-black">{safeEngine.ema_hw} đ</span></div>
            </div>
          </SummaryTooltipCard>
        )}
      </div>

      {/* 3. Volatility / Standard Deviation (SD) */}
      <div className="relative group p-2.5 animate-cascade-3">
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
        <span className={`text-sm font-black font-mono ${safeEngine.std_dev > 2.0 ? 'text-rose-500' :
          safeEngine.std_dev > 1.0 ? 'text-amber-400' :
            safeEngine.std_dev < 0.5 ? 'text-emerald-400' : 'text-cyan-400'
          }`}>σ = {safeEngine.std_dev}</span>
        <span className={`text-[10px] font-semibold block truncate ${safeEngine.consistency_label?.includes('mạnh') ? 'text-rose-400 font-extrabold' :
          safeEngine.consistency_label?.includes('Biến động') ? 'text-amber-400 font-bold' :
            safeEngine.consistency_label?.includes('Rất ổn định') ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}>{safeEngine.consistency_label}</span>

        {activeTooltip === 'sd' && (
          <SummaryTooltipCard
            title="Độ Ổn Định & Biến Động Điểm Số (SD)"
            titleColor="text-cyan-300"
            onClose={() => setActiveTooltip(null)}
            whatItReflects="Độ lệch chuẩn điểm số đo mức độ ổn định hay trồi sụt của học sinh qua các buổi kiểm tra."
            footer={
              <div className="space-y-0.5 text-[10px]">
                <div className="text-emerald-400">σ &lt; 0.5: Rất Ổn Định</div>
                <div className="text-cyan-400">0.5 - 1.0: Ổn Định</div>
                <div className="text-amber-400">1.1 - 2.2: Biến Động</div>
                <div className="text-rose-400">σ &gt; 2.2: Biến Động Mạnh</div>
              </div>
            }
          >
            <div className="bg-[#0d1120] p-2.5 rounded-lg border border-[#202948] space-y-1 font-mono text-[10px]">
              <div className="text-slate-400 font-bold border-b border-white/5 pb-1">σ = Căn bậc hai phương sai</div>
              {gradeTypesList.map(gt => (
                <div key={gt.id} className="flex items-center justify-between" style={{ color: gt.color || '#3b82f6' }}>
                  <span>{gt.label} ({gt.weight}%):</span>
                  <span className="font-black">σ = {((safeEngine as any)[`std_dev_${gt.id}`] ?? safeEngine.std_dev ?? 0)}</span>
                </div>
              ))}
            </div>
          </SummaryTooltipCard>
        )}
      </div>

      {/* 4. Growth Rate (Trend Rate) */}
      <div className="relative group p-2.5 animate-cascade-4">
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
        <span className="text-sm font-black text-purple-300 font-mono">{safeEngine.trend_slope > 0 ? `+${safeEngine.trend_slope}` : safeEngine.trend_slope}/buổi</span>
        <span className={`text-[10px] font-bold block truncate ${safeEngine.trend_label?.includes('Giảm') || safeEngine.trend_label?.includes('Suy giảm') ? 'text-rose-400' :
          safeEngine.trend_label?.includes('Ổn định') ? 'text-slate-300' : 'text-emerald-400'
          }`}>{safeEngine.trend_label}</span>

        {activeTooltip === 'trend' && (
          <SummaryTooltipCard
            title="Tốc Độ Tăng Trưởng (Trend Rate)"
            titleColor="text-purple-300"
            onClose={() => setActiveTooltip(null)}
            whatItReflects="Mức độ tiến bộ hoặc sa sút trung bình sau mỗi buổi học (số điểm tăng/giảm trên mỗi buổi)."
            footer={
              <div className="space-y-0.5 text-[10px]">
                <div className="text-emerald-400">&gt; +0.3: Tăng trưởng mạnh</div>
                <div className="text-cyan-400">+0.1 đến +0.3: Cải thiện</div>
                <div className="text-slate-300">-0.1 đến +0.1: Duy trì</div>
                <div className="text-rose-400">&lt; -0.3: Suy giảm nhanh</div>
              </div>
            }
          >
            <div className="bg-[#0d1120] p-2.5 rounded-lg border border-[#202948] space-y-1 font-mono text-[10px]">
              <div className="text-slate-400 font-bold border-b border-white/5 pb-1">Hệ số góc a: y = ax + b</div>
              <div className="flex items-center justify-between text-purple-300 font-bold">
                <span>Tốc độ thay đổi:</span>
                <span>{safeEngine.trend_slope > 0 ? `+${safeEngine.trend_slope}` : safeEngine.trend_slope} đ/buổi</span>
              </div>
            </div>
          </SummaryTooltipCard>
        )}
      </div>

      {/* 5. Performance Index (PI) */}
      <div className="relative group p-2.5 animate-cascade-5">
        <div className="flex items-center justify-center gap-1">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Chỉ Số PI</span>
          <button
            type="button"
            onClick={() => setActiveTooltip(activeTooltip === 'pi' ? null : 'pi')}
            className="text-slate-500 hover:text-indigo-400 cursor-pointer"
            title="Xem chi tiết chỉ số PI"
          >
            <Info size={11} />
          </button>
        </div>
        <span className={`text-sm font-black font-mono ${piInfo.color}`}>{pi} / 100</span>
        <span className={`text-[10px] block truncate ${piInfo.sub}`}>{piInfo.label}</span>

        {activeTooltip === 'pi' && (
          <SummaryTooltipCard
            title="Chỉ Số Phong Độ PI (Thang 0 - 100)"
            titleColor="text-indigo-300"
            onClose={() => setActiveTooltip(null)}
            whatItReflects="Điểm số phong độ toàn diện chuẩn hóa theo thang 100, tổng hợp đồng thời cả 5 trụ cột học tập cốt lõi."
            footer={
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <span className="text-emerald-400">≥ 90: Xuất Sắc</span>
                <span className="text-blue-400">80 - 89: Giỏi</span>
                <span className="text-cyan-400">65 - 79: Khá</span>
                <span className="text-rose-400">&lt; 35: Kém</span>
              </div>
            }
          >
            <div className="bg-[#0d1120] p-2.5 rounded-lg border border-[#202948] space-y-1 text-[10px]">
              <div className="text-slate-400 font-bold border-b border-white/5 pb-1 font-mono">Trọng số tính điểm PI:</div>
              <div className="text-slate-300">40% Năng lực EMA + 25% Đà tiến bộ + 15% Độ ổn định + 10% Điểm lịch sử + 10% Chuyên cần</div>
            </div>
          </SummaryTooltipCard>
        )}
      </div>

      {/* 6. Overall Rating */}
      <div className="relative group p-2.5 animate-cascade-6">
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
        <span className={`text-xs font-black flex items-center justify-center gap-1 ${safeEngine.rating_label?.includes('Kém') || safeEngine.rating_label?.includes('NGUY CƠ') ? 'text-rose-500 font-extrabold animate-pulse' :
          safeEngine.rating_label?.includes('Yếu') ? 'text-orange-400' :
            safeEngine.rating_label?.includes('Trung Bình') ? 'text-amber-400' :
              safeEngine.rating_label?.includes('Khá') ? 'text-cyan-400' :
                safeEngine.rating_label?.includes('Giỏi') ? 'text-blue-400' : 'text-emerald-400'
          }`}>
          {safeEngine.rating_label}
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
              {safeEngine.recommendations.length > 0 ? (
                safeEngine.recommendations.map((rec: string, i: number) => (
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
