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
      // FIX: Add ?? [] guard
      return response.data.data ?? [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch haircut styles');
    }
  },

  createHaircutStyle: async (data: FormData): Promise<HaircutStyle> => {
    try {
      const response = await api.post<{ success: boolean; data: HaircutStyle }>('/haircuts', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (!response.data.success) throw new Error('Failed to create haircut style');
      // FIX: Log the full response to confirm object shape
      console.log('createHaircutStyle response:', response.data.data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create haircut style');
    }
  },

  // FIX: Add updateHaircutStyle method
  updateHaircutStyle: async (haircutStyleId: string, data: {
    name?: string;
    description?: string;
    basePrice?: number;
    durationMinutes?: number;
  }): Promise<HaircutStyle> => {
    const response = await api.put<{ success: boolean; data: HaircutStyle }>(
      `/haircuts/${haircutStyleId}`, data
    );
    if (!response.data.success) throw new Error('Failed to update haircut style');
    return response.data.data;
  },

  // FIX: Add deleteHaircutStyle method
  deleteHaircutStyle: async (haircutStyleId: string): Promise<void> => {
    const response = await api.delete<{ success: boolean }>(
      `/haircuts/${haircutStyleId}`
    );
    if (!response.data.success) throw new Error('Failed to delete haircut style');
  }
};
