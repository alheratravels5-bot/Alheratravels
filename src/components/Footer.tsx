import React from 'react';
import {
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
  Heart,
  Briefcase,
  Moon,
  Search,
  Building
} from 'lucide-react';
import { AgencyInfo } from '../types';

interface FooterProps {
  agencyInfo: AgencyInfo;
  onNavigate: (view: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ agencyInfo, onNavigate }) => {
  return (
    <footer className="bg-[#0A1424] text-slate-400 border-t border-slate-800 text-sm">
      {/* Top Value Strip */}
      <div className="bg-[#0F1E36] py-8 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm font-display">Verified Recruitment</h4>
              <p className="text-xs text-slate-400">Direct Saudi Employers</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm font-display">100% Genuine Wakala</h4>
              <p className="text-xs text-slate-400">Direct Saudi Enterprise Visas</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Moon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm font-display">Premium Umrah</h4>
              <p className="text-xs text-slate-400">VIP 5-Star & Economy Groups</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm font-display">24/7 Live Tracking</h4>
              <p className="text-xs text-slate-400">Online Passport Status Portal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Col 1: Brand & Ministry Approval */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[#0F1E36] font-brand font-black text-xl">
              AH
            </div>
            <div>
              <span className="font-brand font-extrabold text-lg text-white">AL-HERA</span>
              <span className="font-brand font-bold text-lg text-amber-400 ml-1.5">TRAVELS</span>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Leading overseas manpower recruitment & Umrah services consultancy. Connecting qualified skilled & technical workforce with prestigious employers in Saudi Arabia, UAE, Qatar, and the Gulf region.
          </p>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/30 text-xs">
            <span className="text-amber-400 font-semibold block mb-0.5">Overseas Recruitment & Umrah</span>
            <span className="text-slate-200">Direct Saudi Enterprise Visas & Wakala Allocation</span>
          </div>
        </div>

        {/* Col 2: Quick Links */}
        <div>
          <h4 className="text-white font-bold text-sm mb-4 font-display uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Quick Navigation
          </h4>
          <ul className="space-y-2.5 text-xs">
            <li>
              <button
                onClick={() => onNavigate('public_jobs')}
                className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
              >
                <span>🇸🇦 Saudi Arabia Job Openings</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('public_umrah')}
                className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
              >
                <span>🕋 15 & 21 Days Umrah Packages</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('public_tracking')}
                className="hover:text-amber-400 transition-colors flex items-center gap-1.5 text-amber-300 font-semibold"
              >
                <span>🔎 Live Passport & Application Tracking</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('public_about')}
                className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
              >
                <span>ℹ️ About Al-Hera & Services</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Col 3: Branches */}
        <div>
          <h4 className="text-white font-bold text-sm mb-4 font-display uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Our Branch Offices
          </h4>
          <div className="space-y-3 text-xs">
            <div>
              <p className="text-slate-200 font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Head Office (Mumbai):
              </p>
              <p className="text-slate-400 ml-4.5 mt-0.5">{agencyInfo.mumbaiOffice}</p>
            </div>

            <div>
              <p className="text-slate-200 font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Delhi NCR Branch:
              </p>
              <p className="text-slate-400 ml-4.5 mt-0.5">{agencyInfo.delhiOffice}</p>
            </div>

            <div>
              <p className="text-slate-200 font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Saudi Arabia Branch (Riyadh):
              </p>
              <p className="text-slate-400 ml-4.5 mt-0.5">{agencyInfo.saudiOffice}</p>
            </div>
          </div>
        </div>

        {/* Col 4: Contact & Helpline */}
        <div className="space-y-3">
          <h4 className="text-white font-bold text-sm mb-4 font-display uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Direct Helpline
          </h4>
          
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <a href={`tel:${agencyInfo.phone}`} className="text-white font-bold hover:text-amber-400">
                {agencyInfo.phone}
              </a>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <a href={`mailto:${agencyInfo.email}`} className="text-slate-300 hover:text-amber-400">
                {agencyInfo.email}
              </a>
            </div>
          </div>

          <a
            href={`https://wa.me/${agencyInfo.whatsapp}?text=Assalamu%20Alaikum%20Al-Hera%20Travels%2C%20I%20am%20interested%20in%20overseas%20recruitment%20and%20Umrah%20services.`}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all"
          >
            <span>Chat on WhatsApp (+91-9214635385)</span>
          </a>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-slate-800/80 py-4 px-4 sm:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} AL-HERA TRAVELS. All Rights Reserved. Overseas Recruitment & Umrah Services.</p>
          <p className="text-slate-400">
            Brand Colors: <span className="text-blue-400 font-semibold">Navy Blue</span> + <span className="text-amber-400 font-semibold">Royal Gold</span> + <span className="text-white font-semibold">White</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
