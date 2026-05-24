import api from './api';

export interface AdminStats {
  totalRevenue: number;
  totalAppointments: number;
  activeBarbers: number;
  totalCustomers: number;
  registeredCustomers?: number;
  completedAppointments?: number;
  pendingAppointments?: number;
  cancelledAppointments?: number;
  paidAppointments?: number;
  generatedAt?: string;
}

const adminService = {
  getDashboardStats: async (): Promise<AdminStats> => {
    const res = await api.get('/admin/dashboard-stats');
    // Backend wraps stats in ApiResponse<T> → unwrap .data.data
    // Fall back to res.data if the wrapper is absent (e.g. direct Map response)
    return (res.data?.data ?? res.data) as AdminStats;
  }
};

export { adminService };
export default adminService;
