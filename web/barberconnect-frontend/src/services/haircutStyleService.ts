import api from './api';
import axios from 'axios';

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

export interface StyleOption {
  style_option_id: string;
  haircut_style_id: string;
  name: string;
  description: string;
  additionalPrice: number;
  additionalTimeMinutes: number;
  isActive: boolean;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

/** Surface the actual backend error message instead of a generic string */
function extractError(error: any, fallback: string): string {
  // Axios error with a response body
  const msg =
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    fallback;
  return msg;
}

export const haircutStyleService = {
  /** GET /haircuts/barber/:barberProfileId */
  getHaircutStylesForBarber: async (barberProfileId: string): Promise<HaircutStyle[]> => {
    console.log('[haircutStyleService] GET /haircuts/barber/' + barberProfileId);
    try {
      const response = await api.get<{ success: boolean; data: HaircutStyle[] }>(
        `/haircuts/barber/${barberProfileId}`
      );
      if (!response.data.success) throw new Error('Server returned success=false');
      return response.data.data ?? [];
    } catch (error: any) {
      const msg = extractError(error, 'Failed to fetch haircut styles');
      console.error('[haircutStyleService] getHaircutStylesForBarber error:', msg, error);
      throw new Error(msg);
    }
  },

  /** GET /haircuts/:haircutStyleId/options - Fetch style options for a specific haircut */
  getStyleOptionsForHaircut: async (haircutStyleId: string): Promise<StyleOption[]> => {
    console.log('[haircutStyleService] GET /haircuts/' + haircutStyleId + '/options');
    try {
      const response = await api.get<{ success: boolean; data: StyleOption[] }>(
        `/haircuts/${haircutStyleId}/options`
      );
      if (!response.data.success) throw new Error('Server returned success=false');
      return response.data.data ?? [];
    } catch (error: any) {
      const msg = extractError(error, 'Failed to fetch style options');
      console.error('[haircutStyleService] getStyleOptionsForHaircut error:', msg, error);
      throw new Error(msg);
    }
  },

  /** POST /haircuts  (multipart/form-data — uses raw axios so the browser sets boundary) */
  createHaircutStyle: async (data: FormData): Promise<HaircutStyle> => {
    console.log('[haircutStyleService] POST /haircuts');
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await axios.post<{ success: boolean; data: HaircutStyle }>(
        `${BASE_URL}/haircuts`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.data.success) throw new Error('Server returned success=false on create');
      console.log('[haircutStyleService] createHaircutStyle OK:', response.data.data);
      return response.data.data;
    } catch (error: any) {
      const msg = extractError(error, 'Failed to create haircut style');
      console.error('[haircutStyleService] createHaircutStyle error:', msg, error);
      throw new Error(msg);
    }
  },

  /** PUT /haircuts/:id  (JSON body — regular api instance is fine) */
  updateHaircutStyle: async (
    haircutStyleId: string,
    data: { name?: string; description?: string; basePrice?: number; durationMinutes?: number }
  ): Promise<HaircutStyle> => {
    try {
      const response = await api.put<{ success: boolean; data: HaircutStyle }>(
        `/haircuts/${haircutStyleId}`,
        data
      );
      if (!response.data.success) throw new Error('Server returned success=false on update');
      return response.data.data;
    } catch (error: any) {
      throw new Error(extractError(error, 'Failed to update haircut style'));
    }
  },

  /** DELETE /haircuts/:id */
  deleteHaircutStyle: async (haircutStyleId: string): Promise<void> => {
    try {
      const response = await api.delete<{ success: boolean }>(`/haircuts/${haircutStyleId}`);
      if (!response.data.success) throw new Error('Server returned success=false on delete');
    } catch (error: any) {
      throw new Error(extractError(error, 'Failed to delete haircut style'));
    }
  },
};
