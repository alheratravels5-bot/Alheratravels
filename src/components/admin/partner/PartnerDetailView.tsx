import React, { useState, useMemo } from 'react';
import {
  Building2,
  Ticket,
  UserCheck,
  DollarSign,
  Calendar,
  FileSpreadsheet,
  ArrowLeft,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Printer,
  Download,
  CreditCard,
  Layers,
  History,
  TrendingUp,
  Briefcase,
  Users,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Eye,
  FileText,
  X,
  User,
  Edit3
} from 'lucide-react';
import {
  PartnerOffice,
  VisaBatch,
  IndividualVisa,
  Candidate,
  PartnerOfficePayment,
  PartnerOfficeLedgerEntry,
  PartnerAuditLog,
  AgencyInfo
} from '../../../types';
import { getAgencyInfo } from '../../../lib/storage';
import { computePartnerFinancials, computeRunningLedger } from '../../../lib/partnerCalculations';
import { generatePartnerStatementPdf } from '../../../lib/pdfGenerator';
import { PartnerLedgerModal } from './PartnerLedgerModal';
import { FetchUpdatePaymentModal } from '../FetchUpdatePaymentModal';

interface PartnerDetailViewProps {
  partner: PartnerOffice;
  allBatches: VisaBatch[];
  allVisas: IndividualVisa[];
  allCandidates: Candidate[];
  allPayments: PartnerOfficePayment[];
  allLedger: PartnerOfficeLedgerEntry[];
  allAuditLogs: PartnerAuditLog[];
  onBack: () => void;
  onOpenReceiveBatch: () => void;
  onOpenAssignCandidate: (visa?: IndividualVisa) => void;
  onOpenRecordPayment: (candidateId?: string) => void;
  onOpenFullLedger: () => void;
  onSelectCandidateDetail?: (candidate: Candidate) => void;
  onRefreshData?: () => void;
}

export const PartnerDetailView: React.FC<PartnerDetailViewProps> = ({
  partner,
  allBatches,
  allVisas,
  allCandidates,
  allPayments,
  allLedger,
  allAuditLogs,
  onBack,
  onOpenReceiveBatch,
  onOpenAssignCandidate,
  onOpenRecordPayment,
  onOpenFullLedger,
  onSelectCandidateDetail,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'batches' | 'visas' | 'candidates' | 'payments' | 'ledger' | 'audit'
  >('overview');
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState<boolean>(false);

  // State for Fetch & Update Payment Modal
  const [isFetchUpdateModalOpen, setIsFetchUpdateModalOpen] = useState(false);
  const [selectedPartnerPaymentForEdit, setSelectedPartnerPaymentForEdit] = useState<string | null>(null);

  // Filter criteria
  const [visaSearch, setVisaSearch] = useState('');
  const [visaStatusFilter, setVisaStatusFilter] = useState('all');
  const [batchSearch, setBatchSearch] = useState('');

  const agency: AgencyInfo = getAgencyInfo();

  // Financial Metrics computed from calculations engine
  const financials = useMemo(() => {
    return computePartnerFinancials(partner, allBatches, allVisas, allCandidates, allPayments);
  }, [partner, allBatches, allVisas, allCandidates, allPayments]);

  // Partner Specific Data
  const partnerBatches = useMemo(
    () => allBatches.filter((b) => b.partnerOfficeId === partner.id),
    [allBatches, partner.id]
  );

  const partnerVisas = useMemo(
    () => allVisas.filter((v) => v.partnerOfficeId === partner.id),
    [allVisas, partner.id]
  );

  const [selectedCandidateForPaymentHistory, setSelectedCandidateForPaymentHistory] = useState<Candidate | null>(null);
  const [paymentCandidateFilter, setPaymentCandidateFilter] = useState<string>('all');
  const [candidateSearchFilter, setCandidateSearchFilter] = useState<string>('');

  const partnerCandidates = useMemo(() => {
    const direct = allCandidates.filter((c) => c.partnerOfficeId === partner.id || c.partnerAgentId === partner.id);
    const visaAssigned = allVisas
      .filter((v) => v.partnerOfficeId === partner.id && (v.candidateId || v.candidateTrackingId))
      .map((v) => v.candidateId || v.candidateTrackingId);
    const visaSet = new Set(visaAssigned);
    const fromVisas = allCandidates.filter((c) => visaSet.has(c.id) || visaSet.has(c.trackingId));

    const map = new Map<string, Candidate>();
    [...direct, ...fromVisas].forEach((c) => {
      if (c && c.id) map.set(c.id, c);
    });
    return Array.from(map.values());
  }, [allCandidates, allVisas, partner.id]);

  const partnerPayments = useMemo(
    () => allPayments.filter((p) => p.partnerOfficeId === partner.id),
    [allPayments, partner.id]
  );

  // Candidate-wise payments breakdown for this partner office
  const partnerCandidatesWithPayments = useMemo(() => {
    return partnerCandidates.map((c) => {
      const cPayments = partnerPayments.filter(
        (p) =>
          (p.relatedCandidateId && (p.relatedCandidateId === c.id || p.relatedCandidateId === c.trackingId)) ||
          (p.relatedCandidateTrackingId && p.relatedCandidateTrackingId === c.trackingId)
      );
      const totalPaid = cPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      const linkedVisa = partnerVisas.find(
        (v) => v.candidateId === c.id || v.candidateTrackingId === c.trackingId
      );

      const partnerCost = linkedVisa
        ? (Number(linkedVisa.partnerPayableAmount) || Number(linkedVisa.visaAmount) || 0)
        : (Number(c.partnerPayableAmount) || Number(c.visaAmount) || 0);

      const balanceDue = Math.max(0, partnerCost - totalPaid);

      return {
        candidate: c,
        payments: cPayments,
        totalPaid,
        partnerCost,
        balanceDue,
        linkedVisa,
      };
    });
  }, [partnerCandidates, partnerPayments, partnerVisas]);

  // Aggregate candidate financial metrics
  const candidateFinancialRollup = useMemo(() => {
    let totalPartnerCost = 0;
    let totalRemitted = 0;
    let totalBalanceDue = 0;
    partnerCandidatesWithPayments.forEach((item) => {
      totalPartnerCost += item.partnerCost;
      totalRemitted += item.totalPaid;
      totalBalanceDue += item.balanceDue;
    });

    const candidateLinkedPaymentsTotal = partnerPayments
      .filter((p) => p.relatedCandidateId || p.relatedCandidateTrackingId)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const officeGeneralPaymentsTotal = partnerPayments
      .filter((p) => !p.relatedCandidateId && !p.relatedCandidateTrackingId)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      totalPartnerCost,
      totalRemitted,
      totalBalanceDue,
      candidateLinkedPaymentsTotal,
      officeGeneralPaymentsTotal,
    };
  }, [partnerCandidatesWithPayments, partnerPayments]);

  const partnerLedger = useMemo(() => {
    const existing = allLedger.filter((l) => l.partnerOfficeId === partner.id);
    const existingTxnIds = new Set(existing.map((e) => e.transactionId));
    const synthesized: PartnerOfficeLedgerEntry[] = [...existing];

    // Check batches
    partnerBatches.forEach((b) => {
      const txnId = `TXN-VB-${b.batchId || b.id}`;
      if (!existingTxnIds.has(txnId)) {
        synthesized.push({
          id: 'syn-batch-' + b.id,
          transactionId: txnId,
          partnerOfficeId: partner.id,
          date: b.dateReceived || new Date().toISOString().split('T')[0],
          type: 'Visa Received',
          description: `Received Visa Batch ${b.batchId || ''} (${b.totalVisas} Visas @ ₹${(b.amountPerVisa || 0).toLocaleString('en-IN')})`,
          debit: 0,
          credit: Number(b.totalAmount) || (Number(b.totalVisas) * Number(b.amountPerVisa)) || 0,
          commission: 0,
          balance: 0,
          createdAt: b.createdAt || new Date().toISOString(),
        });
        existingTxnIds.add(txnId);
      }
    });

    // Check candidate assignments
    partnerVisas
      .filter((v) => v.candidateId || v.candidateName)
      .forEach((v) => {
        const txnId = `TXN-ASG-${v.visaId || v.id}`;
        if (!existingTxnIds.has(txnId)) {
          const cand = allCandidates.find((c) => c.id === v.candidateId);
          const candName = cand?.fullName || v.candidateName || 'Candidate';
          const candAmt = Number(cand?.packageFee || v.candidateAmount || v.visaAmount || 0);
          const visaAmt = Number(v.visaAmount || 0);
          const comm = Math.max(0, candAmt - visaAmt);

          synthesized.push({
            id: 'syn-visa-' + v.id,
            transactionId: txnId,
            partnerOfficeId: partner.id,
            date: v.assignedAt ? v.assignedAt.split('T')[0] : new Date().toISOString().split('T')[0],
            type: 'Candidate Assigned',
            description: `Candidate Assigned: ${candName} (${v.jobTitle}) - Visa: ${v.visaId}`,
            visaId: v.visaId,
            candidateId: v.candidateId,
            candidateName: candName,
            debit: 0,
            credit: v.partnerPayableAmount !== undefined ? Number(v.partnerPayableAmount) : visaAmt,
            commission: comm,
            balance: 0,
            createdAt: v.assignedAt || new Date().toISOString(),
          });
          existingTxnIds.add(txnId);
        }
      });

    // Check payments
    partnerPayments.forEach((p) => {
      const txnId = `TXN-PMT-${p.id}`;
      if (!existingTxnIds.has(txnId)) {
        synthesized.push({
          id: 'syn-pmt-' + p.id,
          transactionId: txnId,
          partnerOfficeId: partner.id,
          date: p.paymentDate || new Date().toISOString().split('T')[0],
          type: 'Payment Made',
          description: `Payment Settled via ${p.paymentMethod || 'Bank Transfer'}${p.referenceNumber ? ` (Ref: ${p.referenceNumber})` : ''}`,
          debit: Number(p.amount) || 0,
          credit: 0,
          commission: 0,
          balance: 0,
          referenceNumber: p.referenceNumber,
          createdAt: p.createdAt || new Date().toISOString(),
        });
        existingTxnIds.add(txnId);
      }
    });

    return computeRunningLedger(synthesized);
  }, [allLedger, partner.id, partnerBatches, partnerVisas, allCandidates, partnerPayments]);

  const partnerAuditLogs = useMemo(
    () => allAuditLogs.filter((a) => a.partnerOfficeId === partner.id),
    [allAuditLogs, partner.id]
  );

  // Filtered Visas
  const filteredVisas = useMemo(() => {
    return partnerVisas.filter((v) => {
      if (visaStatusFilter !== 'all' && v.visaStatus !== visaStatusFilter) return false;
      if (visaSearch) {
        const q = visaSearch.toLowerCase();
        const matches =
          v.visaId.toLowerCase().includes(q) ||
          (v.visaNumber && v.visaNumber.toLowerCase().includes(q)) ||
          v.jobTitle.toLowerCase().includes(q) ||
          v.sectorCity.toLowerCase().includes(q) ||
          (v.candidateName && v.candidateName.toLowerCase().includes(q)) ||
          (v.candidatePassport && v.candidatePassport.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [partnerVisas, visaStatusFilter, visaSearch]);

  const cleanWa = (partner.whatsapp || partner.phone || '').replace(/[^0-9]/g, '');

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 pb-12">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all flex items-center gap-1.5 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Partners</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-slate-900 text-amber-400 px-2 py-0.5 rounded">
                {partner.partnerCode || 'PTR'}
              </span>
              <span className="text-xs text-slate-400 font-semibold">Partner Office Account</span>
            </div>
            <h1 className="text-xl font-extrabold text-[#0F1E36] font-display">
              {partner.agencyName}
            </h1>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenReceiveBatch}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Receive Visa Batch</span>
          </button>

          <button
            onClick={() => onOpenAssignCandidate()}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Assign Candidate</span>
          </button>

          <button
            onClick={() => onOpenRecordPayment()}
            className="px-3.5 py-2 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-amber-400 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>

          <button
            onClick={onOpenFullLedger}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Ledger / Statement</span>
          </button>
        </div>
      </div>

      {/* Primary Partner Overview Card with Contact & Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact & Agreement Particulars */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <h3 className="font-bold text-sm text-[#0F1E36] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              Office & Contact Details
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
              {partner.status || 'Active'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-700">
            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500 font-medium">Contact Person:</span>
              <strong className="text-slate-900 text-right">{partner.contactPerson}</strong>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 font-medium">Calling Phone:</span>
              <span className="font-mono text-slate-900 font-semibold">{partner.phone}</span>
            </div>

            {partner.whatsapp && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 font-medium">WhatsApp:</span>
                <a
                  href={`https://wa.me/${cleanWa}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-bold hover:bg-emerald-100 flex items-center gap-1"
                >
                  <span>{partner.whatsapp}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {partner.email && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 font-medium">Email:</span>
                <span className="text-slate-900 font-medium truncate">{partner.email}</span>
              </div>
            )}

            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500 font-medium">Location:</span>
              <span className="text-slate-900 text-right">
                {partner.city}, {partner.state}, {partner.country || 'India'}
              </span>
            </div>

            <div className="flex items-start justify-between gap-2 pt-2 border-t">
              <span className="text-slate-500 font-medium">Commission Rate:</span>
              <strong className="text-emerald-700 font-bold">
                ₹{(partner.commissionRatePerCandidate || partner.defaultCommissionPerCandidate || 0).toLocaleString('en-IN')} / Candidate
              </strong>
            </div>
          </div>
        </div>

        {/* Real-Time Financial Metric Cards (Col 2 & 3) */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Total Visas Received */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-1">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Visas Received
            </span>
            <div className="text-xl font-extrabold text-slate-900 font-mono">
              {financials.totalVisasReceived}
            </div>
            <span className="text-[10px] text-slate-400 block">
              Worth ₹{financials.totalVisaValue.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Visas Assigned / Sold */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-1">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Visas Assigned
            </span>
            <div className="text-xl font-extrabold text-blue-700 font-mono">
              {financials.visasAssigned}
            </div>
            <span className="text-[10px] text-slate-400 block">
              {financials.visasRemaining} Available Remaining
            </span>
          </div>

          {/* Al-Hera Commission Earned */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Al-Hera Commission
            </span>
            <div className="text-xl font-extrabold text-emerald-700 font-mono">
              ₹{financials.alHeraCommissionEarned.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-slate-400 block">
              Net profit margin
            </span>
          </div>

          {/* Outstanding Balance */}
          <div className="bg-gradient-to-br from-slate-900 to-[#0F1E36] text-white rounded-2xl p-4 shadow-md space-y-1">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
              Outstanding Balance
            </span>
            <div className="text-xl font-extrabold text-amber-400 font-mono">
              ₹{financials.outstandingPayable.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-slate-300 block">
              Paid: ₹{financials.totalPaidToPartner.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Secondary Stats Row */}
          <div className="col-span-2 sm:col-span-4 bg-slate-50 rounded-2xl border border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Candidate Value</span>
              <strong className="text-slate-900 font-mono text-sm">
                ₹{financials.totalCandidateValue.toLocaleString('en-IN')}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Payable to Partner</span>
              <strong className="text-slate-900 font-mono text-sm">
                ₹{financials.totalPayableToPartner.toLocaleString('en-IN')}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Paid to Partner</span>
              <strong className="text-emerald-700 font-mono text-sm">
                ₹{financials.totalPaidToPartner.toLocaleString('en-IN')}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Active Visa Batches</span>
              <strong className="text-[#0F1E36] font-mono text-sm">
                {partnerBatches.length} Batches
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'overview', label: 'Overview & Highlights', count: null },
          { id: 'batches', label: 'Visa Batches', count: partnerBatches.length },
          { id: 'visas', label: 'Individual Visas', count: partnerVisas.length },
          { id: 'candidates', label: 'Candidates Placed', count: partnerCandidates.length },
          { id: 'payments', label: 'Payments & Settlement', count: partnerPayments.length },
          { id: 'ledger', label: 'Ledger Statement', count: partnerLedger.length },
          { id: 'audit', label: 'Audit Log', count: partnerAuditLogs.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-[#0F1E36] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === tab.id ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Visa Inventory Summary by Trade */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#0F1E36]">Saudi Visa Inventory by Trade</h3>
                <p className="text-xs text-slate-500">Live breakdown of visas received, assigned to candidates, and available for recruitment.</p>
              </div>
              <button
                onClick={onOpenReceiveBatch}
                className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Visa Block</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {partnerBatches.map((batch) => {
                const percentUsed = batch.totalVisas > 0 ? Math.round((batch.usedVisas / batch.totalVisas) * 100) : 0;
                return (
                  <div
                    key={batch.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded">
                          {batch.batchId}
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs mt-1">{batch.jobTitle}</h4>
                        <span className="text-[11px] text-slate-500">{batch.sectorCity}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          batch.remainingVisas === 0
                            ? 'bg-rose-100 text-rose-800'
                            : batch.usedVisas > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {batch.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                        <span>Used: {batch.usedVisas} / {batch.totalVisas}</span>
                        <span>{percentUsed}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${percentUsed}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/80">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Rate / Visa</span>
                        <strong className="text-emerald-700">₹{batch.amountPerVisa.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Available</span>
                        <strong className="text-slate-900 font-mono">{batch.remainingVisas} Visas</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Candidates & Recent Payments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Assigned Candidates */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#0F1E36] flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  Recent Assigned Candidates ({partnerCandidates.length})
                </h3>
                <button
                  onClick={() => setActiveTab('candidates')}
                  className="text-xs text-amber-600 font-bold hover:underline"
                >
                  View All →
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {partnerCandidates.slice(0, 5).map((cand) => (
                  <div key={cand.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 block">{cand.fullName}</strong>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {cand.trackingId} • Passport: {cand.passportNumber}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 block">
                        {cand.status}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Commission: ₹{(cand.partnerCommission || cand.alHeraCommission || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
                {partnerCandidates.length === 0 && (
                  <p className="py-4 text-center text-slate-400">No candidates assigned yet.</p>
                )}
              </div>
            </div>

            {/* Recent Payments Made */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#0F1E36] flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Recent Payments Made ({partnerPayments.length})
                </h3>
                <button
                  onClick={() => setActiveTab('payments')}
                  className="text-xs text-amber-600 font-bold hover:underline"
                >
                  View All →
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {partnerPayments.slice(0, 5).map((pay) => (
                  <div key={pay.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900 block">{pay.paymentNumber}</span>
                      <span className="text-[11px] text-slate-500">
                        {pay.paymentDate} • {pay.paymentMethod} (Ref: {pay.referenceNumber})
                      </span>
                    </div>
                    <strong className="text-emerald-700 font-mono text-sm">
                      ₹{pay.amount.toLocaleString('en-IN')}
                    </strong>
                  </div>
                ))}
                {partnerPayments.length === 0 && (
                  <p className="py-4 text-center text-slate-400">No payments recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VISA BATCHES */}
      {activeTab === 'batches' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-[#0F1E36]">Visa Batches Received from {partner.agencyName}</h3>
              <p className="text-xs text-slate-500">Inventory batches and assigned candidate allocation status.</p>
            </div>
            <button
              onClick={onOpenReceiveBatch}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Receive New Batch</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Batch ID & Trade</th>
                  <th className="py-3 px-3">City / Sector</th>
                  <th className="py-3 px-3 text-center">Total Visas</th>
                  <th className="py-3 px-3 text-center">Assigned / Used</th>
                  <th className="py-3 px-3 text-center">Available</th>
                  <th className="py-3 px-3 text-right">Price / Visa</th>
                  <th className="py-3 px-3 text-right">Total Batch Value</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {partnerBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{b.batchId}</span>
                      <strong className="text-slate-800">{b.jobTitle}</strong>
                      <span className="text-[10px] text-slate-400 block">Received: {b.dateReceived}</span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">{b.sectorCity}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900">{b.totalVisas}</td>
                    <td className="py-3 px-3 text-center font-bold text-blue-700">{b.usedVisas}</td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-700">{b.remainingVisas}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{b.amountPerVisa.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-[#0F1E36]">
                      ₹{b.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          b.remainingVisas === 0
                            ? 'bg-rose-100 text-rose-800'
                            : b.usedVisas > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {partnerBatches.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No visa batches received from this partner yet. Click "Receive New Batch" to add.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: INDIVIDUAL VISAS */}
      {activeTab === 'visas' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-[#0F1E36]">Individual Saudi Visa Records ({partnerVisas.length})</h3>
              <p className="text-xs text-slate-500">Every visa has an independent ID, price, and candidate assignment record.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAssignCandidate()}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Assign Candidate</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by Visa ID, Visa Number, Trade, or Candidate..."
                value={visaSearch}
                onChange={(e) => setVisaSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <select
              value={visaStatusFilter}
              onChange={(e) => setVisaStatusFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg p-1.5 bg-white font-medium"
            >
              <option value="all">All Visa Statuses</option>
              <option value="Available">Available (Unassigned)</option>
              <option value="Candidate Assigned">Candidate Assigned</option>
              <option value="Visa Stamped">Visa Stamped</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Visas Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Visa ID & No.</th>
                  <th className="py-3 px-3">Trade / Sector</th>
                  <th className="py-3 px-3 text-right">Partner Rate</th>
                  <th className="py-3 px-4">Assigned Candidate</th>
                  <th className="py-3 px-3 text-right">Candidate Fee</th>
                  <th className="py-3 px-3 text-right">Al-Hera Margin</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredVisas.map((v) => {
                  const isAssigned = !!v.candidateId;
                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{v.visaId}</span>
                        {v.visaNumber && (
                          <span className="text-[10px] text-slate-500 font-mono">No: {v.visaNumber}</span>
                        )}
                        <span className="text-[10px] text-slate-400 block">{v.batchCode}</span>
                      </td>
                      <td className="py-3 px-3">
                        <strong className="text-slate-800 block">{v.jobTitle}</strong>
                        <span className="text-[10px] text-slate-500">{v.sectorCity}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{v.visaAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        {isAssigned ? (
                          <div>
                            <strong className="text-blue-900 block font-bold">{v.candidateName}</strong>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {v.candidateTrackingId} • Passport: {v.candidatePassport}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No candidate linked</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-800 font-bold">
                        {v.candidateAmount > 0 ? `₹${v.candidateAmount.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-700">
                        {v.alHeraCommission > 0 ? `₹${v.alHeraCommission.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            v.visaStatus === 'Available'
                              ? 'bg-emerald-100 text-emerald-800'
                              : v.visaStatus === 'Candidate Assigned'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {v.visaStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isAssigned ? (
                          <button
                            onClick={() => onOpenAssignCandidate(v)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px]"
                          >
                            Assign
                          </button>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">Assigned</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CANDIDATES & PAYMENT TRACKING */}
      {activeTab === 'candidates' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-sm">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#0F1E36]">
                  Candidate-Wise Visa & Payment Accounts ({partnerCandidates.length})
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Live Candidate Dues & Remittances
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Detailed record of visa costs, remittances paid to {partner.agencyName}, and remaining dues per candidate.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenRecordPayment()}
                className="px-3 py-1.5 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-amber-400 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Record Payment</span>
              </button>
              <button
                onClick={() => onOpenAssignCandidate()}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Link Candidate</span>
              </button>
            </div>
          </div>

          {/* Candidate Financial KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                Total Candidates
              </span>
              <p className="text-lg font-mono font-extrabold text-slate-900 mt-0.5">
                {partnerCandidates.length}
              </p>
              <span className="text-[10px] text-slate-400">Assigned / In-flight</span>
            </div>

            <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3">
              <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider block">
                Partner Visa Cost
              </span>
              <p className="text-lg font-mono font-extrabold text-blue-900 mt-0.5">
                ₹{candidateFinancialRollup.totalPartnerCost.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-blue-600">Total payable across candidates</span>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3">
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                Paid to Partner
              </span>
              <p className="text-lg font-mono font-extrabold text-emerald-900 mt-0.5">
                ₹{candidateFinancialRollup.totalRemitted.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-emerald-600">Candidate-linked remittances</span>
            </div>

            <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3">
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">
                Candidate Dues Pending
              </span>
              <p className="text-lg font-mono font-extrabold text-amber-900 mt-0.5">
                ₹{candidateFinancialRollup.totalBalanceDue.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-amber-600">Remaining to be paid</span>
            </div>
          </div>

          {/* Search bar inside Candidate tab */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={candidateSearchFilter}
                onChange={(e) => setCandidateSearchFilter(e.target.value)}
                placeholder="Search candidate name, tracking ID, passport, or trade..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            {candidateSearchFilter && (
              <button
                onClick={() => setCandidateSearchFilter('')}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                Clear
              </button>
            )}
          </div>

          {/* Candidates & Payment Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Candidate & Tracking ID</th>
                  <th className="py-3 px-3">Passport No.</th>
                  <th className="py-3 px-3">Trade / Job</th>
                  <th className="py-3 px-3">Linked Visa ID</th>
                  <th className="py-3 px-3 text-right">Partner Cost</th>
                  <th className="py-3 px-3 text-right">Paid to Partner</th>
                  <th className="py-3 px-3 text-right">Balance Due</th>
                  <th className="py-3 px-3 text-center">Settlement Status</th>
                  <th className="py-3 px-4 text-center">Candidate Payments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {partnerCandidatesWithPayments
                  .filter((item) => {
                    if (!candidateSearchFilter.trim()) return true;
                    const q = candidateSearchFilter.toLowerCase();
                    return (
                      item.candidate.fullName?.toLowerCase().includes(q) ||
                      item.candidate.trackingId?.toLowerCase().includes(q) ||
                      item.candidate.passportNumber?.toLowerCase().includes(q) ||
                      item.candidate.trade?.toLowerCase().includes(q)
                    );
                  })
                  .map((item) => {
                    const c = item.candidate;
                    const isFullyPaid = item.partnerCost > 0 && item.totalPaid >= item.partnerCost;
                    const isPartiallyPaid = item.totalPaid > 0 && item.totalPaid < item.partnerCost;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
                              {c.fullName ? c.fullName.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <div>
                              <span className="font-mono font-bold text-slate-900 block text-xs">
                                {c.trackingId}
                              </span>
                              <strong className="text-slate-800 block text-xs">{c.fullName}</strong>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold uppercase text-slate-700">
                          {c.passportNumber}
                        </td>
                        <td className="py-3 px-3 text-slate-800">{c.trade}</td>
                        <td className="py-3 px-3 font-mono font-semibold text-amber-800">
                          {item.linkedVisa?.visaNumber || c.visaId || 'General Pool'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{item.partnerCost.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="font-mono font-extrabold text-emerald-700 block">
                            ₹{item.totalPaid.toLocaleString('en-IN')}
                          </span>
                          {item.payments.length > 0 && (
                            <span className="text-[10px] text-slate-400">
                              ({item.payments.length} {item.payments.length === 1 ? 'voucher' : 'vouchers'})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          <span className={item.balanceDue > 0 ? 'text-amber-700' : 'text-slate-400'}>
                            ₹{item.balanceDue.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isFullyPaid ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Settled</span>
                            </span>
                          ) : isPartiallyPaid ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              Partial
                            </span>
                          ) : item.partnerCost === 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              No Cost
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                              Unpaid
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedCandidateForPaymentHistory(c)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-[11px] flex items-center gap-1 transition-all"
                              title="View all payments made to partner for this candidate"
                            >
                              <History className="w-3 h-3" />
                              <span>{item.payments.length > 0 ? `${item.payments.length} Payments` : 'View'}</span>
                            </button>
                            <button
                              onClick={() => onOpenRecordPayment(c.id)}
                              className="px-2.5 py-1 rounded-lg bg-[#0F1E36] hover:bg-[#1A3258] text-amber-400 font-bold text-[11px] flex items-center gap-1 transition-all"
                              title="Record a payment to partner for this candidate"
                            >
                              <DollarSign className="w-3 h-3 text-emerald-400" />
                              <span>Pay</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                {partnerCandidates.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No candidates assigned to this partner yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PAYMENTS & CANDIDATE REMITTANCES */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-sm">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#0F1E36]">
                  Settlement & Payment Records ({partnerPayments.length})
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Candidate Linked & Office Settlements
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Detailed record of all payments remitted to {partner.agencyName}, tracking candidate-wise payments and total paid amounts.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="partner-fetch-update-btn"
                onClick={() => {
                  setSelectedPartnerPaymentForEdit(null);
                  setIsFetchUpdateModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                title="Fetch, edit, or void old partner remittance vouchers"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Fetch & Update Payment</span>
              </button>
              <button
                onClick={() => onOpenRecordPayment()}
                className="px-4 py-2 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-amber-400 font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Record New Payment</span>
              </button>
            </div>
          </div>

          {/* Payment Metrics Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm space-y-1">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                Total Remitted to Partner
              </span>
              <p className="text-2xl font-mono font-extrabold text-white">
                ₹{financials.totalPaidToPartner.toLocaleString('en-IN')}
              </p>
              <span className="text-xs text-slate-400 block">
                Across all {partnerPayments.length} recorded vouchers
              </span>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 shadow-sm space-y-1">
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                Candidate-Linked Remittances
              </span>
              <p className="text-2xl font-mono font-extrabold text-emerald-900">
                ₹{candidateFinancialRollup.candidateLinkedPaymentsTotal.toLocaleString('en-IN')}
              </p>
              <span className="text-xs text-emerald-700 block">
                {partnerPayments.filter((p) => p.relatedCandidateId || p.relatedCandidateTrackingId).length} payments linked to specific candidates
              </span>
            </div>

            <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 shadow-sm space-y-1">
              <span className="text-[10px] text-blue-800 font-bold uppercase tracking-wider block">
                General Office Settlements
              </span>
              <p className="text-2xl font-mono font-extrabold text-blue-900">
                ₹{candidateFinancialRollup.officeGeneralPaymentsTotal.toLocaleString('en-IN')}
              </p>
              <span className="text-xs text-blue-700 block">
                {partnerPayments.filter((p) => !p.relatedCandidateId && !p.relatedCandidateTrackingId).length} batch / general pool settlements
              </span>
            </div>
          </div>

          {/* Candidate-Wise Payment Breakdown Cards */}
          {partnerCandidatesWithPayments.some((item) => item.totalPaid > 0) && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Candidate-Wise Remittance Summary
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {partnerCandidatesWithPayments
                  .filter((item) => item.totalPaid > 0)
                  .map((item) => (
                    <div
                      key={item.candidate.id}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-slate-900">
                            {item.candidate.trackingId}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-xs font-bold text-slate-800">{item.candidate.fullName}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {item.candidate.trade || 'Visa'} • {item.payments.length} {item.payments.length === 1 ? 'payment' : 'payments'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-extrabold text-emerald-700 block">
                          ₹{item.totalPaid.toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={() => setSelectedCandidateForPaymentHistory(item.candidate)}
                          className="text-[10px] font-bold text-blue-700 hover:text-blue-900 underline"
                        >
                          View History
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs font-bold text-slate-700 shrink-0">Filter by Candidate:</label>
              <select
                value={paymentCandidateFilter}
                onChange={(e) => setPaymentCandidateFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:ring-1 focus:ring-amber-500 max-w-xs"
              >
                <option value="all">All Payments ({partnerPayments.length})</option>
                <option value="general">
                  General Office Settlements ({partnerPayments.filter((p) => !p.relatedCandidateId && !p.relatedCandidateTrackingId).length})
                </option>
                <optgroup label="Candidates Placed">
                  {partnerCandidates.map((c) => {
                    const cCount = partnerPayments.filter(
                      (p) =>
                        (p.relatedCandidateId && (p.relatedCandidateId === c.id || p.relatedCandidateId === c.trackingId)) ||
                        (p.relatedCandidateTrackingId && p.relatedCandidateTrackingId === c.trackingId)
                    ).length;
                    return (
                      <option key={c.id} value={c.id}>
                        [{c.trackingId}] {c.fullName} ({cCount} payments)
                      </option>
                    );
                  })}
                </optgroup>
              </select>
              {paymentCandidateFilter !== 'all' && (
                <button
                  onClick={() => setPaymentCandidateFilter('all')}
                  className="text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* Payments Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Payment Voucher #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Mode</th>
                  <th className="py-3 px-4">UTR / Ref No.</th>
                  <th className="py-3 px-4">Linked Candidate</th>
                  <th className="py-3 px-3">Tagged Batch</th>
                  <th className="py-3 px-4">Remarks & Notes</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {partnerPayments
                  .filter((p) => {
                    if (paymentCandidateFilter === 'all') return true;
                    if (paymentCandidateFilter === 'general') {
                      return !p.relatedCandidateId && !p.relatedCandidateTrackingId;
                    }
                    const cand = partnerCandidates.find((c) => c.id === paymentCandidateFilter);
                    if (!cand) return false;
                    return (
                      p.relatedCandidateId === cand.id ||
                      p.relatedCandidateId === cand.trackingId ||
                      p.relatedCandidateTrackingId === cand.trackingId
                    );
                  })
                  .map((p) => {
                    const isCandidateLinked = Boolean(p.relatedCandidateId || p.relatedCandidateTrackingId || p.relatedCandidateName);
                    const matchingCandidate = partnerCandidates.find(
                      (c) =>
                        c.id === p.relatedCandidateId ||
                        c.trackingId === p.relatedCandidateTrackingId ||
                        c.trackingId === p.relatedCandidateId
                    );

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {p.paymentNumber}
                        </td>
                        <td className="py-3 px-3 text-slate-600">{p.paymentDate}</td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {p.referenceNumber || '-'}
                        </td>
                        <td className="py-3 px-4">
                          {isCandidateLinked ? (
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold text-[10px]">
                                {p.relatedCandidateTrackingId || 'CAND'}
                              </span>
                              <div>
                                <span className="font-bold text-slate-800 text-xs block">
                                  {p.relatedCandidateName || 'Assigned Candidate'}
                                </span>
                                {p.relatedCandidateTrade && (
                                  <span className="text-[10px] text-slate-400 block">
                                    {p.relatedCandidateTrade}
                                  </span>
                                )}
                              </div>
                              {matchingCandidate && (
                                <button
                                  onClick={() => setSelectedCandidateForPaymentHistory(matchingCandidate)}
                                  className="text-[10px] text-blue-700 hover:text-blue-900 ml-1 underline shrink-0"
                                  title="View candidate's payment history"
                                >
                                  Details
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400 italic">
                              General Office Settlement
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">
                          {p.relatedBatchCode || 'General'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                          {p.notes || '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-700 text-sm">
                          ₹{p.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            id={`partner-payment-update-btn-${p.id}`}
                            onClick={() => {
                              setSelectedPartnerPaymentForEdit(p.id);
                              setIsFetchUpdateModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs transition-all active:scale-95"
                            title="Update payment amount, date, or void this record"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Update</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                {partnerPayments.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No payments recorded yet. Click "Record New Payment" to add settlement.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: LEDGER */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-[#0F1E36]">Chronological Account Ledger ({partnerLedger.length} Transactions)</h3>
              <p className="text-xs text-slate-500">Live running balance of debits, credits, and commissions.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => generatePartnerStatementPdf(partner, partnerLedger, agency)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="Download formatted official PDF statement with letterhead"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF Statement</span>
              </button>
              <button
                onClick={() => {
                  setIsLedgerModalOpen(true);
                  onOpenFullLedger?.();
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Full Ledger / Statement</span>
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Txn Ref & Date</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-3 text-right">Debit (Paid)</th>
                  <th className="py-3 px-3 text-right">Credit (Payable)</th>
                  <th className="py-3 px-4 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {partnerLedger.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <strong className="text-slate-900 block">{e.transactionId}</strong>
                      <span className="text-[10px] text-slate-400">{e.date}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                        {e.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800">{e.description}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      {e.debit > 0 ? `₹${e.debit.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                      {e.credit > 0 ? `₹${e.credit.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-[#0F1E36]">
                      ₹{(e.balance || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#0F1E36]">Audit & Operations Log</h3>
            <span className="text-xs text-slate-400">{partnerAuditLogs.length} logged events</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {partnerAuditLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-[10px] text-slate-400">by {log.user}</span>
                  </div>
                  <p className="text-slate-600">{log.details}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
            {partnerAuditLogs.length === 0 && (
              <p className="py-8 text-center text-slate-400">No audit events recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Partner Ledger Statement Modal */}
      <PartnerLedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        partner={partner}
        ledgerEntries={partnerLedger}
        batches={allBatches}
        visas={allVisas}
        candidates={allCandidates}
        payments={allPayments}
      />

      {/* Candidate-Specific Partner Payment History Modal */}
      {selectedCandidateForPaymentHistory && (() => {
        const cand = selectedCandidateForPaymentHistory;
        const candPayments = partnerPayments.filter(
          (p) =>
            (p.relatedCandidateId && (p.relatedCandidateId === cand.id || p.relatedCandidateId === cand.trackingId)) ||
            (p.relatedCandidateTrackingId && p.relatedCandidateTrackingId === cand.trackingId)
        );
        const candTotalPaid = candPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const linkedVisa = partnerVisas.find(
          (v) => v.candidateId === cand.id || v.candidateTrackingId === cand.trackingId
        );
        const candPartnerCost = linkedVisa
          ? (Number(linkedVisa.partnerPayableAmount) || Number(linkedVisa.visaAmount) || 0)
          : (Number(cand.partnerPayableAmount) || Number(cand.visaAmount) || 0);
        const candBalanceDue = Math.max(0, candPartnerCost - candTotalPaid);
        const isFullySettled = candPartnerCost > 0 && candTotalPaid >= candPartnerCost;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="bg-[#0F1E36] p-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300">
                        {cand.trackingId}
                      </span>
                      <span className="text-xs text-slate-300">• Candidate Payment Ledger</span>
                    </div>
                    <h3 className="text-base font-extrabold text-white font-display mt-0.5">
                      {cand.fullName}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCandidateForPaymentHistory(null)}
                  className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-5">
                {/* Candidate & Partner Info Bar */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <p className="text-slate-500">
                      Passport:{' '}
                      <strong className="text-slate-800 font-mono uppercase">
                        {cand.passportNumber || 'N/A'}
                      </strong>{' '}
                      • Trade: <strong className="text-slate-800">{cand.trade || 'Visa'}</strong>
                    </p>
                    <p className="text-slate-500">
                      Partner Office:{' '}
                      <strong className="text-slate-900 font-medium">
                        {partner.agencyName} ({partner.partnerCode})
                      </strong>
                    </p>
                  </div>
                  {linkedVisa && (
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">
                        Linked Visa Number
                      </span>
                      <span className="font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-xs">
                        {linkedVisa.visaNumber}
                      </span>
                    </div>
                  )}
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 text-center">
                    <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider block">
                      Partner Visa Cost
                    </span>
                    <p className="text-lg font-mono font-extrabold text-blue-900 mt-1">
                      ₹{candPartnerCost.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] text-blue-600 block">Agreed Payable</span>
                  </div>

                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 text-center">
                    <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                      Total Remitted
                    </span>
                    <p className="text-lg font-mono font-extrabold text-emerald-900 mt-1">
                      ₹{candTotalPaid.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] text-emerald-600 block">
                      {candPayments.length} {candPayments.length === 1 ? 'voucher' : 'vouchers'}
                    </span>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 text-center">
                    <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">
                      Balance Due
                    </span>
                    <p className="text-lg font-mono font-extrabold text-amber-900 mt-1">
                      ₹{candBalanceDue.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] text-amber-600 block">
                      {isFullySettled ? '✓ Fully Cleared' : 'Remaining Payable'}
                    </span>
                  </div>
                </div>

                {/* Payment History Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Payments Paid to Partner for this Candidate ({candPayments.length})
                    </h4>
                    {isFullySettled && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>All Partner Dues Settled</span>
                      </span>
                    )}
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Voucher #</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Mode</th>
                          <th className="py-2.5 px-3">UTR / Ref No.</th>
                          <th className="py-2.5 px-3">Remarks</th>
                          <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {candPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {p.paymentNumber}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{p.paymentDate}</td>
                            <td className="py-2.5 px-3">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                                {p.paymentMethod}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">
                              {p.referenceNumber || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                              {p.notes || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-extrabold text-emerald-700">
                              ₹{p.amount.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                        {candPayments.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">
                              No payments recorded for this candidate yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedCandidateForPaymentHistory(null)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cId = cand.id;
                    setSelectedCandidateForPaymentHistory(null);
                    onOpenRecordPayment(cId);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-amber-400 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                >
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Record Payment for {cand.fullName}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Fetch & Update Payment Modal */}
      <FetchUpdatePaymentModal
        isOpen={isFetchUpdateModalOpen}
        onClose={() => {
          setIsFetchUpdateModalOpen(false);
          setSelectedPartnerPaymentForEdit(null);
        }}
        initialPartnerPaymentId={selectedPartnerPaymentForEdit || undefined}
        onPaymentUpdated={() => {
          onRefreshData?.();
        }}
      />
    </div>
  );
};
