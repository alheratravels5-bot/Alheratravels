export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'agency_admin'
  | 'staff'
  | 'operations_staff'
  | 'accounts'
  | 'accountant'
  | 'partner'
  | 'partner_agent';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  passwordHash?: string;
  passwordSalt?: string;
  partnerAgencyId?: string;
  avatar?: string;
  permissions: string[];
  createdAt: string;
  lastLoginAt?: string;
}

export type CandidateStatus =
  | 'applied'
  | 'interview_scheduled'
  | 'interview_selected'
  | 'medical_in_progress'
  | 'medical_fit'
  | 'wakala_issued'
  | 'visa_stamped'
  | 'emigration_cleared'
  | 'ticket_booked'
  | 'deployed'
  | 'rejected';

export interface StatusTimelineEvent {
  id: string;
  status: CandidateStatus;
  timestamp: string;
  updatedBy: string;
  notes: string;
  location?: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  paymentDate?: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Online' | string;
  paymentMode?: string;
  receiptNumber: string;
  note?: string;
  remarks?: string;
  receivedBy: string;
  candidateId?: string;
  transactionReference?: string;
}

export interface FlightDetails {
  airline: string;
  flightNumber: string;
  ticketNumber?: string;
  departureDate: string;
  departureTime?: string;
  departureCity: string;
  arrivalCity: string;
  pnr: string;
  seatNumber?: string;
}

export interface Candidate {
  id: string;
  trackingId: string; // e.g. AHT-2025-8812
  fullName: string;
  fatherName?: string;
  passportNumber: string;
  passportExpiry: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  nationality: string;
  phoneNumber: string;
  whatsappNumber: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  
  // Job & Trade Details
  trade: string; // e.g. Electrician, Heavy Driver
  experienceYears: number;
  education?: string;
  jobId?: string; // linked Job
  jobTitle?: string;
  sponsorName?: string; // Saudi Sponsor / Company
  visaCategory?: string; // e.g. Work Visa / Employment Visa
  visaNumber?: string;
  mofaNumber?: string;
  idNumber?: string; // Iqama / Application ID
  wakalaNumber?: string;
  
  // Status & Tracking
  status: CandidateStatus;
  statusHistory: StatusTimelineEvent[];
  flightDetails?: FlightDetails;
  
  // Partner / Sub-agent & Visa Link
  partnerAgentId?: string;
  partnerAgentName?: string;
  partnerOfficeId?: string;
  partnerOfficeName?: string;
  visaId?: string; // e.g. VISA-2026-0001
  visaBatchId?: string; // e.g. VB-2025-001
  visaAmount?: number; // Partner Office visa cost
  alHeraCommission?: number; // Agency commission
  partnerPayableAmount?: number; // Net payable to partner office
  agentCommission?: number;
  partnerCommission?: number;
  agentCommissionStatus?: 'pending' | 'partial' | 'paid';
  
  // Financials
  packageFee: number;
  totalPaid: number;
  balanceDue: number;
  paymentHistory: PaymentRecord[];
  
  // Documents & Media (URLs / base64)
  photoUrl?: string;
  passportScanUrl?: string;
  medicalReportUrl?: string;
  tradeCertificateUrl?: string;
  cvUrl?: string;
  contractUrl?: string;
  contractGeneratedAt?: string;
  contractNumber?: string;
  documents?: {
    id: string;
    name: string;
    type: 'photo' | 'passport' | 'medical' | 'trade_certificate' | 'cv' | 'contract' | 'visa' | 'other';
    fileUrl: string;
    uploadedAt: string;
    size?: string;
  }[];
  
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export type JobStatusType = 'OPEN' | 'IN_PROGRESS' | 'FULL' | 'CLOSED' | 'CANCELLED';

export interface JobStatusHistoryEvent {
  id: string;
  status: JobStatusType | 'REOPENED' | 'CREATED';
  timestamp: string;
  changedBy: string;
  notes?: string;
  countsSnapshot?: {
    required: number;
    applied: number;
    selected: number;
    assigned: number;
    remaining: number;
  };
}

export interface JobVacancy {
  id: string;
  jobCode: string; // e.g. AHT-SAUD-00125 or AHT-SAU-2025-104
  title: string;
  country: string; // Saudi Arabia, UAE, Qatar, Oman, Kuwait, Bahrain
  city: string; // Riyadh, Jeddah, Dammam, etc. / Sector
  sectorLocation?: string; // Optional detailed sector/location
  category: string; // Technical, Construction, Hospitality, Driving, Healthcare, General
  companyName: string;
  partnerOfficeId?: string;
  partnerOfficeName?: string;
  openingsCount: number; // Required candidates / Vacancy quantity
  requiredCandidates?: number; // Alias for openingsCount
  salaryMin: number;
  salaryMax: number;
  currency: string; // SAR, AED, INR, USD
  dutyHours: string; // e.g. "8 Hours + Overtime"
  contractPeriod: string; // e.g. "2 Years (Renewable)"
  ageLimit: string; // e.g. "21 - 40 Years"
  experienceRequired: string; // e.g. "2+ Years Gulf / Indian Experience"
  foodProvided: boolean;
  accommodationProvided: boolean;
  transportProvided: boolean;
  medicalInsurance: boolean;
  tradeTestRequired?: boolean;
  interviewDate?: string;
  interviewVenue?: string;
  description?: string;
  requirements?: string[];
  benefits?: string[];
  status: 'active' | 'closed' | 'urgent' | JobStatusType | string;
  computedStatus?: JobStatusType;
  isManuallyClosed?: boolean;
  closedAt?: string;
  closedBy?: string;
  isCancelled?: boolean;
  cancelledAt?: string;
  cancelledBy?: string;
  statusHistory?: JobStatusHistoryEvent[];
  
  // Real-time calculated metrics
  appliedCount?: number;
  selectedCount?: number;
  assignedCount?: number;
  remainingCount?: number;

  posterTheme?: 'navy_gold' | 'royal_emerald' | 'crimson_gold' | 'dark_luxury';
  deadline?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UmrahPackage {
  id: string;
  packageCode: string; // e.g. AHT-UMR-15D
  name: string;
  durationDays: number;
  packageType?: 'Economy' | '3-Star Standard' | '4-Star Premium' | '5-Star Luxury VIP' | 'Ramadan Special' | string;
  makkahHotel: string;
  makkahDistance: string; // e.g. "350m from Haram"
  madinahHotel: string;
  madinahDistance: string; // e.g. "200m from Masjid Nabawi"
  airline?: string;
  
  pricing: {
    quadSharing: number;
    tripleSharing: number;
    doubleSharing: number;
    singleSharing?: number;
    currency?: string;
  };
  
  departureDates: string[];
  inclusions: string[];
  exclusions?: string[];
  itinerary?: {
    day: number;
    title: string;
    description: string;
  }[];
  imageUrl: string;
  badge?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface UmrahBooking {
  id: string;
  bookingCode: string;
  packageId: string;
  packageName: string;
  leadPilgrimName: string;
  contactPhone: string;
  whatsappNumber: string;
  email?: string;
  totalPilgrims: number;
  pilgrims: {
    fullName: string;
    passportNumber: string;
    age: number;
    gender: 'Male' | 'Female';
    relation: string;
  }[];
  preferredTravelDate: string;
  roomSharing: 'Quad' | 'Triple' | 'Double' | 'Single';
  totalAmount: number;
  paidAmount: number;
  status: 'inquiry' | 'confirmed' | 'visa_applied' | 'visa_issued' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export type VisaStatus =
  | 'Available'
  | 'Reserved'
  | 'Candidate Assigned'
  | 'Processing'
  | 'Visa Stamped'
  | 'Used'
  | 'Cancelled';

export interface VisaBatch {
  id: string;
  batchId: string; // e.g. 'VB-2025-001'
  partnerOfficeId: string;
  partnerOfficeName: string;
  visaType: string; // e.g. 'House Driver Visa', 'Employment Work Visa', 'Commercial Work Visa'
  jobTitle: string; // e.g. 'House Driver', 'Industrial Electrician'
  sectorCity: string; // e.g. 'Riyadh', 'Jeddah', 'Dammam', 'NEOM'
  totalVisas: number;
  usedVisas: number;
  remainingVisas: number;
  amountPerVisa: number;
  totalAmount: number; // totalVisas * amountPerVisa
  usedVisaValue?: number;
  remainingVisaValue?: number;
  dateReceived: string;
  expiryDate?: string;
  notes?: string;
  status: 'Available' | 'Partially Used' | 'Fully Used' | 'Expired';
  createdAt: string;
  updatedAt?: string;
}

export interface IndividualVisa {
  id: string;
  visaId: string; // e.g. 'VISA-2026-0001'
  partnerOfficeId: string;
  partnerOfficeName: string;
  batchId: string;
  batchCode?: string;
  jobTitle: string;
  sectorCity?: string;
  visaType?: string;
  visaNumber?: string; // Saudi Visa No
  mofaNumber?: string; // MOFA Application No
  sponsorName?: string; // Saudi Sponsor / Kafeel
  
  // Financial calculation fields
  visaAmount: number; // Partner Office cost
  candidateAmount: number; // Candidate package total
  alHeraCommission: number; // Al-Hera travels commission
  partnerPayableAmount: number; // Amount payable to partner office
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid';
  
  // Candidate Link
  candidateId?: string;
  candidateTrackingId?: string;
  candidateName?: string;
  candidatePassport?: string;
  
  // Visa Lifecycle
  visaStatus: VisaStatus;
  dateAssigned?: string;
  dateUsed?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PartnerOfficePayment {
  id: string;
  paymentNumber: string; // e.g. 'POP-2025-001'
  partnerOfficeId: string;
  partnerOfficeName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'RTGS / NEFT' | 'Online / UPI' | 'Other' | string;
  referenceNumber: string;
  relatedBatchId?: string;
  relatedBatchCode?: string;
  relatedVisaId?: string;
  relatedVisaCode?: string;
  relatedCandidateId?: string;
  relatedCandidateName?: string;
  notes?: string;
  receiptUrl?: string;
  recordedBy: string;
  createdAt: string;
}

export type PartnerTransactionType =
  | 'Visa Received'
  | 'Candidate Assigned'
  | 'Payment Due'
  | 'Payment Made'
  | 'Commission Earned'
  | 'Refund'
  | 'Adjustment'
  | 'Cancellation';

export interface PartnerOfficeLedgerEntry {
  id: string;
  transactionId: string; // e.g. 'TXN-2025-001'
  partnerOfficeId: string;
  date: string;
  type: PartnerTransactionType;
  visaId?: string; // VISA-2026-0001
  candidateId?: string; // Candidate trackingId
  candidateName?: string;
  description: string;
  debit: number; // Reduces partner payable balance (e.g. Payments made to partner)
  credit: number; // Increases partner payable balance (e.g. Visas used where amount is owed to partner)
  commission: number; // Al-Hera commission
  payment: number; // Cash/Bank amount paid
  balance: number; // Running payable balance
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface CommissionConfig {
  type: 'fixed' | 'percentage' | 'custom';
  value: number; // e.g. 20000 or 25 (percent)
}

export interface PartnerAuditLog {
  id: string;
  partnerOfficeId: string;
  partnerOfficeName: string;
  action: string;
  details: string;
  user: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface PartnerOffice {
  id: string;
  partnerCode?: string;
  agencyName: string;
  contactPerson: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  whatsapp: string;
  email: string;
  address?: string;
  
  // Commission settings
  commissionConfig?: CommissionConfig;
  defaultCommissionPerCandidate: number;
  commissionRatePerCandidate?: number;
  
  // Dynamic financial statistics
  totalVisasReceived?: number;
  totalVisasUsed?: number;
  availableVisas?: number;
  totalVisaValue?: number;
  totalCandidateValue?: number;
  alHeraCommission?: number;
  totalPaidToPartner?: number;
  outstandingPayable?: number;
  totalProfitCommissionEarned?: number;
  
  // Legacy fields
  totalCandidatesReferred: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  balancePending?: number;
  
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SliderBanner {
  id: string;
  title: string;
  highlightText: string;
  subtitle: string;
  badge: string;
  imageUrl: string;
  ctaText: string;
  ctaAction: 'jobs' | 'umrah' | 'track' | 'whatsapp' | 'contact' | string;
  ctaSecondaryText?: string;
  ctaSecondaryAction?: 'jobs' | 'umrah' | 'track' | 'whatsapp' | 'contact' | string;
  isActive: boolean;
  order: number;
}

export interface MessageTemplate {
  id: string;
  title: string;
  channel: 'whatsapp' | 'sms' | string;
  eventTrigger?: 'on_registered' | 'on_selected' | 'on_medical_fit' | 'on_visa_stamped' | 'on_ticket_booked' | 'payment_receipt' | 'custom' | string;
  triggerEvent?: string;
  content?: string;
  bodyTemplate?: string;
  variables?: string[];
}
export type SmsTemplate = MessageTemplate;

export interface MessageLog {
  id: string;
  recipientName: string;
  recipientPhone: string;
  channel: 'whatsapp' | 'sms' | string;
  templateUsed?: string;
  templateTitle?: string;
  messageText?: string;
  messageBody?: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'failed' | string;
  trackingId?: string;
}
export type SentMessageLog = MessageLog;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastSyncedAt?: string;
  autoSync: boolean;
}

export interface FirebaseAppConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  firestoreDatabaseId?: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface FirebaseSyncState {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt?: string;
  autoSync: boolean;
  statusMessage?: string;
  stats?: {
    candidates: number;
    jobs: number;
    umrahPackages: number;
    partners: number;
    bookings: number;
  };
}

export interface FollowUpHistoryEntry {
  id: string;
  timestamp: string;
  actionType: 'call' | 'whatsapp' | 'meeting' | 'status_change' | 'scheduled' | 'completed' | 'note_added' | 'rescheduled';
  performedBy: string;
  notes: string;
  outcome?: string;
  previousStatus?: string;
  newStatus?: string;
  nextFollowUpDate?: string;
}

export type FollowUpPriority = 'urgent' | 'hot' | 'warm' | 'cold';
export type FollowUpStatus = 'pending' | 'in_progress' | 'scheduled' | 'completed' | 'cancelled' | 'converted' | 'lost';
export type FollowUpLeadType = 'candidate' | 'umrah' | 'partner' | 'job_inquiry' | 'visa_inquiry' | 'general';
export type FollowUpChannel = 'call' | 'whatsapp' | 'meeting' | 'email';

export interface CrmFollowUp {
  id: string;
  leadType: FollowUpLeadType;
  contactName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  city?: string;
  state?: string;
  targetRequirement?: string; // e.g. "Heavy Driver - Riyadh", "15-Day Economy Umrah"
  candidateId?: string; // Optional link to Candidate dossier
  passportNumber?: string;
  leadSource: 'website_apply' | 'whatsapp' | 'phone_call' | 'walk_in' | 'sub_agent' | 'facebook_ad' | 'referral';
  priority: FollowUpPriority;
  status: FollowUpStatus;
  channel: FollowUpChannel;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime?: string; // e.g. "11:30 AM"
  assignedStaffId?: string;
  assignedStaffName: string;
  lastContactedAt?: string;
  notes: string;
  outcome?: string;
  history: FollowUpHistoryEntry[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AgencyInfo {
  name: string;
  tagline: string;
  licenseNumber: string;
  ministryApproval: string;
  email: string;
  phone: string;
  whatsapp: string;
  headOffice?: string;
  saudiOffice?: string;
  delhiOffice?: string;
  mumbaiOffice?: string;
  address?: string;
  website: string;
  gstin?: string;
}
