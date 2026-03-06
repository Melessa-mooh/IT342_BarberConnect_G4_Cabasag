import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/api';
import './AppointmentBooking.css';

const AppointmentBooking = ({ barberId }) => {
  const [appointment, setAppointment] = useState({
    dateTime: '',
    totalPrice: '',
    paymentMethod: 'card',
  });

  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (barberId) {
      fetchBarberStyles();
    }
  }, [barberId]);

  const fetchBarberStyles = async () => {
    try {
      const response = await axiosInstance.get(`/barbers/${barberId}/styles`);
      setStyles(response.data);
    } catch (error) {
      console.error('Error fetching styles:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAppointment({
      ...appointment,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await axiosInstance.post('/appointments', {
        ...appointment,
        userId: user.userId,
      });
      setSuccess(true);
      setAppointment({
        dateTime: '',
        totalPrice: '',
        paymentMethod: 'card',
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error booking appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-form">
      <h3>Book an Appointment</h3>

      {success && (
        <div className="success-message">
          ✓ Appointment booked successfully!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Date & Time</label>
          <input
            type="datetime-local"
            name="dateTime"
            value={appointment.dateTime}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Total Price</label>
          <input
            type="number"
            name="totalPrice"
            placeholder="Enter price"
            value={appointment.totalPrice}
            onChange={handleChange}
            required
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label>Payment Method</label>
          <select
            name="paymentMethod"
            value={appointment.paymentMethod}
            onChange={handleChange}
          >
            <option value="card">Credit Card</option>
            <option value="cash">Cash</option>
            <option value="paypal">PayPal</option>
          </select>
        </div>

        <button type="submit" className="btn-book-confirm" disabled={loading}>
          {loading ? 'Booking...' : 'Confirm Booking'}
        </button>
      </form>
    </div>
  );
};

export default AppointmentBooking;
