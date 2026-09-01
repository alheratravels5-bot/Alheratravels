import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  Users,
  CheckCircle2,
  Send,
  Compass,
  Briefcase,
  Moon,
  Clock,
  ArrowRight,
  Search,
  Check,
  ChevronDown,
  Sparkles,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  FileCheck,
  Globe2
} from 'lucide-react';
import { AgencyInfo, PartnerOffice } from '../../types';
import { getAgencyInfo, getPartners, savePartners } from '../../lib/storage';
import { formatWhatsAppUrl, logSentMessage } from '../../lib/notifications';

interface PublicPartnersAndAboutProps {
  viewType?: 'partners' | 'about' | string;
  defaultSection?: 'partners' | 'about' | string;
  partners?: PartnerOffice[];
  agencyInfo?: AgencyInfo;
  onOpenLogin?: () => void;
  onNavigate?: (view: string) => void;
  onRegisterPartner?: (partner: PartnerOffice) => void;
}

const FAQS = [
  {
    question: 'How does AL-HERA TRAVELS verify Saudi Employment Visas and Wakala?',
    answer: 'Every vacancy handled by Al-Hera Travels is backed by genuine Electronic Wakala (visa authorization) registered on the official Saudi Ministry of Foreign Affairs (MOFA / Enjaz) platform and verified through authorized Saudi chamber credentials. We do not process sub-standard or unverified visas.'
  },
  {
    question: 'What is the standard deployment timeline for Saudi Arabia?',
    answer: 'Once a candidate clears the client interview or trade test and receives the GAMCA Medical FIT report, embassy visa stamping and Emigration (POE) clearance typically take 15 to 25 working days, followed immediately by airline ticketing.'
  },
  {
    question: 'How can I track my passport and visa status online?',
    answer: 'You can visit our "Track Passport / ID" tab on this website and enter your Passport Number or Candidate Tracking ID (e.g. AHT-2025-9102) to view real-time stage progression 24/7.'
  },
  {
    question: 'What are the inclusions in Al-Hera Umrah Packages?',
    answer: 'Our all-inclusive Umrah packages include round-trip flights on Saudi Airlines/Flynas, approved Umrah eVisa with medical insurance, star-rated hotel accommodation walking distance from the Haramain, 3 daily Indian buffet meals, luxury AC coach transfers, and guided historical Ziyarat in Makkah and Madinah.'
  },
  {
    question: 'How can regional agencies partner with Al-Hera Travels as authorized sub-agents?',
    answer: 'Registered manpower consultancies and tour operators across India can submit their agency credentials using the "Sub-Agent Registration" form below. Our operations director will review and activate your partner portal code.'
  }
];

export const PublicPartnersAndAbout: React.FC<PublicPartnersAndAboutProps> = ({
  viewType = 'about',
  defaultSection,
  partners: propPartners,
  agencyInfo: propAgency,
  onOpenLogin,
  onNavigate,
  onRegisterPartner,
}) => {
  const [activeTab, setActiveTab] = useState<'about' | 'partners'>(
    (defaultSection === 'partners' || viewType === 'partners') ? 'partners' : 'about'
  );
  const [partnerSearch, setPartnerSearch] = useState('');
  const [selectedStateFilter, setSelectedStateFilter] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Partner Registration Form State
  const [isPartnerFormOpen, setIsPartnerFormOpen] = useState(false);
  const [partnerAgencyName, setPartnerAgencyName] = useState('');
  const [partnerContactPerson, setPartnerContactPerson] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerCity, setPartnerCity] = useState('');
  const [partnerState, setPartnerState] = useState('');
  const [partnerSubmitted, setPartnerSubmitted] = useState(false);

  const agency = propAgency || getAgencyInfo();
  const allPartners: PartnerOffice[] = propPartners || getPartners();

  const states = ['all', ...Array.from(new Set(allPartners.map((p) => p.state || p.city).filter(Boolean)))];

  const filteredPartners = allPartners.filter((p) => {
    const q = partnerSearch.toLowerCase();
    const matchesSearch =
      (p.agencyName || '').toLowerCase().includes(q) ||
      (p.contactPerson || '').toLowerCase().includes(q) ||
      (p.city || '').toLowerCase().includes(q) ||
      (p.state || '').toLowerCase().includes(q);

    const matchesState = selectedStateFilter === 'all' || p.state === selectedStateFilter || p.city === selectedStateFilter;

    return matchesSearch && matchesState;
  });

  const handlePartnerInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerAgencyName || !partnerPhone) return;

    const newPartner: PartnerOffice = {
      id: 'po-' + Date.now(),
      partnerCode: `AHT-PARTNER-${Math.floor(100 + Math.random() * 900)}`,
      agencyName: partnerAgencyName.trim(),
      contactPerson: partnerContactPerson.trim(),
      city: partnerCity.trim(),
      state: partnerState.trim(),
      country: 'India',
      phone: partnerPhone.trim(),
      whatsapp: partnerPhone.trim(),
      email: `${partnerAgencyName.toLowerCase().replace(/[^a-z0-9]/g, '')}@partner.alhera.com`,
      defaultCommissionPerCandidate: 15000,
      totalCandidatesReferred: 0,
      totalCommissionEarned: 0,
      totalCommissionPaid: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    savePartners([...allPartners, newPartner]);
    if (onRegisterPartner) {
      onRegisterPartner(newPartner);
    }

    // Send WhatsApp notification
    const msg = `Assalamu Alaikum *AL-HERA TRAVELS*,\n\nI want to register as an Authorized Sub-Agent Partner:\n🏢 Agency: ${partnerAgencyName}\n👤 Contact Person: ${partnerContactPerson}\n📍 Location: ${partnerCity}, ${partnerState}\n📞 Phone: ${partnerPhone}\n\nPlease share agency partnership terms and quota allocations.`;
    const url = formatWhatsAppUrl(agency.whatsapp, msg);
    window.open(url, '_blank');

    logSentMessage(partnerContactPerson, partnerPhone, 'whatsapp', msg, 'Sub-Agent Registration Request', newPartner.partnerCode);

    setPartnerSubmitted(true);
    setTimeout(() => {
      setPartnerSubmitted(false);
      setIsPartnerFormOpen(false);
      setPartnerAgencyName('');
      setPartnerContactPerson('');
      setPartnerPhone('');
      setPartnerCity('');
      setPartnerState('');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-8 text-slate-900">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Navigation Switcher Bar */}
        <div className="flex justify-center">
          <div className="inline-flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-md">
            <button
              onClick={() => setActiveTab('about')}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'about'
                  ? 'bg-[#0F1E36] text-amber-400 shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>About Al-Hera & License</span>
            </button>
            <button
              onClick={() => setActiveTab('partners')}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'partners'
                  ? 'bg-[#0F1E36] text-amber-400 shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Sub-Agent Offices & Network ({allPartners.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: ABOUT AL-HERA & LICENSE PARTICULARS */}
        {activeTab === 'about' && (
          <div className="space-y-12 animate-fade-in">
            {/* Hero Banner */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Govt. Approved Overseas Recruitment & Umrah Organization
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-[#0F1E36] font-display">
                Dedicated to Ethical Recruitment & Blessed Pilgrimages
              </h1>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Headquartered in Mumbai with direct branch offices in Delhi NCR and Riyadh, <strong>AL-HERA TRAVELS</strong> bridges the gap between top Gulf conglomerates and skilled professionals across India.
              </p>
            </div>

            {/* Key Pillars */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F1E36] font-display">
                  Our Legacy of Trust & Integrity
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Founded with a vision to provide completely transparent overseas manpower recruitment and high-standard Umrah pilgrimage services, <strong>AL-HERA TRAVELS</strong> operates under strict compliance with the Ministry of External Affairs and Saudi Consular regulations.
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  We specialize in technical, engineering, medical, heavy equipment, hospitality, and construction recruitment for landmark Saudi initiatives including <strong>NEOM</strong>, <strong>Red Sea Global</strong>, <strong>Riyadh Metro</strong>, and industrial complexes in Jubail and Yanbu.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center gap-2 text-[#0F1E36] font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      100% Genuine Electronic Wakala
                    </div>
                    <p className="text-xs text-slate-500">
                      Direct employer visa allotment with verified demand letters from Saudi principals.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center gap-2 text-[#0F1E36] font-bold text-sm">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Live 24/7 Application Tracking
                    </div>
                    <p className="text-xs text-slate-500">
                      Real-time online portal tracking with transparent step-by-step milestone updates.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center gap-2 text-[#0F1E36] font-bold text-sm">
                      <Briefcase className="w-4 h-4 text-amber-600" />
                      Trade Test & Interview Centers
                    </div>
                    <p className="text-xs text-slate-500">
                      Equipped with modern technical workshops for practical trade evaluation and selection.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center gap-2 text-[#0F1E36] font-bold text-sm">
                      <Moon className="w-4 h-4 text-purple-600" />
                      VIP & Economy Umrah Tours
                    </div>
                    <p className="text-xs text-slate-500">
                      Complete pilgrimage management with direct Saudi Airlines flights and Haramain hotels.
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats & Ministry License Card */}
              <div className="bg-[#0F1E36] text-white p-7 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-6 shadow-2xl">
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-brand font-black text-2xl border border-amber-500/30">
                    AH
                  </div>
                  <h3 className="text-xl font-bold font-display text-white">
                    AL-HERA TRAVELS & TOURS
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Govt. Registered Overseas Recruitment Agency & Certified Umrah Operator.
                  </p>

                  <div className="pt-3 border-t border-slate-800 space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Deployed Candidates:</span>
                      <strong className="text-white">15,000+</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Saudi Projects Served:</span>
                      <strong className="text-amber-400">280+ Conglomerates</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Umrah Pilgrims Guided:</span>
                      <strong className="text-purple-300">5,000+ Hujjaj & Mutamireen</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Network Partner Offices:</span>
                      <strong className="text-emerald-400">{allPartners.length} Cities</strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-amber-400 block">Recruitment Support Desk</span>
                  <p className="text-sm font-black text-white font-mono">{agency.phone}</p>
                  <p className="text-xs text-slate-400">{agency.email}</p>
                </div>
              </div>
            </div>

            {/* Branch Network Cards */}
            <div className="space-y-6">
              <div className="text-center max-w-2xl mx-auto">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Branch Offices</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F1E36] font-display mt-1">
                  Visit Our Corporate & Regional Desks
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Connect directly with our recruitment managers or Umrah tour officers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-[#0F1E36]">Mumbai Head Office</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{agency.mumbaiOffice || 'Central Commercial Plaza, Mumbai, Maharashtra'}</p>
                  <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                    <p className="text-slate-500">Phone: <strong className="text-slate-900">{agency.phone}</strong></p>
                    <p className="text-slate-500">Email: <strong className="text-slate-900">{agency.email}</strong></p>
                    <p className="text-slate-500">Services: <strong className="text-slate-900">Headquarters & Client Interview Center</strong></p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-[#0F1E36]">Delhi NCR Branch</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{agency.delhiOffice || 'Okhla Industrial Area / Connaught Place, New Delhi'}</p>
                  <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                    <p className="text-slate-500">Phone: <strong className="text-slate-900">{agency.phone}</strong></p>
                    <p className="text-slate-500">Services: <strong className="text-slate-900">Saudi Embassy Visa Stamping & POE</strong></p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-[#0F1E36]">Saudi Arabia Branch (Riyadh)</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{agency.saudiOffice || 'Al-Batha Commercial District, Riyadh, Saudi Arabia'}</p>
                  <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                    <p className="text-slate-500">Services: <strong className="text-slate-900">Saudi Employer Wakala & Post-Arrival Welfare</strong></p>
                    <p className="text-slate-500">Support: <strong className="text-slate-900">On-ground Candidate Assistance</strong></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Frequently Asked Questions */}
            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-lg space-y-6">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-600" />
                <h3 className="text-xl sm:text-2xl font-bold text-[#0F1E36] font-display">
                  Frequently Asked Questions (FAQ)
                </h3>
              </div>

              <div className="divide-y divide-slate-200 space-y-2">
                {FAQS.map((faq, idx) => {
                  const isOpen = expandedFaq === idx;
                  return (
                    <div key={idx} className="pt-3">
                      <button
                        onClick={() => setExpandedFaq(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between text-left py-2 font-bold text-sm sm:text-base text-slate-800 hover:text-amber-600 transition-colors"
                      >
                        <span>{faq.question}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-amber-600' : ''}`} />
                      </button>
                      {isOpen && (
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pb-3 pt-1 animate-fade-in">
                          {faq.answer}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SUB-AGENT NETWORK DIRECTORY */}
        {activeTab === 'partners' && (
          <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider mb-2">
                  <Globe2 className="w-3.5 h-3.5" />
                  National Sourcing & Sub-Agent Network
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F1E36] font-display">
                  Authorized Sub-Agent Offices & Centers
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Verified recruitment partners handling candidate screening, documentation, and trade mobilization.
                </p>
              </div>

              <button
                onClick={() => setIsPartnerFormOpen(true)}
                className="px-5 py-3 rounded-2xl bg-[#0F1E36] hover:bg-[#1A3258] text-amber-400 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg transition-all shrink-0"
              >
                <Building2 className="w-4 h-4" />
                <span>Register Your Agency</span>
              </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search partner office, city, person..."
                  value={partnerSearch}
                  onChange={(e) => setPartnerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <span className="text-xs font-bold text-slate-500">Region:</span>
                <select
                  value={selectedStateFilter}
                  onChange={(e) => setSelectedStateFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 font-semibold focus:outline-none"
                >
                  <option value="all">All States & Cities</option>
                  {states.filter(s => s !== 'all').map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Partner Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPartners.map((partner) => {
                const whatsMsg = `Assalamu Alaikum *${partner.agencyName}*,\n\nI am contacting you regarding overseas Saudi vacancies through *AL-HERA TRAVELS* network.`;
                const whatsUrl = formatWhatsAppUrl(partner.whatsapp || partner.phone, whatsMsg);

                return (
                  <div
                    key={partner.id}
                    className="bg-white rounded-3xl border border-slate-200 shadow-md hover:shadow-xl transition-all p-6 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                          {partner.partnerCode || 'AHT-PARTNER'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Authorized
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-base text-[#0F1E36] font-display">
                          {partner.agencyName}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>Contact: <strong>{partner.contactPerson}</strong></span>
                        </p>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{partner.city}, {partner.state}</span>
                        </p>
                        <p className="flex items-center gap-1.5 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{partner.phone}</span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <a
                        href={`tel:${partner.phone.replace(/[^0-9+]/g, '')}`}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Office</span>
                      </a>

                      <a
                        href={whatsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredPartners.length === 0 && (
              <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-500">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-sm">No partner offices found matching "{partnerSearch}".</p>
                <button
                  onClick={() => { setPartnerSearch(''); setSelectedStateFilter('all'); }}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Clear Search Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal: Sub-Agent Registration Form */}
        {isPartnerFormOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-4 animate-scale-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-lg text-[#0F1E36] font-display">Sub-Agent Partnership Registration</h3>
                  <p className="text-xs text-slate-500">Join the Al-Hera national overseas sourcing network</p>
                </div>
                <button
                  onClick={() => setIsPartnerFormOpen(false)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {partnerSubmitted ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-base text-slate-900">Partnership Request Submitted!</h4>
                  <p className="text-xs text-slate-500">
                    Our operations team is contacting you on WhatsApp to activate your partner profile.
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePartnerInquirySubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Agency / Consultancy Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Al-Falah Manpower Services"
                      value={partnerAgencyName}
                      onChange={(e) => setPartnerAgencyName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Proprietor / Contact Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mohammad Tariq"
                        value={partnerContactPerson}
                        onChange={(e) => setPartnerContactPerson(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone / WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91-9876543210"
                        value={partnerPhone}
                        onChange={(e) => setPartnerPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Lucknow"
                        value={partnerCity}
                        onChange={(e) => setPartnerCity(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Uttar Pradesh"
                        value={partnerState}
                        onChange={(e) => setPartnerState(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPartnerFormOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit & Open WhatsApp</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
