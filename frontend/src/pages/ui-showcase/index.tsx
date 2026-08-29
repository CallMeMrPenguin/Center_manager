import React, { useState } from 'react';
import {
  Calendar, Compass, Sparkles, Layers,
  MousePointerClick, FolderTree, Table as TableIcon, BellRing, Droplets,
  Activity, SunMoon
} from 'lucide-react';
import { AnimatedCalendar } from '../../components/ui/calender';
import { SegmentedButton } from '../../components/ui/segmented-button';
import { Dock, DockItem, DockIcon, DockLabel } from '../../components/ui/dock';
import { FileTree } from '../../components/ui/file-tree';
import { HoverPreviewProvider, HoverPreviewLink } from '../../components/ui/hover-preview';
import {
  useAnimatedToast,
  StackedNotifications,
  UndoToast,
  usePromiseToast,
  StackedToast,
} from '../../components/ui/animated-toast';
import { AnimatedTable, SortDirection } from '../../components/ui/animated-table';
import { sampleTreeData, samplePreviewData, tableSampleData, tableColumns, UserData } from './data';
import { LiquidButtonDemo } from './components/LiquidButtonDemo';
import { BeamDatabaseStatusDemo } from './components/BeamDatabaseStatusDemo';
import { AnimatedThemeToggleDemo } from '../../components/ui/animated-theme-toggle';

export default function UIShowcasePage() {
  const [activeSubTab, setActiveSubTab] = useState<
    'beam' | 'toggle' | 'liquid' | 'calendar' | 'segmented' | 'dock' | 'tree' | 'hover' | 'toast' | 'table'
  >('beam');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedNavTab, setSelectedNavTab] = useState('overview');
  const [treeSelectedId, setTreeSelectedId] = useState('button');
  const [tableSearch, setTableSearch] = useState('');
  const [tableSelectedIds, setTableSelectedIds] = useState<(string | number)[]>([]);
  const [tableSortCol, setTableSortCol] = useState<string | undefined>('name');
  const [tableSortDir, setTableSortDir] = useState<SortDirection>('asc');

  const [undoToastOpen, setUndoToastOpen] = useState(false);
  const [stackedToasts, setStackedToasts] = useState<StackedToast[]>([]);
  const { addToast } = useAnimatedToast();
  const promiseToast = usePromiseToast();

  const addStackedToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    const newToast: StackedToast = {
      id: Math.random().toString(36).substring(2, 9),
      title: `${type.toUpperCase()} Notification`,
      message: `Đây là thông báo ${type} với hiệu ứng xếp chồng 3D mượt mà.`,
      type,
    };
    setStackedToasts((prev) => [newToast, ...prev]);
  };

  const handleTestPromise = async () => {
    await promiseToast({
      promise: new Promise((res) => setTimeout(() => res('Dữ liệu đã được đồng bộ!'), 2000)),
      loading: 'Đang kết nối và đồng bộ máy chủ...',
      success: (data) => `Thành công: ${data}`,
      error: 'Không thể kết nối máy chủ!',
    });
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto select-none">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0c0f1e] border border-white/10 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#5c36f5]/20 text-[#5c36f5] rounded-2xl border border-[#5c36f5]/30">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">UI Component Showcase & Playground</h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Trải nghiệm tương tác trực tiếp bộ component động hiệu ứng cao cấp với theme Dark Space.
            </p>
          </div>
        </div>

        <SegmentedButton
          buttons={[
            { id: 'beam', label: 'Animated Beam', icon: Activity },
            { id: 'toggle', label: 'Theme Toggle', icon: SunMoon },
            { id: 'liquid', label: 'Liquid Button', icon: Droplets },
            { id: 'calendar', label: 'Calendar', icon: Calendar },
            { id: 'segmented', label: 'Segmented', icon: Layers },
            { id: 'dock', label: 'Dock', icon: Compass },
            { id: 'tree', label: 'File Tree', icon: FolderTree },
            { id: 'hover', label: 'Hover Preview', icon: MousePointerClick },
            { id: 'toast', label: 'Toasts', icon: BellRing },
            { id: 'table', label: 'Table', icon: TableIcon },
          ]}
          activeId={activeSubTab}
          onChange={(id) => setActiveSubTab(id as any)}
          fullWidth={false}
          size="sm"
        />
      </div>

      {/* 1. ANIMATED BEAM & DATABASE CONNECTION MONITOR */}
      {activeSubTab === 'beam' && <BeamDatabaseStatusDemo />}

      {/* 2. ANIMATED THEME TOGGLE TAB */}
      {activeSubTab === 'toggle' && <AnimatedThemeToggleDemo />}

      {/* 3. LIQUID FILL BUTTON TAB */}
      {activeSubTab === 'liquid' && <LiquidButtonDemo />}

      {/* 4. ANIMATED CALENDAR TAB */}
      {activeSubTab === 'calendar' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#080b14] border border-[#1b2444] p-6 rounded-2xl">
          <div className="space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Calendar size={18} className="text-indigo-400" />
              <span>Animated Calendar (Inline & Selection)</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Chuyển tháng với hiệu ứng trượt mượt mà (AnimatePresence), ngày được chọn có thanh trượt spring phát sáng.
            </p>
            <div className="p-4 bg-[#0c0f1e] border border-white/10 rounded-2xl space-y-3">
              <span className="text-xs font-bold text-slate-300 block">Dạng Chọn Ngày:</span>
              <div className="text-xs text-indigo-300 font-mono">
                Ngày đã chọn: {selectedDate ? selectedDate.toLocaleDateString('vi-VN') : 'Chưa chọn'}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-4 bg-[#0c0f1e] border border-white/10 rounded-2xl">
            <span className="text-xs font-bold text-slate-400 mb-3 block">Dạng Inline Calendar Grid:</span>
            <AnimatedCalendar value={selectedDate} onChange={setSelectedDate} mode="single" />
          </div>
        </div>
      )}

      {/* 5. SEGMENTED BUTTON TAB */}
      {activeSubTab === 'segmented' && (
        <div className="bg-[#080b14] border border-[#1b2444] p-6 rounded-2xl space-y-6">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Layers size={18} className="text-indigo-400" />
              <span>Sliding Pill Segmented Button</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Thanh trượt vật lý spring pill indicator cực mượt, hỗ trợ icons, badge và responsive.
            </p>
          </div>

          <div className="space-y-4">
            <span className="text-xs font-bold uppercase text-slate-400 block tracking-wider">Kích thước vừa (md):</span>
            <SegmentedButton
              buttons={[
                { id: 'overview', label: 'Tổng Quan' },
                { id: 'analytics', label: 'Phân Tích' },
                { id: 'reports', label: 'Báo Cáo' },
                { id: 'settings', label: 'Cài Đặt' },
              ]}
              activeId={selectedNavTab}
              onChange={setSelectedNavTab}
              size="md"
            />
          </div>
        </div>
      )}

      {/* 6. MACOS DOCK TAB */}
      {activeSubTab === 'dock' && (
        <div className="bg-[#080b14] border border-[#1b2444] p-8 rounded-2xl space-y-8 min-h-[360px] flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Compass size={18} className="text-indigo-400" />
              <span>macOS Interactive Magnification Dock</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Hiệu ứng phóng đại mượt mà khi rê chuột theo khoảng cách con trỏ (framer-motion useMotionValue).
            </p>
          </div>

          <div className="flex justify-center pb-6">
            <Dock>
              <DockItem onClick={() => addToast({ message: 'Mở La Bàn', type: 'info' })}>
                <DockIcon>
                  <Compass className="w-6 h-6 text-blue-400" />
                </DockIcon>
                <DockLabel>La Bàn</DockLabel>
              </DockItem>
              <DockItem onClick={() => addToast({ message: 'Mở Lịch Học', type: 'info' })}>
                <DockIcon>
                  <Calendar className="w-6 h-6 text-purple-400" />
                </DockIcon>
                <DockLabel>Lịch Học</DockLabel>
              </DockItem>
              <DockItem onClick={() => addToast({ message: 'Mở Lớp Học', type: 'info' })}>
                <DockIcon>
                  <Layers className="w-6 h-6 text-emerald-400" />
                </DockIcon>
                <DockLabel>Lớp Học</DockLabel>
              </DockItem>
            </Dock>
          </div>
        </div>
      )}

      {/* 7. FILE TREE TAB */}
      {activeSubTab === 'tree' && (
        <div className="bg-[#080b14] border border-[#1b2444] p-6 rounded-2xl space-y-4">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <FolderTree size={18} className="text-indigo-400" />
            <span>Interactive Animated File Tree</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-[#0c0f1e] border border-white/10 rounded-2xl max-h-[380px] overflow-y-auto">
              <FileTree data={sampleTreeData} selectedId={treeSelectedId} onSelect={(node) => setTreeSelectedId(node.id)} />
            </div>
            <div className="p-4 bg-[#0c0f1e] border border-white/10 rounded-2xl flex flex-col justify-center text-xs space-y-2">
              <span className="font-bold text-slate-400">Node đang chọn:</span>
              <span className="font-mono text-sm text-indigo-400 font-black">{treeSelectedId}</span>
            </div>
          </div>
        </div>
      )}

      {/* 8. HOVER PREVIEW TAB */}
      {activeSubTab === 'hover' && (
        <HoverPreviewProvider data={samplePreviewData}>
          <div className="bg-[#080b14] border border-[#1b2444] p-6 rounded-2xl space-y-6">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <MousePointerClick size={18} className="text-indigo-400" />
                <span>Cursor Hover Preview (Floating Rich Cards)</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Rê chuột lên bất kỳ từ khóa nào dưới đây để xem trước thẻ metadata nổi với hình ảnh và thống kê chi tiết.
              </p>
            </div>

            <div className="p-6 bg-[#0c0f1e] border border-white/10 rounded-2xl leading-relaxed text-sm text-slate-300 space-y-4">
              <p>
                Hệ thống hỗ trợ phân tích điểm số cho học sinh{' '}
                <HoverPreviewLink previewKey="user-alice" className="text-blue-400 font-bold border-b border-blue-400/40 hover:text-blue-300">
                  Alice Johnson
                </HoverPreviewLink>{' '}
                và học sinh{' '}
                <HoverPreviewLink previewKey="user-bob" className="text-purple-400 font-bold border-b border-purple-400/40 hover:text-purple-300">
                  Bob Smith
                </HoverPreviewLink>
                .
              </p>
            </div>
          </div>
        </HoverPreviewProvider>
      )}

      {/* 9. STACKED TOAST TAB */}
      {activeSubTab === 'toast' && (
        <div className="bg-[#080b14] border border-[#1b2444] p-6 rounded-2xl space-y-6">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <BellRing size={18} className="text-indigo-400" />
            <span>Interactive Animated Toasts & Undo Bar</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button type="button" onClick={() => addStackedToast('success')} className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl font-bold text-xs hover:bg-emerald-500/20 cursor-pointer">
              Thêm Success Toast
            </button>
            <button type="button" onClick={() => addStackedToast('error')} className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl font-bold text-xs hover:bg-rose-500/20 cursor-pointer">
              Thêm Error Toast
            </button>
            <button type="button" onClick={() => addStackedToast('warning')} className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl font-bold text-xs hover:bg-amber-500/20 cursor-pointer">
              Thêm Warning Toast
            </button>
            <button type="button" onClick={() => addStackedToast('info')} className="p-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl font-bold text-xs hover:bg-blue-500/20 cursor-pointer">
              Thêm Info Toast
            </button>
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
            <button type="button" onClick={() => setUndoToastOpen(true)} className="px-4 py-2 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 rounded-xl font-bold text-xs hover:bg-indigo-500/30 cursor-pointer">
              Mở Action Undo Toast
            </button>
            <button type="button" onClick={handleTestPromise} className="px-4 py-2 bg-purple-500/20 border border-purple-500/40 text-purple-300 rounded-xl font-bold text-xs hover:bg-purple-500/30 cursor-pointer">
              Thử Promise Toast (2s)
            </button>
          </div>

          <StackedNotifications toasts={stackedToasts} onRemove={(id) => setStackedToasts((prev) => prev.filter((t) => t.id !== id))} />
          <UndoToast open={undoToastOpen} message="Đã xóa bản ghi học sinh." onUndo={() => { setUndoToastOpen(false); addToast({ message: 'Đã hoàn tác xóa thành công!', type: 'success' }); }} onClose={() => setUndoToastOpen(false)} />
        </div>
      )}

      {/* 10. ANIMATED TABLE TAB */}
      {activeSubTab === 'table' && (
        <div className="bg-[#080b14] border border-[#1b2444] p-6 rounded-2xl space-y-4">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <TableIcon size={18} className="text-indigo-400" />
            <span>Interactive Animated Data Table</span>
          </h3>

          <AnimatedTable<UserData>
            data={tableSampleData}
            columns={tableColumns}
            selectable
            selectedIds={tableSelectedIds}
            onSelectionChange={setTableSelectedIds}
            searchable
            searchValue={tableSearch}
            onSearchChange={setTableSearch}
            sortColumn={tableSortCol}
            sortDirection={tableSortDir}
            onSort={(col, dir) => { setTableSortCol(col); setTableSortDir(dir); }}
            expandable
            renderExpandedRow={(row) => (
              <div className="grid grid-cols-3 gap-4 text-xs font-bold text-slate-300 p-2 bg-[#121626] rounded-xl border border-white/5">
                <div>Email: <span className="text-white">{row.email}</span></div>
                <div>Phòng ban: <span className="text-indigo-400">{row.department}</span></div>
                <div>Ngày vào: <span className="text-emerald-400">{row.joinDate}</span></div>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}
