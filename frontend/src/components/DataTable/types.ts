import React from 'react';
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  ColumnPinningState,
  Row,
  flexRender,
} from '@tanstack/react-table';

// ─── Header Text Extractor Helper ───────────────────────────────────────────
export function getTextFromReactNode(node: any): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getTextFromReactNode).join('');
  if (typeof node === 'object') {
    if (node.props && node.props.children !== undefined) {
      return getTextFromReactNode(node.props.children);
    }
  }
  return '';
}

export function getColumnHeaderText(column: any, context: any): string {
  if (typeof column.columnDef.meta?.headerText === 'string') {
    return column.columnDef.meta.headerText;
  }
  const headerDef = column.columnDef.header;
  if (typeof headerDef === 'string') return headerDef;
  if (typeof headerDef === 'function') {
    try {
      const rendered = flexRender(headerDef, context);
      const text = getTextFromReactNode(rendered).trim();
      if (text) return text;
    } catch (e) {}
  }
  return column.id;
}

// ─── DataTable Props ────────────────────────────────────────────────────────
export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  loading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string | React.ReactNode;

  // Pagination
  pageSize?: number;
  showPagination?: boolean;

  // Feature toggles
  enableGlobalSearch?: boolean;
  enableColumnVisibility?: boolean;
  enableRowSelection?: boolean;
  enableColumnResizing?: boolean;
  enableColumnReorder?: boolean;
  enableGrouping?: boolean;
  enableRowExpansion?: boolean;
  enableColumnPinning?: boolean;
  enableMultiSort?: boolean;
  enableVirtualization?: boolean; // auto-on when data.length > 500
  enableExport?: boolean;

  // Sticky layout
  stickyHeader?: boolean;
  stickyFirstColumn?: boolean;

  // Initial state
  initialSorting?: SortingState;
  initialColumnVisibility?: VisibilityState;
  initialColumnPinning?: ColumnPinningState;
  initialColumnAlignments?: Record<string, 'center' | 'left'>;

  // Callbacks
  onRowClick?: (row: TData) => void;
  onSelectionChange?: (selectedRows: TData[]) => void;
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode;
  onExportExcel?: () => void;
  onExportDocx?: () => void;
  onExportPdf?: () => void;
  onExportPng?: () => void;

  // Toolbar slots
  toolbarLeft?: React.ReactNode;
  toolbarRight?: React.ReactNode;
  searchPlaceholder?: string;

  // Export & Storage
  exportFilename?: string;
  tableId?: string;
  borderless?: boolean;
  getRowClassName?: (row: TData, index: number) => string | undefined;
}
