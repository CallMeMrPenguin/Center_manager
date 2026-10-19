import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Code2, Copy, Check, Table as TableIcon } from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import { showToast } from '../../../components/Toast';
import { tableSources } from '../sources/tableSources';
import { ComponentSourceItem } from '../types';

interface StudentRow {
  id: number;
  full_name: string;
  class_name: string;
  phone: string;
  average_score: number;
  status: 'active' | 'warning' | 'excellent';
}

const SAMPLE_STUDENTS: StudentRow[] = Array.from({ length: 25 }, (_, i) => {
  const names = [
    'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Hoàng Cường', 'Phạm Minh Đức', 'Vũ Hải Yến',
    'Đặng Thu Hà', 'Bùi Quốc Hưng', 'Đỗ Mai Linh', 'Ngô Quang Khải', 'Hồ Ngọc Lan',
    'Dương Tuấn Kiệt', 'Lý Gia Huy', 'Hoàng Bảo Ngọc', 'Phan Thanh Tùng', 'Trịnh Cẩm Tú'
  ];
  const classes = ['12A1 Toán', '12A2 Lý', '11B1 Hóa', '10C1 Anh', '12A3 Văn'];
  const name = names[i % names.length] + (i >= names.length ? ` (${i + 1})` : '');
  const score = Number((6.0 + (i * 0.35) % 4.0).toFixed(1));
  const status = score >= 8.5 ? 'excellent' : score < 6.5 ? 'warning' : 'active';

  return {
    id: i + 1,
    full_name: name,
    class_name: classes[i % classes.length],
    phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
    average_score: score,
    status,
  };
});

interface DataTableDemoViewProps {
  onViewCode: (item: ComponentSourceItem) => void;
}

export const DataTableDemoView: React.FC<DataTableDemoViewProps> = ({ onViewCode }) => {
  const sourceItem = tableSources[0]; // DataTable source item

  const columns = useMemo<ColumnDef<StudentRow>[]>(() => [
    {
      accessorKey: 'id',
      header: 'STT',
      cell: (info) => <span className="font-mono text-slate-400 font-bold">{info.getValue<number>()}</span>,
      size: 60,
    },
    {
      accessorKey: 'full_name',
      header: 'Họ và Tên',
      cell: (info) => (
        <span className="font-bold text-slate-900 dark:text-white">
          {info.getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'class_name',
      header: 'Lớp Học',
      cell: (info) => (
        <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[11px]">
          {info.getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Số Điện Thoại',
      cell: (info) => <span className="font-mono text-slate-600 dark:text-slate-300">{info.getValue<string>()}</span>,
    },
    {
      accessorKey: 'average_score',
      header: 'Điểm TB',
      cell: (info) => {
        const val = info.getValue<number>();
        const color =
          val >= 8.0
            ? 'text-emerald-600 dark:text-emerald-400'
            : val < 6.5
            ? 'text-rose-600 dark:text-rose-400'
            : 'text-blue-600 dark:text-blue-400';
        return <span className={`font-mono font-black ${color}`}>{val.toFixed(1)}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Trạng Thái',
      cell: (info) => {
        const s = info.getValue<string>();
        const badge =
          s === 'excellent'
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
            : s === 'warning'
            ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
            : 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400';
        const label = s === 'excellent' ? 'Xuất sắc' : s === 'warning' ? 'Cần chú ý' : 'Bình thường';
        return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge}`}>{label}</span>;
      },
    },
  ], []);

  const handleCopyUsage = () => {
    navigator.clipboard.writeText(sourceItem.usageCode);
    showToast('Đã sao chép ví dụ sử dụng DataTable!', 'success');
  };

  return (
    <div className="bg-white dark:bg-[#141417] border border-slate-200/90 dark:border-[#27272a] p-6 rounded-2xl shadow-sm space-y-5">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <TableIcon size={18} className="text-blue-600 dark:text-blue-400" />
            <span>TanStack DataTable v8 (Chuẩn Bảng Bắt Buộc Toàn Ứng Dụng)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tích hợp đầy đủ 15 tính năng: Tìm kiếm toàn cục, lọc cột, sắp xếp đa cột, ẩn/hiện cột, đổi thứ tự kéo thả, phân trang 20 dòng, xuất file Excel & PDF.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyUsage}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 transition cursor-pointer border-0 shadow-2xs"
          >
            <Copy size={13} />
            <span>Chép Cách Dùng</span>
          </button>
          <button
            type="button"
            onClick={() => onViewCode(sourceItem)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer border-0 shadow-2xs"
          >
            <Code2 size={13} />
            <span>Xem & Chép Mã Nguồn File</span>
          </button>
        </div>
      </div>

      {/* Full Width Real DataTable */}
      <div className="w-full">
        <DataTable<StudentRow>
          data={SAMPLE_STUDENTS}
          columns={columns}
          pageSize={20}
          showPagination={true}
          enableGlobalSearch={true}
          enableColumnVisibility={true}
          enableRowSelection={true}
          enableColumnResizing={true}
          enableExport={true}
          searchPlaceholder="Tìm kiếm nhanh tên học sinh, lớp, SĐT..."
          exportFilename="hoc_sinh_demo"
          onRowDoubleClick={(row) => showToast(`Double-click xem chi tiết học sinh: ${row.full_name}`, 'info')}
        />
      </div>
    </div>
  );
};
