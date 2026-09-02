import React, { useState } from 'react';
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
  Receipt,
  CloudDownload
} from 'lucide-react';
import { Candidate, PaymentRecord, PartnerOffice, AgencyInfo } from '../../types';
import { getAgencyInfo, getCandidates } from '../../lib/storage';
import { generatePaymentReceiptPdf } from '../../lib/pdfGenerator';
import { FetchUpdatePaymentModal } from './FetchUpdatePaymentModal';

interface AccountsManagementProps {
  candidates: Candidate[];
  partners: PartnerOffice[];
  agencyInfo?: AgencyInfo;
  onRefreshCandidates?: () => void;
}

export const AccountsManagement: React.FC<AccountsManagementProps> = ({
  candidates,
  partners,
  agencyInfo: propAgency,
  onRefreshCandidates,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'due' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [receiptSearch, setReceiptSearch] = useState('');

  // Payment Hub Modal State
  const [isFetchUpdateModalOpen, setIsFetchUpdateModalOpen] = useState(false);
  const [selectedCandidatePaymentForEdit, setSelectedCandidatePaymentForEdit] = useState<{
    candidateId: string;
    paymentId: string;
  } | null>(null);
  const [initialSearchTerm, setInitialSearchTerm] = useState('');

  const agency = propAgency || getAgencyInfo();

  const safeCandidates = Array.isArray(candidates) ? candidates : [];
  const safePartners = Array.isArray(partners) ? partners : [];

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

  // Filtered payments by receipt search
  const filteredReceipts = allPayments.filter(({ payment, candidate }) => {
    if (!receiptSearch.trim()) return true;
    const q = receiptSearch.toLowerCase();
    return (
      (payment.receiptNumber && payment.receiptNumber.toLowerCase().includes(q)) ||
      (candidate.fullName && candidate.fullName.toLowerCase().includes(q)) ||
      (candidate.trackingId && candidate.trackingId.toLowerCase().includes(q)) ||
      (payment.transactionReference && payment.transactionReference.toLowerCase().includes(q)) ||
      (payment.paymentMethod && payment.paymentMethod.toLowerCase().includes(q))
    );
  });

  const totalPackageVolume = safeCandidates.reduce((acc, c) => acc + (Number(c?.packageFee) || 0), 0);
  const totalCollected = safeCandidates.reduce((acc, c) => acc + (Number(c?.totalPaid) || 0), 0);
  const totalOutstanding = safeCandidates.reduce((acc, c) => acc + (Number(c?.balanceDue) || 0), 0);
  const totalCommissionsEarned = safeCandidates.reduce((acc, c) => acc + (Number(c?.partnerCommission) || 0), 0);

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
    setInitialSearchTerm('');
    setIsFetchUpdateModalOpen(true);
  };

  const handleOpenGeneralFetchModal = () => {
    setSelectedCandidatePaymentForEdit(null);
    setInitialSearchTerm('');
    setIsFetchUpdateModalOpen(true);
  };

  const handlePaymentUpdated = () => {
    if (onRefreshCandidates) {
      onRefreshCandidates();
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
        <div className="flex items-center gap-2.5">
          <button
            id="accounts-fetch-update-payment-btn"
            onClick={handleOpenGeneralFetchModal}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow flex items-center gap-2 transition-transform active:scale-95"
          >
            <Edit3 className="w-4 h-4" />
            <span>Fetch & Update Old Payment Record</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Package Volume</span>
          <h3 className="text-2xl font-black text-[#0F1E36] font-display mt-1">
            ₹{totalPackageVolume.toLocaleString('en-IN')}
          </h3>
          <span className="text-[10px] text-slate-400">Total committed packages</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-700 uppercase block">Collected Revenue</span>
          <h3 className="text-2xl font-black text-emerald-700 font-display mt-1">
            ₹{totalCollected.toLocaleString('en-IN')}
          </h3>
          <span className="text-[10px] text-emerald-600 font-medium">Bank & Cash collections</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-rose-700 uppercase block">Outstanding Balances</span>
          <h3 className="text-2xl font-black text-rose-700 font-display mt-1">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </h3>
          <span className="text-[10px] text-rose-600 font-medium">Pending collection before flight</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-amber-800 uppercase block">Partner Commissions</span>
          <h3 className="text-2xl font-black text-amber-800 font-display mt-1">
            ₹{totalCommissionsEarned.toLocaleString('en-IN')}
          </h3>
          <span className="text-[10px] text-slate-500">Across {partners.length} sub-agent offices</span>
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
              All Candidates ({candidates.length})
            </button>
            <button
              onClick={() => setFilterType('due')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterType === 'due' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              With Balance Due ({candidates.filter((c) => c.balanceDue > 0).length})
            </button>
            <button
              onClick={() => setFilterType('paid')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterType === 'paid' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Fully Paid ({candidates.filter((c) => c.balanceDue === 0).length})
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
                <th className="py-3 px-4">Candidate Name</th>
                <th className="py-3 px-4">Trade / Sponsor</th>
                <th className="py-3 px-4">Package Fee</th>
                <th className="py-3 px-4">Total Paid</th>
                <th className="py-3 px-4">Balance Due</th>
                <th className="py-3 px-4 text-right">Partner Commission</th>
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
                    <td className="py-3 px-4 font-bold text-slate-900">{c.fullName}</td>
                    <td className="py-3 px-4 text-slate-600">{c.trade}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">₹{packageFee.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">₹{totalPaid.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-bold">
                      {balanceDue > 0 ? (
                        <span className="text-rose-600">₹{balanceDue.toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="text-emerald-600">CLEARED</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                      ₹{partnerComm.toLocaleString('en-IN')}
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
            <h3 className="font-bold text-base text-[#0F1E36] font-display">
              Recent Payment Receipts Issued
            </h3>
            <p className="text-xs text-slate-500">Search, edit values, reprint official payment vouchers with QR code</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search receipt #, candidate, or UTR..."
                value={receiptSearch}
                onChange={(e) => setReceiptSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 w-56 sm:w-64"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b">
              <tr>
                <th className="py-3 px-4">Receipt No</th>
                <th className="py-3 px-4">Candidate & Track ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Txn Ref</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReceipts.map(({ payment, candidate }) => (
                <tr key={payment.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-amber-900">{payment.receiptNumber}</td>
                  <td className="py-3 px-4">
                    <strong className="text-slate-900 block">{candidate.fullName}</strong>
                    <span className="font-mono text-slate-500 text-[10px]">{candidate.trackingId}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{payment.date || payment.paymentDate}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold">
                      {payment.paymentMethod || payment.paymentMode}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{payment.transactionReference || payment.note || 'N/A'}</td>
                  <td className="py-3 px-4 font-black text-emerald-800 text-sm">
                    ₹{(Number(payment.amount) || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      id={`receipt-update-btn-${payment.id}`}
                      onClick={() => handleOpenEditPayment(candidate.id, payment.id)}
                      className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs mr-2 transition-all active:scale-95"
                      title="Update or void payment record"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Update</span>
                    </button>
                    <button
                      id={`receipt-print-btn-${payment.id}`}
                      onClick={() => generatePaymentReceiptPdf(payment, candidate, agency)}
                      className="px-2.5 py-1 rounded bg-[#0F1E36] hover:bg-[#1A3258] text-white text-[10px] font-bold inline-flex items-center gap-1 transition-all"
                    >
                      <Printer className="w-3 h-3 text-amber-400" />
                      <span>Print PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
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
      </div>

      {/* Fetch & Update Old Payment Modal */}
      <FetchUpdatePaymentModal
        isOpen={isFetchUpdateModalOpen}
        onClose={() => setIsFetchUpdateModalOpen(false)}
        initialCandidatePayment={selectedCandidatePaymentForEdit || undefined}
        onPaymentUpdated={handlePaymentUpdated}
      />
    </div>
  );
};
