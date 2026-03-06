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
            <button className="nav-btn">📅 My Bookings</button>
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
                  <p>Please add your phone number to book appointments and receive updates.</p>
                </div>
                <Link to="/profile" className="complete-profile-btn">
                  Complete Profile
                </Link>
              </div>
            </div>
          )}
          
          <div className="welcome-section">
            <h1>Welcome back, {user?.firstName} {user?.lastName}!</h1>
            <p>Find and book your next haircut with our talented barbers</p>
          </div>

          <div className="dashboard-grid">
            <section className="barber-feed">
              <h2>Barber Feed</h2>
              <div className="feed-posts">
                <div className="post-card">
                  <div className="post-header">
                    <div className="post-avatar">MJ</div>
                    <div className="post-info">
                      <h4>Marcus Johnson</h4>
                      <span>2h ago</span>
                    </div>
                  </div>
                  <div className="post-content">
                    <p>Fresh fade for the week! 💇‍♂️ #FadeGame #BarberLife</p>
                    <div className="post-image">
                      <div className="placeholder-image">📸 Haircut Photo</div>
                    </div>
                  </div>
                  <div className="post-actions">
                    <button className="action-btn">❤️ 234</button>
                    <button className="action-btn">💬 18</button>
                    <button className="action-btn">📤</button>
                  </div>
                </div>

                <div className="post-card">
                  <div className="post-header">
                    <div className="post-avatar">DC</div>
                    <div className="post-info">
                      <h4>David Chen</h4>
                      <span>5h ago</span>
                    </div>
                  </div>
                  <div className="post-content">
                    <p>Classic pompadour never goes out of style 🔥</p>
                    <div className="post-image">
                      <div className="placeholder-image">📸 Haircut Photo</div>
                    </div>
                  </div>
                  <div className="post-actions">
                    <button className="action-btn">❤️ 189</button>
                    <button className="action-btn">💬 12</button>
                    <button className="action-btn">📤</button>
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
                        {barber.profileImageUrl ? (
                          <img src={barber.profileImageUrl} alt="Barber" />
                        ) : (
                          <div className="avatar-placeholder">
                            {barber.id === 1 ? 'MJ' : barber.id === 2 ? 'DC' : 'JW'}
                          </div>
                        )}
                      </div>
                      <div className="barber-info">
                        <h4>
                          {barber.id === 1 ? 'Marcus Johnson' : 
                           barber.id === 2 ? 'David Chen' : 'James Wilson'}
                        </h4>
                        <div className="barber-rating">
                          ⭐ {parseFloat(barber.rating).toFixed(1)} ({barber.totalReviews})
                        </div>
                        <div className="barber-experience">
                          {barber.yearsExperience} years exp.
                        </div>
                        <div className="barber-specialties">
                          {barber.id === 1 ? 'Fade • Beard Trim' :
                           barber.id === 2 ? 'Modern Cuts • Hair Design' : 'Traditional • Hot Towel Shave'}
                        </div>
                      </div>
                      <button className="book-btn">Book Now</button>
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