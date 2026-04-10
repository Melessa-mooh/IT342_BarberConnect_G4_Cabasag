import React from 'react';
import './CalendarWidget.css';

export interface Appointment {
  id: string;
  date: number;
  time: string;
  customerName?: string;
}

interface CalendarWidgetProps {
  isBarberView?: boolean;
  appointments?: Appointment[];
  onDayClick?: (day: number, appointmentsForDay: Appointment[]) => void;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ isBarberView = false, appointments = [], onDayClick }) => {
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
              className={`calendar-day ${isBooked ? 'booked-brown clickable' : 'available'}`}
              onClick={() => { if (isBooked && onDayClick) onDayClick(day, dayAppointments); }}
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
  );
};

export default CalendarWidget;
