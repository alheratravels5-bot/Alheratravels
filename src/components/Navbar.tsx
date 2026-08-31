import React from 'react';
import {
  Phone,
  Mail,
  Search,
  Briefcase,
  Moon,
  Shield,
  User,
  LogOut,
  LayoutDashboard,
  Compass,
  Building,
  Menu,
  X,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { AppUser, AgencyInfo } from '../types';

interface NavbarProps {
  currentView: 'public_home' | 'public_jobs' | 'public_umrah' | 'public_tracking' | 'public_partners' | 'public_about' | 'admin_panel';
  onNavigate: (view: any) => void;
  currentUser: AppUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  agencyInfo: AgencyInfo;
  onOpenQuickTrack: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onOpenAuth,
  onLogout,
  agencyInfo,
  onOpenQuickTrack,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isPublic = currentView !== 'admin_panel';

  const navLinks = [
    { id: 'public_home', label: 'Home', icon: Compass },
    { id: 'public_jobs', label: 'Saudi Jobs', icon: Briefcase, badge: 'Urgent Vacancies' },
    { id: 'public_umrah', label: 'Umrah Packages', icon: Moon, badge: 'New Groups' },
    { id: 'public_tracking', label: 'Track Passport / ID', icon: Search, highlight: true },
    { id: 'public_about', label: 'About Us', icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-40 w-full shadow-md">
      {/* Top Gold & Navy Ribbon */}
      <div className="bg-[#0A1628] border-b border-amber-500/30 text-slate-300 text-xs py-1.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left: Services info */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 text-[11px]">
              <Compass className="w-3 h-3 text-amber-400" />
              Overseas Recruitment & Umrah Services
            </span>
            <span className="hidden md:inline text-slate-400">|</span>
            <span className="hidden md:inline text-slate-300">
              Direct Saudi Enterprise Visas & Transparent Candidate Tracking
            </span>
          </div>

          {/* Right: Contact & WhatsApp */}
          <div className="flex items-center gap-4 text-[12px]">
            <a
              href={`tel:${agencyInfo.phone}`}
              className="flex items-center gap-1 text-slate-200 hover:text-amber-400 transition-colors"
            >
              <Phone className="w-3 h-3 text-amber-400" />
              <span>{agencyInfo.phone}</span>
            </a>
            <a
              href={`mailto:${agencyInfo.email}`}
              className="hidden sm:flex items-center gap-1 text-slate-200 hover:text-amber-400 transition-colors"
            >
              <Mail className="w-3 h-3 text-amber-400" />
              <span>{agencyInfo.email}</span>
            </a>
            <a
              href={`https://wa.me/${agencyInfo.whatsapp}?text=Assalamu%20Alaikum%2C%20I%20want%20information%20regarding%20Saudi%20Jobs%20and%20Umrah%20packages`}
              target="_blank"
              rel="noreferrer"
              className="hidden lg:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-700/80 hover:bg-emerald-600 text-white font-medium text-[11px] transition-all"
            >
              <span>WhatsApp Direct</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="bg-[#0F1E36] text-white px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-20">
          {/* Brand Logo */}
          <div
            id="nav-brand-logo"
            onClick={() => onNavigate('public_home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-[#0F1E36] rounded-[10px] flex items-center justify-center text-amber-400 font-brand text-2xl font-black">
                AH
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-brand font-extrabold text-xl tracking-wider text-white">
                  AL-HERA
                </span>
                <span className="font-brand font-bold text-xl tracking-widest text-amber-400">
                  TRAVELS
                </span>
              </div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-300">
                Overseas Recruitment & Umrah Services
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'text-amber-400 bg-white/10 font-semibold'
                      : item.highlight
                      ? 'text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40'
                      : 'text-slate-200 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 text-amber-400" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-600 text-white uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Quick Track Search Button on mobile/desktop */}
            <button
              id="nav-quick-track-btn"
              onClick={onOpenQuickTrack}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-xs font-semibold transition-all"
              title="Track Passport or Candidate ID"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track Passport</span>
            </button>

            {/* Portal / Admin Switcher */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  id="nav-admin-panel-btn"
                  onClick={() => onNavigate(isPublic ? 'admin_panel' : 'public_home')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  {isPublic ? (
                    <>
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>Open Staff Panel</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-3.5 h-3.5" />
                      <span>View Public Website</span>
                    </>
                  )}
                </button>

                <div className="relative group">
                  <button
                    onClick={onOpenAuth}
                    className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200"
                    title="Change Role / User"
                  >
                    <div className="w-6 h-6 rounded bg-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                      {currentUser.name.charAt(0)}
                    </div>
                    <span className="hidden md:inline font-medium max-w-[100px] truncate">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-amber-400 border border-amber-500/20 font-bold uppercase">
                      {currentUser.role.replace('_', ' ')}
                    </span>
                  </button>
                </div>

                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="nav-staff-login-btn"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>Staff & Admin Portal</span>
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 py-3 space-y-1 animate-fade-in">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 font-semibold'
                      : 'text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-amber-400" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
