import { useState } from 'react';

const AppointmentsPanel = () => {
  const [appointments, setAppointments] = useState([
    { id: 1, customer: 'John Doe', service: 'Classic Fade', time: '10:00 AM', status: 'PENDING' },
    { id: 2, customer: 'Jane Smith', service: 'Women\'s Style', time: '11:00 AM', status: 'CONFIRMED' },
    { id: 3, customer: 'Mike Johnson', service: 'Beard Trim', time: '1:00 PM', status: 'PENDING' },
    { id: 4, customer: 'Chris Lee', service: 'Midnight Curtains', time: '3:00 PM', status: 'CANCELLED' }
  ]);

  const handleAction = (id, newStatus) => {
    // In a real app, this would trigger an FCM notification API
    console.log(`Mock FCM Notification sent to customer: Appointment ${newStatus}`);
    setAppointments(appointments.map(app => app.id === id ? { ...app, status: newStatus } : app));
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
            {appointments.map((app) => (
              <tr key={app.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="p-4 text-gray-800 font-medium">{app.customer}</td>
                <td className="p-4 text-gray-600">{app.service}</td>
                <td className="p-4 text-gray-600 font-medium">{app.time}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full 
                    ${app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                      app.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 
                      'bg-red-100 text-red-800'}`}>
                    {app.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {app.status === 'PENDING' && (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleAction(app.id, 'CONFIRMED')} className="bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1 rounded-md text-sm font-medium transition">
                        Accept
                      </button>
                      <button onClick={() => handleAction(app.id, 'CANCELLED')} className="bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1 rounded-md text-sm font-medium transition">
                        Cancel
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AppointmentsPanel;
