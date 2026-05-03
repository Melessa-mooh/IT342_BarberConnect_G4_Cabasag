import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import { haircutStyleService } from '../../services/haircutStyleService';

vi.mock('../../services/api');

/**
 * Frontend Unit Tests — Catalog Feature Slice
 * TC-FE-CAT-01 through TC-FE-CAT-02
 */
describe('Catalog Feature — haircutStyleService', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TC-FE-CAT-01: getHaircutStylesForBarber() returns parsed style array', async () => {
    // Arrange
    const mockStyles = [
      { haircut_style_id: 'style-001', name: 'Fade', basePrice: 250, durationMinutes: 30 },
      { haircut_style_id: 'style-002', name: 'Pompadour', basePrice: 350, durationMinutes: 45 },
    ];
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { success: true, data: mockStyles },
    } as any);

    // Act
    const result = await haircutStyleService.getHaircutStylesForBarber('barber-001');

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Fade');
    expect(api.get).toHaveBeenCalledWith('/haircuts/barber/barber-001');
  });

  it('TC-FE-CAT-02: getHaircutStylesForBarber() returns empty array for no styles', async () => {
    // Arrange
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { success: true, data: [] },
    } as any);

    // Act
    const result = await haircutStyleService.getHaircutStylesForBarber('new-barber');

    // Assert
    expect(result).toEqual([]);
  });
});
