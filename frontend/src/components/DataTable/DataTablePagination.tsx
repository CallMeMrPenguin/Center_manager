import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Table } from '@tanstack/react-table';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  totalFiltered: number;
  borderless?: boolean;
}

export function DataTablePagination<TData>({
  table,
  totalFiltered,
  borderless = false,
}: DataTablePaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  if (pageCount <= 0) return null;

  return (
    <div
      className={`shrink-0 px-4 py-2.5 ${
        borderless
          ? 'bg-transparent border-t-0'
          : 'bg-slate-50/80 dark:bg-[#111728] border-t border-slate-200 dark:border-white/10'
      } flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-400 font-bold`}
    >
      {/* Left info */}
      <div className="flex items-center gap-3 flex-wrap">
        <span>
          Trang <span className="text-slate-900 dark:text-white font-extrabold">{pageIndex + 1}</span> / {pageCount}
          <span className="text-slate-600 dark:text-slate-400 ml-2 font-medium">
            ({totalFiltered.toLocaleString()} bản ghi)
          </span>
        </span>
      </div>

      {/* Right nav */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 disabled:opacity-30 border-0 shadow-2xs transition cursor-pointer disabled:cursor-not-allowed"
          title="Trang đầu"
        >
          <ChevronsLeft size={13} />
        </button>

        <button
          type="button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 disabled:opacity-30 border-0 shadow-2xs transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronLeft size={13} />
          <span>Trước</span>
        </button>

        {/* Page pills */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
            let pageNum: number;
            if (pageCount <= 5) pageNum = i;
            else if (pageIndex < 3) pageNum = i;
            else if (pageIndex > pageCount - 4) pageNum = pageCount - 5 + i;
            else pageNum = pageIndex - 2 + i;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => table.setPageIndex(pageNum)}
                className={`w-7 h-7 rounded-lg text-[11px] font-extrabold border-0 shadow-2xs transition cursor-pointer ${
                  pageNum === pageIndex
                    ? 'bg-[#2563eb] text-white shadow-[0_0_8px_rgba(37,99,235,0.4)]'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {pageNum + 1}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 disabled:opacity-30 border-0 shadow-2xs transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
        >
          <span>Sau</span>
          <ChevronRight size={13} />
        </button>

        <button
          type="button"
          onClick={() => table.setPageIndex(pageCount - 1)}
          disabled={!table.getCanNextPage()}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 disabled:opacity-30 border-0 shadow-2xs transition cursor-pointer disabled:cursor-not-allowed"
          title="Trang cuối"
        >
          <ChevronsRight size={13} />
        </button>
      </div>
    </div>
  );
}
