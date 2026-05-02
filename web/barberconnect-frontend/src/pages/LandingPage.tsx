import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LandingPage.css';

// Import local images
import haircut1 from '../images/haircut 1.png';
import haircut2 from '../images/haircut 2.png';
import midnightCurtains from '../images/Midnight-Curtains.jpeg';
import woman1 from '../images/woman1.jpg';
import woman2 from '../images/woman2.jpg';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedRole, setSelectedRole] = useState<'customer' | null>(null);

  const hairstyles = [
    { id: 1, name: 'Classic Fade', image: haircut1, description: 'Timeless and professional', price: '₱250' },
    { id: 2, name: 'Modern Cut', image: haircut2, description: 'Contemporary styling', price: '₱300' },
    { id: 3, name: 'Midnight Curtains', image: midnightCurtains, description: 'Trendy and bold', price: '₱350' },
    { id: 4, name: "Women's Style", image: woman1, description: "Expert women's cuts", price: '₱400' },
    { id: 5, name: 'Premium Style', image: woman2, description: 'Luxury hair treatment', price: '₱450' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % hairstyles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [hairstyles.length]);

  return (
    <div className="landing-page">

      {/* ── Navigation ── */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-icon">✂️</span>
            <span className="logo-text">BarberConnect</span>
          </div>
          <div className="nav-links">
            <button onClick={() => setSelectedRole(null)} className="nav-link">Home</button>
            <Link to="/login" className="nav-btn">Sign In</Link>
          </div>
        </div>
      </nav>

      <div className="main-content">

        {/* ── Left — Circular Slideshow ── */}
        <div className="slideshow-section">
          <div className="slideshow-header">
            <h1 className="main-title">Premium Barbershop Experience</h1>
            <p className="main-subtitle">Discover the art of modern grooming with expert barbers</p>
          </div>

          <div className="circular-slideshow">
            <div className="slideshow-track">
              {hairstyles.map((style, index) => {
                const angle = (index * 360) / hairstyles.length;
                const rotation = angle - (currentSlide * 360) / hairstyles.length;
                const isActive = index === currentSlide;
                return (
                  <div
                    key={style.id}
                    className={`slide-item ${isActive ? 'active' : ''}`}
                    style={{
                      transform: `rotate(${rotation}deg) translateY(-200px) rotate(-${rotation}deg)`,
                      zIndex: isActive ? 10 : 1,
                      opacity: isActive ? 1 : 0.6,
                      scale: isActive ? '1.2' : '0.8',
                    }}
                  >
                    <div className="slide-card">
                      <div className="slide-image">
                        <img src={style.image} alt={style.name} />
                      </div>
                      <div className="slide-info">
                        <h3>{style.name}</h3>
                        <p>{style.description}</p>
                        <span className="price">{style.price}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="slideshow-center">
              <div className="center-content">
                <div className="barber-tools">
                  <span className="tool">✂️</span>
                  <span className="tool">🪒</span>
                  <span className="tool">💈</span>
                </div>
                <h3>Professional Services</h3>
              </div>
            </div>
          </div>

          <div className="features-showcase">
            {[
              { icon: '📅', label: 'Easy Booking' },
              { icon: '⭐', label: 'Expert Barbers' },
              { icon: '💳', label: 'Secure Payments' },
              { icon: '📱', label: 'Mobile Friendly' },
            ].map(f => (
              <div className="feature-item" key={f.label}>
                <div className="feature-icon">{f.icon}</div>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right — Role / Auth Panel ── */}
        <div className="selection-section">
          <div className="selection-container">

            {/* ══ ROLE PICKER ══ */}
            {!selectedRole && (
              <div className="role-selection">
                <div className="selection-header">
                  <div className="selection-badge">Welcome</div>
                  <h2>How are you using<br />BarberConnect?</h2>
                  <p>Choose your role to get started</p>
                </div>

                <div className="role-cards">
                  {/* Customer card */}
                  <div className="role-card customer" onClick={() => setSelectedRole('customer')}>
                    <div className="role-icon-wrap customer-icon">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <path d="M20 21V19C20 17.93 19.58 16.92 18.83 16.17C18.08 15.42 17.06 15 16 15H8C6.94 15 5.92 15.42 5.17 16.17C4.42 16.92 4 17.93 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </div>
                    <div className="role-text">
                      <h3>I'm a Customer</h3>
                      <p>Book appointments &amp; discover amazing styles</p>
                      <div className="role-tags">
                        <span>Easy booking</span>
                        <span>Browse barbers</span>
                        <span>Track history</span>
                      </div>
                    </div>
                    <span className="role-chevron">›</span>
                  </div>

                  {/* Barber card — goes directly to barber login */}
                  <div className="role-card barber" onClick={() => navigate('/barber-login')}>
                    <div className="role-icon-wrap barber-icon">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <path d="M6 2v6m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm12-6v6m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM6 16v6M18 16v6M6 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="role-text">
                      <h3>I'm a Barber</h3>
                      <p>Manage your schedule &amp; grow your clientele</p>
                      <div className="role-tags">
                        <span>Manage bookings</span>
                        <span>Showcase work</span>
                        <span>Track income</span>
                      </div>
                    </div>
                    <div className="role-right">
                      <span className="staff-only-badge">Staff only</span>
                      <span className="role-chevron">›</span>
                    </div>
                  </div>
                </div>

                <p className="role-footer-note">
                  By continuing, you agree to our{' '}
                  <a href="#" className="lp-link">Terms of Service</a> and{' '}
                  <a href="#" className="lp-link">Privacy Policy</a>.
                </p>
              </div>
            )}

            {/* ══ CUSTOMER AUTH OPTIONS ══ */}
            {selectedRole === 'customer' && (
              <div className="auth-selection">
                <div className="auth-header">
                  <button className="back-btn" onClick={() => setSelectedRole(null)}>
                    ← Back
                  </button>
                  <div className="auth-greeting">
                    <div className="auth-greeting-icon">👋</div>
                    <h2>Welcome!</h2>
                    <p>How would you like to continue?</p>
                  </div>
                </div>

                <div className="auth-options">
                  {/* Sign Up */}
                  <button className="auth-card-btn signup-card" onClick={() => navigate('/login?tab=signup')}>
                    <div className="auth-card-left">
                      <div className="auth-card-icon signup-ic">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                          <line x1="19" y1="8" x2="19" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <line x1="22" y1="11" x2="16" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div className="auth-card-text">
                        <h3>Create Account</h3>
                        <p>New to BarberConnect? Join for free</p>
                      </div>
                    </div>
                    <span className="auth-card-arrow">›</span>
                  </button>

                  <div className="auth-or"><span>or</span></div>

                  {/* Sign In */}
                  <button className="auth-card-btn signin-card" onClick={() => navigate('/login')}>
                    <div className="auth-card-left">
                      <div className="auth-card-icon signin-ic">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <polyline points="10 17 15 12 10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div className="auth-card-text">
                        <h3>Sign In</h3>
                        <p>Already have an account? Welcome back!</p>
                      </div>
                    </div>
                    <span className="auth-card-arrow">›</span>
                  </button>
                </div>

                <p className="auth-help-note">
                  🔒 Your data is always safe and secure with us.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;