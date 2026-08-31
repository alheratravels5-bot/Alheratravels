import React from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Moon,
  Building2,
  CreditCard,
  MessageSquare,
  Sliders,
  ShieldCheck,
  Database,
  LogOut,
  ChevronRight,
  Sparkles,
  Home,
  Download,
  Flame,
  X,
  PhoneCall
} from 'lucide-react';
import { AppUser } from '../../types';
import { getFollowUps } from '../../lib/storage';

interface AdminSidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  currentUser: AppUser | null;
  onLogout: () => void;
  onGoToPublic: () => void;
  candidateCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onTabChange,
  currentUser,
  onLogout,
  onGoToPublic,
  candidateCount,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.email === 'alheratravels5@gmail.com' || currentUser?.email === 'zeeshanrps9@gmail.com';
  const isAgencyAdmin = currentUser?.role === 'agency_admin' || currentUser?.role === 'admin' || isSuperAdmin;
  const isPartner = currentUser?.role === 'partner' || currentUser?.role === 'partner_agent';

  // Compute CRM pending/urgent badge
  const followUps = getFollowUps();
  const todayStr = new Date().toISOString().split('T')[0];
  const activeFollowUps = followUps.filter(
    (f) => f.status !== 'completed' && f.status !== 'converted' && f.status !== 'cancelled' && f.status !== 'lost'
  );
  const overdueOrToday = activeFollowUps.filter((f) => f.scheduledDate <= todayStr).length;
  const crmBadge = overdueOrToday > 0 ? `${overdueOrToday} Due` : activeFollowUps.length > 0 ? `${activeFollowUps.length}` : null;

  const menuItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard, badge: null, show: true },
    { id: 'crm', label: 'CRM & Follow-Ups', icon: PhoneCall, badge: crmBadge, show: true },
    { id: 'candidates', label: 'Candidate Dossiers', icon: Users, badge: candidateCount, show: true },
    { id: 'jobs', label: 'Saudi Jobs & Posters', icon: Briefcase, badge: null, show: !isPartner },
    { id: 'umrah', label: 'Umrah Bookings', icon: Moon, badge: null, show: !isPartner },
    { id: 'partners', label: 'Sub-Agent Offices', icon: Building2, badge: null, show: isAgencyAdmin },
    { id: 'accounts', label: 'Accounts & Receipts', icon: CreditCard, badge: null, show: isAgencyAdmin },
    { id: 'sms', label: 'SMS & WhatsApp Desk', icon: MessageSquare, badge: null, show: isAgencyAdmin },
    { id: 'sliders', label: 'Website Banners', icon: Sliders, badge: null, show: isAgencyAdmin },
    { id: 'staff', label: 'Staff & Access', icon: ShieldCheck, badge: null, show: isAgencyAdmin },
    { id: 'supabase', label: 'Firebase & Cloud Sync', icon: Flame, badge: 'Live', show: isAgencyAdmin },
  ];

  const handleSelectTab = (tabId: string) => {
    onTabChange(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="w-64 bg-[#0A1628] border-r border-slate-800 text-white flex flex-col justify-between h-full select-none">
      <div>
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[#0F1E36] font-brand font-black text-xl shadow-lg">
              AH
            </div>
            <div>
              <h2 className="font-brand font-bold text-base text-white tracking-wider">
                AL-HERA <span className="text-amber-400">ADMIN</span>
              </h2>
              <span className="text-[10px] text-slate-400 font-semibold block">
                Agency Control Desk
              </span>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Identity Pill */}
        <div className="px-4 sm:px-5 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="truncate mr-2">
            <p className="font-bold text-white truncate">{currentUser?.name || 'Authorized Staff'}</p>
            <span className="text-[10px] text-amber-400 font-bold uppercase">
              {currentUser?.role ? currentUser.role.replace(/_/g, ' ') : 'Super Admin'}
            </span>
          </div>
          <button
            onClick={() => {
              onGoToPublic();
              if (onCloseMobile) onCloseMobile();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0"
            title="Switch to Public Website"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="p-3 space-y-1 max-h-[calc(100vh-230px)] overflow-y-auto">
          {menuItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== null && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        isActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </nav>
      </div>

      {/* Footer / Logout & Export */}
      <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 space-y-2">
        <a
          href="/namecheap-deployment.zip"
          download="namecheap-deployment.zip"
          className="w-full py-2 px-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-emerald-800/80"
          title="Download production zip file for Namecheap cPanel deployment"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">Namecheap ZIP</span>
        </a>

        <button
          onClick={() => {
            onLogout();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 h-screen sticky top-0 no-print z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop and Sliding Sidebar */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Slide-over panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0A1628] shadow-2xl z-10 animate-fade-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
