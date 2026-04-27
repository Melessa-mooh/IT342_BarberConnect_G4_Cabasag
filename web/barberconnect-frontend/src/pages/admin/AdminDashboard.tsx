import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import adminService, { type AdminStats } from '../../services/adminService';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await adminService.getDashboardStats();
                setStats(data);
            } catch (err) {
                console.error("Failed to load admin stats", err);
                // We'll show mock data if the backend isn't ready yet for seamless rapid development
                setError("Using preview mode. Backend connection failed.");
                setStats({
                    totalRevenue: 24500,
                    totalAppointments: 142,
                    activeBarbers: 8,
                    totalCustomers: 500
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/', { replace: true });
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading Master Control...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-container">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <h2>BarberConnect</h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '4px' }}>Admin Portal</p>
                </div>

                <nav className="sidebar-nav">
                    <button className="nav-item active">Dashboard Overview</button>
                    <button className="nav-item">User Management</button>
                    <button className="nav-item">Master Schedule</button>
                    <button className="nav-item">Services & Pricing</button>
                    <button className="nav-item">System Settings</button>
                </nav>

                <div className="sidebar-footer">
                    <div style={{ marginBottom: '1rem' }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{user?.firstName} {user?.lastName}</p>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>{user?.email}</p>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main-content">
                <div className="admin-header">
                    <h1>Executive Dashboard</h1>
                    <p>Welcome back, Administrator. Here's what's happening at the shop today.</p>
                    {error && <div style={{marginTop: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderRadius: '4px', fontSize: '0.9rem'}}>
                        {error}
                    </div>}
                </div>

                <section className="stats-grid">
                    <div className="stat-card">
                        <span className="stat-title">Total Revenue (All Time)</span>
                        <h3 className="stat-value revenue-value">
                            ₱{stats?.totalRevenue.toLocaleString()}
                        </h3>
                    </div>
                    <div className="stat-card">
                        <span className="stat-title">Total Appointments</span>
                        <h3 className="stat-value">{stats?.totalAppointments}</h3>
                    </div>
                    <div className="stat-card">
                        <span className="stat-title">Active Barbers</span>
                        <h3 className="stat-value">{stats?.activeBarbers}</h3>
                    </div>
                    <div className="stat-card">
                        <span className="stat-title">Registered Customers</span>
                        <h3 className="stat-value">{stats?.totalCustomers}</h3>
                    </div>
                </section>
                
                <section style={{marginTop: '2rem'}}>
                    {/* Placeholder for future charts or tables */}
                    <div style={{background: 'rgba(30, 41, 59, 0.5)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8'}}>
                        Interactive Analytics Chart Component Coming Soon
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AdminDashboard;
