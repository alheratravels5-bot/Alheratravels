import {
  PartnerOffice,
  VisaBatch,
  IndividualVisa,
  Candidate,
  PartnerOfficePayment,
  PartnerOfficeLedgerEntry,
  CommissionConfig
} from '../types';

export interface PartnerFinancialMetrics {
  totalVisasReceived: number;
  totalVisasUsed: number;
  availableVisas: number;
  visasAssigned: number;
  visasRemaining: number;
  totalVisaValue: number;
  usedVisaValue: number;
  remainingVisaValue: number;
  totalCandidateValue: number;
  alHeraCommission: number;
  alHeraCommissionEarned: number;
  totalPayableToPartner: number;
  totalPaidToPartner: number;
  outstandingPayable: number;
  totalProfitCommissionEarned: number;
}

/**
 * Calculates complete real-time financial metrics for a Partner Office
 */
export function computePartnerFinancials(
  partner: PartnerOffice,
  allBatches: VisaBatch[],
  allVisas: IndividualVisa[],
  allCandidates: Candidate[],
  allPayments: PartnerOfficePayment[]
): PartnerFinancialMetrics {
  const partnerBatches = (allBatches || []).filter((b) => b && b.partnerOfficeId === partner.id);
  const partnerVisas = (allVisas || []).filter((v) => v && v.partnerOfficeId === partner.id);
  const partnerPayments = (allPayments || []).filter((p) => p && p.partnerOfficeId === partner.id);

  // 1. Visas quantities
  const totalVisasReceived = partnerBatches.reduce((acc, b) => acc + (Number(b.totalVisas) || 0), 0) || partnerVisas.length;
  
  const usedVisas = partnerVisas.filter((v) =>
    ['Candidate Assigned', 'Processing', 'Visa Stamped', 'Used'].includes(v.visaStatus) || !!v.candidateId
  );
  const totalVisasUsed = usedVisas.length;
  const availableVisas = Math.max(0, totalVisasReceived - totalVisasUsed);

  // 2. Visa Values
  const totalVisaValue = partnerBatches.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0)
    || partnerVisas.reduce((acc, v) => acc + (Number(v.visaAmount) || 0), 0);

  const usedVisaValue = usedVisas.reduce((acc, v) => acc + (Number(v.visaAmount) || 0), 0);
  const remainingVisaValue = Math.max(0, totalVisaValue - usedVisaValue);

  // 3. Candidate Value & Commission
  const totalCandidateValue = usedVisas.reduce((acc, v) => {
    if (v.candidateAmount) return acc + Number(v.candidateAmount);
    if (v.candidateId) {
      const cand = allCandidates.find((c) => c.id === v.candidateId);
      if (cand) return acc + (Number(cand.packageFee) || 0);
    }
    return acc + (Number(v.visaAmount) || 0);
  }, 0);

  const alHeraCommission = usedVisas.reduce((acc, v) => {
    if (v.alHeraCommission !== undefined) return acc + Number(v.alHeraCommission);
    const cand = v.candidateId ? allCandidates.find((c) => c.id === v.candidateId) : null;
    const candPkg = Number(cand?.packageFee || v.candidateAmount || v.visaAmount || 0);
    const vAmt = Number(v.visaAmount || 0);
    return acc + Math.max(0, candPkg - vAmt);
  }, 0);

  // 4. Partner Payable & Outstanding
  const partnerPayableTotal = usedVisas.reduce((acc, v) => {
    return acc + (Number(v.partnerPayableAmount !== undefined ? v.partnerPayableAmount : v.visaAmount) || 0);
  }, 0);

  const totalPaidToPartner = partnerPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const outstandingPayable = Math.max(0, partnerPayableTotal - totalPaidToPartner);
  const totalProfitCommissionEarned = alHeraCommission;

  return {
    totalVisasReceived,
    totalVisasUsed,
    availableVisas,
    visasAssigned: totalVisasUsed,
    visasRemaining: availableVisas,
    totalVisaValue,
    usedVisaValue,
    remainingVisaValue,
    totalCandidateValue,
    alHeraCommission,
    alHeraCommissionEarned: alHeraCommission,
    totalPayableToPartner: partnerPayableTotal,
    totalPaidToPartner,
    outstandingPayable,
    totalProfitCommissionEarned,
  };
}

/**
 * Calculates Al-Hera Commission and Partner Payable according to configuration
 */
export function calculateCommissionBreakdown(
  visaAmount: number,
  candidateAmount: number,
  config?: CommissionConfig
): { commission: number; partnerPayable: number } {
  const vAmt = Math.max(0, Number(visaAmount) || 0);
  const cAmt = Math.max(0, Number(candidateAmount) || 0);

  if (!config || config.type === 'custom') {
    const commission = Math.max(0, cAmt - vAmt);
    return { commission, partnerPayable: vAmt };
  }

  if (config.type === 'fixed') {
    const commission = Math.max(0, Number(config.value) || 0);
    const partnerPayable = Math.max(0, cAmt - commission);
    return { commission, partnerPayable: partnerPayable || vAmt };
  }

  if (config.type === 'percentage') {
    const percent = Math.min(100, Math.max(0, Number(config.value) || 0));
    const commission = Math.round((cAmt * percent) / 100);
    const partnerPayable = Math.max(0, cAmt - commission);
    return { commission, partnerPayable: partnerPayable || vAmt };
  }

  const commission = Math.max(0, cAmt - vAmt);
  return { commission, partnerPayable: vAmt };
}

/**
 * Recomputes running balance for all ledger entries of a partner
 */
export function computeRunningLedger(entries: PartnerOfficeLedgerEntry[]): PartnerOfficeLedgerEntry[] {
  if (!Array.isArray(entries) || entries.length === 0) return [];

  // Sort chronological
  const sorted = [...entries].sort((a, b) => {
    const timeA = new Date(a.date || a.createdAt).getTime();
    const timeB = new Date(b.date || b.createdAt).getTime();
    return timeA - timeB;
  });

  let runningBalance = 0;
  return sorted.map((entry) => {
    const credit = Number(entry.credit) || 0;
    const debit = Number(entry.debit) || 0;
    runningBalance = runningBalance + credit - debit;
    return {
      ...entry,
      balance: runningBalance,
    };
  });
}

/**
 * Utility to export tables to CSV
 */
export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val || '').replace(/"/g, '""')}"`).join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
