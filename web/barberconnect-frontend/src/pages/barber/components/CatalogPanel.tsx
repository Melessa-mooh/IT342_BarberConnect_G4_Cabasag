import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { haircutStyleService, type HaircutStyle } from '../../../services/haircutStyleService';

const CatalogPanel: React.FC = () => {
  const { user } = useAuth();
  const barberProfileId = user?.barberProfile?.id?.toString() ?? '';
  const [styles, setStyles] = useState<HaircutStyle[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newBasePrice, setNewBasePrice] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FIX: Add edit state
  const [editingStyle, setEditingStyle] = useState<HaircutStyle | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBasePrice, setEditBasePrice] = useState('');
  const [editDuration, setEditDuration] = useState('');

  const handleCreateStyle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberProfileId || !newName || !newBasePrice) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      // FIX: Add console.log before append to verify barberProfileId
      console.log('barberProfileId before append:', barberProfileId);
      formData.append('barberProfileId', barberProfileId);
      formData.append('name', newName);
      formData.append('description', newDescription);
      formData.append('basePrice', newBasePrice);
      if (newDuration) formData.append('durationMinutes', newDuration);
      if (newImageFile) formData.append('file', newImageFile);
      
      await haircutStyleService.createHaircutStyle(formData);
      
      // FIX: Refetch fresh server data instead of just pushing response
      const freshStyles = await haircutStyleService.getHaircutStylesForBarber(barberProfileId);
      setStyles(freshStyles);
      
      setIsAddModalOpen(false);
      setNewName('');
      setNewDescription('');
      setNewBasePrice('');
      setNewDuration('');
      setNewImageFile(null);
    } catch (err) {
      console.error('Failed to create style', err);
      alert('Failed to create style. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // FIX: Add update handler
  const handleUpdateStyle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStyle || !editName || !editBasePrice) return;
    
    setIsSubmitting(true);
    try {
      await haircutStyleService.updateHaircutStyle(editingStyle.haircut_style_id, {
        name: editName,
        description: editDescription,
        basePrice: parseFloat(editBasePrice),
        durationMinutes: editDuration ? parseInt(editDuration, 10) : undefined
      });
      
      const freshStyles = await haircutStyleService.getHaircutStylesForBarber(barberProfileId);
      setStyles(freshStyles);
      
      setEditingStyle(null);
    } catch (err) {
      console.error('Failed to update style', err);
      alert('Failed to update style. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!barberProfileId) return;
    const fetchStyles = async () => {
      try {
        const data = await haircutStyleService.getHaircutStylesForBarber(barberProfileId);
        setStyles(data);
      } catch (err) {
        console.error('Failed to fetch styles', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStyles();
  }, [barberProfileId]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Haircut Catalog</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your services and set your prices</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#D2691E] hover:bg-[#8B4513] text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all"
        >
          + Add New Style
        </button>
      </div>

      {/* Catalog Grid - Clean cards matching UI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-block w-10 h-10 border-4 border-slate-200 border-t-[#D2691E] rounded-full animate-spin mb-3"></div>
            <p className="text-slate-500 text-sm">Loading...</p>
          </div>
        ) : styles.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <p className="text-slate-600 text-base mb-2">No haircut styles yet</p>
            <p className="text-slate-500 text-sm">Click "Add New Style" to create your first one</p>
          </div>
        ) : styles.map((style) => (
          <div key={style.haircut_style_id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all">
            {/* Image */}
            <div className="h-48 bg-slate-200 overflow-hidden relative">
              <img 
                src={style.imageUrl || "https://images.unsplash.com/photo-1599351431202-1e0f01ce346f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"} 
                alt={style.name} 
                className="w-full h-full object-cover"
              />
              {/* Cloudinary badge overlay */}
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 shadow-sm">
                @Cloudinary
              </div>
              {/* Active badge */}
              {style.isActive && (
                <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                  Active
                </div>
              )}
            </div>
            {/* Content */}
            <div className="p-5">
              <h3 className="text-lg font-bold text-slate-800 mb-2">{style.name}</h3>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">{style.description}</p>
              
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#D2691E] font-bold text-lg">₱{style.basePrice}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold">{style.durationMinutes}min</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    // FIX: Wire edit button
                    setEditingStyle(style);
                    setEditName(style.name);
                    setEditDescription(style.description || '');
                    setEditBasePrice(String(style.basePrice));
                    setEditDuration(String(style.durationMinutes ?? ''));
                  }}
                  className="flex-1 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Edit
                </button>
                <button 
                  onClick={async () => {
                    // FIX: Wire delete button
                    if (!confirm('Delete this style?')) return;
                    try {
                      await haircutStyleService.deleteHaircutStyle(style.haircut_style_id);
                      setStyles(prev => prev.filter(s => s.haircut_style_id !== style.haircut_style_id));
                    } catch (err) {
                      alert('Failed to delete style');
                    }
                  }}
                  className="w-11 h-11 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-all shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Style Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Add New Style</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateStyle} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Style Name *</label>
                <input 
                  type="text" 
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50"
                  placeholder="e.g. Classic Fade"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea 
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50"
                  placeholder="Brief description of the style"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Price (₱) *</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    value={newBasePrice}
                    onChange={e => setNewBasePrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50"
                    placeholder="250.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Duration (min)</label>
                  <input 
                    type="number" 
                    min="1"
                    value={newDuration}
                    onChange={e => setNewDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50"
                    placeholder="30"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Image Reference</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => setNewImageFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#D2691E]/10 file:text-[#D2691E] hover:file:bg-[#D2691E]/20"
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-lg bg-[#D2691E] hover:bg-[#8B4513] text-white font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Style'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Style Modal */}
      {/* FIX: Add Edit Modal */}
      {editingStyle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Edit Style</h3>
              <button 
                onClick={() => setEditingStyle(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateStyle} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Style Name *</label>
                <input 
                  type="text" 
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea 
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Price (₱) *</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    value={editBasePrice}
                    onChange={e => setEditBasePrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Duration (min)</label>
                  <input 
                    type="number" 
                    min="1"
                    value={editDuration}
                    onChange={e => setEditDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setEditingStyle(null)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-lg bg-[#D2691E] hover:bg-[#8B4513] text-white font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Update Style'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogPanel;
