import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Share2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Briefcase,
  Sparkles,
  Calendar,
  DollarSign,
  Clock,
  ShieldCheck,
  Building2,
  QrCode
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { JobVacancy, AgencyInfo } from '../../types';
import { getAgencyInfo } from '../../lib/storage';
import { formatWhatsAppUrl } from '../../lib/notifications';

interface PublicJobPosterModalProps {
  job: JobVacancy | null;
  isOpen: boolean;
  onClose: () => void;
  agencyInfo?: AgencyInfo;
}

export const PublicJobPosterModal: React.FC<PublicJobPosterModalProps> = ({
  job,
  isOpen,
  onClose,
  agencyInfo: propAgency,
}) => {
  const posterRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [theme, setTheme] = useState<'navy_gold' | 'royal_emerald' | 'crimson_gold'>('navy_gold');

  if (!isOpen || !job) return null;

  const agency = propAgency || getAgencyInfo();

  const handleDownloadImage = async () => {
    if (!posterRef.current) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(posterRef.current, {
        scale: 2, // High resolution for WhatsApp & Social Media
        useCORS: true,
        backgroundColor: '#0F1E36',
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `AL-HERA-JOB-POSTER-${job.jobCode}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to capture poster:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleWhatsAppShare = () => {
    const text = `🇸🇦 *URGENT SAUDI ARABIA JOB VACANCY* 🇸🇦\n\n📌 *Position:* ${job.title}\n🔢 *Job Code:* ${job.jobCode}\n🏢 *Employer:* ${job.companyName} (${job.city}, ${job.country})\n💰 *Salary:* ${job.salaryMin} - ${job.salaryMax} ${job.currency} + Overtime\n\n🎁 *Perks Provided:* Free Food, Accommodation, Transportation & Medical Insurance.\n📅 *Interview Date:* ${job.interviewDate || 'Ongoing Client Interviews'}\n\n*AL-HERA TRAVELS* (Govt. Approved Agency)\n📞 Contact / WhatsApp: ${agency.phone}\n📧 Email: ${agency.email}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  let bgClass = 'from-[#0A1628] via-[#0F1E36] to-[#0A1628]';
  let accentColor = 'text-amber-400';
  let borderAccent = 'border-amber-500/40';
  let goldBadgeBg = 'bg-amber-500 text-slate-950';

  if (theme === 'royal_emerald') {
    bgClass = 'from-[#062c1e] via-[#0b3d2b] to-[#062c1e]';
    accentColor = 'text-emerald-300';
    borderAccent = 'border-emerald-500/40';
    goldBadgeBg = 'bg-emerald-500 text-white';
  } else if (theme === 'crimson_gold') {
    bgClass = 'from-[#310c14] via-[#4a121e] to-[#310c14]';
    accentColor = 'text-amber-300';
    borderAccent = 'border-amber-500/40';
    goldBadgeBg = 'bg-amber-400 text-slate-950';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl max-w-2xl w-full my-8 overflow-hidden animate-fade-in text-white">
        {/* Controls Toolbar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold uppercase">Poster Theme:</span>
            <button
              onClick={() => setTheme('navy_gold')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                theme === 'navy_gold' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Navy & Gold
            </button>
            <button
              onClick={() => setTheme('royal_emerald')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                theme === 'royal_emerald' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Emerald
            </button>
            <button
              onClick={() => setTheme('crimson_gold')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                theme === 'crimson_gold' ? 'bg-rose-700 text-white font-bold' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Crimson
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={downloading}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Rendering...' : 'Download Image'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container for Preview */}
        <div className="p-4 sm:p-6 bg-slate-950/60 flex justify-center max-h-[75vh] overflow-y-auto">
          {/* Printable / Capturable Visual Poster Node */}
          <div
            ref={posterRef}
            id="job-poster-canvas"
            className={`w-[520px] bg-gradient-to-b ${bgClass} p-6 rounded-2xl border-2 border-amber-500/40 shadow-2xl relative text-white overflow-hidden`}
            style={{ width: '520px', minHeight: '680px' }}
          >
            {/* Top Brand Header */}
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 flex items-center justify-center text-[#0F1E36] font-brand font-black text-2xl shadow-lg">
                  <div className="w-full h-full bg-[#0F1E36] rounded-[10px] flex items-center justify-center text-amber-400">
                    AH
                  </div>
                </div>
                <div>
                  <h2 className="font-brand font-extrabold text-2xl tracking-wider text-white">
                    AL-HERA <span className="text-amber-400">TRAVELS</span>
                  </h2>
                  <p className="text-[10px] text-amber-300 font-semibold tracking-wider uppercase">
                    Govt. Approved Overseas Recruitment Agency
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] block text-slate-300">Lic. No:</span>
                <span className="text-[10px] font-bold text-amber-400">{agency.licenseNumber}</span>
              </div>
            </div>

            {/* Saudi Flag & Urgent Banner */}
            <div className="flex items-center justify-between bg-amber-500/20 border border-amber-500/40 rounded-xl p-2.5 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🇸🇦</span>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    DIRECT SAUDI ARABIA RECRUITMENT
                  </span>
                  <p className="text-[10px] text-slate-300">Fast Wakala • 100% Genuine Work Visa</p>
                </div>
              </div>
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${goldBadgeBg}`}>
                Job Code: {job.jobCode}
              </span>
            </div>

            {/* Job Title Box */}
            <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 backdrop-blur-sm">
              <span className="text-[11px] text-amber-400 font-bold uppercase tracking-widest block mb-1">
                URGENT VACANCY FOR
              </span>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide uppercase leading-tight">
                {job.title}
              </h1>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                Employer: <strong className="text-white">{job.companyName}</strong> ({job.city}, Saudi Arabia)
              </p>

              {/* Highlighting Salary */}
              <div className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-5 py-2 rounded-xl font-display font-black text-lg shadow-lg">
                <span>SALARY: {job.salaryMin} - {job.salaryMax} {job.currency}</span>
                <span className="text-xs font-bold uppercase bg-slate-950 text-amber-400 px-2 py-0.5 rounded">
                  + OVERTIME
                </span>
              </div>
            </div>

            {/* Perks & Benefits Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{job.foodProvided ? 'Free Food / Allowance' : 'Food Self'}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{job.accommodationProvided ? 'Free Furnished Acc.' : 'Standard Acc.'}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{job.transportProvided ? 'Free Transportation' : 'Local Transport'}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{job.medicalInsurance ? 'Medical Insurance + Iqama' : 'Medical Provided'}</span>
              </div>
            </div>

            {/* Terms Details */}
            <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 text-[11px] space-y-1.5 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Duty Hours:</span>
                <span className="font-semibold text-slate-200">{job.dutyHours}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Contract Period:</span>
                <span className="font-semibold text-slate-200">{job.contractPeriod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Age Limit:</span>
                <span className="font-semibold text-slate-200">{job.ageLimit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Experience:</span>
                <span className="font-semibold text-slate-200">{job.experienceRequired}</span>
              </div>
              {job.interviewDate && (
                <div className="flex justify-between text-amber-300 font-bold border-t border-slate-800 pt-1">
                  <span>Client Interview Date:</span>
                  <span>{job.interviewDate} ({job.interviewVenue?.split(',')[0] || 'Mumbai/Delhi'})</span>
                </div>
              )}
            </div>

            {/* Contact & Branch Footer */}
            <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  APPLY NOW / CONTACT RECRUITMENT TEAM:
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span className="font-black text-sm text-white">{agency.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-300 mt-0.5">
                  <Mail className="w-3 h-3 text-amber-400" />
                  <span>{agency.email}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] text-slate-300 block">Branches:</span>
                <span className="text-[10px] font-bold text-amber-300">Mumbai • Delhi • Sikar</span>
                <span className="text-[9px] text-slate-400 block">Riyadh, KSA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
