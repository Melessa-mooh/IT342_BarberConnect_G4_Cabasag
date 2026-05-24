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
                const customerName = app.customerFullName || customerNames[app.customer_id] || 'Customer';
                const styleName    = app.serviceName || styleNames[app.haircut_style_id] || 'Haircut Service';
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
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── Page sub-header ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
                Time Off Requests
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 13.5, color: '#6B7280' }}>
                Submit and track your leave requests. Approved days will be blocked on the customer booking calendar.
              </p>
            </div>
          </div>

          {/* ── Request Time Off card ── */}
          <div style={{
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}>
            {/* Card header */}
            <div style={{
              padding: '20px 28px 16px',
              borderBottom: '1px solid #F3F4F6',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: '#FFF7ED', border: '1px solid #FED7AA',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#F97316" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Request Time Off</p>
                <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#9CA3AF' }}>
                  Select a date and provide a reason for your leave request
                </p>
              </div>
            </div>

            {/* Card body */}
            <div style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Date field */}
                <div>
                  <label style={{
                    display: 'block', fontSize: 11.5, fontWeight: 700,
                    color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em',
                    marginBottom: 8,
                  }}>
                    Date
                  </label>
                  <div style={{ position: 'relative', maxWidth: 320 }}>
                    <span style={{
                      position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                      pointerEvents: 'none', display: 'flex', color: '#9CA3AF',
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                    </span>
                    <input
                      type="date"
                      value={leaveDate}
                      onChange={e => setLeaveDate(e.target.value)}
                      style={{
                        width: '100%', height: 44,
                        background: '#FAFAFA', border: '1.5px solid #E5E7EB',
                        borderRadius: 10, padding: '0 14px 0 38px',
                        fontSize: 14, color: '#111827', outline: 'none',
                        fontFamily: 'inherit', transition: 'border-color .15s, box-shadow .15s',
                        cursor: 'pointer',
                      }}
                      onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; e.target.style.background = '#fff'; }}
                      onBlur={e  => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFAFA'; }}
                    />
                  </div>
                </div>

                {/* Reason field */}
                <div>
                  <label style={{
                    display: 'block', fontSize: 11.5, fontWeight: 700,
                    color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em',
                    marginBottom: 8,
                  }}>
                    Reason <span style={{ color: '#9CA3AF', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                  </label>
                  <textarea
                    value={leaveReason}
                    onChange={e => setLeaveReason(e.target.value)}
                    placeholder="Family event, doctor's appointment, personal day…"
                    rows={4}
                    style={{
                      width: '100%', background: '#FAFAFA',
                      border: '1.5px solid #E5E7EB', borderRadius: 10,
                      padding: '12px 14px', fontSize: 14, color: '#111827',
                      fontFamily: 'inherit', resize: 'none', outline: 'none',
                      transition: 'border-color .15s, box-shadow .15s',
                      lineHeight: 1.55,
                    }}
                    onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; e.target.style.background = '#fff'; }}
                    onBlur={e  => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFAFA'; }}
                  />
                </div>

                {/* Action buttons */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                  gap: 10, paddingTop: 4, borderTop: '1px solid #F3F4F6', marginTop: 4,
                }}>
                  <button
                    type="button"
                    onClick={() => { setLeaveDate(''); setLeaveReason(''); }}
                    style={{
                      height: 42, padding: '0 20px',
                      border: '1.5px solid #E5E7EB', borderRadius: 10,
                      background: '#fff', color: '#6B7280',
                      fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'all .15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#D1D5DB'; (e.currentTarget as HTMLButtonElement).style.color = '#374151'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLButtonElement).style.color = '#6B7280'; }}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitLeave}
                    disabled={submitting || !leaveDate}
                    style={{
                      height: 42, padding: '0 24px',
                      background: submitting || !leaveDate ? '#FED7AA' : 'linear-gradient(135deg, #F97316, #EA580C)',
                      border: 'none', borderRadius: 10,
                      color: '#fff', fontSize: 13.5, fontWeight: 700,
                      cursor: submitting || !leaveDate ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                      boxShadow: submitting || !leaveDate ? 'none' : '0 2px 8px rgba(249,115,22,0.35)',
                      transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 7,
                    }}
                  >
                    {submitting ? (
                      <>
                        <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'barberSpin .7s linear infinite' }} />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 14, height: 14 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                        Submit Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Time Off History card ── */}
          <div style={{
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}>
            {/* Card header */}
            <div style={{
              padding: '20px 28px 16px',
              borderBottom: '1px solid #F3F4F6',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: '#F0F9FF', border: '1px solid #BAE6FD',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#0369A1" style={{ width: 20, height: 20 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Your Time Off History</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#9CA3AF' }}>All submitted leave requests and their status</p>
                </div>
              </div>
              {leaveRequests.length > 0 && (
                <span style={{
                  background: '#F3F4F6', color: '#6B7280',
                  fontSize: 11.5, fontWeight: 700, padding: '4px 12px',
                  borderRadius: 20,
                }}>
                  {leaveRequests.length} request{leaveRequests.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Card body */}
            <div style={{ padding: '8px 0' }}>
              {loadingLeave && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 28px', gap: 10, color: '#9CA3AF' }}>
                  <div style={{ width: 18, height: 18, border: '2px solid #E5E7EB', borderTopColor: '#F97316', borderRadius: '50%', animation: 'barberSpin .7s linear infinite' }} />
                  <span style={{ fontSize: 13.5 }}>Loading requests…</span>
                </div>
              )}

              {leaveError && (
                <div style={{ margin: '12px 28px', padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, color: '#B91C1C', fontSize: 13.5 }}>
                  {leaveError}
                </div>
              )}

              {!loadingLeave && leaveRequests.length === 0 && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '48px 28px', gap: 12,
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: '#F9FAFB', border: '1px solid #E5E7EB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#D1D5DB" style={{ width: 28, height: 28 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#374151' }}>No time off requests yet</p>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9CA3AF' }}>
                      Use the form above to submit your first leave request
                    </p>
                  </div>
                </div>
              )}

              {leaveRequests.map((lr, idx) => {
                const statusStyle: Record<string, { bg: string; color: string; border: string }> = {
                  PENDING:  { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
                  APPROVED: { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
                  DECLINED: { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
                };
                const ss = statusStyle[lr.status] ?? { bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' };

                return (
                  <div
                    key={lr.leaveRequestId}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 28px',
                      borderBottom: idx < leaveRequests.length - 1 ? '1px solid #F9FAFB' : 'none',
                      gap: 16, transition: 'background .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                      {/* Date badge */}
                      <div style={{
                        background: '#FFF7ED', border: '1px solid #FED7AA',
                        borderRadius: 10, padding: '8px 14px', flexShrink: 0, textAlign: 'center',
                      }}>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#C2410C', lineHeight: 1 }}>
                          {lr.requestedDate ? new Date(lr.requestedDate + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric' }) : '—'}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 10, fontWeight: 700, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {lr.requestedDate ? new Date(lr.requestedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }) : ''}
                        </p>
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>
                          {lr.requestedDate ? new Date(lr.requestedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : lr.requestedDate}
                        </p>
                        {lr.reason ? (
                          <p style={{ margin: '3px 0 0', fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {lr.reason}
                          </p>
                        ) : (
                          <p style={{ margin: '3px 0 0', fontSize: 13, color: '#D1D5DB', fontStyle: 'italic' }}>No reason provided</p>
                        )}
                        <p style={{ margin: '3px 0 0', fontSize: 11.5, color: '#9CA3AF' }}>
                          Submitted {lr.createdAt ? new Date(lr.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                        </p>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span style={{
                      background: ss.bg, color: ss.color,
                      border: `1px solid ${ss.border}`,
                      fontSize: 11.5, fontWeight: 700,
                      padding: '5px 14px', borderRadius: 20,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {lr.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ── Appointments Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800">Your Appointments</h3>
            <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full font-semibold">
              {appointments.filter(a => a.status !== 'CANCELLED').length} active
            </span>
          </div>
          
          {loadingAppointments && <p className="text-slate-500 text-sm">Loading appointments...</p>}
          
          {!loadingAppointments && appointments.length === 0 && (
            <p className="text-slate-500 text-center py-6">No appointments found.</p>
          )}

          <div className="flex flex-col gap-3">
            {appointments.map(app => {
              const d = new Date(app.appointmentDateTime);
              const isToday = d.toDateString() === new Date().toDateString();
              const customerName = app.customerFullName || customerNames[app.customer_id] || 'Customer';
              const styleName    = app.serviceName || styleNames[app.haircut_style_id] || 'Haircut Service';

              const statusColors: Record<string, string> = {
                COMPLETED:   'bg-emerald-100 text-emerald-700',
                CONFIRMED:   'bg-blue-100 text-blue-700',
                PENDING:     'bg-amber-100 text-amber-700',
                CANCELLED:   'bg-red-100 text-red-600',
                NO_SHOW:     'bg-gray-100 text-gray-600',
                IN_PROGRESS: 'bg-purple-100 text-purple-700',
              };

              return (
                <div key={app.appointment_id} className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left: info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm">{customerName}</span>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${statusColors[app.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {app.status}
                        </span>
                        {isToday && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">Today</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {styleName} · ₱{app.totalPrice} · {app.paymentMethod === 'DIGITAL_WALLET' ? 'E-Cash' : app.paymentMethod ?? 'Cash'}
                      </p>
                    </div>

                    {/* Right: action buttons */}
                    <div className="flex flex-wrap gap-2 flex-shrink-0">
                      {app.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleAppointmentAction(app.appointment_id, 'CONFIRMED')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
                          >
                            ✔ Accept
                          </button>
                          <button
                            onClick={() => handleAppointmentAction(app.appointment_id, 'CANCELLED')}
                            className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                          >
                            ✕ Decline
                          </button>
                        </>
                      )}
                      {app.status === 'CONFIRMED' && (
                        <>
                          <button
                            onClick={() => handleAppointmentAction(app.appointment_id, 'COMPLETED')}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
                          >
                            ✅ Complete
                          </button>
                          <button
                            onClick={() => handleAppointmentAction(app.appointment_id, 'NO_SHOW')}
                            className="bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                          >
                            No-Show
                          </button>
                          <button
                            onClick={() => handleAppointmentAction(app.appointment_id, 'CANCELLED')}
                            className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
