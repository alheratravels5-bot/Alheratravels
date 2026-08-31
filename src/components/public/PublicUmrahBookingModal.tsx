import React, { useState } from 'react';
import { X, Send, Moon, Users, Phone, Calendar, CheckCircle2, ShieldCheck } from 'lucide-react';
import { UmrahPackage, UmrahBooking } from '../../types';
import { getUmrahBookings, saveUmrahBookings, getAgencyInfo } from '../../lib/storage';
import { logSentMessage } from '../../lib/notifications';

interface PublicUmrahBookingModalProps {
  packageItem?: UmrahPackage | null;
  pkg?: UmrahPackage | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (booking: UmrahBooking) => void;
  agencyInfo?: any;
}

export const PublicUmrahBookingModal: React.FC<PublicUmrahBookingModalProps> = ({
  packageItem: propPackageItem,
  pkg,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const activePackage = pkg || propPackageItem || null;
  const [leadName, setLeadName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [totalPilgrims, setTotalPilgrims] = useState(2);
  const [roomSharing, setRoomSharing] = useState<'Quad' | 'Triple' | 'Double' | 'Single'>('Quad');
  const [preferredDate, setPreferredDate] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen || !activePackage) return null;

  const agency = getAgencyInfo();

  let pricePerPerson = activePackage.pricing.quadSharing;
  if (roomSharing === 'Triple') pricePerPerson = activePackage.pricing.tripleSharing;
  if (roomSharing === 'Double') pricePerPerson = activePackage.pricing.doubleSharing;
  if (roomSharing === 'Single') pricePerPerson = activePackage.pricing.singleSharing || activePackage.pricing.doubleSharing * 1.5;

  const calculatedTotal = pricePerPerson * totalPilgrims;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const bookingCode = `AHT-UB-2025-${Math.floor(100 + Math.random() * 900)}`;

    const newBooking: UmrahBooking = {
      id: 'ub-' + Date.now(),
      bookingCode,
      packageId: activePackage.id,
      packageName: activePackage.name,
      leadPilgrimName: leadName,
      contactPhone: phone,
      whatsappNumber: whatsapp || phone,
      email,
      totalPilgrims: Number(totalPilgrims),
      pilgrims: [
        {
          fullName: leadName,
          passportNumber: '',
          age: 40,
          gender: 'Male',
          relation: 'Self',
        },
      ],
      preferredTravelDate: preferredDate || activePackage.departureDates[0] || '2025-10-15',
      roomSharing,
      totalAmount: calculatedTotal,
      paidAmount: 0,
      status: 'inquiry',
      notes,
      createdAt: new Date().toISOString(),
    };

    const bookings = getUmrahBookings();
    saveUmrahBookings([newBooking, ...bookings]);

    // Send WhatsApp notification
    const msg = `Assalamu Alaikum *${leadName}*,\n\nWe have received your Umrah Booking Request for *${activePackage.name}*.\n\n🕋 *Booking Ref:* ${bookingCode}\n👥 *Pilgrims:* ${totalPilgrims} Person(s)\n🏨 *Sharing Type:* ${roomSharing} Sharing\n💵 *Estimated Package:* INR ${calculatedTotal.toLocaleString('en-IN')}\n\nOur Umrah Tour Officer will contact you to collect passport copies and confirm your travel seats.\n📞 Al-Hera Helpline: ${agency.phone}`;
    
    logSentMessage(leadName, whatsapp || phone, 'whatsapp', msg, 'Umrah Booking Request', bookingCode);

    if (onSuccess) {
      onSuccess(newBooking);
    } else {
      alert(`JazakAllah Khair ${leadName}! Your Umrah booking inquiry (${bookingCode}) has been registered.`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full my-8 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-[#0F1E36] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <Moon className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Spiritual Journey Reservation
            </span>
          </div>
          <h3 className="text-xl font-bold font-display text-white">{activePackage.name}</h3>
          <p className="text-xs text-slate-300 mt-1">
            {activePackage.durationDays} Days • {activePackage.makkahHotel} & {activePackage.madinahHotel}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lead Pilgrim Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Haji Mohammad Farooq"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Calling Phone *
              </label>
              <input
                type="tel"
                required
                placeholder="+91-9214635385"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                WhatsApp Number *
              </label>
              <input
                type="tel"
                required
                placeholder="+91-9214635385"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="pilgrim@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total Pilgrims (Adults + Children)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={totalPilgrims}
                onChange={(e) => setTotalPilgrims(Number(e.target.value))}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Room Sharing Preference
              </label>
              <select
                value={roomSharing}
                onChange={(e) => setRoomSharing(e.target.value as any)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="Quad">Quad Sharing (4 in 1 Room) - ₹{activePackage.pricing.quadSharing.toLocaleString('en-IN')}</option>
                <option value="Triple">Triple Sharing (3 in 1 Room) - ₹{activePackage.pricing.tripleSharing.toLocaleString('en-IN')}</option>
                <option value="Double">Double / Twin Sharing (2 in 1 Room) - ₹{activePackage.pricing.doubleSharing.toLocaleString('en-IN')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Group Departure Date
            </label>
            <select
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="">Select departure schedule...</option>
              {activePackage.departureDates.map((d) => (
                <option key={d} value={d}>
                  Group Departure on {new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Special Requests (Wheelchair assistance, Indian food preference, etc.)
            </label>
            <textarea
              rows={2}
              placeholder="Any special assistance required for elderly pilgrims..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            ></textarea>
          </div>

          {/* Pricing Estimation Card */}
          <div className="p-4 bg-slate-900 text-white rounded-xl border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-300 block">Total Estimated Cost:</span>
              <p className="text-lg font-black text-amber-400 font-display">
                INR {calculatedTotal.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400">
                ({totalPilgrims} Pilgrims × ₹{pricePerPerson.toLocaleString('en-IN')} / {roomSharing} Sharing)
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold uppercase">
                All-Inclusive
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Send className="w-4 h-4" />
            <span>Confirm Umrah Inquiry & Get Booking Code</span>
          </button>
        </form>
      </div>
    </div>
  );
};
