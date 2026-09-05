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
  AlertCircle,
  MapPin,
  CheckSquare,
  Square,
  ChevronDown,
  Loader2,
  X,
  Layers
} from 'lucide-react';
import { Candidate, CandidateStatus, PartnerOffice, AgencyInfo, POPULAR_SELECTION_CITIES } from '../../types';
import { getAgencyInfo } from '../../lib/storage';
import { generateSelectionLetterPdf } from '../../lib/pdfGenerator';
import { WakalaCardModal } from './WakalaCardModal';

const STATUS_OPTIONS: { value: CandidateStatus; label: string }[] = [
  { value: 'applied', label: '1. Applied / Registered' },
  { value: 'interview_scheduled', label: '2. Trade Test / Interview Scheduled' },
  { value: 'interview_selected', label: '3. Client Interview Selected' },
  { value: 'medical_in_progress', label: '4. GAMCA Medical In Progress' },
  { value: 'medical_fit', label: '5. GAMCA Medical Fit' },
  { value: 'wakala_issued', label: '6. Saudi Wakala Allotted' },
  { value: 'visa_stamped', label: '7. Saudi Embassy Visa Stamped' },
  { value: 'emigration_cleared', label: '8. Emigration / Protector Cleared' },
  { value: 'ticket_booked', label: '9. Flight Ticket Booked' },
  { value: 'deployed', label: '10. Deployed in Saudi Arabia' },
  { value: 'rejected', label: 'Rejected' },
];

interface CandidateManagementProps {
  candidates: Candidate[];
  partners: PartnerOffice[];
  onAddCandidate: () => void;
  onEditCandidate: (candidate: Candidate) => void;
  onViewCandidate: (candidate: Candidate) => void;
  onDeleteCandidate: (candidateId: string) => void;
  onUpdateCandidate?: (candidate: Candidate) => Promise<boolean | void> | void;
  onUpdateCandidateStatus?: (candidateId: string, newStatus: CandidateStatus, options?: { notes?: string; selectionCity?: string }) => Promise<boolean>;
  onBulkUpdateStatus?: (candidateIds: string[], newStatus: CandidateStatus, options?: { notes?: string; selectionCity?: string }) => Promise<boolean>;
  agencyInfo?: AgencyInfo;
}

export const CandidateManagement: React.FC<CandidateManagementProps> = ({
  candidates,
  partners,
  onAddCandidate,
  onEditCandidate,
  onViewCandidate,
  onDeleteCandidate,
  onUpdateCandidate,
  onUpdateCandidateStatus,
  onBulkUpdateStatus,
  agencyInfo: propAgency,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tradeFilter, setTradeFilter] = useState<string>('all');
  const [partnerFilter, setPartnerFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [selectedCandidateForWakala, setSelectedCandidateForWakala] = useState<Candidate | null>(null);

  // Multi-selection state for bulk actions
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
  const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<CandidateStatus>('medical_in_progress');
  const [bulkSelectionCity, setBulkSelectionCity] = useState('');
  const [bulkNotes, setBulkNotes] = useState('');
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  // Single candidate status updating state
  const [updatingCandidateId, setUpdatingCandidateId] = useState<string | null>(null);

  const agency = propAgency || getAgencyInfo();
  const safeCandidates = Array.isArray(candidates) ? candidates : [];
  const safePartners = Array.isArray(partners) ? partners : [];

  // Extract unique trades & selection cities
  const uniqueTrades = Array.from(new Set(safeCandidates.map((c) => c?.trade).filter(Boolean)));
  const uniqueCities = Array.from(
    new Set(safeCandidates.map((c) => c?.selectionCity).filter((city): city is string => Boolean(city && city.trim())))
  ).sort();

  const filteredCandidates = safeCandidates.filter((c) => {
    if (!c) return false;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (c.fullName || '').toLowerCase().includes(q) ||
      (c.trackingId || '').toLowerCase().includes(q) ||
      (c.passportNumber || '').toLowerCase().includes(q) ||
      (c.phoneNumber || '').includes(q) ||
      (c.trade || '').toLowerCase().includes(q) ||
      (c.selectionCity && c.selectionCity.toLowerCase().includes(q)) ||
      (c.sponsorName && c.sponsorName.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesTrade = tradeFilter === 'all' || c.trade === tradeFilter;
    const matchesPartner = partnerFilter === 'all' || c.partnerOfficeId === partnerFilter;
    const matchesCity = cityFilter === 'all' || c.selectionCity === cityFilter;

    return matchesSearch && matchesStatus && matchesTrade && matchesPartner && matchesCity;
  });

  // Multi-selection helpers
  const isAllFilteredSelected =
    filteredCandidates.length > 0 &&
    filteredCandidates.every((c) => selectedCandidateIds.has(c.id));

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const next = new Set(selectedCandidateIds);
      filteredCandidates.forEach((c) => next.delete(c.id));
      setSelectedCandidateIds(next);
    } else {
      const next = new Set(selectedCandidateIds);
      filteredCandidates.forEach((c) => next.add(c.id));
      setSelectedCandidateIds(next);
    }
  };

  const handleToggleSelectCandidate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedCandidateIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedCandidateIds(next);
  };

  // Quick single candidate status update with direct awaited Supabase call
  const handleQuickStatusChange = async (c: Candidate, newStatus: CandidateStatus, e?: React.ChangeEvent<HTMLSelectElement>) => {
    if (e) e.stopPropagation();
    if (c.status === newStatus) return;

    setUpdatingCandidateId(c.id);

    try {
      if (onUpdateCandidateStatus) {
        await onUpdateCandidateStatus(c.id, newStatus, {
          selectionCity: newStatus === 'interview_selected' ? (c.selectionCity || 'Mumbai') : undefined,
        });
      } else if (onUpdateCandidate) {
        const updated: Candidate = {
          ...c,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };
        await onUpdateCandidate(updated);
      }
    } finally {
      setUpdatingCandidateId(null);
    }
  };

  // Bulk status update with direct awaited Supabase call
  const handleExecuteBulkStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCandidateIds.size === 0) return;

    setIsBulkSubmitting(true);
    setBulkError(null);

    try {
      const ids = Array.from(selectedCandidateIds);
      let success = false;

      if (onBulkUpdateStatus) {
        success = await onBulkUpdateStatus(ids, bulkStatus, {
          notes: bulkNotes.trim() || undefined,
          selectionCity: bulkStatus === 'interview_selected' ? (bulkSelectionCity.trim() || 'Mumbai') : undefined,
        });
      }

      if (success) {
        setSelectedCandidateIds(new Set());
        setIsBulkStatusModalOpen(false);
        setBulkNotes('');
        setBulkSelectionCity('');
      } else {
        setBulkError('Failed to save bulk status updates to Supabase database. Please try again.');
      }
    } catch (err: any) {
      console.error('Error in bulk status update:', err);
      setBulkError(err?.message || 'Error executing bulk status update.');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Tracking ID',
      'Full Name',
      'Date of Birth',
      'Passport Number',
      'Trade',
      'Selection City',
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
      `"${c.selectionCity || ''}"`,
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
      applied: 'bg-slate-100 text-slate-800 border-slate-200',
      interview_scheduled: 'bg-blue-50 text-blue-800 border-blue-200',
      interview_selected: 'bg-indigo-100 text-indigo-800 border-indigo-200 font-bold',
      medical_in_progress: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      medical_fit: 'bg-teal-100 text-teal-800 border-teal-200 font-bold',
      wakala_issued: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
      visa_stamped: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
      emigration_cleared: 'bg-cyan-100 text-cyan-900 border-cyan-300 font-bold',
      ticket_booked: 'bg-purple-100 text-purple-900 border-purple-300 font-bold',
      deployed: 'bg-green-100 text-green-900 border-green-300 font-black',
      rejected: 'bg-rose-100 text-rose-800 border-rose-200',
    };

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border ${colors[status] || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const selectedCandidatesList = safeCandidates.filter((c) => selectedCandidateIds.has(c.id));

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0F1E36] font-display">
            Candidate Dossiers & Visa Pipeline
          </h2>
          <p className="text-xs text-slate-500">
            Total {candidates.length} Registered Candidates • Realtime Central Database Persistence
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {selectedCandidateIds.size > 0 && (
            <button
              onClick={() => {
                setBulkError(null);
                setIsBulkStatusModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all animate-pulse"
            >
              <Layers className="w-4 h-4" />
              <span>Bulk Change Status ({selectedCandidateIds.size})</span>
            </button>
          )}

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
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
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
            <option value="all">All Status Stages</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
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
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="all">All Selection Cities</option>
            {uniqueCities.map((city) => (
              <option key={city} value={city}>
                {city}
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

      {/* Multi-Select Floating Action Bar */}
      {selectedCandidateIds.size > 0 && (
        <div className="bg-indigo-50 border-2 border-indigo-300 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              {selectedCandidateIds.size}
            </span>
            <div>
              <p className="font-bold text-sm text-indigo-950">
                {selectedCandidateIds.size} Candidate{selectedCandidateIds.size > 1 ? 's' : ''} Selected
              </p>
              <p className="text-[11px] text-indigo-700">
                Apply central Supabase status transition to all selected dossiers at once
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setBulkError(null);
                setIsBulkStatusModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>Change Status in Supabase</span>
            </button>

            <button
              onClick={() => setSelectedCandidateIds(new Set())}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-indigo-200 font-bold text-xs"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0F1E36] text-white font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="flex items-center justify-center p-1 rounded hover:bg-white/10"
                    title={isAllFilteredSelected ? 'Deselect all visible' : 'Select all visible'}
                  >
                    {isAllFilteredSelected ? (
                      <CheckSquare className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-3">Tracking ID</th>
                <th className="py-3.5 px-4">Candidate & Passport</th>
                <th className="py-3.5 px-4">Trade / Profession</th>
                <th className="py-3.5 px-4">Saudi Sponsor</th>
                <th className="py-3.5 px-4 min-w-[200px]">Current Status (Immediate Save)</th>
                <th className="py-3.5 px-4">Financials (INR)</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((c) => {
                  const isSelected = selectedCandidateIds.has(c.id);
                  const isRowUpdating = updatingCandidateId === c.id;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => onViewCandidate(c)}
                      className={`hover:bg-amber-50/40 cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50/60' : ''
                      }`}
                    >
                      <td
                        className="py-3.5 px-3 text-center"
                        onClick={(e) => handleToggleSelectCandidate(c.id, e)}
                      >
                        <button
                          type="button"
                          className="flex items-center justify-center p-1 rounded hover:bg-indigo-100/60"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-amber-900 whitespace-nowrap">
                        {c.trackingId}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <strong className="font-bold text-slate-900 block">{c.fullName}</strong>
                        <span className="font-mono text-[11px] text-slate-500 uppercase">
                          PP: {c.passportNumber} • DOB: {c.dateOfBirth || 'N/A'} • {c.phoneNumber}
                        </span>
                        {c.selectionCity && (
                          <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800 text-[10px] font-bold">
                            <MapPin className="w-2.5 h-2.5 text-indigo-600" />
                            <span>Selected in: {c.selectionCity}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{c.trade}</span>
                        <span className="text-[10px] text-slate-400 block">{c.experienceYears} Yrs Exp.</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 max-w-[150px] truncate">
                        {c.sponsorName || 'Direct Selection'}
                      </td>
                      <td
                        className="py-3.5 px-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2">
                          {isRowUpdating ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 font-bold text-[11px]">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                              <span>Saving to Supabase...</span>
                            </div>
                          ) : (
                            <div className="relative inline-block">
                              <select
                                value={c.status}
                                onChange={(e) => handleQuickStatusChange(c, e.target.value as CandidateStatus, e)}
                                className="appearance-none pr-7 pl-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-300 bg-white hover:border-amber-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer transition-colors text-slate-800 shadow-2xs"
                                title="Change status stage immediately in Supabase"
                              >
                                {STATUS_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          )}
                        </div>
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
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                    No candidates found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Status Update Modal */}
      {isBulkStatusModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-[#0F1E36]">
                    Bulk Status Update ({selectedCandidateIds.size} Candidates)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Immediately saves new status to Supabase central database
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkStatusModalOpen(false)}
                disabled={isBulkSubmitting}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected Candidates Summary Chips */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 max-h-32 overflow-y-auto">
              <span className="text-[11px] font-bold text-slate-600 block">
                Selected Candidates ({selectedCandidateIds.size}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedCandidatesList.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-800"
                  >
                    <span>{c.fullName}</span>
                    <span className="font-mono text-slate-400">({c.trackingId})</span>
                  </span>
                ))}
              </div>
            </div>

            <form onSubmit={handleExecuteBulkStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Target Status Stage *
                </label>
                <select
                  value={bulkStatus}
                  onChange={(e) => {
                    const st = e.target.value as CandidateStatus;
                    setBulkStatus(st);
                    if (st === 'interview_selected' && !bulkSelectionCity) {
                      setBulkSelectionCity('Mumbai');
                    }
                  }}
                  className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-white"
                  required
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selection City (only for interview_selected) */}
              {bulkStatus === 'interview_selected' && (
                <div className="p-3 bg-indigo-50/90 border-2 border-indigo-300 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Selection City *</span>
                    </label>
                    <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-100 px-2 py-0.5 rounded">
                      Venue
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      list="selection-cities-bulk-modal"
                      placeholder="Select or enter city (e.g. Mumbai, New Delhi, Lucknow, Patna...)"
                      value={bulkSelectionCity}
                      onChange={(e) => setBulkSelectionCity(e.target.value)}
                      className="w-full text-xs font-bold border border-indigo-300 bg-white rounded-lg p-2.5 pl-8 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                      required
                    />
                    <MapPin className="w-4 h-4 text-indigo-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <datalist id="selection-cities-bulk-modal">
                      {POPULAR_SELECTION_CITIES.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-slate-500 font-medium">Quick Pick:</span>
                    {['Mumbai', 'New Delhi', 'Lucknow', 'Patna', 'Hyderabad', 'Kolkata'].map((cityOption) => (
                      <button
                        key={cityOption}
                        type="button"
                        onClick={() => setBulkSelectionCity(cityOption)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                          bulkSelectionCity.toLowerCase() === cityOption.toLowerCase()
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300'
                        }`}
                      >
                        {cityOption}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Progress Note / Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bulk status update applied following client trade test results."
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {bulkError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkStatusModalOpen(false)}
                  disabled={isBulkSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBulkSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isBulkSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving {selectedCandidateIds.size} Records to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Changes to Supabase ({selectedCandidateIds.size})</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
