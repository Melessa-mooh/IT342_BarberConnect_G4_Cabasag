import api from './api';

export interface AdminStats {
  totalRevenue: number;
  totalAppointments: number;
  activeBarbers: number;
  totalCustomers: number;
}

const adminService = {
  getDashboardStats: async (): Promise<AdminStats> => {
    const res = await api.get('/api/v1/admin/dashboard-stats');
    return res.data;
  }
};

export default adminService;
