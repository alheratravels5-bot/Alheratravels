import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Printer,
  Download,
  Plus,
  DollarSign,
  TrendingUp,
  Search,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  Receipt,
  Building2,
  CloudDownload,
  ArrowRight,
  X,
  AlertTriangle
} from 'lucide-react';
import { Candidate, PaymentRecord, PartnerOffice, PartnerOfficePayment, AgencyInfo } from '../../types';
import {
  getAgencyInfo,
  getCandidates,
  getPartnerPayments,
  deleteCandidatePaymentRecord,
  deletePartnerPaymentRecord
} from '../../lib/storage';
import { generatePaymentReceiptPdf, generateDirectPaymentsReportPdf } from '../../lib/pdfGenerator';
import { FetchUpdatePaymentModal } from './FetchUpdatePaymentModal';
import { DirectCandidatePaymentModal } from './DirectCandidatePaymentModal';

interface AccountsManagementProps {
  candidates: Candidate[];
  partners: PartnerOffice[];
  agencyInfo?: AgencyInfo;
  onRefreshCandidates?: () => void;
}

export interface DeletePaymentTarget {
  type: 'candidate_payment' | 'partner_payment';
  id: string;
  candidateId?: string;
  referenceNumber: string;
  amount: number;
  partyName: string;
  subtitle?: string;
}

export const AccountsManagement: React.FC<AccountsManagementProps> = ({
  candidates,
  partners,
  agencyInfo: propAgency,
  onRefreshCandidates,
}) => {
  const [activeLedgerTab, setActiveLedgerTab] = useState<'candidate' | 'partner'>('candidate');
  const [filterType, setFilterType] = useState<'all' | 'due' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [receiptSearch, setReceiptSearch] = useState('');
  const [partnerPaymentsList, setPartnerPaymentsList] = useState<PartnerOfficePayment[]>([]);

  // Direct Candidate Payment Modal State
  const [isDirectPaymentModalOpen, setIsDirectPaymentModalOpen] = useState(false);
  const [directCandidatePreselectId, setDirectCandidatePreselectId] = useState<string | undefined>(undefined);
  const [candidateReceiptFilter, setCandidateReceiptFilter] = useState<'all' | 'direct' | 'office'>('all');

  // Payment Hub Modal State
  const [isFetchUpdateModalOpen, setIsFetchUpdateModalOpen] = useState(false);
  const [selectedCandidatePaymentForEdit, setSelectedCandidatePaymentForEdit] = useState<{
    candidateId: string;
    paymentId: string;
  } | null>(null);
  const [selectedPartnerPaymentForEdit, setSelectedPartnerPaymentForEdit] = useState<string | null>(null);
  const [initialSearchTerm, setInitialSearchTerm] = useState('');
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // In-app deletion confirmation modal state (safe against mobile iframe restrictions)
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<DeletePaymentTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const agency = propAgency || getAgencyInfo();

  const safeCandidates = Array.isArray(candidates) ? candidates : [];
  const safePartners = Array.isArray(partners) ? partners : [];

  const refreshPartnerPayments = () => {
    setPartnerPaymentsList(getPartnerPayments());
  };

  useEffect(() => {
    refreshPartnerPayments();
  }, [partners]);

  // Aggregate all payments across all candidates
  const allPayments: { payment: PaymentRecord; candidate: Candidate }[] = [];
  safeCandidates.forEach((c) => {
    if (c && c.paymentHistory && Array.isArray(c.paymentHistory)) {
      c.paymentHistory.forEach((p) => {
        if (p) {
          allPayments.push({ payment: p, candidate: c });
        }
      });
    }
  });

  // Sort latest first
  allPayments.sort((a, b) => {
    const timeB = new Date(b.payment?.date || b.payment?.paymentDate || 0).getTime() || 0;
    const timeA = new Date(a.payment?.date || a.payment?.paymentDate || 0).getTime() || 0;
    return timeB - timeA;
  });

  // Direct Candidate Payments (payments made directly without sub-agent partner or marked isDirectPayment)
  const directPayments = useMemo(() => {
    return allPayments.filter(({ payment, candidate }) => {
      return (
        payment.isDirectPayment ||
        String(payment.receiptNumber || '').includes('DIR') ||
        !candidate.partnerOfficeId
      );
    });
  }, [allPayments]);

  const totalDirectCollected = useMemo(() => {
    return directPayments.reduce((acc, { payment }) => acc + (Number(payment?.amount) || 0), 0);
  }, [directPayments]);

  // Filtered candidate payments by channel & search
  const filteredReceipts = useMemo(() => {
    return allPayments.filter(({ payment, candidate }) => {
      // Channel filter
      const isDirect =
        payment.isDirectPayment ||
        String(payment.receiptNumber || '').includes('DIR') ||
        !candidate.partnerOfficeId;

      if (candidateReceiptFilter === 'direct' && !isDirect) return false;
      if (candidateReceiptFilter === 'office' && isDirect) return false;

      // Search query filter
      if (!receiptSearch.trim()) return true;
      const q = receiptSearch.toLowerCase();
      return (
        (payment.receiptNumber && payment.receiptNumber.toLowerCase().includes(q)) ||
        (candidate.fullName && candidate.fullName.toLowerCase().includes(q)) ||
        (candidate.trackingId && candidate.trackingId.toLowerCase().includes(q)) ||
        (candidate.passportNumber && candidate.passportNumber.toLowerCase().includes(q)) ||
        (payment.transactionReference && payment.transactionReference.toLowerCase().includes(q)) ||
        (payment.paymentMethod && payment.paymentMethod.toLowerCase().includes(q)) ||
        (payment.paymentMode && payment.paymentMode.toLowerCase().includes(q)) ||
        (payment.note && payment.note.toLowerCase().includes(q)) ||
        (payment.remarks && payment.remarks.toLowerCase().includes(q))
      );
    });
  }, [allPayments, candidateReceiptFilter, receiptSearch]);

  // Filtered partner payments by search
  const filteredPartnerPayments = partnerPaymentsList.filter((p) => {
    if (!receiptSearch.trim()) return true;
    const q = receiptSearch.toLowerCase();
    return (
      (p.paymentNumber && p.paymentNumber.toLowerCase().includes(q)) ||
      (p.partnerOfficeName && p.partnerOfficeName.toLowerCase().includes(q)) ||
      (p.relatedCandidateTrackingId && p.relatedCandidateTrackingId.toLowerCase().includes(q)) ||
      (p.relatedCandidateName && p.relatedCandidateName.toLowerCase().includes(q)) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q)) ||
      (p.paymentMethod && p.paymentMethod.toLowerCase().includes(q))
    );
  });

  const totalPackageVolume = useMemo(() => {
    return safeCandidates.reduce((acc, c) => acc + (Number(c?.packageFee) || 0), 0);
  }, [safeCandidates]);

  const totalCollected = useMemo(() => {
    return safeCandidates.reduce((acc, c) => acc + (Number(c?.totalPaid) || 0), 0);
  }, [safeCandidates]);

  const totalOutstanding = useMemo(() => {
    return safeCandidates.reduce((acc, c) => acc + (Number(c?.balanceDue) || 0), 0);
  }, [safeCandidates]);

  const totalCommissionsEarned = useMemo(() => {
    return safeCandidates.reduce((acc, c) => acc + (Number(c?.partnerCommission) || 0), 0);
  }, [safeCandidates]);

  const totalPartnerRemitted = useMemo(() => {
    return partnerPaymentsList.reduce((acc, p) => acc + (Number(p?.amount) || 0), 0);
  }, [partnerPaymentsList]);

  const filteredCandidates = safeCandidates.filter((c) => {
    if (!c) return false;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (c.fullName || '').toLowerCase().includes(q) ||
      (c.trackingId || '').toLowerCase().includes(q) ||
      (c.passportNumber || '').toLowerCase().includes(q);

    const balanceDue = Number(c.balanceDue) || 0;
    if (filterType === 'due') return matchesSearch && balanceDue > 0;
    if (filterType === 'paid') return matchesSearch && balanceDue <= 0;
    return matchesSearch;
  });

  const handleOpenEditPayment = (candidateId: string, paymentId: string) => {
    setSelectedCandidatePaymentForEdit({ candidateId, paymentId });
    setSelectedPartnerPaymentForEdit(null);
    setInitialSearchTerm('');
    setIsFetchUpdateModalOpen(true);
  };

  const handleOpenEditPartnerPayment = (paymentId: string) => {
    setSelectedPartnerPaymentForEdit(paymentId);
    setSelectedCandidatePaymentForEdit(null);
    setInitialSearchTerm('');
    setIsFetchUpdateModalOpen(true);
  };

  const handleOpenGeneralFetchModal = () => {
    setSelectedCandidatePaymentForEdit(null);
    setSelectedPartnerPaymentForEdit(null);
    setInitialSearchTerm('');
    setIsFetchUpdateModalOpen(true);
  };

  const handleDeleteCandidatePayment = (
    candidateId: string,
    paymentId: string,
    receiptNumber: string,
    amount: number,
    candidateName: string,
    trackingId?: string
  ) => {
    setDeleteConfirmTarget({
      type: 'candidate_payment',
      id: paymentId,
      candidateId,
      referenceNumber: receiptNumber || 'Receipt',
      amount,
      partyName: candidateName,
      subtitle: trackingId ? `Tracking ID: ${trackingId}` : undefined,
    });
  };

  const handleDeletePartnerPayment = (
    paymentId: string,
    paymentNumber: string,
    amount: number,
    partnerName: string,
    candidateInfo?: string
  ) => {
    setDeleteConfirmTarget({
      type: 'partner_payment',
      id: paymentId,
      referenceNumber: paymentNumber || 'Voucher',
      amount,
      partyName: partnerName,
      subtitle: candidateInfo || 'Partner Office Disbursement',
    });
  };

  const executeDeletePayment = async () => {
    if (!deleteConfirmTarget) return;
    setIsDeleting(true);
    try {
      if (deleteConfirmTarget.type === 'partner_payment') {
        const res = deletePartnerPaymentRecord(deleteConfirmTarget.id, 'Administrator');
        if (res.success) {
          refreshPartnerPayments();
          if (onRefreshCandidates) {
            onRefreshCandidates();
          }
          setActionNotice({
            type: 'success',
            message: `${res.message} Synchronized with Supabase and Firestore.`,
          });
        } else {
          setActionNotice({
            type: 'error',
            message: res.message || 'Failed to delete partner remittance voucher.',
          });
        }
      } else if (deleteConfirmTarget.type === 'candidate_payment' && deleteConfirmTarget.candidateId) {
        const res = deleteCandidatePaymentRecord(
          deleteConfirmTarget.candidateId,
          deleteConfirmTarget.id,
          'Administrator'
        );
        if (res.success) {
          if (onRefreshCandidates) {
            onRefreshCandidates();
          }
          setActionNotice({
            type: 'success',
            message: `${res.message} Synchronized with Supabase and Firestore.`,
          });
        } else {
          setActionNotice({
            type: 'error',
            message: res.message || 'Failed to delete candidate payment receipt.',
          });
        }
      }
    } catch (err: any) {
      console.error('Error during payment record deletion:', err);
      setActionNotice({
        type: 'error',
        message: `Failed to delete payment record: ${err?.message || 'Data synchronization failure with Supabase'}`,
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmTarget(null);
      setTimeout(() => setActionNotice(null), 6000);
    }
  };

  const handlePaymentUpdated = () => {
    try {
      refreshPartnerPayments();
      if (onRefreshCandidates) {
        onRefreshCandidates();
      }
      setActionNotice({
        type: 'success',
        message: 'Payment record updated successfully and synchronized with Supabase & Firestore.',
      });
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      console.error('Error during payment update in AccountsManagement:', err);
      setActionNotice({
        type: 'error',
        message: `Failed to update and synchronize payment: ${err?.message || 'Data synchronization failure with Supabase'}`,
      });
      setTimeout(() => setActionNotice(null), 7000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0F1E36] font-display">
            Accounts, Invoices & Receipt Ledger
          </h2>
          <p className="text-xs text-slate-500">
            Realtime revenue audit, pending candidate balances, and sub-agent commission reports.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="accounts-direct-candidate-payment-btn"
            onClick={() => {
              setDirectCandidatePreselectId(undefined);
              setIsDirectPaymentModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-transform active:scale-95"
          >
            <CreditCard className="w-4 h-4 text-emerald-100" />
            <span>+ Direct Candidate Payment</span>
          </button>

          <button
            id="accounts-print-direct-payments-report-btn"
            onClick={() => generateDirectPaymentsReportPdf(filteredReceipts, agency)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 shadow-2xs flex items-center gap-1.5 transition-colors"
            title="Print Direct Candidate Payments PDF Report"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Report PDF</span>
          </button>

          <button
            id="accounts-fetch-update-payment-btn"
            onClick={handleOpenGeneralFetchModal}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow flex items-center gap-2 transition-transform active:scale-95"
          >
            <Edit3 className="w-4 h-4" />
            <span>Fetch & Update Old Payment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Package Volume</span>
          <h3 className="text-2xl font-black text-[#0F1E36] font-display mt-1">
            ₹{(totalPackageVolume || 0).toLocaleString('en-IN')}
          </h3>
          <span className="text-[10px] text-slate-400">Total committed packages</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase block">Collected Revenue</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Direct: ₹{totalDirectCollected.toLocaleString('en-IN')}
            </span>
          </div>
          <h3 className="text-2xl font-black text-emerald-700 font-display mt-1">
            ₹{(totalCollected || 0).toLocaleString('en-IN')}
          </h3>
          <span className="text-[10px] text-emerald-600 font-medium">
            {directPayments.length} direct, {allPayments.length - directPayments.length} partner collections
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-rose-700 uppercase block">Outstanding Balances</span>
          <h3 className="text-2xl font-black text-rose-700 font-display mt-1">
            ₹{(totalOutstanding || 0).toLocaleString('en-IN')}
          </h3>
          <span className="text-[10px] text-rose-600 font-medium">Pending collection before flight</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-amber-800 uppercase block">Partner Commissions</span>
          <h3 className="text-2xl font-black text-amber-800 font-display mt-1">
            ₹{(totalCommissionsEarned || 0).toLocaleString('en-IN')}
          </h3>
          <span className="text-[10px] text-slate-500">Across {safePartners.length} sub-agent offices</span>
        </div>
      </div>

      {/* Candidate Balances Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterType === 'all' ? 'bg-[#0F1E36] text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              All Candidates ({safeCandidates.length})
            </button>
            <button
              onClick={() => setFilterType('due')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterType === 'due' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              With Balance Due ({safeCandidates.filter((c) => (Number(c?.balanceDue) || 0) > 0).length})
            </button>
            <button
              onClick={() => setFilterType('paid')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterType === 'paid' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Fully Paid ({safeCandidates.filter((c) => (Number(c?.balanceDue) || 0) <= 0).length})
            </button>
          </div>

          <input
            type="text"
            placeholder="Search candidate in accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b">
              <tr>
                <th className="py-3 px-4">Tracking ID</th>
                <th className="py-3 px-4">Candidate & Passport</th>
                <th className="py-3 px-4">Trade / Destination</th>
                <th className="py-3 px-4">Package Fee</th>
                <th className="py-3 px-4">Total Paid</th>
                <th className="py-3 px-4">Balance Due</th>
                <th className="py-3 px-4">Commission</th>
                <th className="py-3 px-4 text-right">Direct Collection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCandidates.map((c) => {
                const packageFee = Number(c.packageFee) || 0;
                const totalPaid = Number(c.totalPaid) || 0;
                const balanceDue = Number(c.balanceDue) || 0;
                const partnerComm = Number(c.partnerCommission) || 0;
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-amber-900">{c.trackingId}</td>
                    <td className="py-3 px-4">
                      <strong className="text-slate-900 block">{c.fullName}</strong>
                      <span className="font-mono text-slate-500 text-[10px]">Passport: {c.passportNumber || 'N/A'}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{c.trade}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">₹{packageFee.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">₹{totalPaid.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-bold">
                      {balanceDue > 0 ? (
                        <span className="text-rose-600">₹{balanceDue.toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">CLEARED</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      ₹{partnerComm.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        id={`direct-pay-cand-btn-${c.id}`}
                        onClick={() => {
                          setDirectCandidatePreselectId(c.id);
                          setIsDirectPaymentModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-[10px] inline-flex items-center gap-1 shadow-xs transition-all"
                        title="Record direct counter or bank payment from candidate"
                      >
                        <CreditCard className="w-3 h-3 text-emerald-100" />
                        <span>+ Direct Pay</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Receipts History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <button
                id="tab-candidate-receipts-main"
                type="button"
                onClick={() => setActiveLedgerTab('candidate')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  activeLedgerTab === 'candidate'
                    ? 'bg-[#0F1E36] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                <span>Candidate Receipts ({allPayments.length})</span>
              </button>
              <button
                id="tab-partner-vouchers-main"
                type="button"
                onClick={() => setActiveLedgerTab('partner')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  activeLedgerTab === 'partner'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>Partner Remittances ({partnerPaymentsList.length})</span>
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {activeLedgerTab === 'candidate'
                ? 'Candidate fee payments — edit or delete any record with automatic recalculation and Supabase cloud sync.'
                : 'Partner office remittances — track, edit, or delete disbursement vouchers linked to candidate visas.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
            {activeLedgerTab === 'candidate' && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setCandidateReceiptFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    candidateReceiptFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({allPayments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCandidateReceiptFilter('direct')}
                  className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                    candidateReceiptFilter === 'direct'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <span>Direct ({directPayments.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCandidateReceiptFilter('office')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    candidateReceiptFilter === 'office'
                      ? 'bg-purple-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Partner ({allPayments.length - directPayments.length})
                </button>
              </div>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="accounts-receipt-search-input"
                type="text"
                placeholder={
                  activeLedgerTab === 'candidate'
                    ? 'Search receipt #, candidate, passport, UTR...'
                    : 'Search voucher #, partner, or UTR...'
                }
                value={receiptSearch}
                onChange={(e) => setReceiptSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 w-56 sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* 1. Candidate Receipts Table */}
        {activeLedgerTab === 'candidate' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b">
                <tr>
                  <th className="py-3 px-4">Receipt No</th>
                  <th className="py-3 px-4">Candidate & Passport</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Txn Ref / Notes</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredReceipts.map(({ payment, candidate }) => {
                  const isDirect =
                    payment.isDirectPayment ||
                    String(payment.receiptNumber || '').includes('DIR') ||
                    !candidate.partnerOfficeId;

                  return (
                    <tr key={payment.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-amber-900">
                        <div className="flex items-center gap-1.5">
                          <span>{payment.receiptNumber}</span>
                          {isDirect ? (
                            <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                              Direct
                            </span>
                          ) : (
                            <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-medium">
                              Office
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 block">{candidate.fullName}</strong>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          <span>ID: {candidate.trackingId}</span>
                          <span>•</span>
                          <span className="text-amber-800 font-semibold">Pass: {candidate.passportNumber || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{payment.date || payment.paymentDate}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                          {payment.paymentMethod || payment.paymentMode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="font-mono text-slate-700 font-medium text-[11px]">
                          {payment.transactionReference || '-'}
                        </div>
                        {(payment.note || payment.remarks) && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {payment.note || payment.remarks}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-black text-emerald-800 text-sm">
                        ₹{(Number(payment.amount) || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          id={`receipt-edit-btn-${payment.id}`}
                          onClick={() => handleOpenEditPayment(candidate.id, payment.id)}
                          className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs mr-1.5 transition-all active:scale-95"
                          title="Edit payment details"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          id={`receipt-delete-btn-${payment.id}`}
                          onClick={() =>
                            handleDeleteCandidatePayment(
                              candidate.id,
                              payment.id,
                              payment.receiptNumber || 'Receipt',
                              Number(payment.amount) || 0,
                              candidate.fullName,
                              candidate.trackingId
                            )
                          }
                          className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 text-[10px] font-bold inline-flex items-center gap-1 transition-all active:scale-95 mr-1.5"
                          title="Delete payment record and recalculate balance"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>Delete</span>
                        </button>
                        <button
                          id={`receipt-print-btn-${payment.id}`}
                          onClick={() => generatePaymentReceiptPdf(payment, candidate, agency)}
                          className="px-2.5 py-1 rounded bg-[#0F1E36] hover:bg-[#1A3258] text-white text-[10px] font-bold inline-flex items-center gap-1 transition-all"
                          title="Print receipt PDF"
                        >
                          <Printer className="w-3 h-3 text-amber-400" />
                          <span>Print PDF</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredReceipts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No payment receipts found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Partner Remittances Table */}
        {activeLedgerTab === 'partner' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b">
                <tr>
                  <th className="py-3 px-4">Voucher No</th>
                  <th className="py-3 px-4">Partner Office</th>
                  <th className="py-3 px-4">Associated Candidate</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Txn Ref</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPartnerPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-900">{p.paymentNumber}</td>
                    <td className="py-3 px-4">
                      <strong className="text-slate-900 block">{p.partnerOfficeName}</strong>
                      <span className="font-mono text-slate-500 text-[10px]">ID: {p.partnerOfficeId}</span>
                    </td>
                    <td className="py-3 px-4">
                      {p.relatedCandidateName ? (
                        <div>
                          <strong className="text-slate-900 block">{p.relatedCandidateName}</strong>
                          <span className="font-mono text-slate-500 text-[10px]">
                            {p.relatedCandidateTrackingId}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">General Settlement</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{p.paymentDate}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{p.referenceNumber || '-'}</td>
                    <td className="py-3 px-4 font-black text-emerald-800 text-sm">
                      ₹{(Number(p.amount) || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        id={`partner-payment-edit-btn-${p.id}`}
                        onClick={() => handleOpenEditPartnerPayment(p.id)}
                        className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs mr-1.5 transition-all active:scale-95"
                        title="Edit voucher details"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        id={`partner-payment-delete-btn-${p.id}`}
                        onClick={() =>
                          handleDeletePartnerPayment(
                            p.id,
                            p.paymentNumber || 'Voucher',
                            Number(p.amount) || 0,
                            p.partnerOfficeName,
                            p.relatedCandidateName ? `Candidate: ${p.relatedCandidateName} (${p.relatedCandidateTrackingId})` : 'General Settlement'
                          )
                        }
                        className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 text-[10px] font-bold inline-flex items-center gap-1 transition-all active:scale-95"
                        title="Delete voucher and update partner ledger"
                      >
                        <Trash2 className="w-3 h-3 text-rose-600" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPartnerPayments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No partner office payments found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* In-App Mobile-Safe Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div
          id="delete-payment-confirm-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in"
        >
          <div
            id="delete-payment-confirm-dialog"
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                    {deleteConfirmTarget.type === 'partner_payment'
                      ? 'Delete Partner Remittance?'
                      : 'Delete Payment Receipt?'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    This action permanently deletes this record and recalculates all ledger balances automatically.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Record / Ref:</span>
                  <span className="font-mono font-bold text-slate-800">{deleteConfirmTarget.referenceNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">
                    {deleteConfirmTarget.type === 'partner_payment' ? 'Partner Office:' : 'Candidate:'}
                  </span>
                  <span className="font-bold text-slate-900 truncate max-w-[210px]">{deleteConfirmTarget.partyName}</span>
                </div>
                {deleteConfirmTarget.subtitle && (
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>Details:</span>
                    <span className="truncate max-w-[210px]">{deleteConfirmTarget.subtitle}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-700 font-bold">Amount to Revert:</span>
                  <span className="font-mono font-black text-rose-700 text-base">
                    ₹{deleteConfirmTarget.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Balances and statements will be updated immediately and synchronized with Supabase and Firestore.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  id="cancel-delete-payment-btn"
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  id="confirm-delete-payment-btn"
                  type="button"
                  disabled={isDeleting}
                  onClick={executeDeletePayment}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Payment'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fetch & Update Old Payment Modal */}
      <FetchUpdatePaymentModal
        isOpen={isFetchUpdateModalOpen}
        onClose={() => setIsFetchUpdateModalOpen(false)}
        initialCandidatePayment={selectedCandidatePaymentForEdit || undefined}
        initialPartnerPaymentId={selectedPartnerPaymentForEdit || undefined}
        onPaymentUpdated={handlePaymentUpdated}
      />

      {/* Direct Candidate Payment Modal */}
      <DirectCandidatePaymentModal
        isOpen={isDirectPaymentModalOpen}
        onClose={() => {
          setIsDirectPaymentModalOpen(false);
          setDirectCandidatePreselectId(undefined);
        }}
        candidates={safeCandidates}
        preselectedCandidateId={directCandidatePreselectId}
        onPaymentRecorded={handlePaymentUpdated}
        agencyInfo={agency}
      />
    </div>
  );
};
