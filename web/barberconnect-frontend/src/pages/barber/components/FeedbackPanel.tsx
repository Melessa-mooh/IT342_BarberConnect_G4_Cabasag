import React from 'react';

const FeedbackPanel: React.FC = () => {
  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-10">

      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Ratings & Feedback</h2>
        <p className="text-slate-500 font-medium mt-1">See what your customers are saying</p>
      </div>

      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Average Rating (Span 4) */}
        <div className="md:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col justify-center transition-shadow hover:shadow-md">
          <h3 className="text-sm font-bold text-slate-800 mb-6 border-b border-slate-50 pb-2">Average Rating</h3>

          <div className="flex flex-col items-center">
            <h2 className="text-6xl font-black text-slate-900 tracking-tighter mb-2">4.8</h2>
            <div className="flex text-amber-400 text-xl tracking-widest drop-shadow-sm mb-2">★★★★★</div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Based on 87 reviews</p>
          </div>
        </div>

        {/* Rating Distribution (Span 8) */}
        <div className="md:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col transition-shadow hover:shadow-md">
          <h3 className="text-sm font-bold text-slate-800 mb-6 border-b border-slate-50 pb-2">Rating Distribution</h3>

          <div className="flex flex-col gap-3">
            {/* 5 Star */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-600 w-8 flex justify-between">5 <span className="text-amber-400">★</span></span>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div className="h-full bg-slate-900 rounded-full" style={{ width: '83%' }}></div>
              </div>
              <span className="text-xs font-semibold text-slate-500 w-14 text-right">72 (83%)</span>
            </div>

            {/* 4 Star */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-600 w-8 flex justify-between">4 <span className="text-amber-400">★</span></span>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div className="h-full bg-slate-900 rounded-full" style={{ width: '14%' }}></div>
              </div>
              <span className="text-xs font-semibold text-slate-500 w-14 text-right">12 (14%)</span>
            </div>

            {/* 3 Star */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-600 w-8 flex justify-between">3 <span className="text-amber-400">★</span></span>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div className="h-full bg-slate-900 rounded-full" style={{ width: '2%' }}></div>
              </div>
              <span className="text-xs font-semibold text-slate-500 w-14 text-right">2 (2%)</span>
            </div>

            {/* 2 Star */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-600 w-8 flex justify-between">2 <span className="text-amber-400">★</span></span>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div className="h-full bg-slate-900 rounded-full" style={{ width: '1%' }}></div>
              </div>
              <span className="text-xs font-semibold text-slate-500 w-14 text-right">1 (1%)</span>
            </div>

            {/* 1 Star */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-600 w-8 flex justify-between">1 <span className="text-amber-400">★</span></span>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div className="h-full bg-slate-900 rounded-full" style={{ width: '0%' }}></div>
              </div>
              <span className="text-xs font-semibold text-slate-500 w-14 text-right">0 (0%)</span>
            </div>
          </div>
        </div>

      </div>

      {/* Customer Reviews List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <h3 className="text-sm font-bold text-slate-800 mb-8 border-b border-slate-50 pb-2">Customer Reviews</h3>

        <div className="flex flex-col gap-8">

          {/* Review 1 */}
          <div className="flex gap-5 border-b border-slate-50 pb-8 last:border-0 last:pb-0">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex flex-shrink-0 items-center justify-center text-slate-600 font-bold text-sm">
              JS
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">John Smith</h4>
                  <p className="text-xs font-semibold text-slate-400">about 2 hours ago</p>
                </div>
                <span className="px-3 py-1 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg tracking-wide bg-slate-50">
                  Classic Fade
                </span>
              </div>

              <div className="flex text-amber-400 text-sm tracking-widest mt-2 mb-3">★★★★★</div>

              <p className="text-sm font-medium text-slate-700 leading-relaxed italic border-l-2 border-slate-200 pl-3">
                "Excellent service! Very professional and the fade came out perfect. Will definitely come back!"
              </p>
            </div>
          </div>

          {/* Review 2 */}
          <div className="flex gap-5 border-b border-slate-50 pb-8 last:border-0 last:pb-0">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex flex-shrink-0 items-center justify-center text-slate-600 font-bold text-sm">
              MJ
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Mike Johnson</h4>
                  <p className="text-xs font-semibold text-slate-400">about 5 hours ago</p>
                </div>
                <span className="px-3 py-1 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg tracking-wide bg-slate-50">
                  Beard Trim
                </span>
              </div>

              <div className="flex text-amber-400 text-sm tracking-widest mt-2 mb-3">★★★★★</div>

              <p className="text-sm font-medium text-slate-700 leading-relaxed italic border-l-2 border-slate-200 pl-3">
                "Best barber in town! Always knows exactly what I want. Highly recommend!"
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default FeedbackPanel;
