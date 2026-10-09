import React, { useState, useRef, useEffect } from 'react';
import {
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  AlignLeft,
  AlignCenter,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { Table } from '@tanstack/react-table';
import { SegmentedControl } from '../SegmentedControl';
import { getColumnHeaderText } from './types';

interface ColumnVisibilityDropdownProps<TData> {
  table: Table<TData>;
  columnAlignments: Record<string, 'center' | 'left'>;
  onToggleAlignment?: (colId: string) => void;
  onAutoFitColumnWidths?: () => void;
  onResetColumnWidths?: () => void;
  onMoveColumn?: (colId: string, direction: 'up' | 'down') => void;
}

export function ColumnVisibilityDropdown<TData>({
  table,
  columnAlignments,
  onToggleAlignment,
  onAutoFitColumnWidths,
  onResetColumnWidths,
  onMoveColumn,
}: ColumnVisibilityDropdownProps<TData>) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'visibility' | 'order' | 'align'>('visibility');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const allCols = table
    .getAllLeafColumns()
    .filter((col) => col.id !== 'select' && col.id !== '_expander');

  const visibleCount = allCols.filter((col) => col.getIsVisible()).length;

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-[#181a20] dark:hover:bg-[#20232b] text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs border-0 outline-none shrink-0"
        title="Tùy chỉnh cột: Hiện/ẩn, thứ tự, căn chỉnh lề và tự động co giãn"
      >
        <Eye size={13} className="text-blue-500 dark:text-blue-400 shrink-0" />
        <span className="max-w-0 opacity-0 group-hover:max-w-[80px] group-hover:opacity-100 xl:max-w-none xl:opacity-100 transition-all duration-200 ease-in-out whitespace-nowrap overflow-hidden inline-block">
          Cột ({visibleCount}/{allCols.length})
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-[60] w-72 bg-white dark:bg-[#181a20] rounded-2xl shadow-[0_16px_48px_rgba(15,23,42,0.22)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.95)] border border-slate-200 dark:border-white/10 p-3 space-y-2 animate-mac-dropdown">
          {/* TAB SWITCHER */}
          <SegmentedControl<'visibility' | 'order' | 'align'>
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { value: 'visibility', label: 'Hiển Thị' },
              { value: 'order', label: 'Thứ Tự' },
              { value: 'align', label: 'Căn Chỉnh' },
            ]}
            activeColor="bg-[#2563eb]"
            fit="fluid"
            size="xs"
          />

          {/* TAB 1: VISIBILITY */}
          {activeTab === 'visibility' && (
            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-wider border-b border-slate-200 dark:border-white/10 pb-1.5 mb-1 flex items-center justify-between">
                <span>Chọn cột hiển thị</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => table.toggleAllColumnsVisible(true)}
                    className="text-[9px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition cursor-pointer"
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => table.toggleAllColumnsVisible(false)}
                    className="text-[9px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition cursor-pointer"
                  >
                    Ẩn hết
                  </button>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-0.5 scrollbar-thin pr-1">
                {allCols.map((col) => (
                  <label
                    key={col.id}
                    className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-200 cursor-pointer hover:text-slate-900 dark:hover:text-white px-1.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1c1c21] transition"
                  >
                    <input
                      type="checkbox"
                      checked={col.getIsVisible()}
                      onChange={col.getToggleVisibilityHandler()}
                      className="accent-indigo-500 rounded cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="truncate">{getColumnHeaderText(col, table)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: COLUMN ORDER */}
          {activeTab === 'order' && (
            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-wider border-b border-slate-200 dark:border-white/10 pb-1.5 mb-1 flex items-center justify-between">
                <span>Thứ tự các cột</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">Kéo header hoặc bấm nút</span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1 scrollbar-thin pr-1">
                {allCols.map((col, idx) => {
                  const colName = getColumnHeaderText(col, table);
                  const isFirst = idx === 0;
                  const isLast = idx === allCols.length - 1;
                  return (
                    <div
                      key={col.id}
                      className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-slate-100 dark:bg-[#18181b] border-0 shadow-2xs text-xs text-slate-800 dark:text-slate-200"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold w-4">
                          {idx + 1}.
                        </span>
                        <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                          {colName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => onMoveColumn?.(col.id, 'up')}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer"
                          title="Chuyển sang trái"
                        >
                          <ChevronLeft size={12} />
                        </button>
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => onMoveColumn?.(col.id, 'down')}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer"
                          title="Chuyển sang phải"
                        >
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ALIGNMENT */}
          {activeTab === 'align' && (
            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-wider border-b border-slate-200 dark:border-white/10 pb-1.5 mb-1 flex items-center justify-between">
                <span>Căn chỉnh lề nội dung</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">Trái hoặc Giữa</span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1 scrollbar-thin pr-1">
                {allCols.map((col) => {
                  const colName = getColumnHeaderText(col, table);
                  const currentAlign = columnAlignments[col.id] || 'center';
                  return (
                    <div
                      key={col.id}
                      className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-slate-100 dark:bg-[#18181b] border-0 shadow-2xs text-xs text-slate-800 dark:text-slate-200"
                    >
                      <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                        {colName}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleAlignment?.(col.id)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black transition cursor-pointer ${
                          currentAlign === 'center'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        title="Bấm để chuyển đổi giữa Căn giữa và Căn trái"
                      >
                        {currentAlign === 'center' ? (
                          <>
                            <AlignCenter size={11} />
                            <span>Giữa</span>
                          </>
                        ) : (
                          <>
                            <AlignLeft size={11} />
                            <span>Trái</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AUTO-FIT & RESET BUTTONS */}
          <div className="pt-2 border-t border-slate-200 dark:border-white/10 mt-1 space-y-1">
            {onAutoFitColumnWidths && (
              <button
                type="button"
                onClick={() => {
                  onAutoFitColumnWidths();
                  setOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-300 border-0 shadow-2xs text-xs font-extrabold transition cursor-pointer"
                title="Tự động căn chỉnh kích thước các cột theo nội dung"
              >
                <Maximize2 size={12} />
                <span>Tự căn chỉnh kích thước cột</span>
              </button>
            )}
            {onResetColumnWidths && (
              <button
                type="button"
                onClick={() => {
                  onResetColumnWidths();
                  setOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border-0 shadow-2xs text-xs font-extrabold transition cursor-pointer"
                title="Đặt lại độ rộng, thứ tự, căn chỉnh và hiển thị cột về mặc định"
              >
                <RotateCcw size={12} />
                <span>Đặt lại giao diện cột</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
