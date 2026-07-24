import React, { useState, useRef, useEffect, Fragment } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  GroupingState,
  ExpandedState,
  ColumnPinningState,
  ColumnResizeMode,
  Row,
} from '@tanstack/react-table';
import {
  ChevronLeft, ChevronRight, RefreshCw, AlertCircle,
  ArrowUp, ArrowDown, ArrowUpDown, Search, Eye, EyeOff,
  ChevronDown, ChevronUp, CheckSquare, Square, Minus,
  ChevronsLeft, ChevronsRight, X, SlidersHorizontal,
} from 'lucide-react';

export interface DataTableProps<TData> {
  // --- Core ---
  data: TData[];
  columns: ColumnDef<TData, any>[];
  loading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string | React.ReactNode;

  // --- Pagination ---
  pageSize?: number;
  showPagination?: boolean;

  // --- Features toggles ---
  enableGlobalSearch?: boolean;
  enableColumnVisibility?: boolean;
  enableRowSelection?: boolean;
  enableColumnResizing?: boolean;
  enableGrouping?: boolean;
  enableRowExpansion?: boolean;
  enableColumnPinning?: boolean;

  // --- Controlled state (optional overrides) ---
  initialSorting?: SortingState;
  initialColumnVisibility?: VisibilityState;
  initialColumnPinning?: ColumnPinningState;

  // --- Callbacks ---
  onRowClick?: (row: TData) => void;
  onSelectionChange?: (selectedRows: TData[]) => void;
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode;

  // --- Toolbar extras ---
  toolbarLeft?: React.ReactNode;   // extra content on the left of toolbar
  toolbarRight?: React.ReactNode;  // extra content on the right of toolbar
  searchPlaceholder?: string;

  // --- Sticky header ---
  stickyHeader?: boolean;
}

// ── Indeterminate Checkbox ───────────────────────────────────────────────────
function IndeterminateCheckbox({
  indeterminate,
  className = '',
  ...rest
}: { indeterminate?: boolean } & React.HTMLProps<HTMLInputElement>) {
  const ref = useRef<HTMLInputElement>(null!);
  useEffect(() => {
    if (typeof indeterminate === 'boolean') {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, indeterminate]);
  return (
    <input
      type="checkbox"
      ref={ref}
      className={`accent-indigo-500 cursor-pointer w-3.5 h-3.5 rounded ${className}`}
      {...rest}
    />
  );
}

// ── Column Visibility Dropdown ───────────────────────────────────────────────
function ColumnVisibilityDropdown<TData>({ table }: { table: ReturnType<typeof useReactTable<TData>> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const allCols = table.getAllLeafColumns().filter(c => c.id !== 'select' && c.id !== '_expander');

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1c243c] hover:bg-[#253050] text-slate-300 hover:text-white border border-[#303d62] text-xs font-bold transition cursor-pointer"
        title="Hiển thị / ẩn cột"
      >
        <SlidersHorizontal size={13} className="text-indigo-400" />
        <span className="hidden sm:inline">Cột</span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-52 bg-[#131929] border border-[#28334e] rounded-xl shadow-2xl p-3 space-y-1.5 animate-mac-dropdown">
          <div className="text-[10px] font-black uppercase text-indigo-400 tracking-wider border-b border-white/10 pb-1.5 mb-2 flex items-center justify-between">
            <span>Hiển thị cột</span>
            <div className="flex gap-1">
              <button
                type="button"
                className="text-[9px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 transition cursor-pointer"
                onClick={() => table.toggleAllColumnsVisible(true)}
              >Tất cả</button>
              <button
                type="button"
                className="text-[9px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 transition cursor-pointer"
                onClick={() => table.toggleAllColumnsVisible(false)}
              >Ẩn hết</button>
            </div>
          </div>
          {allCols.map(col => (
            <label
              key={col.id}
              className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer hover:text-white px-1.5 py-1 rounded hover:bg-[#1e2740] transition"
            >
              <input
                type="checkbox"
                checked={col.getIsVisible()}
                onChange={col.getToggleVisibilityHandler()}
                className="accent-indigo-500 rounded cursor-pointer w-3.5 h-3.5"
              />
              <span className="truncate">{typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id}</span>
              {col.getIsPinned() && (
                <span className="ml-auto text-[9px] text-amber-400 font-bold">PIN</span>
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main DataTable Component ─────────────────────────────────────────────────
export function DataTable<TData>({
  data,
  columns,
  loading = false,
  loadingMessage = 'Đang tải dữ liệu...',
  emptyMessage = 'Không tìm thấy dữ liệu phù hợp.',
  pageSize = 20,
  showPagination = true,
  enableGlobalSearch = true,
  enableColumnVisibility = true,
  enableRowSelection = false,
  enableColumnResizing = true,
  enableGrouping = false,
  enableRowExpansion = false,
  enableColumnPinning = false,
  initialSorting = [],
  initialColumnVisibility = {},
  initialColumnPinning = {},
  onRowClick,
  onSelectionChange,
  renderSubComponent,
  toolbarLeft,
  toolbarRight,
  searchPlaceholder = 'Tìm kiếm...',
  stickyHeader = true,
}: DataTableProps<TData>) {
  // ── Internal State ─────────────────────────────────────────────────────────
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialColumnVisibility);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [grouping, setGrouping] = useState<GroupingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(initialColumnPinning);
  const columnResizeMode: ColumnResizeMode = 'onChange';

  // ── Build column list (prepend select + expander if needed) ─────────────────
  const allColumns = React.useMemo<ColumnDef<TData, any>[]>(() => {
    const cols: ColumnDef<TData, any>[] = [];

    if (enableRowSelection) {
      cols.push({
        id: 'select',
        size: 40,
        enableResizing: false,
        enableSorting: false,
        enableGlobalFilter: false,
        header: ({ table }) => (
          <IndeterminateCheckbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <IndeterminateCheckbox
            checked={row.getIsSelected()}
            indeterminate={row.getIsSomeSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={e => e.stopPropagation()}
          />
        ),
      });
    }

    if (enableRowExpansion && renderSubComponent) {
      cols.push({
        id: '_expander',
        size: 36,
        enableResizing: false,
        enableSorting: false,
        enableGlobalFilter: false,
        header: () => null,
        cell: ({ row }) =>
          row.getCanExpand() ? (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); row.toggleExpanded(); }}
              className="p-1 rounded text-slate-400 hover:text-indigo-400 transition cursor-pointer"
            >
              {row.getIsExpanded() ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          ) : null,
      });
    }

    cols.push(...columns);
    return cols;
  }, [columns, enableRowSelection, enableRowExpansion, renderSubComponent]);

  // ── Table Instance ──────────────────────────────────────────────────────────
  const table = useReactTable<TData>({
    data,
    columns: allColumns,
    columnResizeMode,
    state: {
      globalFilter,
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      grouping,
      expanded,
      columnPinning,
    },
    // Handlers
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      setRowSelection(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (onSelectionChange) {
          const selectedRows = table.getRowModel().rows
            .filter(r => next[r.id])
            .map(r => r.original);
          onSelectionChange(selectedRows);
        }
        return next;
      });
    },
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onColumnPinningChange: setColumnPinning,
    // Row models
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getGroupedRowModel: enableGrouping ? getGroupedRowModel() : undefined,
    getExpandedRowModel: (enableRowExpansion || enableGrouping) ? getExpandedRowModel() : undefined,
    // Options
    enableRowSelection,
    enableColumnResizing,
    enableGrouping,
    enableGlobalFilter: enableGlobalSearch,
    getRowCanExpand: enableRowExpansion ? () => true : undefined,
    initialState: {
      pagination: { pageSize },
    },
  });

  // ── Notify selection changes ────────────────────────────────────────────────
  const prevSelectionRef = useRef<RowSelectionState>({});
  useEffect(() => {
    if (!onSelectionChange) return;
    if (JSON.stringify(rowSelection) === JSON.stringify(prevSelectionRef.current)) return;
    prevSelectionRef.current = rowSelection;
    const selectedRows = table.getRowModel().rows
      .filter(r => rowSelection[r.id])
      .map(r => r.original);
    onSelectionChange(selectedRows);
  }, [rowSelection]);

  // ── Pagination helpers ──────────────────────────────────────────────────────
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const totalFiltered = table.getFilteredRowModel().rows.length;
  const hasActiveFilter = globalFilter.trim().length > 0 || columnFilters.length > 0;

  // ── Resize style helper ────────────────────────────────────────────────────
  const getColWidth = (header: any) =>
    header.getSize() !== 150 ? { width: header.getSize() } : {};

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-0 w-full h-full">

      {/* ── TOOLBAR ──────────────────────────────────────────────────────────── */}
      {(enableGlobalSearch || enableColumnVisibility || toolbarLeft || toolbarRight) && (
        <div className="flex flex-wrap items-center gap-2 p-2.5 border-b border-[#28334e] bg-[#0d111a] shrink-0">
          {/* Left side */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {enableGlobalSearch && (
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={globalFilter}
                  onChange={e => setGlobalFilter(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-[#161b2e] border border-[#28334e] text-white text-xs rounded-xl pl-8 pr-8 py-1.5 focus:outline-none focus:border-indigo-500/70 placeholder:text-slate-600 font-medium transition"
                />
                {globalFilter && (
                  <button
                    type="button"
                    onClick={() => setGlobalFilter('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            )}
            {toolbarLeft}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Active filter badge */}
            {hasActiveFilter && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                <span>{totalFiltered} kết quả</span>
                <button
                  type="button"
                  onClick={() => { setGlobalFilter(''); setColumnFilters([]); }}
                  className="text-indigo-400 hover:text-white cursor-pointer"
                >
                  <X size={11} />
                </button>
              </div>
            )}

            {toolbarRight}

            {enableColumnVisibility && (
              <ColumnVisibilityDropdown<TData> table={table} />
            )}

            {/* Row selection info */}
            {enableRowSelection && Object.keys(rowSelection).length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                <CheckSquare size={11} />
                <span>{Object.keys(rowSelection).length} đã chọn</span>
                <button
                  type="button"
                  onClick={() => setRowSelection({})}
                  className="text-emerald-400 hover:text-white cursor-pointer"
                >
                  <X size={11} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TABLE BODY ───────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 py-16">
          <RefreshCw className="h-7 w-7 text-indigo-400 animate-spin" />
          <span className="text-xs font-bold">{loadingMessage}</span>
        </div>
      ) : table.getRowModel().rows.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 py-16 text-center px-4">
          <AlertCircle className="h-10 w-10 text-indigo-400/50" />
          {typeof emptyMessage === 'string' ? (
            <p className="text-sm font-black text-white">{emptyMessage}</p>
          ) : (
            emptyMessage
          )}
          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => { setGlobalFilter(''); setColumnFilters([]); }}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline cursor-pointer mt-1"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-auto flex-1 min-h-0">
            <table
              className="w-full text-left border-collapse text-xs"
              style={enableColumnResizing ? { width: table.getTotalSize() } : undefined}
            >
              <thead
                className={`bg-[#161b2e] text-slate-300 uppercase text-[10px] font-black tracking-wider border-b border-[#28334e] ${stickyHeader ? 'sticky top-0 z-10' : ''}`}
              >
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => {
                      const isPinned = header.column.getIsPinned();
                      return (
                        <th
                          key={header.id}
                          colSpan={header.colSpan}
                          className={`py-3 px-3.5 select-none relative whitespace-nowrap ${isPinned ? 'bg-[#161b2e] shadow-[2px_0_8px_rgba(0,0,0,0.4)]' : ''}`}
                          style={{
                            ...getColWidth(header),
                            ...(isPinned === 'left' ? { left: header.column.getStart('left'), position: 'sticky', zIndex: 5 } : {}),
                            ...(isPinned === 'right' ? { right: header.column.getAfter('right'), position: 'sticky', zIndex: 5 } : {}),
                          }}
                        >
                          <div
                            className={`flex items-center gap-1.5 ${header.column.getCanSort() ? 'cursor-pointer hover:text-white transition-colors' : ''}`}
                            onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}

                            {header.column.getCanSort() && (
                              <span className="text-slate-500 shrink-0">
                                {header.column.getIsSorted() === 'asc'
                                  ? <ArrowUp size={10} className="text-indigo-400" />
                                  : header.column.getIsSorted() === 'desc'
                                  ? <ArrowDown size={10} className="text-indigo-400" />
                                  : <ArrowUpDown size={10} className="opacity-30 group-hover:opacity-80 transition" />}
                              </span>
                            )}
                          </div>

                          {/* Column resize handle */}
                          {enableColumnResizing && header.column.getCanResize() && (
                            <div
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none rounded-full transition-colors ${
                                header.column.getIsResizing()
                                  ? 'bg-indigo-500'
                                  : 'bg-transparent hover:bg-indigo-500/50'
                              }`}
                            />
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>

              <tbody className="divide-y divide-[#1e2740] bg-[#0d1120]">
                {table.getRowModel().rows.map(row => (
                  <Fragment key={row.id}>
                    <tr
                      className={`hover:bg-[#131928] transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${row.getIsSelected() ? 'bg-indigo-500/10 hover:bg-indigo-500/15' : ''}`}
                      onClick={() => onRowClick?.(row.original)}
                    >
                      {row.getVisibleCells().map(cell => {
                        const isPinned = cell.column.getIsPinned();
                        return (
                          <td
                            key={cell.id}
                            className={`py-3 px-3.5 font-medium ${isPinned ? 'bg-[#0d1120] shadow-[2px_0_8px_rgba(0,0,0,0.4)]' : ''} ${row.getIsSelected() ? 'bg-indigo-500/10' : ''}`}
                            style={{
                              ...(enableColumnResizing ? { width: cell.column.getSize() } : {}),
                              ...(isPinned === 'left' ? { left: cell.column.getStart('left'), position: 'sticky', zIndex: 3 } : {}),
                              ...(isPinned === 'right' ? { right: cell.column.getAfter('right'), position: 'sticky', zIndex: 3 } : {}),
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Expanded row sub-component */}
                    {row.getIsExpanded() && renderSubComponent && (
                      <tr className="bg-[#0b0f1c] border-b border-[#1e2740]">
                        <td colSpan={row.getVisibleCells().length} className="px-4 py-3">
                          {renderSubComponent({ row })}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── PAGINATION ───────────────────────────────────────────────────── */}
          {showPagination && pageCount > 0 && (
            <div className="shrink-0 px-4 py-2.5 bg-[#0a0d17] border-t border-[#1e2740] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-bold">
              {/* Left: info */}
              <div className="flex items-center gap-3">
                <span>
                  Trang <span className="text-white">{pageIndex + 1}</span> / {pageCount}
                  <span className="text-slate-600 ml-2">({totalFiltered} bản ghi)</span>
                </span>

                {/* Page size selector */}
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={e => table.setPageSize(Number(e.target.value))}
                  className="bg-[#161b2e] border border-[#28334e] text-white text-[10px] font-bold rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                >
                  {[10, 20, 50, 100].map(size => (
                    <option key={size} value={size}>{size} / trang</option>
                  ))}
                </select>
              </div>

              {/* Right: navigation */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="p-1.5 rounded-lg bg-[#182035] hover:bg-[#253050] text-slate-300 disabled:opacity-40 disabled:hover:bg-[#182035] border border-white/10 transition cursor-pointer disabled:cursor-not-allowed"
                  title="Trang đầu"
                >
                  <ChevronsLeft size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-2.5 py-1.5 rounded-lg bg-[#182035] hover:bg-[#253050] text-slate-300 disabled:opacity-40 disabled:hover:bg-[#182035] border border-white/10 transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={13} />
                  <span>Trước</span>
                </button>

                {/* Page number pills */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
                    let pageNum: number;
                    if (pageCount <= 5) {
                      pageNum = i;
                    } else if (pageIndex < 3) {
                      pageNum = i;
                    } else if (pageIndex > pageCount - 4) {
                      pageNum = pageCount - 5 + i;
                    } else {
                      pageNum = pageIndex - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => table.setPageIndex(pageNum)}
                        className={`w-7 h-7 rounded-lg text-[11px] font-extrabold border transition cursor-pointer ${
                          pageNum === pageIndex
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                            : 'bg-[#182035] border-white/10 text-slate-400 hover:bg-[#253050] hover:text-white'
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
                  className="px-2.5 py-1.5 rounded-lg bg-[#182035] hover:bg-[#253050] text-slate-300 disabled:opacity-40 disabled:hover:bg-[#182035] border border-white/10 transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>Sau</span>
                  <ChevronRight size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => table.setPageIndex(pageCount - 1)}
                  disabled={!table.getCanNextPage()}
                  className="p-1.5 rounded-lg bg-[#182035] hover:bg-[#253050] text-slate-300 disabled:opacity-40 disabled:hover:bg-[#182035] border border-white/10 transition cursor-pointer disabled:cursor-not-allowed"
                  title="Trang cuối"
                >
                  <ChevronsRight size={13} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
