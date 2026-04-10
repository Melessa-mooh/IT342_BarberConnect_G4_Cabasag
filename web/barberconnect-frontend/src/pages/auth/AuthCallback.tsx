import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const success = searchParams.get('success');
      const token = searchParams.get('token');
      const errorMsg = searchParams.get('error');

      if (success === 'true' && token) {
        // Store JWT token
        authService.setToken(token);
        
        try {
          // We don't need to load user data manually here, refreshUser handles it
          // Update the global AuthContext so the user is not null
          if (refreshUser) {
            await refreshUser();
          }
          
          // Dashboard routes are dynamically resolved in AppRoutes
          navigate('/dashboard');
        } catch (err: any) {
          setError('Failed to load user data. Please try again.');
          setTimeout(() => navigate('/'), 3000);
        }
      } else {
        setError(errorMsg || 'Authentication failed. Please try again.');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        {error ? (
          <>
            <div style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 20px',
              borderRadius: '50%',
              background: '#fee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px',
              color: '#c33'
            }}>
              ✕
            </div>
            <h2 style={{ color: '#c33', marginBottom: '10px' }}>Authentication Failed</h2>
            <p style={{ color: '#666' }}>{error}</p>
            <p style={{ color: '#999', fontSize: '14px', marginTop: '20px' }}>
              Redirecting to home page...
            </p>
          </>
        ) : (
          <>
            <div style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 20px',
              border: '4px solid #8B4513',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <h2 style={{ color: '#8B4513', marginBottom: '10px' }}>Completing Sign In</h2>
            <p style={{ color: '#666' }}>Please wait while we set up your account...</p>
          </>
        )}
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthCallback;
