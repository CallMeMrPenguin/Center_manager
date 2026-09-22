import React from 'react';
import { X, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  csvFile: File | null;
  setCsvFile: (file: File | null) => void;
  csvPreview: any[];
  setCsvPreview: (preview: any[]) => void;
  csvImporting: boolean;
  onConfirmImport: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  csvFile,
  setCsvFile,
  csvPreview,
  setCsvPreview,
  csvImporting,
  onConfirmImport,
}) => {
  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length > 0) {
        const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
        const rows = lines.slice(1).map((line) => {
          const vals = line.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
          const rowObj: Record<string, string> = {};
          headers.forEach((h, idx) => {
            rowObj[h] = vals[idx] || '';
          });
          return rowObj;
        });
        setCsvPreview(rows);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 select-none animate-fade-in font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet size={18} className="text-emerald-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Nhập Danh Sách Học Sinh từ File CSV
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 text-center hover:border-blue-500 transition">
            <input
              type="file"
              accept=".csv"
              id="csv-student-upload"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="csv-student-upload" className="cursor-pointer flex flex-col items-center gap-2">
              <Upload size={28} className="text-blue-600" />
              <span className="text-xs font-bold text-slate-800">
                {csvFile ? csvFile.name : 'Chọn hoặc kéo thả tệp tin .csv vào đây'}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">
                Định dạng: Họ và tên, Biệt danh, Khối, Giới tính, Ngày sinh, SĐT bố, SĐT mẹ, Trường
              </span>
            </label>
          </div>

          {csvPreview.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-black text-slate-900">
                Bản xem trước ({csvPreview.length} học sinh):
              </div>
              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-600 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2">STT</th>
                      <th className="p-2">Họ và tên</th>
                      <th className="p-2">Khối</th>
                      <th className="p-2">Giới tính</th>
                      <th className="p-2">Ngày sinh</th>
                      <th className="p-2">SĐT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {csvPreview.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-900">{row['Họ và tên'] || row['full_name'] || row['Name'] || '-'}</td>
                        <td className="p-2">{row['Khối'] || row['grade'] || '-'}</td>
                        <td className="p-2">{row['Giới tính'] || row['gender'] || '-'}</td>
                        <td className="p-2">{row['Ngày sinh'] || row['date_of_birth'] || '-'}</td>
                        <td className="p-2">{row['SĐT'] || row['father_phone'] || row['phone'] || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={csvPreview.length === 0 || csvImporting}
            onClick={onConfirmImport}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <CheckCircle2 size={14} />
            <span>{csvImporting ? 'Đang Nhập...' : `Nhập ${csvPreview.length} Học Sinh`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
