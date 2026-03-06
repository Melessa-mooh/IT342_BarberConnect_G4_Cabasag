import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/api';
import './BarbersList.css';

const BarbersList = () => {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBarber, setSelectedBarber] = useState(null);

  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    try {
      const response = await axiosInstance.get('/barbers');
      setBarbers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching barbers:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading barbers...</div>;
  }

  return (
    <div className="barbers-container">
      <h2>Available Barbers</h2>
      
      <div className="barbers-grid">
        {barbers.map((barber) => (
          <div key={barber.barberProfileId} className="barber-card">
            <div className="barber-avatar">✂️</div>
            <h3>{barber.user.firstname} {barber.user.lastname}</h3>
            <p className="barber-contact">{barber.user.email}</p>
            {barber.phoneNumber && (
              <p className="barber-phone">{barber.phoneNumber}</p>
            )}
            <div className="barber-stats">
              <div className="stat">
                <span className="stat-label">Monthly Income</span>
                <span className="stat-value">${barber.monthlyIncome}</span>
              </div>
            </div>
            <button 
              className="btn-book"
              onClick={() => setSelectedBarber(barber)}
            >
              Book Appointment
            </button>
          </div>
        ))}
      </div>

      {barbers.length === 0 && (
        <div className="empty-state">
          <p>No barbers available at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default BarbersList;
