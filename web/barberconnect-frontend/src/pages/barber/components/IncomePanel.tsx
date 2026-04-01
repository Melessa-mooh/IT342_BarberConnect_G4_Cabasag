import React, { useState } from 'react';

const IncomePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('charts');
  
  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-10">
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Income Analytics</h2>
        <p className="text-slate-500 font-medium mt-1">Track your earnings and financial performance</p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Income */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-slate-500">Total Income (March)</h3>
            <span className="text-emerald-500 text-lg">＄</span>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 mb-1">₱24,500</h2>
            <p className="text-xs font-semibold text-slate-400">Shop total</p>
          </div>
        </div>

        {/* Your Share */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-slate-500">Your Share (80%)</h3>
            <span className="text-blue-500 text-lg">💰</span>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 mb-1">₱19,600</h2>
            <p className="text-xs font-semibold text-slate-400">Your earnings</p>
          </div>
        </div>

        {/* Total Appointments */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-slate-500">Total Appointments</h3>
            <span className="text-purple-500 text-lg">📅</span>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 mb-1">8</h2>
            <p className="text-xs font-semibold text-slate-400">This month</p>
          </div>
        </div>

        {/* Avg per Appointment */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-slate-500">Avg per Appointment</h3>
            <span className="text-orange-500 text-lg">📈</span>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 mb-1">₱3,063</h2>
            <p className="text-xs font-semibold text-slate-400">Average earning</p>
          </div>
        </div>
      </div>

      {/* Pill Navigation */}
      <div className="flex items-center bg-slate-100/50 p-1.5 rounded-full w-max border border-slate-200/60 shadow-sm mt-2">
        <button 
          onClick={() => setActiveTab('charts')}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
            activeTab === 'charts' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Charts
        </button>
        <button 
          onClick={() => setActiveTab('breakdown')}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
            activeTab === 'breakdown' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Appointment Breakdown
        </button>
      </div>

      {/* Main Chart Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 h-96 flex flex-col relative">
        <h3 className="text-lg font-bold text-slate-800 mb-8 pb-3 border-b border-slate-50">Monthly Income Trend</h3>
        
        {/* CSS Only Line Chart Mockup */}
        <div className="flex-1 relative flex items-end">
          
          {/* Y Axis Grid */}
          <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between ml-[40px]">
            <div className="border-t border-slate-200/50 border-dashed w-full h-0"></div>
            <div className="border-t border-slate-200/50 border-dashed w-full h-0"></div>
            <div className="border-t border-slate-200/50 border-dashed w-full h-0"></div>
            <div className="border-t border-slate-200/50 border-dashed w-full h-0"></div>
            <div className="border-t border-slate-300 w-full h-0 relative -bottom-[1px]"></div>
          </div>
          
          {/* Y Axis Labels */}
          <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-[10px] font-bold text-slate-400 -mt-2">
            <span>26000┐</span>
            <span>19500┤</span>
            <span>13000┤</span>
            <span>6500┤</span>
            <span>0┘</span>
          </div>
          
          {/* Mocked SVG Line Chart */}
          <div className="absolute inset-0 ml-[40px] z-10">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 200">
              {/* Trend Line */}
              <path 
                d="M0,130 C100,100 150,90 240,110 C330,130 380,80 480,50 C580,20 600,40 600,40" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="2.5" 
                vectorEffect="non-scaling-stroke"
              />
              
              {/* Plot Points */}
              <circle cx="0" cy="130" r="4" fill="white" stroke="#10b981" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              <circle cx="150" cy="95" r="4" fill="white" stroke="#10b981" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              <circle cx="280" cy="115" r="4" fill="white" stroke="#10b981" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              <circle cx="410" cy="65" r="4" fill="white" stroke="#10b981" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              <circle cx="530" cy="20" r="4" fill="white" stroke="#3b82f6" strokeWidth="2" vectorEffect="non-scaling-stroke" className="animate-pulse shadow-xl" />
              <circle cx="600" cy="40" r="4" fill="white" stroke="#10b981" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              
              {/* Drop down line for Hover State on Feb */}
              <line x1="530" y1="20" x2="530" y2="200" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
            </svg>
            
            {/* Hover Tooltip (Mocked statically to match screenshot) */}
            <div className="absolute bg-white border border-slate-200 shadow-xl rounded-lg p-3 z-20 pointer-events-none" style={{ left: '80%', top: '25%', transform: 'translateX(-50%)' }}>
              <h4 className="font-bold text-slate-700 text-xs mb-1">Feb</h4>
              <p className="text-[10px] font-bold text-blue-500 mb-0.5">Total Income : 25600</p>
              <p className="text-[10px] font-bold text-emerald-500">Your Share (80%) : 20480</p>
            </div>
            
          </div>
          
        </div>

        {/* X Axis Grid Labels */}
        <div className="mt-3 ml-[40px] flex justify-between px-2 text-[10px] font-bold text-slate-400">
          <span>Oct</span>
          <span className="ml-4">Nov</span>
          <span className="ml-4">Dec</span>
          <span className="mr-8">Jan</span>
          <span className="mr-12 text-slate-800">Feb</span>
          <span>Mar</span>
        </div>

      </div>

    </div>
  );
};

export default IncomePanel;
