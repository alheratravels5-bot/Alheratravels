import React, { useRef } from 'react';
import { X, Printer, Download, ShieldCheck, User, QrCode, Building2, MapPin } from 'lucide-react';
import { Candidate, AgencyInfo } from '../../types';
import { getAgencyInfo } from '../../lib/storage';

interface WakalaCardModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  agencyInfo?: AgencyInfo;
}

export const WakalaCardModal: React.FC<WakalaCardModalProps> = ({
  candidate,
  isOpen,
  onClose,
  agencyInfo: propAgency,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !candidate) return null;

  const agency = propAgency || getAgencyInfo();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in my-8">
        {/* Controls Toolbar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-white font-display">Candidate Wakala & Identity Card</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Badge</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 flex justify-center bg-slate-950/50">
          <div
            ref={cardRef}
            id="wakala-identity-card"
            className="w-[360px] bg-gradient-to-b from-[#0F1E36] via-[#0A1628] to-[#0F1E36] rounded-2xl border-2 border-amber-500/40 p-5 shadow-2xl text-white relative overflow-hidden print-break-inside-avoid"
          >
            {/* Top Ribbon */}
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[#0F1E36] font-brand font-black text-base shadow">
                  AH
                </div>
                <div>
                  <h4 className="font-brand font-bold text-sm text-white tracking-wider">
                    AL-HERA <span className="text-amber-400">TRAVELS</span>
                  </h4>
                  <span className="text-[8px] text-slate-300 font-semibold tracking-wider block uppercase">
                    Govt. Lic: {agency.licenseNumber}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[8px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase">
                  WAKALA CARD
                </span>
              </div>
            </div>

            {/* Candidate Photo & Main Details */}
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-20 h-24 rounded-xl bg-amber-500/10 border border-amber-400/40 overflow-hidden shrink-0 flex items-center justify-center text-amber-400 font-bold text-xl">
                {candidate.photoUrl ? (
                  <img
                    src={candidate.photoUrl}
                    alt={candidate.fullName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-10 h-10" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider block">
                  Candidate Name:
                </span>
                <h3 className="font-bold text-sm text-white leading-tight">{candidate.fullName}</h3>
                <p className="text-[10px] text-slate-300">
                  Trade: <strong className="text-amber-300">{candidate.trade}</strong>
                </p>
                <p className="text-[10px] text-slate-300 font-mono">
                  Passport: <strong className="text-white">{candidate.passportNumber}</strong>
                </p>
                <p className="text-[10px] text-slate-300 font-mono">
                  Track ID: <strong className="text-amber-400">{candidate.trackingId}</strong>
                </p>
              </div>
            </div>

            {/* Saudi Sponsor & Visa Details Box */}
            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-[10px] space-y-1 mb-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Saudi Sponsor:</span>
                <span className="font-semibold text-slate-200 text-right truncate max-w-[170px]">
                  {candidate.sponsorName || 'Saudi Principal Employer'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Wakala Ref No:</span>
                <span className="font-mono text-amber-400">{candidate.wakalaNumber || 'WKL-2025-ALLOT'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Saudi Visa No:</span>
                <span className="font-mono text-white">{candidate.visaNumber || 'Under Embassy Stamping'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <span className="font-bold text-emerald-400 uppercase">{candidate.status.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Bottom Bar & Helpline */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400">
              <div>
                <span>Emergency Helpline:</span>
                <strong className="text-white block">{agency.phone}</strong>
              </div>

              <div className="text-right">
                <span>Riyadh • Mumbai • Delhi</span>
                <span className="text-amber-400 font-semibold block">alheratravels.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
