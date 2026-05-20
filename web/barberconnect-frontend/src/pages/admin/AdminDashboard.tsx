import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import adminService, { type AdminStats } from '../../services/adminService';
import { adminBarberService, type LeaveRequest, type AttendanceRecord } from '../../services/barberFeatureService';
import './AdminDashboard.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BarberForm {
  firstName: string; lastName: string;
  email: string; password: string; phoneNumber: string;
}
const emptyBarberForm: BarberForm = {
  firstName: '', lastName: '', email: '', password: '', phoneNumber: '',
};

type AdminPanel = 'overview' | 'users' | 'schedule' | 'leave';

// ─── Component ────────────────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activePanel, setActivePanel] = useState<AdminPanel>('overview');
  const [stats, setStats]             = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError]   = useState<string | null>(null);

  // ── User Management state ─────────────────────────────────────────────────
  const [barberForm, setBarberForm]   = useState<BarberForm>(emptyBarberForm);
  const [creating, setCreating]       = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // ── Attendance state ──────────────────────────────────────────────────────
  const [attendance, setAttendance]   = useState<AttendanceRecord[]>([]);
  const [attLoading, setAttLoading]   = useState(false);
  const [attError, setAttError]       = useState<string | null>(null);

  // ── Leave Requests state ──────────────────────────────────────────────────
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveLoading, setLeaveLoading]   = useState(false);
  const [leaveError, setLeaveError]       = useState<string | null>(null);
  const [resolvingId, setResolvingId]     = useState<string | null>(null);

  // ─── Stats on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await adminService.getDashboardStats();
        setStats(data);
      } catch {
        setStatsError('Using preview mode. Backend connection failed.');
        setStats({ totalRevenue: 0, totalAppointments: 0, activeBarbers: 0, totalCustomers: 0 });
      } finally {
        setStatsLoading(false);
      }
    })();
  }, []);

  // ─── Panel-specific data loading ─────────────────────────────────────────
  useEffect(() => {
    if (activePanel === 'schedule' && attendance.length === 0) fetchAttendance();
    if (activePanel === 'leave'    && leaveRequests.length === 0) fetchLeaveRequests();
  }, [activePanel]);

  const fetchAttendance = async () => {
    setAttLoading(true); setAttError(null);
    try { setAttendance(await adminBarberService.getTodayAttendance()); }
    catch (e: any) { setAttError(e.message || 'Failed to load attendance'); }
    finally { setAttLoading(false); }
  };

  const fetchLeaveRequests = async () => {
    setLeaveLoading(true); setLeaveError(null);
    try { setLeaveRequests(await adminBarberService.getPendingLeaveRequests()); }
    catch (e: any) { setLeaveError(e.message || 'Failed to load leave requests'); }
    finally { setLeaveLoading(false); }
  };

  // ─── Create Barber ────────────────────────────────────────────────────────
  const handleCreateBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true); setCreateError(null); setCreateSuccess(null);
    try {
      await adminBarberService.createBarber(barberForm);
      setCreateSuccess(`Barber account created for ${barberForm.email}`);
      setBarberForm(emptyBarberForm);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create barber account');
    } finally {
      setCreating(false);
    }
  };

  // ─── Approve / Decline leave ──────────────────────────────────────────────
  const handleResolveLeave = async (id: string, action: 'approve' | 'decline') => {
    setResolvingId(id);
    try {
      const updated = action === 'approve'
        ? await adminBarberService.approveLeaveRequest(id)
        : await adminBarberService.declineLeaveRequest(id);
      setLeaveRequests(prev => prev.filter(lr => lr.leaveRequestId !== updated.leaveRequestId));
    } catch (e: any) {
      alert(e.message || 'Action failed');
    } finally {
      setResolvingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  if (statsLoading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading Master Control…</p>
      </div>
    );
  }

  // ─── Sidebar nav items ────────────────────────────────────────────────────
  const navItems: { id: AdminPanel; label: string }[] = [
    { id: 'overview', label: 'Dashboard Overview' },
    { id: 'users',    label: 'User Management' },
    { id: 'schedule', label: 'Master Schedule' },
    { id: 'leave',    label: 'Leave Requests' },
  ];

  const attBadge = (status: string) => {
    if (status === 'WORKING')  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'ON_LEAVE') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-red-100 text-red-600 border-red-200';
  };

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>BarberConnect</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '4px' }}>Admin Portal</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item${activePanel === item.id ? ' active' : ''}`}
              onClick={() => setActivePanel(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>
              {user?.firstName} {user?.lastName}
            </p>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>{user?.email}</p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main-content">

        {/* ── Overview Panel ───────────────────────────────────────────── */}
        {activePanel === 'overview' && (
          <>
            <div className="admin-header">
              <h1>Executive Dashboard</h1>
              <p>Welcome back, Administrator. Here's what's happening at the shop today.</p>
              {statsError && (
                <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(239,68,68,0.2)', color: '#fca5a5', borderRadius: '4px', fontSize: '0.9rem' }}>
                  {statsError}
                </div>
              )}
            </div>
            <section className="stats-grid">
              <div className="stat-card">
                <span className="stat-title">Total Revenue (All Time)</span>
                <h3 className="stat-value revenue-value">₱{stats?.totalRevenue?.toLocaleString()}</h3>
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
            <section style={{ marginTop: '2rem' }}>
              <div style={{ background: 'rgba(30,41,59,0.5)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                Interactive Analytics Chart Component Coming Soon
              </div>
            </section>
          </>
        )}

        {/* ── User Management Panel ────────────────────────────────────── */}
        {activePanel === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="admin-header">
              <h1>User Management</h1>
              <p>Create and manage barber accounts for your shop.</p>
            </div>

            {/* Create Barber Form */}
            <div style={{ background: 'rgba(30,41,59,0.5)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 style={{ color: '#f4e4bc', fontWeight: 700, marginBottom: '1.25rem' }}>Create Barber Account</h3>

              {createError   && <div style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>⚠️ {createError}</div>}
              {createSuccess  && <div style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>✅ {createSuccess}</div>}

              <form onSubmit={handleCreateBarber} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { key: 'firstName',   label: 'First Name',    type: 'text',     placeholder: 'Juan' },
                  { key: 'lastName',    label: 'Last Name',     type: 'text',     placeholder: 'dela Cruz' },
                  { key: 'email',       label: 'Email',         type: 'email',    placeholder: 'barber@shop.com' },
                  { key: 'password',    label: 'Password',      type: 'password', placeholder: 'Min 6 characters' },
                  { key: 'phoneNumber', label: 'Phone Number',  type: 'text',     placeholder: '+639001234567' },
                ].map(field => (
                  <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', gridColumn: field.key === 'phoneNumber' ? 'span 2' : undefined }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{field.label}</label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={(barberForm as any)[field.key]}
                      onChange={e => setBarberForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      required={field.key !== 'phoneNumber'}
                      style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.65rem 0.9rem', color: '#e2e8f0', fontSize: '0.875rem' }}
                    />
                  </div>
                ))}
                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button
                    type="submit"
                    disabled={creating}
                    style={{ background: 'linear-gradient(135deg,#8B4513,#D2691E)', color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1 }}
                  >
                    {creating ? 'Creating…' : '✚ Create Barber Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Master Schedule / Attendance Panel ──────────────────────── */}
        {activePanel === 'schedule' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="admin-header">
              <h1>Master Schedule</h1>
              <p>Today's barber attendance at a glance.</p>
              <button
                onClick={fetchAttendance}
                style={{ marginTop: '0.75rem', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', padding: '0.45rem 1rem', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                🔄 Refresh
              </button>
            </div>

            {attLoading && <p style={{ color: '#94a3b8' }}>Loading attendance…</p>}
            {attError   && <p style={{ color: '#fca5a5' }}>{attError}</p>}

            {!attLoading && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
                {attendance.length === 0 && (
                  <p style={{ color: '#64748b', gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
                    No active barbers found.
                  </p>
                )}
                {attendance.map(rec => (
                  <div key={rec.userId} style={{ background: 'rgba(30,41,59,0.55)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#1e293b', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#f4e4bc', fontSize: '1.1rem', flexShrink: 0 }}>
                      {(rec.firstName ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, color: '#e2e8f0', margin: 0, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {rec.firstName} {rec.lastName}
                      </p>
                      <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '2px 0 0' }}>{rec.userId}</p>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.45rem 1rem', borderRadius: '20px', border: '1px solid', whiteSpace: 'nowrap', letterSpacing: '0.05em' }}
                      className={attBadge(rec.attendanceStatus)}>
                      {rec.attendanceStatus.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Leave Requests Panel ─────────────────────────────────────── */}
        {activePanel === 'leave' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="admin-header">
              <h1>Leave Requests</h1>
              <p>Review and action pending barber leave requests.</p>
              <button
                onClick={fetchLeaveRequests}
                style={{ marginTop: '0.75rem', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', padding: '0.45rem 1rem', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                🔄 Refresh
              </button>
            </div>

            {leaveLoading && <p style={{ color: '#94a3b8' }}>Loading leave requests…</p>}
            {leaveError   && <p style={{ color: '#fca5a5' }}>{leaveError}</p>}

            {!leaveLoading && leaveRequests.length === 0 && (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '3rem' }}>No pending leave requests. 🎉</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {leaveRequests.map(lr => (
                <div key={lr.leaveRequestId} style={{ background: 'rgba(30,41,59,0.55)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.9rem', margin: 0 }}>
                      📅 {lr.requestedDate}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '4px 0 0' }}>
                      {lr.reason || 'No reason provided'}
                    </p>
                    <p style={{ color: '#475569', fontSize: '0.72rem', margin: '4px 0 0' }}>
                      Barber: {lr.barberProfileId}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                    <button
                      onClick={() => handleResolveLeave(lr.leaveRequestId, 'approve')}
                      disabled={resolvingId === lr.leaveRequestId}
                      style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)', padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', opacity: resolvingId === lr.leaveRequestId ? 0.6 : 1 }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleResolveLeave(lr.leaveRequestId, 'decline')}
                      disabled={resolvingId === lr.leaveRequestId}
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', opacity: resolvingId === lr.leaveRequestId ? 0.6 : 1 }}
                    >
                      ✕ Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;
