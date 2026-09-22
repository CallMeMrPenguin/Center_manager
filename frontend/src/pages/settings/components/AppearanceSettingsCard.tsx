import React, { useState, useEffect } from 'react';
import { Sliders, Edit3, Calendar as CalendarIcon, Sparkles, Layers } from 'lucide-react';
import {
  getStoredButtonShadePct,
  setButtonShadePct,
  getStoredSegmentedHighlightPct,
  setSegmentedHighlightPct,
} from '../../../utils/buttonShade';
import { SegmentedControl } from '../../../components/SegmentedControl';

export const AppearanceSettingsCard: React.FC = () => {
  const [btnPct, setBtnPct] = useState<number>(() => getStoredButtonShadePct());
  const [segPct, setSegPct] = useState<number>(() => getStoredSegmentedHighlightPct());
  const [sampleSegment, setSampleSegment] = useState<'docx' | 'json'>('docx');

  useEffect(() => {
    setBtnPct(getStoredButtonShadePct());
    setSegPct(getStoredSegmentedHighlightPct());
  }, []);

  const handleBtnPctChange = (val: number) => {
    setBtnPct(val);
    setButtonShadePct(val);
  };

  const handleSegPctChange = (val: number) => {
    setSegPct(val);
    setSegmentedHighlightPct(val);
  };

  const getBtnShadeLabel = (pct: number) => {
    if (pct <= 15) return 'Siêu nhạt (Ultra Soft)';
    if (pct <= 35) return 'Nhạt - Chuẩn (Soft Slate)';
    if (pct <= 60) return 'Vừa phải (Balanced)';
    if (pct <= 80) return 'Đậm nét (Contrast)';
    return 'Rất đậm (Deep Slate)';
  };

  const getSegShadeLabel = (pct: number) => {
    if (pct <= 20) return 'Hiệu ứng siêu nhẹ (Subtle)';
    if (pct <= 45) return 'Hiệu ứng êm mắt (Smooth - Chuẩn)';
    if (pct <= 70) return 'Hiệu ứng rõ ràng (Distinct)';
    return 'Hiệu ứng đậm nét (Vivid)';
  };

  return (
    <div className="bg-white dark:bg-[#141417] rounded-2xl p-6 flex flex-col gap-6 shadow-sm dark:shadow-none border border-slate-200 dark:border-[#27272a]">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-3">
        <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Sliders size={14} className="text-blue-500 dark:text-blue-400" />
          Tùy Chỉnh Độ Đậm Nhạt Nút Bấm & Segmented Control
        </h3>
        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          Nút: {btnPct}% | Trượt: {segPct}%
        </span>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        Thanh trượt liên tục (0% - 100%) cho phép tùy biến chính xác độ đậm nhạt của nút bấm (phân trang, chọn ngày, nút sửa) và hiệu ứng trượt của thanh Segmented Button theo ý muốn.
      </p>

      {/* ── 1. Slider: Độ Đậm Nhạt Nút Bấm ─────────────────────────────────── */}
      <div className="space-y-2.5 p-4 rounded-xl bg-slate-50 dark:bg-[#0c0f1a] border border-slate-200/70 dark:border-white/5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Sliders size={13} className="text-blue-500" />
            Độ Đậm Nhạt Nút Bấm (Button Shade):
          </span>
          <span className="font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg text-xs">
            {btnPct}% — {getBtnShadeLabel(btnPct)}
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={btnPct}
          onChange={(e) => handleBtnPctChange(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
        />

        {/* Quick presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
          <span className="text-slate-500 font-bold mr-1">Mốc nhanh:</span>
          {[
            { label: 'Siêu nhạt', val: 10 },
            { label: 'Nhạt (Chuẩn)', val: 30 },
            { label: 'Vừa', val: 50 },
            { label: 'Đậm', val: 75 },
            { label: 'Rất đậm', val: 95 },
          ].map((item) => (
            <button
              key={item.val}
              type="button"
              onClick={() => handleBtnPctChange(item.val)}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer border-0 ${
                btnPct === item.val
                  ? 'bg-[#2563eb] text-white shadow-2xs'
                  : 'btn-neutral text-slate-700 dark:text-slate-300'
              }`}
            >
              {item.label} ({item.val}%)
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. Slider: Độ Đậm Hiệu Ứng Segmented Button ───────────────────────── */}
      <div className="space-y-2.5 p-4 rounded-xl bg-slate-50 dark:bg-[#0c0f1a] border border-slate-200/70 dark:border-white/5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Layers size={13} className="text-purple-500" />
            Độ Đậm Hiệu Ứng Segmented Button (Highlight Intensity):
          </span>
          <span className="font-mono font-black text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg text-xs">
            {segPct}% — {getSegShadeLabel(segPct)}
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={segPct}
          onChange={(e) => handleSegPctChange(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#7c3aed]"
        />

        {/* Quick presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
          <span className="text-slate-500 font-bold mr-1">Mốc nhanh:</span>
          {[
            { label: 'Trong mờ', val: 15 },
            { label: 'Dịu mắt (Chuẩn)', val: 35 },
            { label: 'Rõ nét', val: 60 },
            { label: 'Đậm đà', val: 85 },
            { label: 'Tối đa', val: 100 },
          ].map((item) => (
            <button
              key={item.val}
              type="button"
              onClick={() => handleSegPctChange(item.val)}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer border-0 ${
                segPct === item.val
                  ? 'bg-[#7c3aed] text-white shadow-2xs'
                  : 'btn-neutral text-slate-700 dark:text-slate-300'
              }`}
            >
              {item.label} ({item.val}%)
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. Live Preview Box ──────────────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-[#090b14] border border-slate-200/80 dark:border-white/5 space-y-3">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <span>Xem Trước Trực Tiếp (Live Interactive Preview)</span>
          <span className="text-blue-500 font-semibold flex items-center gap-1">
            <Sparkles size={11} /> Cập nhật tức thì
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sample Action Button */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-neutral text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <Edit3 size={13} className="text-blue-600 dark:text-blue-400" />
            <span>Nút Thao Tác</span>
          </button>

          {/* Sample DatePicker Trigger Button */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl btn-neutral text-xs font-bold transition shadow-xs">
            <CalendarIcon size={13} className="text-blue-600 dark:text-blue-400" />
            <span>23/09/2026</span>
          </div>

          {/* Sample Segmented Button (Hover to see real-time dynamic highlight) */}
          <SegmentedControl<'docx' | 'json'>
            value={sampleSegment}
            onChange={setSampleSegment}
            options={[
              { value: 'docx', label: 'Tải File Word (.DOCX)' },
              { value: 'json', label: 'Dán Cấu Trúc JSON' },
            ]}
            size="sm"
          />
        </div>
        <p className="text-[11px] text-slate-500 italic">
          * Di chuột qua các nút và thanh Segmented bên trên để kiểm tra trực tiếp hiệu ứng trượt.
        </p>
      </div>
    </div>
  );
};
