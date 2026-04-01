import React from 'react';

interface OverviewPanelProps {
  setActiveTab?: (tab: string) => void;
}

const OverviewPanel: React.FC<OverviewPanelProps> = () => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full pb-10">
      
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-[28px] font-bold text-slate-900 tracking-tight">Overview</h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">Welcome back! Here's your business summary.</p>
      </div>

      {/* Overview Cards Row (4 Columns exactly as Figma) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Income */}
        <div className="bg-white rounded-[20px] border border-slate-100 p-6 flex flex-col justify-between hover:border-slate-200 transition-colors">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-sm font-semibold text-slate-500">Total Income</h3>
            <span className="text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div>
            <h2 className="text-[26px] font-bold text-slate-900 tracking-tight leading-none mb-1.5">₱24,500</h2>
            <p className="text-[11px] text-slate-400 font-medium">80% share this month</p>
          </div>
        </div>

        {/* Total Appointments */}
        <div className="bg-white rounded-[20px] border border-slate-100 p-6 flex flex-col justify-between hover:border-slate-200 transition-colors">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-sm font-semibold text-slate-500">Total Appointments</h3>
            <span className="text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </span>
          </div>
          <div>
            <h2 className="text-[26px] font-bold text-slate-900 tracking-tight leading-none mb-1.5">142</h2>
            <p className="text-[11px] text-slate-400 font-medium">This month</p>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white rounded-[20px] border border-slate-100 p-6 flex flex-col justify-between hover:border-slate-200 transition-colors">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-sm font-semibold text-slate-500">Average Rating</h3>
            <span className="text-orange-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </span>
          </div>
          <div>
            <h2 className="text-[26px] font-bold text-slate-900 tracking-tight leading-none mb-1.5">4.8</h2>
            <p className="text-[11px] text-slate-400 font-medium">Based on 87 reviews</p>
          </div>
        </div>

        {/* Leave Days Used */}
        <div className="bg-white rounded-[20px] border border-slate-100 p-6 flex flex-col justify-between hover:border-slate-200 transition-colors">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-sm font-semibold text-slate-500">Leave Days Used</h3>
            <span className="text-purple-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px]">
                <path d="M4.5 10V6A2.25 2.25 0 016.75 3.75h10.5A2.25 2.25 0 0119.5 6v4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3.75 20.25h16.5M10.5 20.25v-3.75h3v3.75M8.25 6h7.5M8.25 9.75h7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
          <div>
            <h2 className="text-[26px] font-bold text-slate-900 tracking-tight leading-none mb-1.5">3</h2>
            <p className="text-[11px] text-slate-400 font-medium">Out of 12 days</p>
          </div>
        </div>
      </div>

      {/* Main Bottom Section (Responsive Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
        
        {/* Recent Appointments */}
        <div className="bg-white rounded-[20px] border border-slate-100 p-7 h-full">
          <h3 className="text-[15px] font-semibold text-slate-900 mb-6">Recent Appointments</h3>
          
          <div className="flex flex-col gap-5">
            
            {/* List Item 1 */}
            <div className="flex items-center justify-between border-b border-slate-50 pb-5">
              <div>
                <h4 className="text-[13px] font-bold text-slate-900 mb-0.5">John Smith</h4>
                <p className="text-xs text-slate-500 font-medium mb-0.5">Classic Fade</p>
                <p className="text-[11px] text-slate-400">Today, 2:00 PM</p>
              </div>
              <span className="bg-[#dcfce7] text-[#16a34a] px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                confirmed
              </span>
            </div>
            
            {/* List Item 2 */}
            <div className="flex items-center justify-between border-b border-slate-50 pb-5">
              <div>
                <h4 className="text-[13px] font-bold text-slate-900 mb-0.5">Mike Johnson</h4>
                <p className="text-xs text-slate-500 font-medium mb-0.5">Beard Trim</p>
                <p className="text-[11px] text-slate-400">Today, 3:30 PM</p>
              </div>
              <span className="bg-[#dcfce7] text-[#16a34a] px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                confirmed
              </span>
            </div>

            {/* List Item 3 */}
            <div className="flex items-center justify-between border-b border-slate-50 pb-5">
              <div>
                <h4 className="text-[13px] font-bold text-slate-900 mb-0.5">David Lee</h4>
                <p className="text-xs text-slate-500 font-medium mb-0.5">Premium Cut</p>
                <p className="text-[11px] text-slate-400">Tomorrow, 10:00 AM</p>
              </div>
              <span className="bg-[#fef3c7] text-[#d97706] px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                pending
              </span>
            </div>

            {/* List Item 4 */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-bold text-slate-900 mb-0.5">Robert Chen</h4>
                <p className="text-xs text-slate-500 font-medium mb-0.5">Classic Fade + Beard</p>
                <p className="text-[11px] text-slate-400">Tomorrow, 1:00 PM</p>
              </div>
              <span className="bg-[#dcfce7] text-[#16a34a] px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                confirmed
              </span>
            </div>

          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-[20px] border border-slate-100 p-7 h-full flex flex-col">
          <h3 className="text-[15px] font-semibold text-slate-900 mb-6">Quick Stats</h3>
          
          <div className="flex flex-col flex-1">
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-50">
              <span className="text-xs font-medium text-slate-500">Today's Appointments</span>
              <span className="text-[13px] font-bold text-slate-900">8</span>
            </div>
            
            <div className="flex justify-between items-center py-4 border-b border-slate-50">
              <span className="text-xs font-medium text-slate-500">Pending Bookings</span>
              <span className="text-[13px] font-bold text-slate-900">3</span>
            </div>
            
            <div className="flex justify-between items-center py-4 border-b border-slate-50">
              <span className="text-xs font-medium text-slate-500">Today's Income</span>
              <span className="text-[13px] font-bold text-slate-900">₱1,840</span>
            </div>
            
            <div className="flex justify-between items-center py-4 border-b border-slate-50">
              <span className="text-xs font-medium text-slate-500">This Week</span>
              <span className="text-[13px] font-bold text-slate-900">₱6,240</span>
            </div>
            
            <div className="flex justify-between items-center py-4 w-full text-xs">
              <span className="font-medium text-slate-500">Active Haircut Styles</span>
              <span className="text-[13px] font-bold text-slate-900">12</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default OverviewPanel;
