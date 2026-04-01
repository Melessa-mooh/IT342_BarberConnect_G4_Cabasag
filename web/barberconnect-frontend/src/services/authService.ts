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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
   * Redirect to Google OAuth2 login
   */
  loginWithGoogle(): void {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
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
