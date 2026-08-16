import React, { useState } from 'react';
import { Info, Zap } from 'lucide-react';
import { GradeTypeItem } from '../../../types';

interface SummaryStripProps {
  engine: any;
  gradeTypesList: GradeTypeItem[];
}

export const SummaryStrip: React.FC<SummaryStripProps> = ({ engine, gradeTypesList }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

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
            title="Giải thích Forecast"
          >
            <Info size={11} />
          </button>
        </div>
        <span className="text-sm font-black text-indigo-400 font-mono">{engine.predicted_next} Điểm</span>
        <span className="text-[10px] text-slate-400 font-semibold block">{engine.prediction_model ?? 'Smart Predict'}</span>

        {activeTooltip === 'forecast' && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-[#161c34] border border-[#2c375e] text-slate-200 text-[11px] rounded-xl shadow-2xl z-30 text-left font-sans">
            <span className="font-extrabold text-indigo-300 block mb-1">Dự Đoán ({engine.prediction_model ?? 'Smart Predict'}):</span>
            Tự động chọn mô hình tối ưu theo số buổi học: EMA (&lt;5 buổi), Weighted OLS (5–19 buổi), Holt-Winters (20+ buổi).
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
            title="Giải thích EMA"
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
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-[#161c34] border border-[#2c375e] text-slate-200 text-[11px] rounded-xl shadow-2xl z-30 text-left font-sans">
            <span className="font-extrabold text-emerald-300 block mb-1">Trình Độ Hiện Tại (EMA):</span>
            <div className="space-y-1 my-1.5 font-mono text-[10px] font-bold bg-[#0d1120] p-2 rounded-lg border border-[#202948]">
              <div className="flex items-center justify-between text-blue-400">
                <span>Check 1 EMA:</span>
                <span>{engine.ema_c1 ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-purple-400">
                <span>Check 2 EMA:</span>
                <span>{engine.ema_c2 ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-400">
                <span>Homework EMA:</span>
                <span>{engine.ema_hw ?? 0}</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 block">
              Trình độ EMA ({engine.ema_level}) ưu tiên trọng số các buổi học mới nhất.
            </span>
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
            title="Giải thích Standard Deviation"
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
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-[#161c34] border border-[#2c375e] text-slate-200 text-[11px] rounded-xl shadow-2xl z-30 text-left font-sans">
            <span className="font-extrabold text-cyan-300 block mb-1">Độ Biến Động Thật Sự (Residual SD):</span>
            <div className="space-y-1 my-1.5 font-mono text-[10px] font-bold bg-[#0d1120] p-2 rounded-lg border border-[#202948]">
              {gradeTypesList.map(gt => (
                <div key={gt.id} className="flex items-center justify-between" style={{ color: gt.color || '#3b82f6' }}>
                  <span>{gt.label} ({gt.weight}%):</span>
                  <span>σ = {((engine as any)[`std_dev_${gt.id}`] ?? engine.std_dev ?? 0)}</span>
                </div>
              ))}
            </div>
            <span className="text-[10px] text-slate-400 block">
              SD đo độ ổn định quanh quỹ đạo tiến bộ, loại bỏ sai số giữa tiến bộ vượt bậc và trồi sụt thất thường.
            </span>
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
            title="Giải thích Trend Rate"
          >
            <Info size={11} />
          </button>
        </div>
        <span className="text-sm font-black text-purple-300 font-mono">{engine.trend_slope > 0 ? `+${engine.trend_slope}` : engine.trend_slope}/buổi</span>
        <span className={`text-[10px] font-bold block truncate ${engine.trend_label?.includes('Giảm') || engine.trend_label?.includes('Suy giảm') ? 'text-rose-400' :
          engine.trend_label?.includes('Ổn định') ? 'text-slate-300' : 'text-emerald-400'
          }`}>{engine.trend_label}</span>

        {activeTooltip === 'trend' && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-[#161c34] border border-[#2c375e] text-slate-200 text-[11px] rounded-xl shadow-2xl z-30 text-left font-sans">
            <span className="font-extrabold text-purple-300 block mb-1">Tốc Độ Tăng Trưởng (Trend Rate):</span>
            Hệ số góc (slope) tính toán mức tăng hoặc giảm trung bình của học sinh sau mỗi buổi học.
          </div>
        )}
      </div>

      {/* 5. Performance Index (PI) */}
      <div className="border-l border-[#1d2644] relative group p-1">
        <div className="flex items-center justify-center gap-1">
          <span className="text-[10px] font-black uppercase text-amber-400 block flex items-center gap-1">
            <Zap size={11} className="text-amber-400" />
            Chỉ Số PI
          </span>
          <button
            type="button"
            onClick={() => setActiveTooltip(activeTooltip === 'pi' ? null : 'pi')}
            className="text-slate-500 hover:text-amber-400 cursor-pointer"
            title="Giải thích Performance Index (PI)"
          >
            <Info size={11} />
          </button>
        </div>
        <span className="text-sm font-black text-amber-300 font-mono">{engine.performance_index ?? 85.0} / 100</span>
        <span className="text-[10px] text-amber-400/90 font-bold block truncate">Phong Độ Toàn Diện</span>

        {activeTooltip === 'pi' && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 p-3.5 bg-[#161c34] border border-amber-500/40 text-slate-200 text-[11px] rounded-xl shadow-2xl z-30 text-left font-sans space-y-1.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-1">
              <span className="font-extrabold text-amber-300 flex items-center gap-1">
                <Zap size={12} /> Chỉ Số PI (Performance Index):
              </span>
              <span className="font-mono font-black text-amber-300">{engine.performance_index ?? 85.0}đ</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              Tổng hợp 5 yếu tố học tập toàn diện:
              <br />• <strong>40% EMA</strong>: Trình độ năng lực gần đây nhất.
              <br />• <strong>25% Trend</strong>: Đà phát triển & tốc độ tiến bộ.
              <br />• <strong>15% Độ ổn định</strong>: Phong độ vững vàng (SD).
              <br />• <strong>10% Điểm lịch sử</strong>: Quá trình từ đầu kỳ.
              <br />• <strong>10% Chuyên cần</strong>: Tỷ lệ đi học đầy đủ.
            </p>
            <div className="pt-1 border-t border-white/10 text-[10px] font-bold text-slate-400">
              Thang điểm: ≥90 Xuất sắc | 80-89 Rất tốt | 70-79 Tốt | 60-69 Cần cố gắng | &lt;60 Nguy cơ
            </div>
          </div>
        )}
      </div>

      {/* 6. Overall Rating */}
      <div className="border-l border-[#1d2644] p-1">
        <span className="text-[10px] font-black uppercase text-slate-400 block">Xếp Loại Chung</span>
        <span className={`text-xs font-black flex items-center justify-center gap-1 ${engine.rating_label?.includes('NGUY CƠ') ? 'text-rose-500 font-extrabold animate-pulse' :
          engine.rating_label?.includes('Cần Cố Gắng') ? 'text-amber-400' :
            engine.rating_label?.includes('Tốt') ? 'text-blue-400' : 'text-emerald-400'
          }`}>
          {engine.rating_label ?? 'Tốt'}
        </span>
        <span className="text-[10px] text-slate-400 font-semibold block truncate">Đánh Giá Học Lực</span>
      </div>
    </div>
  );
};
