import React from 'react';
import { Settings, X, Trash2 } from 'lucide-react';
import { LayoutSettings } from '../../../types';
import { CustomSelect } from '../../../components/CustomSelect';

interface ConfigDrawerProps {
  showConfig: boolean;
  setShowConfig: (show: boolean) => void;
  activeProfile: string;
  handleProfileChange: (name: string) => void;
  handleDeleteProfile: () => void;
  profiles: Record<string, LayoutSettings>;
  layout: LayoutSettings;
  setLayout: React.Dispatch<React.SetStateAction<LayoutSettings>>;
  mixOptions: boolean;
  setMixOptions: (val: boolean) => void;
}

export const ConfigDrawer: React.FC<ConfigDrawerProps> = ({
  showConfig,
  setShowConfig,
  activeProfile,
  handleProfileChange,
  handleDeleteProfile,
  profiles,
  layout,
  setLayout,
  mixOptions,
  setMixOptions,
}) => {
  if (!showConfig) return null;

  const renderSettingInput = (
    label: string,
    key: keyof LayoutSettings,
    min: number,
    max: number,
    step: number = 0.5
  ) => (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between items-center text-[0.6rem] text-slate-500 dark:text-slate-400 font-bold">
        <span>{label}</span>
        <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
          {layout[key]}
        </span>
      </div>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={layout[key] || 0}
        onChange={(e) =>
          setLayout((prev) => ({
            ...prev,
            [key]: parseFloat(e.target.value) || 0,
          }))
        }
        className="bg-white dark:bg-[#121629] border border-slate-200 dark:border-[#283354] px-2 py-1 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
      />
    </div>
  );

  const profileOptions = [
    { value: 'Mặc định', label: 'Mặc định' },
    ...Object.keys(profiles).map((name) => ({ value: name, label: name })),
  ];

  const fontOptions = [
    'Times New Roman',
    'Arial',
    'Calibri',
    'Segoe UI',
    'Georgia',
  ].map((font) => ({ value: font, label: font }));

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-[#0f1325] border-l border-slate-200 dark:border-[#212c4b] shadow-2xl z-50 p-4 flex flex-col gap-3 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#212c4b] pb-2">
        <h2 className="text-[0.73rem] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
          <Settings size={12} /> CẤU HÌNH LỀ & CHỮ
        </h2>
        <button
          onClick={() => setShowConfig(false)}
          aria-label="Đóng cấu hình"
          className="p-1 rounded-xl bg-slate-100 dark:bg-[#1a2038] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#252e4e] cursor-pointer"
        >
          <X size={12} />
        </button>
      </div>

      {/* Active Profile Select */}
      <div className="flex flex-col gap-1 mb-2">
        <label className="text-[0.6rem] font-bold text-slate-500 dark:text-slate-400 uppercase">
          Hồ sơ thiết lập
        </label>
        <CustomSelect
          value={activeProfile}
          onChange={(val) => handleProfileChange(String(val))}
          options={profileOptions}
          className="w-full text-xs"
        />
        {activeProfile !== 'Mặc định' && (
          <button
            onClick={handleDeleteProfile}
            className="mt-1 flex items-center gap-1 text-[0.66rem] text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 font-bold justify-end cursor-pointer"
          >
            <Trash2 size={10} /> Xóa hồ sơ này
          </button>
        )}
      </div>

      {/* Margins */}
      <h3 className="text-[0.66rem] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 mt-1">
        Căn lề trang (cm)
      </h3>
      <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-[#181f36] p-2.5 rounded-xl border-0 shadow-2xs">
        {renderSettingInput('Lề trên', 'margin_top', 0.5, 5, 0.1)}
        {renderSettingInput('Lề dưới', 'margin_bottom', 0.5, 5, 0.1)}
        {renderSettingInput('Lề trái', 'margin_left', 0.5, 5, 0.1)}
        {renderSettingInput('Lề phải', 'margin_right', 0.5, 5, 0.1)}
      </div>

      {/* Typography */}
      <h3 className="text-[0.66rem] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-2 mb-1">
        Typography & Font
      </h3>
      <div className="flex flex-col gap-2 bg-slate-50 dark:bg-[#181f36] p-2.5 rounded-xl border-0 shadow-2xs">
        <div className="flex flex-col gap-1">
          <label className="text-[0.6rem] text-slate-500 dark:text-slate-400 font-bold">
            Phông chữ
          </label>
          <CustomSelect
            value={layout.font_name}
            onChange={(val) =>
              setLayout((prev) => ({ ...prev, font_name: String(val) }))
            }
            options={fontOptions}
            className="w-full text-xs"
          />
        </div>
        {renderSettingInput('Cỡ chữ (pt)', 'font_size', 8, 20, 0.5)}
        {renderSettingInput('Giãn dòng', 'line_spacing', 1.0, 3.0, 0.05)}
        {renderSettingInput('Khoảng cách đoạn (pt)', 'space_after', 0, 24, 1)}
      </div>

      {/* Mix Options Option */}
      <h3 className="text-[0.66rem] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-2 mb-1">
        Cấu hình Đề thi
      </h3>
      <div className="flex flex-col gap-2.5 bg-slate-50 dark:bg-[#181f36] p-2.5 rounded-xl border-0 shadow-2xs mt-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={mixOptions}
            onChange={(e) => setMixOptions(e.target.checked)}
            className="w-3.5 h-3.5 text-indigo-600 rounded cursor-pointer"
          />
          <span className="text-[0.68rem] text-slate-700 dark:text-slate-300 font-bold">
            Trộn thứ tự đáp án (A, B, C, D) khi tạo mã đề
          </span>
        </label>
      </div>
    </div>
  );
};
