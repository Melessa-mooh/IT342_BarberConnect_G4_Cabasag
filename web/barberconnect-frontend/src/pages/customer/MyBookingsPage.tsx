import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentService, type Appointment } from '../../services/appointmentService';

const MyBookingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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
      // FIX: Add ?? [] guard
      const safeData = Array.isArray(data) ? data : [];
      // Sort: newest first
      setAppointments(safeData.sort((a, b) => 
        new Date(b.appointmentDateTime).getTime() - new Date(a.appointmentDateTime).getTime()
      ));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const upcoming = appointments.filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED');
  const completed = appointments.filter(a => a.status === 'COMPLETED');
  const cancelled = appointments.filter(a => a.status === 'CANCELLED' || a.status === 'NO_SHOW');

  const renderList = (title: string, list: Appointment[]) => (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-slate-800 mb-4">{title}</h3>
      {list.length === 0 ? (
        <p className="text-slate-500 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">No {title.toLowerCase()} bookings.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {list.map(app => (
            <div key={app.appointment_id} className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all">
              <div>
                <h4 className="font-bold text-slate-800">
                  {new Date(app.appointmentDateTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(app.appointmentDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </h4>
                <p className="text-sm text-slate-600 mt-1">
                  Barber ID: {app.barber_profile_id}
                </p>
                <p className="text-sm text-[#D2691E] font-semibold mt-1">
                  Price: ₱{app.totalPrice} <span className="text-slate-400 font-normal ml-2">Payment: {app.paymentMethod}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${
                  app.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 
                  app.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
                  app.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' : 
                  'bg-red-100 text-red-700'
                }`}>
                  {app.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✂</span>
            <span className="font-bold text-xl text-[#D2691E]">BarberConnect</span>
          </div>
          <nav className="flex gap-6 items-center">
            <Link to="/dashboard" className="text-sm font-semibold text-slate-600 hover:text-[#D2691E] transition-colors">Dashboard</Link>
            <Link to="/booking" className="text-sm font-bold text-[#D2691E]">My Bookings</Link>
            <Link to="/profile" className="text-sm font-semibold text-slate-600 hover:text-[#D2691E] transition-colors">Profile</Link>
            <button onClick={logout} className="text-sm font-semibold text-red-500 hover:text-red-600 transition-colors">Logout</button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">My Bookings</h1>
            <p className="text-slate-500 mt-2">Manage and view your appointment history</p>
          </div>
          <Link to="/dashboard" className="bg-[#D2691E] hover:bg-[#8B4513] text-white px-6 py-2.5 rounded-lg font-semibold shadow-sm transition-all hidden sm:block">
            Book New
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100 flex items-start gap-3">
            <span className="mt-0.5">⚠️</span>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-[#D2691E] rounded-full animate-spin"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center max-w-lg mx-auto mt-10">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
              📅
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">No bookings yet</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">You haven't made any appointments. Ready for a fresh cut?</p>
            <Link to="/dashboard" className="inline-block bg-[#D2691E] hover:bg-[#8B4513] text-white px-8 py-3 rounded-lg font-bold shadow-sm transition-all w-full sm:w-auto">
              Find a Barber
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
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
