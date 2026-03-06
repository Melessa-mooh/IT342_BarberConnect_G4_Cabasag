import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    fetchAppointments(userData?.userId);
  }, []);

  const fetchAppointments = async (userId) => {
    try {
      const response = await axiosInstance.get(`/appointments?userId=${userId}`);
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>BarberConnect</h1>
          <div className="user-menu">
            <span>Welcome, {user.firstname}!</span>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-section">
          <h2>Your Appointments</h2>
          
          {loading ? (
            <div className="loading">Loading appointments...</div>
          ) : appointments.length > 0 ? (
            <div className="appointments-list">
              {appointments.map((apt) => (
                <div key={apt.appointmentId} className="appointment-item">
                  <div className="apt-date">
                    📅 {new Date(apt.dateTime).toLocaleDateString()}
                  </div>
                  <div className="apt-time">
                    🕐 {new Date(apt.dateTime).toLocaleTimeString()}
                  </div>
                  <div className="apt-price">
                    ${apt.totalPrice}
                  </div>
                  <div className="apt-status">
                    Status: <span className={`status-${apt.status}`}>{apt.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No appointments yet. Book one now!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
