import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Download,
  Phone,
  Printer,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Candidate, CandidateStatus, PartnerOffice, AgencyInfo } from '../../types';
import { getAgencyInfo } from '../../lib/storage';
import { generateSelectionLetterPdf } from '../../lib/pdfGenerator';
import { WakalaCardModal } from './WakalaCardModal';

interface CandidateManagementProps {
  candidates: Candidate[];
  partners: PartnerOffice[];
  onAddCandidate: () => void;
  onEditCandidate: (candidate: Candidate) => void;
  onViewCandidate: (candidate: Candidate) => void;
  onDeleteCandidate: (candidateId: string) => void;
  agencyInfo?: AgencyInfo;
}

export const CandidateManagement: React.FC<CandidateManagementProps> = ({
  candidates,
  partners,
  onAddCandidate,
  onEditCandidate,
  onViewCandidate,
  onDeleteCandidate,
  agencyInfo: propAgency,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tradeFilter, setTradeFilter] = useState<string>('all');
  const [partnerFilter, setPartnerFilter] = useState<string>('all');
  const [selectedCandidateForWakala, setSelectedCandidateForWakala] = useState<Candidate | null>(null);

  const agency = propAgency || getAgencyInfo();
  const safeCandidates = Array.isArray(candidates) ? candidates : [];
  const safePartners = Array.isArray(partners) ? partners : [];

  // Extract unique trades
  const uniqueTrades = Array.from(new Set(safeCandidates.map((c) => c?.trade).filter(Boolean)));

  const filteredCandidates = safeCandidates.filter((c) => {
    if (!c) return false;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (c.fullName || '').toLowerCase().includes(q) ||
      (c.trackingId || '').toLowerCase().includes(q) ||
      (c.passportNumber || '').toLowerCase().includes(q) ||
      (c.phoneNumber || '').includes(q) ||
      (c.trade || '').toLowerCase().includes(q) ||
      (c.sponsorName && c.sponsorName.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesTrade = tradeFilter === 'all' || c.trade === tradeFilter;
    const matchesPartner = partnerFilter === 'all' || c.partnerOfficeId === partnerFilter;

    return matchesSearch && matchesStatus && matchesTrade && matchesPartner;
  });

  const handleExportCSV = () => {
    const headers = [
      'Tracking ID',
      'Full Name',
      'Date of Birth',
      'Passport Number',
      'Trade',
      'Sponsor',
      'Phone',
      'Status',
      'Package Fee',
      'Total Paid',
      'Balance Due',
    ];
    const rows = filteredCandidates.map((c) => [
      c.trackingId,
      `"${c.fullName}"`,
      c.dateOfBirth || '',
      c.passportNumber,
      `"${c.trade}"`,
      `"${c.sponsorName || ''}"`,
      c.phoneNumber,
      c.status,
      c.packageFee,
      c.totalPaid,
      c.balanceDue,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AL-HERA-CANDIDATES-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: CandidateStatus) => {
    const colors: Record<string, string> = {
      applied: 'bg-slate-100 text-slate-800',
      interview_selected: 'bg-indigo-100 text-indigo-800',
      medical_fit: 'bg-teal-100 text-teal-800',
      wakala_issued: 'bg-amber-100 text-amber-900 font-bold',
      visa_stamped: 'bg-emerald-100 text-emerald-900 font-bold',
      emigration_cleared: 'bg-blue-100 text-blue-900 font-bold',
      ticket_booked: 'bg-purple-100 text-purple-900 font-bold',
      deployed: 'bg-green-100 text-green-900 font-black',
    };

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${colors[status] || 'bg-slate-100 text-slate-800'}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0F1E36] font-display">
            Candidate Dossiers & Visa Pipeline
          </h2>
          <p className="text-xs text-slate-500">
            Total {candidates.length} Registered Candidates • Realtime Tracking & Financial Ledger
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onAddCandidate}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Candidate</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="relative sm:col-span-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search candidate, passport, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="all">All Operational Statuses</option>
            <option value="applied">1. Application Registered</option>
            <option value="interview_selected">2. Interview Selected</option>
            <option value="medical_fit">3. GAMCA Medical Fit</option>
            <option value="wakala_issued">4. Saudi Wakala Allotted</option>
            <option value="visa_stamped">5. Visa Stamped</option>
            <option value="emigration_cleared">6. Emigration Cleared</option>
            <option value="ticket_booked">7. Ticket Booked</option>
            <option value="deployed">8. Deployed in Saudi Arabia</option>
          </select>
        </div>

        <div>
          <select
            value={tradeFilter}
            onChange={(e) => setTradeFilter(e.target.value)}
            className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="all">All Trades / Designations</option>
            {uniqueTrades.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={partnerFilter}
            onChange={(e) => setPartnerFilter(e.target.value)}
            className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="all">All Sub-Agent Offices</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.agencyName} ({p.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0F1E36] text-white font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Tracking ID</th>
                <th className="py-3.5 px-4">Candidate & Passport</th>
                <th className="py-3.5 px-4">Trade / Profession</th>
                <th className="py-3.5 px-4">Saudi Sponsor</th>
                <th className="py-3.5 px-4">Current Status</th>
                <th className="py-3.5 px-4">Financials (INR)</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => onViewCandidate(c)}
                    className="hover:bg-amber-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-900 whitespace-nowrap">
                      {c.trackingId}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <strong className="font-bold text-slate-900 block">{c.fullName}</strong>
                      <span className="font-mono text-[11px] text-slate-500 uppercase">
                        PP: {c.passportNumber} • DOB: {c.dateOfBirth || 'N/A'} • {c.phoneNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{c.trade}</span>
                      <span className="text-[10px] text-slate-400 block">{c.experienceYears} Yrs Exp.</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 max-w-[150px] truncate">
                      {c.sponsorName || 'Direct Selection'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(c.status)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-slate-800 block">Total: ₹{(Number(c.packageFee) || 0).toLocaleString('en-IN')}</span>
                      <span className="text-[11px] text-emerald-700 font-bold block">
                        Paid: ₹{(Number(c.totalPaid) || 0).toLocaleString('en-IN')}
                      </span>
                      {(Number(c.balanceDue) || 0) > 0 && (
                        <span className="text-[10px] text-rose-600 font-bold block">
                          Due: ₹{(Number(c.balanceDue) || 0).toLocaleString('en-IN')}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onViewCandidate(c)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                          title="Open Dossier"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => generateSelectionLetterPdf(c, agency)}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800"
                          title="Download Selection Letter PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setSelectedCandidateForWakala(c)}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800"
                          title="Wakala Identity Badge"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onEditCandidate(c)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                          title="Edit Particulars"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Delete candidate ${c.fullName} (${c.trackingId})?`)) {
                              onDeleteCandidate(c.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                    No candidates found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wakala Card Modal */}
      <WakalaCardModal
        candidate={selectedCandidateForWakala}
        isOpen={!!selectedCandidateForWakala}
        onClose={() => setSelectedCandidateForWakala(null)}
        agencyInfo={agency}
      />
    </div>
  );
};
