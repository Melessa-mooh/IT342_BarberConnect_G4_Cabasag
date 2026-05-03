import api from './api';

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: string;
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
  profileImageUrl?: string;
  barberProfile?: {
    id: number;
    bio: string;
    yearsExperience: number;
    rating: string;
    totalReviews: number;
    profileImageUrl: string;
    gcashNumber?: string;
    isAvailable: boolean;
  };
}

export const authService = {
  /**
   * Register with email and password
   */
  async register(data: RegisterData): Promise<User> {
    try {
      const response = await api.post('/auth/register', data);
      const authResponse = response.data.data;

      // Store JWT token
      if (authResponse.token) {
        authService.setToken(authResponse.token);
      }

      return authResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  /**
   * Login with email and password
   */
  async login(data: LoginData): Promise<User> {
    try {
      const response = await api.post('/auth/login', data);
      const authResponse = response.data.data;

      // Store JWT token
      if (authResponse.token) {
        authService.setToken(authResponse.token);
      }

      return authResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  /**
   * Sign in with Google using Firebase popup.
   * Flow: Google Popup → Firebase idToken → POST /auth/firebase-login → JWT stored
   */
  async loginWithGoogle(): Promise<User> {
    try {
      const { auth } = await import('../assets/firebase/firebaseConfig');
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      // 1. Open Google sign-in popup
      const result = await signInWithPopup(auth, provider);

      // 2. Get Firebase ID token (not the Google OAuth token)
      const firebaseIdToken = await result.user.getIdToken();

      // 3. Exchange Firebase ID token for our backend JWT
      const response = await api.post('/auth/firebase-login', { idToken: firebaseIdToken });
      const authResponse = response.data.data;

      // 4. Store our JWT
      if (authResponse.token) {
        authService.setToken(authResponse.token);
      }

      return authResponse;
    } catch (error: any) {
      // User closed the popup — don't treat as fatal
      if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
        throw new Error('Google Sign-In was cancelled.');
      }
      throw new Error(error.response?.data?.error || error.message || 'Google Sign-In failed.');
    }
  },

  /**
   * Get current user from JWT token
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get('/auth/me');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get user data');
    }
  },

  /**
   * Upload user profile picture directly using multipart/form-data
   */
  async uploadProfileImage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/auth/profile/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to upload profile image');
    }
  },

  /**
   * Validate JWT token
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await api.post('/auth/validate');
      return response.data.data;
    } catch (error) {
      return false;
    }
  },

  /**
   * Store JWT token in localStorage
   */
  setToken(token: string): void {
    localStorage.setItem('jwt_token', token);
  },

  /**
   * Get JWT token from localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  },

  /**
   * Remove JWT token from localStorage
   */
  removeToken(): void {
    localStorage.removeItem('jwt_token');
  },

  /**
   * Logout user
   */
  logout(): void {
    authService.removeToken();
    window.location.href = '/';
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return authService.getToken() !== null;
  }
};
