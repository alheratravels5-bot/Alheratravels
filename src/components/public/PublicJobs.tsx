import React, { useState } from 'react';
import {
  Briefcase,
  Search,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle2,
  Share2,
  FileImage,
  Send,
  Filter,
  Sparkles,
  ShieldCheck,
  Building2,
  Phone,
  Lock,
  Users
} from 'lucide-react';
import { JobVacancy, AgencyInfo } from '../../types';
import { getJobs, getAgencyInfo, getCandidates } from '../../lib/storage';
import { computeJobCandidateMetrics, enrichAllJobsWithMetrics } from '../../lib/jobCalculations';
import { PublicApplyModal } from './PublicApplyModal';
import { PublicJobPosterModal } from './PublicJobPosterModal';

interface PublicJobsProps {
  jobs?: JobVacancy[];
  agencyInfo?: AgencyInfo;
  onApplyJob?: (job: JobVacancy) => void;
  onOpenPoster?: (job: JobVacancy) => void;
  onApplySuccess?: (candidate: any) => void;
}

export const PublicJobs: React.FC<PublicJobsProps> = ({
  jobs: propJobs,
  agencyInfo: propAgency,
  onApplyJob: propOnApplyJob,
  onOpenPoster: propOnOpenPoster,
  onApplySuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedJobForApply, setSelectedJobForApply] = useState<JobVacancy | null>(null);
  const [selectedJobForPoster, setSelectedJobForPoster] = useState<JobVacancy | null>(null);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isPosterOpen, setIsPosterOpen] = useState(false);

  const agency = propAgency || getAgencyInfo();
  const candidates = getCandidates();
  const rawJobs = propJobs || getJobs();
  const jobs = enrichAllJobsWithMetrics(rawJobs, candidates);

  const categories = ['all', 'Technical & Engineering', 'Driving & Logistics', 'Construction & Civil', 'Hospitality & Catering'];
  const cities = ['all', 'Riyadh', 'Jeddah', 'Dammam', 'NEOM Mega Project', 'Medina Munawwarah', 'Jubail Industrial City'];

  const filteredJobs = jobs.filter((job) => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (job.title || '').toLowerCase().includes(q) ||
      (job.jobCode || '').toLowerCase().includes(q) ||
      (job.companyName || '').toLowerCase().includes(q) ||
      (job.city || '').toLowerCase().includes(q);

    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory;
    const matchesCity = selectedCity === 'all' || (job.city || '').toLowerCase().includes(selectedCity.toLowerCase());

    return matchesSearch && matchesCategory && matchesCity;
  });

  const handleOpenApply = (job: JobVacancy) => {
    const metrics = computeJobCandidateMetrics(job, candidates);
    if (metrics.status === 'FULL' || metrics.status === 'CLOSED' || metrics.status === 'CANCELLED') {
      return;
    }
    setSelectedJobForApply(job);
    setIsApplyOpen(true);
  };

  const handleOpenPoster = (job: JobVacancy) => {
    setSelectedJobForPoster(job);
    setIsPosterOpen(true);
  };

  const handleDirectWhatsAppApply = (job: JobVacancy) => {
    const metrics = computeJobCandidateMetrics(job, candidates);
    const text = `Assalamu Alaikum *AL-HERA TRAVELS*,\n\nI want to inquire about *${job.title}* (Job ID: ${job.jobCode}) for ${job.country}.\n\n🏢 Employer: ${job.companyName}\n💰 Salary: ${job.salaryMin} - ${job.salaryMax} ${job.currency}\n📊 Current Status: ${metrics.status}\n\nPlease share interview and joining requirements.`;
    const url = `https://wa.me/${agency.whatsapp}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs font-bold uppercase tracking-wider mb-3">
            <span className="text-sm">🇸🇦</span>
            Direct Saudi Arabia Overseas Vacancies
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F1E36] font-display">
            Explore Urgent Saudi & Gulf Job Openings
          </h1>
          <p className="text-slate-600 text-sm mt-2">
            100% Genuine Work Visas, Free Accommodation, Food, Transportation & Medical Insurance with top Saudi conglomerates and NEOM projects.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search trade, company, job code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full py-2.5 px-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              >
                <option value="all">All Trade Categories</option>
                {categories.filter((c) => c !== 'all').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full py-2.5 px-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              >
                <option value="all">All Saudi Cities / Regions</option>
                {cities.filter((c) => c !== 'all').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Job Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredJobs.map((job) => {
            const metrics = computeJobCandidateMetrics(job, candidates);
            const isFull = metrics.status === 'FULL';
            const isClosed = metrics.status === 'CLOSED';
            const isCancelled = metrics.status === 'CANCELLED';
            const isUnavailable = isFull || isClosed || isCancelled;

            return (
              <div
                key={job.id}
                id={`job-card-${job.jobCode}`}
                className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between shadow-md hover:shadow-xl ${
                  isFull
                    ? 'border-blue-300 ring-1 ring-blue-100 bg-blue-50/10'
                    : isClosed
                    ? 'border-slate-300 opacity-90'
                    : isCancelled
                    ? 'border-rose-300 opacity-75'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Card Top Strip */}
                  <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-amber-400 font-mono">
                          {job.jobCode}
                        </span>

                        {/* Status Badges */}
                        {metrics.status === 'OPEN' && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                            🟢 OPEN ({metrics.remaining} Left)
                          </span>
                        )}

                        {metrics.status === 'IN_PROGRESS' && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            🟡 IN PROGRESS ({metrics.remaining} Left)
                          </span>
                        )}

                        {isFull && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white shadow-xs flex items-center gap-1 font-mono uppercase">
                            <Lock className="w-2.5 h-2.5" />
                            🔵 VACANCY FULL
                          </span>
                        )}

                        {isClosed && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-white flex items-center gap-1 font-mono">
                            ⚫ CLOSED
                          </span>
                        )}

                        {isCancelled && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 font-mono">
                            🔴 CANCELLED
                          </span>
                        )}

                        <span className="text-xs text-slate-500 font-medium">{job.category}</span>
                      </div>

                      <h3 className="text-xl font-bold text-[#0F1E36] font-display">{job.title}</h3>
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <strong className="text-slate-800">{job.companyName}</strong>
                        <span>•</span>
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{job.sectorLocation || job.city}, {job.country}</span>
                      </p>
                    </div>

                    {/* Salary Highlight Box */}
                    <div className="text-right shrink-0 bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                      <span className="text-[10px] text-amber-900 font-semibold block">Monthly Salary</span>
                      <span className="text-base font-black text-[#0F1E36] font-display">
                        {job.salaryMin} - {job.salaryMax} {job.currency}
                      </span>
                      <span className="text-[9px] text-amber-700 block font-bold">+ Overtime</span>
                    </div>
                  </div>

                  {/* Job Specs & Perks Grid */}
                  <div className="p-5 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                        <span className="text-slate-400 text-[10px] block">Quota</span>
                        <strong className="text-slate-800 font-bold font-mono">{metrics.required} Positions</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                        <span className="text-slate-400 text-[10px] block">Duty Hours</span>
                        <strong className="text-slate-800 font-bold">{job.dutyHours.split('+')[0]}</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                        <span className="text-slate-400 text-[10px] block">Contract</span>
                        <strong className="text-slate-800 font-bold">{job.contractPeriod}</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                        <span className="text-slate-400 text-[10px] block">Age Limit</span>
                        <strong className="text-slate-800 font-bold">{job.ageLimit}</strong>
                      </div>
                    </div>

                    {/* Perks Pills */}
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Free Food / Mess
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Free Furnished Acc.
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Free Transport
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Medical & Iqama
                      </span>
                    </div>

                    {job.interviewDate && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-950 flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Client Interview Date:
                        </span>
                        <strong className="font-mono text-amber-900 font-bold">{job.interviewDate}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenPoster(job)}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-all shadow-sm"
                      title="Generate professional flyer for WhatsApp & social media"
                    >
                      <FileImage className="w-3.5 h-3.5 text-amber-600" />
                      <span>Job Poster</span>
                    </button>

                    <button
                      onClick={() => handleDirectWhatsAppApply(job)}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Inquire on WhatsApp</span>
                    </button>
                  </div>

                  {isFull ? (
                    <button
                      disabled
                      className="px-5 py-2 rounded-xl bg-blue-100 text-blue-900 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-not-allowed border border-blue-300 ml-auto"
                      title="All required vacancies for this job have been assigned"
                    >
                      <Lock className="w-3.5 h-3.5 text-blue-700" />
                      <span>Vacancy Full (Closed)</span>
                    </button>
                  ) : isClosed ? (
                    <button
                      disabled
                      className="px-5 py-2 rounded-xl bg-slate-200 text-slate-500 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed ml-auto"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Applications Closed</span>
                    </button>
                  ) : isCancelled ? (
                    <button
                      disabled
                      className="px-5 py-2 rounded-xl bg-rose-100 text-rose-600 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed ml-auto"
                    >
                      <span>Position Cancelled</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenApply(job)}
                      className="px-5 py-2 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all ml-auto"
                    >
                      <Send className="w-3.5 h-3.5 text-amber-400" />
                      <span>Apply Online ({metrics.remaining} Left)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modals */}
        <PublicApplyModal
          job={selectedJobForApply}
          isOpen={isApplyOpen}
          onClose={() => setIsApplyOpen(false)}
          onSuccess={(cand) => {
            if (onApplySuccess) onApplySuccess(cand);
          }}
        />

        <PublicJobPosterModal
          job={selectedJobForPoster}
          isOpen={isPosterOpen}
          onClose={() => setIsPosterOpen(false)}
          agencyInfo={agency}
        />
      </div>
    </div>
  );
};

