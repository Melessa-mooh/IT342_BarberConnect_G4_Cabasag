import api from './api';

export interface Barber {
  id: string;
  firstName?: string;
  lastName?: string;
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

  async getBarberById(id: string): Promise<Barber> {
    try {
      const response = await api.get(`/barbers/public/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch barber');
    }
  },

  async updateProfile(userId: string, data: any): Promise<Barber> {
    try {
      const response = await api.put(`/barbers/${userId}/profile`, data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update profile');
    }
  }
};