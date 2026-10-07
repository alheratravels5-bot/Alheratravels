import React, { useState } from 'react';
import {
  X,
  Trash2,
  AlertTriangle,
  Building2,
  Briefcase,
  Ticket,
  ShieldCheck,
  CheckCircle2,
  Users
} from 'lucide-react';
import { VisaBatch, IndividualVisa } from '../../../types';
import { deleteVisaBatch } from '../../../lib/storage';

interface DeleteVisaBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: VisaBatch | null;
  allVisas: IndividualVisa[];
  onDeleted: () => void;
}

export const DeleteVisaBatchModal: React.FC<DeleteVisaBatchModalProps> = ({
  isOpen,
  onClose,
  batch,
  allVisas,
  onDeleted,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !batch) return null;

  // Check if any visa belonging to this batch is assigned to candidates
  const batchVisas = allVisas.filter(
    (v) => v.batchId === batch.id || v.batchCode === batch.batchId
  );
  const assignedVisas = batchVisas.filter(
    (v) =>
      v.candidateId ||
      (v.candidateTrackingId && v.candidateTrackingId.trim() !== '') ||
      v.visaStatus !== 'Available'
  );

  const isBlocked = assignedVisas.length > 0 || (batch.usedVisas && batch.usedVisas > 0);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      const res = deleteVisaBatch(batch.id, 'Administrator');
      if (res.success) {
        onDeleted();
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to delete visa batch.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-fade-in text-slate-900 my-8">
        {/* Header Icon & Title */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isBlocked
                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                : 'bg-rose-100 text-rose-600 border border-rose-200'
            }`}
          >
            {isBlocked ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <Trash2 className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-extrabold text-slate-900 text-base leading-tight">
              {isBlocked ? 'Cannot Delete Visa Batch' : 'Delete Visa Batch?'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isBlocked
                ? 'This batch cannot be deleted because visas are currently linked to candidate placements.'
                : 'Only this specific batch and its unassigned visas will be removed.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Batch Info Card */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Batch Identifier:</span>
            <span className="font-mono font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-200/80">
              {batch.batchId}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Trade / Category:</span>
            <strong className="text-slate-800">{batch.jobTitle}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Partner Office:</span>
            <span className="text-slate-700 font-medium">{batch.partnerOfficeName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Sector / City:</span>
            <span className="text-slate-700">{batch.sectorCity}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
            <span className="text-slate-500">Total Visas in Batch:</span>
            <span className="font-mono font-bold text-slate-900">{batch.totalVisas}</span>
          </div>
        </div>

        {/* If Blocked: Warning Details */}
        {isBlocked ? (
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-950">
              <Users className="w-4 h-4 text-amber-700" />
              <span>{assignedVisas.length} Visa(s) Allocated to Candidates</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Deleting this batch while candidates are assigned would disrupt candidate placement records, vouchers, and accounting balances.
            </p>
            <div className="max-h-28 overflow-y-auto space-y-1 pt-1 border-t border-amber-200/60">
              {assignedVisas.map((v) => (
                <div
                  key={v.id}
                  className="p-1.5 bg-white/80 rounded border border-amber-200 text-[11px] flex items-center justify-between"
                >
                  <span className="font-mono font-bold text-slate-800">{v.visaId}</span>
                  <span className="text-slate-700 font-medium truncate max-w-[160px]">
                    {v.candidateName || 'Assigned Candidate'}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-amber-700 italic">
              Tip: Go to the Assigned Candidates or Visas tab to unassign candidates first if you need to remove this batch.
            </p>
          </div>
        ) : (
          /* If Not Blocked: Safety Assurance */
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-950">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe Deletion Guarantee</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              All {batch.totalVisas} visas in this batch are unassigned. Deleting will remove only this batch and its inventory items. Existing candidates, client accounts, payments, and other partner records will NOT be affected.
            </p>
          </div>
        )}

        {/* Error message if any */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            {isBlocked ? 'Understood' : 'Cancel'}
          </button>
          {!isBlocked && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Deleting...' : 'Delete Batch'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
