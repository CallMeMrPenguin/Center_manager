import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Code2, Copy, Table as TableIcon, ChevronDown, ChevronRight, Send, User } from 'lucide-react';
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
      id: '_expander',
      header: () => <span className="text-slate-400 font-bold text-[11px]">Mở</span>,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            row.toggleExpanded();
          }}
          className="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-white/10 transition cursor-pointer border-0"
          title={row.getIsExpanded() ? 'Thu gọn dòng' : 'Mở rộng chi tiết học sinh'}
        >
          {row.getIsExpanded() ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
      ),
      size: 45,
    },
    {
      accessorKey: 'id',
      header: 'STT',
      cell: (info) => <span className="font-mono text-slate-400 font-bold">{info.getValue<number>()}</span>,
      size: 55,
    },
    {
      accessorKey: 'full_name',
      header: 'Họ và Tên (Click để mở rộng)',
      cell: (info) => (
        <span className="font-bold text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 transition-colors">
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
    showToast('Đã sao chép ví dụ sử dụng DataTable (kèm Row Expansion)!', 'success');
  };

  const renderStudentExpandedDetail = ({ row }: { row: any }) => {
    const student = row.original as StudentRow;
    return (
      <div className="p-4 sm:p-5 bg-slate-50/90 dark:bg-[#0c0f1d] border-y border-slate-200/80 dark:border-white/10 space-y-4 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900 dark:text-white text-sm">
              Chi Tiết Học Lực & Chuyên Cần: {student.full_name}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 font-bold text-[11px]">
              {student.class_name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => showToast(`Gửi phiếu điểm của ${student.full_name} qua Zalo!`, 'success')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px] border-0 cursor-pointer shadow-2xs hover:bg-blue-700"
            >
              <Send size={11} />
              <span>Gửi Báo Cáo Phụ Huynh</span>
            </button>
            <button
              type="button"
              onClick={() => showToast(`Xem đầy đủ hồ sơ của ${student.full_name}`, 'info')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200 font-bold text-[11px] border-0 cursor-pointer"
            >
              <User size={11} />
              <span>Xem Hồ Sơ Đầy Đủ</span>
            </button>
          </div>
        </div>

        {/* 3 Detail Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Điểm các bài kiểm tra */}
          <div className="p-3 bg-white dark:bg-[#151824] rounded-xl shadow-2xs space-y-2">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
              Kết Quả Các Bài Test
            </span>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div className="p-1.5 bg-slate-50 dark:bg-white/5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Check 1</span>
                <span className="font-mono font-bold text-slate-800 dark:text-white">8.5</span>
              </div>
              <div className="p-1.5 bg-slate-50 dark:bg-white/5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Check 2</span>
                <span className="font-mono font-bold text-slate-800 dark:text-white">9.0</span>
              </div>
              <div className="p-1.5 bg-slate-50 dark:bg-white/5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">BTVN</span>
                <span className="font-mono font-bold text-slate-800 dark:text-white">8.0</span>
              </div>
            </div>
            <div className="flex justify-between text-[11px] pt-1">
              <span className="text-slate-500">Điểm Trung Bình:</span>
              <span className="font-mono font-black text-blue-600 dark:text-blue-400">{student.average_score}</span>
            </div>
          </div>

          {/* Card 2: Chuyên cần */}
          <div className="p-3 bg-white dark:bg-[#151824] rounded-xl shadow-2xs space-y-2">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
              Tỷ Lệ Chuyên Cần
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">92%</span>
              <span className="text-[11px] text-slate-400">18/20 Buổi Học</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92%' }} />
            </div>
            <span className="text-[10px] text-slate-400 block">Vắng 2 buổi (Đã xin phép và nộp bù bài tập)</span>
          </div>

          {/* Card 3: Nhận xét giáo viên */}
          <div className="p-3 bg-white dark:bg-[#151824] rounded-xl shadow-2xs space-y-1.5">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
              Nhận Xét Giáo Viên
            </span>
            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
              Học sinh tiếp thu bài nhanh, làm bài tập đầy đủ. Cần rèn luyện thêm kỹ năng xử lý các bài toán vận dụng cao phần Hình học không gian.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-[#141417] border border-slate-200/90 dark:border-[#27272a] p-6 rounded-2xl shadow-sm space-y-5">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <TableIcon size={18} className="text-blue-600 dark:text-blue-400" />
            <span>TanStack DataTable v8 (Bảng Dữ Liệu Đầy Đủ Kèm Row Expansion)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tích hợp đầy đủ tính năng: Tìm kiếm toàn cục, lọc cột, sắp xếp đa cột, ẩn/hiện cột, đổi thứ tự kéo thả, phân trang 20 dòng, xuất file Excel/PDF và <b>mở rộng dòng (Row Expansion Section)</b>.
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
            <span>Mã Nguồn File (DataTable.tsx)</span>
          </button>
        </div>
      </div>

      {/* Full Width Real DataTable with Row Expansion */}
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
          enableRowExpansion={true}
          renderSubComponent={renderStudentExpandedDetail}
          enableExport={true}
          searchPlaceholder="Tìm kiếm nhanh tên học sinh, lớp, SĐT..."
          exportFilename="hoc_sinh_demo"
          onRowDoubleClick={(row) => showToast(`Double-click xem chi tiết: ${row.full_name}`, 'info')}
        />
      </div>
    </div>
  );
};
