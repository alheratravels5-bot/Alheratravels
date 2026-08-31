import React, { useState, useMemo } from 'react';
import {
  X,
  UserCheck,
  Building2,
  Ticket,
  DollarSign,
  Briefcase,
  User,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Search,
  Sparkles
} from 'lucide-react';
import { PartnerOffice, IndividualVisa, Candidate } from '../../../types';
import { linkVisaToCandidate } from '../../../lib/storage';

interface AssignCandidateToVisaModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner?: PartnerOffice | null;
  visa?: IndividualVisa | null;
  availableVisas: IndividualVisa[];
  candidates: Candidate[];
  onAssigned: () => void;
}

export const AssignCandidateToVisaModal: React.FC<AssignCandidateToVisaModalProps> = ({
  isOpen,
  onClose,
  partner,
  visa: initialVisa,
  availableVisas,
  candidates,
  onAssigned,
}) => {
  const [selectedVisaId, setSelectedVisaId] = useState<string>(
    initialVisa?.id || availableVisas[0]?.id || ''
  );
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [candidateSearch, setCandidateSearch] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<number>(65000);
  const [customCommission, setCustomCommission] = useState<number>(0);
  const [isManualCommission, setIsManualCommission] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const currentVisa = initialVisa || availableVisas.find((v) => v.id === selectedVisaId || v.visaId === selectedVisaId);
  const visaAmount = currentVisa?.visaAmount || 35000;

  // Filter candidates: candidates who don't already have this exact visa
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

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);

  // Set default selling price when candidate is selected
  const handleSelectCandidate = (candId: string) => {
    setSelectedCandidateId(candId);
    setErrorMessage('');
    const cand = candidates.find((c) => c.id === candId);
    if (cand && cand.packageFee && cand.packageFee > 0) {
      setSellingPrice(cand.packageFee);
    }
  };

  // Commission calculations:
  // Selling Price (from candidate) - Visa Rate (to partner) = Al-Hera Gross Margin / Commission
  const defaultCommission = Math.max(0, sellingPrice - visaAmount);
  const finalCommission = isManualCommission ? customCommission : defaultCommission;
  const partnerPayable = Math.max(0, visaAmount);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
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
      partnerPayable
    );

    if (!result.success) {
      setErrorMessage(result.message);
      return;
    }

    onAssigned();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden animate-fade-in text-slate-900">
        {/* Header */}
        <div className="bg-[#0F1E36] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                Candidate Allocation
              </span>
              <h3 className="text-lg font-bold font-display text-white">
                Assign Candidate to Partner Visa
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
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

          {/* Candidate Selection Section */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-600" />
              2. Select Candidate to Link
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
                Candidate Dossier * ({eligibleCandidates.length} eligible candidates)
              </label>
              <select
                value={selectedCandidateId}
                onChange={(e) => handleSelectCandidate(e.target.value)}
                required
                size={5}
                className="w-full text-xs border border-slate-300 rounded-xl p-2 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none overflow-y-auto"
              >
                <option value="" disabled>-- Select a candidate from the list --</option>
                {eligibleCandidates.map((c) => (
                  <option key={c.id} value={c.id} className="p-2 border-b last:border-0 hover:bg-amber-50">
                    {c.fullName} [{c.trackingId}] — Passport: {c.passportNumber} — Trade: {c.trade} — Status: {c.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Candidate Info Badge */}
            {selectedCandidate && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                    {selectedCandidate.fullName.charAt(0)}
                  </div>
                  <div>
                    <strong className="text-slate-900 text-xs block">{selectedCandidate.fullName}</strong>
                    <span className="text-[11px] text-slate-600">
                      Tracking ID: <span className="font-mono font-bold text-emerald-900">{selectedCandidate.trackingId}</span> • Passport: <span className="font-mono font-bold">{selectedCandidate.passportNumber}</span>
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                  {selectedCandidate.status}
                </span>
              </div>
            )}
          </div>

          {/* Pricing & Commission Breakdown Engine */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-4">
            <h4 className="font-bold text-amber-400 text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              3. Pricing & Al-HERA TRAVELS Commission Engine
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Candidate Package Fee (INR) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Math.max(0, parseInt(e.target.value) || 0))}
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

            {/* Financial Summary Card */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-300">
                Ledger impact: <strong className="text-amber-300">₹{partnerPayable.toLocaleString('en-IN')}</strong> credited to Partner Office account.
              </span>
              <span className="text-emerald-400 font-bold">
                ✓ Candidate will be linked to tracking dossier automatically.
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedCandidateId || !currentVisa}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold shadow-md transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Link Candidate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
