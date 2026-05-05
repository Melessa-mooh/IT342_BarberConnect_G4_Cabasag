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
    id: string;       // Firebase UID string returned by BarberProfileResponse
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
   * Sign in with Google using Spring Boot OAuth2.
   * Flow: Redirect to backend OAuth2 endpoint → Google login → Callback with JWT
   */
  async loginWithGoogle(): Promise<void> {
    // Redirect to Spring Boot OAuth2 endpoint
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
    window.location.href = `${backendUrl}/oauth2/authorization/google`;
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
