import React from 'react';

const FeedPanel: React.FC = () => {
  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-10">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Social Feed</h2>
          <p className="text-slate-500 font-medium mt-1">Share your work and engage with customers</p>
        </div>
        <button className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition flex items-center gap-2">
          <span>➕</span> Create Post
        </button>
      </div>

      {/* Feed Content */}
      <div className="flex flex-col items-center mt-4">
        
        {/* Post Card */}
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          
          {/* Post Header */}
          <div className="flex items-center gap-4 p-5">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex flex-shrink-0 items-center justify-center text-slate-600 font-bold text-sm tracking-widest">
              BB
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Barber Dashboard</h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">about 3 hours ago</p>
            </div>
          </div>
          
          {/* Post Image */}
          <div className="w-full aspect-[4/5] bg-slate-900 overflow-hidden relative">
            <img 
              src="https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Fresh Fade" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Post Actions (Assuming typical feed actions based on implicit UX) */}
          <div className="p-5 flex items-center gap-4 border-t border-slate-50">
            <button className="flex items-center gap-2 text-slate-500 hover:text-[#D2691E] transition">
              <span className="text-xl">❤️</span>
              <span className="text-sm font-bold">124</span>
            </button>
            <button className="flex items-center gap-2 text-slate-500 hover:text-[#8B4513] transition">
              <span className="text-xl">💬</span>
              <span className="text-sm font-bold">12</span>
            </button>
          </div>

          {/* Post Caption */}
          <div className="px-5 pb-6">
            <p className="text-sm text-slate-700 font-medium">
              <span className="font-bold text-slate-900 mr-2">Barber Dashboard</span>
              Clean fade for the weekend. Book your slot now! #barberlife #fade
            </p>
            <button className="text-xs text-slate-400 font-bold mt-2 hover:text-slate-600">View all 12 comments</button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default FeedPanel;
