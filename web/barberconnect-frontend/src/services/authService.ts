import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../assets/firebase/firebaseConfig';
import api from './api';

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: 'CUSTOMER' | 'BARBER';
  bio?: string;
  yearsExperience?: number;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  firebaseUid: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: 'CUSTOMER' | 'BARBER' | 'ADMIN';
  isActive: boolean;
  barberProfile?: {
    id: number;
    bio: string;
    yearsExperience: number;
    rating: string;
    totalReviews: number;
    profileImageUrl: string;
    isAvailable: boolean;
  };
}

export const authService = {
  async register(data: RegisterData): Promise<User> {
    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        data.email, 
        data.password
      );
      
      // Register with backend
      const response = await api.post('/auth/register', {
        firebaseUid: userCredential.user.uid,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        role: data.role,
        bio: data.bio,
        yearsExperience: data.yearsExperience
      });
      
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  async login(data: LoginData): Promise<User> {
    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        data.email, 
        data.password
      );
      
      // Get Firebase ID token
      const idToken = await userCredential.user.getIdToken();
      
      // Login with backend using fetch to avoid interceptor conflicts
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      const responseData = await response.json();
      return responseData.data;
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  },

  async signInWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      // Sign in with Google popup
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Get Firebase ID token
      const idToken = await user.getIdToken();
      
      // Use the new Google auth endpoint (defaults to CUSTOMER role)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          role: 'CUSTOMER'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Google sign-in failed');
      }
      
      const responseData = await response.json();
      return responseData.data;
    } catch (error: any) {
      throw new Error(error.message || 'Google sign-in failed');
    }
  },

  async registerWithGoogle(role: 'CUSTOMER' | 'BARBER'): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      // Sign in with Google popup
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Get Firebase ID token
      const idToken = await user.getIdToken();
      
      // Use the new Google auth endpoint with specified role
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          role: role
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Google authentication failed');
      }
      
      const responseData = await response.json();
      return responseData.data;
    } catch (error: any) {
      throw new Error(error.message || 'Google authentication failed');
    }
  },

  async updateProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    bio?: string;
    yearsExperience?: number;
    profileImageUrl?: string;
    isAvailable?: boolean;
  }): Promise<User> {
    try {
      const response = await api.put(`/auth/profile/${userId}`, data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }
};