import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  CreditCard,
  DollarSign,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  Printer,
  ArrowRight,
  User,
  RefreshCw,
  Plus,
  Check,
  Wallet,
  Building2,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import { Candidate, PaymentRecord, AgencyInfo } from '../../types';
import {
  recordDirectCandidatePayment,
  updateCandidatePaymentRecord,
  deleteCandidatePaymentRecord,
  getCandidates,
  getAgencyInfo
} from '../../lib/storage';
import { generatePaymentReceiptPdf, generateInvoicePdf } from '../../lib/pdfGenerator';

interface DirectCandidatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
  preselectedCandidateId?: string;
  onPaymentRecorded?: () => void;
  agencyInfo?: AgencyInfo;
}

export const DirectCandidatePaymentModal: React.FC<DirectCandidatePaymentModalProps> = ({
  isOpen,
  onClose,
  candidates,
  preselectedCandidateId,
  onPaymentRecorded,
  agencyInfo: propAgency,
}) => {
  const agency = propAgency || getAgencyInfo();

  // Selected candidate state
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(preselectedCandidateId || '');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Payment Form Fields
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [receiptNumber, setReceiptNumber] = useState<string>(() => `AHT-DIR-${Math.floor(100000 + Math.random() * 900000)}`);
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('Direct counter payment');
  const [receivedBy, setReceivedBy] = useState<string>('Accounts Desk');

  // Inline edit state for history
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editDate, setEditDate] = useState<string>('');
  const [editMethod, setEditMethod] = useState<string>('Cash');
  const [editRef, setEditRef] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // Delete confirmation state
  const [deleteConfirmPayment, setDeleteConfirmPayment] = useState<PaymentRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync when preselectedCandidateId changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (preselectedCandidateId) {
        setSelectedCandidateId(preselectedCandidateId);
      } else if (candidates.length > 0 && !selectedCandidateId) {
        setSelectedCandidateId(candidates[0].id);
      }
      setReceiptNumber(`AHT-DIR-${Math.floor(100000 + Math.random() * 900000)}`);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setFeedback(null);
    }
  }, [isOpen, preselectedCandidateId, candidates]);

  // Find currently selected candidate
  const currentCandidate = useMemo(() => {
    return candidates.find((c) => c.id === selectedCandidateId) || null;
  }, [candidates, selectedCandidateId]);

  // Filtered candidate list for search
  const filteredCandidates = useMemo(() => {
    const q = candidateSearch.trim().toLowerCase();
    if (!q) return candidates.slice(0, 15);
    return candidates.filter(
      (c) =>
        (c.fullName && c.fullName.toLowerCase().includes(q)) ||
        (c.trackingId && c.trackingId.toLowerCase().includes(q)) ||
        (c.passportNumber && c.passportNumber.toLowerCase().includes(q)) ||
        (c.phoneNumber && c.phoneNumber.includes(q))
    ).slice(0, 20);
  }, [candidates, candidateSearch]);

  if (!isOpen) return null;

  const handleRegenerateReceiptNo = () => {
    setReceiptNumber(`AHT-DIR-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleSelectCandidate = (cand: Candidate) => {
    setSelectedCandidateId(cand.id);
    setIsDropdownOpen(false);
    setCandidateSearch('');
    setFeedback(null);
  };

  // Submit payment
  const handleRecordPayment = (shouldPrintPdf: boolean) => {
    if (!currentCandidate) {
      setFeedback({ type: 'error', message: 'Please select a candidate to record payment.' });
      return;
    }

    const payVal = Number(amount);
    if (!payVal || payVal <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid payment amount greater than ₹0.' });
      return;
    }

    if (!receiptNumber.trim()) {
      setFeedback({ type: 'error', message: 'Please enter or generate a receipt number.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = recordDirectCandidatePayment(
        currentCandidate.id,
        {
          amount: payVal,
          date: paymentDate,
          paymentDate: paymentDate,
          paymentMethod,
          paymentMode: paymentMethod,
          receiptNumber: receiptNumber.trim(),
          transactionReference: transactionReference.trim() || `DIR-${paymentMethod.toUpperCase()}-${Date.now().toString().slice(-4)}`,
          note: notes.trim(),
          remarks: notes.trim(),
          receivedBy: receivedBy.trim() || 'Accounts Desk',
          isDirectPayment: true,
        },
        receivedBy || 'Accounts Desk'
      );

      if (res.success && res.payment && res.candidate) {
        setFeedback({
          type: 'success',
          message: res.message,
        });

        // Reset form for next entry
        setAmount('');
        setTransactionReference('');
        setReceiptNumber(`AHT-DIR-${Math.floor(100000 + Math.random() * 900000)}`);

        if (onPaymentRecorded) {
          onPaymentRecorded();
        }

        if (shouldPrintPdf) {
          generatePaymentReceiptPdf(res.payment, res.candidate, agency);
        }
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Failed to record direct payment.',
        });
      }
    } catch (err: any) {
      console.error('Error recording direct candidate payment:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'Unexpected failure while processing direct payment.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start inline editing of history payment
  const handleStartEdit = (p: PaymentRecord) => {
    setEditingPaymentId(p.id);
    setEditAmount(Number(p.amount) || 0);
    setEditDate(p.date || p.paymentDate || new Date().toISOString().split('T')[0]);
    setEditMethod(p.paymentMethod || p.paymentMode || 'Cash');
    setEditRef(p.transactionReference || '');
    setEditNotes(p.note || p.remarks || '');
  };

  // Save inline edit
  const handleSaveEdit = (paymentId: string) => {
    if (!currentCandidate) return;
    if (editAmount <= 0) {
      setFeedback({ type: 'error', message: 'Edited amount must be greater than ₹0.' });
      return;
    }

    try {
      const res = updateCandidatePaymentRecord(
        currentCandidate.id,
        paymentId,
        {
          amount: editAmount,
          date: editDate,
          paymentDate: editDate,
          paymentMethod: editMethod,
          paymentMode: editMethod,
          transactionReference: editRef,
          note: editNotes,
          remarks: editNotes,
        },
        'Accounts Desk'
      );

      if (res.success) {
        setEditingPaymentId(null);
        setFeedback({
          type: 'success',
          message: `Payment updated. Recalculated balance: ₹${res.candidate?.balanceDue.toLocaleString('en-IN')}`,
        });
        if (onPaymentRecorded) {
          onPaymentRecorded();
        }
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update payment record.' });
    }
  };

  // Delete payment
  const handleConfirmDelete = () => {
    if (!currentCandidate || !deleteConfirmPayment) return;

    try {
      const res = deleteCandidatePaymentRecord(currentCandidate.id, deleteConfirmPayment.id, 'Accounts Desk');
      if (res.success) {
        setDeleteConfirmPayment(null);
        setFeedback({
          type: 'success',
          message: `Payment receipt deleted. Recalculated balance: ₹${res.candidate?.balanceDue.toLocaleString('en-IN')}`,
        });
        if (onPaymentRecorded) {
          onPaymentRecorded();
        }
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to delete payment.' });
    }
  };

  return (
    <div
      id="direct-candidate-payment-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in overflow-y-auto"
    >
      <div
        id="direct-candidate-payment-modal-dialog"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150 my-auto"
      >
        {/* Header */}
        <div className="bg-[#0F1E36] text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <span>Direct Candidate Payment</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Direct Ledger
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Record counter, direct bank, or UPI collections directly from candidates with instant PDF receipts.
              </p>
            </div>
          </div>
          <button
            id="close-direct-payment-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium flex items-start gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">{feedback.message}</div>
              <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Section 1: Candidate Selection & Overview */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-500" />
                <span>Select Candidate (Search by Name, Tracking ID, or Passport):</span>
              </label>
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="candidate-search-autocomplete-input"
                  type="text"
                  placeholder="Search candidate or passport..."
                  value={candidateSearch}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setCandidateSearch(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                />
                {isDropdownOpen && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {filteredCandidates.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCandidate(c)}
                        className={`w-full text-left p-2.5 hover:bg-amber-50 transition-colors flex items-center justify-between text-xs ${
                          c.id === selectedCandidateId ? 'bg-amber-50/70 font-bold' : ''
                        }`}
                      >
                        <div>
                          <div className="text-slate-900 font-semibold">{c.fullName}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2">
                            <span>ID: {c.trackingId}</span>
                            <span>•</span>
                            <span className="font-mono text-amber-800">Passport: {c.passportNumber || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">{c.trade}</span>
                          <span className="text-[11px] font-bold text-rose-600">
                            Due: ₹{(Number(c.balanceDue) || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </button>
                    ))}
                    {filteredCandidates.length === 0 && (
                      <div className="p-3 text-center text-xs text-slate-400">No candidates match your search</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Candidate Detailed Pill */}
            {currentCandidate ? (
              <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
                <div className="lg:col-span-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Candidate Identity</span>
                  <div className="font-black text-slate-900 text-sm">{currentCandidate.fullName}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                      ID: {currentCandidate.trackingId}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200">
                      Passport: {currentCandidate.passportNumber || 'N/A'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Package</span>
                  <div className="font-bold text-slate-800 text-xs">
                    ₹{(Number(currentCandidate.packageFee) || 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-500">{currentCandidate.trade || 'Visa Processing'}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Paid to Date</span>
                  <div className="font-bold text-emerald-700 text-xs">
                    ₹{(Number(currentCandidate.totalPaid) || 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-emerald-600">{currentCandidate.paymentHistory?.length || 0} receipt(s)</span>
                </div>

                <div className="bg-rose-50/60 p-2 rounded-md border border-rose-100">
                  <span className="text-[10px] font-bold uppercase text-rose-700 block">Balance Due</span>
                  <div className="font-black text-rose-700 text-sm">
                    ₹{(Number(currentCandidate.balanceDue) || 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-rose-600 font-medium">Pending collection</span>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 bg-white rounded-lg border border-dashed border-slate-300">
                Please search or pick a candidate above to record their direct payment.
              </div>
            )}
          </div>

          {/* Section 2: Payment Entry Form */}
          {currentCandidate && (
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#0F1E36] flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Payment Details to Record</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Receipt / Reference Number */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Receipt / Voucher Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="direct-payment-receipt-no"
                      type="text"
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                      placeholder="AHT-DIR-XXXXXX"
                      className="w-full pr-8 pl-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleRegenerateReceiptNo}
                      title="Generate new receipt number"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400">Auto-generated or custom physical voucher #</span>
                </div>

                {/* 2. Payment Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Payment Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="direct-payment-date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                {/* 3. Amount */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Payment Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                    <input
                      id="direct-payment-amount"
                      type="number"
                      min="1"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 text-xs font-black text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:bg-white"
                    />
                  </div>
                  {/* Preset chips */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {currentCandidate.balanceDue > 0 && (
                      <button
                        type="button"
                        onClick={() => setAmount(String(currentCandidate.balanceDue))}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                      >
                        Full Due: ₹{currentCandidate.balanceDue.toLocaleString('en-IN')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setAmount('10000')}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      ₹10,000
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmount('25000')}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      ₹25,000
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmount('50000')}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      ₹50,000
                    </button>
                  </div>
                </div>

                {/* 4. Payment Method */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="direct-payment-method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:bg-white font-medium"
                  >
                    <option value="Cash">Cash (Counter Collection)</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT / IMPS</option>
                    <option value="UPI">UPI / GPay / PhonePe / QR</option>
                    <option value="Cheque">Cheque / Demand Draft</option>
                    <option value="Card">Credit / Debit Card / POS</option>
                  </select>
                </div>

                {/* 5. Reference / UTR Number */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Transaction Ref / UTR / Cheque #
                  </label>
                  <input
                    id="direct-payment-txn-ref"
                    type="text"
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    placeholder="e.g. UTR-9823412 or Cheque No."
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                {/* 6. Received By */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Received By (Staff / Desk)
                  </label>
                  <input
                    id="direct-payment-received-by"
                    type="text"
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Notes / Payment Remarks
                </label>
                <input
                  id="direct-payment-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Initial advance, Visa stamping fee instalment, Final pre-flight ticket handover"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              {/* Submission buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  id="record-direct-payment-only-btn"
                  type="button"
                  disabled={isSubmitting || !amount || Number(amount) <= 0}
                  onClick={() => handleRecordPayment(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all disabled:opacity-50"
                >
                  Record Payment Only
                </button>
                <button
                  id="record-direct-payment-and-print-btn"
                  type="button"
                  disabled={isSubmitting || !amount || Number(amount) <= 0}
                  onClick={() => handleRecordPayment(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isSubmitting ? 'Recording...' : 'Record Payment & Print PDF Receipt'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Section 3: Candidate Payment History with Edit / Delete / Print */}
          {currentCandidate && (
            <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#0F1E36] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Candidate Payment History ({currentCandidate.paymentHistory?.length || 0} Receipts)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Past receipts for {currentCandidate.fullName} (Passport: {currentCandidate.passportNumber || 'N/A'}). You can edit or delete any entry.
                  </p>
                </div>
                <button
                  id="print-candidate-statement-pdf-btn"
                  type="button"
                  onClick={() => generateInvoicePdf(currentCandidate, agency)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                  title="Print full statement / invoice with all installments"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-600" />
                  <span>Print Full Statement PDF</span>
                </button>
              </div>

              {/* History Table */}
              <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Receipt No</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Reference</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Notes</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentCandidate.paymentHistory && currentCandidate.paymentHistory.length > 0 ? (
                      currentCandidate.paymentHistory.map((p) => {
                        const isEditing = editingPaymentId === p.id;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            {isEditing ? (
                              <>
                                <td className="py-2.5 px-3 font-mono font-bold text-amber-900">
                                  {p.receiptNumber}
                                </td>
                                <td className="py-2.5 px-3">
                                  <input
                                    type="date"
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    className="px-2 py-1 text-xs border rounded w-28 bg-white"
                                  />
                                </td>
                                <td className="py-2.5 px-3">
                                  <select
                                    value={editMethod}
                                    onChange={(e) => setEditMethod(e.target.value)}
                                    className="px-2 py-1 text-xs border rounded bg-white"
                                  >
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Card">Card</option>
                                  </select>
                                </td>
                                <td className="py-2.5 px-3">
                                  <input
                                    type="text"
                                    value={editRef}
                                    onChange={(e) => setEditRef(e.target.value)}
                                    className="px-2 py-1 text-xs border rounded w-28 bg-white font-mono"
                                  />
                                </td>
                                <td className="py-2.5 px-3">
                                  <input
                                    type="number"
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(Number(e.target.value))}
                                    className="px-2 py-1 text-xs border rounded w-24 bg-white font-bold text-emerald-800"
                                  />
                                </td>
                                <td className="py-2.5 px-3">
                                  <input
                                    type="text"
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    className="px-2 py-1 text-xs border rounded w-36 bg-white"
                                  />
                                </td>
                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                  <button
                                    onClick={() => handleSaveEdit(p.id)}
                                    className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] mr-1"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingPaymentId(null)}
                                    className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-[10px]"
                                  >
                                    Cancel
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="py-2.5 px-3 font-mono font-bold text-amber-900">
                                  <div className="flex items-center gap-1.5">
                                    <span>{p.receiptNumber}</span>
                                    {p.isDirectPayment && (
                                      <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                                        Direct
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-600">
                                  {p.date || p.paymentDate}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                                    {p.paymentMethod || p.paymentMode}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                                  {p.transactionReference || '-'}
                                </td>
                                <td className="py-2.5 px-3 font-black text-emerald-800 text-xs">
                                  ₹{(Number(p.amount) || 0).toLocaleString('en-IN')}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 text-[11px] truncate max-w-[140px]">
                                  {p.note || p.remarks || '-'}
                                </td>
                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                  <button
                                    onClick={() => handleStartEdit(p)}
                                    className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] inline-flex items-center gap-1 mr-1"
                                    title="Edit payment"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmPayment(p)}
                                    className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold inline-flex items-center gap-1 mr-1"
                                    title="Delete payment and recalculate balance"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Delete</span>
                                  </button>
                                  <button
                                    onClick={() => generatePaymentReceiptPdf(p, currentCandidate, agency)}
                                    className="px-2 py-0.5 rounded bg-[#0F1E36] hover:bg-[#1A3258] text-white text-[10px] font-bold inline-flex items-center gap-1"
                                    title="Print PDF Receipt"
                                  >
                                    <Printer className="w-3 h-3 text-amber-400" />
                                    <span>Print PDF</span>
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400">
                          No previous payment records found for this candidate.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>All direct candidate payments automatically update candidate balance & audit reports.</span>
          </div>
          <button
            id="close-direct-payment-modal-footer-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* In-Modal Delete Confirmation Dialog */}
      {deleteConfirmPayment && currentCandidate && (
        <div
          id="confirm-delete-direct-payment-dialog-backdrop"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in"
        >
          <div
            id="confirm-delete-direct-payment-dialog"
            className="bg-white rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900">Delete Payment Record?</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Receipt {deleteConfirmPayment.receiptNumber} will be permanently removed.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Candidate:</span>
                <span className="font-bold text-slate-800">{currentCandidate.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Passport:</span>
                <span className="font-mono text-slate-700">{currentCandidate.passportNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-700 font-bold">Amount to Revert:</span>
                <span className="font-black text-rose-700">₹{(Number(deleteConfirmPayment.amount) || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmPayment(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow"
              >
                Delete Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
