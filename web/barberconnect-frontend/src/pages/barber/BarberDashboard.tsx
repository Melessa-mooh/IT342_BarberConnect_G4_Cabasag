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

  // Helper for tab styling - consistent button sizing with brown theme
  const getTabClass = (tabId: string) => {
    const isActive = activeTab === tabId;
    return `flex items-center gap-3 w-full h-12 px-4 text-sm font-semibold transition-all duration-200 rounded-xl ${
      isActive 
        ? 'bg-gradient-to-r from-[#D2691E] to-[#CD853F] text-white shadow-lg shadow-[#D2691E]/20' 
        : 'text-[#F4E4BC] hover:text-white hover:bg-[#A0522D]/50'
    }`;
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-[#F4E4BC] via-[#D2B48C] to-[#DEB887] flex font-sans overflow-hidden">
      
      {/* 🟢 FULL WINDOW CONTAINER */}
      <div className="flex w-full h-full bg-white overflow-hidden">
        
        {/* 🟢 SIDEBAR (Brown Theme) */}
        <aside className="w-[260px] bg-gradient-to-b from-[#8B4513] via-[#A0522D] to-[#8B4513] border-r border-[#D2691E]/30 flex flex-col h-full flex-shrink-0 z-20 shadow-2xl">
          
          {/* Logo Region - BIG */}
          <div className="px-6 pt-8 pb-6 border-b border-[#D2691E]/30">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D2691E] to-[#CD853F] flex items-center justify-center shadow-xl">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white" className="w-10 h-10">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight leading-none">BarberConnect</h1>
                <p className="text-xs text-[#F4E4BC] font-semibold tracking-wide mt-1">Professional Suite</p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs - Consistent spacing */}
          <nav className="flex-1 flex flex-col px-3 py-4 overflow-y-auto space-y-1">
            
            <button onClick={() => setActiveTab('overview')} className={getTabClass('overview')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              <span>Overview</span>
            </button>
            
            <button onClick={() => setActiveTab('schedule')} className={getTabClass('schedule')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span>Schedule</span>
            </button>
            
            <button onClick={() => setActiveTab('catalog')} className={getTabClass('catalog')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
              <span>Haircut Catalog</span>
            </button>
            
            <button onClick={() => setActiveTab('feed')} className={getTabClass('feed')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span>Social Feed</span>
            </button>
            
            <button onClick={() => setActiveTab('income')} className={getTabClass('income')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Income Analytics</span>
            </button>
            
            <button onClick={() => setActiveTab('ratings')} className={getTabClass('ratings')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              <span>Ratings</span>
            </button>
            
            {/* Spacer between sections */}
            <div className="h-6"></div>
            
            <button onClick={() => setActiveTab('profile')} className={getTabClass('profile')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span>Profile</span>
            </button>
            
          </nav>

          {/* Bottom User Profile & Logout */}
          <div className="p-6 border-t border-slate-700/50 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 border-2 border-amber-400/30 flex items-center justify-center text-base font-bold text-white flex-shrink-0 shadow-lg">
                {user?.firstName?.charAt(0) || 'B'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{user?.firstName || 'Barber'}</p>
                <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider truncate mt-0.5">Pro Account</p>
              </div>
              <button 
                onClick={handleLogout} 
                className="text-slate-400 hover:text-red-400 transition-colors p-2 rounded-xl hover:bg-slate-700/50"
                title="Log out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* 🟢 MAIN CONTENT AREA (Enhanced with gradient background) */}
        <main className="flex-1 h-full overflow-y-auto relative bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
          <div className="py-10 px-10 xl:px-14 min-h-full pb-20">
            
            {/* Global Incomplete Profile Alert */}
            {isProfileIncomplete() && activeTab !== 'profile' && (
              <div className="bg-gradient-to-r from-[#FFF8F0] to-[#F4E4BC]/50 border-2 border-[#D2691E]/50 p-6 rounded-2xl shadow-lg mb-10 flex items-start gap-4 mx-1 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D2691E] to-[#CD853F] flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-white text-2xl">⚠️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-[#8B4513] mb-1">Complete Your Barber Profile</h3>
                  <p className="mt-1 text-[13px] text-[#A0522D] leading-relaxed">Add your phone number, bio, and experience to activate your catalog and attract customers.</p>
                  <button 
                    onClick={() => setActiveTab('profile')} 
                    className="mt-4 bg-gradient-to-r from-[#8B4513] to-[#D2691E] hover:from-[#A0522D] hover:to-[#CD853F] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
                  >
                    Complete Profile Now →
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