import { useState, useCallback, useMemo } from 'react';
import { ColumnDef, VisibilityState, ColumnOrderState } from '@tanstack/react-table';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { showToast } from '../Toast';

interface UseDataTableLayoutProps<TData> {
  tableId?: string;
  exportFilename: string;
  columns: ColumnDef<TData, any>[];
  initialColumnVisibility?: VisibilityState;
  initialColumnAlignments?: Record<string, 'center' | 'left'>;
  tableScrollRef: React.RefObject<HTMLDivElement | null>;
}

export function useDataTableLayout<TData>({
  tableId,
  exportFilename,
  columns,
  initialColumnVisibility = {},
  initialColumnAlignments = {},
  tableScrollRef,
}: UseDataTableLayoutProps<TData>) {
  const storageKey = `dt_layout_${tableId || exportFilename}`;

  const savedLayout = useMemo(() => {
    if (!storageKey) return null;
    try {
      const item = localStorage.getItem(storageKey);
      if (!item) return null;
      const parsed = JSON.parse(item);
      if (parsed?.sizing) {
        const cleanSizing: Record<string, number> = {};
        Object.entries(parsed.sizing).forEach(([k, v]) => {
          const num = Number(v);
          const matchedCol = columns.find((c: any) => (c.id || c.accessorKey) === k) as any;
          const max = typeof matchedCol?.maxSize === 'number' ? matchedCol.maxSize : 350;
          if (!isNaN(num) && num > 30) {
            cleanSizing[k] = Math.min(num, max);
          }
        });
        parsed.sizing = cleanSizing;
      }
      return parsed;
    } catch (e) {
      return null;
    }
  }, [storageKey, columns]);

  const [columnSizing, setColumnSizing] = useState<Record<string, number>>(() => savedLayout?.sizing || {});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const baseVis = { ...initialColumnVisibility, ...(savedLayout?.visibility || {}) };
    columns.forEach((col: any) => {
      const id = col.id || col.accessorKey;
      if (id && baseVis[id] === undefined) baseVis[id] = true;
    });
    return baseVis;
  });
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() => savedLayout?.order || []);
  const [columnAlignments, setColumnAlignments] = useState<Record<string, 'center' | 'left'>>(() => {
    const baseAlign: Record<string, 'center' | 'left'> = { ...(initialColumnAlignments || {}) };
    columns.forEach((col: any) => {
      const id = col.id || col.accessorKey;
      if (id && col.meta?.align && !baseAlign[id]) baseAlign[id] = col.meta.align;
    });
    return { ...baseAlign, ...(savedLayout?.alignments || {}) };
  });

  const saveLayoutToStorage = useCallback(
    (sizing: Record<string, number>, vis: VisibilityState, ord: ColumnOrderState, align: Record<string, 'center' | 'left'>) => {
      if (!storageKey) return;
      try {
        localStorage.setItem(storageKey, JSON.stringify({ sizing, visibility: vis, order: ord, alignments: align }));
      } catch (e) {}
    },
    [storageKey]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent, currentColumns: Array<{ id: string }>) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        setColumnOrder((prev: ColumnOrderState) => {
          const currentOrder = prev.length ? prev : currentColumns.map((c) => c.id);
          const oldIndex = currentOrder.indexOf(String(active.id));
          const newIndex = currentOrder.indexOf(String(over.id));
          if (oldIndex !== -1 && newIndex !== -1) {
            const next: ColumnOrderState = arrayMove(currentOrder, oldIndex, newIndex);
            saveLayoutToStorage(columnSizing, columnVisibility, next, columnAlignments);
            return next;
          }
          return currentOrder;
        });
      }
    },
    [columnSizing, columnVisibility, columnAlignments, saveLayoutToStorage]
  );

  const handleAutoFitColumnWidths = useCallback(
    (visibleFlatColumns: Array<{ id: string }>) => {
      const tableEl = tableScrollRef.current?.querySelector('table');
      if (!tableEl) return;
      const newSizing: Record<string, number> = {};
      visibleFlatColumns.forEach((col) => {
        const cells = Array.from(tableEl.querySelectorAll(`[data-col-id="${col.id}"]`));
        let maxW = 40;
        cells.forEach((cell) => {
          const innerEl = cell.firstElementChild as HTMLElement | null;
          const contentW = innerEl ? Math.max(innerEl.scrollWidth || 0, innerEl.offsetWidth || 0) : 0;
          const textLen = (cell.textContent || '').trim().length;
          const estimated = Math.max(contentW, textLen * 8.5 + 20);
          if (estimated > maxW) maxW = estimated;
        });
        const matchedCol = columns.find((c: any) => (c.id || c.accessorKey) === col.id) as any;
        const maxLimit = typeof matchedCol?.maxSize === 'number' ? matchedCol.maxSize : 250;
        const minLimit = typeof matchedCol?.minSize === 'number' ? matchedCol.minSize : 45;
        newSizing[col.id] = Math.min(Math.max(maxW + 10, minLimit), maxLimit);
      });
      setColumnSizing(newSizing);
      saveLayoutToStorage(newSizing, columnVisibility, columnOrder, columnAlignments);
      showToast('Đã tự căn chỉnh kích thước các cột vừa nội dung', 'success');
    },
    [tableScrollRef, columns, columnVisibility, columnOrder, columnAlignments, saveLayoutToStorage]
  );

  const handleResetColumnWidths = useCallback(() => {
    setColumnSizing({});
    setColumnOrder([]);
    setColumnAlignments({});
    const defaultVis: VisibilityState = {};
    columns.forEach((col: any) => {
      const id = col.id || col.accessorKey;
      if (id) defaultVis[id] = true;
    });
    setColumnVisibility(defaultVis);
    if (storageKey) localStorage.removeItem(storageKey);
    showToast('Đã đặt lại giao diện cột về mặc định', 'info');
  }, [columns, storageKey]);

  const handleAutoFitSingleColumn = useCallback(
    (colId: string) => {
      const tableEl = tableScrollRef.current?.querySelector('table');
      if (!tableEl) return;
      const cells = Array.from(tableEl.querySelectorAll(`[data-col-id="${colId}"]`));
      let maxW = 50;
      cells.forEach((c) => {
        const textLen = (c.textContent || '').trim().length;
        const est = Math.max(c.scrollWidth || 0, textLen * 9 + 32);
        if (est > maxW) maxW = est;
      });
      setColumnSizing((prev) => ({ ...prev, [colId]: Math.min(Math.max(maxW + 12, 60), 400) }));
    },
    [tableScrollRef]
  );

  return {
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
  };
}
