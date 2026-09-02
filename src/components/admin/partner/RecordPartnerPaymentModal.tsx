import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  DollarSign,
  Building2,
  Calendar,
  CreditCard,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Hash,
  FileText,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { PartnerOffice, VisaBatch, IndividualVisa, Candidate, PartnerOfficePayment } from '../../../types';
import { recordPartnerPayment, getPartnerPayments } from '../../../lib/storage';
import { computePartnerFinancials } from '../../../lib/partnerCalculations';

interface RecordPartnerPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner?: PartnerOffice | null;
  allPartners: PartnerOffice[];
  batches?: VisaBatch[];
  visas?: IndividualVisa[];
  candidates?: Candidate[];
  onPaymentRecorded: (payment: PartnerOfficePayment) => void;
}

export const RecordPartnerPaymentModal: React.FC<RecordPartnerPaymentModalProps> = ({
  isOpen,
  onClose,
  partner,
  allPartners,
  batches = [],
  visas = [],
  candidates = [],
  onPaymentRecorded,
}) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(partner?.id || allPartners[0]?.id || '');
  const [amount, setAmount] = useState<string | number>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cash' | 'Cheque' | 'Online / UPI' | 'RTGS / NEFT'>('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState<string>(`UTR-${Date.now().toString().slice(-8)}`);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const currentPartner = useMemo(() => {
    return partner || allPartners.find((p) => p.id === selectedPartnerId) || allPartners[0] || null;
  }, [partner, allPartners, selectedPartnerId]);

  // Compute live, accurate financial rollup for selected partner
  const liveFinancials = useMemo(() => {
    if (!currentPartner) return null;
    const payments = getPartnerPayments();
    return computePartnerFinancials(currentPartner, batches, visas, candidates, payments);
  }, [currentPartner, batches, visas, candidates, isOpen]);

  const outstanding = liveFinancials
    ? liveFinancials.outstandingPayable
    : (currentPartner?.outstandingPayable ?? currentPartner?.balancePending ?? 0);

  // Initialize or update default amount when partner changes or modal opens
  useEffect(() => {
    if (isOpen && currentPartner) {
      const out = liveFinancials
        ? liveFinancials.outstandingPayable
        : (currentPartner.outstandingPayable ?? currentPartner.balancePending ?? 0);
      
      if (out > 0) {
        setAmount(out);
      } else {
        setAmount('');
      }
      setErrorMessage('');
      setReferenceNumber(`UTR-${Date.now().toString().slice(-8)}`);
    }
  }, [isOpen, currentPartner?.id, liveFinancials?.outstandingPayable]);

  if (!isOpen) return null;

  const partnerBatches = batches.filter((b) => b.partnerOfficeId === (currentPartner?.id || selectedPartnerId));
  const numericAmount = Number(amount) || 0;
  const newRemainingBalance = Math.max(0, outstanding - numericAmount);

  const handlePartnerSelect = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    setErrorMessage('');
    const selected = allPartners.find((p) => p.id === partnerId);
    if (selected) {
      const pPayments = getPartnerPayments();
      const pFin = computePartnerFinancials(selected, batches, visas, candidates, pPayments);
      const out = pFin.outstandingPayable;
      if (out > 0) {
        setAmount(out);
      } else {
        setAmount('');
      }
    }
  };

  const handleSetExactAmount = (targetVal: number) => {
    setAmount(targetVal);
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const targetPartnerId = currentPartner?.id || selectedPartnerId;
    if (!targetPartnerId) {
      setErrorMessage('Please select a valid Partner Office.');
      return;
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      setErrorMessage('Payment Amount must be a positive number greater than ₹0.');
      return;
    }

    // Validation: amount must allow any positive amount up to current outstanding balance
    if (outstanding > 0 && payAmount > outstanding) {
      setErrorMessage(
        `Payment amount of ₹${payAmount.toLocaleString('en-IN')} exceeds the current outstanding balance of ₹${outstanding.toLocaleString('en-IN')}. Please enter an amount up to ₹${outstanding.toLocaleString('en-IN')}.`
      );
      return;
    }

    const matchedBatch = batches.find((b) => b.id === selectedBatchId || b.batchId === selectedBatchId);

    const result = recordPartnerPayment({
      partnerOfficeId: targetPartnerId,
      partnerOfficeName: currentPartner?.agencyName || 'Partner Office',
      amount: payAmount,
      paymentDate,
      paymentMethod,
      referenceNumber: referenceNumber.trim() || `UTR-${Date.now().toString().slice(-8)}`,
      relatedBatchId: matchedBatch?.id,
      relatedBatchCode: matchedBatch?.batchId,
      notes: notes || `Settlement payment of ₹${payAmount.toLocaleString('en-IN')} via ${paymentMethod}`,
    });

    if (result.success) {
      onPaymentRecorded(result.payment);
      onClose();
    } else {
      setErrorMessage(result.message || 'Failed to record payment. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full my-8 overflow-hidden animate-fade-in text-slate-900">
        {/* Header */}
        <div className="bg-[#0F1E36] p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                Financial Settlement
              </span>
              <h3 className="text-base sm:text-lg font-bold font-display text-white">
                Record Payment to Partner Office
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Partner Selector */}
          {!partner ? (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Recipient Partner Office *
              </label>
              <select
                value={selectedPartnerId}
                onChange={(e) => handlePartnerSelect(e.target.value)}
                required
                className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">Select Partner Office</option>
                {allPartners.map((p) => {
                  const pOut = p.outstandingPayable ?? p.balancePending ?? 0;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.agencyName} ({p.partnerCode || 'PTR'}) — Outstanding Due: ₹{pOut.toLocaleString('en-IN')}
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Partner Office</span>
                <strong className="text-slate-900 text-xs sm:text-sm font-bold">{partner.agencyName}</strong>
                <span className="text-[11px] text-slate-500 block font-mono">Code: {partner.partnerCode || 'PTR'}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block font-semibold">Current Outstanding Balance</span>
                <span className="text-base font-extrabold text-rose-700 font-mono">
                  ₹{outstanding.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {/* Balance & Deduction Live Summary Card */}
          {currentPartner && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600 font-medium">Current Balance Due:</span>
                <span className="font-bold text-slate-900 font-mono">₹{outstanding.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600 font-medium">Payment to Record:</span>
                <span className="font-bold text-emerald-700 font-mono">- ₹{numericAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Remaining Balance After Payment:</span>
                <span className="font-extrabold text-[#0F1E36] font-mono">
                  ₹{newRemainingBalance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700">
                  Payment Amount (INR) *
                </label>
                {outstanding > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700">
                    Max: ₹{outstanding.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="0.01"
                  max={outstanding > 0 ? outstanding : undefined}
                  step="any"
                  required
                  placeholder="e.g. 12000"
                  value={amount}
                  onChange={(e) => {
                    setErrorMessage('');
                    const val = e.target.value;
                    if (val === '') {
                      setAmount('');
                    } else {
                      const num = parseFloat(val);
                      setAmount(isNaN(num) ? '' : num);
                    }
                  }}
                  className="w-full pl-7 pr-3 py-2.5 text-sm font-extrabold text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Quick Fill Preset Buttons */}
              {outstanding > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => handleSetExactAmount(outstanding)}
                    className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] transition-colors"
                  >
                    Full Balance (₹{outstanding.toLocaleString('en-IN')})
                  </button>
                  {outstanding >= 10000 && (
                    <button
                      type="button"
                      onClick={() => handleSetExactAmount(Math.round(outstanding / 2))}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] transition-colors"
                    >
                      50% (₹{Math.round(outstanding / 2).toLocaleString('en-IN')})
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Method & Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Payment Method / Mode *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="Bank Transfer">Bank Transfer / IMPS</option>
                <option value="RTGS / NEFT">RTGS / NEFT</option>
                <option value="Online / UPI">Online / UPI</option>
                <option value="Cash">Cash at Desk</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                UTR / Reference / Cheque No. *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. UTR1908239012"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full text-xs font-mono uppercase border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Tag to Visa Batch (Optional) */}
          {partnerBatches.length > 0 && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tag to Visa Batch (Optional)
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">General Settlement (Against Total Ledger)</option>
                {partnerBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchId} — {b.jobTitle} ({b.totalVisas} Visas @ ₹{b.amountPerVisa.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Payment Remarks & Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Paid via HDFC Current A/C, acknowledged by partner manager"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-all text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-amber-400 font-bold shadow-md transition-all flex items-center gap-2 text-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Record ₹{numericAmount > 0 ? numericAmount.toLocaleString('en-IN') : '0'} Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

