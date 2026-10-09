import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel,
  getFilteredRowModel, getGroupedRowModel, getExpandedRowModel, ColumnDef,
  SortingState, ColumnFiltersState, RowSelectionState, GroupingState,
  ExpandedState, ColumnPinningState, ColumnOrderState, PaginationState, Table,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { filterWithNearMatchFallback } from '../../utils/fuzzySearch';
import { vietnameseNameSortingFn, isNameColumn } from '../../utils/vietnameseSort';
import { DataTableProps } from './types';
import { IndeterminateCheckbox } from './IndeterminateCheckbox';
import { DataTableHeader } from './DataTableHeader';
import { DataTableToolbar } from './DataTableToolbar';
import { DataTablePagination } from './DataTablePagination';
import { DataTableBody } from './DataTableBody';
import { useDataTableLayout } from './useDataTableLayout';

export function DataTable<TData>({
  data, columns, loading = false, loadingMessage = 'Đang tải dữ liệu...',
  emptyMessage = 'Không tìm thấy dữ liệu phù hợp.', pageSize = 20, showPagination = true,
  enableGlobalSearch = true, enableColumnVisibility = true, enableRowSelection = false,
  enableColumnResizing = true, enableColumnReorder = true, enableGrouping = false,
  enableRowExpansion = false, enableColumnPinning = false, enableMultiSort = true,
  enableVirtualization, enableExport = true, stickyHeader = true, stickyFirstColumn = false,
  initialSorting = [], initialColumnVisibility = {}, initialColumnPinning = {},
  initialColumnAlignments = {}, onRowClick, onSelectionChange, renderSubComponent,
  onExportExcel, onExportDocx, onExportPdf, onExportPng, toolbarLeft, toolbarRight,
  searchPlaceholder = 'Tìm kiếm...', exportFilename = 'export', tableId, borderless = false,
  getRowClassName,
}: DataTableProps<TData>) {
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const {
    columnSizing,
    setColumnSizing,
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
    columnAlignments,
    setColumnAlignments,
    saveLayoutToStorage,
    handleDragEnd,
    handleAutoFitColumnWidths,
    handleAutoFitSingleColumn,
    handleResetColumnWidths,
  } = useDataTableLayout({
    tableId,
    exportFilename,
    columns,
    initialColumnVisibility,
    initialColumnAlignments,
    tableScrollRef,
  });

  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [grouping, setGrouping] = useState<GroupingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(() => ({
    left: stickyFirstColumn && columns[0] ? [String((columns[0] as any).accessorKey || (columns[0] as any).id)] : [],
    ...initialColumnPinning,
  }));
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });

  const finalColumns = useMemo<ColumnDef<TData, any>[]>(() => {
    const cols: ColumnDef<TData, any>[] = [];
    if (enableRowSelection) {
      cols.push({
        id: 'select',
        header: ({ table }) => (
          <div className="w-full flex items-center justify-center">
            <IndeterminateCheckbox
              checked={table.getIsAllPageRowsSelected()}
              indeterminate={table.getIsSomePageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="w-full flex items-center justify-center">
            <IndeterminateCheckbox
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              indeterminate={row.getIsSomeSelected()}
              onChange={row.getToggleSelectedHandler()}
            />
          </div>
        ),
        enableSorting: false,
        enableResizing: false,
        size: 40,
        minSize: 40,
        maxSize: 40,
      });
    }

    columns.forEach((col) => {
      const isName = isNameColumn(col);
      cols.push(isName && !col.sortingFn ? { ...col, sortingFn: vietnameseNameSortingFn } : col);
    });
    return cols;
  }, [columns, enableRowSelection]);

  const globalFuzzyFilterFn = useCallback((row: any, _columnId: string, filterValue: string): boolean => {
    if (!filterValue) return true;
    const values: string[] = Object.values(row.original || {}).map((v) => (v === null || v === undefined ? '' : String(v)));
    const searchTarget = values.join(' ');
    const res = filterWithNearMatchFallback([searchTarget], filterValue, (item) => item);
    return res.results.length > 0;
  }, []);

  const table: Table<TData> = useReactTable({
    data,
    columns: finalColumns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
      grouping,
      expanded,
      columnPinning,
      columnOrder,
      columnSizing,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: (updater) => {
      setColumnVisibility((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        saveLayoutToStorage(columnSizing, next, columnOrder, columnAlignments);
        return next;
      });
    },
    onRowSelectionChange: (updater) => {
      setRowSelection((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (onSelectionChange) {
          const selectedRows = Object.keys(next)
            .filter((k) => next[k])
            .map((k) => table.getRowModel().rowsById[k]?.original)
            .filter(Boolean);
          onSelectionChange(selectedRows as TData[]);
        }
        return next;
      });
    },
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onColumnPinningChange: setColumnPinning,
    onColumnOrderChange: (updater) => {
      setColumnOrder((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        saveLayoutToStorage(columnSizing, columnVisibility, next, columnAlignments);
        return next;
      });
    },
    onColumnSizingChange: (updater) => {
      setColumnSizing((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        saveLayoutToStorage(next, columnVisibility, columnOrder, columnAlignments);
        return next;
      });
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getGroupedRowModel: enableGrouping ? getGroupedRowModel() : undefined,
    getExpandedRowModel: enableRowExpansion ? getExpandedRowModel() : undefined,
    enableColumnResizing,
    columnResizeMode: 'onChange',
    enableMultiSort,
    enableRowSelection,
    globalFilterFn: globalFuzzyFilterFn,
  });

  const allRows = table.getRowModel().rows;
  const useVirt = enableVirtualization ?? data.length > 500;

  const rowVirtualizer = useVirtualizer({
    count: allRows.length,
    getScrollElement: () => tableScrollRef.current,
    estimateSize: () => 44,
    overscan: 10,
    enabled: useVirt,
  });

  const virtualItems = useVirt ? rowVirtualizer.getVirtualItems() : null;
  const totalVirtualSize = useVirt ? rowVirtualizer.getTotalSize() : 0;
  const paddingTop = virtualItems && virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom = virtualItems && virtualItems.length > 0 ? totalVirtualSize - virtualItems[virtualItems.length - 1].end : 0;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const orderedHeaderIds = useMemo(() => table.getHeaderGroups()[0]?.headers.map((h: any) => h.id) || [], [table, columnOrder]);

  const totalFiltered = table.getFilteredRowModel().rows.length;
  const hasActiveFilter = globalFilter !== '' || columnFilters.length > 0;
  const selectedCount = Object.keys(rowSelection).filter((k) => rowSelection[k]).length;

  const totalMinTableWidth = useMemo(() => {
    return table.getVisibleFlatColumns().reduce((acc: number, col: any) => {
      const d = col.columnDef;
      return acc + (columnSizing[col.id] || (typeof d?.size === 'number' ? d.size : typeof d?.minSize === 'number' ? d.minSize : 100));
    }, 0);
  }, [table, columnSizing]);

  return (
    <div className={`flex flex-col w-full h-full min-h-0 bg-white dark:bg-[#0c0f1e] ${borderless ? '' : 'rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs'}`}>
      <DataTableToolbar
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        enableGlobalSearch={enableGlobalSearch}
        searchPlaceholder={searchPlaceholder}
        borderless={borderless}
        toolbarLeft={toolbarLeft}
        toolbarRight={toolbarRight}
        selectedCount={selectedCount}
        totalFiltered={totalFiltered}
        hasActiveFilter={hasActiveFilter}
        onClearFilters={() => {
          setGlobalFilter('');
          setColumnFilters([]);
        }}
        useVirt={useVirt}
        loading={loading}
        enableRowSelection={enableRowSelection}
        enableExport={enableExport}
        enableColumnVisibility={enableColumnVisibility}
        exportFilename={exportFilename}
        columnAlignments={columnAlignments}
        onToggleAlignment={(colId) => {
          setColumnAlignments((prev) => {
            const newAlign: 'center' | 'left' = prev[colId] === 'left' ? 'center' : 'left';
            const next: Record<string, 'center' | 'left'> = { ...prev, [colId]: newAlign };
            saveLayoutToStorage(columnSizing, columnVisibility, columnOrder, next);
            return next;
          });
        }}
        onAutoFitColumnWidths={() => handleAutoFitColumnWidths(table.getVisibleFlatColumns())}
        onResetColumnWidths={handleResetColumnWidths}
        onMoveColumn={(colId, dir) => {
          const curr = columnOrder.length ? columnOrder : (table.getAllLeafColumns().map((c: any) => c.id) as string[]);
          const idx = curr.indexOf(colId);
          if (idx === -1) return;
          const target = dir === 'up' ? idx - 1 : idx + 1;
          if (target < 0 || target >= curr.length) return;
          const next: ColumnOrderState = [...curr];
          const [moved] = next.splice(idx, 1);
          next.splice(target, 0, moved);
          saveLayoutToStorage(columnSizing, columnVisibility, next, columnAlignments);
        }}
        onExportExcel={onExportExcel}
        onExportDocx={onExportDocx}
        onExportPdf={onExportPdf}
        onExportPng={onExportPng}
      />

      {loading && allRows.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 py-16">
          <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin" />
          <span className="text-xs font-bold">{loadingMessage}</span>
        </div>
      ) : allRows.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 py-16 text-center px-4">
          <AlertCircle className="h-9 w-9 text-indigo-400/40" />
          {typeof emptyMessage === 'string' ? <p className="text-sm font-black text-slate-400">{emptyMessage}</p> : emptyMessage}
          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                setGlobalFilter('');
                setColumnFilters([]);
              }}
              className="text-xs text-indigo-500 hover:text-indigo-400 underline cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="relative flex-1 min-h-0 flex flex-col">
          <div
            ref={tableScrollRef}
            className={`w-full overflow-x-auto relative ${useVirt ? 'overflow-y-auto flex-1 min-h-0' : 'overflow-y-visible'}`}
            style={{ overscrollBehaviorX: 'contain', WebkitOverflowScrolling: 'touch' }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => handleDragEnd(event, table.getAllLeafColumns() as any)}
            >
              <SortableContext items={orderedHeaderIds} strategy={horizontalListSortingStrategy}>
                <table
                  className="text-left text-sm data-table-main"
                  style={{
                    tableLayout:
                      Object.keys(columnSizing).length > 0 ||
                      table.getVisibleFlatColumns().some((c: any) => typeof c.columnDef?.size === 'number')
                        ? 'fixed'
                        : 'auto',
                    minWidth: totalMinTableWidth ? `${totalMinTableWidth}px` : '100%',
                    width: '100%',
                    borderCollapse: 'separate',
                    borderSpacing: 0,
                  }}
                >
                  <colgroup>
                    {table.getVisibleFlatColumns().map((col: any) => {
                      if (columnSizing[col.id]) {
                        return <col key={col.id} style={{ width: `${columnSizing[col.id]}px` }} />;
                      }
                      const isSTT = col.id === 'stt' || col.columnDef?.id === 'stt';
                      if (isSTT) {
                        const sttWidth = typeof col.columnDef?.size === 'number' ? col.columnDef.size : 48;
                        return <col key={col.id} style={{ width: `${sttWidth}px`, maxWidth: `${sttWidth + 4}px` }} />;
                      }
                      const manualWidth = typeof col.columnDef?.size === 'number' ? col.columnDef.size : undefined;
                      return <col key={col.id} style={manualWidth ? { width: `${manualWidth}px` } : undefined} />;
                    })}
                  </colgroup>

                  <DataTableHeader
                    headerGroups={table.getHeaderGroups()}
                    borderless={borderless}
                    stickyHeader={stickyHeader}
                    enableColumnReorder={enableColumnReorder}
                    enableColumnResizing={enableColumnResizing}
                    isResizingColumn={table.getState().columnSizingInfo.isResizingColumn !== false}
                    columnAlignments={columnAlignments}
                    onAutoFitColumn={handleAutoFitSingleColumn}
                    columnSizing={columnSizing}
                  />

                  <DataTableBody<TData>
                    allRows={allRows}
                    visibleFlatColumns={table.getVisibleFlatColumns()}
                    virtualItems={virtualItems}
                    useVirt={useVirt}
                    paddingTop={paddingTop}
                    paddingBottom={paddingBottom}
                    columnAlignments={columnAlignments}
                    onRowClick={onRowClick}
                    renderSubComponent={renderSubComponent}
                    getRowClassName={getRowClassName}
                    columnSizing={columnSizing}
                  />
                </table>
              </SortableContext>
            </DndContext>
          </div>

          {showPagination && !useVirt && (
            <DataTablePagination
              table={table}
              totalFiltered={totalFiltered}
              borderless={borderless}
            />
          )}
        </div>
      )}
    </div>
  );
}
