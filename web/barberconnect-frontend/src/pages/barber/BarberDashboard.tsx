import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import OverviewPanel from './components/OverviewPanel';
import SchedulePanel from './components/SchedulePanel';
import CatalogPanel  from './components/CatalogPanel';
import IncomePanel   from './components/IncomePanel';
import FeedPanel     from './components/FeedPanel';
import FeedbackPanel from './components/FeedbackPanel';
import ProfilePanel  from './components/ProfilePanel';
import './BarberDashboard.css';

type BarberTab = 'overview' | 'schedule' | 'catalog' | 'feed' | 'income' | 'ratings' | 'profile';

const navItems: { id: BarberTab; label: string }[] = [
  { id: 'overview',  label: 'Overview'        },
  { id: 'schedule',  label: 'Schedule'         },
  { id: 'catalog',   label: 'Haircut Catalog'  },
  { id: 'feed',      label: 'Social Feed'      },
  { id: 'income',    label: 'Income Analytics' },
  { id: 'ratings',   label: 'Ratings'          },
];

const BarberDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<BarberTab>('overview');

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); }
    catch (err) { console.error('Logout failed:', err); }
  };

  const isProfileIncomplete = () =>
    !user?.phoneNumber || user.phoneNumber.trim() === '' ||
    !user?.barberProfile?.bio || user.barberProfile.bio.trim() === '' ||
    !user?.barberProfile?.yearsExperience || user.barberProfile.yearsExperience === 0;

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':  return <OverviewPanel setActiveTab={setActiveTab} />;
      case 'schedule':  return <SchedulePanel />;
      case 'catalog':   return <CatalogPanel />;
      case 'feed':      return <FeedPanel />;
      case 'income':    return <IncomePanel />;
      case 'ratings':   return <FeedbackPanel />;
      case 'profile':   return <ProfilePanel />;
      default:          return <OverviewPanel setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="barber-dashboard-container">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="barber-sidebar">
        <div className="barber-sidebar-header">
          <h2>BarberConnect</h2>
          <p>Professional Suite</p>
        </div>

        <nav className="barber-sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`barber-nav-item${activeTab === item.id ? ' active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.label}
            </button>
          ))}

          <div className="barber-nav-divider" style={{ marginTop: 'auto' }} />

          <button
            className={`barber-nav-item${activeTab === 'profile' ? ' active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
        </nav>

        <div className="barber-sidebar-footer">
          <p className="user-name">{user?.firstName} {user?.lastName}</p>
          <p className="user-role">{user?.email}</p>
          <button className="barber-logout-btn" onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="barber-main-content">

        {isProfileIncomplete() && activeTab !== 'profile' && (
          <div className="barber-alert">
            <p>
              <strong>Complete your profile</strong> — Add your phone number, bio, and experience to activate your catalog and attract customers.
            </p>
            <button className="barber-alert-btn" onClick={() => setActiveTab('profile')}>
              Complete Now
            </button>
          </div>
        )}

        {renderContent()}
      </main>
    </div>
  );
};

export default BarberDashboard;
