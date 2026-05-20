import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import { appointmentService } from '../../services/appointmentService';

vi.mock('../../services/api');

/**
 * Frontend Unit Tests — Appointment Feature Slice
 * TC-FE-APT-01 through TC-FE-APT-03
 */
describe('Appointment Feature — appointmentService', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TC-FE-APT-01: getBarberAppointments() returns appointment array on success', async () => {
    // Arrange
    const mockAppointments = [
      { appointment_id: 'apt-001', status: 'PENDING', totalPrice: 350, barber_profile_id: 'b-001' },
      { appointment_id: 'apt-002', status: 'COMPLETED', totalPrice: 200, barber_profile_id: 'b-001' },
    ];
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { success: true, data: mockAppointments },
    } as any);

    // Act
    const result = await appointmentService.getBarberAppointments('b-001');

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].appointment_id).toBe('apt-001');
    expect(api.get).toHaveBeenCalledWith('/appointments/barber/b-001');
  });

  it('TC-FE-APT-02: getBarberAppointments() returns empty array when API returns empty data', async () => {
    // Arrange
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { success: true, data: [] },
    } as any);

    // Act
    const result = await appointmentService.getBarberAppointments('b-002');

    // Assert
    expect(result).toEqual([]);
  });

  it('TC-FE-APT-03: updateAppointmentStatus() calls correct endpoint', async () => {
    // Arrange — the service uses PUT, not PATCH
    vi.mocked(api.put).mockResolvedValueOnce({
      data: { success: true, data: { appointment_id: 'apt-001', status: 'CONFIRMED' } },
    } as any);

    // Act
    await appointmentService.updateAppointmentStatus('apt-001', 'CONFIRMED');

    // Assert
    expect(api.put).toHaveBeenCalledWith('/appointments/apt-001/status', { status: 'CONFIRMED' });
  });
});
