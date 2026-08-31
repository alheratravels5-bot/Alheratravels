import { jsPDF } from 'jspdf';
import { Candidate, AgencyInfo, PaymentRecord } from '../types';
import { getAgencyInfo } from './storage';

/**
 * Generates an official Saudi Overseas Employment Contract PDF for a candidate.
 * Auto-generated when visa is issued / stamped or accessed via candidate dossier.
 */
export function generateEmploymentContractPdf(candidate: Candidate, agencyInfo?: AgencyInfo): void {
  const agency = agencyInfo || getAgencyInfo();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const navy = [15, 30, 54];
  const gold = [212, 175, 55];
  const slateDark = [30, 41, 59];
  const slateLight = [248, 250, 252];

  // Header Banner
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.rect(0, 36, 210, 2, 'F');

  // Title & Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(agency.name, 15, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(212, 175, 55);
  doc.text('OVERSEAS EMPLOYMENT CONTRACT & RECRUITMENT AGREEMENT', 15, 21);

  doc.setTextColor(220, 225, 235);
  doc.setFontSize(8);
  doc.text(`Head Office: ${agency.headOffice || agency.address || 'Mumbai / Delhi'} | Phone: ${agency.phone}`, 15, 27);
  doc.text(`Email: ${agency.email} | Riyadh Desk: ${agency.saudiOffice || 'Riyadh, KSA'}`, 15, 32);

  // Contract Badge / Ref on top right
  const contractRef = candidate.contractNumber || `AHT-CONT-${candidate.trackingId}-${new Date().getFullYear()}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(212, 175, 55);
  doc.text(`Contract Ref: ${contractRef}`, 195, 16, { align: 'right' });
  doc.setTextColor(200, 210, 225);
  doc.text(`Issue Date: ${new Date().toLocaleDateString('en-GB')}`, 195, 22, { align: 'right' });
  doc.text(`Status: VISA ISSUED & VALIDATED`, 195, 28, { align: 'right' });

  // Subtitle
  doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.roundedRect(15, 42, 180, 10, 1.5, 1.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(15, 42, 180, 10, 1.5, 1.5, 'S');

  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('KINGDOM OF SAUDI ARABIA - OVERSEAS WORKER EMPLOYMENT ACCORD', 105, 48.5, { align: 'center' });

  // Preamble
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const preamble = `This Overseas Employment Contract is executed between the First Party (Principal Employer / Sponsor) represented by ${agency.name}, and the Second Party (The Employee / Candidate) as detailed hereunder:`;
  doc.text(preamble, 15, 57, { maxWidth: 180 });

  // Table 1: Employee Particulars
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(15, 63, 180, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('1. SECOND PARTY (EMPLOYEE PARTICULARS)', 18, 67.5);

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.rect(15, 69, 180, 42, 'FD');

  const empRows = [
    ['Full Name (As in Passport):', candidate.fullName, 'Tracking Ref ID:', candidate.trackingId],
    ['Father / Guardian Name:', candidate.fatherName || 'N/A', 'Date of Birth / Age:', `${candidate.dateOfBirth} (${candidate.gender})`],
    ['Passport Number:', candidate.passportNumber, 'Passport Expiry:', candidate.passportExpiry || 'Valid'],
    ['Nationality:', candidate.nationality || 'Indian', 'Designation / Trade:', candidate.trade.toUpperCase()],
    ['Contact Phone / WhatsApp:', `${candidate.phoneNumber} / ${candidate.whatsappNumber}`, 'Permanent Address:', `${candidate.city}, ${candidate.state}`],
  ];

  let yPos = 75;
  empRows.forEach((r) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(r[0], 18, yPos);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(r[1], 62, yPos);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(r[2], 115, yPos);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(r[3], 150, yPos);

    yPos += 7.5;
  });

  // Table 2: First Party Employer & Visa Particulars
  const spBoxY = 114;
  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.rect(15, spBoxY, 180, 6, 'F');
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('2. FIRST PARTY (SPONSOR / PRINCIPAL EMPLOYER & VISA CREDENTIALS)', 18, spBoxY + 4.5);

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.rect(15, spBoxY + 6, 180, 36, 'FD');

  const sponsorRows = [
    ['Principal Sponsor / Company:', candidate.sponsorName || 'Saudi Arabia Enterprise Co.', 'Work Location:', 'Kingdom of Saudi Arabia (KSA)'],
    ['Visa Number (Issued):', candidate.visaNumber || 'SAU-VISA-ISSUED-OK', 'Wakala Reference:', candidate.wakalaNumber || 'WKL-2025-ALLOT'],
    ['Visa Type / Category:', candidate.visaCategory || 'Work Employment Visa', 'MOFA / Enjaz Ref:', candidate.mofaNumber || 'MOFA-VERIFIED-981'],
    ['Contract Duration:', '2 Years (Renewable by mutual accord)', 'Probation Period:', '90 Days (As per Saudi Labor Law)'],
  ];

  yPos = spBoxY + 12;
  sponsorRows.forEach((r) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(r[0], 18, yPos);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(r[1], 65, yPos);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(r[2], 120, yPos);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(r[3], 155, yPos);

    yPos += 7.5;
  });

  // Table 3: Salary, Allowances & Benefits
  const compBoxY = 154;
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(15, compBoxY, 180, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('3. COMPENSATION, DUTY HOURS & STATUTORY BENEFITS', 18, compBoxY + 4.5);

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.rect(15, compBoxY + 6, 180, 32, 'FD');

  const compRows = [
    ['Working Hours / Duty:', '8 Hours Daily / 6 Days a Week (48 Hours/Week)', 'Overtime Provision:', '1.5x Basic Rate as per Saudi Labor Law'],
    ['Accommodation:', 'Provided Free by First Party / Sponsor', 'Food Facility:', 'Company Mess or Monthly Food Allowance'],
    ['Local Transportation:', 'Provided Free from Residence to Worksite', 'Medical Insurance:', 'Full Council of Health Insurance (CCHI) Cover'],
    ['Air Passage / Return Ticket:', 'Free Return Air Ticket provided upon completion of contract tenure', 'Residency (Iqama):', 'Borne and processed by Employer'],
  ];

  yPos = compBoxY + 11.5;
  compRows.forEach((r) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(r[0], 18, yPos);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(r[1], 55, yPos);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(r[2], 122, yPos);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(r[3], 155, yPos);

    yPos += 6.5;
  });

  // Terms & Conditions Block
  const termsY = 194;
  doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.roundedRect(15, termsY, 180, 48, 1.5, 1.5, 'FD');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(15, termsY, 180, 48, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('4. KEY TERMS OF EMPLOYMENT & MUTUAL OBLIGATIONS:', 18, termsY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);
  const termsPoints = [
    '1. The Employee agrees to perform assigned duties diligently and abide by the labor and residency regulations of the Kingdom of Saudi Arabia.',
    '2. The Employer shall issue the Saudi Iqama (Residence Card) within 90 days of arrival in the Kingdom at the Employer’s sole expense.',
    '3. Paid annual leave of 21 to 30 days is entitled following the completion of each completed contract year with return flight compensation.',
    '4. In case of any occupational injury, the Employer will bear all medical and hospitalization costs in full compliance with GOSI guidelines.',
    '5. This agreement is executed in duplicate, one copy handed over to the employee and one lodged in the agency overseas deployment records.',
  ];

  let termY = termsY + 12;
  termsPoints.forEach((pt) => {
    doc.text(pt, 18, termY, { maxWidth: 174 });
    termY += 7;
  });

  // Signatures Section
  const signBoxY = 246;

  // Left Sign: Employee
  doc.setDrawColor(148, 163, 184);
  doc.line(22, signBoxY + 18, 75, signBoxY + 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(candidate.fullName, 48.5, signBoxY + 22, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('(Signature / Thumb Impression of Employee)', 48.5, signBoxY + 26, { align: 'center' });

  // Center / Right Sign: Authorized Agency & Seal
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.8);
  doc.roundedRect(118, signBoxY - 2, 77, 34, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(`FOR ${agency.name.toUpperCase()}`, 156.5, signBoxY + 5, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(212, 175, 55);
  doc.text('[ Authorized Seal & Overseas Signatory ]', 156.5, signBoxY + 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Recruitment & Visa Processing Operations', 156.5, signBoxY + 22, { align: 'center' });
  doc.text(`Verified on: ${new Date().toLocaleDateString('en-GB')}`, 156.5, signBoxY + 28, { align: 'center' });

  // Footer bar
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(0, 287, 210, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text(`${agency.name} • Overseas Recruitment & Umrah Services • 24/7 Candidate Support: ${agency.phone}`, 105, 293, { align: 'center' });

  doc.save(`Employment-Contract-${candidate.trackingId}-${candidate.passportNumber}.pdf`);
}

/**
 * Generates an official Tax Invoice & Comprehensive Billing Statement PDF.
 * Auto-generated & printed when a payment is recorded or candidate billing is accessed.
 */
export function generateInvoicePdf(candidate: Candidate, agencyInfo?: AgencyInfo): void {
  const agency = agencyInfo || getAgencyInfo();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const navy = [15, 30, 54];
  const gold = [212, 175, 55];
  const slateDark = [30, 41, 59];
  const slateLight = [248, 250, 252];

  // Header Ribbon
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.rect(0, 36, 210, 2, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(agency.name, 15, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(212, 175, 55);
  doc.text('TAX INVOICE & OVERSEAS RECRUITMENT STATEMENT', 15, 21);

  doc.setTextColor(220, 225, 235);
  doc.setFontSize(8);
  doc.text(`Head Office: ${agency.headOffice || agency.address || 'Mumbai'} | Phone: ${agency.phone}`, 15, 27);
  doc.text(`GSTIN / Reg: ${agency.gstin || '08AABCA1234F1Z5'} | Email: ${agency.email}`, 15, 32);

  // Invoice Number & Meta (Top Right)
  const invoiceNumber = `INV-${candidate.trackingId.replace(/[^a-zA-Z0-9]/g, '')}-${new Date().getFullYear()}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(212, 175, 55);
  doc.text(`Invoice No: ${invoiceNumber}`, 195, 16, { align: 'right' });
  doc.setTextColor(220, 225, 235);
  doc.setFontSize(8);
  doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 195, 22, { align: 'right' });
  doc.text(`Candidate Tracking ID: ${candidate.trackingId}`, 195, 28, { align: 'right' });

  // Bill To (Candidate Info) Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.roundedRect(15, 43, 180, 28, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('BILLED TO (CANDIDATE / CLIENT PARTICULARS):', 20, 49);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`Name: ${candidate.fullName}`, 20, 56);
  doc.text(`Passport No: ${candidate.passportNumber}`, 20, 62);
  doc.text(`Phone / WA: ${candidate.phoneNumber} / ${candidate.whatsappNumber}`, 20, 67);

  doc.text(`Trade / Job: ${candidate.trade} (Saudi Arabia)`, 110, 56);
  doc.text(`Sponsor: ${candidate.sponsorName || 'Saudi Arabia Enterprise'}`, 110, 62);
  doc.text(`Address: ${candidate.city}, ${candidate.state}`, 110, 67);

  // Billing Table Header
  const tableY = 76;
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(15, tableY, 180, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('SR.', 18, tableY + 5.5);
  doc.text('SERVICE DESCRIPTION / PARTICULARS', 32, tableY + 5.5);
  doc.text('SAC / CODE', 125, tableY + 5.5);
  doc.text('TOTAL AMOUNT (INR)', 190, tableY + 5.5, { align: 'right' });

  // Service Line Items
  const items = [
    ['1', 'Overseas Manpower Sourcing & Client Interview Coordination', '998511', `₹${(candidate.packageFee * 0.35).toLocaleString('en-IN')}`],
    ['2', 'Saudi Wakala Allocation & Electronic Enjaz Service Processing', '998512', `₹${(candidate.packageFee * 0.25).toLocaleString('en-IN')}`],
    ['3', 'GAMCA Medical & Saudi Embassy Visa Stamping Administrative Charges', '998513', `₹${(candidate.packageFee * 0.25).toLocaleString('en-IN')}`],
    ['4', 'Emigration Clearance (POE), Flight Ticketing & Pre-Departure Briefing', '998514', `₹${(candidate.packageFee * 0.15).toLocaleString('en-IN')}`],
  ];

  let itemY = tableY + 8;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);

  items.forEach((it, idx) => {
    doc.rect(15, itemY, 180, 8, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(it[0], 19, itemY + 5.5);
    doc.setTextColor(15, 23, 42);
    doc.text(it[1], 32, itemY + 5.5);
    doc.setTextColor(100, 116, 139);
    doc.text(it[2], 125, itemY + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(it[3], 190, itemY + 5.5, { align: 'right' });
    itemY += 8;
  });

  // Package Total Row
  doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.rect(15, itemY, 180, 8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('TOTAL AGREED SERVICE PACKAGE FEE:', 110, itemY + 5.5);
  doc.text(`₹${(Number(candidate.packageFee) || 0).toLocaleString('en-IN')}`, 190, itemY + 5.5, { align: 'right' });

  // Payment Breakdown Section
  const paySectionY = itemY + 12;
  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.rect(15, paySectionY, 180, 7, 'F');
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('PAYMENT TRANSACTIONS & RECEIPT HISTORY', 20, paySectionY + 5);

  // Table of payments
  const payHeadY = paySectionY + 7;
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(15, payHeadY, 180, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('RECEIPT NO', 18, payHeadY + 4.5);
  doc.text('DATE', 58, payHeadY + 4.5);
  doc.text('MODE', 85, payHeadY + 4.5);
  doc.text('TRANSACTION REF / UTR', 115, payHeadY + 4.5);
  doc.text('AMOUNT (INR)', 190, payHeadY + 4.5, { align: 'right' });

  let payRowY = payHeadY + 7;
  const history = candidate.paymentHistory || [];

  if (history.length > 0) {
    history.forEach((p) => {
      doc.setFillColor(255, 255, 255);
      doc.rect(15, payRowY, 180, 7, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(p.receiptNumber || 'AHT-REC', 18, payRowY + 4.5);
      doc.text(p.paymentDate || p.date || '-', 58, payRowY + 4.5);
      doc.text(p.paymentMode || p.paymentMethod || 'Online', 85, payRowY + 4.5);
      doc.text(p.transactionReference || p.note || 'Confirmed', 115, payRowY + 4.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129); // emerald
      doc.text(`₹${(Number(p.amount) || 0).toLocaleString('en-IN')}`, 190, payRowY + 4.5, { align: 'right' });
      payRowY += 7;
    });
  } else {
    doc.setFillColor(255, 255, 255);
    doc.rect(15, payRowY, 180, 7, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('No payment installments logged yet.', 18, payRowY + 4.5);
    payRowY += 7;
  }

  // Summary Box (Total Paid vs Balance Due)
  const sumBoxY = payRowY + 4;
  doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.roundedRect(105, sumBoxY, 90, 24, 1.5, 1.5, 'FD');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(105, sumBoxY, 90, 24, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Total Amount Received:', 110, sumBoxY + 7);
  doc.setTextColor(16, 185, 129);
  doc.text(`₹${(Number(candidate.totalPaid) || 0).toLocaleString('en-IN')}`, 190, sumBoxY + 7, { align: 'right' });

  doc.setTextColor(71, 85, 105);
  doc.text('Outstanding Balance Due:', 110, sumBoxY + 16);
  doc.setTextColor(225, 29, 72); // rose
  doc.text(`₹${(Number(candidate.balanceDue) || 0).toLocaleString('en-IN')}`, 190, sumBoxY + 16, { align: 'right' });

  // Bank Particulars (Bottom Left)
  const bankBoxY = sumBoxY;
  doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.roundedRect(15, bankBoxY, 85, 24, 1.5, 1.5, 'FD');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(15, bankBoxY, 85, 24, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('AGENCY BANKING PARTICULARS:', 18, bankBoxY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Bank Name: HDFC Bank Ltd / State Bank of India', 18, bankBoxY + 11);
  doc.text('Account Name: AL-HERA TRAVELS & TOURS', 18, bankBoxY + 16);
  doc.text('IFSC Code: HDFC0001290 | UPI: alhera@hdfcbank', 18, bankBoxY + 21);

  // Signatures
  const signY = 248;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('FOR AL-HERA TRAVELS', 160, signY + 3, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(212, 175, 55);
  doc.text('[ Authorized Accounts Desk Seal ]', 160, signY + 12, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Computer Generated Official Tax Invoice', 160, signY + 20, { align: 'center' });

  // Footer bar
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(0, 287, 210, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text(`${agency.name} • Overseas Recruitment & Umrah Services • Helpline: ${agency.phone}`, 105, 293, { align: 'center' });

  doc.save(`Invoice-${invoiceNumber}-${candidate.trackingId}.pdf`);
}

/**
 * Generates an official payment receipt PDF for an individual payment transaction.
 */
export function generatePaymentReceiptPdf(
  paymentOrCandidate: any,
  candidateOrAmount?: any,
  receiptNoOrAgency?: any,
  paymentMethod?: string,
  note?: string,
  agencyInfo?: AgencyInfo
): void {
  let candidate: Candidate;
  let amount: number;
  let receiptNo: string;
  let method: string;
  let remark: string;
  let agency: AgencyInfo;

  if (paymentOrCandidate && 'receiptNumber' in paymentOrCandidate && candidateOrAmount && 'trackingId' in candidateOrAmount) {
    const payment = paymentOrCandidate as PaymentRecord;
    candidate = candidateOrAmount as Candidate;
    amount = payment.amount;
    receiptNo = payment.receiptNumber;
    method = payment.paymentMode || payment.paymentMethod || 'Online / Bank';
    remark = payment.note || payment.transactionReference || 'Payment Received';
    agency = receiptNoOrAgency || getAgencyInfo();
  } else {
    candidate = paymentOrCandidate;
    amount = Number(candidateOrAmount) || 0;
    receiptNo = String(receiptNoOrAgency || 'REC-' + Date.now());
    method = paymentMethod || 'Cash';
    remark = note || 'Part Payment';
    agency = agencyInfo || getAgencyInfo();
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  const navy = [15, 30, 54];
  const gold = [212, 175, 55];

  // Header Banner
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(0, 0, 148, 28, 'F');

  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.rect(0, 28, 148, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(agency.name, 10, 11);

  doc.setFontSize(7.5);
  doc.setTextColor(212, 175, 55);
  doc.text('OFFICIAL PAYMENT RECEIPT & ACKNOWLEDGMENT', 10, 17);

  doc.setTextColor(200, 215, 230);
  doc.setFontSize(7);
  doc.text(`Phone / WhatsApp: ${agency.phone} | Email: ${agency.email}`, 10, 23);

  // Date and Receipt No
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`Receipt No: ${receiptNo}`, 10, 35);
  doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 138, 35, { align: 'right' });

  // Receipt Body
  doc.setDrawColor(220, 225, 230);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(10, 40, 128, 80, 2, 2, 'FD');

  const rows = [
    ['Received From:', candidate.fullName],
    ['Tracking / Passport No:', `${candidate.trackingId} / ${candidate.passportNumber}`],
    ['Trade / Destination:', `${candidate.trade} (Saudi Arabia)`],
    ['Payment Method:', method],
    ['Transaction Ref / Remarks:', remark || 'Overseas Recruitment & Visa Processing Fee'],
    ['Total Package Fee:', `₹${(candidate.packageFee || 0).toLocaleString('en-IN')}`],
    ['Amount Paid (This Receipt):', `₹${amount.toLocaleString('en-IN')}`],
    ['Total Amount Received To Date:', `₹${(candidate.totalPaid || amount).toLocaleString('en-IN')}`],
    ['Remaining Balance Due:', `₹${(candidate.balanceDue || 0).toLocaleString('en-IN')}`],
  ];

  let currentY = 48;
  rows.forEach((r) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(r[0], 14, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(r[1], 62, currentY);
    currentY += 7;
  });

  // Stamp and Sign
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Candidate Signature', 15, 136);
  doc.line(15, 132, 45, 132);

  doc.text('For AL-HERA TRAVELS (Accounts Desk)', 85, 136);
  doc.line(85, 132, 138, 132);

  // Footer note
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Computer generated official payment voucher. Valid with official transaction reference.', 74, 144, { align: 'center' });

  doc.save(`Receipt-${receiptNo}-${candidate.trackingId}.pdf`);
}

/**
 * Generates an official candidate selection letter & dossier PDF.
 */
export function generateSelectionLetterPdf(candidate: Candidate, agencyInfo?: AgencyInfo): void {
  const agency = agencyInfo || getAgencyInfo();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const navy = [15, 30, 54];
  const gold = [212, 175, 55];
  const slateDark = [30, 41, 59];
  const slateLight = [241, 245, 249];

  // Header Background Ribbon
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.rect(0, 36, 210, 2, 'F');

  // Agency Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(agency.name, 15, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(212, 175, 55);
  doc.text(agency.tagline.toUpperCase(), 15, 21);

  doc.setTextColor(220, 225, 235);
  doc.setFontSize(8);
  doc.text(`Phone / WA: ${agency.phone} | Email: ${agency.email}`, 15, 27);
  doc.text(`Head Office: ${agency.headOffice || agency.address || 'Mumbai'} | Branches: Delhi | Rajasthan | Riyadh KSA`, 15, 32);

  // Document Title Banner
  doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.roundedRect(15, 43, 180, 11, 2, 2, 'F');
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, 43, 180, 11, 2, 2, 'S');

  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('OFFICIAL CANDIDATE SELECTION & DEPLOYMENT DOSSIER', 105, 50, { align: 'center' });

  // Reference and Date Row
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`Tracking ID: ${candidate.trackingId}`, 15, 60);
  doc.text(`Issue Date: ${new Date().toLocaleDateString('en-GB')}`, 195, 60, { align: 'right' });

  // Candidate Details Box (Left)
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, 64, 180, 68, 2, 2, 'FD');

  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(15, 64, 180, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('CANDIDATE BIO-DATA & PASSPORT CREDENTIALS', 20, 69);

  const startY = 78;
  const lineSpacing = 7.5;

  const leftFields = [
    ['Candidate Full Name:', candidate.fullName],
    ['Father / Guardian Name:', candidate.fatherName || 'N/A'],
    ['Passport Number:', candidate.passportNumber],
    ['Passport Expiry Date:', candidate.passportExpiry || 'N/A'],
    ['Date of Birth / Age:', `${candidate.dateOfBirth} (${candidate.gender})`],
    ['Contact Phone / WA:', `${candidate.phoneNumber} / ${candidate.whatsappNumber}`],
    ['Permanent Address:', `${candidate.city}, ${candidate.state} - ${candidate.nationality}`],
  ];

  leftFields.forEach((item, idx) => {
    const y = startY + idx * lineSpacing;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(item[0], 20, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(item[1]), 72, y);
  });

  // Employment & Saudi Visa Details Box
  const empBoxY = 138;
  doc.roundedRect(15, empBoxY, 180, 68, 2, 2, 'FD');

  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.rect(15, empBoxY, 180, 7, 'F');
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('SAUDI ARABIA EMPLOYMENT & VISA PARTICULARS', 20, empBoxY + 5);

  const empFields = [
    ['Designation / Trade:', candidate.trade.toUpperCase()],
    ['Sponsor / Principal Employer:', candidate.sponsorName || 'Saudi Arabia Enterprise Co.'],
    ['Saudi Job ID / Link:', candidate.jobTitle || 'Overseas Direct Allocation'],
    ['Wakala / Visa Status:', `${candidate.status.toUpperCase()} (Wakala No: ${candidate.wakalaNumber || 'WKL-2025-ALLOT'})`],
    ['Visa / MOFA Number:', `${candidate.visaNumber || 'Under Embassy Stamping'} (MOFA: ${candidate.mofaNumber || 'MOFA-SAU-ALLOT'})`],
    ['Experience Credential:', `${candidate.experienceYears} Years Verified Professional Experience`],
    ['Flight & Departure Hub:', candidate.flightDetails ? `${candidate.flightDetails.airline} (${candidate.flightDetails.flightNumber}) - ${candidate.flightDetails.departureDate}` : 'Pending Final PNR Allocation'],
  ];

  empFields.forEach((item, idx) => {
    const y = empBoxY + 13 + idx * lineSpacing;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(item[0], 20, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(item[1]), 75, y);
  });

  // Terms & Conditions
  const termsY = 212;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, termsY, 180, 32, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(15, termsY, 180, 32, 2, 2, 'S');

  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TERMS OF EMPLOYMENT & AGENCY DECLARATION:', 20, termsY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const declarationText = 
    '1. The candidate has been recruited through legal overseas recruitment channels.\n' +
    '2. Standard Saudi Labor Law contract applies including company-provided medical insurance, residency permit (Iqama), and accommodation.\n' +
    '3. This document certifies that the candidate has passed trade qualification tests and verified medical fitness criteria for Saudi overseas deployment.';
  doc.text(declarationText, 20, termsY + 12);

  // Signatures
  const signY = 252;
  doc.setDrawColor(148, 163, 184);
  doc.line(25, signY + 15, 75, signY + 15);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Signature of Candidate', 32, signY + 20);

  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(1);
  doc.roundedRect(125, signY - 4, 70, 26, 2, 2, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('FOR AL-HERA TRAVELS', 160, signY + 2, { align: 'center' });
  
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(212, 175, 55);
  doc.text('[ Authorized Seal & Signature ]', 160, signY + 10, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Overseas Recruitment Division', 160, signY + 18, { align: 'center' });

  // Footer bar
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(0, 287, 210, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text(`${agency.name} • Overseas Recruitment & Umrah Services • Helpline: ${agency.phone}`, 105, 293, { align: 'center' });

  doc.save(`AL-HERA-Selection-Letter-${candidate.trackingId}.pdf`);
}
