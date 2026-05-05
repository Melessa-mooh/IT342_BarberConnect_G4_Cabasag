import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import './BarberLoginPage.css';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

/**
 * BarberLoginPage
 * ───────────────
 * Barber accounts are created exclusively by the Admin.
 * Barbers can ONLY sign in — no registration option is shown.
 */
const BarberLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [errors, setErrors]     = useState<FormErrors>({});
  const [loading, setLoading]   = useState(false);

  /* ── Validation ── */
  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = 'Please enter a valid email address';
    if (!password)
      errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const user = await authService.login({ email: email.trim(), password });
      if (user.role !== 'BARBER') {
        // Kick out non-barbers from this portal
        authService.removeToken();
        setErrors({ general: 'This portal is for barbers only. Please use the main login page.' });
        setLoading(false);
        return;
      }
      
      // FIX: ensure barberProfile is populated
      if (refreshUser) {
        await refreshUser();
      }
      navigate('/barber/dashboard');
    } catch (err: any) {
      setErrors({ general: err.message || 'Login failed. Please check your credentials.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="barber-login-page">
      {/* Background decoration */}
      <div className="bl-bg-deco bl-bg-deco-1" aria-hidden="true" />
      <div className="bl-bg-deco bl-bg-deco-2" aria-hidden="true" />

      {/* Top nav */}
      <nav className="bl-topnav">
        <Link to="/" className="bl-logo">
          <span className="bl-logo-icon">✂️</span>
          <span className="bl-logo-text">BarberConnect</span>
        </Link>
      </nav>

      {/* Card */}
      <main className="bl-wrapper">
        <div className="bl-card">
          {/* Left — brand panel */}
          <div className="bl-brand-panel" aria-hidden="true">
            <div className="bl-brand-inner">
              <div className="bl-scissors-icon">✂️</div>
              <h2 className="bl-brand-title">Barber Portal</h2>
              <p className="bl-brand-subtitle">
                Your account was set up by the admin.<br/>
                Sign in to access your dashboard.
              </p>
              <div className="bl-brand-badge">
                <span className="bl-badge-dot" />
                Barber Staff Only
              </div>
            </div>
            <div className="bl-brand-grid" aria-hidden="true">
              {Array.from({ length: 9 }).map((_, i) => (
                <span key={i} className="bl-grid-scissors">✂</span>
              ))}
            </div>
          </div>

          {/* Right — form panel */}
          <div className="bl-form-panel">
            <div className="bl-form-header">
              <h1>Welcome back</h1>
              <p>Sign in to your barber account</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="bl-form">
              {errors.general && (
                <div className="bl-alert bl-alert-error" role="alert">{errors.general}</div>
              )}

              {/* Email */}
              <div className="bl-field">
                <label htmlFor="barber-email">Email Address</label>
                <input
                  id="barber-email"
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(p => ({ ...p, email: undefined }));
                  }}
                  className={errors.email ? 'bl-input-error' : ''}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
                {errors.email && <span className="bl-field-error">{errors.email}</span>}
              </div>

              {/* Password */}
              <div className="bl-field">
                <label htmlFor="barber-password">Password</label>
                <div className="bl-pw-wrap">
                  <input
                    id="barber-password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors(p => ({ ...p, password: undefined }));
                    }}
                    className={errors.password ? 'bl-input-error' : ''}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="bl-pw-toggle"
                    onClick={() => setShowPw(v => !v)}
                    aria-label="Toggle password visibility"
                  >
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <span className="bl-field-error">{errors.password}</span>}
              </div>

              <button type="submit" className="bl-submit-btn" disabled={loading}>
                {loading
                  ? <><span className="bl-spinner" /> Signing In…</>
                  : 'Sign In'}
              </button>
            </form>

            {/* Info note */}
            <div className="bl-info-note">
              <span className="bl-info-icon">ℹ️</span>
              <p>
                Barber accounts are created by the admin.<br/>
                Contact your administrator if you need access.
              </p>
            </div>

            <div className="bl-customer-link">
              Not a barber?{' '}
              <Link to="/login" className="bl-text-link">Customer Sign In</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BarberLoginPage;
