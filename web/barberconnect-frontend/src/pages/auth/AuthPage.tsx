import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import './AuthPage.css';

/* ─────────────────────────── Types ─────────────────────────── */
interface LoginForm  { email: string; password: string }
interface RegisterForm {
  firstName: string; lastName: string;
  email: string; password: string; confirmPassword: string;
}
type FormErrors = Record<string, string | undefined>;

/* ══════════════════════════ Component ══════════════════════════ */
const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();

  // Read ?tab=signup to open register directly
  const tabParam = searchParams.get('tab');
  const [isSignUp, setIsSignUp] = useState(tabParam === 'signup');
  const message = searchParams.get('message');

  /* ── Sign In state ── */
  const [loginForm, setLoginForm]       = useState<LoginForm>({ email: '', password: '' });
  const [loginErrors, setLoginErrors]   = useState<FormErrors>({});
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPw, setShowLoginPw]   = useState(false);

  /* ── Sign Up state ── */
  const [regForm, setRegForm]         = useState<RegisterForm>({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: ''
  });
  const [regErrors, setRegErrors]     = useState<FormErrors>({});
  const [regLoading, setRegLoading]   = useState(false);
  const [showRegPw, setShowRegPw]     = useState(false);
  const [showRegCPw, setShowRegCPw]   = useState(false);

  useEffect(() => {
    if (tabParam === 'signup') setIsSignUp(true);
  }, [tabParam]);

  /* ─────────────────── Sign In handlers ─────────────────── */
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(p => ({ ...p, [name]: value }));
    if (loginErrors[name]) setLoginErrors(p => ({ ...p, [name]: undefined }));
  };

  const validateLogin = (): boolean => {
    const errs: FormErrors = {};
    if (!loginForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginForm.email.trim()))
      errs.email = 'Please enter a valid email address';
    if (!loginForm.password) errs.password = 'Password is required';
    setLoginErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;
    setLoginLoading(true);
    setLoginErrors({});
    try {
      await authService.login({ email: loginForm.email.trim(), password: loginForm.password });
      if (refreshUser) await refreshUser();
      navigate('/dashboard');
    } catch (err: any) {
      setLoginErrors({ general: err.message || 'Login failed. Please try again.' });
    } finally {
      setLoginLoading(false);
    }
  };

  /* ─────────────────── Sign Up handlers ─────────────────── */
  const handleRegChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegForm(p => ({ ...p, [name]: value }));
    if (regErrors[name]) setRegErrors(p => ({ ...p, [name]: undefined }));
  };

  const validateReg = (): boolean => {
    const errs: FormErrors = {};
    if (!regForm.firstName.trim() || regForm.firstName.trim().length < 2)
      errs.firstName = 'First name must be at least 2 characters';
    else if (!/^[a-zA-Z\s]+$/.test(regForm.firstName.trim()))
      errs.firstName = 'First name must contain only letters';

    if (!regForm.lastName.trim() || regForm.lastName.trim().length < 2)
      errs.lastName = 'Last name must be at least 2 characters';
    else if (!/^[a-zA-Z\s]+$/.test(regForm.lastName.trim()))
      errs.lastName = 'Last name must contain only letters';

    if (!regForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email.trim()))
      errs.email = 'Please enter a valid email address';

    if (!regForm.password || regForm.password.length < 8)
      errs.password = 'Password must be at least 8 characters';

    if (!regForm.confirmPassword || regForm.password !== regForm.confirmPassword)
      errs.confirmPassword = 'Passwords do not match';

    setRegErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateReg()) return;
    setRegLoading(true);
    setRegErrors({});
    try {
      await authService.register({
        firstName: regForm.firstName.trim(),
        lastName:  regForm.lastName.trim(),
        email:     regForm.email.trim(),
        password:  regForm.password,
        role:      'CUSTOMER'
      });
      // Switch to sign-in panel with success message
      setIsSignUp(false);
      setLoginErrors({ success: 'Account created! Please sign in.' } as any);
    } catch (err: any) {
      setRegErrors({ general: err.message || 'Registration failed. Please try again.' });
    } finally {
      setRegLoading(false);
    }
  };

  const handleGoogleLogin = () => authService.loginWithGoogle();

  /* ─────────────────────────── JSX ─────────────────────────── */
  return (
    <div className="auth-page">
      {/* ── Top nav ── */}
      <nav className="auth-topnav">
        <Link to="/" className="auth-logo">
          <span className="auth-logo-icon">✂️</span>
          <span className="auth-logo-text">BarberConnect</span>
        </Link>
        <Link to="/" className="auth-back-link">← Back to Home</Link>
      </nav>

      {/* ── Main card ── */}
      <div className="auth-wrapper">
        <div className={`auth-card${isSignUp ? ' signup-active' : ''}`}>

          {/* ══ LEFT PANEL — decorative ══ */}
          <div className="auth-panel auth-panel-left">
            <div className="panel-content">
              <div className="panel-icon">✂️</div>
              <h2 className="panel-title">
                {isSignUp ? 'Already a member?' : 'New here?'}
              </h2>
              <p className="panel-subtitle">
                {isSignUp
                  ? 'Sign in and continue your barbershop journey.'
                  : 'Create an account to book appointments with the best barbers in town.'}
              </p>
              <button
                className="panel-switch-btn"
                onClick={() => setIsSignUp(v => !v)}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
            {/* Decorative scissors pattern */}
            <div className="panel-decoration">
              <span>✂</span><span>✂</span><span>✂</span>
              <span>✂</span><span>✂</span><span>✂</span>
            </div>
          </div>

          {/* ══ RIGHT PANEL — forms ══ */}
          <div className="auth-panel auth-panel-right">

            {/* ── Sign In Form ── */}
            <div className={`auth-form-container login-form-container${isSignUp ? ' slide-out' : ' slide-in'}`}>
              <div className="form-header">
                <h1>Welcome Back</h1>
                <p>Sign in to continue your barbershop journey</p>
              </div>

              {message && <div className="alert alert-success">{message}</div>}
              {(loginErrors as any).success && (
                <div className="alert alert-success">{(loginErrors as any).success}</div>
              )}

              <form onSubmit={handleLogin} className="auth-form" noValidate>
                {loginErrors.general && (
                  <div className="alert alert-error">{loginErrors.general}</div>
                )}

                <div className="field-group">
                  <label htmlFor="login-email">Email Address</label>
                  <input
                    id="login-email" name="email" type="email"
                    value={loginForm.email} onChange={handleLoginChange}
                    className={loginErrors.email ? 'input-error' : ''}
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                  {loginErrors.email && <span className="field-error">{loginErrors.email}</span>}
                </div>

                <div className="field-group">
                  <label htmlFor="login-password">Password</label>
                  <div className="pw-wrapper">
                    <input
                      id="login-password" name="password"
                      type={showLoginPw ? 'text' : 'password'}
                      value={loginForm.password} onChange={handleLoginChange}
                      className={loginErrors.password ? 'input-error' : ''}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button" className="pw-toggle"
                      onClick={() => setShowLoginPw(v => !v)}
                      aria-label="Toggle password visibility"
                    >
                      {showLoginPw ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {loginErrors.password && <span className="field-error">{loginErrors.password}</span>}
                </div>

                <button type="submit" className="btn-primary" disabled={loginLoading}>
                  {loginLoading ? <span className="btn-spinner" /> : null}
                  {loginLoading ? 'Signing In…' : 'Sign In'}
                </button>
              </form>

              <div className="divider"><span>or</span></div>

              <button type="button" className="btn-google" onClick={handleGoogleLogin}>
                <GoogleIcon />
                Sign in with Google
              </button>

              <p className="form-switch-text">
                Don't have an account?{' '}
                <button className="text-link" onClick={() => setIsSignUp(true)}>Sign Up</button>
              </p>
            </div>

            {/* ── Sign Up Form ── */}
            <div className={`auth-form-container register-form-container${isSignUp ? ' slide-in' : ' slide-out-reg'}`}>
              <div className="form-header">
                <h1>Create Account</h1>
                <p>Join BarberConnect today</p>
              </div>

              <form onSubmit={handleRegister} className="auth-form" noValidate>
                {regErrors.general && (
                  <div className="alert alert-error">{regErrors.general}</div>
                )}

                <div className="name-row">
                  <div className="field-group">
                    <label htmlFor="reg-firstName">First Name</label>
                    <input
                      id="reg-firstName" name="firstName" type="text"
                      value={regForm.firstName} onChange={handleRegChange}
                      className={regErrors.firstName ? 'input-error' : ''}
                      placeholder="Juan"
                      autoComplete="given-name"
                    />
                    {regErrors.firstName && <span className="field-error">{regErrors.firstName}</span>}
                  </div>
                  <div className="field-group">
                    <label htmlFor="reg-lastName">Last Name</label>
                    <input
                      id="reg-lastName" name="lastName" type="text"
                      value={regForm.lastName} onChange={handleRegChange}
                      className={regErrors.lastName ? 'input-error' : ''}
                      placeholder="Dela Cruz"
                      autoComplete="family-name"
                    />
                    {regErrors.lastName && <span className="field-error">{regErrors.lastName}</span>}
                  </div>
                </div>

                <div className="field-group">
                  <label htmlFor="reg-email">Email Address</label>
                  <input
                    id="reg-email" name="email" type="email"
                    value={regForm.email} onChange={handleRegChange}
                    className={regErrors.email ? 'input-error' : ''}
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                  {regErrors.email && <span className="field-error">{regErrors.email}</span>}
                </div>

                <div className="field-group">
                  <label htmlFor="reg-password">Password</label>
                  <div className="pw-wrapper">
                    <input
                      id="reg-password" name="password"
                      type={showRegPw ? 'text' : 'password'}
                      value={regForm.password} onChange={handleRegChange}
                      className={regErrors.password ? 'input-error' : ''}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                    />
                    <button type="button" className="pw-toggle"
                      onClick={() => setShowRegPw(v => !v)} aria-label="Toggle password visibility">
                      {showRegPw ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {regErrors.password && <span className="field-error">{regErrors.password}</span>}
                </div>

                <div className="field-group">
                  <label htmlFor="reg-confirmPassword">Confirm Password</label>
                  <div className="pw-wrapper">
                    <input
                      id="reg-confirmPassword" name="confirmPassword"
                      type={showRegCPw ? 'text' : 'password'}
                      value={regForm.confirmPassword} onChange={handleRegChange}
                      className={regErrors.confirmPassword ? 'input-error' : ''}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                    />
                    <button type="button" className="pw-toggle"
                      onClick={() => setShowRegCPw(v => !v)} aria-label="Toggle confirm password visibility">
                      {showRegCPw ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {regErrors.confirmPassword && <span className="field-error">{regErrors.confirmPassword}</span>}
                </div>

                <button type="submit" className="btn-primary" disabled={regLoading}>
                  {regLoading ? <span className="btn-spinner" /> : null}
                  {regLoading ? 'Creating Account…' : 'Create Account'}
                </button>
              </form>

              <div className="divider"><span>or</span></div>

              <button type="button" className="btn-google" onClick={handleGoogleLogin}>
                <GoogleIcon />
                Sign up with Google
              </button>

              <p className="form-switch-text">
                Already have an account?{' '}
                <button className="text-link" onClick={() => setIsSignUp(false)}>Sign In</button>
              </p>
            </div>

          </div>{/* auth-panel-right */}
        </div>{/* auth-card */}
      </div>{/* auth-wrapper */}
    </div>
  );
};

/* ── Inline Google SVG icon ── */
const GoogleIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default AuthPage;
