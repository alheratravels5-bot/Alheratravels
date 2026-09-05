import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  FileText,
  Clock,
  CheckCircle2,
  Send,
  Download,
  CreditCard,
  Plane,
  Building2,
  ShieldCheck,
  Plus,
  Share2,
  Printer,
  Sparkles,
  Calendar,
  AlertCircle,
  Paperclip,
  Eye,
  Trash2,
  FileCheck,
  Receipt,
  FileSignature,
  Edit3
} from 'lucide-react';
import { Candidate, CandidateStatus, PaymentRecord, AgencyInfo, PartnerOfficePayment, PartnerOffice, POPULAR_SELECTION_CITIES } from '../../types';
import {
  getAgencyInfo,
  getPartnerPayments,
  getPartners,
  getCandidates,
  deleteCandidatePaymentRecord,
  deletePartnerPaymentRecord
} from '../../lib/storage';
import {
  generateSelectionLetterPdf,
  generatePaymentReceiptPdf,
  generateEmploymentContractPdf,
  generateInvoicePdf
} from '../../lib/pdfGenerator';
import { formatCandidateStatusMessage, logSentMessage } from '../../lib/notifications';
import { WakalaCardModal } from './WakalaCardModal';
import { FetchUpdatePaymentModal } from './FetchUpdatePaymentModal';

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCandidate: (updated: Candidate) => Promise<boolean | void> | void;
  agencyInfo?: AgencyInfo;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidate,
  isOpen,
  onClose,
  onUpdateCandidate,
  agencyInfo: propAgency,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'flight' | 'payments' | 'documents'>('timeline');
  const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<CandidateStatus>('medical_fit');
  const [statusNote, setStatusNote] = useState('');
  const [selectionCity, setSelectionCity] = useState(candidate?.selectionCity || '');
  const [isEditCityModalOpen, setIsEditCityModalOpen] = useState(false);
  const [editingCityValue, setEditingCityValue] = useState(candidate?.selectionCity || '');
  const [isWakalaCardOpen, setIsWakalaCardOpen] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);

  // Flight form state
  const [airline, setAirline] = useState(candidate?.flightDetails?.airline || 'Saudi Arabian Airlines');
  const [flightNumber, setFlightNumber] = useState(candidate?.flightDetails?.flightNumber || 'SV-759');
  const [departureDate, setDepartureDate] = useState(candidate?.flightDetails?.departureDate || '2025-10-20');
  const [departureCity, setDepartureCity] = useState(candidate?.flightDetails?.departureCity || 'Mumbai (BOM)');
  const [arrivalCity, setArrivalCity] = useState(candidate?.flightDetails?.arrivalCity || 'Riyadh (RUH)');
  const [pnr, setPnr] = useState(candidate?.flightDetails?.pnr || 'SV9871');

  // Payment record state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(20000);
  const [payMode, setPayMode] = useState<'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque'>('Bank Transfer');
  const [payRef, setPayRef] = useState('');
  const [payRemarks, setPayRemarks] = useState('First Stage Advance / GAMCA Medical & Wakala Processing');

  // State for Fetch & Update Payment modal
  const [isFetchUpdateModalOpen, setIsFetchUpdateModalOpen] = useState(false);
  const [candidatePaymentToEdit, setCandidatePaymentToEdit] = useState<{ candidateId: string; paymentId: string } | null>(null);
  const [partnerPaymentToEdit, setPartnerPaymentToEdit] = useState<string | null>(null);

  // In-app delete confirmation state
  const [deletePaymentConfirm, setDeletePaymentConfirm] = useState<{
    type: 'candidate' | 'partner';
    id: string;
    reference: string;
    amount: number;
  } | null>(null);
  const [isDeletingPayment, setIsDeletingPayment] = useState(false);

  const agency = propAgency || getAgencyInfo();

  useEffect(() => {
    if (candidate) {
      setSelectionCity(candidate.selectionCity || '');
      setEditingCityValue(candidate.selectionCity || '');
    }
  }, [candidate]);

  const handleSaveSelectionCity = (newCity: string) => {
    if (!candidate) return;
    const trimmed = newCity.trim();
    const updated: Candidate = {
      ...candidate,
      selectionCity: trimmed || undefined,
      updatedAt: new Date().toISOString(),
    };
    onUpdateCandidate(updated);
    setSelectionCity(trimmed);
    setEditingCityValue(trimmed);
    setIsEditCityModalOpen(false);
  };

  const handlePaymentUpdatedInCandidateModal = () => {
    if (candidate) {
      const freshCandidates = getCandidates();
      const refreshed = freshCandidates.find((c) => c.id === candidate.id);
      if (refreshed) {
        onUpdateCandidate(refreshed);
      }
    }
  };

  const handleDeleteCandidatePayment = (paymentId: string, receiptNumber: string, amount: number) => {
    if (!candidate) return;
    setDeletePaymentConfirm({
      type: 'candidate',
      id: paymentId,
      reference: receiptNumber,
      amount,
    });
  };

  const handleDeletePartnerPayment = (paymentId: string, voucherNumber: string, amount: number) => {
    if (!candidate) return;
    setDeletePaymentConfirm({
      type: 'partner',
      id: paymentId,
      reference: voucherNumber,
      amount,
    });
  };

  const executeCandidateDetailDelete = async () => {
    if (!deletePaymentConfirm || !candidate) return;
    setIsDeletingPayment(true);
    try {
      if (deletePaymentConfirm.type === 'candidate') {
        const res = deleteCandidatePaymentRecord(candidate.id, deletePaymentConfirm.id, 'Administrator');
        if (res.success) {
          const freshCandidates = getCandidates();
          const refreshed = freshCandidates.find((c) => c.id === candidate.id);
          if (refreshed) {
            onUpdateCandidate(refreshed);
          }
        }
      } else if (deletePaymentConfirm.type === 'partner') {
        const res = deletePartnerPaymentRecord(deletePaymentConfirm.id, 'Administrator');
        if (res.success) {
          const freshCandidates = getCandidates();
          const refreshed = freshCandidates.find((c) => c.id === candidate.id);
          if (refreshed) {
            onUpdateCandidate(refreshed);
          }
        }
      }
    } catch (e) {
      console.error('Exception in candidate payment deletion:', e);
    } finally {
      setIsDeletingPayment(false);
      setDeletePaymentConfirm(null);
    }
  };

  const candidatePartnerPayments = React.useMemo(() => {
    if (!candidate) return [];
    const all = getPartnerPayments();
    return all.filter(
      (p) =>
        (p.relatedCandidateId && (p.relatedCandidateId === candidate.id || p.relatedCandidateId === candidate.trackingId)) ||
        (p.relatedCandidateTrackingId && p.relatedCandidateTrackingId === candidate.trackingId)
    );
  }, [candidate]);

  const totalPaidToPartnerOffice = React.useMemo(() => {
    if (candidate?.partnerOfficePaidAmount !== undefined && candidate.partnerOfficePaidAmount > 0) {
      return candidate.partnerOfficePaidAmount;
    }
    return candidatePartnerPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [candidate?.partnerOfficePaidAmount, candidatePartnerPayments]);

  const partnerOffice = React.useMemo(() => {
    if (!candidate?.partnerOfficeId) return null;
    const allPartners = getPartners();
    return allPartners.find((p) => p.id === candidate.partnerOfficeId) || null;
  }, [candidate?.partnerOfficeId]);

  // Synchronize flight details when candidate changes
  useEffect(() => {
    if (candidate?.flightDetails) {
      setAirline(candidate.flightDetails.airline || 'Saudi Arabian Airlines');
      setFlightNumber(candidate.flightDetails.flightNumber || 'SV-759');
      setDepartureDate(candidate.flightDetails.departureDate || '2025-10-20');
      setDepartureCity(candidate.flightDetails.departureCity || 'Mumbai (BOM)');
      setArrivalCity(candidate.flightDetails.arrivalCity || 'Riyadh (RUH)');
      setPnr(candidate.flightDetails.pnr || 'SV9871');
    }
  }, [candidate]);

  if (!isOpen || !candidate) return null;

  const handleAdvanceStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStatus(true);
    setStatusUpdateError(null);

    try {
      const finalSelectionCity = newStatus === 'interview_selected'
        ? (selectionCity.trim() || candidate.selectionCity || '')
        : (candidate.selectionCity || '');

      const newHistoryItem = {
        id: 'sth-' + Date.now(),
        status: newStatus,
        timestamp: new Date().toISOString(),
        updatedBy: 'Al-Hera Operations Officer',
        notes: statusNote || (newStatus === 'interview_selected' && finalSelectionCity
          ? `Candidate interviewed & selected for ${candidate.trade || 'employment'} in ${finalSelectionCity}.`
          : `Status transitioned to ${(newStatus || '').replace(/_/g, ' ')}`),
        selectionCity: newStatus === 'interview_selected' ? (finalSelectionCity || undefined) : undefined,
      };

      let contractFields = {};
      if ((newStatus === 'wakala_issued' || newStatus === 'visa_stamped') && !candidate.contractNumber) {
        contractFields = {
          contractNumber: `KSA-CNT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          contractDate: new Date().toISOString().split('T')[0],
        };
      }

      const updated: Candidate = {
        ...candidate,
        ...contractFields,
        status: newStatus,
        selectionCity: finalSelectionCity || undefined,
        statusHistory: [newHistoryItem, ...(candidate.statusHistory || [])],
        updatedAt: new Date().toISOString(),
      };

      const result = await onUpdateCandidate(updated);
      if (result === false) {
        setStatusUpdateError('Failed to save status to central Supabase database. Please retry.');
        setIsSavingStatus(false);
        return;
      }

      setIsStatusUpdateOpen(false);
      setStatusNote('');

      // Send WhatsApp notification
      const msg = formatCandidateStatusMessage(updated, agency);
      logSentMessage(
        updated.fullName,
        updated.whatsappNumber,
        'whatsapp',
        msg,
        `Status Update (${newStatus})`,
        updated.trackingId
      );

      // If status is visa or wakala, generate the contract PDF
      if (newStatus === 'wakala_issued' || newStatus === 'visa_stamped') {
        setTimeout(() => {
          if (confirm(`Saudi ${newStatus === 'visa_stamped' ? 'Visa' : 'Wakala'} has been issued! Would you like to generate and download the Overseas Employment Contract PDF now?`)) {
            generateEmploymentContractPdf(updated, agency);
          }
        }, 300);
      }
    } catch (err: any) {
      console.error('Error updating candidate status:', err);
      setStatusUpdateError(err?.message || 'Error updating candidate status in Supabase');
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleSaveFlight = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Candidate = {
      ...candidate,
      flightDetails: {
        airline,
        flightNumber,
        departureDate,
        departureCity,
        arrivalCity,
        pnr,
        ticketNumber: `TKT-2025-${Math.floor(1000 + Math.random() * 9000)}`,
      },
      status: candidate.status === 'deployed' ? 'deployed' : 'ticket_booked',
      updatedAt: new Date().toISOString(),
    };
    onUpdateCandidate(updated);
    alert('Flight ticket details recorded successfully!');
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const receiptNumber = `AHT-REC-2025-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPayment: PaymentRecord = {
      id: 'pay-' + Date.now(),
      receiptNumber,
      candidateId: candidate.id,
      amount: Number(payAmount),
      date: new Date().toISOString().split('T')[0],
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: payMode,
      paymentMode: payMode,
      transactionReference: payRef || `TXN-${Date.now().toString().slice(-6)}`,
      note: payRemarks,
      receivedBy: 'Accounts Desk',
    };

    const newTotalPaid = candidate.totalPaid + Number(payAmount);
    const newBalance = Math.max(0, candidate.packageFee - newTotalPaid);

    const updated: Candidate = {
      ...candidate,
      totalPaid: newTotalPaid,
      balanceDue: newBalance,
      paymentHistory: [newPayment, ...(candidate.paymentHistory || [])],
      updatedAt: new Date().toISOString(),
    };

    onUpdateCandidate(updated);
    setIsPaymentModalOpen(false);

    // Prompt to generate instant PDF invoice & receipt
    generatePaymentReceiptPdf(newPayment, updated, agency);
  };

  const handleSendWhatsAppNotification = () => {
    const msg = formatCandidateStatusMessage(candidate, agency);
    const phone = (candidate.whatsappNumber || candidate.phoneNumber || '').replace(/[^0-9]/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    logSentMessage(
      candidate.fullName,
      candidate.whatsappNumber || candidate.phoneNumber || '',
      'whatsapp',
      msg,
      'Manual WhatsApp Status Alert',
      candidate.trackingId
    );
  };

  const handleGenerateContract = () => {
    generateEmploymentContractPdf(candidate, agency);
  };

  const handleGenerateFullInvoice = () => {
    generateInvoicePdf(candidate, agency);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-8 overflow-hidden animate-fade-in text-slate-900">
        {/* Header */}
        <div className="bg-[#0F1E36] p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400/50 overflow-hidden shrink-0 flex items-center justify-center text-amber-300 font-bold text-2xl">
              {candidate.photoUrl ? (
                <img
                  src={candidate.photoUrl}
                  alt={candidate.fullName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-8 h-8" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-bold font-display text-white">{candidate.fullName}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-500 text-slate-950">
                  {(candidate.status || 'applied').replace(/_/g, ' ')}
                </span>
                {candidate.selectionCity && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/40">
                    <MapPin className="w-3 h-3 text-indigo-300" />
                    <span>Selected at: {candidate.selectionCity}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>Tracking ID: <strong className="text-amber-400 font-mono">{candidate.trackingId}</strong></span>
                <span>•</span>
                <span>Passport: <strong className="text-white font-mono">{candidate.passportNumber}</strong></span>
                <span>•</span>
                <span>DOB: <strong className="text-amber-300">{candidate.dateOfBirth || 'N/A'}</strong></span>
                <span>•</span>
                <span>Trade: <strong className="text-amber-300">{candidate.trade}</strong></span>
                {candidate.selectionCity && (
                  <>
                    <span>•</span>
                    <span>Selection City: <strong className="text-indigo-300">{candidate.selectionCity}</strong></span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsStatusUpdateOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Update Status</span>
            </button>

            <button
              onClick={handleSendWhatsAppNotification}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>Send WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Bar with PDF & Document Triggers */}
        <div className="bg-slate-100 p-3 px-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleGenerateContract}
              className="px-3 py-1.5 rounded-lg bg-[#0F1E36] hover:bg-[#1A3258] text-amber-300 font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <FileSignature className="w-3.5 h-3.5" />
              <span>Employment Contract (PDF)</span>
            </button>

            <button
              onClick={handleGenerateFullInvoice}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-300 flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tax Invoice (PDF)</span>
            </button>

            <button
              onClick={() => generateSelectionLetterPdf(candidate, agency)}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-300 flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>Selection Dossier</span>
            </button>

            <button
              onClick={() => {
                setEditingCityValue(candidate.selectionCity || '');
                setIsEditCityModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-indigo-900 font-bold border border-indigo-200 flex items-center gap-1.5 shadow-sm transition-all"
              title="Edit Selection City"
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span>{candidate.selectionCity ? `City: ${candidate.selectionCity}` : 'Set Selection City'}</span>
              <Edit3 className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            <button
              onClick={() => setIsWakalaCardOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-300 flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-amber-600" />
              <span>Print Wakala Card</span>
            </button>
          </div>

          {/* Financial summary pill */}
          <div className="flex items-center gap-3 text-xs">
            <span>Package: <strong>₹{(Number(candidate.packageFee) || 0).toLocaleString('en-IN')}</strong></span>
            <span>Paid: <strong className="text-emerald-700">₹{(Number(candidate.totalPaid) || 0).toLocaleString('en-IN')}</strong></span>
            <span>Balance: <strong className="text-rose-700">₹{(Number(candidate.balanceDue) || 0).toLocaleString('en-IN')}</strong></span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white text-xs font-bold">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === 'timeline'
                ? 'border-amber-500 text-amber-900 bg-amber-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Status Stepper & Timeline ({candidate.statusHistory?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === 'documents'
                ? 'border-amber-500 text-amber-900 bg-amber-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Documents & Contract ({candidate.documents?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('flight')}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === 'flight'
                ? 'border-amber-500 text-amber-900 bg-amber-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Flight & Departure Ticket
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === 'payments'
                ? 'border-amber-500 text-amber-900 bg-amber-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Payments & Invoices ({candidate.paymentHistory?.length || 0})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* TAB 1: Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 font-display">
                  Official Status Transition History
                </h4>
                <button
                  onClick={() => setIsStatusUpdateOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Advance Status</span>
                </button>
              </div>

              <div className="space-y-3">
                {(candidate.statusHistory || []).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full font-bold uppercase bg-[#0F1E36] text-amber-400 text-[10px]">
                          {(item.status || 'applied').replace(/_/g, ' ')}
                        </span>
                        <span className="font-semibold text-slate-700">by {item.updatedBy}</span>
                      </div>
                      <p className="text-slate-800 text-xs mt-1">{item.notes}</p>
                      {item.selectionCity && (
                        <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-900 text-[10px] font-bold">
                          <MapPin className="w-3 h-3 text-indigo-600" />
                          <span>Venue / Selection City: {item.selectionCity}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right text-slate-500 text-[11px] shrink-0 font-mono">
                      {new Date(item.timestamp).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Documents & Contract */}
          {activeTab === 'documents' && (
            <div className="space-y-6 text-xs">
              {/* Contract Card Banner */}
              <div className="p-4 rounded-2xl bg-[#0F1E36] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Overseas Employment Labor Contract (KSA)
                  </span>
                  <h4 className="text-base font-bold font-display text-white">
                    Official Bilateral Employment Contract
                  </h4>
                  <p className="text-xs text-slate-300">
                    Contract #{candidate.contractNumber || `KSA-CNT-${new Date().getFullYear()}-${candidate.passportNumber}`} • Sponsor: {candidate.sponsorName || 'Saudi Principal Company'}
                  </p>
                </div>
                <button
                  onClick={handleGenerateContract}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shrink-0"
                >
                  <FileSignature className="w-4 h-4" />
                  <span>Generate & Download Contract PDF</span>
                </button>
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 font-display">
                    Attached Verification Documents ({candidate.documents?.length || 0})
                  </h4>
                </div>

                {candidate.documents && candidate.documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {candidate.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                            <FileCheck className="w-5 h-5" />
                          </div>
                          <div className="overflow-hidden">
                            <span className="font-bold text-slate-900 block truncate text-xs">
                              {doc.name}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                              {doc.type} • {doc.size || 'Attached File'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const w = window.open();
                              if (w) {
                                w.document.write(`<iframe src="${doc.fileUrl}" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1"
                            title="Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500">
                    <Paperclip className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="font-semibold text-xs">No documents attached to this candidate yet.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Edit candidate record to upload Passport copy, GAMCA Medical or CV.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Flight */}
          {activeTab === 'flight' && (
            <form onSubmit={handleSaveFlight} className="space-y-4 text-xs">
              <h4 className="font-bold text-sm text-slate-900 font-display">
                Flight Ticket & Deployment Logistics
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Airline Carrier</label>
                  <input
                    type="text"
                    value={airline}
                    onChange={(e) => setAirline(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Flight Number</label>
                  <input
                    type="text"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Airline PNR Reference</label>
                  <input
                    type="text"
                    value={pnr}
                    onChange={(e) => setPnr(e.target.value)}
                    className="w-full font-mono border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Departure Date & Time</label>
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Departure Airport</label>
                  <input
                    type="text"
                    value={departureCity}
                    onChange={(e) => setDepartureCity(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Arrival Destination (Saudi)</label>
                  <input
                    type="text"
                    value={arrivalCity}
                    onChange={(e) => setArrivalCity(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="py-2.5 px-5 bg-[#0F1E36] hover:bg-[#1A3258] text-white font-bold rounded-xl shadow flex items-center gap-2"
              >
                <Plane className="w-4 h-4 text-amber-400" />
                <span>Save Flight Particulars</span>
              </button>
            </form>
          )}

          {/* TAB 4: Payments & Invoices */}
          {activeTab === 'payments' && (
            <div className="space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h4 className="font-bold text-sm text-slate-900 font-display">
                  Candidate Payment Ledger & Invoices
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateFullInvoice}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Print Tax Invoice (PDF)</span>
                  </button>
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Collect Payment & Issue Receipt</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900 text-white">
                <div>
                  <span className="text-slate-400 text-[10px] block">Total Agreed Package</span>
                  <strong className="text-base font-bold font-display text-white">
                    ₹{(Number(candidate.packageFee) || 0).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Total Amount Received</span>
                  <strong className="text-base font-bold font-display text-emerald-400">
                    ₹{(Number(candidate.totalPaid) || 0).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Outstanding Balance</span>
                  <strong className="text-base font-bold font-display text-rose-400">
                    ₹{(Number(candidate.balanceDue) || 0).toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {/* Transactions List */}
              <div className="space-y-2">
                {candidate.paymentHistory && candidate.paymentHistory.length > 0 ? (
                  candidate.paymentHistory.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="font-bold text-slate-900">₹{(Number(p.amount) || 0).toLocaleString('en-IN')}</strong>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold">
                            {p.paymentMode}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">Ref: {p.transactionReference}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">{p.remarks || p.note}</p>
                      </div>

                      <div className="text-right flex items-center gap-2">
                        <div className="text-right mr-1">
                          <span className="text-[10px] text-slate-500 font-mono block">{p.paymentDate || p.date}</span>
                          <span className="text-[10px] text-emerald-700 font-bold block">{p.receiptNumber}</span>
                        </div>
                        <button
                          id={`edit-candidate-receipt-btn-${p.id}`}
                          onClick={() => {
                            setCandidatePaymentToEdit({ candidateId: candidate.id, paymentId: p.id });
                            setPartnerPaymentToEdit(null);
                            setIsFetchUpdateModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold flex items-center gap-1 shadow-xs transition-transform active:scale-95"
                          title="Edit payment details"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          id={`delete-candidate-receipt-btn-${p.id}`}
                          onClick={() =>
                            handleDeleteCandidatePayment(
                              p.id,
                              p.receiptNumber || 'Receipt',
                              Number(p.amount) || 0
                            )
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 text-[11px] font-bold flex items-center gap-1 shadow-xs transition-transform active:scale-95"
                          title="Delete payment receipt and recalculate balance"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>Delete</span>
                        </button>
                        <button
                          onClick={() => generatePaymentReceiptPdf(p, candidate, agency)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-[11px] font-bold flex items-center gap-1 shadow-xs"
                          title="Print Receipt"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-700" />
                          <span>Receipt PDF</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic p-4 text-center">No payment transactions recorded yet.</p>
                )}
              </div>

              {/* Partner Office Remittance Section */}
              <div className="mt-5 pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                      Partner Office Remittances (Visa Cost Paid)
                    </h5>
                  </div>
                  <span className="text-[11px] font-mono font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Total Paid to Partner: ₹{totalPaidToPartnerOffice.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Assigned Partner Office</span>
                    <strong className="text-slate-900 font-semibold">
                      {partnerOffice ? partnerOffice.agencyName : (candidate.partnerOfficeId || 'Assigned Partner')}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Vouchers Recorded</span>
                    <span className="font-mono font-bold text-slate-800">
                      {candidatePartnerPayments.length} payment {candidatePartnerPayments.length === 1 ? 'record' : 'records'}
                    </span>
                  </div>
                </div>

                {candidatePartnerPayments.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-slate-900 text-white text-[10px] font-bold uppercase">
                        <tr>
                          <th className="py-2 px-3">Voucher #</th>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Mode</th>
                          <th className="py-2 px-3">UTR / Ref</th>
                          <th className="py-2 px-3">Remarks</th>
                          <th className="py-2 px-3 text-right">Amount (₹)</th>
                          <th className="py-2 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {candidatePartnerPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                            <td className="py-2 px-3 text-slate-600">{p.paymentDate}</td>
                            <td className="py-2 px-3 text-slate-700">{p.paymentMethod}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{p.referenceNumber || '-'}</td>
                            <td className="py-2 px-3 text-slate-500 truncate max-w-[140px]">{p.notes || '-'}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                              ₹{p.amount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-3 text-right whitespace-nowrap">
                              <button
                                id={`edit-partner-voucher-btn-${p.id}`}
                                onClick={() => {
                                  setCandidatePaymentToEdit(null);
                                  setPartnerPaymentToEdit(p.id);
                                  setIsFetchUpdateModalOpen(true);
                                }}
                                className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold inline-flex items-center gap-1 shadow-xs transition-transform active:scale-95 mr-1"
                                title="Edit voucher details"
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                id={`delete-partner-voucher-btn-${p.id}`}
                                onClick={() =>
                                  handleDeletePartnerPayment(
                                    p.id,
                                    p.paymentNumber || 'Voucher',
                                    Number(p.amount) || 0
                                  )
                                }
                                className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 text-[10px] font-bold inline-flex items-center gap-1 shadow-xs transition-transform active:scale-95"
                                title="Delete voucher and update partner ledger"
                              >
                                <Trash2 className="w-2.5 h-2.5 text-rose-600" />
                                <span>Delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs italic bg-white p-3 rounded-xl border border-slate-200 text-center">
                    No partner office remittances recorded for this candidate yet.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal for Advancing Status */}
        {isStatusUpdateOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-[#0F1E36]">Advance Candidate Status</h4>
                <button onClick={() => setIsStatusUpdateOpen(false)}>
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleAdvanceStatus} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select New Status Stage</label>
                  <select
                    value={newStatus}
                    onChange={(e) => {
                      const st = e.target.value as CandidateStatus;
                      setNewStatus(st);
                      if (st === 'interview_selected' && !selectionCity) {
                        setSelectionCity(candidate.selectionCity || 'Mumbai');
                      }
                    }}
                    className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="interview_scheduled">2. Trade Test / Interview Scheduled</option>
                    <option value="interview_selected">3. Client Interview Selected</option>
                    <option value="medical_in_progress">4. GAMCA Medical In Progress</option>
                    <option value="medical_fit">5. GAMCA Medical Fit</option>
                    <option value="wakala_issued">6. Saudi Wakala Allotted</option>
                    <option value="visa_stamped">7. Saudi Embassy Visa Stamped</option>
                    <option value="emigration_cleared">8. Emigration / Protector Cleared</option>
                    <option value="ticket_booked">9. Flight Ticket Booked</option>
                    <option value="deployed">10. Deployed in Saudi Arabia</option>
                  </select>
                </div>

                {/* Selection City Input - Automatically displayed when Selected */}
                {newStatus === 'interview_selected' && (
                  <div className="p-3 bg-indigo-50/90 border-2 border-indigo-300 rounded-xl space-y-2 animate-fade-in shadow-xs">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Selection City *</span>
                      </label>
                      <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-100 px-2 py-0.5 rounded">
                        Interview & Trade Venue
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        list="selection-cities-advance-modal"
                        placeholder="Select or enter city (e.g. Mumbai, New Delhi, Lucknow, Patna...)"
                        value={selectionCity}
                        onChange={(e) => setSelectionCity(e.target.value)}
                        className="w-full text-xs font-bold border border-indigo-300 bg-white rounded-lg p-2.5 pl-8 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 shadow-xs"
                        required
                      />
                      <MapPin className="w-4 h-4 text-indigo-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <datalist id="selection-cities-advance-modal">
                        {POPULAR_SELECTION_CITIES.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>
                    {/* Quick Pick Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-slate-500 font-medium">Quick Pick:</span>
                      {['Mumbai', 'New Delhi', 'Lucknow', 'Patna', 'Hyderabad', 'Kolkata'].map((cityOption) => (
                        <button
                          key={cityOption}
                          type="button"
                          onClick={() => setSelectionCity(cityOption)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                            selectionCity.toLowerCase() === cityOption.toLowerCase()
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
                  <label className="block font-bold text-slate-700 mb-1">Officer Progress Note</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. GAMCA Medical Fit certificate received from City Diagnostic Center. Passport forwarded for Wakala allocation."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  ></textarea>
                </div>

                {statusUpdateError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                    {statusUpdateError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSavingStatus}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSavingStatus ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Saving to Supabase Database...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Update & Save to Supabase</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Editing Selection City Directly */}
        {isEditCityModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-fade-in text-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-[#0F1E36]">Edit Selection City</h4>
                    <p className="text-[11px] text-slate-500">Update candidate interview & selection location</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditCityModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Selection City / Interview Hub Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list="selection-cities-edit-modal-list"
                      placeholder="Select or enter city (e.g. Mumbai, New Delhi, Lucknow...)"
                      value={editingCityValue}
                      onChange={(e) => setEditingCityValue(e.target.value)}
                      className="w-full text-xs font-bold border border-indigo-300 rounded-lg p-2.5 pl-8 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-xs"
                      autoFocus
                    />
                    <MapPin className="w-4 h-4 text-indigo-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <datalist id="selection-cities-edit-modal-list">
                      {POPULAR_SELECTION_CITIES.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-500 font-medium">Quick Pick:</span>
                  {['Mumbai', 'New Delhi', 'Lucknow', 'Patna', 'Hyderabad', 'Kolkata'].map((cityOption) => (
                    <button
                      key={cityOption}
                      type="button"
                      onClick={() => setEditingCityValue(cityOption)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                        editingCityValue.toLowerCase() === cityOption.toLowerCase()
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300'
                      }`}
                    >
                      {cityOption}
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed">
                  <p className="font-semibold text-slate-800 mb-0.5">Zero Data Loss Guarantee:</p>
                  Saving this city directly updates candidate dossiers, live tracking, and official PDF documents while strictly preserving all existing payments, documents, and historical notes.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditCityModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveSelectionCity(editingCityValue)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Selection City</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Recording Payment */}
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-[#0F1E36]">Record Payment & Issue Receipt</h4>
                <button onClick={() => setIsPaymentModalOpen(false)}>
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Amount Received (INR) *</label>
                  <input
                    type="number"
                    min={100}
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full text-sm font-bold border border-slate-300 rounded-lg p-2.5 text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  >
                    <option value="Cash">Cash at Office</option>
                    <option value="Bank Transfer">Bank NEFT / RTGS</option>
                    <option value="UPI">UPI / Google Pay / PhonePe</option>
                    <option value="Cheque">Cheque / Demand Draft</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transaction Ref / UTR</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR198471928"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full font-mono border border-slate-300 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Receipt Remarks</label>
                  <input
                    type="text"
                    value={payRemarks}
                    onChange={(e) => setPayRemarks(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Save & Print PDF Receipt</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletePaymentConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-slate-900 text-base">
                    {deletePaymentConfirm.type === 'candidate' ? 'Delete Payment Receipt?' : 'Delete Remittance Voucher?'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Are you sure you want to delete {deletePaymentConfirm.reference}? Balances will be recalculated immediately.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ref:</span>
                  <span className="font-mono font-bold text-slate-800">{deletePaymentConfirm.reference}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-700 font-bold">Amount:</span>
                  <span className="font-mono font-black text-rose-700">₹{deletePaymentConfirm.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={isDeletingPayment}
                  onClick={() => setDeletePaymentConfirm(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingPayment}
                  onClick={executeCandidateDetailDelete}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingPayment ? 'Deleting...' : 'Delete'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wakala Card Modal */}
        <WakalaCardModal
          candidate={candidate}
          isOpen={isWakalaCardOpen}
          onClose={() => setIsWakalaCardOpen(false)}
          agencyInfo={agency}
        />

        {/* Fetch & Update Payment Modal */}
        <FetchUpdatePaymentModal
          isOpen={isFetchUpdateModalOpen}
          onClose={() => {
            setIsFetchUpdateModalOpen(false);
            setCandidatePaymentToEdit(null);
            setPartnerPaymentToEdit(null);
          }}
          initialCandidatePayment={candidatePaymentToEdit || undefined}
          initialPartnerPaymentId={partnerPaymentToEdit || undefined}
          onPaymentUpdated={handlePaymentUpdatedInCandidateModal}
        />
      </div>
    </div>
  );
};
