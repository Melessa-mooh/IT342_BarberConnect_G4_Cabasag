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
  addOnNames?: string[];   // names of selected add-ons
  totalPrice?: number;
  paymentMethod?: string;
  status?: string;
  barberId?: string;
}

interface CalendarWidgetProps {
  isBarberView?: boolean;
  appointments?: Appointment[];
  onLeaveFeedback?: (appointmentId: string, barberId: string) => void;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  isBarberView = false,
  appointments = [],
  onLeaveFeedback,
}) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Generate a 35-day calendar grid (5 weeks)
  const days = Array.from({ length: 35 }, (_, i) => i + 1);

  const dayAppointmentsFor = (day: number) =>
    appointments.filter(a => a.date === day);

  return (
    <div className="calendar-widget">
      <div className="calendar-header-row">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="calendar-grid">
        {days.map(dayIndex => {
          const day = dayIndex;
          if (day > 31) {
            return <div key={dayIndex} className="calendar-day empty" />;
          }

          const dayAppts = dayAppointmentsFor(day);
          const isBooked = dayAppts.length > 0;

          return (
            <div
              key={dayIndex}
              className={`calendar-day ${isBooked ? 'booked-brown clickable' : 'available'}`}
              onClick={() => isBooked && setSelectedDay(day)}
            >
              <span className="day-number">{day}</span>
              {isBooked && (
                <div className="appointment-details-list">
                  {dayAppts.map(app => (
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

      {/* ── Appointment Detail Popup ─────────────────────────────────────────── */}
      {selectedDay !== null && (
        <div
          className="calendar-modal-overlay"
          onClick={() => setSelectedDay(null)}
        >
          <div className="calendar-modal" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="modal-header">
              <h3>
                {dayAppointmentsFor(selectedDay)[0]?.fullDateText ||
                  `Appointments — Day ${selectedDay}`}
              </h3>
              <button className="close-btn" onClick={() => setSelectedDay(null)}>×</button>
            </div>

            {/* Body */}
            <div className="modal-content">
              {dayAppointmentsFor(selectedDay).map((app, idx) => (
                <div key={app.id || idx} className="modal-appointment-card">

                  {/* Time */}
                  <div style={{ fontSize: '1.1rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🕒 <strong>{app.time}</strong>
                  </div>

                  {/* Barber name — customer view */}
                  {!isBarberView && app.barberName && (
                    <div className="modal-appt-detail">
                      ✂️ <strong>Barber:</strong> {app.barberName}
                    </div>
                  )}

                  {/* Customer name — barber view */}
                  {isBarberView && app.customerName && (
                    <div className="modal-appt-detail">
                      👤 <strong>Customer:</strong> {app.customerName}
                    </div>
                  )}

                  {/* Haircut style */}
                  {app.haircutName && (
                    <div className="modal-appt-detail">
                      💇 <strong>Style:</strong> {app.haircutName}
                    </div>
                  )}

                  {/* Add-on services */}
                  {app.addOnNames && app.addOnNames.length > 0 && (
                    <div className="modal-appt-detail" style={{ alignItems: 'flex-start' }}>
                      <span>➕</span>
                      <span>
                        <strong>Add-ons:</strong>
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', listStyle: 'disc' }}>
                          {app.addOnNames.map((name, i) => (
                            <li key={i} style={{ fontSize: '0.85rem', color: '#374151' }}>{name}</li>
                          ))}
                        </ul>
                      </span>
                    </div>
                  )}

                  {/* Total & payment */}
                  {app.totalPrice !== undefined && (
                    <div className="modal-appt-detail">
                      💰 <strong>Total:</strong> ₱{app.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  )}
                  {app.paymentMethod && (
                    <div className="modal-appt-detail">
                      💳 <strong>Payment:</strong>{' '}
                      {app.paymentMethod === 'DIGITAL_WALLET' ? 'E-Cash' : 'Cash'}
                    </div>
                  )}

                  {/* Status + feedback button */}
                  <div className="modal-appt-status" style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      backgroundColor:
                        app.status === 'COMPLETED' ? '#dcfce7' :
                        app.status === 'CONFIRMED' ? '#dbeafe' :
                        app.status === 'PENDING'   ? '#fef3c7' : '#f3f4f6',
                      color:
                        app.status === 'COMPLETED' ? '#166534' :
                        app.status === 'CONFIRMED' ? '#1d4ed8' :
                        app.status === 'PENDING'   ? '#92400e' : '#374151',
                    }}>
                      {app.status === 'COMPLETED' ? '✅ Completed' :
                       app.status === 'CONFIRMED' ? '✔ Confirmed' :
                       app.status === 'PENDING'   ? '⏳ Pending' :
                       app.status || 'Confirmed'}
                    </span>

                    {!isBarberView && app.status === 'COMPLETED' && onLeaveFeedback && app.barberId && (
                      <button
                        onClick={() => onLeaveFeedback(app.id, app.barberId!)}
                        style={{
                          backgroundColor: '#f59e0b',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}
                      >
                        ★ Leave Feedback
                      </button>
                    )}
                  </div>
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
