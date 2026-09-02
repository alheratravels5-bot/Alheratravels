import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  DollarSign,
  Building2,
  Calendar,
  CreditCard,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Hash,
  FileText,
  ArrowRight,
  Sparkles,
  Search,
  User,
  UserCheck,
  ChevronDown,
  Check,
  RotateCcw,
  Briefcase
} from 'lucide-react';
import { PartnerOffice, VisaBatch, IndividualVisa, Candidate, PartnerOfficePayment } from '../../../types';
import { recordPartnerPayment, getPartnerPayments } from '../../../lib/storage';
import { computePartnerFinancials } from '../../../lib/partnerCalculations';

interface RecordPartnerPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner?: PartnerOffice | null;
  allPartners: PartnerOffice[];
  batches?: VisaBatch[];
  visas?: IndividualVisa[];
  candidates?: Candidate[];
  initialCandidateId?: string;
  onPaymentRecorded: (payment: PartnerOfficePayment) => void;
}

export const RecordPartnerPaymentModal: React.FC<RecordPartnerPaymentModalProps> = ({
  isOpen,
  onClose,
  partner,
  allPartners,
  batches = [],
  visas = [],
  candidates = [],
  initialCandidateId,
  onPaymentRecorded,
}) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(partner?.id || allPartners[0]?.id || '');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(initialCandidateId || '');
  const [candidateSearchQuery, setCandidateSearchQuery] = useState<string>('');
  const [isCandidateDropdownOpen, setIsCandidateDropdownOpen] = useState<boolean>(false);

  const [amount, setAmount] = useState<string | number>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cash' | 'Cheque' | 'Online / UPI' | 'RTGS / NEFT'>('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState<string>(`UTR-${Date.now().toString().slice(-8)}`);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const candidateDropdownRef = useRef<HTMLDivElement>(null);

  const currentPartner = useMemo(() => {
    return partner || allPartners.find((p) => p.id === selectedPartnerId) || allPartners[0] || null;
  }, [partner, allPartners, selectedPartnerId]);

  // Compute live, accurate financial rollup for selected partner
  const liveFinancials = useMemo(() => {
    if (!currentPartner) return null;
    const payments = getPartnerPayments();
    return computePartnerFinancials(currentPartner, batches, visas, candidates, payments);
  }, [currentPartner, batches, visas, candidates, isOpen]);

  const outstanding = liveFinancials
    ? liveFinancials.outstandingPayable
    : (currentPartner?.outstandingPayable ?? currentPartner?.balancePending ?? 0);

  // Close candidate dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (candidateDropdownRef.current && !candidateDropdownRef.current.contains(event.target as Node)) {
        setIsCandidateDropdownOpen(false);
      }
    };
    if (isCandidateDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCandidateDropdownOpen]);

  // Candidates assigned to this specific partner office
  const partnerCandidates = useMemo(() => {
    const pId = currentPartner?.id || selectedPartnerId;
    if (!pId) return [];

    const payments = getPartnerPayments().filter((p) => p.partnerOfficeId === pId);

    const list: Array<{
      candidate: Candidate;
      linkedVisa?: IndividualVisa;
      partnerPayable: number;
      totalPaid: number;
      remainingDue: number;
    }> = [];

    const seenIds = new Set<string>();

    candidates.forEach((c) => {
      const isDirect = c.partnerOfficeId === pId || c.partnerAgentId === pId;
      const linkedVisa = visas.find(
        (v) => v.partnerOfficeId === pId && (v.candidateId === c.id || v.candidateTrackingId === c.trackingId)
      );

      if (isDirect || linkedVisa) {
        seenIds.add(c.id);

        // Payments made to this partner for this candidate
        const candPayments = payments.filter(
          (p) =>
            (p.relatedCandidateId && (p.relatedCandidateId === c.id || p.relatedCandidateId === c.trackingId)) ||
            (p.relatedCandidateTrackingId && p.relatedCandidateTrackingId === c.trackingId)
        );
        const totalPaid = candPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        // Partner payable cost for this candidate
        const partnerPayable = linkedVisa
          ? (Number(linkedVisa.partnerPayableAmount) || Number(linkedVisa.visaAmount) || 0)
          : (Number(c.partnerPayableAmount) || Number(c.visaAmount) || 0);

        const remainingDue = Math.max(0, partnerPayable - totalPaid);

        list.push({
          candidate: c,
          linkedVisa,
          partnerPayable,
          totalPaid,
          remainingDue,
        });
      }
    });

    return list;
  }, [currentPartner?.id, selectedPartnerId, candidates, visas, isOpen]);

  // Filtered candidate list based on search input
  const filteredCandidates = useMemo(() => {
    if (!candidateSearchQuery.trim()) return partnerCandidates;
    const q = candidateSearchQuery.toLowerCase().trim();
    return partnerCandidates.filter(({ candidate, linkedVisa }) => {
      return (
        candidate.fullName.toLowerCase().includes(q) ||
        candidate.trackingId.toLowerCase().includes(q) ||
        (candidate.passportNumber && candidate.passportNumber.toLowerCase().includes(q)) ||
        (candidate.trade && candidate.trade.toLowerCase().includes(q)) ||
        (linkedVisa?.visaId && linkedVisa.visaId.toLowerCase().includes(q))
      );
    });
  }, [partnerCandidates, candidateSearchQuery]);

  // Currently selected candidate info
  const selectedCandInfo = useMemo(() => {
    if (!selectedCandidateId) return null;
    return partnerCandidates.find(
      (item) => item.candidate.id === selectedCandidateId || item.candidate.trackingId === selectedCandidateId
    ) || null;
  }, [selectedCandidateId, partnerCandidates]);

  // Handle candidate selection
  const handleSelectCandidate = (item: typeof partnerCandidates[0] | null) => {
    if (!item) {
      setSelectedCandidateId('');
      setIsCandidateDropdownOpen(false);
      setCandidateSearchQuery('');
      setNotes('');
      if (outstanding > 0) {
        setAmount(outstanding);
      }
      return;
    }

    const { candidate, linkedVisa, remainingDue } = item;
    setSelectedCandidateId(candidate.id);
    setIsCandidateDropdownOpen(false);
    setCandidateSearchQuery('');

    // Pre-fill amount with candidate's remaining due if > 0, otherwise available balance
    if (remainingDue > 0) {
      setAmount(remainingDue);
    } else if (outstanding > 0) {
      setAmount(outstanding);
    }

    // Auto-link batch if available
    if (linkedVisa?.batchId) {
      setSelectedBatchId(linkedVisa.batchId);
    } else if (candidate.visaBatchId) {
      const match = batches.find((b) => b.batchId === candidate.visaBatchId || b.id === candidate.visaBatchId);
      if (match) setSelectedBatchId(match.id);
    }

    // Auto-suggest payment remarks
    setNotes(`Payment for candidate [${candidate.trackingId}] ${candidate.fullName} (${candidate.trade || 'Visa Processing'})`);
    setErrorMessage('');
  };

  // Initialize or update default amount when partner changes or modal opens
  useEffect(() => {
    if (isOpen && currentPartner) {
      const out = liveFinancials
        ? liveFinancials.outstandingPayable
        : (currentPartner.outstandingPayable ?? currentPartner.balancePending ?? 0);

      // If an initial candidate was provided, select it
      if (initialCandidateId) {
        const found = partnerCandidates.find(
          (item) => item.candidate.id === initialCandidateId || item.candidate.trackingId === initialCandidateId
        );
        if (found) {
          handleSelectCandidate(found);
          return;
        }
      }

      if (!selectedCandidateId) {
        if (out > 0) {
          setAmount(out);
        } else {
          setAmount('');
        }
      }
      setErrorMessage('');
      setReferenceNumber(`UTR-${Date.now().toString().slice(-8)}`);
    }
  }, [isOpen, currentPartner?.id, initialCandidateId]);

  if (!isOpen) return null;

  const partnerBatches = batches.filter((b) => b.partnerOfficeId === (currentPartner?.id || selectedPartnerId));
  const numericAmount = Number(amount) || 0;
  const newRemainingBalance = Math.max(0, outstanding - numericAmount);

  const handlePartnerSelect = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    setSelectedCandidateId('');
    setCandidateSearchQuery('');
    setErrorMessage('');
    const selected = allPartners.find((p) => p.id === partnerId);
    if (selected) {
      const pPayments = getPartnerPayments();
      const pFin = computePartnerFinancials(selected, batches, visas, candidates, pPayments);
      const out = pFin.outstandingPayable;
      if (out > 0) {
        setAmount(out);
      } else {
        setAmount('');
      }
    }
  };

  const handleSetExactAmount = (targetVal: number) => {
    setAmount(targetVal);
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const targetPartnerId = currentPartner?.id || selectedPartnerId;
    if (!targetPartnerId) {
      setErrorMessage('Please select a valid Partner Office.');
      return;
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      setErrorMessage('Payment Amount must be a positive number greater than ₹0.');
      return;
    }

    // Validation: amount must allow any positive amount up to current outstanding balance
    if (outstanding > 0 && payAmount > outstanding) {
      setErrorMessage(
        `Payment amount of ₹${payAmount.toLocaleString('en-IN')} exceeds the current partner outstanding balance of ₹${outstanding.toLocaleString('en-IN')}. Please enter an amount up to ₹${outstanding.toLocaleString('en-IN')}.`
      );
      return;
    }

    const matchedBatch = batches.find((b) => b.id === selectedBatchId || b.batchId === selectedBatchId);

    const result = recordPartnerPayment({
      partnerOfficeId: targetPartnerId,
      partnerOfficeName: currentPartner?.agencyName || 'Partner Office',
      amount: payAmount,
      paymentDate,
      paymentMethod,
      referenceNumber: referenceNumber.trim() || `UTR-${Date.now().toString().slice(-8)}`,
      relatedBatchId: matchedBatch?.id,
      relatedBatchCode: matchedBatch?.batchId,
      relatedVisaId: selectedCandInfo?.linkedVisa?.id,
      relatedVisaCode: selectedCandInfo?.linkedVisa?.visaId,
      relatedCandidateId: selectedCandInfo?.candidate.id,
      relatedCandidateTrackingId: selectedCandInfo?.candidate.trackingId,
      relatedCandidateName: selectedCandInfo?.candidate.fullName,
      relatedCandidatePassport: selectedCandInfo?.candidate.passportNumber,
      relatedCandidateTrade: selectedCandInfo?.candidate.trade,
      notes: notes || (selectedCandInfo ? `Payment for candidate [${selectedCandInfo.candidate.trackingId}] ${selectedCandInfo.candidate.fullName}` : `Settlement payment of ₹${payAmount.toLocaleString('en-IN')} via ${paymentMethod}`),
    });

    if (result.success) {
      onPaymentRecorded(result.payment);
      onClose();
    } else {
      setErrorMessage(result.message || 'Failed to record payment. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full my-8 overflow-hidden animate-fade-in text-slate-900">
        {/* Header */}
        <div className="bg-[#0F1E36] p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                Partner Financial Settlement
              </span>
              <h3 className="text-base sm:text-lg font-bold font-display text-white">
                Record Payment to Partner Office
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

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Partner Selector */}
          {!partner ? (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Recipient Partner Office *
              </label>
              <select
                value={selectedPartnerId}
                onChange={(e) => handlePartnerSelect(e.target.value)}
                required
                className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">Select Partner Office</option>
                {allPartners.map((p) => {
                  const pOut = p.outstandingPayable ?? p.balancePending ?? 0;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.agencyName} ({p.partnerCode || 'PTR'}) — Outstanding Due: ₹{pOut.toLocaleString('en-IN')}
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Partner Office</span>
                <strong className="text-slate-900 text-xs sm:text-sm font-bold">{partner.agencyName}</strong>
                <span className="text-[11px] text-slate-500 block font-mono">Code: {partner.partnerCode || 'PTR'}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block font-semibold">Current Outstanding Balance</span>
                <span className="text-base font-extrabold text-rose-700 font-mono">
                  ₹{outstanding.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {/* Balance & Deduction Live Summary Card */}
          {currentPartner && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600 font-medium">Current Balance Due to Partner:</span>
                <span className="font-bold text-slate-900 font-mono">₹{outstanding.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600 font-medium">Payment to Record:</span>
                <span className="font-bold text-emerald-700 font-mono">- ₹{numericAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Remaining Balance After Payment:</span>
                <span className="font-extrabold text-[#0F1E36] font-mono">
                  ₹{newRemainingBalance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {/* SELECT CANDIDATE SEARCHABLE DROPDOWN */}
          <div className="relative" ref={candidateDropdownRef}>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-600" />
                <span>Select Candidate (Candidate-wise Payment Tracking)</span>
              </label>
              {selectedCandInfo && (
                <button
                  type="button"
                  onClick={() => handleSelectCandidate(null)}
                  className="text-[10px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  <span>Clear Selection (Office Settlement)</span>
                </button>
              )}
            </div>

            {/* Dropdown Toggle Trigger */}
            <div
              onClick={() => setIsCandidateDropdownOpen((prev) => !prev)}
              className={`w-full p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all bg-white ${
                selectedCandInfo
                  ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500'
                  : 'border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-amber-500'
              }`}
            >
              {selectedCandInfo ? (
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <span className="font-mono font-bold text-emerald-800 mr-1.5">
                      [{selectedCandInfo.candidate.trackingId}]
                    </span>
                    <strong className="text-slate-900 font-bold">
                      {selectedCandInfo.candidate.fullName}
                    </strong>
                    <span className="text-slate-500 text-[11px] ml-1.5 font-normal">
                      • {selectedCandInfo.candidate.trade || 'Visa'} {selectedCandInfo.candidate.passportNumber ? `(${selectedCandInfo.candidate.passportNumber})` : ''}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500">
                  <Search className="w-4 h-4 text-slate-400" />
                  <span>
                    {partnerCandidates.length > 0
                      ? `Select candidate assigned to this Partner (${partnerCandidates.length} available)...`
                      : 'No candidates directly assigned to this Partner Office (General Settlement)'}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    isCandidateDropdownOpen ? 'rotate-180 text-amber-600' : ''
                  }`}
                />
              </div>
            </div>

            {/* Dropdown Menu */}
            {isCandidateDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-slate-300 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
                {/* Search Bar Inside Dropdown */}
                <div className="p-2.5 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search candidate ID (e.g. AHT-2026-1001), name, passport, trade..."
                    value={candidateSearchQuery}
                    onChange={(e) => setCandidateSearchQuery(e.target.value)}
                    className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-900 placeholder-slate-400 font-medium"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {candidateSearchQuery && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCandidateSearchQuery('');
                      }}
                      className="p-1 hover:bg-slate-200 rounded"
                    >
                      <X className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  )}
                </div>

                {/* Candidate Options List */}
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {/* Option: General Office Settlement (No Candidate) */}
                  <div
                    onClick={() => handleSelectCandidate(null)}
                    className={`p-3 cursor-pointer hover:bg-slate-50 flex items-center justify-between transition-colors ${
                      !selectedCandidateId ? 'bg-amber-50/60 font-bold text-amber-950' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                      <div>
                        <span className="font-bold text-xs block">General Office Settlement</span>
                        <span className="text-[10px] text-slate-500 block">Not linked to a single candidate (settles general account)</span>
                      </div>
                    </div>
                    {!selectedCandidateId && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                  </div>

                  {/* Filtered Candidate Rows */}
                  {filteredCandidates.map((item) => {
                    const isSelected = selectedCandidateId === item.candidate.id;
                    return (
                      <div
                        key={item.candidate.id}
                        onClick={() => handleSelectCandidate(item)}
                        className={`p-3 cursor-pointer hover:bg-emerald-50/50 transition-colors flex items-center justify-between gap-3 ${
                          isSelected ? 'bg-emerald-50 font-bold border-l-4 border-emerald-600' : ''
                        }`}
                      >
                        <div className="space-y-0.5 overflow-hidden">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                              {item.candidate.trackingId}
                            </span>
                            <strong className="text-slate-900 text-xs">{item.candidate.fullName}</strong>
                            {item.candidate.trade && (
                              <span className="text-[10px] text-slate-500 font-medium bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                {item.candidate.trade}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2 font-mono">
                            {item.candidate.passportNumber && (
                              <span>PPT: {item.candidate.passportNumber}</span>
                            )}
                            {item.linkedVisa?.visaId && (
                              <span>• Visa: {item.linkedVisa.visaId}</span>
                            )}
                          </div>
                        </div>

                        {/* Candidate Financial Snapshot */}
                        <div className="text-right shrink-0">
                          {item.partnerPayable > 0 ? (
                            <div>
                              <span className="text-[10px] text-slate-500 block font-mono">
                                Total Cost: ₹{item.partnerPayable.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] text-emerald-700 font-bold block font-mono">
                                Paid: ₹{item.totalPaid.toLocaleString('en-IN')}
                              </span>
                              {item.remainingDue > 0 ? (
                                <span className="text-[10px] font-extrabold text-rose-700 block font-mono">
                                  Due: ₹{item.remainingDue.toLocaleString('en-IN')}
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                                  ✓ Settled
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No direct visa fee set</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {filteredCandidates.length === 0 && (
                    <div className="p-6 text-center text-slate-400 space-y-1">
                      <p className="font-semibold text-xs text-slate-600">No candidates match your search "{candidateSearchQuery}"</p>
                      <p className="text-[10px]">Try searching by candidate tracking ID, name, or trade.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Selected Candidate Detailed Snapshot Banner */}
            {selectedCandInfo && (
              <div className="mt-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-200/70 px-2 py-0.5 rounded">
                      {selectedCandInfo.candidate.trackingId}
                    </span>
                    <strong className="text-slate-900 text-xs sm:text-sm font-bold">
                      {selectedCandInfo.candidate.fullName}
                    </strong>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-600 font-mono">
                    <span>Passport: {selectedCandInfo.candidate.passportNumber || 'N/A'}</span>
                    <span>• Trade: {selectedCandInfo.candidate.trade || 'General'}</span>
                    {selectedCandInfo.linkedVisa?.visaId && (
                      <span>• Visa: {selectedCandInfo.linkedVisa.visaId}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
                  <div className="text-right mr-1">
                    <span className="text-[10px] text-slate-500 block">Candidate Visa Due to Partner</span>
                    <strong className="text-xs font-mono font-extrabold text-slate-900 block">
                      ₹{selectedCandInfo.remainingDue.toLocaleString('en-IN')}
                    </strong>
                  </div>

                  {selectedCandInfo.remainingDue > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSetExactAmount(selectedCandInfo.remainingDue)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm transition-colors"
                      title="Set payment amount to candidate's remaining balance"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Pay ₹{selectedCandInfo.remainingDue.toLocaleString('en-IN')}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700">
                  Payment Amount (INR) *
                </label>
                {outstanding > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 font-mono">
                    Max: ₹{outstanding.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="0.01"
                  max={outstanding > 0 ? outstanding : undefined}
                  step="any"
                  required
                  placeholder="e.g. 12000"
                  value={amount}
                  onChange={(e) => {
                    setErrorMessage('');
                    const val = e.target.value;
                    if (val === '') {
                      setAmount('');
                    } else {
                      const num = parseFloat(val);
                      setAmount(isNaN(num) ? '' : num);
                    }
                  }}
                  className="w-full pl-7 pr-3 py-2.5 text-sm font-extrabold text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Quick Fill Preset Buttons */}
              {outstanding > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => handleSetExactAmount(outstanding)}
                    className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] transition-colors"
                  >
                    Full Balance (₹{outstanding.toLocaleString('en-IN')})
                  </button>
                  {selectedCandInfo && selectedCandInfo.remainingDue > 0 && selectedCandInfo.remainingDue < outstanding && (
                    <button
                      type="button"
                      onClick={() => handleSetExactAmount(selectedCandInfo.remainingDue)}
                      className="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[10px] transition-colors"
                    >
                      Candidate Due (₹{selectedCandInfo.remainingDue.toLocaleString('en-IN')})
                    </button>
                  )}
                  {outstanding >= 10000 && (
                    <button
                      type="button"
                      onClick={() => handleSetExactAmount(Math.round(outstanding / 2))}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] transition-colors"
                    >
                      50% (₹{Math.round(outstanding / 2).toLocaleString('en-IN')})
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Method & Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Payment Method / Mode *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="Bank Transfer">Bank Transfer / IMPS</option>
                <option value="RTGS / NEFT">RTGS / NEFT</option>
                <option value="Online / UPI">Online / UPI</option>
                <option value="Cash">Cash at Desk</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                UTR / Reference / Cheque No. *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. UTR1908239012"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full text-xs font-mono uppercase border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Tag to Visa Batch (Optional) */}
          {partnerBatches.length > 0 && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tag to Visa Batch (Optional)
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">General Settlement (Against Total Ledger)</option>
                {partnerBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchId} — {b.jobTitle} ({b.totalVisas} Visas @ ₹{b.amountPerVisa.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Remarks & Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Payment Remarks & Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Paid via HDFC Current A/C, acknowledged by partner manager"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500">
              {selectedCandInfo ? (
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Linked to candidate {selectedCandInfo.candidate.trackingId}</span>
                </span>
              ) : (
                <span className="text-slate-500">Office-wide general settlement</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-all text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 sm:px-6 py-2.5 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-amber-400 font-bold shadow-md transition-all flex items-center gap-2 text-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Record ₹{numericAmount > 0 ? numericAmount.toLocaleString('en-IN') : '0'} Payment</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
