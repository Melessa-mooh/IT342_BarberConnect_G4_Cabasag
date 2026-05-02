import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { leaveService, type LeaveRequest } from '../../../services/barberFeatureService';

const STATUS_COLORS: Record<string, string> = {
  PENDING:  'bg-amber-100 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  DECLINED: 'bg-red-100 text-red-600 border-red-200',
};

const SchedulePanel: React.FC = () => {
  const { user } = useAuth();
  const barberProfileId = user?.barberProfile?.id?.toString() ?? '';

  const [activeTab, setActiveTab] = useState('calendar');
  const days  = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const dates = Array.from({ length: 30 }, (_, i) => i + 1);

  const getDayClass = (day: number) => {
    if (day === 1) return 'bg-[#1a1a1a] text-white shadow-md';
    if (day === 6) return 'bg-[#fef08a] text-slate-800';
    return 'text-slate-600 hover:bg-slate-100';
  };

  // ─── Leave Request State ───────────────────────────────────────────────────
  const [leaveRequests, setLeaveRequests]   = useState<LeaveRequest[]>([]);
  const [loadingLeave, setLoadingLeave]     = useState(false);
  const [leaveError, setLeaveError]         = useState<string | null>(null);
  const [showLeaveForm, setShowLeaveForm]   = useState(false);
  const [leaveDate, setLeaveDate]           = useState('');
  const [leaveReason, setLeaveReason]       = useState('');
  const [submitting, setSubmitting]         = useState(false);

  useEffect(() => {
    if (barberProfileId && activeTab === 'leave') {
      fetchLeaveRequests();
    }
  }, [activeTab, barberProfileId]);

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

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-10">

      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Schedule Management</h2>
        <p className="text-slate-500 font-medium mt-1">Manage your availability and appointments</p>
      </div>

      {/* Pill Navigation */}
      <div className="flex items-center bg-slate-100/50 p-1.5 rounded-full w-max border border-slate-200/60 shadow-sm flex-wrap gap-1">
        {[
          { id: 'calendar',     label: 'Calendar View' },
          { id: 'appointments', label: 'Booked Appointments' },
          { id: 'leave',        label: '🏖 Leave Requests' },
          { id: 'settings',     label: 'Settings' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Calendar Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Calendar Picker */}
          <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col h-full">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Select Date</h3>
            <div className="border border-slate-100 rounded-2xl p-6 shadow-sm mb-8 flex-1">
              <div className="flex justify-between items-center mb-6">
                <button className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50">‹</button>
                <h4 className="font-bold text-sm text-slate-800 tracking-wide">May 2026</h4>
                <button className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50">›</button>
              </div>
              <div className="grid grid-cols-7 mb-4">
                {days.map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-slate-400">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center text-sm font-bold">
                <div className="text-slate-300">29</div>
                <div className="text-slate-300">30</div>
                <div className="text-slate-300">31</div>
                {dates.map(day => (
                  <div key={day} className="flex justify-center items-center">
                    <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${getDayClass(day)}`}>
                      {day}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3 mt-auto">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-slate-600 tracking-wide">FREE slots</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                <span className="text-xs font-semibold text-slate-600 tracking-wide">BOOKED slots</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-[#fef08a]" />
                <span className="text-xs font-semibold text-slate-600 tracking-wide">LEAVE days</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Time Slots */}
          <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-8 pb-3 border-b border-slate-50">Time Slots - May 01, 2026</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'].map(t => (
                <div key={t} className="border border-emerald-400 rounded-xl p-5 flex justify-between items-start transition-shadow hover:shadow-md cursor-pointer bg-emerald-50/10">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">🕒</span>
                    <span className="font-extrabold text-slate-800 tracking-tight">{t}</span>
                  </div>
                  <span className="bg-slate-900 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">FREE</span>
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
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition flex items-center gap-2"
            >
              🏖 Request Leave
            </button>
          </div>

          {/* Leave form */}
          {showLeaveForm && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4 max-w-xl">
              <h3 className="font-bold text-slate-800">New Leave Request</h3>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</label>
                <input
                  type="date"
                  value={leaveDate}
                  onChange={e => setLeaveDate(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reason (optional)</label>
                <textarea
                  value={leaveReason}
                  onChange={e => setLeaveReason(e.target.value)}
                  placeholder="e.g. Family event, medical appointment…"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:border-slate-400"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowLeaveForm(false)} className="px-4 py-2 text-sm text-slate-500 rounded-xl hover:bg-slate-50 border border-slate-200">
                  Cancel
                </button>
                <button
                  onClick={handleSubmitLeave}
                  disabled={submitting}
                  className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-50 transition"
                >
                  {submitting ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </div>
          )}

          {/* Leave History */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h3 className="text-sm font-bold text-slate-800 mb-6 border-b border-slate-50 pb-2">Leave Request History</h3>

            {loadingLeave && <p className="text-slate-400 text-sm">Loading…</p>}
            {leaveError  && <p className="text-red-500 text-sm">{leaveError}</p>}

            {!loadingLeave && leaveRequests.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-6">No leave requests yet.</p>
            )}

            <div className="flex flex-col gap-4">
              {leaveRequests.map(lr => (
                <div key={lr.leaveRequestId} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-slate-800 text-sm">📅 {lr.requestedDate}</span>
                    {lr.reason && <span className="text-xs text-slate-500">{lr.reason}</span>}
                    <span className="text-xs text-slate-400">
                      Submitted: {lr.createdAt ? new Date(lr.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${STATUS_COLORS[lr.status] ?? ''}`}>
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
          <p className="text-slate-400 text-sm text-center py-6">Appointment list coming soon.</p>
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
