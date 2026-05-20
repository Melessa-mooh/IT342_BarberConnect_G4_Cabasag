import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appointmentService } from '../services/appointmentService';

vi.mock('../services/api', () => {
  const mockApi = {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
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
  put: ReturnType<typeof vi.fn>;
};

const mockAppointment = {
  appointment_id: 'appt-001',
  customer_id: 'cust-001',
  barber_profile_id: 'barber-001',
  haircut_style_id: 'style-001',
  appointmentDateTime: '2025-06-15T10:00:00Z',
  durationMinutes: 30,
  totalPrice: 350,
  status: 'PENDING',
  paymentMethod: 'CASH',
  paymentStatus: 'PENDING',
  selectedOptionIds: [],
};

beforeEach(() => vi.clearAllMocks());

describe('appointmentService', () => {
  describe('bookAppointment()', () => {
    it('returns the created appointment on success', async () => {
      mockApi.post.mockResolvedValueOnce({ data: { data: mockAppointment } });

      const result = await appointmentService.bookAppointment({
        customerId: 'cust-001',
        barberProfileId: 'barber-001',
        haircutStyleId: 'style-001',
        appointmentDateTime: '2025-06-15T10:00:00Z',
        totalPrice: 350,
        paymentMethod: 'CASH',
      });

      expect(result.appointment_id).toBe('appt-001');
      expect(result.status).toBe('PENDING');
    });

    it('throws on API error', async () => {
      mockApi.post.mockRejectedValueOnce({
        response: { data: { message: 'Barber is on leave' } },
      });

      await expect(
        appointmentService.bookAppointment({
          customerId: 'c1',
          barberProfileId: 'b1',
          haircutStyleId: 's1',
          appointmentDateTime: '2025-06-15T10:00:00Z',
          totalPrice: 200,
          paymentMethod: 'CASH',
        })
      ).rejects.toThrow('Barber is on leave');
    });
  });

  describe('getCustomerAppointments()', () => {
    it('returns a list of appointments for the customer', async () => {
      mockApi.get.mockResolvedValueOnce({ data: { data: [mockAppointment] } });

      const result = await appointmentService.getCustomerAppointments('cust-001');
      expect(result).toHaveLength(1);
      expect(result[0].customer_id).toBe('cust-001');
    });

    it('returns an empty array when data is null/undefined', async () => {
      mockApi.get.mockResolvedValueOnce({ data: { data: null } });

      const result = await appointmentService.getCustomerAppointments('cust-001');
      expect(result).toEqual([]);
    });
  });

  describe('getBarberAppointments()', () => {
    it('returns appointments for the barber', async () => {
      mockApi.get.mockResolvedValueOnce({ data: { data: [mockAppointment] } });

      const result = await appointmentService.getBarberAppointments('barber-001');
      expect(result[0].barber_profile_id).toBe('barber-001');
    });
  });

  describe('completeAppointment()', () => {
    it('returns the completed appointment', async () => {
      const completed = { ...mockAppointment, status: 'COMPLETED' };
      mockApi.put.mockResolvedValueOnce({ data: { data: completed } });

      const result = await appointmentService.completeAppointment('appt-001');
      expect(result.status).toBe('COMPLETED');
    });
  });
});
