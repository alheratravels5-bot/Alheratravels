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
  CheckCircle2
} from 'lucide-react';
import { PartnerOffice, PartnerOfficeLedgerEntry, AgencyInfo } from '../../../types';
import { getAgencyInfo } from '../../../lib/storage';

interface PartnerLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: PartnerOffice;
  ledgerEntries: PartnerOfficeLedgerEntry[];
}

export const PartnerLedgerModal: React.FC<PartnerLedgerModalProps> = ({
  isOpen,
  onClose,
  partner,
  ledgerEntries,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  if (!isOpen) return null;

  const agency: AgencyInfo = getAgencyInfo();

  // Filter ledger entries for this partner
  const filteredEntries = useMemo(() => {
    return ledgerEntries.filter((entry) => {
      if (entry.partnerOfficeId !== partner.id) return false;
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
  }, [ledgerEntries, partner.id, filterType, startDate, endDate, searchQuery]);

  // Totals
  const totalDebit = filteredEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalCredit = filteredEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
  const totalCommission = filteredEntries.reduce((sum, e) => sum + (e.commission || 0), 0);
  const currentBalance = partner.outstandingPayable || partner.balancePending || 0;

  // Print Statement
  const handlePrint = () => {
    window.print();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full my-8 overflow-hidden animate-fade-in text-slate-900">
        {/* Header */}
        <div className="bg-[#0F1E36] p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                  Statement of Account & Ledger
                </span>
                <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded">
                  {partner.partnerCode}
                </span>
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                {partner.agencyName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Statement</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable/Viewable Area */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
          {/* Agency & Partner Meta Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Partner Contact</span>
              <strong className="text-slate-900 block text-xs">{partner.contactPerson}</strong>
              <span className="text-[11px] text-slate-600 font-mono">{partner.phone}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Location</span>
              <span className="text-slate-900 block text-xs">{partner.city}, {partner.state}</span>
              <span className="text-[11px] text-slate-600">{partner.country || 'India'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Commission Model</span>
              <strong className="text-emerald-700 block text-xs">
                ₹{(partner.commissionRatePerCandidate || partner.defaultCommissionPerCandidate || 0).toLocaleString('en-IN')} / Candidate
              </strong>
              <span className="text-[11px] text-slate-500">Fixed rate tier</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Outstanding Balance</span>
              <strong className="text-rose-700 block text-sm font-extrabold">
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
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Txn Ref & Date</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-4">Details & Description</th>
                  <th className="py-3 px-3 text-right">Debit (Paid)</th>
                  <th className="py-3 px-3 text-right">Credit (Payable)</th>
                  <th className="py-3 px-3 text-right">Al-Hera Commission</th>
                  <th className="py-3 px-4 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No ledger transactions found for the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => {
                    const isPayment = entry.type === 'Payment Made' || entry.debit > 0;
                    const isCredit = entry.credit > 0;

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
                          {entry.visaId && (
                            <span className="text-[10px] font-mono text-amber-800 mr-2">
                              Visa: {entry.visaId}
                            </span>
                          )}
                          {entry.candidateName && (
                            <span className="text-[10px] font-medium text-blue-700 mr-2">
                              Candidate: {entry.candidateName}
                            </span>
                          )}
                          {entry.referenceNumber && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Ref: {entry.referenceNumber}
                            </span>
                          )}
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
                    Filtered Total:
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
