import React, { useState } from 'react';
import { Sliders, Plus, Edit2, Trash2, CheckCircle2, Eye, X, Save } from 'lucide-react';
import { SliderBanner } from '../../types';
import { getSliders, saveSliders } from '../../lib/storage';

export const SliderManagement: React.FC = () => {
  const [sliders, setSliders] = useState<SliderBanner[]>(getSliders());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState<SliderBanner | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [highlightText, setHighlightText] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('');
  const [ctaText, setCtaText] = useState('Explore Openings');
  const [ctaAction, setCtaAction] = useState('jobs');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const openNew = () => {
    setEditingSlider(null);
    setTitle('Direct Saudi Mega Projects Recruitment');
    setHighlightText('Govt. Approved Fast Wakala');
    setSubtitle('Urgent client interviews for Engineers, Heavy Equipment Drivers, Welders & Hospitality staff.');
    setBadge('Saudi Arabia 2025');
    setCtaText('Explore Saudi Jobs');
    setCtaAction('jobs');
    setImageUrl('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&auto=format&fit=crop&q=80');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEdit = (s: SliderBanner) => {
    setEditingSlider(s);
    setTitle(s.title);
    setHighlightText(s.highlightText);
    setSubtitle(s.subtitle);
    setBadge(s.badge);
    setCtaText(s.ctaText);
    setCtaAction(s.ctaAction);
    setImageUrl(s.imageUrl);
    setIsActive(s.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSlider: SliderBanner = {
      id: editingSlider?.id || 'sld-' + Date.now(),
      title,
      highlightText,
      subtitle,
      badge,
      ctaText,
      ctaAction,
      imageUrl,
      order: editingSlider?.order || sliders.length + 1,
      isActive,
    };

    const updated = editingSlider
      ? sliders.map((s) => (s.id === editingSlider.id ? newSlider : s))
      : [...sliders, newSlider];

    setSliders(updated);
    saveSliders(updated);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this website hero slider?')) {
      const updated = sliders.filter((s) => s.id !== id);
      setSliders(updated);
      saveSliders(updated);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0F1E36] font-display">
            Website Hero Slider Management
          </h2>
          <p className="text-xs text-slate-500">
            Configure high-impact promotional banners, highlight text, images, and call-to-actions.
          </p>
        </div>

        <button
          onClick={openNew}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Add Hero Slide</span>
        </button>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sliders.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="relative h-44 bg-slate-900">
                <img
                  src={s.imageUrl}
                  alt={s.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-slate-950/40"></div>
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500 text-slate-950">
                    {s.badge}
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <h4 className="font-bold text-sm leading-tight">{s.title}</h4>
                  <span className="text-[11px] text-amber-300 font-bold block">{s.highlightText}</span>
                </div>
              </div>

              <div className="p-4 space-y-2 text-xs">
                <p className="text-slate-600 line-clamp-2">{s.subtitle}</p>
                <div className="pt-2 border-t flex justify-between text-slate-500">
                  <span>Action: <strong>{s.ctaAction}</strong></span>
                  <span>CTA: <strong>{s.ctaText}</strong></span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${s.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                {s.isActive ? 'Active on Public Site' : 'Inactive'}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(s)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 my-8 animate-fade-in text-xs">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-base text-[#0F1E36]">
                {editingSlider ? 'Edit Hero Banner' : 'Create New Hero Banner'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Main Heading</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Golden Highlight Text</label>
                <input
                  type="text"
                  required
                  value={highlightText}
                  onChange={(e) => setHighlightText(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-amber-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtitle Description</label>
                <textarea
                  rows={2}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Action Link</label>
                  <select
                    value={ctaAction}
                    onChange={(e) => setCtaAction(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    <option value="jobs">Go to Saudi Jobs</option>
                    <option value="umrah">Go to Umrah Packages</option>
                    <option value="track">Go to Passport Tracking</option>
                    <option value="whatsapp">Open WhatsApp Chat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Banner Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#0F1E36] text-white font-bold"
                >
                  Save Hero Slide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
