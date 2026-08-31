import {
  Candidate,
  JobVacancy,
  UmrahPackage,
  UmrahBooking,
  PartnerOffice,
  VisaBatch,
  IndividualVisa,
  PartnerOfficePayment,
  PartnerOfficeLedgerEntry,
  PartnerAuditLog,
  SliderBanner,
  MessageTemplate,
  MessageLog,
  AppUser,
  AgencyInfo,
  CrmFollowUp,
  FollowUpHistoryEntry,
  FollowUpPriority,
  FollowUpStatus,
  FollowUpLeadType,
  FollowUpChannel
} from '../types';
import { computePartnerFinancials, computeRunningLedger } from './partnerCalculations';
import { enrichAllJobsWithMetrics, enrichJobWithMetrics, createJobStatusHistoryEvent, computeJobCandidateMetrics } from './jobCalculations';
import { getSupabase, syncCollectionToSupabase } from './supabase';
import { getAuthUsers, saveAuthUsers } from './auth';
import {
  saveCandidateToFirestore,
  saveJobToFirestore,
  savePackageToFirestore,
  savePartnerToFirestore
} from './firebase';

export const AGENCY_INFO: AgencyInfo = {
  name: 'AL-HERA TRAVELS',
  tagline: 'Govt. Approved Overseas Recruitment & Premium Umrah Services',
  licenseNumber: 'B-1289/MUM/PER/1000+/5/9876/2022',
  ministryApproval: 'Ministry of External Affairs, Govt. of India',
  email: 'alheratravels5@gmail.com',
  phone: '+91-9214635385',
  whatsapp: '+919214635385',
  headOffice: 'Al-Hera Complex, Main Overseas Hub, Mumbai, Maharashtra 400001, India',
  saudiOffice: 'King Fahd Road, Al Olaya District, P.O. Box 4192, Riyadh 11491, Saudi Arabia',
  delhiOffice: '4th Floor, Overseas Tower, Connaught Place, New Delhi 110001, India',
  mumbaiOffice: 'Ground Floor, Trade Centre, Near International Airport, Mumbai 400099, India',
  website: 'https://alheratravels.com',
};

export const INITIAL_USERS: AppUser[] = [];

export const INITIAL_SLIDERS: SliderBanner[] = [
  {
    id: 'sl-1',
    title: 'SAUDI ARABIA & GULF',
    highlightText: 'GOVT. APPROVED OVERSEAS RECRUITMENT',
    subtitle: 'Direct Client Interviews, Fast Wakala Processing, 100% Genuine Work Visas with Top Saudi Conglomerates & Mega Projects.',
    badge: '🇸🇦 Saudi Mega Projects 2025-2026',
    imageUrl: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?q=80&w=1600&auto=format&fit=crop',
    ctaText: 'Explore Saudi Jobs',
    ctaAction: 'jobs',
    ctaSecondaryText: 'Track Application',
    ctaSecondaryAction: 'track',
    isActive: true,
    order: 1,
  },
  {
    id: 'sl-2',
    title: 'SPIRITUAL JOURNEY',
    highlightText: 'PREMIUM & ECONOMY UMRAH PACKAGES',
    subtitle: 'Experience divine serenity with our 15 & 21 Days All-Inclusive Umrah groups. Luxury 5-Star hotels near Haram, VIP transport & Ziyarat.',
    badge: '🕋 15 & 21 Days Group Departures',
    imageUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=1600&auto=format&fit=crop',
    ctaText: 'View Umrah Packages',
    ctaAction: 'umrah',
    ctaSecondaryText: 'WhatsApp Inquiry',
    ctaSecondaryAction: 'whatsapp',
    isActive: true,
    order: 2,
  },
  {
    id: 'sl-3',
    title: 'LIVE CANDIDATE TRACKING',
    highlightText: 'COMPLETE TRANSPARENT VISA TIMELINE',
    subtitle: 'Track your Saudi Visa, GAMCA Medical, Wakala Card, Protector and Flight status live with your Passport Number anytime 24/7.',
    badge: '🔎 Instant Online Passport Status',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?q=80&w=1600&auto=format&fit=crop',
    ctaText: 'Track Your Passport',
    ctaAction: 'track',
    ctaSecondaryText: 'Contact Office',
    ctaSecondaryAction: 'contact',
    isActive: true,
    order: 3,
  }
];

export const INITIAL_JOBS: JobVacancy[] = [
  {
    id: 'job-1',
    jobCode: 'AHT-SAU-2025-101',
    title: 'Heavy Trailer & Equipment Drivers',
    country: 'Saudi Arabia',
    city: 'Riyadh & Dammam',
    category: 'Driving & Logistics',
    companyName: 'Almarai Logistics & Transport Co.',
    openingsCount: 45,
    salaryMin: 2200,
    salaryMax: 2800,
    currency: 'SAR',
    dutyHours: '8 Hours + Trip Allowances',
    contractPeriod: '2 Years (Renewable)',
    ageLimit: '23 - 45 Years',
    experienceRequired: 'Valid Indian Heavy or GCC Driving License',
    foodProvided: true,
    accommodationProvided: true,
    transportProvided: true,
    medicalInsurance: true,
    tradeTestRequired: true,
    interviewDate: '2025-09-15',
    interviewVenue: 'Al-Hera Trade Test Centre, Mumbai & Delhi',
    description: 'Urgent requirement for heavy trailer and refrigerated tanker drivers in Saudi Arabia. Excellent trip bonuses and overtime.',
    requirements: [
      'Original Indian Heavy License (minimum 3 years old) or GCC License',
      'Basic English/Arabic speaking preferred',
      'Clean driving and police record',
      'Age between 23 and 45 years',
      'Passport with at least 2 years validity'
    ],
    benefits: [
      'Free air-conditioned accommodation',
      'Duty food or 300 SAR Food Allowance',
      'Free medical insurance & Iqama',
      'Free return flight ticket every 2 years',
      'Overtime & high trip bonus incentives'
    ],
    status: 'urgent',
    posterTheme: 'navy_gold',
    deadline: '2025-09-30',
    createdAt: '2025-08-01T10:00:00Z',
  },
  {
    id: 'job-2',
    jobCode: 'AHT-SAU-2025-102',
    title: 'Industrial Electricians & BMS Technicians',
    country: 'Saudi Arabia',
    city: 'Jeddah & Yanbu',
    category: 'Technical & Engineering',
    companyName: 'Al Fanar Electrical Systems Ltd.',
    openingsCount: 30,
    salaryMin: 2400,
    salaryMax: 3200,
    currency: 'SAR',
    dutyHours: '8 Hours + Overtime (1.5x)',
    contractPeriod: '2 Years (Renewable)',
    ageLimit: '21 - 40 Years',
    experienceRequired: '3+ Years in Industrial or Commercial Wiring / Panel Board',
    foodProvided: true,
    accommodationProvided: true,
    transportProvided: true,
    medicalInsurance: true,
    tradeTestRequired: true,
    interviewDate: '2025-09-20',
    interviewVenue: 'Al-Hera Technical Workshop, Delhi & Mumbai',
    description: 'Leading Saudi electrical engineering group requires qualified Industrial Electricians for substations, commercial towers, and PLC/BMS maintenance.',
    requirements: [
      'ITI or Diploma in Electrical Engineering',
      'Ability to read circuit diagrams and single-line blueprints',
      'Troubleshooting industrial control panels & motor starters',
      'Valid passport with minimum 18 months validity'
    ],
    benefits: [
      'Company provided sharing bachelor accommodation',
      'Free transportation to worksites',
      'Medical insurance category Class A',
      'End of Service Gratuity (ESB) as per Saudi Labor Law'
    ],
    status: 'active',
    posterTheme: 'royal_emerald',
    deadline: '2025-10-05',
    createdAt: '2025-08-05T12:00:00Z',
  },
  {
    id: 'job-3',
    jobCode: 'AHT-SAU-2025-103',
    title: 'HVAC Chiller Maintenance Technicians',
    country: 'Saudi Arabia',
    city: 'Al Khobar & Dammam',
    category: 'Technical & Engineering',
    companyName: 'Zamil Air Conditioners & Facility Services',
    openingsCount: 20,
    salaryMin: 2800,
    salaryMax: 3600,
    currency: 'SAR',
    dutyHours: '8 Hours + Overtime',
    contractPeriod: '2 Years (Renewable)',
    ageLimit: '22 - 42 Years',
    experienceRequired: '4+ Years experience on York/Carrier/Trane Chillers & VRF systems',
    foodProvided: true,
    accommodationProvided: true,
    transportProvided: true,
    medicalInsurance: true,
    tradeTestRequired: true,
    interviewDate: '2025-09-25',
    interviewVenue: 'Mumbai & Sikar Trade Test Camp',
    description: 'Recruitment for large district cooling plants and high-rise commercial facilities. Experience in screw and centrifugal chillers required.',
    requirements: [
      'ITI/Diploma in Refrigeration & Air Conditioning (RAC)',
      'Hands-on experience in brazing, vacuuming, compressor overhaul',
      'Knowledge of BMS and digital controls',
      'Gulf return candidates preferred'
    ],
    benefits: [
      'Furnished company accommodation',
      'Mess food allowance + Medical cover',
      'Annual 30-day paid leave with round-trip flight',
      'Continuous technical training certification'
    ],
    status: 'urgent',
    posterTheme: 'crimson_gold',
    deadline: '2025-09-28',
    createdAt: '2025-08-10T09:30:00Z',
  },
  {
    id: 'job-4',
    jobCode: 'AHT-SAU-2025-104',
    title: 'Shuttering Carpenters & Steel Fixers',
    country: 'Saudi Arabia',
    city: 'NEOM Mega Project, Tabuk',
    category: 'Construction & Civil',
    companyName: 'Nesma & Partners Contracting Co.',
    openingsCount: 80,
    salaryMin: 1800,
    salaryMax: 2300,
    currency: 'SAR',
    dutyHours: '8 Hours + Daily Fixed 2 Hrs Overtime',
    contractPeriod: '2 Years (Renewable)',
    ageLimit: '20 - 45 Years',
    experienceRequired: '2+ Years in Commercial RCC Construction & Formwork (Doka/Peri)',
    foodProvided: true,
    accommodationProvided: true,
    transportProvided: true,
    medicalInsurance: true,
    tradeTestRequired: true,
    interviewDate: '2025-09-18',
    interviewVenue: 'Rajasthan (Sikar / Jaipur) & Delhi Center',
    description: 'Direct recruitment for iconic NEOM Infrastructure and Tunneling project. Premium camp facilities with modern amenities.',
    requirements: [
      'Experience in Aluminium & Doka shuttering or Column/Beam steel binding',
      'Physical fitness for high-altitude/large infrastructure projects',
      'Valid Indian Passport (ECR/ECNR both accepted)'
    ],
    benefits: [
      'Modern NEOM Pioneer Camp accommodation with Wi-Fi & Gym',
      'Free 3-time buffet food (Indian cooks)',
      'Free laundry, medical, safety gear',
      'Overtime allowance guaranteed'
    ],
    status: 'urgent',
    posterTheme: 'dark_luxury',
    deadline: '2025-09-22',
    createdAt: '2025-08-12T14:00:00Z',
  },
  {
    id: 'job-5',
    jobCode: 'AHT-SAU-2025-105',
    title: 'Executive Continental & Arabic Chefs',
    country: 'Saudi Arabia',
    city: 'Medina Munawwarah',
    category: 'Hospitality & Catering',
    companyName: 'Dar Al Taqwa Luxury Hospitality Group',
    openingsCount: 12,
    salaryMin: 3500,
    salaryMax: 4800,
    currency: 'SAR',
    dutyHours: '9 Hours (Straight Shift)',
    contractPeriod: '2 Years (Renewable)',
    ageLimit: '25 - 45 Years',
    experienceRequired: '5+ Years in 4/5 Star Hotels or Premium Catering',
    foodProvided: true,
    accommodationProvided: true,
    transportProvided: true,
    medicalInsurance: true,
    tradeTestRequired: true,
    interviewDate: '2025-10-02',
    interviewVenue: 'Al-Hera Culinary Test Studio, Mumbai',
    description: 'Prestigious 5-star hotel near Masjid An-Nabawi seeking talented Head Chefs and Sous Chefs for VIP pilgrim banquet and buffet service.',
    requirements: [
      'Degree or Diploma in Hotel Management / Food Production',
      'Proficiency in Arabic, Continental, or South/North Indian cuisines',
      'HACCP and food hygiene certification',
      'Excellent presentation skills'
    ],
    benefits: [
      'Executive single/double accommodation',
      'Free duty meals & uniform laundering',
      'Holy city living allowance',
      'Family visa sponsorship assistance on contract extension'
    ],
    status: 'active',
    posterTheme: 'navy_gold',
    deadline: '2025-10-15',
    createdAt: '2025-08-15T08:00:00Z',
  },
  {
    id: 'job-6',
    jobCode: 'AHT-SAU-2025-106',
    title: '6G TIG & MIG Pipe Welders',
    country: 'Saudi Arabia',
    city: 'Jubail Industrial City',
    category: 'Technical & Engineering',
    companyName: 'Saudi Aramco Certified Subcontractor',
    openingsCount: 25,
    salaryMin: 2800,
    salaryMax: 3800,
    currency: 'SAR',
    dutyHours: '8 Hours + High Overtime',
    contractPeriod: '2 Years (Renewable)',
    ageLimit: '22 - 44 Years',
    experienceRequired: 'Must pass X-Ray & Radiography Test on 6G Position Carbon/Stainless Steel',
    foodProvided: true,
    accommodationProvided: true,
    transportProvided: true,
    medicalInsurance: true,
    tradeTestRequired: true,
    interviewDate: '2025-09-28',
    interviewVenue: 'Mumbai Welding Testing Lab',
    description: 'Petrochemical plant piping expansion project. Attractive hourly overtime and technical allowance for certified 6G welders.',
    requirements: [
      'Minimum 3 years certified welding on high-pressure pipelines',
      'Passing RT/UT testing during physical client interview',
      'Passport validity 2+ years'
    ],
    benefits: [
      'Camp accommodation + free mess',
      'Full safety gear, insurance and Iqama',
      'Overtime calculated at 1.5x basic hourly rate'
    ],
    status: 'urgent',
    posterTheme: 'navy_gold',
    deadline: '2025-09-30',
    createdAt: '2025-08-18T11:00:00Z',
  }
];

export const INITIAL_UMRAH_PACKAGES: UmrahPackage[] = [
  {
    id: 'umr-1',
    packageCode: 'AHT-UMR-15D-VIP',
    name: '15 Days VIP Deluxe Umrah Group',
    durationDays: 15,
    packageType: '5-Star Luxury VIP',
    makkahHotel: 'Swissôtel Makkah / Clock Royal Tower (5-Star)',
    makkahDistance: '0 Meters (Direct Haram Facing Clock Tower)',
    madinahHotel: 'Anwar Al Madinah Mövenpick (5-Star)',
    madinahDistance: '50 Meters (Courtyard of Masjid An-Nabawi)',
    airline: 'Saudi Arabian Airlines (Direct Flights BOM/DEL - JED/MED)',
    pricing: {
      quadSharing: 115000,
      tripleSharing: 128000,
      doubleSharing: 145000,
      singleSharing: 195000,
      currency: 'INR',
    },
    departureDates: ['2025-09-20', '2025-10-15', '2025-11-10', '2025-12-05'],
    inclusions: [
      'Direct Round-trip Flights via Saudi Airlines',
      'Saudi Umrah Tourist eVisa with Comprehensive Medical Insurance',
      '5-Star Luxury accommodation directly facing Holy Harams',
      'Daily 3-Time Delicious Buffet Meals (Indian & Continental)',
      'VIP Luxury Private AC Bus for Jeddah-Makkah-Madinah Transfers',
      'Guided Historical Ziyarat in Makkah (Jabal Al-Noor, Mina, Muzdalifah, Arafat, Thawr)',
      'Guided Historical Ziyarat in Madinah (Masjid Quba, Qiblatain, Uhud Mountain, Seven Mosques)',
      'Free 5 Litres Zamzam Water Sealed Canister',
      'Al-Hera Umrah Welcome Kit (Ihram/Abaya, Shoulder Bag, Shoe Bag, Tawaf Counter, Guide Book)',
      'Dedicated Experienced Islamic Scholar & Group Tour Leader 24/7'
    ],
    exclusions: [
      'Personal laundry and room service',
      'Individual shopping or excess baggage',
      'Any special medical treatment outside insurance coverage'
    ],
    itinerary: [
      { day: 1, title: 'Departure & First Umrah', description: 'Flight from India to Jeddah. AC transfer to Makkah Hotel. Group performs Umrah under scholar guidance.' },
      { day: 2, title: 'Ibadah in Masjid Al-Haram', description: 'Personal prayers, Tawaf and spiritual reflection in Haram Shareef.' },
      { day: 4, title: 'Historical Makkah Ziyarat', description: 'Visit to Cave Hira (Jabal Noor), Jabal Thawr, Arafat, Muzdalifah, and Mina.' },
      { day: 8, title: 'Transfer to Holy Madinah', description: 'Comfortable luxury coach transfer to Madinah. Check-in & first Salam at Roza-e-Rasool (PBUH).' },
      { day: 11, title: 'Madinah Historical Ziyarat', description: 'Pray 2 Rakat in Masjid Quba, visit Mount Uhud Martyrs, Masjid Qiblatain and Dates Market.' },
      { day: 15, title: 'Farewell & Return to India', description: 'Final prayer in Masjid Nabawi, transfer to Prince Mohammad Bin Abdulaziz Airport and return home.' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?q=80&w=1200&auto=format&fit=crop',
    badge: '👑 Most Popular 5-Star VIP',
    isActive: true,
  },
  {
    id: 'umr-2',
    packageCode: 'AHT-UMR-21D-PREM',
    name: '21 Days Complete Spiritual Umrah Group',
    durationDays: 21,
    packageType: '4-Star Premium',
    makkahHotel: 'Al Shohada Hotel / Elaf Kinda (4-Star)',
    makkahDistance: '350 Meters from Holy Haram Ring Road',
    madinahHotel: 'Leader Al Muna Kareem / Al Eiman Royal (4-Star)',
    madinahDistance: '180 Meters from Masjid An-Nabawi Gate',
    airline: 'Air India / Flynas / Saudi Airlines',
    pricing: {
      quadSharing: 92000,
      tripleSharing: 104000,
      doubleSharing: 118000,
      currency: 'INR',
    },
    departureDates: ['2025-09-28', '2025-10-22', '2025-11-18', '2025-12-14'],
    inclusions: [
      'Round-trip Air Ticket with 30kg + 7kg baggage allowance',
      'Saudi Umrah Visa with Insurance',
      '11 Nights Makkah + 9 Nights Madinah in Premium 4-Star hotels',
      'Full Board Delicious Indian Catering (Breakfast, Lunch, Dinner)',
      'Complete Ziyarat in Makkah & Madinah with Hindi/Urdu speaking guide',
      'Free 5 Litre Zamzam water',
      'Complete luggage handling and transfers'
    ],
    exclusions: [
      'Any individual excursions or room upgrades'
    ],
    itinerary: [
      { day: 1, title: 'Arrival & Umrah', description: 'Arrival Jeddah, hotel check-in Makkah, complete first Umrah.' },
      { day: 5, title: 'Makkah Ziyarat', description: 'Comprehensive Makkah historical site tours.' },
      { day: 12, title: 'Journey to Madinah', description: 'AC bus transit to Madinah, check-in near Prophet\'s Mosque.' },
      { day: 16, title: 'Madinah Historical Sites', description: 'Masjid Quba, Uhud, Qiblatain, Khandaq & Dates Garden.' },
      { day: 21, title: 'Departure for India', description: 'Madinah Airport departure back to India with blessed memories.' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=1200&auto=format&fit=crop',
    badge: '⭐ Best Value 21 Days',
    isActive: true,
  },
  {
    id: 'umr-3',
    packageCode: 'AHT-UMR-15D-ECO',
    name: '15 Days Budget Saver Economy Group',
    durationDays: 15,
    packageType: 'Economy',
    makkahHotel: 'Rawabi Al Shamkha / Al Hijrah Tower',
    makkahDistance: '700 Meters (24/7 Dedicated Free AC Shuttle)',
    madinahHotel: 'Mubarak Silver / Al Ansar Palace',
    madinahDistance: '350 Meters from Northern Courtyard',
    airline: 'IndiGo / Air India Express / Gulf Air',
    pricing: {
      quadSharing: 74000,
      tripleSharing: 82000,
      doubleSharing: 92000,
      currency: 'INR',
    },
    departureDates: ['2025-10-05', '2025-10-25', '2025-11-20', '2025-12-10'],
    inclusions: [
      'Confirmed Return Flight Tickets',
      'Saudi Umrah Visa + Medical Insurance',
      'Neat & Clean Air-conditioned Hotel accommodation',
      'Daily 3 Indian meals (Hyderabadi / North Indian style)',
      'AC Bus Transport & Guided Ziyarat Tours',
      'Complimentary Zamzam 5L Canister'
    ],
    exclusions: ['Personal expenditures and laundry'],
    itinerary: [
      { day: 1, title: 'Flight & Umrah Execution', description: 'Arrival Jeddah, bus to Makkah, perform Umrah with group guide.' },
      { day: 7, title: 'Makkah Ziyarat Tour', description: 'Visit holy sites in Makkah.' },
      { day: 9, title: 'Transit to Madinah', description: 'AC bus to Madinah Al Munawwarah.' },
      { day: 12, title: 'Madinah Holy Tour', description: 'Quba, Uhud and historical places.' },
      { day: 15, title: 'Return Flight', description: 'Departure to India from Jeddah/Madinah.' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1580418827493-f2b22c0a76cb?q=80&w=1200&auto=format&fit=crop',
    badge: '💰 Economy Saver',
    isActive: true,
  }
];

export const INITIAL_PARTNERS: PartnerOffice[] = [
  {
    id: 'po-1',
    agencyName: 'Al-Hera Regional Partner - Delhi NCR',
    contactPerson: 'Irfan Khan',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    phone: '+91-9811223344',
    whatsapp: '+919811223344',
    email: 'delhipartner@alheratravels.com',
    defaultCommissionPerCandidate: 6000,
    totalCandidatesReferred: 28,
    totalCommissionEarned: 168000,
    totalCommissionPaid: 130000,
    balancePending: 38000,
    status: 'active',
    notes: 'Handles candidates across Delhi, UP West & Haryana.',
    createdAt: '2025-01-15T00:00:00Z',
  },
  {
    id: 'po-2',
    agencyName: 'Rajasthan Gulf Manpower Hub - Sikar & Jaipur',
    contactPerson: 'Aslam Qureshi',
    city: 'Sikar',
    state: 'Rajasthan',
    country: 'India',
    phone: '+91-9414556677',
    whatsapp: '+919414556677',
    email: 'sikar.manpower@alheratravels.com',
    defaultCommissionPerCandidate: 7000,
    totalCandidatesReferred: 42,
    totalCommissionEarned: 294000,
    totalCommissionPaid: 250000,
    balancePending: 44000,
    status: 'active',
    notes: 'Specialist for Shekhawati heavy drivers, electricians & civil trades.',
    createdAt: '2025-01-20T00:00:00Z',
  },
  {
    id: 'po-3',
    agencyName: 'Mumbai Coastal Overseas Careers',
    contactPerson: 'Feroz Merchant',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    phone: '+91-9820112233',
    whatsapp: '+919820112233',
    email: 'mumbai.careers@alheratravels.com',
    defaultCommissionPerCandidate: 5000,
    totalCandidatesReferred: 19,
    totalCommissionEarned: 95000,
    totalCommissionPaid: 85000,
    balancePending: 10000,
    status: 'active',
    notes: 'Hospitality, Chefs & Medical personnel referrals.',
    createdAt: '2025-02-01T00:00:00Z',
  },
  {
    id: 'po-4',
    partnerCode: 'PO-HYD-004',
    agencyName: 'Hyderabad Deccan Gulf Consultancy',
    contactPerson: 'Syed Nadeem Ahmed',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    phone: '+91-9848012345',
    whatsapp: '+919848012345',
    email: 'hyderabad.deccan@alheratravels.com',
    defaultCommissionPerCandidate: 6000,
    commissionConfig: { type: 'fixed', value: 17000 },
    totalCandidatesReferred: 31,
    totalCommissionEarned: 186000,
    totalCommissionPaid: 150000,
    balancePending: 36000,
    status: 'active',
    notes: 'Industrial electrical & pipe fitters specialist.',
    createdAt: '2025-02-10T00:00:00Z',
  }
];

export const INITIAL_VISA_BATCHES: VisaBatch[] = [
  {
    id: 'vb-1',
    batchId: 'VB-2025-001',
    partnerOfficeId: 'po-2',
    partnerOfficeName: 'Rajasthan Gulf Manpower Hub - Sikar & Jaipur',
    visaType: 'Employment Work Visa',
    jobTitle: 'Heavy Trailer & Equipment Drivers',
    sectorCity: 'Riyadh',
    totalVisas: 10,
    usedVisas: 4,
    remainingVisas: 6,
    amountPerVisa: 45000,
    totalAmount: 450000,
    usedVisaValue: 180000,
    remainingVisaValue: 270000,
    dateReceived: '2025-07-01',
    expiryDate: '2026-06-30',
    notes: 'Verified Saudi Wakala quotas for Almarai Logistics Fleet.',
    status: 'Available',
    createdAt: '2025-07-01T10:00:00Z',
  },
  {
    id: 'vb-2',
    batchId: 'VB-2025-002',
    partnerOfficeId: 'po-4',
    partnerOfficeName: 'Hyderabad Deccan Gulf Consultancy',
    visaType: 'Commercial Work Visa',
    jobTitle: 'Industrial Electricians & Control Technicians',
    sectorCity: 'Dammam & Jubail',
    totalVisas: 8,
    usedVisas: 3,
    remainingVisas: 5,
    amountPerVisa: 38000,
    totalAmount: 304000,
    usedVisaValue: 114000,
    remainingVisaValue: 190000,
    dateReceived: '2025-07-15',
    expiryDate: '2026-07-14',
    notes: 'Industrial commercial visa block with medical card insurance.',
    status: 'Available',
    createdAt: '2025-07-15T11:00:00Z',
  },
  {
    id: 'vb-3',
    batchId: 'VB-2025-003',
    partnerOfficeId: 'po-1',
    partnerOfficeName: 'Al-Huda Overseas Manpower Associates - Delhi NCR',
    visaType: 'Individual Work Visa',
    jobTitle: 'House Drivers & Private Chauffeurs',
    sectorCity: 'Jeddah & Makkah',
    totalVisas: 6,
    usedVisas: 2,
    remainingVisas: 4,
    amountPerVisa: 32000,
    totalAmount: 192000,
    usedVisaValue: 64000,
    remainingVisaValue: 128000,
    dateReceived: '2025-08-01',
    expiryDate: '2026-07-31',
    notes: 'Individual Saudi VIP household sponsorships.',
    status: 'Available',
    createdAt: '2025-08-01T09:30:00Z',
  },
  {
    id: 'vb-4',
    batchId: 'VB-2025-004',
    partnerOfficeId: 'po-3',
    partnerOfficeName: 'Mumbai Coastal Overseas Careers',
    visaType: 'Hospitality Work Visa',
    jobTitle: 'Executive Chefs & Continental Cooks',
    sectorCity: 'NEOM & Red Sea Project',
    totalVisas: 5,
    usedVisas: 1,
    remainingVisas: 4,
    amountPerVisa: 55000,
    totalAmount: 275000,
    usedVisaValue: 55000,
    remainingVisaValue: 220000,
    dateReceived: '2025-08-10',
    expiryDate: '2026-08-09',
    notes: 'Luxury resort culinary hospitality visas.',
    status: 'Available',
    createdAt: '2025-08-10T14:00:00Z',
  }
];

export const INITIAL_INDIVIDUAL_VISAS: IndividualVisa[] = [
  {
    id: 'visa-1',
    visaId: 'VISA-2026-0001',
    partnerOfficeId: 'po-2',
    partnerOfficeName: 'Rajasthan Gulf Manpower Hub - Sikar & Jaipur',
    batchId: 'vb-1',
    batchCode: 'VB-2025-001',
    jobTitle: 'Heavy Trailer & Equipment Drivers',
    sectorCity: 'Riyadh',
    visaType: 'Employment Work Visa',
    visaNumber: '130882194',
    mofaNumber: 'MOFA-SAU-882194',
    sponsorName: 'Almarai Logistics & Transport Co., Riyadh',
    visaAmount: 45000,
    candidateAmount: 65000,
    alHeraCommission: 20000,
    partnerPayableAmount: 45000,
    paymentStatus: 'Paid',
    candidateId: 'cand-1',
    candidateTrackingId: 'AHT-2025-9102',
    candidateName: 'Mohammad Tariq Ansari',
    candidatePassport: 'Z5891042',
    visaStatus: 'Visa Stamped',
    dateAssigned: '2025-07-10',
    dateUsed: '2025-08-18',
    notes: 'Candidate passed driving test. Visa stamped by Embassy.',
    createdAt: '2025-07-01T10:00:00Z',
  },
  {
    id: 'visa-2',
    visaId: 'VISA-2026-0002',
    partnerOfficeId: 'po-4',
    partnerOfficeName: 'Hyderabad Deccan Gulf Consultancy',
    batchId: 'vb-2',
    batchCode: 'VB-2025-002',
    jobTitle: 'Industrial Electricians & Control Technicians',
    sectorCity: 'Dammam & Jubail',
    visaType: 'Commercial Work Visa',
    visaNumber: '141098231',
    mofaNumber: 'MOFA-SAU-910834',
    sponsorName: 'Al Fanar Electrical Systems, Dammam',
    visaAmount: 38000,
    candidateAmount: 55000,
    alHeraCommission: 17000,
    partnerPayableAmount: 38000,
    paymentStatus: 'Paid',
    candidateId: 'cand-2',
    candidateTrackingId: 'AHT-2025-9108',
    candidateName: 'Salman Khan Pathan',
    candidatePassport: 'N4192084',
    visaStatus: 'Visa Stamped',
    dateAssigned: '2025-07-18',
    dateUsed: '2025-08-20',
    notes: 'Trade test passed at Hyderabad centre.',
    createdAt: '2025-07-15T11:00:00Z',
  },
  {
    id: 'visa-3',
    visaId: 'VISA-2026-0003',
    partnerOfficeId: 'po-1',
    partnerOfficeName: 'Al-Huda Overseas Manpower Associates - Delhi NCR',
    batchId: 'vb-3',
    batchCode: 'VB-2025-003',
    jobTitle: 'House Drivers & Private Chauffeurs',
    sectorCity: 'Jeddah & Makkah',
    visaType: 'Individual Work Visa',
    visaNumber: '149021882',
    mofaNumber: 'MOFA-SAU-772911',
    sponsorName: 'Sheikh Abdulaziz VIP Residence, Jeddah',
    visaAmount: 32000,
    candidateAmount: 50000,
    alHeraCommission: 18000,
    partnerPayableAmount: 32000,
    paymentStatus: 'Partially Paid',
    candidateId: 'cand-3',
    candidateTrackingId: 'AHT-2025-9114',
    candidateName: 'Arif Sheikh',
    candidatePassport: 'P8920194',
    visaStatus: 'Candidate Assigned',
    dateAssigned: '2025-08-05',
    notes: 'Medical clearance under process.',
    createdAt: '2025-08-01T09:30:00Z',
  },
  {
    id: 'visa-4',
    visaId: 'VISA-2026-0004',
    partnerOfficeId: 'po-3',
    partnerOfficeName: 'Mumbai Coastal Overseas Careers',
    batchId: 'vb-4',
    batchCode: 'VB-2025-004',
    jobTitle: 'Executive Chefs & Continental Cooks',
    sectorCity: 'NEOM & Red Sea Project',
    visaType: 'Hospitality Work Visa',
    visaNumber: '150119283',
    mofaNumber: 'MOFA-SAU-663819',
    sponsorName: 'The Red Sea Global Resorts, NEOM',
    visaAmount: 55000,
    candidateAmount: 80000,
    alHeraCommission: 25000,
    partnerPayableAmount: 55000,
    paymentStatus: 'Unpaid',
    candidateId: 'cand-4',
    candidateTrackingId: 'AHT-2025-9120',
    candidateName: 'Abdul Rahman',
    candidatePassport: 'R3489102',
    visaStatus: 'Processing',
    dateAssigned: '2025-08-12',
    notes: 'Wakala issued, document submission for stamping.',
    createdAt: '2025-08-10T14:00:00Z',
  },
  {
    id: 'visa-5',
    visaId: 'VISA-2026-0005',
    partnerOfficeId: 'po-2',
    partnerOfficeName: 'Rajasthan Gulf Manpower Hub - Sikar & Jaipur',
    batchId: 'vb-1',
    batchCode: 'VB-2025-001',
    jobTitle: 'Heavy Trailer & Equipment Drivers',
    sectorCity: 'Riyadh',
    visaType: 'Employment Work Visa',
    visaAmount: 45000,
    candidateAmount: 65000,
    alHeraCommission: 20000,
    partnerPayableAmount: 45000,
    paymentStatus: 'Unpaid',
    visaStatus: 'Available',
    notes: 'Ready for candidate assignment.',
    createdAt: '2025-07-01T10:00:00Z',
  },
  {
    id: 'visa-6',
    visaId: 'VISA-2026-0006',
    partnerOfficeId: 'po-2',
    partnerOfficeName: 'Rajasthan Gulf Manpower Hub - Sikar & Jaipur',
    batchId: 'vb-1',
    batchCode: 'VB-2025-001',
    jobTitle: 'Heavy Trailer & Equipment Drivers',
    sectorCity: 'Riyadh',
    visaType: 'Employment Work Visa',
    visaAmount: 45000,
    candidateAmount: 65000,
    alHeraCommission: 20000,
    partnerPayableAmount: 45000,
    paymentStatus: 'Unpaid',
    visaStatus: 'Available',
    notes: 'Ready for candidate assignment.',
    createdAt: '2025-07-01T10:00:00Z',
  },
  {
    id: 'visa-7',
    visaId: 'VISA-2026-0007',
    partnerOfficeId: 'po-4',
    partnerOfficeName: 'Hyderabad Deccan Gulf Consultancy',
    batchId: 'vb-2',
    batchCode: 'VB-2025-002',
    jobTitle: 'Industrial Electricians & Control Technicians',
    sectorCity: 'Dammam & Jubail',
    visaType: 'Commercial Work Visa',
    visaAmount: 38000,
    candidateAmount: 55000,
    alHeraCommission: 17000,
    partnerPayableAmount: 38000,
    paymentStatus: 'Unpaid',
    visaStatus: 'Available',
    notes: 'Ready for candidate assignment.',
    createdAt: '2025-07-15T11:00:00Z',
  },
  {
    id: 'visa-8',
    visaId: 'VISA-2026-0008',
    partnerOfficeId: 'po-1',
    partnerOfficeName: 'Al-Huda Overseas Manpower Associates - Delhi NCR',
    batchId: 'vb-3',
    batchCode: 'VB-2025-003',
    jobTitle: 'House Drivers & Private Chauffeurs',
    sectorCity: 'Jeddah & Makkah',
    visaType: 'Individual Work Visa',
    visaAmount: 32000,
    candidateAmount: 50000,
    alHeraCommission: 18000,
    partnerPayableAmount: 32000,
    paymentStatus: 'Unpaid',
    visaStatus: 'Available',
    notes: 'Ready for candidate assignment.',
    createdAt: '2025-08-01T09:30:00Z',
  }
];

export const INITIAL_PARTNER_PAYMENTS: PartnerOfficePayment[] = [
  {
    id: 'pop-1',
    paymentNumber: 'POP-2025-001',
    partnerOfficeId: 'po-2',
    partnerOfficeName: 'Rajasthan Gulf Manpower Hub - Sikar & Jaipur',
    amount: 45000,
    paymentDate: '2025-08-19',
    paymentMethod: 'Bank Transfer',
    referenceNumber: 'NEFT-HDFC-9912048',
    relatedBatchId: 'vb-1',
    relatedBatchCode: 'VB-2025-001',
    relatedVisaId: 'visa-1',
    relatedVisaCode: 'VISA-2026-0001',
    relatedCandidateId: 'cand-1',
    relatedCandidateName: 'Mohammad Tariq Ansari',
    notes: 'Settlement for Visa VISA-2026-0001 stamped for candidate Mohammad Tariq Ansari.',
    recordedBy: 'Zeeshan Khan',
    createdAt: '2025-08-19T14:30:00Z',
  },
  {
    id: 'pop-2',
    paymentNumber: 'POP-2025-002',
    partnerOfficeId: 'po-4',
    partnerOfficeName: 'Hyderabad Deccan Gulf Consultancy',
    amount: 38000,
    paymentDate: '2025-08-21',
    paymentMethod: 'Bank Transfer',
    referenceNumber: 'IMPS-ICICI-8812903',
    relatedBatchId: 'vb-2',
    relatedBatchCode: 'VB-2025-002',
    relatedVisaId: 'visa-2',
    relatedVisaCode: 'VISA-2026-0002',
    relatedCandidateId: 'cand-2',
    relatedCandidateName: 'Salman Khan Pathan',
    notes: 'Settlement for Electrician Visa VISA-2026-0002 for Salman Khan Pathan.',
    recordedBy: 'Mohammad Rashid',
    createdAt: '2025-08-21T16:00:00Z',
  },
  {
    id: 'pop-3',
    paymentNumber: 'POP-2025-003',
    partnerOfficeId: 'po-1',
    partnerOfficeName: 'Al-Huda Overseas Manpower Associates - Delhi NCR',
    amount: 15000,
    paymentDate: '2025-08-10',
    paymentMethod: 'UPI',
    referenceNumber: 'UPI-SBIN-77382910',
    relatedBatchId: 'vb-3',
    relatedBatchCode: 'VB-2025-003',
    relatedVisaId: 'visa-3',
    relatedVisaCode: 'VISA-2026-0003',
    relatedCandidateId: 'cand-3',
    relatedCandidateName: 'Arif Sheikh',
    notes: 'Advance part payment for House Driver visa processing.',
    recordedBy: 'Farhan Ansari',
    createdAt: '2025-08-10T12:00:00Z',
  }
];

export const INITIAL_PARTNER_LEDGER: PartnerOfficeLedgerEntry[] = [
  {
    id: 'tx-1',
    transactionId: 'TXN-2025-001',
    partnerOfficeId: 'po-2',
    date: '2025-07-01',
    type: 'Visa Received',
    description: 'Received Batch VB-2025-001 (10 Heavy Driver Visas @ ₹45,000)',
    debit: 0,
    credit: 0,
    commission: 0,
    payment: 0,
    balance: 0,
    notes: 'Inventory received into system',
    createdAt: '2025-07-01T10:00:00Z',
  },
  {
    id: 'tx-2',
    transactionId: 'TXN-2025-002',
    partnerOfficeId: 'po-2',
    date: '2025-07-10',
    type: 'Candidate Assigned',
    visaId: 'VISA-2026-0001',
    candidateId: 'AHT-2025-9102',
    candidateName: 'Mohammad Tariq Ansari',
    description: 'Candidate Mohammad Tariq Ansari assigned to Visa VISA-2026-0001',
    debit: 0,
    credit: 45000,
    commission: 20000,
    payment: 0,
    balance: 45000,
    notes: 'Payable created to partner',
    createdAt: '2025-07-10T10:00:00Z',
  },
  {
    id: 'tx-3',
    transactionId: 'TXN-2025-003',
    partnerOfficeId: 'po-2',
    date: '2025-08-19',
    type: 'Payment Made',
    visaId: 'VISA-2026-0001',
    candidateId: 'AHT-2025-9102',
    candidateName: 'Mohammad Tariq Ansari',
    description: 'Payment made via Bank Transfer Ref: NEFT-HDFC-9912048',
    debit: 45000,
    credit: 0,
    commission: 0,
    payment: 45000,
    balance: 0,
    paymentMethod: 'Bank Transfer',
    referenceNumber: 'NEFT-HDFC-9912048',
    notes: 'Settled upon visa stamping',
    createdAt: '2025-08-19T14:30:00Z',
  },
  {
    id: 'tx-4',
    transactionId: 'TXN-2025-004',
    partnerOfficeId: 'po-4',
    date: '2025-07-15',
    type: 'Visa Received',
    description: 'Received Batch VB-2025-002 (8 Electrician Visas @ ₹38,000)',
    debit: 0,
    credit: 0,
    commission: 0,
    payment: 0,
    balance: 0,
    notes: 'Inventory recorded',
    createdAt: '2025-07-15T11:00:00Z',
  },
  {
    id: 'tx-5',
    transactionId: 'TXN-2025-005',
    partnerOfficeId: 'po-4',
    date: '2025-07-18',
    type: 'Candidate Assigned',
    visaId: 'VISA-2026-0002',
    candidateId: 'AHT-2025-9108',
    candidateName: 'Salman Khan Pathan',
    description: 'Candidate Salman Khan Pathan assigned to Visa VISA-2026-0002',
    debit: 0,
    credit: 38000,
    commission: 17000,
    payment: 0,
    balance: 38000,
    notes: 'Payable created to partner',
    createdAt: '2025-07-18T12:00:00Z',
  },
  {
    id: 'tx-6',
    transactionId: 'TXN-2025-006',
    partnerOfficeId: 'po-4',
    date: '2025-08-21',
    type: 'Payment Made',
    visaId: 'VISA-2026-0002',
    candidateId: 'AHT-2025-9108',
    candidateName: 'Salman Khan Pathan',
    description: 'Payment made via Bank Transfer Ref: IMPS-ICICI-8812903',
    debit: 38000,
    credit: 0,
    commission: 0,
    payment: 38000,
    balance: 0,
    paymentMethod: 'Bank Transfer',
    referenceNumber: 'IMPS-ICICI-8812903',
    notes: 'Settled',
    createdAt: '2025-08-21T16:00:00Z',
  },
  {
    id: 'tx-7',
    transactionId: 'TXN-2025-007',
    partnerOfficeId: 'po-1',
    date: '2025-08-01',
    type: 'Visa Received',
    description: 'Received Batch VB-2025-003 (6 House Driver Visas @ ₹32,000)',
    debit: 0,
    credit: 0,
    commission: 0,
    payment: 0,
    balance: 0,
    createdAt: '2025-08-01T09:30:00Z',
  },
  {
    id: 'tx-8',
    transactionId: 'TXN-2025-008',
    partnerOfficeId: 'po-1',
    date: '2025-08-05',
    type: 'Candidate Assigned',
    visaId: 'VISA-2026-0003',
    candidateId: 'AHT-2025-9114',
    candidateName: 'Arif Sheikh',
    description: 'Candidate Arif Sheikh assigned to Visa VISA-2026-0003',
    debit: 0,
    credit: 32000,
    commission: 18000,
    payment: 0,
    balance: 32000,
    createdAt: '2025-08-05T10:00:00Z',
  },
  {
    id: 'tx-9',
    transactionId: 'TXN-2025-009',
    partnerOfficeId: 'po-1',
    date: '2025-08-10',
    type: 'Payment Made',
    visaId: 'VISA-2026-0003',
    candidateId: 'AHT-2025-9114',
    candidateName: 'Arif Sheikh',
    description: 'Part payment made via UPI Ref: UPI-SBIN-77382910',
    debit: 15000,
    credit: 0,
    commission: 0,
    payment: 15000,
    balance: 17000,
    paymentMethod: 'UPI',
    referenceNumber: 'UPI-SBIN-77382910',
    createdAt: '2025-08-10T12:00:00Z',
  }
];

export const INITIAL_AUDIT_LOGS: PartnerAuditLog[] = [
  {
    id: 'aud-1',
    partnerOfficeId: 'po-2',
    partnerOfficeName: 'Rajasthan Gulf Manpower Hub - Sikar & Jaipur',
    action: 'Visa Batch Created',
    details: 'Created batch VB-2025-001 (10 Heavy Driver Visas)',
    user: 'Mohammad Rashid',
    timestamp: '2025-07-01T10:00:00Z',
  },
  {
    id: 'aud-2',
    partnerOfficeId: 'po-2',
    partnerOfficeName: 'Rajasthan Gulf Manpower Hub - Sikar & Jaipur',
    action: 'Candidate Linked',
    details: 'Linked candidate Mohammad Tariq Ansari to Visa VISA-2026-0001',
    user: 'Farhan Ansari',
    timestamp: '2025-07-10T10:00:00Z',
  },
  {
    id: 'aud-3',
    partnerOfficeId: 'po-2',
    partnerOfficeName: 'Rajasthan Gulf Manpower Hub - Sikar & Jaipur',
    action: 'Payment Recorded',
    details: 'Recorded ₹45,000 payment via Bank Transfer Ref: NEFT-HDFC-9912048',
    user: 'Zeeshan Khan',
    timestamp: '2025-08-19T14:30:00Z',
  }
];

export const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: 'cand-1',
    trackingId: 'AHT-2025-9102',
    fullName: 'Mohammad Tariq Ansari',
    fatherName: 'Abdul Ghaffar Ansari',
    passportNumber: 'Z5891042',
    passportExpiry: '2032-06-15',
    dateOfBirth: '1992-04-12',
    gender: 'Male',
    nationality: 'Indian',
    phoneNumber: '+91-9876501234',
    whatsappNumber: '+919876501234',
    email: 'tariq.ansari92@gmail.com',
    address: 'House No. 44, Near Jama Masjid, Sikar Road',
    city: 'Jaipur',
    state: 'Rajasthan',
    trade: 'Heavy Trailer Driver',
    experienceYears: 6,
    education: 'Secondary School (10th Pass) + Heavy Driving License',
    jobId: 'job-1',
    jobTitle: 'Heavy Trailer & Equipment Drivers',
    sponsorName: 'Almarai Logistics & Transport Co., Riyadh',
    visaCategory: 'Employment Work Visa',
    visaNumber: '130882194',
    mofaNumber: 'MOFA-SAU-882194',
    idNumber: 'SA-EMP-9821',
    wakalaNumber: 'WKL-2025-7712',
    status: 'ticket_booked',
    statusHistory: [
      { id: 'sth-1', status: 'applied', timestamp: '2025-07-10T10:00:00Z', updatedBy: 'Farhan Ansari', notes: 'Application registered with Indian Heavy License.' },
      { id: 'sth-2', status: 'interview_selected', timestamp: '2025-07-22T14:30:00Z', updatedBy: 'Mohammad Rashid', notes: 'Selected in client driving simulator & road test. Offer accepted.' },
      { id: 'sth-3', status: 'medical_fit', timestamp: '2025-08-01T11:00:00Z', updatedBy: 'Farhan Ansari', notes: 'GAMCA Medical at Approved Centre, Mumbai - Declared FIT.' },
      { id: 'sth-4', status: 'wakala_issued', timestamp: '2025-08-10T16:00:00Z', updatedBy: 'Zeeshan Khan', notes: 'Saudi Sponsor electronic Wakala assigned & verified in Enjaz.' },
      { id: 'sth-5', status: 'visa_stamped', timestamp: '2025-08-18T12:00:00Z', updatedBy: 'Zeeshan Khan', notes: 'Saudi Embassy Visa Stamping stamped successfully in passport.' },
      { id: 'sth-6', status: 'emigration_cleared', timestamp: '2025-08-21T09:30:00Z', updatedBy: 'Mohammad Rashid', notes: 'Protector of Emigrants clearance approved.' },
      { id: 'sth-7', status: 'ticket_booked', timestamp: '2025-08-24T15:00:00Z', updatedBy: 'Suhail Shaikh', notes: 'Flight ticket confirmed on Saudi Airlines SV-753 (DEL -> RUH).' }
    ],
    flightDetails: {
      airline: 'Saudia (Saudi Arabian Airlines)',
      flightNumber: 'SV-753',
      departureDate: '2025-09-02',
      departureTime: '19:40',
      departureCity: 'Delhi (DEL) - Indira Gandhi International T3',
      arrivalCity: 'Riyadh (RUH) - King Khalid International T4',
      pnr: 'SVR882B',
      seatNumber: '28A'
    },
    partnerAgentId: 'po-2',
    partnerAgentName: 'Rajasthan Gulf Manpower Hub - Sikar & Jaipur',
    agentCommission: 7000,
    agentCommissionStatus: 'paid',
    packageFee: 65000,
    totalPaid: 65000,
    balanceDue: 0,
    paymentHistory: [
      { id: 'pm-1', amount: 20000, date: '2025-07-10', paymentMethod: 'UPI', receiptNumber: 'REC-2025-104', note: 'Initial Registration & Medical Fee', receivedBy: 'Suhail Shaikh' },
      { id: 'pm-2', amount: 30000, date: '2025-08-11', paymentMethod: 'Bank Transfer', receiptNumber: 'REC-2025-156', note: 'Visa Stamping & Wakala Processing', receivedBy: 'Suhail Shaikh' },
      { id: 'pm-3', amount: 15000, date: '2025-08-24', paymentMethod: 'Cash', receiptNumber: 'REC-2025-198', note: 'Final Settlement before flight ticket handover', receivedBy: 'Suhail Shaikh' }
    ],
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
    passportScanUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=600&auto=format&fit=crop',
    medicalReportUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=600&auto=format&fit=crop',
    tradeCertificateUrl: '',
    cvUrl: '',
    remarks: 'Ready for departure. Briefing and deployment kit provided.',
    createdAt: '2025-07-10T10:00:00Z',
    updatedAt: '2025-08-24T15:00:00Z',
  },
  {
    id: 'cand-2',
    trackingId: 'AHT-2025-9108',
    fullName: 'Salman Khan Pathan',
    fatherName: 'Ayoob Khan Pathan',
    passportNumber: 'V9482103',
    passportExpiry: '2031-11-20',
    dateOfBirth: '1995-08-19',
    gender: 'Male',
    nationality: 'Indian',
    phoneNumber: '+91-9988112233',
    whatsappNumber: '+919988112233',
    email: 'salman.electrician@gmail.com',
    address: 'Plot 12, Gulshan Colony, Near Power House',
    city: 'Sikar',
    state: 'Rajasthan',
    trade: 'Industrial Electrician',
    experienceYears: 5,
    education: 'ITI Electrician Trade Certificate (NCVT)',
    jobId: 'job-2',
    jobTitle: 'Industrial Electricians & BMS Technicians',
    sponsorName: 'Al Fanar Electrical Systems Ltd., Jeddah',
    visaCategory: 'Work Visa',
    visaNumber: '141098231',
    mofaNumber: 'MOFA-SAU-991204',
    idNumber: 'SA-ALF-771',
    wakalaNumber: 'WKL-2025-8831',
    status: 'visa_stamped',
    statusHistory: [
      { id: 'sth-21', status: 'applied', timestamp: '2025-07-18T09:00:00Z', updatedBy: 'Farhan Ansari', notes: 'Documents verified with ITI marksheet.' },
      { id: 'sth-22', status: 'interview_selected', timestamp: '2025-07-28T16:00:00Z', updatedBy: 'Mohammad Rashid', notes: 'Client interview passed. Salary 2800 SAR + OT.' },
      { id: 'sth-23', status: 'medical_fit', timestamp: '2025-08-06T10:30:00Z', updatedBy: 'Farhan Ansari', notes: 'GAMCA Medical Delhi - FIT.' },
      { id: 'sth-24', status: 'wakala_issued', timestamp: '2025-08-14T11:00:00Z', updatedBy: 'Zeeshan Khan', notes: 'Electronic Wakala assigned by Al Fanar.' },
      { id: 'sth-25', status: 'visa_stamped', timestamp: '2025-08-22T17:00:00Z', updatedBy: 'Zeeshan Khan', notes: 'Visa stamped by Saudi Embassy Mumbai. Emigration submission in process.' }
    ],
    partnerAgentId: 'po-2',
    partnerAgentName: 'Rajasthan Gulf Manpower Hub - Sikar & Jaipur',
    agentCommission: 7000,
    agentCommissionStatus: 'pending',
    packageFee: 60000,
    totalPaid: 45000,
    balanceDue: 15000,
    paymentHistory: [
      { id: 'pm-21', amount: 20000, date: '2025-07-18', paymentMethod: 'UPI', receiptNumber: 'REC-2025-118', note: 'Advance Token', receivedBy: 'Suhail Shaikh' },
      { id: 'pm-22', amount: 25000, date: '2025-08-15', paymentMethod: 'Bank Transfer', receiptNumber: 'REC-2025-167', note: 'Visa Processing Instalment', receivedBy: 'Suhail Shaikh' }
    ],
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
    passportScanUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=600&auto=format&fit=crop',
    remarks: 'Emigration file sent to Protector office. Ticket booking scheduled next week.',
    createdAt: '2025-07-18T09:00:00Z',
    updatedAt: '2025-08-22T17:00:00Z',
  },
  {
    id: 'cand-3',
    trackingId: 'AHT-2025-9114',
    fullName: 'Abdul Raheem Shaikh',
    fatherName: 'Mustafa Shaikh',
    passportNumber: 'T8391024',
    passportExpiry: '2030-04-10',
    dateOfBirth: '1990-12-05',
    gender: 'Male',
    nationality: 'Indian',
    phoneNumber: '+91-9820556677',
    whatsappNumber: '+919820556677',
    email: 'abdul.raheem.hvac@yahoo.com',
    address: 'Near Old Bus Stand, Kurla West',
    city: 'Mumbai',
    state: 'Maharashtra',
    trade: 'HVAC Chiller Technician',
    experienceYears: 7,
    education: 'Diploma in Air Conditioning & Refrigeration',
    jobId: 'job-3',
    jobTitle: 'HVAC Chiller Maintenance Technicians',
    sponsorName: 'Zamil Air Conditioners & Facility Services, Dammam',
    visaCategory: 'Work Visa',
    status: 'medical_fit',
    statusHistory: [
      { id: 'sth-31', status: 'applied', timestamp: '2025-08-01T11:00:00Z', updatedBy: 'Farhan Ansari', notes: 'Candidate registered with 4 years Qatar experience certificate.' },
      { id: 'sth-32', status: 'interview_selected', timestamp: '2025-08-12T15:00:00Z', updatedBy: 'Mohammad Rashid', notes: 'Selected for Zamil Chiller division. Salary 3200 SAR.' },
      { id: 'sth-33', status: 'medical_fit', timestamp: '2025-08-20T14:00:00Z', updatedBy: 'Farhan Ansari', notes: 'GAMCA Medical Fit Certificate generated.' }
    ],
    partnerAgentId: 'po-3',
    partnerAgentName: 'Mumbai Coastal Overseas Careers',
    agentCommission: 5000,
    agentCommissionStatus: 'pending',
    packageFee: 55000,
    totalPaid: 25000,
    balanceDue: 30000,
    paymentHistory: [
      { id: 'pm-31', amount: 25000, date: '2025-08-01', paymentMethod: 'Cheque', receiptNumber: 'REC-2025-139', note: 'Registration & GAMCA fee', receivedBy: 'Suhail Shaikh' }
    ],
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop',
    remarks: 'Awaiting Wakala allocation number from Zamil Riyadh HR.',
    createdAt: '2025-08-01T11:00:00Z',
    updatedAt: '2025-08-20T14:00:00Z',
  },
  {
    id: 'cand-4',
    trackingId: 'AHT-2025-9120',
    fullName: 'Mohd Imran Siddiqui',
    fatherName: 'Noor Mohammad',
    passportNumber: 'P6729011',
    passportExpiry: '2033-01-25',
    dateOfBirth: '1988-03-14',
    gender: 'Male',
    nationality: 'Indian',
    phoneNumber: '+91-9811445566',
    whatsappNumber: '+919811445566',
    email: 'imran.civilforeman@gmail.com',
    address: 'B-45, Okhla Vihar, Jamia Nagar',
    city: 'New Delhi',
    state: 'Delhi',
    trade: 'Civil Construction Foreman',
    experienceYears: 9,
    education: 'Diploma in Civil Engineering',
    jobId: 'job-4',
    jobTitle: 'Shuttering Carpenters & Steel Fixers',
    sponsorName: 'Nesma & Partners Contracting Co., NEOM Project',
    visaCategory: 'Employment Work Visa',
    visaNumber: '119842103',
    mofaNumber: 'MOFA-SAU-761201',
    idNumber: 'SA-NES-409',
    wakalaNumber: 'WKL-2025-5591',
    status: 'deployed',
    statusHistory: [
      { id: 'sth-41', status: 'applied', timestamp: '2025-05-10T10:00:00Z', updatedBy: 'Farhan Ansari', notes: 'Applied with gulf return credentials.' },
      { id: 'sth-42', status: 'interview_selected', timestamp: '2025-05-20T12:00:00Z', updatedBy: 'Mohammad Rashid', notes: 'Client interview cleared as Foreman.' },
      { id: 'sth-43', status: 'medical_fit', timestamp: '2025-05-28T10:00:00Z', updatedBy: 'Farhan Ansari', notes: 'GAMCA Medical Fit.' },
      { id: 'sth-44', status: 'wakala_issued', timestamp: '2025-06-05T14:00:00Z', updatedBy: 'Zeeshan Khan', notes: 'Wakala allotted by Nesma.' },
      { id: 'sth-45', status: 'visa_stamped', timestamp: '2025-06-15T11:00:00Z', updatedBy: 'Zeeshan Khan', notes: 'Visa Stamped in passport.' },
      { id: 'sth-46', status: 'emigration_cleared', timestamp: '2025-06-20T16:00:00Z', updatedBy: 'Mohammad Rashid', notes: 'Emigration clear.' },
      { id: 'sth-47', status: 'ticket_booked', timestamp: '2025-06-24T12:00:00Z', updatedBy: 'Suhail Shaikh', notes: 'Ticket issued.' },
      { id: 'sth-48', status: 'deployed', timestamp: '2025-07-02T18:00:00Z', updatedBy: 'Mohammad Rashid', notes: 'Landed at Tabuk / NEOM Airport. Joined site successfully.' }
    ],
    flightDetails: {
      airline: 'Saudia',
      flightNumber: 'SV-761',
      departureDate: '2025-07-02',
      departureTime: '21:15',
      departureCity: 'Delhi (DEL)',
      arrivalCity: 'Tabuk (TUU) via Riyadh',
      pnr: 'NES992A'
    },
    partnerAgentId: 'po-1',
    partnerAgentName: 'Al-Hera Regional Partner - Delhi NCR',
    agentCommission: 6000,
    agentCommissionStatus: 'paid',
    packageFee: 70000,
    totalPaid: 70000,
    balanceDue: 0,
    paymentHistory: [
      { id: 'pm-41', amount: 70000, date: '2025-06-24', paymentMethod: 'Bank Transfer', receiptNumber: 'REC-2025-088', note: 'Full Package Payment Cleared', receivedBy: 'Suhail Shaikh' }
    ],
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop',
    remarks: 'Successfully deployed at NEOM Tabuk site. Iqama issued.',
    createdAt: '2025-05-10T10:00:00Z',
    updatedAt: '2025-07-02T18:00:00Z',
  },
  {
    id: 'cand-5',
    trackingId: 'AHT-2025-9125',
    fullName: 'Zeeshan Akhtar Qureshi',
    fatherName: 'Akhtar Ali Qureshi',
    passportNumber: 'U5192083',
    passportExpiry: '2032-09-12',
    dateOfBirth: '1996-02-28',
    gender: 'Male',
    nationality: 'Indian',
    phoneNumber: '+91-9848123456',
    whatsappNumber: '+919848123456',
    email: 'zeeshan.welder6g@gmail.com',
    address: 'Old City, Charminar Lane',
    city: 'Hyderabad',
    state: 'Telangana',
    trade: '6G TIG & MIG Pipe Welder',
    experienceYears: 4,
    education: 'ITI Welder Trade (NCVT)',
    jobId: 'job-6',
    jobTitle: '6G TIG & MIG Pipe Welders',
    sponsorName: 'Saudi Aramco Certified Subcontractor, Jubail',
    visaCategory: 'Work Visa',
    status: 'interview_selected',
    statusHistory: [
      { id: 'sth-51', status: 'applied', timestamp: '2025-08-19T10:00:00Z', updatedBy: 'Farhan Ansari', notes: 'Trade test sample plate welded.' },
      { id: 'sth-52', status: 'interview_selected', timestamp: '2025-08-24T16:00:00Z', updatedBy: 'Mohammad Rashid', notes: 'X-Ray test 100% clear. Selected for Jubail project at 3400 SAR.' }
    ],
    partnerAgentId: 'po-4',
    partnerAgentName: 'Hyderabad Deccan Gulf Consultancy',
    agentCommission: 6000,
    agentCommissionStatus: 'pending',
    packageFee: 55000,
    totalPaid: 15000,
    balanceDue: 40000,
    paymentHistory: [
      { id: 'pm-51', amount: 15000, date: '2025-08-19', paymentMethod: 'UPI', receiptNumber: 'REC-2025-188', note: 'Trade Test & Registration Token', receivedBy: 'Suhail Shaikh' }
    ],
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&auto=format&fit=crop',
    remarks: 'Scheduled for GAMCA Medical in Hyderabad tomorrow.',
    createdAt: '2025-08-19T10:00:00Z',
    updatedAt: '2025-08-24T16:00:00Z',
  }
];

export const INITIAL_UMRAH_BOOKINGS: UmrahBooking[] = [
  {
    id: 'ub-1',
    bookingCode: 'AHT-UB-2025-001',
    packageId: 'umr-1',
    packageName: '15 Days VIP Deluxe Umrah Group',
    leadPilgrimName: 'Haji Mohammad Farooq & Family',
    contactPhone: '+91-9214635385',
    whatsappNumber: '+919214635385',
    email: 'farooq.family@gmail.com',
    totalPilgrims: 4,
    pilgrims: [
      { fullName: 'Mohammad Farooq', passportNumber: 'P8920192', age: 58, gender: 'Male', relation: 'Self' },
      { fullName: 'Shabana Begum', passportNumber: 'P8920193', age: 52, gender: 'Female', relation: 'Wife' },
      { fullName: 'Aamir Farooq', passportNumber: 'P8920194', age: 26, gender: 'Male', relation: 'Son' },
      { fullName: 'Fatima Farooq', passportNumber: 'P8920195', age: 22, gender: 'Female', relation: 'Daughter' }
    ],
    preferredTravelDate: '2025-09-20',
    roomSharing: 'Quad',
    totalAmount: 460000,
    paidAmount: 460000,
    status: 'visa_issued',
    notes: 'Ground floor or fast elevator room requested in Swissôtel Makkah.',
    createdAt: '2025-08-05T10:00:00Z',
  },
  {
    id: 'ub-2',
    bookingCode: 'AHT-UB-2025-002',
    packageId: 'umr-2',
    packageName: '21 Days Complete Spiritual Umrah Group',
    leadPilgrimName: 'Dr. Abdul Qadir',
    contactPhone: '+91-9876543299',
    whatsappNumber: '+919876543299',
    email: 'dr.qadir@hotmail.com',
    totalPilgrims: 2,
    pilgrims: [
      { fullName: 'Dr. Abdul Qadir', passportNumber: 'K7829101', age: 48, gender: 'Male', relation: 'Self' },
      { fullName: 'Dr. Nasreen Qadir', passportNumber: 'K7829102', age: 45, gender: 'Female', relation: 'Wife' }
    ],
    preferredTravelDate: '2025-10-22',
    roomSharing: 'Double',
    totalAmount: 236000,
    paidAmount: 100000,
    status: 'confirmed',
    notes: 'Advance paid. Passports received for eVisa processing.',
    createdAt: '2025-08-14T15:30:00Z',
  }
];

export const INITIAL_MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tpl-1',
    title: 'Candidate Registration Confirmation',
    channel: 'whatsapp',
    eventTrigger: 'on_registered',
    triggerEvent: 'Candidate Registered',
    content: `Assalamu Alaikum *{candidate_name}*,\n\nWelcome to *AL-HERA TRAVELS* (Govt. Reg. Overseas Recruitment Agency).\nYour application has been registered successfully.\n\n📌 *Tracking ID:* {tracking_id}\n💼 *Trade Applied:* {trade}\n🌐 *Track Live Status:* {tracking_link}\n\nOur operations team will update you regarding interview schedules.\n📞 Helpline / WhatsApp: +91-9214635385`,
    bodyTemplate: `Assalamu Alaikum *{candidate_name}*,\n\nWelcome to *AL-HERA TRAVELS* (Govt. Reg. Overseas Recruitment Agency).\nYour application has been registered successfully.\n\n📌 *Tracking ID:* {tracking_id}\n💼 *Trade Applied:* {trade}\n🌐 *Track Live Status:* {tracking_link}\n\nOur operations team will update you regarding interview schedules.\n📞 Helpline / WhatsApp: +91-9214635385`,
    variables: ['candidate_name', 'tracking_id', 'trade', 'tracking_link', 'agency_phone']
  },
  {
    id: 'tpl-2',
    title: 'Interview & Trade Test Selection',
    channel: 'whatsapp',
    eventTrigger: 'on_selected',
    triggerEvent: 'Trade Test / Interview Selected',
    content: `🎉 Congratulations *{candidate_name}*!\n\nYou have been *SELECTED* for *{job_title}* in *Saudi Arabia* by *{sponsor_name}*.\n\n📌 *Candidate ID:* {tracking_id}\n💵 *Salary:* {salary_details}\n🏥 *Next Step:* Please report for GAMCA Medical Examination within 3 days.\n\nFor details, contact your Al-Hera officer at +91-9214635385.`,
    bodyTemplate: `🎉 Congratulations *{candidate_name}*!\n\nYou have been *SELECTED* for *{job_title}* in *Saudi Arabia* by *{sponsor_name}*.\n\n📌 *Candidate ID:* {tracking_id}\n💵 *Salary:* {salary_details}\n🏥 *Next Step:* Please report for GAMCA Medical Examination within 3 days.\n\nFor details, contact your Al-Hera officer at +91-9214635385.`,
    variables: ['candidate_name', 'job_title', 'sponsor_name', 'tracking_id', 'salary_details']
  },
  {
    id: 'tpl-3',
    title: 'Medical Fit Status Update',
    channel: 'whatsapp',
    eventTrigger: 'on_medical_fit',
    triggerEvent: 'GAMCA Medical Report Fit',
    content: `✅ Medical Update for *{candidate_name}* (ID: {tracking_id}):\n\nYour GAMCA Medical Report has been verified as *FIT*. We are now proceeding with Saudi Electronic Wakala and MOFA visa submission.\n\nTrack progress: {tracking_link}\n*AL-HERA TRAVELS*`,
    bodyTemplate: `✅ Medical Update for *{candidate_name}* (ID: {tracking_id}):\n\nYour GAMCA Medical Report has been verified as *FIT*. We are now proceeding with Saudi Electronic Wakala and MOFA visa submission.\n\nTrack progress: {tracking_link}\n*AL-HERA TRAVELS*`,
    variables: ['candidate_name', 'tracking_id', 'tracking_link']
  },
  {
    id: 'tpl-4',
    title: 'Saudi Visa Stamped Notice',
    channel: 'whatsapp',
    eventTrigger: 'on_visa_stamped',
    triggerEvent: 'Embassy Visa Stamped',
    content: `🇸🇦 *GREAT NEWS! VISA STAMPED* 🇸🇦\n\nDear *{candidate_name}*,\nYour Saudi Arabia Employment Visa has been *STAMPED* successfully.\n\n📌 *Visa No:* {visa_number}\n🏢 *Sponsor:* {sponsor_name}\n✈️ *Next Step:* Emigration clearance and flight ticket allocation.\n\n*AL-HERA TRAVELS* | WhatsApp: +91-9214635385`,
    bodyTemplate: `🇸🇦 *GREAT NEWS! VISA STAMPED* 🇸🇦\n\nDear *{candidate_name}*,\nYour Saudi Arabia Employment Visa has been *STAMPED* successfully.\n\n📌 *Visa No:* {visa_number}\n🏢 *Sponsor:* {sponsor_name}\n✈️ *Next Step:* Emigration clearance and flight ticket allocation.\n\n*AL-HERA TRAVELS* | WhatsApp: +91-9214635385`,
    variables: ['candidate_name', 'visa_number', 'sponsor_name']
  },
  {
    id: 'tpl-5',
    title: 'Flight Ticket & Departure Briefing',
    channel: 'whatsapp',
    eventTrigger: 'on_ticket_booked',
    triggerEvent: 'Flight Ticket Confirmed',
    content: `✈️ *FLIGHT CONFIRMATION & DEPARTURE DETAILS* ✈️\n\nDear *{candidate_name}* (ID: {tracking_id}),\nYour flight to Saudi Arabia is confirmed:\n\n🛫 *Airline & Flight:* {flight_details}\n📅 *Departure Date:* {departure_date}\n📍 *From:* {departure_city}\n🛬 *To:* {arrival_city}\n🎫 *PNR:* {pnr}\n\nPlease reach airport 4 hours before departure with original passport, visa copy and medical file.\n\nMay Allah grant you success!\n*AL-HERA TRAVELS* - +91-9214635385`,
    bodyTemplate: `✈️ *FLIGHT CONFIRMATION & DEPARTURE DETAILS* ✈️\n\nDear *{candidate_name}* (ID: {tracking_id}),\nYour flight to Saudi Arabia is confirmed:\n\n🛫 *Airline & Flight:* {flight_details}\n📅 *Departure Date:* {departure_date}\n📍 *From:* {departure_city}\n🛬 *To:* {arrival_city}\n🎫 *PNR:* {pnr}\n\nPlease reach airport 4 hours before departure with original passport, visa copy and medical file.\n\nMay Allah grant you success!\n*AL-HERA TRAVELS* - +91-9214635385`,
    variables: ['candidate_name', 'tracking_id', 'flight_details', 'departure_date', 'departure_city', 'arrival_city', 'pnr']
  },
  {
    id: 'tpl-6',
    title: 'Payment Acknowledgment Receipt',
    channel: 'whatsapp',
    eventTrigger: 'payment_receipt',
    triggerEvent: 'Candidate Payment Received',
    content: `🧾 *PAYMENT RECEIPT - AL-HERA TRAVELS*\n\nReceived with thanks from *{candidate_name}* (ID: {tracking_id}):\n💰 *Amount:* ₹{amount}\n🔢 *Receipt No:* {receipt_number}\n💳 *Payment Mode:* {payment_method}\n📊 *Remaining Balance:* ₹{balance_due}\n\nThank you for choosing AL-HERA TRAVELS.`,
    bodyTemplate: `🧾 *PAYMENT RECEIPT - AL-HERA TRAVELS*\n\nReceived with thanks from *{candidate_name}* (ID: {tracking_id}):\n💰 *Amount:* ₹{amount}\n🔢 *Receipt No:* {receipt_number}\n💳 *Payment Mode:* {payment_method}\n📊 *Remaining Balance:* ₹{balance_due}\n\nThank you for choosing AL-HERA TRAVELS.`,
    variables: ['candidate_name', 'tracking_id', 'amount', 'receipt_number', 'payment_method', 'balance_due']
  }
];

export const INITIAL_MESSAGE_LOGS: MessageLog[] = [
  {
    id: 'ml-1',
    recipientName: 'Mohammad Tariq Ansari',
    recipientPhone: '+919876501234',
    channel: 'whatsapp',
    templateUsed: 'Flight Ticket & Departure Briefing',
    templateTitle: 'Flight Ticket & Departure Briefing',
    messageText: 'Flight ticket confirmed on Saudi Airlines SV-753 for 2025-09-02.',
    messageBody: 'Flight ticket confirmed on Saudi Airlines SV-753 for 2025-09-02.',
    sentAt: '2025-08-24T15:05:00Z',
    status: 'delivered',
    trackingId: 'AHT-2025-9102'
  },
  {
    id: 'ml-2',
    recipientName: 'Salman Khan Pathan',
    recipientPhone: '+919988112233',
    channel: 'whatsapp',
    templateUsed: 'Saudi Visa Stamped Notice',
    templateTitle: 'Saudi Visa Stamped Notice',
    messageText: 'Visa No: 141098231 stamped for Al Fanar Electrical.',
    messageBody: 'Visa No: 141098231 stamped for Al Fanar Electrical.',
    sentAt: '2025-08-22T17:10:00Z',
    status: 'delivered',
    trackingId: 'AHT-2025-9108'
  }
];

const getRelativeDateStr = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_CRM_FOLLOWUPS: CrmFollowUp[] = [
  {
    id: 'crm-1',
    leadType: 'candidate',
    contactName: 'Mohammad Irfan Shaikh',
    phone: '+91-9820198765',
    whatsapp: '+919820198765',
    email: 'irfan.shaikh@gmail.com',
    city: 'Sikar',
    state: 'Rajasthan',
    targetRequirement: 'Heavy Trailer Driver - Riyadh (Almarai Logistics)',
    candidateId: 'cand-1',
    passportNumber: 'Z5891042',
    leadSource: 'whatsapp',
    priority: 'urgent',
    status: 'pending',
    channel: 'whatsapp',
    scheduledDate: getRelativeDateStr(-2), // Overdue by 2 days
    scheduledTime: '11:00 AM',
    assignedStaffId: 'u-1',
    assignedStaffName: 'Zeeshan Admin',
    lastContactedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    notes: 'Sent Saudi trade test center address in Mumbai. Candidate needs to confirm arrival date for Almarai client trial round.',
    outcome: '',
    tags: ['Heavy Driver', 'Trade Test', 'High Priority'],
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    history: [
      {
        id: 'h-101',
        timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
        actionType: 'scheduled',
        performedBy: 'Zeeshan Admin',
        notes: 'Initial inquiry received via WhatsApp for Saudi trailer driving vacancies.',
        newStatus: 'pending',
        nextFollowUpDate: getRelativeDateStr(-2),
      },
      {
        id: 'h-102',
        timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
        actionType: 'whatsapp',
        performedBy: 'Zeeshan Admin',
        notes: 'Shared salary breakdown (2,800 SAR + OT) and client interview schedule.',
        outcome: 'Interested, requested test center directions',
      },
    ],
  },
  {
    id: 'crm-2',
    leadType: 'umrah',
    contactName: 'Haji Ghulam Rasool Farooqi',
    phone: '+91-9876543210',
    whatsapp: '+919876543210',
    email: 'ghulam.rasool@outlook.com',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    targetRequirement: '15-Day Premium Ramadan Umrah Package (Quad Sharing - 4 Pax)',
    leadSource: 'website_apply',
    priority: 'hot',
    status: 'scheduled',
    channel: 'call',
    scheduledDate: getRelativeDateStr(0), // Due Today
    scheduledTime: '02:30 PM',
    assignedStaffId: 'u-1',
    assignedStaffName: 'Zeeshan Admin',
    lastContactedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    notes: 'Requested customized quote for family of 4. Needs hotel within 250m of Masjid Al-Haram. Call to finalize passport collection.',
    outcome: '',
    tags: ['Umrah 2025', 'Family Group', 'Direct Booking'],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    history: [
      {
        id: 'h-201',
        timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
        actionType: 'scheduled',
        performedBy: 'Operations Desk',
        notes: 'Lead received from online Umrah package inquiry form.',
        newStatus: 'scheduled',
      },
      {
        id: 'h-202',
        timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
        actionType: 'call',
        performedBy: 'Zeeshan Admin',
        notes: 'Explained hotel options (Dar Al Tawhid vs Swissotel Makkah). Client ready to confirm.',
        outcome: 'Follow up today at 2:30 PM for token advance',
        nextFollowUpDate: getRelativeDateStr(0),
      },
    ],
  },
  {
    id: 'crm-3',
    leadType: 'candidate',
    contactName: 'Arshad Ali Ansari',
    phone: '+91-9892112345',
    whatsapp: '+919892112345',
    city: 'Gorakhpur',
    state: 'Uttar Pradesh',
    targetRequirement: 'Industrial Electrician - Dammam (Al Fanar)',
    candidateId: 'cand-3',
    passportNumber: 'M8712390',
    leadSource: 'walk_in',
    priority: 'warm',
    status: 'scheduled',
    channel: 'whatsapp',
    scheduledDate: getRelativeDateStr(0), // Due Today
    scheduledTime: '04:00 PM',
    assignedStaffId: 'u-2',
    assignedStaffName: 'Tariq Recruiter',
    lastContactedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    notes: 'GAMCA Medical FIT certificate generated. Need candidate to courier original passport for Saudi Embassy visa stamping.',
    outcome: '',
    tags: ['Visa Stamping', 'GAMCA Fit', 'Courier Alert'],
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    history: [
      {
        id: 'h-301',
        timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
        actionType: 'scheduled',
        performedBy: 'Tariq Recruiter',
        notes: 'Interview cleared. Sent for GAMCA medical examination in Lucknow.',
      },
      {
        id: 'h-302',
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
        actionType: 'whatsapp',
        performedBy: 'Tariq Recruiter',
        notes: 'Verified medical report online. Advised to dispatch passport via Bluedart.',
        nextFollowUpDate: getRelativeDateStr(0),
      },
    ],
  },
  {
    id: 'crm-4',
    leadType: 'partner',
    contactName: 'Al-Falah Overseas Hub (Patna)',
    phone: '+91-9431098765',
    whatsapp: '+919431098765',
    email: 'patna.alfalah@gmail.com',
    city: 'Patna',
    state: 'Bihar',
    targetRequirement: 'Sub-Agent Regional Partnership (Bihar / Jharkhand)',
    leadSource: 'sub_agent',
    priority: 'warm',
    status: 'scheduled',
    channel: 'meeting',
    scheduledDate: getRelativeDateStr(2), // Upcoming in 2 days
    scheduledTime: '11:30 AM',
    assignedStaffId: 'u-1',
    assignedStaffName: 'Zeeshan Admin',
    lastContactedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    notes: 'Requested batch allocation of 10 Pipe Fitter visas for Saudi Aramco contractor. Meeting scheduled to verify sub-agent registration documents.',
    outcome: '',
    tags: ['Sub-Agent', 'Visa Batch', 'Bihar Region'],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    history: [
      {
        id: 'h-401',
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
        actionType: 'scheduled',
        performedBy: 'Zeeshan Admin',
        notes: 'Sub-agent registration form submitted via partner portal.',
        nextFollowUpDate: getRelativeDateStr(2),
      },
    ],
  },
  {
    id: 'crm-5',
    leadType: 'candidate',
    contactName: 'Zubair Ahmad Qureshi',
    phone: '+91-9819234567',
    whatsapp: '+919819234567',
    city: 'Hyderabad',
    state: 'Telangana',
    targetRequirement: 'HVAC Chiller Technician - NEOM Red Sea Project',
    candidateId: 'cand-4',
    passportNumber: 'N4589123',
    leadSource: 'referral',
    priority: 'hot',
    status: 'converted',
    channel: 'call',
    scheduledDate: getRelativeDateStr(-5),
    assignedStaffId: 'u-1',
    assignedStaffName: 'Zeeshan Admin',
    lastContactedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    notes: 'Client interview cleared with A+ grade. Full advance payment received, dossier created.',
    outcome: 'Successfully converted to registered Candidate (Tracking ID: AHT-2025-9108)',
    tags: ['Converted', 'NEOM Project', 'Dossier Created'],
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    history: [
      {
        id: 'h-501',
        timestamp: new Date(Date.now() - 10 * 86400000).toISOString(),
        actionType: 'scheduled',
        performedBy: 'Zeeshan Admin',
        notes: 'Referral from existing NEOM technician.',
      },
      {
        id: 'h-502',
        timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
        actionType: 'completed',
        performedBy: 'Zeeshan Admin',
        notes: 'Visa stamped and candidate dossier generated.',
        previousStatus: 'in_progress',
        newStatus: 'converted',
        outcome: 'Converted to Candidate AHT-2025-9108',
      },
    ],
  },
  {
    id: 'crm-6',
    leadType: 'job_inquiry',
    contactName: 'Dinesh Kumar Sharma',
    phone: '+91-9988776655',
    city: 'Jaipur',
    state: 'Rajasthan',
    targetRequirement: 'Civil Site Supervisor',
    leadSource: 'phone_call',
    priority: 'cold',
    status: 'lost',
    channel: 'call',
    scheduledDate: getRelativeDateStr(-8),
    assignedStaffId: 'u-2',
    assignedStaffName: 'Tariq Recruiter',
    lastContactedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    notes: 'Candidate specifically wants UAE / Dubai employment only. Declined Saudi Arabia contracts.',
    outcome: 'Lost: Candidate declined Saudi positions',
    tags: ['Dubai Only', 'Declined Saudi'],
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    history: [
      {
        id: 'h-601',
        timestamp: new Date(Date.now() - 12 * 86400000).toISOString(),
        actionType: 'scheduled',
        performedBy: 'Tariq Recruiter',
        notes: 'Inquired about Gulf engineering supervisor openings.',
      },
      {
        id: 'h-602',
        timestamp: new Date(Date.now() - 6 * 86400000).toISOString(),
        actionType: 'status_change',
        performedBy: 'Tariq Recruiter',
        notes: 'Not willing to relocate to Riyadh/Jeddah.',
        newStatus: 'lost',
        outcome: 'Lost: Refused Saudi destination',
      },
    ],
  },
];

// Reactive Global Store Helper with LocalStorage Persistence + Optional Supabase Sync
const KEYS = {
  CANDIDATES: 'al_hera_candidates_v1',
  JOBS: 'al_hera_jobs_v1',
  UMRAH_PACKAGES: 'al_hera_umrah_packages_v1',
  UMRAH_BOOKINGS: 'al_hera_umrah_bookings_v1',
  PARTNERS: 'al_hera_partners_v1',
  VISA_BATCHES: 'al_hera_visa_batches_v1',
  INDIVIDUAL_VISAS: 'al_hera_individual_visas_v1',
  PARTNER_PAYMENTS: 'al_hera_partner_payments_v1',
  PARTNER_LEDGER: 'al_hera_partner_ledger_v1',
  PARTNER_AUDIT_LOGS: 'al_hera_partner_audit_logs_v1',
  SLIDERS: 'al_hera_sliders_v1',
  TEMPLATES: 'al_hera_templates_v1',
  MESSAGE_LOGS: 'al_hera_msg_logs_v1',
  CURRENT_USER: 'al_hera_current_user_v1',
  AGENCY_INFO: 'al_hera_agency_info_v1',
  CRM_FOLLOWUPS: 'al_hera_crm_followups_v1',
};

export function loadItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item && item !== 'undefined' && item !== 'null' && item.trim() !== '') {
      const parsed = JSON.parse(item);
      if (parsed !== undefined && parsed !== null) {
        if (Array.isArray(fallback) && !Array.isArray(parsed)) {
          return fallback;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error(`Error loading key ${key}:`, err);
  }
  return fallback;
}

export function saveItem<T>(key: string, value: T): void {
  try {
    if (value === undefined || value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (err) {
    console.error(`Error saving key ${key}:`, err);
  }
}

// Global state getters and setters
export const getCandidates = (): Candidate[] => {
  const raw = loadItem<Candidate[]>(KEYS.CANDIDATES, INITIAL_CANDIDATES);
  const list = Array.isArray(raw) ? raw : INITIAL_CANDIDATES;
  let modified = false;
  const sanitized = list.map((c, idx) => {
    let item = { ...c };
    if (!item.id) {
      item.id = 'cand-' + (Date.now() + idx);
      modified = true;
    }
    if (!item.fullName) {
      item.fullName = 'Candidate';
      modified = true;
    }
    if (!item.passportNumber) {
      item.passportNumber = '';
    }
    if (!item.trade) {
      item.trade = 'General Worker';
    }
    if (!item.status) {
      item.status = 'applied';
    }
    item.packageFee = Number(item.packageFee) || 0;
    item.totalPaid = Number(item.totalPaid) || 0;
    item.balanceDue = item.packageFee - item.totalPaid;
    item.partnerCommission = Number(item.partnerCommission) || 0;

    if (!item.trackingId || item.trackingId === 'undefined' || item.trackingId.trim() === '') {
      const year = new Date().getFullYear();
      item.trackingId = `AHT-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
      modified = true;
    }
    if (!item.statusHistory || !Array.isArray(item.statusHistory) || item.statusHistory.length === 0) {
      item.statusHistory = [
        {
          id: 'sth-' + Date.now() + idx,
          status: item.status || 'applied',
          timestamp: item.createdAt || new Date().toISOString(),
          updatedBy: 'Al-Hera Operations',
          notes: 'Candidate dossier registered in system.',
        },
      ];
      modified = true;
    }
    if (!item.paymentHistory || !Array.isArray(item.paymentHistory)) {
      item.paymentHistory = [];
    } else {
      item.paymentHistory = item.paymentHistory.map((p, pIdx) => ({
        ...p,
        id: p.id || `pmt-${Date.now()}-${pIdx}`,
        amount: Number(p.amount) || 0,
        receiptNumber: p.receiptNumber || `REC-${Date.now().toString().slice(-6)}`,
        date: p.date || p.paymentDate || new Date().toISOString().split('T')[0],
        paymentMethod: p.paymentMethod || p.paymentMode || 'Cash',
      }));
    }
    return item;
  });

  if (modified) {
    saveItem(KEYS.CANDIDATES, sanitized);
  }
  return sanitized;
};
export const saveCandidates = (data: Candidate[]) => {
  saveItem(KEYS.CANDIDATES, data);
  syncCollectionToSupabase('candidates', data);
};

export const getJobs = (): JobVacancy[] => {
  const raw = loadItem<JobVacancy[]>(KEYS.JOBS, INITIAL_JOBS);
  const list = Array.isArray(raw) ? raw : INITIAL_JOBS;
  const candidates = getCandidates();
  return enrichAllJobsWithMetrics(list, candidates);
};

export const saveJobs = (data: JobVacancy[]) => {
  saveItem(KEYS.JOBS, data);
  syncCollectionToSupabase('jobs', data);
};

export const updateSingleJob = (job: JobVacancy, adminName = 'Admin'): JobVacancy[] => {
  const currentJobs = loadItem<JobVacancy[]>(KEYS.JOBS, INITIAL_JOBS);
  const candidates = getCandidates();
  const existingIdx = currentJobs.findIndex((j) => j.id === job.id);
  
  let updatedList: JobVacancy[];
  if (existingIdx >= 0) {
    const existing = currentJobs[existingIdx];
    const history = existing.statusHistory ? [...existing.statusHistory] : [];
    
    // Check if status changed
    const enriched = enrichJobWithMetrics(job, candidates);
    if (enriched.computedStatus && enriched.computedStatus !== (existing.computedStatus || existing.status)) {
      history.push(
        createJobStatusHistoryEvent(
          enriched.computedStatus,
          adminName,
          `Status updated to ${enriched.computedStatus}`,
          {
            required: enriched.openingsCount,
            applied: enriched.appliedCount,
            selected: enriched.selectedCount,
            assigned: enriched.assignedCount,
            remaining: enriched.remainingCount,
          }
        )
      );
    }

    const updatedJob: JobVacancy = {
      ...job,
      statusHistory: history,
      updatedAt: new Date().toISOString(),
    };
    updatedList = [...currentJobs];
    updatedList[existingIdx] = updatedJob;
  } else {
    // New job
    const history = [
      createJobStatusHistoryEvent('CREATED', adminName, 'Job vacancy created in system.', {
        required: Number(job.openingsCount || job.requiredCandidates || 1),
        applied: 0,
        selected: 0,
        assigned: 0,
        remaining: Number(job.openingsCount || job.requiredCandidates || 1),
      }),
      createJobStatusHistoryEvent('OPEN', adminName, 'Job opened for applications.', {
        required: Number(job.openingsCount || job.requiredCandidates || 1),
        applied: 0,
        selected: 0,
        assigned: 0,
        remaining: Number(job.openingsCount || job.requiredCandidates || 1),
      }),
    ];
    const newJob: JobVacancy = {
      ...job,
      statusHistory: history,
      createdAt: job.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    updatedList = [newJob, ...currentJobs];
  }

  saveJobs(updatedList);
  return enrichAllJobsWithMetrics(updatedList, candidates);
};

export const closeJobManually = (jobId: string, adminName: string, reason = 'Recruitment process completed'): JobVacancy[] => {
  const currentJobs = loadItem<JobVacancy[]>(KEYS.JOBS, INITIAL_JOBS);
  const candidates = getCandidates();
  const now = new Date().toISOString();

  const updated = currentJobs.map((j) => {
    if (j.id === jobId) {
      const enriched = enrichJobWithMetrics(j, candidates);
      const history = j.statusHistory ? [...j.statusHistory] : [];
      history.push(
        createJobStatusHistoryEvent('CLOSED', adminName, reason, {
          required: enriched.openingsCount,
          applied: enriched.appliedCount,
          selected: enriched.selectedCount,
          assigned: enriched.assignedCount,
          remaining: enriched.remainingCount,
        })
      );
      return {
        ...j,
        isManuallyClosed: true,
        closedAt: now,
        closedBy: adminName,
        status: 'CLOSED',
        statusHistory: history,
        updatedAt: now,
      };
    }
    return j;
  });

  saveJobs(updated);
  return enrichAllJobsWithMetrics(updated, candidates);
};

export const cancelJobManually = (jobId: string, adminName: string, reason = 'Job vacancy cancelled'): JobVacancy[] => {
  const currentJobs = loadItem<JobVacancy[]>(KEYS.JOBS, INITIAL_JOBS);
  const candidates = getCandidates();
  const now = new Date().toISOString();

  const updated = currentJobs.map((j) => {
    if (j.id === jobId) {
      const enriched = enrichJobWithMetrics(j, candidates);
      const history = j.statusHistory ? [...j.statusHistory] : [];
      history.push(
        createJobStatusHistoryEvent('CANCELLED', adminName, reason, {
          required: enriched.openingsCount,
          applied: enriched.appliedCount,
          selected: enriched.selectedCount,
          assigned: enriched.assignedCount,
          remaining: enriched.remainingCount,
        })
      );
      return {
        ...j,
        isCancelled: true,
        cancelledAt: now,
        cancelledBy: adminName,
        status: 'CANCELLED',
        statusHistory: history,
        updatedAt: now,
      };
    }
    return j;
  });

  saveJobs(updated);
  return enrichAllJobsWithMetrics(updated, candidates);
};

export const reopenJobManually = (jobId: string, adminName: string, additionalVacancies = 0): JobVacancy[] => {
  const currentJobs = loadItem<JobVacancy[]>(KEYS.JOBS, INITIAL_JOBS);
  const candidates = getCandidates();
  const now = new Date().toISOString();

  const updated = currentJobs.map((j) => {
    if (j.id === jobId) {
      const newOpenings = additionalVacancies > 0 ? (j.openingsCount || 0) + additionalVacancies : j.openingsCount;
      const history = j.statusHistory ? [...j.statusHistory] : [];
      const metrics = computeJobCandidateMetrics({ ...j, openingsCount: newOpenings, isManuallyClosed: false, isCancelled: false }, candidates);
      
      history.push(
        createJobStatusHistoryEvent('REOPENED', adminName, `Job reopened by ${adminName}${additionalVacancies > 0 ? ` (+${additionalVacancies} new vacancies added)` : ''}.`, {
          required: metrics.required,
          applied: metrics.applied,
          selected: metrics.selected,
          assigned: metrics.assigned,
          remaining: metrics.remaining,
        })
      );
      
      return {
        ...j,
        openingsCount: newOpenings,
        requiredCandidates: newOpenings,
        isManuallyClosed: false,
        closedAt: undefined,
        closedBy: undefined,
        isCancelled: false,
        cancelledAt: undefined,
        cancelledBy: undefined,
        status: metrics.status,
        statusHistory: history,
        updatedAt: now,
      };
    }
    return j;
  });

  saveJobs(updated);
  return enrichAllJobsWithMetrics(updated, candidates);
};

export const getUmrahPackages = (): UmrahPackage[] => {
  const raw = loadItem<UmrahPackage[]>(KEYS.UMRAH_PACKAGES, INITIAL_UMRAH_PACKAGES);
  return Array.isArray(raw) ? raw : INITIAL_UMRAH_PACKAGES;
};
export const saveUmrahPackages = (data: UmrahPackage[]) => {
  saveItem(KEYS.UMRAH_PACKAGES, data);
  syncCollectionToSupabase('packages', data);
};

export const getUmrahBookings = (): UmrahBooking[] => {
  const raw = loadItem<UmrahBooking[]>(KEYS.UMRAH_BOOKINGS, INITIAL_UMRAH_BOOKINGS);
  return Array.isArray(raw) ? raw : INITIAL_UMRAH_BOOKINGS;
};
export const saveUmrahBookings = (data: UmrahBooking[]) => {
  saveItem(KEYS.UMRAH_BOOKINGS, data);
  syncCollectionToSupabase('bookings', data);
};

export const getPartners = (): PartnerOffice[] => {
  const raw = loadItem<PartnerOffice[]>(KEYS.PARTNERS, INITIAL_PARTNERS);
  const list = Array.isArray(raw) ? raw : INITIAL_PARTNERS;
  const batches = getVisaBatches();
  const visas = getIndividualVisas();
  const candidates = getCandidates();
  const payments = getPartnerPayments();

  // Enrich each partner with real-time financial rollups
  return list.map((partner) => {
    const financials = computePartnerFinancials(partner, batches, visas, candidates, payments);
    return {
      ...partner,
      ...financials,
      balancePending: financials.outstandingPayable,
    };
  });
};
export const savePartners = (data: PartnerOffice[]) => {
  saveItem(KEYS.PARTNERS, data);
  syncCollectionToSupabase('partners', data);
};

export const getVisaBatches = (): VisaBatch[] => {
  const raw = loadItem<VisaBatch[]>(KEYS.VISA_BATCHES, INITIAL_VISA_BATCHES);
  return Array.isArray(raw) ? raw : INITIAL_VISA_BATCHES;
};
export const saveVisaBatches = (data: VisaBatch[]) => {
  saveItem(KEYS.VISA_BATCHES, data);
  syncCollectionToSupabase('visa_batches', data);
};

export const getIndividualVisas = (): IndividualVisa[] => {
  const raw = loadItem<IndividualVisa[]>(KEYS.INDIVIDUAL_VISAS, INITIAL_INDIVIDUAL_VISAS);
  return Array.isArray(raw) ? raw : INITIAL_INDIVIDUAL_VISAS;
};
export const saveIndividualVisas = (data: IndividualVisa[]) => {
  saveItem(KEYS.INDIVIDUAL_VISAS, data);
  syncCollectionToSupabase('individual_visas', data);
};

export const getPartnerPayments = (): PartnerOfficePayment[] => {
  const raw = loadItem<PartnerOfficePayment[]>(KEYS.PARTNER_PAYMENTS, INITIAL_PARTNER_PAYMENTS);
  return Array.isArray(raw) ? raw : INITIAL_PARTNER_PAYMENTS;
};
export const savePartnerPayments = (data: PartnerOfficePayment[]) => {
  saveItem(KEYS.PARTNER_PAYMENTS, data);
  syncCollectionToSupabase('partner_payments', data);
};

export const getPartnerLedgerEntries = (): PartnerOfficeLedgerEntry[] => {
  const raw = loadItem<PartnerOfficeLedgerEntry[]>(KEYS.PARTNER_LEDGER, INITIAL_PARTNER_LEDGER);
  const list = Array.isArray(raw) ? raw : INITIAL_PARTNER_LEDGER;
  return computeRunningLedger(list);
};
export const savePartnerLedgerEntries = (data: PartnerOfficeLedgerEntry[]) => {
  saveItem(KEYS.PARTNER_LEDGER, data);
  syncCollectionToSupabase('partner_ledger', data);
};
export const getPartnerLedger = getPartnerLedgerEntries;
export const savePartnerLedger = savePartnerLedgerEntries;

export const getPartnerAuditLogs = (): PartnerAuditLog[] => {
  const raw = loadItem<PartnerAuditLog[]>(KEYS.PARTNER_AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  return Array.isArray(raw) ? raw : INITIAL_AUDIT_LOGS;
};
export const savePartnerAuditLogs = (data: PartnerAuditLog[]) => {
  saveItem(KEYS.PARTNER_AUDIT_LOGS, data);
  syncCollectionToSupabase('partner_audit_logs', data);
};

export const addAuditLog = (
  partnerOfficeId: string,
  partnerOfficeName: string,
  action: string,
  details: string,
  user: string,
  oldValue?: string,
  newValue?: string
) => {
  const logs = getPartnerAuditLogs();
  const newLog: PartnerAuditLog = {
    id: 'aud-' + Date.now(),
    partnerOfficeId,
    partnerOfficeName,
    action,
    details,
    user,
    oldValue,
    newValue,
    timestamp: new Date().toISOString(),
  };
  savePartnerAuditLogs([newLog, ...logs]);
};

/**
 * Add a new Visa Batch and automatically generate individual visa slots
 */
export const addVisaBatchWithIndividualVisas = (
  batchData: Partial<VisaBatch>,
  customVisaNumbers?: string[],
  user: string = 'Administrator'
): { batch: VisaBatch; count: number } => {
  const allBatches = getVisaBatches();
  const allVisas = getIndividualVisas();
  const allLedger = getPartnerLedgerEntries();

  const total = Math.max(1, Number(batchData.totalVisas) || 1);
  const amtPerVisa = Math.max(0, Number(batchData.amountPerVisa) || 0);
  const totalAmount = total * amtPerVisa;

  const year = new Date().getFullYear();
  const batchCode = batchData.batchId || `VB-${year}-${(allBatches.length + 1).toString().padStart(3, '0')}`;
  const batchId = batchData.id || 'vb-' + Date.now();

  const newBatch: VisaBatch = {
    id: batchId,
    batchId: batchCode,
    partnerOfficeId: batchData.partnerOfficeId || '',
    partnerOfficeName: batchData.partnerOfficeName || '',
    visaType: batchData.visaType || 'Employment Work Visa',
    jobTitle: batchData.jobTitle || 'General Trade',
    sectorCity: batchData.sectorCity || 'Saudi Arabia',
    totalVisas: total,
    usedVisas: 0,
    remainingVisas: total,
    amountPerVisa: amtPerVisa,
    totalAmount: totalAmount,
    usedVisaValue: 0,
    remainingVisaValue: totalAmount,
    dateReceived: batchData.dateReceived || new Date().toISOString().split('T')[0],
    expiryDate: batchData.expiryDate || '',
    notes: batchData.notes || '',
    status: 'Available',
    createdAt: new Date().toISOString(),
  };

  // Generate individual visas
  const generatedVisas: IndividualVisa[] = [];
  const startSeq = allVisas.length + 1;
  for (let i = 0; i < total; i++) {
    const vSeq = (startSeq + i).toString().padStart(4, '0');
    const customNo = customVisaNumbers && customVisaNumbers[i] ? customVisaNumbers[i] : undefined;

    const indVisa: IndividualVisa = {
      id: `visa-${Date.now()}-${i}`,
      visaId: `VISA-${year}-${vSeq}`,
      partnerOfficeId: newBatch.partnerOfficeId,
      partnerOfficeName: newBatch.partnerOfficeName,
      batchId: newBatch.id,
      batchCode: newBatch.batchId,
      jobTitle: newBatch.jobTitle,
      sectorCity: newBatch.sectorCity,
      visaType: newBatch.visaType,
      visaNumber: customNo || '',
      visaAmount: amtPerVisa,
      candidateAmount: 0,
      alHeraCommission: 0,
      partnerPayableAmount: amtPerVisa,
      paymentStatus: 'Unpaid',
      visaStatus: 'Available',
      notes: `Generated from Batch ${newBatch.batchId}`,
      createdAt: new Date().toISOString(),
    };
    generatedVisas.push(indVisa);
  }

  // Record in Ledger as Visa Received
  const ledgerTx: PartnerOfficeLedgerEntry = {
    id: 'tx-' + Date.now(),
    transactionId: `TXN-${year}-${(allLedger.length + 1).toString().padStart(3, '0')}`,
    partnerOfficeId: newBatch.partnerOfficeId,
    date: newBatch.dateReceived,
    type: 'Visa Received',
    description: `Received Batch ${newBatch.batchId} (${newBatch.totalVisas} ${newBatch.jobTitle} Visas @ ₹${newBatch.amountPerVisa.toLocaleString('en-IN')})`,
    debit: 0,
    credit: 0,
    commission: 0,
    payment: 0,
    balance: 0,
    notes: newBatch.notes || 'Visa block added to inventory',
    createdAt: new Date().toISOString(),
  };

  saveVisaBatches([newBatch, ...allBatches]);
  saveIndividualVisas([...allVisas, ...generatedVisas]);
  savePartnerLedgerEntries([...allLedger, ledgerTx]);
  addAuditLog(
    newBatch.partnerOfficeId,
    newBatch.partnerOfficeName,
    'Visa Batch Created',
    `Added Batch ${newBatch.batchId} with ${total} visas for ${newBatch.jobTitle}`,
    user
  );

  return { batch: newBatch, count: total };
};

/**
 * Assign an available Visa to a Candidate
 */
export const linkVisaToCandidate = (
  visaId: string,
  candidateId: string,
  candidatePackageFee: number,
  alHeraCommission: number,
  partnerPayableAmount: number,
  user: string = 'Administrator'
): { success: boolean; message: string } => {
  const allVisas = getIndividualVisas();
  const allBatches = getVisaBatches();
  const allCandidates = getCandidates();
  const allLedger = getPartnerLedgerEntries();

  const visaIndex = allVisas.findIndex((v) => v.id === visaId || v.visaId === visaId);
  if (visaIndex === -1) {
    return { success: false, message: 'Selected visa record not found.' };
  }

  const targetVisa = allVisas[visaIndex];
  if (targetVisa.candidateId && targetVisa.candidateId !== candidateId) {
    return { success: false, message: `Visa ${targetVisa.visaId} is already assigned to candidate ${targetVisa.candidateName || targetVisa.candidateId}.` };
  }

  const candIndex = allCandidates.findIndex((c) => c.id === candidateId);
  if (candIndex === -1) {
    return { success: false, message: 'Candidate not found.' };
  }

  const targetCandidate = allCandidates[candIndex];

  // Update Visa
  const updatedVisa: IndividualVisa = {
    ...targetVisa,
    candidateId: targetCandidate.id,
    candidateTrackingId: targetCandidate.trackingId,
    candidateName: targetCandidate.fullName,
    candidatePassport: targetCandidate.passportNumber,
    candidateAmount: candidatePackageFee,
    alHeraCommission: alHeraCommission,
    partnerPayableAmount: partnerPayableAmount,
    visaStatus: 'Candidate Assigned',
    dateAssigned: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString(),
  };

  const updatedVisas = [...allVisas];
  updatedVisas[visaIndex] = updatedVisa;

  // Update Candidate
  const updatedCandidate: Candidate = {
    ...targetCandidate,
    partnerOfficeId: updatedVisa.partnerOfficeId,
    partnerOfficeName: updatedVisa.partnerOfficeName,
    partnerAgentId: updatedVisa.partnerOfficeId,
    partnerAgentName: updatedVisa.partnerOfficeName,
    visaId: updatedVisa.visaId,
    visaBatchId: updatedVisa.batchCode || updatedVisa.batchId,
    visaAmount: updatedVisa.visaAmount,
    alHeraCommission: alHeraCommission,
    partnerPayableAmount: partnerPayableAmount,
    partnerCommission: alHeraCommission,
    packageFee: candidatePackageFee || targetCandidate.packageFee,
    balanceDue: (candidatePackageFee || targetCandidate.packageFee) - targetCandidate.totalPaid,
    updatedAt: new Date().toISOString(),
  };

  const updatedCandidates = [...allCandidates];
  updatedCandidates[candIndex] = updatedCandidate;

  // Update Batch statistics
  const updatedBatches = allBatches.map((b) => {
    if (b.id === updatedVisa.batchId || b.batchId === updatedVisa.batchCode) {
      const used = (allVisas.filter((v) => (v.batchId === b.id || v.batchCode === b.batchId) && (v.id === updatedVisa.id || v.candidateId)).length);
      const remaining = Math.max(0, b.totalVisas - used);
      return {
        ...b,
        usedVisas: used,
        remainingVisas: remaining,
        usedVisaValue: used * b.amountPerVisa,
        remainingVisaValue: remaining * b.amountPerVisa,
        status: (remaining === 0 ? 'Fully Used' : used > 0 ? 'Partially Used' : 'Available') as any,
      };
    }
    return b;
  });

  // Record Ledger Transaction
  const year = new Date().getFullYear();
  const ledgerTx: PartnerOfficeLedgerEntry = {
    id: 'tx-' + Date.now(),
    transactionId: `TXN-${year}-${(allLedger.length + 1).toString().padStart(3, '0')}`,
    partnerOfficeId: updatedVisa.partnerOfficeId,
    date: new Date().toISOString().split('T')[0],
    type: 'Candidate Assigned',
    visaId: updatedVisa.visaId,
    candidateId: updatedCandidate.trackingId,
    candidateName: updatedCandidate.fullName,
    description: `Candidate ${updatedCandidate.fullName} (${updatedCandidate.trackingId}) linked to Visa ${updatedVisa.visaId}`,
    debit: 0,
    credit: partnerPayableAmount,
    commission: alHeraCommission,
    payment: 0,
    balance: partnerPayableAmount,
    notes: `Visa fee ₹${updatedVisa.visaAmount.toLocaleString('en-IN')}, Commission ₹${alHeraCommission.toLocaleString('en-IN')}`,
    createdAt: new Date().toISOString(),
  };

  saveIndividualVisas(updatedVisas);
  saveCandidates(updatedCandidates);
  saveVisaBatches(updatedBatches);
  savePartnerLedgerEntries([...allLedger, ledgerTx]);
  addAuditLog(
    updatedVisa.partnerOfficeId,
    updatedVisa.partnerOfficeName,
    'Candidate Assigned to Visa',
    `Linked ${updatedCandidate.fullName} (${updatedCandidate.trackingId}) to Visa ${updatedVisa.visaId}`,
    user
  );

  return { success: true, message: `Successfully assigned Visa ${updatedVisa.visaId} to ${updatedCandidate.fullName}.` };
};

/**
 * Record a Payment made to a Partner Office
 */
export const recordPartnerPayment = (
  paymentData: Partial<PartnerOfficePayment>,
  user: string = 'Administrator'
): { success: boolean; payment: PartnerOfficePayment; message: string } => {
  const allPayments = getPartnerPayments();
  const allLedger = getPartnerLedgerEntries();
  const year = new Date().getFullYear();
  const payNumber = paymentData.paymentNumber || `POP-${year}-${(allPayments.length + 1).toString().padStart(3, '0')}`;

  const newPayment: PartnerOfficePayment = {
    id: paymentData.id || 'pop-' + Date.now(),
    paymentNumber: payNumber,
    partnerOfficeId: paymentData.partnerOfficeId || '',
    partnerOfficeName: paymentData.partnerOfficeName || '',
    amount: Math.max(0, Number(paymentData.amount) || 0),
    paymentDate: paymentData.paymentDate || new Date().toISOString().split('T')[0],
    paymentMethod: paymentData.paymentMethod || 'Bank Transfer',
    referenceNumber: paymentData.referenceNumber || `UTR-${Date.now()}`,
    relatedBatchId: paymentData.relatedBatchId,
    relatedBatchCode: paymentData.relatedBatchCode,
    relatedVisaId: paymentData.relatedVisaId,
    relatedVisaCode: paymentData.relatedVisaCode,
    relatedCandidateId: paymentData.relatedCandidateId,
    relatedCandidateName: paymentData.relatedCandidateName,
    notes: paymentData.notes || '',
    receiptUrl: paymentData.receiptUrl,
    recordedBy: user,
    createdAt: new Date().toISOString(),
  };

  // Ledger transaction
  const ledgerTx: PartnerOfficeLedgerEntry = {
    id: 'tx-' + Date.now(),
    transactionId: `TXN-${year}-${(allLedger.length + 1).toString().padStart(3, '0')}`,
    partnerOfficeId: newPayment.partnerOfficeId,
    date: newPayment.paymentDate,
    type: 'Payment Made',
    visaId: newPayment.relatedVisaCode,
    candidateName: newPayment.relatedCandidateName,
    description: `Payment of ₹${newPayment.amount.toLocaleString('en-IN')} via ${newPayment.paymentMethod} (Ref: ${newPayment.referenceNumber})`,
    debit: newPayment.amount,
    credit: 0,
    commission: 0,
    payment: newPayment.amount,
    balance: 0,
    paymentMethod: newPayment.paymentMethod,
    referenceNumber: newPayment.referenceNumber,
    notes: newPayment.notes || 'Partner office account settled',
    createdAt: new Date().toISOString(),
  };

  savePartnerPayments([newPayment, ...allPayments]);
  savePartnerLedgerEntries([...allLedger, ledgerTx]);
  addAuditLog(
    newPayment.partnerOfficeId,
    newPayment.partnerOfficeName,
    'Payment Recorded',
    `Paid ₹${newPayment.amount.toLocaleString('en-IN')} via ${newPayment.paymentMethod} Ref: ${newPayment.referenceNumber}`,
    user
  );

  return { success: true, payment: newPayment, message: `Payment ${payNumber} of ₹${newPayment.amount.toLocaleString('en-IN')} recorded successfully.` };
};

export const getSliders = (): SliderBanner[] => {
  const raw = loadItem<SliderBanner[]>(KEYS.SLIDERS, INITIAL_SLIDERS);
  return Array.isArray(raw) ? raw : INITIAL_SLIDERS;
};
export const saveSliders = (data: SliderBanner[]) => {
  saveItem(KEYS.SLIDERS, data);
  syncCollectionToSupabase('sliders', data);
};

export const getMessageTemplates = (): MessageTemplate[] => {
  const raw = loadItem<MessageTemplate[]>(KEYS.TEMPLATES, INITIAL_MESSAGE_TEMPLATES);
  const list = Array.isArray(raw) && raw.length > 0 ? raw : INITIAL_MESSAGE_TEMPLATES;
  return list.map((tpl, idx) => {
    const text = tpl.bodyTemplate || tpl.content || '';
    const extractedMatches = text.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
    const extractedVars = Array.from(new Set(extractedMatches.map((m) => m.replace(/[{}]/g, ''))));
    const variables =
      Array.isArray(tpl.variables) && tpl.variables.length > 0
        ? tpl.variables
        : extractedVars.length > 0
        ? extractedVars
        : ['candidate_name', 'tracking_id', 'job_title', 'status', 'agency_phone'];

    return {
      id: tpl.id || `tpl-${idx + 1}`,
      title: tpl.title || `Template #${idx + 1}`,
      channel: tpl.channel || 'whatsapp',
      eventTrigger: tpl.eventTrigger || tpl.triggerEvent || 'custom',
      triggerEvent: tpl.triggerEvent || tpl.eventTrigger || 'Custom Event',
      content: text,
      bodyTemplate: text,
      variables,
    };
  });
};
export const saveMessageTemplates = (data: MessageTemplate[]) => {
  saveItem(KEYS.TEMPLATES, data);
  syncCollectionToSupabase('templates', data);
};
export const getSmsTemplates = getMessageTemplates;
export const saveSmsTemplates = saveMessageTemplates;

export const getMessageLogs = (): MessageLog[] => {
  const raw = loadItem<MessageLog[]>(KEYS.MESSAGE_LOGS, INITIAL_MESSAGE_LOGS);
  const list = Array.isArray(raw) && raw.length > 0 ? raw : INITIAL_MESSAGE_LOGS;
  return list.map((log, idx) => ({
    id: log.id || `ml-${idx + 1}`,
    recipientName: log.recipientName || 'Candidate',
    recipientPhone: log.recipientPhone || '',
    channel: log.channel || 'whatsapp',
    templateUsed: log.templateUsed || log.templateTitle || 'Notification',
    templateTitle: log.templateTitle || log.templateUsed || 'Notification',
    messageText: log.messageText || log.messageBody || '',
    messageBody: log.messageBody || log.messageText || '',
    sentAt: log.sentAt || new Date().toISOString(),
    status: log.status || 'delivered',
    trackingId: log.trackingId || '',
  }));
};
export const saveMessageLogs = (data: MessageLog[]) => {
  saveItem(KEYS.MESSAGE_LOGS, data);
  syncCollectionToSupabase('logs', data);
};
export const getSentMessages = getMessageLogs;

export const getUsers = (): AppUser[] => getAuthUsers();
export const saveUsers = (data: AppUser[]) => saveAuthUsers(data);

export const getCurrentUser = (): AppUser | null => {
  try {
    const user = loadItem<AppUser | null>(KEYS.CURRENT_USER, null);
    if (user && typeof user === 'object' && user.email && user.name) {
      return user;
    }
    return null;
  } catch {
    return null;
  }
};
export const saveCurrentUser = (user: AppUser | null) => {
  if (user && typeof user === 'object' && user.email) {
    saveItem(KEYS.CURRENT_USER, user);
  } else {
    try {
      localStorage.removeItem(KEYS.CURRENT_USER);
    } catch {
      // ignore
    }
  }
};

export const getFollowUps = (): CrmFollowUp[] => {
  const raw = loadItem<CrmFollowUp[]>(KEYS.CRM_FOLLOWUPS, INITIAL_CRM_FOLLOWUPS);
  const list = Array.isArray(raw) && raw.length > 0 ? raw : INITIAL_CRM_FOLLOWUPS;
  return list.map((item, idx) => ({
    id: item.id || `crm-${idx + 1}`,
    leadType: item.leadType || 'candidate',
    contactName: item.contactName || 'Lead Contact',
    phone: item.phone || '',
    whatsapp: item.whatsapp || item.phone || '',
    email: item.email || '',
    city: item.city || '',
    state: item.state || '',
    targetRequirement: item.targetRequirement || '',
    candidateId: item.candidateId,
    passportNumber: item.passportNumber,
    leadSource: item.leadSource || 'phone_call',
    priority: item.priority || 'warm',
    status: item.status || 'pending',
    channel: item.channel || 'call',
    scheduledDate: item.scheduledDate || new Date().toISOString().split('T')[0],
    scheduledTime: item.scheduledTime || '11:00 AM',
    assignedStaffId: item.assignedStaffId || 'u-1',
    assignedStaffName: item.assignedStaffName || 'Assigned Staff',
    lastContactedAt: item.lastContactedAt,
    notes: item.notes || '',
    outcome: item.outcome || '',
    history: Array.isArray(item.history) ? item.history : [],
    tags: Array.isArray(item.tags) ? item.tags : [],
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
  }));
};

export const saveFollowUps = (data: CrmFollowUp[]) => {
  saveItem(KEYS.CRM_FOLLOWUPS, data);
  syncCollectionToSupabase('crm_followups', data);
};

export const addFollowUp = (
  leadData: Partial<CrmFollowUp>,
  performedBy: string = 'Staff'
): CrmFollowUp => {
  const current = getFollowUps();
  const now = new Date().toISOString();
  const today = now.split('T')[0];

  const initialHistory: FollowUpHistoryEntry[] = leadData.history || [
    {
      id: 'h-' + Date.now(),
      timestamp: now,
      actionType: 'scheduled',
      performedBy,
      notes: leadData.notes || 'Follow-up lead created and scheduled.',
      newStatus: leadData.status || 'pending',
      nextFollowUpDate: leadData.scheduledDate || today,
    },
  ];

  const newFollowUp: CrmFollowUp = {
    id: leadData.id || 'crm-' + Date.now(),
    leadType: leadData.leadType || 'candidate',
    contactName: leadData.contactName || 'New Lead',
    phone: leadData.phone || '',
    whatsapp: leadData.whatsapp || leadData.phone || '',
    email: leadData.email || '',
    city: leadData.city || '',
    state: leadData.state || '',
    targetRequirement: leadData.targetRequirement || '',
    candidateId: leadData.candidateId,
    passportNumber: leadData.passportNumber,
    leadSource: leadData.leadSource || 'phone_call',
    priority: leadData.priority || 'warm',
    status: leadData.status || 'pending',
    channel: leadData.channel || 'call',
    scheduledDate: leadData.scheduledDate || today,
    scheduledTime: leadData.scheduledTime || '11:00 AM',
    assignedStaffId: leadData.assignedStaffId || 'u-1',
    assignedStaffName: leadData.assignedStaffName || performedBy,
    lastContactedAt: leadData.lastContactedAt,
    notes: leadData.notes || '',
    outcome: leadData.outcome || '',
    history: initialHistory,
    tags: leadData.tags || [],
    createdAt: leadData.createdAt || now,
    updatedAt: now,
  };

  const updated = [newFollowUp, ...current];
  saveFollowUps(updated);
  return newFollowUp;
};

export const updateFollowUp = (
  id: string,
  updates: Partial<CrmFollowUp>,
  historyAction?: Partial<FollowUpHistoryEntry>
): CrmFollowUp | null => {
  const current = getFollowUps();
  const existing = current.find((f) => f.id === id);
  if (!existing) return null;

  const now = new Date().toISOString();
  let updatedHistory = [...(existing.history || [])];

  if (historyAction && (historyAction.notes || historyAction.actionType)) {
    const newEntry: FollowUpHistoryEntry = {
      id: 'h-' + Date.now(),
      timestamp: now,
      actionType: historyAction.actionType || 'note_added',
      performedBy: historyAction.performedBy || updates.assignedStaffName || existing.assignedStaffName || 'Staff',
      notes: historyAction.notes || 'Details updated',
      outcome: historyAction.outcome,
      previousStatus: existing.status,
      newStatus: updates.status || existing.status,
      nextFollowUpDate: updates.scheduledDate || existing.scheduledDate,
    };
    updatedHistory = [newEntry, ...updatedHistory];
  }

  const updatedItem: CrmFollowUp = {
    ...existing,
    ...updates,
    history: updatedHistory,
    updatedAt: now,
  };

  const updatedList = current.map((f) => (f.id === id ? updatedItem : f));
  saveFollowUps(updatedList);
  return updatedItem;
};

export const completeFollowUp = (
  id: string,
  outcome: string,
  notes: string,
  nextDate?: string,
  performedBy: string = 'Staff',
  markConverted: boolean = false
): CrmFollowUp | null => {
  const current = getFollowUps();
  const existing = current.find((f) => f.id === id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const newStatus: FollowUpStatus = markConverted ? 'converted' : 'completed';

  const historyEntry: FollowUpHistoryEntry = {
    id: 'h-' + Date.now(),
    timestamp: now,
    actionType: 'completed',
    performedBy,
    notes: notes || `Follow-up marked ${markConverted ? 'Converted' : 'Completed'}. Outcome: ${outcome}`,
    outcome,
    previousStatus: existing.status,
    newStatus,
    nextFollowUpDate: nextDate,
  };

  const updatedItem: CrmFollowUp = {
    ...existing,
    status: newStatus,
    outcome: outcome || existing.outcome,
    notes: notes ? `${existing.notes}\n[Completed on ${now.split('T')[0]}]: ${notes}` : existing.notes,
    lastContactedAt: now,
    scheduledDate: nextDate || existing.scheduledDate,
    history: [historyEntry, ...(existing.history || [])],
    updatedAt: now,
  };

  const updatedList = current.map((f) => (f.id === id ? updatedItem : f));
  saveFollowUps(updatedList);
  return updatedItem;
};

export const rescheduleFollowUp = (
  id: string,
  newDate: string,
  newTime?: string,
  reason?: string,
  performedBy: string = 'Staff'
): CrmFollowUp | null => {
  const current = getFollowUps();
  const existing = current.find((f) => f.id === id);
  if (!existing) return null;

  const now = new Date().toISOString();

  const historyEntry: FollowUpHistoryEntry = {
    id: 'h-' + Date.now(),
    timestamp: now,
    actionType: 'rescheduled',
    performedBy,
    notes: reason ? `Rescheduled to ${newDate} (${newTime || 'Standard'}): ${reason}` : `Rescheduled to ${newDate}`,
    previousStatus: existing.status,
    newStatus: 'scheduled',
    nextFollowUpDate: newDate,
  };

  const updatedItem: CrmFollowUp = {
    ...existing,
    scheduledDate: newDate,
    scheduledTime: newTime || existing.scheduledTime || '11:00 AM',
    status: 'scheduled',
    history: [historyEntry, ...(existing.history || [])],
    updatedAt: now,
  };

  const updatedList = current.map((f) => (f.id === id ? updatedItem : f));
  saveFollowUps(updatedList);
  return updatedItem;
};

export const deleteFollowUp = (id: string): void => {
  const current = getFollowUps();
  const filtered = current.filter((f) => f.id !== id);
  saveFollowUps(filtered);
};

export const getAgencyInfo = (): AgencyInfo => {
  const raw = loadItem<AgencyInfo>(KEYS.AGENCY_INFO, AGENCY_INFO);
  if (raw && typeof raw === 'object' && raw.name) {
    return raw;
  }
  return AGENCY_INFO;
};
export const saveAgencyInfo = (info: AgencyInfo) => {
  saveItem(KEYS.AGENCY_INFO, info);
  syncCollectionToSupabase('agency_info', info);
};

export function resetToInitialDemoData(): void {
  saveCandidates(INITIAL_CANDIDATES);
  saveJobs(INITIAL_JOBS);
  saveUmrahPackages(INITIAL_UMRAH_PACKAGES);
  saveUmrahBookings(INITIAL_UMRAH_BOOKINGS);
  savePartners(INITIAL_PARTNERS);
  saveVisaBatches(INITIAL_VISA_BATCHES);
  saveIndividualVisas(INITIAL_INDIVIDUAL_VISAS);
  savePartnerPayments(INITIAL_PARTNER_PAYMENTS);
  savePartnerLedgerEntries(INITIAL_PARTNER_LEDGER);
  savePartnerAuditLogs(INITIAL_AUDIT_LOGS);
  saveSliders(INITIAL_SLIDERS);
  saveMessageTemplates(INITIAL_MESSAGE_TEMPLATES);
  saveMessageLogs(INITIAL_MESSAGE_LOGS);
  saveFollowUps(INITIAL_CRM_FOLLOWUPS);
  saveCurrentUser(INITIAL_USERS[0]);
  saveAgencyInfo(AGENCY_INFO);
}
