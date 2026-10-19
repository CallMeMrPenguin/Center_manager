import React, { useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../components/DataTable';
import { AnimatedTable } from '../../../components/ui/animated-table';
import { ComponentCard } from '../components/ComponentCard';
import { tableSources } from '../sources/tableSources';
import { ComponentSourceItem } from '../types';
import { showToast } from '../../../components/Toast';

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

interface TablesTabProps {
  onViewCode: (item: ComponentSourceItem) => void;
}

export const TablesTab: React.FC<TablesTabProps> = ({ onViewCode }) => {
  const [animSearch, setAnimSearch] = useState('');
  const [animSelectedIds, setAnimSelectedIds] = useState<(string | number)[]>([]);

  const getSource = (id: string) => tableSources.find((s) => s.id === id)!;

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
        const color = val >= 8.0 ? 'text-emerald-600 dark:text-emerald-400' : val < 6.5 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400';
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

  return (
    <div className="space-y-6">
      {/* 1. TANSTACK DATATABLE */}
      <ComponentCard item={getSource('table-datatable')} onViewCode={onViewCode}>
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
            searchPlaceholder="Tìm kiếm theo tên học sinh, lớp, SĐT..."
            exportFilename="hoc_sinh_demo"
            onRowDoubleClick={(row) => showToast(`Double-click xem chi tiết: ${row.full_name}`, 'info')}
          />
        </div>
      </ComponentCard>

      {/* 2. ANIMATED TABLE */}
      <ComponentCard item={getSource('table-animated')} onViewCode={onViewCode}>
        <div className="w-full">
          <AnimatedTable
            data={SAMPLE_STUDENTS.slice(0, 5)}
            columns={[
              { id: 'full_name', header: 'Họ và Tên', accessorKey: 'full_name' },
              { id: 'class_name', header: 'Lớp Học', accessorKey: 'class_name' },
              { id: 'phone', header: 'Số Điện Thoại', accessorKey: 'phone' },
              { id: 'average_score', header: 'Điểm TB', accessorKey: 'average_score' },
            ]}
            selectable
            selectedIds={animSelectedIds}
            onSelectionChange={setAnimSelectedIds}
            searchable
            searchValue={animSearch}
            onSearchChange={setAnimSearch}
            expandable
            renderExpandedRow={(row: any) => (
              <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-xs space-y-1">
                <div>Chi tiết học sinh: <span className="font-bold">{row.full_name}</span></div>
                <div>Lớp hiện tại: {row.class_name} | SĐT liên hệ: {row.phone}</div>
              </div>
            )}
          />
        </div>
      </ComponentCard>
    </div>
  );
};
