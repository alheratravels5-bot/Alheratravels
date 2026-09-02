import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Users,
  CheckCircle2,
  X,
  Save,
  Search,
  Ticket,
  UserCheck,
  TrendingUp,
  CreditCard,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Eye,
  Filter,
  ExternalLink,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  Edit3
} from 'lucide-react';
import {
  PartnerOffice,
  Candidate,
  VisaBatch,
  IndividualVisa,
  PartnerOfficePayment,
  PartnerOfficeLedgerEntry,
  PartnerAuditLog
} from '../../types';
import {
  getVisaBatches,
  saveVisaBatches,
  getIndividualVisas,
  saveIndividualVisas,
  getPartnerPayments,
  savePartnerPayments,
  getPartnerLedger,
  savePartnerLedger,
  getPartnerAuditLogs,
  savePartnerAuditLogs,
  getPartners
} from '../../lib/storage';
import { computePartnerFinancials } from '../../lib/partnerCalculations';
import { PartnerDetailView } from './partner/PartnerDetailView';
import { ReceiveVisaBatchModal } from './partner/ReceiveVisaBatchModal';
import { AssignCandidateToVisaModal } from './partner/AssignCandidateToVisaModal';
import { RecordPartnerPaymentModal } from './partner/RecordPartnerPaymentModal';
import { PartnerLedgerModal } from './partner/PartnerLedgerModal';
import { FetchUpdatePaymentModal } from './FetchUpdatePaymentModal';

interface PartnerManagementProps {
  partners: PartnerOffice[];
  candidates: Candidate[];
  onSavePartner: (partner: PartnerOffice) => void;
  onDeletePartner: (partnerId: string) => void;
  onSelectCandidateDetail?: (candidate: Candidate) => void;
}

export const PartnerManagement: React.FC<PartnerManagementProps> = ({
  partners,
  candidates,
  onSavePartner,
  onDeletePartner,
  onSelectCandidateDetail,
}) => {
  // Navigation & Selected Partner
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  // Entities state loaded from storage
  const [visaBatches, setVisaBatches] = useState<VisaBatch[]>([]);
  const [individualVisas, setIndividualVisas] = useState<IndividualVisa[]>([]);
  const [partnerPayments, setPartnerPayments] = useState<PartnerOfficePayment[]>([]);
  const [partnerLedger, setPartnerLedger] = useState<PartnerOfficeLedgerEntry[]>([]);
  const [partnerAuditLogs, setPartnerAuditLogs] = useState<PartnerAuditLog[]>([]);

  // Modals state
  const [isPartnerFormOpen, setIsPartnerFormOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerOffice | null>(null);
  const [isReceiveBatchOpen, setIsReceiveBatchOpen] = useState(false);
  const [isAssignCandidateOpen, setIsAssignCandidateOpen] = useState(false);
  const [selectedVisaForAssignment, setSelectedVisaForAssignment] = useState<IndividualVisa | null>(null);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedCandidateIdForPayment, setSelectedCandidateIdForPayment] = useState<string>('');
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [isFetchUpdateModalOpen, setIsFetchUpdateModalOpen] = useState(false);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Form Fields
  const [agencyName, setAgencyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [commissionRate, setCommissionRate] = useState(6000);
  const [notes, setNotes] = useState('');

  // Load sub-entities on mount or when refreshed
  const loadData = () => {
    setVisaBatches(getVisaBatches());
    setIndividualVisas(getIndividualVisas());
    setPartnerPayments(getPartnerPayments());
    setPartnerLedger(getPartnerLedger());
    setPartnerAuditLogs(getPartnerAuditLogs());
  };

  useEffect(() => {
    loadData();
  }, [partners]);

  // Network Financial Rollups
  const networkKPIs = useMemo(() => {
    let totalVisas = 0;
    let visasAssigned = 0;
    let visasRemaining = 0;
    let totalCommission = 0;
    let totalOutstanding = 0;
    let totalPaid = 0;

    partners.forEach((p) => {
      const f = computePartnerFinancials(p, visaBatches, individualVisas, candidates, partnerPayments);
      totalVisas += f.totalVisasReceived;
      visasAssigned += f.visasAssigned;
      visasRemaining += f.visasRemaining;
      totalCommission += f.alHeraCommissionEarned;
      totalOutstanding += f.outstandingPayable;
      totalPaid += f.totalPaidToPartner;
    });

    return {
      totalPartners: partners.length,
      totalVisas,
      visasAssigned,
      visasRemaining,
      totalCommission,
      totalOutstanding,
      totalPaid,
    };
  }, [partners, visaBatches, individualVisas, candidates, partnerPayments]);

  // Filtered partners
  const filteredPartners = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return partners;
    return partners.filter((p) => {
      return (
        p.agencyName.toLowerCase().includes(q) ||
        p.contactPerson.toLowerCase().includes(q) ||
        (p.partnerCode && p.partnerCode.toLowerCase().includes(q)) ||
        p.city.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q) ||
        p.phone.includes(q)
      );
    });
  }, [partners, searchQuery]);

  // Selected Partner Object
  const selectedPartner = partners.find((p) => p.id === selectedPartnerId) || null;

  // Handlers
  const openNewPartner = () => {
    setEditingPartner(null);
    setAgencyName('');
    setContactPerson('');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setCity('');
    setState('Rajasthan');
    setCountry('India');
    setCommissionRate(6000);
    setNotes('');
    setIsPartnerFormOpen(true);
  };

  const openEditPartner = (p: PartnerOffice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingPartner(p);
    setAgencyName(p.agencyName);
    setContactPerson(p.contactPerson);
    setPhone(p.phone);
    setWhatsapp(p.whatsapp || p.phone);
    setEmail(p.email || '');
    setCity(p.city);
    setState(p.state);
    setCountry(p.country || 'India');
    setCommissionRate(p.commissionRatePerCandidate || p.defaultCommissionPerCandidate || 6000);
    setNotes(p.notes || '');
    setIsPartnerFormOpen(true);
  };

  const handlePartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const partner: PartnerOffice = {
      id: editingPartner?.id || 'partner-' + Date.now(),
      partnerCode: editingPartner?.partnerCode || `AHT-PTR-${Math.floor(100 + Math.random() * 900)}`,
      agencyName,
      contactPerson,
      phone,
      whatsapp: whatsapp || phone,
      email,
      city,
      state,
      country,
      address: `${city}, ${state}, ${country}`,
      defaultCommissionPerCandidate: Number(commissionRate),
      commissionRatePerCandidate: Number(commissionRate),
      totalCandidatesReferred: editingPartner?.totalCandidatesReferred || 0,
      totalCommissionEarned: editingPartner?.totalCommissionEarned || 0,
      totalCommissionPaid: editingPartner?.totalCommissionPaid || 0,
      status: editingPartner?.status || 'active',
      notes,
      createdAt: editingPartner?.createdAt || new Date().toISOString(),
    };

    onSavePartner(partner);
    setIsPartnerFormOpen(false);
    loadData();
  };

  // Available visas for assignment across selected partner or all
  const availableVisasForAssignment = useMemo(() => {
    if (selectedPartnerId) {
      return individualVisas.filter(
        (v) => v.partnerOfficeId === selectedPartnerId && v.visaStatus === 'Available'
      );
    }
    return individualVisas.filter((v) => v.visaStatus === 'Available');
  }, [individualVisas, selectedPartnerId]);

  // If a partner profile is opened, render PartnerDetailView
  if (selectedPartner) {
    return (
      <PartnerDetailView
        partner={selectedPartner}
        allBatches={visaBatches}
        allVisas={individualVisas}
        allCandidates={candidates}
        allPayments={partnerPayments}
        allLedger={partnerLedger}
        allAuditLogs={partnerAuditLogs}
        onBack={() => setSelectedPartnerId(null)}
        onOpenReceiveBatch={() => setIsReceiveBatchOpen(true)}
        onOpenAssignCandidate={(visa) => {
          setSelectedVisaForAssignment(visa || null);
          setIsAssignCandidateOpen(true);
        }}
        onOpenRecordPayment={(candId) => {
          setSelectedCandidateIdForPayment(candId || '');
          setIsRecordPaymentOpen(true);
        }}
        onOpenFullLedger={() => setIsLedgerModalOpen(true)}
        onSelectCandidateDetail={onSelectCandidateDetail}
        onRefreshData={loadData}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
              B2B Saudi Visa & Candidate Network
            </span>
            <span className="text-xs text-slate-400 font-semibold">• ERP Financial Engine</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#0F1E36] font-display mt-0.5">
            Partner Offices & Saudi Visa Inventory
          </h2>
          <p className="text-xs text-slate-500">
            Partner Office provides Saudi Visas → Al-HERA TRAVELS provides Candidates. Maintain complete accounts, inventory, commissions & ledgers.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="partner-mgmt-fetch-update-btn"
            onClick={() => setIsFetchUpdateModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
            title="Fetch from cloud, edit, or void old payment records"
          >
            <Edit3 className="w-4 h-4 text-amber-700" />
            <span>Fetch & Update Payments</span>
          </button>

          <button
            onClick={() => setIsReceiveBatchOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
          >
            <Ticket className="w-4 h-4" />
            <span>Receive Visa Batch</span>
          </button>

          <button
            onClick={() => {
              setSelectedVisaForAssignment(null);
              setIsAssignCandidateOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
          >
            <UserCheck className="w-4 h-4" />
            <span>Assign Candidate</span>
          </button>

          <button
            onClick={() => setIsRecordPaymentOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-amber-400 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Record Payment</span>
          </button>

          <button
            onClick={openNewPartner}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-300"
          >
            <Plus className="w-4 h-4" />
            <span>Add Partner Office</span>
          </button>
        </div>
      </div>

      {/* Network Overview Financial Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Partners */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Partner Offices
          </span>
          <div className="text-xl font-extrabold text-[#0F1E36] font-mono">
            {networkKPIs.totalPartners}
          </div>
          <span className="text-[10px] text-slate-400 block">Registered agencies</span>
        </div>

        {/* Visas Received */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Visas Received
          </span>
          <div className="text-xl font-extrabold text-amber-700 font-mono">
            {networkKPIs.totalVisas}
          </div>
          <span className="text-[10px] text-slate-400 block">{visaBatches.length} Active batches</span>
        </div>

        {/* Visas Assigned */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Visas Assigned
          </span>
          <div className="text-xl font-extrabold text-blue-700 font-mono">
            {networkKPIs.visasAssigned}
          </div>
          <span className="text-[10px] text-slate-400 block">Candidates placed</span>
        </div>

        {/* Available Visas */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Available Visas
          </span>
          <div className="text-xl font-extrabold text-emerald-700 font-mono">
            {networkKPIs.visasRemaining}
          </div>
          <span className="text-[10px] text-slate-400 block">Ready for candidates</span>
        </div>

        {/* Al-Hera Commission */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Al-Hera Margin
          </span>
          <div className="text-lg font-extrabold text-emerald-700 font-mono truncate">
            ₹{networkKPIs.totalCommission.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-400 block">Total profit earned</span>
        </div>

        {/* Outstanding Payable */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md space-y-1">
          <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
            Outstanding Due
          </span>
          <div className="text-lg font-extrabold text-amber-400 font-mono truncate">
            ₹{networkKPIs.totalOutstanding.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-300 block">Payable to network</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search partner offices by agency name, contact person, city, state, code or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{viewMode === 'grid' ? 'Table View' : 'Card View'}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: GRID / CARD VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map((p) => {
            if (!p) return null;
            const f = computePartnerFinancials(p, visaBatches, individualVisas, candidates, partnerPayments);
            const cleanWa = (p.whatsapp || p.phone || '').replace(/[^0-9]/g, '');

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPartnerId(p.id)}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all p-5 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Top Bar with Code & Status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-400">
                        {p.partnerCode || 'PTR'}
                      </span>
                      <h3 className="text-base font-bold text-[#0F1E36] font-display mt-1 group-hover:text-amber-600 transition-colors">
                        {p.agencyName}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{p.city}, {p.state}</span>
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                      {p.status || 'active'}
                    </span>
                  </div>

                  {/* Financial & Inventory Stats Box */}
                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs text-slate-700 my-3 border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Contact Officer:</span>
                      <strong className="text-slate-900">{p.contactPerson}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Calling Phone:</span>
                      <span className="font-mono text-slate-800">{p.phone}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center">
                      <div className="p-1.5 bg-white rounded-lg border border-slate-200/80">
                        <span className="text-[9px] text-slate-400 block font-bold uppercase">Visas</span>
                        <strong className="text-slate-900 text-xs font-mono">{f.totalVisasReceived}</strong>
                      </div>
                      <div className="p-1.5 bg-white rounded-lg border border-slate-200/80">
                        <span className="text-[9px] text-slate-400 block font-bold uppercase">Assigned</span>
                        <strong className="text-blue-700 text-xs font-mono">{f.visasAssigned}</strong>
                      </div>
                      <div className="p-1.5 bg-white rounded-lg border border-slate-200/80">
                        <span className="text-[9px] text-slate-400 block font-bold uppercase">Available</span>
                        <strong className="text-emerald-700 text-xs font-mono">{f.visasRemaining}</strong>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t text-xs">
                      <span className="text-slate-500 font-medium">Al-Hera Commission:</span>
                      <strong className="text-emerald-700 font-bold">
                        ₹{f.alHeraCommissionEarned.toLocaleString('en-IN')}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center bg-amber-50/80 p-2 rounded-lg border border-amber-200/60">
                      <span className="text-[11px] font-bold text-amber-900">Outstanding Balance:</span>
                      <strong className="text-rose-700 font-bold font-mono">
                        ₹{f.outstandingPayable.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`https://wa.me/${cleanWa}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => openEditPartner(p, e)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                      title="Edit Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete partner ${p.agencyName}?`)) onDeletePartner(p.id);
                      }}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700"
                      title="Delete Partner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedPartnerId(p.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#0F1E36] hover:bg-[#1A3258] text-amber-400 font-bold text-xs flex items-center gap-1"
                    >
                      <span>Profile & Ledger</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredPartners.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-8">
              <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700">No partner offices found.</p>
              <p className="text-xs text-slate-500">Click "Add Partner Office" to register a new partner or clear search filters.</p>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Partner Code & Agency</th>
                <th className="py-3 px-3">Contact & Phone</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3 text-center">Visas Recv.</th>
                <th className="py-3 px-3 text-center">Assigned</th>
                <th className="py-3 px-3 text-center">Available</th>
                <th className="py-3 px-3 text-right">Commission</th>
                <th className="py-3 px-3 text-right">Outstanding</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPartners.map((p) => {
                const f = computePartnerFinancials(p, visaBatches, individualVisas, candidates, partnerPayments);
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPartnerId(p.id)}
                    className="hover:bg-amber-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-amber-700 block">{p.partnerCode || 'PTR'}</span>
                      <strong className="text-slate-900 text-xs">{p.agencyName}</strong>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-slate-900 font-medium block">{p.contactPerson}</span>
                      <span className="text-[11px] font-mono text-slate-500">{p.phone}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{p.city}, {p.state}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">{f.totalVisasReceived}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-blue-700">{f.visasAssigned}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">{f.visasRemaining}</td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-700">
                      ₹{f.alHeraCommissionEarned.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-rose-700">
                      ₹{f.outstandingPayable.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditPartner(p)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedPartnerId(p.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#0F1E36] text-amber-400 font-bold text-[11px]"
                        >
                          Open Profile
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. Receive Visa Batch Modal */}
      <ReceiveVisaBatchModal
        isOpen={isReceiveBatchOpen}
        onClose={() => setIsReceiveBatchOpen(false)}
        partner={null}
        allPartners={partners}
        onBatchAdded={() => {
          loadData();
        }}
      />

      {/* 2. Assign Candidate to Visa Modal */}
      <AssignCandidateToVisaModal
        isOpen={isAssignCandidateOpen}
        onClose={() => {
          setIsAssignCandidateOpen(false);
          setSelectedVisaForAssignment(null);
        }}
        partner={null}
        visa={selectedVisaForAssignment}
        availableVisas={availableVisasForAssignment}
        candidates={candidates}
        onAssigned={() => {
          loadData();
        }}
      />

      {/* 3. Record Partner Payment Modal */}
      <RecordPartnerPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false);
          setSelectedCandidateIdForPayment('');
        }}
        partner={selectedPartnerId ? partners.find((p) => p.id === selectedPartnerId) || null : null}
        allPartners={partners}
        batches={visaBatches}
        visas={individualVisas}
        candidates={candidates}
        initialCandidateId={selectedCandidateIdForPayment}
        onPaymentRecorded={(payment) => {
          loadData();
          const refreshed = getPartners();
          const updated = refreshed.find((p) => p.id === payment.partnerOfficeId);
          if (updated) {
            onSavePartner(updated);
          }
        }}
      />

      {/* 4. Add / Edit Partner Office Modal */}
      {isPartnerFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs animate-fade-in my-8 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-[#0F1E36]">
                  {editingPartner ? 'Edit Partner Office Profile' : 'Register New Partner Office'}
                </h3>
              </div>
              <button onClick={() => setIsPartnerFormOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handlePartnerSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Agency / Partner Office Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al-Madina Consultancy & Overseas Services"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Officer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Haji Rashid Khan"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Calling Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91-9829011223"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    placeholder="+919829011223"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    placeholder="contact@agency.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sikar / Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="Rajasthan / Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Agreed Commission Rate per Candidate (INR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-emerald-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes & Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Additional partnership details or special terms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPartnerFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-amber-400 font-bold shadow-md transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Partner Office</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fetch & Update Payment Modal */}
      <FetchUpdatePaymentModal
        isOpen={isFetchUpdateModalOpen}
        onClose={() => setIsFetchUpdateModalOpen(false)}
        onPaymentUpdated={loadData}
      />
    </div>
  );
};
