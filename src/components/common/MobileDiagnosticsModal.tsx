import React, { useState, useEffect } from 'react';
import {
  Activity,
  Wifi,
  WifiOff,
  Database,
  HardDrive,
  RefreshCw,
  X,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Clock,
  Layers
} from 'lucide-react';
import {
  getMobileEnvironmentInfo,
  getNetworkState,
  testLocalStorageAccess,
  testSupabasePing,
  getMobileCloudLogs,
  clearMobileCloudLogs,
  CloudLogEntry,
  isMobileBrowser
} from '../../lib/mobileDiagnostics';

interface MobileDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerReSync: () => Promise<void> | void;
  cloudSyncStatus: string;
  cloudSyncMessage: string;
  lastSyncTimestamp: string | null;
  candidateCount: number;
}

export const MobileDiagnosticsModal: React.FC<MobileDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  onTriggerReSync,
  cloudSyncStatus,
  cloudSyncMessage,
  lastSyncTimestamp,
  candidateCount,
}) => {
  const [logs, setLogs] = useState<CloudLogEntry[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ ok: boolean; latencyMs: number; status?: number; error?: string } | null>(null);
  const [isResyncing, setIsResyncing] = useState(false);

  const env = getMobileEnvironmentInfo();
  const net = getNetworkState();
  const storage = testLocalStorageAccess();

  const refreshLogs = () => {
    setLogs(getMobileCloudLogs());
  };

  useEffect(() => {
    if (isOpen) {
      refreshLogs();
      const interval = setInterval(refreshLogs, 1500);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handlePing = async () => {
    setIsPinging(true);
    const res = await testSupabasePing('https://cghzoyuzvhybdvipuwtb.supabase.co', 5000);
    setPingResult(res);
    setIsPinging(false);
    refreshLogs();
  };

  const handleManualReSync = async () => {
    setIsResyncing(true);
    try {
      await onTriggerReSync();
    } finally {
      setIsResyncing(false);
      refreshLogs();
    }
  };

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.category}] ${l.event} ${l.details ? JSON.stringify(l.details) : ''}`)
      .join('\n');
    navigator.clipboard?.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-900">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-[#0F1E36] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Mobile Cloud Diagnostics</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black uppercase">
                  Live
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Network transitions, Supabase health & mobile storage monitor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            aria-label="Close Diagnostics"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Status Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Device Card */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-bold">
                {env.isMobile ? <Smartphone className="w-3.5 h-3.5 text-indigo-600" /> : <Laptop className="w-3.5 h-3.5 text-slate-600" />}
                <span>Device</span>
              </div>
              <strong className="block text-slate-900 text-xs font-bold truncate">
                {env.isMobile ? (env.isIOS ? 'Apple iOS' : 'Android') : 'Desktop PC'}
              </strong>
              <span className="text-[10px] text-slate-500 block truncate">{env.screen}</span>
            </div>

            {/* Network Card */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-bold">
                {net.onLine ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-rose-600" />}
                <span>Network</span>
              </div>
              <strong className={`block text-xs font-bold ${net.onLine ? 'text-emerald-700' : 'text-rose-600'}`}>
                {net.onLine ? 'Online' : 'Offline'}
              </strong>
              <span className="text-[10px] text-slate-500 block truncate">
                {net.effectiveType.toUpperCase()} {net.rtt ? `(${net.rtt}ms)` : ''}
              </span>
            </div>

            {/* LocalStorage Card */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-bold">
                <HardDrive className="w-3.5 h-3.5 text-amber-600" />
                <span>Local Storage</span>
              </div>
              <strong className={`block text-xs font-bold ${storage.ok ? 'text-emerald-700' : 'text-rose-600'}`}>
                {storage.ok ? 'Writable' : 'Error'}
              </strong>
              <span className="text-[10px] text-slate-500 block truncate">
                {storage.ok ? 'Quota Normal' : storage.errorName || 'Restricted'}
              </span>
            </div>

            {/* Candidates Card */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-bold">
                <Database className="w-3.5 h-3.5 text-amber-600" />
                <span>Cloud Data</span>
              </div>
              <strong className="block text-slate-900 text-xs font-bold">
                {candidateCount} Dossiers
              </strong>
              <span className="text-[10px] text-emerald-700 font-semibold block truncate">
                Supabase Sync
              </span>
            </div>
          </div>

          {/* Sync Status Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-300 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  cloudSyncStatus === 'synced' ? 'bg-emerald-500 animate-pulse' :
                  cloudSyncStatus === 'failed' ? 'bg-rose-500' : 'bg-amber-500 animate-spin'
                }`} />
                <strong className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                  State: {cloudSyncStatus}
                </strong>
              </div>
              <p className="text-[11px] text-slate-700 font-medium">
                {cloudSyncMessage}
              </p>
              {lastSyncTimestamp && (
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> Last pull: {lastSyncTimestamp}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePing}
                disabled={isPinging}
                className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 font-bold text-xs text-slate-700 shadow-xs flex items-center gap-1.5 transition-all"
                title="Ping Supabase REST endpoint"
              >
                <Zap className={`w-3.5 h-3.5 text-amber-600 ${isPinging ? 'animate-bounce' : ''}`} />
                <span>{isPinging ? 'Pinging...' : 'Ping'}</span>
              </button>

              <button
                onClick={handleManualReSync}
                disabled={isResyncing}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-xs text-slate-950 shadow-xs flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResyncing ? 'animate-spin' : ''}`} />
                <span>{isResyncing ? 'Re-Syncing...' : 'Re-Sync'}</span>
              </button>
            </div>
          </div>

          {/* Ping Result Feedback */}
          {pingResult && (
            <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
              pingResult.ok ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' : 'bg-rose-50 text-rose-900 border border-rose-300'
            }`}>
              <div className="flex items-center gap-2">
                {pingResult.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>
                  Supabase Endpoint: {pingResult.ok ? `Reachable in ${pingResult.latencyMs}ms (HTTP ${pingResult.status || 200})` : `Failed: ${pingResult.error}`}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">cghzoyuzvhybdvipuwtb.supabase.co</span>
            </div>
          )}

          {/* Real-time Diagnostics Log Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-600" />
                <span>Realtime Mobile Event Log ({logs.length})</span>
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLogs}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1"
                >
                  {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => {
                    clearMobileCloudLogs();
                    refreshLogs();
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 text-[11px] font-semibold"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="bg-slate-950 text-slate-200 rounded-2xl p-3 h-52 overflow-y-auto font-mono text-[11px] space-y-1.5 border border-slate-800 shadow-inner">
              {logs.length === 0 ? (
                <p className="text-slate-500 italic py-4 text-center">No logs recorded yet. Listening for events...</p>
              ) : (
                logs.map((l) => (
                  <div key={l.id} className="leading-snug border-b border-slate-900/60 pb-1">
                    <span className="text-slate-500 text-[10px]">[{l.timestamp}] </span>
                    <span className={`font-bold ${
                      l.category === 'NETWORK' ? 'text-sky-400' :
                      l.category === 'SUPABASE' ? 'text-amber-400' :
                      l.category === 'STORAGE' ? 'text-purple-400' :
                      l.category === 'ERROR' ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      [{l.category}]
                    </span>{' '}
                    <span className={`${
                      l.level === 'error' ? 'text-rose-300 font-bold' :
                      l.level === 'warn' ? 'text-amber-300' :
                      l.level === 'success' ? 'text-emerald-300' : 'text-slate-200'
                    }`}>
                      {l.event}
                    </span>
                    {l.details && (
                      <span className="text-slate-400 text-[10px] block pl-3">
                        {typeof l.details === 'object' ? JSON.stringify(l.details) : String(l.details)}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Al-Hera Travels Multi-Device Cloud Sync v4.2
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
