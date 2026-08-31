import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  FileText,
  Download,
  Plane,
  Building,
  ShieldCheck,
  User,
  Calendar,
  CreditCard,
  Phone,
  ArrowRight,
  Sparkles,
  AlertCircle,
  QrCode,
  Database,
  RefreshCw,
  ExternalLink,
  Check,
  MapPin,
  Briefcase
} from 'lucide-react';
import { Candidate, CandidateStatus, AgencyInfo } from '../../types';
import { getAgencyInfo } from '../../lib/storage';
import { generateSelectionLetterPdf } from '../../lib/pdfGenerator';
import {
  searchCandidateTrackingInSupabase,
  getLiveSampleTrackingIdsFromSupabase
} from '../../lib/supabase';

interface PublicTrackingProps {
  initialQuery?: string;
  candidates?: Candidate[];
  agencyInfo?: AgencyInfo;
  onNavigateToJobs?: () => void;
}

const TIMELINE_STEPS: { key: CandidateStatus; label: string; description: string; icon: string }[] = [
  { key: 'applied', label: 'Application Registered', description: 'Initial document check & profile verification in cloud registry', icon: '📝' },
  { key: 'interview_selected', label: 'Client Interview Selected', description: 'Selected in Trade Test / Interview by Saudi Employer', icon: '🎯' },
  { key: 'medical_fit', label: 'GAMCA Medical Fit', description: 'Approved Medical Fitness Certificate generated & verified', icon: '🏥' },
  { key: 'wakala_issued', label: 'Saudi Wakala Allotted', description: 'Electronic Visa quota allocated by sponsor in Enjaz / MOFA', icon: '📜' },
  { key: 'visa_stamped', label: 'Saudi Embassy Visa Stamped', description: 'Original Visa stamped on passport by Saudi Consulate', icon: '🇸🇦' },
  { key: 'emigration_cleared', label: 'Emigration / Protector Done', description: 'Approved by Protector of Emigrants (POE) Govt of India', icon: '🛡️' },
  { key: 'ticket_booked', label: 'Flight Ticket & Deployment', description: 'Confirmed flight ticket issued & ready for Saudi departure', icon: '✈️' },
];

export const PublicTracking: React.FC<PublicTrackingProps> = ({
  initialQuery = '',
  candidates: propCandidates = [],
  agencyInfo: propAgency,
  onNavigateToJobs,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchedCandidate, setSearchedCandidate] = useState<Candidate | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [dataSource, setDataSource] = useState<'supabase_table' | 'supabase_store' | 'local_cache' | 'none'>('none');
  const [sampleTrackingIds, setSampleTrackingIds] = useState<string[]>([]);

  const agency = propAgency || getAgencyInfo();

  // Load live sample tracking IDs directly from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    const fetchSamples = async () => {
      try {
        const liveSamples = await getLiveSampleTrackingIdsFromSupabase();
        if (isMounted && liveSamples && liveSamples.length > 0) {
          setSampleTrackingIds(liveSamples);
        } else if (isMounted && propCandidates && propCandidates.length > 0) {
          const fallbackSamples = propCandidates.slice(0, 6).map((c) => c.trackingId).filter(Boolean);
          setSampleTrackingIds(fallbackSamples);
        }
      } catch (err) {
        console.warn('Could not load sample tracking IDs:', err);
      }
    };

    fetchSamples();
    return () => {
      isMounted = false;
    };
  }, [propCandidates]);

  // Main search function: Supabase Direct Database Search
  const performSearch = useCallback(async (query: string) => {
    const q = (query || '').trim();
    if (!q) {
      setErrorMsg('Please enter a Tracking ID (e.g. AHT-2026-1794) or Passport Number.');
      setSearchedCandidate(null);
      setHasSearched(true);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setHasSearched(true);

    try {
      // 1. Direct Supabase Database Search
      const res = await searchCandidateTrackingInSupabase(q);

      if (res.success && res.candidate) {
        setSearchedCandidate(res.candidate);
        setDataSource(res.source);
        setErrorMsg('');
        setIsLoading(false);
        return;
      }

      // 2. Fallback check on props/local cache if Supabase didn't match
      const upperQ = q.toUpperCase();
      const cleanDigits = q.replace(/[^0-9]/g, '');

      const localFound = propCandidates.find((c) => {
        const track = (c.trackingId || '').toUpperCase();
        const pass = (c.passportNumber || '').toUpperCase();
        const mofa = (c.mofaNumber || '').toUpperCase();
        const visa = (c.visaNumber || '').toUpperCase();
        const phoneDigits = (c.phoneNumber || '').replace(/[^0-9]/g, '');
        const whatsDigits = (c.whatsappNumber || '').replace(/[^0-9]/g, '');

        return (
          track === upperQ ||
          pass === upperQ ||
          mofa === upperQ ||
          visa === upperQ ||
          (cleanDigits.length >= 6 && phoneDigits.includes(cleanDigits)) ||
          (cleanDigits.length >= 6 && whatsDigits.includes(cleanDigits))
        );
      });

      if (localFound) {
        setSearchedCandidate(localFound);
        setDataSource('local_cache');
        setErrorMsg('');
      } else {
        setSearchedCandidate(null);
        setDataSource('none');
        setErrorMsg(
          res.message ||
            `No matching record found in Supabase for "${q}". Please double check your Tracking ID or Passport Number.`
        );
      }
    } catch (err: any) {
      console.error('Error during tracking lookup:', err);
      setSearchedCandidate(null);
      setDataSource('none');
      setErrorMsg('An unexpected error occurred while searching the database. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [propCandidates]);

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery, performSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  // Helper to determine step completion index
  const getStepStatus = (stepKey: CandidateStatus, candidateStatus: CandidateStatus) => {
    const order: CandidateStatus[] = [
      'applied',
      'interview_scheduled',
      'interview_selected',
      'medical_in_progress',
      'medical_fit',
      'wakala_issued',
      'visa_stamped',
      'emigration_cleared',
      'ticket_booked',
      'deployed',
    ];

    const targetIdx = order.indexOf(stepKey);
    const currentIdx = order.indexOf(candidateStatus);

    if (candidateStatus === 'deployed') return 'completed';
    if (currentIdx > targetIdx) return 'completed';
    if (currentIdx === targetIdx) return 'current';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            Live Supabase Cloud Tracking System
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F1E36] font-display">
            Live Passport & Candidate Status Tracking
          </h1>
          <p className="text-slate-600 text-sm mt-2">
            Enter your <strong>Tracking ID</strong> (e.g. AHT-2026-1794) or <strong>Passport Number</strong> to query the real-time Supabase cloud database for your Saudi Visa stamping, Medical report, Wakala, and Flight status.
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-3xl mx-auto">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                id="passport-tracking-input"
                type="text"
                placeholder="Enter Tracking ID (e.g. AHT-2026-1794) or Passport No"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-sm sm:text-base border-2 border-slate-200 rounded-xl font-medium focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 focus:outline-none uppercase"
                disabled={isLoading}
              />
            </div>
            <button
              id="submit-passport-search"
              type="submit"
              disabled={isLoading}
              className="py-3 px-7 bg-[#0F1E36] hover:bg-[#1A3258] disabled:opacity-75 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base shrink-0"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>Searching DB...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-amber-400" />
                  <span>Track Live</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Test Buttons */}
          {sampleTrackingIds.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                <Database className="w-3 h-3 text-amber-600" />
                Live Database Records:
              </span>
              {sampleTrackingIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setSearchQuery(id);
                    performSearch(id);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 font-mono text-[11px] border border-slate-200 transition-colors"
                >
                  {id}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading Spinner Indicator */}
        {isLoading && (
          <div className="p-8 bg-white border border-slate-200 rounded-2xl max-w-3xl mx-auto text-center space-y-3 shadow-sm">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-800">
              Querying Supabase PostgreSQL Database for <span className="font-mono text-amber-600">{searchQuery}</span>...
            </p>
            <p className="text-xs text-slate-500">Checking live cloud candidate records across all connected devices</p>
          </div>
        )}

        {/* Results Section - Not Found */}
        {!isLoading && hasSearched && errorMsg && (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl max-w-3xl mx-auto text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="text-lg font-bold text-rose-900">Application Record Not Found</h3>
            <p className="text-xs text-rose-700">{errorMsg}</p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <a
                href={`https://wa.me/${agency.whatsapp}?text=Assalamu%20Alaikum%20Al-Hera%20Team%2C%20I%20am%20unable%20to%20track%20my%20passport%20or%20tracking%20ID%20${encodeURIComponent(
                  searchQuery
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Contact Al-Hera Helpline on WhatsApp</span>
              </a>

              {onNavigateToJobs && (
                <button
                  type="button"
                  onClick={onNavigateToJobs}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow transition-all"
                >
                  <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                  <span>Browse Current Job Openings</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results Section - Candidate Record Found */}
        {!isLoading && searchedCandidate && (
          <div className="space-y-6 animate-fade-in">
            {/* Database Origin Verification Badge */}
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">
                  {dataSource === 'supabase_table'
                    ? 'Verified Live Supabase PostgreSQL Record'
                    : dataSource === 'supabase_store'
                    ? 'Verified Live Supabase Cloud Store Record'
                    : 'Verified Record'}
                </span>
              </div>
              <span className="font-mono text-[11px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                Updated: {new Date(searchedCandidate.updatedAt || Date.now()).toLocaleDateString('en-GB')}
              </span>
            </div>

            {/* Top Dossier Summary Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-[#0F1E36] p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400/50 overflow-hidden shrink-0 flex items-center justify-center text-amber-300 font-bold text-2xl">
                    {searchedCandidate.photoUrl ? (
                      <img
                        src={searchedCandidate.photoUrl}
                        alt={searchedCandidate.fullName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-2xl font-bold font-display text-white">
                        {searchedCandidate.fullName}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-500 text-slate-950">
                        {searchedCandidate.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Tracking ID: <strong className="text-amber-400 font-mono">{searchedCandidate.trackingId}</strong> • Passport: <strong className="text-white font-mono">{searchedCandidate.passportNumber || 'N/A'}</strong>
                    </p>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => generateSelectionLetterPdf(searchedCandidate, agency)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Selection Dossier (PDF)</span>
                  </button>

                  <a
                    href={`https://wa.me/${agency.whatsapp}?text=Assalamu%20Alaikum%2C%20Inquiring%20about%20candidate%20${searchedCandidate.fullName}%20(Tracking%20ID%3A%20${searchedCandidate.trackingId})`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>WhatsApp Officer</span>
                  </a>
                </div>
              </div>

              {/* Key Particulars Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-slate-50 border-b border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block">Designation / Trade:</span>
                  <span className="font-bold text-slate-900 text-sm">{searchedCandidate.trade || 'General Worker'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Saudi Sponsor / Employer:</span>
                  <span className="font-bold text-slate-900 text-sm">{searchedCandidate.sponsorName || 'Al-Hera Saudi Client'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Visa / Wakala Details:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {searchedCandidate.visaNumber
                      ? `Visa: ${searchedCandidate.visaNumber}`
                      : (searchedCandidate.wakalaNumber ? `Wakala: ${searchedCandidate.wakalaNumber}` : 'Wakala In Process')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Destination Country:</span>
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                    <span>🇸🇦 Saudi Arabia</span>
                  </span>
                </div>
              </div>

              {/* Extended Dossier Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-white border-b border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block">Father's Name:</span>
                  <span className="font-medium text-slate-800">{searchedCandidate.fatherName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Passport Expiry:</span>
                  <span className="font-medium text-slate-800">{searchedCandidate.passportExpiry || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">MOFA Number:</span>
                  <span className="font-mono font-medium text-slate-800">{searchedCandidate.mofaNumber || 'In Process'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Partner Office / Agent:</span>
                  <span className="font-medium text-slate-800">{searchedCandidate.partnerOfficeName || 'Direct Al-Hera'}</span>
                </div>
              </div>

              {/* Flight Details Ribbon (if available) */}
              {searchedCandidate.flightDetails && (
                <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-950 text-white flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-amber-400">
                      <Plane className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                        CONFIRMED FLIGHT DEPARTURE
                      </span>
                      <p className="font-bold text-sm text-white">
                        {searchedCandidate.flightDetails.airline} ({searchedCandidate.flightDetails.flightNumber})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <span className="text-slate-300 text-[10px] block">Departure Date & Route:</span>
                      <span className="font-bold text-amber-300">
                        {searchedCandidate.flightDetails.departureDate} ({searchedCandidate.flightDetails.departureCity} ➔ {searchedCandidate.flightDetails.arrivalCity})
                      </span>
                    </div>
                    <div className="bg-white/10 px-2.5 py-1 rounded border border-white/20">
                      <span className="text-slate-300 text-[9px] block">PNR:</span>
                      <span className="font-mono font-bold text-amber-400">{searchedCandidate.flightDetails.pnr}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Document Scans & Verification Badges */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
              <h3 className="text-base font-bold text-[#0F1E36] font-display mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                Verified Candidate Documentation & Credentials
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <span className="font-medium text-slate-700">Passport Copy:</span>
                  {searchedCandidate.passportScanUrl ? (
                    <a
                      href={searchedCandidate.passportScanUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Attached</span>
                    </a>
                  ) : (
                    <span className="text-slate-400">On Record</span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <span className="font-medium text-slate-700">GAMCA Medical:</span>
                  {searchedCandidate.medicalReportUrl ? (
                    <a
                      href={searchedCandidate.medicalReportUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Fit Report</span>
                    </a>
                  ) : (
                    <span className="text-emerald-600 font-semibold">Medical Fit</span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <span className="font-medium text-slate-700">Trade Test Cert:</span>
                  {searchedCandidate.tradeCertificateUrl ? (
                    <a
                      href={searchedCandidate.tradeCertificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </a>
                  ) : (
                    <span className="text-slate-500">Verified</span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <span className="font-medium text-slate-700">Candidate CV:</span>
                  {searchedCandidate.cvUrl ? (
                    <a
                      href={searchedCandidate.cvUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View CV</span>
                    </a>
                  ) : (
                    <span className="text-slate-400">Archived</span>
                  )}
                </div>
              </div>
            </div>

            {/* Complete 7-Stage Interactive Status Timeline */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
              <h3 className="text-lg font-bold text-[#0F1E36] font-display mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Complete Step-by-Step Visa & Deployment Journey
              </h3>

              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {TIMELINE_STEPS.map((step, idx) => {
                  const statusType = getStepStatus(step.key, searchedCandidate.status);

                  let circleBg = 'bg-slate-200 text-slate-500 border-slate-300';
                  let cardBg = 'bg-slate-50 border-slate-200';
                  let titleColor = 'text-slate-500';

                  if (statusType === 'completed') {
                    circleBg = 'bg-emerald-600 text-white border-emerald-700 shadow-md';
                    cardBg = 'bg-emerald-50/50 border-emerald-200';
                    titleColor = 'text-emerald-950 font-bold';
                  } else if (statusType === 'current') {
                    circleBg = 'bg-amber-500 text-slate-950 border-amber-600 ring-4 ring-amber-400/30 animate-pulse';
                    cardBg = 'bg-amber-50 border-amber-300 shadow-md';
                    titleColor = 'text-amber-950 font-bold';
                  }

                  // Find if there is specific note in statusHistory
                  const historyMatch = Array.isArray(searchedCandidate.statusHistory)
                    ? searchedCandidate.statusHistory.find((h) => h.status === step.key)
                    : undefined;

                  return (
                    <div key={step.key} className="relative flex items-start gap-4">
                      {/* Step Circle */}
                      <div
                        className={`absolute -left-6 sm:-left-8 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all shrink-0 ${circleBg}`}
                      >
                        {statusType === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>

                      {/* Step Content Card */}
                      <div className={`flex-1 p-4 rounded-xl border transition-all ${cardBg}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{step.icon}</span>
                            <h4 className={`text-sm ${titleColor}`}>{step.label}</h4>
                          </div>

                          {historyMatch && historyMatch.timestamp && (
                            <span className="text-[11px] text-slate-500 font-mono">
                              {new Date(historyMatch.timestamp).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 mt-1">{step.description}</p>

                        {historyMatch && (
                          <div className="mt-2 pt-2 border-t border-slate-200/80 text-xs text-slate-700">
                            {historyMatch.notes && (
                              <p>
                                <strong>Officer Note:</strong> {historyMatch.notes}
                              </p>
                            )}
                            {historyMatch.updatedBy && (
                              <span className="text-[10px] text-slate-500 block mt-0.5">
                                Verified by: {historyMatch.updatedBy}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
