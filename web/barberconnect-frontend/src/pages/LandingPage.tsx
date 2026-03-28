import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
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
  const [selectedRole, setSelectedRole] = useState<'customer' | 'barber' | null>(null);

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
  };

  const handleAuthSelect = (authType: 'login' | 'register') => {
    if (selectedRole) {
      navigate(`/${authType}?role=${selectedRole}`);
    }
  };

  const resetSelection = () => {
    setSelectedRole(null);
  };

  const handleGoogleAuth = () => {
    // Redirect to Spring Boot OAuth2 endpoint
    authService.loginWithGoogle();
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

            {selectedRole && (
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


          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;