import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  User,
  Phone,
  MapPin,
  Briefcase,
  FileText,
  DollarSign,
  Building2,
  Upload,
  Camera,
  Trash2,
  Paperclip,
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  FileCheck
} from 'lucide-react';
import { Candidate, CandidateStatus, JobVacancy, PartnerOffice } from '../../types';
import { getJobs, getPartners, getCandidates } from '../../lib/storage';
import { enrichAllJobsWithMetrics } from '../../lib/jobCalculations';

interface CandidateFormModalProps {
  candidate?: Candidate | null;
  candidateToEdit?: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (candidateData: Partial<Candidate>) => void;
  partners?: PartnerOffice[];
  jobs?: JobVacancy[];
}

interface UploadedDocItem {
  id: string;
  name: string;
  type: 'photo' | 'passport' | 'medical' | 'trade_certificate' | 'cv' | 'contract' | 'visa' | 'other';
  fileUrl: string;
  uploadedAt: string;
  size?: string;
}

export const CandidateFormModal: React.FC<CandidateFormModalProps> = ({
  candidate: propCandidate,
  candidateToEdit,
  isOpen,
  onClose,
  onSave,
  partners: propPartners,
  jobs: propJobs,
}) => {
  const activeCandidate = candidateToEdit || propCandidate || null;
  const [trackingId, setTrackingId] = useState('');
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1995-01-01');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [trade, setTrade] = useState('Electrician');
  const [experienceYears, setExperienceYears] = useState(3);
  const [education, setEducation] = useState('10th / 12th + ITI');
  const [jobId, setJobId] = useState('');
  const [partnerOfficeId, setPartnerOfficeId] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [visaNumber, setVisaNumber] = useState('');
  const [wakalaNumber, setWakalaNumber] = useState('');
  const [status, setStatus] = useState<CandidateStatus>('applied');
  const [packageFee, setPackageFee] = useState(65000);
  const [totalPaid, setTotalPaid] = useState(0);
  const [partnerCommission, setPartnerCommission] = useState(6000);
  const [remarks, setRemarks] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Documents state
  const [documents, setDocuments] = useState<UploadedDocItem[]>([]);
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState<UploadedDocItem['type']>('passport');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  const allCandidates = getCandidates();
  const rawJobs = propJobs || getJobs();
  const jobs = enrichAllJobsWithMetrics(rawJobs, allCandidates);
  const partners = propPartners || getPartners();

  useEffect(() => {
    if (activeCandidate) {
      setTrackingId(activeCandidate.trackingId || `AHT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setFullName(activeCandidate.fullName);
      setFatherName(activeCandidate.fatherName || '');
      setPassportNumber(activeCandidate.passportNumber);
      setPassportExpiry(activeCandidate.passportExpiry || '');
      setDateOfBirth(activeCandidate.dateOfBirth || '1995-01-01');
      setGender(activeCandidate.gender || 'Male');
      setPhoneNumber(activeCandidate.phoneNumber);
      setWhatsappNumber(activeCandidate.whatsappNumber || activeCandidate.phoneNumber);
      setEmail(activeCandidate.email || '');
      setCity(activeCandidate.city);
      setState(activeCandidate.state);
      setTrade(activeCandidate.trade);
      setExperienceYears(activeCandidate.experienceYears);
      setEducation(activeCandidate.education || '');
      setJobId(activeCandidate.jobId || '');
      setPartnerOfficeId(activeCandidate.partnerOfficeId || '');
      setSponsorName(activeCandidate.sponsorName || '');
      setVisaNumber(activeCandidate.visaNumber || '');
      setWakalaNumber(activeCandidate.wakalaNumber || '');
      setStatus(activeCandidate.status);
      setPackageFee(activeCandidate.packageFee);
      setTotalPaid(activeCandidate.totalPaid);
      setPartnerCommission(activeCandidate.partnerCommission || 6000);
      setRemarks(activeCandidate.remarks || '');
      setPhotoUrl(activeCandidate.photoUrl || '');
      setDocuments(activeCandidate.documents || []);
    } else {
      // Reset defaults for new candidate
      const newYear = new Date().getFullYear();
      setTrackingId(`AHT-${newYear}-${Math.floor(1000 + Math.random() * 9000)}`);
      setFullName('');
      setFatherName('');
      setPassportNumber('');
      setPassportExpiry('');
      setDateOfBirth('1995-01-01');
      setGender('Male');
      setPhoneNumber('');
      setWhatsappNumber('');
      setEmail('');
      setCity('');
      setState('');
      setTrade('Electrician');
      setExperienceYears(3);
      setEducation('10th / 12th + ITI');
      setJobId('');
      setPartnerOfficeId('');
      setSponsorName('');
      setVisaNumber('');
      setWakalaNumber('');
      setStatus('applied');
      setPackageFee(65000);
      setTotalPaid(0);
      setPartnerCommission(6000);
      setRemarks('');
      setPhotoUrl('');
      setDocuments([]);
    }
  }, [activeCandidate, isOpen]);

  if (!isOpen) return null;

  const handleJobSelect = (selectedId: string) => {
    setJobId(selectedId);
    const j = jobs.find((item) => item.id === selectedId);
    if (j) {
      setTrade(j.title);
      setSponsorName(j.companyName);
    }
  };

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Document Upload
  const handleDocFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDoc(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const sizeStr = file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

        const newDoc: UploadedDocItem = {
          id: 'doc-' + Date.now(),
          name: newDocName.trim() || file.name,
          type: newDocType,
          fileUrl: event.target.result as string,
          uploadedAt: new Date().toISOString(),
          size: sizeStr,
        };

        setDocuments((prev) => [...prev, newDoc]);
        setNewDocName('');
        setIsUploadingDoc(false);
        if (docInputRef.current) docInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDoc = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedPartner = partners.find((p) => p.id === partnerOfficeId);
    const selectedJob = jobs.find((j) => j.id === jobId);
    const finalTrackingId = trackingId.trim() || `AHT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const data: Partial<Candidate> = {
      ...(activeCandidate ? { id: activeCandidate.id } : { id: 'cand-' + Date.now() }),
      trackingId: finalTrackingId.toUpperCase(),
      fullName,
      fatherName,
      passportNumber: passportNumber.toUpperCase(),
      passportExpiry,
      dateOfBirth,
      gender,
      nationality: 'Indian',
      phoneNumber,
      whatsappNumber: whatsappNumber || phoneNumber,
      email,
      city,
      state,
      address: `${city}, ${state}`,
      trade,
      experienceYears: Number(experienceYears),
      education,
      jobId,
      jobTitle: selectedJob?.title || trade,
      sponsorName: sponsorName || selectedJob?.companyName,
      partnerOfficeId: partnerOfficeId || undefined,
      partnerOfficeName: selectedPartner?.agencyName,
      partnerCommission: Number(partnerCommission),
      visaNumber,
      wakalaNumber,
      status,
      statusHistory: activeCandidate?.statusHistory?.length ? activeCandidate.statusHistory : [
        {
          id: 'sth-' + Date.now(),
          status,
          timestamp: new Date().toISOString(),
          updatedBy: 'Admin Desk Entry',
          notes: 'Candidate registered in Al-Hera ERP system.',
        }
      ],
      packageFee: Number(packageFee),
      totalPaid: Number(totalPaid),
      balanceDue: Number(packageFee) - Number(totalPaid),
      paymentHistory: activeCandidate?.paymentHistory || [],
      remarks,
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      documents,
      createdAt: activeCandidate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-8 overflow-hidden animate-fade-in text-slate-900">
        {/* Header */}
        <div className="bg-[#0F1E36] p-6 text-white flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">
              Candidate Dossier & Document Portal
            </span>
            <h3 className="text-xl font-bold font-display text-white">
              {activeCandidate ? `Edit Candidate: ${activeCandidate.fullName}` : 'Register New Overseas Candidate'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
          {/* Tracking ID & Header Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                System Tracking ID
              </span>
              <p className="text-[11px] text-amber-950 font-medium">
                Used by candidate to track Saudi Visa, Medical, Wakala & Flight on the website.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                placeholder="AHT-2025-XXXX"
                className="font-mono font-bold text-xs bg-white border border-amber-300 px-3 py-1.5 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                required
              />
              <button
                type="button"
                onClick={() => setTrackingId(`AHT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`)}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold shadow-sm"
              >
                Regenerate
              </button>
            </div>
          </div>

          {/* Photo & Identity Section */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-amber-600" />
              1. Candidate Passport-Size Photograph
            </h4>

            <div className="flex flex-col sm:flex-row items-start gap-5">
              {/* Photo Preview Box */}
              <div className="w-32 h-40 rounded-xl border-2 border-dashed border-slate-300 bg-white overflow-hidden relative flex flex-col items-center justify-center shrink-0 shadow-inner group">
                {photoUrl ? (
                  <>
                    <img
                      src={photoUrl}
                      alt="Candidate Preview"
                      className="w-full h-full object-cover object-top"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow"
                      title="Remove Photo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-2 text-slate-400">
                    <User className="w-10 h-10 mx-auto mb-1 text-slate-300" />
                    <span className="text-[10px] block leading-tight font-medium">Passport Photo (White Background)</span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="space-y-3 flex-1">
                <input
                  type="file"
                  ref={photoInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upload Passport Photo</span>
                  </button>

                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="px-3 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Upload official white-background passport photograph (JPG/PNG). The photo will appear automatically on candidate bio-data, selection letters, and employment contracts.
                </p>

                {/* Preset Avatars for testing */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-600 block mb-1">Quick Sample Avatars:</span>
                  <div className="flex items-center gap-2">
                    {[
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
                    ].map((avatarUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPhotoUrl(avatarUrl)}
                        className="w-7 h-7 rounded-lg overflow-hidden border border-slate-300 hover:border-amber-500 transition-all"
                      >
                        <img src={avatarUrl} alt="Preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Particulars */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 border-b pb-2">
              <User className="w-4 h-4 text-amber-600" />
              2. Candidate Personal & Passport Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name (As in Passport) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mohammad"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Father's Name</label>
                <input
                  type="text"
                  placeholder="Father's Name"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Passport Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Z5891042"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  className="w-full text-xs font-mono uppercase tracking-wider border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Passport Expiry Date</label>
                <input
                  type="date"
                  value={passportExpiry}
                  onChange={(e) => setPassportExpiry(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Calling Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91-9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">WhatsApp Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91-9876543210"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">City / District</label>
                <input
                  type="text"
                  placeholder="e.g. Sikar / Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  placeholder="e.g. Rajasthan"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Trade, Job & Sponsor Information */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 border-b pb-2">
              <Briefcase className="w-4 h-4 text-amber-600" />
              3. Trade, Saudi Job Vacancy & Sponsor
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Link to Active Job Vacancy</label>
                <select
                  value={jobId}
                  onChange={(e) => handleJobSelect(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">-- Manual Trade Assignment --</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.jobCode} - {j.title} ({j.companyName}) — [{j.computedStatus || j.status || 'OPEN'} • {j.remainingCount ?? 0} Rem / {j.requiredCandidates ?? j.openingsCount ?? 1} Req]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trade / Designation *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Industrial Electrician"
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Saudi Sponsor / Company</label>
                <input
                  type="text"
                  placeholder="e.g. Al-Fanar Construction Co."
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Candidate Current Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CandidateStatus)}
                  className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-amber-50 text-amber-900"
                >
                  <option value="applied">1. Application Registered</option>
                  <option value="interview_scheduled">2. Trade Test / Interview Scheduled</option>
                  <option value="interview_selected">3. Client Interview Selected</option>
                  <option value="medical_in_progress">4. GAMCA Medical In Progress</option>
                  <option value="medical_fit">5. GAMCA Medical Fit</option>
                  <option value="wakala_issued">6. Saudi Wakala Allotted</option>
                  <option value="visa_stamped">7. Saudi Embassy Visa Stamped</option>
                  <option value="emigration_cleared">8. Emigration / Protector Cleared</option>
                  <option value="ticket_booked">9. Flight Ticket Booked</option>
                  <option value="deployed">10. Deployed in Saudi Arabia</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Wakala Ref No.</label>
                <input
                  type="text"
                  placeholder="e.g. WKL-2025-8891"
                  value={wakalaNumber}
                  onChange={(e) => setWakalaNumber(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Visa Number</label>
                <input
                  type="text"
                  placeholder="e.g. 1309874412"
                  value={visaNumber}
                  onChange={(e) => setVisaNumber(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Document Uploads Section */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-amber-600" />
                4. Candidate Verification Documents ({documents.length})
              </h4>
              <span className="text-[11px] text-slate-500">PDF, JPG, PNG up to 10MB</span>
            </div>

            {/* Document Uploader Bar */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-1/3">
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Document Category</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="passport">Passport Copy (Front & Back)</option>
                  <option value="medical">GAMCA Medical Report</option>
                  <option value="trade_certificate">Trade Test / ITI / Exp Certificate</option>
                  <option value="cv">Resume / CV</option>
                  <option value="visa">Saudi Visa / Wakala Slip</option>
                  <option value="other">Driving License / Other Document</option>
                </select>
              </div>

              <div className="w-full sm:w-1/3">
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Document Title / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Passport Front & Back Scan"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="w-full sm:w-1/3 flex items-end">
                <input
                  type="file"
                  ref={docInputRef}
                  onChange={handleDocFileUpload}
                  accept=".pdf,image/*,.doc,.docx"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-lg bg-[#0F1E36] hover:bg-[#1A3258] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Choose & Attach Document</span>
                </button>
              </div>
            </div>

            {/* List of Attached Documents */}
            {documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="font-bold text-slate-900 block truncate text-xs">
                          {doc.name}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                          {doc.type} • {doc.size || 'Attachment'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const w = window.open();
                          if (w) {
                            w.document.write(`<iframe src="${doc.fileUrl}" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        title="View Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic text-center py-2">
                No documents uploaded yet. You can attach Passport copies, Medical reports, and Trade certificates here.
              </p>
            )}
          </div>

          {/* Sub-Agent Partner & Financial Package */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 border-b pb-2">
              <DollarSign className="w-4 h-4 text-amber-600" />
              5. Sub-Agent Office & Package Financials (INR)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Referring Partner Office</label>
                <select
                  value={partnerOfficeId}
                  onChange={(e) => setPartnerOfficeId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">Direct / Head Office Walk-in</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.agencyName} ({p.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Service Package (INR)</label>
                <input
                  type="number"
                  min={0}
                  value={packageFee}
                  onChange={(e) => setPackageFee(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Paid So Far (INR)</label>
                <input
                  type="number"
                  min={0}
                  value={totalPaid}
                  onChange={(e) => setTotalPaid(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Partner Commission (INR)</label>
                <input
                  type="number"
                  min={0}
                  value={partnerCommission}
                  onChange={(e) => setPartnerCommission(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Internal Notes & Case Remarks</label>
            <textarea
              rows={2}
              placeholder="Case remarks, trade test marks, GCC license verification status..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="pt-4 border-t flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-white font-bold shadow-lg transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>{activeCandidate ? 'Update Candidate Record' : 'Save & Allocate Tracking ID'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
