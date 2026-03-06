import api from './api';

export interface Barber {
  id: number;
  bio: string;
  yearsExperience: number;
  rating: string;
  totalReviews: number;
  profileImageUrl: string;
  isAvailable: boolean;
}

export const barberService = {
  async getAvailableBarbers(): Promise<Barber[]> {
    try {
      const response = await api.get('/barbers/public/available');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch barbers');
    }
  },

  async getBarberById(id: number): Promise<Barber> {
    try {
      const response = await api.get(`/barbers/public/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch barber');
    }
  }
};