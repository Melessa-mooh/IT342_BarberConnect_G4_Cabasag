import api from './api';

export interface CreateAppointmentPayload {
  customerId: string;
  barberProfileId: string;
  haircutStyleId: string;
  appointmentDateTime: string; // ISO-8601
  totalPrice: number;
  paymentMethod: string;
  selectedOptionIds: string[];
}

export const appointmentService = {
  createAppointment: async (data: CreateAppointmentPayload) => {
    const response = await api.post('/appointments/book', data);
    return response.data;
  },

  getAppointmentsByCustomer: async (customerId: string) => {
    const response = await api.get(`/appointments/customer/${customerId}`);
    return response.data;
  }
};
