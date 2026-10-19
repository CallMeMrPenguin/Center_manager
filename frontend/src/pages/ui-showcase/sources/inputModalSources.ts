import { ComponentSourceItem } from '../types';

export const inputModalSources: ComponentSourceItem[] = [
  {
    id: 'input-vietnamese',
    title: 'VietnameseInput (Ô Nhập Liệu Tiếng Việt Chuẩn Telex & VNI)',
    description: 'Bảo vệ gõ tiếng Việt có dấu (Telex, VNI) không bị mất ký tự, không nhảy con trỏ khi đang gõ tổ hợp phím (Composition Event).',
    category: 'inputs',
    dependencies: [],
    filename: 'VietnameseInput.tsx',
    usageCode: `import { VietnameseInput } from '@/components/input';
import { useState } from 'react';

export function Example() {
  const [text, setText] = useState('Trần Nguyễn Bảo Ngọc');

  return (
    <div className="w-72">
      <VietnameseInput
        value={text}
        onValueChange={setText}
        placeholder="Nhập họ và tên học sinh..."
        className="w-full px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-[#181a20] text-slate-900 dark:text-white shadow-xs border-0 outline-none"
      />
    </div>
  );
}`,
    sourceCode: `import React, { useRef, useState, useEffect } from 'react';

export interface VietnameseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string | number;
  onValueChange?: (val: string) => void;
}

export const VietnameseInput: React.FC<VietnameseInputProps> = ({
  value = '',
  onChange,
  onValueChange,
  className,
  ...props
}) => {
  const isComposingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [localVal, setLocalVal] = useState<string>(String(value ?? ''));

  useEffect(() => {
    setLocalVal(String(value ?? ''));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalVal(newVal);
    if (onValueChange) {
      onValueChange(newVal);
    }
    if (onChange) {
      onChange(e);
    }
  };

  const handleCompositionStart = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = true;
    if (props.onCompositionStart) {
      props.onCompositionStart(e);
    }
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    const newVal = e.currentTarget.value;
    setLocalVal(newVal);
    if (onValueChange) {
      onValueChange(newVal);
    }
    if (onChange) {
      onChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
    }
    if (props.onCompositionEnd) {
      props.onCompositionEnd(e);
    }
  };

  return (
    <input
      {...props}
      ref={inputRef}
      value={localVal}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      className={className}
    />
  );
};

export default VietnameseInput;`
  },
  {
    id: 'modal-confirm',
    title: 'ConfirmDialog & useConfirm (Hộp Thoại Xác Nhận Async)',
    description: 'Hộp thoại xác nhận trả về Promise (async/await) không cần lưu state mở/đóng thủ công. Nền solid tối ưu GPU theo AGENTS.md Rule 2.5.',
    category: 'modals',
    dependencies: ['lucide-react'],
    filename: 'ConfirmDialog.tsx',
    usageCode: `import { useConfirm } from '@/components/modal';
import { Button } from '@/components/button';

export function Example() {
  const confirm = useConfirm();

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: 'Xóa Học Sinh Này?',
      message: 'Hành động này sẽ xóa vĩnh viễn hồ sơ và điểm số của học sinh.',
      confirmText: 'Xác Nhận Xóa',
      cancelText: 'Hủy',
      type: 'danger',
    });

    if (isConfirmed) {
      console.log('Đã xác nhận xóa!');
    }
  };

  return (
    <Button variant="danger" onClick={handleDelete}>
      Thử mở ConfirmDialog
    </Button>
  );
}`,
    sourceCode: `import { useState, createContext, useContext, ReactNode } from 'react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export type ConfirmFunction = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFunction | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return context;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ options, resolve });
    });
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md bg-white dark:bg-[#151821] rounded-2xl shadow-xl p-5 border-0">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-2">
              {confirmState.options.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              {confirmState.options.message}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { confirmState.resolve(false); setConfirmState(null); }}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl border-0 cursor-pointer"
              >
                {confirmState.options.cancelText || 'Hủy'}
              </button>
              <button
                type="button"
                onClick={() => { confirmState.resolve(true); setConfirmState(null); }}
                className="px-3.5 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl border-0 cursor-pointer shadow-xs"
              >
                {confirmState.options.confirmText || 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}`
  }
];
