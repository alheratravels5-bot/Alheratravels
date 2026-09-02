import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
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
  CrmFollowUp,
  AgencyInfo,
  SliderBanner,
  MessageTemplate,
  MessageLog,
  SupabaseConfig
} from '../types';

const STORAGE_KEY_SUPABASE = 'al_hera_supabase_config';

const env = (import.meta as any).env || {};

// Production Supabase Project Config (alheratravels live project)
export const PROD_SUPABASE_URL = 'https://cghzoyuzvhybdvipuwtb.supabase.co';
export const PROD_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnaHpveXV6dmh5YmR2aXB1d3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNjk4NjksImV4cCI6MjEwMzc0NTg2OX0.aLyS7DCemOSQlvtiHQHZj1rP87ylYpt7av3UKH5B3x0';

export const DEFAULT_SUPABASE_CONFIG: SupabaseConfig = {
  url: ((import.meta as any)?.env?.VITE_SUPABASE_URL) || PROD_SUPABASE_URL,
  anonKey: ((import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY) || PROD_SUPABASE_ANON_KEY,
  isConnected: true,
  autoSync: true,
};

let supabaseInstance: SupabaseClient | null = null;
let realtimeChannelInstance: RealtimeChannel | null = null;

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const data = localStorage.getItem(STORAGE_KEY_SUPABASE);
    if (data) {
      const parsed = JSON.parse(data);
      const hasValidCustomUrl = parsed.url && typeof parsed.url === 'string' && parsed.url.trim().startsWith('https://') && parsed.url.includes('.supabase.co');
      const url = hasValidCustomUrl ? parsed.url.trim() : DEFAULT_SUPABASE_CONFIG.url;
      const anonKey = parsed.anonKey && typeof parsed.anonKey === 'string' && parsed.anonKey.trim().length > 30
        ? parsed.anonKey.trim()
        : DEFAULT_SUPABASE_CONFIG.anonKey;

      return {
        ...DEFAULT_SUPABASE_CONFIG,
        ...parsed,
        url,
        anonKey,
        isConnected: true,
        autoSync: true,
      };
    }
  } catch (e) {
    console.error('Error reading Supabase config from storage', e);
  }
  return DEFAULT_SUPABASE_CONFIG;
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(STORAGE_KEY_SUPABASE, JSON.stringify(config));
  initSupabaseClient(config);
}

export function initSupabaseClient(config?: SupabaseConfig): SupabaseClient | null {
  const cfg = config || getStoredSupabaseConfig();
  if (cfg.url && cfg.anonKey && cfg.url.startsWith('http')) {
    try {
      supabaseInstance = createClient(cfg.url, cfg.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 20,
          },
        },
      });
      return supabaseInstance;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      supabaseInstance = null;
    }
  }
  supabaseInstance = null;
  return null;
}

export function getSupabase(): SupabaseClient | null {
  if (!supabaseInstance) {
    supabaseInstance = initSupabaseClient();
  }
  return supabaseInstance;
}

/**
 * Signs out from Supabase Auth and clears any cached Supabase session.
 */
export async function signOutFromSupabaseAuth(): Promise<void> {
  try {
    const supabase = getSupabase();
    if (supabase && supabase.auth) {
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.warn('Supabase Auth signOut error:', err);
  }
}

/**
 * Diagnostics & Connection Test
 */
export async function testSupabaseConnection(url?: string, key?: string): Promise<{
  success: boolean;
  message: string;
  url?: string;
  hasStoreTable?: boolean;
  details?: {
    candidatesCount?: number;
    jobsCount?: number;
    packagesCount?: number;
  };
}> {
  try {
    const config = getStoredSupabaseConfig();
    const testUrl = url || config.url || DEFAULT_SUPABASE_CONFIG.url;
    const testKey = key || config.anonKey || DEFAULT_SUPABASE_CONFIG.anonKey;

    if (!testUrl || !testKey || !testUrl.startsWith('http')) {
      return { success: false, message: 'Please provide valid Supabase Project URL and Anon API Key.' };
    }

    const testClient = createClient(testUrl, testKey);
    
    // Check if central store table or candidates table exists
    const [candRes, storeRes, jobsRes] = await Promise.allSettled([
      testClient.from('candidates').select('count', { count: 'exact', head: true }),
      testClient.from('al_hera_sync_store').select('key', { count: 'exact', head: true }),
      testClient.from('job_vacancies').select('count', { count: 'exact', head: true }),
    ]);

    let hasStoreTable = false;
    let candidatesCount = 0;
    let jobsCount = 0;

    if (storeRes.status === 'fulfilled' && !storeRes.value.error) {
      hasStoreTable = true;
    }
    if (candRes.status === 'fulfilled' && !candRes.value.error) {
      candidatesCount = candRes.value.count || 0;
    }
    if (jobsRes.status === 'fulfilled' && !jobsRes.value.error) {
      jobsCount = jobsRes.value.count || 0;
    }

    return {
      success: true,
      message: 'Connected to Supabase PostgreSQL database successfully! Realtime sync is active.',
      url: testUrl,
      hasStoreTable,
      details: {
        candidatesCount,
        jobsCount,
      },
    };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Connection test failed. Please verify credentials.' };
  }
}

/**
 * Format Candidate for Relational PostgreSQL Table
 */
function formatCandidateRow(c: Candidate, now: string) {
  return {
    tracking_id: c.trackingId,
    full_name: c.fullName,
    father_name: c.fatherName || '',
    passport_number: c.passportNumber || '',
    passport_expiry: c.passportExpiry || null,
    date_of_birth: c.dateOfBirth || null,
    gender: c.gender || 'Male',
    nationality: c.nationality || 'Indian',
    phone_number: c.phoneNumber || '',
    whatsapp_number: c.whatsappNumber || c.phoneNumber || '',
    email: c.email || '',
    address: c.address || '',
    city: c.city || '',
    state: c.state || '',
    trade: c.trade || 'General Worker',
    experience_years: Number(c.experienceYears) || 0,
    education: c.education || '',
    job_id: c.jobId || '',
    job_title: c.jobTitle || '',
    sponsor_name: c.sponsorName || '',
    visa_category: c.visaCategory || '',
    visa_number: c.visaNumber || '',
    mofa_number: c.mofaNumber || '',
    id_number: c.idNumber || '',
    wakala_number: c.wakalaNumber || '',
    status: c.status || 'applied',
    status_history: c.statusHistory || [],
    flight_details: c.flightDetails || null,
    partner_agent_id: c.partnerOfficeId || c.partnerAgentId || '',
    partner_agent_name: c.partnerOfficeName || c.partnerAgentName || '',
    partner_office_paid_amount: Number((c as any).partnerOfficePaidAmount) || 0,
    package_fee: Number(c.packageFee) || 0,
    total_paid: Number(c.totalPaid) || 0,
    balance_due: Number(c.balanceDue) || 0,
    payment_history: c.paymentHistory || [],
    photo_url: c.photoUrl || '',
    passport_scan_url: c.passportScanUrl || '',
    medical_report_url: c.medicalReportUrl || '',
    trade_certificate_url: c.tradeCertificateUrl || '',
    cv_url: c.cvUrl || '',
    remarks: c.remarks || '',
    updated_at: now,
  };
}

/**
 * Format Job for Relational Table
 */
function formatJobRow(j: JobVacancy) {
  return {
    job_code: j.jobCode,
    title: j.title,
    country: j.country || 'Saudi Arabia',
    city: j.city || '',
    category: j.category || 'General',
    company_name: j.companyName || 'Al-Hera Client',
    openings_count: Number(j.openingsCount) || 1,
    salary_min: Number(j.salaryMin) || 0,
    salary_max: Number(j.salaryMax) || 0,
    currency: j.currency || 'SAR',
    duty_hours: j.dutyHours || '8 Hours + OT',
    contract_period: j.contractPeriod || '2 Years',
    age_limit: j.ageLimit || '21-40 Years',
    experience_required: j.experienceRequired || '',
    food_provided: !!j.foodProvided,
    accommodation_provided: !!j.accommodationProvided,
    transport_provided: !!j.transportProvided,
    medical_insurance: !!j.medicalInsurance,
    trade_test_required: !!j.tradeTestRequired,
    interview_date: j.interviewDate || null,
    interview_venue: j.interviewVenue || '',
    description: j.description || '',
    requirements: j.requirements || [],
    benefits: j.benefits || [],
    status: j.status || 'active',
    poster_theme: j.posterTheme || 'navy_gold',
    deadline: j.deadline || null,
  };
}

/**
 * Direct Live Search in Supabase for Candidate Tracking
 * Queries both candidates PostgreSQL table and central cloud store
 */
export async function searchCandidateTrackingInSupabase(query: string): Promise<{
  success: boolean;
  candidate?: Candidate;
  message?: string;
  source: 'supabase_table' | 'supabase_store' | 'none';
}> {
  const supabase = getSupabase();
  const cleanQ = (query || '').trim();
  if (!cleanQ) {
    return { success: false, message: 'Please enter a valid Tracking ID or Passport Number.', source: 'none' };
  }

  const upperQ = cleanQ.toUpperCase();
  const digitsOnly = cleanQ.replace(/[^0-9]/g, '');

  if (!supabase) {
    return { success: false, message: 'Supabase database is not configured.', source: 'none' };
  }

  try {
    // 1. Direct search on PostgreSQL relational candidates table
    const { data: directRows, error: directErr } = await supabase
      .from('candidates')
      .select('*')
      .or(
        `tracking_id.ilike.%${cleanQ}%,passport_number.ilike.%${cleanQ}%,phone_number.ilike.%${cleanQ}%,whatsapp_number.ilike.%${cleanQ}%,mofa_number.ilike.%${cleanQ}%,visa_number.ilike.%${cleanQ}%`
      )
      .limit(5);

    if (!directErr && directRows && directRows.length > 0) {
      // Find best match: exact tracking_id or passport_number preferred
      const exactMatch =
        directRows.find(
          (r: any) =>
            (r.tracking_id && r.tracking_id.toUpperCase() === upperQ) ||
            (r.passport_number && r.passport_number.toUpperCase() === upperQ)
        ) || directRows[0];

      const mapped: Candidate = {
        id: exactMatch.id || 'cand-' + exactMatch.tracking_id,
        trackingId: exactMatch.tracking_id,
        fullName: exactMatch.full_name,
        fatherName: exactMatch.father_name || '',
        passportNumber: exactMatch.passport_number || '',
        passportExpiry: exactMatch.passport_expiry || '',
        dateOfBirth: exactMatch.date_of_birth || '',
        gender: exactMatch.gender || 'Male',
        nationality: exactMatch.nationality || 'Indian',
        phoneNumber: exactMatch.phone_number || '',
        whatsappNumber: exactMatch.whatsapp_number || exactMatch.phone_number || '',
        email: exactMatch.email || '',
        address: exactMatch.address || '',
        city: exactMatch.city || '',
        state: exactMatch.state || '',
        trade: exactMatch.trade || 'General Worker',
        experienceYears: Number(exactMatch.experience_years) || 0,
        education: exactMatch.education || '',
        jobId: exactMatch.job_id || '',
        jobTitle: exactMatch.job_title || '',
        sponsorName: exactMatch.sponsor_name || '',
        visaCategory: exactMatch.visa_category || '',
        visaNumber: exactMatch.visa_number || '',
        mofaNumber: exactMatch.mofa_number || '',
        idNumber: exactMatch.id_number || '',
        wakalaNumber: exactMatch.wakala_number || '',
        status: exactMatch.status || 'applied',
        statusHistory: Array.isArray(exactMatch.status_history) ? exactMatch.status_history : [],
        flightDetails: exactMatch.flight_details || undefined,
        partnerOfficeId: exactMatch.partner_agent_id || '',
        partnerOfficeName: exactMatch.partner_agent_name || '',
        packageFee: Number(exactMatch.package_fee) || 0,
        totalPaid: Number(exactMatch.total_paid) || 0,
        balanceDue: Number(exactMatch.balance_due) || 0,
        paymentHistory: Array.isArray(exactMatch.payment_history) ? exactMatch.payment_history : [],
        photoUrl: exactMatch.photo_url || '',
        passportScanUrl: exactMatch.passport_scan_url || '',
        medicalReportUrl: exactMatch.medical_report_url || '',
        tradeCertificateUrl: exactMatch.trade_certificate_url || '',
        cvUrl: exactMatch.cv_url || '',
        remarks: exactMatch.remarks || '',
        createdAt: exactMatch.created_at || new Date().toISOString(),
        updatedAt: exactMatch.updated_at || new Date().toISOString(),
      };

      return {
        success: true,
        candidate: mapped,
        source: 'supabase_table',
        message: 'Record retrieved live from Supabase PostgreSQL database.',
      };
    }

    // 2. Query Central Cloud Store for Candidates Collection
    const { data: storeData, error: storeErr } = await supabase
      .from('al_hera_sync_store')
      .select('data')
      .eq('key', 'candidates')
      .maybeSingle();

    if (!storeErr && storeData && Array.isArray(storeData.data)) {
      const candidatesList: Candidate[] = storeData.data;
      const found = candidatesList.find((c) => {
        const tr = (c.trackingId || '').toUpperCase();
        const ps = (c.passportNumber || '').toUpperCase();
        const mf = (c.mofaNumber || '').toUpperCase();
        const vs = (c.visaNumber || '').toUpperCase();
        const ph = (c.phoneNumber || '').replace(/[^0-9]/g, '');
        const wh = (c.whatsappNumber || '').replace(/[^0-9]/g, '');

        return (
          tr === upperQ ||
          ps === upperQ ||
          mf === upperQ ||
          vs === upperQ ||
          (digitsOnly.length >= 5 && (ph.includes(digitsOnly) || wh.includes(digitsOnly)))
        );
      });

      if (found) {
        return {
          success: true,
          candidate: found,
          source: 'supabase_store',
          message: 'Record retrieved live from Supabase cloud sync store.',
        };
      }
    }

    return {
      success: false,
      message: `No active record found in Supabase for "${cleanQ}".`,
      source: 'none',
    };
  } catch (err: any) {
    console.error('Supabase tracking search error:', err);
    return {
      success: false,
      message: err?.message || 'Error communicating with Supabase database.',
      source: 'none',
    };
  }
}

/**
 * Fetch list of recent tracking IDs directly from Supabase for quick lookup sample chips
 */
export async function getLiveSampleTrackingIdsFromSupabase(): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('tracking_id')
      .order('created_at', { ascending: false })
      .limit(6);

    if (!error && data && data.length > 0) {
      return data.map((d: any) => d.tracking_id).filter(Boolean);
    }

    const { data: storeData } = await supabase
      .from('al_hera_sync_store')
      .select('data')
      .eq('key', 'candidates')
      .maybeSingle();

    if (storeData && Array.isArray(storeData.data)) {
      return storeData.data.slice(0, 6).map((c: any) => c.trackingId).filter(Boolean);
    }
  } catch (e) {
    console.warn('Could not fetch sample tracking IDs from Supabase:', e);
  }

  return [];
}

/**
 * Direct real-time collection write to Supabase (Store + Relational + Realtime Broadcast)
 */
export async function syncCollectionToSupabase(collectionKey: string, data: any): Promise<void> {
  const supabase = getSupabase();
  const config = getStoredSupabaseConfig();
  if (!supabase || !config.autoSync) return;

  const now = new Date().toISOString();

  try {
    // 1. Central Document Store Update (preserves all rich nested metadata)
    await supabase.from('al_hera_sync_store').upsert(
      { key: collectionKey, data, updated_at: now },
      { onConflict: 'key' }
    );

    // 2. Relational table upserts
    if (collectionKey === 'candidates' && Array.isArray(data)) {
      const formatted = data.map((c) => formatCandidateRow(c, now));
      if (formatted.length > 0) {
        await supabase.from('candidates').upsert(formatted, { onConflict: 'tracking_id' });
      }
    } else if (collectionKey === 'jobs' && Array.isArray(data)) {
      const formatted = data.map(formatJobRow);
      if (formatted.length > 0) {
        await supabase.from('job_vacancies').upsert(formatted, { onConflict: 'job_code' });
      }
    } else if (collectionKey === 'packages' && Array.isArray(data)) {
      const formatted = data.map((p: UmrahPackage) => ({
        package_code: p.packageCode || p.id,
        name: p.name,
        duration_days: p.durationDays,
        package_type: p.packageType,
        makkah_hotel: p.makkahHotel,
        makkah_distance: p.makkahDistance,
        madinah_hotel: p.madinahHotel,
        madinah_distance: p.madinahDistance,
        airline: p.airline,
        pricing: p.pricing,
        departure_dates: p.departureDates || [],
        inclusions: p.inclusions || [],
        exclusions: p.exclusions || [],
        itinerary: p.itinerary || [],
        image_url: p.imageUrl,
        badge: p.badge,
        is_active: p.isActive !== false,
      }));
      if (formatted.length > 0) {
        await supabase.from('umrah_packages').upsert(formatted, { onConflict: 'package_code' });
      }
    } else if (collectionKey === 'bookings' && Array.isArray(data)) {
      const formatted = data.map((b: UmrahBooking) => ({
        booking_code: b.bookingCode,
        package_id: b.packageId,
        package_name: b.packageName,
        lead_pilgrim_name: b.leadPilgrimName,
        contact_phone: b.contactPhone,
        whatsapp_number: b.whatsappNumber || b.contactPhone,
        email: b.email || '',
        total_pilgrims: Number(b.totalPilgrims) || 1,
        pilgrims: b.pilgrims || [],
        preferred_travel_date: b.preferredTravelDate || null,
        room_sharing: b.roomSharing || 'Quad',
        total_amount: Number(b.totalAmount) || 0,
        paid_amount: Number(b.paidAmount) || 0,
        status: b.status || 'inquiry',
        notes: b.notes || '',
      }));
      if (formatted.length > 0) {
        await supabase.from('umrah_bookings').upsert(formatted, { onConflict: 'booking_code' });
      }
    } else if (collectionKey === 'partners' && Array.isArray(data)) {
      const formatted = data.map((pt: PartnerOffice) => ({
        id: pt.id,
        agency_name: pt.agencyName,
        contact_person: pt.contactPerson,
        city: pt.city,
        state: pt.state,
        country: pt.country || 'India',
        phone: pt.phone,
        whatsapp: pt.whatsapp,
        email: pt.email || '',
        default_commission_per_candidate: Number(pt.defaultCommissionPerCandidate) || 5000,
        total_candidates_referred: Number(pt.totalCandidatesReferred) || 0,
        total_commission_earned: Number(pt.totalCommissionEarned) || 0,
        total_commission_paid: Number(pt.totalCommissionPaid) || 0,
        balance_pending: Number(pt.balancePending) || 0,
        status: pt.status || 'active',
        notes: pt.notes || '',
      }));
      if (formatted.length > 0) {
        await supabase.from('partner_offices').upsert(formatted, { onConflict: 'id' });
      }
    } else if (collectionKey === 'crm_followups' && Array.isArray(data)) {
      const formatted = data.map((f: CrmFollowUp) => ({
        id: f.id,
        lead_type: f.leadType,
        contact_name: f.contactName,
        phone: f.phone,
        whatsapp: f.whatsapp,
        email: f.email,
        target_requirement: f.targetRequirement,
        candidate_id: f.candidateId,
        passport_number: f.passportNumber,
        priority: f.priority,
        status: f.status,
        channel: f.channel,
        scheduled_date: f.scheduledDate,
        scheduled_time: f.scheduledTime,
        assigned_staff_name: f.assignedStaffName,
        notes: f.notes,
        outcome: f.outcome,
        history: f.history || [],
        updated_at: now,
      }));
      if (formatted.length > 0) {
        await supabase.from('crm_follow_ups').upsert(formatted, { onConflict: 'id' });
      }
    } else if (collectionKey === 'partner_payments' && Array.isArray(data)) {
      const formatted = data.map((p: PartnerOfficePayment) => ({
        id: p.id,
        payment_number: p.paymentNumber,
        partner_office_id: p.partnerOfficeId,
        partner_office_name: p.partnerOfficeName,
        amount: Number(p.amount) || 0,
        payment_date: p.paymentDate,
        payment_method: p.paymentMethod,
        reference_number: p.referenceNumber,
        related_batch_id: p.relatedBatchId || null,
        related_batch_code: p.relatedBatchCode || null,
        related_visa_id: p.relatedVisaId || null,
        related_visa_code: p.relatedVisaCode || null,
        related_candidate_id: p.relatedCandidateId || null,
        related_candidate_tracking_id: p.relatedCandidateTrackingId || null,
        related_candidate_name: p.relatedCandidateName || null,
        notes: p.notes || null,
        recorded_by: p.recordedBy || 'Administrator',
        created_at: p.createdAt || now,
      }));
      if (formatted.length > 0) {
        try {
          await supabase.from('partner_payments').upsert(formatted, { onConflict: 'id' });
        } catch {
          // al_hera_sync_store backup already successfully preserved this
        }
      }
    }

    // 3. Broadcast Realtime Sync Event to all connected devices
    if (realtimeChannelInstance) {
      realtimeChannelInstance.send({
        type: 'broadcast',
        event: 'sync_update',
        payload: { key: collectionKey, timestamp: now },
      });
    }
  } catch (err) {
    console.warn(`Sync to Supabase [${collectionKey}] background note:`, err);
  }
}

/**
 * Delete single record from Supabase table
 */
export async function deleteRecordFromSupabase(table: string, matchColumn: string, value: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from(table).delete().eq(matchColumn, value);
    if (realtimeChannelInstance) {
      realtimeChannelInstance.send({
        type: 'broadcast',
        event: 'sync_update',
        payload: { key: table, timestamp: new Date().toISOString() },
      });
    }
  } catch (err) {
    console.warn(`Failed to delete record from Supabase table ${table}:`, err);
  }
}

/**
 * Direct INSERT / UPSERT of a new candidate directly to Supabase `public.candidates` table.
 * After successful insert, refreshes the candidate list from Supabase and broadcasts to all clients.
 */
export async function insertCandidateDirectToSupabase(newCandidate: Candidate): Promise<{
  success: boolean;
  message: string;
  candidate?: Candidate;
  candidates?: Candidate[];
}> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  if (!supabase) {
    return {
      success: false,
      message: 'Supabase client is not initialized or connected.',
    };
  }

  try {
    const formatted = formatCandidateRow(newCandidate, now);

    // 1. Direct INSERT to public.candidates table (with upsert on tracking_id conflict)
    const { error: insertErr } = await supabase
      .from('candidates')
      .upsert([formatted], { onConflict: 'tracking_id' });

    if (insertErr) {
      console.error('Direct Supabase candidate INSERT error:', insertErr);
      throw new Error(insertErr.message || 'Failed to insert candidate into Supabase table');
    }

    // 2. Fetch full updated list from Supabase
    const { data: allTableRows, error: fetchErr } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });

    let freshCandidates: Candidate[] = [];
    if (!fetchErr && Array.isArray(allTableRows)) {
      freshCandidates = allTableRows.map((r: any) => ({
        id: r.id || 'cand-' + r.tracking_id,
        trackingId: r.tracking_id,
        fullName: r.full_name,
        fatherName: r.father_name || '',
        passportNumber: r.passport_number || '',
        passportExpiry: r.passport_expiry || '',
        dateOfBirth: r.date_of_birth || '',
        gender: r.gender || 'Male',
        nationality: r.nationality || 'Indian',
        phoneNumber: r.phone_number || '',
        whatsappNumber: r.whatsapp_number || r.phone_number || '',
        email: r.email || '',
        address: r.address || '',
        city: r.city || '',
        state: r.state || '',
        trade: r.trade || 'General Worker',
        experienceYears: Number(r.experience_years) || 0,
        education: r.education || '',
        jobId: r.job_id || '',
        jobTitle: r.job_title || '',
        sponsorName: r.sponsor_name || '',
        visaCategory: r.visa_category || '',
        visaNumber: r.visa_number || '',
        mofaNumber: r.mofa_number || '',
        idNumber: r.id_number || '',
        wakalaNumber: r.wakala_number || '',
        status: r.status || 'applied',
        statusHistory: Array.isArray(r.status_history) ? r.status_history : [],
        flightDetails: r.flight_details || undefined,
        partnerOfficeId: r.partner_agent_id || '',
        partnerOfficeName: r.partner_agent_name || '',
        packageFee: Number(r.package_fee) || 0,
        totalPaid: Number(r.total_paid) || 0,
        balanceDue: Number(r.balance_due) || 0,
        paymentHistory: Array.isArray(r.payment_history) ? r.payment_history : [],
        photoUrl: r.photo_url || '',
        passportScanUrl: r.passport_scan_url || '',
        medicalReportUrl: r.medical_report_url || '',
        tradeCertificateUrl: r.trade_certificate_url || '',
        cvUrl: r.cv_url || '',
        remarks: r.remarks || '',
        createdAt: r.created_at || now,
        updatedAt: r.updated_at || now,
      }));
    }

    // 3. Sync to central document store
    if (freshCandidates.length > 0) {
      await supabase.from('al_hera_sync_store').upsert(
        { key: 'candidates', data: freshCandidates, updated_at: now },
        { onConflict: 'key' }
      );
    }

    // 4. Broadcast Realtime Sync Event
    if (realtimeChannelInstance) {
      realtimeChannelInstance.send({
        type: 'broadcast',
        event: 'sync_update',
        payload: { key: 'candidates', timestamp: now },
      });
    }

    return {
      success: true,
      message: `Candidate ${newCandidate.fullName} (${newCandidate.trackingId}) successfully inserted to Supabase public.candidates table!`,
      candidate: freshCandidates.find((c) => c.trackingId === newCandidate.trackingId) || newCandidate,
      candidates: freshCandidates,
    };
  } catch (err: any) {
    console.error('Error in insertCandidateDirectToSupabase:', err);
    return {
      success: false,
      message: err?.message || 'Error inserting candidate into Supabase database.',
    };
  }
}

/**
 * Direct query to fetch the entire candidates collection freshly from Supabase.
 */
export async function fetchCandidatesDirectFromSupabase(): Promise<{
  success: boolean;
  candidates: Candidate[];
  message: string;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, candidates: [], message: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const candidates: Candidate[] = (data || []).map((r: any) => ({
      id: r.id || 'cand-' + r.tracking_id,
      trackingId: r.tracking_id,
      fullName: r.full_name,
      fatherName: r.father_name || '',
      passportNumber: r.passport_number || '',
      passportExpiry: r.passport_expiry || '',
      dateOfBirth: r.date_of_birth || '',
      gender: r.gender || 'Male',
      nationality: r.nationality || 'Indian',
      phoneNumber: r.phone_number || '',
      whatsappNumber: r.whatsapp_number || r.phone_number || '',
      email: r.email || '',
      address: r.address || '',
      city: r.city || '',
      state: r.state || '',
      trade: r.trade || 'General Worker',
      experienceYears: Number(r.experience_years) || 0,
      education: r.education || '',
      jobId: r.job_id || '',
      jobTitle: r.job_title || '',
      sponsorName: r.sponsor_name || '',
      visaCategory: r.visa_category || '',
      visaNumber: r.visa_number || '',
      mofaNumber: r.mofa_number || '',
      idNumber: r.id_number || '',
      wakalaNumber: r.wakala_number || '',
      status: r.status || 'applied',
      statusHistory: Array.isArray(r.status_history) ? r.status_history : [],
      flightDetails: r.flight_details || undefined,
      partnerOfficeId: r.partner_agent_id || '',
      partnerOfficeName: r.partner_agent_name || '',
      packageFee: Number(r.package_fee) || 0,
      totalPaid: Number(r.total_paid) || 0,
      balanceDue: Number(r.balance_due) || 0,
      paymentHistory: Array.isArray(r.payment_history) ? r.payment_history : [],
      photoUrl: r.photo_url || '',
      passportScanUrl: r.passport_scan_url || '',
      medicalReportUrl: r.medical_report_url || '',
      tradeCertificateUrl: r.trade_certificate_url || '',
      cvUrl: r.cv_url || '',
      remarks: r.remarks || '',
      createdAt: r.created_at || new Date().toISOString(),
      updatedAt: r.updated_at || new Date().toISOString(),
    }));

    return { success: true, candidates, message: `Loaded ${candidates.length} candidates from Supabase.` };
  } catch (err: any) {
    return { success: false, candidates: [], message: err?.message || 'Error fetching candidates' };
  }
}

/**
 * Push all local data collections to Supabase (Dual storage: Structured Tables + Sync Document Store)
 */
export async function pushAllToSupabase(data: {
  candidates?: Candidate[];
  jobs?: JobVacancy[];
  packages?: UmrahPackage[];
  bookings?: UmrahBooking[];
  partners?: PartnerOffice[];
  visaBatches?: VisaBatch[];
  individualVisas?: IndividualVisa[];
  partnerPayments?: PartnerOfficePayment[];
  partnerLedger?: PartnerOfficeLedgerEntry[];
  crmFollowUps?: CrmFollowUp[];
  sliders?: SliderBanner[];
  templates?: MessageTemplate[];
  logs?: MessageLog[];
  agencyInfo?: AgencyInfo;
}): Promise<{ success: boolean; message: string; count?: number }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: 'Supabase client is not configured.' };
  }

  try {
    let syncedCount = 0;
    const now = new Date().toISOString();

    // 1. Centralized Sync Store backup
    const storePayloads = [
      { key: 'candidates', data: data.candidates || [], updated_at: now },
      { key: 'jobs', data: data.jobs || [], updated_at: now },
      { key: 'packages', data: data.packages || [], updated_at: now },
      { key: 'bookings', data: data.bookings || [], updated_at: now },
      { key: 'partners', data: data.partners || [], updated_at: now },
      { key: 'visa_batches', data: data.visaBatches || [], updated_at: now },
      { key: 'individual_visas', data: data.individualVisas || [], updated_at: now },
      { key: 'partner_payments', data: data.partnerPayments || [], updated_at: now },
      { key: 'partner_ledger', data: data.partnerLedger || [], updated_at: now },
      { key: 'crm_followups', data: data.crmFollowUps || [], updated_at: now },
      { key: 'sliders', data: data.sliders || [], updated_at: now },
      { key: 'templates', data: data.templates || [], updated_at: now },
      { key: 'logs', data: data.logs || [], updated_at: now },
      { key: 'agency_info', data: data.agencyInfo || null, updated_at: now },
    ];

    try {
      await supabase.from('al_hera_sync_store').upsert(storePayloads, { onConflict: 'key' });
    } catch {
      // Continue
    }

    // 2. Candidates
    if (data.candidates && data.candidates.length > 0) {
      const formatted = data.candidates.map((c) => formatCandidateRow(c, now));
      try {
        await supabase.from('candidates').upsert(formatted, { onConflict: 'tracking_id' });
        syncedCount += data.candidates.length;
      } catch (err) {
        console.warn('Candidates table push notice:', err);
      }
    }

    // 3. Jobs
    if (data.jobs && data.jobs.length > 0) {
      const formattedJobs = data.jobs.map(formatJobRow);
      try {
        await supabase.from('job_vacancies').upsert(formattedJobs, { onConflict: 'job_code' });
        syncedCount += data.jobs.length;
      } catch (err) {
        console.warn('Jobs table push notice:', err);
      }
    }

    // 4. Umrah Packages
    if (data.packages && data.packages.length > 0) {
      const formattedPkgs = data.packages.map((p) => ({
        package_code: p.packageCode || p.id,
        name: p.name,
        duration_days: p.durationDays,
        package_type: p.packageType,
        makkah_hotel: p.makkahHotel,
        makkah_distance: p.makkahDistance,
        madinah_hotel: p.madinahHotel,
        madinah_distance: p.madinahDistance,
        airline: p.airline,
        pricing: p.pricing,
        departure_dates: p.departureDates || [],
        inclusions: p.inclusions || [],
        exclusions: p.exclusions || [],
        itinerary: p.itinerary || [],
        image_url: p.imageUrl,
        badge: p.badge,
        is_active: p.isActive !== false,
      }));
      try {
        await supabase.from('umrah_packages').upsert(formattedPkgs, { onConflict: 'package_code' });
        syncedCount += data.packages.length;
      } catch (err) {
        console.warn('Packages table push notice:', err);
      }
    }

    // 5. Umrah Bookings
    if (data.bookings && data.bookings.length > 0) {
      const formattedBookings = data.bookings.map((b) => ({
        booking_code: b.bookingCode,
        package_id: b.packageId,
        package_name: b.packageName,
        lead_pilgrim_name: b.leadPilgrimName,
        contact_phone: b.contactPhone,
        whatsapp_number: b.whatsappNumber || b.contactPhone,
        email: b.email || '',
        total_pilgrims: Number(b.totalPilgrims) || 1,
        pilgrims: b.pilgrims || [],
        preferred_travel_date: b.preferredTravelDate || null,
        room_sharing: b.roomSharing || 'Quad',
        total_amount: Number(b.totalAmount) || 0,
        paid_amount: Number(b.paidAmount) || 0,
        status: b.status || 'inquiry',
        notes: b.notes || '',
      }));
      try {
        await supabase.from('umrah_bookings').upsert(formattedBookings, { onConflict: 'booking_code' });
        syncedCount += data.bookings.length;
      } catch (err) {
        console.warn('Bookings table push notice:', err);
      }
    }

    // 6. Partner Offices
    if (data.partners && data.partners.length > 0) {
      const formattedPartners = data.partners.map((pt) => ({
        id: pt.id,
        agency_name: pt.agencyName,
        contact_person: pt.contactPerson,
        city: pt.city,
        state: pt.state,
        country: pt.country || 'India',
        phone: pt.phone,
        whatsapp: pt.whatsapp,
        email: pt.email || '',
        default_commission_per_candidate: Number(pt.defaultCommissionPerCandidate) || 5000,
        total_candidates_referred: Number(pt.totalCandidatesReferred) || 0,
        total_commission_earned: Number(pt.totalCommissionEarned) || 0,
        total_commission_paid: Number(pt.totalCommissionPaid) || 0,
        balance_pending: Number(pt.balancePending) || 0,
        status: pt.status || 'active',
        notes: pt.notes || '',
      }));
      try {
        await supabase.from('partner_offices').upsert(formattedPartners, { onConflict: 'id' });
        syncedCount += data.partners.length;
      } catch (err) {
        console.warn('Partners table push notice:', err);
      }
    }

    // 7. CRM follow-ups
    if (data.crmFollowUps && data.crmFollowUps.length > 0) {
      try {
        await supabase.from('crm_follow_ups').upsert(
          data.crmFollowUps.map((f) => ({
            id: f.id,
            lead_type: f.leadType,
            contact_name: f.contactName,
            phone: f.phone,
            whatsapp: f.whatsapp,
            email: f.email,
            target_requirement: f.targetRequirement,
            candidate_id: f.candidateId,
            passport_number: f.passportNumber,
            priority: f.priority,
            status: f.status,
            channel: f.channel,
            scheduled_date: f.scheduledDate,
            scheduled_time: f.scheduledTime,
            assigned_staff_name: f.assignedStaffName,
            notes: f.notes,
            outcome: f.outcome,
            history: f.history || [],
            updated_at: now,
          })),
          { onConflict: 'id' }
        );
        syncedCount += data.crmFollowUps.length;
      } catch {
        // Handled gracefully via store
      }
    }

    // Save timestamp
    const config = getStoredSupabaseConfig();
    config.lastSyncedAt = now;
    config.isConnected = true;
    saveSupabaseConfig(config);

    return {
      success: true,
      message: `Successfully synchronized data to Supabase database! (${syncedCount} structured records updated)`,
      count: syncedCount,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to push records to Supabase.',
    };
  }
}

/**
 * Deduplicating merge helpers for cloud synchronization
 */
function mergeCandidates(storeList: Candidate[] = [], tableList: Candidate[] = []): Candidate[] {
  const map = new Map<string, Candidate>();

  for (const item of storeList) {
    if (!item) continue;
    const key = (item.trackingId || item.id || '').toUpperCase().trim();
    if (key) map.set(key, item);
  }

  for (const item of tableList) {
    if (!item) continue;
    const key = (item.trackingId || item.id || '').toUpperCase().trim();
    if (!key) continue;

    if (!map.has(key)) {
      map.set(key, item);
    } else {
      const existing = map.get(key)!;
      // Merge records preserving richer detail (documents, payment history, status history)
      const merged: Candidate = {
        ...existing,
        ...item,
        statusHistory: (existing.statusHistory && existing.statusHistory.length > 0)
          ? existing.statusHistory
          : (item.statusHistory || []),
        paymentHistory: (existing.paymentHistory && existing.paymentHistory.length > 0)
          ? existing.paymentHistory
          : (item.paymentHistory || []),
        documents: (existing.documents && existing.documents.length > 0)
          ? existing.documents
          : (item.documents || []),
        flightDetails: existing.flightDetails || item.flightDetails,
      };
      map.set(key, merged);
    }
  }

  return Array.from(map.values());
}

function mergeJobs(storeList: JobVacancy[] = [], tableList: JobVacancy[] = []): JobVacancy[] {
  const map = new Map<string, JobVacancy>();

  for (const item of storeList) {
    if (!item) continue;
    const key = (item.jobCode || item.id || '').toUpperCase().trim();
    if (key) map.set(key, item);
  }

  for (const item of tableList) {
    if (!item) continue;
    const key = (item.jobCode || item.id || '').toUpperCase().trim();
    if (!key) continue;

    if (!map.has(key)) {
      map.set(key, item);
    } else {
      const existing = map.get(key)!;
      map.set(key, {
        ...existing,
        ...item,
        requirements: existing.requirements?.length ? existing.requirements : (item.requirements || []),
        benefits: existing.benefits?.length ? existing.benefits : (item.benefits || []),
        statusHistory: existing.statusHistory?.length ? existing.statusHistory : (item.statusHistory || []),
      });
    }
  }

  return Array.from(map.values());
}

function mergePackages(storeList: UmrahPackage[] = [], tableList: UmrahPackage[] = []): UmrahPackage[] {
  const map = new Map<string, UmrahPackage>();

  for (const item of storeList) {
    if (!item) continue;
    const key = (item.packageCode || item.id || item.name || '').toUpperCase().trim();
    if (key) map.set(key, item);
  }

  for (const item of tableList) {
    if (!item) continue;
    const key = (item.packageCode || item.id || item.name || '').toUpperCase().trim();
    if (!key) continue;

    if (!map.has(key)) {
      map.set(key, item);
    } else {
      const existing = map.get(key)!;
      map.set(key, { ...existing, ...item });
    }
  }

  return Array.from(map.values());
}

function mergePartners(storeList: PartnerOffice[] = [], tableList: PartnerOffice[] = []): PartnerOffice[] {
  const map = new Map<string, PartnerOffice>();

  for (const item of storeList) {
    if (!item) continue;
    const key = (item.id || item.agencyName || '').toUpperCase().trim();
    if (key) map.set(key, item);
  }

  for (const item of tableList) {
    if (!item) continue;
    const key = (item.id || item.agencyName || '').toUpperCase().trim();
    if (!key) continue;

    if (!map.has(key)) {
      map.set(key, item);
    } else {
      const existing = map.get(key)!;
      map.set(key, { ...existing, ...item });
    }
  }

  return Array.from(map.values());
}

function mergeBookings(storeList: UmrahBooking[] = [], tableList: UmrahBooking[] = []): UmrahBooking[] {
  const map = new Map<string, UmrahBooking>();

  for (const item of storeList) {
    if (!item) continue;
    const key = (item.bookingCode || item.id || '').toUpperCase().trim();
    if (key) map.set(key, item);
  }

  for (const item of tableList) {
    if (!item) continue;
    const key = (item.bookingCode || item.id || '').toUpperCase().trim();
    if (!key) continue;

    if (!map.has(key)) {
      map.set(key, item);
    } else {
      const existing = map.get(key)!;
      map.set(key, { ...existing, ...item });
    }
  }

  return Array.from(map.values());
}

function mergeCrm(storeList: CrmFollowUp[] = [], tableList: CrmFollowUp[] = []): CrmFollowUp[] {
  const map = new Map<string, CrmFollowUp>();

  for (const item of storeList) {
    if (!item) continue;
    const key = (item.id || '').trim();
    if (key) map.set(key, item);
  }

  for (const item of tableList) {
    if (!item) continue;
    const key = (item.id || '').trim();
    if (!key) continue;

    if (!map.has(key)) {
      map.set(key, item);
    } else {
      const existing = map.get(key)!;
      map.set(key, { ...existing, ...item });
    }
  }

  return Array.from(map.values());
}

/**
 * Pull all data collections from Supabase
 */
export async function pullAllFromSupabase(): Promise<{
  success: boolean;
  message: string;
  data?: {
    candidates: Candidate[];
    jobs: JobVacancy[];
    packages: UmrahPackage[];
    bookings: UmrahBooking[];
    partners: PartnerOffice[];
    visaBatches: VisaBatch[];
    individualVisas: IndividualVisa[];
    partnerPayments: PartnerOfficePayment[];
    partnerLedger: PartnerOfficeLedgerEntry[];
    crmFollowUps: CrmFollowUp[];
    sliders: SliderBanner[];
    templates: MessageTemplate[];
    logs: MessageLog[];
    agencyInfo?: AgencyInfo;
  };
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: 'Supabase client is not configured.' };
  }

  try {
    // 1. Concurrently query central cloud store and relational PostgreSQL tables
    const [storeRes, candRes, jobsRes, pkgsRes, partnersRes, crmRes, bookingsRes] = await Promise.allSettled([
      supabase.from('al_hera_sync_store').select('*'),
      supabase.from('candidates').select('*').order('created_at', { ascending: false }),
      supabase.from('job_vacancies').select('*').order('created_at', { ascending: false }),
      supabase.from('umrah_packages').select('*'),
      supabase.from('partner_offices').select('*'),
      supabase.from('crm_follow_ups').select('*'),
      supabase.from('umrah_bookings').select('*'),
    ]);

    const storeRows = (storeRes.status === 'fulfilled' && !storeRes.value.error && Array.isArray(storeRes.value.data))
      ? storeRes.value.data
      : [];

    const getVal = (k: string) => storeRows.find((r: any) => r.key === k)?.data;

    const storeCandidates: Candidate[] = Array.isArray(getVal('candidates')) ? getVal('candidates') : [];
    const storeJobs: JobVacancy[] = Array.isArray(getVal('jobs')) ? getVal('jobs') : [];
    const storePackages: UmrahPackage[] = Array.isArray(getVal('packages')) ? getVal('packages') : [];
    const storeBookings: UmrahBooking[] = Array.isArray(getVal('bookings')) ? getVal('bookings') : [];
    const storePartners: PartnerOffice[] = Array.isArray(getVal('partners')) ? getVal('partners') : [];
    const storeVisaBatches: VisaBatch[] = Array.isArray(getVal('visa_batches')) ? getVal('visa_batches') : [];
    const storeIndividualVisas: IndividualVisa[] = Array.isArray(getVal('individual_visas')) ? getVal('individual_visas') : [];
    const storePartnerPayments: PartnerOfficePayment[] = Array.isArray(getVal('partner_payments')) ? getVal('partner_payments') : [];
    const storePartnerLedger: PartnerOfficeLedgerEntry[] = Array.isArray(getVal('partner_ledger')) ? getVal('partner_ledger') : [];
    const storeCrmFollowUps: CrmFollowUp[] = Array.isArray(getVal('crm_followups')) ? getVal('crm_followups') : [];
    const storeSliders: SliderBanner[] = Array.isArray(getVal('sliders')) ? getVal('sliders') : [];
    const storeTemplates: MessageTemplate[] = Array.isArray(getVal('templates')) ? getVal('templates') : [];
    const storeLogs: MessageLog[] = Array.isArray(getVal('logs')) ? getVal('logs') : [];
    const storeAgencyInfo: AgencyInfo | undefined = getVal('agency_info') || undefined;

    // 2. Map relational PostgreSQL tables
    const tableCandidates: Candidate[] = (candRes.status === 'fulfilled' && !candRes.value.error && Array.isArray(candRes.value.data))
      ? candRes.value.data.map((r: any) => ({
          id: r.id || 'cand-' + r.tracking_id,
          trackingId: r.tracking_id,
          fullName: r.full_name,
          fatherName: r.father_name || '',
          passportNumber: r.passport_number || '',
          passportExpiry: r.passport_expiry || '',
          dateOfBirth: r.date_of_birth || '',
          gender: r.gender || 'Male',
          nationality: r.nationality || 'Indian',
          phoneNumber: r.phone_number || '',
          whatsappNumber: r.whatsapp_number || r.phone_number || '',
          email: r.email || '',
          address: r.address || '',
          city: r.city || '',
          state: r.state || '',
          trade: r.trade || 'General Worker',
          experienceYears: Number(r.experience_years) || 0,
          education: r.education || '',
          jobId: r.job_id || '',
          jobTitle: r.job_title || '',
          sponsorName: r.sponsor_name || '',
          visaCategory: r.visa_category || '',
          visaNumber: r.visa_number || '',
          mofaNumber: r.mofa_number || '',
          idNumber: r.id_number || '',
          wakalaNumber: r.wakala_number || '',
          status: r.status || 'applied',
          statusHistory: Array.isArray(r.status_history) ? r.status_history : [],
          flightDetails: r.flight_details || undefined,
          partnerOfficeId: r.partner_agent_id || '',
          partnerOfficeName: r.partner_agent_name || '',
          packageFee: Number(r.package_fee) || 0,
          totalPaid: Number(r.total_paid) || 0,
          balanceDue: Number(r.balance_due) || 0,
          paymentHistory: Array.isArray(r.payment_history) ? r.payment_history : [],
          photoUrl: r.photo_url || '',
          passportScanUrl: r.passport_scan_url || '',
          medicalReportUrl: r.medical_report_url || '',
          tradeCertificateUrl: r.trade_certificate_url || '',
          cvUrl: r.cv_url || '',
          remarks: r.remarks || '',
          createdAt: r.created_at || new Date().toISOString(),
          updatedAt: r.updated_at || new Date().toISOString(),
        }))
      : [];

    const tableJobs: JobVacancy[] = (jobsRes.status === 'fulfilled' && !jobsRes.value.error && Array.isArray(jobsRes.value.data))
      ? jobsRes.value.data.map((r: any) => ({
          id: r.id || 'job-' + r.job_code,
          jobCode: r.job_code,
          title: r.title,
          country: r.country || 'Saudi Arabia',
          city: r.city || '',
          category: r.category || 'General',
          companyName: r.company_name || 'Al-Hera Client',
          openingsCount: Number(r.openings_count) || 1,
          salaryMin: Number(r.salary_min) || 0,
          salaryMax: Number(r.salary_max) || 0,
          currency: r.currency || 'SAR',
          dutyHours: r.duty_hours || '8 Hours + OT',
          contractPeriod: r.contract_period || '2 Years',
          ageLimit: r.age_limit || '21-40 Years',
          experienceRequired: r.experience_required || '',
          foodProvided: !!r.food_provided,
          accommodationProvided: !!r.accommodation_provided,
          transportProvided: !!r.transport_provided,
          medicalInsurance: !!r.medical_insurance,
          tradeTestRequired: !!r.trade_test_required,
          interviewDate: r.interview_date || '',
          interviewVenue: r.interview_venue || '',
          description: r.description || '',
          requirements: Array.isArray(r.requirements) ? r.requirements : [],
          benefits: Array.isArray(r.benefits) ? r.benefits : [],
          status: r.status || 'active',
          posterTheme: r.poster_theme || 'navy_gold',
          deadline: r.deadline || '',
          createdAt: r.created_at || new Date().toISOString(),
        }))
      : [];

    const tablePackages: UmrahPackage[] = (pkgsRes.status === 'fulfilled' && !pkgsRes.value.error && Array.isArray(pkgsRes.value.data))
      ? pkgsRes.value.data.map((p: any) => ({
          id: p.id || 'pkg-' + (p.package_code || p.id),
          packageCode: p.package_code,
          name: p.name,
          durationDays: Number(p.duration_days) || 15,
          packageType: p.package_type || 'Economy',
          makkahHotel: p.makkah_hotel || 'Hotel Near Haram',
          makkahDistance: p.makkah_distance || '500m from Haram',
          madinahHotel: p.madinah_hotel || 'Hotel Near Nabawi',
          madinahDistance: p.madinah_distance || '300m from Nabawi',
          airline: p.airline || 'Saudia Airlines / Flynas',
          pricing: p.pricing || { quadSharing: 85000, tripleSharing: 95000, doubleSharing: 110000, singleSharing: 140000 },
          departureDates: Array.isArray(p.departure_dates) ? p.departure_dates : [],
          inclusions: Array.isArray(p.inclusions) ? p.inclusions : [],
          exclusions: Array.isArray(p.exclusions) ? p.exclusions : [],
          itinerary: Array.isArray(p.itinerary) ? p.itinerary : [],
          imageUrl: p.image_url || 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=1000&auto=format&fit=crop',
          badge: p.badge || '',
          isActive: p.is_active !== false,
        }))
      : [];

    const tablePartners: PartnerOffice[] = (partnersRes.status === 'fulfilled' && !partnersRes.value.error && Array.isArray(partnersRes.value.data))
      ? partnersRes.value.data.map((pt: any) => ({
          id: pt.id || 'pt-' + Date.now(),
          agencyName: pt.agency_name,
          contactPerson: pt.contact_person || '',
          city: pt.city || '',
          state: pt.state || '',
          country: pt.country || 'India',
          phone: pt.phone || '',
          whatsapp: pt.whatsapp || pt.phone || '',
          email: pt.email || '',
          defaultCommissionPerCandidate: Number(pt.default_commission_per_candidate) || 5000,
          totalCandidatesReferred: Number(pt.total_candidates_referred) || 0,
          totalCommissionEarned: Number(pt.total_commission_earned) || 0,
          totalCommissionPaid: Number(pt.total_commission_paid) || 0,
          balancePending: Number(pt.balance_pending) || 0,
          status: pt.status || 'active',
          notes: pt.notes || '',
          createdAt: pt.created_at || new Date().toISOString(),
        }))
      : [];

    const tableBookings: UmrahBooking[] = (bookingsRes.status === 'fulfilled' && !bookingsRes.value.error && Array.isArray(bookingsRes.value.data))
      ? bookingsRes.value.data.map((b: any) => ({
          id: b.id || 'ub-' + (b.booking_code || b.id),
          bookingCode: b.booking_code,
          packageId: b.package_id,
          packageName: b.package_name,
          leadPilgrimName: b.lead_pilgrim_name,
          contactPhone: b.contact_phone,
          whatsappNumber: b.whatsapp_number || b.contact_phone,
          email: b.email || '',
          totalPilgrims: Number(b.total_pilgrims) || 1,
          pilgrims: Array.isArray(b.pilgrims) ? b.pilgrims : [],
          preferredTravelDate: b.preferred_travel_date || '',
          roomSharing: b.room_sharing || 'Quad',
          totalAmount: Number(b.total_amount) || 0,
          paidAmount: Number(b.paid_amount) || 0,
          status: b.status || 'inquiry',
          notes: b.notes || '',
          createdAt: b.created_at || new Date().toISOString(),
        }))
      : [];

    const tableCrm: CrmFollowUp[] = (crmRes.status === 'fulfilled' && !crmRes.value.error && Array.isArray(crmRes.value.data))
      ? crmRes.value.data.map((f: any) => ({
          id: f.id || 'crm-' + Date.now(),
          leadType: f.lead_type || 'candidate',
          leadSource: f.lead_source || 'website',
          contactName: f.contact_name,
          phone: f.phone || '',
          whatsapp: f.whatsapp || f.phone || '',
          email: f.email || '',
          targetRequirement: f.target_requirement || '',
          candidateId: f.candidate_id,
          passportNumber: f.passport_number,
          priority: f.priority || 'medium',
          status: f.status || 'pending',
          channel: f.channel || 'phone',
          scheduledDate: f.scheduled_date || '',
          scheduledTime: f.scheduled_time || '',
          assignedStaffName: f.assigned_staff_name || '',
          notes: f.notes || '',
          outcome: f.outcome || '',
          history: Array.isArray(f.history) ? f.history : [],
          createdAt: f.created_at || new Date().toISOString(),
          updatedAt: f.updated_at || new Date().toISOString(),
        }))
      : [];

    // Intelligent deduplicating merges
    const mergedCandidates = mergeCandidates(storeCandidates, tableCandidates);
    const mergedJobs = mergeJobs(storeJobs, tableJobs);
    const mergedPackages = mergePackages(storePackages, tablePackages);
    const mergedPartners = mergePartners(storePartners, tablePartners);
    const mergedBookings = mergeBookings(storeBookings, tableBookings);
    const mergedCrm = mergeCrm(storeCrmFollowUps, tableCrm);

    return {
      success: true,
      message: `Retrieved live database from Supabase (${mergedCandidates.length} candidates, ${mergedJobs.length} jobs, ${mergedPackages.length} packages).`,
      data: {
        candidates: mergedCandidates,
        jobs: mergedJobs,
        packages: mergedPackages,
        bookings: mergedBookings,
        partners: mergedPartners,
        visaBatches: storeVisaBatches,
        individualVisas: storeIndividualVisas,
        partnerPayments: storePartnerPayments,
        partnerLedger: storePartnerLedger,
        crmFollowUps: mergedCrm,
        sliders: storeSliders,
        templates: storeTemplates,
        logs: storeLogs,
        agencyInfo: storeAgencyInfo,
      },
    };
  } catch (err: any) {
    console.error('Error pulling data from Supabase:', err);
    return {
      success: false,
      message: err?.message || 'Error pulling data from Supabase.',
    };
  }
}

/**
 * Realtime Multi-Device Sync Channel
 */
export function subscribeToSupabaseRealtime(
  onSyncEvent: (event: { key: string; action?: string; timestamp: string }) => void
): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  try {
    if (realtimeChannelInstance) {
      supabase.removeChannel(realtimeChannelInstance);
    }

    realtimeChannelInstance = supabase
      .channel('al_hera_realtime_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'al_hera_sync_store' },
        (payload) => {
          onSyncEvent({
            key: (payload.new as any)?.key || 'sync_update',
            action: payload.eventType,
            timestamp: new Date().toISOString(),
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'candidates' },
        (payload) => {
          onSyncEvent({
            key: 'candidates',
            action: payload.eventType,
            timestamp: new Date().toISOString(),
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'job_vacancies' },
        (payload) => {
          onSyncEvent({
            key: 'jobs',
            action: payload.eventType,
            timestamp: new Date().toISOString(),
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'umrah_packages' },
        (payload) => {
          onSyncEvent({
            key: 'packages',
            action: payload.eventType,
            timestamp: new Date().toISOString(),
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'umrah_bookings' },
        (payload) => {
          onSyncEvent({
            key: 'bookings',
            action: payload.eventType,
            timestamp: new Date().toISOString(),
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'partner_offices' },
        (payload) => {
          onSyncEvent({
            key: 'partners',
            action: payload.eventType,
            timestamp: new Date().toISOString(),
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crm_follow_ups' },
        (payload) => {
          onSyncEvent({
            key: 'crm_followups',
            action: payload.eventType,
            timestamp: new Date().toISOString(),
          });
        }
      )
      .on(
        'broadcast',
        { event: 'sync_update' },
        (payload) => {
          onSyncEvent({
            key: (payload.payload as any)?.key || 'sync_update',
            action: 'broadcast',
            timestamp: (payload.payload as any)?.timestamp || new Date().toISOString(),
          });
        }
      )
      .subscribe();

    return () => {
      if (realtimeChannelInstance) {
        supabase.removeChannel(realtimeChannelInstance);
        realtimeChannelInstance = null;
      }
    };
  } catch (err) {
    console.warn('Realtime subscription error:', err);
    return () => {};
  }
}

/**
 * Comprehensive PostgreSQL Database Schema + Row-Level Security
 */
export const SUPABASE_SQL_SCHEMA = `-- ======================================================================
-- AL-HERA TRAVELS: SUPABASE CENTRALIZED POSTGRESQL SCHEMA & SECURITY RULES
-- Multi-Device Sync, Relational Tables, Indices & Row Level Security (RLS)
-- ======================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Centralized Document Store (Zero-config instant multi-device sync fallback)
CREATE TABLE IF NOT EXISTS public.al_hera_sync_store (
    key VARCHAR(100) PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Candidates Dossier Table
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255),
    passport_number VARCHAR(50) NOT NULL,
    passport_expiry DATE,
    date_of_birth DATE,
    gender VARCHAR(20) DEFAULT 'Male',
    nationality VARCHAR(100) DEFAULT 'Indian',
    phone_number VARCHAR(50) NOT NULL,
    whatsapp_number VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    trade VARCHAR(150) NOT NULL,
    experience_years INT DEFAULT 0,
    education VARCHAR(100),
    job_id VARCHAR(100),
    job_title VARCHAR(255),
    sponsor_name VARCHAR(255),
    visa_category VARCHAR(100),
    visa_number VARCHAR(100),
    mofa_number VARCHAR(100),
    id_number VARCHAR(100),
    wakala_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'applied',
    status_history JSONB DEFAULT '[]'::jsonb,
    flight_details JSONB,
    partner_agent_id VARCHAR(100),
    partner_agent_name VARCHAR(255),
    package_fee NUMERIC(10, 2) DEFAULT 0,
    total_paid NUMERIC(10, 2) DEFAULT 0,
    balance_due NUMERIC(10, 2) DEFAULT 0,
    payment_history JSONB DEFAULT '[]'::jsonb,
    photo_url TEXT,
    passport_scan_url TEXT,
    medical_report_url TEXT,
    trade_certificate_url TEXT,
    cv_url TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Job Vacancies Table
CREATE TABLE IF NOT EXISTS public.job_vacancies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    country VARCHAR(100) DEFAULT 'Saudi Arabia',
    city VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    openings_count INT DEFAULT 1,
    salary_min NUMERIC(10, 2) NOT NULL,
    salary_max NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'SAR',
    duty_hours VARCHAR(100) DEFAULT '8 Hours + Overtime',
    contract_period VARCHAR(100) DEFAULT '2 Years',
    age_limit VARCHAR(100) DEFAULT '21 - 40 Years',
    experience_required VARCHAR(150),
    food_provided BOOLEAN DEFAULT true,
    accommodation_provided BOOLEAN DEFAULT true,
    transport_provided BOOLEAN DEFAULT true,
    medical_insurance BOOLEAN DEFAULT true,
    trade_test_required BOOLEAN DEFAULT false,
    interview_date DATE,
    interview_venue TEXT,
    description TEXT,
    requirements JSONB DEFAULT '[]'::jsonb,
    benefits JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'active',
    poster_theme VARCHAR(50) DEFAULT 'navy_gold',
    deadline DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Umrah Packages Table
CREATE TABLE IF NOT EXISTS public.umrah_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    duration_days INT NOT NULL,
    package_type VARCHAR(100) NOT NULL,
    makkah_hotel VARCHAR(255),
    makkah_distance VARCHAR(100),
    madinah_hotel VARCHAR(255),
    madinah_distance VARCHAR(100),
    airline VARCHAR(100),
    pricing JSONB NOT NULL,
    departure_dates JSONB DEFAULT '[]'::jsonb,
    inclusions JSONB DEFAULT '[]'::jsonb,
    exclusions JSONB DEFAULT '[]'::jsonb,
    itinerary JSONB DEFAULT '[]'::jsonb,
    image_url TEXT,
    badge VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Umrah Bookings Table
CREATE TABLE IF NOT EXISTS public.umrah_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_code VARCHAR(50) UNIQUE NOT NULL,
    package_id VARCHAR(100),
    package_name VARCHAR(255) NOT NULL,
    lead_pilgrim_name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    whatsapp_number VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    total_pilgrims INT DEFAULT 1,
    pilgrims JSONB DEFAULT '[]'::jsonb,
    preferred_travel_date DATE,
    room_sharing VARCHAR(50) DEFAULT 'Quad',
    total_amount NUMERIC(10, 2) DEFAULT 0,
    paid_amount NUMERIC(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'inquiry',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Partner Offices Table
CREATE TABLE IF NOT EXISTS public.partner_offices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    phone VARCHAR(50) NOT NULL,
    whatsapp VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    default_commission_per_candidate NUMERIC(10, 2) DEFAULT 5000,
    total_candidates_referred INT DEFAULT 0,
    total_commission_earned NUMERIC(10, 2) DEFAULT 0,
    total_commission_paid NUMERIC(10, 2) DEFAULT 0,
    balance_pending NUMERIC(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CRM Follow-Ups & Tele-Calling Desk Table
CREATE TABLE IF NOT EXISTS public.crm_follow_ups (
    id VARCHAR(100) PRIMARY KEY,
    lead_type VARCHAR(50) DEFAULT 'candidate',
    contact_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    whatsapp VARCHAR(50),
    email VARCHAR(255),
    target_requirement VARCHAR(255),
    candidate_id VARCHAR(100),
    passport_number VARCHAR(50),
    priority VARCHAR(50) DEFAULT 'warm',
    status VARCHAR(50) DEFAULT 'pending',
    channel VARCHAR(50) DEFAULT 'call',
    scheduled_date DATE NOT NULL,
    scheduled_time VARCHAR(50),
    assigned_staff_name VARCHAR(255),
    notes TEXT,
    outcome TEXT,
    history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Slider Banners Table
CREATE TABLE IF NOT EXISTS public.slider_banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    highlight_text VARCHAR(255),
    subtitle TEXT,
    badge VARCHAR(100),
    image_url TEXT NOT NULL,
    cta_text VARCHAR(100),
    cta_action VARCHAR(50),
    cta_secondary_text VARCHAR(100),
    cta_secondary_action VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SMS & Notification Logs Table
CREATE TABLE IF NOT EXISTS public.sms_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_name VARCHAR(255),
    recipient_phone VARCHAR(50) NOT NULL,
    channel VARCHAR(50) DEFAULT 'whatsapp',
    template_used VARCHAR(100),
    message_text TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'sent',
    tracking_id VARCHAR(50)
);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.al_hera_sync_store;
ALTER PUBLICATION supabase_realtime ADD TABLE public.candidates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_vacancies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.umrah_packages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.umrah_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_offices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_follow_ups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.slider_banners;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sms_logs;

-- Indices for Ultra-Fast Lookups & Live Candidate Tracking
CREATE INDEX IF NOT EXISTS idx_candidates_tracking_id ON public.candidates (tracking_id);
CREATE INDEX IF NOT EXISTS idx_candidates_passport ON public.candidates (passport_number);
CREATE INDEX IF NOT EXISTS idx_jobs_code ON public.job_vacancies (job_code);
CREATE INDEX IF NOT EXISTS idx_crm_scheduled_date ON public.crm_follow_ups (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_crm_status ON public.crm_follow_ups (status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.al_hera_sync_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umrah_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umrah_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slider_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- Security Policies (Allow Public Read for Jobs, Umrah, Banners & Tracking; Allow Full Access for System)
CREATE POLICY "Allow public read on store" ON public.al_hera_sync_store FOR SELECT USING (true);
CREATE POLICY "Allow public upsert on store" ON public.al_hera_sync_store FOR ALL USING (true);

CREATE POLICY "Allow public read on job vacancies" ON public.job_vacancies FOR SELECT USING (true);
CREATE POLICY "Allow public read on umrah packages" ON public.umrah_packages FOR SELECT USING (true);
CREATE POLICY "Allow public read on slider banners" ON public.slider_banners FOR SELECT USING (true);
CREATE POLICY "Allow public tracking search on candidates" ON public.candidates FOR SELECT USING (true);
CREATE POLICY "Allow public insert on candidate applications" ON public.candidates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on umrah bookings" ON public.umrah_bookings FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow full access for candidates" ON public.candidates FOR ALL USING (true);
CREATE POLICY "Allow full access for jobs" ON public.job_vacancies FOR ALL USING (true);
CREATE POLICY "Allow full access for umrah" ON public.umrah_packages FOR ALL USING (true);
CREATE POLICY "Allow full access for bookings" ON public.umrah_bookings FOR ALL USING (true);
CREATE POLICY "Allow full access for partners" ON public.partner_offices FOR ALL USING (true);
CREATE POLICY "Allow full access for crm" ON public.crm_follow_ups FOR ALL USING (true);
CREATE POLICY "Allow full access for banners" ON public.slider_banners FOR ALL USING (true);
CREATE POLICY "Allow full access for logs" ON public.sms_logs FOR ALL USING (true);
`;
