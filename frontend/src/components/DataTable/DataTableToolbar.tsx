import React, { useRef, useState } from 'react';
import { Search, X, CheckSquare, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Table } from '@tanstack/react-table';
import { ExportDropdown } from './ExportDropdown';
import { ColumnVisibilityDropdown } from './ColumnVisibilityDropdown';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  globalFilter: string;
  setGlobalFilter: (val: string) => void;
  enableGlobalSearch: boolean;
  searchPlaceholder: string;
  borderless?: boolean;
  toolbarLeft?: React.ReactNode;
  toolbarRight?: React.ReactNode;
  selectedCount: number;
  totalFiltered: number;
  hasActiveFilter: boolean;
  onClearFilters: () => void;
  useVirt: boolean;
  loading: boolean;
  enableRowSelection: boolean;
  enableExport: boolean;
  enableColumnVisibility: boolean;
  exportFilename: string;
  columnAlignments: Record<string, 'center' | 'left'>;
  onToggleAlignment?: (colId: string) => void;
  onAutoFitColumnWidths?: () => void;
  onResetColumnWidths?: () => void;
  onMoveColumn?: (colId: string, direction: 'up' | 'down') => void;
  onExportExcel?: () => void;
  onExportDocx?: () => void;
  onExportPdf?: () => void;
  onExportPng?: () => void;
}

export function DataTableToolbar<TData>({
  table,
  globalFilter,
  setGlobalFilter,
  enableGlobalSearch,
  searchPlaceholder,
  borderless,
  toolbarLeft,
  toolbarRight,
  selectedCount,
  totalFiltered,
  hasActiveFilter,
  onClearFilters,
  useVirt,
  loading,
  enableRowSelection,
  enableExport,
  enableColumnVisibility,
  exportFilename,
  columnAlignments,
  onToggleAlignment,
  onAutoFitColumnWidths,
  onResetColumnWidths,
  onMoveColumn,
  onExportExcel,
  onExportDocx,
  onExportPdf,
  onExportPng,
}: DataTableToolbarProps<TData>) {
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`shrink-0 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3 ${
        borderless
          ? 'bg-transparent border-b-0'
          : 'bg-white dark:bg-[#111728] border-b border-slate-200 dark:border-white/10'
      }`}
    >
      {/* Left: Search + selection + left controls */}
      <div className="flex items-center gap-2 flex-1 min-w-[200px] flex-wrap">
        {enableGlobalSearch && (
          <motion.div
            layout
            className="relative flex-1 min-w-[160px] max-w-xs"
          >
            <motion.div
              animate={{
                scale: searchFocused ? 1.1 : 1,
                rotate: searchFocused ? -8 : 0,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
            >
              <Search
                size={14}
                className={`transition-colors duration-200 ${
                  searchFocused
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              />
            </motion.div>
            <input
              ref={searchInputRef}
              type="text"
              value={globalFilter}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={searchPlaceholder}
              className={`w-full ${
                borderless
                  ? 'bg-slate-100/90 dark:bg-white/5 border-0 shadow-none'
                  : 'bg-slate-50 dark:bg-[#1c1c21] border border-slate-200 dark:border-white/10 shadow-2xs'
              } text-slate-900 dark:text-white text-xs rounded-xl pl-8 pr-8 py-1.5 focus:outline-none focus:border-[#2563eb] focus:bg-white focus:ring-2 focus:ring-[#2563eb]/25 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-semibold transition`}
            />
            {!globalFilter && !searchFocused && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded pointer-events-none select-none">
                /
              </span>
            )}
            <AnimatePresence>
              {globalFilter && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="button"
                  onClick={() => setGlobalFilter('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-white/10"
                >
                  <X size={12} />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}
        {toolbarLeft}

        {/* Selection Count Badge */}
        <AnimatePresence>
          {selectedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: -10 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-700 dark:text-blue-300 border-0 shadow-2xs rounded-xl text-xs font-black"
            >
              <span>Đã chọn: {selectedCount} dòng</span>
              <button
                type="button"
                onClick={() => table.toggleAllRowsSelected(false)}
                className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-white transition cursor-pointer p-0.5 rounded hover:bg-white/10"
                title="Bỏ chọn tất cả"
              >
                <X size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Badges + ToolbarRight + Export + Column Visibility */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        {/* Active filter badge */}
        {hasActiveFilter && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-500/10 border-0 shadow-2xs text-blue-700 dark:text-blue-300 text-[10px] font-bold">
            <span>{totalFiltered.toLocaleString()} kết quả</span>
            <button
              type="button"
              onClick={onClearFilters}
              className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-white cursor-pointer"
            >
              <X size={10} />
            </button>
          </div>
        )}

        {/* Virtualizer badge */}
        {useVirt && !loading && (
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border-0 shadow-2xs text-amber-500 dark:text-amber-300 text-[10px] font-bold">
            <Zap size={10} />
            <span>Virtual</span>
          </div>
        )}

        {/* Row selection badge */}
        {enableRowSelection && selectedCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border-0 shadow-2xs text-emerald-600 dark:text-emerald-300 text-[10px] font-bold">
            <CheckSquare size={10} />
            <span>{selectedCount} đã chọn</span>
            <button
              type="button"
              onClick={() => table.resetRowSelection()}
              className="text-emerald-500 hover:text-emerald-700 dark:hover:text-white cursor-pointer"
            >
              <X size={10} />
            </button>
          </div>
        )}

        {toolbarRight}

        {enableExport && (
          <ExportDropdown<TData>
            table={table}
            filename={exportFilename}
            onExportExcel={onExportExcel}
            onExportPdf={onExportPdf}
            onExportDocx={onExportDocx}
            onExportPng={onExportPng}
          />
        )}

        {enableColumnVisibility && (
          <ColumnVisibilityDropdown<TData>
            table={table}
            columnAlignments={columnAlignments}
            onToggleAlignment={onToggleAlignment}
            onAutoFitColumnWidths={onAutoFitColumnWidths}
            onResetColumnWidths={onResetColumnWidths}
            onMoveColumn={onMoveColumn}
          />
        )}
      </div>
    </div>
  );
}
