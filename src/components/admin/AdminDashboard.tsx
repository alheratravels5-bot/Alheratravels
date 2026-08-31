import React from 'react';
import {
  Users,
  Briefcase,
  Moon,
  CreditCard,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus,
  Plane,
  Download,
  Phone,
  FileText,
  ShieldCheck,
  DollarSign,
  PhoneCall,
  AlertTriangle
} from 'lucide-react';
import { Candidate, JobVacancy, UmrahPackage, PartnerOffice, AgencyInfo } from '../../types';
import { getAgencyInfo, getFollowUps } from '../../lib/storage';

interface AdminDashboardProps {
  candidates: Candidate[];
  jobs: JobVacancy[];
  packages: UmrahPackage[];
  partners: PartnerOffice[];
  onNavigateTab: (tab: string) => void;
  onOpenNewCandidate: () => void;
  onOpenNewJob: () => void;
  onSelectCandidate: (candidate: Candidate) => void;
  agencyInfo?: AgencyInfo;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  candidates,
  jobs,
  packages,
  partners,
  onNavigateTab,
  onOpenNewCandidate,
  onOpenNewJob,
  onSelectCandidate,
  agencyInfo: propAgency,
}) => {
  const agency = propAgency || getAgencyInfo();
  const safeCandidates = Array.isArray(candidates) ? candidates : [];
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const safePackages = Array.isArray(packages) ? packages : [];
  const safePartners = Array.isArray(partners) ? partners : [];

  // CRM follow ups stats
  const followUps = getFollowUps();
  const todayStr = new Date().toISOString().split('T')[0];
  const activeFollowUps = followUps.filter(
    (f) => f.status !== 'completed' && f.status !== 'converted' && f.status !== 'cancelled' && f.status !== 'lost'
  );
  const overdueFollowUps = activeFollowUps.filter((f) => f.scheduledDate < todayStr).length;
  const dueTodayFollowUps = activeFollowUps.filter((f) => f.scheduledDate === todayStr).length;

  // Metric calculations
  const totalCandidates = safeCandidates.length;
  const visaStampedCount = safeCandidates.filter((c) => c && (c.status === 'visa_stamped' || c.status === 'emigration_cleared' || c.status === 'ticket_booked' || c.status === 'deployed')).length;
  const deployedCount = safeCandidates.filter((c) => c && c.status === 'deployed').length;
  const ticketBookedCount = safeCandidates.filter((c) => c && c.status === 'ticket_booked').length;
  const inMedicalCount = safeCandidates.filter((c) => c && (c.status === 'medical_fit' || c.status === 'medical_in_progress')).length;
  const wakalaAllottedCount = safeCandidates.filter((c) => c && c.status === 'wakala_issued').length;

  const totalPackageRevenue = safeCandidates.reduce((acc, c) => acc + (Number(c?.packageFee) || 0), 0);
  const totalCollectedRevenue = safeCandidates.reduce((acc, c) => acc + (Number(c?.totalPaid) || 0), 0);
  const totalOutstandingBalance = safeCandidates.reduce((acc, c) => acc + (Number(c?.balanceDue) || 0), 0);
  const totalCommissionsDue = safeCandidates.reduce((acc, c) => acc + (Number(c?.partnerCommission) || 0), 0);

  const statusPipeline = [
    { label: 'Registered', count: safeCandidates.filter((c) => c && c.status === 'applied').length, color: 'bg-blue-500' },
    { label: 'Selected', count: safeCandidates.filter((c) => c && (c.status === 'interview_selected' || c.status === 'interview_scheduled')).length, color: 'bg-indigo-500' },
    { label: 'GAMCA Medical', count: inMedicalCount, color: 'bg-teal-500' },
    { label: 'Wakala Issued', count: wakalaAllottedCount, color: 'bg-amber-500' },
    { label: 'Visa Stamped', count: safeCandidates.filter((c) => c && (c.status === 'visa_stamped' || c.status === 'emigration_cleared')).length, color: 'bg-emerald-600' },
    { label: 'Tickets Ready', count: ticketBookedCount, color: 'bg-purple-600' },
    { label: 'Deployed KSA', count: deployedCount, color: 'bg-green-700' },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Top Welcome & Quick Actions Ribbon */}
      <div className="bg-[#0F1E36] text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              AL-HERA TRAVELS AGENCY COMMAND CENTER
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-1">
            Recruitment & Operations Overview
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Saudi Arabia Work Visas • Fast Wakala • Umrah Pilgrimages • Partner Network
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="/namecheap-deployment.zip"
            download="namecheap-deployment.zip"
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
            title="Download complete production bundle ready for Namecheap cPanel / Node.js"
          >
            <Download className="w-4 h-4" />
            <span>Download Production ZIP</span>
          </a>

          <button
            onClick={() => onNavigateTab('crm')}
            className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-2 border border-amber-500/40 transition-all shadow-md"
            title="Open CRM & Follow-Up reminders"
          >
            <PhoneCall className="w-4 h-4 text-amber-400" />
            <span>CRM Follow-Ups {overdueFollowUps > 0 ? `(${overdueFollowUps} Overdue)` : `(${activeFollowUps.length})`}</span>
          </button>

          <button
            onClick={onOpenNewCandidate}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Candidate</span>
          </button>

          <button
            onClick={onOpenNewJob}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/20 transition-all"
          >
            <Briefcase className="w-4 h-4 text-amber-400" />
            <span>Post Saudi Job</span>
          </button>
        </div>
      </div>

      {/* CRM Overdue / Urgent Alert Banner */}
      {overdueFollowUps > 0 && (
        <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-red-950">
                🚨 {overdueFollowUps} Overdue Candidate/Client Follow-Up{overdueFollowUps > 1 ? 's' : ''} Need Action
              </h4>
              <p className="text-xs text-red-700 font-medium">
                Candidates have passed scheduled callback dates. Complete your tele-calling queue in the CRM desk.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('crm')}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-all shrink-0 flex items-center gap-1.5"
          >
            <span>Open Follow-Up Desk</span>
            <PhoneCall className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Candidates</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-[#0F1E36] font-display">{totalCandidates}</h3>
            <span className="text-[11px] text-slate-500">Across all trades & states</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Visa Stamped</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-700 font-display">{visaStampedCount}</h3>
            <span className="text-[11px] text-emerald-600 font-medium">Embassy verified & stamped</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Tickets / Deployed</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Plane className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-purple-800 font-display">
              {ticketBookedCount + deployedCount}
            </h3>
            <span className="text-[11px] text-slate-500">Flight confirmed & in KSA</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Collected (INR)</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-black text-[#0F1E36] font-display">
              ₹{totalCollectedRevenue.toLocaleString('en-IN')}
            </h3>
            <span className="text-[11px] text-rose-600 font-semibold">
              Due: ₹{totalOutstandingBalance.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Recruitment Pipeline Funnel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-[#0F1E36] font-display">
              Recruitment Lifecycle Funnel
            </h3>
            <p className="text-xs text-slate-500">
              Real-time candidate count across all 7 operational milestones
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('candidates')}
            className="text-xs font-bold text-amber-700 hover:text-amber-800"
          >
            View Candidate Table →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {statusPipeline.map((step, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase block truncate">
                {step.label}
              </span>
              <strong className="text-2xl font-black text-[#0F1E36] font-display block mt-1">
                {step.count}
              </strong>
              <div className={`h-1.5 w-full rounded-full ${step.color} mt-2 opacity-80`} />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Candidate Registrations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-[#0F1E36] font-display">
              Recent Candidate Registrations
            </h3>
            <p className="text-xs text-slate-500">Click on candidate to inspect full dossier</p>
          </div>

          <button
            onClick={() => onNavigateTab('candidates')}
            className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
          >
            View All ({candidates.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tracking ID</th>
                <th className="py-3 px-4">Candidate Name</th>
                <th className="py-3 px-4">Passport No</th>
                <th className="py-3 px-4">Trade / Profession</th>
                <th className="py-3 px-4">Saudi Sponsor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {safeCandidates.slice(0, 6).map((c) => (
                <tr
                  key={c?.id || Math.random()}
                  onClick={() => c && onSelectCandidate(c)}
                  className="hover:bg-amber-50/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-bold text-amber-900">{c?.trackingId || '-'}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{c?.fullName || 'Candidate'}</td>
                  <td className="py-3 px-4 font-mono uppercase text-slate-700">{c?.passportNumber || '-'}</td>
                  <td className="py-3 px-4 text-slate-700">{c?.trade || '-'}</td>
                  <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]">{c?.sponsorName || 'Al-Hera Pool'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                      {(c?.status || 'applied').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (c) onSelectCandidate(c);
                      }}
                      className="px-2.5 py-1 rounded bg-[#0F1E36] hover:bg-[#1A3258] text-white text-[10px] font-bold"
                    >
                      Dossier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
