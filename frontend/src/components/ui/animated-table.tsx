import React, { useState } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  Check,
} from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnDef<T> {
  id: string;
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  sortable?: boolean;
  hideable?: boolean;
  align?: 'left' | 'center' | 'right';
  cell?: (row: T) => React.ReactNode;
}

export interface AnimatedTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  selectable?: boolean;
  selectedIds?: (string | number)[];
  onSelectionChange?: (ids: (string | number)[]) => void;
  onRowClick?: (row: T) => void;
  sortColumn?: string;
  sortDirection?: SortDirection;
  onSort?: (columnId: string, direction: SortDirection) => void;
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  columnVisibility?: boolean;
  visibleColumns?: string[];
  onVisibleColumnsChange?: (cols: string[]) => void;
  expandable?: boolean;
  renderExpandedRow?: (row: T) => React.ReactNode;
  striped?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    pageSizeOptions?: number[];
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
}

export function AnimatedTable<T extends { id?: string | number }>({
  data,
  columns,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  onRowClick,
  sortColumn,
  sortDirection,
  onSort,
  searchable = true,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm dữ liệu...',
  columnVisibility = true,
  visibleColumns,
  onVisibleColumnsChange,
  expandable = false,
  renderExpandedRow,
  striped = false,
  pagination,
}: AnimatedTableProps<T>) {
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string | number>>(new Set());
  const [showColMenu, setShowColMenu] = useState(false);

  const activeVisibleCols = visibleColumns || columns.map((c) => c.id);

  const toggleRowExpanded = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectRow = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((item) => item !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    const allIds = data.map((d) => d.id).filter((id): id is string | number => id !== undefined);
    if (selectedIds.length === allIds.length && allIds.length > 0) {
      onSelectionChange([]);
    } else {
      onSelectionChange(allIds);
    }
  };

  const handleHeaderSort = (col: ColumnDef<T>) => {
    if (!col.sortable || !onSort) return;
    let nextDir: SortDirection = 'asc';
    if (sortColumn === col.id) {
      if (sortDirection === 'asc') nextDir = 'desc';
      else if (sortDirection === 'desc') nextDir = null;
    }
    onSort(col.id, nextDir);
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;

  const displayedCols = columns.filter((col) => activeVisibleCols.includes(col.id));

  return (
    <div className="space-y-3.5 select-none">
      {/* TOOLBAR (SEARCH & COLUMN VISIBILITY) */}
      {(searchable || columnVisibility) && (
        <div className="flex items-center justify-between gap-3 flex-wrap bg-[#0c0f1e] border border-[#1e2746] p-3 rounded-2xl">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-[#14192b] border border-white/10 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder:text-slate-500 font-semibold focus:outline-none focus:border-[#5c36f5] transition"
              />
            </div>
          )}

          <div className="flex items-center gap-2 relative">
            {columnVisibility && onVisibleColumnsChange && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColMenu(!showColMenu)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition cursor-pointer"
                >
                  <SlidersHorizontal size={13} />
                  <span>Hiển thị cột</span>
                </button>

                {showColMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowColMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 z-50 w-52 bg-[#121626] border border-[#232d4e] rounded-2xl p-2.5 shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150">
                      <div className="text-[10px] font-black uppercase text-slate-400 px-2 py-1 border-b border-white/5">
                        Tùy chọn cột
                      </div>
                      {columns.map((col) => {
                        const isVis = activeVisibleCols.includes(col.id);
                        return (
                          <button
                            key={col.id}
                            type="button"
                            onClick={() => {
                              if (isVis) {
                                onVisibleColumnsChange(activeVisibleCols.filter((id) => id !== col.id));
                              } else {
                                onVisibleColumnsChange([...activeVisibleCols, col.id]);
                              }
                            }}
                            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition"
                          >
                            <span>{typeof col.header === 'string' ? col.header : col.id}</span>
                            {isVis && <Check size={13} className="text-[#5c36f5]" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TABLE CONTAINER */}
      <div className="bg-[#080b14] border border-[#1b2444] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {/* Table Header */}
            <thead>
              <tr className="bg-[#0e1325] border-b border-white/10 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                {expandable && <th className="w-8 px-3 py-3" />}
                {selectable && (
                  <th className="w-10 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded accent-[#5c36f5] cursor-pointer"
                    />
                  </th>
                )}
                {displayedCols.map((col) => {
                  const isSorted = sortColumn === col.id;
                  const alignClass =
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left';

                  return (
                    <th
                      key={col.id}
                      onClick={() => handleHeaderSort(col)}
                      className={`px-4 py-3.5 ${alignClass} ${
                        col.sortable ? 'cursor-pointer hover:text-white transition' : ''
                      }`}
                    >
                      <div className={`inline-flex items-center gap-1.5 ${alignClass}`}>
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span className="text-slate-500">
                            {isSorted && sortDirection === 'asc' ? (
                              <ArrowUp size={13} className="text-indigo-400" />
                            ) : isSorted && sortDirection === 'desc' ? (
                              <ArrowDown size={13} className="text-indigo-400" />
                            ) : (
                              <ArrowUpDown size={12} />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-white/5 text-xs font-semibold text-slate-200">
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={displayedCols.length + (selectable ? 1 : 0) + (expandable ? 1 : 0)}
                    className="py-12 text-center text-slate-500 font-bold"
                  >
                    Không có dữ liệu phù hợp
                  </td>
                </tr>
              ) : (
                data.map((row, rowIdx) => {
                  const rowId = row.id ?? rowIdx;
                  const isSelected = selectedIds.includes(rowId);
                  const isExpanded = expandedRowIds.has(rowId);

                  return (
                    <React.Fragment key={String(rowId)}>
                      <tr
                        onClick={() => onRowClick?.(row)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#181f3d] border-l-2 border-[#5c36f5]'
                            : striped && rowIdx % 2 === 1
                            ? 'bg-white/[0.015] hover:bg-white/[0.04]'
                            : 'hover:bg-white/[0.04]'
                        }`}
                      >
                        {expandable && (
                          <td className="w-8 px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => toggleRowExpanded(rowId, e)}
                              className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          </td>
                        )}

                        {selectable && (
                          <td className="w-10 px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => toggleSelectRow(rowId, e as any)}
                              className="w-4 h-4 rounded accent-[#5c36f5] cursor-pointer"
                            />
                          </td>
                        )}

                        {displayedCols.map((col) => {
                          const alignClass =
                            col.align === 'center'
                              ? 'text-center'
                              : col.align === 'right'
                              ? 'text-right'
                              : 'text-left';

                          return (
                            <td key={col.id} className={`px-4 py-3 ${alignClass}`}>
                              {col.cell
                                ? col.cell(row)
                                : col.accessorKey
                                ? String(row[col.accessorKey] ?? '')
                                : ''}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Expandable Sub-Row */}
                      {expandable && isExpanded && renderExpandedRow && (
                        <tr className="bg-[#0a0d18] border-b border-white/10">
                          <td
                            colSpan={displayedCols.length + (selectable ? 1 : 0) + 1}
                            className="p-4 animate-in fade-in duration-200"
                          >
                            {renderExpandedRow(row)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {pagination && (
          <div className="flex items-center justify-between px-4 py-3 bg-[#0c0f1e] border-t border-white/10 text-xs font-bold text-slate-400">
            <div>
              Hiển thị {data.length} / {pagination.totalItems} bản ghi
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 text-slate-300 transition cursor-pointer"
              >
                Trước
              </button>
              <span className="px-2 font-mono text-white">
                Trang {pagination.page} / {Math.max(1, Math.ceil(pagination.totalItems / pagination.pageSize))}
              </span>
              <button
                type="button"
                disabled={pagination.page >= Math.ceil(pagination.totalItems / pagination.pageSize)}
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 text-slate-300 transition cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnimatedTable;
