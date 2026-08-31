import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  FileImage,
  Copy,
  CheckCircle2,
  Building2,
  MapPin,
  Calendar,
  X,
  Save,
  Search,
  RefreshCw,
  AlertCircle,
  Clock,
  Users,
  UserCheck,
  UserPlus,
  Lock,
  Unlock,
  History,
  Eye,
  ArrowRight,
  Ban,
  DollarSign,
  Check,
  Phone,
  Layers,
  ChevronRight
} from 'lucide-react';
import { JobVacancy, AgencyInfo, Candidate, JobStatusType, PartnerOffice } from '../../types';
import {
  getAgencyInfo,
  getCandidates,
  getPartners,
  getCurrentUser,
  saveJobs,
  closeJobManually,
  cancelJobManually,
  reopenJobManually,
} from '../../lib/storage';
import {
  computeJobCandidateMetrics,
  generateJobId,
  createJobStatusHistoryEvent,
  enrichAllJobsWithMetrics,
} from '../../lib/jobCalculations';
import { PublicJobPosterModal } from '../public/PublicJobPosterModal';

interface JobManagementProps {
  jobs: JobVacancy[];
  onSaveJob: (job: JobVacancy) => void;
  onDeleteJob: (jobId: string) => void;
  agencyInfo?: AgencyInfo;
}

export const JobManagement: React.FC<JobManagementProps> = ({
  jobs: initialJobs,
  onSaveJob,
  onDeleteJob,
  agencyInfo: propAgency,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | JobStatusType>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobVacancy | null>(null);
  const [selectedPosterJob, setSelectedPosterJob] = useState<JobVacancy | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals for Actions
  const [reopenModalJob, setReopenModalJob] = useState<JobVacancy | null>(null);
  const [reopenExtraVacancies, setReopenExtraVacancies] = useState<number>(0);
  const [reopenNotes, setReopenNotes] = useState('');

  const [closeModalJob, setCloseModalJob] = useState<JobVacancy | null>(null);
  const [closeNotes, setCloseNotes] = useState('Recruitment process completed by client');

  const [cancelModalJob, setCancelModalJob] = useState<JobVacancy | null>(null);
  const [cancelNotes, setCancelNotes] = useState('Client cancelled job demand');

  const [historyModalJob, setHistoryModalJob] = useState<JobVacancy | null>(null);
  const [historyActiveTab, setHistoryActiveTab] = useState<'timeline' | 'candidates'>('timeline');

  const agency = propAgency || getAgencyInfo();
  const candidates = getCandidates();
  const partners = getPartners();
  const currentUser = getCurrentUser();
  const adminName = currentUser?.name || currentUser?.email || 'Al-Hera Operations Admin';

  // Ensure all jobs have live candidate counts & computed statuses
  const jobs = enrichAllJobsWithMetrics(initialJobs, candidates);

  // Form State
  const [jobCode, setJobCode] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Driving & Logistics');
  const [companyName, setCompanyName] = useState('');
  const [partnerOfficeId, setPartnerOfficeId] = useState('');
  const [city, setCity] = useState('Riyadh');
  const [sectorLocation, setSectorLocation] = useState('Riyadh Mega Infrastructure Project');
  const [country, setCountry] = useState('Saudi Arabia');
  const [salaryMin, setSalaryMin] = useState(2200);
  const [salaryMax, setSalaryMax] = useState(2800);
  const [currency, setCurrency] = useState('SAR');
  const [openingsCount, setOpeningsCount] = useState(4);
  const [dutyHours, setDutyHours] = useState('8 Hours + 2 Hours Overtime');
  const [contractPeriod, setContractPeriod] = useState('2 Years (Renewable)');
  const [ageLimit, setAgeLimit] = useState('22 - 45 Years');
  const [experienceRequired, setExperienceRequired] = useState('Gulf Return or 3+ Years Indian Experience');
  const [foodProvided, setFoodProvided] = useState(true);
  const [accommodationProvided, setAccommodationProvided] = useState(true);
  const [transportProvided, setTransportProvided] = useState(true);
  const [medicalInsurance, setMedicalInsurance] = useState(true);
  const [tradeTestRequired, setTradeTestRequired] = useState(true);
  const [interviewDate, setInterviewDate] = useState('2025-10-15');
  const [interviewVenue, setInterviewVenue] = useState('Al-Hera Trade Test Center & Video Selection');
  const [description, setDescription] = useState('');
  const [requirementsText, setRequirementsText] = useState('Valid Driving License\nClean background\nPhysical fitness');
  const [benefitsText, setBenefitsText] = useState('Free Food\nFurnished Accommodation\nMedical & Iqama');

  const openNewJob = () => {
    setEditingJob(null);
    const newId = generateJobId(jobs, 'SAUD');
    setJobCode(newId);
    setTitle('');
    setCategory('Driving & Logistics');
    setCompanyName('Almarai Logistics & Transport Co.');
    setPartnerOfficeId(partners[0]?.id || '');
    setCity('Riyadh');
    setSectorLocation('Riyadh Mega Infrastructure Project');
    setCountry('Saudi Arabia');
    setSalaryMin(2200);
    setSalaryMax(2800);
    setCurrency('SAR');
    setOpeningsCount(4);
    setDutyHours('8 Hours + Overtime');
    setContractPeriod('2 Years (Renewable)');
    setAgeLimit('22 - 45 Years');
    setExperienceRequired('Valid Indian or GCC Heavy / Light License');
    setFoodProvided(true);
    setAccommodationProvided(true);
    setTransportProvided(true);
    setMedicalInsurance(true);
    setTradeTestRequired(true);
    setInterviewDate('2025-10-20');
    setInterviewVenue('Al-Hera Trade Test Center, Mumbai & Rajasthan');
    setDescription('Direct client requirement for overseas deployment with verified sponsor visa and electronic Wakala.');
    setRequirementsText('Valid Passport (Min. 18 Months validity)\nTrade Experience Certificate\nGAMCA Medical Fit');
    setBenefitsText('Free Air-Conditioned Accommodation\nDuty Food or Food Allowance\nMedical Insurance & Iqama\nRound-trip Flight Ticket');
    setIsModalOpen(true);
  };

  const openEditJob = (job: JobVacancy) => {
    setEditingJob(job);
    setJobCode(job.jobCode);
    setTitle(job.title);
    setCategory(job.category);
    setCompanyName(job.companyName);
    setPartnerOfficeId(job.partnerOfficeId || '');
    setCity(job.city);
    setSectorLocation(job.sectorLocation || job.city);
    setCountry(job.country);
    setSalaryMin(job.salaryMin);
    setSalaryMax(job.salaryMax);
    setCurrency(job.currency);
    setOpeningsCount(job.openingsCount || job.requiredCandidates || 1);
    setDutyHours(job.dutyHours);
    setContractPeriod(job.contractPeriod);
    setAgeLimit(job.ageLimit);
    setExperienceRequired(job.experienceRequired);
    setFoodProvided(job.foodProvided);
    setAccommodationProvided(job.accommodationProvided);
    setTransportProvided(job.transportProvided);
    setMedicalInsurance(job.medicalInsurance);
    setTradeTestRequired(Boolean(job.tradeTestRequired));
    setInterviewDate(job.interviewDate || '');
    setInterviewVenue(job.interviewVenue || '');
    setDescription(job.description || '');
    setRequirementsText((job.requirements || []).join('\n'));
    setBenefitsText((job.benefits || []).join('\n'));
    setIsModalOpen(true);
  };

  const handleRegenerateId = () => {
    const freshId = generateJobId(jobs, 'SAUD');
    setJobCode(freshId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedPartner = partners.find((p) => p.id === partnerOfficeId);
    const parsedReqs = requirementsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedBenefits = benefitsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const now = new Date().toISOString();

    if (editingJob) {
      // Edit existing
      const existingHistory = editingJob.statusHistory ? [...editingJob.statusHistory] : [];
      const updatedJob: JobVacancy = {
        ...editingJob,
        jobCode: jobCode.trim() || editingJob.jobCode,
        title: title.trim(),
        category,
        companyName: companyName.trim(),
        partnerOfficeId,
        partnerOfficeName: selectedPartner?.agencyName || editingJob.partnerOfficeName,
        city: city.trim(),
        sectorLocation: sectorLocation.trim() || city.trim(),
        country,
        salaryMin: Number(salaryMin),
        salaryMax: Number(salaryMax),
        currency,
        openingsCount: Number(openingsCount),
        requiredCandidates: Number(openingsCount),
        dutyHours,
        contractPeriod,
        ageLimit,
        experienceRequired,
        foodProvided,
        accommodationProvided,
        transportProvided,
        medicalInsurance,
        tradeTestRequired,
        interviewDate,
        interviewVenue,
        description,
        requirements: parsedReqs,
        benefits: parsedBenefits,
        statusHistory: existingHistory,
        updatedAt: now,
      };

      onSaveJob(updatedJob);
    } else {
      // New Job
      const initialHistory = [
        createJobStatusHistoryEvent('CREATED', adminName, 'Job vacancy created in system.', {
          required: Number(openingsCount),
          applied: 0,
          selected: 0,
          assigned: 0,
          remaining: Number(openingsCount),
        }),
        createJobStatusHistoryEvent('OPEN', adminName, 'Job post opened for candidates.', {
          required: Number(openingsCount),
          applied: 0,
          selected: 0,
          assigned: 0,
          remaining: Number(openingsCount),
        }),
      ];

      const newJob: JobVacancy = {
        id: 'job-' + Date.now(),
        jobCode: jobCode.trim() || generateJobId(jobs, 'SAUD'),
        title: title.trim(),
        category,
        companyName: companyName.trim(),
        partnerOfficeId,
        partnerOfficeName: selectedPartner?.agencyName,
        city: city.trim(),
        sectorLocation: sectorLocation.trim() || city.trim(),
        country,
        salaryMin: Number(salaryMin),
        salaryMax: Number(salaryMax),
        currency,
        openingsCount: Number(openingsCount),
        requiredCandidates: Number(openingsCount),
        dutyHours,
        contractPeriod,
        ageLimit,
        experienceRequired,
        foodProvided,
        accommodationProvided,
        transportProvided,
        medicalInsurance,
        tradeTestRequired,
        interviewDate,
        interviewVenue,
        description,
        requirements: parsedReqs,
        benefits: parsedBenefits,
        status: 'OPEN',
        statusHistory: initialHistory,
        createdAt: now,
        updatedAt: now,
      };

      onSaveJob(newJob);
    }

    setIsModalOpen(false);
  };

  // Reopen Job action
  const handleConfirmReopen = () => {
    if (!reopenModalJob) return;
    const updated = reopenJobManually(reopenModalJob.id, adminName, Number(reopenExtraVacancies) || 0);
    const target = updated.find((j) => j.id === reopenModalJob.id);
    if (target) onSaveJob(target);
    setReopenModalJob(null);
    setReopenExtraVacancies(0);
    setReopenNotes('');
  };

  // Close Job action
  const handleConfirmClose = () => {
    if (!closeModalJob) return;
    const updated = closeJobManually(closeModalJob.id, adminName, closeNotes);
    const target = updated.find((j) => j.id === closeModalJob.id);
    if (target) onSaveJob(target);
    setCloseModalJob(null);
  };

  // Cancel Job action
  const handleConfirmCancel = () => {
    if (!cancelModalJob) return;
    const updated = cancelJobManually(cancelModalJob.id, adminName, cancelNotes);
    const target = updated.find((j) => j.id === cancelModalJob.id);
    if (target) onSaveJob(target);
    setCancelModalJob(null);
  };

  // WhatsApp Broadcast Copy
  const handleCopyWhatsAppBroadcast = (job: JobVacancy) => {
    const metrics = computeJobCandidateMetrics(job, candidates);
    const statusLabel =
      metrics.status === 'FULL'
        ? '🔵 FULL (Quota Completed)'
        : metrics.status === 'IN_PROGRESS'
        ? `🟡 IN PROGRESS (${metrics.remaining} Vacancies Left)`
        : metrics.status === 'CLOSED'
        ? '⚫ CLOSED'
        : metrics.status === 'CANCELLED'
        ? '🔴 CANCELLED'
        : `🟢 OPEN (${metrics.remaining} Vacancies Available)`;

    const text = `🇸🇦 *AL-HERA TRAVELS — JOB POST REQUIREMENT* 🇸🇦\n\n📌 *Job:* ${job.title}\n🔢 *Job ID:* ${job.jobCode}\n🏢 *Company:* ${job.companyName}\n📍 *Sector/City:* ${job.sectorLocation || job.city}, ${job.country}\n💰 *Salary:* ${job.salaryMin} - ${job.salaryMax} ${job.currency} + Overtime\n👥 *Required Vacancies:* ${metrics.required}\n📊 *Live Status:* ${statusLabel}\n\n🎁 *Perks:* Free Food, Furnished Accommodation, Transport, Medical & Iqama.\n📅 *Interview:* ${job.interviewDate || 'Direct Video Selection'}\n\n*AL-HERA TRAVELS* (Govt. Approved Overseas Recruitment)\n📞 Helpline: ${agency.phone}\n💬 WhatsApp: https://wa.me/${agency.whatsapp}`;

    navigator.clipboard.writeText(text);
    setCopiedId(job.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filtered Jobs
  const filteredJobs = jobs.filter((j) => {
    const metrics = computeJobCandidateMetrics(j, candidates);
    const currentStatus = metrics.status;

    // Status Filter
    if (statusFilter !== 'ALL' && currentStatus !== statusFilter) {
      return false;
    }

    // Search Query
    const q = (searchQuery || '').toLowerCase();
    if (!q) return true;

    return (
      (j.title || '').toLowerCase().includes(q) ||
      (j.jobCode || '').toLowerCase().includes(q) ||
      (j.companyName || '').toLowerCase().includes(q) ||
      (j.city || '').toLowerCase().includes(q) ||
      (j.sectorLocation || '').toLowerCase().includes(q) ||
      (j.partnerOfficeName || '').toLowerCase().includes(q)
    );
  });

  // Calculate Rollup Statistics
  const totalJobsCount = jobs.length;
  const totalRequiredCount = jobs.reduce((sum, j) => sum + (j.openingsCount || j.requiredCandidates || 1), 0);
  const totalAppliedCount = jobs.reduce((sum, j) => sum + (j.appliedCount || 0), 0);
  const totalSelectedCount = jobs.reduce((sum, j) => sum + (j.selectedCount || 0), 0);
  const totalAssignedCount = jobs.reduce((sum, j) => sum + (j.assignedCount || 0), 0);
  const totalRemainingCount = jobs.reduce((sum, j) => sum + (j.remainingCount || 0), 0);

  const countByStatus = {
    OPEN: jobs.filter((j) => j.computedStatus === 'OPEN').length,
    IN_PROGRESS: jobs.filter((j) => j.computedStatus === 'IN_PROGRESS').length,
    FULL: jobs.filter((j) => j.computedStatus === 'FULL').length,
    CLOSED: jobs.filter((j) => j.computedStatus === 'CLOSED').length,
    CANCELLED: jobs.filter((j) => j.computedStatus === 'CANCELLED').length,
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-950 font-bold text-[11px] uppercase tracking-wider">
              Recruitment Operations
            </span>
            <span className="text-xs text-slate-400 font-mono">• Al-Hera Job Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F1E36] font-display">
            Job Vacancy & Auto-Close Status System
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Real-time candidate counting (Required, Applied, Selected, Assigned, Remaining), automatic FULL closure, admin reopen controls, and audit history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openNewJob}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Job Vacancy</span>
          </button>
        </div>
      </div>

      {/* 5-Metric Rollup Summary Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">Total Posts</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-2xl font-black text-slate-900 font-mono">{totalJobsCount}</strong>
            <span className="text-[11px] text-slate-500">jobs</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">Required</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-2xl font-black text-amber-700 font-mono">{totalRequiredCount}</strong>
            <span className="text-[11px] text-amber-800">target</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">Applied</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-2xl font-black text-indigo-600 font-mono">{totalAppliedCount}</strong>
            <span className="text-[11px] text-indigo-700">candidates</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">Selected</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-2xl font-black text-emerald-600 font-mono">{totalSelectedCount}</strong>
            <span className="text-[11px] text-emerald-700">passed</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">Assigned</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-2xl font-black text-blue-600 font-mono">{totalAssignedCount}</strong>
            <span className="text-[11px] text-blue-700">active visas</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <span className="text-[11px] font-bold text-emerald-900 block uppercase">Remaining</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-2xl font-black text-emerald-700 font-mono">{totalRemainingCount}</strong>
            <span className="text-[11px] text-emerald-800">openings</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Status Tab Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>All Jobs</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-amber-400 font-mono">
              {totalJobsCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('OPEN')}
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              statusFilter === 'OPEN'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <span>🟢 OPEN</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-700 text-white font-mono">
              {countByStatus.OPEN}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span>🟡 IN PROGRESS</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-950 font-mono font-bold">
              {countByStatus.IN_PROGRESS}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('FULL')}
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              statusFilter === 'FULL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <span>🔵 FULL</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-700 text-white font-mono">
              {countByStatus.FULL}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('CLOSED')}
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              statusFilter === 'CLOSED'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <span>⚫ CLOSED</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-slate-200 font-mono">
              {countByStatus.CLOSED}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('CANCELLED')}
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              statusFilter === 'CANCELLED'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <span>🔴 CANCELLED</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-700 text-white font-mono">
              {countByStatus.CANCELLED}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Job ID (e.g. AHT-SAUD-00125), Job Title, Partner Office, Saudi Employer, or Sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-700">No Job Vacancies Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No job records match the selected filter or search keyword.
          </p>
          <button
            onClick={openNewJob}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Vacancy</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredJobs.map((job) => {
            const metrics = computeJobCandidateMetrics(job, candidates);
            const status = metrics.status;

            return (
              <div
                key={job.id}
                id={`job-admin-card-${job.jobCode}`}
                className={`bg-white rounded-2xl border transition-all p-6 flex flex-col justify-between shadow-sm hover:shadow-md ${
                  status === 'FULL'
                    ? 'border-blue-300 ring-1 ring-blue-100 bg-gradient-to-b from-blue-50/20 to-white'
                    : status === 'CLOSED'
                    ? 'border-slate-300 opacity-90'
                    : status === 'CANCELLED'
                    ? 'border-rose-300 bg-rose-50/10'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Top Bar: Job Code, Status Badge, Title */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-900 text-amber-400">
                          {job.jobCode}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">{job.category}</span>
                      </div>
                      <h3 className="text-xl font-bold text-[#0F1E36] font-display mt-1.5">{job.title}</h3>
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <strong className="text-slate-800">{job.companyName}</strong>
                        <span>•</span>
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{job.sectorLocation || job.city}, {job.country}</span>
                      </p>
                    </div>

                    {/* Prominent Status Badge */}
                    <div className="shrink-0 text-right">
                      {status === 'OPEN' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-black shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                          <span>🟢 OPEN</span>
                        </span>
                      )}

                      {status === 'IN_PROGRESS' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-950 text-xs font-black shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>🟡 IN PROGRESS</span>
                        </span>
                      )}

                      {status === 'FULL' && (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-600 text-white text-xs font-black shadow-md uppercase tracking-wider">
                            <Lock className="w-3.5 h-3.5" />
                            <span>🔵 FULL</span>
                          </span>
                          <span className="text-[10px] text-blue-700 block font-bold mt-0.5">All Vacancies Filled</span>
                        </div>
                      )}

                      {status === 'CLOSED' && (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-100 text-xs font-bold">
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>⚫ CLOSED</span>
                          </span>
                          {job.closedAt && (
                            <span className="text-[9px] text-slate-500 block mt-0.5">
                              {new Date(job.closedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}

                      {status === 'CANCELLED' && (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-800 text-xs font-black">
                            <Ban className="w-3.5 h-3.5 text-rose-600" />
                            <span>🔴 CANCELLED</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Partner Office Notice if linked */}
                  {job.partnerOfficeName && (
                    <div className="mb-3 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-600" />
                        <span>Source Partner:</span>
                        <strong className="text-slate-800">{job.partnerOfficeName}</strong>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        Salary: {job.salaryMin} - {job.salaryMax} {job.currency}
                      </span>
                    </div>
                  )}

                  {/* 5-Column Automatic Candidate Counting Matrix */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 my-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-2 border-b border-slate-200 pb-1.5">
                      <span className="flex items-center gap-1 text-slate-700">
                        <Users className="w-3.5 h-3.5 text-amber-600" />
                        Candidate Quota & Live Progress
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Auto-Calculated</span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 text-center">
                      {/* Required */}
                      <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
                        <span className="text-[9px] font-bold text-slate-500 uppercase block">Required</span>
                        <strong className="text-base font-black text-slate-900 font-mono">{metrics.required}</strong>
                        <span className="text-[8px] text-slate-400 block font-semibold">Quota</span>
                      </div>

                      {/* Applied */}
                      <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
                        <span className="text-[9px] font-bold text-indigo-600 uppercase block">Applied</span>
                        <strong className="text-base font-black text-indigo-700 font-mono">{metrics.applied}</strong>
                        <span className="text-[8px] text-indigo-500 block font-semibold">Total</span>
                      </div>

                      {/* Selected */}
                      <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
                        <span className="text-[9px] font-bold text-emerald-600 uppercase block">Selected</span>
                        <strong className="text-base font-black text-emerald-700 font-mono">{metrics.selected}</strong>
                        <span className="text-[8px] text-emerald-500 block font-semibold">Passed</span>
                      </div>

                      {/* Assigned */}
                      <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
                        <span className="text-[9px] font-bold text-blue-600 uppercase block">Assigned</span>
                        <strong className="text-base font-black text-blue-700 font-mono">{metrics.assigned}</strong>
                        <span className="text-[8px] text-blue-500 block font-semibold">Visas</span>
                      </div>

                      {/* Remaining */}
                      <div
                        className={`p-2 rounded-lg border shadow-xs ${
                          metrics.remaining === 0
                            ? 'bg-rose-50 border-rose-200 text-rose-900'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        }`}
                      >
                        <span className="text-[9px] font-bold uppercase block">Remaining</span>
                        <strong className="text-base font-black font-mono">{metrics.remaining}</strong>
                        <span className="text-[8px] block font-bold">
                          {metrics.remaining === 0 ? 'FULL' : 'Open'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2.5">
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-semibold">
                        <span>Fill Progress: {Math.min(100, Math.round((metrics.assigned / (metrics.required || 1)) * 100))}%</span>
                        <span>{metrics.assigned} of {metrics.required} Assigned</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            metrics.remaining === 0
                              ? 'bg-blue-600'
                              : metrics.assigned > 0
                              ? 'bg-amber-500'
                              : 'bg-slate-300'
                          }`}
                          style={{
                            width: `${Math.min(100, Math.round((metrics.assigned / (metrics.required || 1)) * 100))}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Joining details & date */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 mb-3">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[10px] block">Duty Hours & Contract</span>
                      <span className="font-semibold text-[11px]">{job.dutyHours} • {job.contractPeriod}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[10px] block">Client Interview Date</span>
                      <span className="font-semibold text-[11px] text-amber-900">
                        {job.interviewDate || 'Direct Video Selection'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Reopen Action (when FULL, CLOSED or CANCELLED) */}
                    {(status === 'FULL' || status === 'CLOSED' || status === 'CANCELLED') && (
                      <button
                        onClick={() => {
                          setReopenModalJob(job);
                          setReopenExtraVacancies(0);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                        title="Reopen vacancy and allow candidate assignments"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Reopen Job</span>
                      </button>
                    )}

                    {/* Manual Close Action (when OPEN or IN_PROGRESS) */}
                    {(status === 'OPEN' || status === 'IN_PROGRESS') && (
                      <button
                        onClick={() => {
                          setCloseModalJob(job);
                          setCloseNotes('Recruitment process completed by client');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
                        title="Manually close this job vacancy"
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Close</span>
                      </button>
                    )}

                    {/* History & Candidate Pipeline */}
                    <button
                      onClick={() => {
                        setHistoryModalJob(job);
                        setHistoryActiveTab('timeline');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
                      title="View audit history and candidate pipeline"
                    >
                      <History className="w-3.5 h-3.5 text-indigo-600" />
                      <span>History ({metrics.applied})</span>
                    </button>

                    {/* Poster Studio */}
                    <button
                      onClick={() => setSelectedPosterJob(job)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      title="Generate High-Res Social Media Job Flyer"
                    >
                      <FileImage className="w-3.5 h-3.5" />
                      <span>Flyer</span>
                    </button>

                    {/* Copy WA Text */}
                    <button
                      onClick={() => handleCopyWhatsAppBroadcast(job)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                      title="Copy WhatsApp Message"
                    >
                      <Copy className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{copiedId === job.id ? 'Copied!' : 'Copy WA'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1 ml-auto">
                    {/* Cancel Action */}
                    {status !== 'CANCELLED' && (
                      <button
                        onClick={() => {
                          setCancelModalJob(job);
                          setCancelNotes('Client cancelled demand');
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-700"
                        title="Cancel Job"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Edit */}
                    <button
                      onClick={() => openEditJob(job)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                      title="Edit Job Vacancy"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (confirm(`Delete vacancy "${job.title}" (${job.jobCode})?`)) {
                          onDeleteJob(job.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700"
                      title="Delete Job"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Create / Edit Job Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-8 overflow-hidden animate-fade-in">
            <div className="bg-[#0F1E36] p-6 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-widest block mb-0.5">
                  Al-Hera Travels Recruitment System
                </span>
                <h3 className="font-bold text-lg font-display">
                  {editingJob ? `Edit Job Vacancy: ${editingJob.title}` : 'Post New Job Vacancy'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-300 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Section 1: Identification & Quota */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 border-b pb-1.5">
                  <Briefcase className="w-4 h-4 text-amber-600" />
                  1. Job Vacancy Identification & Quota
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Job ID (Auto-Generated) *
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        required
                        value={jobCode}
                        onChange={(e) => setJobCode(e.target.value)}
                        placeholder="e.g. AHT-SAUD-00125"
                        className="w-full border border-slate-300 rounded-lg p-2.5 font-mono font-bold text-slate-900 bg-amber-50/50"
                      />
                      <button
                        type="button"
                        onClick={handleRegenerateId}
                        className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                        title="Generate New Job Code"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Job Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Return House Driver / Heavy Equipment Operator"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Required Candidates / Vacancy Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={openingsCount}
                      onChange={(e) => setOpeningsCount(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg p-2.5 font-black text-amber-900 text-sm bg-amber-50"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Auto-close activates when assigned reaches this count.
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Country *</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 font-semibold"
                    >
                      <option value="Saudi Arabia">Saudi Arabia 🇸🇦</option>
                      <option value="United Arab Emirates">United Arab Emirates 🇦🇪</option>
                      <option value="Qatar">Qatar 🇶🇦</option>
                      <option value="Oman">Oman 🇴🇲</option>
                      <option value="Kuwait">Kuwait 🇰🇼</option>
                      <option value="Bahrain">Bahrain 🇧🇭</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sector / City Location *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Riyadh Mega Projects / Dammam Industrial"
                      value={sectorLocation}
                      onChange={(e) => {
                        setSectorLocation(e.target.value);
                        setCity(e.target.value);
                      }}
                      className="w-full border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Sponsor, Partner & Salary */}
              <div className="pt-2">
                <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 border-b pb-1.5">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  2. Employer, Partner Office & Salary
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Partner Office / Channel</label>
                    <select
                      value={partnerOfficeId}
                      onChange={(e) => setPartnerOfficeId(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 font-semibold"
                    >
                      <option value="">-- Direct Saudi Sponsor / Al-Hera Direct --</option>
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.agencyName} ({p.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Saudi Employer / Enterprise *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Almarai Logistics Co."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Industry Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5"
                    >
                      <option value="Driving & Logistics">Driving & Logistics</option>
                      <option value="Technical & Engineering">Technical & Engineering</option>
                      <option value="Construction & Civil">Construction & Civil</option>
                      <option value="Hospitality & Catering">Hospitality & Catering</option>
                      <option value="General & Facilities">General & Facilities</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Min Salary</label>
                    <input
                      type="number"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg p-2.5 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Max Salary</label>
                    <input
                      type="number"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg p-2.5 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 font-bold"
                    >
                      <option value="SAR">SAR (Saudi Riyal)</option>
                      <option value="AED">AED (UAE Dirham)</option>
                      <option value="QAR">QAR (Qatari Riyal)</option>
                      <option value="OMR">OMR (Omani Rial)</option>
                      <option value="KWD">KWD (Kuwaiti Dinar)</option>
                      <option value="INR">INR (Indian Rupee)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Joining Terms & Interview */}
              <div className="pt-2">
                <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 border-b pb-1.5">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  3. Application & Joining Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Duty Hours</label>
                    <input
                      type="text"
                      value={dutyHours}
                      onChange={(e) => setDutyHours(e.target.value)}
                      placeholder="e.g. 8 Hours + 2 Hours Fixed Overtime"
                      className="w-full border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contract Period</label>
                    <input
                      type="text"
                      value={contractPeriod}
                      onChange={(e) => setContractPeriod(e.target.value)}
                      placeholder="e.g. 2 Years (Renewable)"
                      className="w-full border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Age Limit</label>
                    <input
                      type="text"
                      value={ageLimit}
                      onChange={(e) => setAgeLimit(e.target.value)}
                      placeholder="e.g. 22 - 45 Years"
                      className="w-full border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Client Interview Date</label>
                    <input
                      type="date"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Interview Venue & Center</label>
                    <input
                      type="text"
                      value={interviewVenue}
                      onChange={(e) => setInterviewVenue(e.target.value)}
                      placeholder="e.g. Al-Hera Center Mumbai & Rajasthan / Direct Video Selection"
                      className="w-full border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>
                </div>

                {/* Free Perks Checklist */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t mt-3">
                  <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={foodProvided}
                      onChange={(e) => setFoodProvided(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Free Food / Mess</span>
                  </label>
                  <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accommodationProvided}
                      onChange={(e) => setAccommodationProvided(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Free Accommodation</span>
                  </label>
                  <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={transportProvided}
                      onChange={(e) => setTransportProvided(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Free Transport</span>
                  </label>
                  <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={medicalInsurance}
                      onChange={(e) => setMedicalInsurance(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Medical & Iqama</span>
                  </label>
                </div>
              </div>

              {/* Section 4: Description & Requirements */}
              <div className="pt-2">
                <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 border-b pb-1.5">
                  <FileImage className="w-4 h-4 text-amber-600" />
                  4. Job Description & Requirements
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Job Description</label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter detailed job overview for candidates..."
                      className="w-full border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Candidate Requirements (One per line)
                      </label>
                      <textarea
                        rows={3}
                        value={requirementsText}
                        onChange={(e) => setRequirementsText(e.target.value)}
                        placeholder="Valid License&#10;Clean driving record&#10;GAMCA Medical Fit"
                        className="w-full border border-slate-300 rounded-lg p-2.5 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Benefits & Allowances (One per line)
                      </label>
                      <textarea
                        rows={3}
                        value={benefitsText}
                        onChange={(e) => setBenefitsText(e.target.value)}
                        placeholder="Free Furnished Acc&#10;Food Allowance&#10;Return Flight Ticket"
                        className="w-full border border-slate-300 rounded-lg p-2.5 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Save Actions */}
              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-white font-bold flex items-center gap-2 shadow-md"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>{editingJob ? 'Update Job Vacancy' : 'Save & Publish Vacancy'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Reopen Job Confirmation Dialog */}
      {reopenModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-fade-in space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-emerald-100 text-emerald-700">
                <Unlock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Reopen Job Vacancy</h3>
                <p className="text-xs text-slate-500 font-mono">{reopenModalJob.jobCode}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold">Are you sure you want to reopen this job?</p>
              <p className="text-amber-800">
                Position: <strong>{reopenModalJob.title}</strong>
              </p>
              <p className="text-amber-800">
                Reopening will clear the manual close or full lock, allow new candidates to apply, and recalculate status.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1">
                Add Additional Vacancies Quota (Optional):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={reopenExtraVacancies}
                  onChange={(e) => setReopenExtraVacancies(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-bold font-mono"
                />
                <span className="text-xs text-slate-500 shrink-0 font-semibold">
                  New Total: {(reopenModalJob.openingsCount || 1) + (Number(reopenExtraVacancies) || 0)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setReopenModalJob(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReopen}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Reopen Job</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Close Job Confirmation */}
      {closeModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-fade-in space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-slate-100 text-slate-800">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Manually Close Job</h3>
                <p className="text-xs text-slate-500 font-mono">{closeModalJob.jobCode}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Closing this job will set its status to <strong>⚫ CLOSED</strong>, preventing public applications and marking recruitment as completed.
            </p>

            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1">Closing Reason / Notes:</label>
              <input
                type="text"
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="e.g. Recruitment quota fulfilled / Client batch completed"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setCloseModalJob(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Confirm Close Job</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Cancel Job Confirmation */}
      {cancelModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-fade-in space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-rose-100 text-rose-700">
                <Ban className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Cancel Job Vacancy</h3>
                <p className="text-xs text-slate-500 font-mono">{cancelModalJob.jobCode}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to mark this vacancy as <strong>🔴 CANCELLED</strong>?
            </p>

            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1">Cancellation Reason:</label>
              <input
                type="text"
                value={cancelNotes}
                onChange={(e) => setCancelNotes(e.target.value)}
                placeholder="e.g. Sponsor cancelled requirement"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setCancelModalJob(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Ban className="w-4 h-4" />
                <span>Confirm Cancel Job</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Status History & Linked Candidate Pipeline */}
      {historyModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-8 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-[#0F1E36] p-6 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                    {historyModalJob.jobCode}
                  </span>
                  <span className="text-xs text-slate-300 font-semibold">{historyModalJob.category}</span>
                </div>
                <h3 className="font-bold text-lg font-display mt-1">{historyModalJob.title}</h3>
                <p className="text-xs text-slate-300">
                  {historyModalJob.companyName} • {historyModalJob.city}, {historyModalJob.country}
                </p>
              </div>
              <button onClick={() => setHistoryModalJob(null)}>
                <X className="w-5 h-5 text-slate-300 hover:text-white" />
              </button>
            </div>

            {/* Tabs */}
            {(() => {
              const metrics = computeJobCandidateMetrics(historyModalJob, candidates);
              return (
                <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setHistoryActiveTab('timeline')}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 ${
                          historyActiveTab === 'timeline'
                            ? 'bg-[#0F1E36] text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <History className="w-3.5 h-3.5 text-amber-400" />
                        <span>Status Audit Timeline</span>
                      </button>

                      <button
                        onClick={() => setHistoryActiveTab('candidates')}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 ${
                          historyActiveTab === 'candidates'
                            ? 'bg-[#0F1E36] text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span>Linked Candidates ({metrics.applied})</span>
                      </button>
                    </div>

                    <div className="text-right text-[11px] font-mono">
                      <span className="text-slate-500">Current Status: </span>
                      <strong className="font-bold text-slate-900">{metrics.status}</strong>
                    </div>
                  </div>

                  {/* Tab 1: Timeline */}
                  {historyActiveTab === 'timeline' && (
                    <div className="space-y-4">
                      {/* Metric Summary snapshot */}
                      <div className="grid grid-cols-5 gap-2 bg-slate-50 p-3 rounded-xl border text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Required</span>
                          <strong className="text-sm font-mono text-slate-900">{metrics.required}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-indigo-500 block">Applied</span>
                          <strong className="text-sm font-mono text-indigo-700">{metrics.applied}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-500 block">Selected</span>
                          <strong className="text-sm font-mono text-emerald-700">{metrics.selected}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-blue-500 block">Assigned</span>
                          <strong className="text-sm font-mono text-blue-700">{metrics.assigned}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-600 block">Remaining</span>
                          <strong className="text-sm font-mono text-amber-900">{metrics.remaining}</strong>
                        </div>
                      </div>

                      {/* Timeline Events */}
                      <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                        {(!historyModalJob.statusHistory || historyModalJob.statusHistory.length === 0) ? (
                          <div className="p-4 rounded-xl bg-slate-50 border text-center text-slate-500">
                            No explicit status history records found. Current computed status is {metrics.status}.
                          </div>
                        ) : (
                          historyModalJob.statusHistory.map((item, idx) => (
                            <div key={item.id || idx} className="flex items-start gap-3 pl-8 relative">
                              <div className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-amber-500"></div>
                              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex-1">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                        item.status === 'FULL'
                                          ? 'bg-blue-100 text-blue-800'
                                          : item.status === 'OPEN'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : item.status === 'IN_PROGRESS'
                                          ? 'bg-amber-100 text-amber-900'
                                          : item.status === 'CLOSED'
                                          ? 'bg-slate-800 text-white'
                                          : item.status === 'CANCELLED'
                                          ? 'bg-rose-100 text-rose-800'
                                          : 'bg-indigo-100 text-indigo-800'
                                      }`}
                                    >
                                      {item.status}
                                    </span>
                                    <span>by {item.changedBy}</span>
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {new Date(item.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                {item.notes && <p className="text-slate-600 text-xs">{item.notes}</p>}
                                {item.countsSnapshot && (
                                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-100 font-mono">
                                    <span>Req: {item.countsSnapshot.required}</span>
                                    <span>App: {item.countsSnapshot.applied}</span>
                                    <span>Sel: {item.countsSnapshot.selected}</span>
                                    <span>Asg: {item.countsSnapshot.assigned}</span>
                                    <span>Rem: {item.countsSnapshot.remaining}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Linked Candidates */}
                  {historyActiveTab === 'candidates' && (
                    <div className="space-y-3">
                      {metrics.appliedCandidates.length === 0 ? (
                        <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500">
                          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-semibold">No candidates linked yet.</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            When candidates apply for this job online or are assigned by admin, they appear here.
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                          {metrics.appliedCandidates.map((cand) => (
                            <div key={cand.id} className="p-3.5 bg-white flex items-center justify-between gap-3 hover:bg-slate-50">
                              <div className="flex items-center gap-3">
                                {cand.photoUrl ? (
                                  <img
                                    src={cand.photoUrl}
                                    alt={cand.fullName}
                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0">
                                    {cand.fullName.slice(0, 2).toUpperCase()}
                                  </div>
                                )}

                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 text-xs">{cand.fullName}</span>
                                    <span className="text-[10px] font-mono text-slate-500">{cand.trackingId}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-500">
                                    {cand.trade} • {cand.phoneNumber || 'No phone'} • Passport: {cand.passportNumber || 'N/A'}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 uppercase font-mono">
                                  {cand.status.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  Paid: ₹{cand.totalPaid?.toLocaleString() || 0}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="p-4 bg-slate-50 border-t flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryModalJob(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Poster Studio Modal */}
      <PublicJobPosterModal
        job={selectedPosterJob}
        isOpen={!!selectedPosterJob}
        onClose={() => setSelectedPosterJob(null)}
        agencyInfo={agency}
      />
    </div>
  );
};
