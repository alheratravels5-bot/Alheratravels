import React, { useState } from 'react';
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
  FileText
} from 'lucide-react';
import { PartnerOffice, VisaBatch, IndividualVisa, Candidate, PartnerOfficePayment } from '../../../types';
import { recordPartnerPayment } from '../../../lib/storage';

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
  const [amount, setAmount] = useState<number>(50000);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cash' | 'Cheque' | 'Online / UPI' | 'RTGS / NEFT'>('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState<string>(`UTR-${Date.now().toString().slice(-8)}`);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const currentPartner = partner || allPartners.find((p) => p.id === selectedPartnerId);
  const partnerBatches = batches.filter((b) => b.partnerOfficeId === (partner?.id || selectedPartnerId));
  const outstanding = currentPartner?.outstandingPayable || currentPartner?.balancePending || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const partnerId = partner?.id || selectedPartnerId;
    if (!partnerId) {
      alert('Please select a Partner Office.');
      return;
    }

    const matchedBatch = batches.find((b) => b.id === selectedBatchId || b.batchId === selectedBatchId);

    const result = recordPartnerPayment({
      partnerOfficeId: partnerId,
      partnerOfficeName: currentPartner?.agencyName || 'Partner Office',
      amount: Number(amount),
      paymentDate,
      paymentMethod,
      referenceNumber,
      relatedBatchId: matchedBatch?.id,
      relatedBatchCode: matchedBatch?.batchId,
      notes: notes || `Settlement payment via ${paymentMethod}`,
    });

    if (result.success) {
      onPaymentRecorded(result.payment);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full my-8 overflow-hidden animate-fade-in text-slate-900">
        {/* Header */}
        <div className="bg-[#0F1E36] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                Financial Settlement
              </span>
              <h3 className="text-lg font-bold font-display text-white">
                Record Payment to Partner Office
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                required
                className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">Select Partner Office</option>
                {allPartners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.agencyName} ({p.partnerCode || 'PTR'}) — Outstanding: ₹{(p.outstandingPayable || p.balancePending || 0).toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Partner Office</span>
                <strong className="text-slate-900 text-xs">{partner.agencyName}</strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Current Outstanding Balance:</span>
                <span className="text-sm font-extrabold text-rose-700">
                  ₹{outstanding.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Payment Amount (INR) *
              </label>
              <input
                type="number"
                min="1"
                step="500"
                required
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-sm font-extrabold text-slate-900 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
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
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-amber-400 font-bold shadow-md transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Record ₹{amount.toLocaleString('en-IN')} Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
