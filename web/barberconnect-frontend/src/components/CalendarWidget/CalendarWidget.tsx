import React, { useState } from 'react';
import './CalendarWidget.css';
import type { Appointment } from '../../types/appointment';

interface CalendarWidgetProps {
  isBarberView?: boolean;
  appointments?: Appointment[];
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ isBarberView = false, appointments = [] }) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Generate a mock 35-day calendar grid (5 weeks)
  const days = Array.from({ length: 35 }, (_, i) => i + 1);

  const handleDayClick = (day: number, dayAppointments: Appointment[]) => {
    if (dayAppointments.length > 0) {
      setSelectedDay(day);
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDay(null);
  };

  const selectedDayAppointments = selectedDay 
    ? appointments.filter(a => a.date === selectedDay)
    : [];

  return (
    <>
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
                className={`calendar-day ${isBooked ? 'booked-brown clickable' : 'available'}`}
                onClick={() => handleDayClick(day, dayAppointments)}
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
      </div>

      {showModal && (
        <div className="calendar-modal-overlay" onClick={closeModal}>
          <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Appointments for Day {selectedDay}</h3>
              <button className="modal-close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              {selectedDayAppointments.map(app => (
                <div key={app.id} className="modal-appointment-item">
                  <div className="modal-appt-time">🕒 {app.time}</div>
                  {isBarberView && app.customerName && (
                    <div className="modal-appt-customer">👤 {app.customerName}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CalendarWidget;
