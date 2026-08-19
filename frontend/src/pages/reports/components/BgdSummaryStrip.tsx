import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { SummaryTooltipCard } from './SummaryTooltipCard';
import { BgdDistributionStats } from '../utils/bgdAnalytics';
import { format1Dec } from '../../../utils';

interface BgdSummaryStripProps {
  bgdStats: BgdDistributionStats;
}

export const BgdSummaryStrip: React.FC<BgdSummaryStripProps> = React.memo(({ bgdStats }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 bg-[#0c0f1e] border border-[#1e2746] rounded-xl text-center items-center relative shadow-md divide-y sm:divide-y-0 sm:divide-x divide-[#1e2746]">
      {/* 1. Điểm Trung Bình (Mean) */}
      <div className="relative group p-2.5 animate-cascade-1">
        <div className="flex items-center justify-center gap-1">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Điểm Trung Bình</span>
          <button
            type="button"
            onClick={() => setActiveTooltip(activeTooltip === 'bgd-mean' ? null : 'bgd-mean')}
            className="text-slate-500 hover:text-indigo-400 cursor-pointer"
            title="Xem chi tiết Điểm Trung Bình"
          >
            <Info size={11} />
          </button>
        </div>
        <span className="text-sm font-black text-blue-400 font-mono">{format1Dec(bgdStats.mean)} Điểm</span>
        <span className="text-[10px] text-slate-400 font-semibold block truncate">Mặt Bằng Điểm Số</span>

        {activeTooltip === 'bgd-mean' && (
          <SummaryTooltipCard
            title="Điểm Trung Bình (Mean)"
            titleColor="text-blue-300"
            onClose={() => setActiveTooltip(null)}
            whatItReflects="Mặt bằng chung toàn bộ điểm số của lớp/học sinh. Thước đo cơ bản nhất để so sánh độ vừa sức của đề thi."
            footer={
              <div className="text-[10px] space-y-1 text-slate-300">
                <span className="font-bold text-blue-300 block">Công thức: Mean = Tổng điểm / N</span>
                <div>Tổng số mẫu: {bgdStats.n} lượt điểm</div>
                <div>Thấp nhất: {format1Dec(bgdStats.min)}đ - Cao nhất: {format1Dec(bgdStats.max)}đ</div>
              </div>
            }
          />
        )}
      </div>

      {/* 2. Trung Vị (Median) */}
      <div className="relative group p-2.5 animate-cascade-2">
        <div className="flex items-center justify-center gap-1">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Trung Vị (Median)</span>
          <button
            type="button"
            onClick={() => setActiveTooltip(activeTooltip === 'bgd-median' ? null : 'bgd-median')}
            className="text-slate-500 hover:text-indigo-400 cursor-pointer"
            title="Xem chi tiết Trung Vị"
          >
            <Info size={11} />
          </button>
        </div>
        <span className="text-sm font-black text-purple-400 font-mono">{format1Dec(bgdStats.median)} Điểm</span>
        <span className="text-[10px] text-slate-400 font-semibold block truncate">Học Sinh Điển Hình</span>

        {activeTooltip === 'bgd-median' && (
          <SummaryTooltipCard
            title="Trung Vị Điểm Số (Median)"
            titleColor="text-purple-300"
            onClose={() => setActiveTooltip(null)}
            whatItReflects="Mức điểm của học sinh đứng chính giữa danh sách khi sắp xếp tăng dần. Phản ánh học sinh điển hình thực chất, không bị méo bởi 1 vài em quá giỏi hoặc quá yếu."
            footer={
              <div className="text-[10px] space-y-1 text-slate-300">
                <span className="font-bold text-purple-300 block">So sánh với Điểm Trung Bình:</span>
                <div>{bgdStats.skewnessLabel}</div>
              </div>
            }
          />
        )}
      </div>

      {/* 3. Độ Lệch Chuẩn (SD) */}
      <div className="relative group p-2.5 animate-cascade-3">
        <div className="flex items-center justify-center gap-1">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Độ Lệch Chuẩn (SD)</span>
          <button
            type="button"
            onClick={() => setActiveTooltip(activeTooltip === 'bgd-sd' ? null : 'bgd-sd')}
            className="text-slate-500 hover:text-cyan-400 cursor-pointer"
            title="Xem chi tiết Độ Lệch Chuẩn"
          >
            <Info size={11} />
          </button>
        </div>
        <span className={`text-sm font-black font-mono ${
          bgdStats.sd > 2.0 ? 'text-rose-500' : bgdStats.sd > 1.2 ? 'text-cyan-400' : 'text-emerald-400'
        }`}>σ = {format1Dec(bgdStats.sd)}</span>
        <span className="text-[10px] text-slate-400 font-semibold block truncate">Độ Phân Hóa Lớp</span>

        {activeTooltip === 'bgd-sd' && (
          <SummaryTooltipCard
            title="Độ Lệch Chuẩn (Standard Deviation)"
            titleColor="text-cyan-300"
            onClose={() => setActiveTooltip(null)}
            whatItReflects="Thước đo mức độ phân tán điểm số quanh điểm trung bình. Cho biết học sinh trong lớp làm bài đều nhau hay trình độ bị chênh lệch lớn."
            footer={
              <div className="text-[10px] space-y-1 text-slate-300">
                <div>σ dưới 1.0: Cả lớp rất đồng đều (ít chênh lệch)</div>
                <div>σ từ 1.2 - 2.0: Phân hóa vừa phải (khỏe mạnh)</div>
                <div>σ trên 2.0: Chênh lệch rất lớn (cần chia nhóm dạy)</div>
              </div>
            }
          />
        )}
      </div>

      {/* 4. Khoảng Tứ Phân Vị (IQR) */}
      <div className="relative group p-2.5 animate-cascade-4">
        <div className="flex items-center justify-center gap-1">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Khoảng Tứ Phân Vị</span>
          <button
            type="button"
            onClick={() => setActiveTooltip(activeTooltip === 'bgd-iqr' ? null : 'bgd-iqr')}
            className="text-slate-500 hover:text-amber-400 cursor-pointer"
            title="Xem chi tiết Khoảng Tứ Phân Vị"
          >
            <Info size={11} />
          </button>
        </div>
        <span className="text-sm font-black text-amber-400 font-mono">IQR: {format1Dec(bgdStats.iqr)} đ</span>
        <span className="text-[10px] text-slate-400 font-semibold block truncate">Vùng 50% Giữa Bảng</span>

        {activeTooltip === 'bgd-iqr' && (
          <SummaryTooltipCard
            title="Khoảng Tứ Phân Vị (IQR = Q3 - Q1)"
            titleColor="text-amber-300"
            onClose={() => setActiveTooltip(null)}
            whatItReflects="Độ rộng vùng điểm của 50% học sinh giữa bảng (bỏ qua 25% top đầu và 25% đáy). Giúp giáo viên thiết kế độ khó bài tập nhắm trúng đa số học sinh."
            footer={
              <div className="text-[10px] space-y-1 text-slate-300">
                <div>Q1 (Mốc 25%): {format1Dec(bgdStats.q1)} điểm</div>
                <div>Q3 (Mốc 75%): {format1Dec(bgdStats.q3)} điểm</div>
                <div>Vùng tập trung: {format1Dec(bgdStats.q1)}đ đến {format1Dec(bgdStats.q3)}đ</div>
              </div>
            }
          />
        )}
      </div>

      {/* 5. Tỷ Lệ Đạt Yêu Cầu (>= 5.0) */}
      <div className="relative group p-2.5 animate-cascade-5">
        <div className="flex items-center justify-center gap-1">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Tỷ Lệ Đạt (≥5.0)</span>
          <button
            type="button"
            onClick={() => setActiveTooltip(activeTooltip === 'bgd-pass' ? null : 'bgd-pass')}
            className="text-slate-500 hover:text-emerald-400 cursor-pointer"
            title="Xem chi tiết Tỷ lệ Đạt"
          >
            <Info size={11} />
          </button>
        </div>
        <span className={`text-sm font-black font-mono ${
          bgdStats.passPct >= 85 ? 'text-emerald-400' : bgdStats.passPct >= 70 ? 'text-amber-400' : 'text-rose-500'
        }`}>{bgdStats.passPct}%</span>
        <span className="text-[10px] text-slate-400 font-semibold block truncate">
          {bgdStats.passCount}/{bgdStats.n} Lượt Đạt
        </span>

        {activeTooltip === 'bgd-pass' && (
          <SummaryTooltipCard
            title="Tỷ Lệ Đạt Chuẩn Kiến Thức"
            titleColor="text-emerald-300"
            onClose={() => setActiveTooltip(null)}
            whatItReflects="Tỷ lệ lượt làm bài đạt từ 5.0 điểm trở lên trong các kỳ kiểm tra."
            footer={
              <div className="text-[10px] space-y-1 text-slate-300">
                <div>Đạt yêu cầu (≥ 5.0đ): {bgdStats.passPct}% ({bgdStats.passCount} lượt)</div>
                <div>Giỏi & Xuất Sắc (≥ 8.0đ): {bgdStats.excellentPct}% ({bgdStats.excellentCount} lượt)</div>
                <div>Chưa đạt (dưới 5.0đ): {100 - bgdStats.passPct}% ({bgdStats.n - bgdStats.passCount} lượt)</div>
              </div>
            }
          />
        )}
      </div>

      {/* 6. Đánh Giá Phổ Điểm */}
      <div className="relative group p-2.5 animate-cascade-6">
        <div className="flex items-center justify-center gap-1">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Đánh Giá Phổ Điểm</span>
          <button
            type="button"
            onClick={() => setActiveTooltip(activeTooltip === 'bgd-rating' ? null : 'bgd-rating')}
            className="text-slate-500 hover:text-indigo-400 cursor-pointer"
            title="Xem khuyến nghị sư phạm"
          >
            <Info size={11} />
          </button>
        </div>
        <span className={`text-xs font-black truncate block ${
          bgdStats.distributionRating.includes('Xuất Sắc') ? 'text-emerald-400' :
          bgdStats.distributionRating.includes('Tốt') ? 'text-cyan-400' :
          bgdStats.distributionRating.includes('Khẩn') ? 'text-rose-500 animate-pulse' : 'text-amber-400'
        }`}>
          {bgdStats.distributionRating}
        </span>
        <span className="text-[10px] text-slate-400 font-semibold block truncate">
          {bgdStats.distributionShape}
        </span>

        {activeTooltip === 'bgd-rating' && (
          <SummaryTooltipCard
            title="Đánh Giá Tổng Quan Phổ Điểm"
            titleColor="text-indigo-300"
            alignRight={true}
            onClose={() => setActiveTooltip(null)}
            whatItReflects="Đánh giá tổng quát về hình thái phân bố điểm số và các biện pháp can thiệp sư phạm phù hợp."
          >
            <div className="space-y-1.5 text-[10px] text-slate-300 leading-relaxed">
              <div className="p-2 rounded-lg bg-[#0d1120] border border-[#202948]">
                {bgdStats.commentary.headline}
              </div>
            </div>
          </SummaryTooltipCard>
        )}
      </div>
    </div>
  );
});
