import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api/v1/admin';

// Set up Axios instance with auth interceptor
const instance = axios.create({
    baseURL: BASE_URL
});

instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export interface AdminStats {
    totalRevenue: number;
    totalAppointments: number;
    activeBarbers: number;
    totalCustomers: number;
}

const adminService = {
    getDashboardStats: async (): Promise<AdminStats> => {
        try {
            const response = await instance.get<AdminStats>('/dashboard-stats');
            return response.data;
        } catch (error) {
            console.error('Error fetching admin stats:', error);
            throw error;
        }
    }
};

export default adminService;
