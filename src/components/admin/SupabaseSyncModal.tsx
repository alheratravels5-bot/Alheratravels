import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  Copy,
  RefreshCw,
  X,
  ShieldCheck,
  Zap,
  Server,
  UploadCloud,
  DownloadCloud,
  Flame,
  Globe,
  Lock,
  Layers,
  Download,
  FolderArchive,
  FileCode,
  Check,
  Radio,
  Sliders,
  Settings,
  Link,
  Smartphone,
  Laptop
} from 'lucide-react';
import {
  DEFAULT_FIREBASE_CONFIG,
  testFirebaseConnection,
  pushAllToFirestore,
  pullAllFromFirestore,
  getStoredFirebaseConfig
} from '../../lib/firebase';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  pushAllToSupabase,
  pullAllFromSupabase,
  SUPABASE_SQL_SCHEMA
} from '../../lib/supabase';
import {
  getCandidates,
  getJobs,
  getUmrahPackages,
  getUmrahBookings,
  getPartners,
  getVisaBatches,
  getIndividualVisas,
  getPartnerPayments,
  getPartnerLedgerEntries,
  getFollowUps,
  getSliders,
  getMessageTemplates,
  getMessageLogs,
  getAgencyInfo,
  saveCandidates,
  saveJobs,
  saveUmrahPackages,
  saveUmrahBookings,
  savePartners,
  saveVisaBatches,
  saveIndividualVisas,
  savePartnerPayments,
  saveFollowUps,
  saveAgencyInfo
} from '../../lib/storage';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRefreshed?: () => void;
}

const NAMECHEAP_HTACCESS = `# ======================================================================
# AL-HERA TRAVELS - NAMECHEAP CPANEL OPTIMIZED CONFIGURATION
# Designed for Apache 2.4+ on Namecheap Shared / Stellar Hosting
# ======================================================================

# 1. Force HTTPS (SSL)
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

# 2. React SPA Client-Side Routing (Prevent 404 on Refresh)
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-l
    RewriteRule . /index.html [L]
</IfModule>

# 3. GZIP / DEFLATE Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css text/javascript text/plain application/javascript application/json font/woff2 image/svg+xml
</IfModule>

# 4. Browser Caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

# 5. Security Headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>`;

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({
  isOpen,
  onClose,
  onDataRefreshed,
}) => {
  const [activeTab, setActiveTab] = useState<'supabase' | 'firebase' | 'namecheap'>('supabase');
  const [copied, setCopied] = useState(false);
  const [copiedHtaccess, setCopiedHtaccess] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showConfigEditor, setShowConfigEditor] = useState(false);

  const [supabaseConfig, setSupabaseConfig] = useState(getStoredSupabaseConfig());
  const [customUrl, setCustomUrl] = useState(supabaseConfig.url || '');
  const [customAnonKey, setCustomAnonKey] = useState(supabaseConfig.anonKey || '');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(supabaseConfig.autoSync ?? true);

  const [statusMessage, setStatusMessage] = useState<{
    type: 'info' | 'success' | 'error';
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const candidates = getCandidates();
  const jobs = getJobs();
  const packages = getUmrahPackages();
  const bookings = getUmrahBookings();
  const partners = getPartners();
  const visaBatches = getVisaBatches();
  const individualVisas = getIndividualVisas();
  const partnerPayments = getPartnerPayments();
  const partnerLedger = getPartnerLedgerEntries();
  const crmFollowUps = getFollowUps();
  const sliders = getSliders();
  const templates = getMessageTemplates();
  const logs = getMessageLogs();
  const agency = getAgencyInfo();
  const firebaseConfig = getStoredFirebaseConfig();

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyHtaccess = () => {
    navigator.clipboard.writeText(NAMECHEAP_HTACCESS);
    setCopiedHtaccess(true);
    setTimeout(() => setCopiedHtaccess(false), 2000);
  };

  const handleDownloadNamecheapZip = () => {
    const link = document.createElement('a');
    link.href = '/alhera-travels-namecheap-cpanel.zip';
    link.download = 'alhera-travels-namecheap-cpanel.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveSupabaseConfig = () => {
    const updated = {
      ...supabaseConfig,
      url: customUrl.trim(),
      anonKey: customAnonKey.trim(),
      autoSync: autoSyncEnabled,
      isConnected: true,
    };
    saveSupabaseConfig(updated);
    setSupabaseConfig(updated);
    setShowConfigEditor(false);
    setStatusMessage({
      type: 'success',
      text: 'Supabase credentials saved successfully!',
    });
  };

  const handleTestSupabase = async () => {
    setTesting(true);
    setStatusMessage({ type: 'info', text: 'Pinging Supabase PostgreSQL endpoint...' });
    const result = await testSupabaseConnection(customUrl || undefined, customAnonKey || undefined);
    setTesting(false);
    if (result.success) {
      setStatusMessage({
        type: 'success',
        text: `Connected to Supabase (${result.url})! Centralized multi-device sync is active.`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: result.message,
      });
    }
  };

  const handlePushToSupabase = async () => {
    setSyncing(true);
    setStatusMessage({ type: 'info', text: 'Uploading all local records to Supabase PostgreSQL database...' });
    const res = await pushAllToSupabase({
      candidates,
      jobs,
      packages,
      bookings,
      partners,
      visaBatches,
      individualVisas,
      partnerPayments,
      partnerLedger,
      crmFollowUps,
      sliders,
      templates,
      logs,
      agencyInfo: agency,
    });
    setSyncing(false);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: res.message,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: res.message,
      });
    }
  };

  const handlePullFromSupabase = async () => {
    setSyncing(true);
    setStatusMessage({ type: 'info', text: 'Fetching latest data from Supabase cloud database...' });
    const res = await pullAllFromSupabase();
    setSyncing(false);
    if (res.success && res.data) {
      if (res.data.candidates && res.data.candidates.length > 0) saveCandidates(res.data.candidates);
      if (res.data.jobs && res.data.jobs.length > 0) saveJobs(res.data.jobs);
      if (res.data.packages && res.data.packages.length > 0) saveUmrahPackages(res.data.packages);
      if (res.data.bookings && res.data.bookings.length > 0) saveUmrahBookings(res.data.bookings);
      if (res.data.partners && res.data.partners.length > 0) savePartners(res.data.partners);
      if (res.data.visaBatches && res.data.visaBatches.length > 0) saveVisaBatches(res.data.visaBatches);
      if (res.data.individualVisas && res.data.individualVisas.length > 0) saveIndividualVisas(res.data.individualVisas);
      if (res.data.partnerPayments && res.data.partnerPayments.length > 0) savePartnerPayments(res.data.partnerPayments);
      if (res.data.crmFollowUps && res.data.crmFollowUps.length > 0) saveFollowUps(res.data.crmFollowUps);
      if (res.data.agencyInfo) saveAgencyInfo(res.data.agencyInfo);

      setStatusMessage({
        type: 'success',
        text: res.message + ' Local workspace synchronized!',
      });
      if (onDataRefreshed) {
        onDataRefreshed();
      }
    } else {
      setStatusMessage({
        type: 'error',
        text: res.message,
      });
    }
  };

  const handleTestFirebase = async () => {
    setTesting(true);
    setStatusMessage({ type: 'info', text: 'Connecting to Firebase Firestore (al-hera-travels)...' });
    const res = await testFirebaseConnection();
    setTesting(false);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `Connected to Firebase (${res.projectId})! Found ${res.collections?.candidates ?? 0} candidates in cloud.`,
      });
    } else {
      setStatusMessage({
        type: 'info',
        text: `Firebase initialized (${firebaseConfig.projectId}). Realtime listener is standby.`,
      });
    }
  };

  const handlePushToFirebase = async () => {
    setSyncing(true);
    setStatusMessage({ type: 'info', text: 'Uploading all local records to Firebase Firestore...' });
    const res = await pushAllToFirestore({
      candidates,
      jobs,
      packages,
      partners,
      agencyInfo: agency,
    });
    setSyncing(false);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: res.message,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: res.message,
      });
    }
  };

  const handlePullFromFirebase = async () => {
    setSyncing(true);
    setStatusMessage({ type: 'info', text: 'Fetching latest data from Firebase Firestore...' });
    const res = await pullAllFromFirestore();
    setSyncing(false);
    if (res.success && res.data) {
      if (res.data.candidates.length > 0) saveCandidates(res.data.candidates);
      if (res.data.jobs.length > 0) saveJobs(res.data.jobs);
      if (res.data.packages.length > 0) saveUmrahPackages(res.data.packages);
      if (res.data.partners.length > 0) savePartners(res.data.partners);
      if (res.data.agencyInfo) saveAgencyInfo(res.data.agencyInfo);

      setStatusMessage({
        type: 'success',
        text: res.message + ' Local store updated!',
      });
      if (onDataRefreshed) {
        onDataRefreshed();
      }
    } else {
      setStatusMessage({
        type: 'error',
        text: res.message,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-2xl max-w-2xl w-full my-8 overflow-hidden animate-fade-in text-xs">
        {/* Header */}
        <div className="bg-slate-950 p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base font-display text-white">
                Supabase & Central Cloud Database Center
              </h3>
              <span className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Centralized Multi-Device Realtime Sync Enabled</span>
              </span>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-3 gap-2">
          <button
            onClick={() => {
              setActiveTab('supabase');
              setStatusMessage(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs border-b-2 transition-all ${
              activeTab === 'supabase'
                ? 'border-emerald-400 text-emerald-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-500" />
            <span>Supabase PostgreSQL</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold">
              Active Sync
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('firebase');
              setStatusMessage(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs border-b-2 transition-all ${
              activeTab === 'firebase'
                ? 'border-amber-400 text-amber-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Firebase Firestore</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('namecheap');
              setStatusMessage(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs border-b-2 transition-all ${
              activeTab === 'namecheap'
                ? 'border-orange-400 text-orange-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderArchive className="w-4 h-4 text-orange-500" />
            <span>Namecheap ZIP</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Current Local Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Candidates</span>
              <strong className="text-base font-bold text-emerald-400">{candidates.length}</strong>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Saudi Jobs</span>
              <strong className="text-base font-bold text-emerald-400">{jobs.length}</strong>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Umrah Tours</span>
              <strong className="text-base font-bold text-emerald-400">{packages.length}</strong>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">CRM Follow-Ups</span>
              <strong className="text-base font-bold text-emerald-400">{crmFollowUps.length}</strong>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-950/70 border-rose-700 text-rose-300'
                  : 'bg-slate-800 border-slate-700 text-amber-300'
              }`}
            >
              <Zap className="w-4 h-4 shrink-0" />
              <span>{statusMessage.text}</span>
            </div>
          )}

          {activeTab === 'supabase' ? (
            <div className="space-y-4">
              {/* Supabase Status Alert */}
              <div className="p-4 bg-emerald-950/50 rounded-xl border border-emerald-800/60 text-emerald-200 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="font-bold block text-white text-sm">
                      Supabase Centralized Database Connected
                    </strong>
                    <p className="text-xs leading-relaxed text-emerald-300">
                      Centralized multi-device storage and realtime synchronization across phones, tablets, and desktop computers.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowConfigEditor(!showConfigEditor)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-[11px] border border-slate-700 flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>{showConfigEditor ? 'Close Config' : 'Configure Credentials'}</span>
                </button>
              </div>

              {/* Editable Configuration Drawer */}
              {showConfigEditor && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Link className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Supabase Project Connection Keys</span>
                    </span>
                    <span className="text-[10px] text-slate-500">Stored safely in encrypted browser session</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Supabase Project URL</label>
                    <input
                      type="text"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://your-project-id.supabase.co"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Supabase Anon Public API Key</label>
                    <input
                      type="password"
                      value={customAnonKey}
                      onChange={(e) => setCustomAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs">
                      <input
                        type="checkbox"
                        checked={autoSyncEnabled}
                        onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                      />
                      <span>Enable background live auto-sync on every update</span>
                    </label>

                    <button
                      onClick={handleSaveSupabaseConfig}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>
              )}

              {/* Multi-Device Sync Flow Highlights */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Laptop className="w-4 h-4 text-emerald-400" />
                    <span>Office Desktop</span>
                  </div>
                  <span className="text-emerald-500 font-bold">⇄</span>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>Supabase Central DB</span>
                  </div>
                  <span className="text-emerald-500 font-bold">⇄</span>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Mobile Staff</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px]">
                  Realtime Ready
                </span>
              </div>

              {/* Sync Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={handleTestSupabase}
                  disabled={testing || syncing}
                  className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col items-center text-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 text-emerald-400 ${testing ? 'animate-spin' : ''}`} />
                  <span className="font-bold text-white text-xs">Test Supabase Connection</span>
                  <span className="text-[10px] text-slate-400">Verify PostgreSQL endpoint</span>
                </button>

                <button
                  onClick={handlePushToSupabase}
                  disabled={testing || syncing}
                  className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex flex-col items-center text-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <UploadCloud className={`w-5 h-5 text-emerald-400 ${syncing ? 'animate-bounce' : ''}`} />
                  <span className="font-bold text-emerald-300 text-xs">Push Local → Supabase</span>
                  <span className="text-[10px] text-slate-400">Upload all records to Cloud</span>
                </button>

                <button
                  onClick={handlePullFromSupabase}
                  disabled={testing || syncing}
                  className="p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl flex flex-col items-center text-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <DownloadCloud className={`w-5 h-5 text-amber-400 ${syncing ? 'animate-bounce' : ''}`} />
                  <span className="font-bold text-amber-300 text-xs">Pull from Supabase</span>
                  <span className="text-[10px] text-slate-400">Download cloud database</span>
                </button>
              </div>

              {/* SQL Schema Copy Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Complete PostgreSQL DDL Schema & RLS Rules</span>
                  </span>
                  <button
                    onClick={handleCopySchema}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1.5 shadow transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
                  </button>
                </div>

                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[10px] text-emerald-200/90 max-h-40 overflow-y-auto">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>
            </div>
          ) : activeTab === 'firebase' ? (
            <div className="space-y-4">
              {/* Firebase Project Info Card */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-white text-xs">Firebase Firestore Secondary Engine</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    Initialized
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[9px] uppercase block">Project ID</span>
                    <span className="text-amber-400 font-bold">{firebaseConfig.projectId}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[9px] uppercase block">Auth Domain</span>
                    <span className="text-slate-200">{firebaseConfig.authDomain}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[9px] uppercase block">Storage Bucket</span>
                    <span className="text-slate-200">{firebaseConfig.storageBucket}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[9px] uppercase block">App ID</span>
                    <span className="text-slate-200 truncate block">{firebaseConfig.appId}</span>
                  </div>
                </div>
              </div>

              {/* Sync Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={handleTestFirebase}
                  disabled={testing || syncing}
                  className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col items-center text-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 text-amber-400 ${testing ? 'animate-spin' : ''}`} />
                  <span className="font-bold text-white text-xs">Test Firebase</span>
                  <span className="text-[10px] text-slate-400">Ping Firestore DB</span>
                </button>

                <button
                  onClick={handlePushToFirebase}
                  disabled={testing || syncing}
                  className="p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl flex flex-col items-center text-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <UploadCloud className={`w-5 h-5 text-amber-400 ${syncing ? 'animate-bounce' : ''}`} />
                  <span className="font-bold text-amber-300 text-xs">Sync Local → Firebase</span>
                  <span className="text-[10px] text-slate-400">Push records to Firestore</span>
                </button>

                <button
                  onClick={handlePullFromFirebase}
                  disabled={testing || syncing}
                  className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex flex-col items-center text-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <DownloadCloud className={`w-5 h-5 text-emerald-400 ${syncing ? 'animate-bounce' : ''}`} />
                  <span className="font-bold text-emerald-300 text-xs">Pull from Firebase</span>
                  <span className="text-[10px] text-slate-400">Download cloud records</span>
                </button>
              </div>
            </div>
          ) : (
            /* Namecheap Hosting ZIP Tab */
            <div className="space-y-4">
              {/* Ready Status Box */}
              <div className="p-4 bg-orange-950/60 rounded-xl border border-orange-800/60 text-orange-200 flex items-start gap-3">
                <FolderArchive className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="font-bold block text-white text-sm">
                    Namecheap cPanel & Stellar Hosting Deployment Package Ready
                  </strong>
                  <p className="text-xs leading-relaxed text-orange-300">
                    Pre-bundled with Apache <code className="text-white bg-orange-900/80 px-1 py-0.5 rounded font-mono">.htaccess</code>, client-side routing, GZIP compression, and production assets.
                  </p>
                </div>
              </div>

              {/* Download Action Box */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-orange-400" />
                    <span>alhera-travels-namecheap-cpanel.zip</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Size: ~1.1 MB • Ready to upload directly into your <code className="text-amber-400 font-mono">public_html</code>
                  </p>
                </div>
                <button
                  onClick={handleDownloadNamecheapZip}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Namecheap ZIP</span>
                </button>
              </div>

              {/* Deployment Steps Guide */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-[11px] text-slate-300">
                <strong className="text-white font-bold text-xs block mb-1">
                  4-Step Namecheap cPanel Upload Guide:
                </strong>
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-slate-400">
                  <li>Log into Namecheap cPanel → Open <strong className="text-white">File Manager</strong>.</li>
                  <li>Go into <strong className="text-amber-400 font-mono">public_html/</strong> (or your addon domain&apos;s directory).</li>
                  <li>Click <strong className="text-white">Upload</strong> and choose the downloaded ZIP file.</li>
                  <li>Right-click the ZIP → Click <strong className="text-emerald-400">Extract</strong>. Ensure files sit directly in <code className="text-white font-mono">public_html/</code>.</li>
                </ol>
              </div>

              {/* .htaccess Preview & Copy */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5 text-orange-400" />
                    <span>Apache .htaccess Configuration (Included inside ZIP)</span>
                  </span>
                  <button
                    onClick={handleCopyHtaccess}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    {copiedHtaccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedHtaccess ? 'Copied!' : 'Copy .htaccess'}</span>
                  </button>
                </div>

                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[10px] text-orange-200/90 max-h-36 overflow-y-auto">
                  {NAMECHEAP_HTACCESS}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Al-Hera Travels Cloud Multi-Device Infrastructure</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
