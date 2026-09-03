import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  CloudDownload,
  Edit3,
  Trash2,
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  User,
  Building2,
  RefreshCw,
  Receipt,
  FileText,
  DollarSign
} from 'lucide-react';
import {
  Candidate,
  PaymentRecord,
  PartnerOfficePayment,
  AgencyInfo
} from '../../types';
import {
  getCandidates,
  getPartnerPayments,
  getAgencyInfo,
  fetchOldPaymentRecords,
  updateCandidatePaymentRecord,
  deleteCandidatePaymentRecord,
  updatePartnerPaymentRecord,
  deletePartnerPaymentRecord,
  EnrichedCandidatePayment
} from '../../lib/storage';
import { fetchOldPaymentsFromFirestore } from '../../lib/firebase';
import { generatePaymentReceiptPdf } from '../../lib/pdfGenerator';

interface FetchUpdatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSearchQuery?: string;
  initialCandidatePayment?: {
    candidateId: string;
    paymentId: string;
  };
  initialPartnerPaymentId?: string;
  onPaymentUpdated?: () => void;
}

type TabType = 'all' | 'candidate' | 'partner';

export const FetchUpdatePaymentModal: React.FC<FetchUpdatePaymentModalProps> = ({
  isOpen,
  onClose,
  initialSearchQuery = '',
  initialCandidatePayment,
  initialPartnerPaymentId,
  onPaymentUpdated,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [activeFilter, setActiveFilter] = useState<TabType>('all');
  const [isCloudFetching, setIsCloudFetching] = useState(false);
  const [cloudMessage, setCloudMessage] = useState<string | null>(null);

  // Editing state
  const [selectedCandidatePayment, setSelectedCandidatePayment] = useState<EnrichedCandidatePayment | null>(null);
  const [selectedPartnerPayment, setSelectedPartnerPayment] = useState<PartnerOfficePayment | null>(null);

  // Form edit fields
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editDate, setEditDate] = useState<string>('');
  const [editMode, setEditMode] = useState<string>('Cash');
  const [editRef, setEditRef] = useState<string>('');
  const [editRemarks, setEditRemarks] = useState<string>('');
  const [editReceivedBy, setEditReceivedBy] = useState<string>('Accounts Desk');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // In-app deletion confirmation state (safe in mobile iframes)
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    type: 'candidate' | 'partner';
    id: string;
    candidateId?: string;
    reference: string;
    amount: number;
    party: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const agency: AgencyInfo = useMemo(() => getAgencyInfo(), []);

  // Fetch local data
  const [records, setRecords] = useState(() => fetchOldPaymentRecords(searchQuery));

  const refreshLocalRecords = (q = searchQuery) => {
    const res = fetchOldPaymentRecords(q);
    setRecords(res);
  };

  useEffect(() => {
    if (!isOpen) return;

    if (initialCandidatePayment) {
      const candidates = getCandidates();
      const cand = candidates.find(
        (c) => c.id === initialCandidatePayment.candidateId || c.trackingId === initialCandidatePayment.candidateId
      );
      if (cand && Array.isArray(cand.paymentHistory)) {
        const pmt = cand.paymentHistory.find(
          (p) => p.id === initialCandidatePayment.paymentId || p.receiptNumber === initialCandidatePayment.paymentId
        );
        if (pmt) {
          selectForCandidateEdit({
            ...pmt,
            candidateId: cand.id,
            candidateTrackingId: cand.trackingId,
            candidateFullName: cand.fullName,
            candidatePassport: cand.passportNumber,
            candidateTrade: cand.trade,
            candidateStatus: cand.status,
            candidatePackageFee: cand.packageFee,
            candidateTotalPaid: cand.totalPaid,
            candidateBalanceDue: cand.balanceDue,
          });
        }
      }
    } else if (initialPartnerPaymentId) {
      const partnerPayments = getPartnerPayments();
      const pmt = partnerPayments.find(
        (p) => p.id === initialPartnerPaymentId || p.paymentNumber === initialPartnerPaymentId
      );
      if (pmt) {
        selectForPartnerEdit(pmt);
      }
    } else {
      refreshLocalRecords(initialSearchQuery);
    }
  }, [isOpen, initialCandidatePayment, initialPartnerPaymentId, initialSearchQuery]);

  const selectForCandidateEdit = (p: EnrichedCandidatePayment) => {
    setSelectedCandidatePayment(p);
    setSelectedPartnerPayment(null);
    setEditAmount(Number(p.amount) || 0);
    setEditDate(p.date || p.paymentDate || new Date().toISOString().split('T')[0]);
    setEditMode(p.paymentMethod || p.paymentMode || 'Cash');
    setEditRef(p.transactionReference || '');
    setEditRemarks(p.remarks || p.note || '');
    setEditReceivedBy(p.receivedBy || 'Accounts Desk');
    setFeedback(null);
  };

  const selectForPartnerEdit = (p: PartnerOfficePayment) => {
    setSelectedPartnerPayment(p);
    setSelectedCandidatePayment(null);
    setEditAmount(Number(p.amount) || 0);
    setEditDate(p.paymentDate || new Date().toISOString().split('T')[0]);
    setEditMode(p.paymentMethod || 'Bank Transfer');
    setEditRef(p.referenceNumber || '');
    setEditRemarks(p.notes || '');
    setEditReceivedBy(p.recordedBy || 'Accounts Desk');
    setFeedback(null);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    refreshLocalRecords(val);
  };

  const handleCloudFetch = async () => {
    setIsCloudFetching(true);
    setCloudMessage(null);
    try {
      const res = await fetchOldPaymentsFromFirestore();
      if (res.success) {
        setCloudMessage(`Cloud Fetch Success: ${res.candidatePaymentsCount} Candidate receipts & ${res.partnerPaymentsCount} Partner vouchers retrieved.`);
        refreshLocalRecords(searchQuery);
      } else {
        setCloudMessage(`Fetch note: ${res.message}`);
      }
    } catch (e: any) {
      setCloudMessage(`Cloud sync encountered an issue: ${e.message || 'Error fetching'}`);
    } finally {
      setIsCloudFetching(false);
    }
  };

  const handleSaveCandidateUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidatePayment) return;

    if (editAmount <= 0) {
      setFeedback({ type: 'error', message: 'Payment amount must be greater than zero.' });
      return;
    }

    const res = updateCandidatePaymentRecord(
      selectedCandidatePayment.candidateId,
      selectedCandidatePayment.id,
      {
        amount: Number(editAmount),
        date: editDate,
        paymentDate: editDate,
        paymentMethod: editMode,
        paymentMode: editMode,
        transactionReference: editRef,
        note: editRemarks,
        remarks: editRemarks,
        receivedBy: editReceivedBy,
      },
      editReceivedBy
    );

    if (res.success && res.candidate && res.payment) {
      setFeedback({ type: 'success', message: res.message });
      // Update selected reference
      setSelectedCandidatePayment({
        ...res.payment,
        candidateId: res.candidate.id,
        candidateTrackingId: res.candidate.trackingId,
        candidateFullName: res.candidate.fullName,
        candidatePassport: res.candidate.passportNumber,
        candidateTrade: res.candidate.trade,
        candidateStatus: res.candidate.status,
        candidatePackageFee: res.candidate.packageFee,
        candidateTotalPaid: res.candidate.totalPaid,
        candidateBalanceDue: res.candidate.balanceDue,
      });
      refreshLocalRecords(searchQuery);
      if (onPaymentUpdated) onPaymentUpdated();
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleSavePartnerUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerPayment) return;

    if (editAmount <= 0) {
      setFeedback({ type: 'error', message: 'Voucher amount must be greater than zero.' });
      return;
    }

    const res = updatePartnerPaymentRecord(
      selectedPartnerPayment.id,
      {
        amount: Number(editAmount),
        paymentDate: editDate,
        paymentMethod: editMode,
        referenceNumber: editRef,
        notes: editRemarks,
        recordedBy: editReceivedBy,
      },
      editReceivedBy
    );

    if (res.success && res.payment) {
      setFeedback({ type: 'success', message: res.message });
      setSelectedPartnerPayment(res.payment);
      refreshLocalRecords(searchQuery);
      if (onPaymentUpdated) onPaymentUpdated();
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleDeleteCandidatePayment = () => {
    if (!selectedCandidatePayment) return;
    setDeleteConfirmState({
      type: 'candidate',
      candidateId: selectedCandidatePayment.candidateId,
      id: selectedCandidatePayment.id,
      reference: selectedCandidatePayment.receiptNumber || 'Receipt',
      amount: selectedCandidatePayment.amount,
      party: selectedCandidatePayment.candidateFullName,
    });
  };

  const handleDeletePartnerPayment = () => {
    if (!selectedPartnerPayment) return;
    setDeleteConfirmState({
      type: 'partner',
      id: selectedPartnerPayment.id,
      reference: selectedPartnerPayment.paymentNumber || 'Voucher',
      amount: selectedPartnerPayment.amount,
      party: selectedPartnerPayment.partnerOfficeName,
    });
  };

  const handleDirectDeleteCandidatePayment = (
    candidateId: string,
    paymentId: string,
    receiptNumber: string,
    amount: number,
    candidateName: string
  ) => {
    setDeleteConfirmState({
      type: 'candidate',
      candidateId,
      id: paymentId,
      reference: receiptNumber,
      amount,
      party: candidateName,
    });
  };

  const handleDirectDeletePartnerPayment = (
    paymentId: string,
    voucherNumber: string,
    amount: number,
    partnerName: string
  ) => {
    setDeleteConfirmState({
      type: 'partner',
      id: paymentId,
      reference: voucherNumber,
      amount,
      party: partnerName,
    });
  };

  const executeModalDelete = async () => {
    if (!deleteConfirmState) return;
    setIsDeleting(true);
    try {
      if (deleteConfirmState.type === 'candidate' && deleteConfirmState.candidateId) {
        const res = deleteCandidatePaymentRecord(
          deleteConfirmState.candidateId,
          deleteConfirmState.id,
          'Administrator'
        );
        if (res.success) {
          setFeedback({ type: 'success', message: `${res.message} Synchronized with Supabase.` });
          setSelectedCandidatePayment(null);
          refreshLocalRecords(searchQuery);
          if (onPaymentUpdated) onPaymentUpdated();
        } else {
          setFeedback({ type: 'error', message: res.message || 'Failed to delete payment record.' });
        }
      } else if (deleteConfirmState.type === 'partner') {
        const res = deletePartnerPaymentRecord(deleteConfirmState.id, 'Administrator');
        if (res.success) {
          setFeedback({ type: 'success', message: `${res.message} Synchronized with Supabase.` });
          setSelectedPartnerPayment(null);
          refreshLocalRecords(searchQuery);
          if (onPaymentUpdated) onPaymentUpdated();
        } else {
          setFeedback({ type: 'error', message: res.message || 'Failed to delete partner payment record.' });
        }
      }
    } catch (err: any) {
      console.error('Error deleting payment in modal:', err);
      setFeedback({ type: 'error', message: `Delete failed: ${err?.message || 'Database synchronization failure'}` });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmState(null);
    }
  };

  const handlePrintReceipt = () => {
    if (selectedCandidatePayment) {
      const candidates = getCandidates();
      const cand = candidates.find((c) => c.id === selectedCandidatePayment.candidateId);
      if (cand) {
        generatePaymentReceiptPdf(selectedCandidatePayment, cand, agency);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="fetch-update-payment-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn"
    >
      <div
        id="fetch-update-payment-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
      >
        {/* Modal Header */}
        <div className="bg-[#0F1E36] text-white px-6 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-wide flex items-center gap-2">
                <span>Payment Records Hub</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-extrabold">
                  Fetch & Update
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Retrieve historical payment receipts, edit payment values, and synchronize ledger balances.
              </p>
            </div>
          </div>
          <button
            id="close-payment-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* If Editing a Selected Record */}
          {selectedCandidatePayment ? (
            <div id="edit-candidate-payment-view" className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <button
                  id="back-to-search-candidate-btn"
                  type="button"
                  onClick={() => setSelectedCandidatePayment(null)}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-amber-50 border border-amber-200"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Back to Search & Fetch Records</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    id="print-updated-candidate-receipt-btn"
                    onClick={handlePrintReceipt}
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 border border-slate-300"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-700" />
                    <span>Print PDF Receipt</span>
                  </button>
                  <button
                    id="void-candidate-payment-btn"
                    onClick={handleDeleteCandidatePayment}
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 border border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Void / Delete</span>
                  </button>
                </div>
              </div>

              {/* Feedback Alert */}
              {feedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Candidate Info Summary Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Candidate</span>
                  <strong className="text-slate-900 font-bold text-sm">{selectedCandidatePayment.candidateFullName}</strong>
                  <span className="font-mono text-slate-600 ml-2">({selectedCandidatePayment.candidateTrackingId})</span>
                  <span className="text-slate-500 ml-2">Passport: {selectedCandidatePayment.candidatePassport || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Package Fee</span>
                    <strong className="font-mono text-slate-800">₹{selectedCandidatePayment.candidatePackageFee?.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Current Paid</span>
                    <strong className="font-mono text-emerald-700 font-bold">₹{selectedCandidatePayment.candidateTotalPaid?.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Current Balance</span>
                    <strong className="font-mono text-amber-700 font-bold">₹{selectedCandidatePayment.candidateBalanceDue?.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleSaveCandidateUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Receipt Number</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={selectedCandidatePayment.receiptNumber}
                      className="w-full font-mono font-bold bg-slate-100 border border-slate-300 rounded-lg p-2.5 text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Amount (INR) *</label>
                    <input
                      id="edit-candidate-payment-amount"
                      type="number"
                      min={1}
                      required
                      value={editAmount}
                      onChange={(e) => setEditAmount(Number(e.target.value))}
                      className="w-full font-bold text-sm border border-slate-300 rounded-lg p-2.5 text-emerald-800 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Date *</label>
                    <input
                      id="edit-candidate-payment-date"
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full font-semibold border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                    <select
                      id="edit-candidate-payment-mode"
                      value={editMode}
                      onChange={(e) => setEditMode(e.target.value)}
                      className="w-full font-semibold border border-slate-300 rounded-lg p-2.5"
                    >
                      <option value="Cash">Cash at Office</option>
                      <option value="Bank Transfer">Bank Transfer / NEFT / RTGS</option>
                      <option value="UPI">UPI / Google Pay / PhonePe</option>
                      <option value="Cheque">Cheque / Demand Draft</option>
                      <option value="Online">Online Payment Gateway</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">UTR / Transaction Reference</label>
                    <input
                      id="edit-candidate-payment-ref"
                      type="text"
                      placeholder="e.g. UTR-182938491"
                      value={editRef}
                      onChange={(e) => setEditRef(e.target.value)}
                      className="w-full font-mono border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Received / Authorized By</label>
                    <input
                      id="edit-candidate-payment-received-by"
                      type="text"
                      value={editReceivedBy}
                      onChange={(e) => setEditReceivedBy(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">Receipt Remarks / Purpose</label>
                  <textarea
                    id="edit-candidate-payment-remarks"
                    rows={2}
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    placeholder="e.g. Initial advance fee for Saudi Visa & Medical Processing"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Recalculation Preview */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-amber-700" />
                    <div>
                      <strong className="text-amber-900 font-bold block">Live Recalculation Impact</strong>
                      <span className="text-slate-600 text-[11px]">
                        Old Amount: ₹{(Number(selectedCandidatePayment.amount) || 0).toLocaleString('en-IN')} &rarr; New Amount: ₹{(Number(editAmount) || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Projected New Balance</span>
                    <strong className="font-mono text-emerald-800 text-sm font-bold">
                      ₹{Math.max(
                        0,
                        (selectedCandidatePayment.candidatePackageFee || 0) -
                          ((selectedCandidatePayment.candidateTotalPaid || 0) -
                            Number(selectedCandidatePayment.amount || 0) +
                            Number(editAmount || 0))
                      ).toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    id="cancel-candidate-edit-btn"
                    type="button"
                    onClick={() => setSelectedCandidatePayment(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-candidate-payment-update-btn"
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow flex items-center gap-2 transition-transform active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Changes & Sync Balance</span>
                  </button>
                </div>
              </form>
            </div>
          ) : selectedPartnerPayment ? (
            <div id="edit-partner-payment-view" className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <button
                  id="back-to-search-partner-btn"
                  type="button"
                  onClick={() => setSelectedPartnerPayment(null)}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-amber-50 border border-amber-200"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Back to Search & Fetch Records</span>
                </button>
                <button
                  id="void-partner-payment-btn"
                  onClick={handleDeletePartnerPayment}
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 border border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Void / Delete Voucher</span>
                </button>
              </div>

              {/* Feedback Alert */}
              {feedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Partner Info Summary Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Partner Office</span>
                  <strong className="text-slate-900 font-bold text-sm">{selectedPartnerPayment.partnerOfficeName}</strong>
                  {selectedPartnerPayment.relatedCandidateName && (
                    <span className="text-emerald-700 font-semibold block text-[11px] mt-0.5">
                      Linked Candidate: {selectedPartnerPayment.relatedCandidateName} ({selectedPartnerPayment.relatedCandidateTrackingId || 'ID'})
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Voucher Code</span>
                  <strong className="font-mono text-slate-900 text-sm font-bold">{selectedPartnerPayment.paymentNumber}</strong>
                </div>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleSavePartnerUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Number</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={selectedPartnerPayment.paymentNumber}
                      className="w-full font-mono font-bold bg-slate-100 border border-slate-300 rounded-lg p-2.5 text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Voucher Amount (INR) *</label>
                    <input
                      id="edit-partner-payment-amount"
                      type="number"
                      min={1}
                      required
                      value={editAmount}
                      onChange={(e) => setEditAmount(Number(e.target.value))}
                      className="w-full font-bold text-sm border border-slate-300 rounded-lg p-2.5 text-emerald-800 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Date *</label>
                    <input
                      id="edit-partner-payment-date"
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full font-semibold border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                    <select
                      id="edit-partner-payment-method"
                      value={editMode}
                      onChange={(e) => setEditMode(e.target.value)}
                      className="w-full font-semibold border border-slate-300 rounded-lg p-2.5"
                    >
                      <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                      <option value="UPI">UPI / Net Banking</option>
                      <option value="Cash">Cash Voucher</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bank Reference / UTR</label>
                    <input
                      id="edit-partner-payment-ref"
                      type="text"
                      value={editRef}
                      onChange={(e) => setEditRef(e.target.value)}
                      className="w-full font-mono border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Recorded By</label>
                    <input
                      id="edit-partner-payment-recorded-by"
                      type="text"
                      value={editReceivedBy}
                      onChange={(e) => setEditReceivedBy(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">Voucher Remarks</label>
                  <textarea
                    id="edit-partner-payment-remarks"
                    rows={2}
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    id="cancel-partner-edit-btn"
                    type="button"
                    onClick={() => setSelectedPartnerPayment(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-partner-payment-update-btn"
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow flex items-center gap-2 transition-transform active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Voucher & Update Ledger</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Search and Records Browser */
            <div id="search-and-fetch-view" className="space-y-4">
              {/* Search Bar & Cloud Sync Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="payment-search-input"
                    type="text"
                    placeholder="Search by Receipt # (REC-), Candidate Name, Tracking ID (AHT-), Passport, or UTR..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => handleSearchChange('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <button
                  id="cloud-fetch-payment-btn"
                  onClick={handleCloudFetch}
                  disabled={isCloudFetching}
                  className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  title="Fetch and pull old records directly from remote Firestore"
                >
                  <CloudDownload className={`w-4 h-4 text-amber-700 ${isCloudFetching ? 'animate-bounce' : ''}`} />
                  <span>{isCloudFetching ? 'Fetching Cloud...' : 'Fetch from Cloud'}</span>
                </button>
              </div>

              {cloudMessage && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center justify-between">
                  <span>{cloudMessage}</span>
                  <button onClick={() => setCloudMessage(null)} className="text-blue-500 hover:text-blue-700 font-bold ml-2">
                    &times;
                  </button>
                </div>
              )}

              {/* Filter Tabs & Count summary */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-1.5">
                  <button
                    id="tab-all-records-btn"
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      activeFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Historical ({records.candidatePayments.length + records.partnerPayments.length})
                  </button>
                  <button
                    id="tab-candidate-receipts-btn"
                    onClick={() => setActiveFilter('candidate')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      activeFilter === 'candidate'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Candidate Receipts ({records.candidatePayments.length})
                  </button>
                  <button
                    id="tab-partner-vouchers-btn"
                    onClick={() => setActiveFilter('partner')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      activeFilter === 'partner'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Partner Remittances ({records.partnerPayments.length})
                  </button>
                </div>

                <div className="text-right text-[11px] text-slate-500">
                  Total Candidate Received: <strong className="text-slate-900 font-bold">₹{records.totalCandidateAmount.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {/* Records List / Table */}
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {/* 1. Candidate Payments */}
                {(activeFilter === 'all' || activeFilter === 'candidate') &&
                  records.candidatePayments.map((p) => (
                    <div
                      key={p.id}
                      id={`candidate-payment-${p.id}`}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-300 bg-white hover:bg-amber-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {p.receiptNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {p.candidateFullName}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            ({p.candidateTrackingId})
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                            {p.paymentMode || p.paymentMethod}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 mt-1">
                          <span>Date: <strong className="text-slate-700">{p.date || p.paymentDate}</strong></span>
                          {p.transactionReference && (
                            <span className="font-mono">Ref: {p.transactionReference}</span>
                          )}
                          {p.remarks && <span className="italic truncate max-w-xs">{p.remarks}</span>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-right">
                          <strong className="text-sm font-extrabold text-slate-900 block font-mono">
                            ₹{(Number(p.amount) || 0).toLocaleString('en-IN')}
                          </strong>
                          <span className="text-[10px] text-slate-400 block">Candidate Fee</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            id={`edit-candidate-payment-btn-${p.id}`}
                            onClick={() => selectForCandidateEdit(p)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-2xs"
                            title="Edit candidate payment record"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            id={`delete-candidate-payment-btn-${p.id}`}
                            onClick={() =>
                              handleDirectDeleteCandidatePayment(
                                p.candidateId,
                                p.id,
                                p.receiptNumber || 'Receipt',
                                Number(p.amount) || 0,
                                p.candidateFullName
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
                            title="Delete payment receipt and recalculate candidate balance"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                {/* 2. Partner Payments */}
                {(activeFilter === 'all' || activeFilter === 'partner') &&
                  records.partnerPayments.map((p) => (
                    <div
                      key={p.id}
                      id={`partner-payment-${p.id}`}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {p.paymentNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {p.partnerOfficeName}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                            {p.paymentMethod}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 mt-1">
                          <span>Date: <strong className="text-slate-700">{p.paymentDate}</strong></span>
                          {p.referenceNumber && (
                            <span className="font-mono">Ref: {p.referenceNumber}</span>
                          )}
                          {p.relatedCandidateName && (
                            <span className="text-emerald-700 font-semibold">
                              For: {p.relatedCandidateName} ({p.relatedCandidateTrackingId})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-right">
                          <strong className="text-sm font-extrabold text-emerald-800 block font-mono">
                            ₹{(Number(p.amount) || 0).toLocaleString('en-IN')}
                          </strong>
                          <span className="text-[10px] text-slate-400 block">Partner Remittance</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            id={`edit-partner-payment-btn-${p.id}`}
                            onClick={() => selectForPartnerEdit(p)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-2xs"
                            title="Edit partner payment voucher"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            id={`delete-partner-payment-btn-${p.id}`}
                            onClick={() =>
                              handleDirectDeletePartnerPayment(
                                p.id,
                                p.paymentNumber || 'Voucher',
                                Number(p.amount) || 0,
                                p.partnerOfficeName
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
                            title="Delete partner payment voucher and update partner ledger"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                {records.candidatePayments.length === 0 && records.partnerPayments.length === 0 && (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Receipt className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <h5 className="font-bold text-sm text-slate-800">No payment records found</h5>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      No matching candidate payment receipts or partner vouchers were found. Try another query or use "Fetch from Cloud".
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>All updates recalculate running balances and sync to Firestore.</span>
          <button
            id="close-payment-footer-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold"
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirmation Sub-Modal for Deletion */}
      {deleteConfirmState && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-extrabold text-slate-900 text-base">
                  {deleteConfirmState.type === 'candidate' ? 'Delete Payment Receipt?' : 'Delete Remittance Voucher?'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to delete this payment? Outstanding balances will be recalculated immediately.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Ref:</span>
                <span className="font-mono font-bold text-slate-800">{deleteConfirmState.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Party:</span>
                <span className="font-bold text-slate-800 truncate max-w-[180px]">{deleteConfirmState.party}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-700 font-bold">Amount:</span>
                <span className="font-mono font-black text-rose-700">₹{deleteConfirmState.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmState(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeModalDelete}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
