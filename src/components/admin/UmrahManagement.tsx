import React, { useState } from 'react';
import {
  Moon,
  Plus,
  Edit2,
  Trash2,
  Users,
  Calendar,
  DollarSign,
  MapPin,
  X,
  Save,
  CheckCircle2,
  Phone
} from 'lucide-react';
import { UmrahPackage, UmrahBooking, AgencyInfo } from '../../types';
import { getUmrahBookings, saveUmrahBookings, getAgencyInfo } from '../../lib/storage';

interface UmrahManagementProps {
  packages: UmrahPackage[];
  onSavePackage: (pkg: UmrahPackage) => void;
  onDeletePackage: (packageId: string) => void;
  agencyInfo?: AgencyInfo;
}

export const UmrahManagement: React.FC<UmrahManagementProps> = ({
  packages,
  onSavePackage,
  onDeletePackage,
  agencyInfo: propAgency,
}) => {
  const [activeTab, setActiveTab] = useState<'packages' | 'bookings'>('packages');
  const [bookings, setBookings] = useState<UmrahBooking[]>(getUmrahBookings());
  const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<UmrahPackage | null>(null);

  // Form
  const [name, setName] = useState('');
  const [durationDays, setDurationDays] = useState(15);
  const [makkahHotel, setMakkahHotel] = useState('Swissôtel Al Maqam (Clock Tower)');
  const [makkahDistance, setMakkahDistance] = useState('0 Meters (Facing Haram)');
  const [madinahHotel, setMadinahHotel] = useState('Anwar Al Madinah Mövenpick');
  const [madinahDistance, setMadinahDistance] = useState('50 Meters to Gate 17');
  const [quadPrice, setQuadPrice] = useState(85000);
  const [triplePrice, setTriplePrice] = useState(95000);
  const [doublePrice, setDoublePrice] = useState(110000);
  const [badge, setBadge] = useState('VIP 5-Star');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&auto=format&fit=crop&q=80');

  const agency = propAgency || getAgencyInfo();

  const handleOpenNew = () => {
    setEditingPkg(null);
    setName('15 Days VIP Deluxe Umrah');
    setDurationDays(15);
    setMakkahHotel('Pullman ZamZam Makkah');
    setMakkahDistance('50 Meters');
    setMadinahHotel('Dar Al Taqwa Madinah');
    setMadinahDistance('30 Meters');
    setQuadPrice(88000);
    setTriplePrice(98000);
    setDoublePrice(115000);
    setBadge('Direct Flights');
    setImageUrl('https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&auto=format&fit=crop&q=80');
    setIsPkgModalOpen(true);
  };

  const handleOpenEdit = (pkg: UmrahPackage) => {
    setEditingPkg(pkg);
    setName(pkg.name);
    setDurationDays(pkg.durationDays);
    setMakkahHotel(pkg.makkahHotel);
    setMakkahDistance(pkg.makkahDistance);
    setMadinahHotel(pkg.madinahHotel);
    setMadinahDistance(pkg.madinahDistance);
    setQuadPrice(pkg.pricing.quadSharing);
    setTriplePrice(pkg.pricing.tripleSharing);
    setDoublePrice(pkg.pricing.doubleSharing);
    setBadge(pkg.badge || '');
    setImageUrl(pkg.imageUrl);
    setIsPkgModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pkg: UmrahPackage = {
      id: editingPkg?.id || 'umrah-' + Date.now(),
      packageCode: editingPkg?.packageCode || `UMR-2025-${Math.floor(10 + Math.random() * 90)}`,
      name,
      durationDays: Number(durationDays),
      packageType: '4-Star Premium',
      makkahHotel,
      makkahDistance,
      madinahHotel,
      madinahDistance,
      pricing: {
        quadSharing: Number(quadPrice),
        tripleSharing: Number(triplePrice),
        doubleSharing: Number(doublePrice),
        currency: 'INR',
      },
      inclusions: [
        'Direct Return Flights (Saudi Airlines)',
        'Umrah eVisa with Full Medical Insurance',
        'Daily Indian Buffet (Breakfast, Lunch & Dinner)',
        'Air-conditioned VIP Coach Transfers',
        'Historical Makkah & Madinah Ziyarat',
        '5 Litres Sealed Zamzam Water Canister',
        'Al-Hera Pilgrim Welcome Kit & Scholars Guidance',
      ],
      departureDates: ['2025-10-15', '2025-11-05', '2025-12-10'],
      badge,
      imageUrl,
      isActive: true,
      createdAt: editingPkg?.createdAt || new Date().toISOString(),
    };

    onSavePackage(pkg);
    setIsPkgModalOpen(false);
  };

  const handleUpdateBookingStatus = (bookingId: string, newStatus: UmrahBooking['status']) => {
    const updated = bookings.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b));
    setBookings(updated);
    saveUmrahBookings(updated);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0F1E36] font-display">
            Umrah Packages & Pilgrim Reservations
          </h2>
          <p className="text-xs text-slate-500">
            Manage packages, hotel inventory distances, pricing tiers, and client reservation inquiries.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-amber-300 font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Umrah Package</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('packages')}
          className={`py-3 px-4 border-b-2 transition-all ${
            activeTab === 'packages'
              ? 'border-purple-600 text-purple-900 bg-purple-50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Active Umrah Packages ({packages.length})
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`py-3 px-4 border-b-2 transition-all ${
            activeTab === 'bookings'
              ? 'border-purple-600 text-purple-900 bg-purple-50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Pilgrim Inquiries & Bookings ({bookings.length})
        </button>
      </div>

      {/* Tab 1: Packages */}
      {activeTab === 'packages' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative h-40 bg-slate-900">
                  <img
                    src={pkg.imageUrl}
                    alt={pkg.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500 text-slate-950">
                      {pkg.badge || `${pkg.durationDays} Days`}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2 text-xs">
                  <h3 className="font-bold text-base text-[#0F1E36] font-display">{pkg.name}</h3>
                  <p className="text-slate-600">
                    <strong className="text-slate-900">Makkah:</strong> {pkg.makkahHotel} ({pkg.makkahDistance})
                  </p>
                  <p className="text-slate-600">
                    <strong className="text-slate-900">Madinah:</strong> {pkg.madinahHotel} ({pkg.madinahDistance})
                  </p>

                  <div className="pt-2 border-t flex justify-between font-bold">
                    <span className="text-slate-500">Quad: ₹{(Number(pkg?.pricing?.quadSharing) || 0).toLocaleString('en-IN')}</span>
                    <span className="text-purple-900">Dbl: ₹{(Number(pkg?.pricing?.doubleSharing) || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(pkg)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete package "${pkg.name}"?`)) onDeletePackage(pkg.id);
                  }}
                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Bookings */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F1E36] text-white font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Booking Ref</th>
                  <th className="py-3.5 px-4">Pilgrim Name</th>
                  <th className="py-3.5 px-4">Package</th>
                  <th className="py-3.5 px-4">Pilgrims</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(Array.isArray(bookings) ? bookings : []).map((b) => {
                  const cleanWa = (b?.whatsappNumber || '').replace(/[^0-9]/g, '');
                  return (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-900">{b.bookingCode || 'UMR-BKG'}</td>
                      <td className="py-3.5 px-4">
                        <strong className="font-bold text-slate-900 block">{b.leadPilgrimName}</strong>
                        <span className="text-slate-500 font-mono text-[11px]">{b.whatsappNumber}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{b.packageName}</td>
                      <td className="py-3.5 px-4 text-slate-800">{b.totalPilgrims} Person(s)</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">₹{(Number(b.totalAmount) || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4">
                        <select
                          value={b.status}
                          onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value as any)}
                          className="text-[10px] font-bold border border-slate-300 rounded px-2 py-1"
                        >
                          <option value="inquiry">Inquiry</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="visa_processed">Visa Processed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={`https://wa.me/${cleanWa}?text=Assalamu%20Alaikum%20${encodeURIComponent(b.leadPilgrimName || '')}%2C%20regarding%20Umrah%20Booking%20${b.bookingCode || ''}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-600 text-white inline-flex items-center gap-1 text-[10px] font-bold"
                        >
                          <Phone className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Package Form Modal */}
      {isPkgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 my-8 animate-fade-in text-xs">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-base text-[#0F1E36]">
                {editingPkg ? 'Edit Umrah Package' : 'Create New Umrah Package'}
              </h3>
              <button onClick={() => setIsPkgModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Package Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Highlight Badge</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Makkah Hotel</label>
                  <input
                    type="text"
                    value={makkahHotel}
                    onChange={(e) => setMakkahHotel(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Makkah Distance</label>
                  <input
                    type="text"
                    value={makkahDistance}
                    onChange={(e) => setMakkahDistance(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Madinah Hotel</label>
                  <input
                    type="text"
                    value={madinahHotel}
                    onChange={(e) => setMadinahHotel(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Madinah Distance</label>
                  <input
                    type="text"
                    value={madinahDistance}
                    onChange={(e) => setMadinahDistance(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quad (₹)</label>
                  <input
                    type="number"
                    value={quadPrice}
                    onChange={(e) => setQuadPrice(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Triple (₹)</label>
                  <input
                    type="number"
                    value={triplePrice}
                    onChange={(e) => setTriplePrice(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Double (₹)</label>
                  <input
                    type="number"
                    value={doublePrice}
                    onChange={(e) => setDoublePrice(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPkgModalOpen(false)}
                  className="px-4 py-2 rounded-lg border text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#0F1E36] text-white font-bold"
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
