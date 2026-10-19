import React, { useState } from 'react';
import { Save, Trash2, ArrowRight, Sparkles, Check, Download } from 'lucide-react';
import { Button, SinglePenButton, ZoomButtonGroup, CollapseButton } from '../../../components/button';
import { LiquidFillButton } from '../../../components/ui/liquid-button';
import { ComponentCard } from '../components/ComponentCard';
import { buttonSources } from '../sources/buttonSources';
import { ComponentSourceItem } from '../types';
import { showToast } from '../../../components/Toast';

interface ButtonsTabProps {
  onViewCode: (item: ComponentSourceItem) => void;
}

export const ButtonsTab: React.FC<ButtonsTabProps> = ({ onViewCode }) => {
  const [btnLoading, setBtnLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [liquidLevel, setLiquidLevel] = useState(65);

  const getSource = (id: string) => buttonSources.find((s) => s.id === id)!;

  const handleTestSave = () => {
    setBtnLoading(true);
    setTimeout(() => {
      setBtnLoading(false);
      showToast('Đã lưu dữ liệu thành công!', 'success');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* 1. BUTTON CORE */}
      <ComponentCard item={getSource('button-core')} onViewCode={onViewCode}>
        <div className="w-full space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="primary"
              leftIcon={<Save size={14} />}
              loading={btnLoading}
              onClick={handleTestSave}
            >
              Lưu thay đổi (Primary)
            </Button>
            <Button variant="secondary" onClick={() => showToast('Nhấn Hủy bỏ', 'info')}>
              Hủy bỏ (Secondary)
            </Button>
            <Button
              variant="danger"
              leftIcon={<Trash2 size={14} />}
              onClick={() => showToast('Nhấn Xóa', 'error')}
            >
              Xóa bản ghi (Danger)
            </Button>
            <Button variant="success" leftIcon={<Check size={14} />}>
              Hoàn thành (Success)
            </Button>
            <Button variant="ghost">Xem thêm (Ghost)</Button>
            <Button variant="outline">Đường viền (Outline)</Button>
            <Button variant="white" leftIcon={<Download size={14} />}>
              Tải về (White)
            </Button>
            <Button disabled>Bị khóa (Disabled)</Button>
          </div>

          {/* Sizes */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-200/60 dark:border-white/5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400">Kích thước:</span>
            <Button size="xs" variant="primary">Kích thước XS</Button>
            <Button size="sm" variant="primary">Kích thước SM</Button>
            <Button size="md" variant="primary">Kích thước MD</Button>
            <Button size="lg" variant="primary">Kích thước LG</Button>
            <Button size="icon" variant="primary" title="Nút icon tròn/vuông">
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </ComponentCard>

      {/* 2. SINGLE PEN BUTTON */}
      <ComponentCard item={getSource('button-single-pen')} onViewCode={onViewCode}>
        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Click vào nút bút sửa duy nhất:
          </div>
          <SinglePenButton
            onClick={() => showToast('Mở Modal chỉnh sửa (nút Xóa nằm an toàn bên trong modal)!', 'info')}
            title="Sửa bản ghi học sinh"
          />
        </div>
      </ComponentCard>

      {/* 3. ZOOM BUTTON GROUP */}
      <ComponentCard item={getSource('button-zoom-group')} onViewCode={onViewCode}>
        <div className="flex items-center gap-6 flex-wrap">
          <ZoomButtonGroup
            zoomLevel={zoomLevel}
            setZoomLevel={setZoomLevel}
            setPanOffset={setPanOffset}
          />
          <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
            Tỉ lệ zoom hiện tại: {Math.round(zoomLevel * 100)}% | Pan: ({panOffset.x}, {panOffset.y})
          </div>
        </div>
      </ComponentCard>

      {/* 4. COLLAPSE BUTTON */}
      <ComponentCard item={getSource('button-collapse')} onViewCode={onViewCode}>
        <div className="flex items-center gap-4">
          <CollapseButton
            isCollapsed={isCollapsed}
            onToggle={() => setIsCollapsed(!isCollapsed)}
            size="sm"
          />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Trạng thái: {isCollapsed ? 'Đang Thu Gọn (Click để mở)' : 'Đang Mở Rộng (Click để thu)'}
          </span>
        </div>
      </ComponentCard>

      {/* 5. LIQUID WAVE BUTTON */}
      <ComponentCard
        item={{
          id: 'fx-liquid-btn',
          title: 'LiquidFillButton (Hiệu Ứng Rót Nước Đầy Cốc)',
          description: 'Nút rót nước sóng lỏng với thanh trượt điều chỉnh mức đổ nước từ 0% đến 100%.',
          category: 'buttons',
          dependencies: ['framer-motion'],
          filename: 'liquid-button.tsx',
          usageCode: `<LiquidFillButton level={${liquidLevel}} variant="indigo" icon={<Save size={16} />}>
  Lưu Dữ Liệu (${liquidLevel}%)
</LiquidFillButton>`,
          sourceCode: `// LiquidFillButton source code...`,
        }}
        onViewCode={onViewCode}
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <LiquidFillButton
            variant="indigo"
            icon={<Save size={16} />}
            onClick={() => {
              const next = liquidLevel >= 100 ? 20 : liquidLevel + 20;
              setLiquidLevel(next);
              showToast(`Đã nạp sóng nước lên ${next}%`, 'info');
            }}
          >
            Lưu Dữ Liệu ({liquidLevel}%)
          </LiquidFillButton>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-bold">Mức đầy:</span>
            <input
              type="range"
              min={0}
              max={100}
              value={liquidLevel}
              onChange={(e) => setLiquidLevel(Number(e.target.value))}
              className="w-32 accent-blue-600"
            />
            <span className="text-xs font-mono font-bold text-blue-600">{liquidLevel}%</span>
          </div>
        </div>
      </ComponentCard>
    </div>
  );
};
