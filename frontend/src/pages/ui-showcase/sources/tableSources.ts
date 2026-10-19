import { ComponentSourceItem } from '../types';

export const tableSources: ComponentSourceItem[] = [
  {
    id: 'table-datatable',
    title: 'DataTable (TanStack Table v8 Wrapper — 15 Tính Năng Tích Hợp)',
    description: 'Chuẩn bảng dữ liệu bắt buộc toàn app (AGENTS.md Rule 4). Tích hợp tìm kiếm toàn cục, multi-sort, ẩn/hiện cột, đổi thứ tự kéo thả, phân trang 20 dòng, xuất file Excel & PDF.',
    category: 'tables',
    dependencies: [
      '@tanstack/react-table',
      '@tanstack/react-virtual',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
      'xlsx',
      'jspdf',
      'jspdf-autotable',
      'lucide-react'
    ],
    filename: 'DataTable.tsx',
    usageCode: `import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

interface Student {
  id: number;
  full_name: string;
  class_name: string;
  phone: string;
  average_score: number;
}

export function ExampleTable() {
  const data: Student[] = [
    { id: 1, full_name: 'Nguyễn Văn An', class_name: '12A1 Toán', phone: '0912345678', average_score: 8.5 },
    { id: 2, full_name: 'Trần Thị Bình', class_name: '12A2 Lý', phone: '0987654321', average_score: 7.8 },
  ];

  const columns = useMemo<ColumnDef<Student>[]>(() => [
    {
      accessorKey: 'full_name',
      header: 'Họ và Tên',
      cell: (info) => <span className="font-bold text-slate-900 dark:text-white">{info.getValue<string>()}</span>,
    },
    {
      accessorKey: 'class_name',
      header: 'Lớp Học',
      cell: (info) => <span className="text-slate-600 dark:text-slate-300">{info.getValue<string>()}</span>,
    },
    {
      accessorKey: 'average_score',
      header: 'Điểm TB',
      cell: (info) => (
        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
          {info.getValue<number>().toFixed(1)}
        </span>
      ),
    },
  ], []);

  return (
    <DataTable<Student>
      data={data}
      columns={columns}
      pageSize={20}
      searchPlaceholder="Tìm kiếm học sinh..."
      exportFilename="danh_sach_hoc_sinh"
      onRowDoubleClick={(row) => console.log('Xem chi tiết:', row)}
    />
  );
}`,
    sourceCode: `import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel,
  getFilteredRowModel, getGroupedRowModel, getExpandedRowModel, ColumnDef,
  SortingState, ColumnFiltersState, RowSelectionState, Table
} from '@tanstack/react-table';
import { DataTableHeader } from './DataTableHeader';
import { DataTableToolbar } from './DataTableToolbar';
import { DataTablePagination } from './DataTablePagination';
import { DataTableBody } from './DataTableBody';

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  loading?: boolean;
  pageSize?: number;
  showPagination?: boolean;
  enableGlobalSearch?: boolean;
  enableColumnVisibility?: boolean;
  enableRowSelection?: boolean;
  enableColumnResizing?: boolean;
  enableColumnReorder?: boolean;
  enableExport?: boolean;
  searchPlaceholder?: string;
  exportFilename?: string;
  onRowDoubleClick?: (row: TData) => void;
  onSelectionChange?: (selectedRows: TData[]) => void;
}

export function DataTable<TData>({
  data,
  columns,
  loading = false,
  pageSize = 20,
  showPagination = true,
  enableGlobalSearch = true,
  enableColumnVisibility = true,
  enableRowSelection = false,
  enableColumnResizing = true,
  enableExport = true,
  searchPlaceholder = 'Tìm kiếm...',
  exportFilename = 'export_data',
  onRowDoubleClick,
  onSelectionChange,
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting, rowSelection },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize } },
  });

  return (
    <div className="w-full flex flex-col space-y-3">
      <DataTableToolbar
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        searchPlaceholder={searchPlaceholder}
        enableExport={enableExport}
        exportFilename={exportFilename}
      />

      <div className="overflow-x-auto rounded-xl bg-white dark:bg-[#121626] shadow-xs">
        <table className="w-full text-left border-collapse">
          <DataTableHeader table={table} />
          <DataTableBody table={table} onRowDoubleClick={onRowDoubleClick} />
        </table>
      </div>

      {showPagination && <DataTablePagination table={table} />}
    </div>
  );
}`,
    typesCode: `export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  loading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string | React.ReactNode;
  pageSize?: number;
  showPagination?: boolean;
  enableGlobalSearch?: boolean;
  enableColumnVisibility?: boolean;
  enableRowSelection?: boolean;
  enableColumnResizing?: boolean;
  enableColumnReorder?: boolean;
  enableExport?: boolean;
  searchPlaceholder?: string;
  exportFilename?: string;
  onRowDoubleClick?: (row: TData) => void;
  onSelectionChange?: (selectedRows: TData[]) => void;
}`
  },
  {
    id: 'table-animated',
    title: 'AnimatedTable (Bảng Hiệu Ứng Mượt & Expand)',
    description: 'Bảng dữ liệu tương tác chuyển động với expandable row, sắp xếp tiêu đề mượt mà và tìm kiếm tức thì.',
    category: 'tables',
    dependencies: ['lucide-react', 'framer-motion'],
    filename: 'animated-table.tsx',
    usageCode: `import { AnimatedTable } from '@/components/ui/animated-table';
import { useState } from 'react';

export function Example() {
  const [search, setSearch] = useState('');
  const data = [
    { id: 1, name: 'Alice', role: 'Giáo viên', email: 'alice@example.com' },
    { id: 2, name: 'Bob', role: 'Trợ giảng', email: 'bob@example.com' },
  ];

  return (
    <AnimatedTable
      data={data}
      columns={[
        { key: 'name', label: 'Tên' },
        { key: 'role', label: 'Vai trò' },
        { key: 'email', label: 'Email' },
      ]}
      searchable
      searchValue={search}
      onSearchChange={setSearch}
      expandable
      renderExpandedRow={(row) => <div className="p-2 text-xs">Chi tiết: {row.name} ({row.email})</div>}
    />
  );
}`,
    sourceCode: `import React from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

export function AnimatedTable<T extends { id: string | number }>({
  data,
  columns,
  renderExpandedRow,
  searchValue,
  onSearchChange,
}: any) {
  const [expandedId, setExpandedId] = React.useState<any>(null);

  return (
    <div className="w-full space-y-2">
      {onSearchChange && (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchValue || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm nhanh..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-white/5 border-0 text-slate-800 dark:text-white"
          />
        </div>
      )}
      <div className="overflow-x-auto rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold">
            <tr>
              {renderExpandedRow && <th className="p-2 w-8" />}
              {columns.map((c: any) => (
                <th key={c.key} className="p-2.5">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {data.map((row: any) => (
              <React.Fragment key={row.id}>
                <tr className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  {renderExpandedRow && (
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                        className="cursor-pointer border-0 bg-transparent text-slate-400"
                      >
                        {expandedId === row.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </td>
                  )}
                  {columns.map((c: any) => (
                    <td key={c.key} className="p-2.5">
                      {c.render ? c.render(row) : (row as any)[c.key]}
                    </td>
                  ))}
                </tr>
                {expandedId === row.id && renderExpandedRow && (
                  <tr>
                    <td colSpan={columns.length + 1} className="p-3 bg-slate-50 dark:bg-white/[0.02]">
                      {renderExpandedRow(row)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}`
  }
];
