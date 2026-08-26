import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, CloudOff } from 'lucide-react';
import { api } from '../api';

export const SyncIndicator: React.FC = () => {
  const [status, setStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.getSyncStatus();
      if (res) {
        setStatus(res.status);
        if (res.last_synced_at) setLastSyncedAt(res.last_synced_at);
      }
    } catch {
      setStatus('offline');
    }
  }, []);

  const handleTriggerSync = async () => {
    if (isManualSyncing) return;
    try {
      setIsManualSyncing(true);
      setStatus('syncing');
      await api.triggerSync();
      setTimeout(async () => {
        await fetchStatus();
        setIsManualSyncing(false);
      }, 800);
    } catch {
      setStatus('offline');
      setIsManualSyncing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);

    const handleOnline = () => {
      setStatus('syncing');
      api.triggerSync().then(() => fetchStatus());
    };
    const handleOffline = () => setStatus('offline');
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchStatus();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchStatus]);

  const isSyncing = status === 'syncing' || isManualSyncing;

  return (
    <button
      onClick={handleTriggerSync}
      title={
        status === 'offline'
          ? 'Ngoại tuyến (Offline): Dữ liệu được lưu an toàn tại máy và sẽ tự động đồng bộ khi có mạng lại. Bấm để thử lại.'
          : isSyncing
          ? 'Đang đồng bộ với đám mây Supabase...'
          : `Đã đồng bộ an toàn ${lastSyncedAt ? `(${lastSyncedAt.split(' ')[1] || lastSyncedAt})` : ''}. Bấm để ép đồng bộ ngay.`
      }
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all duration-200 cursor-pointer select-none ${
        status === 'offline'
          ? 'bg-[#181318] text-rose-400 border-rose-500/30 hover:bg-rose-950/40'
          : isSyncing
          ? 'bg-[#121626] text-amber-300 border-amber-500/30 hover:bg-amber-950/30'
          : 'bg-[#0d1520] text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/30 hover:border-emerald-500/50'
      }`}
    >
      {isSyncing ? (
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300 shrink-0" />
      ) : status === 'offline' ? (
        <CloudOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
      ) : (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      )}
      <span className="hidden sm:inline">
        {isSyncing ? 'Đang đồng bộ' : status === 'offline' ? 'Ngoại tuyến' : 'Đã đồng bộ'}
      </span>
    </button>
  );
};
