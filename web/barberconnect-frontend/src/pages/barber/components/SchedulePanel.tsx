import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { leaveService, type LeaveRequest } from '../../../services/barberFeatureService';
import { appointmentService, type Appointment } from '../../../services/appointmentService';
import api from '../../../services/api';

const STATUS_COLORS: Record<string, string> = {
  PENDING:  'bg-amber-100 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  DECLINED: 'bg-red-100 text-red-600 border-red-200',
};

const SchedulePanel: React.FC = () => {
  const { user } = useAuth();
  // FIX: Remove fallback to firebaseUid
  const barberProfileId = user?.barberProfile?.id ?? '';

  const [activeTab, setActiveTab] = useState('calendar');
  
  // Calendar state management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

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
  // Popup state for clicked date
  const [popupDate, setPopupDate] = useState<Date | null>(null);
  // Name resolution caches
  const [customerNames, setCustomerNames]   = useState<Record<string, string>>({});
  const [styleNames,    setStyleNames]      = useState<Record<string, string>>({});
  const [addOnMap,      setAddOnMap]        = useState<Record<string, string>>({});
  
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
    const clicked = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clicked);
    // Open popup if there are appointments on this date
    const dateStr = clicked.toLocaleDateString('en-CA');
    const hasAppts = appointments.some(a => {
      const d = new Date(a.appointmentDateTime);
      return d.toLocaleDateString('en-CA') === dateStr && a.status !== 'CANCELLED';
    });
    if (hasAppts) setPopupDate(clicked);
  };

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date): Appointment[] => {
    const dateStr = date.toLocaleDateString('en-CA');
    return appointments.filter(a => {
      const d = new Date(a.appointmentDateTime);
      return d.toLocaleDateString('en-CA') === dateStr && a.status !== 'CANCELLED';
    });
  };

  const getDayClass = (day: number) => {
    if (isDateSelected(day)) return 'bg-[#D2691E] text-white shadow-md font-bold';
    
    // Check if this day is an approved leave
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toLocaleDateString('en-CA');
    const isApprovedLeave = leaveRequests.some(lr => lr.requestedDate === dateStr && lr.status === 'APPROVED');
    const isPendingLeave = leaveRequests.some(lr => lr.requestedDate === dateStr && lr.status === 'PENDING');
    
    if (isApprovedLeave) return 'bg-red-200 text-red-800 font-semibold';
    if (isPendingLeave) return 'bg-amber-100 text-amber-700 font-semibold';
    
    return 'text-slate-700 hover:bg-slate-100 hover:text-[#8B4513] font-medium';
  };

  // FIX: Fetch appointments on mount for the calendar
  useEffect(() => {
    if (barberProfileId) {
      fetchAppointments();
      fetchLeaveRequests();
    }
  }, [barberProfileId]);

  // Poll for new appointments every 30 seconds so calendar stays live
  useEffect(() => {
    if (!barberProfileId) return;
    const interval = setInterval(() => {
      fetchAppointments();
    }, 30000);
    return () => clearInterval(interval);
  }, [barberProfileId]);

  const fetchAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const data = await appointmentService.getBarberAppointments(barberProfileId);
      const sorted = data.sort((a, b) => 
        new Date(b.appointmentDateTime).getTime() - new Date(a.appointmentDateTime).getTime()
      );
      setAppointments(sorted);
      // Resolve names for all appointments
      resolveNames(sorted);
    } catch (e: any) {
      console.error('Failed to load appointments:', e);
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Fetch add-on map once
  useEffect(() => {
    const fetchAddOns = async () => {
      try {
        const res = await api.get('/addons');
        const cats: any[] = res.data?.data ?? [];
        const map: Record<string, string> = {};
        cats.forEach((cat: any) => {
          (cat.items ?? []).forEach((item: any) => { map[item.id] = item.name; });
        });
        setAddOnMap(map);
      } catch { /* silent */ }
    };
    fetchAddOns();
  }, []);

  // Resolve customer names and style names for a list of appointments
  const resolveNames = async (appts: Appointment[]) => {
    // Unique customer IDs not yet resolved
    const newCustomerIds = [...new Set(appts.map(a => a.customer_id))]
      .filter(id => id && !customerNames[id]);
    // Unique style IDs not yet resolved
    const newStyleIds = [...new Set(appts.map(a => a.haircut_style_id))]
      .filter(id => id && !styleNames[id]);

    // Fetch customer names from /auth/me-like endpoint — use users collection via barber service
    await Promise.all(newCustomerIds.map(async (cid) => {
      try {
        const res = await api.get(`/auth/user/${cid}`);
        const u = res.data?.data ?? res.data;
        const name = `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim() || 'Customer';
        setCustomerNames(prev => ({ ...prev, [cid]: name }));
      } catch {
        setCustomerNames(prev => ({ ...prev, [cid]: 'Customer' }));
      }
    }));

    // Fetch haircut style names
    await Promise.all(newStyleIds.map(async (sid) => {
      try {
        const res = await api.get(`/haircuts/${sid}`);
        const s = res.data?.data ?? res.data;
        const name = s?.name || 'Haircut';
        setStyleNames(prev => ({ ...prev, [sid]: name }));
      } catch {
        setStyleNames(prev => ({ ...prev, [sid]: 'Haircut' }));
      }
    }));
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

  const isSelectedDateApprovedLeave = leaveRequests.some(lr => 
    lr.requestedDate === selectedDate.toLocaleDateString('en-CA') && lr.status === 'APPROVED'
  );

  if (!barberProfileId) {
    return <div className="text-slate-500 text-sm p-8">Loading schedule...</div>;
  }

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
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all font-semibold text-base relative ${getDayClass(day)}`}
                    >
                      {day}
                      {/* Dot indicator for booked appointments */}
                      {(() => {
                        const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toLocaleDateString('en-CA');
                        const hasAppt = appointments.some(a =>
                          new Date(a.appointmentDateTime).toLocaleDateString('en-CA') === dateStr && a.status !== 'CANCELLED'
                        );
                        return hasAppt ? (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white opacity-90" />
                        ) : null;
                      })()}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-8 space-y-4 px-2">
              <h4 className="text-sm font-bold text-[#4A3F35] uppercase tracking-wide mb-5">Legend</h4>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#D2691E] shadow-sm" />
                <span className="text-base text-[#4A3F35] font-medium">Selected Date</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-red-200 shadow-sm" />
                <span className="text-base text-[#4A3F35] font-medium">Approved Leave</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-amber-100 shadow-sm" />
                <span className="text-base text-[#4A3F35] font-medium">Pending Leave</span>
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
            {isSelectedDateApprovedLeave ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center mt-4">
                <p className="text-red-800 font-bold text-lg">Day Off</p>
                <p className="text-red-600 text-sm">You have an approved leave on this date.</p>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      )}

      {/* ── Appointment Popup Modal — matches reference design exactly ─────────── */}
      {popupDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }}
          onClick={() => setPopupDate(null)}
        >
          {/* 2× size: max-w-2xl */}
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            style={{ animation: 'modalIn 0.2s ease-out' }}
            onClick={e => e.stopPropagation()}
          >
            {/* ── Orange header (matches reference) ── */}
            <div className="px-8 py-6 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg,#E8650A 0%,#F07820 100%)' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Appointments</p>
                  <h3 className="text-white text-2xl font-bold leading-tight">
                    {popupDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-white/20 text-white text-sm font-bold px-4 py-1.5 rounded-full">
                  {getAppointmentsForDate(popupDate).length} booking{getAppointmentsForDate(popupDate).length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setPopupDate(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white text-2xl font-light transition"
                >
                  ×
                </button>
              </div>
            </div>

            {/* ── Appointment cards ── */}
            <div className="px-8 py-6 max-h-[65vh] overflow-y-auto space-y-6">
              {getAppointmentsForDate(popupDate).map((app) => {
                const time = new Date(app.appointmentDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                const customerName = customerNames[app.customer_id] || 'Loading...';
                const styleName    = styleNames[app.haircut_style_id] || 'Loading...';
                const addOnNames   = (app.selectedOptionIds ?? []).map(id => addOnMap[id]).filter(Boolean);

                const statusConfig: Record<string, { icon: string; color: string; label: string }> = {
                  PENDING:    { icon: '⏳', color: '#F59E0B', label: 'Pending' },
                  CONFIRMED:  { icon: '✔',  color: '#3B82F6', label: 'Confirmed' },
                  COMPLETED:  { icon: '✅', color: '#10B981', label: 'Completed' },
                  CANCELLED:  { icon: '✕',  color: '#EF4444', label: 'Cancelled' },
                  IN_PROGRESS:{ icon: '🔄', color: '#8B5CF6', label: 'In Progress' },
                };
                const sc = statusConfig[app.status] ?? { icon: '•', color: '#6B7280', label: app.status };

                return (
                  <div key={app.appointment_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                    {/* Time + status row */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#E8650A" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{time}</span>
                      </div>
                      <span className="text-base font-bold flex items-center gap-1.5" style={{ color: sc.color }}>
                        {sc.icon} {sc.label}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="px-6 py-5 space-y-5">
                      {/* Customer */}
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-lg flex-shrink-0">
                          {customerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Customer</p>
                          <p className="text-lg font-bold text-gray-900">{customerName}</p>
                        </div>
                      </div>

                      {/* Haircut Style */}
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center text-xl flex-shrink-0">✂️</div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Haircut Style</p>
                          <p className="text-lg font-bold text-gray-900">{styleName}</p>
                        </div>
                      </div>

                      {/* Add-ons */}
                      {addOnNames.length > 0 && (
                        <div className="flex items-start gap-4">
                          <div className="w-11 h-11 rounded-full bg-purple-50 flex items-center justify-center text-xl flex-shrink-0">➕</div>
                          <div>
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Add-on Services</p>
                            <p className="text-base font-semibold text-purple-600">{addOnNames.join(', ')}</p>
                          </div>
                        </div>
                      )}

                      {/* Total + Payment */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-full bg-yellow-50 flex items-center justify-center text-xl flex-shrink-0">💰</div>
                          <div>
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Total</p>
                            <p className="text-3xl font-black text-gray-900">₱{Number(app.totalPrice).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Payment Method</p>
                          <p className="text-lg font-bold text-gray-700">
                            {app.paymentMethod === 'DIGITAL_WALLET' ? '📱 E-Cash' : '💵 Cash'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons — full width, large, matching reference */}
                    {(app.status === 'PENDING' || app.status === 'CONFIRMED') && (
                      <div className="px-6 pb-5 flex gap-3">
                        {app.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => { handleAppointmentAction(app.appointment_id, 'CONFIRMED'); setPopupDate(null); }}
                              className="flex-1 py-4 rounded-xl text-white text-base font-bold transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
                              style={{ background: '#22C55E' }}
                            >
                              ✔ Accept
                            </button>
                            <button
                              onClick={() => { handleAppointmentAction(app.appointment_id, 'CANCELLED'); setPopupDate(null); }}
                              className="flex-1 py-4 rounded-xl text-white text-base font-bold transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
                              style={{ background: '#EF4444' }}
                            >
                              ✕ Decline
                            </button>
                          </>
                        )}
                        {app.status === 'CONFIRMED' && (
                          <button
                            onClick={() => { handleAppointmentAction(app.appointment_id, 'COMPLETED'); setPopupDate(null); }}
                            className="flex-1 py-4 rounded-xl text-white text-base font-bold transition-all hover:opacity-90 active:scale-95"
                            style={{ background: '#3B82F6' }}
                          >
                            ✅ Mark Completed
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Close button */}
            <div className="px-8 pb-7">
              <button
                onClick={() => setPopupDate(null)}
                className="w-full py-4 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-base hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(-16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

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
