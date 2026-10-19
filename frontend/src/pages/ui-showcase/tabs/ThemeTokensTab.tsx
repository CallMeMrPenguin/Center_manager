import React, { useState } from 'react';
import { ComponentCard } from '../components/ComponentCard';
import { fxThemeSources } from '../sources/fxThemeSources';
import { ComponentSourceItem } from '../types';
import { getDeterministicClassColor } from '../../../theme';

interface ThemeTokensTabProps {
  onViewCode: (item: ComponentSourceItem) => void;
}

export const ThemeTokensTab: React.FC<ThemeTokensTabProps> = ({ onViewCode }) => {
  const [testClassName, setTestClassName] = useState('12A1 Toán');

  const getSource = (id: string) => fxThemeSources.find((s) => s.id === id)!;

  const testClasses = [
    '12A1 Toán',
    '12A2 Lý',
    '11B1 Hóa',
    '10C1 Tiếng Anh',
    'Lớp Luyện Thi ĐGNL',
    'Lớp Bồi Dưỡng HSG',
  ];

  const brandSwatches = [
    { name: 'Primary Blue', hex: '#2563eb', desc: 'Màu nhận diện thương hiệu chính' },
    { name: 'Success Emerald', hex: '#10b981', desc: 'Trạng thái thành công, điểm giỏi' },
    { name: 'Warning Amber', hex: '#f59e0b', desc: 'Cảnh báo, điểm trung bình' },
    { name: 'Danger Rose', hex: '#ef4444', desc: 'Lỗi hệ thống, điểm yếu, xóa dữ liệu' },
    { name: 'Cyan Info', hex: '#06b6d4', desc: 'Thông tin hệ thống, tải dữ liệu' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. THEME TOKENS & CLASS COLORS */}
      <ComponentCard item={getSource('theme-tokens')} onViewCode={onViewCode}>
        <div className="w-full space-y-6">
          {/* Brand Palette */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
              Bảng Màu Hệ Thống (Brand & Status Tokens)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {brandSwatches.map((sw) => (
                <div key={sw.name} className="p-3 bg-white dark:bg-white/5 rounded-xl shadow-2xs space-y-2">
                  <div className="h-10 rounded-lg shadow-inner" style={{ backgroundColor: sw.hex }} />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                      {sw.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{sw.hex}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 1 Class - 1 Color Rule */}
          <div className="pt-4 border-t border-slate-200/60 dark:border-white/5 space-y-3">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Chuẩn 1 Lớp - 1 Màu Duy Nhất (Single Class Color Standard)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mỗi lớp học nhận đúng 1 màu xác định xuyên suốt ứng dụng (Khớp 100% giữa Lịch học và Lớp học):
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {testClasses.map((cls) => {
                const color = getDeterministicClassColor(cls);
                return (
                  <div
                    key={cls}
                    className="px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs flex items-center gap-1.5"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    {cls}
                  </div>
                );
              })}
            </div>

            {/* Test input */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs font-bold text-slate-500">Thử gõ tên lớp bất kỳ:</span>
              <input
                type="text"
                value={testClassName}
                onChange={(e) => setTestClassName(e.target.value)}
                placeholder="Ví dụ: 10A5 Sinh..."
                className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-white/5 border-0 shadow-2xs text-slate-900 dark:text-white outline-none w-48"
              />
              {testClassName && (() => {
                const color = getDeterministicClassColor(testClassName);
                return (
                  <div
                    className="px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs flex items-center gap-1.5"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    {testClassName}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </ComponentCard>
    </div>
  );
};
