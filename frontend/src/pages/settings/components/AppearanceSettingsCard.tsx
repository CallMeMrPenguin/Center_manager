import React, { useState, useEffect } from 'react';
import { Sliders, Check, Edit3, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import {
  SHADE_LEVELS,
  getStoredButtonShade,
  setStoredButtonShade,
  ShadeConfig,
} from '../../../utils/buttonShade';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { showToast } from '../../../components/Toast';

export const AppearanceSettingsCard: React.FC = () => {
  const [shadeLevel, setShadeLevel] = useState<number>(() => getStoredButtonShade());
  const [sampleSegment, setSampleSegment] = useState<'tab1' | 'tab2'>('tab1');

  useEffect(() => {
    setShadeLevel(getStoredButtonShade());
  }, []);

  const handleLevelChange = (lvl: number) => {
    setShadeLevel(lvl);
    setStoredButtonShade(lvl);
    showToast(`Đã áp dụng độ đậm nhạt: ${SHADE_LEVELS[lvl]?.label || lvl}`, 'success');
  };

  const currentConfig: ShadeConfig = SHADE_LEVELS[shadeLevel] || SHADE_LEVELS[2];

  return (
    <div className="bg-white dark:bg-[#141417] rounded-2xl p-6 flex flex-col gap-5 shadow-sm dark:shadow-none border border-slate-200 dark:border-[#27272a]">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-3">
        <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Sliders size={14} className="text-blue-500 dark:text-blue-400" />
          Độ Đậm Nhạt Nút Bấm Hệ Thống
        </h3>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          Mức {shadeLevel}: {currentConfig.label}
        </span>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        Thanh trượt điều chỉnh tông màu và độ tương phản của tất cả các nút chức năng (nút phân trang, chọn ngày, nút sửa, thanh chọn segmented) trên toàn bộ giao diện phần mềm.
      </p>

      {/* Slider */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>Rất nhạt (1)</span>
          <span className="text-blue-600 dark:text-blue-400 font-black">{currentConfig.desc}</span>
          <span>Rất đậm (5)</span>
        </div>

        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={shadeLevel}
          onChange={(e) => handleLevelChange(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
        />

        {/* Quick Select Buttons */}
        <div className="grid grid-cols-5 gap-1.5 pt-1">
          {([1, 2, 3, 4, 5] as const).map((lvl) => {
            const isSelected = shadeLevel === lvl;
            const cfg = SHADE_LEVELS[lvl];
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => handleLevelChange(lvl)}
                className={`py-1.5 px-1 rounded-xl text-center text-[11px] font-extrabold transition cursor-pointer border-0 ${
                  isSelected
                    ? 'bg-[#2563eb] text-white shadow-xs'
                    : 'btn-neutral text-slate-700 dark:text-slate-300'
                }`}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Preview Box */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0d101a] border border-slate-200/80 dark:border-white/5 space-y-3">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <span>Xem Trước Trực Tiếp (Live Preview)</span>
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

          {/* Sample Segmented Button */}
          <SegmentedControl<'tab1' | 'tab2'>
            value={sampleSegment}
            onChange={setSampleSegment}
            options={[
              { value: 'tab1', label: 'Tùy Chọn A' },
              { value: 'tab2', label: 'Tùy Chọn B' },
            ]}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
};
