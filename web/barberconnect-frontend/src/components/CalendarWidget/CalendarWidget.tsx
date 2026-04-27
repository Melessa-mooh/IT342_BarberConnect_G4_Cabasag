import React, { useState } from 'react';
import './CalendarWidget.css';

export interface Appointment {
  id: string;
  date: number;
  time: string;
  customerName?: string;
  fullDateText?: string;
  barberName?: string;
  haircutName?: string;
  totalPrice?: number;
  paymentMethod?: string;
}

interface CalendarWidgetProps {
  isBarberView?: boolean;
  appointments?: Appointment[];
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ isBarberView = false, appointments = [] }) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Generate a mock 35-day calendar grid (5 weeks)
  const days = Array.from({ length: 35 }, (_, i) => i + 1);

  return (
    <div className="calendar-widget">
      <div className="calendar-header-row">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>
      <div className="calendar-grid">
        {days.map((dayIndex) => {
          const day = dayIndex;
          if (day > 31) {
            return <div key={dayIndex} className="calendar-day empty"></div>;
          }

          const dayAppointments = appointments.filter(a => a.date === day);
          const isBooked = dayAppointments.length > 0;

          return (
            <div 
              key={dayIndex} 
              className={`calendar-day ${isBooked ? 'booked-brown' : 'available'} ${isBooked ? 'clickable' : ''}`}
              onClick={() => isBooked && setSelectedDay(day)}
            >
              <span className="day-number">{day}</span>
              {isBooked && (
                <div className="appointment-details-list">
                  {dayAppointments.map(app => (
                    <div key={app.id} className="appointment-badge">
                      <span className="appt-time">{app.time}</span>
                      {isBarberView && app.customerName && (
                        <span className="appt-name">{app.customerName}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedDay && (
        <div className="calendar-modal-overlay" onClick={() => setSelectedDay(null)}>
          <div className="calendar-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{appointments.find(a => a.date === selectedDay)?.fullDateText || `Appointments for Day ${selectedDay}`}</h3>
              <button className="close-btn" onClick={() => setSelectedDay(null)}>×</button>
            </div>
            <div className="modal-content">
              {appointments.filter(a => a.date === selectedDay).map((app, idx) => (
                <div key={app.id || idx} className="modal-appointment-card">
                  <div className="modal-appt-time" style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🕒 <strong>{app.time}</strong>
                  </div>
                  
                  {isBarberView && app.customerName && (
                    <div className="modal-appt-detail">🧑 Customer: <strong>{app.customerName}</strong></div>
                  )}

                  {!isBarberView && app.barberName && (
                    <div className="modal-appt-detail">✂️ Barber: <strong>{app.barberName}</strong></div>
                  )}
                  
                  {app.haircutName && (
                    <div className="modal-appt-detail">💇 Style: {app.haircutName}</div>
                  )}
                  
                  {app.totalPrice !== undefined && (
                    <div className="modal-appt-detail">💰 Total: ₱{app.totalPrice.toFixed(2)} ({app.paymentMethod === 'DIGITAL_WALLET' ? 'E-Cash' : app.paymentMethod || 'CASH'})</div>
                  )}

                  <div className="modal-appt-status" style={{ marginTop: '0.5rem' }}>✅ Confirmed Booking</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarWidget;
