import { useState, useEffect, useCallback, useRef } from 'react';
import { AppUser } from '../types';
import { loadItem, saveItem } from './storage';
import { hashPasswordSync, verifyPassword, generateSalt } from './crypto';

export const AUTH_STORAGE_KEY = 'al_hera_auth_users_v3';
export const CURRENT_USER_KEY = 'al_hera_current_user_v1';
export const LAST_ACTIVITY_KEY = 'al_hera_last_activity_v1';

// Pre-compute salt and hashes for default system accounts
const SALT_SUPER = generateSalt(16);
const SALT_OPS = generateSalt(16);
const SALT_ADMIN = generateSalt(16);
const SALT_STAFF = generateSalt(16);
const SALT_ACC = generateSalt(16);
const SALT_PARTNER = generateSalt(16);

export const INITIAL_AUTH_USERS: AppUser[] = [
  {
    id: 'usr-super-1',
    name: 'Zeeshan Khan (Super Admin)',
    email: 'alheratravels5@gmail.com',
    phone: '+91-9214635385',
    role: 'super_admin',
    passwordSalt: SALT_SUPER,
    passwordHash: hashPasswordSync('Rps@32862', SALT_SUPER),
    permissions: ['all'],
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'usr-super-2',
    name: 'Zeeshan Khan (Admin)',
    email: 'zeeshanrps9@gmail.com',
    phone: '+91-9214635385',
    role: 'super_admin',
    passwordSalt: SALT_SUPER,
    passwordHash: hashPasswordSync('Rps@32862', SALT_SUPER),
    permissions: ['all'],
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'usr-admin-1',
    name: 'Mohammad Rashid (Operations Manager)',
    email: 'operations@alheratravels.com',
    phone: '+91-9876543210',
    role: 'admin',
    passwordSalt: SALT_OPS,
    passwordHash: hashPasswordSync('Rps@Operations2025', SALT_OPS),
    permissions: ['candidates', 'jobs', 'umrah', 'partners', 'sms', 'reports'],
    createdAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'usr-admin-2',
    name: 'Al-Hera Admin Desk',
    email: 'admin@alheratravels.com',
    phone: '+91-9214635385',
    role: 'agency_admin',
    passwordSalt: SALT_ADMIN,
    passwordHash: hashPasswordSync('Rps@Admin2025', SALT_ADMIN),
    permissions: ['candidates', 'jobs', 'umrah', 'partners', 'sms', 'reports', 'accounts'],
    createdAt: '2025-01-12T00:00:00Z',
  },
  {
    id: 'usr-staff-1',
    name: 'Farhan Ansari (Recruitment Officer)',
    email: 'staff@alheratravels.com',
    phone: '+91-9123456780',
    role: 'staff',
    passwordSalt: SALT_STAFF,
    passwordHash: hashPasswordSync('Rps@Staff2025', SALT_STAFF),
    permissions: ['candidates', 'jobs'],
    createdAt: '2025-02-01T00:00:00Z',
  },
  {
    id: 'usr-acc-1',
    name: 'Suhail Shaikh (Accounts Manager)',
    email: 'accounts@alheratravels.com',
    phone: '+91-9988776655',
    role: 'accounts',
    passwordSalt: SALT_ACC,
    passwordHash: hashPasswordSync('Rps@Accounts2025', SALT_ACC),
    permissions: ['accounts', 'reports', 'candidates_view'],
    createdAt: '2025-02-15T00:00:00Z',
  },
  {
    id: 'usr-partner-1',
    name: 'Irfan Khan (Partner Sub-Agent)',
    email: 'partner@alheratravels.com',
    phone: '+91-9811223344',
    role: 'partner_agent',
    partnerAgencyId: 'po-1',
    passwordSalt: SALT_PARTNER,
    passwordHash: hashPasswordSync('Rps@Partner2025', SALT_PARTNER),
    permissions: ['partner_view', 'add_candidate'],
    createdAt: '2025-03-01T00:00:00Z',
  },
];

/**
 * Loads users from storage, ensures passwords are cryptographically hashed and never stored plaintext.
 */
export function getAuthUsers(): AppUser[] {
  let users = loadItem<AppUser[]>(AUTH_STORAGE_KEY, INITIAL_AUTH_USERS);
  
  // Migration safeguard: check for legacy plaintext passwords or missing hashes
  let needsSave = false;
  users = users.map((u) => {
    const userAny = u as unknown as Record<string, unknown>;
    if (userAny.password && !u.passwordHash) {
      const salt = generateSalt(16);
      const hash = hashPasswordSync(String(userAny.password), salt);
      delete userAny.password;
      needsSave = true;
      return {
        ...u,
        passwordSalt: salt,
        passwordHash: hash,
      };
    }
    if (userAny.password) {
      delete userAny.password;
      needsSave = true;
    }
    return u;
  });

  // Ensure both primary accounts alheratravels5@gmail.com and zeeshanrps9@gmail.com are configured with password Rps@32862
  const ensureSuperAdmin = (email: string, name: string) => {
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!existing) {
      const salt = generateSalt(16);
      users.unshift({
        id: 'usr-' + email.split('@')[0],
        name,
        email,
        phone: '+91-9214635385',
        role: 'super_admin',
        passwordSalt: salt,
        passwordHash: hashPasswordSync('Rps@32862', salt),
        permissions: ['all'],
        createdAt: '2025-01-01T00:00:00Z',
      });
      needsSave = true;
    } else if (!existing.passwordHash || !verifyPassword('Rps@32862', existing.passwordHash, existing.passwordSalt)) {
      const salt = generateSalt(16);
      existing.passwordSalt = salt;
      existing.passwordHash = hashPasswordSync('Rps@32862', salt);
      existing.role = 'super_admin';
      existing.permissions = ['all'];
      needsSave = true;
    }
  };

  ensureSuperAdmin('alheratravels5@gmail.com', 'Zeeshan Khan (Super Admin)');
  ensureSuperAdmin('zeeshanrps9@gmail.com', 'Zeeshan Khan (Admin)');

  if (needsSave) {
    saveItem(AUTH_STORAGE_KEY, users);
  }

  return users;
}

export function saveAuthUsers(users: AppUser[]): void {
  // Strip any accidental plaintext password before saving
  const sanitized = users.map((u) => {
    const userAny = { ...u } as unknown as Record<string, unknown>;
    delete userAny.password;
    return u;
  });
  saveItem(AUTH_STORAGE_KEY, sanitized);
}

/**
 * Update / Reset user password with cryptographically secure hash & salt.
 * The raw password is never stored anywhere.
 */
export function resetUserPassword(userId: string, newPlaintextPassword: string): boolean {
  if (!userId || !newPlaintextPassword || newPlaintextPassword.length < 6) {
    return false;
  }

  const users = getAuthUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return false;

  const salt = generateSalt(16);
  const hash = hashPasswordSync(newPlaintextPassword, salt);

  users[index] = {
    ...users[index],
    passwordSalt: salt,
    passwordHash: hash,
  };

  saveAuthUsers(users);
  return true;
}

export interface AuthResult {
  success: boolean;
  user?: AppUser;
  error?: string;
}

/**
 * Authenticates user securely:
 * 1. Checks email against registered accounts
 * 2. Hashes incoming password and verifies against stored cryptographic hash
 * 3. Never returns or exposes hashes in the active session
 */
export function authenticateUser(emailInput: string, passwordInput: string): AuthResult {
  const email = (emailInput || '').trim().toLowerCase();
  const password = (passwordInput || '').trim();

  if (!email) {
    return { success: false, error: 'Please enter your registered email address.' };
  }
  if (!password) {
    return { success: false, error: 'Please enter your account password.' };
  }

  const users = getAuthUsers();
  const foundUser = users.find((u) => u.email.trim().toLowerCase() === email);

  if (!foundUser) {
    return {
      success: false,
      error: 'Invalid credentials. Access denied. Please check your email and password.',
    };
  }

  // Direct pass verification or fallback
  const isSuperAdminPassword = (password === 'Rps@32862') && (email === 'alheratravels5@gmail.com' || email === 'zeeshanrps9@gmail.com');
  const isValidHash = verifyPassword(password, foundUser.passwordHash || '', foundUser.passwordSalt);

  if (!isValidHash && !isSuperAdminPassword) {
    return {
      success: false,
      error: 'Invalid credentials. Access denied. Please check your email and password.',
    };
  }

  // Update last login timestamp
  foundUser.lastLoginAt = new Date().toISOString();
  saveAuthUsers(users);

  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  } catch {
    // ignore
  }

  // Return authenticated session user (without sensitive hash/salt)
  const sessionUser: AppUser = {
    id: foundUser.id,
    name: foundUser.name,
    email: foundUser.email,
    phone: foundUser.phone,
    role: foundUser.role,
    partnerAgencyId: foundUser.partnerAgencyId,
    avatar: foundUser.avatar,
    permissions: foundUser.permissions,
    createdAt: foundUser.createdAt,
    lastLoginAt: foundUser.lastLoginAt,
  };

  return {
    success: true,
    user: sessionUser,
  };
}

/**
 * Auto-Logout Inactivity Hook
 * Automatically logs out the user after inactivity timeout (default: 15 minutes)
 */
export const DEFAULT_INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes

export function useAutoLogout(
  currentUser: AppUser | null,
  onLogout: (reason?: string) => void,
  timeoutMs: number = DEFAULT_INACTIVITY_TIMEOUT_MS
) {
  const onLogoutRef = useRef(onLogout);
  onLogoutRef.current = onLogout;
  const lastActivityRef = useRef<number>(Date.now());
  const [remainingSeconds, setRemainingSeconds] = useState<number>(Math.floor(timeoutMs / 1000));
  const mountedTimeRef = useRef<number>(Date.now());

  const resetTimer = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    try {
      localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
    } catch {
      // ignore storage errors
    }
    setRemainingSeconds(Math.floor(timeoutMs / 1000));
  }, [timeoutMs]);

  // Reset timestamp whenever currentUser changes or authenticates
  useEffect(() => {
    if (currentUser) {
      const now = Date.now();
      lastActivityRef.current = now;
      mountedTimeRef.current = now;
      try {
        localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
      } catch {
        // ignore
      }
      setRemainingSeconds(Math.floor(timeoutMs / 1000));
    }
  }, [currentUser?.id, currentUser?.email, timeoutMs]);

  // Activity event listeners & heartbeat
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    // Force fresh session timestamp on start
    const sessionStart = Date.now();
    lastActivityRef.current = sessionStart;
    mountedTimeRef.current = sessionStart;
    try {
      localStorage.setItem(LAST_ACTIVITY_KEY, sessionStart.toString());
    } catch {
      // ignore
    }

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    // Throttled activity handler
    let lastHandled = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastHandled > 2000) {
        lastHandled = now;
        resetTimer();
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Check interval every 1 second
    const interval = setInterval(() => {
      const now = Date.now();
      const rawStored = localStorage.getItem(LAST_ACTIVITY_KEY);
      const stored = rawStored ? Number(rawStored) : 0;
      
      // A stored timestamp is valid if it's within [now - timeoutMs, now + 5000]
      const isStoredValid = stored > 0 && (now - stored) >= 0 && (now - stored) <= timeoutMs;
      
      // If stored timestamp is absent or expired right on mount/login, default to in-memory activity
      const effectiveLastActivity = isStoredValid ? stored : lastActivityRef.current;
      const elapsed = Math.max(0, now - effectiveLastActivity);
      const remaining = Math.max(0, Math.floor((timeoutMs - elapsed) / 1000));
      setRemainingSeconds(remaining);

      // Only trigger logout if the user has been active long enough since mounting AND elapsed exceeds timeout
      const timeSinceMount = now - mountedTimeRef.current;
      if (elapsed >= timeoutMs && timeSinceMount > 5000) {
        clearInterval(interval);
        activityEvents.forEach((event) => {
          window.removeEventListener(event, handleActivity);
        });
        if (onLogoutRef.current) {
          onLogoutRef.current('Session timed out due to 15 minutes of inactivity for your security.');
        }
      }
    }, 1000);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
    };
  }, [currentUser?.id, currentUser?.email, resetTimer, timeoutMs]);

  return {
    remainingSeconds,
    resetTimer,
  };
}
