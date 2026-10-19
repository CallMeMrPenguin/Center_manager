import React, { useState } from 'react';
import { Palette, Code2, Copy } from 'lucide-react';
import { getDeterministicClassColor } from '../../../theme';
import { showToast } from '../../../components/Toast';
import { fxThemeSources } from '../sources/fxThemeSources';
import { ComponentSourceItem } from '../types';

interface ThemeTokensDemoViewProps {
  onViewCode: (item: ComponentSourceItem) => void;
}

export const ThemeTokensDemoView: React.FC<ThemeTokensDemoViewProps> = ({ onViewCode }) => {
  const [testClassName, setTestClassName] = useState('12A1 Toán');
  const tokenSource = fxThemeSources[0]; // tokens.ts

  const testClasses = [
    '12A1 Toán',
    '12A2 Lý',
    '11B1 Hóa',
    '10C1 Tiếng Anh',
    'Lớp Luyện Thi ĐGNL',
    'Lớp Bồi Dưỡng HSG',
    '11A4 Sinh',
    '10B2 Tin Học',
  ];

  const brandSwatches = [
    { name: 'Primary Blue', hex: '#2563eb', desc: 'Màu nhận diện thương hiệu chính' },
    { name: 'Success Emerald', hex: '#10b981', desc: 'Trạng thái thành công, điểm giỏi' },
    { name: 'Warning Amber', hex: '#f59e0b', desc: 'Cảnh báo, điểm trung bình' },
    { name: 'Danger Rose', hex: '#ef4444', desc: 'Lỗi hệ thống, điểm yếu, xóa dữ liệu' },
    { name: 'Cyan Info', hex: '#06b6d4', desc: 'Thông tin hệ thống, đồng bộ' },
  ];

  return (
    <div className="bg-white dark:bg-[#141417] border border-slate-200/90 dark:border-[#27272a] p-6 rounded-2xl shadow-sm space-y-8">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Palette size={18} className="text-blue-600 dark:text-blue-400" />
            <span>Màu Sắc & Tokens Hệ Thống (tokens.ts & Single Class Color)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Nguồn chân lý duy nhất (Single Source of Truth) theo AGENTS.md Rule 3.7 & Rule 10.1: Quản lý tập trung toàn bộ token màu sắc, đảm bảo 1 lớp có đúng 1 màu duy nhất xuyên suốt ứng dụng.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(tokenSource.usageCode);
              showToast('Đã chép ví dụ sử dụng tokens.ts!', 'success');
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 transition cursor-pointer border-0 shadow-2xs"
          >
            <Copy size={13} />
            <span>Chép Cách Dùng</span>
          </button>
          <button
            type="button"
            onClick={() => onViewCode(tokenSource)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer border-0 shadow-2xs"
          >
            <Code2 size={13} />
            <span>Mã Nguồn (tokens.ts)</span>
          </button>
        </div>
      </div>

      {/* 1. BRAND PALETTES */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
          1. Bảng Màu Hệ Thống (Brand & Status Tokens)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {brandSwatches.map((sw) => (
            <div key={sw.name} className="p-3 bg-slate-50 dark:bg-[#0c0f1e] rounded-xl border border-slate-100 dark:border-white/5 space-y-2">
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

      {/* 2. SINGLE CLASS COLOR RULE */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
            2. Quy Chuẩn 1 Lớp - 1 Màu Duy Nhất (Single Class Color Standard)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Màu của lớp trong Lịch Học (`schedule`) và Lớp Học (`classes`) khớp nhau 100% nhờ thuật toán băm chuỗi cố định:
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 p-4 bg-slate-50 dark:bg-[#0c0f1e] rounded-2xl border border-slate-100 dark:border-white/5">
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

        {/* Live input test */}
        <div className="flex items-center gap-3 pt-1">
          <span className="text-xs font-bold text-slate-500">Thử nghiệm lớp mới:</span>
          <input
            type="text"
            value={testClassName}
            onChange={(e) => setTestClassName(e.target.value)}
            placeholder="Gõ tên lớp bất kỳ..."
            className="px-3.5 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-white/5 border-0 shadow-2xs text-slate-900 dark:text-white outline-none w-56 font-bold"
          />
          {testClassName && (() => {
            const color = getDeterministicClassColor(testClassName);
            return (
              <div
                className="px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs flex items-center gap-1.5"
                style={{ backgroundColor: `${color}18`, color }}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span>{testClassName} ({color})</span>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
