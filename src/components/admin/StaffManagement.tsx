import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  User,
  Phone,
  Mail,
  Key,
  CheckCircle2,
  X,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  Clock,
  AlertCircle
} from 'lucide-react';
import { AppUser, UserRole } from '../../types';
import { getUsers, saveUsers } from '../../lib/storage';
import { resetUserPassword } from '../../lib/auth';
import { hashPasswordSync, generateSalt, generateStrongPassword } from '../../lib/crypto';

interface StaffManagementProps {
  currentUser?: AppUser | null;
  onToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({ currentUser, onToast }) => {
  const [users, setUsers] = useState<AppUser[]>(getUsers());
  
  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<AppUser | null>(null);

  // Form State for Add / Edit Details (No plaintext password in edit!)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('operations_staff');
  const [initialPassword, setInitialPassword] = useState('');
  const [showInitialPassword, setShowInitialPassword] = useState(false);

  // Form State for Password Reset Modal
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetError, setResetError] = useState('');

  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.email === 'alheratravels5@gmail.com' || currentUser?.email === 'zeeshanrps9@gmail.com';

  const notify = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (onToast) {
      onToast(msg, type);
    }
  };

  const openNewUserModal = () => {
    setTargetUser(null);
    setName('');
    setEmail('');
    setPhone('');
    setRole('operations_staff');
    setInitialPassword(generateStrongPassword());
    setShowInitialPassword(true);
    setIsEditModalOpen(true);
  };

  const openEditDetailsModal = (u: AppUser) => {
    setTargetUser(u);
    setName(u.name);
    setEmail(u.email);
    setPhone(u.phone || '');
    setRole(u.role);
    setIsEditModalOpen(true);
  };

  const openResetPasswordModal = (u: AppUser) => {
    setTargetUser(u);
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setResetError('');
    setIsResetModalOpen(true);
  };

  // Submit Add or Edit Staff Details
  const handleSaveUserDetails = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      notify('Please enter employee name and valid email.', 'error');
      return;
    }

    if (targetUser) {
      // Updating existing profile without modifying existing password hash
      const updated = users.map((u) => {
        if (u.id === targetUser.id) {
          return {
            ...u,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            role,
          };
        }
        return u;
      });

      setUsers(updated);
      saveUsers(updated);
      setIsEditModalOpen(false);
      notify(`Updated employee details for ${name}.`, 'success');
    } else {
      // Adding new staff account with cryptographically hashed password
      if (!initialPassword || initialPassword.length < 6) {
        notify('Initial password must be at least 6 characters.', 'error');
        return;
      }

      const salt = generateSalt(16);
      const hash = hashPasswordSync(initialPassword, salt);

      const newUser: AppUser = {
        id: 'usr-' + Date.now(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role,
        passwordSalt: salt,
        passwordHash: hash,
        permissions: ['read', 'write', 'update_status'],
        createdAt: new Date().toISOString(),
      };

      const updated = [newUser, ...users];
      setUsers(updated);
      saveUsers(updated);
      setIsEditModalOpen(false);
      notify(`New staff account created for ${name}. Password securely hashed.`, 'success');
    }
  };

  // Submit Password Reset (Admin assigns new password without viewing old one)
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (!targetUser) return;

    if (!newPassword || newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('New passwords do not match. Please re-enter.');
      return;
    }

    const success = resetUserPassword(targetUser.id, newPassword);
    if (success) {
      const freshUsers = getUsers();
      setUsers(freshUsers);
      setIsResetModalOpen(false);
      notify(`Password for ${targetUser.name} has been securely reset and hashed.`, 'success');
    } else {
      setResetError('Failed to reset password. Please try again.');
    }
  };

  const handleDeleteUser = (u: AppUser) => {
    if (u.email.toLowerCase() === 'alheratravels5@gmail.com') {
      notify('Super Admin root account cannot be deleted.', 'error');
      return;
    }

    if (confirm(`Are you sure you want to remove staff account for "${u.name}"?`)) {
      const updated = users.filter((item) => item.id !== u.id);
      setUsers(updated);
      saveUsers(updated);
      notify(`Removed user account ${u.name}.`, 'info');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
            <h2 className="text-2xl font-extrabold text-[#0F1E36] font-display">
              Staff & Access Management
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Manage authorized staff accounts, assign operational roles, and reset credentials. All passwords are encrypted with salted SHA-256 hashes and cannot be viewed in plaintext.
          </p>
        </div>

        <button
          onClick={openNewUserModal}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {users.map((u) => {
          const isRootAdmin = u.email.toLowerCase() === 'alheratravels5@gmail.com';

          return (
            <div
              key={u.id}
              className={`bg-white rounded-2xl border ${
                isRootAdmin ? 'border-amber-300 ring-2 ring-amber-400/20' : 'border-slate-200'
              } shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition`}
            >
              <div className="space-y-3.5">
                {/* Top User Title & Role */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${
                        isRootAdmin ? 'bg-amber-500 text-slate-950' : 'bg-[#0F1E36] text-amber-400'
                      } flex items-center justify-center font-bold shadow-sm shrink-0`}
                    >
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-[#0F1E36] leading-tight">{u.name}</h3>
                        {isRootAdmin && (
                          <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-1.5 py-0.5 rounded">
                            ⭐ Root
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded inline-block mt-0.5">
                        {u.role.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Contact & Security Info */}
                <div className="space-y-2 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-medium">{u.email}</span>
                  </p>
                  {u.phone && (
                    <p className="flex items-center gap-2 font-mono text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{u.phone}</span>
                    </p>
                  )}

                  {/* Cryptographic Masked Password Status (Never show plaintext password) */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 mt-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Password: Hashed & Masked</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 tracking-widest">••••••••</span>
                  </div>

                  {u.lastLoginAt && (
                    <p className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Last login: {new Date(u.lastLoginAt).toLocaleDateString()}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons: Reset Password / Edit / Delete */}
              <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => openResetPasswordModal(u)}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition"
                  title="Reset user password"
                >
                  <Key className="w-3.5 h-3.5 text-amber-700" />
                  <span>Reset Password</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditDetailsModal(u)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    title="Edit profile details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {!isRootAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                      title="Remove staff account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: Add New Staff OR Edit Staff Details */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-[#0F1E36]">
                  {targetUser ? 'Edit Staff Profile' : 'Add New Agency Staff'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserDetails} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Imran Ansari"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="imran@alheratravels.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91-9214635385"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Initial Password (ONLY shown when creating a brand-new user) */}
              {!targetUser && (
                <div className="space-y-1.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-amber-950">
                      Initial Temporary Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => setInitialPassword(generateStrongPassword())}
                      className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Generate Strong
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showInitialPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Enter initial password (min 6 chars)"
                      value={initialPassword}
                      onChange={(e) => setInitialPassword(e.target.value)}
                      className="w-full border border-amber-300 rounded-lg p-2 font-mono text-xs pr-9 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowInitialPassword(!showInitialPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                    >
                      {showInitialPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-900/80">
                    🔒 Password will be securely hashed with SHA-256 upon saving.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role & Permissions</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="agency_admin">Agency Administrator</option>
                  <option value="operations_staff">Operations Staff (Visa & Medical)</option>
                  <option value="accountant">Accountant / Cashier</option>
                  <option value="partner_agent">Sub-Agent / Regional Partner</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-amber-400 font-bold shadow-md transition"
                >
                  {targetUser ? 'Save Changes' : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Admin Password Reset Modal (Without viewing old password) */}
      {isResetModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-[#0F1E36]">Reset Staff Password</h3>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Account Summary */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <p className="font-bold text-[#0F1E36]">{targetUser.name}</p>
              <p className="text-slate-500 font-mono text-[11px]">{targetUser.email}</p>
              <span className="text-[10px] font-bold text-amber-800 uppercase bg-amber-100/70 px-1.5 py-0.5 rounded inline-block">
                Role: {targetUser.role}
              </span>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
              <strong>🔒 Zero-Knowledge Security:</strong> Passwords are cryptographically salted and hashed. The existing password cannot be viewed. Setting a new password will immediately update their login credentials.
            </div>

            {resetError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">New Password *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const strong = generateStrongPassword();
                      setNewPassword(strong);
                      setConfirmPassword(strong);
                      setShowNewPassword(true);
                    }}
                    className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Enter new password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setResetError('');
                    }}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-mono text-xs pr-9 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Confirm New Password *</label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setResetError('');
                  }}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md transition flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Update & Hash Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
