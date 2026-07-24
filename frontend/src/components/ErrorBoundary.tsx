import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-[#08090e] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md bg-[#141824] border border-red-500/30 p-8 rounded-2xl shadow-2xl">
            <h2 className="text-xl font-bold text-red-400 mb-2">Đã Xảy Ra Lỗi Hệ Thống</h2>
            <p className="text-xs text-slate-300 mb-4 font-mono bg-black/40 p-3 rounded-lg overflow-x-auto text-left">
              {this.state.error?.toString()}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs cursor-pointer transition active:scale-95"
            >
              Tải Lại Ứng Dụng
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
