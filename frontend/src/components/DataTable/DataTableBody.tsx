import React, { Fragment } from 'react';
import { flexRender, Row } from '@tanstack/react-table';
import { isNameColumn } from '../../utils/vietnameseSort';

interface DataTableBodyProps<TData> {
  allRows: Row<TData>[];
  visibleFlatColumns: any[];
  virtualItems: any[] | null;
  useVirt: boolean;
  paddingTop: number;
  paddingBottom: number;
  columnAlignments: Record<string, 'center' | 'left'>;
  onRowClick?: (row: TData) => void;
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode;
  getRowClassName?: (row: TData, index: number) => string | undefined;
  columnSizing?: Record<string, number>;
}

export function DataTableBody<TData>({
  allRows,
  visibleFlatColumns,
  virtualItems,
  useVirt,
  paddingTop,
  paddingBottom,
  columnAlignments,
  onRowClick,
  renderSubComponent,
  getRowClassName,
  columnSizing,
}: DataTableBodyProps<TData>) {
  const renderedRows = useVirt && virtualItems
    ? virtualItems.map((vi) => allRows[vi.index])
    : allRows;

  return (
    <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-semibold">
      {useVirt && paddingTop > 0 && (
        <tr>
          <td style={{ height: paddingTop }} colSpan={visibleFlatColumns.length} />
        </tr>
      )}

      {renderedRows.map((row, rowIdx) => {
        if (!row) return null;
        const customRowClass = getRowClassName ? getRowClassName(row.original, row.index) : undefined;

        return (
          <Fragment key={row.id}>
            <tr
              onClick={() => onRowClick?.(row.original)}
              className={`group transition-colors duration-150 ${
                row.getIsSelected()
                  ? 'bg-blue-50/80 dark:bg-blue-950/30'
                  : rowIdx % 2 === 1
                  ? 'bg-slate-50/50 dark:bg-white/[0.02]'
                  : 'bg-white dark:bg-transparent'
              } hover:bg-blue-50/40 dark:hover:bg-white/5 ${onRowClick ? 'cursor-pointer' : ''} ${customRowClass || ''}`}
            >
              {row.getVisibleCells().map((cell: any) => {
                const isSelectCol = cell.column.id === 'select' || cell.column.id === '_expander';
                const isPersonName =
                  isNameColumn(cell.column.columnDef) ||
                  ['student_name', 'full_name', 'name', 'ho_ten', 'hoten'].includes(
                    String(cell.column.id || '').toLowerCase()
                  );
                const colAlign =
                  columnAlignments[cell.column.id] ||
                  (cell.column.columnDef as any)?.meta?.align ||
                  (isPersonName ? 'left' : 'center');
                const isCentered = isSelectCol ? true : colAlign === 'center';
                const colDef = cell.column.columnDef;
                const colWidth = columnSizing?.[cell.column.id] || (typeof colDef?.size === 'number' ? colDef.size : undefined);
                const colMinWidth = typeof colDef?.minSize === 'number' ? colDef.minSize : undefined;
                const colMaxWidth = typeof colDef?.maxSize === 'number' ? colDef.maxSize : undefined;

                return (
                  <td
                    key={cell.id}
                    data-col-id={cell.column.id}
                    style={{
                      width: colWidth ? `${colWidth}px` : undefined,
                      minWidth: colMinWidth ? `${colMinWidth}px` : undefined,
                      maxWidth: colMaxWidth ? `${colMaxWidth}px` : undefined,
                    }}
                    className={`py-3 px-2 sm:px-3 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-colors duration-150 ${
                      cell.column.getIsPinned() ? 'sticky bg-inherit z-10' : ''
                    }`}
                  >
                    <div
                      className={`w-full flex items-center ${
                        isCentered ? 'justify-center text-center' : 'justify-start text-left'
                      }`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Expanded sub-row */}
            {row.getIsExpanded() && renderSubComponent && (
              <tr className="bg-slate-50/70 dark:bg-[#0c1020]/90 border-b border-slate-200 dark:border-white/10">
                <td colSpan={row.getVisibleCells().length} className="p-0">
                  {renderSubComponent({ row })}
                </td>
              </tr>
            )}
          </Fragment>
        );
      })}

      {useVirt && paddingBottom > 0 && (
        <tr>
          <td style={{ height: paddingBottom }} colSpan={visibleFlatColumns.length} />
        </tr>
      )}
    </tbody>
  );
}
