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
  FileText
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
  onOpenRecordPayment: () => void;
  onOpenFullLedger: () => void;
  onSelectCandidateDetail?: (candidate: Candidate) => void;
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
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'batches' | 'visas' | 'candidates' | 'payments' | 'ledger' | 'audit'
  >('overview');
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState<boolean>(false);

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

  const partnerCandidates = useMemo(
    () => allCandidates.filter((c) => c.partnerOfficeId === partner.id || c.partnerAgentId === partner.id),
    [allCandidates, partner.id]
  );

  const partnerPayments = useMemo(
    () => allPayments.filter((p) => p.partnerOfficeId === partner.id),
    [allPayments, partner.id]
  );

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
            onClick={onOpenRecordPayment}
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

      {/* TAB 4: CANDIDATES */}
      {activeTab === 'candidates' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#0F1E36]">Candidates Placed on Partner's Visas ({partnerCandidates.length})</h3>
              <p className="text-xs text-slate-500">All overseas candidates deployed or processing through this partner office.</p>
            </div>
            <button
              onClick={() => onOpenAssignCandidate()}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Link Candidate</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tracking ID & Name</th>
                  <th className="py-3 px-3">Passport No.</th>
                  <th className="py-3 px-3">Trade / Job</th>
                  <th className="py-3 px-3">Linked Visa ID</th>
                  <th className="py-3 px-3 text-right">Package Fee</th>
                  <th className="py-3 px-3 text-right">Al-Hera Margin</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {partnerCandidates.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{c.trackingId}</span>
                      <strong className="text-slate-800">{c.fullName}</strong>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold uppercase text-slate-700">{c.passportNumber}</td>
                    <td className="py-3 px-3 text-slate-800">{c.trade}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-amber-800">{c.visaId || 'General Pool'}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{(c.packageFee || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-700">
                      ₹{(c.partnerCommission || c.alHeraCommission || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {partnerCandidates.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No candidates assigned to this partner yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#0F1E36]">Settlement & Payment Records ({partnerPayments.length})</h3>
              <p className="text-xs text-slate-500">Record of payments remitted to {partner.agencyName}.</p>
            </div>
            <button
              onClick={onOpenRecordPayment}
              className="px-4 py-2 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-amber-400 font-bold text-xs flex items-center gap-2 shadow-sm"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Record New Payment</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Payment Voucher #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Mode</th>
                  <th className="py-3 px-4">UTR / Ref No.</th>
                  <th className="py-3 px-3">Tagged Batch</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {partnerPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                    <td className="py-3 px-3 text-slate-600">{p.paymentDate}</td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{p.referenceNumber}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{p.relatedBatchCode || 'General Settlement'}</td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-700 text-sm">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
                {partnerPayments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
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
    </div>
  );
};
