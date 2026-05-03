import api from './api';

export interface HaircutStyle {
  haircut_style_id: string;
  barber_profile_id: string;
  name: string;
  description: string;
  basePrice: number;
  durationMinutes: number;
  imageUrl: string;
  isActive: boolean;
}

export const haircutStyleService = {
  getHaircutStylesForBarber: async (barberProfileId: string): Promise<HaircutStyle[]> => {
    try {
      const response = await api.get<{ success: boolean; data: HaircutStyle[] }>(`/haircuts/barber/${barberProfileId}`);
      if (!response.data.success) throw new Error('Failed to fetch haircut styles');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch haircut styles');
    }
  }
};
