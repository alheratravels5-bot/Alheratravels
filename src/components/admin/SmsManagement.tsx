import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Phone,
  CheckCircle2,
  Copy,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  Plus,
  RotateCcw,
  Search,
  Check,
  ExternalLink,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { SmsTemplate, SentMessageLog, AgencyInfo, MessageTemplate } from '../../types';
import {
  getSmsTemplates,
  saveSmsTemplates,
  getSentMessages,
  saveMessageLogs,
  getAgencyInfo,
  INITIAL_MESSAGE_TEMPLATES
} from '../../lib/storage';
import { formatWhatsAppUrl, logSentMessage } from '../../lib/notifications';

interface SmsManagementProps {
  agencyInfo?: AgencyInfo;
}

const AVAILABLE_MERGE_VARS: { key: string; label: string; sample: string }[] = [
  { key: 'candidate_name', label: 'Candidate Name', sample: 'Mohammad Tariq Ansari' },
  { key: 'tracking_id', label: 'Tracking ID', sample: 'AHT-2025-9102' },
  { key: 'passport_no', label: 'Passport No', sample: 'Z5891042' },
  { key: 'trade', label: 'Applied Trade', sample: 'Heavy Equipment Operator' },
  { key: 'job_title', label: 'Job Title', sample: 'Heavy Trailer Driver' },
  { key: 'sponsor_name', label: 'Sponsor / Company', sample: 'Almarai Logistics Co., Riyadh' },
  { key: 'salary_details', label: 'Salary Offer', sample: '2,800 SAR + Overtime' },
  { key: 'visa_number', label: 'Saudi Visa No', sample: '141098231' },
  { key: 'flight_details', label: 'Flight Info', sample: 'Saudi Airlines SV-759' },
  { key: 'departure_date', label: 'Travel Date', sample: '15-Oct-2025' },
  { key: 'departure_city', label: 'Origin City', sample: 'New Delhi (DEL)' },
  { key: 'arrival_city', label: 'Destination City', sample: 'Riyadh (RUH)' },
  { key: 'pnr', label: 'Airline PNR', sample: 'SV892J' },
  { key: 'tracking_link', label: 'Live Tracking Link', sample: 'https://alheratravels.com/?track=AHT-2025-9102' },
  { key: 'amount', label: 'Paid Amount', sample: '₹45,000' },
  { key: 'receipt_number', label: 'Receipt No', sample: 'REC-2025-0042' },
  { key: 'payment_method', label: 'Payment Mode', sample: 'Bank Transfer' },
  { key: 'balance_due', label: 'Balance Due', sample: '₹20,000' },
  { key: 'agency_name', label: 'Agency Name', sample: 'AL-HERA TRAVELS' },
  { key: 'agency_phone', label: 'Agency Helpline', sample: '+91-9214635385' },
];

export const SmsManagement: React.FC<SmsManagementProps> = ({ agencyInfo: propAgency }) => {
  const [templates, setTemplates] = useState<SmsTemplate[]>(() => {
    const raw = getSmsTemplates();
    return Array.isArray(raw) && raw.length > 0 ? raw : INITIAL_MESSAGE_TEMPLATES;
  });
  const [logs, setLogs] = useState<SentMessageLog[]>(() => getSentMessages());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || 'tpl-1');
  const [activeTab, setActiveTab] = useState<'templates' | 'logs'>('templates');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('+919214635385');
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState<Partial<SmsTemplate>>({
    title: '',
    channel: 'whatsapp',
    eventTrigger: 'custom',
    triggerEvent: 'Custom Event',
    bodyTemplate: 'Assalamu Alaikum *{candidate_name}*,\n\n',
  });

  const agency = propAgency || getAgencyInfo();

  const selectedTemplate =
    templates.find((t) => t.id === selectedTemplateId) ||
    templates[0] ||
    INITIAL_MESSAGE_TEMPLATES[0];

  const getTemplateText = (tpl?: Partial<SmsTemplate> | null): string => {
    if (!tpl) return '';
    return tpl.bodyTemplate || tpl.content || '';
  };

  const getTemplateVars = (tpl?: Partial<SmsTemplate> | null): string[] => {
    if (!tpl) return [];
    if (Array.isArray(tpl.variables) && tpl.variables.length > 0) {
      return tpl.variables;
    }
    const text = getTemplateText(tpl);
    const matches = text.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
    const extracted = Array.from(new Set(matches.map((m) => m.replace(/[{}]/g, ''))));
    return extracted.length > 0 ? extracted : ['candidate_name', 'tracking_id', 'status', 'agency_phone'];
  };

  const currentTemplateText = getTemplateText(selectedTemplate);
  const currentTemplateVars = getTemplateVars(selectedTemplate);

  // Render simulated preview
  const generateSimulatedPreview = (text: string): string => {
    let preview = text || '';
    AVAILABLE_MERGE_VARS.forEach((v) => {
      preview = preview.replaceAll(`{${v.key}}`, v.sample);
    });
    // Fallback for agency variables
    preview = preview.replaceAll('{agency_phone}', agency.phone || '+91-9214635385');
    preview = preview.replaceAll('{agency_name}', agency.name || 'AL-HERA TRAVELS');
    preview = preview.replaceAll('{agency_email}', agency.email || 'info@alheratravels.com');
    return preview;
  };

  const handleUpdateTemplateText = (newText: string) => {
    if (!selectedTemplate) return;
    const updated = templates.map((t) =>
      t.id === selectedTemplate.id
        ? {
            ...t,
            bodyTemplate: newText,
            content: newText,
            variables: getTemplateVars({ ...t, bodyTemplate: newText }),
          }
        : t
    );
    setTemplates(updated);
    saveSmsTemplates(updated);
  };

  const handleInsertVariable = (varKey: string) => {
    const addition = `{${varKey}}`;
    const newText = currentTemplateText ? `${currentTemplateText} ${addition}` : addition;
    handleUpdateTemplateText(newText);
  };

  const handleCopyPreview = () => {
    const preview = generateSimulatedPreview(currentTemplateText);
    navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendTestWhatsApp = () => {
    if (!testPhoneNumber) return;
    const preview = generateSimulatedPreview(currentTemplateText);
    const url = formatWhatsAppUrl(testPhoneNumber, preview);
    window.open(url, '_blank');

    const newLog = logSentMessage(
      'Test Simulation Recipient',
      testPhoneNumber,
      'whatsapp',
      preview,
      selectedTemplate?.title || 'Template Test',
      'AHT-TEST-001'
    );
    setLogs([newLog, ...logs]);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all SMS & WhatsApp templates to official Al-Hera factory defaults?')) {
      saveSmsTemplates(INITIAL_MESSAGE_TEMPLATES);
      setTemplates(INITIAL_MESSAGE_TEMPLATES);
      setSelectedTemplateId(INITIAL_MESSAGE_TEMPLATES[0].id);
    }
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateForm.title?.trim()) return;

    const newTpl: SmsTemplate = {
      id: 'tpl-' + Date.now(),
      title: newTemplateForm.title.trim(),
      channel: newTemplateForm.channel || 'whatsapp',
      eventTrigger: newTemplateForm.eventTrigger || 'custom',
      triggerEvent: newTemplateForm.triggerEvent || newTemplateForm.title.trim(),
      content: newTemplateForm.bodyTemplate || '',
      bodyTemplate: newTemplateForm.bodyTemplate || '',
      variables: getTemplateVars({ bodyTemplate: newTemplateForm.bodyTemplate }),
    };

    const updated = [...templates, newTpl];
    setTemplates(updated);
    saveSmsTemplates(updated);
    setSelectedTemplateId(newTpl.id);
    setIsAddingTemplate(false);
    setNewTemplateForm({
      title: '',
      channel: 'whatsapp',
      eventTrigger: 'custom',
      triggerEvent: 'Custom Event',
      bodyTemplate: 'Assalamu Alaikum *{candidate_name}*,\n\n',
    });
  };

  const handleDeleteTemplate = (id: string) => {
    if (templates.length <= 1) {
      alert('At least one template must remain in the system.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this notification template?')) {
      const updated = templates.filter((t) => t.id !== id);
      setTemplates(updated);
      saveSmsTemplates(updated);
      setSelectedTemplateId(updated[0]?.id || '');
    }
  };

  const filteredLogs = logs.filter((l) => {
    if (!logSearchQuery.trim()) return true;
    const q = logSearchQuery.toLowerCase();
    return (
      (l.recipientName && l.recipientName.toLowerCase().includes(q)) ||
      (l.recipientPhone && l.recipientPhone.includes(q)) ||
      (l.templateUsed && l.templateUsed.toLowerCase().includes(q)) ||
      (l.templateTitle && l.templateTitle.toLowerCase().includes(q)) ||
      (l.trackingId && l.trackingId.toLowerCase().includes(q)) ||
      (l.messageText && l.messageText.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-extrabold text-[#0F1E36] font-display">
              SMS & WhatsApp Gateway Desk
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure automated status trigger templates, inspect merge tags, and review real-time outbound dispatch logs.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAddingTemplate(true)}
            className="px-4 py-2 rounded-xl bg-[#0F1E36] hover:bg-[#1A3258] text-amber-400 text-xs font-bold flex items-center gap-1.5 shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Template</span>
          </button>

          <button
            onClick={handleResetDefaults}
            title="Reset to Factory Defaults"
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-6 text-xs font-bold shadow-xs">
        <button
          onClick={() => setActiveTab('templates')}
          className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'templates'
              ? 'border-emerald-600 text-emerald-900 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-600" />
          <span>Message Templates ({templates.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'border-emerald-600 text-emerald-900 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-600" />
          <span>Outbound Dispatch Logs ({logs.length})</span>
        </button>
      </div>

      {/* Tab 1: Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Templates list */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                Available Templates ({templates.length})
              </span>
            </div>

            <div className="space-y-2.5">
              {templates.map((tpl) => {
                const isSelected = selectedTemplate?.id === tpl.id;
                const text = getTemplateText(tpl);
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/60 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        {tpl.channel || 'whatsapp'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {tpl.triggerEvent || tpl.eventTrigger || 'Custom'}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-[#0F1E36] mt-2 line-clamp-1">{tpl.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-mono leading-relaxed">
                      {text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Template Detail & Live Preview */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            {selectedTemplate ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-lg text-[#0F1E36] font-display">
                      {selectedTemplate.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Event Hook: <strong className="text-slate-800">{selectedTemplate.triggerEvent || selectedTemplate.eventTrigger || 'Manual'}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase">
                      {selectedTemplate.channel || 'whatsapp'}
                    </span>
                    {templates.length > 1 && (
                      <button
                        onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Available placeholder chips (Click to insert) */}
                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Click tag to insert into template:
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_MERGE_VARS.map((v) => {
                      const isUsed = currentTemplateVars.includes(v.key);
                      return (
                        <button
                          key={v.key}
                          type="button"
                          onClick={() => handleInsertVariable(v.key)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
                            isUsed
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold hover:bg-emerald-200'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-100'
                          }`}
                          title={`Insert {${v.key}} (Sample: ${v.sample})`}
                        >
                          +{`{${v.key}}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Template body editor */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Raw Template Text (Supports WhatsApp formatting: *bold*, _italic_):
                  </label>
                  <textarea
                    rows={7}
                    value={currentTemplateText}
                    onChange={(e) => handleUpdateTemplateText(e.target.value)}
                    className="w-full text-xs font-mono p-4 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all leading-relaxed"
                  ></textarea>
                </div>

                {/* Live Mock Phone Simulation Preview */}
                <div className="p-5 bg-[#075E54] text-white rounded-2xl space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-emerald-200 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-300" />
                      WhatsApp Screen Simulation Preview
                    </span>
                    <button
                      onClick={handleCopyPreview}
                      className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-[11px] font-semibold text-white flex items-center gap-1 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Preview</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-[#DCF8C6] text-slate-900 p-4 rounded-xl shadow text-xs whitespace-pre-wrap leading-relaxed font-sans border border-emerald-300">
                    {generateSimulatedPreview(currentTemplateText)}
                  </div>
                </div>

                {/* Test Dispatch Trigger */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Direct Test Dispatch</h5>
                    <p className="text-[11px] text-slate-500">Test send this template directly to any WhatsApp number</p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      value={testPhoneNumber}
                      onChange={(e) => setTestPhoneNumber(e.target.value)}
                      placeholder="+919214635385"
                      className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-44"
                    />
                    <button
                      onClick={handleSendTestWhatsApp}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow shrink-0 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send WhatsApp</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-slate-400 italic text-center py-12">Select a template to view and edit.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-[#0F1E36]">Outbound Notification Audit Log</h3>
              <p className="text-xs text-slate-500">Real-time audit trail of WhatsApp and SMS messages dispatched to candidates</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  placeholder="Search recipient, phone, trade..."
                  className="pl-9 pr-4 py-1.5 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
                />
              </div>

              {logs.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Clear all outbound dispatch logs?')) {
                      saveMessageLogs([]);
                      setLogs([]);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-semibold transition-colors"
                >
                  Clear Logs
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F1E36] text-white font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Recipient</th>
                  <th className="py-3.5 px-4">Phone / WhatsApp</th>
                  <th className="py-3.5 px-4">Channel</th>
                  <th className="py-3.5 px-4">Template Title</th>
                  <th className="py-3.5 px-4">Message Content Snippet</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Delivery Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {log.recipientName || 'Candidate'}
                        {log.trackingId && (
                          <span className="block text-[10px] font-mono text-slate-400 font-normal">
                            {log.trackingId}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{log.recipientPhone}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          {log.channel || 'whatsapp'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {log.templateTitle || log.templateUsed || 'Direct Notification'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-[280px] truncate" title={log.messageText || log.messageBody}>
                        {log.messageText || log.messageBody}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                        {new Date(log.sentAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Dispatched
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                      No outbound message records found matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create New Template */}
      {isAddingTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-[#0F1E36]">Create New Notification Template</h3>
              <button
                onClick={() => setIsAddingTemplate(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Template Title *</label>
                <input
                  type="text"
                  required
                  value={newTemplateForm.title || ''}
                  onChange={(e) => setNewTemplateForm({ ...newTemplateForm, title: e.target.value })}
                  placeholder="e.g. Visa Re-verification Alert"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Channel</label>
                  <select
                    value={newTemplateForm.channel || 'whatsapp'}
                    onChange={(e) => setNewTemplateForm({ ...newTemplateForm, channel: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trigger Event Hook</label>
                  <input
                    type="text"
                    value={newTemplateForm.triggerEvent || ''}
                    onChange={(e) => setNewTemplateForm({ ...newTemplateForm, triggerEvent: e.target.value })}
                    placeholder="e.g. on_visa_ready"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Template Message Body *</label>
                <textarea
                  rows={6}
                  required
                  value={newTemplateForm.bodyTemplate || ''}
                  onChange={(e) => setNewTemplateForm({ ...newTemplateForm, bodyTemplate: e.target.value })}
                  placeholder="Assalamu Alaikum *{candidate_name}*..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddingTemplate(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
