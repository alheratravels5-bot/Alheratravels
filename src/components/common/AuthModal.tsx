import React, { useState } from 'react';
import { X, ShieldCheck, UserCheck, Lock, Mail, Key, Sparkles, Building2 } from 'lucide-react';
import { AppUser, UserRole } from '../../types';
import { INITIAL_USERS, saveCurrentUser } from '../../lib/storage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AppUser) => void;
  currentUser?: AppUser;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('super_admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [customLogin, setCustomLogin] = useState(false);

  if (!isOpen) return null;

  const handleQuickSwitch = (user: AppUser) => {
    saveCurrentUser(user);
    onLoginSuccess(user);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Match by email if exists, or create custom authenticated user session
    const matched = INITIAL_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    const user: AppUser = matched || {
      id: 'usr-' + Date.now(),
      name: email.split('@')[0] || 'Staff Member',
      email: email || 'staff@alheratravels.com',
      phone: '+91-9214635385',
      role: selectedRole,
      permissions: ['all'],
      createdAt: new Date().toISOString(),
    };
    saveCurrentUser(user);
    onLoginSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        id="auth-modal-card"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#0F1E36] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-amber-400 tracking-wider uppercase">
                Staff & Partner Portal
              </span>
              <h3 className="text-xl font-bold text-white font-display">AL-HERA TRAVELS LOGIN</h3>
            </div>
          </div>
          <p className="text-xs text-slate-300">
            Secure role-based access for Administrator, Recruitment Officers, Accounts & Partner Sub-Agents.
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Select Login Profile (Instant Demo Switch)
            </span>
            <button
              onClick={() => setCustomLogin(!customLogin)}
              className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
            >
              <Key className="w-3.5 h-3.5" />
              {customLogin ? 'Use Quick Demo Profiles' : 'Enter Custom Email'}
            </button>
          </div>

          {!customLogin ? (
            <div className="space-y-2.5">
              {INITIAL_USERS.map((user) => {
                const isActive = currentUser?.id === user.id;
                let badgeColor = 'bg-blue-100 text-blue-800';
                let icon = <UserCheck className="w-4 h-4 text-blue-600" />;

                if (user.role === 'super_admin') {
                  badgeColor = 'bg-amber-100 text-amber-900 border border-amber-300';
                  icon = <Sparkles className="w-4 h-4 text-amber-600" />;
                } else if (user.role === 'accounts') {
                  badgeColor = 'bg-emerald-100 text-emerald-800';
                } else if (user.role === 'partner_agent') {
                  badgeColor = 'bg-purple-100 text-purple-800';
                  icon = <Building2 className="w-4 h-4 text-purple-600" />;
                }

                return (
                  <button
                    key={user.id}
                    id={`login-role-${user.role}`}
                    onClick={() => handleQuickSwitch(user)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all group ${
                      isActive
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/20'
                        : 'border-slate-200 hover:border-amber-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                        {icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-slate-900">{user.name}</p>
                          {isActive && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${badgeColor}`}
                    >
                      {user.role.replace('_', ' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select System Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="super_admin">Super Admin (Full Agency Access)</option>
                  <option value="admin">Operations Admin</option>
                  <option value="staff">Recruitment Officer</option>
                  <option value="accounts">Accounts & Finance</option>
                  <option value="partner_agent">Partner Sub-Agent Office</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. alheratravels5@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#0F1E36] hover:bg-[#1A3158] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                Sign In to Panel
              </button>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Helpline: <strong className="text-slate-700">+91-9214635385</strong> | Head Office Mumbai
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
