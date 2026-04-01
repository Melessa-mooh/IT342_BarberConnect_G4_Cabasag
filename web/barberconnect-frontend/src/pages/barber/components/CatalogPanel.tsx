import React from 'react';

const CatalogPanel: React.FC = () => {
  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-10">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Haircut Catalog</h2>
          <p className="text-slate-500 font-medium mt-1">Manage your haircut styles and pricing</p>
        </div>
        <button className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition flex items-center gap-2">
          <span>➕</span> Add Haircut
        </button>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Card 1 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-shadow flex flex-col h-full">
          {/* Image */}
          <div className="h-48 bg-slate-200 overflow-hidden relative">
            <img 
              src="https://images.unsplash.com/photo-1599351431202-1e0f01ce346f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
              alt="Classic Fade" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          {/* Content */}
          <div className="p-6 flex flex-col flex-1">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Classic Fade</h3>
            <p className="text-sm text-slate-500 font-medium mb-4 flex-1">A timeless fade with clean lines and precision cuts</p>
            
            <div className="flex items-center gap-4 mb-3">
              <span className="font-extrabold text-slate-800 tracking-tight flex items-center gap-1">
                <span className="text-slate-400 text-sm font-normal">$</span> ₱250
              </span>
              <span className="text-slate-400 font-bold flex items-center gap-1 text-sm">
                <span className="text-sm">🕒</span> 30 min
              </span>
            </div>
            
            <p className="text-xs text-slate-400 font-semibold mb-5">3 style options available</p>
            
            {/* Actions */}
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition">
                View Details
              </button>
              <button className="w-10 h-[38px] bg-[#e11d48] hover:bg-[#be123c] text-white rounded-lg flex items-center justify-center transition shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-shadow flex flex-col h-full">
          {/* Image */}
          <div className="h-48 bg-slate-200 overflow-hidden relative">
            <img 
              src="https://images.unsplash.com/photo-1593702288056-ba4cb56230f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
              alt="Beard Trim & Shape" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          {/* Content */}
          <div className="p-6 flex flex-col flex-1">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Beard Trim & Shape</h3>
            <p className="text-sm text-slate-500 font-medium mb-4 flex-1">Professional beard grooming and shaping service</p>
            
            <div className="flex items-center gap-4 mb-3">
              <span className="font-extrabold text-slate-800 tracking-tight flex items-center gap-1">
                <span className="text-slate-400 text-sm font-normal">$</span> ₱150
              </span>
              <span className="text-slate-400 font-bold flex items-center gap-1 text-sm">
                <span className="text-sm">🕒</span> 20 min
              </span>
            </div>
            
            <p className="text-xs text-slate-400 font-semibold mb-5">2 style options available</p>
            
            {/* Actions */}
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition">
                View Details
              </button>
              <button className="w-10 h-[38px] bg-[#e11d48] hover:bg-[#be123c] text-white rounded-lg flex items-center justify-center transition shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-shadow flex flex-col h-full">
          {/* Image */}
          <div className="h-48 bg-slate-200 overflow-hidden relative">
            <img 
              src="https://images.unsplash.com/photo-1549480119-94d0dc3d40cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
              alt="Modern Undercut" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          {/* Content */}
          <div className="p-6 flex flex-col flex-1">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Modern Undercut</h3>
            <p className="text-sm text-slate-500 font-medium mb-4 flex-1">Stylish undercut with textured top</p>
            
            <div className="flex items-center gap-4 mb-3">
              <span className="font-extrabold text-slate-800 tracking-tight flex items-center gap-1">
                <span className="text-slate-400 text-sm font-normal">$</span> ₱300
              </span>
              <span className="text-slate-400 font-bold flex items-center gap-1 text-sm">
                <span className="text-sm">🕒</span> 40 min
              </span>
            </div>
            
            <p className="text-xs text-slate-400 font-semibold mb-5">2 style options available</p>
            
            {/* Actions */}
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition">
                View Details
              </button>
              <button className="w-10 h-[38px] bg-[#e11d48] hover:bg-[#be123c] text-white rounded-lg flex items-center justify-center transition shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CatalogPanel;
