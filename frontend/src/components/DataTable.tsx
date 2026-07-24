import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, RefreshCw, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  loading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string | React.ReactNode;
  pageSize?: number;
  stickyHeader?: boolean;
  tableClassName?: string;
  theadClassName?: string;
  tbodyClassName?: string;
  trClassName?: string;
  showPagination?: boolean;
  initialSorting?: SortingState;
  onRowClick?: (row: TData) => void;
  columnVisibility?: VisibilityState;
}

export function DataTable<TData>({
  data,
  columns,
  loading = false,
  loadingMessage = 'Đang tải dữ liệu...',
  emptyMessage = 'Không tìm thấy dữ liệu phù hợp.',
  pageSize = 20,
  stickyHeader = true,
  tableClassName = 'w-full text-left border-collapse text-xs',
  theadClassName = 'bg-[#161b2e] text-slate-300 uppercase text-[10px] font-black tracking-wider border-b border-[#28334e] shadow-sm',
  tbodyClassName = 'divide-y divide-[#28334e] font-medium bg-[#101422]',
  trClassName = 'hover:bg-[#1a2034] transition-colors',
  showPagination = true,
  initialSorting = [],
  onRowClick,
  columnVisibility,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      ...(columnVisibility ? { columnVisibility } : {}),
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
  });

  const canPrevious = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 py-16">
          <RefreshCw className="h-7 w-7 text-indigo-400 animate-spin" />
          <span className="text-xs font-bold">{loadingMessage}</span>
        </div>
      ) : data.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 py-16 text-center">
          <AlertCircle className="h-10 w-10 text-indigo-400/60" />
          {typeof emptyMessage === 'string' ? (
            <p className="text-sm font-black text-white">{emptyMessage}</p>
          ) : (
            emptyMessage
          )}
        </div>
      ) : (
        <>
          <div className="overflow-auto flex-1">
            <table className={tableClassName}>
              <thead className={`${theadClassName} ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="py-3.5 px-4 select-none"
                      >
                        <div
                          className={`flex items-center gap-1.5 ${
                            header.column.getCanSort() ? 'cursor-pointer' : ''
                          }`}
                          onClick={
                            header.column.getCanSort()
                              ? header.column.getToggleSortingHandler()
                              : undefined
                          }
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="text-slate-500">
                              {header.column.getIsSorted() === 'asc' ? (
                                <ArrowUp size={11} className="text-indigo-400" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ArrowDown size={11} className="text-indigo-400" />
                              ) : (
                                <ArrowUpDown size={11} className="opacity-40 hover:opacity-100 transition" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className={tbodyClassName}>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`${trClassName} ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-3.5 px-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showPagination && pageCount > 1 && (
            <div className="p-3 bg-[#0d111a] border-t border-[#28334e] flex items-center justify-between text-xs text-slate-400 font-bold shrink-0">
              <div>
                Trang <span className="text-white">{pageIndex + 1}</span> / {pageCount} ({data.length} bản ghi)
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => table.previousPage()}
                  disabled={!canPrevious}
                  className="px-3 py-1.5 rounded-lg bg-[#182035] hover:bg-[#253050] text-slate-300 disabled:opacity-40 disabled:hover:bg-[#182035] border border-white/10 transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                  <span>Trước</span>
                </button>
                <button
                  type="button"
                  onClick={() => table.nextPage()}
                  disabled={!canNext}
                  className="px-3 py-1.5 rounded-lg bg-[#182035] hover:bg-[#253050] text-slate-300 disabled:opacity-40 disabled:hover:bg-[#182035] border border-white/10 transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>Sau</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
