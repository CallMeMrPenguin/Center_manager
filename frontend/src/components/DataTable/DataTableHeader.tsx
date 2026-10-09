import React from 'react';
import { flexRender, HeaderGroup } from '@tanstack/react-table';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { isNameColumn } from '../../utils/vietnameseSort';
import { DraggableHeader } from './DraggableHeader';

interface DataTableHeaderProps {
  headerGroups: HeaderGroup<any>[];
  borderless?: boolean;
  stickyHeader?: boolean;
  enableColumnReorder: boolean;
  enableColumnResizing: boolean;
  isResizingColumn: boolean;
  columnAlignments: Record<string, 'center' | 'left'>;
  onAutoFitColumn: (colId: string) => void;
  columnSizing?: Record<string, number>;
}

export function DataTableHeader({
  headerGroups,
  borderless,
  stickyHeader,
  enableColumnReorder,
  enableColumnResizing,
  isResizingColumn,
  columnAlignments,
  onAutoFitColumn,
  columnSizing,
}: DataTableHeaderProps) {
  return (
    <thead
      className={`${
        borderless
          ? 'bg-slate-100/80 dark:bg-white/5 border-b-0'
          : 'bg-slate-50 dark:bg-[#151c2e] border-b-2 border-slate-200 dark:border-white/10'
      } font-bold sm:font-extrabold text-slate-800 dark:text-slate-100 ${
        stickyHeader ? 'sticky top-0 z-20' : ''
      }`}
    >
      {headerGroups.map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const isSelectCol = header.column.id === 'select' || header.column.id === '_expander';
            const isPersonName =
              isNameColumn(header.column.columnDef) ||
              ['student_name', 'full_name', 'name', 'ho_ten', 'hoten'].includes(
                String(header.column.id || '').toLowerCase()
              );
            const colAlign =
              columnAlignments[header.column.id] ||
              (header.column.columnDef as any)?.meta?.align ||
              (isPersonName ? 'left' : 'center');
            const align = isSelectCol ? 'center' : colAlign;

            return (
              <DraggableHeader
                key={header.id}
                header={header}
                enableReorder={enableColumnReorder && !isSelectCol}
                enableColumnResizing={enableColumnResizing}
                align={align}
                isAnyColumnResizing={isResizingColumn}
                onAutoFitColumn={onAutoFitColumn}
                width={columnSizing?.[header.column.id]}
              >
                <div
                  className={`inline-flex items-center justify-center gap-1.5 w-full max-w-full font-bold sm:font-extrabold text-slate-900 dark:text-slate-100 ${
                    header.column.getCanSort()
                      ? 'cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors'
                      : ''
                  }`}
                  onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                >
                  {header.isPlaceholder ? null : typeof header.column.columnDef.header === 'function' ? (
                    <div className="w-full flex items-center justify-center">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                  ) : (
                    <span className="whitespace-nowrap">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </span>
                  )}

                  {header.column.getCanSort() && (
                    <span className="shrink-0 inline-flex items-center">
                      {header.column.getIsSorted() === 'asc' ? (
                        <ArrowUp size={12} className="text-indigo-500" />
                      ) : header.column.getIsSorted() === 'desc' ? (
                        <ArrowDown size={12} className="text-indigo-500" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-400 hover:text-slate-600 transition" />
                      )}
                    </span>
                  )}
                </div>
              </DraggableHeader>
            );
          })}
        </tr>
      ))}
    </thead>
  );
}
