import { describe, it, expect, vi, beforeEach } from 'vitest';
import adminService from '../services/adminService';

vi.mock('../services/api', () => {
  const mockApi = {
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return { default: mockApi };
});

import api from '../services/api';
const mockApi = api as unknown as { get: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

describe('adminService', () => {
  describe('getDashboardStats()', () => {
    it('unwraps ApiResponse wrapper (res.data.data) correctly', async () => {
      const stats = {
        totalRevenue: 12500,
        totalAppointments: 42,
        activeBarbers: 3,
        totalCustomers: 18,
      };
      // Backend wraps in ApiResponse<T>: { success: true, data: stats }
      mockApi.get.mockResolvedValueOnce({ data: { success: true, data: stats } });

      const result = await adminService.getDashboardStats();

      expect(result.totalRevenue).toBe(12500);
      expect(result.totalAppointments).toBe(42);
      expect(result.activeBarbers).toBe(3);
      expect(result.totalCustomers).toBe(18);
    });

    it('falls back to res.data when wrapper is absent (direct Map response)', async () => {
      const stats = {
        totalRevenue: 0,
        totalAppointments: 0,
        activeBarbers: 0,
        totalCustomers: 0,
      };
      // AdminController returns ResponseEntity<Map<String,Object>> directly
      mockApi.get.mockResolvedValueOnce({ data: stats });

      const result = await adminService.getDashboardStats();

      expect(result.totalRevenue).toBe(0);
    });

    it('propagates errors thrown by the API', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(adminService.getDashboardStats()).rejects.toThrow('Network error');
    });
  });
});
