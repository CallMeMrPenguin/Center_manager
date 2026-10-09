import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DraggableHeaderProps {
  header: any;
  children: React.ReactNode;
  enableReorder: boolean;
  enableColumnResizing: boolean;
  align?: 'center' | 'left';
  isAnyColumnResizing?: boolean;
  onAutoFitColumn?: (colId: string) => void;
}

export function DraggableHeader({
  header,
  children,
  enableReorder,
  enableColumnResizing,
  align = 'center',
  isAnyColumnResizing = false,
  onAutoFitColumn,
}: DraggableHeaderProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: header.id,
    disabled: !enableReorder || isAnyColumnResizing,
  });

  const isPinned = header.column.getIsPinned();
  const isResizing = header.column.getIsResizing();

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isResizing || isAnyColumnResizing ? 'none' : transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 100 : undefined,
    position: 'relative',
    ...(isPinned === 'left'
      ? {
          position: 'sticky',
          left: header.column.getStart('left'),
          zIndex: 10,
          boxShadow: '2px 0 6px rgba(0,0,0,0.5)',
        }
      : {}),
    ...(isPinned === 'right'
      ? {
          position: 'sticky',
          right: header.column.getAfter('right'),
          zIndex: 10,
          boxShadow: '-2px 0 6px rgba(0,0,0,0.5)',
        }
      : {}),
  };

  const isCustomHeader = typeof header.column.columnDef.header === 'function';

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={`select-none relative border-b-2 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#151c2e] font-bold sm:font-extrabold text-slate-800 dark:text-slate-100 ${
        isPinned ? 'bg-slate-50 dark:bg-[#151c2e]' : ''
      }`}
    >
      {/* Draggable Title Area */}
      <div
        {...(enableReorder ? { ...attributes, ...listeners } : {})}
        style={{ touchAction: enableReorder ? 'none' : 'auto' }}
        className={`group flex items-center ${
          align === 'left' ? 'justify-start text-left' : 'justify-center text-center'
        } gap-1.5 w-full py-2 px-1 text-slate-900 dark:text-slate-100 font-bold sm:font-extrabold text-xs sm:text-sm ${
          isCustomHeader ? 'overflow-visible' : 'tracking-normal whitespace-nowrap overflow-hidden'
        } ${
          enableReorder
            ? 'cursor-grab active:cursor-grabbing hover:text-blue-600 dark:hover:text-white transition-colors'
            : ''
        }`}
        title={enableReorder ? 'Giữ chuột và kéo để thay đổi thứ tự cột' : undefined}
      >
        {children}
      </div>

      {/* Resize handle */}
      {enableColumnResizing && header.column.getCanResize() && (
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            header.getResizeHandler()(e);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            header.getResizeHandler()(e);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onAutoFitColumn?.(header.column.id);
          }}
          title="Kéo để thay đổi độ rộng | Nhấp đúp để tự vừa nội dung"
          className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize select-none touch-none z-30 flex items-center justify-center group/resize"
        >
          <div
            className={`w-1 h-full transition-colors ${
              header.column.getIsResizing()
                ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]'
                : 'bg-transparent group-hover/resize:bg-indigo-400/80'
            }`}
          />
        </div>
      )}
    </th>
  );
}
