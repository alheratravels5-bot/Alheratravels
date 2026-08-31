import React, { useState, useMemo } from 'react';
import {
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Edit,
  Trash2,
  Send,
  Users,
  Briefcase,
  Moon,
  Building2,
  Tag,
  ChevronDown,
  X,
  FileText,
  HelpCircle,
  TrendingUp,
  AlertCircle,
  PhoneCall,
  CalendarDays,
  ShieldCheck,
  Check,
  ArrowUpRight,
  Download
} from 'lucide-react';
import {
  CrmFollowUp,
  FollowUpHistoryEntry,
  FollowUpLeadType,
  FollowUpPriority,
  FollowUpStatus,
  FollowUpChannel,
  Candidate,
  PartnerOffice,
  AppUser,
  AgencyInfo
} from '../../types';
import {
  getFollowUps,
  saveFollowUps,
  addFollowUp,
  updateFollowUp,
  completeFollowUp,
  rescheduleFollowUp,
  deleteFollowUp,
  getAgencyInfo
} from '../../lib/storage';
import { formatWhatsAppUrl, logSentMessage } from '../../lib/notifications';

interface CrmFollowUpManagementProps {
  candidates?: Candidate[];
  partners?: PartnerOffice[];
  currentUser?: AppUser | null;
  agencyInfo?: AgencyInfo;
  onSelectCandidate?: (candidate: Candidate) => void;
  onToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const COMMON_OUTCOMES = [
  'Trade Test Scheduled',
  'Documents Received on WhatsApp',
  'Advance Token Received',
  'Passport Collection Scheduled',
  'GAMCA Medical Instructed',
  'Visa Wakala Explained',
  'Umrah Quad Room Confirmed',
  'Awaiting Family Decision',
  'Budget Negotiation / Review',
  'Callback Requested',
  'Not Interested / Lost',
  'Candidate Converted to Dossier',
];

const LEAD_SOURCES = [
  { id: 'phone_call', label: 'Phone Call / Direct Inquiry' },
  { id: 'whatsapp', label: 'WhatsApp Inquiry' },
  { id: 'website_apply', label: 'Website Job / Umrah Form' },
  { id: 'walk_in', label: 'Office Walk-In Desk' },
  { id: 'sub_agent', label: 'Sub-Agent / Partner Referral' },
  { id: 'facebook_ad', label: 'Social Media / Poster Ad' },
  { id: 'referral', label: 'Candidate Word of Mouth' },
];

export const CrmFollowUpManagement: React.FC<CrmFollowUpManagementProps> = ({
  candidates = [],
  partners = [],
  currentUser,
  agencyInfo: propAgency,
  onSelectCandidate,
  onToast,
}) => {
  const agency = propAgency || getAgencyInfo();
  const [followUps, setFollowUps] = useState<CrmFollowUp[]>(getFollowUps());

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all_active' | 'overdue' | 'due_today' | 'upcoming' | 'completed' | 'all'>('all_active');
  const [leadTypeFilter, setLeadTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'due_date_asc' | 'due_date_desc' | 'priority' | 'newest'>('due_date_asc');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<CrmFollowUp | null>(null);
  const [completingLead, setCompletingLead] = useState<CrmFollowUp | null>(null);
  const [reschedulingLead, setReschedulingLead] = useState<CrmFollowUp | null>(null);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<CrmFollowUp | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State for Add / Edit
  const [formLeadType, setFormLeadType] = useState<FollowUpLeadType>('candidate');
  const [formContactName, setFormContactName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formRequirement, setFormRequirement] = useState('');
  const [formLeadSource, setFormLeadSource] = useState<any>('phone_call');
  const [formPriority, setFormPriority] = useState<FollowUpPriority>('warm');
  const [formStatus, setFormStatus] = useState<FollowUpStatus>('pending');
  const [formChannel, setFormChannel] = useState<FollowUpChannel>('call');
  const [formScheduledDate, setFormScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [formScheduledTime, setFormScheduledTime] = useState('11:00 AM');
  const [formAssignedStaff, setFormAssignedStaff] = useState(currentUser?.name || 'Zeeshan Admin');
  const [formNotes, setFormNotes] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formCandidateId, setFormCandidateId] = useState('');

  // Complete Dialog State
  const [completeOutcome, setCompleteOutcome] = useState('');
  const [completeNotes, setCompleteNotes] = useState('');
  const [completeMarkConverted, setCompleteMarkConverted] = useState(false);
  const [scheduleNextToggle, setScheduleNextToggle] = useState(false);
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [nextFollowUpTime, setNextFollowUpTime] = useState('11:00 AM');
  const [nextFollowUpNotes, setNextFollowUpNotes] = useState('');

  // Reschedule Dialog State
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('11:00 AM');
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Detail Timeline Quick Note State
  const [timelineQuickNote, setTimelineQuickNote] = useState('');
  const [timelineQuickAction, setTimelineQuickAction] = useState<'call' | 'whatsapp' | 'meeting' | 'note_added'>('call');

  // Dates
  const todayStr = new Date().toISOString().split('T')[0];

  const refreshData = () => {
    setFollowUps(getFollowUps());
  };

  // Helper to test if lead is overdue
  const isLeadOverdue = (lead: CrmFollowUp): boolean => {
    if (lead.status === 'completed' || lead.status === 'converted' || lead.status === 'cancelled' || lead.status === 'lost') {
      return false;
    }
    return lead.scheduledDate < todayStr;
  };

  const isLeadDueToday = (lead: CrmFollowUp): boolean => {
    if (lead.status === 'completed' || lead.status === 'converted' || lead.status === 'cancelled' || lead.status === 'lost') {
      return false;
    }
    return lead.scheduledDate === todayStr;
  };

  const isLeadUpcoming = (lead: CrmFollowUp): boolean => {
    if (lead.status === 'completed' || lead.status === 'converted' || lead.status === 'cancelled' || lead.status === 'lost') {
      return false;
    }
    return lead.scheduledDate > todayStr;
  };

  // Metric summaries
  const overdueCount = followUps.filter(isLeadOverdue).length;
  const dueTodayCount = followUps.filter(isLeadDueToday).length;
  const upcomingCount = followUps.filter(isLeadUpcoming).length;
  const activeCount = followUps.filter(f => f.status === 'pending' || f.status === 'scheduled' || f.status === 'in_progress').length;
  const completedCount = followUps.filter(f => f.status === 'completed' || f.status === 'converted').length;
  const convertedCount = followUps.filter(f => f.status === 'converted').length;

  // Filtered & Sorted leads
  const filteredLeads = useMemo(() => {
    return followUps.filter((lead) => {
      // Tab filter
      if (activeTab === 'all_active') {
        if (lead.status === 'completed' || lead.status === 'converted' || lead.status === 'cancelled' || lead.status === 'lost') {
          return false;
        }
      } else if (activeTab === 'overdue') {
        if (!isLeadOverdue(lead)) return false;
      } else if (activeTab === 'due_today') {
        if (!isLeadDueToday(lead)) return false;
      } else if (activeTab === 'upcoming') {
        if (!isLeadUpcoming(lead)) return false;
      } else if (activeTab === 'completed') {
        if (lead.status !== 'completed' && lead.status !== 'converted') return false;
      }

      // Dropdown filters
      if (leadTypeFilter !== 'all' && lead.leadType !== leadTypeFilter) return false;
      if (priorityFilter !== 'all' && lead.priority !== priorityFilter) return false;
      if (channelFilter !== 'all' && lead.channel !== channelFilter) return false;
      if (staffFilter !== 'all' && lead.assignedStaffName !== staffFilter) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (lead.contactName || '').toLowerCase().includes(q);
        const matchPhone = (lead.phone || '').includes(q) || (lead.whatsapp || '').includes(q);
        const matchReq = (lead.targetRequirement || '').toLowerCase().includes(q);
        const matchCity = (lead.city || '').toLowerCase().includes(q) || (lead.state || '').toLowerCase().includes(q);
        const matchNotes = (lead.notes || '').toLowerCase().includes(q);
        const matchStaff = (lead.assignedStaffName || '').toLowerCase().includes(q);
        const matchPassport = (lead.passportNumber || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchReq && !matchCity && !matchNotes && !matchStaff && !matchPassport) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'due_date_asc') {
        return (a.scheduledDate || '').localeCompare(b.scheduledDate || '');
      }
      if (sortBy === 'due_date_desc') {
        return (b.scheduledDate || '').localeCompare(a.scheduledDate || '');
      }
      if (sortBy === 'priority') {
        const rank: Record<string, number> = { urgent: 4, hot: 3, warm: 2, cold: 1 };
        return (rank[b.priority] || 0) - (rank[a.priority] || 0);
      }
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [followUps, activeTab, leadTypeFilter, priorityFilter, channelFilter, staffFilter, searchQuery, sortBy, todayStr]);

  // Unique staff list for filter
  const allStaffNames = useMemo(() => {
    return Array.from(new Set(followUps.map((f) => f.assignedStaffName).filter(Boolean)));
  }, [followUps]);

  // Reset Add/Edit Form
  const resetForm = () => {
    setFormLeadType('candidate');
    setFormContactName('');
    setFormPhone('');
    setFormWhatsapp('');
    setFormEmail('');
    setFormCity('');
    setFormState('');
    setFormRequirement('');
    setFormLeadSource('phone_call');
    setFormPriority('warm');
    setFormStatus('pending');
    setFormChannel('call');
    setFormScheduledDate(todayStr);
    setFormScheduledTime('11:00 AM');
    setFormAssignedStaff(currentUser?.name || 'Zeeshan Admin');
    setFormNotes('');
    setFormTags('');
    setFormCandidateId('');
    setEditingLead(null);
  };

  const handleOpenAddModal = (initialCandidate?: Candidate) => {
    resetForm();
    if (initialCandidate) {
      setFormContactName(initialCandidate.fullName);
      setFormPhone(initialCandidate.phoneNumber);
      setFormWhatsapp(initialCandidate.whatsappNumber || initialCandidate.phoneNumber);
      setFormEmail(initialCandidate.email || '');
      setFormCity(initialCandidate.city || '');
      setFormState(initialCandidate.state || '');
      setFormRequirement(`${initialCandidate.trade} - ${initialCandidate.jobTitle || 'Saudi Arabia'}`);
      setFormCandidateId(initialCandidate.id);
      setFormNotes(`Follow up regarding passport/visa status for Candidate ID ${initialCandidate.trackingId}`);
      setFormLeadType('candidate');
    }
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (lead: CrmFollowUp) => {
    setEditingLead(lead);
    setFormLeadType(lead.leadType);
    setFormContactName(lead.contactName);
    setFormPhone(lead.phone);
    setFormWhatsapp(lead.whatsapp || lead.phone);
    setFormEmail(lead.email || '');
    setFormCity(lead.city || '');
    setFormState(lead.state || '');
    setFormRequirement(lead.targetRequirement || '');
    setFormLeadSource(lead.leadSource || 'phone_call');
    setFormPriority(lead.priority || 'warm');
    setFormStatus(lead.status || 'pending');
    setFormChannel(lead.channel || 'call');
    setFormScheduledDate(lead.scheduledDate || todayStr);
    setFormScheduledTime(lead.scheduledTime || '11:00 AM');
    setFormAssignedStaff(lead.assignedStaffName || currentUser?.name || 'Staff');
    setFormNotes(lead.notes || '');
    setFormTags((lead.tags || []).join(', '));
    setFormCandidateId(lead.candidateId || '');
    setIsAddModalOpen(true);
  };

  const handleSaveLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContactName.trim() || !formPhone.trim()) {
      if (onToast) onToast('Please provide contact name and phone number.', 'error');
      return;
    }

    const tagsArray = formTags.split(',').map((t) => t.trim()).filter(Boolean);

    if (editingLead) {
      updateFollowUp(
        editingLead.id,
        {
          leadType: formLeadType,
          contactName: formContactName.trim(),
          phone: formPhone.trim(),
          whatsapp: formWhatsapp.trim() || formPhone.trim(),
          email: formEmail.trim(),
          city: formCity.trim(),
          state: formState.trim(),
          targetRequirement: formRequirement.trim(),
          candidateId: formCandidateId || undefined,
          leadSource: formLeadSource,
          priority: formPriority,
          status: formStatus,
          channel: formChannel,
          scheduledDate: formScheduledDate,
          scheduledTime: formScheduledTime,
          assignedStaffName: formAssignedStaff,
          notes: formNotes.trim(),
          tags: tagsArray,
        },
        {
          actionType: 'note_added',
          performedBy: currentUser?.name || 'Staff',
          notes: 'Lead details and follow-up schedule updated.',
        }
      );
      if (onToast) onToast(`Updated follow-up for ${formContactName}`, 'success');
    } else {
      addFollowUp(
        {
          leadType: formLeadType,
          contactName: formContactName.trim(),
          phone: formPhone.trim(),
          whatsapp: formWhatsapp.trim() || formPhone.trim(),
          email: formEmail.trim(),
          city: formCity.trim(),
          state: formState.trim(),
          targetRequirement: formRequirement.trim(),
          candidateId: formCandidateId || undefined,
          leadSource: formLeadSource,
          priority: formPriority,
          status: formStatus,
          channel: formChannel,
          scheduledDate: formScheduledDate,
          scheduledTime: formScheduledTime,
          assignedStaffName: formAssignedStaff,
          notes: formNotes.trim(),
          tags: tagsArray,
        },
        currentUser?.name || 'Staff'
      );
      if (onToast) onToast(`Scheduled follow-up for ${formContactName}`, 'success');
    }

    setIsAddModalOpen(false);
    resetForm();
    refreshData();
  };

  // Open Complete Dialog
  const handleOpenCompleteDialog = (lead: CrmFollowUp) => {
    setCompletingLead(lead);
    setCompleteOutcome(lead.outcome || '');
    setCompleteNotes('');
    setCompleteMarkConverted(lead.leadType === 'candidate' && lead.status === 'in_progress');
    setScheduleNextToggle(false);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setNextFollowUpDate(tomorrow.toISOString().split('T')[0]);
    setNextFollowUpTime('11:00 AM');
    setNextFollowUpNotes('');
  };

  const handleConfirmComplete = () => {
    if (!completingLead) return;

    completeFollowUp(
      completingLead.id,
      completeOutcome || 'Follow-up completed successfully',
      completeNotes,
      scheduleNextToggle ? nextFollowUpDate : undefined,
      currentUser?.name || 'Staff',
      completeMarkConverted
    );

    // If next follow up is scheduled, create a linked next follow-up item
    if (scheduleNextToggle && nextFollowUpDate) {
      addFollowUp(
        {
          leadType: completingLead.leadType,
          contactName: completingLead.contactName,
          phone: completingLead.phone,
          whatsapp: completingLead.whatsapp,
          email: completingLead.email,
          city: completingLead.city,
          state: completingLead.state,
          targetRequirement: completingLead.targetRequirement,
          candidateId: completingLead.candidateId,
          leadSource: completingLead.leadSource,
          priority: completingLead.priority,
          status: 'scheduled',
          channel: completingLead.channel,
          scheduledDate: nextFollowUpDate,
          scheduledTime: nextFollowUpTime || '11:00 AM',
          assignedStaffName: completingLead.assignedStaffName,
          notes: nextFollowUpNotes || `Follow-up continuing after previous milestone: ${completeOutcome}`,
          tags: completingLead.tags,
        },
        currentUser?.name || 'Staff'
      );
    }

    if (onToast) {
      onToast(
        completeMarkConverted
          ? `Lead marked as Converted for ${completingLead.contactName}!`
          : `Follow-up completed for ${completingLead.contactName}.`,
        'success'
      );
    }

    setCompletingLead(null);
    refreshData();
  };

  // Open Reschedule Dialog
  const handleOpenRescheduleDialog = (lead: CrmFollowUp) => {
    setReschedulingLead(lead);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setRescheduleDate(tomorrow.toISOString().split('T')[0]);
    setRescheduleTime(lead.scheduledTime || '11:00 AM');
    setRescheduleReason('');
  };

  const handleQuickSnooze = (days: number) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    setRescheduleDate(target.toISOString().split('T')[0]);
  };

  const handleConfirmReschedule = () => {
    if (!reschedulingLead || !rescheduleDate) return;

    rescheduleFollowUp(
      reschedulingLead.id,
      rescheduleDate,
      rescheduleTime,
      rescheduleReason || 'Scheduled by staff',
      currentUser?.name || 'Staff'
    );

    if (onToast) {
      onToast(`Follow-up rescheduled to ${rescheduleDate} for ${reschedulingLead.contactName}`, 'info');
    }

    setReschedulingLead(null);
    refreshData();
  };

  // Handle Quick Direct WhatsApp Dispatch
  const handleDirectWhatsApp = (lead: CrmFollowUp) => {
    const phone = lead.whatsapp || lead.phone;
    const msg = `Assalamu Alaikum *${lead.contactName}*,\n\nGreetings from *AL-HERA TRAVELS* (Overseas Recruitment & Umrah Hub).\n\nRegarding your inquiry for *${lead.targetRequirement || 'Saudi Arabia Services'}*, we would like to update you on the next processing steps.\n\nKindly let us know your availability for a brief call.\n\n*Recruitment Desk:* ${agency.phone}\n*Mumbai Head Office:* ${agency.mumbaiOffice || 'Mumbai, India'}`;

    const url = formatWhatsAppUrl(phone, msg);
    window.open(url, '_blank');

    logSentMessage(
      lead.contactName,
      phone,
      'whatsapp',
      msg,
      'CRM Follow-Up WhatsApp Dispatch',
      lead.passportNumber || lead.id
    );

    // Record activity in history
    updateFollowUp(
      lead.id,
      { lastContactedAt: new Date().toISOString() },
      {
        actionType: 'whatsapp',
        performedBy: currentUser?.name || 'Staff',
        notes: `Outbound WhatsApp follow-up dispatched to ${phone}`,
      }
    );

    refreshData();
    if (onToast) onToast(`Opened WhatsApp chat for ${lead.contactName}`, 'success');
  };

  // Handle Quick Direct Call
  const handleDirectCall = (lead: CrmFollowUp) => {
    window.open(`tel:${lead.phone.replace(/[^0-9+]/g, '')}`, '_self');

    // Prompt to log call note
    updateFollowUp(
      lead.id,
      { lastContactedAt: new Date().toISOString() },
      {
        actionType: 'call',
        performedBy: currentUser?.name || 'Staff',
        notes: `Direct phone call initiated to ${lead.phone}`,
      }
    );

    refreshData();
  };

  // Add Timeline Note inside Detail Modal
  const handleAddTimelineNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForDetail || !timelineQuickNote.trim()) return;

    const updated = updateFollowUp(
      selectedLeadForDetail.id,
      { lastContactedAt: new Date().toISOString() },
      {
        actionType: timelineQuickAction,
        performedBy: currentUser?.name || 'Staff',
        notes: timelineQuickNote.trim(),
      }
    );

    if (updated) {
      setSelectedLeadForDetail(updated);
    }
    setTimelineQuickNote('');
    refreshData();
    if (onToast) onToast('Activity note added to timeline.', 'success');
  };

  // Delete lead
  const handleDeleteLead = (id: string) => {
    deleteFollowUp(id);
    setDeleteConfirmId(null);
    refreshData();
    if (selectedLeadForDetail?.id === id) {
      setSelectedLeadForDetail(null);
    }
    if (onToast) onToast('Follow-up record deleted.', 'info');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Contact Name', 'Phone', 'WhatsApp', 'Requirement', 'Lead Type', 'Priority', 'Status', 'Channel', 'Scheduled Date', 'Assigned Staff', 'Notes', 'Outcome'];
    const rows = filteredLeads.map(l => [
      `"${l.id}"`,
      `"${l.contactName}"`,
      `"${l.phone}"`,
      `"${l.whatsapp || ''}"`,
      `"${l.targetRequirement || ''}"`,
      `"${l.leadType}"`,
      `"${l.priority}"`,
      `"${l.status}"`,
      `"${l.channel}"`,
      `"${l.scheduledDate} ${l.scheduledTime || ''}"`,
      `"${l.assignedStaffName}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      `"${(l.outcome || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `al_hera_crm_followups_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 pb-12">
      {/* Header Banner */}
      <div className="bg-[#0F1E36] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
            <PhoneCall className="w-3.5 h-3.5" />
            CRM Follow-Up & Staff Reminder Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-white">
            Lead Follow-Ups & Tele-Calling Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Schedule candidate callbacks, track WhatsApp conversations, handle overdue reminders, and record candidate conversion milestones in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all shadow-md"
            title="Download CSV report of current leads"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleOpenAddModal()}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Schedule New Follow-Up</span>
          </button>
        </div>
      </div>

      {/* OVERDUE CRITICAL ALERT BANNER (Shows if any lead is past due date) */}
      {overdueCount > 0 && (
        <div className="bg-red-500/10 border-2 border-red-500/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-red-950">
                🚨 {overdueCount} Overdue Follow-Up{overdueCount > 1 ? 's' : ''} Require Immediate Attention!
              </h4>
              <p className="text-xs text-red-700 font-medium">
                Scheduled callback dates have passed without an outcome status. Call or WhatsApp these candidates now.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('overdue')}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-all shrink-0 flex items-center gap-1.5"
          >
            <span>View Overdue Leads</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Overdue */}
        <div
          onClick={() => setActiveTab('overdue')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            activeTab === 'overdue'
              ? 'bg-red-50 border-red-400 ring-2 ring-red-400 shadow-md'
              : 'bg-white border-slate-200 hover:border-red-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-800 uppercase tracking-wider">Overdue</span>
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-red-700 mt-2">{overdueCount}</p>
          <span className="text-[11px] text-red-600 font-semibold block mt-0.5">Past due date</span>
        </div>

        {/* Due Today */}
        <div
          onClick={() => setActiveTab('due_today')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            activeTab === 'due_today'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400 shadow-md'
              : 'bg-white border-slate-200 hover:border-amber-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Due Today</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-800 mt-2">{dueTodayCount}</p>
          <span className="text-[11px] text-amber-700 font-semibold block mt-0.5">Scheduled for today</span>
        </div>

        {/* Upcoming (Next 7 Days) */}
        <div
          onClick={() => setActiveTab('upcoming')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            activeTab === 'upcoming'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400 shadow-md'
              : 'bg-white border-slate-200 hover:border-blue-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Upcoming</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-800 mt-2">{upcomingCount}</p>
          <span className="text-[11px] text-blue-600 font-semibold block mt-0.5">Next 7 days</span>
        </div>

        {/* Total Active Leads */}
        <div
          onClick={() => setActiveTab('all_active')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            activeTab === 'all_active'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400 shadow-md'
              : 'bg-white border-slate-200 hover:border-emerald-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Active Leads</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-800 mt-2">{activeCount}</p>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">In pipeline</span>
        </div>

        {/* Completed & Converted */}
        <div
          onClick={() => setActiveTab('completed')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            activeTab === 'completed'
              ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-400 shadow-md'
              : 'bg-white border-slate-200 hover:border-purple-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Converted / Done</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-800 mt-2">{completedCount}</p>
          <span className="text-[11px] text-purple-700 font-semibold block mt-0.5">
            {convertedCount} converted dossiers
          </span>
        </div>
      </div>

      {/* Main Filter & Navigation Ribbon */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('all_active')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all_active'
                  ? 'bg-[#0F1E36] text-amber-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Active ({activeCount})
            </button>

            <button
              onClick={() => setActiveTab('overdue')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'overdue'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-red-700 hover:bg-red-50'
              }`}
            >
              <span>🚨 Overdue</span>
              {overdueCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-red-700 font-black">
                  {overdueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('due_today')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'due_today'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              <span>🔔 Due Today</span>
              {dueTodayCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#0F1E36] text-amber-400 font-bold">
                  {dueTodayCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-[#0F1E36] text-amber-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upcoming ({upcomingCount})
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'completed'
                  ? 'bg-[#0F1E36] text-amber-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedCount})
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-[#0F1E36] text-amber-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Records ({followUps.length})
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl bg-slate-50 font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="due_date_asc">Due Date (Earliest First)</option>
              <option value="due_date_desc">Due Date (Latest First)</option>
              <option value="priority">Priority (Urgent → Cold)</option>
              <option value="newest">Recently Created</option>
            </select>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search contact, phone, trade, requirement, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Lead Type Filter */}
          <div>
            <select
              value={leadTypeFilter}
              onChange={(e) => setLeadTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Lead Categories</option>
              <option value="candidate">Job Candidates</option>
              <option value="umrah">Umrah Pilgrimage</option>
              <option value="partner">Sub-Agent / Partner</option>
              <option value="job_inquiry">Job Inquiries</option>
              <option value="visa_inquiry">Visa Stamping</option>
              <option value="general">General Walk-in</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">🔴 Urgent</option>
              <option value="hot">🔥 Hot Lead</option>
              <option value="warm">🟡 Warm</option>
              <option value="cold">❄️ Cold</option>
            </select>
          </div>

          {/* Staff Filter */}
          <div>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Assigned Staff</option>
              {allStaffNames.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leads List / Cards Grid */}
      <div className="space-y-4">
        {filteredLeads.map((lead) => {
          const overdue = isLeadOverdue(lead);
          const dueToday = isLeadDueToday(lead);
          const isDone = lead.status === 'completed' || lead.status === 'converted';

          return (
            <div
              key={lead.id}
              className={`bg-white rounded-3xl border transition-all p-5 sm:p-6 shadow-sm hover:shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 ${
                overdue
                  ? 'border-red-300 bg-red-50/30 ring-1 ring-red-200'
                  : dueToday
                  ? 'border-amber-300 bg-amber-50/20'
                  : isDone
                  ? 'border-slate-200 bg-slate-50/50 opacity-90'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Left Info Column */}
              <div className="space-y-3 flex-1 min-w-0">
                {/* Badges Row */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Lead Category Badge */}
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                    {lead.leadType === 'candidate' && <Users className="w-3 h-3 text-blue-600" />}
                    {lead.leadType === 'umrah' && <Moon className="w-3 h-3 text-purple-600" />}
                    {lead.leadType === 'partner' && <Building2 className="w-3 h-3 text-emerald-600" />}
                    {lead.leadType === 'job_inquiry' && <Briefcase className="w-3 h-3 text-amber-600" />}
                    <span className="capitalize">{lead.leadType.replace(/_/g, ' ')}</span>
                  </span>

                  {/* Priority Badge */}
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      lead.priority === 'urgent'
                        ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                        : lead.priority === 'hot'
                        ? 'bg-orange-100 text-orange-800 border border-orange-200'
                        : lead.priority === 'warm'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {lead.priority}
                  </span>

                  {/* Overdue / Due Today / Schedule Date Highlight */}
                  {overdue && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-300">
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                      OVERDUE ({lead.scheduledDate})
                    </span>
                  )}

                  {dueToday && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                      <Clock className="w-3 h-3 text-amber-700" />
                      DUE TODAY ({lead.scheduledTime || '11:00 AM'})
                    </span>
                  )}

                  {!overdue && !dueToday && !isDone && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Scheduled: {lead.scheduledDate} {lead.scheduledTime}
                    </span>
                  )}

                  {lead.status === 'converted' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Converted
                    </span>
                  )}

                  {lead.status === 'completed' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                      <Check className="w-3 h-3 text-purple-600" />
                      Completed
                    </span>
                  )}

                  {lead.status === 'lost' && (
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      Lost / Closed
                    </span>
                  )}
                </div>

                {/* Contact Name & Requirement Title */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-base sm:text-lg text-[#0F1E36] font-display">
                      {lead.contactName}
                    </h3>
                    {lead.candidateId && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-blue-50 text-blue-800 rounded-md border border-blue-200">
                        Candidate Dossier Linked
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-amber-700 font-bold">{lead.targetRequirement || 'General Overseas Requirement'}</span>
                    {lead.city && <span className="text-slate-400">• {lead.city}, {lead.state}</span>}
                  </p>
                </div>

                {/* Notes and Outcome Snippet */}
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 text-xs space-y-1.5">
                  <p className="text-slate-700 leading-relaxed font-medium">
                    <strong className="text-slate-900">Notes:</strong> {lead.notes || 'No notes added.'}
                  </p>

                  {lead.outcome && (
                    <p className="text-emerald-800 font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Outcome: {lead.outcome}</span>
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 gap-2">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Assigned to: <strong className="text-slate-800">{lead.assignedStaffName}</strong></span>
                    </span>
                    <span className="flex items-center gap-1 font-mono text-slate-600">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{lead.phone}</span>
                    </span>
                    <span>
                      History logs: <strong>{lead.history?.length || 0} event{(lead.history?.length || 0) === 1 ? '' : 's'}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex flex-wrap lg:flex-col items-center gap-2 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                {/* Direct WhatsApp button */}
                <button
                  onClick={() => handleDirectWhatsApp(lead)}
                  className="flex-1 lg:w-44 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  title="Open direct WhatsApp conversation"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                {/* Direct Call button */}
                <button
                  onClick={() => handleDirectCall(lead)}
                  className="flex-1 lg:w-44 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  title="Make phone call"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call {lead.phone}</span>
                </button>

                {/* Complete / Record Outcome */}
                {!isDone ? (
                  <button
                    onClick={() => handleOpenCompleteDialog(lead)}
                    className="flex-1 lg:w-44 py-2 px-3 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Complete / Outcome</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenCompleteDialog(lead)}
                    className="flex-1 lg:w-44 py-2 px-3 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-purple-700" />
                    <span>Re-open / Update</span>
                  </button>
                )}

                {/* Action Toolbar (Reschedule, Timeline, Edit, Delete) */}
                <div className="flex items-center gap-1.5 w-full justify-end lg:justify-between pt-1">
                  {!isDone && (
                    <button
                      onClick={() => handleOpenRescheduleDialog(lead)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1"
                      title="Reschedule / Postpone follow-up"
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px]">Snooze</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedLeadForDetail(lead)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1"
                    title="View Full History Timeline"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[11px]">History</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(lead)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                    title="Edit Lead Details"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-600" />
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(lead.id)}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-all"
                    title="Delete Follow-Up Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {filteredLeads.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
              <PhoneCall className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">
              No Follow-Up Leads Found
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchQuery
                ? `No follow-ups match "${searchQuery}". Try clearing search keywords.`
                : activeTab === 'overdue'
                ? 'All clear! There are zero overdue follow-up leads currently.'
                : activeTab === 'due_today'
                ? 'No follow-up calls scheduled for today.'
                : 'No follow-up records found in this view.'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
                setLeadTypeFilter('all');
                setPriorityFilter('all');
                setStaffFilter('all');
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT FOLLOW-UP LEAD */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 animate-scale-in my-8 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0F1E36] text-amber-400 flex items-center justify-center">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg sm:text-xl text-[#0F1E36] font-display">
                    {editingLead ? 'Edit CRM Follow-Up Lead' : 'Schedule New CRM Follow-Up'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Assign staff, due dates, contact requirements, and initial notes
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1.5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLeadSubmit} className="space-y-4">
              {/* Category & Source Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lead Category *
                  </label>
                  <select
                    value={formLeadType}
                    onChange={(e) => setFormLeadType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="candidate">Job Candidate (Saudi Arabia)</option>
                    <option value="umrah">Umrah Pilgrimage Package</option>
                    <option value="partner">Sub-Agent / Partner Office</option>
                    <option value="job_inquiry">General Job Inquiry</option>
                    <option value="visa_inquiry">Visa Stamping / Wakala</option>
                    <option value="general">General Walk-in</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lead Source *
                  </label>
                  <select
                    value={formLeadSource}
                    onChange={(e) => setFormLeadSource(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {LEAD_SOURCES.map((ls) => (
                      <option key={ls.id} value={ls.id}>{ls.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mohammad Irfan"
                    value={formContactName}
                    onChange={(e) => setFormContactName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91-9876543210"
                    value={formPhone}
                    onChange={(e) => {
                      setFormPhone(e.target.value);
                      if (!formWhatsapp) setFormWhatsapp(e.target.value);
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* WhatsApp & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91-9876543210"
                    value={formWhatsapp}
                    onChange={(e) => setFormWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. candidate@example.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* City & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lucknow / Sikar / Hyderabad"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    State / Region
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Uttar Pradesh / Rajasthan"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Target Requirement / Trade */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Job / Trade / Package Requirement *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heavy Trailer Driver - Riyadh (Almarai Logistics) OR 15-Day Economy Umrah"
                  value={formRequirement}
                  onChange={(e) => setFormRequirement(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Priority & Channel & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lead Priority *
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="urgent">🔴 Urgent</option>
                    <option value="hot">🔥 Hot</option>
                    <option value="warm">🟡 Warm</option>
                    <option value="cold">❄️ Cold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Follow-Up Channel *
                  </label>
                  <select
                    value={formChannel}
                    onChange={(e) => setFormChannel(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="call">📞 Phone Call</option>
                    <option value="whatsapp">💬 WhatsApp Message</option>
                    <option value="meeting">🏢 Office Meeting</option>
                    <option value="email">✉️ Email</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lead Stage Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress / Review</option>
                    <option value="completed">Completed</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost / Declined</option>
                  </select>
                </div>
              </div>

              {/* Due Date & Time & Staff */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Scheduled Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formScheduledDate}
                    onChange={(e) => setFormScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Scheduled Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 11:30 AM / 03:00 PM"
                    value={formScheduledTime}
                    onChange={(e) => setFormScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Staff *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Staff name"
                    value={formAssignedStaff}
                    onChange={(e) => setFormAssignedStaff(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Follow-Up Notes / Candidate Context
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Inquired about Saudi Arabia trailer driving tests. Sent test center directions. Needs follow up call to confirm travel date."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Heavy Driver, Trade Test, Direct Client, Token Advance"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-amber-400 text-xs font-bold shadow-lg transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>{editingLead ? 'Save Changes' : 'Schedule Follow-Up'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: COMPLETE / RECORD OUTCOME DIALOG */}
      {/* ========================================================================= */}
      {completingLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 animate-scale-in text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-lg text-[#0F1E36] font-display">
                  Record Follow-Up Outcome
                </h3>
                <p className="text-xs text-slate-500">
                  Lead: <strong className="text-slate-900">{completingLead.contactName}</strong> ({completingLead.phone})
                </p>
              </div>

              <button
                onClick={() => setCompletingLead(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Quick Outcome Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Quick Outcome:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_OUTCOMES.map((oc) => (
                    <button
                      key={oc}
                      type="button"
                      onClick={() => setCompleteOutcome(oc)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        completeOutcome === oc
                          ? 'bg-[#0F1E36] text-amber-400 border-[#0F1E36] shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {oc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Outcome Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Outcome Summary / Milestone *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Agreed to courier original passport tomorrow"
                  value={completeOutcome}
                  onChange={(e) => setCompleteOutcome(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Detailed Conversation Log */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Detailed Call / WhatsApp Conversation Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Add details of candidate response, questions asked, agreed terms, salary confirmation..."
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Converted Dossier Toggle */}
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-950 block">Mark as Converted Lead</span>
                  <span className="text-[11px] text-emerald-700">Candidate registered or Umrah token booking secured</span>
                </div>
                <input
                  type="checkbox"
                  checked={completeMarkConverted}
                  onChange={(e) => setCompleteMarkConverted(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                />
              </div>

              {/* Schedule Next Step Toggle */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Schedule Next Follow-Up Step?</span>
                    <span className="text-[11px] text-slate-500">Automatically creates next reminder in staff queue</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={scheduleNextToggle}
                    onChange={(e) => setScheduleNextToggle(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded-md focus:ring-amber-500"
                  />
                </div>

                {scheduleNextToggle && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 animate-fade-in">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Next Follow-Up Date</label>
                      <input
                        type="date"
                        value={nextFollowUpDate}
                        onChange={(e) => setNextFollowUpDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Next Time</label>
                      <input
                        type="text"
                        value={nextFollowUpTime}
                        onChange={(e) => setNextFollowUpTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCompletingLead(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmComplete}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Outcome & Complete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RESCHEDULE / SNOOZE MODAL */}
      {/* ========================================================================= */}
      {reschedulingLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 animate-scale-in text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-lg text-[#0F1E36] font-display">
                  Reschedule / Snooze Follow-Up
                </h3>
                <p className="text-xs text-slate-500">
                  Postpone reminder for <strong className="text-slate-900">{reschedulingLead.contactName}</strong>
                </p>
              </div>

              <button
                onClick={() => setReschedulingLead(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Quick Snooze Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Quick Snooze Presets:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickSnooze(1)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-800 text-xs font-bold text-center transition-all border border-slate-200"
                  >
                    +1 Day (Tomorrow)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSnooze(3)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-800 text-xs font-bold text-center transition-all border border-slate-200"
                  >
                    +3 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSnooze(7)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-800 text-xs font-bold text-center transition-all border border-slate-200"
                  >
                    +1 Week
                  </button>
                </div>
              </div>

              {/* Custom Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Date *</label>
                  <input
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time</label>
                  <input
                    type="text"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Rescheduling (Logged in history)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Candidate asked to call in the evening / Travelling"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReschedulingLead(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReschedule}
                  className="px-5 py-2 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-amber-400 text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Update Schedule</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: FULL TIMELINE & DOSSIER DRAWER */}
      {/* ========================================================================= */}
      {selectedLeadForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 animate-scale-in my-8 text-slate-900 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0F1E36] text-amber-400 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg sm:text-xl text-[#0F1E36] font-display">
                    {selectedLeadForDetail.contactName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lead ID: <strong className="font-mono text-slate-800">{selectedLeadForDetail.id}</strong> • {selectedLeadForDetail.phone}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLeadForDetail(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1.5"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="space-y-6 overflow-y-auto pr-1 flex-1">
              {/* Lead Details Overview Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Requirement</span>
                    <strong className="text-slate-900">{selectedLeadForDetail.targetRequirement || 'General'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Priority</span>
                    <strong className="text-slate-900 capitalize">{selectedLeadForDetail.priority}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Stage Status</span>
                    <strong className="text-slate-900 capitalize">{selectedLeadForDetail.status}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Assigned Staff</span>
                    <strong className="text-slate-900">{selectedLeadForDetail.assignedStaffName}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => handleDirectWhatsApp(selectedLeadForDetail)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => handleDirectCall(selectedLeadForDetail)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Now</span>
                  </button>

                  {selectedLeadForDetail.candidateId && (
                    <button
                      onClick={() => {
                        const cand = candidates.find(c => c.id === selectedLeadForDetail.candidateId);
                        if (cand && onSelectCandidate) {
                          onSelectCandidate(cand);
                          setSelectedLeadForDetail(null);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-amber-400 font-bold text-xs flex items-center gap-1.5"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>View Full Candidate Dossier</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Add New Activity Log Form */}
              <form onSubmit={handleAddTimelineNote} className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-amber-700" />
                    Add Real-Time Call / Activity Log
                  </span>
                  <select
                    value={timelineQuickAction}
                    onChange={(e) => setTimelineQuickAction(e.target.value as any)}
                    className="px-2.5 py-1 text-xs border border-amber-300 rounded-lg bg-white font-semibold focus:outline-none"
                  >
                    <option value="call">📞 Phone Call Log</option>
                    <option value="whatsapp">💬 WhatsApp Chat Log</option>
                    <option value="meeting">🏢 Office Meeting Log</option>
                    <option value="note_added">📝 Staff Note</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter call outcome, conversation notes, or client response..."
                    value={timelineQuickNote}
                    onChange={(e) => setTimelineQuickNote(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0F1E36] hover:bg-[#1A3258] text-amber-400 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm shrink-0"
                  >
                    <Send className="w-3 h-3" />
                    <span>Log Event</span>
                  </button>
                </div>
              </form>

              {/* Chronological History Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Complete Follow-Up History & Audit Trail ({selectedLeadForDetail.history?.length || 0})
                </h4>

                <div className="relative pl-6 border-l-2 border-slate-200 space-y-4 py-1">
                  {(selectedLeadForDetail.history || []).map((entry, idx) => (
                    <div key={entry.id || idx} className="relative space-y-1">
                      {/* Timeline Node Dot */}
                      <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-white border-2 border-[#0F1E36] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 capitalize flex items-center gap-1.5">
                          {entry.actionType === 'call' && <Phone className="w-3 h-3 text-blue-600" />}
                          {entry.actionType === 'whatsapp' && <MessageSquare className="w-3 h-3 text-emerald-600" />}
                          {entry.actionType === 'completed' && <CheckCircle2 className="w-3 h-3 text-purple-600" />}
                          {entry.actionType === 'rescheduled' && <Clock className="w-3 h-3 text-amber-600" />}
                          {entry.actionType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                        {entry.notes}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                        <span>Logged by: <strong className="text-slate-700">{entry.performedBy}</strong></span>
                        {entry.outcome && (
                          <span className="text-emerald-700 font-bold">Outcome: {entry.outcome}</span>
                        )}
                      </div>
                    </div>
                  ))}

                  {(!selectedLeadForDetail.history || selectedLeadForDetail.history.length === 0) && (
                    <p className="text-xs text-slate-400 italic">No previous follow-up history logged.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedLeadForDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: DELETE CONFIRMATION */}
      {/* ========================================================================= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-scale-in text-slate-900 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-slate-900">Delete Follow-Up Record?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently remove this CRM follow-up record and all its history logs?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteLead(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md"
              >
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
