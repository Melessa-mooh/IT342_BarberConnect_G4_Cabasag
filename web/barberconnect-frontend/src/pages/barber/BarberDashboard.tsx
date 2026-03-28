import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './BarberDashboard.css';

const BarberDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const isProfileIncomplete = () => {
    return !user?.phoneNumber || user.phoneNumber.trim() === '' ||
           !user?.barberProfile?.bio || user.barberProfile.bio.trim() === '' ||
           !user?.barberProfile?.yearsExperience || user.barberProfile.yearsExperience === 0;
  };

  return (
    <div className="barber-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">✂</span>
            <span className="logo-text">BarberConnect</span>
          </div>
          <nav className="header-nav">
            <Link to="/dashboard" className="nav-btn active">🏠 Dashboard</Link>
            <button className="nav-btn">📅 Appointments</button>
            <button className="nav-btn">💰 Income</button>
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
                  <h4>Complete Your Barber Profile</h4>
                  <p>Add your phone number, bio, and experience to attract more customers.</p>
                </div>
                <Link to="/profile" className="complete-profile-btn">
                  Complete Profile
                </Link>
              </div>
            </div>
          )}
          
          {/* Top Stats Row */}
          <div className="stats-row">
            <div className="stat-card income-card">
              <div className="stat-content">
                <h2>$5200</h2>
                <p>This Month Income</p>
              </div>
            </div>

            <div className="stat-card appointments-card">
              <div className="stat-content">
                <h2>2</h2>
                <p>Today's Appointments</p>
              </div>
            </div>

            <div className="stat-card satisfaction-card">
              <div className="stat-content">
                <h2>98%</h2>
                <p>Customer Satisfaction</p>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="main-grid">
            {/* Left Column */}
            <div className="left-column">
              {/* Income Overview */}
              <div className="section income-overview">
                <h3>Income Overview</h3>
                <div className="chart-container">
                  <div className="chart-bars">
                    <div className="bar" style={{ height: '60%' }}></div>
                    <div className="bar" style={{ height: '75%' }}></div>
                    <div className="bar" style={{ height: '85%' }}></div>
                    <div className="bar" style={{ height: '90%' }}></div>
                    <div className="bar" style={{ height: '95%' }}></div>
                    <div className="bar" style={{ height: '100%' }}></div>
                  </div>
                  <div className="chart-labels">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                  </div>
                </div>
              </div>

              {/* Upcoming Appointments */}
              <div className="section upcoming-appointments">
                <div className="section-header">
                  <h3>Upcoming Appointments</h3>
                  <span className="appointment-count">3 upcoming</span>
                </div>
                <div className="appointments-list">
                  <div className="appointment-item">
                    <div className="appointment-info">
                      <h4>John Smith</h4>
                      <p>Classic Fade</p>
                      <span className="service-type">• Beard Trim</span>
                    </div>
                    <div className="appointment-details">
                      <span className="time">10:00 AM</span>
                      <span className="date">2024-03-15</span>
                      <span className="price">$35</span>
                    </div>
                  </div>

                  <div className="appointment-item">
                    <div className="appointment-info">
                      <h4>Robert Lee</h4>
                      <p>Modern Pompadour</p>
                      <span className="service-type">• Hair Styling</span>
                    </div>
                    <div className="appointment-details">
                      <span className="time">2:00 PM</span>
                      <span className="date">2024-03-15</span>
                      <span className="price">$42</span>
                    </div>
                  </div>

                  <div className="appointment-item">
                    <div className="appointment-info">
                      <h4>Michael Brown</h4>
                      <p>Textured Crop</p>
                    </div>
                    <div className="appointment-details">
                      <span className="time">11:00 AM</span>
                      <span className="date">2024-03-16</span>
                      <span className="price">$28</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manage Availability */}
              <div className="section manage-availability">
                <h3>Manage Availability</h3>
                <div className="availability-legend">
                  <div className="legend-item">
                    <div className="legend-color available"></div>
                    <span>Available</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color booked"></div>
                    <span>Booked</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color closed"></div>
                    <span>Closed</span>
                  </div>
                </div>
                
                <div className="calendar-header">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>
                
                <div className="calendar-grid">
                  {Array.from({ length: 35 }, (_, i) => {
                    const day = i + 1;
                    let status = 'available';
                    if (day % 7 === 0 || day % 7 === 6) status = 'closed';
                    else if (day % 4 === 0) status = 'booked';
                    
                    return (
                      <div key={i} className={`calendar-day ${status}`}>
                        {day <= 31 ? day : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="right-column">
              {/* Quick Actions */}
              <div className="section quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button className="action-btn primary">
                    <span className="btn-icon">✂</span>
                    Add Haircut Style
                  </button>
                  <button className="action-btn secondary">
                    <span className="btn-icon">📸</span>
                    Post Haircut Photo
                  </button>
                </div>
              </div>

              {/* Recent Reviews */}
              <div className="section recent-reviews">
                <h3>Recent Reviews</h3>
                <div className="reviews-list">
                  <div className="review-item">
                    <div className="review-header">
                      <span className="reviewer-name">John Smith</span>
                      <div className="rating">⭐⭐⭐⭐⭐</div>
                    </div>
                    <p>Excellent fade! Very professional.</p>
                  </div>

                  <div className="review-item">
                    <div className="review-header">
                      <span className="reviewer-name">Mike Johnson</span>
                      <div className="rating">⭐⭐⭐⭐⭐</div>
                    </div>
                    <p>Best haircut I've had in years!</p>
                  </div>

                  <div className="review-item">
                    <div className="review-header">
                      <span className="reviewer-name">David Lee</span>
                      <div className="rating">⭐⭐⭐⭐⭐</div>
                    </div>
                    <p>Great service, will come back.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BarberDashboard;