import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { appointmentService, type Appointment } from '../../../services/appointmentService';

const AppointmentsPanel = () => {
  const { user } = useAuth();
  const barberProfileId = user?.barberProfile?.id?.toString() ?? '';

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const data = await appointmentService.getBarberAppointments(barberProfileId);
      data.sort((a, b) => new Date(b.appointmentDateTime).getTime() - new Date(a.appointmentDateTime).getTime());
      setAppointments(data);
    } catch (err) {
      console.error('Failed to fetch appointments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!barberProfileId) return;
    setLoading(true);
    fetchAppointments();
  }, [barberProfileId]);

  const handleAction = async (id: string, newStatus: string) => {
    try {
      await appointmentService.updateAppointmentStatus(id, newStatus);
      console.log(`FCM Notification triggered for Appointment ${id}: ${newStatus}`);
      setAppointments(appointments.map(app => app.appointment_id === id ? { ...app, status: newStatus } : app));
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await appointmentService.completeAppointment(id);
      alert('Appointment marked complete.');
      await fetchAppointments();
    } catch (err) {
      console.error('Failed to complete appointment', err);
      alert('Failed to complete appointment.');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Appointments</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 text-sm font-semibold text-gray-600">Customer</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Service</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Time</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="p-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">Loading appointments...</td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">No appointments found.</td>
              </tr>
            ) : appointments.map((app) => {
              const d = new Date(app.appointmentDateTime);
              const customerName = app.customerFullName || 'Customer';
              const serviceName = app.serviceName || 'Haircut Service';
              return (
              <tr key={app.appointment_id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="p-4 text-gray-800 font-medium">{customerName}</td>
                <td className="p-4 text-gray-600">{serviceName}</td>
                <td className="p-4 text-gray-600 font-medium">{d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full 
                    ${app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      (app.status === 'CONFIRMED' || app.status === 'COMPLETED') ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'}`}>
                    {app.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {app.status === 'PENDING' && (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleAction(app.appointment_id, 'CONFIRMED')} className="bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1 rounded-md text-sm font-medium transition">
                        Accept
                      </button>
                      <button onClick={() => handleAction(app.appointment_id, 'CANCELLED')} className="bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1 rounded-md text-sm font-medium transition">
                        Cancel
                      </button>
                    </div>
                  )}
                  {(app.status === 'CONFIRMED' || app.status === 'IN_PROGRESS') && (
                    <button onClick={() => handleComplete(app.appointment_id)} className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1 rounded-md text-sm font-medium transition">
                      Mark Complete
                    </button>
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AppointmentsPanel;
