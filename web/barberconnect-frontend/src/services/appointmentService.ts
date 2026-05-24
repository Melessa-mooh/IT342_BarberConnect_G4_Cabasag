import api from './api';

export interface CreateAppointmentRequest {
  customerId: string;
  barberProfileId: string;
  haircutStyleId: string;
  appointmentDateTime: string; // ISO 8601 string
  totalPrice: number;
  paymentMethod: string;
  selectedOptionIds?: string[];
}

export interface Appointment {
  appointment_id: string;
  customer_id: string;
  barber_profile_id: string;
  haircut_style_id: string;
  appointmentDateTime: string;
  durationMinutes: number;
  totalPrice: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  selectedOptionIds: string[];
  customerFullName?: string;
  customerProfileImageUrl?: string | null;
  barberFullName?: string;
  barberProfileImageUrl?: string | null;
  serviceName?: string;
}

export const appointmentService = {
  bookAppointment: async (request: CreateAppointmentRequest): Promise<Appointment> => {
    try {
      const response = await api.post<{ success: boolean; data: Appointment; error: string | null }>('/appointments/book', request);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to book appointment');
    }
  },

  getCustomerAppointments: async (customerId: string): Promise<Appointment[]> => {
    try {
      const response = await api.get<{ success: boolean; data: Appointment[]; error: string | null }>(`/appointments/customer/${customerId}`);
      // FIX: Add ?? [] guard
      return response.data.data ?? [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch appointments');
    }
  },

  getBarberAppointments: async (barberProfileId: string): Promise<Appointment[]> => {
    try {
      const response = await api.get<{ success: boolean; data: Appointment[]; error: string | null }>(`/appointments/barber/${barberProfileId}`);
      // FIX: Add ?? [] guard
      return response.data.data ?? [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch appointments');
    }
  },

  updateAppointmentStatus: async (appointmentId: string, status: string): Promise<Appointment> => {
    try {
      const response = await api.put<{ success: boolean; data: Appointment; error: string | null }>(`/appointments/${appointmentId}/status`, { status });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update appointment status');
    }
  },

  completeAppointment: async (appointmentId: string): Promise<Appointment> => {
    try {
      const response = await api.put<{ success: boolean; data: Appointment; error: string | null }>(`/appointments/${appointmentId}/complete`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to complete appointment');
    }
  },

  cancelAppointment: async (appointmentId: string): Promise<Appointment> => {
    try {
      const response = await api.put<{ success: boolean; data: Appointment; error: string | null }>(`/appointments/${appointmentId}/cancel`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to cancel appointment');
    }
  },

  markNoShow: async (appointmentId: string): Promise<Appointment> => {
    try {
      const response = await api.put<{ success: boolean; data: Appointment; error: string | null }>(`/appointments/${appointmentId}/no-show`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to mark no-show');
    }
  }
};
