import React, { useState } from 'react';
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
  FileSignature
} from 'lucide-react';
import { Candidate, CandidateStatus, PaymentRecord, AgencyInfo } from '../../types';
import { getAgencyInfo } from '../../lib/storage';
import {
  generateSelectionLetterPdf,
  generatePaymentReceiptPdf,
  generateEmploymentContractPdf,
  generateInvoicePdf
} from '../../lib/pdfGenerator';
import { formatCandidateStatusMessage, logSentMessage } from '../../lib/notifications';
import { WakalaCardModal } from './WakalaCardModal';

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCandidate: (updated: Candidate) => void;
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
  const [isWakalaCardOpen, setIsWakalaCardOpen] = useState(false);

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

  if (!isOpen || !candidate) return null;

  const agency = propAgency || getAgencyInfo();

  const handleAdvanceStatus = (e: React.FormEvent) => {
    e.preventDefault();

    const newHistoryItem = {
      id: 'sth-' + Date.now(),
      status: newStatus,
      timestamp: new Date().toISOString(),
      updatedBy: 'Al-Hera Operations Officer',
      notes: statusNote || `Status transitioned to ${(newStatus || '').replace(/_/g, ' ')}`,
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
      statusHistory: [newHistoryItem, ...(candidate.statusHistory || [])],
      updatedAt: new Date().toISOString(),
    };

    onUpdateCandidate(updated);
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
              </div>
              <p className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>Tracking ID: <strong className="text-amber-400 font-mono">{candidate.trackingId}</strong></span>
                <span>•</span>
                <span>Passport: <strong className="text-white font-mono">{candidate.passportNumber}</strong></span>
                <span>•</span>
                <span>DOB: <strong className="text-amber-300">{candidate.dateOfBirth || 'N/A'}</strong></span>
                <span>•</span>
                <span>Trade: <strong className="text-amber-300">{candidate.trade}</strong></span>
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
                          onClick={() => generatePaymentReceiptPdf(p, candidate, agency)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold flex items-center gap-1 shadow-sm"
                          title="Print Receipt"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-700" />
                          <span>Receipt PDF</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic p-4 text-center">No payment transactions recorded yet.</p>
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
                    onChange={(e) => setNewStatus(e.target.value as CandidateStatus)}
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

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Update & Notify Candidate</span>
                </button>
              </form>
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

        {/* Wakala Card Modal */}
        <WakalaCardModal
          candidate={candidate}
          isOpen={isWakalaCardOpen}
          onClose={() => setIsWakalaCardOpen(false)}
          agencyInfo={agency}
        />
      </div>
    </div>
  );
};
