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
}

export const appointmentService = {
  bookAppointment: async (request: CreateAppointmentRequest): Promise<Appointment> => {
    try {
      const response = await api.post<Appointment>('/appointments/book', request);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to book appointment');
    }
  },

  getCustomerAppointments: async (customerId: string): Promise<Appointment[]> => {
    try {
      const response = await api.get<Appointment[]>(`/appointments/customer/${customerId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch appointments');
    }
  }
};
