import React, { useState, useEffect, useRef } from 'react';
import { Bot, Search, User, Zap, Database, Activity, RefreshCw, CheckCircle2 } from 'lucide-react';
import { AnimatedBeam, BeamContainer, BeamNode } from '../../../components/ui/animated-beam';
import { api } from '../../../api';

export function BeamDatabaseStatusDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'error'>('checking');
  const [latency, setLatency] = useState<number | null>(null);
  const [lastCheck, setLastCheck] = useState<string>('');

  const checkConnection = async () => {
    setDbStatus('checking');
    const start = performance.now();
    try {
      await api.getActiveGrades();
      const end = performance.now();
      setLatency(Math.round(end - start));
      setDbStatus('online');
      setLastCheck(new Date().toLocaleTimeString());
    } catch {
      setDbStatus('error');
      setLatency(null);
      setLastCheck(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Live App - Database Connection Metric Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#0c0f1e] border border-[#232f54] rounded-2xl">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            dbStatus === 'online'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : dbStatus === 'checking'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            <Database size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white">Kết Nối Cơ Sở Dữ Liệu SQLite</span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                dbStatus === 'online'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : dbStatus === 'checking'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  dbStatus === 'online' ? 'bg-emerald-400 animate-pulse' : dbStatus === 'checking' ? 'bg-amber-400' : 'bg-rose-400'
                }`} />
                {dbStatus === 'online' ? 'Đang Hoạt Động (Online)' : dbStatus === 'checking' ? 'Đang kiểm tra...' : 'Mất Kết Nối'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>Độ trễ phản hồi: <strong className="text-white font-mono">{latency !== null ? `${latency} ms` : '-'}</strong></span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span>Lần kiểm tra cuối: <strong className="text-slate-300 font-mono">{lastCheck || '-'}</strong></span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={checkConnection}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-xs font-bold text-indigo-300 transition cursor-pointer active:scale-95"
        >
          <RefreshCw size={13} className={dbStatus === 'checking' ? 'animate-spin' : ''} />
          <span>Kiểm Tra Ngay</span>
        </button>
      </div>

      {/* 2. Interactive Animated Beam Diagram */}
      <div className="bg-[#080b14] border border-[#1b2444] p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Activity size={18} className="text-purple-400" />
              <span>Animated Beam Flow (Luồng Truy Vấn & Trả Về Dữ Liệu)</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Mô phỏng đường truyền dữ liệu động với đường cong Bezier và gradient chuyển động theo thời gian thực.
            </p>
          </div>
        </div>

        <BeamContainer
          ref={containerRef}
          className="mx-auto flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#0a0d1a] px-8 py-16 sm:px-14 md:px-20 shadow-[0_12px_40px_rgba(0,0,0,0.8)] min-h-[380px]"
        >
          {/* Node 1: User */}
          <div className="flex flex-col items-center gap-3 shrink-0 z-10">
            <BeamNode
              ref={userRef}
              className="h-16 w-16 border-2 border-blue-500/40 bg-blue-500/10 shadow-[0_0_24px_rgba(59,130,246,0.3)]"
            >
              <User className="h-8 w-8 text-blue-400" />
            </BeamNode>
            <span className="font-extrabold text-xs text-slate-200 uppercase tracking-wider whitespace-nowrap">
              Người Dùng
            </span>
          </div>

          {/* Node 2: AI Agent */}
          <div className="flex flex-col items-center gap-3 shrink-0 z-10">
            <BeamNode
              ref={aiRef}
              className="h-20 w-20 border-2 border-purple-500/40 bg-purple-500/15 shadow-[0_0_30px_rgba(168,85,247,0.35)]"
            >
              <Bot className="h-10 w-10 text-purple-300" />
            </BeamNode>
            <span className="font-extrabold text-xs text-indigo-300 uppercase tracking-wider whitespace-nowrap">
              AI Predict Core
            </span>
          </div>

          {/* Node 3 & 4: Search & Database Result */}
          <div className="flex flex-col gap-14 shrink-0 z-10">
            <div className="flex flex-col items-center gap-3">
              <BeamNode
                ref={searchRef}
                className="h-16 w-16 border-2 border-amber-500/40 bg-amber-500/10 shadow-[0_0_24px_rgba(245,158,11,0.3)]"
              >
                <Search className="h-7 w-7 text-amber-400" />
              </BeamNode>
              <span className="font-extrabold text-xs text-slate-200 uppercase tracking-wider whitespace-nowrap">
                Truy Vấn DB
              </span>
            </div>

            <div className="flex flex-col items-center gap-3">
              <BeamNode
                ref={resultRef}
                className="h-16 w-16 border-2 border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_24px_rgba(16,185,129,0.3)]"
              >
                <Zap className="h-7 w-7 text-emerald-400" />
              </BeamNode>
              <span className="font-extrabold text-xs text-slate-200 uppercase tracking-wider whitespace-nowrap">
                Kết Quả
              </span>
            </div>
          </div>

          {/* Animated Beams connecting nodes */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={userRef}
            toRef={aiRef}
            duration={2.8}
            curvature={0.15}
            gradientStartColor="#3b82f6"
            gradientStopColor="#8b5cf6"
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={aiRef}
            toRef={searchRef}
            duration={2.8}
            delay={0.4}
            curvature={-0.25}
            gradientStartColor="#8b5cf6"
            gradientStopColor="#f59e0b"
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={searchRef}
            toRef={aiRef}
            duration={2.8}
            delay={1.4}
            curvature={-0.25}
            reverse
            gradientStartColor="#f59e0b"
            gradientStopColor="#8b5cf6"
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={aiRef}
            toRef={resultRef}
            duration={2.8}
            delay={2.4}
            curvature={0.25}
            gradientStartColor="#8b5cf6"
            gradientStopColor="#10b981"
          />
        </BeamContainer>
      </div>
    </div>
  );
}

export default BeamDatabaseStatusDemo;
