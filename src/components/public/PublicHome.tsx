import React, { useState, useEffect } from 'react';
import {
  Search,
  Briefcase,
  Moon,
  ShieldCheck,
  Plane,
  Building2,
  Users,
  Award,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Phone,
  FileImage,
  MapPin,
  Star,
  Lock
} from 'lucide-react';
import { JobVacancy, UmrahPackage, SliderBanner, AgencyInfo, Candidate, PartnerOffice } from '../../types';
import { getJobs, getUmrahPackages, getSliders, getAgencyInfo, getPartners, getCandidates } from '../../lib/storage';
import { computeJobCandidateMetrics, enrichAllJobsWithMetrics } from '../../lib/jobCalculations';
import { PublicApplyModal } from './PublicApplyModal';
import { PublicJobPosterModal } from './PublicJobPosterModal';
import { PublicUmrahBookingModal } from './PublicUmrahBookingModal';

interface PublicHomeProps {
  onNavigate?: (view: string, query?: string) => void;
  onSelectTab?: (tab: string) => void;
  onApplyJob?: (job: JobVacancy) => void;
  onBookUmrah?: (pkg: UmrahPackage) => void;
  onOpenJobPoster?: (job: JobVacancy) => void;
  jobs?: JobVacancy[];
  packages?: UmrahPackage[];
  candidates?: Candidate[];
  partners?: PartnerOffice[];
  sliders?: SliderBanner[];
  agencyInfo?: AgencyInfo;
}

export const PublicHome: React.FC<PublicHomeProps> = ({
  onNavigate,
  onSelectTab,
  onApplyJob,
  onBookUmrah,
  onOpenJobPoster,
  jobs: propJobs,
  packages: propPackages,
  candidates: propCandidates,
  partners: propPartners,
  sliders: propSliders,
  agencyInfo: propAgency,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [quickTrackQuery, setQuickTrackQuery] = useState('');
  const [selectedJobForApply, setSelectedJobForApply] = useState<JobVacancy | null>(null);
  const [selectedJobForPoster, setSelectedJobForPoster] = useState<JobVacancy | null>(null);
  const [selectedPackageForBooking, setSelectedPackageForBooking] = useState<UmrahPackage | null>(null);

  const agency = propAgency || getAgencyInfo();
  const candidates = propCandidates || getCandidates();
  const sliders = (propSliders || getSliders()).filter((s) => s.isActive);
  const rawJobs = propJobs || getJobs();
  const jobs = enrichAllJobsWithMetrics(rawJobs, candidates).slice(0, 4); // Featured jobs
  const umrahPackages = (propPackages || getUmrahPackages()).slice(0, 3); // Featured Umrah

  const navigateTo = (target: string, query?: string) => {
    if (onNavigate) {
      onNavigate(target, query);
    } else if (onSelectTab) {
      if (target.startsWith('public_')) {
        onSelectTab(target.replace('public_', ''));
      } else {
        onSelectTab(target);
      }
    }
  };

  // Auto rotate slides every 6 seconds
  useEffect(() => {
    if (sliders.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliders.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [sliders.length]);

  const handleQuickTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTrackQuery.trim()) {
      navigateTo('public_tracking', quickTrackQuery.trim());
    }
  };

  const handleSlideAction = (action: string) => {
    if (action === 'jobs') navigateTo('public_jobs');
    else if (action === 'umrah') navigateTo('public_umrah');
    else if (action === 'track') navigateTo('public_tracking');
    else if (action === 'partners') navigateTo('public_partners');
    else if (action === 'whatsapp') {
      window.open(`https://wa.me/${agency.whatsapp}?text=Assalamu%20Alaikum%20Al-Hera%20Travels`, '_blank');
    } else if (action === 'contact') navigateTo('public_about');
  };

  const activeBanner = sliders[currentSlide] || sliders[0];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Dynamic Hero Slider */}
      <section className="relative bg-[#0A1628] text-white overflow-hidden">
        {activeBanner && (
          <div className="relative min-h-[520px] lg:min-h-[580px] flex items-center">
            {/* Background Image with Gradient Overlay */}
            <div className="absolute inset-0 z-0">
              <img
                src={activeBanner.imageUrl}
                alt={activeBanner.title}
                className="w-full h-full object-cover object-center opacity-35 filter brightness-90 transition-opacity duration-1000"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A1628] via-[#0A1628]/90 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-transparent to-transparent"></div>
            </div>

            {/* Slider Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-16 w-full">
              <div className="max-w-2xl space-y-5 animate-fade-in">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold uppercase tracking-wider backdrop-blur-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{activeBanner.badge}</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-white leading-tight">
                  {activeBanner.title}{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 block">
                    {activeBanner.highlightText}
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {activeBanner.subtitle}
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  <button
                    onClick={() => handleSlideAction(activeBanner.ctaAction)}
                    className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                  >
                    <span>{activeBanner.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {activeBanner.ctaSecondaryText && (
                    <button
                      onClick={() => handleSlideAction(activeBanner.ctaSecondaryAction || 'track')}
                      className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 backdrop-blur-md flex items-center gap-2 transition-all"
                    >
                      <span>{activeBanner.ctaSecondaryText}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Slider Controls */}
            {sliders.length > 1 && (
              <div className="absolute bottom-6 right-8 z-20 hidden sm:flex items-center gap-3">
                <button
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + sliders.length) % sliders.length)}
                  className="p-2.5 rounded-full bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-white border border-slate-700 backdrop-blur-sm transition-all"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1.5">
                  {sliders.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`h-2 rounded-full transition-all ${
                        currentSlide === i ? 'w-8 bg-amber-400' : 'w-2 bg-white/30'
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % sliders.length)}
                  className="p-2.5 rounded-full bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-white border border-slate-700 backdrop-blur-sm transition-all"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Live Quick Tracking Search Ribbon (Docked directly below Hero) */}
        <div className="relative z-20 -mt-8 max-w-5xl mx-auto px-4 sm:px-8">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-amber-500/30 p-4 sm:p-5 text-slate-900">
            <form onSubmit={handleQuickTrackSubmit} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center gap-2.5 sm:border-r border-slate-200 sm:pr-4 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-[#0F1E36] text-amber-400 flex items-center justify-center font-bold">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                    Instant Status Search
                  </span>
                  <strong className="text-sm text-slate-900 font-display">Track Passport / ID</strong>
                </div>
              </div>

              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Enter Passport Number (e.g. Z5891042) or Tracking ID (e.g. AHT-2025-9102)"
                  value={quickTrackQuery}
                  onChange={(e) => setQuickTrackQuery(e.target.value)}
                  className="w-full py-2.5 px-4 text-sm font-medium border border-slate-300 rounded-xl uppercase tracking-wider focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <span>Track Now</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Trust & Key Stats Section */}
      <section className="py-14 px-4 sm:px-8 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-3xl sm:text-4xl font-black text-[#0F1E36] font-display block">15,000+</span>
            <span className="text-xs sm:text-sm font-bold text-amber-800 uppercase tracking-wider mt-1 block">
              Candidates Deployed
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Across Saudi Arabia & Gulf</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-3xl sm:text-4xl font-black text-emerald-700 font-display block">100%</span>
            <span className="text-xs sm:text-sm font-bold text-amber-800 uppercase tracking-wider mt-1 block">
              Genuine Wakala & Visas
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Direct Saudi Enterprise Visas</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-3xl sm:text-4xl font-black text-[#0F1E36] font-display block">280+</span>
            <span className="text-xs sm:text-sm font-bold text-amber-800 uppercase tracking-wider mt-1 block">
              Saudi Employers & Projects
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">NEOM, Almarai, Nesma, Al Fanar</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-3xl sm:text-4xl font-black text-purple-700 font-display block">5,000+</span>
            <span className="text-xs sm:text-sm font-bold text-amber-800 uppercase tracking-wider mt-1 block">
              Satisfied Umrah Pilgrims
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">15 & 21 Days Group Tours</span>
          </div>
        </div>
      </section>

      {/* Featured Saudi Jobs Vacancies */}
      <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>🇸🇦</span> Direct Gulf Recruitment
            </span>
            <h2 className="text-3xl font-extrabold text-[#0F1E36] font-display mt-1">
              Urgent Saudi Arabia Job Openings
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Client Interviews, Free Food, Accommodation & High Overtime
            </p>
          </div>

          <button
            onClick={() => onNavigate('public_jobs')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs shadow-md transition-all self-start md:self-auto"
          >
            <span>View All Saudi Openings</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => {
            const metrics = computeJobCandidateMetrics(job, candidates);
            const isFull = metrics.status === 'FULL';
            const isClosed = metrics.status === 'CLOSED';
            const isCancelled = metrics.status === 'CANCELLED';
            const isUnavailable = isFull || isClosed || isCancelled;

            return (
              <div
                key={job.id}
                className={`bg-white rounded-2xl border shadow-md hover:shadow-xl transition-all p-6 flex flex-col justify-between ${
                  isFull
                    ? 'border-blue-300 ring-1 ring-blue-100 bg-blue-50/10'
                    : isClosed
                    ? 'border-slate-300 opacity-90'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-400">
                          {job.jobCode}
                        </span>

                        {metrics.status === 'OPEN' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            🟢 OPEN ({metrics.remaining} Left)
                          </span>
                        )}

                        {metrics.status === 'IN_PROGRESS' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            🟡 IN PROGRESS ({metrics.remaining} Left)
                          </span>
                        )}

                        {isFull && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-xs flex items-center gap-1 font-mono">
                            <Lock className="w-2.5 h-2.5" />
                            🔵 VACANCY FULL
                          </span>
                        )}

                        {isClosed && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-white font-mono">
                            ⚫ CLOSED
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-[#0F1E36] font-display mt-1.5">{job.title}</h3>
                      <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <strong>{job.companyName}</strong> • {job.sectorLocation || job.city}, Saudi Arabia
                      </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-right shrink-0">
                      <span className="text-[10px] text-amber-900 font-semibold block">Salary</span>
                      <strong className="text-sm font-black text-[#0F1E36] font-display">
                        {job.salaryMin} - {job.salaryMax} {job.currency}
                      </strong>
                      <span className="text-[9px] text-amber-700 block font-bold">+ Overtime</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[11px] mb-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Free Food
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Free Accommodation
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Free Transport
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedJobForPoster(job)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <FileImage className="w-3.5 h-3.5 text-amber-600" />
                    <span>Job Poster</span>
                  </button>

                  {isFull ? (
                    <button
                      disabled
                      className="px-4 py-2 rounded-xl bg-blue-100 text-blue-900 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed border border-blue-300 ml-auto"
                    >
                      <Lock className="w-3.5 h-3.5 text-blue-700" />
                      <span>Vacancy Full (Closed)</span>
                    </button>
                  ) : isClosed ? (
                    <button
                      disabled
                      className="px-4 py-2 rounded-xl bg-slate-200 text-slate-500 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed ml-auto"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Closed</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedJobForApply(job)}
                      className="px-4 py-2 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all ml-auto"
                    >
                      <span>Apply Online</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7-Stage Transparent Recruitment Workflow */}
      <section className="py-16 bg-[#0A1628] text-white px-4 sm:px-8 border-y border-slate-800">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
              Legal & Transparent Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white">
              7-Stage Overseas Deployment Journey
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              Every candidate can track their live progress on our portal at each step of the journey.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-2xl">📝</span>
              <span className="text-[10px] font-bold text-amber-400 uppercase block">Step 01</span>
              <h3 className="font-bold text-base text-white font-display">Document Registration</h3>
              <p className="text-xs text-slate-300">
                Passport validity check, trade qualification & experience credential screening.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-2xl">🎯</span>
              <span className="text-[10px] font-bold text-amber-400 uppercase block">Step 02</span>
              <h3 className="font-bold text-base text-white font-display">Trade Test & Interview</h3>
              <p className="text-xs text-slate-300">
                Direct client interview, driving simulation, or workshop trade test selection.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-2xl">🏥</span>
              <span className="text-[10px] font-bold text-amber-400 uppercase block">Step 03</span>
              <h3 className="font-bold text-base text-white font-display">GAMCA Medical Test</h3>
              <p className="text-xs text-slate-300">
                Medical examination at GAMCA GCC-approved diagnostic centers.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-2xl">📜</span>
              <span className="text-[10px] font-bold text-amber-400 uppercase block">Step 04</span>
              <h3 className="font-bold text-base text-white font-display">Wakala & Embassy Stamping</h3>
              <p className="text-xs text-slate-300">
                Saudi electronic Wakala allocation, MOFA submission and Embassy visa stamping.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Umrah Packages */}
      <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-purple-600" /> Sacred Pilgrimage
            </span>
            <h2 className="text-3xl font-extrabold text-[#0F1E36] font-display mt-1">
              Umrah Packages 2025-2026
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              5-Star Clock Tower Hotels, Direct Saudi Airlines Flights, Indian Food & Ziyarat
            </p>
          </div>

          <button
            onClick={() => navigateTo('public_umrah')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-amber-300 font-bold text-xs shadow-md transition-all self-start md:self-auto"
          >
            <span>Explore All Umrah Packages</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {umrahPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-lg hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 bg-slate-900">
                  <img
                    src={pkg.imageUrl}
                    alt={pkg.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500 text-slate-950">
                      {pkg.badge || `${pkg.durationDays} Days`}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-lg font-bold text-white font-display">{pkg.name}</h3>
                  </div>
                </div>

                <div className="p-5 space-y-2 text-xs">
                  <p className="text-slate-700">
                    <strong className="text-slate-900">Makkah:</strong> {pkg.makkahHotel} ({pkg.makkahDistance})
                  </p>
                  <p className="text-slate-700">
                    <strong className="text-slate-900">Madinah:</strong> {pkg.madinahHotel} ({pkg.madinahDistance})
                  </p>

                  <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-slate-500">Starting from:</span>
                    <strong className="text-base font-black text-[#0F1E36]">
                      ₹{pkg.pricing.quadSharing.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => setSelectedPackageForBooking(pkg)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all"
                >
                  <Moon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Book Package Now</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modals */}
      <PublicApplyModal
        job={selectedJobForApply}
        isOpen={!!selectedJobForApply}
        onClose={() => setSelectedJobForApply(null)}
        onSuccess={(c) => {
          onNavigate('public_tracking', c.trackingId);
        }}
      />

      <PublicJobPosterModal
        job={selectedJobForPoster}
        isOpen={!!selectedJobForPoster}
        onClose={() => setSelectedJobForPoster(null)}
        agencyInfo={agency}
      />

      <PublicUmrahBookingModal
        packageItem={selectedPackageForBooking}
        isOpen={!!selectedPackageForBooking}
        onClose={() => setSelectedPackageForBooking(null)}
        onSuccess={() => {
          alert('Thank you! Your Umrah reservation has been received.');
        }}
      />
    </div>
  );
};
