import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LandingPage.css';

import haircut1 from '../images/haircut 1.png';
import haircut2 from '../images/haircut 2.png';
import midnightCurtains from '../images/Midnight-Curtains.jpeg';
import woman1 from '../images/woman1.jpg';
import woman2 from '../images/woman2.jpg';

type Role = 'customer' | 'barber' | null;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [authStep,     setAuthStep]     = useState(false);

  // theme class drives all CSS variable overrides — neutral until a role is picked
  const theme = selectedRole === 'barber' ? 'theme-barber' : selectedRole === 'customer' ? 'theme-customer' : '';

  const features = [
    { icon: '📅', label: 'Easy Booking',     desc: 'Book in seconds' },
    { icon: '⭐', label: 'Expert Barbers',   desc: 'Top-rated pros'  },
    { icon: '💳', label: 'Secure Payments',  desc: 'Safe & fast'     },
    { icon: '📱', label: 'Mobile Friendly',  desc: 'Anywhere, anytime'},
  ];

  const heroImages = [haircut1, haircut2, midnightCurtains, woman1];

  return (
    <div className={`lp-root ${theme}`}>

      {/* ── Navbar ── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-logo">
            <div className="lp-logo-icon">✂</div>
            <span className="lp-logo-text">BarberConnect</span>
          </div>
          <div className="lp-nav-right">
            <button className="lp-nav-link" onClick={() => { setSelectedRole(null); setAuthStep(false); }}>Home</button>
            <Link to="/login" className="lp-nav-btn">Sign In</Link>
          </div>
        </div>
      </nav>

      {/* ── Body ── */}
      <div className="lp-body">

        {/* ════ LEFT HERO ════ */}
        <div className="lp-hero">

          {/* Headline */}
          <div className="lp-hero-text">
            <div className="lp-hero-pill">✂ Premium Barbershop Platform</div>
            <h1 className="lp-hero-title">Premium Barbershop<br />Experience</h1>
            <p className="lp-hero-sub">
              Book trusted barbers, discover fresh styles, and manage appointments with ease.
            </p>
          </div>

          {/* 2×2 image grid */}
          <div className="lp-img-grid">
            {heroImages.map((src, i) => (
              <div key={i} className="lp-img-cell">
                <img src={src} alt={`style-${i}`} />
                <div className="lp-img-overlay" />
              </div>
            ))}
            {/* Floating stat card */}
            <div className="lp-stat-card">
              <p className="lp-stat-num">2,400+</p>
              <p className="lp-stat-label">Happy Customers</p>
            </div>
          </div>

          {/* Feature cards */}
          <div className="lp-features">
            {features.map(f => (
              <div className="lp-feat" key={f.label}>
                <span className="lp-feat-icon">{f.icon}</span>
                <div>
                  <p className="lp-feat-label">{f.label}</p>
                  <p className="lp-feat-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ════ RIGHT PANEL ════ */}
        <div className="lp-panel">
          <div className="lp-panel-inner">

            {/* ── ROLE PICKER ── */}
            {!authStep && (
              <>
                <div className="lp-panel-head">
                  <span className="lp-welcome-pill">WELCOME</span>
                  <h2 className="lp-panel-title">How are you using<br />BarberConnect?</h2>
                  <p className="lp-panel-sub">Choose your role to get started</p>
                </div>

                <div className="lp-role-cards">

                  {/* Customer card */}
                  <div
                    className={`lp-role-card lp-role-customer${selectedRole === 'customer' ? ' lp-role-active' : ''}`}
                    onClick={() => { setSelectedRole('customer'); setAuthStep(true); }}
                  >
                    <div className="lp-role-icon lp-icon-customer">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M20 21V19C20 17.93 19.58 16.92 18.83 16.17C18.08 15.42 17.06 15 16 15H8C6.94 15 5.92 15.42 5.17 16.17C4.42 16.92 4 17.93 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="lp-role-body">
                      <h3>I'm a Customer</h3>
                      <p>Book appointments and discover amazing styles</p>
                      <div className="lp-chips">
                        <span>Easy booking</span><span>Browse barbers</span><span>Track history</span>
                      </div>
                    </div>
                    <span className="lp-chevron">›</span>
                  </div>

                  {/* Barber card */}
                  <div
                    className={`lp-role-card lp-role-barber${selectedRole === 'barber' ? ' lp-role-active' : ''}`}
                    onClick={() => navigate('/barber-login')}
                  >
                    <div className="lp-role-icon lp-icon-barber">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M6 2v6m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm12-6v6m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM6 16v6M18 16v6M6 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="lp-role-body">
                      <h3>I'm a Barber</h3>
                      <p>Manage your schedule and grow your clientele</p>
                      <div className="lp-chips">
                        <span>Manage bookings</span><span>Showcase work</span><span>Track income</span>
                      </div>
                    </div>
                    <div className="lp-role-right">
                      <span className="lp-staff-badge">STAFF ONLY</span>
                      <span className="lp-chevron">›</span>
                    </div>
                  </div>
                </div>

                <p className="lp-terms">
                  By continuing you agree to our{' '}
                  <a href="#" className="lp-terms-link">Terms</a> and{' '}
                  <a href="#" className="lp-terms-link">Privacy Policy</a>.
                </p>
              </>
            )}

            {/* ── CUSTOMER AUTH STEP ── */}
            {authStep && selectedRole === 'customer' && (
              <>
                <button className="lp-back" onClick={() => { setAuthStep(false); setSelectedRole(null); }}>
                  ← Back
                </button>
                <div className="lp-auth-head">
                  <div className="lp-wave">👋</div>
                  <h2 className="lp-panel-title">Welcome!</h2>
                  <p className="lp-panel-sub">How would you like to continue?</p>
                </div>

                <div className="lp-auth-cards">
                  <button className="lp-auth-card lp-auth-signup" onClick={() => navigate('/login?tab=signup')}>
                    <div className="lp-auth-icon lp-auth-icon-signup">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                        <line x1="19" y1="8" x2="19" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="22" y1="11" x2="16" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="lp-auth-text">
                      <h3>Create Account</h3>
                      <p>New to BarberConnect? Join for free</p>
                    </div>
                    <span className="lp-chevron">›</span>
                  </button>

                  <div className="lp-or"><span>or</span></div>

                  <button className="lp-auth-card lp-auth-signin" onClick={() => navigate('/login')}>
                    <div className="lp-auth-icon lp-auth-icon-signin">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <polyline points="10 17 15 12 10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="lp-auth-text">
                      <h3>Sign In</h3>
                      <p>Already have an account? Welcome back!</p>
                    </div>
                    <span className="lp-chevron">›</span>
                  </button>
                </div>

                <p className="lp-secure-note">🔒 Your data is always safe and secure with us.</p>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
