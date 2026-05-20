import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from '../services/authService';

// ── Mock the api module ───────────────────────────────────────────────────────
vi.mock('../services/api', () => {
  const mockApi = {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return { default: mockApi };
});

import api from '../services/api';
const mockApi = api as unknown as {
  post: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const mockUser = {
  firebaseUid: 'uid-001',
  firstName: 'Juan',
  lastName: 'dela Cruz',
  email: 'juan@test.com',
  phoneNumber: '',
  role: 'CUSTOMER' as const,
  isActive: true,
  token: 'mocked.jwt.token',
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  localStorage.clear();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('authService', () => {
  describe('login()', () => {
    it('stores the JWT token and returns the user on success', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: { data: mockUser },
      });

      const result = await authService.login({ email: 'juan@test.com', password: 'password123' });

      expect(result.email).toBe('juan@test.com');
      expect(localStorage.getItem('jwt_token')).toBe('mocked.jwt.token');
    });

    it('throws an error when the backend returns an error message', async () => {
      mockApi.post.mockRejectedValueOnce({
        response: { data: { error: 'Invalid email or password' } },
      });

      await expect(
        authService.login({ email: 'bad@test.com', password: 'wrong' })
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('register()', () => {
    it('stores the JWT token and returns the user on success', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: { data: mockUser },
      });

      const result = await authService.register({
        firstName: 'Juan',
        lastName: 'dela Cruz',
        email: 'juan@test.com',
        password: 'password123',
      });

      expect(result.email).toBe('juan@test.com');
      expect(localStorage.getItem('jwt_token')).toBe('mocked.jwt.token');
    });
  });

  describe('getCurrentUser()', () => {
    it('returns the current user from /auth/me', async () => {
      mockApi.get.mockResolvedValueOnce({ data: { data: mockUser } });

      const result = await authService.getCurrentUser();
      expect(result.firebaseUid).toBe('uid-001');
    });

    it('throws when the request fails', async () => {
      mockApi.get.mockRejectedValueOnce({
        response: { data: { error: 'Unauthorized' } },
      });

      await expect(authService.getCurrentUser()).rejects.toThrow('Unauthorized');
    });
  });

  describe('token helpers', () => {
    it('setToken / getToken / removeToken round-trip', () => {
      authService.setToken('test-token');
      expect(authService.getToken()).toBe('test-token');
      authService.removeToken();
      expect(authService.getToken()).toBeNull();
    });

    it('isAuthenticated() returns true when a token is stored', () => {
      authService.setToken('some-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('isAuthenticated() returns false when no token is stored', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });
});
