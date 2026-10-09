import React, { useState, useMemo } from 'react';
import {
  X,
  Ticket,
  Building2,
  Calendar,
  DollarSign,
  Briefcase,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  UserX,
  Edit3,
  Trash2,
  Search,
  FileText,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { VisaBatch, IndividualVisa, Candidate } from '../../../types';

interface ViewVisaBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: VisaBatch | null;
  allVisas: IndividualVisa[];
  allCandidates?: Candidate[];
  onEdit?: (batch: VisaBatch) => void;
  onDelete?: (batch: VisaBatch) => void;
  onAssignVisa?: (visa: IndividualVisa) => void;
  onUnassignVisa?: (visa: IndividualVisa) => void;
  onSelectCandidateDetail?: (candidate: Candidate) => void;
}

export const ViewVisaBatchModal: React.FC<ViewVisaBatchModalProps> = ({
  isOpen,
  onClose,
  batch,
  allVisas,
  allCandidates = [],
  onEdit,
  onDelete,
  onAssignVisa,
  onUnassignVisa,
  onSelectCandidateDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Available' | 'Assigned'>('all');

  // Filter individual visas belonging to this batch - unconditionally called to respect Rules of Hooks
  const batchVisas = useMemo(() => {
    if (!batch) return [];
    return allVisas.filter(
      (v) => v.batchId === batch.id || v.batchCode === batch.batchId
    );
  }, [allVisas, batch?.id, batch?.batchId]);

  // Filtered visas based on search and status - unconditionally called
  const filteredVisas = useMemo(() => {
    if (!batch) return [];
    return batchVisas.filter((v) => {
      if (statusFilter === 'Available' && v.visaStatus !== 'Available') return false;
      if (statusFilter === 'Assigned' && v.visaStatus === 'Available') return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        v.visaId.toLowerCase().includes(q) ||
        (v.visaNumber && v.visaNumber.toLowerCase().includes(q)) ||
        (v.mofaNumber && v.mofaNumber.toLowerCase().includes(q)) ||
        (v.candidateName && v.candidateName.toLowerCase().includes(q)) ||
        (v.candidatePassport && v.candidatePassport.toLowerCase().includes(q)) ||
        (v.sponsorName && v.sponsorName.toLowerCase().includes(q))
      );
    });
  }, [batch, batchVisas, searchTerm, statusFilter]);

  if (!isOpen || !batch) return null;

  // Compute stats
  const totalVisas = batch.totalVisas || batchVisas.length;
  const usedVisas = batch.usedVisas ?? batchVisas.filter((v) => v.visaStatus !== 'Available').length;
  const remainingVisas = batch.remainingVisas ?? Math.max(0, totalVisas - usedVisas);
  const amountPerVisa = batch.amountPerVisa || 0;
  const totalAmount = batch.totalAmount || totalVisas * amountPerVisa;

  // Expiry check
  const isExpired = batch.expiryDate ? new Date(batch.expiryDate) < new Date() : false;
  const daysRemaining = batch.expiryDate
    ? Math.ceil((new Date(batch.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const canDelete = usedVisas === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-6 overflow-hidden animate-fade-in text-slate-900 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#0F1E36] p-5 sm:p-6 text-white flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-extrabold text-amber-400 text-sm sm:text-base">
                  {batch.batchId}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    remainingVisas === 0
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : usedVisas > 0
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {batch.status || (remainingVisas === 0 ? 'Fully Used' : usedVisas > 0 ? 'Partially Used' : 'Available')}
                </span>
                {isExpired && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Expired
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-display text-white mt-1">
                {batch.jobTitle}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <strong className="text-white">{batch.partnerOfficeName}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{batch.sectorCity}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                  <span>{batch.visaType}</span>
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Total Visas
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">
                {totalVisas}
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Inventory received</span>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                Assigned Visas
              </span>
              <div className="text-xl sm:text-2xl font-black text-blue-800 font-mono mt-0.5">
                {usedVisas}
              </div>
              <span className="text-[10px] text-blue-600 block mt-0.5">
                {totalVisas > 0 ? Math.round((usedVisas / totalVisas) * 100) : 0}% allocated
              </span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                Available Visas
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-800 font-mono mt-0.5">
                {remainingVisas}
              </div>
              <span className="text-[10px] text-emerald-600 block mt-0.5">Ready for placement</span>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                Total Batch Value
              </span>
              <div className="text-lg sm:text-xl font-black text-amber-900 font-mono mt-0.5 truncate">
                ₹{totalAmount.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-amber-700 block mt-0.5 font-mono">
                @ ₹{amountPerVisa.toLocaleString('en-IN')} / visa
              </span>
            </div>
          </div>

          {/* Dates & Logistics Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600">Date Received:</span>
              <strong className="text-slate-900 font-mono">{batch.dateReceived || 'N/A'}</strong>
            </div>
            {batch.expiryDate && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-slate-600">Batch Expiry:</span>
                <strong className={`font-mono ${isExpired ? 'text-rose-600' : 'text-slate-900'}`}>
                  {batch.expiryDate}
                </strong>
                {daysRemaining !== null && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      daysRemaining <= 0
                        ? 'bg-rose-100 text-rose-700'
                        : daysRemaining < 30
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {daysRemaining <= 0 ? 'Expired' : `${daysRemaining} days left`}
                  </span>
                )}
              </div>
            )}
            {batch.notes && (
              <div className="w-full pt-2 border-t border-slate-200 text-slate-600 flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Remarks:</strong> {batch.notes}
                </span>
              </div>
            )}
          </div>

          {/* Individual Visas Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h3 className="font-bold text-sm text-[#0F1E36] flex items-center gap-2">
                  <span>Individual Visa Inventory</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                    {batchVisas.length} records
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Detailed allocation status of every visa record created under this batch.
                </p>
              </div>

              {/* Search and Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search visa / candidate..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none w-48 sm:w-56"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="py-1.5 px-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="Available">Available</option>
                  <option value="Assigned">Assigned</option>
                </select>
              </div>
            </div>

            {/* Visas Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3">Visa ID & Ref</th>
                      <th className="py-2.5 px-3">MOFA / Visa No</th>
                      <th className="py-2.5 px-3">Kafeel / Sponsor</th>
                      <th className="py-2.5 px-3 text-right">Cost</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3">Allocated Candidate</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredVisas.map((v) => {
                      const isAssigned = v.visaStatus !== 'Available' || !!v.candidateId;
                      // Find matched candidate object if present
                      const matchedCand = allCandidates.find(
                        (c) => c.id === v.candidateId || c.trackingId === v.candidateTrackingId
                      );

                      return (
                        <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {v.visaId}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono text-slate-800 block">
                              {v.visaNumber || 'Pending'}
                            </span>
                            {v.mofaNumber && (
                              <span className="text-[10px] font-mono text-slate-400 block">
                                MOFA: {v.mofaNumber}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {v.sponsorName || 'General Sponsor'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            ₹{(v.visaAmount || amountPerVisa).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isAssigned
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {v.visaStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {isAssigned ? (
                              <div>
                                <strong className="text-slate-900 block">
                                  {v.candidateName || matchedCand?.fullName || 'Assigned Candidate'}
                                </strong>
                                <span className="text-[10px] text-slate-500 font-mono block">
                                  {v.candidatePassport || matchedCand?.passportNumber ? `Passport: ${v.candidatePassport || matchedCand?.passportNumber}` : ''}
                                  {v.candidateTrackingId ? ` • Ref: ${v.candidateTrackingId}` : ''}
                                </span>
                                {matchedCand && onSelectCandidateDetail && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onClose();
                                      onSelectCandidateDetail(matchedCand);
                                    }}
                                    className="text-[10px] text-amber-700 hover:text-amber-800 font-bold underline inline-flex items-center gap-0.5 mt-0.5"
                                  >
                                    View Candidate Profile <ArrowRight className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">
                                Unassigned • Ready
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {!isAssigned && onAssignVisa && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onAssignVisa(v);
                                }}
                                className="px-2 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <UserCheck className="w-3 h-3" />
                                <span>Assign</span>
                              </button>
                            )}
                            {isAssigned && onUnassignVisa && (
                              <button
                                type="button"
                                onClick={() => {
                                  onUnassignVisa(v);
                                }}
                                className="px-2 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                                title="Unassign candidate from this visa"
                              >
                                <UserX className="w-3 h-3" />
                                <span>Unassign</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredVisas.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400">
                          {searchTerm || statusFilter !== 'all'
                            ? 'No visas match the filter criteria.'
                            : 'No individual visas found for this batch.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div>
            {canDelete ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete?.(batch);
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors border border-rose-200"
                title="Safely remove this unassigned visa batch"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Batch</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{usedVisas} visa(s) assigned • Batch protected from accidental deletion</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs transition-colors"
            >
              Close
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(batch);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Batch Details</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
