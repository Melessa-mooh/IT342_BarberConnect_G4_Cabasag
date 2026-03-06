import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

// Import local images
import haircut1 from '../images/haircut 1.png';
import haircut2 from '../images/haircut 2.png';
import midnightCurtains from '../images/Midnight-Curtains.jpeg';
import woman1 from '../images/woman1.jpg';
import woman2 from '../images/woman2.jpg';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerWithGoogle } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedRole, setSelectedRole] = useState<'customer' | 'barber' | null>(null);
  const [showAuthForm, setShowAuthForm] = useState<'login' | 'register' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hairstyles = [
    {
      id: 1,
      name: "Classic Fade",
      image: haircut1,
      description: "Timeless and professional",
      price: "$25"
    },
    {
      id: 2,
      name: "Modern Cut",
      image: haircut2,
      description: "Contemporary styling",
      price: "$30"
    },
    {
      id: 3,
      name: "Midnight Curtains",
      image: midnightCurtains,
      description: "Trendy and bold",
      price: "$35"
    },
    {
      id: 4,
      name: "Women's Style",
      image: woman1,
      description: "Expert women's cuts",
      price: "$40"
    },
    {
      id: 5,
      name: "Premium Style",
      image: woman2,
      description: "Luxury hair treatment",
      price: "$45"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % hairstyles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [hairstyles.length]);

  const handleRoleSelect = (role: 'customer' | 'barber') => {
    setSelectedRole(role);
    setShowAuthForm(null);
    setError('');
  };

  const handleAuthSelect = (authType: 'login' | 'register') => {
    setShowAuthForm(authType);
    setError('');
  };

  const resetSelection = () => {
    setSelectedRole(null);
    setShowAuthForm(null);
    setError('');
  };

  const handleGoogleAuth = async () => {
    if (!selectedRole) return;
    
    setLoading(true);
    setError('');
    
    try {
      await registerWithGoogle(selectedRole.toUpperCase() as 'CUSTOMER' | 'BARBER');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-icon">✂️</span>
            <span className="logo-text">BarberConnect</span>
          </div>
          <div className="nav-links">
            <button onClick={resetSelection} className="nav-link">Home</button>
            <Link to="/login" className="nav-btn">Sign In</Link>
          </div>
        </div>
      </nav>

      <div className="main-content">
        {/* Left Side - Circular Motion Slideshow */}
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
                      scale: isActive ? 1.2 : 0.8
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
            <div className="feature-item">
              <div className="feature-icon">📅</div>
              <span>Easy Booking</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">⭐</div>
              <span>Expert Barbers</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">💳</div>
              <span>Secure Payments</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📱</div>
              <span>Mobile Friendly</span>
            </div>
          </div>
        </div>

        {/* Right Side - Role Selection & Auth Forms */}
        <div className="selection-section">
          <div className="selection-container">
            {!selectedRole && (
              <div className="role-selection">
                <div className="selection-header">
                  <h2>Get Started</h2>
                  <p>Choose your role to continue your barbershop journey</p>
                </div>

                <div className="role-cards">
                  <div 
                    className="role-card customer"
                    onClick={() => handleRoleSelect('customer')}
                  >
                    <div className="role-icon">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="role-content">
                      <h3>I'm a Customer</h3>
                      <p>Book appointments and discover amazing styles</p>
                      <div className="role-features">
                        <span>✓ Easy booking</span>
                        <span>✓ Browse barbers</span>
                        <span>✓ Track history</span>
                      </div>
                    </div>
                    <div className="role-arrow">→</div>
                  </div>

                  <div 
                    className="role-card barber"
                    onClick={() => handleRoleSelect('barber')}
                  >
                    <div className="role-icon">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="role-content">
                      <h3>I'm a Barber</h3>
                      <p>Manage your business and grow your clientele</p>
                      <div className="role-features">
                        <span>✓ Manage appointments</span>
                        <span>✓ Showcase work</span>
                        <span>✓ Track income</span>
                      </div>
                    </div>
                    <div className="role-arrow">→</div>
                  </div>
                </div>
              </div>
            )}

            {selectedRole && !showAuthForm && (
              <div className="auth-selection">
                <div className="auth-header">
                  <button className="back-btn" onClick={resetSelection}>
                    ← Back
                  </button>
                  <h2>Welcome, {selectedRole === 'customer' ? 'Customer' : 'Barber'}!</h2>
                  <p>How would you like to continue?</p>
                </div>

                <div className="auth-options">
                  <button 
                    className="auth-btn register"
                    onClick={() => handleAuthSelect('register')}
                  >
                    <div className="auth-icon">🚀</div>
                    <div className="auth-content">
                      <h3>Create Account</h3>
                      <p>New to BarberConnect? Join us today!</p>
                    </div>
                  </button>

                  <button 
                    className="auth-btn login"
                    onClick={() => handleAuthSelect('login')}
                  >
                    <div className="auth-icon">🔑</div>
                    <div className="auth-content">
                      <h3>Sign In</h3>
                      <p>Already have an account? Welcome back!</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {selectedRole && showAuthForm && (
              <div className="auth-form-container">
                <div className="auth-form-header">
                  <button className="back-btn" onClick={() => setShowAuthForm(null)}>
                    ← Back
                  </button>
                  <h2>{showAuthForm === 'login' ? 'Sign In' : 'Create Account'}</h2>
                  <p>Continue as {selectedRole}</p>
                </div>

                {error && (
                  <div className="error-message">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                      <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    {error}
                  </div>
                )}

                <div className="auth-form-content">
                  {showAuthForm === 'register' ? (
                    <Link 
                      to={`/register?role=${selectedRole}`}
                      className="auth-form-btn register"
                    >
                      <span className="btn-icon">✂️</span>
                      <span>Create {selectedRole} Account</span>
                      <span className="btn-arrow">→</span>
                    </Link>
                  ) : (
                    <Link 
                      to="/login"
                      className="auth-form-btn login"
                    >
                      <span className="btn-icon">🔑</span>
                      <span>Sign In to Account</span>
                      <span className="btn-arrow">→</span>
                    </Link>
                  )}

                  <div className="auth-divider">
                    <span>or</span>
                  </div>

                  <button 
                    className="google-auth-btn"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="spinner"></div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;