import React, { useState } from 'react';
import {
  Calendar, Compass, Mail, Music, Calculator, Sparkles, Layers,
  MousePointerClick, FolderTree, Table as TableIcon, BellRing, Droplets,
  Save, Play, FileSpreadsheet, Zap
} from 'lucide-react';
import { AnimatedCalendar } from '../../components/ui/calender';
import { SegmentedButton } from '../../components/ui/segmented-button';
import { Dock, DockItem, DockIcon, DockLabel } from '../../components/ui/dock';
import { FileTree } from '../../components/ui/file-tree';
import { HoverPreviewProvider, HoverPreviewLink } from '../../components/ui/hover-preview';
import { LiquidFillButton, LiquidVariant } from '../../components/ui/liquid-button';
import {
  useAnimatedToast,
  StackedNotifications,
  UndoToast,
  usePromiseToast,
  StackedToast,
} from '../../components/ui/animated-toast';
import { AnimatedTable, SortDirection } from '../../components/ui/animated-table';
import { sampleTreeData, samplePreviewData, tableSampleData, tableColumns, UserData } from './data';

export default function UIShowcasePage() {
  const [activeSubTab, setActiveSubTab] = useState<'calendar' | 'segmented' | 'dock' | 'tree' | 'hover' | 'toast' | 'table' | 'liquid'>('calendar');
  const [liquidFillLevel, setLiquidFillLevel] = useState(65);
  const [selectedLiquidVariant, setSelectedLiquidVariant] = useState<LiquidVariant>('indigo');
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
              Trải nghiệm tương tác trực tiếp bộ 7 component động hiệu ứng cao cấp với theme Dark Space.
            </p>
          </div>
        </div>

        <SegmentedButton
          buttons={[
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

      {/* 0. LIQUID FILL BUTTON TAB */}
      {activeSubTab === 'liquid' && (
        <div className="space-y-6">
          <div className="bg-[#080b14] border border-[#1b2444] p-6 rounded-2xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Droplets size={18} className="text-cyan-400" />
                  <span>Liquid Wave Fill Button (Hiệu Ứng Rót Nước Đầy Cốc)</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Khi rê chuột qua, lớp chất lỏng chuyển động dạng sóng sin dâng từ đáy lên đỉnh như nước đổ vào cốc, tích hợp hiệu ứng khúc xạ phát sáng.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Độ rót thử nghiệm:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={liquidFillLevel}
                  onChange={(e) => setLiquidFillLevel(Number(e.target.value))}
                  className="w-32 accent-[#5c36f5] cursor-pointer"
                />
                <span className="text-xs font-mono font-black text-indigo-400 w-10">{liquidFillLevel}%</span>
              </div>
            </div>

            {/* Live Hover Demo Matrix */}
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase text-slate-400 block tracking-wider">
                1. Tự Động Đổ Đầy Khi Hover (6 Hệ Màu Chất Lỏng)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <LiquidFillButton variant="indigo" icon={<Save size={16} />}>
                  Lưu Bảng Điểm
                </LiquidFillButton>
                <LiquidFillButton variant="cyan" icon={<Droplets size={16} />}>
                  Nước Đại Dương
                </LiquidFillButton>
                <LiquidFillButton variant="emerald" icon={<FileSpreadsheet size={16} />}>
                  Xuất Excel
                </LiquidFillButton>
                <LiquidFillButton variant="amber" icon={<Zap size={16} />}>
                  Smart Predict
                </LiquidFillButton>
                <LiquidFillButton variant="rose" icon={<Sparkles size={16} />}>
                  Mật Nho Ruby
                </LiquidFillButton>
                <LiquidFillButton variant="purple" icon={<Play size={16} />}>
                  Luyện Đề Thi
                </LiquidFillButton>
              </div>
            </div>

            {/* Size Matrix */}
            <div className="space-y-4 pt-2 border-t border-white/5">
              <span className="text-xs font-bold uppercase text-slate-400 block tracking-wider">
                2. Các Kích Thước (Size Matrix)
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <LiquidFillButton size="sm" variant="indigo" icon={<Save size={13} />}>
                  Nhỏ (SM)
                </LiquidFillButton>
                <LiquidFillButton size="md" variant="cyan" icon={<Droplets size={16} />}>
                  Vừa (MD Standard)
                </LiquidFillButton>
                <LiquidFillButton size="lg" variant="purple" icon={<Sparkles size={18} />}>
                  Lớn (LG Hero Action)
                </LiquidFillButton>
              </div>
            </div>

            {/* Controlled Level Bar */}
            <div className="space-y-4 pt-2 border-t border-white/5">
              <span className="text-xs font-bold uppercase text-slate-400 block tracking-wider">
                3. Điều Khiển Mức Chất Lỏng Theo Phần Trăm (Progress Simulation)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-[#0c0f1e] border border-white/10 rounded-2xl space-y-3 flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-300">Theo Slider ({liquidFillLevel}%)</span>
                  <LiquidFillButton
                    variant="indigo"
                    autoFillOnHover={false}
                    fillPercentage={liquidFillLevel}
                    icon={<Droplets size={16} />}
                  >
                    Mức Nước {liquidFillLevel}%
                  </LiquidFillButton>
                </div>
                <div className="p-4 bg-[#0c0f1e] border border-white/10 rounded-2xl space-y-3 flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-300">Đầy 50% (Cyan)</span>
                  <LiquidFillButton
                    variant="cyan"
                    autoFillOnHover={false}
                    fillPercentage={50}
                    icon={<Zap size={16} />}
                  >
                    Đang Tải 50%
                  </LiquidFillButton>
                </div>
                <div className="p-4 bg-[#0c0f1e] border border-white/10 rounded-2xl space-y-3 flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-300">Đầy 90% (Emerald)</span>
                  <LiquidFillButton
                    variant="emerald"
                    autoFillOnHover={false}
                    fillPercentage={90}
                    icon={<Play size={16} />}
                  >
                    Hoàn Tất 90%
                  </LiquidFillButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. ANIMATED CALENDAR TAB */}
      {activeSubTab === 'calendar' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#080b14] border border-[#1b2444] p-6 rounded-2xl">
          <div className="space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Calendar size={18} className="text-indigo-400" />
              <span>Animated Calendar (Inline & Popover)</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Chuyển tháng với hiệu ứng trượt mượt mà (AnimatePresence), ngày được chọn có thanh trượt spring phát sáng.
            </p>
            <div className="p-4 bg-[#0c0f1e] border border-white/10 rounded-2xl space-y-3">
              <span className="text-xs font-bold text-slate-300 block">Dạng Popover Trigger:</span>
              <AnimatedCalendar
                value={selectedDate}
                onChange={setSelectedDate}
                highlightDaysOfWeek={[1, 3, 5]}
                placeholder="Chọn ngày học..."
              />
              {selectedDate && (
                <p className="text-xs text-indigo-300 font-mono font-bold mt-2">
                  Ngày đã chọn: {selectedDate.toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-4 bg-[#0c0f1e] border border-white/10 rounded-2xl">
            <span className="text-xs font-black uppercase text-indigo-400 mb-3 block">Dạng Lịch Inline</span>
            <AnimatedCalendar inline value={selectedDate} onChange={setSelectedDate} highlightDaysOfWeek={[1, 3, 5]} />
          </div>
        </div>
      )}

      {/* 2. SEGMENTED BUTTON TAB */}
      {activeSubTab === 'segmented' && (
        <div className="bg-[#080b14] border border-[#1b2444] p-6 rounded-2xl space-y-6">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Layers size={18} className="text-indigo-400" />
            <span>Segmented Button (Framer Motion Spring Indicator)</span>
          </h3>
          <div className="space-y-4 max-w-xl">
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-2">Kích thước Lớn (Size LG) + Badges:</span>
              <SegmentedButton
                buttons={[
                  { id: 'overview', label: 'Tổng Quan', badge: 12 },
                  { id: 'analytics', label: 'Phân Tích', badge: 'Hot' },
                  { id: 'reports', label: 'Báo Cáo', badge: 3 },
                  { id: 'settings', label: 'Cấu Hình' },
                ]}
                activeId={selectedNavTab}
                onChange={setSelectedNavTab}
                size="lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. DOCK ANIMATION TAB */}
      {activeSubTab === 'dock' && (
        <div className="bg-[#080b14] border border-[#1b2444] p-6 rounded-2xl space-y-6">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Compass size={18} className="text-indigo-400" />
            <span>macOS Dock Magnification Physics</span>
          </h3>
          <div className="flex flex-col items-center justify-center p-12 bg-[#0c0f1e] border border-white/10 rounded-2xl min-h-[220px]">
            <Dock orientation="horizontal" magnification={70} distance={140}>
              <DockItem><DockIcon><Compass /></DockIcon><DockLabel>Safari</DockLabel></DockItem>
              <DockItem><DockIcon><Mail /></DockIcon><DockLabel>Mail</DockLabel></DockItem>
              <DockItem><DockIcon><Calendar /></DockIcon><DockLabel>Calendar</DockLabel></DockItem>
              <DockItem><DockIcon><Music /></DockIcon><DockLabel>Music</DockLabel></DockItem>
              <DockItem><DockIcon><Calculator /></DockIcon><DockLabel>Calculator</DockLabel></DockItem>
            </Dock>
          </div>
        </div>
      )}

      {/* 4. FILE TREE TAB */}
      {activeSubTab === 'tree' && (
        <div className="bg-[#080b14] border border-[#1b2444] p-6 rounded-2xl space-y-6">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <FolderTree size={18} className="text-indigo-400" />
            <span>Animated Recursive File Tree</span>
          </h3>
          <div className="max-w-md">
            <FileTree data={sampleTreeData} selectedId={treeSelectedId} onSelect={(node) => setTreeSelectedId(node.id)} />
          </div>
        </div>
      )}

      {/* 5. HOVER PREVIEW TAB */}
      {activeSubTab === 'hover' && (
        <div className="bg-[#080b14] border border-[#1b2444] p-6 rounded-2xl space-y-6">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <MousePointerClick size={18} className="text-indigo-400" />
            <span>Dynamic Hover Preview Link</span>
          </h3>
          <HoverPreviewProvider data={samplePreviewData} className="p-8 bg-[#0c0f1e] border border-white/10 rounded-2xl">
            <p className="max-w-2xl text-base text-slate-300 leading-relaxed font-semibold">
              Khám phá <HoverPreviewLink previewKey="midjourney">Midjourney</HoverPreviewLink> cho ảnh nghệ thuật, dùng{' '}
              <HoverPreviewLink previewKey="stable">Stable Diffusion</HoverPreviewLink> mã nguồn mở hoặc tạo assets cùng{' '}
              <HoverPreviewLink previewKey="leonardo">Leonardo AI</HoverPreviewLink>.
            </p>
          </HoverPreviewProvider>
        </div>
      )}

      {/* 6. TOAST SUITE TAB */}
      {activeSubTab === 'toast' && (
        <div className="bg-[#080b14] border border-[#1b2444] p-6 rounded-2xl space-y-6">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <BellRing size={18} className="text-indigo-400" />
            <span>Animated Toast Suite</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-[#0c0f1e] border border-white/10 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-white uppercase">1. Stacked Toasts</h4>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => addStackedToast('success')} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold hover:bg-emerald-500/30 cursor-pointer">+ Success</button>
                <button onClick={() => addStackedToast('error')} className="px-3 py-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold hover:bg-rose-500/30 cursor-pointer">+ Error</button>
              </div>
            </div>
            <div className="p-4 bg-[#0c0f1e] border border-white/10 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-white uppercase">2. Undo Toast</h4>
              <button onClick={() => setUndoToastOpen(true)} className="w-full py-2 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-black hover:bg-rose-500/30 cursor-pointer">Xóa Mục & Hiện Hoàn Tác</button>
            </div>
            <div className="p-4 bg-[#0c0f1e] border border-white/10 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-white uppercase">3. Promise Toast</h4>
              <button onClick={handleTestPromise} className="w-full py-2 bg-[#5c36f5] hover:bg-[#7351f7] text-white rounded-xl text-xs font-black transition cursor-pointer shadow-[0_0_14px_rgba(92,54,245,0.5)]">Chạy Async Promise</button>
            </div>
          </div>
          <StackedNotifications toasts={stackedToasts} onRemove={(id) => setStackedToasts((prev) => prev.filter((t) => t.id !== id))} />
          <UndoToast open={undoToastOpen} onClose={() => setUndoToastOpen(false)} onUndo={() => addToast({ title: 'Hoàn tác', message: 'Đã khôi phục dữ liệu!', type: 'success' })} message="Đã xóa mục thành công" />
        </div>
      )}

      {/* 7. ANIMATED TABLE TAB */}
      {activeSubTab === 'table' && (
        <div className="bg-[#080b14] border border-[#1b2444] p-6 rounded-2xl space-y-6">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <TableIcon size={18} className="text-indigo-400" />
            <span>Animated Table</span>
          </h3>
          <AnimatedTable<UserData>
            data={tableSampleData.filter((u) => u.name.toLowerCase().includes(tableSearch.toLowerCase()))}
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
