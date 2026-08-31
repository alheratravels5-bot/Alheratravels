import { Candidate, MessageTemplate, MessageLog, AgencyInfo } from '../types';
import { getAgencyInfo, getMessageLogs, saveMessageLogs } from './storage';

export function formatWhatsAppUrl(phoneNumber: string, message: string): string {
  // Clean phone number (keep only digits and optional leading plus)
  let cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  if (!cleanNumber.startsWith('91') && cleanNumber.length === 10) {
    cleanNumber = '91' + cleanNumber;
  }
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export function renderMessageTemplate(
  template: MessageTemplate | string,
  candidate: Partial<Candidate>,
  agencyInfo?: AgencyInfo,
  extraParams?: Record<string, string | number>
): string {
  const agency = agencyInfo || getAgencyInfo();
  let text = typeof template === 'string' ? template : template.content;

  const currentUrl = window.location.origin;
  const trackingLink = `${currentUrl}?track=${candidate.trackingId || candidate.passportNumber || ''}`;

  const replacements: Record<string, string> = {
    '{candidate_name}': candidate.fullName || 'Valued Candidate',
    '{father_name}': candidate.fatherName || '',
    '{tracking_id}': candidate.trackingId || '',
    '{passport_no}': candidate.passportNumber || '',
    '{trade}': candidate.trade || 'Worker',
    '{job_title}': candidate.jobTitle || candidate.trade || 'Job Position',
    '{sponsor_name}': candidate.sponsorName || 'Saudi Principal Employer',
    '{salary_details}': extraParams?.salary ? `${extraParams.salary}` : 'As per Saudi contract',
    '{visa_number}': candidate.visaNumber || 'Processing',
    '{mofa_number}': candidate.mofaNumber || 'Processing',
    '{wakala_number}': candidate.wakalaNumber || 'Allotted',
    '{flight_details}': candidate.flightDetails ? `${candidate.flightDetails.airline} (${candidate.flightDetails.flightNumber})` : 'To be updated',
    '{departure_date}': candidate.flightDetails?.departureDate || 'Soon',
    '{departure_city}': candidate.flightDetails?.departureCity || 'India',
    '{arrival_city}': candidate.flightDetails?.arrivalCity || 'Saudi Arabia',
    '{pnr}': candidate.flightDetails?.pnr || 'Issued',
    '{tracking_link}': trackingLink,
    '{agency_name}': agency.name,
    '{agency_phone}': agency.phone,
    '{agency_email}': agency.email,
    '{amount}': extraParams?.amount ? String(extraParams.amount) : String(candidate.totalPaid || 0),
    '{receipt_number}': extraParams?.receipt_number ? String(extraParams.receipt_number) : 'REC-PENDING',
    '{payment_method}': extraParams?.payment_method ? String(extraParams.payment_method) : 'Cash/UPI',
    '{balance_due}': extraParams?.balance_due ? String(extraParams.balance_due) : String(candidate.balanceDue || 0),
  };

  Object.entries(replacements).forEach(([key, val]) => {
    text = text.replaceAll(key, val);
  });

  return text;
}

export function formatCandidateStatusMessage(
  candidate: Candidate,
  agencyInfo?: AgencyInfo
): string {
  const agency = agencyInfo || getAgencyInfo();
  const statusLabels: Record<string, string> = {
    applied: 'Application Registered & Documents Verified',
    interview_scheduled: 'Client Interview Scheduled',
    interview_selected: 'Selected for Saudi Arabia Employment',
    medical_fit: 'GAMCA Medical Examination FIT',
    wakala_issued: 'Saudi Electronic Wakala Allotted',
    visa_stamped: 'Saudi Embassy Visa Stamped on Passport',
    emigration_cleared: 'Emigration (Poe/Protector) Cleared',
    ticket_booked: 'Flight Ticket Booked & Confirmed',
    deployed: 'Successfully Deployed in Saudi Arabia',
  };

  const statusText = statusLabels[candidate.status] || candidate.status.replace(/_/g, ' ');

  return `🇸🇦 *AL-HERA TRAVELS - CANDIDATE STATUS UPDATE* 🇸🇦

Dear *${candidate.fullName}*,
Your Overseas Recruitment Dossier status has been updated:

📌 *Tracking ID:* ${candidate.trackingId}
🪪 *Passport No:* ${candidate.passportNumber}
💼 *Position / Trade:* ${candidate.trade}
🏢 *Sponsor / Enterprise:* ${candidate.sponsorName || 'Direct Saudi Employer'}
⚡ *Current Status:* *${statusText}*

${candidate.visaNumber ? `🛂 *Visa No:* ${candidate.visaNumber}\n` : ''}${candidate.flightDetails ? `✈️ *Flight:* ${candidate.flightDetails.airline} (${candidate.flightDetails.flightNumber}) on ${candidate.flightDetails.departureDate}\n` : ''}
Track live anytime on our portal: https://alheratravels.com

For inquiries, contact:
📞 *AL-HERA TRAVELS:* ${agency.phone}
📧 ${agency.email}`;
}

export function logSentMessage(
  recipientName: string,
  recipientPhone: string,
  channel: 'whatsapp' | 'sms',
  messageText: string,
  templateUsed?: string,
  trackingId?: string
): MessageLog {
  const newLog: MessageLog = {
    id: 'ml-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    recipientName,
    recipientPhone,
    channel,
    templateUsed,
    messageText,
    sentAt: new Date().toISOString(),
    status: 'delivered',
    trackingId,
  };

  const logs = getMessageLogs();
  saveMessageLogs([newLog, ...logs]);
  return newLog;
}

export function openDirectWhatsApp(
  phone: string,
  message: string,
  candidateName?: string,
  templateTitle?: string,
  trackingId?: string
): void {
  const url = formatWhatsAppUrl(phone, message);
  window.open(url, '_blank');
  
  if (candidateName && phone) {
    logSentMessage(candidateName, phone, 'whatsapp', message, templateTitle, trackingId);
  }
}
