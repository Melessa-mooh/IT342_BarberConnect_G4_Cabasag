import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { haircutStyleService, type HaircutStyle } from '../../../services/haircutStyleService';

const CatalogPanel: React.FC = () => {
  const { user } = useAuth();
  const barberProfileId = user?.barberProfile?.id?.toString() ?? '';
  const [styles, setStyles] = useState<HaircutStyle[]>([]);
  const [loading, setLoading] = useState(true);

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
        <button className="bg-[#D2691E] hover:bg-[#8B4513] text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all">
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
                <button className="flex-1 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
                  Edit
                </button>
                <button className="w-11 h-11 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-all shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CatalogPanel;
