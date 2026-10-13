import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { DataTable } from '../../../components/DataTable';

interface VocabCsvPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
  fileName: string;
  onConfirm: () => void;
  loading: boolean;
}

export const VocabCsvPreviewModal: React.FC<VocabCsvPreviewModalProps> = ({
  isOpen,
  onClose,
  items,
  fileName,
  onConfirm,
  loading,
}) => {
  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'grade',
      header: 'Lớp',
      cell: (info) => <span className="font-bold">Lớp {info.getValue<string>()}</span>,
    },
    {
      accessorKey: 'unit',
      header: 'Unit',
      cell: (info) => <span className="font-bold">Unit {info.getValue<string>()}</span>,
    },
    {
      accessorKey: 'vocabulary',
      header: 'Từ vựng',
      cell: (info) => <span className="font-semibold text-blue-600">{info.getValue<string>()}</span>,
    },
    {
      accessorKey: 'meaning',
      header: 'Dịch nghĩa',
      cell: (info) => <span className="truncate max-w-sm block text-slate-800">{info.getValue<string>()}</span>,
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => {
        const item = row.original;
        return item.is_duplicate ? (
          <span className="flex items-center gap-1.5 text-rose-600 text-[0.66rem] bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20" title={item.duplicate_reason}>
            <AlertTriangle size={12} />
            <span>Trùng lặp</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-emerald-600 text-[0.66rem] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <CheckCircle2 size={12} />
            <span>Hợp lệ</span>
          </span>
        );
      },
    },
  ], []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        <div className="h-14 border-b border-slate-200 bg-slate-50 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Xem trước tệp CSV ({items.length} từ vựng)
            </h3>
            {fileName && (
              <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-lg text-slate-700 font-mono">
                {fileName}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-slate-50/40 p-4">
          <DataTable
            data={items}
            columns={columns}
            pageSize={20}
            exportFilename="xem_truoc_tu_vung"
          />
        </div>

        <div className="h-16 border-t border-slate-200 bg-slate-50 flex items-center justify-between px-6 shrink-0">
          <p className="text-[0.66rem] text-slate-500 font-bold max-w-lg leading-normal">
            Nhấn "Bắt đầu nạp" sẽ nạp toàn bộ danh sách từ vựng hợp lệ vào Cơ sở dữ liệu.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4.5 py-2 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Đang nạp...' : 'Bắt đầu nạp'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
