import React, { useState } from 'react';
import { VietnameseInput } from '../../../components/input';
import { useConfirm, ChangePasswordModal } from '../../../components/modal';
import { Button } from '../../../components/button';
import { ComponentCard } from '../components/ComponentCard';
import { inputModalSources } from '../sources/inputModalSources';
import { ComponentSourceItem } from '../types';
import { showToast } from '../../../components/Toast';

interface InputsModalsTabProps {
  onViewCode: (item: ComponentSourceItem) => void;
}

export const InputsModalsTab: React.FC<InputsModalsTabProps> = ({ onViewCode }) => {
  const [vietnameseText, setVietnameseText] = useState('Trần Nguyễn Bảo Ngọc');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const confirm = useConfirm();

  const getSource = (id: string) => inputModalSources.find((s) => s.id === id)!;

  const handleTestConfirm = async (type: 'danger' | 'warning' | 'info') => {
    const titles = {
      danger: 'Xác Nhận Xóa Hồ Sơ Học Sinh?',
      warning: 'Lưu Ý: Chưa Lưu Dữ Liệu!',
      info: 'Gửi Thông Báo Bảng Điểm?',
    };
    const messages = {
      danger: 'Thao tác này sẽ xóa vĩnh viễn học sinh cùng toàn bộ lịch sử điểm danh và điểm số liên quan.',
      warning: 'Bạn có các thay đổi chưa được ghi vào cơ sở dữ liệu. Bạn có chắc chắn muốn rời khỏi trang?',
      info: 'Hệ thống sẽ gửi phiếu báo điểm tuần này đến số Zalo của phụ huynh.',
    };

    const confirmed = await confirm({
      title: titles[type],
      message: messages[type],
      confirmText: type === 'danger' ? 'Xác Nhận Xóa' : 'Đồng Ý',
      cancelText: 'Hủy Bỏ',
      type,
    });

    if (confirmed) {
      showToast(`Bạn đã nhấn ĐỒNG Ý (${type.toUpperCase()})!`, 'success');
    } else {
      showToast('Bạn đã nhấn HỦY BỎ.', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. VIETNAMESE INPUT */}
      <ComponentCard item={getSource('input-vietnamese')} onViewCode={onViewCode}>
        <div className="w-full max-w-xl space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Gõ Tiếng Việt Có Dấu (Telex / VNI / IME an toàn, 0 nhảy con trỏ):
            </label>
            <VietnameseInput
              value={vietnameseText}
              onValueChange={setVietnameseText}
              placeholder="Nhập thử: Nguyễn Hoàng Anh Dũng, Đỗ Thị Thu Hiền..."
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-[#181a20] text-slate-900 dark:text-white shadow-xs border-0 outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="p-3 bg-white dark:bg-white/5 rounded-xl text-xs space-y-1">
            <div className="text-slate-400">Kết quả gõ tức thì:</div>
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              {vietnameseText || <span className="text-slate-400 italic">Chưa nhập văn bản</span>}
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Độ dài chuỗi: {vietnameseText.length} ký tự
            </div>
          </div>
        </div>
      </ComponentCard>

      {/* 2. CONFIRM DIALOG */}
      <ComponentCard item={getSource('modal-confirm')} onViewCode={onViewCode}>
        <div className="w-full space-y-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Hộp thoại xác nhận gọi qua hàm <code className="text-blue-600 font-mono">const ok = await confirm(&#123;...&#125;)</code>, 0-lag GPU, solid backdrop:
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="danger" onClick={() => handleTestConfirm('danger')}>
              Thử Xác Nhận Danger (Đỏ)
            </Button>
            <Button variant="outline" onClick={() => handleTestConfirm('warning')}>
              Thử Xác Nhận Warning (Vàng)
            </Button>
            <Button variant="secondary" onClick={() => handleTestConfirm('info')}>
              Thử Xác Nhận Info (Xanh)
            </Button>
          </div>
        </div>
      </ComponentCard>

      {/* 3. CHANGE PASSWORD MODAL */}
      <ComponentCard
        item={{
          id: 'modal-change-password',
          title: 'ChangePasswordModal (Modal Đổi Mật Khẩu)',
          description: 'Hộp thoại đổi mật khẩu tài khoản người dùng với con mắt ẩn/hiện mật khẩu và kiểm tra trùng khớp.',
          category: 'modals',
          dependencies: ['lucide-react'],
          filename: 'ChangePasswordModal.tsx',
          usageCode: `<ChangePasswordModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
/>`,
          sourceCode: `// ChangePasswordModal source code...`,
        }}
        onViewCode={onViewCode}
      >
        <div className="flex items-center gap-4">
          <Button variant="primary" onClick={() => setPasswordModalOpen(true)}>
            Mở Modal Đổi Mật Khẩu Demo
          </Button>

          <ChangePasswordModal
            isOpen={passwordModalOpen}
            onClose={() => setPasswordModalOpen(false)}
          />
        </div>
      </ComponentCard>
    </div>
  );
};
