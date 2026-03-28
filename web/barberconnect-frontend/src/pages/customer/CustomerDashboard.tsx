import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { barberService } from '../../services/barberService';
import type { Barber } from '../../services/barberService';
import './CustomerDashboard.css';

const CustomerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    try {
      const barbersData = await barberService.getAvailableBarbers();
      setBarbers(barbersData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const isProfileIncomplete = () => {
    return !user?.phoneNumber || user.phoneNumber.trim() === '';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="customer-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">✂</span>
            <span className="logo-text">BarberConnect</span>
          </div>
          <nav className="header-nav">
            <Link to="/dashboard" className="nav-btn active">🏠 Dashboard</Link>
            <Link to="/booking" className="nav-btn">📅 My Bookings</Link>
            <Link to="/profile" className="nav-btn">👤 Profile</Link>
            <button className="nav-btn logout-btn" onClick={handleLogout}>
              🚪 Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          {isProfileIncomplete() && (
            <div className="profile-warning">
              <div className="warning-content">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <h4>Complete Your Profile</h4>
                  <p>Add your phone number to book appointments and receive updates.</p>
                </div>
                <Link to="/profile" className="complete-profile-btn">
                  Complete Profile
                </Link>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="search-section">
            <div className="search-container">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search barbers or styles..." 
                className="search-input"
              />
              <button className="filter-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
                Filter
              </button>
            </div>
          </div>

          <div className="dashboard-grid">
            <section className="barber-feed">
              <h2>Barber Feed</h2>
              <div className="feed-posts">
                <div className="post-card">
                  <div className="post-header">
                    <div className="post-avatar">
                      <img src="/api/placeholder/40/40" alt="Marcus Johnson" />
                    </div>
                    <div className="post-info">
                      <h4>Marcus Johnson</h4>
                      <span>2h ago</span>
                    </div>
                  </div>
                  <div className="post-content">
                    <p>Fresh fade for the week! ✂️ #FadeGame #BarberLife</p>
                    <div className="post-image">
                      <img src="/api/placeholder/400/300" alt="Fresh fade haircut" />
                    </div>
                  </div>
                  <div className="post-actions">
                    <button className="action-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      234
                    </button>
                    <button className="action-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      18
                    </button>
                    <button className="action-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="2"/>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="post-card">
                  <div className="post-header">
                    <div className="post-avatar">
                      <img src="/api/placeholder/40/40" alt="David Chen" />
                    </div>
                    <div className="post-info">
                      <h4>David Chen</h4>
                      <span>5h ago</span>
                    </div>
                  </div>
                  <div className="post-content">
                    <p>Classic pompadour never goes out of style 🔥</p>
                    <div className="post-image">
                      <img src="/api/placeholder/400/300" alt="Classic pompadour haircut" />
                    </div>
                  </div>
                  <div className="post-actions">
                    <button className="action-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      189
                    </button>
                    <button className="action-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      12
                    </button>
                    <button className="action-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="2"/>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="post-card">
                  <div className="post-header">
                    <div className="post-avatar">
                      <img src="/api/placeholder/40/40" alt="James Wilson" />
                    </div>
                    <div className="post-info">
                      <h4>James Wilson</h4>
                      <span>1d ago</span>
                    </div>
                  </div>
                  <div className="post-content">
                    <p>Textured crop with a clean lineup ✨</p>
                    <div className="post-image">
                      <img src="/api/placeholder/400/300" alt="Textured crop haircut" />
                    </div>
                  </div>
                  <div className="post-actions">
                    <button className="action-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      312
                    </button>
                    <button className="action-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      24
                    </button>
                    <button className="action-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="2"/>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="post-card">
                  <div className="post-header">
                    <div className="post-avatar">
                      <img src="/api/placeholder/40/40" alt="Alex Rivera" />
                    </div>
                    <div className="post-info">
                      <h4>Alex Rivera</h4>
                      <span>2d ago</span>
                    </div>
                  </div>
                  <div className="post-content">
                    <p>Sharp undercut transformation 💯</p>
                    <div className="post-image">
                      <img src="/api/placeholder/400/300" alt="Sharp undercut haircut" />
                    </div>
                  </div>
                  <div className="post-actions">
                    <button className="action-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      156
                    </button>
                    <button className="action-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      9
                    </button>
                    <button className="action-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="2"/>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <aside className="available-barbers">
              <h2>Available Barbers</h2>
              {error && <div className="error-message">{error}</div>}
              <div className="barbers-list">
                {barbers.length > 0 ? (
                  barbers.map((barber) => (
                    <div key={barber.id} className="barber-card">
                      <div className="barber-avatar">
                        <img src="/api/placeholder/60/60" alt="Barber" />
                      </div>
                      <div className="barber-info">
                        <h4>
                          {barber.id === 1 ? 'Marcus Johnson' : 
                           barber.id === 2 ? 'David Chen' : 
                           barber.id === 3 ? 'James Wilson' : 'Alex Rivera'}
                        </h4>
                        <div className="barber-rating">
                          ⭐ {parseFloat(barber.rating).toFixed(1)} ({barber.totalReviews})
                        </div>
                        <div className="barber-experience">
                          {barber.yearsExperience} years exp.
                        </div>
                        <div className="barber-specialties">
                          {barber.id === 1 ? 'Fade • Beard Trim' :
                           barber.id === 2 ? 'Modern Cuts • Hair Design' : 
                           barber.id === 3 ? 'Traditional • Hot Towel Shave' : 'Undercut • Textured Crop'}
                        </div>
                      </div>
                      <Link to="/booking" className="book-btn">Book Now</Link>
                    </div>
                  ))
                ) : (
                  <div className="no-barbers">
                    <p>No barbers available at the moment</p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;