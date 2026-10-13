/**
 * Mobile Cloud Diagnostics & Network Readiness Engine
 * Specialized utility for debugging and hardening mobile browser data fetching,
 * network state transitions, Supabase connectivity, and localStorage accessibility.
 */

export interface MobileEnvironmentInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isStandalone: boolean;
  platform: string;
  userAgent: string;
  screen: string;
  touchPoints: number;
}

export interface NetworkStateInfo {
  onLine: boolean;
  effectiveType: string;
  downlink: number | null;
  rtt: number | null;
  saveData: boolean;
  timestamp: string;
}

export interface LocalStorageDiagnostic {
  ok: boolean;
  canRead: boolean;
  canWrite: boolean;
  canRemove: boolean;
  error?: string;
  errorName?: string;
  quotaExceeded: boolean;
  securityRestricted: boolean;
}

export interface CloudLogEntry {
  id: string;
  timestamp: string;
  category: 'NETWORK' | 'SUPABASE' | 'STORAGE' | 'HYDRATION' | 'DEVICE' | 'ERROR';
  event: string;
  level: 'info' | 'warn' | 'error' | 'success';
  details?: any;
}

// Rolling in-memory log buffer (stores last 100 entries for on-device inspection)
const MAX_LOG_ENTRIES = 100;
const cloudLogBuffer: CloudLogEntry[] = [];

/**
 * Detects whether the current client is a mobile device or tablet.
 */
export function isMobileBrowser(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  const ua = navigator.userAgent || '';
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS|FxiOS/i;
  const hasTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  const isNarrowScreen = window.innerWidth <= 820;

  return mobileRegex.test(ua) || (hasTouch && isNarrowScreen);
}

/**
 * Gathers complete device and browser telemetry.
 */
export function getMobileEnvironmentInfo(): MobileEnvironmentInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      isSafari: false,
      isChrome: false,
      isFirefox: false,
      isStandalone: false,
      platform: 'unknown',
      userAgent: 'unknown',
      screen: '0x0',
      touchPoints: 0,
    };
  }

  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isChrome = /Chrome|CriOS/i.test(ua) && !/Edge|OPR/i.test(ua);
  const isFirefox = /Firefox|FxiOS/i.test(ua);
  const isStandalone = !!(
    (window.navigator as any).standalone ||
    window.matchMedia?.('(display-mode: standalone)').matches
  );

  return {
    isMobile: isMobileBrowser(),
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    isFirefox,
    isStandalone,
    platform: navigator.platform || 'unknown',
    userAgent: ua,
    screen: `${window.innerWidth}x${window.innerHeight} (dpr: ${window.devicePixelRatio || 1})`,
    touchPoints: navigator.maxTouchPoints || 0,
  };
}

/**
 * Reads the current client network and connection information.
 */
export function getNetworkState(): NetworkStateInfo {
  const onLine = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const conn = typeof navigator !== 'undefined' ? (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection : null;

  return {
    onLine,
    effectiveType: conn?.effectiveType || (onLine ? 'online' : 'offline'),
    downlink: conn?.downlink ?? null,
    rtt: conn?.rtt ?? null,
    saveData: !!conn?.saveData,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Tests localStorage access and diagnoses mobile-specific errors (Private Browsing, Quota, etc.).
 */
export function testLocalStorageAccess(): LocalStorageDiagnostic {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return {
      ok: false,
      canRead: false,
      canWrite: false,
      canRemove: false,
      error: 'localStorage is not available in this environment',
      errorName: 'ReferenceError',
      quotaExceeded: false,
      securityRestricted: true,
    };
  }

  const testKey = '__al_hera_mobile_test__' + Date.now();
  const testVal = 'test_payload_' + Math.random().toString(36).substring(2);

  try {
    localStorage.setItem(testKey, testVal);
    const readBack = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);

    if (readBack !== testVal) {
      return {
        ok: false,
        canRead: false,
        canWrite: true,
        canRemove: true,
        error: 'localStorage read verification failed: read value does not match written value',
        quotaExceeded: false,
        securityRestricted: false,
      };
    }

    return {
      ok: true,
      canRead: true,
      canWrite: true,
      canRemove: true,
      quotaExceeded: false,
      securityRestricted: false,
    };
  } catch (err: any) {
    const errorName = err?.name || 'StorageError';
    const errorMsg = err?.message || String(err);
    const quotaExceeded = errorName === 'QuotaExceededError' || errorName === 'NS_ERROR_DOM_QUOTA_REACHED';
    const securityRestricted = errorName === 'SecurityError' || errorName === 'NotAllowedError';

    return {
      ok: false,
      canRead: false,
      canWrite: false,
      canRemove: false,
      error: errorMsg,
      errorName,
      quotaExceeded,
      securityRestricted,
    };
  }
}

/**
 * Pings Supabase to measure live connection health and latency.
 */
export async function testSupabasePing(url: string, timeoutMs: number = 7000): Promise<{
  ok: boolean;
  latencyMs: number;
  status?: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // Supabase health or rest root endpoint
    const pingEndpoint = url.replace(/\/$/, '') + '/rest/v1/';
    const response = await fetch(pingEndpoint, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    }).catch(async () => {
      // Fallback ping to origin
      return fetch(url, { method: 'HEAD', signal: controller.signal });
    });

    clearTimeout(timer);
    const latencyMs = Date.now() - start;

    return {
      ok: response.status < 500,
      latencyMs,
      status: response.status,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    const isAbort = err?.name === 'AbortError';
    return {
      ok: false,
      latencyMs,
      error: isAbort ? `Ping timed out after ${timeoutMs}ms` : err?.message || 'Network fetch failed',
    };
  }
}

/**
 * Logs a structured mobile cloud event to both console and the internal diagnostics buffer.
 */
export function logMobileCloud(
  category: CloudLogEntry['category'],
  event: string,
  level: CloudLogEntry['level'] = 'info',
  details?: any
): CloudLogEntry {
  const entry: CloudLogEntry = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    timestamp: new Date().toLocaleTimeString(),
    category,
    event,
    level,
    details,
  };

  cloudLogBuffer.unshift(entry);
  if (cloudLogBuffer.length > MAX_LOG_ENTRIES) {
    cloudLogBuffer.pop();
  }

  // Styled console output for mobile inspection
  const colorMap = {
    info: '#0284c7', // Sky Blue
    success: '#059669', // Emerald
    warn: '#d97706', // Amber
    error: '#dc2626', // Red
  };
  const color = colorMap[level] || '#0284c7';
  const prefix = `[AL-HERA ${category}]`;

  if (level === 'error') {
    console.error(`%c${prefix} ${event}`, `color: ${color}; font-weight: bold;`, details || '');
  } else if (level === 'warn') {
    console.warn(`%c${prefix} ${event}`, `color: ${color}; font-weight: bold;`, details || '');
  } else {
    console.log(`%c${prefix} ${event}`, `color: ${color}; font-weight: bold;`, details || '');
  }

  // Dispatch custom event for real-time UI diagnostics listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('al_hera_cloud_log', { detail: entry }));
  }

  return entry;
}

/**
 * Returns the rolling in-memory diagnostic logs.
 */
export function getMobileCloudLogs(): CloudLogEntry[] {
  return [...cloudLogBuffer];
}

/**
 * Clears the diagnostics log buffer.
 */
export function clearMobileCloudLogs(): void {
  cloudLogBuffer.length = 0;
}

/**
 * Robust network readiness waiter for mobile browsers.
 * 1. Checks if document is ready.
 * 2. Checks if navigator is online. If offline, awaits the 'online' event with a timeout.
 * 3. Applies a stabilization delay on mobile devices to let cellular radio and TCP sockets settle.
 */
export async function waitForNetworkReady(options: {
  maxWaitMs?: number;
  mobileStabilizationDelayMs?: number;
} = {}): Promise<{
  ready: boolean;
  waitedMs: number;
  wasOffline: boolean;
  networkState: NetworkStateInfo;
}> {
  const start = Date.now();
  const maxWait = options.maxWaitMs || 4500;
  const isMobile = isMobileBrowser();
  const stabilizationDelay = options.mobileStabilizationDelayMs ?? (isMobile ? 350 : 50);

  logMobileCloud('NETWORK', 'Evaluating network readiness for mobile hydration...', 'info', {
    isMobile,
    stabilizationDelay,
    initialOnLine: typeof navigator !== 'undefined' ? navigator.onLine : true,
  });

  // 1. Wait for document to be interactive or complete
  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    await new Promise<void>((resolve) => {
      const onReady = () => {
        document.removeEventListener('DOMContentLoaded', onReady);
        resolve();
      };
      document.addEventListener('DOMContentLoaded', onReady);
      setTimeout(resolve, 800); // Fallback timeout
    });
  }

  // 2. Wait for navigator.onLine if currently offline
  let wasOffline = false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    wasOffline = true;
    logMobileCloud('NETWORK', 'Device is currently reporting offline. Awaiting network reconnection...', 'warn');

    await new Promise<void>((resolve) => {
      let resolved = false;
      const onOnline = () => {
        if (!resolved) {
          resolved = true;
          window.removeEventListener('online', onOnline);
          logMobileCloud('NETWORK', 'Network "online" event detected! Resuming hydration.', 'success');
          resolve();
        }
      };
      window.addEventListener('online', onOnline);

      // Maximum timeout to avoid hanging if navigator.onLine is buggy
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          window.removeEventListener('online', onOnline);
          logMobileCloud('NETWORK', `Online wait timeout reached (${maxWait}ms). Proceeding with cautious attempt.`, 'warn');
          resolve();
        }
      }, maxWait);
    });
  }

  // 3. Stabilization settle delay on mobile devices
  if (stabilizationDelay > 0) {
    await new Promise((r) => setTimeout(r, stabilizationDelay));
  }

  const waitedMs = Date.now() - start;
  const networkState = getNetworkState();

  logMobileCloud('NETWORK', `Network readiness established in ${waitedMs}ms`, 'success', {
    waitedMs,
    wasOffline,
    networkState,
  });

  return {
    ready: true,
    waitedMs,
    wasOffline,
    networkState,
  };
}
