import React, { useState } from 'react';
import {
  Moon,
  Calendar,
  MapPin,
  CheckCircle2,
  Users,
  Plane,
  Heart,
  Sparkles,
  Phone,
  Send,
  Info,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { UmrahPackage, AgencyInfo, UmrahBooking } from '../../types';
import { getUmrahPackages, getAgencyInfo } from '../../lib/storage';
import { PublicUmrahBookingModal } from './PublicUmrahBookingModal';

interface PublicUmrahProps {
  packages?: UmrahPackage[];
  agencyInfo?: AgencyInfo;
  onBookPackage?: (pkg: UmrahPackage) => void;
  onBookingSuccess?: (booking: UmrahBooking) => void;
}

export const PublicUmrah: React.FC<PublicUmrahProps> = ({
  packages: propPackages,
  agencyInfo: propAgency,
  onBookPackage: propOnBookPackage,
  onBookingSuccess,
}) => {
  const [selectedPackage, setSelectedPackage] = useState<UmrahPackage | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [expandedItinerary, setExpandedItinerary] = useState<string | null>(null);

  const agency = propAgency || getAgencyInfo();
  const packages = propPackages || getUmrahPackages();

  const handleOpenBooking = (pkg: UmrahPackage) => {
    setSelectedPackage(pkg);
    setIsBookingOpen(true);
  };

  const handleWhatsAppInquiry = (pkg: UmrahPackage) => {
    const text = `Assalamu Alaikum *AL-HERA TRAVELS*,\n\nI want information for *${pkg.name}* (${pkg.durationDays} Days).\n\n🕋 Makkah: ${pkg.makkahHotel} (${pkg.makkahDistance})\n🕌 Madinah: ${pkg.madinahHotel} (${pkg.madinahDistance})\n💵 Price: Starting ₹${pkg.pricing.quadSharing.toLocaleString('en-IN')}\n\nPlease share upcoming group departure seats.`;
    const url = `https://wa.me/${agency.whatsapp}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs font-bold uppercase tracking-wider mb-3">
            <Moon className="w-3.5 h-3.5 text-amber-600" />
            Blessed Spiritual Journeys 2025-2026
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F1E36] font-display">
            All-Inclusive Premium & Economy Umrah Packages
          </h1>
          <p className="text-slate-600 text-sm mt-2">
            Experience complete spiritual peace with hotels closest to Masjid Al-Haram & Masjid An-Nabawi, direct Saudi Airlines flights, delicious Indian meals, and guided historical Ziyarats.
          </p>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              id={`umrah-card-${pkg.packageCode}`}
              className="bg-white rounded-3xl border border-slate-200 shadow-xl hover:shadow-2xl transition-all overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Image Banner with Badge */}
                <div className="relative h-52 overflow-hidden bg-slate-900">
                  <img
                    src={pkg.imageUrl}
                    alt={pkg.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-amber-500 text-slate-950 shadow-md">
                      {pkg.badge || `${pkg.durationDays} Days`}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider block">
                      {pkg.packageType}
                    </span>
                    <h3 className="text-xl font-bold text-white font-display leading-snug">
                      {pkg.name}
                    </h3>
                  </div>
                </div>

                {/* Hotel & Distances */}
                <div className="p-5 border-b border-slate-100 space-y-3 bg-slate-50">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                      🕋 Makkah Mukarramah Hotel:
                    </span>
                    <p className="text-xs font-bold text-slate-900">{pkg.makkahHotel}</p>
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-600" /> {pkg.makkahDistance}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                      🕌 Madinah Munawwarah Hotel:
                    </span>
                    <p className="text-xs font-bold text-slate-900">{pkg.madinahHotel}</p>
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-600" /> {pkg.madinahDistance}
                    </span>
                  </div>
                </div>

                {/* Pricing Table */}
                <div className="p-5">
                  <div className="bg-[#0F1E36] text-white p-4 rounded-2xl mb-4">
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-1">
                      Package Pricing (Per Pilgrim)
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-1.5 rounded-lg bg-white/5">
                        <span className="text-[10px] text-slate-300 block">Quad</span>
                        <strong className="text-xs sm:text-sm font-black text-amber-400">
                          ₹{pkg.pricing.quadSharing.toLocaleString('en-IN')}
                        </strong>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white/5">
                        <span className="text-[10px] text-slate-300 block">Triple</span>
                        <strong className="text-xs sm:text-sm font-black text-amber-400">
                          ₹{pkg.pricing.tripleSharing.toLocaleString('en-IN')}
                        </strong>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white/5">
                        <span className="text-[10px] text-slate-300 block">Double</span>
                        <strong className="text-xs sm:text-sm font-black text-amber-400">
                          ₹{pkg.pricing.doubleSharing.toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Inclusions highlights */}
                  <div className="space-y-1.5 text-xs text-slate-700 mb-4">
                    {pkg.inclusions.slice(0, 5).map((inc, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{inc}</span>
                      </div>
                    ))}
                  </div>

                  {/* Upcoming Departure Dates */}
                  <div className="p-3 bg-slate-100 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      Upcoming Departure Schedule:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pkg.departureDates.map((d) => (
                        <span key={d} className="px-2 py-0.5 rounded bg-white text-slate-800 text-[10px] font-semibold border border-slate-300">
                          {new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleWhatsAppInquiry(pkg)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => handleOpenBooking(pkg)}
                  className="flex-1 py-2 px-4 rounded-xl bg-[#0F1E36] hover:bg-[#1B3258] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>Book Package</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Umrah Inclusions Feature Grid */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl">
          <h3 className="text-xl font-bold text-[#0F1E36] font-display text-center mb-6">
            Standard Inclusions in All Al-Hera Umrah Tours
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-700">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-2xl">✈️</span>
              <h4 className="font-bold text-slate-900 text-sm">Direct Return Flights</h4>
              <p className="text-slate-600 leading-relaxed">
                Confirmed tickets with Saudi Airlines or premier carriers including 30kg check-in + 7kg hand baggage.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-2xl">🍛</span>
              <h4 className="font-bold text-slate-900 text-sm">Full Board Indian Catering</h4>
              <p className="text-slate-600 leading-relaxed">
                Delicious breakfast, lunch and dinner prepared fresh by experienced Indian chefs with tea service.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-2xl">🕋</span>
              <h4 className="font-bold text-slate-900 text-sm">Complete Historical Ziyarats</h4>
              <p className="text-slate-600 leading-relaxed">
                AC Luxury coaches guided by knowledgeable Islamic scholars visiting all significant sacred landmarks in Makkah & Madinah.
              </p>
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        <PublicUmrahBookingModal
          packageItem={selectedPackage}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          onSuccess={(booking) => {
            if (onBookingSuccess) onBookingSuccess(booking);
          }}
        />
      </div>
    </div>
  );
};
