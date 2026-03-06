import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/api';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/auth/login', {
        email,
        password,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">🚀</div>
          <h1>BarberConnect</h1>
          <p>Modern Barbershop Management</p>
        </div>

        <div className="login-form">
          <h2>Welcome Back</h2>
          <p className="login-subtitle">Sign in to continue to your account</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <span className="icon">✉️</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <small>Use "customer@test.com", "barber@test.com", or your registered email</small>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <span className="icon">🔒</span>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                Remember me
              </label>
              <a href="#forgot" className="forgot-password">Forgot Password?</a>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            <p>Don't have an account? <a href="/register">Sign Up</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
