import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentService, type Appointment } from '../../services/appointmentService';
import { barberService, type Barber } from '../../services/barberService';
import CustomerNavbar from '../../components/CustomerNavbar';
import './MyBookingsPage.css';

const MyBookingsPage: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barberNames, setBarberNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.firebaseUid) {
      fetchAppointments();
    } else {
      setLoading(false);
      setError('Please log in to view your bookings.');
    }
  }, [user]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await appointmentService.getCustomerAppointments(user!.firebaseUid);
      const safeData = Array.isArray(data) ? data : [];
      const sorted = safeData.sort((a, b) =>
        new Date(b.appointmentDateTime).getTime() - new Date(a.appointmentDateTime).getTime()
      );
      setAppointments(sorted);

      // Fetch barber names for all unique barber profile IDs
      const uniqueBarberIds = [...new Set(sorted.map(a => a.barber_profile_id).filter(Boolean))];
      const nameMap: Record<string, string> = {};
      await Promise.all(
        uniqueBarberIds.map(async (id) => {
          try {
            const barber: Barber = await barberService.getBarberById(id);
            const fullName = `${barber.firstName ?? ''} ${barber.lastName ?? ''}`.trim();
            nameMap[id] = fullName || 'Unknown Barber';
          } catch {
            nameMap[id] = 'Unknown Barber';
          }
        })
      );
      setBarberNames(nameMap);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const upcoming = appointments.filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED');
  const completed = appointments.filter(a => a.status === 'COMPLETED');
  const cancelled = appointments.filter(a => a.status === 'CANCELLED' || a.status === 'NO_SHOW');

  const getStatusClass = (status: string) => {
    if (status === 'PENDING') return 'mb-status mb-status-pending';
    if (status === 'CONFIRMED') return 'mb-status mb-status-confirmed';
    if (status === 'COMPLETED') return 'mb-status mb-status-completed';
    return 'mb-status mb-status-cancelled';
  };

  const renderList = (title: string, list: Appointment[]) => (
    <section className="mb-section">
      <div className="mb-section-heading">
        <h2>{title}</h2>
        <span>{list.length} booking{list.length === 1 ? '' : 's'}</span>
      </div>
      {list.length === 0 ? (
        <div className="mb-empty-section">No {title.toLowerCase()} bookings.</div>
      ) : (
        <div className="mb-booking-list">
          {list.map(app => (
            <article key={app.appointment_id} className="mb-booking-card">
              <div className="mb-booking-main">
                <h3 className="mb-booking-date">
                  {new Date(app.appointmentDateTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(app.appointmentDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </h3>
                <p className="mb-booking-barber">
                  Barber: {barberNames[app.barber_profile_id] ?? 'Loading…'}
                </p>
                <div className="mb-booking-meta">
                  <span className="mb-booking-price">Price: ₱{app.totalPrice}</span>
                  <span className="mb-booking-payment">Payment: {app.paymentMethod}</span>
                </div>
              </div>
              <div className="mb-booking-side">
                <span className={getStatusClass(app.status)}>
                  {app.status}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="mb-root">
      <CustomerNavbar />

      <main className="mb-container">
        <div className="mb-page-header">
          <div>
            <h1>My Bookings</h1>
            <p>Manage and view your appointment history</p>
          </div>
          <Link to="/dashboard" className="mb-book-new">
            Book New
          </Link>
        </div>

        {error && (
          <div className="mb-error">
            <span>!</span>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="mb-loading">
            <div className="mb-spinner" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="mb-empty-state">
            <div className="mb-empty-icon">Cal</div>
            <h2>No bookings yet</h2>
            <p>You haven't made any appointments. Ready for a fresh cut?</p>
            <Link to="/dashboard" className="mb-empty-action">
              Find a Barber
            </Link>
          </div>
        ) : (
          <div className="mb-sections">
            {renderList('Upcoming', upcoming)}
            {renderList('Completed', completed)}
            {renderList('Cancelled', cancelled)}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyBookingsPage;
