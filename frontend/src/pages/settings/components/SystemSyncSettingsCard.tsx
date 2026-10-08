import React, { useState, useEffect } from 'react';
import { Database, Cloud, RefreshCw, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../../api';
import { showToast } from '../../../components/Toast';

export const SystemSyncSettingsCard: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<{
    status: 'synced' | 'syncing' | 'offline';
    last_synced_at: string | null;
    syncing: boolean;
    last_error?: string | null;
  } | null>(null);

  const [triggering, setTriggering] = useState(false);
  const [syncingFull, setSyncingFull] = useState(false);
  const [syncingAccounts, setSyncingAccounts] = useState(false);

  const fetchStatus = async () => {
    try {
      const data = await api.getSyncStatus();
      setSyncStatus(data);
    } catch {
      setSyncStatus({ status: 'offline', last_synced_at: null, syncing: false });
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerSync = async () => {
    setTriggering(true);
    try {
      await api.triggerSync();
      showToast('Đã bắt đầu đồng bộ hóa dữ liệu với máy chủ VPS!', 'success');
      await fetchStatus();
    } catch (e: any) {
      showToast('Lỗi khi đồng bộ dữ liệu: ' + (e.message || e), 'error');
    } finally {
      setTriggering(false);
    }
  };

  const handleFullSync = async () => {
    setSyncingFull(true);
    try {
      await api.runFullSync();
      showToast('Đồng bộ toàn diện 2 chiều hoàn tất thành công!', 'success');
      await fetchStatus();
    } catch (e: any) {
      showToast('Lỗi đồng bộ toàn diện: ' + (e.message || e), 'error');
    } finally {
      setSyncingFull(false);
    }
  };

  const handleSyncAllAccounts = async () => {
    setSyncingAccounts(true);
    try {
      const resStaff = await api.syncStaffAccounts();
      const resStudents = await api.syncStudentAccounts();
      const staffCount = resStaff?.total_teachers ?? resStaff?.created ?? 0;
      const studentCount = resStudents?.total_students ?? resStudents?.created ?? 0;
      showToast(`Đã đồng bộ tài khoản cho ${staffCount} nhân sự và ${studentCount} học sinh!`, 'success');
    } catch (e: any) {
      showToast('Lỗi đồng bộ tài khoản: ' + (e.message || e), 'error');
    } finally {
      setSyncingAccounts(false);
    }
  };

  const isSyncing = syncStatus?.syncing || triggering || syncingFull;

  return (
    <div className="bg-white dark:bg-[#111728] border-0 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database size={18} className="text-blue-500" />
            <span>Hệ Thống Cơ Sở Dữ Liệu & Đồng Bộ VPS</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý trạng thái lưu trữ Offline-First, đồng bộ đám mây PostgreSQL VPS và tự động cập nhật tài khoản.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs border-0 transition cursor-pointer disabled:opacity-50 active:scale-95"
            title="Đồng bộ nhanh"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng Bộ Ngay'}</span>
          </button>

          <button
            type="button"
            onClick={handleFullSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs border-0 transition cursor-pointer disabled:opacity-50 active:scale-95"
            title="Đồng bộ 2 chiều toàn diện"
          >
            <Cloud size={13} />
            <span>{syncingFull ? 'Đang đồng bộ...' : 'Đồng Bộ 2 Chiều'}</span>
          </button>
        </div>
      </div>

      {/* Grid of status cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 dark:bg-[#151c30] rounded-xl p-4 space-y-1.5">
          <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400 block">
            Cơ Sở Dữ Liệu Cục Bộ
          </span>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SQLite Offline-First (Đang kết nối)</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Truy xuất siêu tốc 0ms, tự động lưu trên máy chủ và thiết bị cục bộ.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-[#151c30] rounded-xl p-4 space-y-1.5">
          <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400 block">
            Bảo Mật & Mã Hóa
          </span>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
            <KeyRound size={14} />
            <span>Mã hóa SHA-256</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Mật khẩu và phiên đăng nhập được băm an toàn theo tiêu chuẩn quân sự.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-[#151c30] rounded-xl p-4 space-y-1.5">
          <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400 block">
            Trạng Thái Máy Chủ VPS
          </span>
          <div className="flex items-center gap-2 font-bold text-xs">
            {syncStatus?.status === 'synced' ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={14} />
                <span>Đã đồng bộ đám mây</span>
              </span>
            ) : syncStatus?.status === 'syncing' ? (
              <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                <RefreshCw size={14} className="animate-spin" />
                <span>Đang đồng bộ...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <AlertCircle size={14} />
                <span>Chế độ ngoại tuyến / Cục bộ</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {syncStatus?.last_synced_at
              ? `Lần cuối: ${syncStatus.last_synced_at.slice(0, 19).replace('T', ' ')}`
              : 'Sẵn sàng tự động đồng bộ khi có kết nối mạng.'}
          </p>
        </div>
      </div>

      {/* Account Auto-Sync Control Box */}
      <div className="bg-slate-50 dark:bg-[#151c30] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
            Tự Động Đồng Bộ Tài Khoản Nhân Sự & Học Sinh
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Tạo tài khoản đăng nhập cho toàn bộ giáo viên, trợ giảng và học sinh chưa có tài khoản trong hệ thống.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSyncAllAccounts}
          disabled={syncingAccounts}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white/10 dark:hover:bg-white/15 dark:text-white border-0 transition cursor-pointer disabled:opacity-50 active:scale-95"
        >
          <RefreshCw size={13} className={syncingAccounts ? 'animate-spin' : ''} />
          <span>{syncingAccounts ? 'Đang đồng bộ tài khoản...' : 'Đồng Bộ Toàn Bộ Tài Khoản'}</span>
        </button>
      </div>
    </div>
  );
};
