import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { leaveService, type LeaveRequest } from '../../../services/barberFeatureService';
import { appointmentService, type Appointment } from '../../../services/appointmentService';

const STATUS_COLORS: Record<string, string> = {
  PENDING:  'bg-amber-100 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  DECLINED: 'bg-red-100 text-red-600 border-red-200',
};

const SchedulePanel: React.FC = () => {
  const { user } = useAuth();
  // FIX: Remove fallback to firebaseUid
  const barberProfileId = user?.barberProfile?.id ?? '';

  // FIX: Add early return guard
  if (!barberProfileId) {
    return <div className="text-slate-500 text-sm p-8">Loading schedule...</div>;
  }

  const [activeTab, setActiveTab] = useState('calendar');
  
  // Calendar state management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const days  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Get calendar dates for current month
  const getCalendarDates = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };
  
  const dates = getCalendarDates();
  
  // Get the day of week for the first day of the month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month, 1).getDay();
  };
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  // Format month and year
  const getMonthYear = () => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  // Check if a date is selected
  const isDateSelected = (day: number) => {
    return selectedDate.getDate() === day &&
           selectedDate.getMonth() === currentDate.getMonth() &&
           selectedDate.getFullYear() === currentDate.getFullYear();
  };
  
  // Handle date selection
  const handleDateClick = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  const getDayClass = (day: number) => {
    if (isDateSelected(day)) return 'bg-[#D2691E] text-white shadow-md font-bold';
    
    // Check if this day is an approved leave
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toLocaleDateString('en-CA');
    const isApprovedLeave = leaveRequests.some(lr => lr.requestedDate === dateStr && lr.status === 'APPROVED');
    const isPendingLeave = leaveRequests.some(lr => lr.requestedDate === dateStr && lr.status === 'PENDING');
    
    if (isApprovedLeave) return 'bg-[#F4E4BC] text-[#8B4513] font-semibold';
    if (isPendingLeave) return 'bg-amber-100 text-amber-700 font-semibold';
    
    return 'text-slate-700 hover:bg-slate-100 hover:text-[#8B4513] font-medium';
  };

  // ─── Leave Request State ───────────────────────────────────────────────────
  const [leaveRequests, setLeaveRequests]   = useState<LeaveRequest[]>([]);
  const [loadingLeave, setLoadingLeave]     = useState(false);
  const [leaveError, setLeaveError]         = useState<string | null>(null);
  const [showLeaveForm, setShowLeaveForm]   = useState(false);
  const [leaveDate, setLeaveDate]           = useState('');
  const [leaveReason, setLeaveReason]       = useState('');
  const [submitting, setSubmitting]         = useState(false);

  const [appointments, setAppointments]     = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // FIX: Fetch appointments on mount for the calendar
  useEffect(() => {
    if (barberProfileId) {
      fetchAppointments();
    }
  }, [barberProfileId]);

  useEffect(() => {
    if (barberProfileId) {
      fetchLeaveRequests();
    }
  }, [barberProfileId]);

  const fetchAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const data = await appointmentService.getBarberAppointments(barberProfileId);
      // Sort newest first
      setAppointments(data.sort((a, b) => 
        new Date(b.appointmentDateTime).getTime() - new Date(a.appointmentDateTime).getTime()
      ));
    } catch (e: any) {
      console.error('Failed to load appointments:', e);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handleAppointmentAction = async (id: string, newStatus: string) => {
    try {
      if (newStatus === 'COMPLETED') {
        await appointmentService.completeAppointment(id);
      } else {
        await appointmentService.updateAppointmentStatus(id, newStatus);
      }
      setAppointments(prev => prev.map(app => 
        app.appointment_id === id ? { ...app, status: newStatus as any } : app
      ));
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update appointment status');
    }
  };

  const fetchLeaveRequests = async () => {
    setLoadingLeave(true);
    setLeaveError(null);
    try {
      const data = await leaveService.getLeaveRequests(barberProfileId);
      // Sort: newest first
      setLeaveRequests(data.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (e: any) {
      setLeaveError(e.message || 'Failed to load leave requests');
    } finally {
      setLoadingLeave(false);
    }
  };

  const handleSubmitLeave = async () => {
    if (!leaveDate) { alert('Please select a date'); return; }
    setSubmitting(true);
    try {
      const created = await leaveService.createLeaveRequest(barberProfileId, leaveDate, leaveReason);
      setLeaveRequests(prev => [created, ...prev]);
      setLeaveDate('');
      setLeaveReason('');
      setShowLeaveForm(false);
    } catch (e: any) {
      alert(e.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  // FIX: Dynamic slot booking logic
  const isSlotBooked = (timeStr: string): boolean => {
    if (!selectedDate) return false;
    return appointments.some(app => {
      const appDate = new Date(app.appointmentDateTime);
      const appDateStr = appDate.toLocaleDateString('en-CA');
      const selectedStr = selectedDate.toLocaleDateString('en-CA');
      const appHour = appDate.getHours().toString().padStart(2, '0') + ':00';
      return appDateStr === selectedStr && appHour === timeStr && app.status !== 'CANCELLED';
    });
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-10">

      {/* Header - Clean and simple */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Your Schedule</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your time and availability with ease</p>
        </div>
      </div>

      {/* Tab Navigation - Clean pills */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {[
          { id: 'calendar',     label: 'Calendar' },
          { id: 'appointments', label: 'Appointments' },
          { id: 'leave',        label: 'Time Off' },
          { id: 'settings',     label: 'Settings' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id 
                ? 'bg-[#D2691E] text-white shadow-md' 
                : 'bg-white text-slate-600 hover:text-[#8B4513] hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Calendar Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'calendar' && (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* LEFT: Calendar Picker - Warm beige theme matching image */}
          <div className="w-full lg:w-[480px] flex-shrink-0 bg-gradient-to-br from-[#FFF8F0] to-[#F5E6D3] rounded-2xl shadow-sm border border-[#E8D4B8] p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#8B7355] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#4A3F35]">Pick a Date</h3>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <button 
                  onClick={goToPreviousMonth}
                  className="text-[#D2691E] hover:text-[#8B4513] w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/80 transition-all font-bold text-2xl"
                >
                  ‹
                </button>
                <h4 className="font-bold text-xl text-[#4A3F35]">{getMonthYear()}</h4>
                <button 
                  onClick={goToNextMonth}
                  className="text-[#D2691E] hover:text-[#8B4513] w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/80 transition-all font-bold text-2xl"
                >
                  ›
                </button>
              </div>
              
              <div className="grid grid-cols-7 mb-5 gap-3">
                {days.map(d => (
                  <div key={d} className="text-center text-sm font-bold text-[#8B7355]">{d}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-3 text-center text-base">
                {/* Empty cells for days before the first day of the month */}
                {Array.from({ length: getFirstDayOfMonth() }).map((_, index) => (
                  <div key={`empty-${index}`} className="py-3"></div>
                ))}
                
                {/* Actual dates */}
                {dates.map(day => (
                  <div key={day} className="flex justify-center items-center">
                    <button 
                      onClick={() => handleDateClick(day)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all font-semibold text-base ${getDayClass(day)}`}
                    >
                      {day}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-8 space-y-4 px-2">
              <h4 className="text-sm font-bold text-[#4A3F35] uppercase tracking-wide mb-5">Legend</h4>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500 shadow-sm" />
                <span className="text-base text-[#4A3F35] font-medium">Not Fully</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-red-500 shadow-sm" />
                <span className="text-base text-[#4A3F35] font-medium">Fully Booked</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#F4E4BC] shadow-sm" />
                <span className="text-base text-[#4A3F35] font-medium">Day Off</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Time Slots - Takes remaining space, single column */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">
                Available Time Slots - {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-3 max-w-xl">
              {['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'].map(t => (
                <div key={t} className="flex justify-between items-center p-4 rounded-lg border border-slate-200 hover:border-[#D2691E] hover:shadow-sm transition-all cursor-pointer bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="font-semibold text-slate-800">{t}</span>
                  </div>
                  <span className={isSlotBooked(t) 
                    ? 'bg-red-500 text-white text-xs font-bold uppercase px-3 py-1.5 rounded-full'
                    : 'bg-[#D2691E] text-white text-xs font-bold uppercase px-3 py-1.5 rounded-full'
                  }>
                    {isSlotBooked(t) ? 'Booked' : 'Open'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Leave Requests Tab ────────────────────────────────────────────────── */}
      {activeTab === 'leave' && (
        <div className="flex flex-col gap-6">

          {/* Submit leave button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowLeaveForm(v => !v)}
              className="bg-[#D2691E] hover:bg-[#8B4513] text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all"
            >
              + Request Time Off
            </button>
          </div>

          {/* Leave form */}
          {showLeaveForm && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-2xl">
              <h3 className="font-bold text-lg text-slate-800 mb-4">Request Time Off</h3>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">Date</label>
                  <input
                    type="date"
                    value={leaveDate}
                    onChange={e => setLeaveDate(e.target.value)}
                    className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#D2691E] focus:ring-1 focus:ring-[#D2691E]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">Reason (optional)</label>
                  <textarea
                    value={leaveReason}
                    onChange={e => setLeaveReason(e.target.value)}
                    placeholder="Family event, doctor's appointment, personal day..."
                    className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm h-24 resize-none focus:outline-none focus:border-[#D2691E] focus:ring-1 focus:ring-[#D2691E]"
                  />
                </div>
                <div className="flex gap-3 justify-end mt-2">
                  <button 
                    onClick={() => setShowLeaveForm(false)} 
                    className="px-5 py-2.5 text-sm font-semibold text-slate-600 rounded-lg hover:bg-slate-100 border border-slate-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitLeave}
                    disabled={submitting}
                    className="bg-[#D2691E] hover:bg-[#8B4513] text-white px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all shadow-sm"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Leave History */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-base font-bold text-slate-800 mb-6">Your Time Off History</h3>

            {loadingLeave && <p className="text-slate-500 text-sm">Loading...</p>}
            {leaveError  && <p className="text-red-500 text-sm">{leaveError}</p>}

            {!loadingLeave && leaveRequests.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500 text-sm">No time off requests yet</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {leaveRequests.map(lr => (
                <div key={lr.leaveRequestId} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-all">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-slate-800 text-sm">{lr.requestedDate}</span>
                    {lr.reason && (
                      <span className="text-sm text-slate-600">{lr.reason}</span>
                    )}
                    <span className="text-xs text-slate-400">
                      Submitted: {lr.createdAt ? new Date(lr.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <span className={`text-xs font-bold px-4 py-1.5 rounded-full ${STATUS_COLORS[lr.status] ?? ''}`}>
                    {lr.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Appointments Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h3 className="text-xl font-bold text-slate-800 mb-6">Your Appointments</h3>
          
          {loadingAppointments && <p className="text-slate-500 text-sm">Loading appointments...</p>}
          
          {!loadingAppointments && appointments.length === 0 && (
            <p className="text-slate-500 text-center py-6">No appointments found.</p>
          )}

          <div className="flex flex-col gap-4">
            {appointments.map(app => (
              <div key={app.appointment_id} className="border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-800">
                    {new Date(app.appointmentDateTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(app.appointmentDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Price: ₱{app.totalPrice} • Payment: {app.paymentMethod}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${app.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : app.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                    {app.status}
                  </span>
                  
                  {app.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleAppointmentAction(app.appointment_id, 'CONFIRMED')} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-bold transition">
                        Accept
                      </button>
                      <button onClick={() => handleAppointmentAction(app.appointment_id, 'CANCELLED')} className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-bold transition">
                        Decline
                      </button>
                    </div>
                  )}
                  {app.status === 'CONFIRMED' && (
                    <button onClick={() => handleAppointmentAction(app.appointment_id, 'COMPLETED')} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold transition">
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Settings Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <p className="text-slate-400 text-sm text-center py-6">Schedule settings coming soon.</p>
        </div>
      )}
    </div>
  );
};

export default SchedulePanel;
