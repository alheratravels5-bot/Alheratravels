import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Moon,
  Search,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  Menu,
  X,
  Lock,
  User,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  Key,
  ShieldAlert,
  Download,
  Flame
} from 'lucide-react';

// Authentication & Auto-Logout Layer
import {
  authenticateUser,
  useAutoLogout,
  DEFAULT_INACTIVITY_TIMEOUT_MS,
  INACTIVITY_EXPIRED_MESSAGE,
  reportUserActivity
} from './lib/auth';
import {
  subscribeToSupabaseRealtime,
  pullAllFromSupabase,
  pushAllToSupabase,
  deleteRecordFromSupabase,
  signOutFromSupabaseAuth
} from './lib/supabase';

// Types
import {
  Candidate,
  JobVacancy,
  UmrahPackage,
  PartnerOffice,
  AppUser,
  AgencyInfo,
  SliderBanner
} from './types';

// Storage Layer
import {
  getCandidates,
  saveCandidates,
  getJobs,
  saveJobs,
  getUmrahPackages,
  saveUmrahPackages,
  getPartners,
  savePartners,
  getCurrentUser,
  saveCurrentUser,
  getAgencyInfo,
  getSliders,
  saveSliders,
  getUmrahBookings,
  saveUmrahBookings,
  getVisaBatches,
  saveVisaBatches,
  getIndividualVisas,
  saveIndividualVisas,
  getPartnerPayments,
  savePartnerPayments,
  getFollowUps,
  saveFollowUps,
  getMessageTemplates,
  saveMessageTemplates,
  getMessageLogs,
  saveMessageLogs,
  saveAgencyInfo
} from './lib/storage';

// Public Components
import { PublicHome } from './components/public/PublicHome';
import { PublicJobs } from './components/public/PublicJobs';
import { PublicUmrah } from './components/public/PublicUmrah';
import { PublicTracking } from './components/public/PublicTracking';
import { PublicPartnersAndAbout } from './components/public/PublicPartnersAndAbout';
import { PublicApplyModal } from './components/public/PublicApplyModal';
import { PublicUmrahBookingModal } from './components/public/PublicUmrahBookingModal';
import { PublicJobPosterModal } from './components/public/PublicJobPosterModal';

// Admin Components
import { AdminSidebar } from './components/admin/AdminSidebar';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CrmFollowUpManagement } from './components/admin/CrmFollowUpManagement';
import { CandidateManagement } from './components/admin/CandidateManagement';
import { CandidateFormModal } from './components/admin/CandidateFormModal';
import { CandidateDetailModal } from './components/admin/CandidateDetailModal';
import { JobManagement } from './components/admin/JobManagement';
import { UmrahManagement } from './components/admin/UmrahManagement';
import { PartnerManagement } from './components/admin/PartnerManagement';
import { AccountsManagement } from './components/admin/AccountsManagement';
import { SmsManagement } from './components/admin/SmsManagement';
import { SliderManagement } from './components/admin/SliderManagement';
import { StaffManagement } from './components/admin/StaffManagement';
import { SupabaseSyncModal } from './components/admin/SupabaseSyncModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export default function App() {
  // Navigation & Root Views
  const [currentView, setCurrentView] = useState<'public' | 'admin'>('public');
  const [publicTab, setPublicTab] = useState<'home' | 'jobs' | 'umrah' | 'tracking' | 'partners' | 'about'>('home');
  const [adminTab, setAdminTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(getCurrentUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Primary Entities State
  const [candidates, setCandidates] = useState<Candidate[]>(getCandidates());
  const [jobs, setJobs] = useState<JobVacancy[]>(getJobs());
  const [packages, setPackages] = useState<UmrahPackage[]>(getUmrahPackages());
  const [partners, setPartners] = useState<PartnerOffice[]>(getPartners());
  const [sliders, setSliders] = useState<SliderBanner[]>(getSliders());
  const agencyInfo = getAgencyInfo();

  // Public Interactive Modals
  const [trackingSearchQuery, setTrackingSearchQuery] = useState('');
  const [selectedJobForApply, setSelectedJobForApply] = useState<JobVacancy | null>(null);
  const [selectedJobForPoster, setSelectedJobForPoster] = useState<JobVacancy | null>(null);
  const [selectedPackageForBooking, setSelectedPackageForBooking] = useState<UmrahPackage | null>(null);

  // Admin Candidate Modals
  const [isCandidateFormOpen, setIsCandidateFormOpen] = useState(false);
  const [candidateToEdit, setCandidateToEdit] = useState<Candidate | null>(null);
  const [selectedCandidateDetail, setSelectedCandidateDetail] = useState<Candidate | null>(null);

  // Cloud Sync Modal
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isMobileAdminSidebarOpen, setIsMobileAdminSidebarOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ title: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (title: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ title, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Auto-Logout on Inactivity / Manual Sign Out
  const handleLogout = async (customMessage?: string | React.MouseEvent, isExpired: boolean = false) => {
    // 1. Securely sign out from Supabase Auth
    try {
      await signOutFromSupabaseAuth();
    } catch (err) {
      console.warn('Supabase auth sign out warning:', err);
    }

    // 2. Clear local user session & activity timestamp
    setCurrentUser(null);
    saveCurrentUser(null);
    try {
      localStorage.removeItem('al_hera_last_activity_v1');
    } catch {
      // ignore
    }

    const isSessionExpired =
      isExpired ||
      (typeof customMessage === 'string' &&
        (customMessage === INACTIVITY_EXPIRED_MESSAGE ||
          customMessage.toLowerCase().includes('inactivity') ||
          customMessage.toLowerCase().includes('expired')));

    if (isSessionExpired) {
      // Direct redirect to Admin Login page / modal with expiration notification
      setCurrentView('admin');
      setIsLoginModalOpen(true);
      setLoginError(INACTIVITY_EXPIRED_MESSAGE);
      setLoginPassword('');
      showToast(INACTIVITY_EXPIRED_MESSAGE, 'error');
    } else {
      setCurrentView('public');
      setIsLoginModalOpen(false);
      setLoginError('');
      const msg =
        typeof customMessage === 'string' && customMessage.trim().length > 0
          ? customMessage
          : 'Logged out of Admin Portal.';
      showToast(msg, 'info');
    }
  };

  const { remainingSeconds, resetTimer } = useAutoLogout(
    currentUser,
    (reason?: string) => {
      handleLogout(reason || INACTIVITY_EXPIRED_MESSAGE, true);
    },
    DEFAULT_INACTIVITY_TIMEOUT_MS
  );

  // Guard admin view
  useEffect(() => {
    if (currentView === 'admin' && !currentUser) {
      const stored = getCurrentUser();
      if (stored) {
        setCurrentUser(stored);
      } else {
        setCurrentView('public');
        setIsLoginModalOpen(true);
      }
    }
  }, [currentView, currentUser]);

  const refreshAllState = () => {
    setCandidates(getCandidates());
    setJobs(getJobs());
    setPackages(getUmrahPackages());
    setPartners(getPartners());
    setSliders(getSliders());
  };

  // Initial Supabase Cloud Pull + Realtime Multi-Device Sync
  useEffect(() => {
    let isMounted = true;

    const loadCloudData = async () => {
      try {
        const pullRes = await pullAllFromSupabase();
        if (pullRes.success && pullRes.data && isMounted) {
          const d = pullRes.data;
          let hasCloudData = false;
          if (d.candidates && d.candidates.length > 0) {
            saveCandidates(d.candidates);
            setCandidates(d.candidates);
            hasCloudData = true;
          }
          if (d.jobs && d.jobs.length > 0) {
            saveJobs(d.jobs);
            setJobs(d.jobs);
            hasCloudData = true;
          }
          if (d.packages && d.packages.length > 0) {
            saveUmrahPackages(d.packages);
            setPackages(d.packages);
            hasCloudData = true;
          }
          if (d.partners && d.partners.length > 0) {
            savePartners(d.partners);
            setPartners(d.partners);
            hasCloudData = true;
          }
          if (d.sliders && d.sliders.length > 0) {
            saveSliders(d.sliders);
            setSliders(d.sliders);
            hasCloudData = true;
          }
          if (d.bookings && d.bookings.length > 0) saveUmrahBookings(d.bookings);
          if (d.visaBatches && d.visaBatches.length > 0) saveVisaBatches(d.visaBatches);
          if (d.individualVisas && d.individualVisas.length > 0) saveIndividualVisas(d.individualVisas);
          if (d.partnerPayments && d.partnerPayments.length > 0) savePartnerPayments(d.partnerPayments);
          if (d.crmFollowUps && d.crmFollowUps.length > 0) saveFollowUps(d.crmFollowUps);
          if (d.templates && d.templates.length > 0) saveMessageTemplates(d.templates);
          if (d.logs && d.logs.length > 0) saveMessageLogs(d.logs);
          if (d.agencyInfo) saveAgencyInfo(d.agencyInfo);

          // If Supabase was clean/empty, auto-migrate existing local workspace records to Supabase without loss
          if (!hasCloudData) {
            const currentCand = getCandidates();
            const currentJobs = getJobs();
            const currentPkgs = getUmrahPackages();
            const currentPartners = getPartners();
            if (currentCand.length > 0 || currentJobs.length > 0 || currentPkgs.length > 0) {
              await pushAllToSupabase({
                candidates: currentCand,
                jobs: currentJobs,
                packages: currentPkgs,
                bookings: getUmrahBookings(),
                partners: currentPartners,
                visaBatches: getVisaBatches(),
                individualVisas: getIndividualVisas(),
                partnerPayments: getPartnerPayments(),
                crmFollowUps: getFollowUps(),
                sliders: getSliders(),
                templates: getMessageTemplates(),
                logs: getMessageLogs(),
                agencyInfo: getAgencyInfo(),
              });
            }
          }
        }
      } catch (err) {
        console.warn('Initial Supabase hydration notice:', err);
      }
    };

    loadCloudData();

    // Subscribe to realtime multi-device events
    const unsubscribe = subscribeToSupabaseRealtime((event) => {
      console.log('Received Supabase sync broadcast:', event);
      refreshAllState();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Synchronize state changes to storage and Supabase
  const handleSaveCandidates = (updatedCandidates: Candidate[]) => {
    setCandidates(updatedCandidates);
    saveCandidates(updatedCandidates);
  };

  const handleSaveJobs = (updatedJobs: JobVacancy[]) => {
    setJobs(updatedJobs);
    saveJobs(updatedJobs);
  };

  const handleSavePackages = (updatedPackages: UmrahPackage[]) => {
    setPackages(updatedPackages);
    saveUmrahPackages(updatedPackages);
  };

  const handleSavePartners = (updatedPartners: PartnerOffice[]) => {
    setPartners(updatedPartners);
    savePartners(updatedPartners);
  };

  // Candidate Operations
  const handleCreateOrUpdateCandidate = (candidateData: Partial<Candidate>) => {
    let updated: Candidate[];
    if (candidateToEdit) {
      const updatedCand: Candidate = {
        ...candidateToEdit,
        ...candidateData,
        trackingId: candidateData.trackingId || candidateToEdit.trackingId || `AHT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        updatedAt: new Date().toISOString(),
      };
      updated = candidates.map((c) => (c.id === candidateToEdit.id ? updatedCand : c));
      showToast(`Updated particulars for ${updatedCand.fullName}`);
    } else {
      const year = new Date().getFullYear();
      const trackingId = candidateData.trackingId || `AHT-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newCand: Candidate = {
        id: candidateData.id || 'cand-' + Date.now(),
        trackingId: trackingId.toUpperCase(),
        fullName: candidateData.fullName || 'Candidate',
        fatherName: candidateData.fatherName || '',
        passportNumber: (candidateData.passportNumber || '').toUpperCase(),
        passportExpiry: candidateData.passportExpiry || '',
        dateOfBirth: candidateData.dateOfBirth || '1995-01-01',
        gender: candidateData.gender || 'Male',
        nationality: candidateData.nationality || 'Indian',
        phoneNumber: candidateData.phoneNumber || '',
        whatsappNumber: candidateData.whatsappNumber || candidateData.phoneNumber || '',
        email: candidateData.email || '',
        city: candidateData.city || '',
        state: candidateData.state || '',
        address: candidateData.address || `${candidateData.city || ''}, ${candidateData.state || ''}`,
        trade: candidateData.trade || 'General Worker',
        experienceYears: Number(candidateData.experienceYears || 0),
        education: candidateData.education || '',
        jobId: candidateData.jobId,
        jobTitle: candidateData.jobTitle || candidateData.trade,
        sponsorName: candidateData.sponsorName,
        partnerOfficeId: candidateData.partnerOfficeId,
        partnerOfficeName: candidateData.partnerOfficeName,
        partnerCommission: Number(candidateData.partnerCommission || 0),
        visaNumber: candidateData.visaNumber || '',
        wakalaNumber: candidateData.wakalaNumber || '',
        status: candidateData.status || 'applied',
        statusHistory: candidateData.statusHistory || [
          {
            id: 'sth-' + Date.now(),
            status: candidateData.status || 'applied',
            timestamp: new Date().toISOString(),
            updatedBy: currentUser?.name || 'Administrator',
            notes: 'Candidate registered in Al-Hera ERP system.',
          }
        ],
        packageFee: Number(candidateData.packageFee || 0),
        totalPaid: Number(candidateData.totalPaid || 0),
        balanceDue: Number(candidateData.packageFee || 0) - Number(candidateData.totalPaid || 0),
        paymentHistory: candidateData.paymentHistory || [],
        remarks: candidateData.remarks || '',
        photoUrl: candidateData.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
        createdAt: candidateData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updated = [newCand, ...candidates];
      showToast(`Candidate registered! Tracking ID: ${newCand.trackingId}`);
    }
    handleSaveCandidates(updated);
    setIsCandidateFormOpen(false);
    setCandidateToEdit(null);
  };

  const handleDeleteCandidate = (candidateId: string) => {
    const cand = candidates.find((c) => c.id === candidateId);
    const updated = candidates.filter((c) => c.id !== candidateId);
    handleSaveCandidates(updated);
    if (cand?.trackingId) {
      deleteRecordFromSupabase('candidates', 'tracking_id', cand.trackingId);
    }
    if (selectedCandidateDetail?.id === candidateId) {
      setSelectedCandidateDetail(null);
    }
    showToast('Candidate record removed successfully.');
  };

  const handleUpdateSingleCandidate = (updatedCandidate: Candidate) => {
    const updated = candidates.map((c) => (c.id === updatedCandidate.id ? updatedCandidate : c));
    handleSaveCandidates(updated);
    setSelectedCandidateDetail(updatedCandidate);
    showToast('Dossier updated successfully.');
  };

  // Job Operations
  const handleSaveJob = (job: JobVacancy) => {
    const exists = jobs.find((j) => j.id === job.id);
    const updated = exists ? jobs.map((j) => (j.id === job.id ? job : j)) : [job, ...jobs];
    handleSaveJobs(updated);
    showToast(`Saved vacancy: ${job.title}`);
  };

  const handleDeleteJob = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    const updated = jobs.filter((j) => j.id !== jobId);
    handleSaveJobs(updated);
    if (job?.jobCode) {
      deleteRecordFromSupabase('job_vacancies', 'job_code', job.jobCode);
    }
    showToast('Job vacancy deleted.');
  };

  // Package Operations
  const handleSavePackage = (pkg: UmrahPackage) => {
    const exists = packages.find((p) => p.id === pkg.id);
    const updated = exists ? packages.map((p) => (p.id === pkg.id ? pkg : p)) : [pkg, ...packages];
    handleSavePackages(updated);
    showToast(`Saved package: ${pkg.name}`);
  };

  const handleDeletePackage = (packageId: string) => {
    const pkg = packages.find((p) => p.id === packageId);
    const updated = packages.filter((p) => p.id !== packageId);
    handleSavePackages(updated);
    if (pkg) {
      deleteRecordFromSupabase('umrah_packages', 'package_code', pkg.packageCode || pkg.id);
    }
    showToast('Umrah package deleted.');
  };

  // Partner Operations
  const handleSavePartner = (partner: PartnerOffice) => {
    const exists = partners.find((p) => p.id === partner.id);
    const updated = exists
      ? partners.map((p) => (p.id === partner.id ? partner : p))
      : [partner, ...partners];
    handleSavePartners(updated);
    showToast(`Saved partner office: ${partner.agencyName}`);
  };

  const handleDeletePartner = (partnerId: string) => {
    const updated = partners.filter((p) => p.id !== partnerId);
    handleSavePartners(updated);
    deleteRecordFromSupabase('partner_offices', 'id', partnerId);
    showToast('Partner office deleted.');
  };

  // Authentication Handlers
  const handleLogin = (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) {
      e.preventDefault();
    }
    setLoginError('');

    const emailToUse = customEmail || loginEmail;
    const passwordToUse = customPassword || loginPassword;

    const result = authenticateUser(emailToUse, passwordToUse);

    if (result.success && result.user) {
      setCurrentUser(result.user);
      saveCurrentUser(result.user);
      resetTimer();
      setLoginPassword('');
      setIsLoginModalOpen(false);
      setCurrentView('admin');
      setAdminTab('dashboard');
      showToast(`Welcome back, ${result.user.name}! Authenticated to Admin Portal.`);
    } else {
      setLoginError(result.error || 'Invalid credentials. Access denied.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 selection:bg-amber-400 selection:text-slate-950 flex flex-col">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-fade-in bg-[#0F1E36] text-white px-4 py-3 rounded-2xl shadow-2xl border border-amber-500/40 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-bold">{typeof toastMessage.title === 'string' ? toastMessage.title : 'Notification'}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: PUBLIC WEBSITE */}
      {/* ========================================================================= */}
      {currentView === 'public' && (
        <div className="flex flex-col min-h-screen">
          {/* Top Brand Notification Bar */}
          <div className="bg-[#0A1628] text-slate-300 text-[11px] py-2 px-4 border-b border-slate-800 no-print">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
              <div className="flex items-center gap-4 flex-wrap justify-center">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Govt. Approved Saudi Recruitment & Umrah Agency
                </span>
                <span className="hidden md:inline text-slate-500">•</span>
                <span className="hidden md:inline">Govt. Lic: B-0891/RAJ/PER/1000+/5/9821/2021</span>
              </div>

              <div className="flex items-center gap-4">
                <a
                  href={`tel:${agencyInfo.phone.replace(/[^0-9+]/g, '')}`}
                  className="hover:text-amber-400 flex items-center gap-1 font-mono text-xs"
                >
                  <Phone className="w-3 h-3 text-amber-400" />
                  <span>{agencyInfo.phone}</span>
                </a>
                <span className="text-slate-600">|</span>
                <a
                  href={`mailto:${agencyInfo.email}`}
                  className="hover:text-amber-400 flex items-center gap-1 text-xs"
                >
                  <Mail className="w-3 h-3 text-amber-400" />
                  <span>{agencyInfo.email}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Main Navigation Header */}
          <header className="sticky top-0 z-40 bg-[#0F1E36]/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl no-print">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
              {/* Brand Logo */}
              <div
                onClick={() => setPublicTab('home')}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-[#0F1E36] font-brand font-black text-2xl shadow-lg group-hover:scale-105 transition-all">
                  AH
                </div>
                <div>
                  <h1 className="font-brand font-black text-xl tracking-wider text-white">
                    AL-HERA <span className="text-amber-400">TRAVELS</span>
                  </h1>
                  <p className="text-[10px] text-slate-300 font-semibold tracking-widest uppercase">
                    Overseas Recruitment & Umrah
                  </p>
                </div>
              </div>

              {/* Desktop Nav Links */}
              <nav className="hidden lg:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
                <button
                  onClick={() => setPublicTab('home')}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    publicTab === 'home'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => setPublicTab('jobs')}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    publicTab === 'jobs'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  🇸🇦 Saudi Jobs ({jobs.length})
                </button>
                <button
                  onClick={() => setPublicTab('umrah')}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    publicTab === 'umrah'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  🕋 Umrah Packages ({packages.length})
                </button>
                <button
                  onClick={() => setPublicTab('tracking')}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    publicTab === 'tracking'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  🔎 Track Status
                </button>
                <button
                  onClick={() => setPublicTab('partners')}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    publicTab === 'partners'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  🏢 Sub-Agent Offices
                </button>
                <button
                  onClick={() => setPublicTab('about')}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    publicTab === 'about'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  About & License
                </button>
              </nav>

              {/* Right CTA / Admin Login Trigger */}
              <div className="flex items-center gap-3">
                {currentUser ? (
                  <button
                    onClick={() => setCurrentView('admin')}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin Desk</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-bold text-xs flex items-center gap-2 shadow transition-all"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Staff Login</span>
                  </button>
                )}

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {mobileMenuOpen && (
              <div className="lg:hidden bg-[#0A1628] border-b border-slate-800 px-4 py-4 space-y-2 text-sm font-bold animate-fade-in">
                <button
                  onClick={() => {
                    setPublicTab('home');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-800 text-slate-200"
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    setPublicTab('jobs');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-800 text-slate-200"
                >
                  🇸🇦 Saudi Arabia Jobs
                </button>
                <button
                  onClick={() => {
                    setPublicTab('umrah');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-800 text-slate-200"
                >
                  🕋 Umrah Packages
                </button>
                <button
                  onClick={() => {
                    setPublicTab('tracking');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-800 text-slate-200"
                >
                  🔎 Track Passport / Candidate ID
                </button>
                <button
                  onClick={() => {
                    setPublicTab('partners');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-800 text-slate-200"
                >
                  🏢 Sub-Agent Offices & Network
                </button>
                <button
                  onClick={() => {
                    setPublicTab('about');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-800 text-slate-200"
                >
                  About & License
                </button>
              </div>
            )}
          </header>

          {/* Main Body View Switching */}
          <main className="flex-1">
            {publicTab === 'home' && (
              <PublicHome
                jobs={jobs}
                packages={packages}
                candidates={candidates}
                partners={partners}
                sliders={sliders}
                onNavigate={(target, query) => {
                  if (query) setTrackingSearchQuery(query);
                  if (target === 'public_jobs' || target === 'jobs') setPublicTab('jobs');
                  else if (target === 'public_umrah' || target === 'umrah') setPublicTab('umrah');
                  else if (target === 'public_tracking' || target === 'tracking') setPublicTab('tracking');
                  else if (target === 'public_partners' || target === 'partners') setPublicTab('partners');
                  else if (target === 'public_about' || target === 'about') setPublicTab('about');
                  else if (target === 'public_home' || target === 'home') setPublicTab('home');
                  else setPublicTab(target as any);
                }}
                onSelectTab={(tab) => setPublicTab(tab as any)}
                onApplyJob={(job) => setSelectedJobForApply(job)}
                onBookUmrah={(pkg) => setSelectedPackageForBooking(pkg)}
                onOpenJobPoster={(job) => setSelectedJobForPoster(job)}
                agencyInfo={agencyInfo}
              />
            )}

            {publicTab === 'jobs' && (
              <PublicJobs
                jobs={jobs}
                onApplyJob={(job) => setSelectedJobForApply(job)}
                onOpenPoster={(job) => setSelectedJobForPoster(job)}
                agencyInfo={agencyInfo}
              />
            )}

            {publicTab === 'umrah' && (
              <PublicUmrah
                packages={packages}
                onBookPackage={(pkg) => setSelectedPackageForBooking(pkg)}
                agencyInfo={agencyInfo}
              />
            )}

            {publicTab === 'tracking' && (
              <PublicTracking
                initialQuery={trackingSearchQuery}
                candidates={candidates}
                agencyInfo={agencyInfo}
                onNavigateToJobs={() => setPublicTab('jobs')}
              />
            )}

            {(publicTab === 'partners' || publicTab === 'about') && (
              <PublicPartnersAndAbout
                partners={partners}
                agencyInfo={agencyInfo}
                viewType={publicTab}
                defaultSection={publicTab}
                onOpenLogin={() => setIsLoginModalOpen(true)}
              />
            )}
          </main>

          {/* Public Footer */}
          <footer className="bg-[#0A1628] border-t border-slate-800 text-slate-400 text-xs pt-12 pb-8 no-print">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Brand Col */}
              <div className="space-y-4 md:col-span-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[#0F1E36] font-brand font-black text-xl shadow-lg">
                    AH
                  </div>
                  <div>
                    <h3 className="font-brand font-bold text-base text-white">AL-HERA TRAVELS</h3>
                    <span className="text-[10px] text-amber-400 font-semibold block">Overseas Recruitment & Umrah</span>
                  </div>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Leading recruitment consultants for Saudi Arabia mega-projects, oil & gas, technical trades, and certified Umrah pilgrimage tour organizers.
                </p>
                <div className="text-[11px] text-slate-400">
                  <p><strong>GSTIN:</strong> {agencyInfo.gstin}</p>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-3">Quick Navigation</h4>
                <ul className="space-y-2 text-xs">
                  <li><button onClick={() => setPublicTab('jobs')} className="hover:text-amber-400">Saudi Arabia Jobs</button></li>
                  <li><button onClick={() => setPublicTab('umrah')} className="hover:text-amber-400">VIP Umrah Packages</button></li>
                  <li><button onClick={() => setPublicTab('tracking')} className="hover:text-amber-400">Passport Status Tracking</button></li>
                  <li><button onClick={() => setPublicTab('about')} className="hover:text-amber-400">About Us</button></li>
                </ul>
              </div>

              {/* Contact Particulars */}
              <div>
                <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-3">Head Office</h4>
                <div className="space-y-2 text-xs text-slate-400">
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{agencyInfo.address}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-mono text-white">{agencyInfo.phone}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{agencyInfo.email}</span>
                  </p>
                </div>
              </div>

              {/* Admin Access Box */}
              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-white text-xs">Agency Portal Access</h4>
                </div>
                <p className="text-[11px] text-slate-400">
                  Restricted to authorized recruitment managers, operations staff, and registered sub-agents.
                </p>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow"
                >
                  Open Staff Desk
                </button>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
              <p>© {new Date().getFullYear()} AL-HERA TRAVELS. All Rights Reserved.</p>
              <p>Designed with Navy Blue + Gold + White Brand Archetype</p>
            </div>
          </footer>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: ADMIN PANEL */}
      {/* ========================================================================= */}
      {currentView === 'admin' && (
        <ErrorBoundary fallbackTitle="Admin Portal Error Recovery" onReset={() => setAdminTab('dashboard')}>
          {!currentUser ? (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-slate-900">
              <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#0F1E36] text-amber-400 flex items-center justify-center mx-auto shadow-lg">
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-xl text-[#0F1E36]">Staff Authentication Required</h3>
                {loginError && (
                  <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs font-semibold flex items-center justify-center gap-2 animate-fade-in shadow-sm">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}
                <p className="text-xs text-slate-500">
                  Please log in with your authorized Al-Hera staff or administrator credentials to access this operations console.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-amber-400 font-bold text-xs shadow-md transition-all flex items-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Open Staff Login</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('public');
                      setLoginError('');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                  >
                    Public Website
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="flex min-h-screen bg-slate-100 text-slate-900 overflow-x-hidden"
              onMouseMove={() => resetTimer()}
              onClick={() => resetTimer()}
              onKeyDown={() => resetTimer()}
            >
              {/* Left Sidebar (Desktop fixed + Mobile Drawer) */}
              <AdminSidebar
                currentTab={adminTab}
                onTabChange={(tab) => {
                  resetTimer();
                  reportUserActivity();
                  if (tab === 'supabase') {
                    setIsSupabaseModalOpen(true);
                  } else {
                    setAdminTab(tab);
                  }
                }}
                currentUser={currentUser}
                onLogout={handleLogout}
                onGoToPublic={() => setCurrentView('public')}
                candidateCount={candidates.length}
                isOpenMobile={isMobileAdminSidebarOpen}
                onCloseMobile={() => setIsMobileAdminSidebarOpen(false)}
              />

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
                {/* Top Bar */}
                <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-3 flex items-center justify-between no-print sticky top-0 z-30 shadow-sm gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {/* Mobile Hamburger menu toggle */}
                    <button
                      onClick={() => setIsMobileAdminSidebarOpen(true)}
                      className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
                      aria-label="Open navigation menu"
                    >
                      <Menu className="w-5 h-5 text-[#0F1E36]" />
                    </button>

                    <div className="truncate">
                      <span className="hidden sm:inline text-xs text-slate-500 font-bold uppercase tracking-wider">
                        AL-HERA TRAVELS <span className="text-slate-300 mx-1">/</span>
                      </span>
                      <h2 className="font-bold text-xs sm:text-sm text-[#0F1E36] capitalize truncate">
                        {adminTab.replace(/_/g, ' ')}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                    {/* Auto-Logout Status Badge */}
                    <div
                      className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-[11px] sm:text-xs font-semibold"
                      title="Auto-Logout security timer (5 minutes) automatically resets on any mouse, keyboard, touch, or navigation action"
                    >
                      <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-600 animate-spin-slow shrink-0" />
                      <span className="hidden md:inline">Idle:</span>
                      <span className="font-mono text-amber-800 font-bold">
                        {Math.floor(remainingSeconds / 60)}:
                        {(remainingSeconds % 60).toString().padStart(2, '0')}
                      </span>
                    </div>

                    <button
                      onClick={() => setIsSupabaseModalOpen(true)}
                      className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 text-[11px] sm:text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                      title="Manage Firebase Cloud Firestore and Supabase Database Sync"
                    >
                      <Flame className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-600 shrink-0" />
                      <span className="hidden sm:inline">Firebase & Cloud</span>
                      <span className="sm:hidden">Sync</span>
                    </button>

                    <button
                      onClick={() => setCurrentView('public')}
                      className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-[#0F1E36] text-white hover:bg-[#1A3258] text-[11px] sm:text-xs font-bold transition-all"
                    >
                      <span className="hidden sm:inline">Public Website →</span>
                      <span className="sm:hidden">Public</span>
                    </button>
                  </div>
                </div>

                {/* Content Views */}
                <div className="p-3 sm:p-4 md:p-6 w-full max-w-full">
                  <ErrorBoundary fallbackTitle="Admin Section Recovery" onReset={() => setAdminTab('dashboard')}>
                    {adminTab === 'dashboard' && (
                      <AdminDashboard
                        candidates={candidates}
                        jobs={jobs}
                        packages={packages}
                        partners={partners}
                        onNavigateTab={(tab) => setAdminTab(tab)}
                        onOpenNewCandidate={() => {
                          setCandidateToEdit(null);
                          setIsCandidateFormOpen(true);
                        }}
                        onOpenNewJob={() => setAdminTab('jobs')}
                        onSelectCandidate={(c) => setSelectedCandidateDetail(c)}
                        agencyInfo={agencyInfo}
                      />
                    )}

                    {adminTab === 'crm' && (
                      <CrmFollowUpManagement
                        candidates={candidates}
                        partners={partners}
                        currentUser={currentUser}
                        agencyInfo={agencyInfo}
                        onSelectCandidate={(c) => setSelectedCandidateDetail(c)}
                        onToast={showToast}
                      />
                    )}

                    {adminTab === 'candidates' && (
                      <CandidateManagement
                        candidates={candidates}
                        partners={partners}
                        onAddCandidate={() => {
                          setCandidateToEdit(null);
                          setIsCandidateFormOpen(true);
                        }}
                        onEditCandidate={(c) => {
                          setCandidateToEdit(c);
                          setIsCandidateFormOpen(true);
                        }}
                        onViewCandidate={(c) => setSelectedCandidateDetail(c)}
                        onDeleteCandidate={handleDeleteCandidate}
                        agencyInfo={agencyInfo}
                      />
                    )}

                    {adminTab === 'jobs' && (
                      <JobManagement
                        jobs={jobs}
                        onSaveJob={handleSaveJob}
                        onDeleteJob={handleDeleteJob}
                        agencyInfo={agencyInfo}
                      />
                    )}

                    {adminTab === 'umrah' && (
                      <UmrahManagement
                        packages={packages}
                        onSavePackage={handleSavePackage}
                        onDeletePackage={handleDeletePackage}
                        agencyInfo={agencyInfo}
                      />
                    )}

                    {adminTab === 'partners' && (
                      <PartnerManagement
                        partners={partners}
                        candidates={candidates}
                        onSavePartner={handleSavePartner}
                        onDeletePartner={handleDeletePartner}
                      />
                    )}

                    {adminTab === 'accounts' && (
                      <AccountsManagement
                        candidates={candidates}
                        partners={partners}
                        agencyInfo={agencyInfo}
                      />
                    )}

                    {adminTab === 'sms' && <SmsManagement agencyInfo={agencyInfo} />}

                    {adminTab === 'sliders' && <SliderManagement />}

                    {adminTab === 'staff' && <StaffManagement currentUser={currentUser} onToast={showToast} />}
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          )}
        </ErrorBoundary>
      )}

      {/* ========================================================================= */}
      {/* GLOBAL MODALS */}
      {/* ========================================================================= */}

      {/* Admin Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-8 space-y-6 animate-fade-in text-slate-900">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-[#0F1E36] text-amber-400 mx-auto flex items-center justify-center font-bold shadow-lg">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="font-brand font-bold text-2xl text-[#0F1E36]">AL-HERA TRAVELS</h3>
              <p className="text-xs text-slate-500">
                Staff & Authorized Administration Portal
              </p>
            </div>

            {/* Enterprise Security Notice */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
              </div>
              <div className="text-[11px] text-slate-600 leading-tight">
                <strong className="text-[#0F1E36] block font-bold">Secure Access System</strong>
                <span>Enter your registered staff email and encrypted password to access the administrative dashboard.</span>
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Registered Staff Email *</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    setLoginError('');
                  }}
                  placeholder="name@alheratravels.com"
                  autoComplete="email"
                  className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50/50 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Account Password *</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-amber-800 hover:text-amber-900 font-semibold flex items-center gap-1"
                  >
                    {showPassword ? (
                      <>
                        <EyeOff className="w-3 h-3" /> Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" /> Show
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      setLoginError('');
                    }}
                    placeholder="Enter your account password"
                    autoComplete="current-password"
                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50/50 font-mono"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-[11px] text-slate-600">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  <strong>Inactivity Protection:</strong> Sessions automatically terminate after 5 minutes of idle time.
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginModalOpen(false);
                    setLoginError('');
                  }}
                  className="text-slate-500 hover:text-slate-800 font-bold px-2 py-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-amber-400 font-bold text-xs shadow-lg transition-all flex items-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Authenticate & Enter Desk</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Public Job Application Lead Modal */}
      <PublicApplyModal
        job={selectedJobForApply}
        isOpen={!!selectedJobForApply}
        onClose={() => setSelectedJobForApply(null)}
        onSuccess={(candidate) => {
          setCandidates(getCandidates());
          setTrackingSearchQuery(candidate.trackingId);
          setPublicTab('tracking');
          showToast(`Application submitted! Tracking ID: ${candidate.trackingId}`);
        }}
      />

      {/* Public Umrah Booking Modal */}
      <PublicUmrahBookingModal
        pkg={selectedPackageForBooking}
        isOpen={!!selectedPackageForBooking}
        onClose={() => setSelectedPackageForBooking(null)}
        onSuccess={(booking) => {
          showToast(`Umrah Booking inquiry ${booking.bookingCode} registered successfully!`);
        }}
      />

      {/* Public Job Poster Studio Modal */}
      <PublicJobPosterModal
        job={selectedJobForPoster}
        isOpen={!!selectedJobForPoster}
        onClose={() => setSelectedJobForPoster(null)}
        agencyInfo={agencyInfo}
      />

      {/* Admin Candidate Add/Edit Form Modal */}
      <CandidateFormModal
        isOpen={isCandidateFormOpen}
        onClose={() => {
          setIsCandidateFormOpen(false);
          setCandidateToEdit(null);
        }}
        candidateToEdit={candidateToEdit}
        onSave={handleCreateOrUpdateCandidate}
        partners={partners}
        jobs={jobs}
      />

      {/* Admin Candidate Full Dossier Detail Modal */}
      <CandidateDetailModal
        candidate={selectedCandidateDetail}
        isOpen={!!selectedCandidateDetail}
        onClose={() => setSelectedCandidateDetail(null)}
        onUpdateCandidate={handleUpdateSingleCandidate}
        agencyInfo={agencyInfo}
      />

      {/* Supabase Sync Modal */}
      <SupabaseSyncModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onDataRefreshed={refreshAllState}
      />
    </div>
  );
}
