import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import OverviewPanel from './components/OverviewPanel';
import SchedulePanel from './components/SchedulePanel';
import CatalogPanel from './components/CatalogPanel';
import IncomePanel from './components/IncomePanel';
import FeedPanel from './components/FeedPanel';
import FeedbackPanel from './components/FeedbackPanel';
import ProfilePanel from './components/ProfilePanel';

const BarberDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const isProfileIncomplete = () => {
    return !user?.phoneNumber || user.phoneNumber.trim() === '' ||
           !user?.barberProfile?.bio || user.barberProfile.bio.trim() === '' ||
           !user?.barberProfile?.yearsExperience || user.barberProfile.yearsExperience === 0;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewPanel setActiveTab={setActiveTab} />;
      case 'schedule': return <SchedulePanel />;
      case 'catalog': return <CatalogPanel />;
      case 'feed': return <FeedPanel />;
      case 'income': return <IncomePanel />;
      case 'ratings': return <FeedbackPanel />;
      case 'profile': return <ProfilePanel />;
      default: return <OverviewPanel setActiveTab={setActiveTab} />;
    }
  };

  // Helper for tab styling matching exact Figma metrics (W:207px, H:48px, Gap:8px, centered inside 256px sidebar)
  const getTabClass = (tabId: string) => {
    const isActive = activeTab === tabId;
    return `flex items-center gap-3 w-[207px] h-[48px] ml-6 px-4 text-sm font-semibold transition-all duration-200 rounded-xl ${
      isActive 
        ? 'bg-[#0f172a] text-white shadow-sm' 
        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 bg-transparent'
    }`;
  };

  return (
    <div className="min-h-screen w-full bg-[#f1f5f9] flex items-center justify-center p-4 lg:p-8 font-sans">
      
      {/* 🟢 FLOATING APP CONTAINER (Matching Figma 'Web UI' spacing) */}
      <div className="flex w-full max-w-[1500px] h-[92vh] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-slate-200">
        
        {/* 🟢 SIDEBAR (Exact 256px sizing matching Figma) */}
        <aside className="w-[260px] bg-white border-r border-slate-100 flex flex-col h-full flex-shrink-0 z-20">
          
          {/* Logo Region */}
          <div className="px-8 pt-10 pb-8">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none mb-1.5">Barber Dashboard</h1>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">Manage your business</p>
          </div>

          {/* Navigation Tabs (Gap 8 = space-y-2, width 207) */}
          <nav className="flex-1 flex flex-col gap-2 overflow-y-auto">
            
            <button onClick={() => setActiveTab('overview')} className={getTabClass('overview')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px] flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              <span>Overview</span>
            </button>
            
            <button onClick={() => setActiveTab('schedule')} className={getTabClass('schedule')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px] flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span>Schedule</span>
            </button>
            
            <button onClick={() => setActiveTab('catalog')} className={getTabClass('catalog')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px] flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.348 14.849a1.2 1.2 0 01-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 11-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 111.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 111.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 010 1.698z" />
              </svg>
              <span>Haircut Catalog</span>
            </button>
            
            <button onClick={() => setActiveTab('feed')} className={getTabClass('feed')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px] flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span>Social Feed</span>
            </button>
            
            <button onClick={() => setActiveTab('income')} className={getTabClass('income')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px] flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Income Analytics</span>
            </button>
            
            <button onClick={() => setActiveTab('ratings')} className={getTabClass('ratings')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px] flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              <span>Ratings</span>
            </button>
            
            <div className="mt-8 pt-6"></div>
            
            <button onClick={() => setActiveTab('profile')} className={getTabClass('profile')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px] flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span>Profile</span>
            </button>
            
          </nav>

          {/* Bottom User Profile & Logout */}
          <div className="p-6 border-t border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                {user?.firstName?.charAt(0) || 'B'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-slate-800 truncate">{user?.firstName || 'Barber'}</p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate mt-0.5">Pro Account</p>
              </div>
              <button 
                onClick={handleLogout} 
                className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-slate-50"
                title="Log out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* 🟢 MAIN CONTENT AREA (Scrollable perfectly inside floating container) */}
        <main className="flex-1 h-full overflow-y-auto relative bg-[#f8fafc]">
          <div className="py-10 px-10 xl:px-14 min-h-full pb-20">
            
            {/* Global Incomplete Profile Alert */}
            {isProfileIncomplete() && activeTab !== 'profile' && (
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl shadow-sm mb-10 flex items-start gap-4 mx-1">
                <span className="text-amber-500 text-2xl pt-0.5">⚠️</span>
                <div>
                  <h3 className="text-sm font-bold text-amber-900">Complete Your Barber Profile</h3>
                  <p className="mt-1 text-[13px] text-amber-700">Add your phone number, bio, and experience to activate your catalog and attract customers.</p>
                  <button 
                    onClick={() => setActiveTab('profile')} 
                    className="mt-3 bg-amber-900 hover:bg-amber-800 text-white px-5 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
                  >
                    Go to Profile settings →
                  </button>
                </div>
              </div>
            )}

            <div className="mx-1">
              {renderContent()}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default BarberDashboard;