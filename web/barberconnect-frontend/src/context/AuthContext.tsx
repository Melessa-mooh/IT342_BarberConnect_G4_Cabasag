import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../assets/firebase/firebaseConfig';
import { authService } from '../services/authService';
import api from '../services/api';
import type { User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  registerWithGoogle: (role: 'CUSTOMER' | 'BARBER') => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            // For Firebase users, we need to get their data from our backend
            const idToken = await firebaseUser.getIdToken();
            
            try {
              // Create a direct axios call without the interceptor to avoid conflicts
              const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken })
              });
              
              if (response.ok) {
                const data = await response.json();
                setUser(data.data);
              } else {
                // User not found in backend, this is normal for new Google users
                console.log('User not found in backend, this is normal for new Google users');
                setUser(null);
              }
            } catch (error: any) {
              // If login fails, user might not exist in our backend
              console.log('User not found in backend, this is normal for new Google users');
              setUser(null);
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Failed to process Firebase user:', error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Firebase initialization error:', error);
      setError('Failed to initialize authentication');
      setLoading(false);
    }
  }, []);

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h1>BarberConnect</h1>
        <p>Authentication Error: {error}</p>
        <p>Please check your Firebase configuration.</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  const login = async (email: string, password: string) => {
    const userData = await authService.login({ email, password });
    setUser(userData);
  };

  const register = async (data: any) => {
    const userData = await authService.register(data);
    setUser(userData);
  };

  const signInWithGoogle = async () => {
    const userData = await authService.signInWithGoogle();
    setUser(userData);
  };

  const registerWithGoogle = async (role: 'CUSTOMER' | 'BARBER') => {
    const userData = await authService.registerWithGoogle(role);
    setUser(userData);
  };

  const updateProfile = async (data: any) => {
    if (!user) throw new Error('No user logged in');
    const updatedUser = await authService.updateProfile(user.firebaseUid, data);
    setUser(updatedUser);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    signInWithGoogle,
    registerWithGoogle,
    updateProfile,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};