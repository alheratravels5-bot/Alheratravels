import React, { useState } from 'react';
import {
  X,
  Plus,
  Building2,
  Ticket,
  Calendar,
  DollarSign,
  FileText,
  Layers,
  MapPin,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { PartnerOffice, VisaBatch } from '../../../types';
import { addVisaBatchWithIndividualVisas } from '../../../lib/storage';

interface ReceiveVisaBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner?: PartnerOffice | null;
  allPartners: PartnerOffice[];
  onBatchAdded: (batch: VisaBatch) => void;
}

const COMMON_SAUDI_TRADES = [
  'General Trade / Helper',
  'Electrician (Building / Industrial)',
  'Plumber & Pipe Fitter',
  'Mason (Tile / Block / Plaster)',
  'Steel Fixer & Shuttering Carpenter',
  'Heavy / Light Duty Driver',
  'HVAC & AC Technician',
  'Structural Welder (6G / TIG / ARC)',
  'Catering & Kitchen Staff',
  'Security Guard & Facilities Staff',
  'Storekeeper & Warehouse Associate',
  'Civil Site Supervisor',
];

const SAUDI_CITIES = [
  'Riyadh Mega Projects',
  'Jeddah Commercial & Port',
  'Dammam & Khobar Eastern Province',
  'NEOM & Red Sea Projects',
  'Makkah & Madinah Holy Sites',
  'Jubail Industrial City',
  'Tabuk & Yanbu Zone',
  'Al-Ahsa & Hofuf Oasis',
  'Abha, Khamis Mushait & Asir',
  'Al-Qassim (Buraidah / Unaizah)',
  'Jizan Economic City',
  'Hail & Northern Region',
  'Najran & Southern Border',
  'Taif & Western Province',
];

export const ReceiveVisaBatchModal: React.FC<ReceiveVisaBatchModalProps> = ({
  isOpen,
  onClose,
  partner,
  allPartners,
  onBatchAdded,
}) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(partner?.id || allPartners[0]?.id || '');
  const [jobTitle, setJobTitle] = useState<string>('Electrician (Building / Industrial)');
  const [customJobTitle, setCustomJobTitle] = useState<string>('');
  const [sectorCity, setSectorCity] = useState<string>('Riyadh Mega Projects');
  const [customSectorCity, setCustomSectorCity] = useState<string>('');
  const [isCustomSectorMode, setIsCustomSectorMode] = useState<boolean>(false);
  const [visaType, setVisaType] = useState<string>('Employment Work Visa (1-2 Years)');
  const [totalVisas, setTotalVisas] = useState<number>(10);
  const [amountPerVisa, setAmountPerVisa] = useState<number>(35000);
  const [dateReceived, setDateReceived] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState<string>(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customVisaPrefix, setCustomVisaPrefix] = useState<string>('SAUDI-');
  const [customVisaNumbersInput, setCustomVisaNumbersInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const currentPartner = partner || allPartners.find((p) => p.id === selectedPartnerId);
  const totalAmount = totalVisas * amountPerVisa;
  const effectiveJobTitle = jobTitle === 'Other' ? (customJobTitle.trim() || 'General Trade') : jobTitle;
  const effectiveSectorCity = (isCustomSectorMode || sectorCity === 'Other')
    ? (customSectorCity.trim() || 'Saudi Arabia')
    : sectorCity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPartnerId && !partner?.id) {
      alert('Please select a Partner Office.');
      return;
    }

    if (jobTitle === 'Other' && !customJobTitle.trim()) {
      alert('Please specify the custom job trade / category name.');
      return;
    }

    if ((isCustomSectorMode || sectorCity === 'Other') && !customSectorCity.trim()) {
      alert('Please enter the custom Saudi city or region sector name.');
      return;
    }

    const customNumbers = customVisaNumbersInput
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const partnerName = currentPartner?.agencyName || 'Partner Office';

    const result = addVisaBatchWithIndividualVisas(
      {
        partnerOfficeId: partner?.id || selectedPartnerId,
        partnerOfficeName: partnerName,
        jobTitle: effectiveJobTitle,
        sectorCity: effectiveSectorCity,
        visaType,
        totalVisas: Number(totalVisas),
        amountPerVisa: Number(amountPerVisa),
        dateReceived,
        expiryDate,
        notes,
      },
      customNumbers.length > 0 ? customNumbers : undefined
    );

    onBatchAdded(result.batch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden animate-fade-in text-slate-900">
        {/* Header */}
        <div className="bg-[#0F1E36] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                Visa Inventory Management
              </span>
              <h3 className="text-lg font-bold font-display text-white">
                Receive Saudi Visa Batch from Partner Office
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
          {/* Partner Selector */}
          {!partner && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Source Partner Office *
              </label>
              <div className="relative">
                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  required
                  className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">Select Partner Office</option>
                  {allPartners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.agencyName} ({p.partnerCode || 'PTR'}) - {p.city}, {p.state}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {partner && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-700" />
                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">Partner Office</span>
                  <strong className="text-slate-900 text-xs">{partner.agencyName}</strong>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                {partner.partnerCode}
              </span>
            </div>
          )}

          {/* Visa Category & Sector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">
                  Job Trade / Category *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (jobTitle === 'Other') {
                      setJobTitle(COMMON_SAUDI_TRADES[0]);
                    } else {
                      setJobTitle('Other');
                    }
                  }}
                  className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 hover:underline"
                >
                  {jobTitle === 'Other' ? '← Select from list' : '+ Custom Trade'}
                </button>
              </div>
              <select
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {COMMON_SAUDI_TRADES.map((trade) => (
                  <option key={trade} value={trade}>
                    {trade}
                  </option>
                ))}
                <option value="Other">+ Other (Specify Custom Trade)</option>
              </select>
              {jobTitle === 'Other' && (
                <input
                  type="text"
                  placeholder="Specify custom trade name (e.g. Heavy Equipment Mechanic)"
                  value={customJobTitle}
                  onChange={(e) => setCustomJobTitle(e.target.value)}
                  className="w-full text-xs border border-amber-300 bg-amber-50/50 rounded-xl p-2.5 mt-2 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                  required
                  autoFocus
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">
                  Saudi City / Region Sector *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const nextMode = !isCustomSectorMode;
                    setIsCustomSectorMode(nextMode);
                    if (nextMode) {
                      setSectorCity('Other');
                    } else {
                      setSectorCity(SAUDI_CITIES[0]);
                    }
                  }}
                  className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 hover:underline"
                >
                  {isCustomSectorMode || sectorCity === 'Other' ? '← Select from list' : '+ Enter Manually'}
                </button>
              </div>

              {!isCustomSectorMode && sectorCity !== 'Other' ? (
                <select
                  value={sectorCity}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSectorCity(val);
                    if (val === 'Other') {
                      setIsCustomSectorMode(true);
                    }
                  }}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {SAUDI_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                  <option value="Other">+ Other (Enter Custom City / Sector Manually)</option>
                </select>
              ) : (
                <div>
                  <input
                    type="text"
                    placeholder="Enter custom city/sector (e.g. Al-Khobar, Yanbu Industrial, Taif...)"
                    value={customSectorCity}
                    onChange={(e) => setCustomSectorCity(e.target.value)}
                    className="w-full text-xs border border-amber-300 bg-amber-50/50 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium text-slate-900"
                    required
                    autoFocus
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Enter any Saudi municipality, project zone (e.g. NEOM Sindalah, Al-Ula, Yanbu, Jubail), or region.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Visa Type & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Visa Category Type
              </label>
              <select
                value={visaType}
                onChange={(e) => setVisaType(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="Employment Work Visa (1-2 Years)">Employment Work Visa</option>
                <option value="Temporary Commercial Work Visa">Temporary Commercial Visa</option>
                <option value="Free / Open Trade Visa">Free / Open Trade Visa</option>
                <option value="House Driver / Domestic Worker">Domestic / House Worker</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Quantity of Visas *
              </label>
              <input
                type="number"
                min="1"
                max="500"
                required
                value={totalVisas}
                onChange={(e) => setTotalVisas(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Amount Per Visa (INR) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={amountPerVisa}
                onChange={(e) => setAmountPerVisa(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full text-xs font-bold text-emerald-800 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Financial Calculation Banner */}
          <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                Total Batch Inventory Value
              </span>
              <div className="text-xl font-extrabold text-white">
                ₹{totalAmount.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-slate-400">
                {totalVisas} Visas × ₹{amountPerVisa.toLocaleString('en-IN')} each
              </span>
            </div>
            <div className="text-left sm:text-right text-[11px] text-slate-300 bg-white/10 px-3 py-2 rounded-lg">
              <span className="block font-medium">Automatic Provisioning:</span>
              <strong className="text-amber-300">{totalVisas} unique individual visa records</strong> will be generated.
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Date Received *</label>
              <input
                type="date"
                required
                value={dateReceived}
                onChange={(e) => setDateReceived(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Visa Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Custom Visa Numbers Optional */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Visa Numbers / ID (Optional - Auto-generated if left blank)
            </label>
            <textarea
              rows={2}
              placeholder="Paste comma or newline separated official Saudi visa numbers (e.g. 1309876251, 1309876252...)"
              value={customVisaNumbersInput}
              onChange={(e) => setCustomVisaNumbersInput(e.target.value)}
              className="w-full text-xs font-mono border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Notes & Agreement Remarks</label>
            <input
              type="text"
              placeholder="e.g. Received via WhatsApp copy, Wakala letter issued by Riyadh Sponsor"
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
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Generate {totalVisas} Visas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
