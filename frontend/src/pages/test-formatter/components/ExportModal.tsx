import React from 'react';
import { Download, X } from 'lucide-react';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { CustomSelect } from '../../../components/CustomSelect';

interface ExportConfig {
  platform: 'kahoot' | 'quizizz' | 'excel_full';
  defaultTime: number;
  defaultPoints: number;
  testTitle: string;
}

interface ExportModalProps {
  showExportModal: boolean;
  setShowExportModal: (show: boolean) => void;
  exportConfig: ExportConfig;
  setExportConfig: React.Dispatch<React.SetStateAction<ExportConfig>>;
  isExporting: boolean;
  handleExportPlatform: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  showExportModal,
  setShowExportModal,
  exportConfig,
  setExportConfig,
  isExporting,
  handleExportPlatform,
}) => {
  if (!showExportModal) return null;

  const timeOptions = [5, 10, 20, 30, 45, 60, 120, 180, 300, 600, 900, 1800].map(
    (sec) => ({
      value: sec,
      label: sec >= 60 ? `${sec / 60} phút` : `${sec} giây`,
    })
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-scale-up">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2 text-indigo-600 font-bold">
            <Download size={18} />
            <h3 className="text-sm uppercase tracking-wider font-black">
              Xuất dữ liệu câu hỏi
            </h3>
          </div>
          <button
            onClick={() => setShowExportModal(false)}
            aria-label="Đóng xuất dữ liệu"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-600 uppercase">
              Tên bài kiểm tra / Bộ câu hỏi:
            </label>
            <input
              type="text"
              value={exportConfig.testTitle}
              onChange={(e) =>
                setExportConfig((prev) => ({
                  ...prev,
                  testTitle: e.target.value,
                }))
              }
              className="bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-bold"
              placeholder="VD: Kiểm tra 15 phút Unit 1"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-600 uppercase">
              Nền tảng xuất:
            </label>
            <SegmentedControl
              options={[
                { value: 'kahoot', label: 'Kahoot (Excel)' },
                { value: 'quizizz', label: 'Quizizz (Excel)' },
                { value: 'excel_full', label: 'Excel Đầy Đủ' },
              ]}
              value={exportConfig.platform}
              onChange={(val) =>
                setExportConfig((prev) => ({
                  ...prev,
                  platform: val as any,
                }))
              }
              fit="fluid"
              size="sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-600 uppercase">
              Thời gian trả lời mặc định (Kahoot/Quizizz):
            </label>
            <CustomSelect
              value={exportConfig.defaultTime}
              onChange={(val) =>
                setExportConfig((prev) => ({
                  ...prev,
                  defaultTime: parseInt(String(val)) || 30,
                }))
              }
              options={timeOptions}
              className="w-full text-xs"
            />
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[10px] text-indigo-700 font-semibold flex gap-2">
            <span>
              File Excel mẫu tương thích chuẩn định dạng import của Kahoot,
              Quizizz và ngân hàng đề thi.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6 pt-3 border-t border-slate-100">
          <button
            onClick={() => setShowExportModal(false)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            Hủy
          </button>
          <button
            disabled={isExporting}
            onClick={handleExportPlatform}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              'Đang xuất...'
            ) : (
              <>
                <Download size={13} /> Tải file Excel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
