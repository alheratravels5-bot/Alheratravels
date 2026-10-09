import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  UserCheck,
  UserX,
  Building2,
  Ticket,
  DollarSign,
  Briefcase,
  User,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Search,
  Sparkles,
  ArrowRight,
  Filter,
  Users
} from 'lucide-react';
import { PartnerOffice, IndividualVisa, Candidate, JobVacancy } from '../../../types';
import { linkVisaToCandidate, unlinkVisaFromCandidate, getJobs, getCandidates } from '../../../lib/storage';
import { enrichAllJobsWithMetrics, computeJobCandidateMetrics } from '../../../lib/jobCalculations';

interface AssignCandidateToVisaModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner?: PartnerOffice | null;
  visa?: IndividualVisa | null;
  availableVisas: IndividualVisa[];
  allVisas?: IndividualVisa[];
  candidates: Candidate[];
  jobs?: JobVacancy[];
  initialTab?: 'assign' | 'unassign';
  onAssigned: () => void;
}

export const AssignCandidateToVisaModal: React.FC<AssignCandidateToVisaModalProps> = ({
  isOpen,
  onClose,
  partner,
  visa: initialVisa,
  availableVisas,
  allVisas = [],
  candidates,
  jobs: propJobs,
  initialTab,
  onAssigned,
}) => {
  const [modalTab, setModalTab] = useState<'assign' | 'unassign'>('assign');
  const [selectedVisaId, setSelectedVisaId] = useState<string>(
    initialVisa?.id || availableVisas[0]?.id || ''
  );
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [candidateSearch, setCandidateSearch] = useState<string>('');
  const [unassignSearch, setUnassignSearch] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<number>(65000);
  const [customCommission, setCustomCommission] = useState<number>(0);
  const [isManualCommission, setIsManualCommission] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Sync active tab with initialTab or initialVisa state
  useEffect(() => {
    if (initialTab) {
      setModalTab(initialTab);
    } else if (initialVisa?.candidateId || (initialVisa?.visaStatus && initialVisa.visaStatus !== 'Available')) {
      setModalTab('unassign');
    } else {
      setModalTab('assign');
    }
  }, [initialTab, initialVisa, isOpen]);

  // Sync selectedVisaId when initialVisa or availableVisas changes
  useEffect(() => {
    if (initialVisa?.id) {
      setSelectedVisaId(initialVisa.id);
    } else if (availableVisas.length > 0 && !selectedVisaId) {
      setSelectedVisaId(availableVisas[0].id);
    }
  }, [initialVisa, availableVisas, selectedVisaId]);

  // Combine visas for unassignment tracking
  const effectiveAllVisas = useMemo(() => {
    if (allVisas && allVisas.length > 0) return allVisas;
    return availableVisas;
  }, [allVisas, availableVisas]);

  // Find all currently assigned visas
  const assignedVisas = useMemo(() => {
    return effectiveAllVisas.filter(
      (v) => (v.candidateId && v.candidateId.trim() !== '') || v.visaStatus !== 'Available'
    );
  }, [effectiveAllVisas]);

  // Filter assigned visas for the Unassign tab
  const filteredAssignedVisas = useMemo(() => {
    const q = unassignSearch.toLowerCase().trim();
    return assignedVisas.filter((v) => {
      if (partner?.id && v.partnerOfficeId !== partner.id) return false;
      if (!q) return true;
      return (
        v.visaId.toLowerCase().includes(q) ||
        (v.visaNumber && v.visaNumber.toLowerCase().includes(q)) ||
        (v.candidateName && v.candidateName.toLowerCase().includes(q)) ||
        (v.candidatePassport && v.candidatePassport.toLowerCase().includes(q)) ||
        (v.candidateTrackingId && v.candidateTrackingId.toLowerCase().includes(q)) ||
        (v.jobTitle && v.jobTitle.toLowerCase().includes(q)) ||
        (v.partnerOfficeName && v.partnerOfficeName.toLowerCase().includes(q))
      );
    });
  }, [assignedVisas, unassignSearch, partner?.id]);

  const currentVisa = useMemo(() => {
    if (initialVisa) return initialVisa;
    return (
      effectiveAllVisas.find((v) => v.id === selectedVisaId || v.visaId === selectedVisaId) ||
      availableVisas[0] ||
      null
    );
  }, [initialVisa, effectiveAllVisas, selectedVisaId, availableVisas]);

  const visaAmount = currentVisa?.visaAmount || 35000;

  // Load and enrich jobs with live metrics
  const allCandidatesList = useMemo(() => getCandidates(), []);
  const rawJobsList = propJobs || useMemo(() => getJobs(), []);
  const enrichedJobs = useMemo(() => {
    return enrichAllJobsWithMetrics(rawJobsList, allCandidatesList);
  }, [rawJobsList, allCandidatesList]);

  // Find best matching job for this visa / candidate
  const matchedJob = useMemo(() => {
    if (selectedJobId) {
      return enrichedJobs.find((j) => j.id === selectedJobId || j.jobCode === selectedJobId) || null;
    }
    if (currentVisa) {
      const tradeQuery = (currentVisa.jobTitle || '').trim().toLowerCase();
      const byTrade = enrichedJobs.find((j) => {
        const jTitle = (j.title || '').trim().toLowerCase();
        return jTitle === tradeQuery || jTitle.includes(tradeQuery) || tradeQuery.includes(jTitle);
      });
      if (byTrade) return byTrade;
    }
    return enrichedJobs[0] || null;
  }, [selectedJobId, currentVisa, enrichedJobs]);

  // Compute live available visa stats for the matched job
  const jobLiveMetrics = useMemo(() => {
    if (!matchedJob) return null;
    const m = computeJobCandidateMetrics(matchedJob, allCandidatesList);
    const afterAssigned = Math.max(0, m.remaining - 1);
    return {
      ...m,
      afterAssigned,
    };
  }, [matchedJob, allCandidatesList]);

  // Filter candidates for assignment
  const eligibleCandidates = useMemo(() => {
    const query = candidateSearch.toLowerCase().trim();
    return candidates.filter((c) => {
      if (!c) return false;
      const matchesSearch =
        c.fullName.toLowerCase().includes(query) ||
        c.trackingId.toLowerCase().includes(query) ||
        c.passportNumber.toLowerCase().includes(query) ||
        (c.trade && c.trade.toLowerCase().includes(query));
      return matchesSearch;
    });
  }, [candidates, candidateSearch]);

  const selectedCandidate = useMemo(() => {
    return candidates.find((c) => c.id === selectedCandidateId) || null;
  }, [candidates, selectedCandidateId]);

  // Commission calculations:
  const defaultCommission = Math.max(0, sellingPrice - visaAmount);
  const finalCommission = isManualCommission ? customCommission : defaultCommission;
  const partnerPayable = Math.max(0, visaAmount);

  // Early return strictly after all hooks
  if (!isOpen) return null;

  // Handlers
  const handleSelectCandidate = (candId: string) => {
    setSelectedCandidateId(candId);
    setErrorMessage('');
    const cand = candidates.find((c) => c.id === candId);
    if (cand && cand.packageFee && cand.packageFee > 0) {
      setSellingPrice(cand.packageFee);
    }
    if (cand?.jobId && !selectedJobId) {
      setSelectedJobId(cand.jobId);
    }
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!currentVisa) {
      setErrorMessage('Please select a valid available Visa.');
      return;
    }
    if (!selectedCandidateId) {
      setErrorMessage('Please select a Candidate to link with this Visa.');
      return;
    }

    const result = linkVisaToCandidate(
      currentVisa.id,
      selectedCandidateId,
      sellingPrice,
      finalCommission,
      partnerPayable,
      'Administrator',
      matchedJob?.id || selectedJobId
    );

    if (!result.success) {
      setErrorMessage(result.message);
      return;
    }

    onAssigned();
    onClose();
  };

  const handleUnassignVisaRecord = (v: IndividualVisa) => {
    setErrorMessage('');
    setSuccessMessage('');
    const candName = v.candidateName || 'the assigned candidate';
    if (
      !confirm(
        `Are you sure you want to unassign ${candName} from Visa ${v.visaId}? The visa status will return to Available and vacancy quota will be restored.`
      )
    ) {
      return;
    }

    const res = unlinkVisaFromCandidate(v.id, 'Administrator');
    if (res.success) {
      setSuccessMessage(`Successfully unassigned ${candName} from Visa ${v.visaId}.`);
      onAssigned();
      if (initialVisa?.id === v.id) {
        onClose();
      }
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleUnassignCurrentVisa = () => {
    if (!currentVisa) return;
    handleUnassignVisaRecord(currentVisa);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden animate-fade-in text-slate-900 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0F1E36] p-5 sm:p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                modalTab === 'assign'
                  ? 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-400'
                  : 'bg-rose-500/20 border border-rose-400/30 text-rose-400'
              }`}
            >
              {modalTab === 'assign' ? (
                <UserCheck className="w-5 h-5" />
              ) : (
                <UserX className="w-5 h-5" />
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                Candidate & Saudi Visa Allocation Engine
              </span>
              <h3 className="text-lg font-bold font-display text-white">
                {modalTab === 'assign' ? 'Assign Candidate to Visa' : 'Unassign Candidate from Visa'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Assign Candidate vs Unassign Candidate */}
        <div className="flex border-b border-slate-200 bg-slate-100/80 p-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setModalTab('assign');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              modalTab === 'assign'
                ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Assign Candidate</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setModalTab('unassign');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              modalTab === 'unassign'
                ? 'bg-white text-rose-800 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserX className="w-4 h-4 text-rose-600" />
            <span>Unassign Candidate</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-mono font-bold">
              {assignedVisas.length} Active
            </span>
          </button>
        </div>

        {/* Alerts / Error Messages */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: ASSIGN CANDIDATE */}
        {/* ========================================================================= */}
        {modalTab === 'assign' && (
          <form onSubmit={handleConfirm} className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
            {/* Currently Assigned Candidate Notice with Instant Unassign Button */}
            {currentVisa && (currentVisa.candidateId || (currentVisa.visaStatus && currentVisa.visaStatus !== 'Available')) && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                    Currently Assigned Candidate
                  </span>
                  <strong className="text-slate-900 block text-xs mt-0.5">
                    {currentVisa.candidateName || 'Assigned Candidate'}
                  </strong>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {currentVisa.candidateTrackingId} • Passport: {currentVisa.candidatePassport || 'N/A'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleUnassignCurrentVisa}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer self-start sm:self-center"
                  title="Unassign candidate from this visa"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Unassign Candidate</span>
                </button>
              </div>
            )}

            {/* Visa Selection Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-amber-600" />
                  1. Target Saudi Visa Information
                </h4>
                {currentVisa && (
                  <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                    {currentVisa.visaId}
                  </span>
                )}
              </div>

              {!initialVisa && availableVisas.length > 0 && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Choose Available Visa from Inventory *
                  </label>
                  <select
                    value={selectedVisaId}
                    onChange={(e) => setSelectedVisaId(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    required
                  >
                    {availableVisas.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.visaId} — {v.jobTitle} ({v.sectorCity}) — Partner Rate: ₹{v.visaAmount.toLocaleString('en-IN')} [{v.partnerOfficeName}]
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {currentVisa && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-medium">Trade</span>
                    <strong className="text-slate-900 truncate block">{currentVisa.jobTitle}</strong>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-medium">Sector / City</span>
                    <strong className="text-slate-900 truncate block">{currentVisa.sectorCity}</strong>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-medium">Partner Rate</span>
                    <strong className="text-emerald-700 block font-bold">₹{currentVisa.visaAmount.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-medium">Partner</span>
                    <strong className="text-slate-900 truncate block">{currentVisa.partnerOfficeName}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Connected Job Post & Visa Available Deduction Indicator */}
            <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-xl border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-blue-700" />
                  2. Connected Job Post & Visa Available Count
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200 text-blue-900">
                  Auto-Deducts by 1
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Linked Job Post / Vacancy *
                </label>
                <select
                  value={matchedJob?.id || selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full text-xs border border-blue-300 rounded-xl p-2.5 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {enrichedJobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.jobCode} — {j.title} ({j.companyName || j.city}) — Visas Available: {j.remainingCount ?? j.openingsCount} / {j.openingsCount}
                    </option>
                  ))}
                </select>
              </div>

              {matchedJob && jobLiveMetrics && (
                <div className="p-3 bg-white rounded-xl border border-blue-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Job Post: {matchedJob.jobCode}</span>
                    <strong className="text-slate-900 text-xs">{matchedJob.title}</strong>
                    <span className="text-[11px] text-slate-500 block">{matchedJob.companyName || 'Saudi Arabia'} • Quota: {jobLiveMetrics.required} Visas</span>
                  </div>

                  {/* Visa Available Counter Indicator */}
                  <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-xl border border-blue-200 font-mono">
                    <div className="text-center">
                      <span className="text-[9px] text-slate-500 uppercase block font-sans">Current</span>
                      <span className="text-sm font-bold text-slate-900">{jobLiveMetrics.remaining} Available</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                    <div className="text-center">
                      <span className="text-[9px] text-emerald-700 uppercase block font-sans font-bold">After Assign</span>
                      <span className="text-sm font-black text-emerald-700">{jobLiveMetrics.afterAssigned} Available</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Candidate Selection Section */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-600" />
                3. Select Candidate to Link
              </h4>

              {/* Candidate Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search candidate by name, tracking ID, passport number, or trade..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Candidate Selection Dropdown */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Candidate Dossier * ({eligibleCandidates.length} candidates)
                </label>
                <select
                  value={selectedCandidateId}
                  onChange={(e) => handleSelectCandidate(e.target.value)}
                  required
                  size={5}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none overflow-y-auto"
                >
                  <option value="" disabled>-- Select a candidate from the list --</option>
                  {eligibleCandidates.map((c) => {
                    const isLinked = !!c.visaId;
                    return (
                      <option key={c.id} value={c.id} className="p-2 border-b last:border-0 hover:bg-amber-50">
                        {c.fullName} [{c.trackingId}] — Passport: {c.passportNumber} — Trade: {c.trade} {isLinked ? `[Already on Visa: ${c.visaId}]` : '[Available]'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Candidate Info Badge */}
              {selectedCandidate && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {selectedCandidate.fullName.charAt(0)}
                    </div>
                    <div>
                      <strong className="text-slate-900 text-xs block">{selectedCandidate.fullName}</strong>
                      <span className="text-[11px] text-slate-600">
                        Tracking ID: <span className="font-mono font-bold text-emerald-900">{selectedCandidate.trackingId}</span> • Passport: <span className="font-mono font-bold">{selectedCandidate.passportNumber}</span>
                      </span>
                    </div>
                  </div>
                  {selectedCandidate.visaId && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                        Linked: {selectedCandidate.visaId}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const linked = effectiveAllVisas.find((v) => v.candidateId === selectedCandidate.id || v.candidateTrackingId === selectedCandidate.trackingId);
                          if (linked) {
                            handleUnassignVisaRecord(linked);
                          } else {
                            alert(`Visa record for ${selectedCandidate.fullName} not found in current inventory.`);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                        title="Unassign candidate from their current visa"
                      >
                        <UserX className="w-3 h-3" />
                        <span>Unassign</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pricing & Commission Breakdown Engine */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-4">
              <h4 className="font-bold text-amber-400 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                4. Pricing & Al-HERA TRAVELS Commission Engine
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Candidate Package Fee (INR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">Amount charged to candidate</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Partner Office Visa Cost
                  </label>
                  <div className="w-full text-xs font-bold text-amber-400 bg-white/10 border border-white/20 rounded-xl p-2.5 flex items-center justify-between">
                    <span>₹{visaAmount.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-400">Fixed Cost</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">Amount payable to partner</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Al-HERA Commission (Profit)
                  </label>
                  <div className="w-full text-xs font-extrabold text-emerald-400 bg-emerald-950/60 border border-emerald-600/50 rounded-xl p-2.5 flex items-center justify-between">
                    <span>₹{finalCommission.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-emerald-300 font-normal">Agency Margin</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">Net profit on this visa</span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-3">
              <div>
                {currentVisa && currentVisa.candidateId && (
                  <button
                    type="button"
                    onClick={handleUnassignCurrentVisa}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors border border-rose-200 cursor-pointer"
                  >
                    <UserX className="w-4 h-4" />
                    <span>Unassign Candidate</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Allocation & Deduct 1 Visa</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: UNASSIGN CANDIDATE */}
        {/* ========================================================================= */}
        {modalTab === 'unassign' && (
          <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            {/* Explanatory Banner */}
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <UserX className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <strong className="text-rose-950 text-xs block font-bold">
                  Unassign Candidate from Visa
                </strong>
                <p className="text-[11px] text-rose-800 mt-0.5">
                  Clicking <strong>Unassign Candidate</strong> disconnects the candidate from their Saudi visa, sets the visa status back to <strong>Available</strong>, and restores the job opening quota.
                </p>
              </div>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search assigned candidate name, passport, tracking ID, or visa ID..."
                value={unassignSearch}
                onChange={(e) => setUnassignSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Assigned Visas Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3">Candidate</th>
                      <th className="py-2.5 px-3">Visa ID & Ref</th>
                      <th className="py-2.5 px-3">Trade / Sector</th>
                      <th className="py-2.5 px-3">Partner Office</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredAssignedVisas.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3">
                          <strong className="text-slate-900 block text-xs">
                            {v.candidateName || 'Assigned Candidate'}
                          </strong>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {v.candidateTrackingId} • Passport: {v.candidatePassport || 'N/A'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-slate-900 block">
                            {v.visaId}
                          </span>
                          {v.visaNumber && (
                            <span className="text-[10px] font-mono text-slate-500 block">
                              No: {v.visaNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          <strong className="block text-slate-800">{v.jobTitle}</strong>
                          <span className="text-[10px] text-slate-500">{v.sectorCity}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {v.partnerOfficeName}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleUnassignVisaRecord(v)}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            title={`Unassign ${v.candidateName || 'candidate'} from Visa ${v.visaId}`}
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Unassign Candidate</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredAssignedVisas.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400">
                          <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                          <p className="font-bold text-slate-700">No assigned candidates found.</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {unassignSearch
                              ? 'Try searching with different keywords.'
                              : 'All visas are currently available for assignment.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => setModalTab('assign')}
                            className="mt-3 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Go to Assign Candidate</span>
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
