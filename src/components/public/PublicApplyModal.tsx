import React, { useState, useRef } from 'react';
import { X, Send, CheckCircle2, Upload, User, Phone, MapPin, Briefcase, FileText, Camera, Paperclip, Trash2 } from 'lucide-react';
import { JobVacancy, Candidate, AgencyInfo } from '../../types';
import { getCandidates, saveCandidates, getAgencyInfo } from '../../lib/storage';
import { formatWhatsAppUrl, logSentMessage } from '../../lib/notifications';
import { insertCandidateDirectToSupabase, fetchCandidatesDirectFromSupabase } from '../../lib/supabase';
import { compressImage } from '../../lib/imageUtils';

interface PublicApplyModalProps {
  job: JobVacancy | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (candidate: Candidate) => void;
}

export const PublicApplyModal: React.FC<PublicApplyModalProps> = ({
  job,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1995-01-01');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [experienceYears, setExperienceYears] = useState(3);
  const [education, setEducation] = useState('10th / 12th Pass + ITI');
  const [remarks, setRemarks] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const agency = getAgencyInfo();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 400, 400, 0.82);
      setPhotoUrl(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setDocuments((prev) => [
          ...prev,
          {
            id: 'doc-' + Date.now(),
            name: file.name,
            type: 'passport',
            fileUrl: event.target.result as string,
            uploadedAt: new Date().toISOString(),
            size: `${Math.round(file.size / 1024)} KB`,
          }
        ]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const trackingId = `AHT-2025-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCandidate: Candidate = {
      id: 'cand-' + Date.now(),
      trackingId,
      fullName,
      fatherName,
      passportNumber: passportNumber.toUpperCase(),
      passportExpiry,
      dateOfBirth: dateOfBirth || '1995-01-01',
      gender: gender || 'Male',
      nationality: 'Indian',
      phoneNumber: phone,
      whatsappNumber: whatsapp || phone,
      email,
      address: `${city}, ${state}`,
      city,
      state,
      trade: job ? job.title : 'General Worker',
      experienceYears: Number(experienceYears),
      education,
      jobId: job?.id,
      jobTitle: job?.title,
      sponsorName: job?.companyName,
      status: 'applied',
      statusHistory: [
        {
          id: 'sth-' + Date.now(),
          status: 'applied',
          timestamp: new Date().toISOString(),
          updatedBy: 'Online Portal Application',
          notes: `Candidate applied online for ${job?.title || 'Overseas Vacancy'}.`,
        },
      ],
      packageFee: 60000,
      totalPaid: 0,
      balanceDue: 60000,
      paymentHistory: [],
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      documents,
      remarks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save directly to Supabase
    await insertCandidateDirectToSupabase(newCandidate);
    const refreshed = await fetchCandidatesDirectFromSupabase();
    if (refreshed.success && refreshed.candidates && refreshed.candidates.length > 0) {
      saveCandidates(refreshed.candidates);
    } else {
      const currentCandidates = getCandidates();
      saveCandidates([newCandidate, ...currentCandidates]);
    }

    // Send WhatsApp notification confirmation to candidate
    const confirmMsg = `Assalamu Alaikum *${fullName}*,\n\nThank you for applying with *AL-HERA TRAVELS* for *${job?.title || 'Overseas Vacancy'}* in Saudi Arabia.\n\n📌 *Your Tracking ID:* ${trackingId}\n🔢 *Passport Number:* ${passportNumber.toUpperCase()}\n\nOur recruitment desk will review your credentials and contact you for client interview scheduling.\n📞 Contact: ${agency.phone}`;
    
    // Log message
    logSentMessage(fullName, whatsapp || phone, 'whatsapp', confirmMsg, 'Online Registration Confirmation', trackingId);

    setIsSubmitting(false);
    onSuccess(newCandidate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full my-8 overflow-hidden animate-fade-in text-slate-900">
        {/* Modal Header */}
        <div className="bg-[#0F1E36] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">
            Online Candidate Application
          </span>
          <h3 className="text-xl font-bold font-display text-white">
            {job ? `Apply for ${job.title}` : 'Submit Your Candidate Profile'}
          </h3>
          {job && (
            <p className="text-xs text-slate-300 mt-1">
              {job.companyName} • {job.city}, Saudi Arabia • Salary: {job.salaryMin} - {job.salaryMax} {job.currency}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Photo & Passport upload */}
          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="w-16 h-20 rounded-lg bg-white border border-slate-300 overflow-hidden flex items-center justify-center relative shrink-0">
              {photoUrl ? (
                <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-slate-300" />
              )}
            </div>
            <div className="space-y-1 flex-1">
              <span className="font-bold text-slate-800 text-xs block">Candidate Passport Photo</span>
              <p className="text-[10px] text-slate-500">Upload passport size photo (white background)</p>
              <input
                type="file"
                ref={photoInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="px-3 py-1 bg-[#0F1E36] hover:bg-[#1A3258] text-white rounded-md text-[11px] font-bold inline-flex items-center gap-1.5"
              >
                <Camera className="w-3 h-3 text-amber-400" />
                <span>Upload Photo</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Candidate Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="As per Passport (e.g. Mohammad Tariq)"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Father's Name
              </label>
              <input
                type="text"
                placeholder="Father's full name"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Passport Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Z5891042"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                className="w-full text-xs uppercase font-mono tracking-wider border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Passport Expiry Date
              </label>
              <input
                type="date"
                value={passportExpiry}
                onChange={(e) => setPassportExpiry(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Gender
              </label>
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

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Calling Mobile Phone *
              </label>
              <input
                type="tel"
                required
                placeholder="+91-9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                WhatsApp Number *
              </label>
              <input
                type="tel"
                required
                placeholder="+91-9876543210"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                City / District
              </label>
              <input
                type="text"
                placeholder="e.g. Sikar / Jaipur / Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                State
              </label>
              <input
                type="text"
                placeholder="e.g. Rajasthan / Maharashtra / UP"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Years of Experience
              </label>
              <select
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value={1}>1 Year Experience</option>
                <option value={2}>2 Years Experience</option>
                <option value={3}>3+ Years (Gulf/Indian)</option>
                <option value={5}>5+ Years Experienced</option>
                <option value={8}>8+ Years Senior/Foreman</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Education / Trade Certificate
              </label>
              <input
                type="text"
                placeholder="e.g. ITI Electrician / 10th / Diploma"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Attach Document */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Attach Passport Copy / Resume (Optional)</label>
            <input
              type="file"
              ref={docInputRef}
              onChange={handleDocUpload}
              accept=".pdf,image/*,.doc,.docx"
              className="hidden"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Upload Passport / CV Scan</span>
              </button>
              {documents.length > 0 && (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {documents.length} File(s) attached
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Previous Gulf Experience / Remarks
            </label>
            <textarea
              rows={2}
              placeholder="Mention if you hold valid Saudi Driving License, GCC experience or specific machine/tool skills..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              By submitting, your profile will be registered with an instant <strong>Al-Hera Tracking ID</strong>. You will receive updates directly on your WhatsApp number.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-[#0F1E36] hover:bg-[#1B3258] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs"
          >
            <Send className="w-4 h-4 text-amber-400" />
            <span>{isSubmitting ? 'Registering Application...' : 'Submit Application & Generate Tracking ID'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
