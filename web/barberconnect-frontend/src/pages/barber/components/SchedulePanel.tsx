import React, { useState } from 'react';

const SchedulePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('calendar');

  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const dates = Array.from({ length: 30 }, (_, i) => i + 1); // Mock 30 days

  // Dummy calendar highlights
  const getDayClass = (day: number) => {
    if (day === 1) return 'bg-[#1a1a1a] text-white shadow-md'; // Selected
    if (day === 6) return 'bg-[#fef08a] text-slate-800'; // Leave
    return 'text-slate-600 hover:bg-slate-100'; // Default
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-10">
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Schedule Management</h2>
        <p className="text-slate-500 font-medium mt-1">Manage your availability and appointments</p>
      </div>

      {/* Pill Navigation */}
      <div className="flex items-center bg-slate-100/50 p-1.5 rounded-full w-max border border-slate-200/60 shadow-sm">
        <button 
          onClick={() => setActiveTab('calendar')}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
            activeTab === 'calendar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Calendar View
        </button>
        <button 
          onClick={() => setActiveTab('appointments')}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
            activeTab === 'appointments' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Booked Appointments
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
            activeTab === 'settings' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Settings
        </button>
      </div>

      {/* Main Grid: Left Column (Calendar) + Right Column (Time Slots) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Calendar Picker */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col h-full">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Select Date</h3>
          
          {/* Calendar Widget */}
          <div className="border border-slate-100 rounded-2xl p-6 shadow-sm mb-8 flex-1">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <button className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50">‹</button>
              <h4 className="font-bold text-sm text-slate-800 tracking-wide">April 2026</h4>
              <button className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50">›</button>
            </div>
            
            {/* Days row */}
            <div className="grid grid-cols-7 mb-4">
              {days.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-slate-400">{d}</div>
              ))}
            </div>
            
            {/* Dates Grid */}
            <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center text-sm font-bold">
              {/* Empty padding for April 1st starting offset */}
              <div className="text-slate-300">29</div>
              <div className="text-slate-300">30</div>
              <div className="text-slate-300">31</div>
              {/* Actual days */}
              {dates.map(day => (
                <div key={day} className="flex justify-center items-center">
                  <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${getDayClass(day)}`}>
                    {day}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-3 mt-auto">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-semibold text-slate-600 tracking-wide">FREE slots</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-xs font-semibold text-slate-600 tracking-wide">BOOKED slots</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-[#fef08a]"></div>
              <span className="text-xs font-semibold text-slate-600 tracking-wide">LEAVE days</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Time Slots */}
        <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h3 className="text-lg font-bold text-slate-800 mb-8 pb-3 border-b border-slate-50">Time Slots - April 01, 2026</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 09:00 - FREE */}
            <div className="border border-emerald-400 rounded-xl p-5 flex justify-between items-start transition-shadow hover:shadow-md cursor-pointer bg-emerald-50/10">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">🕒</span>
                <span className="font-extrabold text-slate-800 tracking-tight">09:00</span>
              </div>
              <span className="bg-slate-900 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">FREE</span>
            </div>

            {/* 10:00 - BOOKED */}
            <div className="border border-red-300 rounded-xl p-5 flex justify-between items-start transition-shadow hover:shadow-md cursor-pointer bg-red-50/30">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-slate-400">🕒</span>
                  <span className="font-extrabold text-slate-800 tracking-tight">10:00</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm ml-6">John Smith</h4>
                <p className="text-xs font-semibold text-slate-500 ml-6">Classic Fade</p>
              </div>
              <span className="bg-[#e11d48] text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">BOOKED</span>
            </div>

            {/* 11:00 - FREE */}
            <div className="border border-emerald-400 rounded-xl p-5 flex justify-between items-start transition-shadow hover:shadow-md cursor-pointer bg-emerald-50/10">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">🕒</span>
                <span className="font-extrabold text-slate-800 tracking-tight">11:00</span>
              </div>
              <span className="bg-slate-900 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">FREE</span>
            </div>

            {/* 12:00 - FREE */}
            <div className="border border-emerald-400 rounded-xl p-5 flex justify-between items-start transition-shadow hover:shadow-md cursor-pointer bg-emerald-50/10">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">🕒</span>
                <span className="font-extrabold text-slate-800 tracking-tight">12:00</span>
              </div>
              <span className="bg-slate-900 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">FREE</span>
            </div>

            {/* 13:00 - FREE */}
            <div className="border border-emerald-400 rounded-xl p-5 flex justify-between items-start transition-shadow hover:shadow-md cursor-pointer bg-emerald-50/10">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">🕒</span>
                <span className="font-extrabold text-slate-800 tracking-tight">13:00</span>
              </div>
              <span className="bg-slate-900 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">FREE</span>
            </div>

            {/* 14:00 - BOOKED */}
            <div className="border border-red-300 rounded-xl p-5 flex justify-between items-start transition-shadow hover:shadow-md cursor-pointer bg-red-50/30">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-slate-400">🕒</span>
                  <span className="font-extrabold text-slate-800 tracking-tight">14:00</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm ml-6">Mike Johnson</h4>
                <p className="text-xs font-semibold text-slate-500 ml-6">Beard Trim</p>
              </div>
              <span className="bg-[#e11d48] text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">BOOKED</span>
            </div>

            {/* 15:00 - FREE */}
            <div className="border border-emerald-400 rounded-xl p-5 flex justify-between items-start transition-shadow hover:shadow-md cursor-pointer bg-emerald-50/10">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">🕒</span>
                <span className="font-extrabold text-slate-800 tracking-tight">15:00</span>
              </div>
              <span className="bg-slate-900 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">FREE</span>
            </div>

            {/* 16:00 - FREE */}
            <div className="border border-emerald-400 rounded-xl p-5 flex justify-between items-start transition-shadow hover:shadow-md cursor-pointer bg-emerald-50/10">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">🕒</span>
                <span className="font-extrabold text-slate-800 tracking-tight">16:00</span>
              </div>
              <span className="bg-slate-900 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">FREE</span>
            </div>

            {/* 17:00 - FREE */}
            <div className="border border-emerald-400 rounded-xl p-5 flex justify-between items-start transition-shadow hover:shadow-md cursor-pointer bg-emerald-50/10">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">🕒</span>
                <span className="font-extrabold text-slate-800 tracking-tight">17:00</span>
              </div>
              <span className="bg-slate-900 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">FREE</span>
            </div>

            {/* 18:00 - FREE */}
            <div className="border border-emerald-400 rounded-xl p-5 flex justify-between items-start transition-shadow hover:shadow-md cursor-pointer bg-emerald-50/10">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">🕒</span>
                <span className="font-extrabold text-slate-800 tracking-tight">18:00</span>
              </div>
              <span className="bg-slate-900 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">FREE</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default SchedulePanel;
