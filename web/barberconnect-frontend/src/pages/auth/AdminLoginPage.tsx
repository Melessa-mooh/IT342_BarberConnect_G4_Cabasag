import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import './AdminLoginPage.css';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

/**
 * AdminLoginPage
 * ──────────────
 * Dedicated sign-in page for the BarberConnect administrator.
 * Only ADMIN role accounts can proceed — all others are rejected.
 */
const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [errors, setErrors]     = useState<FormErrors>({});
  const [loading, setLoading]   = useState(false);

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = 'Please enter a valid email address';
    if (!password)
      errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const user = await authService.login({ email: email.trim(), password });
      if (user.role !== 'ADMIN') {
        authService.removeToken();
        setErrors({ general: 'Access denied. This portal is for administrators only.' });
        setLoading(false);
        return;
      }
      if (refreshUser) await refreshUser();
      navigate('/dashboard');
    } catch (err: any) {
      setErrors({ general: err.message || 'Login failed. Please check your credentials.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      {/* Animated background orbs */}
      <div className="al-orb al-orb-1" aria-hidden="true" />
      <div className="al-orb al-orb-2" aria-hidden="true" />
      <div className="al-orb al-orb-3" aria-hidden="true" />

      {/* Top bar */}
      <nav className="al-topbar">
        <Link to="/" className="al-logo">
          <span className="al-logo-icon">✂️</span>
          <span className="al-logo-text">BarberConnect</span>
        </Link>
        <span className="al-portal-label">Admin Portal</span>
      </nav>

      {/* Centred card */}
      <main className="al-wrapper">
        <div className="al-card">

          {/* ── Left branding panel ── */}
          <div className="al-brand">
            <div className="al-brand-shield" aria-hidden="true">🛡️</div>
            <h2 className="al-brand-title">Admin Control Centre</h2>
            <p className="al-brand-sub">
              Manage barbers, appointments, customers and shop statistics from one place.
            </p>
            <ul className="al-brand-list">
              <li>✓ Manage barber accounts</li>
              <li>✓ View shop statistics</li>
              <li>✓ Monitor appointments</li>
              <li>✓ Control system settings</li>
            </ul>
            <div className="al-brand-secure">
              <span>🔒</span>
              <span>Secured • Encrypted • Role-restricted</span>
            </div>
          </div>

          {/* ── Right form panel ── */}
          <div className="al-form-panel">
            <div className="al-form-header">
              <div className="al-admin-badge">Administrator</div>
              <h1>Sign In</h1>
              <p>Enter your admin credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="al-form">
              {errors.general && (
                <div className="al-alert" role="alert">
                  <span>⚠️</span> {errors.general}
                </div>
              )}

              {/* Email */}
              <div className="al-field">
                <label htmlFor="admin-email">Email Address</label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(p => ({ ...p, email: undefined }));
                  }}
                  className={errors.email ? 'al-input-err' : ''}
                  placeholder="admin@barberconnect.com"
                  autoComplete="username"
                />
                {errors.email && <span className="al-field-err">{errors.email}</span>}
              </div>

              {/* Password */}
              <div className="al-field">
                <label htmlFor="admin-password">Password</label>
                <div className="al-pw-wrap">
                  <input
                    id="admin-password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors(p => ({ ...p, password: undefined }));
                    }}
                    className={errors.password ? 'al-input-err' : ''}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="al-pw-toggle"
                    onClick={() => setShowPw(v => !v)}
                    aria-label="Toggle password visibility"
                  >
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <span className="al-field-err">{errors.password}</span>}
              </div>

              <button type="submit" className="al-submit" disabled={loading}>
                {loading
                  ? <><span className="al-spinner" />Signing in…</>
                  : <>Sign In to Admin Panel</>}
              </button>
            </form>

            {/* Credentials hint */}
            <div className="al-hint-box">
              <p className="al-hint-title">Default credentials</p>
              <div className="al-hint-row">
                <span>Email</span>
                <code>admin@barberconnect.com</code>
              </div>
              <div className="al-hint-row">
                <span>Password</span>
                <code>admin123</code>
              </div>
              <p className="al-hint-note">Make sure your Spring Boot backend is running first.</p>
            </div>

            <div className="al-back-links">
              <Link to="/" className="al-back-link">← Back to Home</Link>
              <Link to="/login" className="al-back-link">Customer Login</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLoginPage;
