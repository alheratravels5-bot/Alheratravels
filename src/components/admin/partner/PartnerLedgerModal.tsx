import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Download,
  Building2,
  Calendar,
  DollarSign,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  FileText
} from 'lucide-react';
import {
  PartnerOffice,
  PartnerOfficeLedgerEntry,
  AgencyInfo,
  VisaBatch,
  IndividualVisa,
  Candidate,
  PartnerOfficePayment
} from '../../../types';
import { getAgencyInfo } from '../../../lib/storage';
import { computeRunningLedger } from '../../../lib/partnerCalculations';
import { generatePartnerStatementPdf } from '../../../lib/pdfGenerator';

interface PartnerLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: PartnerOffice;
  ledgerEntries?: PartnerOfficeLedgerEntry[];
  batches?: VisaBatch[];
  visas?: IndividualVisa[];
  candidates?: Candidate[];
  payments?: PartnerOfficePayment[];
}

export const PartnerLedgerModal: React.FC<PartnerLedgerModalProps> = ({
  isOpen,
  onClose,
  partner,
  ledgerEntries = [],
  batches = [],
  visas = [],
  candidates = [],
  payments = [],
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Auto-reconciled ledger: combine explicit ledger entries with batches, visas, and payments
  const allReconciledEntries = useMemo(() => {
    if (!partner?.id) return [];

    const existingEntries = (ledgerEntries || []).filter((e) => e.partnerOfficeId === partner.id);
    const existingTxnIds = new Set(existingEntries.map((e) => e.transactionId));

    const synthesized: PartnerOfficeLedgerEntry[] = [...existingEntries];

    // Check batches
    (batches || [])
      .filter((b) => b && b.partnerOfficeId === partner.id)
      .forEach((b) => {
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

    // Check candidate assignments from visas
    (visas || [])
      .filter((v) => v && v.partnerOfficeId === partner.id && (v.candidateId || v.candidateName))
      .forEach((v) => {
        const txnId = `TXN-ASG-${v.visaId || v.id}`;
        if (!existingTxnIds.has(txnId)) {
          const cand = candidates.find((c) => c.id === v.candidateId);
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
    (payments || [])
      .filter((p) => p && p.partnerOfficeId === partner.id)
      .forEach((p) => {
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
  }, [partner?.id, ledgerEntries, batches, visas, candidates, payments]);

  // Filter ledger entries for this partner
  const filteredEntries = useMemo(() => {
    return allReconciledEntries.filter((entry) => {
      if (filterType !== 'all' && entry.type !== filterType) return false;
      if (startDate && entry.date < startDate) return false;
      if (endDate && entry.date > endDate) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          entry.description.toLowerCase().includes(q) ||
          (entry.candidateName && entry.candidateName.toLowerCase().includes(q)) ||
          (entry.visaId && entry.visaId.toLowerCase().includes(q)) ||
          (entry.referenceNumber && entry.referenceNumber.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [allReconciledEntries, filterType, startDate, endDate, searchQuery]);

  if (!isOpen || !partner) return null;

  const agency: AgencyInfo = getAgencyInfo();

  // Totals
  const totalDebit = filteredEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalCredit = filteredEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
  const totalCommission = filteredEntries.reduce((sum, e) => sum + (e.commission || 0), 0);
  const currentBalance = filteredEntries.length > 0 
    ? filteredEntries[filteredEntries.length - 1].balance || 0
    : (partner.outstandingPayable || partner.balancePending || 0);

  // Print Statement
  const handlePrint = () => {
    window.print();
  };

  // Download Official PDF Statement
  const handleDownloadPdf = () => {
    generatePartnerStatementPdf(partner, filteredEntries, agency);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Txn ID', 'Date', 'Type', 'Description', 'Visa ID', 'Candidate', 'Debit (Paid)', 'Credit (Payable)', 'Commission', 'Running Balance', 'Reference'];
    const rows = filteredEntries.map((e) => [
      e.transactionId,
      e.date,
      e.type,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      e.visaId || '',
      e.candidateName || '',
      e.debit || 0,
      e.credit || 0,
      e.commission || 0,
      e.balance || 0,
      e.referenceNumber || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ledger_${partner.agencyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full my-auto max-h-[92vh] flex flex-col overflow-hidden animate-fade-in text-slate-900">
        {/* Header */}
        <div className="bg-[#0F1E36] p-4 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                  Statement of Account & Ledger
                </span>
                <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded">
                  {partner.partnerCode || 'PTR'}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-display text-white truncate max-w-md">
                {partner.agencyName}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer"
              title="Download official PDF statement with company letterhead"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Statement</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable/Viewable Content Area */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Agency & Partner Meta Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Partner Contact</span>
              <strong className="text-slate-900 block text-xs truncate">{partner.contactPerson || 'N/A'}</strong>
              <span className="text-[11px] text-slate-600 font-mono">{partner.phone}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Location</span>
              <span className="text-slate-900 block text-xs truncate">{partner.city}, {partner.state}</span>
              <span className="text-[11px] text-slate-600">{partner.country || 'India'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Commission Model</span>
              <strong className="text-emerald-700 block text-xs">
                ₹{(partner.commissionRatePerCandidate || partner.defaultCommissionPerCandidate || 0).toLocaleString('en-IN')} / Cand.
              </strong>
              <span className="text-[10px] text-slate-500">B2B Tier</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Outstanding Balance</span>
              <strong className="text-rose-700 block text-sm font-extrabold font-mono">
                ₹{currentBalance.toLocaleString('en-IN')}
              </strong>
              <span className="text-[10px] text-slate-500">Payable to partner</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search transaction description, visa ID, candidate name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg p-1.5 bg-slate-50 font-medium"
              >
                <option value="all">All Transaction Types</option>
                <option value="Visa Received">Visa Received</option>
                <option value="Candidate Assigned">Candidate Assigned</option>
                <option value="Payment Made">Payment Made</option>
                <option value="Commission Adjusted">Commission Adjusted</option>
              </select>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg p-1.5"
                placeholder="From Date"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg p-1.5"
                placeholder="To Date"
              />
            </div>
          </div>

          {/* Ledger Table */}
          <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs border-collapse min-w-[650px]">
              <thead className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Txn Ref & Date</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-4">Details & Description</th>
                  <th className="py-3 px-3 text-right">Debit (Paid)</th>
                  <th className="py-3 px-3 text-right">Credit (Payable)</th>
                  <th className="py-3 px-3 text-right">Commission</th>
                  <th className="py-3 px-4 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No ledger transactions found for this partner account.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => {
                    return (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono">
                          <span className="font-bold text-slate-900 block">{entry.transactionId}</span>
                          <span className="text-[10px] text-slate-400">{entry.date}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                              entry.type === 'Payment Made'
                                ? 'bg-emerald-100 text-emerald-800'
                                : entry.type === 'Candidate Assigned'
                                ? 'bg-blue-100 text-blue-800'
                                : entry.type === 'Visa Received'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {entry.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900">{entry.description}</p>
                          <div className="flex flex-wrap gap-2 mt-0.5">
                            {entry.visaId && (
                              <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Visa: {entry.visaId}
                              </span>
                            )}
                            {entry.candidateName && (
                              <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                Candidate: {entry.candidateName}
                              </span>
                            )}
                            {entry.referenceNumber && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                Ref: {entry.referenceNumber}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                          {entry.debit > 0 ? `₹${entry.debit.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                          {entry.credit > 0 ? `₹${entry.credit.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {entry.commission > 0 ? `₹${entry.commission.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-[#0F1E36]">
                          ₹{(entry.balance || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-slate-100 text-slate-900 font-bold border-t border-slate-300">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right uppercase text-[10px]">
                    Statement Total:
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-800 font-mono">
                    ₹{totalDebit.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right text-rose-800 font-mono">
                    ₹{totalCredit.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700 font-mono">
                    ₹{totalCommission.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-slate-950 font-mono">
                    ₹{currentBalance.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
