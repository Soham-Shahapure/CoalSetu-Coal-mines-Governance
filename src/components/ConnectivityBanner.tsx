import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { offlineStorage } from '../services/offlineStorage';

interface ConnectivityBannerProps {
  onSyncTriggered?: () => void;
}

export const ConnectivityBanner: React.FC<ConnectivityBannerProps> = ({ onSyncTriggered }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [simulatedOffline, setSimulatedOffline] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);

  const checkPending = () => {
    const queue = offlineStorage.getOfflineQueue();
    setPendingCount(queue.length);
  };

  useEffect(() => {
    const handleOnline = () => {
      if (!simulatedOffline) setIsOnline(true);
      checkPending();
    };
    const handleOffline = () => {
      setIsOnline(false);
      checkPending();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    checkPending();

    const interval = setInterval(checkPending, 3000);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [simulatedOffline]);

  const toggleSimulatedNetwork = () => {
    const nextState = !simulatedOffline;
    setSimulatedOffline(nextState);
    setIsOnline(!nextState);
  };

  const handleManualSync = async () => {
    if (!isOnline) return;
    setSyncing(true);
    try {
      if (onSyncTriggered) {
        await onSyncTriggered();
      }
      checkPending();
    } finally {
      setTimeout(() => setSyncing(false), 600);
    }
  };

  const effectiveOnline = isOnline && !simulatedOffline;

  return (
    <div className="bg-white border-b border-slate-200 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-xs">
      <div className="flex items-center space-x-3">
        {effectiveOnline ? (
          <div className="flex items-center space-x-1.5 text-emerald-700 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            <span>Field Network Online</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 text-amber-800 font-medium">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500"></span>
            <WifiOff className="w-3.5 h-3.5 text-amber-600" />
            <span>Underground Offline (Local Cache Active)</span>
          </div>
        )}

        <div className="hidden sm:inline-block h-3 w-px bg-slate-200" />
        <span className="hidden sm:inline text-slate-500">
          Statutory Standard: <strong className="text-slate-700 font-semibold">G.S.R. 977(E) / Reg. 129(8)</strong>
        </span>
      </div>

      <div className="flex items-center space-x-2">
        {pendingCount > 0 && (
          <span className="bg-amber-50 border border-amber-300 text-amber-800 px-2 py-0.5 rounded flex items-center gap-1 font-semibold animate-pulse">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            {pendingCount} Pending Sync
          </span>
        )}

        <button
          onClick={handleManualSync}
          disabled={!effectiveOnline || syncing}
          className="text-slate-700 hover:text-slate-900 px-2.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center gap-1 transition disabled:opacity-50 text-xs font-medium"
          title="Synchronize local storage with central mine database"
        >
          <RefreshCw className={`w-3 h-3 text-sky-600 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Syncing...' : 'Sync'}</span>
        </button>

        <button
          onClick={toggleSimulatedNetwork}
          className={`px-2.5 py-0.5 rounded border text-[11px] font-medium transition ${
            simulatedOffline
              ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
              : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-200'
          }`}
          title="Toggle underground network disconnect to test offline form resilience"
        >
          {simulatedOffline ? 'Simulating Offline ⚡' : 'Test Offline Mode'}
        </button>
      </div>
    </div>
  );
};
