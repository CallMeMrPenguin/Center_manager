import React, { useState } from 'react';
import { Compass, Calendar, Layers, FolderTree, MousePointerClick } from 'lucide-react';
import { Dock, DockItem, DockIcon, DockLabel } from '../../../components/ui/dock';
import { FileTree } from '../../../components/ui/file-tree';
import { HoverPreviewProvider, HoverPreviewLink } from '../../../components/ui/hover-preview';
import { BeamDatabaseStatusDemo } from '../components/BeamDatabaseStatusDemo';
import { sampleTreeData, samplePreviewData } from '../data';
import { ComponentCard } from '../components/ComponentCard';
import { fxThemeSources } from '../sources/fxThemeSources';
import { ComponentSourceItem } from '../types';
import { showToast } from '../../../components/Toast';

interface SpecialFxTabProps {
  onViewCode: (item: ComponentSourceItem) => void;
}

export const SpecialFxTab: React.FC<SpecialFxTabProps> = ({ onViewCode }) => {
  const [treeSelectedId, setTreeSelectedId] = useState('button');

  const getSource = (id: string) => fxThemeSources.find((s) => s.id === id)!;

  return (
    <div className="space-y-6">
      {/* 1. ANIMATED BEAM DATABASE MONITOR */}
      <ComponentCard
        item={{
          id: 'fx-beam',
          title: 'Animated Beam (Tia Sáng Kết Nối Cơ Sở Dữ Liệu)',
          description: 'Hiệu ứng gradient beam di chuyển mô phỏng luồng đồng bộ giữa Backend FastAPI, SQLite và Cloud Server.',
          category: 'fx',
          dependencies: ['framer-motion'],
          filename: 'animated-beam.tsx',
          usageCode: `<AnimatedBeam containerRef={containerRef} fromRef={div1Ref} toRef={div2Ref} />`,
          sourceCode: `// AnimatedBeam source code...`,
        }}
        onViewCode={onViewCode}
      >
        <div className="w-full">
          <BeamDatabaseStatusDemo />
        </div>
      </ComponentCard>

      {/* 2. MACOS DOCK */}
      <ComponentCard item={getSource('fx-dock')} onViewCode={onViewCode}>
        <div className="w-full flex flex-col items-center justify-center py-4">
          <Dock>
            <DockItem onClick={() => showToast('Mở La Bàn', 'info')}>
              <DockIcon>
                <Compass className="w-6 h-6 text-blue-500" />
              </DockIcon>
              <DockLabel>La Bàn</DockLabel>
            </DockItem>
            <DockItem onClick={() => showToast('Mở Lịch Học', 'info')}>
              <DockIcon>
                <Calendar className="w-6 h-6 text-purple-500" />
              </DockIcon>
              <DockLabel>Lịch Học</DockLabel>
            </DockItem>
            <DockItem onClick={() => showToast('Mở Lớp Học', 'info')}>
              <DockIcon>
                <Layers className="w-6 h-6 text-emerald-500" />
              </DockIcon>
              <DockLabel>Lớp Học</DockLabel>
            </DockItem>
          </Dock>
        </div>
      </ComponentCard>

      {/* 3. FILE TREE & HOVER PREVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ComponentCard
          item={{
            id: 'fx-tree',
            title: 'FileTree (Cây Thư Mục Tương Tác)',
            description: 'Cấu trúc thư mục dạng cây có đóng/mở và highlight node đang chọn.',
            category: 'fx',
            dependencies: ['lucide-react', 'framer-motion'],
            filename: 'file-tree.tsx',
            usageCode: `<FileTree data={sampleTreeData} selectedId={selectedId} onSelect={(node) => setSelectedId(node.id)} />`,
            sourceCode: `// FileTree source code...`,
          }}
          onViewCode={onViewCode}
        >
          <div className="w-full p-2 max-h-60 overflow-y-auto">
            <FileTree
              data={sampleTreeData}
              selectedId={treeSelectedId}
              onSelect={(node) => setTreeSelectedId(node.id)}
            />
          </div>
        </ComponentCard>

        <ComponentCard
          item={{
            id: 'fx-hover-preview',
            title: 'HoverPreviewLink (Thẻ Xem Trước Rê Chuột)',
            description: 'Hover vào đường link hiển thị popover xem trước thông tin rich preview.',
            category: 'fx',
            dependencies: ['framer-motion'],
            filename: 'hover-preview.tsx',
            usageCode: `<HoverPreviewLink previewKey="user-alice">Alice Johnson</HoverPreviewLink>`,
            sourceCode: `// HoverPreviewLink source code...`,
          }}
          onViewCode={onViewCode}
        >
          <HoverPreviewProvider data={samplePreviewData}>
            <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 p-2">
              Rê chuột vào{' '}
              <HoverPreviewLink previewKey="user-alice" className="text-blue-600 font-bold underline">
                Alice Johnson (12A1)
              </HoverPreviewLink>{' '}
              hoặc nền tảng{' '}
              <HoverPreviewLink previewKey="midjourney" className="text-emerald-600 font-bold underline">
                Midjourney AI
              </HoverPreviewLink>{' '}
              để xem trước thẻ thông tin chi tiết.
            </div>
          </HoverPreviewProvider>
        </ComponentCard>
      </div>
    </div>
  );
};
