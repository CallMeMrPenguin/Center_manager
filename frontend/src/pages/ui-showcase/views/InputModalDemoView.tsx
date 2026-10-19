import React, { useState } from 'react';
import { Edit3, AlertCircle, Code2, Copy } from 'lucide-react';
import { VietnameseInput } from '../../../components/input';
import { useConfirm, ChangePasswordModal } from '../../../components/modal';
import { Button } from '../../../components/button';
import { showToast } from '../../../components/Toast';
import { inputModalSources } from '../sources/inputModalSources';
import { ComponentSourceItem } from '../types';

interface InputModalDemoViewProps {
  onViewCode: (item: ComponentSourceItem) => void;
}

export const InputModalDemoView: React.FC<InputModalDemoViewProps> = ({ onViewCode }) => {
  const [vietnameseText, setVietnameseText] = useState('Trần Nguyễn Bảo Ngọc');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const confirm = useConfirm();

  const inputSource = inputModalSources[0]; // VietnameseInput
  const confirmSource = inputModalSources[1]; // ConfirmDialog

  const handleTestConfirm = async (type: 'danger' | 'warning' | 'info') => {
    const isConfirmed = await confirm({
      title: type === 'danger' ? 'Xác Nhận Xóa Hồ Sơ Học Sinh?' : type === 'warning' ? 'Lưu Ý Chưa Lưu Thay Đổi!' : 'Gửi Báo Cáo Zalo Cho Phụ Huynh?',
      message: type === 'danger' ? 'Thao tác này sẽ xóa vĩnh viễn dữ liệu học sinh cùng toàn bộ lịch sử điểm số liên quan.' : type === 'warning' ? 'Bạn có các chỉnh sửa chưa lưu. Bạn có muốn thoát khỏi màn hình?' : 'Hệ thống sẽ gửi phiếu báo điểm học tập tuần này đến số Zalo của phụ huynh.',
      confirmText: type === 'danger' ? 'Xác Nhận Xóa' : 'Đồng Ý Tiếp Tục',
      cancelText: 'Hủy Bỏ',
      type,
    });

    if (isConfirmed) {
      showToast(`Bạn đã nhấn ĐỒNG Ý (${type.toUpperCase()})!`, 'success');
    } else {
      showToast('Bạn đã nhấn HỦY BỎ.', 'info');
    }
  };

  return (
    <div className="bg-white dark:bg-[#141417] border border-slate-200/90 dark:border-[#27272a] p-6 rounded-2xl shadow-sm space-y-8">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Edit3 size={18} className="text-blue-600 dark:text-blue-400" />
            <span>Ô Nhập Liệu Tiếng Việt & Hộp Thoại Xác Nhận (Inputs & Modals)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Bảo đảm trải nghiệm gõ tiếng Việt có dấu chuẩn xác (không mất chữ, không nhảy con trỏ) và hộp thoại xác nhận Promise async với nền solid tối ưu GPU (AGENTS.md Rule 2.5).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onViewCode(inputSource)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer border-0 shadow-2xs"
          >
            <Code2 size={13} />
            <span>Mã Nguồn (VietnameseInput.tsx)</span>
          </button>
        </div>
      </div>

      {/* 1. VIETNAMESE INPUT */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
            1. Ô Nhập Liệu Tiếng Việt (VietnameseInput)
          </h4>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(inputSource.usageCode);
              showToast('Đã chép ví dụ sử dụng VietnameseInput!', 'success');
            }}
            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline border-0 bg-transparent cursor-pointer"
          >
            <Copy size={12} />
            <span>Chép Cách Dùng</span>
          </button>
        </div>

        <div className="p-5 bg-slate-50 dark:bg-[#0c0f1e] rounded-2xl border border-slate-100 dark:border-white/5 space-y-4">
          <div className="w-full max-w-lg">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Gõ thử họ tên, nhận xét giáo viên bằng bộ gõ Telex / VNI:
            </label>
            <VietnameseInput
              value={vietnameseText}
              onValueChange={setVietnameseText}
              placeholder="Nhập thử: Nguyễn Hoàng Anh Dũng, Đỗ Thị Thu Hiền..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-[#181a20] text-slate-900 dark:text-white shadow-xs border-0 outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="p-3 bg-white dark:bg-white/5 rounded-xl text-xs space-y-1">
            <span className="text-slate-400 block text-[11px]">Dữ liệu gõ tức thời (State):</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm block">
              {vietnameseText || <span className="text-slate-400 italic">Chưa nhập văn bản</span>}
            </span>
            <span className="text-[11px] font-mono text-slate-400 block">
              Độ dài chuỗi: {vietnameseText.length} ký tự
            </span>
          </div>
        </div>
      </div>

      {/* 2. CONFIRM DIALOG & MODALS */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
            2. Hộp Thoại Xác Nhận Async (ConfirmDialog / useConfirm)
          </h4>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(confirmSource.usageCode);
                showToast('Đã chép ví dụ sử dụng ConfirmDialog!', 'success');
              }}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline border-0 bg-transparent cursor-pointer"
            >
              <Copy size={12} />
              <span>Chép Cách Dùng</span>
            </button>
            <button
              type="button"
              onClick={() => onViewCode(confirmSource)}
              className="text-xs font-bold text-blue-600 hover:underline border-0 bg-transparent cursor-pointer"
            >
              Xem Mã Nguồn File
            </button>
          </div>
        </div>

        <div className="p-5 bg-slate-50 dark:bg-[#0c0f1e] rounded-2xl border border-slate-100 dark:border-white/5 space-y-4">
          <p className="text-xs text-slate-500">
            Gọi trực tiếp bằng <code className="text-blue-600 font-bold font-mono">const isOk = await confirm(&#123; title, message, type &#125;)</code>, không cần quản lý isOpen thủ công:
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="danger" onClick={() => handleTestConfirm('danger')}>
              Thử Hộp Thoại Danger (Đỏ)
            </Button>
            <Button variant="outline" onClick={() => handleTestConfirm('warning')}>
              Thử Hộp Thoại Warning (Vàng)
            </Button>
            <Button variant="secondary" onClick={() => handleTestConfirm('info')}>
              Thử Hộp Thoại Info (Xanh)
            </Button>
            <Button variant="primary" onClick={() => setPasswordModalOpen(true)}>
              Mở Modal Đổi Mật Khẩu (ChangePasswordModal)
            </Button>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </div>
  );
};
