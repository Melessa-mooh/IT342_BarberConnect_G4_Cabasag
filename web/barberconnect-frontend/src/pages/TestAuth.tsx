import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const TestAuth: React.FC = () => {
  const { registerWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testGoogleAuth = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setLogs([]);
    
    try {
      addLog('Starting Google authentication...');
      const result = await registerWithGoogle('CUSTOMER');
      addLog('Google auth successful: ' + JSON.stringify(result, null, 2));
      setSuccess('Google authentication successful!');
    } catch (err: any) {
      addLog('Google auth error: ' + err.message);
      console.error('Google auth error:', err);
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const testBackendConnection = async () => {
    setLogs([]);
    addLog('Testing backend connection...');
    addLog('API Base URL: ' + import.meta.env.VITE_API_BASE_URL);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: 'test-token' })
      });
      
      addLog('Response status: ' + response.status);
      const data = await response.json();
      addLog('Response data: ' + JSON.stringify(data));
      
      if (response.ok) {
        addLog('Backend connection successful');
      } else {
        addLog('Backend returned error but connection works');
      }
    } catch (err: any) {
      addLog('Backend connection failed: ' + err.message);
    }
  };

  const testLoginEndpoint = async () => {
    setLogs([]);
    addLog('Testing login endpoint with fake token...');
    addLog('API Base URL: ' + import.meta.env.VITE_API_BASE_URL);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: 'fake-token-for-testing' })
      });
      
      addLog('Response status: ' + response.status);
      const data = await response.json();
      addLog('Response data: ' + JSON.stringify(data));
    } catch (err: any) {
      addLog('Login endpoint error: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Google Auth Test</h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={testGoogleAuth}
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#4285F4',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test Google Auth'}
        </button>

        <button 
          onClick={testBackendConnection}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#34A853',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Backend
        </button>

        <button 
          onClick={testLoginEndpoint}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#EA4335',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Login Endpoint
        </button>
      </div>

      {error && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: '#ffebee', 
          color: '#c62828',
          borderRadius: '5px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: '#e8f5e8', 
          color: '#2e7d32',
          borderRadius: '5px'
        }}>
          <strong>Success:</strong> {success}
        </div>
      )}

      {logs.length > 0 && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          <strong>Logs:</strong>
          {logs.map((log, index) => (
            <div key={index} style={{ marginTop: '5px' }}>{log}</div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>Frontend:</strong> http://localhost:5175</p>
        <p><strong>Backend:</strong> http://localhost:8080/api/v1</p>
        <p><strong>Firebase Project:</strong> barberconnect-db</p>
      </div>
    </div>
  );
};

export default TestAuth;