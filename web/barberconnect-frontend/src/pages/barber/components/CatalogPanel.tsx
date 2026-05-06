import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { haircutStyleService, type HaircutStyle } from '../../../services/haircutStyleService';

// ─── Validation helpers ────────────────────────────────────────────────────────
interface FormErrors { name?: string; basePrice?: string; }

function validateForm(name: string, basePrice: string): FormErrors {
  const errors: FormErrors = {};
  if (!name.trim()) errors.name = 'Style name is required';
  if (!basePrice || parseFloat(basePrice) <= 0) errors.basePrice = 'A valid price is required';
  return errors;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
  <svg className="animate-spin w-4 h-4 mr-2 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

// ─── Shared input classes ──────────────────────────────────────────────────────
const inputCls = (hasError?: boolean) =>
  `w-full px-3 py-2.5 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-red-400 focus:ring-red-300 bg-red-50'
      : 'border-slate-300 focus:ring-[#D2691E]/40 focus:border-[#D2691E]'
  }`;

// ─── Component ────────────────────────────────────────────────────────────────
const CatalogPanel: React.FC = () => {
  const { user } = useAuth();
  const barberProfileId = user?.barberProfile?.id?.toString() ?? '';

  const [styles, setStyles]   = useState<HaircutStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── Add modal state ──────────────────────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName,        setNewName]        = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newBasePrice,   setNewBasePrice]   = useState('');
  const [newDuration,    setNewDuration]    = useState('');
  const [newImageFile,   setNewImageFile]   = useState<File | null>(null);
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [formErrors,     setFormErrors]     = useState<FormErrors>({});
  const [submitError,    setSubmitError]    = useState<string | null>(null);
  const [touched,        setTouched]        = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Edit modal state ─────────────────────────────────────────────────────────
  const [editingStyle,    setEditingStyle]    = useState<HaircutStyle | null>(null);
  const [editName,        setEditName]        = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBasePrice,   setEditBasePrice]   = useState('');
  const [editDuration,    setEditDuration]    = useState('');
  const [editErrors,      setEditErrors]      = useState<FormErrors>({});
  const [editSubmitting,  setEditSubmitting]  = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const resetAddForm = () => {
    setNewName(''); setNewDescription(''); setNewBasePrice('');
    setNewDuration(''); setNewImageFile(null);
    setFormErrors({}); setTouched({}); setSubmitError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const refreshStyles = async () => {
    if (!barberProfileId) return;
    try {
      const data = await haircutStyleService.getHaircutStylesForBarber(barberProfileId);
      setStyles(data);
      setFetchError(null);
    } catch (err: any) {
      setFetchError(err.message);
    }
  };

  // ── Fetch on mount / barberProfileId change ──────────────────────────────────
  useEffect(() => {
    if (!barberProfileId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    refreshStyles().finally(() => setLoading(false));
  }, [barberProfileId]);

  // ── Create ───────────────────────────────────────────────────────────────────
  const handleCreateStyle = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched to show any errors
    setTouched({ name: true, basePrice: true });

    if (!barberProfileId) {
      setSubmitError('Your barber profile is not loaded yet. Please refresh the page.');
      return;
    }

    const errors = validateForm(newName, newBasePrice);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const formData = new FormData();
      formData.append('barberProfileId', barberProfileId);
      formData.append('name', newName.trim());
      formData.append('description', newDescription.trim());
      formData.append('basePrice', newBasePrice);
      if (newDuration) formData.append('durationMinutes', newDuration);
      if (newImageFile) formData.append('file', newImageFile);

      const created = await haircutStyleService.createHaircutStyle(formData);

      // Optimistically add the new style; also attempt a background refresh
      setStyles(prev => [...prev, created]);
      setIsAddModalOpen(false);
      resetAddForm();

      // Best-effort re-fetch (won't surface an error in the UI since create succeeded)
      refreshStyles().catch(err => console.warn('[CatalogPanel] re-fetch after create failed:', err));
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to create style. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Update ───────────────────────────────────────────────────────────────────
  const handleUpdateStyle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStyle) return;

    const errors = validateForm(editName, editBasePrice);
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setEditSubmitting(true);
    try {
      await haircutStyleService.updateHaircutStyle(editingStyle.haircut_style_id, {
        name: editName.trim(),
        description: editDescription.trim(),
        basePrice: parseFloat(editBasePrice),
        durationMinutes: editDuration ? parseInt(editDuration, 10) : undefined,
      });
      setEditingStyle(null);
      await refreshStyles();
    } catch (err: any) {
      alert(err.message || 'Failed to update style. Please try again.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── Blur handler for inline validation ──────────────────────────────────────
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setFormErrors(validateForm(newName, newBasePrice));
  };

  // ── JSX ──────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Haircut Catalog</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your services and set your prices</p>
        </div>
        <button
          onClick={() => { resetAddForm(); setIsAddModalOpen(true); }}
          disabled={!barberProfileId}
          className="bg-[#D2691E] hover:bg-[#8B4513] disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Add New Style
        </button>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-block w-10 h-10 border-4 border-slate-200 border-t-[#D2691E] rounded-full animate-spin mb-3" />
            <p className="text-slate-500 text-sm">Loading...</p>
          </div>
        ) : fetchError ? (
          <div className="col-span-full text-center py-12 text-red-500">
            <p className="font-semibold">Failed to load styles</p>
            <p className="text-sm mt-1">{fetchError}</p>
            <button onClick={refreshStyles} className="mt-4 text-sm underline text-[#D2691E] hover:text-[#8B4513]">
              Retry
            </button>
          </div>
        ) : styles.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <p className="text-slate-600 text-base mb-2">No haircut styles yet</p>
            <p className="text-slate-500 text-sm">Click "Add New Style" to create your first one</p>
          </div>
        ) : styles.map((style) => (
          <div key={style.haircut_style_id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all">
            <div className="h-48 bg-slate-200 overflow-hidden relative">
              <img
                src={style.imageUrl || 'https://images.unsplash.com/photo-1599351431202-1e0f01ce346f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'}
                alt={style.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 shadow-sm">
                @Cloudinary
              </div>
              {style.isActive && (
                <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                  Active
                </div>
              )}
            </div>
            <div className="p-5">
              <h3 className="text-lg font-bold text-slate-800 mb-2">{style.name}</h3>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">{style.description}</p>
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
                <span className="text-[#D2691E] font-bold text-lg">₱{style.basePrice}</span>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold">{style.durationMinutes}min</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingStyle(style);
                    setEditName(style.name);
                    setEditDescription(style.description || '');
                    setEditBasePrice(String(style.basePrice));
                    setEditDuration(String(style.durationMinutes ?? ''));
                    setEditErrors({});
                  }}
                  className="flex-1 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (!confirm('Delete this style?')) return;
                    try {
                      await haircutStyleService.deleteHaircutStyle(style.haircut_style_id);
                      setStyles(prev => prev.filter(s => s.haircut_style_id !== style.haircut_style_id));
                    } catch {
                      alert('Failed to delete style');
                    }
                  }}
                  className="w-11 h-11 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-all shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Add Style Modal ────────────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setIsAddModalOpen(false); resetAddForm(); } }}
        >
          <div
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            style={{ animation: 'modalIn 0.2s ease-out' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Add New Style</h3>
                <p className="text-xs text-slate-400 mt-0.5">Fill in the details for your new haircut service</p>
              </div>
              <button
                onClick={() => { setIsAddModalOpen(false); resetAddForm(); }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStyle} noValidate>
              <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">

                {/* Global submit error */}
                {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                    {submitError}
                  </div>
                )}

                {/* Style Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Style Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newName}
                    onChange={e => { setNewName(e.target.value); if (touched.name) setFormErrors(validateForm(e.target.value, newBasePrice)); }}
                    onBlur={() => handleBlur('name')}
                    className={inputCls(touched.name && !!formErrors.name)}
                  >
                    <option value="" disabled>Select a style...</option>
                    <option value="Classic">Classic</option>
                    <option value="Normal">Normal</option>
                    <option value="BarberChoice">BarberChoice</option>
                    <option value="Artistic">Artistic</option>
                  </select>
                  {touched.name && formErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    className={inputCls()}
                    placeholder="Brief description of the style…"
                    rows={3}
                  />
                </div>

                {/* Price + Duration (2-col) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Price (₱) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newBasePrice}
                      onChange={e => { setNewBasePrice(e.target.value); if (touched.basePrice) setFormErrors(validateForm(newName, e.target.value)); }}
                      onBlur={() => handleBlur('basePrice')}
                      className={inputCls(touched.basePrice && !!formErrors.basePrice)}
                      placeholder="250.00"
                    />
                    {touched.basePrice && formErrors.basePrice && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.basePrice}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Duration (min)</label>
                    <input
                      type="number"
                      min="1"
                      value={newDuration}
                      onChange={e => setNewDuration(e.target.value)}
                      className={inputCls()}
                      placeholder="30"
                    />
                  </div>
                </div>

                {/* Image upload */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Style Photo</label>
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={e => setNewImageFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className={`flex items-center gap-3 border rounded-lg px-3 py-2.5 transition-all ${newImageFile ? 'border-[#D2691E] bg-orange-50' : 'border-slate-300 hover:border-[#D2691E]'}`}>
                      <div className="flex-shrink-0 bg-[#D2691E] text-white text-xs font-bold px-3 py-1.5 rounded-md">
                        Choose File
                      </div>
                      <span className="text-sm text-slate-500 truncate">
                        {newImageFile ? newImageFile.name : 'No file chosen — optional'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); resetAddForm(); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#D2691E] hover:bg-[#8B4513] text-white font-semibold text-sm shadow-sm transition-colors disabled:opacity-60 flex items-center justify-center"
                >
                  {isSubmitting && <Spinner />}
                  {isSubmitting ? 'Saving…' : 'Save Style'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Style Modal ───────────────────────────────────────────────────── */}
      {editingStyle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditingStyle(null); }}
        >
          <div
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            style={{ animation: 'modalIn 0.2s ease-out' }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Edit Style</h3>
                <p className="text-xs text-slate-400 mt-0.5">Update the details for this haircut service</p>
              </div>
              <button
                onClick={() => setEditingStyle(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStyle} noValidate>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Style Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editName}
                    onChange={e => { setEditName(e.target.value); setEditErrors(validateForm(e.target.value, editBasePrice)); }}
                    className={inputCls(!!editErrors.name)}
                  >
                    <option value="" disabled>Select a style...</option>
                    <option value="Classic">Classic</option>
                    <option value="Normal">Normal</option>
                    <option value="BarberChoice">BarberChoice</option>
                    <option value="Artistic">Artistic</option>
                  </select>
                  {editErrors.name && <p className="text-red-500 text-xs mt-1">{editErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    className={inputCls()}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Price (₱) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editBasePrice}
                      onChange={e => { setEditBasePrice(e.target.value); setEditErrors(validateForm(editName, e.target.value)); }}
                      className={inputCls(!!editErrors.basePrice)}
                    />
                    {editErrors.basePrice && <p className="text-red-500 text-xs mt-1">{editErrors.basePrice}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Duration (min)</label>
                    <input
                      type="number"
                      min="1"
                      value={editDuration}
                      onChange={e => setEditDuration(e.target.value)}
                      className={inputCls()}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setEditingStyle(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#D2691E] hover:bg-[#8B4513] text-white font-semibold text-sm shadow-sm transition-colors disabled:opacity-60 flex items-center justify-center"
                >
                  {editSubmitting && <Spinner />}
                  {editSubmitting ? 'Saving…' : 'Update Style'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSS keyframes for modal animation */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)     scale(1); }
        }
      `}</style>
    </div>
  );
};

export default CatalogPanel;
