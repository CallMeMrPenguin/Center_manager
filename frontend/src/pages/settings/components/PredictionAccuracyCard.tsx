import React, { useState, useEffect } from 'react';
import { RefreshCw, Activity, Target } from 'lucide-react';
import { api } from '../../../api';
import { PredictionAccuracyResponse } from '../../../types';
import { showToast } from '../../../components/Toast';

export const PredictionAccuracyCard: React.FC = () => {
  const [data, setData] = useState<PredictionAccuracyResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const loadAccuracy = async () => {
    setLoading(true);
    try {
      const res = await api.getPredictionAccuracy();
      setData(res);
    } catch (e: any) {
      showToast('Không thể tải thống kê dự đoán: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccuracy();
  }, []);

  const summary = data?.summary;
  const items = data?.items || [];

  return (
    <div className="bg-white dark:bg-[#141417] rounded-2xl p-6 flex flex-col gap-5 shadow-xs dark:shadow-none border border-slate-200 dark:border-[#27272a]">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-blue-600 dark:text-blue-400" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Tỉ Lệ Dự Đoán Thông Minh (Smart Prediction Accuracy)
          </h3>
        </div>
        <button
          type="button"
          onClick={loadAccuracy}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          title="Đánh giá lại dữ liệu thực tế"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Làm mới thống kê</span>
        </button>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400">
        Đánh giá độ chính xác thực tế của hệ thống dự đoán trên toàn bộ lịch sử điểm số của học sinh (Sai số tối đa cho phép: Đúng sai lệch dưới 0.5 điểm, Gần đúng dưới 1.0 điểm).
      </p>

      {/* KPI Overview Pills */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 dark:bg-[#1c1c21] p-3 rounded-xl flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng Lượt Đánh Giá</span>
            <span className="text-base font-black text-slate-900 dark:text-white">
              {summary.total_evaluated.toLocaleString('vi-VN')}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">mẫu điểm lịch sử</span>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex flex-col gap-1">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Dự Đoán Đúng</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {summary.exact_rate}%
            </span>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">sai lệch dưới 0.5 điểm</span>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex flex-col gap-1">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Dự Đoán Gần Đúng</span>
            <span className="text-base font-black text-blue-600 dark:text-blue-400">
              {summary.near_rate}%
            </span>
            <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 font-medium">sai lệch dưới 1.0 điểm</span>
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl flex flex-col gap-1">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Sai Số Trung Bình</span>
            <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
              ±{summary.mae}
            </span>
            <span className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 font-medium">MAE toàn hệ thống</span>
          </div>
        </div>
      )}

      {/* Breakdown per grade type */}
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const exactPercent = Math.min(100, Math.max(0, item.exact_rate));
          const nearOnlyPercent = Math.min(100 - exactPercent, Math.max(0, item.near_rate - item.exact_rate));
          const deviatedPercent = Math.max(0, 100 - exactPercent - nearOnlyPercent);

          return (
            <div
              key={item.id}
              className="bg-slate-50 dark:bg-[#1c1c21] p-3.5 rounded-xl border border-slate-200 dark:border-[#27272a] flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-6 rounded-md shrink-0" style={{ backgroundColor: item.color }} />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-2">
                      ({item.total_evaluated} lượt kiểm thử)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    Đúng {item.exact_rate}%
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    Gần đúng {item.near_rate}%
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                    MAE ±{item.mae}
                  </span>
                </div>
              </div>

              {/* Stacked Visual Bar */}
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#111728] overflow-hidden flex">
                <div
                  style={{ width: `${exactPercent}%` }}
                  className="h-full bg-emerald-500 transition-all duration-500"
                  title={`Đúng: ${exactPercent.toFixed(1)}%`}
                />
                <div
                  style={{ width: `${nearOnlyPercent}%` }}
                  className="h-full bg-blue-500 transition-all duration-500"
                  title={`Gần đúng: ${nearOnlyPercent.toFixed(1)}%`}
                />
                <div
                  style={{ width: `${deviatedPercent}%` }}
                  className="h-full bg-slate-300 dark:bg-slate-700 transition-all duration-500"
                  title={`Lệch > 1.0 điểm: ${deviatedPercent.toFixed(1)}%`}
                />
              </div>

              {/* Legend row */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Chính xác ({item.exact_count} mẫu)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span>Gần đúng ({item.near_count - item.exact_count} mẫu)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0" />
                  <span>Sai lệch ({item.deviated_count} mẫu)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Model footer note */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-white/10 text-[11px] text-slate-500 dark:text-slate-400">
        <Activity size={13} className="text-blue-500 shrink-0" />
        <span>
          Các mô hình tự động phối hợp theo số lượng buổi học: Bayes Shrinkage (dưới 3 buổi), Decay Weighted (3 đến 19 buổi), Damped Holt (từ 20 buổi trở lên).
        </span>
      </div>
    </div>
  );
};
